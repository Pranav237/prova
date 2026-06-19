import { endSession as endSessionApi } from '@/lib/api';

export type FinalizationResult = Awaited<ReturnType<typeof endSessionApi>>;

/**
 * Module-level dedupe so the conversation screen and the ending screen can
 * both kick off `endSession` without ever firing it twice for the same
 * (user, session) pair. The first caller starts the network round-trip; later
 * callers receive the same in-flight promise. When the promise settles, the
 * cache is cleared so a retry is possible.
 */
const inflight = new Map<string, Promise<FinalizationResult>>();

export function finalizeSession(userId: string, sessionId: string) {
  const key = `${userId}:${sessionId}`;
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = endSessionApi({ sessionId });
  inflight.set(key, promise);

  void promise.finally(() => {
    if (inflight.get(key) === promise) {
      inflight.delete(key);
    }
  });

  return promise;
}

/** True when a finalization for (uid, sid) is currently in flight. */
export function isFinalizing(userId: string, sessionId: string) {
  return inflight.has(`${userId}:${sessionId}`);
}
