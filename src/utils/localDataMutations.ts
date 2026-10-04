import type { CustomPin, RegionalLandmark, WellnessLog } from '../hooks/useIndexedDB';
import { encryptPayload } from './cryptoEngine';

export async function prepareWellnessLogForStorage(
  log: WellnessLog,
  secretPassphrase?: string
): Promise<WellnessLog> {
  const storedLog = { ...log };
  const passphrase = secretPassphrase?.trim();

  if (passphrase && passphrase.length >= 4) {
    const payload = JSON.stringify({
      type: log.type,
      heartRateBefore: log.heartRateBefore,
      heartRateAfter: log.heartRateAfter,
      hrvBefore: log.hrvBefore,
      hrvAfter: log.hrvAfter,
      notes: log.notes,
      timestamp: log.timestamp
    });
    storedLog.encrypted = true;
    storedLog.rawCiphertext = await encryptPayload(payload, passphrase);
  }

  return storedLog;
}

export function createLandmarkFromPin(
  pin: CustomPin,
  customTitle?: string,
  objectiveType = 'ENERGY_STABILIZATION',
  synchronizedAt = new Date().toISOString()
): RegionalLandmark {
  return {
    landmark_id: `poi-transformed-${pin.id}`,
    title: customTitle || `Transformed Signet: ${pin.label}`,
    objective_type: objectiveType,
    latitude: pin.latitude,
    longitude: pin.longitude,
    required_proximity_meters: 100,
    lore_text_block: `Community-generated grid checkpoint derived from local pin "${pin.label}". Aligns regional vector currents.`,
    is_completed: false,
    synchronized_at: synchronizedAt
  };
}

export function markLandmarkComplete(
  landmark: RegionalLandmark,
  synchronizedAt = new Date().toISOString()
): RegionalLandmark {
  return {
    ...landmark,
    is_completed: true,
    synchronized_at: synchronizedAt
  };
}
