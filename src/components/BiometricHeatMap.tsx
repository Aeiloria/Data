import React, { useState, useMemo } from 'react';
import { WellnessLog } from '../hooks/useIndexedDB';

interface BiometricHeatMapProps {
  logs?: WellnessLog[];
  currentHeartRate?: number;
  currentHrv?: number;
}

interface HourlySlotData {
  hour: number;
  label: string;
  heartRate: number;
  hrv: number;
  stabilityScore: number; // 0 - 100
  stabilityTier: 'CRITICAL' | 'ELEVATED' | 'STABLE' | 'OPTIMAL';
  eventCount: number;
  eventNotes?: string;
}

export const BiometricHeatMap: React.FC<BiometricHeatMapProps> = ({
  logs = [],
  currentHeartRate = 72,
  currentHrv = 58,
}) => {
  const [viewMode, setViewMode] = useState<'COMPOSITE' | 'HEART_RATE' | 'HRV'>('COMPOSITE');
  const [selectedHour, setSelectedHour] = useState<HourlySlotData | null>(null);

  const currentHourIndex = new Date().getHours();

  // Compute 24-hour diurnal physiological matrix combining circadian model & user logs
  const hourlyData: HourlySlotData[] = useMemo(() => {
    // Map logs to their respective hours
    const logsByHour: { [hour: number]: WellnessLog[] } = {};
    logs.forEach((log) => {
      try {
        const h = new Date(log.timestamp).getHours();
        if (!logsByHour[h]) logsByHour[h] = [];
        logsByHour[h].push(log);
      } catch (e) {
        // Fallback
      }
    });

    return Array.from({ length: 24 }, (_, h) => {
      const isCurrentHour = h === currentHourIndex;

      // Base circadian rhythm curve:
      // Nocturnal dip (02:00-05:00), morning surge (07:00-11:00), afternoon peak (13:00-16:00), evening wind-down (20:00-23:00)
      const circadianHrFactor =
        h >= 1 && h <= 5
          ? 58 + Math.sin((h / 4) * Math.PI) * 4 // Sleep resting: ~58-62 BPM
          : h >= 6 && h <= 11
          ? 68 + Math.sin(((h - 6) / 5) * Math.PI) * 12 // Morning surge: ~70-80 BPM
          : h >= 12 && h <= 17
          ? 74 + Math.sin(((h - 12) / 5) * Math.PI) * 10 // Afternoon activity: ~74-84 BPM
          : 66 + Math.sin(((h - 18) / 5) * Math.PI) * 6; // Evening recovery: ~66-72 BPM

      const circadianHrvFactor =
        h >= 1 && h <= 5
          ? 68 + Math.cos((h / 4) * Math.PI) * 10 // Higher parasympathetic HRV at night: ~68-78 ms
          : h >= 6 && h <= 16
          ? 44 + Math.sin(((h - 6) / 10) * Math.PI) * 14 // Daytime work stress: ~44-58 ms
          : 54 + Math.sin(((h - 17) / 6) * Math.PI) * 10; // Evening recovery: ~54-64 ms

      let hr = Math.round(circadianHrFactor);
      let hrv = Math.round(circadianHrvFactor);
      let eventCount = 0;
      let notes = '';

      // Override / synthesize with real logged user events if present
      if (logsByHour[h] && logsByHour[h].length > 0) {
        const hourLogs = logsByHour[h];
        eventCount = hourLogs.length;
        const avgLoggedHr = Math.round(hourLogs.reduce((acc, l) => acc + l.heartRateAfter, 0) / hourLogs.length);
        const avgLoggedHrv = Math.round(
          hourLogs.reduce((acc, l) => acc + (l.hrvAfter || 50), 0) / hourLogs.length
        );
        hr = avgLoggedHr;
        hrv = avgLoggedHrv;
        notes = hourLogs.map((l) => l.type).join(', ');
      }

      // If it's the current live hour, blend in the live telemetry
      if (isCurrentHour) {
        hr = Math.round((hr + currentHeartRate) / 2);
        hrv = Math.round((hrv + currentHrv) / 2);
      }

      // Calculate 0-100 composite stability score:
      // High HRV (>55 ms) + Optimal HR (55-75 BPM) = 90-100%
      const hrDev = Math.abs(hr - 65);
      const hrStability = Math.max(0, 100 - hrDev * 2.2);
      const hrvStability = Math.min(100, (hrv / 75) * 100);
      const stabilityScore = Math.round(hrStability * 0.45 + hrvStability * 0.55);

      let stabilityTier: 'CRITICAL' | 'ELEVATED' | 'STABLE' | 'OPTIMAL' = 'OPTIMAL';
      if (stabilityScore < 45) stabilityTier = 'CRITICAL';
      else if (stabilityScore < 65) stabilityTier = 'ELEVATED';
      else if (stabilityScore < 85) stabilityTier = 'STABLE';

      return {
        hour: h,
        label: `${String(h).padStart(2, '0')}:00`,
        heartRate: hr,
        hrv,
        stabilityScore,
        stabilityTier,
        eventCount,
        eventNotes: notes || undefined
      };
    });
  }, [logs, currentHeartRate, currentHrv, currentHourIndex]);

  // Heat map cell color resolver
  const getCellColor = (slot: HourlySlotData): string => {
    if (viewMode === 'COMPOSITE') {
      if (slot.stabilityScore >= 85) return 'rgba(0, 255, 204, 0.85)'; // Optimal Neon Cyan
      if (slot.stabilityScore >= 70) return 'rgba(0, 210, 255, 0.65)'; // Stable Cyan-Blue
      if (slot.stabilityScore >= 50) return 'rgba(255, 170, 0, 0.75)'; // Elevated Warning Amber
      return 'rgba(255, 0, 51, 0.85)'; // Critical Crimson
    }

    if (viewMode === 'HEART_RATE') {
      // Lower resting HR is cooler/green, higher HR is hotter/red
      if (slot.heartRate <= 65) return 'rgba(0, 255, 204, 0.85)';
      if (slot.heartRate <= 75) return 'rgba(0, 210, 255, 0.7)';
      if (slot.heartRate <= 85) return 'rgba(255, 170, 0, 0.75)';
      return 'rgba(255, 0, 51, 0.85)';
    }

    // HRV Mode (Higher is better/greener)
    if (slot.hrv >= 60) return 'rgba(0, 255, 204, 0.85)';
    if (slot.hrv >= 45) return 'rgba(0, 210, 255, 0.7)';
    if (slot.hrv >= 30) return 'rgba(255, 170, 0, 0.75)';
    return 'rgba(255, 0, 51, 0.85)';
  };

  // 24H Summary Aggregates
  const avg24Hr = Math.round(hourlyData.reduce((acc, h) => acc + h.heartRate, 0) / 24);
  const avg24Hrv = Math.round(hourlyData.reduce((acc, h) => acc + h.hrv, 0) / 24);
  const avgStability = Math.round(hourlyData.reduce((acc, h) => acc + h.stabilityScore, 0) / 24);

  return (
    <div style={{ padding: '16px 20px', backgroundColor: '#060a13', borderTop: '1px solid #1a2636', fontFamily: 'monospace' }}>
      {/* Header Deck */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1em' }}>🧬</span>
            <h3 style={{ color: '#00ffcc', margin: 0, fontSize: '0.95em' }}>
              24-HOUR BIOMETRIC STABILITY HEAT MAP
            </h3>
          </div>
          <span style={{ fontSize: '0.68em', color: '#8fa0ba' }}>
            CIRCADIAN HRV COHERENCE & HEART RATE STABILITY VECTOR
          </span>
        </div>

        {/* View Mode Segmented Controls */}
        <div style={{ display: 'flex', gap: '3px' }}>
          {(['COMPOSITE', 'HEART_RATE', 'HRV'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '3px 8px',
                fontSize: '0.68em',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                backgroundColor: viewMode === mode ? '#00ffcc' : '#101726',
                color: viewMode === mode ? '#0a0f1d' : '#8fa0ba',
                border: '1px solid #1a2636',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              {mode === 'COMPOSITE' ? 'COMPOSITE' : mode === 'HEART_RATE' ? 'HR (❤️)' : 'HRV (⚡)'}
            </button>
          ))}
        </div>
      </div>

      {/* 24-Hour Metric Strip Heat Map (24 blocks arranged horizontally in 2 rows of 12 or flexible grid) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '4px',
          backgroundColor: '#0a0f1d',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #1a2636',
          marginBottom: '10px'
        }}
      >
        {hourlyData.map((slot) => {
          const isCurrent = slot.hour === currentHourIndex;
          const isSelected = selectedHour?.hour === slot.hour;
          const bgColor = getCellColor(slot);

          return (
            <div
              key={slot.hour}
              onClick={() => setSelectedHour(isSelected ? null : slot)}
              onMouseEnter={() => setSelectedHour(slot)}
              style={{
                height: '42px',
                backgroundColor: bgColor,
                borderRadius: '3px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
                border: isSelected
                  ? '2px solid #ffffff'
                  : isCurrent
                  ? '2px solid #00ffcc'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isCurrent ? '0 0 8px rgba(0, 255, 204, 0.6)' : isSelected ? '0 0 6px #ffffff' : 'none'
              }}
              title={`${slot.label} - HR: ${slot.heartRate} BPM, HRV: ${slot.hrv} ms, Stability: ${slot.stabilityScore}%`}
            >
              <span style={{ fontSize: '0.62em', color: '#0a0f1d', fontWeight: 'bold', lineHeight: 1 }}>
                {slot.label.split(':')[0]}h
              </span>
              <span style={{ fontSize: '0.65em', color: '#000000', fontWeight: 'bold', marginTop: '2px', lineHeight: 1 }}>
                {viewMode === 'COMPOSITE'
                  ? `${slot.stabilityScore}%`
                  : viewMode === 'HEART_RATE'
                  ? slot.heartRate
                  : `${slot.hrv}m`}
              </span>

              {/* Indicator dot if routine log occurred in this hour */}
              {slot.eventCount > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Hour Telemetry Inspection Card */}
      {selectedHour && (
        <div
          style={{
            backgroundColor: '#0a0f1d',
            border: '1px solid #00ffcc',
            borderRadius: '4px',
            padding: '10px 14px',
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75em'
          }}
        >
          <div>
            <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>
              ⏱️ TIME WINDOW // {selectedHour.label} - {String((selectedHour.hour + 1) % 24).padStart(2, '0')}:00
              {selectedHour.hour === currentHourIndex && ' (CURRENT)'}
            </span>
            <div style={{ color: '#8fa0ba', marginTop: '2px' }}>
              STABILITY TIER: <span style={{ color: selectedHour.stabilityTier === 'OPTIMAL' ? '#00ffcc' : selectedHour.stabilityTier === 'STABLE' ? '#00d2ff' : '#ffaa00', fontWeight: 'bold' }}>{selectedHour.stabilityTier}</span>
              {selectedHour.eventNotes && ` • EVENT: ${selectedHour.eventNotes}`}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#ffffff' }}>
              ❤️ <span style={{ fontWeight: 'bold' }}>{selectedHour.heartRate} BPM</span> • ⚡ <span style={{ fontWeight: 'bold' }}>{selectedHour.hrv} ms HRV</span>
            </div>
            <div style={{ color: '#00ffcc', fontWeight: 'bold' }}>
              SCORE: {selectedHour.stabilityScore}%
            </div>
          </div>
        </div>
      )}

      {/* 24-Hour Diurnal Overview Metrics & Color Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0a0f1d',
          border: '1px solid #1a2636',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '0.72em',
          color: '#8fa0ba',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', gap: '12px' }}>
          <span>24H AVG HR: <strong style={{ color: '#ffffff' }}>{avg24Hr} BPM</strong></span>
          <span>AVG HRV: <strong style={{ color: '#00ffcc' }}>{avg24Hrv} ms</strong></span>
          <span>STABILITY: <strong style={{ color: '#00ffcc' }}>{avgStability}%</strong></span>
        </div>

        {/* Heat Map Gradient Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.85em' }}>GRADIENT:</span>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: 'rgba(255, 0, 51, 0.85)', borderRadius: '2px' }} title="Critical / Low HRV" />
          <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: 'rgba(255, 170, 0, 0.75)', borderRadius: '2px' }} title="Elevated Stress" />
          <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: 'rgba(0, 210, 255, 0.65)', borderRadius: '2px' }} title="Stable" />
          <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: 'rgba(0, 255, 204, 0.85)', borderRadius: '2px' }} title="Optimal Coherence" />
          <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>OPTIMAL</span>
        </div>
      </div>
    </div>
  );
};
