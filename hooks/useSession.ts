import { useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { getActiveSession } from '@/lib/firestore';
import { config } from '@/constants/config';

export const useSession = () => {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const sessionId = useSessionStore((s) => s.sessionId);
  const setSessionId = useSessionStore((s) => s.setSessionId);
  const setIntent = useSessionStore((s) => s.setIntent);
  const setStatus = useSessionStore((s) => s.setStatus);
  const reset = useSessionStore((s) => s.reset);

  const checkForActiveSession = useCallback(async () => {
    if (!firebaseUser) return null;

    const active = await getActiveSession(firebaseUser.uid);
    if (!active) return null;

    const lastMessage = active.lastMessageAt?.toDate();
    if (lastMessage) {
      const hoursSince = (Date.now() - lastMessage.getTime()) / (1000 * 60 * 60);
      if (hoursSince > config.sessionTimeoutHours) {
        return null;
      }
    }

    setSessionId(active.id);
    setIntent(active.intent);
    setStatus(active.status);
    return active;
  }, [firebaseUser, setSessionId, setIntent, setStatus]);

  const endCurrentSession = useCallback(() => {
    reset();
    router.replace('/(app)/(cards)');
  }, [reset, router]);

  return {
    sessionId,
    checkForActiveSession,
    endCurrentSession,
  };
};
