import Anthropic from '@anthropic-ai/sdk';
import { ONBOARDING_SYSTEM_PROMPT, RETURNING_USER_PROMPT } from './prompts/onboarding';
import { defineEndpoint, HttpError, optionalBoolean } from './http';

export const generateOnboarding = defineEndpoint(
  async ({ body }) => {
    const isFirstSession = optionalBoolean(body, 'isFirstSession');

    const anthropic = new Anthropic({
      apiKey: (process.env.ANTHROPIC_API_KEY || '').trim(),
    });

    const systemPrompt = isFirstSession
      ? ONBOARDING_SYSTEM_PROMPT
      : RETURNING_USER_PROMPT;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: isFirstSession
              ? 'Generate 4 onboarding prompts for a first-time user.'
              : 'Generate 1 opening prompt for a returning user starting an open session.',
          },
        ],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return { prompts: parsed.prompts };
    } catch (error) {
      console.error('Error generating onboarding:', error);
      throw new HttpError(500, 'internal', 'Failed to generate onboarding prompts.');
    }
  },
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }
);
