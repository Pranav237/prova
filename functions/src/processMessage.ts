import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';
import { buildConversationPrompt } from './prompts/conversation';
import {
  defineEndpoint,
  HttpError,
  requireString,
  optionalString,
  optionalBoolean,
} from './http';

const MIN_EXCHANGES = parseInt(process.env.MIN_EXCHANGES || '12', 10);
/** Bumped from 1000 so wrap-up messages never get sliced mid-word. */
const MAX_OUTPUT_TOKENS = 2500;
/** Safety-net cap on how many prior turns we replay to the model. */
const MAX_HISTORY_MESSAGES = parseInt(
  process.env.MAX_HISTORY_MESSAGES || '50',
  10
);

export const processMessage = defineEndpoint(
  async ({ uid, body }) => {
    const sessionId = requireString(body, 'sessionId');
    const userMessage = optionalString(body, 'userMessage');
    const isSessionStart = optionalBoolean(body, 'isSessionStart');
    const isResume = optionalBoolean(body, 'isResume');
    // Stable per-turn key (the user message's Firestore id, or '__start__' for
    // the opening). Lets us return a cached reply on retry instead of calling
    // the model again — see idempotency check below.
    const turnId = optionalString(body, 'turnId');

    if (!isSessionStart && !isResume && (!userMessage || userMessage.length === 0)) {
      throw new HttpError(
        400,
        'invalid-argument',
        'userMessage is required unless isSessionStart or isResume is true.'
      );
    }

    const anthropic = new Anthropic({
      apiKey: (process.env.ANTHROPIC_API_KEY || '').trim(),
    });

    const db = admin.firestore();
    const sessionRef = db.doc(`users/${uid}/sessions/${sessionId}`);

    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      throw new HttpError(404, 'not-found', 'Session not found.');
    }

    const sessionData = sessionDoc.data()!;

    // Idempotency: if this exact turn was already processed (e.g. the client
    // timed out and retried, or a send failed and the dangling turn resumed),
    // return the cached reply. This prevents duplicate model calls / double
    // exchangeCount increments on the same user turn.
    if (
      turnId &&
      sessionData.lastProcessedTurnId === turnId &&
      typeof sessionData.lastTurnResponse === 'string'
    ) {
      return {
        response: sessionData.lastTurnResponse,
        meta: sessionData.lastTurnMeta,
      };
    }

    const messagesSnap = await db
      .collection(`users/${uid}/sessions/${sessionId}/messages`)
      .orderBy('createdAt', 'asc')
      .get();

    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> =
      messagesSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          role: data.role === 'prova' ? ('assistant' as const) : ('user' as const),
          content: typeof data.content === 'string' ? data.content : '',
        };
      });

    // Safety-net cap for pathologically long sessions. The full history starts
    // with Prova's opening (assistant) and strictly alternates, so we trim from
    // the front at an assistant boundary to keep the structure (assistant →
    // ... → user) intact while dropping the oldest middle turns.
    if (conversationHistory.length > MAX_HISTORY_MESSAGES) {
      let start = conversationHistory.length - MAX_HISTORY_MESSAGES;
      if (conversationHistory[start]?.role !== 'assistant') start += 1;
      conversationHistory = conversationHistory.slice(start);
    }

    if (isSessionStart) {
      conversationHistory.push({ role: 'user', content: '[begin]' });
    } else {
      // Normal sends and resumes both rely on the user's turn already being
      // persisted in Firestore (the client writes it before calling). We must
      // NOT append `userMessage` again — doing so duplicated the user's turn in
      // every model call. The latest message must therefore be from the user.
      if (
        conversationHistory.length === 0 ||
        conversationHistory[conversationHistory.length - 1].role !== 'user'
      ) {
        throw new HttpError(
          409,
          'failed-precondition',
          'Nothing to process: the latest message is not from the user.'
        );
      }
    }

    let previousPDFContent: string | undefined;
    if (sessionData.intent === 'revisiting' && sessionData.revisitingSessionId) {
      const prevSession = await db
        .doc(`users/${uid}/sessions/${sessionData.revisitingSessionId}`)
        .get();
      if (prevSession.exists) {
        const prevData = prevSession.data();
        if (prevData?.pdfOutput) {
          previousPDFContent = JSON.stringify(prevData.pdfOutput);
        }
      }
    }

    let pastSessionSummaries: string | undefined;
    const recentSessions = await db
      .collection(`users/${uid}/sessions`)
      .where('status', '==', 'complete')
      .orderBy('completedAt', 'desc')
      .limit(2)
      .get();

    if (!recentSessions.empty) {
      const summaries = recentSessions.docs
        .filter((d) => d.id !== sessionId)
        .map((d) => {
          const data = d.data();
          if (data.pdfOutput) {
            return `Session "${data.cardTitle || 'Untitled'}": Key themes: ${data.pdfOutput.whatYouSaid?.substring(0, 200)}...`;
          }
          return null;
        })
        .filter(Boolean);

      if (summaries.length > 0) {
        pastSessionSummaries = summaries.join('\n\n');
      }
    }

    const onboardingAnswers = sessionData.onboardingAnswers as
      | Array<{ question: string; answer: string; reaction: string }>
      | undefined;

    const systemPrompt = buildConversationPrompt({
      intent: sessionData.intent,
      directedPrompt: sessionData.directedPrompt,
      previousPDFContent,
      pastSessionSummaries,
      exchangeCount: sessionData.exchangeCount || 0,
      minExchanges: MIN_EXCHANGES,
      isSessionStart,
      onboardingAnswers,
    });

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: MAX_OUTPUT_TOKENS,
        system: systemPrompt,
        messages: conversationHistory,
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text response');
      }

      let responseText = textBlock.text;
      const isClosingMessage = responseText.includes('[SESSION_COMPLETE]');
      responseText = responseText.replace('[SESSION_COMPLETE]', '').trim();

      const currentExchangeCount = (sessionData.exchangeCount || 0) + 1;

      let sessionQuality: 'building' | 'peaking' | 'winding_down' | 'complete' = 'building';
      if (isClosingMessage) {
        sessionQuality = 'complete';
      } else if (currentExchangeCount > MIN_EXCHANGES * 0.8) {
        sessionQuality = 'peaking';
      } else if (currentExchangeCount > MIN_EXCHANGES * 0.5) {
        sessionQuality = 'building';
      }

      const meta = {
        isClosingMessage,
        sessionQuality,
        exchangeNumber: currentExchangeCount,
      };

      await sessionRef.update({
        exchangeCount: currentExchangeCount,
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        // Cache this turn's result so a retry of the same turnId is a no-op.
        lastProcessedTurnId: turnId ?? null,
        lastTurnResponse: responseText,
        lastTurnMeta: meta,
      });

      return { response: responseText, meta };
    } catch (error) {
      console.error('Error processing message:', error);
      throw new HttpError(500, 'internal', 'Failed to process message.');
    }
  },
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 120 }
);
