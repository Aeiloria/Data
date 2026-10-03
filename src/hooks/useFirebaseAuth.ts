import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // User is signed in
        console.log("User UID:", firebaseUser.uid);
        console.log("Display Name:", firebaseUser.displayName);

        // Sync user profile document into Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              userId: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Grid Guardian Operator',
              email: firebaseUser.email || '',
              accessTier: 'OPERATOR_LEVEL_12',
              createdAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.warn('User profile sync caught:', err);
        }
      } else {
        // User is signed out
        console.log("No user signed in.");
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("Logged in as:", user.displayName);
      return user;
    } catch (err: any) {
      console.error("Error signing in with Google:", err);
      setAuthError(err.message || 'Authentication failed');
      return null;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out.");
      setUser(null);
    } catch (err: any) {
      console.error("Error signing out:", err);
    }
  };

  return {
    user,
    loading,
    authError,
    loginWithGoogle,
    signInWithGooglePopup: loginWithGoogle,
    logout
  };
}
