import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from '@/lib/auth';
import { getUserProfile } from '@/lib/firestore';
import { useSessionStore } from '@/stores/sessionStore';
import type { User } from '@/lib/types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  profile: User | null;
  /** Whether the profile fetch for the current user has resolved (success or
   *  empty). Distinguishes "no profile doc" from "profile not loaded yet". */
  profileLoaded: boolean;
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
  profileLoaded: false,
  loading: true,
  error: null,
  initialized: false,

  initialize: () => {
    let previousUid: string | null = null;
    // Bumped on every auth-state change so a slow profile fetch from a
    // previous user can't clobber the current user's state when it resolves.
    let generation = 0;

    const unsubscribe = onAuthStateChanged((user) => {
      const nextUid = user?.uid ?? null;
      const subjectChanged = previousUid !== nextUid;

      // If the auth subject changed (sign-out OR different user signed in),
      // wipe any client-side state tied to the previous user.
      if (previousUid !== null && subjectChanged) {
        resetUserScopedStores();
      }
      previousUid = nextUid;
      const myGeneration = ++generation;

      if (!user) {
        set({
          firebaseUser: null,
          profile: null,
          profileLoaded: true,
          loading: false,
          initialized: true,
          error: null,
        });
        return;
      }

      // Set the user synchronously so routing can proceed immediately. The
      // profile loads in the background; gating must not wait on it.
      set({
        firebaseUser: user,
        // Only drop a prior profile when the actual user changed, to avoid a
        // null-profile flash on same-user re-emits.
        ...(subjectChanged ? { profile: null } : {}),
        profileLoaded: false,
        loading: false,
        initialized: true,
        error: null,
      });

      void (async () => {
        try {
          const profileData = await getUserProfile(user.uid);
          if (generation !== myGeneration) return; // superseded by a newer auth change
          set({
            profile: profileData
              ? ({ uid: user.uid, ...profileData } as User)
              : null,
            profileLoaded: true,
            error: null,
          });
        } catch (e) {
          if (generation !== myGeneration) return;
          // Profile fetch failure shouldn't block the user from using the app.
          set({
            profileLoaded: true,
            error: e instanceof Error ? e.message : 'Failed to load profile',
          });
        }
      })();
    });
    return unsubscribe;
  },

  refreshProfile: async () => {
    const { firebaseUser } = get();
    if (!firebaseUser) return;
    try {
      const profileData = await getUserProfile(firebaseUser.uid);
      set({
        profile: profileData
          ? ({ uid: firebaseUser.uid, ...profileData } as User)
          : null,
        profileLoaded: true,
      });
    } catch (e) {
      // Soft-fail; surface error but keep prior profile so UI doesn't go blank.
      set({ error: e instanceof Error ? e.message : 'Failed to refresh profile' });
    }
  },
}));
