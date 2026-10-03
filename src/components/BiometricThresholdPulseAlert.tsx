import React, { useState, useEffect, useMemo } from 'react';
import { WellnessLog } from '../hooks/useIndexedDB';

interface BiometricThresholdPulseAlertProps {
  currentHeartRate: number;
  currentHrv: number;
  isBleConnected?: boolean;
  logs?: WellnessLog[];
  onTriggerAudioShield?: () => void;
  onTriggerRecoveryRoutine?: () => void;
  onSimulateElevated?: () => void;
  onSimulateOptimal?: () => void;
}

export const BiometricThresholdPulseAlert: React.FC<BiometricThresholdPulseAlertProps> = ({
  currentHeartRate,
  currentHrv,
  isBleConnected = false,
  logs = [],
  onTriggerAudioShield,
  onTriggerRecoveryRoutine,
  onSimulateElevated,
  onSimulateOptimal,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [pulseCount, setPulseCount] = useState<number>(0);

  // Compute the user's historical daily average from stored logs
  const historicalAverages = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        dailyAvgHr: 70,
        dailyAvgHrv: 55,
        totalSamples: 0,
      };
    }

    const validLogs = logs.filter((l) => (l.heartRateAfter && l.heartRateAfter > 0) || (l.heartRateBefore && l.heartRateBefore > 0));
    if (validLogs.length === 0) {
      return { dailyAvgHr: 70, dailyAvgHrv: 55, totalSamples: 0 };
    }

    const totalHr = validLogs.reduce(
      (acc, l) => acc + (l.heartRateAfter > 0 ? l.heartRateAfter : l.heartRateBefore || 70),
      0
    );
    const totalHrv = validLogs.reduce(
      (acc, l) => acc + (l.hrvAfter && l.hrvAfter > 0 ? l.hrvAfter : l.hrvBefore || 55),
      0
    );

    return {
      dailyAvgHr: Math.round(totalHr / validLogs.length),
      dailyAvgHrv: Math.round(totalHrv / validLogs.length),
      totalSamples: validLogs.length,
    };
  }, [logs]);

  // Real-time percentage deviations
  const hrDeltaPercent = Math.round(
    ((currentHeartRate - historicalAverages.dailyAvgHr) / historicalAverages.dailyAvgHr) * 100
  );
  const hrvDeltaPercent = Math.round(
    ((currentHrv - historicalAverages.dailyAvgHrv) / historicalAverages.dailyAvgHrv) * 100
  );

  // Threshold conditions:
  // 1. Heart rate elevated >= 20% above historical average OR drops below 48 BPM
  // 2. HRV suppressed by >= 25% below historical average (vagal withdrawal)
  const isHrElevated = hrDeltaPercent >= 20;
  const isHrDepressed = currentHeartRate < 48;
  const isHrvSuppressed = hrvDeltaPercent <= -25;

  const isDeviationSignificant = isHrElevated || isHrDepressed || isHrvSuppressed;

  // Severity classification
  const isCritical = hrDeltaPercent >= 35 || hrvDeltaPercent <= -40;
  const alertColor = isCritical ? '#ff0033' : '#ffaa00';
  const alertGlow = isCritical ? 'rgba(255, 0, 51, 0.4)' : 'rgba(255, 170, 0, 0.35)';

  // Rhythmic pulse counter linked to detected heart rate
  useEffect(() => {
    if (!isDeviationSignificant) {
      setIsDismissed(false);
      return;
    }

    // Interval matches current heart rate in BPM
    const pulseIntervalMs = Math.max(350, Math.min(1500, (60 / (currentHeartRate || 75)) * 1000));
    const timer = setInterval(() => {
      setPulseCount((prev) => (prev + 1) % 100);
    }, pulseIntervalMs);

    return () => clearInterval(timer);
  }, [isDeviationSignificant, currentHeartRate]);

  // If no significant deviation, render subtle idle indicator
  if (!isDeviationSignificant) {
    return null;
  }

  // If user dismissed this instance, show unobtrusive compact chip
  if (isDismissed) {
    return (
      <div
        style={{
          margin: '0 16px 8px 16px',
          padding: '4px 10px',
          backgroundColor: 'rgba(10, 16, 28, 0.9)',
          border: `1px dashed ${alertColor}`,
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.66em',
          fontFamily: 'monospace',
          color: alertColor,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: alertColor,
              animation: 'pulse 1.5s infinite',
            }}
          />
          <span>
            PULSE MUTED: HR {currentHeartRate} BPM ({hrDeltaPercent > 0 ? `+${hrDeltaPercent}%` : `${hrDeltaPercent}%`}) • HRV {currentHrv} ms ({hrvDeltaPercent > 0 ? `+${hrvDeltaPercent}%` : `${hrvDeltaPercent}%`})
          </span>
        </div>
        <button
          onClick={() => setIsDismissed(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#00ffcc',
            fontSize: '0.9em',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          [RESTORE ALERT]
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: '0 16px 10px 16px',
        position: 'relative',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: `0 0 25px ${alertGlow}`,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Subtle Ambient Breathing Pulse Bar */}
      <style>
        {`
          @keyframes subtlePulseBorder {
            0% {
              box-shadow: 0 0 10px ${alertGlow}, inset 0 0 10px ${alertGlow};
              border-color: ${alertColor};
            }
            50% {
              box-shadow: 0 0 30px ${alertColor}, inset 0 0 20px ${alertGlow};
              border-color: #ffffff;
            }
            100% {
              box-shadow: 0 0 10px ${alertGlow}, inset 0 0 10px ${alertGlow};
              border-color: ${alertColor};
            }
          }
          @keyframes heartbeatIconPulse {
            0% { transform: scale(1); }
            14% { transform: scale(1.3); }
            28% { transform: scale(1); }
            42% { transform: scale(1.2); }
            70% { transform: scale(1); }
          }
        `}
      </style>

      <div
        style={{
          backgroundColor: '#0c0712',
          border: `1.5px solid ${alertColor}`,
          animation: 'subtlePulseBorder 1.8s infinite ease-in-out',
          borderRadius: '6px',
          padding: '10px 14px',
          fontFamily: 'monospace',
          color: '#ffffff',
        }}
      >
        {/* Top Header Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            flexWrap: 'wrap',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '1.2em',
                display: 'inline-block',
                animation: 'heartbeatIconPulse 1.2s infinite ease-in-out',
              }}
            >
              💓
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '0.78em',
                    fontWeight: 'bold',
                    color: alertColor,
                    letterSpacing: '0.5px',
                  }}
                >
                  {isCritical ? 'CRITICAL BIOMETRIC DEVIATION DETECTED' : 'BIOMETRIC LOAD THRESHOLD EXCEEDED'}
                </span>
                <span
                  style={{
                    fontSize: '0.6em',
                    backgroundColor: `${alertColor}22`,
                    border: `1px solid ${alertColor}`,
                    color: alertColor,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontWeight: 'bold',
                  }}
                >
                  LIVE SENSOR
                </span>
              </div>
              <div style={{ fontSize: '0.64em', color: '#8fa0ba' }}>
                SIGNIFICANT VARIANCE FROM HISTORICAL DAILY BASELINE ({historicalAverages.totalSamples} STORED SAMPLES)
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#8fa0ba',
              fontSize: '0.8em',
              cursor: 'pointer',
              padding: '2px 6px',
            }}
            title="Dismiss notification pulse"
          >
            ✕
          </button>
        </div>

        {/* Detailed Metrics Breakdown */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            padding: '8px 10px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '10px',
          }}
        >
          {/* Heart Rate Metric */}
          <div>
            <div style={{ fontSize: '0.62em', color: '#8fa0ba' }}>REAL-TIME HEART RATE</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span
                style={{
                  fontSize: '1.2em',
                  fontWeight: 'bold',
                  color: isHrElevated || isHrDepressed ? alertColor : '#00ffcc',
                }}
              >
                {currentHeartRate} <span style={{ fontSize: '0.6em' }}>BPM</span>
              </span>
              <span
                style={{
                  fontSize: '0.68em',
                  fontWeight: 'bold',
                  color: hrDeltaPercent > 0 ? alertColor : '#33ff99',
                }}
              >
                {hrDeltaPercent > 0 ? `+${hrDeltaPercent}%` : `${hrDeltaPercent}%`}
              </span>
            </div>
            <div style={{ fontSize: '0.58em', color: '#5e7392' }}>
              Historical Daily Avg: {historicalAverages.dailyAvgHr} BPM
            </div>
          </div>

          {/* HRV Metric */}
          <div>
            <div style={{ fontSize: '0.62em', color: '#8fa0ba' }}>REAL-TIME HRV (RMSSD)</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span
                style={{
                  fontSize: '1.2em',
                  fontWeight: 'bold',
                  color: isHrvSuppressed ? alertColor : '#00ffcc',
                }}
              >
                {currentHrv} <span style={{ fontSize: '0.6em' }}>MS</span>
              </span>
              <span
                style={{
                  fontSize: '0.68em',
                  fontWeight: 'bold',
                  color: hrvDeltaPercent < 0 ? alertColor : '#33ff99',
                }}
              >
                {hrvDeltaPercent > 0 ? `+${hrvDeltaPercent}%` : `${hrvDeltaPercent}%`}
              </span>
            </div>
            <div style={{ fontSize: '0.58em', color: '#5e7392' }}>
              Historical Daily Avg: {historicalAverages.dailyAvgHrv} MS
            </div>
          </div>
        </div>

        {/* Action Trigger Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {onTriggerAudioShield && (
              <button
                onClick={onTriggerAudioShield}
                style={{
                  padding: '5px 10px',
                  backgroundColor: 'rgba(0, 255, 204, 0.15)',
                  color: '#00ffcc',
                  border: '1px solid #00ffcc',
                  borderRadius: '3px',
                  fontSize: '0.7em',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>🔊</span>
                <span>ACTIVATE 528Hz SHIELD</span>
              </button>
            )}

            {onTriggerRecoveryRoutine && (
              <button
                onClick={onTriggerRecoveryRoutine}
                style={{
                  padding: '5px 10px',
                  backgroundColor: 'rgba(255, 170, 0, 0.15)',
                  color: '#ffaa00',
                  border: '1px solid #ffaa00',
                  borderRadius: '3px',
                  fontSize: '0.7em',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>🧘</span>
                <span>LOG RECOVERY ROUTINE</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {onSimulateOptimal && (
              <button
                onClick={onSimulateOptimal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00ffcc',
                  fontSize: '0.62em',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                [Reset to Normal]
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
