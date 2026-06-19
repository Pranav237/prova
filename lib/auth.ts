import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });

  await setDoc(doc(db, 'users', credential.user.uid), {
    displayName,
    email,
    createdAt: serverTimestamp(),
    hasCompletedOnboarding: false,
    sessionCount: 0,
  });

  return credential;
};

export const signInWithGoogle = async (idToken: string) => {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);

  const userDoc = await getDoc(doc(db, 'users', result.user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', result.user.uid), {
      displayName: result.user.displayName || '',
      email: result.user.email || '',
      createdAt: serverTimestamp(),
      hasCompletedOnboarding: false,
      sessionCount: 0,
    });
  }

  return result;
};

export const signInWithApple = async (identityToken: string, nonce: string) => {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken: identityToken, rawNonce: nonce });
  const result = await signInWithCredential(auth, credential);

  const userDoc = await getDoc(doc(db, 'users', result.user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', result.user.uid), {
      displayName: result.user.displayName || '',
      email: result.user.email || '',
      createdAt: serverTimestamp(),
      hasCompletedOnboarding: false,
      sessionCount: 0,
    });
  }

  return result;
};

/**
 * Signs the user out of Firebase Auth. Auth-state listeners in stores
 * are responsible for clearing their derived state when the user becomes
 * null, so we don't manually reset them here.
 */
export const signOut = () => firebaseSignOut(auth);

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

export const onAuthStateChanged = (callback: (user: FirebaseUser | null) => void) =>
  firebaseOnAuthStateChanged(auth, callback);
