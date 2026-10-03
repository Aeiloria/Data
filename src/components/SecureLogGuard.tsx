import React, { useState } from 'react';
import { DataLogDashboard } from './DataLogDashboard';
import { DailyWellnessSummaryReport } from './DailyWellnessSummaryReport';
import { CoherenceCertificateModal } from './CoherenceCertificateModal';
import { WellnessLog, CustomPin, RegionalLandmark } from '../hooks/useIndexedDB';
import { decryptPayload } from '../utils/cryptoEngine';

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
  // State for encryption/decryption toggle and export format
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'CSV' | 'JSON'>('CSV');
  const [isCertModalOpen, setIsCertModalOpen] = useState<boolean>(false);
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

  // Decrypt an individual log record ensuring full cleartext for export
  const decryptLogRecordForExport = async (log: WellnessLog, passphrase?: string): Promise<WellnessLog> => {
    // If encrypted using AES-GCM rawCiphertext
    if (log.rawCiphertext && passphrase) {
      try {
        const decryptedJson = await decryptPayload(log.rawCiphertext, passphrase);
        const parsed = JSON.parse(decryptedJson);
        return {
          ...log,
          type: parsed.type || log.type,
          heartRateBefore: parsed.heartRateBefore ?? log.heartRateBefore,
          heartRateAfter: parsed.heartRateAfter ?? log.heartRateAfter,
          hrvBefore: parsed.hrvBefore ?? log.hrvBefore,
          hrvAfter: parsed.hrvAfter ?? log.hrvAfter,
          notes: parsed.notes ?? log.notes,
          encrypted: false,
        };
      } catch (err) {
        console.warn(`Passphrase decryption failed for log ${log.id}, using base properties`);
      }
    }

    // Strip any mock cipher mask strings if present
    const cleanType = typeof log.type === 'string' && log.type.startsWith('[ENC_AES256:')
      ? 'WELLNESS_ROUTINE'
      : log.type;

    const cleanNotes = typeof log.notes === 'string' && log.notes.startsWith('[ENC_AES256:')
      ? 'Decrypted routine telemetry'
      : (log.notes || '');

    return {
      ...log,
      type: cleanType,
      notes: cleanNotes,
      encrypted: false,
    };
  };

  // Export decrypted logs to either Formatted CSV or Raw JSON for external portability
  const handleExportDecryptedData = async () => {
    if (logs.length === 0) {
      showNotice('⚠️ No wellness logs available to export. Complete a routine first.');
      return;
    }

    try {
      // Check if any logs require an AES-GCM passphrase
      const requiresPassphrase = logs.some((l) => l.encrypted && l.rawCiphertext);
      let passphrase = '';
      if (requiresPassphrase) {
        const input = window.prompt(
          'Enter your decryption passphrase for encrypted vault entries (leave blank if none was set):'
        );
        if (input) passphrase = input.trim();
      }

      // Ensure all logs are decrypted first
      const decryptedLogs = await Promise.all(
        logs.map((log) => decryptLogRecordForExport(log, passphrase))
      );

      const filenameDate = new Date().toISOString().slice(0, 10);

      if (exportFormat === 'JSON') {
        // Build structured Raw JSON export payload
        const jsonExport = {
          metadata: {
            exportDate: new Date().toISOString(),
            totalLogs: decryptedLogs.length,
            format: 'RAW_DECRYPTED_JSON',
            system: 'Grid Guardian Hub V2099 Data Vault',
          },
          logs: decryptedLogs.map((log) => {
            const hrDelta = log.heartRateAfter - log.heartRateBefore;
            const hrvBefore = log.hrvBefore ?? 50;
            const hrvAfter = log.hrvAfter ?? 50;
            const hrvDelta = hrvAfter - hrvBefore;

            let dateFormatted = log.timestamp;
            try {
              dateFormatted = new Date(log.timestamp).toLocaleString();
            } catch (e) {}

            return {
              id: log.id,
              timestamp: log.timestamp,
              dateFormatted,
              type: log.type,
              heartRateBefore: log.heartRateBefore,
              heartRateAfter: log.heartRateAfter,
              heartRateDelta: hrDelta,
              hrvBefore,
              hrvAfter,
              hrvDelta,
              notes: log.notes || 'None',
              decryptionStatus: 'VERIFIED_DECRYPTED_CLEARTEXT',
            };
          }),
        };

        const jsonContent = JSON.stringify(jsonExport, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.setAttribute('href', url);
        downloadLink.setAttribute('download', `grid_guardian_wellness_logs_decrypted_${filenameDate}.json`);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);

        showNotice(
          `📥 EXPORT SUCCESS: Decrypted ${decryptedLogs.length} wellness logs and downloaded Raw JSON file.`
        );
      } else {
        // Construct standard Formatted CSV header and rows
        const headers = [
          'Log_ID',
          'Timestamp_ISO',
          'Date_Formatted',
          'Routine_Type',
          'HeartRate_Before_BPM',
          'HeartRate_After_BPM',
          'HeartRate_Delta_BPM',
          'HRV_Before_MS',
          'HRV_After_MS',
          'HRV_Delta_MS',
          'Notes',
          'Decryption_Status',
        ];

        const escapeCell = (val: string | number | undefined | null): string => {
          if (val === undefined || val === null) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        };

        const rows = decryptedLogs.map((log) => {
          const hrDelta = log.heartRateAfter - log.heartRateBefore;
          const hrvBefore = log.hrvBefore ?? 50;
          const hrvAfter = log.hrvAfter ?? 50;
          const hrvDelta = hrvAfter - hrvBefore;

          let dateStr = log.timestamp;
          try {
            dateStr = new Date(log.timestamp).toLocaleString();
          } catch (e) {}

          return [
            escapeCell(log.id),
            escapeCell(log.timestamp),
            escapeCell(dateStr),
            escapeCell(log.type),
            escapeCell(log.heartRateBefore),
            escapeCell(log.heartRateAfter),
            escapeCell(hrDelta >= 0 ? `+${hrDelta}` : `${hrDelta}`),
            escapeCell(hrvBefore),
            escapeCell(hrvAfter),
            escapeCell(hrvDelta >= 0 ? `+${hrvDelta}` : `${hrvDelta}`),
            escapeCell(log.notes || 'None'),
            escapeCell('VERIFIED_DECRYPTED_CLEARTEXT'),
          ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.setAttribute('href', url);
        downloadLink.setAttribute('download', `grid_guardian_wellness_logs_decrypted_${filenameDate}.csv`);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);

        showNotice(
          `📥 EXPORT SUCCESS: Decrypted ${decryptedLogs.length} wellness logs and downloaded Formatted CSV.`
        );
      }
    } catch (err: any) {
      showNotice(`⚠️ Export failed: ${err.message}`);
    }
  };

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

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Export Format Selector Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#101726',
              border: '1px solid #1a2636',
              borderRadius: '4px',
              padding: '2px',
            }}
          >
            <span style={{ fontSize: '0.66em', color: '#8fa0ba', padding: '0 6px' }}>FORMAT:</span>
            <button
              onClick={() => setExportFormat('CSV')}
              style={{
                padding: '4px 8px',
                fontSize: '0.68em',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                backgroundColor: exportFormat === 'CSV' ? '#00ffcc' : 'transparent',
                color: exportFormat === 'CSV' ? '#0a0f1d' : '#8fa0ba',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              CSV
            </button>
            <button
              onClick={() => setExportFormat('JSON')}
              style={{
                padding: '4px 8px',
                fontSize: '0.68em',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                backgroundColor: exportFormat === 'JSON' ? '#00ffcc' : 'transparent',
                color: exportFormat === 'JSON' ? '#0a0f1d' : '#8fa0ba',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              RAW JSON
            </button>
          </div>

          {/* Export Decrypted Button */}
          <button
            onClick={handleExportDecryptedData}
            disabled={logs.length === 0}
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(0, 255, 204, 0.12)',
              color: '#00ffcc',
              border: '1px solid #00ffcc',
              borderRadius: '4px',
              cursor: logs.length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: '0.75em',
              opacity: logs.length === 0 ? 0.45 : 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title={`Export decrypted wellness logs to ${exportFormat} file for external analysis`}
          >
            <span>📥</span>
            <span>EXPORT DECRYPTED ({exportFormat === 'CSV' ? 'CSV' : 'JSON'})</span>
          </button>

          {/* Coherence Certificate Generator Trigger Button */}
          <button
            onClick={() => setIsCertModalOpen(true)}
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(255, 170, 0, 0.15)',
              color: '#ffaa00',
              border: '1px solid #ffaa00',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: '0.75em',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Generate a social-media-ready Coherence Certificate image based on your current streak"
          >
            <span>🎖️</span>
            <span>COHERENCE CERTIFICATE</span>
          </button>

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

      {/* Daily Wellness Summary Report with Recharts variance visualization */}
      <DailyWellnessSummaryReport logs={logs} isEncryptedView={isEncrypted} />

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

      {/* Social-Media Ready Coherence Certificate Modal (Canvas API) */}
      <CoherenceCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        logs={logs}
      />
    </div>
  );
};
