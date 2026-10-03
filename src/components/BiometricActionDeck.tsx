import React from 'react';

export interface BiometricInputs {
  heartRateBpm: number;
  hrvMs: number;
  isBleConnected: boolean;
  deviceName?: string | null;
  onTriggerRoutine: (routineType: string) => void;
  onSimulateElevated?: () => void;
  onSimulateOptimal?: () => void;
}

export const BiometricActionDeck: React.FC<BiometricInputs> = ({
  heartRateBpm,
  hrvMs,
  isBleConnected,
  deviceName,
  onTriggerRoutine,
  onSimulateElevated,
  onSimulateOptimal,
}) => {
  // Stress threshold classification based on biometrics
  const isStressElevated = heartRateBpm > 85 || hrvMs < 45;

  return (
    <div style={{ padding: '16px 20px', backgroundColor: '#060a13', borderTop: '1px solid #1a2636', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: '#00ffcc', margin: 0, fontSize: '0.95em' }}>
          🧘 BIOMETRIC FEEDBACK LOOP // WEARABLE INTERFACE
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isBleConnected ? '#00ffcc' : '#ffaa00',
              boxShadow: isBleConnected ? '0 0 6px #00ffcc' : 'none'
            }}
          />
          <span style={{ fontSize: '0.7em', color: isBleConnected ? '#00ffcc' : '#8fa0ba' }}>
            {isBleConnected ? (deviceName ? 'BLE_LOCKED' : 'ONLINE') : 'OFFLINE_STANDBY'}
          </span>
        </div>
      </div>

      {/* Primary Biometric Readout Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '12px',
          border: '1px solid #1a2636',
          padding: '10px 14px',
          borderRadius: '4px',
          backgroundColor: '#0a0f1d'
        }}
      >
        <div>
          <span style={{ color: '#8fa0ba', fontSize: '0.75em' }}>HEART RATE (PULSE)</span>
          <div
            style={{
              fontSize: '1.45em',
              fontWeight: 'bold',
              color: isBleConnected ? (isStressElevated ? '#ff0033' : '#00ffcc') : '#8fa0ba',
              display: 'flex',
              alignItems: 'baseline',
              gap: '4px'
            }}
          >
            <span>{isBleConnected ? heartRateBpm : '--'}</span>
            <span style={{ fontSize: '0.6em', color: '#8fa0ba', fontWeight: 'normal' }}>BPM</span>
          </div>
          <span style={{ fontSize: '0.68em', color: isStressElevated ? '#ffaa00' : '#8fa0ba' }}>
            {isStressElevated ? '▲ Sympathetic Stress' : '▼ Parasympathetic Coherent'}
          </span>
        </div>

        <div>
          <span style={{ color: '#8fa0ba', fontSize: '0.75em' }}>HEART RATE VARIABILITY</span>
          <div
            style={{
              fontSize: '1.45em',
              fontWeight: 'bold',
              color: isBleConnected ? (hrvMs < 45 ? '#ffaa00' : '#00ffcc') : '#8fa0ba',
              display: 'flex',
              alignItems: 'baseline',
              gap: '4px'
            }}
          >
            <span>{isBleConnected ? hrvMs : '--'}</span>
            <span style={{ fontSize: '0.6em', color: '#8fa0ba', fontWeight: 'normal' }}>ms</span>
          </div>
          <span style={{ fontSize: '0.68em', color: '#8fa0ba' }}>
            {hrvMs >= 50 ? '● High Neural Coherence' : '▲ Low Reserve Stability'}
          </span>
        </div>
      </div>

      {/* Dynamic Diagnostic Feedback Frame */}
      <div
        style={{
          backgroundColor: isStressElevated ? 'rgba(255, 0, 51, 0.08)' : 'rgba(0, 255, 204, 0.05)',
          border: `1px solid ${isStressElevated ? '#ff0033' : '#1a2636'}`,
          padding: '10px 12px',
          borderRadius: '4px',
          marginBottom: '12px'
        }}
      >
        <div style={{ fontSize: '0.72em', color: '#8fa0ba' }}>SYSTEM DIAGNOSTIC READOUT:</div>
        <div
          style={{
            fontSize: '0.85em',
            fontWeight: 'bold',
            color: isStressElevated ? '#ff0033' : '#00ffcc',
            marginTop: '3px'
          }}
        >
          {isStressElevated
            ? '⚠️ BIOMETRIC LOAD DETECTED: BALANCING PROCEDURES STANDBY'
            : '✅ BIO-COHERENCE OPTIMAL: EXCITATION BOUNDARY STABLE'}
        </div>
        <div style={{ fontSize: '0.72em', color: '#8fa0ba', marginTop: '3px' }}>
          {isStressElevated
            ? 'Environmental scalar friction impacting cardiovascular rhythms. Acoustic protection or meditation recommended.'
            : 'Internal vagal nerve tone in resonance with Schumann 7.83Hz harmonic baseline.'}
        </div>
      </div>

      {/* Primary Interactive Command Array Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        <button
          onClick={() => onTriggerRoutine('ANUHAZI_CHANT')}
          style={{
            padding: '10px 8px',
            backgroundColor: isStressElevated ? '#ff0033' : '#101726',
            color: '#ffffff',
            border: `1px solid ${isStressElevated ? '#ff0033' : '#00ffcc'}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.78em',
            fontFamily: 'monospace',
            transition: 'all 0.2s ease',
            textAlign: 'center'
          }}
        >
          {isStressElevated ? '💥 LAUNCH AUDIO PROTECTION' : '🔊 SOUND RESONANCE ROUTINE'}
        </button>

        <button
          onClick={() => onTriggerRoutine('YOGA_STRETCH')}
          style={{
            padding: '10px 8px',
            backgroundColor: '#00ffcc',
            color: '#0a0f1d',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.78em',
            fontFamily: 'monospace',
            textAlign: 'center'
          }}
        >
          🧘 LOG WELLNESS BLOCK
        </button>
      </div>

      {/* Sliders-2 Telluric Protocols: Aqua-Tone & Grail State Quick Triggers */}
      <div
        style={{
          borderTop: '1px dashed #1a2636',
          paddingTop: '10px',
          marginTop: '6px',
        }}
      >
        <div style={{ fontSize: '0.66em', color: '#8fa0ba', fontWeight: 'bold', marginBottom: '6px' }}>
          SLIDERS-2 TELLURIC PROTOCOLS // AQUA-TONE™ PRACTICUM:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <button
            onClick={() => onTriggerRoutine('JHAN_TU_RAPID_REACTIVATION')}
            style={{
              padding: '6px 8px',
              backgroundColor: '#0b1626',
              color: '#00ffcc',
              border: '1px solid #1a324f',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '0.68em',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="Mental Power Command: Jhan-TU' Et-eur' Deu-A' (Reactivates DN-1 Spins & Flows)"
          >
            <span>⚡</span>
            <span>JHAN-TU RE-ACTIVATION</span>
          </button>

          <button
            onClick={() => onTriggerRoutine('GRAIL_STATE_ENTRY')}
            style={{
              padding: '6px 8px',
              backgroundColor: '#0b1626',
              color: '#33ccff',
              border: '1px solid #1a324f',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '0.68em',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="Grail State Quick Entry: 'I AM THE WATERS, I AM THE VOICE!'"
          >
            <span>💧</span>
            <span>GRAIL STATE IMMERSION</span>
          </button>

          <button
            onClick={() => onTriggerRoutine('DAILY_FOOD_WATER_CLEARING')}
            style={{
              padding: '6px 8px',
              backgroundColor: '#0b1626',
              color: '#ffaa00',
              border: '1px solid #1a324f',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '0.68em',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="Transmit Allur-E'ah Ra-sha-tan code to clear & charge water/food"
          >
            <span>💎</span>
            <span>CLEAR & CHARGE WATER</span>
          </button>

          <button
            onClick={() => onTriggerRoutine('PHASE_TONING_VOICE')}
            style={{
              padding: '6px 8px',
              backgroundColor: '#0b1626',
              color: '#ff3399',
              border: '1px solid #1a324f',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '0.68em',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="12-Phase Tonal-Rhythm Language: Shift from I HEAR THE VOICE to I AM THE VOICE"
          >
            <span>🗣️</span>
            <span>PHASE-TONING ROUTINE</span>
          </button>

          <button
            onClick={() => onTriggerRoutine('LOGAYANAS_BREATHING')}
            style={{
              padding: '6px 8px',
              backgroundColor: '#0b1626',
              color: '#33ff99',
              border: '1px solid #1a324f',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '0.68em',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="MCEO Logayanas Frequency Breathing Movements: Entry Level Kathara 1-3 Ra Centre Lotus Breaths"
          >
            <span>🌬️</span>
            <span>LOGAYANAS BREATHING</span>
          </button>

          <button
            onClick={() => onTriggerRoutine('AH_RAYAS_PRACTICUM')}
            style={{
              padding: '6px 8px',
              backgroundColor: '#0b1626',
              color: '#ffcc00',
              border: '1px solid #1a324f',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '0.68em',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="Sliders-3 12:12 Ah-RA'-yas: 48 dynamic movements for Axiatonal/Meridian quantum and Uni-genetic Underlay"
          >
            <span>⚡</span>
            <span>12:12 AH-RA'-YAS PRACTICUM</span>
          </button>
        </div>
      </div>

      {/* Quick Test Toggles for developer/tester inspection */}
      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          onClick={onSimulateElevated}
          style={{
            fontSize: '0.68em',
            background: 'none',
            border: 'none',
            color: '#ffaa00',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          [Test High Stress]
        </button>
        <button
          onClick={onSimulateOptimal}
          style={{
            fontSize: '0.68em',
            background: 'none',
            border: 'none',
            color: '#00ffcc',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          [Test Optimal]
        </button>
      </div>
    </div>
  );
};
