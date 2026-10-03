import React, { useState, useMemo } from 'react';
import { WellnessLog } from '../hooks/useIndexedDB';

interface CoherenceWarningAlertProps {
  logs?: WellnessLog[];
  currentHeartRate: number;
  currentHrv: number;
  onTriggerHarmonicShield?: () => void;
  onTriggerRecoveryRoutine?: () => void;
  onSimulateElevated?: () => void;
  onSimulateOptimal?: () => void;
}

export const CoherenceWarningAlert: React.FC<CoherenceWarningAlertProps> = ({
  logs = [],
  currentHeartRate,
  currentHrv,
  onTriggerHarmonicShield,
  onTriggerRecoveryRoutine,
  onSimulateElevated,
  onSimulateOptimal
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Calculate historical physiological averages from stored logs
  const historicalBaseline = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        avgHr: 70,
        avgHrv: 55,
        samplesCount: 0
      };
    }

    const validLogs = logs.filter((l) => l.heartRateAfter > 0);
    if (validLogs.length === 0) {
      return { avgHr: 70, avgHrv: 55, samplesCount: 0 };
    }

    const totalHr = validLogs.reduce((acc, l) => acc + l.heartRateAfter, 0);
    const totalHrv = validLogs.reduce((acc, l) => acc + (l.hrvAfter || 50), 0);

    return {
      avgHr: Math.round(totalHr / validLogs.length),
      avgHrv: Math.round(totalHrv / validLogs.length),
      samplesCount: validLogs.length
    };
  }, [logs]);

  // Compute deviations from historical baseline
  const hrDeltaPercent = Math.round(
    ((currentHeartRate - historicalBaseline.avgHr) / historicalBaseline.avgHr) * 100
  );
  const hrvDeltaPercent = Math.round(
    ((currentHrv - historicalBaseline.avgHrv) / historicalBaseline.avgHrv) * 100
  );

  // Criteria for Significant Deviation:
  // - HR elevated by >= 20% OR HR dropped below 48 BPM
  // - HRV dropped by >= 25% (indicating autonomic stress / vagal withdrawal)
  const isHrElevated = hrDeltaPercent >= 20;
  const isHrDepressed = currentHeartRate < 48;
  const isHrvSuppressed = hrvDeltaPercent <= -25;

  const isCoherenceWarningActive = isHrElevated || isHrDepressed || isHrvSuppressed;

  // Severity Level
  const isCritical = hrDeltaPercent >= 35 || hrvDeltaPercent <= -40;

  if (!isCoherenceWarningActive) {
    return (
      <div
        style={{
          padding: '10px 16px',
          backgroundColor: '#060a13',
          border: '1px solid #1a2636',
          borderRadius: '4px',
          fontFamily: 'monospace',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#00ffcc', fontSize: '1.1em' }}>🛡️</span>
          <div>
            <div style={{ fontSize: '0.8em', color: '#00ffcc', fontWeight: 'bold' }}>
              AUTONOMIC COHERENCE LOCK: NOMINAL
            </div>
            <div style={{ fontSize: '0.68em', color: '#8fa0ba' }}>
              HR: {currentHeartRate} BPM (Baseline: {historicalBaseline.avgHr}) • HRV: {currentHrv} ms (Baseline: {historicalBaseline.avgHrv})
            </div>
          </div>
        </div>

        {onSimulateElevated && (
          <button
            onClick={() => {
              setIsDismissed(false);
              onSimulateElevated();
            }}
            style={{
              padding: '4px 8px',
              fontSize: '0.68em',
              backgroundColor: '#101726',
              color: '#ffaa00',
              border: '1px solid #1a2636',
              borderRadius: '2px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}
          >
            TEST DEVIATION SPIKE
          </button>
        )}
      </div>
    );
  }

  // If dismissed by user, show compact minimized indicator
  if (isDismissed) {
    return (
      <div
        style={{
          padding: '6px 14px',
          backgroundColor: 'rgba(255, 0, 51, 0.1)',
          border: '1px solid #ff0033',
          borderRadius: '4px',
          fontFamily: 'monospace',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72em',
          color: '#ff0033',
          marginBottom: '10px'
        }}
      >
        <span>⚠️ COHERENCE WARNING ACTIVE (MUTED) — HR: {currentHeartRate} BPM | HRV: {currentHrv} ms</span>
        <button
          onClick={() => setIsDismissed(false)}
          style={{
            backgroundColor: 'transparent',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            textDecoration: 'underline'
          }}
        >
          EXPAND
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '14px 18px',
        backgroundColor: isCritical ? 'rgba(255, 0, 51, 0.12)' : 'rgba(255, 170, 0, 0.12)',
        border: `2px solid ${isCritical ? '#ff0033' : '#ffaa00'}`,
        borderRadius: '6px',
        fontFamily: 'monospace',
        marginBottom: '12px',
        boxShadow: `0 0 20px ${isCritical ? 'rgba(255, 0, 51, 0.25)' : 'rgba(255, 170, 0, 0.2)'}`,
        position: 'relative'
      }}
    >
      {/* Alert Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3em' }}>⚠️</span>
          <div>
            <h4
              style={{
                color: isCritical ? '#ff0033' : '#ffaa00',
                margin: 0,
                fontSize: '0.92em',
                fontWeight: 'bold',
                letterSpacing: '0.5px'
              }}
            >
              COHERENCE WARNING // AUTONOMIC INSTABILITY DETECTED
            </h4>
            <div style={{ fontSize: '0.68em', color: '#ffffff', opacity: 0.85 }}>
              SEVERITY: <strong style={{ color: isCritical ? '#ff0033' : '#ffaa00' }}>{isCritical ? 'CRITICAL DESYNCHRONIZATION' : 'MODERATE AUTONOMIC STRESS'}</strong> • HISTORICAL DRIFT ALERT
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          style={{
            padding: '2px 6px',
            backgroundColor: 'transparent',
            color: '#8fa0ba',
            border: '1px solid #1a2636',
            borderRadius: '2px',
            cursor: 'pointer',
            fontSize: '0.68em'
          }}
          title="Mute alert banner"
        >
          ✕ MUTE
        </button>
      </div>

      {/* Telemetry Variance Comparative Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          backgroundColor: '#0a0f1d',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #1a2636',
          marginBottom: '10px'
        }}
      >
        <div>
          <div style={{ fontSize: '0.65em', color: '#8fa0ba' }}>HEART RATE DIVERGENCE</div>
          <div style={{ fontSize: '1.05em', color: isHrElevated || isHrDepressed ? '#ff0033' : '#00ffcc', fontWeight: 'bold' }}>
            {currentHeartRate} BPM{' '}
            <span style={{ fontSize: '0.7em', color: isHrElevated ? '#ff0033' : '#00ffcc' }}>
              ({hrDeltaPercent >= 0 ? `+${hrDeltaPercent}%` : `${hrDeltaPercent}%`})
            </span>
          </div>
          <div style={{ fontSize: '0.65em', color: '#8fa0ba' }}>
            HISTORICAL BASELINE: {historicalBaseline.avgHr} BPM ({historicalBaseline.samplesCount} entries)
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.65em', color: '#8fa0ba' }}>HRV VAGAL TONE DROP</div>
          <div style={{ fontSize: '1.05em', color: isHrvSuppressed ? '#ff0033' : '#00ffcc', fontWeight: 'bold' }}>
            {currentHrv} ms{' '}
            <span style={{ fontSize: '0.7em', color: isHrvSuppressed ? '#ff0033' : '#00ffcc' }}>
              ({hrvDeltaPercent >= 0 ? `+${hrvDeltaPercent}%` : `${hrvDeltaPercent}%`})
            </span>
          </div>
          <div style={{ fontSize: '0.65em', color: '#8fa0ba' }}>
            HISTORICAL BASELINE: {historicalBaseline.avgHrv} ms
          </div>
        </div>
      </div>

      {/* Physiological Advisory Text */}
      <p style={{ margin: '0 0 10px 0', fontSize: '0.74em', color: '#c5d1e0', lineHeight: 1.4 }}>
        {isCritical
          ? 'Sympathetic nervous excitation exceeds safe operating thresholds. Heart rate variability reflects severe vagal brake withdrawal. Immediate energetic countermeasure recommended.'
          : 'Elevated cardiac acceleration and reduced parasympathetic reserve detected against historical norms. Stabilize vector field and begin conscious breathing.'}
      </p>

      {/* Actionable Countermeasure Triggers */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {onTriggerHarmonicShield && (
          <button
            onClick={onTriggerHarmonicShield}
            style={{
              padding: '6px 12px',
              backgroundColor: '#00ffcc',
              color: '#0a0f1d',
              border: 'none',
              borderRadius: '3px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: '0.75em',
              cursor: 'pointer'
            }}
          >
            🔊 ACTIVATE 432Hz TONAL SHIELD
          </button>
        )}

        {onTriggerRecoveryRoutine && (
          <button
            onClick={onTriggerRecoveryRoutine}
            style={{
              padding: '6px 12px',
              backgroundColor: '#101726',
              color: '#00ffcc',
              border: '1px solid #00ffcc',
              borderRadius: '3px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: '0.75em',
              cursor: 'pointer'
            }}
          >
            🧘 LOG GROUNDING ROUTINE
          </button>
        )}

        {onSimulateOptimal && (
          <button
            onClick={onSimulateOptimal}
            style={{
              padding: '6px 10px',
              backgroundColor: '#101726',
              color: '#8fa0ba',
              border: '1px solid #1a2636',
              borderRadius: '3px',
              fontFamily: 'monospace',
              fontSize: '0.72em',
              cursor: 'pointer'
            }}
          >
            RESTORE OPTIMAL BASELINE
          </button>
        )}
      </div>
    </div>
  );
};
