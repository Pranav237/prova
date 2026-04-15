import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import type { OnboardingPrompt, MessageMeta } from './types';

export const generateOnboarding = httpsCallable<
  { userId: string; isFirstSession: boolean },
  { prompts: OnboardingPrompt[] }
>(functions, 'generateOnboarding');

export const processMessage = httpsCallable<
  { userId: string; sessionId: string; userMessage?: string; isSessionStart?: boolean },
  { response: string; meta: MessageMeta }
>(functions, 'processMessage');

export const endSession = httpsCallable<
  { userId: string; sessionId: string },
  {
    cardTitle: string;
    cardArtUrl: string;
    cardMetallicColor: string;
    pdfUrl: string;
  }
>(functions, 'endSession');
