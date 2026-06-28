import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Session, Message, SessionIntent } from './types';

export const createSession = async (
  userId: string,
  intent: SessionIntent,
  options?: { revisitingSessionId?: string; directedPrompt?: string }
) => {
  const sessionRef = await addDoc(
    collection(db, 'users', userId, 'sessions'),
    {
      userId,
      intent,
      status: 'active',
      revisitingSessionId: options?.revisitingSessionId || null,
      directedPrompt: options?.directedPrompt || null,
      exchangeCount: 0,
      startedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
    }
  );
  return sessionRef.id;
};

export const getSession = async (userId: string, sessionId: string) => {
  const snap = await getDoc(doc(db, 'users', userId, 'sessions', sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Session;
};

export const getCompletedSessions = async (userId: string) => {
  const q = query(
    collection(db, 'users', userId, 'sessions'),
    where('status', '==', 'complete'),
    orderBy('completedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Session);
};

export const getActiveSession = async (userId: string) => {
  const q = query(
    collection(db, 'users', userId, 'sessions'),
    where('status', '==', 'active'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Session;
};

export const subscribeToSession = (
  userId: string,
  sessionId: string,
  callback: (session: Session | null) => void
) => {
  return onSnapshot(
    doc(db, 'users', userId, 'sessions', sessionId),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...snap.data() } as Session);
    },
    (error) => {
      // A listener error (permissions, network) otherwise fails silently and
      // freezes the screen waiting for an update that never comes.
      console.error('subscribeToSession listener error:', error);
    }
  );
};


export const addMessage = async (
  userId: string,
  sessionId: string,
  message: Pick<Message, 'role' | 'content'> & { meta?: Message['meta'] }
) => {
  const ref = await addDoc(
    collection(db, 'users', userId, 'sessions', sessionId, 'messages'),
    {
      ...message,
      sessionId,
      createdAt: serverTimestamp(),
    }
  );
  // NOTE: exchangeCount is owned by the server-side processMessage function.
  // Do NOT increment it here, or it will be double-counted (server +1, client +1).
  await updateDoc(doc(db, 'users', userId, 'sessions', sessionId), {
    lastMessageAt: serverTimestamp(),
  });
  return ref.id;
};

export const subscribeToMessages = (
  userId: string,
  sessionId: string,
  callback: (messages: Message[]) => void
) => {
  const q = query(
    collection(db, 'users', userId, 'sessions', sessionId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message);
      callback(messages);
    },
    (error) => {
      console.error('subscribeToMessages listener error:', error);
    }
  );
};

export const updateSession = async (
  userId: string,
  sessionId: string,
  data: Partial<Session>
) => {
  await updateDoc(doc(db, 'users', userId, 'sessions', sessionId), data);
};

export const deleteSession = async (userId: string, sessionId: string) => {
  await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
};

export const getUserProfile = async (userId: string) => {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data() : null;
};

export const updateUserProfile = async (
  userId: string,
  data: Record<string, unknown>
) => {
  await updateDoc(doc(db, 'users', userId), data);
};

export const incrementSessionCount = async (userId: string) => {
  await updateDoc(doc(db, 'users', userId), {
    sessionCount: increment(1),
  });
};

export const deleteAllSessions = async (userId: string) => {
  const q = query(collection(db, 'users', userId, 'sessions'));
  const snap = await getDocs(q);
  const deletes = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletes);
};
