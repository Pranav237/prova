import * as functions from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generatePDFContent } from './generatePDF';
import { generateCardData } from './generateCard';

export const endSession = functions.onCall(
  { timeoutSeconds: 300, memory: '1GiB', secrets: ['ANTHROPIC_API_KEY'] },
  async (request) => {
    const { userId, sessionId } = request.data as {
      userId: string;
      sessionId: string;
    };

    if (!userId || !sessionId) {
      throw new functions.HttpsError(
        'invalid-argument',
        'userId and sessionId are required'
      );
    }

    const db = admin.firestore();

    const sessionDoc = await db
      .doc(`users/${userId}/sessions/${sessionId}`)
      .get();

    if (!sessionDoc.exists) {
      throw new functions.HttpsError('not-found', 'Session not found');
    }

    try {
      const pdfOutput = await generatePDFContent(userId, sessionId);

      const cardData = await generateCardData(userId, sessionId, pdfOutput as unknown as Record<string, unknown>);

      await db.doc(`users/${userId}/sessions/${sessionId}`).update({
        status: 'complete',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        pdfOutput,
        cardTitle: cardData.title,
        cardArtRef: cardData.artRef,
        cardMetallicColor: cardData.metallicColor,
      });

      await db.doc(`users/${userId}`).update({
        sessionCount: admin.firestore.FieldValue.increment(1),
      });

      const userDoc = await db.doc(`users/${userId}`).get();
      const userData = userDoc.data();
      if (userData && !userData.hasCompletedOnboarding) {
        await db.doc(`users/${userId}`).update({
          hasCompletedOnboarding: true,
        });
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

      await db.doc(`users/${userId}/sessions/${sessionId}`).update({
        status: 'incomplete',
      });

      throw new functions.HttpsError('internal', 'Failed to generate session output');
    }
  }
);
