import React, { useState } from 'react';
import { WellnessLog, CustomPin, RegionalLandmark } from '../hooks/useIndexedDB';

interface DataLogDashboardProps {
  logs: WellnessLog[];
  pins: CustomPin[];
  landmarks?: RegionalLandmark[];
  onClearLogs?: () => void;
  onDeletePin?: (pinId: string) => void;
  onTransformPin?: (pinId: string, customTitle?: string) => void;
  isEncryptedView?: boolean;
  onLockStorage?: () => void;
}

export const DataLogDashboard: React.FC<DataLogDashboardProps> = ({
  logs,
  pins,
  landmarks = [],
  onClearLogs,
  onDeletePin,
  onTransformPin,
  isEncryptedView = false,
  onLockStorage,
}) => {
  const [activeTab, setActiveTab] = useState<'WELLNESS' | 'PINS' | 'LANDMARKS'>('WELLNESS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredLogs = logs.filter((log) =>
    log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPins = pins.filter((pin) =>
    pin.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '16px 20px', backgroundColor: '#060a13', borderTop: '1px solid #1a2636', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <h3 style={{ color: '#00ffcc', margin: 0, fontSize: '0.95em' }}>
            📦 LOCAL STORAGE METRICS // INDEXEDDB DECK
          </h3>
          <span style={{ fontSize: '0.68em', color: '#8fa0ba' }}>
            BROWSER MEMORY VAULT // {isEncryptedView ? '🔒 AES-GCM ENCRYPTED' : 'UNENCRYPTED DISK'}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('WELLNESS')}
            style={{
              padding: '4px 8px',
              fontSize: '0.72em',
              backgroundColor: activeTab === 'WELLNESS' ? '#00ffcc' : '#101726',
              color: activeTab === 'WELLNESS' ? '#0a0f1d' : '#8fa0ba',
              border: '1px solid #1a2636',
              cursor: 'pointer',
              fontWeight: 'bold',
              borderRadius: '2px'
            }}
          >
            ROUTINES ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('PINS')}
            style={{
              padding: '4px 8px',
              fontSize: '0.72em',
              backgroundColor: activeTab === 'PINS' ? '#00ffcc' : '#101726',
              color: activeTab === 'PINS' ? '#0a0f1d' : '#8fa0ba',
              border: '1px solid #1a2636',
              cursor: 'pointer',
              fontWeight: 'bold',
              borderRadius: '2px'
            }}
          >
            PINS ({pins.length})
          </button>
          <button
            onClick={() => setActiveTab('LANDMARKS')}
            style={{
              padding: '4px 8px',
              fontSize: '0.72em',
              backgroundColor: activeTab === 'LANDMARKS' ? '#00ffcc' : '#101726',
              color: activeTab === 'LANDMARKS' ? '#0a0f1d' : '#8fa0ba',
              border: '1px solid #1a2636',
              cursor: 'pointer',
              fontWeight: 'bold',
              borderRadius: '2px'
            }}
          >
            NODES ({landmarks.length})
          </button>
        </div>
      </div>

      {/* Search and control filter line */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Filter stored records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '4px 8px',
            backgroundColor: '#0a0f1d',
            border: '1px solid #1a2636',
            borderRadius: '3px',
            color: '#ffffff',
            fontSize: '0.72em',
            fontFamily: 'monospace',
            outline: 'none'
          }}
        />
        {activeTab === 'WELLNESS' && logs.length > 0 && onClearLogs && (
          <button
            onClick={onClearLogs}
            style={{
              padding: '4px 8px',
              backgroundColor: 'rgba(255, 0, 51, 0.1)',
              color: '#ff0033',
              border: '1px solid #ff0033',
              borderRadius: '2px',
              fontSize: '0.68em',
              cursor: 'pointer'
            }}
          >
            PURGE LOGS
          </button>
        )}
        {onLockStorage && (
          <button
            onClick={onLockStorage}
            style={{
              padding: '4px 8px',
              backgroundColor: '#101726',
              color: '#ffaa00',
              border: '1px solid #1a2636',
              borderRadius: '2px',
              fontSize: '0.68em',
              cursor: 'pointer'
            }}
          >
            🔒 LOCK
          </button>
        )}
      </div>

      {/* Main Records Log Window */}
      <div
        style={{
          height: '175px',
          overflowY: 'auto',
          backgroundColor: '#0a0f1d',
          border: '1px solid #1a2636',
          borderRadius: '4px',
          padding: '8px 12px'
        }}
      >
        {activeTab === 'WELLNESS' ? (
          filteredLogs.length === 0 ? (
            <div style={{ color: '#8fa0ba', fontSize: '0.8em', textAlign: 'center', paddingTop: '65px' }}>
              NO LOCAL WELLNESS LOGS RECORDED
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  borderBottom: '1px solid #1a2636',
                  padding: '6px 0',
                  fontSize: '0.78em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>▶ {log.type}</span>
                  {log.encrypted && (
                    <span style={{ marginLeft: '6px', fontSize: '0.7em', color: '#ffaa00', border: '1px solid #ffaa00', padding: '1px 3px', borderRadius: '2px' }}>
                      AES-GCM
                    </span>
                  )}
                  <br />
                  <span style={{ color: '#8fa0ba', fontSize: '0.85em' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div style={{ textAlign: 'right', color: '#ffffff' }}>
                  <span>❤️ {log.heartRateBefore} ➔ {log.heartRateAfter} BPM</span>
                  {log.hrvBefore !== undefined && log.hrvAfter !== undefined && (
                    <div style={{ fontSize: '0.85em', color: '#8fa0ba' }}>
                      HRV: {log.hrvBefore}ms ➔ {log.hrvAfter}ms
                    </div>
                  )}
                </div>
              </div>
            ))
          )
        ) : activeTab === 'PINS' ? (
          filteredPins.length === 0 ? (
            <div style={{ color: '#8fa0ba', fontSize: '0.8em', textAlign: 'center', paddingTop: '65px' }}>
              NO CUSTOM COORDINATE PINS STORED
            </div>
          ) : (
            filteredPins.map((pin) => (
              <div
                key={pin.id}
                style={{
                  borderBottom: '1px solid #1a2636',
                  padding: '6px 0',
                  fontSize: '0.78em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ color: '#ff0033', fontWeight: 'bold' }}>📍 {pin.label}</span>
                  <br />
                  <span style={{ color: '#8fa0ba', fontSize: '0.85em' }}>
                    LAT: {pin.latitude.toFixed(4)} | LON: {pin.longitude.toFixed(4)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {onTransformPin && (
                    <button
                      onClick={() => onTransformPin(pin.id, `Beacon: ${pin.label}`)}
                      title="Promote pin to active regional landmark objective"
                      style={{
                        padding: '3px 6px',
                        backgroundColor: '#101726',
                        color: '#00ffcc',
                        border: '1px solid #00ffcc',
                        borderRadius: '2px',
                        fontSize: '0.68em',
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ PROMOTE
                    </button>
                  )}
                  {onDeletePin && (
                    <button
                      onClick={() => onDeletePin(pin.id)}
                      style={{
                        padding: '3px 6px',
                        backgroundColor: 'transparent',
                        color: '#ff0033',
                        border: '1px solid #1a2636',
                        borderRadius: '2px',
                        fontSize: '0.68em',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))
          )
        ) : (
          landmarks.length === 0 ? (
            <div style={{ color: '#8fa0ba', fontSize: '0.8em', textAlign: 'center', paddingTop: '65px' }}>
              NO ACTIVE REGIONAL LANDMARKS
            </div>
          ) : (
            landmarks.map((poi) => (
              <div
                key={poi.landmark_id}
                style={{
                  borderBottom: '1px solid #1a2636',
                  padding: '6px 0',
                  fontSize: '0.78em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ color: poi.is_completed ? '#00ffcc' : '#ffffff', fontWeight: 'bold' }}>
                    {poi.is_completed ? '✓ ' : '🔷 '} {poi.title}
                  </span>
                  <br />
                  <span style={{ color: '#8fa0ba', fontSize: '0.82em' }}>
                    {poi.objective_type} • LAT: {poi.latitude.toFixed(4)} | LON: {poi.longitude.toFixed(4)}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.7em',
                    padding: '2px 5px',
                    borderRadius: '2px',
                    backgroundColor: poi.is_completed ? 'rgba(0, 255, 204, 0.15)' : '#101726',
                    color: poi.is_completed ? '#00ffcc' : '#8fa0ba',
                    border: `1px solid ${poi.is_completed ? '#00ffcc' : '#1a2636'}`
                  }}
                >
                  {poi.is_completed ? 'SEALED' : 'OPEN'}
                </span>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
