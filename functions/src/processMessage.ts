import * as functions from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';
import { buildConversationPrompt } from './prompts/conversation';

const MIN_EXCHANGES = parseInt(process.env.MIN_EXCHANGES || '12', 10);

export const processMessage = functions.onCall(
  { timeoutSeconds: 120, secrets: ['ANTHROPIC_API_KEY'] },
  async (request) => {
    const { userId, sessionId, userMessage, isSessionStart } = request.data as {
      userId: string;
      sessionId: string;
      userMessage?: string;
      isSessionStart?: boolean;
    };

    if (!userId || !sessionId) {
      throw new functions.HttpsError(
        'invalid-argument',
        'userId and sessionId are required'
      );
    }

    if (!isSessionStart && !userMessage) {
      throw new functions.HttpsError(
        'invalid-argument',
        'userMessage is required unless isSessionStart is true'
      );
    }

    const anthropic = new Anthropic({
      apiKey: (process.env.ANTHROPIC_API_KEY || '').trim(),
    });

    const db = admin.firestore();

    const sessionDoc = await db
      .doc(`users/${userId}/sessions/${sessionId}`)
      .get();

    if (!sessionDoc.exists) {
      throw new functions.HttpsError('not-found', 'Session not found');
    }

    const sessionData = sessionDoc.data()!;

    const messagesSnap = await db
      .collection(`users/${userId}/sessions/${sessionId}/messages`)
      .orderBy('createdAt', 'asc')
      .get();

    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> =
      messagesSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          role: data.role === 'prova' ? ('assistant' as const) : ('user' as const),
          content: data.content,
        };
      });

    if (isSessionStart) {
      conversationHistory.push({ role: 'user', content: '[begin]' });
    } else {
      conversationHistory.push({ role: 'user', content: userMessage! });
    }

    let previousPDFContent: string | undefined;
    if (sessionData.intent === 'revisiting' && sessionData.revisitingSessionId) {
      const prevSession = await db
        .doc(`users/${userId}/sessions/${sessionData.revisitingSessionId}`)
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
      .collection(`users/${userId}/sessions`)
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
      Array<{ question: string; answer: string; reaction: string }> | undefined;

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
        max_tokens: 1000,
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

      await db.doc(`users/${userId}/sessions/${sessionId}`).update({
        exchangeCount: currentExchangeCount,
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { response: responseText, meta };
    } catch (error) {
      console.error('Error processing message:', error);
      throw new functions.HttpsError('internal', 'Failed to process message');
    }
  }
);
