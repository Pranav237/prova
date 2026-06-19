import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * `getReactNativePersistence` exists at runtime in firebase/auth on React
 * Native, but is intentionally absent from the public TypeScript types so the
 * web bundle stays clean. We pull it via require so it's resolved at runtime
 * only when we actually need RN persistence.
 */
function getAuthPersistence(): Persistence {
  if (Platform.OS === 'web') {
    return browserLocalPersistence;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const firebaseAuth = require('firebase/auth') as {
    getReactNativePersistence: (storage: unknown) => Persistence;
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return firebaseAuth.getReactNativePersistence(AsyncStorage);
}

/**
 * initializeAuth must only run once per app. During HMR / hot reload Metro
 * may re-evaluate this module, so we recover by falling back to getAuth.
 */
function getOrCreateAuth(): Auth {
  try {
    return initializeAuth(app, { persistence: getAuthPersistence() });
  } catch (e: unknown) {
    if (
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as { code: string }).code === 'auth/already-initialized'
    ) {
      return getAuth(app);
    }
    throw e;
  }
}

export const auth = getOrCreateAuth();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

export default app;
