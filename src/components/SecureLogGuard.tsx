import React, { useState } from 'react';
import { DataLogDashboard } from './DataLogDashboard';
import { decryptPayload } from '../utils/cryptoEngine';
import { WellnessLog, CustomPin, RegionalLandmark } from '../hooks/useIndexedDB';

interface SecureGuardProps {
  logs: WellnessLog[];
  pins: CustomPin[];
  landmarks?: RegionalLandmark[];
  onClearLogs?: () => void;
  onDeletePin?: (pinId: string) => void;
  onTransformPin?: (pinId: string, customTitle?: string) => void;
}

export const SecureLogGuard: React.FC<SecureGuardProps> = ({
  logs,
  pins,
  landmarks = [],
  onClearLogs,
  onDeletePin,
  onTransformPin
}) => {
  const [passphrasePin, setPassphrasePin] = useState<string>('1212');
  const [decryptedLogs, setDecryptedLogs] = useState<WellnessLog[]>([]);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  // Check if any logs actually have encrypted payloads
  const hasEncryptedLogs = logs.some((l) => l.encrypted && l.rawCiphertext);

  const handleAttemptStorageUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!passphrasePin || passphrasePin.length < 4) {
      setErrorMessage('Verification token PIN must be at least 4 digits');
      return;
    }

    setIsDecrypting(true);

    try {
      // If no encrypted logs, unlock immediately
      if (!hasEncryptedLogs) {
        setDecryptedLogs(logs);
        setIsUnlocked(true);
        setIsDecrypting(false);
        return;
      }

      const unpackedBuffer: WellnessLog[] = [];

      for (const log of logs) {
        if (log.encrypted && log.rawCiphertext) {
          try {
            const clearText = await decryptPayload(log.rawCiphertext, passphrasePin);
            const parsed = JSON.parse(clearText);
            unpackedBuffer.push({
              ...log,
              type: parsed.type || log.type,
              heartRateBefore: parsed.heartRateBefore ?? log.heartRateBefore,
              heartRateAfter: parsed.heartRateAfter ?? log.heartRateAfter,
              hrvBefore: parsed.hrvBefore ?? log.hrvBefore,
              hrvAfter: parsed.hrvAfter ?? log.hrvAfter,
              notes: parsed.notes ?? log.notes,
            });
          } catch (decryptErr) {
            throw new Error('Invalid passphrase or corrupted cipher payload');
          }
        } else {
          unpackedBuffer.push(log);
        }
      }

      setDecryptedLogs(unpackedBuffer);
      setIsUnlocked(true);
    } catch (err: any) {
      setErrorMessage('🛑 DECRYPTION FAULT: INVALID ACCESS TOKEN SIGNATURE');
    } finally {
      setIsDecrypting(false);
    }
  };

  if (isUnlocked) {
    return (
      <DataLogDashboard
        logs={decryptedLogs.length > 0 ? decryptedLogs : logs}
        pins={pins}
        landmarks={landmarks}
        onClearLogs={onClearLogs}
        onDeletePin={onDeletePin}
        onTransformPin={onTransformPin}
        isEncryptedView={hasEncryptedLogs}
        onLockStorage={() => setIsUnlocked(false)}
      />
    );
  }

  return (
    <div style={{ padding: '16px 20px', backgroundColor: '#060a13', borderTop: '1px solid #1a2636', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ color: '#ffaa00', margin: 0, fontSize: '0.95em' }}>
          🔒 DEVICE KEY RE-CALIBRATION // STENCIL VERIFICATION
        </h3>
        <span style={{ fontSize: '0.7em', color: '#8fa0ba' }}>
          {logs.length} RECORDS {hasEncryptedLogs ? '(ENCRYPTED)' : '(STANDBY)'}
        </span>
      </div>

      <p style={{ color: '#8fa0ba', fontSize: '0.75em', margin: '0 0 12px 0', lineHeight: 1.4 }}>
        Local IndexedDB transaction metrics and biometric coordinates are protected by AES-GCM encryption. Enter your operator verification PIN (default: 1212) to decrypt and inspect stored entries.
      </p>

      <form onSubmit={handleAttemptStorageUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="password"
          value={passphrasePin}
          onChange={(e) => setPassphrasePin(e.target.value)}
          placeholder="ENTER SYMMETRIC VERIFICATION PIN"
          style={{
            padding: '10px',
            backgroundColor: '#101726',
            color: '#ffffff',
            border: `1px solid ${errorMessage ? '#ff0033' : '#1a2636'}`,
            borderRadius: '4px',
            textAlign: 'center',
            fontSize: '1.1em',
            letterSpacing: '4px',
            fontFamily: 'monospace',
            outline: 'none'
          }}
        />

        {errorMessage && (
          <div style={{ color: '#ff0033', fontSize: '0.75em', textAlign: 'center', fontWeight: 'bold' }}>
            {errorMessage}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="submit"
            disabled={isDecrypting}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#ffaa00',
              color: '#0a0f1d',
              border: 'none',
              borderRadius: '4px',
              cursor: isDecrypting ? 'wait' : 'pointer',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: '0.8em',
              transition: 'all 0.2s ease'
            }}
          >
            {isDecrypting ? '⏳ COMPUTING AES-GCM DECRYPT...' : '🔓 EXECUTE COHERENCE DECRYPTION UNLOCK'}
          </button>

          <button
            type="button"
            onClick={() => {
              setDecryptedLogs(logs);
              setIsUnlocked(true);
            }}
            style={{
              padding: '10px 14px',
              backgroundColor: '#101726',
              color: '#8fa0ba',
              border: '1px solid #1a2636',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75em',
              fontFamily: 'monospace'
            }}
          >
            BYPASS (PLAIN)
          </button>
        </div>
      </form>
    </div>
  );
};
