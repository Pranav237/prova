import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { subscribeToMessages } from '@/lib/firestore';

export const useMessages = () => {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const sessionId = useSessionStore((s) => s.sessionId);
  const messages = useSessionStore((s) => s.messages);
  const setMessages = useSessionStore((s) => s.setMessages);

  useEffect(() => {
    if (!firebaseUser || !sessionId) return;

    const unsubscribe = subscribeToMessages(
      firebaseUser.uid,
      sessionId,
      (msgs) => setMessages(msgs)
    );

    return unsubscribe;
  }, [firebaseUser, sessionId, setMessages]);

  return { messages };
};
