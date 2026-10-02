/**
 * Spatial Mathematics & Planetary Environmental Vector Calculator
 * Haversine formula calculates exact geodesic distance in meters between two lat/lon points on WGS84 ellipsoid.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export interface ShieldLifecycleState {
  id: string;
  initialDurationMs: number; // 48 hours in milliseconds (172,800,000 ms)
  timeRemainingMs: number;
  lastUpdatedAt: number;
  isExpired: boolean;
}

/**
 * Calculates active decay multiplier based on NOAA Space Weather telemetry:
 * Base decay: 1.0x.
 * - Planetary Kp > 4.0: (Kp - 4.0) * 0.5
 * - Solar Wind > 500 km/s: (Speed - 500) * 0.002
 * - Solar Flare / Radio Blackout (R-scale 0-5): R * 0.4
 */
export const calculateActiveDecayMultiplier = (
  kpIndex: number,
  solarWindSpeed: number,
  radioBlackoutScale: number
): number => {
  const kpImpact = kpIndex > 4.0 ? (kpIndex - 4.0) * 0.5 : 0;
  const windImpact = solarWindSpeed > 500 ? (solarWindSpeed - 500) * 0.002 : 0;
  const flareImpact = radioBlackoutScale * 0.4;
  const finalMultiplier = 1.0 + kpImpact + windImpact + flareImpact;
  return parseFloat(finalMultiplier.toFixed(2));
};

/**
 * Updates the remaining lifecycle time of a node's shield by applying the scalar decay multiplier
 * across the elapsed interval since the last update tick.
 */
export const updateShieldLifecycle = (
  currentState: ShieldLifecycleState,
  decayMultiplier: number,
  currentTimeMs: number
): ShieldLifecycleState => {
  if (currentState.isExpired || currentState.timeRemainingMs <= 0) {
    return { ...currentState, timeRemainingMs: 0, isExpired: true };
  }

  const elapsedRealTimeMs = currentTimeMs - currentState.lastUpdatedAt;
  const scaledDecayLossMs = elapsedRealTimeMs * decayMultiplier;
  const newTimeRemainingMs = Math.max(0, currentState.timeRemainingMs - scaledDecayLossMs);

  return {
    ...currentState,
    timeRemainingMs: newTimeRemainingMs,
    lastUpdatedAt: currentTimeMs,
    isExpired: newTimeRemainingMs <= 0
  };
};
