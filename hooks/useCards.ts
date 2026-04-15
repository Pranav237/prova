import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCardsStore } from '@/stores/cardsStore';

export const useCards = () => {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const { sessions, loading, error, fetchCards } = useCardsStore();

  useEffect(() => {
    if (firebaseUser) {
      fetchCards(firebaseUser.uid);
    }
  }, [firebaseUser, fetchCards]);

  const refresh = useCallback(() => {
    if (firebaseUser) {
      fetchCards(firebaseUser.uid);
    }
  }, [firebaseUser, fetchCards]);

  return { cards: sessions, loading, error, refresh };
};
