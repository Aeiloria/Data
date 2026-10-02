import React, { useState } from 'react';
import { calculateDistance } from '../hooks/useEMFCalculator';
import { RegionalLandmark } from '../hooks/useIndexedDB';

interface LandmarkDeckProps {
  userLat: number;
  userLon: number;
  landmarks: RegionalLandmark[];
  onExecuteObjective: (id: string) => void;
  onDeployLure?: () => void;
  onScanAnomalies?: () => void;
}

export const RegionalLandmarkDeck: React.FC<LandmarkDeckProps> = ({
  userLat,
  userLon,
  landmarks,
  onExecuteObjective,
  onDeployLure,
  onScanAnomalies,
}) => {
  const [activeLoreIndex, setActiveLoreIndex] = useState<number>(0);
  const [activeScanStatus, setActiveScanStatus] = useState<string | null>(null);

  const completedCount = landmarks.filter((l) => l.is_completed).length;
  const coherencePercent = landmarks.length > 0 ? Math.round((completedCount / landmarks.length) * 100) : 0;

  const handleLureClick = () => {
    setActiveScanStatus('RADIAL 12D LURE DEPLOYED: Sub-harmonic carrier wave active (+150m boundary extended)');
    if (onDeployLure) onDeployLure();
    setTimeout(() => setActiveScanStatus(null), 4000);
  };

  const handleScanClick = () => {
    setActiveScanStatus('ANOMALY SCAN REPORT: 2 micro-current eddies detected at Leon River tributary. No containment breaches.');
    if (onScanAnomalies) onScanAnomalies();
    setTimeout(() => setActiveScanStatus(null), 4000);
  };

  return (
    <div style={{ padding: '16px 20px', backgroundColor: '#060a13', borderTop: '1px solid #1a2636', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ color: '#00ffcc', margin: 0, fontSize: '0.95em' }}>
          🗺️ REGIONAL COORDINATE DECK // SECTOR OBJECTIVES
        </h3>
        <span style={{ fontSize: '0.7em', color: '#8fa0ba' }}>SECTOR G6</span>
      </div>

      {/* Sector Coherence Progress Bar */}
      <div style={{ marginBottom: '12px', backgroundColor: '#0a0f1d', border: '1px solid #1a2636', padding: '10px 12px', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78em', marginBottom: '4px' }}>
          <span style={{ color: '#c5d1e0' }}>🏆 SECTOR COHERENCE:</span>
          <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>
            {coherencePercent}% Secured ({completedCount}/{landmarks.length} Nodes Locked)
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#101726', borderRadius: '2px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${coherencePercent}%`,
              height: '100%',
              backgroundColor: coherencePercent > 70 ? '#00ffcc' : '#ffaa00',
              transition: 'width 0.4s ease-in-out',
              boxShadow: '0 0 8px rgba(0, 255, 204, 0.4)'
            }}
          />
        </div>
      </div>

      {/* Objective List Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {landmarks.map((poi, idx) => {
          const distanceMeters = calculateDistance(userLat, userLon, poi.latitude, poi.longitude);
          const isWithinRange = distanceMeters <= poi.required_proximity_meters;

          return (
            <div
              key={poi.landmark_id}
              onClick={() => setActiveLoreIndex(idx)}
              style={{
                backgroundColor: '#0a0f1d',
                border: `1px solid ${poi.is_completed ? '#00ffcc' : isWithinRange ? '#00ffcc' : '#1a2636'}`,
                borderRadius: '4px',
                padding: '10px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: isWithinRange && !poi.is_completed ? '0 0 10px rgba(0, 255, 204, 0.2)' : 'none',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ fontSize: '0.82em', fontWeight: 'bold', color: poi.is_completed ? '#00ffcc' : isWithinRange ? '#00ffcc' : '#ffffff' }}>
                  {poi.is_completed ? '✓ ' : isWithinRange ? '🔓 ' : '🔒 '} {poi.title}
                </div>
                <div style={{ color: '#8fa0ba', fontSize: '0.72em', marginTop: '2px' }}>
                  TYPE: {poi.objective_type} | DIST: {distanceMeters > 1000 ? `${(distanceMeters / 1000).toFixed(2)} km` : `${distanceMeters} m`} (REQ: ≤{poi.required_proximity_meters}m)
                </div>
              </div>

              <div>
                {poi.is_completed ? (
                  <span
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'rgba(0, 255, 204, 0.15)',
                      color: '#00ffcc',
                      border: '1px solid #00ffcc',
                      borderRadius: '2px',
                      fontSize: '0.72em',
                      fontWeight: 'bold'
                    }}
                  >
                    VERIFIED
                  </span>
                ) : (
                  <button
                    disabled={!isWithinRange}
                    onClick={(e) => {
                      e.stopPropagation();
                      onExecuteObjective(poi.landmark_id);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: isWithinRange ? '#00ffcc' : '#101726',
                      color: isWithinRange ? '#0a0f1d' : '#54657d',
                      border: `1px solid ${isWithinRange ? '#00ffcc' : '#1a2636'}`,
                      borderRadius: '2px',
                      cursor: isWithinRange ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                      fontSize: '0.75em'
                    }}
                  >
                    {isWithinRange ? 'INITIALIZE' : 'TOO FAR'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lore Data Matrix & Expedition Log */}
      {landmarks[activeLoreIndex] && (
        <div
          style={{
            backgroundColor: '#0a0f1d',
            border: '1px solid #1a2636',
            borderLeft: '3px solid #ffaa00',
            padding: '10px 12px',
            borderRadius: '4px',
            marginBottom: '10px'
          }}
        >
          <div style={{ fontSize: '0.72em', color: '#ffaa00', fontWeight: 'bold', marginBottom: '3px' }}>
            📜 LORE ARCHIVE // {landmarks[activeLoreIndex].title.toUpperCase()}
          </div>
          <p style={{ margin: 0, fontSize: '0.75em', color: '#c5d1e0', lineHeight: 1.4 }}>
            "{landmarks[activeLoreIndex].lore_text_block}"
          </p>
        </div>
      )}

      {/* Scan / Lure Banner Alert */}
      {activeScanStatus && (
        <div
          style={{
            backgroundColor: 'rgba(0, 255, 204, 0.1)',
            border: '1px solid #00ffcc',
            color: '#00ffcc',
            fontSize: '0.75em',
            padding: '8px 10px',
            borderRadius: '4px',
            marginBottom: '10px'
          }}
        >
          {activeScanStatus}
        </div>
      )}

      {/* Action Portal Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button
          onClick={handleLureClick}
          style={{
            padding: '8px',
            backgroundColor: '#101726',
            color: '#c5d1e0',
            border: '1px solid #1a2636',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '0.72em',
            fontFamily: 'monospace',
            fontWeight: 'bold'
          }}
        >
          🧲 DEPLOY RADIAL FIELD LURE
        </button>
        <button
          onClick={handleScanClick}
          style={{
            padding: '8px',
            backgroundColor: '#101726',
            color: '#c5d1e0',
            border: '1px solid #1a2636',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '0.72em',
            fontFamily: 'monospace',
            fontWeight: 'bold'
          }}
        >
          📡 SCAN AREA FOR ANOMALIES
        </button>
      </div>
    </div>
  );
};
