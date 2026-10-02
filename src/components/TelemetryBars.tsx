import React from 'react';

export interface SpaceWeatherInputs {
  kpIndex: number; // Range 0.0 - 9.0 (NOAA Geomagnetic Kp)
  solarWindSpeed: number; // Range ~300 - 1000+ km/s
  radioBlackoutScale: number; // Range 0 - 5 (NOAA R-Scale flare threshold)
  onSimulateChange?: (field: 'kpIndex' | 'solarWindSpeed' | 'radioBlackoutScale', value: number) => void;
  isSimulated?: boolean;
}

export const TelemetryBars: React.FC<SpaceWeatherInputs> = ({
  kpIndex,
  solarWindSpeed,
  radioBlackoutScale,
  onSimulateChange,
  isSimulated = false,
}) => {
  // 1. Calculate percentage fills for data metrics
  const kpPercentage = Math.min((kpIndex / 9) * 100, 100);
  const windPercentage = Math.max(0, Math.min(((solarWindSpeed - 300) / 700) * 100, 100));
  const flarePercentage = Math.min((radioBlackoutScale / 5) * 100, 100);

  // 2. Compute the composite 12D Shield Decay Multiplier
  const kpImpact = kpIndex > 4.0 ? (kpIndex - 4.0) * 0.5 : 0;
  const windImpact = solarWindSpeed > 500 ? (solarWindSpeed - 500) * 0.002 : 0;
  const flareImpact = radioBlackoutScale * 0.4;
  const totalDecayMultiplier = (1.0 + kpImpact + windImpact + flareImpact).toFixed(2);

  // 3. Determine safety classification colors
  const getStatusColor = (val: number, max: number) => {
    const ratio = val / max;
    if (ratio < 0.4) return '#00ffcc'; // Optimal Coherence (Neon Teal)
    if (ratio < 0.7) return '#ffaa00'; // Moderate Stress (Amber)
    return '#ff0033'; // Critical Distortion (Crimson)
  };

  const getStormCategory = (kp: number) => {
    if (kp >= 9) return 'G5 - Extreme Geomagnetic Storm';
    if (kp >= 8) return 'G4 - Severe Geomagnetic Storm';
    if (kp >= 7) return 'G3 - Strong Geomagnetic Storm';
    if (kp >= 6) return 'G2 - Moderate Geomagnetic Storm';
    if (kp >= 5) return 'G1 - Minor Geomagnetic Storm';
    return 'G0 - Geomagnetic Quiet Field';
  };

  return (
    <div style={{ padding: '16px 20px', backgroundColor: '#060a13', color: '#ffffff', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a2636', paddingBottom: '8px', marginBottom: '14px' }}>
        <h3 style={{ color: '#00ffcc', margin: 0, fontSize: '0.95em', letterSpacing: '0.5px' }}>
          📊 LIVE PARAMETER GROUPING // ENVIRONMENT TELEMETRY
        </h3>
        <span style={{ fontSize: '0.7em', color: '#8fa0ba', border: '1px solid #1a2636', padding: '2px 6px', borderRadius: '2px' }}>
          NOAA SWPC v2099
        </span>
      </div>

      {/* Metric 1: Planetary K-Index */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78em', marginBottom: '4px' }}>
          <span style={{ color: '#c5d1e0' }}>🪐 GEOMAGNETIC REGIONAL IMPACT (PLANETARY K-INDEX)</span>
          <span style={{ color: getStatusColor(kpIndex, 9), fontWeight: 'bold' }}>
            Kp {kpIndex.toFixed(1)} <span style={{ color: '#8fa0ba', fontWeight: 'normal' }}>({getStormCategory(kpIndex)})</span>
          </span>
        </div>
        <div style={{ width: '100%', height: '10px', backgroundColor: '#101726', borderRadius: '2px', overflow: 'hidden', border: '1px solid #1a2636' }}>
          <div
            style={{
              width: `${kpPercentage}%`,
              height: '100%',
              backgroundColor: getStatusColor(kpIndex, 9),
              transition: 'width 0.4s ease-in-out',
              boxShadow: `0 0 8px ${getStatusColor(kpIndex, 9)}88`
            }}
          />
        </div>
      </div>

      {/* Metric 2: Solar Wind Speed */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78em', marginBottom: '4px' }}>
          <span style={{ color: '#c5d1e0' }}>💨 ATMOSPHERIC PARTICLE INTERACTION (SOLAR WIND SPEED)</span>
          <span style={{ color: getStatusColor(solarWindSpeed, 1000), fontWeight: 'bold' }}>
            {Math.round(solarWindSpeed)} km/s
          </span>
        </div>
        <div style={{ width: '100%', height: '10px', backgroundColor: '#101726', borderRadius: '2px', overflow: 'hidden', border: '1px solid #1a2636' }}>
          <div
            style={{
              width: `${windPercentage}%`,
              height: '100%',
              backgroundColor: getStatusColor(solarWindSpeed, 1000),
              transition: 'width 0.4s ease-in-out',
              boxShadow: `0 0 8px ${getStatusColor(solarWindSpeed, 1000)}88`
            }}
          />
        </div>
      </div>

      {/* Metric 3: Radio Blackout Scale */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78em', marginBottom: '4px' }}>
          <span style={{ color: '#c5d1e0' }}>💥 FLARE RADIATION COEFFICIENT (NOAA R-SCALE)</span>
          <span style={{ color: getStatusColor(radioBlackoutScale, 5), fontWeight: 'bold' }}>
            R{radioBlackoutScale} {radioBlackoutScale === 0 ? '(None)' : radioBlackoutScale < 3 ? '(Moderate)' : '(Extreme)'}
          </span>
        </div>
        <div style={{ width: '100%', height: '10px', backgroundColor: '#101726', borderRadius: '2px', overflow: 'hidden', border: '1px solid #1a2636' }}>
          <div
            style={{
              width: `${flarePercentage}%`,
              height: '100%',
              backgroundColor: getStatusColor(radioBlackoutScale, 5),
              transition: 'width 0.4s ease-in-out',
              boxShadow: `0 0 8px ${getStatusColor(radioBlackoutScale, 5)}88`
            }}
          />
        </div>
      </div>

      {/* Calculated Output Display Box */}
      <div
        style={{
          backgroundColor: '#101726',
          padding: '12px 14px',
          borderRadius: '4px',
          border: '1px solid #1a2636',
          borderLeft: `4px solid ${parseFloat(totalDecayMultiplier) > 2.0 ? '#ff0033' : '#00ffcc'}`
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75em', color: '#8fa0ba' }}>DYNAMIC SCALAR COEFFICIENT</span>
            <h4 style={{ margin: '3px 0 0 0', fontSize: '1.05em', color: '#ffffff' }}>
              CURRENT 12D SHIELD DECAY RATE
            </h4>
            <div style={{ fontSize: '0.72em', color: '#8fa0ba', marginTop: '2px' }}>
              Base 1.00x + Kp({kpImpact.toFixed(2)}) + Wind({windImpact.toFixed(2)}) + Flare({flareImpact.toFixed(2)})
            </div>
          </div>
          <span
            style={{
              fontSize: '1.8em',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              color: parseFloat(totalDecayMultiplier) > 2.0 ? '#ff0033' : '#00ffcc',
              textShadow: `0 0 10px ${parseFloat(totalDecayMultiplier) > 2.0 ? 'rgba(255,0,51,0.5)' : 'rgba(0,255,204,0.4)'}`
            }}
          >
            {totalDecayMultiplier}x
          </span>
        </div>
      </div>

      {/* Quick Simulation Trigger presets */}
      {onSimulateChange && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7em', color: '#8fa0ba' }}>SIMULATE:</span>
          <button
            onClick={() => {
              onSimulateChange('kpIndex', 2.1);
              onSimulateChange('solarWindSpeed', 375);
              onSimulateChange('radioBlackoutScale', 0);
            }}
            style={{
              padding: '3px 6px',
              fontSize: '0.7em',
              backgroundColor: '#101726',
              color: '#00ffcc',
              border: '1px solid #1a2636',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            Quiet Sun (1.0x)
          </button>
          <button
            onClick={() => {
              onSimulateChange('kpIndex', 6.2);
              onSimulateChange('solarWindSpeed', 742);
              onSimulateChange('radioBlackoutScale', 3);
            }}
            style={{
              padding: '3px 6px',
              fontSize: '0.7em',
              backgroundColor: '#101726',
              color: '#ffaa00',
              border: '1px solid #1a2636',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            G2 Flare (3.78x)
          </button>
          <button
            onClick={() => {
              onSimulateChange('kpIndex', 8.5);
              onSimulateChange('solarWindSpeed', 910);
              onSimulateChange('radioBlackoutScale', 4);
            }}
            style={{
              padding: '3px 6px',
              fontSize: '0.7em',
              backgroundColor: '#101726',
              color: '#ff0033',
              border: '1px solid #1a2636',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            EXT-X Surge (5.67x)
          </button>
        </div>
      )}
    </div>
  );
};
