
'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

export function initializeFirebase() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  return { app, auth, firestore };
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';

export { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile };

export async function logout(auth: Auth) {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
}
