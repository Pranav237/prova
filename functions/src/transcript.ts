import * as admin from 'firebase-admin';

/**
 * Hard cap on transcript size handed to the model for PDF / card generation.
 * Sessions are designed to wrap up well before this; it's a cost / overflow
 * safety net for pathologically long conversations.
 */
const MAX_TRANSCRIPT_CHARS = parseInt(
  process.env.MAX_TRANSCRIPT_CHARS || '24000',
  10
);

/**
 * Builds a "Speaker: content" transcript for a session. If it exceeds the cap,
 * keeps the opening (~30%) and the most recent portion (~70%) with an explicit
 * omission marker so the conversation's arc is preserved.
 */
export async function buildTranscript(
  userId: string,
  sessionId: string
): Promise<string> {
  const db = admin.firestore();

  const messagesSnap = await db
    .collection(`users/${userId}/sessions/${sessionId}/messages`)
    .orderBy('createdAt', 'asc')
    .get();

  const full = messagesSnap.docs
    .map((doc) => {
      const data = doc.data();
      const speaker = data.role === 'prova' ? 'Prova' : 'User';
      const content = typeof data.content === 'string' ? data.content : '';
      return `${speaker}: ${content}`;
    })
    .join('\n\n');

  if (full.length <= MAX_TRANSCRIPT_CHARS) {
    return full;
  }

  const headLen = Math.floor(MAX_TRANSCRIPT_CHARS * 0.3);
  const tailLen = MAX_TRANSCRIPT_CHARS - headLen;
  const head = full.slice(0, headLen);
  const tail = full.slice(full.length - tailLen);
  return `${head}\n\n[...middle of the conversation omitted for length...]\n\n${tail}`;
}
