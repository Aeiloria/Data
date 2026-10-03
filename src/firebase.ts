import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with the exact Database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async (): Promise<User | undefined> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // The signed-in user info
    const user = result.user;
    console.log("Logged in as:", user.displayName);
    return user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
  }
};

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log("User signed out.");
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  type User
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection to Firestore
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('✅ [FIREBASE] Successfully established server connection to Firestore');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('⚠️ [FIREBASE] Client is offline or Firestore network unreachable');
      return false;
    }
    // Expected if 'test/connection' doc doesn't exist yet but network is online
    return true;
  }
}

// Call testConnection upon module evaluation
testConnection().catch(() => {});
