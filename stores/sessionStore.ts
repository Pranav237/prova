import { create } from 'zustand';
import type { SessionIntent, OnboardingPrompt } from '@/lib/types';

/**
 * Global, persistent-across-screens session state. Anything tied to a single
 * screen's lifecycle (e.g. local typing indicators, scroll position, etc.)
 * lives in the screen itself, not here.
 */
interface SessionState {
  sessionId: string | null;
  intent: SessionIntent | null;
  onboardingPrompts: OnboardingPrompt[];

  setSessionId: (id: string | null) => void;
  setIntent: (intent: SessionIntent | null) => void;
  setOnboardingPrompts: (prompts: OnboardingPrompt[]) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  intent: null as SessionIntent | null,
  onboardingPrompts: [] as OnboardingPrompt[],
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,
  setSessionId: (id) => set({ sessionId: id }),
  setIntent: (intent) => set({ intent }),
  setOnboardingPrompts: (prompts) => set({ onboardingPrompts: prompts }),
  reset: () => set(initialState),
}));
