import React from 'react';

export interface AudioConfigProps {
  activeFreq: number;
  activeWave: OscillatorType;
  isAudioActive: boolean;
  onSettingsChange: (freq: number, wave: OscillatorType) => void;
  onToggleAudio: () => void;
}

export const AudioConfigMenu: React.FC<AudioConfigProps> = ({
  activeFreq,
  activeWave,
  isAudioActive,
  onSettingsChange,
  onToggleAudio,
}) => {
  // Common core master frequencies utilized inside acoustic sound coding
  const FREQUENCY_PRESETS = [
    { label: '432 Hz (Christos Core Alignment)', value: 432.0 },
    { label: '528 Hz (Transformation / Bio-Resonance)', value: 528.0 },
    { label: '728 Hz (Anti-Microbial / Shield Friction)', value: 728.0 },
    { label: '144 Hz (12D Sub-Harmonic Eraser)', value: 144.0 },
  ];

  const WAVEFORM_PRESETS: { label: string; value: OscillatorType }[] = [
    { label: '〰️ PURE SINE (Organic Coherence)', value: 'sine' },
    { label: '📐 TRIANGLE (Dense Shield Friction)', value: 'triangle' },
    { label: '📊 SAWTOOTH (High Inception Blast)', value: 'sawtooth' },
  ];

  return (
    <div style={{ padding: '16px 20px', backgroundColor: '#060a13', borderTop: '1px solid #1a2636', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: '#00ffcc', margin: 0, fontSize: '0.95em' }}>
          🎛️ AUDIO HARDWARE DECK // WAVEFORM RE-CALIBRATION
        </h3>
        <button
          onClick={onToggleAudio}
          style={{
            padding: '4px 10px',
            fontSize: '0.72em',
            fontWeight: 'bold',
            backgroundColor: isAudioActive ? '#ff0033' : '#101726',
            color: isAudioActive ? '#ffffff' : '#00ffcc',
            border: `1px solid ${isAudioActive ? '#ff0033' : '#00ffcc'}`,
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          {isAudioActive ? '■ STOP BROADCAST' : '▶ START BROADCAST'}
        </button>
      </div>

      {/* Section A: Frequency Configuration Selection */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ color: '#8fa0ba', fontSize: '0.75em', display: 'block', marginBottom: '4px' }}>
          TARGET ANUHAZI RESONANCE PRESET:
        </label>
        <select
          value={activeFreq}
          onChange={(e) => onSettingsChange(parseFloat(e.target.value), activeWave)}
          style={{
            width: '100%',
            padding: '8px 10px',
            backgroundColor: '#101726',
            color: '#ffffff',
            border: '1px solid #1a2636',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.82em',
            outline: 'none'
          }}
        >
          {FREQUENCY_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value} style={{ backgroundColor: '#0a0f1d' }}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      {/* Fine-Tuning Slider */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72em', color: '#8fa0ba', marginBottom: '3px' }}>
          <span>FINE-TUNE FREQUENCY:</span>
          <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{activeFreq.toFixed(1)} Hz</span>
        </div>
        <input
          type="range"
          min="100"
          max="1000"
          step="1"
          value={activeFreq}
          onChange={(e) => onSettingsChange(parseFloat(e.target.value), activeWave)}
          style={{ width: '100%', accentColor: '#00ffcc', cursor: 'pointer' }}
        />
      </div>

      {/* Section B: Waveform Geometry Selection */}
      <div>
        <label style={{ color: '#8fa0ba', fontSize: '0.75em', display: 'block', marginBottom: '4px' }}>
          GEOMETRIC WAVE STRUCTURE LAYOUT:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          {WAVEFORM_PRESETS.map((wave) => {
            const isSelected = activeWave === wave.value;
            return (
              <button
                key={wave.value}
                onClick={() => onSettingsChange(activeFreq, wave.value)}
                style={{
                  padding: '8px 4px',
                  backgroundColor: isSelected ? '#00ffcc' : '#101726',
                  color: isSelected ? '#0a0f1d' : '#ffffff',
                  border: isSelected ? '1px solid #00ffcc' : '1px solid #1a2636',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.72em',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                {wave.label.split(' ')[0]} <br /> {wave.value.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Operational Feedback Marker */}
      <div
        style={{
          marginTop: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75em',
          borderTop: '1px dashed #1a2636',
          paddingTop: '6px'
        }}
      >
        <span style={{ color: '#8fa0ba' }}>CURRENT RUNTIME SPEED:</span>
        <span style={{ color: isAudioActive ? '#00ffcc' : '#8fa0ba', fontWeight: 'bold' }}>
          {activeFreq}Hz // TYPE_{activeWave.toUpperCase()} {isAudioActive ? '(ACTIVE)' : '(STANDBY)'}
        </span>
      </div>
    </div>
  );
};
