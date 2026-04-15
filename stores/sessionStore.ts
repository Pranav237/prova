import { create } from 'zustand';
import type { Message, SessionIntent, SessionStatus, MessageMeta, OnboardingPrompt } from '@/lib/types';

interface SessionState {
  sessionId: string | null;
  intent: SessionIntent | null;
  status: SessionStatus | null;
  messages: Message[];
  exchangeCount: number;
  isProvaTyping: boolean;
  streamingText: string;
  isClosing: boolean;
  onboardingPrompts: OnboardingPrompt[];

  setSessionId: (id: string | null) => void;
  setIntent: (intent: SessionIntent | null) => void;
  setStatus: (status: SessionStatus | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setExchangeCount: (count: number) => void;
  setIsProvaTyping: (typing: boolean) => void;
  setStreamingText: (text: string) => void;
  setIsClosing: (closing: boolean) => void;
  setOnboardingPrompts: (prompts: OnboardingPrompt[]) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  intent: null,
  status: null,
  messages: [],
  exchangeCount: 0,
  isProvaTyping: false,
  streamingText: '',
  isClosing: false,
  onboardingPrompts: [],
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  setSessionId: (id) => set({ sessionId: id }),
  setIntent: (intent) => set({ intent }),
  setStatus: (status) => set({ status }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setExchangeCount: (count) => set({ exchangeCount: count }),
  setIsProvaTyping: (typing) => set({ isProvaTyping: typing }),
  setStreamingText: (text) => set({ streamingText: text }),
  setIsClosing: (closing) => set({ isClosing: closing }),
  setOnboardingPrompts: (prompts) => set({ onboardingPrompts: prompts }),
  reset: () => set(initialState),
}));
