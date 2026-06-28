import * as admin from 'firebase-admin';
import { generatePDFContent } from './generatePDF';
import { generateCardData } from './generateCard';
import { defineEndpoint, HttpError, requireString } from './http';

/**
 * A finalize lock older than this is considered stale (a crashed attempt) and
 * may be re-acquired. Kept above the function's 300s timeout (plus margin) so
 * we never steal the lock from an attempt that is merely slow but still alive.
 */
const STALE_LOCK_MS = 6 * 60 * 1000;

/** Best-effort signed read URL for a stored art file. Returns '' on failure. */
async function signedArtUrl(ref?: string): Promise<string> {
  if (!ref) return '';
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(ref);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    return url;
  } catch {
    return '';
  }
}

export const endSession = defineEndpoint(
  async ({ uid, body }) => {
    const sessionId = requireString(body, 'sessionId');

    const db = admin.firestore();
    const sessionRef = db.doc(`users/${uid}/sessions/${sessionId}`);

    // Acquire a finalize lock (or short-circuit) atomically. Without this, two
    // concurrent calls (two devices/tabs, or a retry overlapping the original)
    // could both run the expensive PDF + card AI pipeline and double-increment
    // the session count.
    const gate = await db.runTransaction(async (tx) => {
      const snap = await tx.get(sessionRef);
      if (!snap.exists) {
        return { kind: 'missing' as const };
      }
      const data = snap.data() ?? {};

      // Already finished — nothing to regenerate.
      if (data.status === 'complete' && data.cardTitle) {
        return { kind: 'complete' as const, data };
      }

      // Don't finalize a session that never had a conversation.
      if (!(typeof data.exchangeCount === 'number' && data.exchangeCount >= 1)) {
        return { kind: 'empty' as const };
      }

      // Another finalize is in progress and hasn't gone stale.
      if (
        data.finalizing === true &&
        typeof data.finalizingAt === 'number' &&
        Date.now() - data.finalizingAt < STALE_LOCK_MS
      ) {
        return { kind: 'locked' as const };
      }

      tx.update(sessionRef, { finalizing: true, finalizingAt: Date.now() });
      return { kind: 'acquired' as const, data };
    });

    if (gate.kind === 'missing') {
      throw new HttpError(404, 'not-found', 'Session not found.');
    }

    if (gate.kind === 'empty') {
      throw new HttpError(
        400,
        'failed-precondition',
        'This session has no conversation to finish yet.'
      );
    }

    if (gate.kind === 'locked') {
      throw new HttpError(
        409,
        'already-finalizing',
        'This session is already being finished. Please wait a moment.'
      );
    }

    if (gate.kind === 'complete') {
      const existing = gate.data;
      return {
        cardTitle: existing.cardTitle,
        cardArtUrl: await signedArtUrl(existing.cardArtRef),
        cardMetallicColor: existing.cardMetallicColor || '#A882FF',
        pdfUrl: '',
      };
    }

    // gate.kind === 'acquired' — we hold the lock.
    const existing = gate.data;

    try {
      // Reuse a PDF persisted by a prior (failed) attempt so a later card
      // failure never forces us to re-run the expensive PDF generation.
      let pdfOutput = existing.pdfOutput as
        | Record<string, unknown>
        | undefined;
      if (!pdfOutput) {
        pdfOutput = (await generatePDFContent(uid, sessionId)) as unknown as Record<
          string,
          unknown
        >;
        // Persist immediately, before the card step can fail.
        await sessionRef.update({ pdfOutput });
      }

      const cardData = await generateCardData(uid, sessionId, pdfOutput);

      await sessionRef.update({
        status: 'complete',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        pdfOutput,
        cardTitle: cardData.title,
        cardArtRef: cardData.artRef,
        cardMetallicColor: cardData.metallicColor,
        finalizing: false,
      });

      // We only reach this point on the transition to 'complete' (the early
      // 'complete' gate returns above), so the count increments exactly once.
      await db.doc(`users/${uid}`).update({
        sessionCount: admin.firestore.FieldValue.increment(1),
      });

      const userDoc = await db.doc(`users/${uid}`).get();
      const userData = userDoc.data();
      if (userData && !userData.hasCompletedOnboarding) {
        await db.doc(`users/${uid}`).update({ hasCompletedOnboarding: true });
      }

      return {
        cardTitle: cardData.title,
        cardArtUrl: await signedArtUrl(cardData.artRef),
        cardMetallicColor: cardData.metallicColor,
        pdfUrl: '',
      };
    } catch (error) {
      console.error('Error ending session:', error);
      // Release the lock so the client can retry; any pdfOutput we persisted
      // stays so the retry skips PDF regeneration.
      try {
        await sessionRef.update({ finalizing: false });
      } catch {
        // ignore — lock will go stale and free itself after STALE_LOCK_MS
      }
      throw new HttpError(
        500,
        'internal',
        'Failed to generate session output. Please try again.'
      );
    }
  },
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 300, memory: '1GiB' }
);
