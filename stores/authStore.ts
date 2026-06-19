import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from '@/lib/auth';
import { getUserProfile } from '@/lib/firestore';
import { useSessionStore } from '@/stores/sessionStore';
import type { User } from '@/lib/types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  profile: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  initialize: () => () => void;
  refreshProfile: () => Promise<void>;
}

/**
 * Wipes every client-side store derived from the current user. Called when
 * the auth subject changes (sign-out OR switch to a different user), so the
 * UI never shows stale data belonging to a previous session.
 */
function resetUserScopedStores() {
  useSessionStore.getState().reset();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  profile: null,
  loading: true,
  error: null,
  initialized: false,

  initialize: () => {
    let previousUid: string | null = null;

    const unsubscribe = onAuthStateChanged(async (user) => {
      const nextUid = user?.uid ?? null;

      // If the auth subject changed (sign-out OR different user signed in),
      // wipe any client-side state tied to the previous user.
      if (previousUid !== null && previousUid !== nextUid) {
        resetUserScopedStores();
      }
      previousUid = nextUid;

      if (!user) {
        set({
          firebaseUser: null,
          profile: null,
          loading: false,
          initialized: true,
          error: null,
        });
        return;
      }

      try {
        const profileData = await getUserProfile(user.uid);
        set({
          firebaseUser: user,
          profile: profileData
            ? ({ uid: user.uid, ...profileData } as User)
            : null,
          loading: false,
          initialized: true,
          error: null,
        });
      } catch (e) {
        // Profile fetch failure shouldn't block the user from using the app.
        // They'll just see a null profile until they refresh.
        set({
          firebaseUser: user,
          profile: null,
          loading: false,
          initialized: true,
          error: e instanceof Error ? e.message : 'Failed to load profile',
        });
      }
    });
    return unsubscribe;
  },

  refreshProfile: async () => {
    const { firebaseUser } = get();
    if (!firebaseUser) return;
    try {
      const profileData = await getUserProfile(firebaseUser.uid);
      if (profileData) {
        set({ profile: { uid: firebaseUser.uid, ...profileData } as User });
      }
    } catch (e) {
      // Soft-fail; surface error but keep prior profile so UI doesn't go blank.
      set({ error: e instanceof Error ? e.message : 'Failed to refresh profile' });
    }
  },
}));
