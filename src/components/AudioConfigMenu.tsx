import React, { useState } from 'react';
import {
  setSensoryComfortMode,
  setMasterVolume,
  setBinauralBeatOffset,
  getSensoryComfortMode,
  getMasterVolumeLevel,
  getBinauralBeatOffset,
  playEmpathicChime,
  ChimeTone,
  INDIGO_FREQUENCY_PRESETS,
  BINAURAL_BEAT_PRESETS,
} from '../utils/audioEngine';

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
  const [sensoryComfort, setSensoryComfort] = useState<boolean>(getSensoryComfortMode());
  const [volumePercent, setVolumePercent] = useState<number>(Math.round((getMasterVolumeLevel() / 0.20) * 100));
  const [binauralBeatHz, setBinauralBeatHz] = useState<number>(getBinauralBeatOffset());
  const [activeCategory, setActiveCategory] = useState<'all' | 'indigo' | 'empath' | 'grounding'>('all');

  const handleSensoryToggle = () => {
    const nextVal = !sensoryComfort;
    setSensoryComfort(nextVal);
    setSensoryComfortMode(nextVal);
    if (nextVal && activeWave === 'sawtooth') {
      onSettingsChange(activeFreq, 'sine');
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = parseInt(e.target.value, 10);
    setVolumePercent(pct);
    const gainValue = (pct / 100) * 0.20;
    setMasterVolume(gainValue);
  };

  const handleBinauralChange = (beatHz: number) => {
    setBinauralBeatHz(beatHz);
    setBinauralBeatOffset(beatHz);
  };

  const handleSelectPreset = (freq: number) => {
    onSettingsChange(freq, activeWave);
  };

  const handleTestChime = (tone: ChimeTone) => {
    playEmpathicChime(tone);
  };

  const filteredPresets = INDIGO_FREQUENCY_PRESETS.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div
      style={{
        margin: '16px auto',
        maxWidth: '860px',
        width: '100%',
        backgroundColor: '#111420',
        borderRadius: '24px',
        border: '1px solid rgba(224, 175, 120, 0.18)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4), 0 0 32px rgba(224, 175, 120, 0.05)',
        padding: '24px 28px',
        color: '#f5ede1',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Soft Header with Warm Palette & Gentle Breathing Room */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          paddingBottom: '18px',
          borderBottom: '1px solid rgba(224, 175, 120, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '16px',
              backgroundColor: 'rgba(232, 175, 103, 0.15)',
              border: '1px solid rgba(232, 175, 103, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 16px rgba(232, 175, 103, 0.1)',
            }}
          >
            🌸
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#f8eedf',
                letterSpacing: '0.02em',
              }}
            >
              Sensory Harmonizer & Indigo Sound Deck
            </h2>
            <p
              style={{
                margin: '3px 0 0 0',
                fontSize: '0.82rem',
                color: '#b5a999',
                fontWeight: 400,
              }}
            >
              Soft acoustic medicine calibrated for Indigos, Empaths & Neurodivergent nervous systems
            </p>
          </div>
        </div>

        {/* Gentle Master Broadcast Button */}
        <button
          onClick={onToggleAudio}
          style={{
            padding: '11px 22px',
            fontSize: '0.88rem',
            fontWeight: 600,
            borderRadius: '16px',
            cursor: 'pointer',
            border: isAudioActive
              ? '1px solid rgba(232, 156, 174, 0.6)'
              : '1px solid rgba(126, 203, 161, 0.5)',
            backgroundColor: isAudioActive ? 'rgba(232, 156, 174, 0.18)' : 'rgba(126, 203, 161, 0.16)',
            color: isAudioActive ? '#f2b5be' : '#a7e4c2',
            boxShadow: isAudioActive
              ? '0 6px 20px rgba(232, 156, 174, 0.25)'
              : '0 6px 20px rgba(126, 203, 161, 0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.25s ease',
          }}
        >
          <span>{isAudioActive ? '■' : '▶'}</span>
          <span>{isAudioActive ? 'Rest Harmonics (Stop)' : 'Play Healing Harmonics'}</span>
        </button>
      </div>

      {/* Sensory Comfort Mode Warm Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: sensoryComfort ? 'rgba(232, 175, 103, 0.08)' : 'rgba(164, 148, 235, 0.08)',
          border: `1px solid ${sensoryComfort ? 'rgba(232, 175, 103, 0.25)' : 'rgba(164, 148, 235, 0.25)'}`,
          padding: '14px 18px',
          borderRadius: '18px',
          marginBottom: '20px',
          transition: 'all 0.25s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.4rem' }}>{sensoryComfort ? '🕊️' : '🌿'}</span>
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: '0.88rem',
                color: sensoryComfort ? '#f2c589' : '#b8abfc',
              }}
            >
              {sensoryComfort ? 'Sensory Comfort Shield: Engaged' : 'Natural Full Acoustic Spectrum'}
            </div>
            <div style={{ color: '#b5a999', fontSize: '0.78rem', marginTop: '2px' }}>
              {sensoryComfort
                ? 'Gentle Butterworth acoustic filter active (720Hz roll-off) to remove harsh, piercing high overtones.'
                : 'Raw frequencies unlocked. Sensitive listeners are encouraged to keep Sensory Comfort engaged.'}
            </div>
          </div>
        </div>

        <button
          onClick={handleSensoryToggle}
          style={{
            padding: '7px 16px',
            fontSize: '0.8rem',
            fontWeight: 600,
            backgroundColor: sensoryComfort ? '#e8af67' : 'rgba(164, 148, 235, 0.2)',
            color: sensoryComfort ? '#181b28' : '#e6e1ff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {sensoryComfort ? 'Active' : 'Enable'}
        </button>
      </div>

      {/* Gentle Comfort Volume Slider */}
      <div
        style={{
          marginBottom: '22px',
          backgroundColor: 'rgba(24, 28, 43, 0.75)',
          padding: '16px 20px',
          borderRadius: '18px',
          border: '1px solid rgba(224, 175, 120, 0.12)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.82rem',
            color: '#d6cfc4',
            marginBottom: '10px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
            <span>🎧</span>
            <span>Acoustic Listening Volume (Comfort Ceiling):</span>
          </span>
          <span style={{ color: '#e8af67', fontWeight: 600, fontSize: '0.9rem' }}>
            {volumePercent}% <span style={{ fontSize: '0.76rem', color: '#9b9186' }}>(Safe & Calming)</span>
          </span>
        </div>
        <input
          type="range"
          min="5"
          max="100"
          step="1"
          value={volumePercent}
          onChange={handleVolumeChange}
          style={{
            width: '100%',
            accentColor: '#e8af67',
            cursor: 'pointer',
            height: '6px',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: '#8f8679',
            marginTop: '6px',
          }}
        >
          <span>Soft Whisper</span>
          <span>Balanced Meditative Presence</span>
          <span>Comfort Ceiling</span>
        </div>
      </div>

      {/* Section 1: Indigo & Empathic Solfeggio Presets */}
      <div style={{ marginBottom: '22px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 600, color: '#f8eedf' }}>
              Indigo-Sensitive Sacred Frequencies
            </h3>
            <span style={{ fontSize: '0.76rem', color: '#9b9186' }}>
              Select a tone aligned with your nervous system, heart center, or sensory needs
            </span>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'indigo', 'empath', 'grounding'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '10px',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: activeCategory === cat ? '1px solid #e8af67' : '1px solid rgba(224, 175, 120, 0.12)',
                  backgroundColor: activeCategory === cat ? 'rgba(232, 175, 103, 0.2)' : 'rgba(24, 28, 43, 0.6)',
                  color: activeCategory === cat ? '#f5ede1' : '#a89d8f',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '10px',
          }}
        >
          {filteredPresets.map((preset) => {
            const isSelected = Math.abs(activeFreq - preset.frequency) < 0.2;
            return (
              <div
                key={preset.frequency}
                onClick={() => handleSelectPreset(preset.frequency)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(232, 175, 103, 0.14)' : 'rgba(24, 28, 43, 0.6)',
                  border: isSelected
                    ? '1px solid rgba(232, 175, 103, 0.6)'
                    : '1px solid rgba(224, 175, 120, 0.1)',
                  boxShadow: isSelected ? '0 4px 18px rgba(232, 175, 103, 0.12)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: isSelected ? '#f2c589' : '#f5ede1',
                    }}
                  >
                    {preset.frequency} Hz
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      backgroundColor:
                        preset.category === 'indigo'
                          ? 'rgba(164, 148, 235, 0.2)'
                          : preset.category === 'empath'
                          ? 'rgba(232, 156, 174, 0.2)'
                          : 'rgba(126, 203, 161, 0.2)',
                      color:
                        preset.category === 'indigo'
                          ? '#c4b8ff'
                          : preset.category === 'empath'
                          ? '#f4c3ce'
                          : '#aee7c9',
                      fontWeight: 600,
                    }}
                  >
                    {preset.harmonicNote}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#e5ded4',
                    margin: '6px 0 3px 0',
                  }}
                >
                  {preset.name.split('//')[1]?.trim() || preset.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9b9186', lineHeight: 1.35 }}>
                  {preset.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Stereo Binaural Beats Synchronizer */}
      <div
        style={{
          marginBottom: '22px',
          backgroundColor: 'rgba(24, 28, 43, 0.75)',
          padding: '16px 20px',
          borderRadius: '18px',
          border: '1px solid rgba(164, 148, 235, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 600, color: '#f8eedf', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎧</span>
              <span>Stereo Binaural Beats Engine (Brainwave Entrainment)</span>
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#9b9186' }}>
              Pans micro-frequency phase offsets across left and right headphones for deep calm, dreamwork, and focus
            </span>
          </div>

          {binauralBeatHz > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#b8abfc',
                backgroundColor: 'rgba(164, 148, 235, 0.2)',
                padding: '4px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(164, 148, 235, 0.3)',
              }}
            >
              Active: +{binauralBeatHz} Hz Offset
            </span>
          )}
        </div>

        {/* Live Binaural Readout */}
        <div
          style={{
            fontSize: '0.75rem',
            color: '#d6cfc4',
            backgroundColor: 'rgba(17, 20, 32, 0.7)',
            padding: '8px 14px',
            borderRadius: '12px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span>
            <strong style={{ color: '#e8af67' }}>Left Ear:</strong> {activeFreq.toFixed(1)} Hz (Carrier)
          </span>
          <span>
            <strong style={{ color: '#b8abfc' }}>Right Ear:</strong>{' '}
            {(activeFreq + binauralBeatHz).toFixed(1)} Hz
          </span>
          <span>
            <strong style={{ color: '#7ecba1' }}>Perceived Wave:</strong>{' '}
            {binauralBeatHz > 0 ? `${binauralBeatHz} Hz Entrainment` : 'Monophonic'}
          </span>
        </div>

        {/* Binaural Preset Options */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '8px',
          }}
        >
          {BINAURAL_BEAT_PRESETS.map((preset) => {
            const isMatch = Math.abs(binauralBeatHz - preset.beatHz) < 0.1;
            return (
              <button
                key={preset.beatHz}
                onClick={() => handleBinauralChange(preset.beatHz)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  border: isMatch
                    ? '1px solid rgba(164, 148, 235, 0.7)'
                    : '1px solid rgba(224, 175, 120, 0.1)',
                  backgroundColor: isMatch ? 'rgba(164, 148, 235, 0.22)' : 'rgba(17, 20, 32, 0.6)',
                  color: isMatch ? '#f5ede1' : '#b5a999',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isMatch ? '#c4b8ff' : '#e5ded4' }}>
                  {preset.name.split(' ')[0]} {preset.name.split(' ')[1]}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#9b9186', marginTop: '2px' }}>
                  {preset.description.split('.')[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 3: Waveform Geometry (Soft Rounded Cards) */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f8eedf', marginBottom: '8px' }}>
          Geometric Wave Structure
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            {
              type: 'sine' as OscillatorType,
              label: '〰️ Pure Sine',
              note: 'Recommended for Neurodivergents & Empaths (Ultra-smooth)',
            },
            {
              type: 'triangle' as OscillatorType,
              label: '📐 Filtered Triangle',
              note: 'Warm acoustic body with gentle harmonics',
            },
            {
              type: 'sawtooth' as OscillatorType,
              label: '📊 Soft Sawtooth',
              note: sensoryComfort ? 'Auto-smoothed in Sensory Mode' : 'High energy harmonic',
            },
          ].map((item) => {
            const isSelected = activeWave === item.type;
            return (
              <div
                key={item.type}
                onClick={() => onSettingsChange(activeFreq, item.type)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  border: isSelected
                    ? '1px solid rgba(232, 175, 103, 0.6)'
                    : '1px solid rgba(224, 175, 120, 0.1)',
                  backgroundColor: isSelected ? 'rgba(232, 175, 103, 0.15)' : 'rgba(24, 28, 43, 0.6)',
                  color: isSelected ? '#f5ede1' : '#b5a999',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: isSelected ? '#f2c589' : '#e5ded4' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#9b9186', marginTop: '3px' }}>
                  {item.note}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Empathic Singing Bowl Chimes (Warm Palette Soundboard) */}
      <div
        style={{
          backgroundColor: 'rgba(24, 28, 43, 0.75)',
          padding: '16px 20px',
          borderRadius: '18px',
          border: '1px solid rgba(224, 175, 120, 0.12)',
        }}
      >
        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f8eedf', marginBottom: '4px' }}>
          🔔 Empathic Singing Bowl Bells (Zero-Jolt Acoustic Cues)
        </div>
        <p style={{ fontSize: '0.74rem', color: '#9b9186', margin: '0 0 12px 0' }}>
          Tap a chime below for a calming, non-jarring acoustic feedback bell
        </p>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            {
              tone: 'love' as ChimeTone,
              label: '💖 528Hz Love Bell',
              bg: 'rgba(232, 156, 174, 0.18)',
              border: 'rgba(232, 156, 174, 0.4)',
              color: '#f4c3ce',
            },
            {
              tone: 'ground' as ChimeTone,
              label: '🧘 432Hz Christos Bell',
              bg: 'rgba(232, 175, 103, 0.18)',
              border: 'rgba(232, 175, 103, 0.4)',
              color: '#f2c589',
            },
            {
              tone: 'breathe' as ChimeTone,
              label: '🌊 136.1Hz Earth Om',
              bg: 'rgba(126, 203, 161, 0.18)',
              border: 'rgba(126, 203, 161, 0.4)',
              color: '#aee7c9',
            },
            {
              tone: 'shield' as ChimeTone,
              label: '🛡️ 741Hz Cleanse Chime',
              bg: 'rgba(164, 148, 235, 0.18)',
              border: 'rgba(164, 148, 235, 0.4)',
              color: '#c4b8ff',
            },
          ].map((chime) => (
            <button
              key={chime.tone}
              onClick={() => handleTestChime(chime.tone)}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                backgroundColor: chime.bg,
                border: `1px solid ${chime.border}`,
                color: chime.color,
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {chime.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
