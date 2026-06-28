import Anthropic from '@anthropic-ai/sdk';
import { PDF_OUTPUT_PROMPT } from './prompts/output';
import { buildTranscript } from './transcript';

interface PDFOutput {
  whatYouSaid: string;
  howYouReasoned: string;
  whereYouGotStuck: string;
  whatYouMightNotBeSeeing: string;
  recommendedReadings: Array<{
    title: string;
    author: string;
    reason: string;
  }>;
}

export async function generatePDFContent(
  userId: string,
  sessionId: string
): Promise<PDFOutput> {
  const anthropic = new Anthropic({
    apiKey: (process.env.ANTHROPIC_API_KEY || '').trim(),
  });

  const transcript = await buildTranscript(userId, sessionId);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: PDF_OUTPUT_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Here is the full conversation transcript:\n\n${transcript}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude for PDF generation');
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in PDF generation response');
  }

  return JSON.parse(jsonMatch[0]) as PDFOutput;
}
