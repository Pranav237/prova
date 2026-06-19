import * as admin from 'firebase-admin';
import { generatePDFContent } from './generatePDF';
import { generateCardData } from './generateCard';
import { defineEndpoint, HttpError, requireString } from './http';

export const endSession = defineEndpoint(
  async ({ uid, body }) => {
    const sessionId = requireString(body, 'sessionId');

    const db = admin.firestore();

    const sessionDoc = await db.doc(`users/${uid}/sessions/${sessionId}`).get();

    if (!sessionDoc.exists) {
      throw new HttpError(404, 'not-found', 'Session not found.');
    }

    const existing = sessionDoc.data() ?? {};

    // If the session is already complete, return the existing card data so the
    // client can navigate to reveal without re-running expensive AI calls.
    if (existing.status === 'complete' && existing.cardTitle) {
      let cardArtUrl = '';
      if (existing.cardArtRef) {
        try {
          const bucket = admin.storage().bucket();
          const file = bucket.file(existing.cardArtRef);
          const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
          });
          cardArtUrl = url;
        } catch {
          // ignore; client can still render with metallicColor
        }
      }
      return {
        cardTitle: existing.cardTitle,
        cardArtUrl,
        cardMetallicColor: existing.cardMetallicColor || '#A882FF',
        pdfUrl: '',
      };
    }

    try {
      const pdfOutput = await generatePDFContent(uid, sessionId);

      const cardData = await generateCardData(
        uid,
        sessionId,
        pdfOutput as unknown as Record<string, unknown>
      );

      await db.doc(`users/${uid}/sessions/${sessionId}`).update({
        status: 'complete',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        pdfOutput,
        cardTitle: cardData.title,
        cardArtRef: cardData.artRef,
        cardMetallicColor: cardData.metallicColor,
      });

      await db.doc(`users/${uid}`).update({
        sessionCount: admin.firestore.FieldValue.increment(1),
      });

      const userDoc = await db.doc(`users/${uid}`).get();
      const userData = userDoc.data();
      if (userData && !userData.hasCompletedOnboarding) {
        await db.doc(`users/${uid}`).update({ hasCompletedOnboarding: true });
      }

      let cardArtUrl = '';
      try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(cardData.artRef);
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });
        cardArtUrl = url;
      } catch {
        console.warn('Could not generate signed URL for card art');
      }

      return {
        cardTitle: cardData.title,
        cardArtUrl,
        cardMetallicColor: cardData.metallicColor,
        pdfUrl: '',
      };
    } catch (error) {
      console.error('Error ending session:', error);
      // Do NOT flip status to 'incomplete' here so the client can safely retry.
      throw new HttpError(
        500,
        'internal',
        'Failed to generate session output. Please try again.'
      );
    }
  },
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 300, memory: '1GiB' }
);
