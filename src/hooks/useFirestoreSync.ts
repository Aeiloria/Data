import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { WellnessLog, CustomPin } from './useIndexedDB';

export function useFirestoreSync(
  user: User | null,
  onRemoteLogReceived?: (log: WellnessLog) => void,
  onRemotePinReceived?: (pin: CustomPin) => void
) {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  // Sync remote wellness logs when authenticated
  useEffect(() => {
    if (!user) return;

    const logsPath = `users/${user.uid}/wellness_logs`;
    const logsCol = collection(db, 'users', user.uid, 'wellness_logs');

    const unsubscribe = onSnapshot(
      logsCol,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' && onRemoteLogReceived) {
            const data = change.doc.data() as WellnessLog;
            onRemoteLogReceived(data);
          }
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, logsPath);
      }
    );

    return () => unsubscribe();
  }, [user, onRemoteLogReceived]);

  // Sync remote custom pins when authenticated
  useEffect(() => {
    if (!user) return;

    const pinsPath = `users/${user.uid}/custom_pins`;
    const pinsCol = collection(db, 'users', user.uid, 'custom_pins');

    const unsubscribe = onSnapshot(
      pinsCol,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' && onRemotePinReceived) {
            const data = change.doc.data() as CustomPin;
            onRemotePinReceived(data);
          }
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pinsPath);
      }
    );

    return () => unsubscribe();
  }, [user, onRemotePinReceived]);

  // Pushes a local log to Firestore cloud
  const pushLogToCloud = async (log: WellnessLog) => {
    if (!user) return;
    setIsSyncing(true);
    const path = `users/${user.uid}/wellness_logs/${log.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'wellness_logs', log.id), {
        ...log,
        userId: user.uid
      });
      console.log('☁️ [FIRESTORE] Log synced to cloud:', log.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
      }, 1400);
    }
  };

  // Pushes a custom pin to Firestore cloud
  const pushPinToCloud = async (pin: CustomPin) => {
    if (!user) return;
    setIsSyncing(true);
    const path = `users/${user.uid}/custom_pins/${pin.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'custom_pins', pin.id), {
        ...pin,
        userId: user.uid
      });
      console.log('☁️ [FIRESTORE] Pin synced to cloud:', pin.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
      }, 1000);
    }
  };

  // Deletes a pin from Firestore cloud
  const deletePinFromCloud = async (pinId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/custom_pins/${pinId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'custom_pins', pinId));
      console.log('☁️ [FIRESTORE] Pin removed from cloud:', pinId);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return {
    isSyncing,
    pushLogToCloud,
    pushPinToCloud,
    deletePinFromCloud
  };
}
