import React, { useState } from 'react';
import { DataLogDashboard } from './DataLogDashboard';
import { WellnessLog, CustomPin, RegionalLandmark } from '../hooks/useIndexedDB';

interface SecureLogGuardProps {
  logs: WellnessLog[];
  pins: CustomPin[];
  landmarks?: RegionalLandmark[];
  onClearLogs?: () => void;
  onClearPins?: () => void;
  onClearAllData?: () => void;
  onDeletePin?: (pinId: string) => void;
  onTransformPin?: (pinId: string, customTitle?: string) => void;
  onSaveLog?: (log: WellnessLog, secretPassphrase?: string) => void;
}

// Simple mock encryption/decryption functions for demonstrating state management
const mockEncryptString = (text: string): string => {
  try {
    const encoded = btoa(text);
    return `[ENC_AES256:${encoded.slice(0, 8)}..${encoded.slice(-4)}]`;
  } catch (e) {
    return `[ENC_AES256:7f8a9b2c]`;
  }
};

export const SecureLogGuard: React.FC<SecureLogGuardProps> = ({
  logs,
  pins,
  landmarks = [],
  onClearLogs,
  onClearPins,
  onClearAllData,
  onDeletePin,
  onTransformPin,
}) => {
  // State for encryption/decryption toggle
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (message: string) => {
    setActionNotice(message);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Toggle encryption state using mock encryption/decryption logic
  const handleToggleEncryption = () => {
    if (isEncrypted) {
      setIsEncrypted(false);
      showNotice('🔓 VAULT DECRYPTED: Displaying cleartext biometric telemetry');
    } else {
      setIsEncrypted(true);
      showNotice('🔒 VAULT ENCRYPTED: Applied mock AES-256 cipher mask across wellness logs');
    }
  };

  // Transform logs based on current encryption state
  const displayedLogs: WellnessLog[] = isEncrypted
    ? logs.map((log) => ({
        ...log,
        type: mockEncryptString(log.type),
        notes: log.notes ? mockEncryptString(log.notes) : undefined,
        encrypted: true,
      }))
    : logs.map((log) => ({
        ...log,
        encrypted: false,
      }));

  return (
    <div style={{ backgroundColor: '#060a13', borderTop: '1px solid #1a2636', fontFamily: 'monospace' }}>
      {/* Data Vault Header Bar */}
      <div
        style={{
          padding: '14px 20px',
          backgroundColor: '#0a0f1d',
          borderBottom: '1px solid #1a2636',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2em' }}>{isEncrypted ? '🔒' : '🔓'}</span>
            <h3 style={{ color: '#00ffcc', margin: 0, fontSize: '0.98em', letterSpacing: '0.5px' }}>
              DATA VAULT // LOCAL STORAGE SECURITY
            </h3>
          </div>
          <div style={{ fontSize: '0.7em', color: '#8fa0ba', marginTop: '3px' }}>
            CIPHER STATUS: <span style={{ color: isEncrypted ? '#ffaa00' : '#00ffcc', fontWeight: 'bold' }}>
              {isEncrypted ? 'ENCRYPTED (MOCK AES-256)' : 'DECRYPTED (CLEARTEXT)'}
            </span> • {logs.length} ROUTINES • {pins.length} PINS STORED
          </div>
        </div>

        {/* Encryption/Decryption Action Trigger */}
        <button
          onClick={handleToggleEncryption}
          style={{
            padding: '6px 14px',
            backgroundColor: isEncrypted ? '#101726' : 'rgba(0, 255, 204, 0.12)',
            color: isEncrypted ? '#ffaa00' : '#00ffcc',
            border: `1px solid ${isEncrypted ? '#ffaa00' : '#00ffcc'}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            fontSize: '0.75em',
            transition: 'all 0.2s ease'
          }}
        >
          {isEncrypted ? '🔓 DECRYPT WELLNESS LOGS' : '🔒 ENCRYPT WELLNESS LOGS'}
        </button>
      </div>

      {/* Action Confirmation Banner */}
      {actionNotice && (
        <div
          style={{
            backgroundColor: 'rgba(0, 255, 204, 0.15)',
            borderBottom: '1px solid #00ffcc',
            color: '#00ffcc',
            padding: '8px 20px',
            fontSize: '0.75em',
            textAlign: 'center',
            fontWeight: 'bold'
          }}
        >
          {actionNotice}
        </div>
      )}

      {/* Embedded DataLogDashboard View */}
      <DataLogDashboard
        logs={displayedLogs}
        pins={pins}
        landmarks={landmarks}
        onClearLogs={() => {
          if (onClearLogs) {
            onClearLogs();
            showNotice('🗑️ Cleared wellness logs from IndexedDB');
          }
        }}
        onDeletePin={(pinId) => {
          if (onDeletePin) {
            onDeletePin(pinId);
            showNotice(`📍 Deleted pin ${pinId}`);
          }
        }}
        onTransformPin={(pinId, customTitle) => {
          if (onTransformPin) {
            onTransformPin(pinId, customTitle);
            showNotice('⚡ Upgraded pin into active regional landmark');
          }
        }}
        isEncryptedView={isEncrypted}
      />

      {/* Clear Data Action Controls Tray */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #1a2636',
          backgroundColor: '#04070e',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <span style={{ fontSize: '0.7em', color: '#54657d', fontWeight: 'bold' }}>
          CLEAR DATA ACTIONS:
        </span>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {onClearLogs && (
            <button
              onClick={() => {
                if (window.confirm('Clear all historical wellness routine logs from local IndexedDB?')) {
                  onClearLogs();
                  showNotice('🗑️ All wellness logs purged from device memory');
                }
              }}
              style={{
                padding: '4px 10px',
                backgroundColor: '#101726',
                color: '#ffaa00',
                border: '1px solid #1a2636',
                borderRadius: '3px',
                fontSize: '0.7em',
                fontFamily: 'monospace',
                cursor: 'pointer'
              }}
            >
              Clear Routines ({logs.length})
            </button>
          )}

          {onClearPins && (
            <button
              onClick={() => {
                if (window.confirm('Clear all custom coordinate map pins from local IndexedDB?')) {
                  onClearPins();
                  showNotice('📍 All custom pins deleted from device memory');
                }
              }}
              style={{
                padding: '4px 10px',
                backgroundColor: '#101726',
                color: '#ffaa00',
                border: '1px solid #1a2636',
                borderRadius: '3px',
                fontSize: '0.7em',
                fontFamily: 'monospace',
                cursor: 'pointer'
              }}
            >
              Clear Pins ({pins.length})
            </button>
          )}

          {onClearAllData && (
            <button
              onClick={() => {
                if (window.confirm('CRITICAL: Purge entire local IndexedDB state (all routines & pins)?')) {
                  onClearAllData();
                  showNotice('⚠️ Entire local IndexedDB state reset to zero');
                }
              }}
              style={{
                padding: '4px 10px',
                backgroundColor: 'rgba(255, 0, 51, 0.12)',
                color: '#ff0033',
                border: '1px solid #ff0033',
                borderRadius: '3px',
                fontSize: '0.7em',
                fontFamily: 'monospace',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ⚠️ Purge Entire IndexedDB
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
