import { useState, useEffect, useCallback } from 'react';
import { encryptPayload, decryptPayload } from '../utils/cryptoEngine';
import initialLandmarks from '../data/mockLandmarks.json';

export interface WellnessLog {
  id: string;
  timestamp: string;
  type: string; // 'YOGA_STRETCH' | 'MEDITATION' | 'ANUHAZI_CHANT' | 'DIETARY_RECORD'
  heartRateBefore: number;
  heartRateAfter: number;
  hrvBefore?: number;
  hrvAfter?: number;
  encrypted?: boolean;
  rawCiphertext?: string;
  notes?: string;
}

export interface CustomPin {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  pinnedAt: string;
  category?: 'SHIELD_BEACON' | 'MONITOR_POINT' | 'ENERGY_WELL' | 'HAZARD_ZONE';
}

export interface RegionalLandmark {
  landmark_id: string;
  title: string;
  objective_type: string;
  latitude: number;
  longitude: number;
  required_proximity_meters: number;
  lore_text_block: string;
  is_completed?: boolean;
  synchronized_at?: string;
}

const DB_NAME = 'GridGuardianLocalDB';
const DB_VERSION = 1;

export const useIndexedDB = () => {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [wellnessLogs, setWellnessLogs] = useState<WellnessLog[]>([]);
  const [customPins, setCustomPins] = useState<CustomPin[]>([]);
  const [landmarks, setLandmarks] = useState<RegionalLandmark[]>([]);
  const [isDbReady, setIsDbReady] = useState(false);

  // Initialize DB schemas
  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains('wellness_logs')) {
        database.createObjectStore('wellness_logs', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('custom_pins')) {
        database.createObjectStore('custom_pins', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('regional_landmarks')) {
        database.createObjectStore('regional_landmarks', { keyPath: 'landmark_id' });
      }
    };

    request.onsuccess = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      setDb(database);
      refreshData(database);
      setIsDbReady(true);
    };

    request.onerror = (e) => {
      console.error('IndexedDB structural engine failed to initialize:', e);
    };
  }, []);

  const refreshData = useCallback((database: IDBDatabase) => {
    try {
      const tx = database.transaction(['wellness_logs', 'custom_pins', 'regional_landmarks'], 'readonly');
      const logsStore = tx.objectStore('wellness_logs');
      const pinsStore = tx.objectStore('custom_pins');
      const landmarksStore = tx.objectStore('regional_landmarks');

      const logsReq = logsStore.getAll();
      const pinsReq = pinsStore.getAll();
      const landReq = landmarksStore.getAll();

      logsReq.onsuccess = () => {
        const storedLogs = (logsReq.result as WellnessLog[]) || [];
        setWellnessLogs(storedLogs);
      };

      pinsReq.onsuccess = () => {
        const storedPins = (pinsReq.result as CustomPin[]) || [];
        setCustomPins(storedPins);
      };

      landReq.onsuccess = () => {
        let storedLands = (landReq.result as RegionalLandmark[]) || [];
        // Seed default landmarks if store is empty
        if (storedLands.length === 0 && initialLandmarks.landmarks?.length > 0) {
          const seedTx = database.transaction(['regional_landmarks'], 'readwrite');
          const seedStore = seedTx.objectStore('regional_landmarks');
          initialLandmarks.landmarks.forEach((item) => {
            seedStore.put(item);
          });
          seedTx.oncomplete = () => {
            setLandmarks(initialLandmarks.landmarks as RegionalLandmark[]);
          };
        } else {
          setLandmarks(storedLands);
        }
      };
    } catch (err) {
      console.error('Error refreshing IndexedDB data:', err);
    }
  }, []);

  // Save a completed wellness routine entry (optionally encrypting with passphrase)
  const saveWellnessLog = useCallback(async (log: WellnessLog, secretPassphrase?: string) => {
    if (!db) return;
    try {
      let finalLog = { ...log };
      if (secretPassphrase && secretPassphrase.trim().length >= 4) {
        const payloadString = JSON.stringify({
          type: log.type,
          heartRateBefore: log.heartRateBefore,
          heartRateAfter: log.heartRateAfter,
          hrvBefore: log.hrvBefore,
          hrvAfter: log.hrvAfter,
          notes: log.notes,
          timestamp: log.timestamp
        });
        const ciphertext = await encryptPayload(payloadString, secretPassphrase.trim());
        finalLog.encrypted = true;
        finalLog.rawCiphertext = ciphertext;
      }

      const tx = db.transaction(['wellness_logs'], 'readwrite');
      const store = tx.objectStore('wellness_logs');
      store.put(finalLog);
      tx.oncomplete = () => refreshData(db);
    } catch (err) {
      console.error('Failed to save wellness log:', err);
    }
  }, [db, refreshData]);

  // Save a dropped custom pin
  const saveCustomPin = useCallback((pin: CustomPin) => {
    if (!db) return;
    try {
      const tx = db.transaction(['custom_pins'], 'readwrite');
      const store = tx.objectStore('custom_pins');
      store.put(pin);
      tx.oncomplete = () => refreshData(db);
    } catch (err) {
      console.error('Failed to save custom pin:', err);
    }
  }, [db, refreshData]);

  // Delete a pin
  const deleteCustomPin = useCallback((pinId: string) => {
    if (!db) return;
    try {
      const tx = db.transaction(['custom_pins'], 'readwrite');
      const store = tx.objectStore('custom_pins');
      store.delete(pinId);
      tx.oncomplete = () => refreshData(db);
    } catch (err) {
      console.error('Failed to delete custom pin:', err);
    }
  }, [db, refreshData]);

  // Clear all wellness logs
  const clearWellnessLogs = useCallback(() => {
    if (!db) return;
    try {
      const tx = db.transaction(['wellness_logs'], 'readwrite');
      const store = tx.objectStore('wellness_logs');
      store.clear();
      tx.oncomplete = () => refreshData(db);
    } catch (err) {
      console.error('Failed to clear wellness logs:', err);
    }
  }, [db, refreshData]);

  // Clear all custom pins
  const clearCustomPins = useCallback(() => {
    if (!db) return;
    try {
      const tx = db.transaction(['custom_pins'], 'readwrite');
      const store = tx.objectStore('custom_pins');
      store.clear();
      tx.oncomplete = () => refreshData(db);
    } catch (err) {
      console.error('Failed to clear custom pins:', err);
    }
  }, [db, refreshData]);

  // Clear entire database (all stores)
  const clearEntireDatabase = useCallback(() => {
    if (!db) return;
    try {
      const tx = db.transaction(['wellness_logs', 'custom_pins'], 'readwrite');
      tx.objectStore('wellness_logs').clear();
      tx.objectStore('custom_pins').clear();
      tx.oncomplete = () => refreshData(db);
    } catch (err) {
      console.error('Failed to clear entire IndexedDB:', err);
    }
  }, [db, refreshData]);

  // Transform a custom pin to an active regional landmark
  const transformCustomPinToActiveLandmark = useCallback(
    (pinId: string, customTitle?: string, objectiveType: string = 'ENERGY_STABILIZATION') => {
      if (!db) return;
      try {
        const tx = db.transaction(['custom_pins', 'regional_landmarks'], 'readwrite');
        const pinsStore = tx.objectStore('custom_pins');
        const landmarksStore = tx.objectStore('regional_landmarks');

        const getReq = pinsStore.get(pinId);
        getReq.onsuccess = () => {
          const pin = getReq.result as CustomPin;
          if (!pin) return;

          const newLandmark: RegionalLandmark = {
            landmark_id: `poi-transformed-${pin.id}`,
            title: customTitle || `Transformed Signet: ${pin.label}`,
            objective_type: objectiveType,
            latitude: pin.latitude,
            longitude: pin.longitude,
            required_proximity_meters: 100,
            lore_text_block: `Community-generated grid checkpoint derived from local pin "${pin.label}". Aligns regional vector currents.`,
            is_completed: false,
            synchronized_at: new Date().toISOString()
          };

          landmarksStore.put(newLandmark);
          pinsStore.delete(pinId);
        };

        tx.oncomplete = () => {
          console.log(`🎉 IndexedDB upgraded successfully: Pin ${pinId} transformed to landmark`);
          refreshData(db);
        };
      } catch (err) {
        console.error('Failed to transform pin to landmark:', err);
      }
    },
    [db, refreshData]
  );

  // Complete a landmark objective
  const completeLandmark = useCallback(
    (landmarkId: string) => {
      if (!db) return;
      try {
        const tx = db.transaction(['regional_landmarks'], 'readwrite');
        const store = tx.objectStore('regional_landmarks');
        const req = store.get(landmarkId);
        req.onsuccess = () => {
          const item = req.result as RegionalLandmark;
          if (item) {
            item.is_completed = true;
            item.synchronized_at = new Date().toISOString();
            store.put(item);
          }
        };
        tx.oncomplete = () => refreshData(db);
      } catch (err) {
        console.error('Failed to complete landmark:', err);
      }
    },
    [db, refreshData]
  );

  return {
    isDbReady,
    wellnessLogs,
    customPins,
    landmarks,
    saveWellnessLog,
    saveCustomPin,
    deleteCustomPin,
    clearWellnessLogs,
    clearCustomPins,
    clearEntireDatabase,
    transformCustomPinToActiveLandmark,
    completeLandmark,
    reloadLocalStateArrays: () => db && refreshData(db)
  };
};
