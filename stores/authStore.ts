import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from '@/lib/auth';
import { getUserProfile } from '@/lib/firestore';
import type { User } from '@/lib/types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  profile: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initialize: () => () => void;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  profile: null,
  loading: true,
  error: null,
  initialized: false,

  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  initialize: () => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const profileData = await getUserProfile(user.uid);
          set({
            firebaseUser: user,
            profile: profileData
              ? ({ uid: user.uid, ...profileData } as User)
              : null,
            loading: false,
            initialized: true,
          });
        } catch {
          set({
            firebaseUser: user,
            profile: null,
            loading: false,
            initialized: true,
          });
        }
      } else {
        set({
          firebaseUser: null,
          profile: null,
          loading: false,
          initialized: true,
        });
      }
    });
    return unsubscribe;
  },

  refreshProfile: async () => {
    const { firebaseUser } = get();
    if (!firebaseUser) return;
    const profileData = await getUserProfile(firebaseUser.uid);
    if (profileData) {
      set({ profile: { uid: firebaseUser.uid, ...profileData } as User });
    }
  },
}));
