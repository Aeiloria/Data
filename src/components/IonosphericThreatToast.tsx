import React, { useState, useEffect } from 'react';

export interface IonosphericThreatInfo {
  isCritical: boolean;
  threatLevel: 'NOMINAL' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  kpIndex: number;
  geomagneticStormScale: string;
  radioBlackoutScale: string;
  solarWindSpeed: number;
  ionosphericTecVariancePct: number;
  lastUpdated: string;
}

interface IonosphericThreatToastProps {
  threat: IonosphericThreatInfo | null;
  currentActiveTab?: string;
  onNavigateToAudioSynth: () => void;
  onActivateAudioShield?: () => void;
  onSimulateCriticalSpike?: () => void;
  onResetThreat?: () => void;
}

export const IonosphericThreatToast: React.FC<IonosphericThreatToastProps> = ({
  threat,
  currentActiveTab,
  onNavigateToAudioSynth,
  onActivateAudioShield,
  onSimulateCriticalSpike,
  onResetThreat,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [lastAlertTime, setLastAlertTime] = useState<string | null>(null);

  // When threat transitions to critical, un-dismiss so user receives the alert
  useEffect(() => {
    if (threat?.isCritical) {
      setIsDismissed(false);
      setLastAlertTime(new Date().toLocaleTimeString());
    }
  }, [threat?.isCritical, threat?.kpIndex, threat?.geomagneticStormScale]);

  // If user is already on the AUDIO tab or no threat or dismissed, handle visibility
  if (!threat || !threat.isCritical) {
    return null;
  }

  // If dismissed, render a small unobtrusive pill in the corner
  if (isDismissed) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 9999,
          backgroundColor: 'rgba(12, 5, 14, 0.92)',
          border: '1px solid #ff0033',
          boxShadow: '0 0 15px rgba(255, 0, 51, 0.4)',
          borderRadius: '4px',
          padding: '6px 12px',
          fontFamily: 'monospace',
          fontSize: '0.68em',
          color: '#ff3366',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backdropFilter: 'blur(6px)',
        }}
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff0033', animation: 'pulse 1.2s infinite' }} />
        <span>CRITICAL IONOSPHERE: Kp {threat.kpIndex}</span>
        <button
          onClick={() => setIsDismissed(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#00ffcc',
            cursor: 'pointer',
            fontSize: '0.9em',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          [EXPAND ALERT]
        </button>
      </div>
    );
  }

  const isAlreadyOnAudio = currentActiveTab === 'AUDIO';

  return (
    <aside
      aria-label="Critical Ionospheric Threat Alert"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '420px',
        width: 'calc(100vw - 40px)',
        backgroundColor: '#0c0612',
        border: '1.5px solid #ff0033',
        borderRadius: '8px',
        padding: '14px 16px',
        fontFamily: 'monospace',
        boxShadow: '0 0 35px rgba(255, 0, 51, 0.5), inset 0 0 15px rgba(255, 0, 51, 0.2)',
        backdropFilter: 'blur(10px)',
        animation: 'slideInRight 0.35s ease-out',
        color: '#ffffff',
      }}
    >
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(50px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes toastPulseGlow {
            0% { box-shadow: 0 0 15px rgba(255, 0, 51, 0.4); }
            50% { box-shadow: 0 0 35px rgba(255, 0, 51, 0.8), inset 0 0 20px rgba(255, 0, 51, 0.3); }
            100% { box-shadow: 0 0 15px rgba(255, 0, 51, 0.4); }
          }
        `}
      </style>

      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px',
          borderBottom: '1px solid rgba(255, 0, 51, 0.3)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4em', animation: 'toastPulseGlow 2s infinite' }}>
            ⚡
          </span>
          <div>
            <div
              style={{
                fontSize: '0.82em',
                fontWeight: 'bold',
                color: '#ff0033',
                letterSpacing: '0.5px',
              }}
            >
              CRITICAL IONOSPHERIC DISTURBANCE
            </div>
            <div style={{ fontSize: '0.62em', color: '#ff99aa' }}>
              NOAA SWPC REAL-TIME OVERLAY DETECTS EXTREME SHEAR
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#8fa0ba',
            fontSize: '1em',
            cursor: 'pointer',
            padding: '0 4px',
            lineHeight: 1,
          }}
          title="Dismiss toast"
        >
          ✕
        </button>
      </div>

      {/* Live NOAA SWPC Telemetry Metrics Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          backgroundColor: 'rgba(255, 0, 51, 0.08)',
          border: '1px solid rgba(255, 0, 51, 0.25)',
          padding: '6px 8px',
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '0.65em',
        }}
      >
        <div>
          <div style={{ color: '#8fa0ba' }}>GEOMAGNETIC</div>
          <div style={{ color: '#ff3366', fontWeight: 'bold' }}>
            Kp {threat.kpIndex} ({threat.geomagneticStormScale})
          </div>
        </div>
        <div>
          <div style={{ color: '#8fa0ba' }}>SOLAR WIND</div>
          <div style={{ color: '#ffaa00', fontWeight: 'bold' }}>
            {threat.solarWindSpeed} km/s
          </div>
        </div>
        <div>
          <div style={{ color: '#8fa0ba' }}>TEC ANOMALY</div>
          <div style={{ color: '#ff3366', fontWeight: 'bold' }}>
            +{threat.ionosphericTecVariancePct}%
          </div>
        </div>
      </div>

      {/* Suggestion Text */}
      <div
        style={{
          fontSize: '0.73em',
          color: '#e6edfa',
          lineHeight: '1.4',
          marginBottom: '12px',
        }}
      >
        High-altitude RF absorption and auroral currents are causing acute scalar distortion in the local atmosphere. <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>Shift to the Audio Synth tab</span> to initiate protective frequency broadcasting (528Hz Hydrolase or 432Hz Christos Alignment).
      </div>

      {/* Action Buttons Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => {
            onNavigateToAudioSynth();
            if (onActivateAudioShield) onActivateAudioShield();
            setIsDismissed(true);
          }}
          style={{
            padding: '7px 12px',
            backgroundColor: '#00ffcc',
            color: '#070d18',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.74em',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 0 15px rgba(0, 255, 204, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          <span>🎛️</span>
          <span>{isAlreadyOnAudio ? 'LAUNCH PROTECTIVE FREQUENCY' : 'SHIFT TO AUDIO SYNTH TAB'}</span>
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          style={{
            padding: '6px 10px',
            backgroundColor: 'transparent',
            color: '#8fa0ba',
            border: '1px solid #1a2c48',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.68em',
            fontFamily: 'monospace',
          }}
        >
          Dismiss
        </button>
      </div>

      {/* Simulator Test Controls (Dev / Inspection) */}
      <div
        style={{
          marginTop: '8px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.6em',
          color: '#5e7392',
        }}
      >
        <span>STATUS: {lastAlertTime || 'LIVE'}</span>
        {onResetThreat && (
          <button
            onClick={onResetThreat}
            style={{
              background: 'none',
              border: 'none',
              color: '#33ff99',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '1em',
              padding: 0,
            }}
          >
            [Reset Threat]
          </button>
        )}
      </div>
    </aside>
  );
};
