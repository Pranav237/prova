import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';
import { CARD_GENERATION_PROMPT } from './prompts/output';
import { buildTranscript } from './transcript';

interface CardResult {
  title: string;
  artId: string;
  artRef: string;
  metallicColor: string;
}

export async function generateCardData(
  userId: string,
  sessionId: string,
  pdfOutput: Record<string, unknown>
): Promise<CardResult> {
  const anthropic = new Anthropic({
    apiKey: (process.env.ANTHROPIC_API_KEY || '').trim(),
  });

  const db = admin.firestore();

  const transcript = await buildTranscript(userId, sessionId);

  const artLibrarySnap = await db.collection('artLibrary').get();
  const artLibrary = artLibrarySnap.docs.map((doc) => ({
    id: doc.id,
    tags: doc.data().tags || [],
    mood: doc.data().mood || '',
    dominantColor: doc.data().dominantColor || '#A882FF',
  }));

  let artLibraryJson = JSON.stringify(artLibrary, null, 2);

  if (artLibrary.length === 0) {
    artLibraryJson = JSON.stringify([
      { id: 'default-nature', tags: ['nature', 'serene', 'contemplative'], mood: 'peaceful', dominantColor: '#4A90A4' },
      { id: 'default-space', tags: ['space', 'vast', 'mysterious'], mood: 'expansive', dominantColor: '#2C3E6B' },
      { id: 'default-abstract', tags: ['abstract', 'warm', 'dynamic'], mood: 'energetic', dominantColor: '#C4785A' },
    ]);
  }

  const prompt = CARD_GENERATION_PROMPT(artLibraryJson);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: prompt,
    messages: [
      {
        role: 'user',
        content: `CONVERSATION:\n${transcript}\n\nANALYSIS:\n${JSON.stringify(pdfOutput)}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude for card generation');
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in card generation response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const selectedArt = artLibrary.find((a) => a.id === parsed.artId) || artLibrary[0];
  const artDoc = artLibrarySnap.docs.find((d) => d.id === (selectedArt?.id || ''));
  const artRef = artDoc?.data()?.storageRef || `art-library/${selectedArt?.id || 'default'}.jpg`;

  return {
    title: parsed.title,
    artId: parsed.artId,
    artRef,
    metallicColor: selectedArt?.dominantColor || '#A882FF',
  };
}
