import { create } from 'zustand';
import type { Session } from '@/lib/types';
import { getCompletedSessions } from '@/lib/firestore';

interface CardsState {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  fetchCards: (userId: string) => Promise<void>;
  setCards: (sessions: Session[]) => void;
}

export const useCardsStore = create<CardsState>((set) => ({
  sessions: [],
  loading: false,
  error: null,

  fetchCards: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const sessions = await getCompletedSessions(userId);
      set({ sessions, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to load cards',
        loading: false,
      });
    }
  },

  setCards: (sessions) => set({ sessions }),
}));
