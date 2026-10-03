import React, { useState, useEffect } from 'react';
import {
  calculateActiveDecayMultiplier,
  updateShieldLifecycle,
  ShieldLifecycleState
} from '../hooks/useEMFCalculator';

interface MasterGridDashboardProps {
  kpIndex: number;
  solarWindSpeed: number;
  radioBlackoutScale: number;
  onRechargeShield?: () => void;
  onExamineTonalShield?: () => void;
}

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export const MasterGridDashboard: React.FC<MasterGridDashboardProps> = ({
  kpIndex,
  solarWindSpeed,
  radioBlackoutScale,
  onRechargeShield,
  onExamineTonalShield,
}) => {
  const [shieldState, setShieldState] = useState<ShieldLifecycleState>({
    id: 'node-substation-09b',
    initialDurationMs: FORTY_EIGHT_HOURS_MS,
    timeRemainingMs: FORTY_EIGHT_HOURS_MS - 2 * 60 * 60 * 1000, // initialized at ~46 hours
    lastUpdatedAt: Date.now(),
    isExpired: false,
  });

  const [shieldRechargedNotice, setShieldRechargedNotice] = useState<boolean>(false);

  // High-Frequency Lifecycle Processing Engine (Updates every 1 second)
  useEffect(() => {
    const activeMultiplier = calculateActiveDecayMultiplier(kpIndex, solarWindSpeed, radioBlackoutScale);

    const lifecycleTick = () => {
      setShieldState((prev) => updateShieldLifecycle(prev, activeMultiplier, Date.now()));
    };

    const tickerInterval = setInterval(lifecycleTick, 1000);
    return () => clearInterval(tickerInterval);
  }, [kpIndex, solarWindSpeed, radioBlackoutScale]);

  const handleRecharge = () => {
    setShieldState({
      id: 'node-substation-09b',
      initialDurationMs: FORTY_EIGHT_HOURS_MS,
      timeRemainingMs: FORTY_EIGHT_HOURS_MS,
      lastUpdatedAt: Date.now(),
      isExpired: false,
    });
    setShieldRechargedNotice(true);
    if (onRechargeShield) onRechargeShield();
    setTimeout(() => setShieldRechargedNotice(false), 3500);
  };

  const formatTimer = (ms: number): string => {
    if (ms <= 0) return '00:00:00 - EXPIRED';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  };

  const shieldPercent = Math.max(0, Math.min(100, Math.round((shieldState.timeRemainingMs / FORTY_EIGHT_HOURS_MS) * 100)));
  const isCriticalAlert = kpIndex >= 6.0 || solarWindSpeed > 700 || radioBlackoutScale >= 3;

  return (
    <div style={{ backgroundColor: '#0a0f1d', borderBottom: '1px solid #1a2636', fontFamily: 'monospace' }}>
      {/* Critical Grid Alert Banner when severe solar event occurs */}
      {isCriticalAlert && (
        <div
          style={{
            backgroundColor: '#ff0033',
            color: '#ffffff',
            padding: '10px 16px',
            fontSize: '0.8em',
            borderBottom: '2px solid #ffffff'
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '1.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🛑 CRITICAL GRID ALERT: EXT-X SOLAR FLARE DETECTED</span>
          </div>
          <div style={{ margin: '4px 0', fontSize: '0.9em', opacity: 0.95 }}>
            ⚠️ CORE THREAT: SOLAR PARTICLE INFLUX VELOCITY AT COUPLING NODE STAGE-4
            <br />
            🔄 IMPACT MULTIPLIER: Shield Decay Rate Accelerated by +{(kpIndex * 35).toFixed(0)}%
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              onClick={handleRecharge}
              style={{
                backgroundColor: '#ffffff',
                color: '#ff0033',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '2px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.85em'
              }}
            >
              ⚡ RE-RUN MAHARIC DECREE NOW
            </button>
            <button
              onClick={onExamineTonalShield}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                color: '#ffffff',
                border: '1px solid #ffffff',
                padding: '4px 10px',
                borderRadius: '2px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.85em'
              }}
            >
              🔊 EXAMINE ANUHAZI TONAL SHIELD
            </button>
          </div>
        </div>
      )}

      {/* Recharged notification toast */}
      {shieldRechargedNotice && (
        <div
          style={{
            backgroundColor: 'rgba(0, 255, 204, 0.2)',
            borderBottom: '1px solid #00ffcc',
            color: '#00ffcc',
            padding: '8px 16px',
            fontSize: '0.8em',
            textAlign: 'center',
            fontWeight: 'bold'
          }}
        >
          ✨ 12D MAHARIC CURRENT ANCHORED: 48-HOUR SHIELD DOME RE-POLARIZED TO 100%
        </div>
      )}

      {/* Active Global Countdown Tracker Header */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.72em', color: '#8fa0ba' }}>SELECTED FIELD TARGET: SUBSTATION-09B</span>
            <h2 style={{ margin: '2px 0 6px 0', color: '#ffffff', fontSize: '1.25em' }}>
              GRID GUARDIAN HUB // V2099
            </h2>
          </div>

          <button
            onClick={handleRecharge}
            style={{
              padding: '6px 12px',
              backgroundColor: '#101726',
              color: '#00ffcc',
              border: '1px solid #00ffcc',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '0.75em',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}
          >
            ↺ RE-SEAL (48H)
          </button>
        </div>

        {/* Shield Expiration Clock & Progress */}
        <div
          style={{
            marginTop: '8px',
            backgroundColor: '#060a13',
            border: '1px solid #1a2636',
            borderRadius: '4px',
            padding: '10px 14px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8em', color: '#c5d1e0' }}>⏳ SHIELD TIME REMAINING:</span>
            <span
              style={{
                fontSize: '1.4em',
                fontWeight: 'bold',
                color: shieldState.isExpired ? '#ff0033' : shieldPercent < 25 ? '#ffaa00' : '#ffffff',
                textShadow: shieldState.isExpired ? 'none' : '0 0 10px rgba(0,255,204,0.3)'
              }}
            >
              {formatTimer(shieldState.timeRemainingMs)}
            </span>
          </div>

          <div style={{ width: '100%', height: '8px', backgroundColor: '#101726', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${shieldPercent}%`,
                height: '100%',
                backgroundColor: shieldPercent > 50 ? '#00ffcc' : shieldPercent > 20 ? '#ffaa00' : '#ff0033',
                transition: 'width 0.4s ease-in-out',
                boxShadow: `0 0 8px ${shieldPercent > 50 ? '#00ffcc' : '#ffaa00'}66`
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72em', color: '#8fa0ba', marginTop: '6px' }}>
            <span>COHERENCY: {shieldPercent}%</span>
            <span>SCHUMANN BASELINE: 7.83 Hz</span>
            <span>STATUS: {shieldState.isExpired ? 'EXPIRED' : shieldPercent < 25 ? 'DISTORTION WARNING' : 'NOMINAL COHERENCE'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
