import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  calculateActiveDecayMultiplier,
  calculateDistance,
  updateShieldLifecycle,
  type ShieldLifecycleState
} from '../src/hooks/useEMFCalculator';
import {
  createLandmarkFromPin,
  markLandmarkComplete,
  prepareWellnessLogForStorage
} from '../src/utils/localDataMutations';
import type { CustomPin, RegionalLandmark, WellnessLog } from '../src/hooks/useIndexedDB';
import { decryptPayload } from '../src/utils/cryptoEngine';

test('calculates geodesic distance for identical and known coordinate pairs', () => {
  assert.equal(calculateDistance(0, 0, 0, 0), 0);
  assert.equal(calculateDistance(0, 0, 0, 1), 111195);
  assert.equal(calculateDistance(0, 179.5, 0, -179.5), 111195);
  assert.equal(calculateDistance(90, 0, 90, 180), 0);
});

test('calculates decay multiplier at thresholds and combines independent impacts', () => {
  assert.equal(calculateActiveDecayMultiplier(4, 500, 0), 1);
  assert.equal(calculateActiveDecayMultiplier(6, 600, 2), 3);
  assert.equal(calculateActiveDecayMultiplier(4.1, 500, 0), 1.05);
});

const lifecycle = (overrides: Partial<ShieldLifecycleState> = {}): ShieldLifecycleState => ({
  id: 'shield-1',
  initialDurationMs: 172_800_000,
  timeRemainingMs: 10_000,
  lastUpdatedAt: 1_000,
  isExpired: false,
  ...overrides
});

test('applies elapsed decay and updates lifecycle timestamp without mutating input', () => {
  const current = lifecycle();
  const next = updateShieldLifecycle(current, 1.5, 3_000);

  assert.deepEqual(next, { ...current, timeRemainingMs: 7_000, lastUpdatedAt: 3_000 });
  assert.equal(current.timeRemainingMs, 10_000);
  assert.equal(current.lastUpdatedAt, 1_000);
});

test('expires a shield at zero and keeps an already-expired shield stable', () => {
  const current = lifecycle({ timeRemainingMs: 2_000 });
  assert.deepEqual(updateShieldLifecycle(current, 1, 3_000), {
    ...current,
    timeRemainingMs: 0,
    lastUpdatedAt: 3_000,
    isExpired: true
  });

  const expired = lifecycle({ timeRemainingMs: 0, isExpired: true });
  assert.deepEqual(updateShieldLifecycle(expired, 2, 5_000), {
    ...expired,
    timeRemainingMs: 0
  });
});

test('prepares wellness log mutations with optional passphrase encryption', async () => {
  const log: WellnessLog = {
    id: 'log-1',
    timestamp: '2026-10-03T00:00:00.000Z',
    type: 'MEDITATION',
    heartRateBefore: 92,
    heartRateAfter: 70,
    hrvBefore: 35,
    hrvAfter: 48,
    notes: 'Felt calmer'
  };
  const unencrypted = await prepareWellnessLogForStorage(log, '  abc ');
  assert.deepEqual(unencrypted, log);

  const encrypted = await prepareWellnessLogForStorage(log, '  secure passphrase  ');
  assert.equal(encrypted.encrypted, true);
  assert.ok(encrypted.rawCiphertext);
  assert.equal(log.encrypted, undefined);
  assert.equal(
    await decryptPayload(encrypted.rawCiphertext!, 'secure passphrase'),
    JSON.stringify({
      type: log.type,
      heartRateBefore: log.heartRateBefore,
      heartRateAfter: log.heartRateAfter,
      hrvBefore: log.hrvBefore,
      hrvAfter: log.hrvAfter,
      notes: log.notes,
      timestamp: log.timestamp
    })
  );
});

const pin: CustomPin = {
  id: 'pin-4',
  label: 'North station',
  latitude: 31.435,
  longitude: -97.73,
  pinnedAt: '2026-10-01T00:00:00.000Z',
  category: 'MONITOR_POINT'
};

test('transforms a pin into a fresh landmark with default or provided metadata', () => {
  assert.deepEqual(createLandmarkFromPin(pin, undefined, undefined, 'fixed-time'), {
    landmark_id: 'poi-transformed-pin-4',
    title: 'Transformed Signet: North station',
    objective_type: 'ENERGY_STABILIZATION',
    latitude: 31.435,
    longitude: -97.73,
    required_proximity_meters: 100,
    lore_text_block: 'Community-generated grid checkpoint derived from local pin "North station". Aligns regional vector currents.',
    is_completed: false,
    synchronized_at: 'fixed-time'
  });
  assert.equal(
    createLandmarkFromPin(pin, 'Custom checkpoint', 'HAZARD_SCAN', 'fixed-time').title,
    'Custom checkpoint'
  );
});

test('completes landmarks immutably while refreshing synchronization time', () => {
  const landmark: RegionalLandmark = {
    landmark_id: 'lm-1',
    title: 'Checkpoint',
    objective_type: 'SCAN',
    latitude: 0,
    longitude: 0,
    required_proximity_meters: 100,
    lore_text_block: 'Local landmark',
    is_completed: false,
    synchronized_at: 'old-time'
  };

  assert.deepEqual(markLandmarkComplete(landmark, 'new-time'), {
    ...landmark,
    is_completed: true,
    synchronized_at: 'new-time'
  });
  assert.equal(landmark.is_completed, false);
  assert.equal(landmark.synchronized_at, 'old-time');
});
