import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          fontSize: '0.72em',
          backgroundColor: '#00ffcc',
          color: '#0a0f1d',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontFamily: 'monospace'
        }}
      >
        <span>⬇️</span>
        INSTALL PWA
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            fontSize: '0.72em',
            backgroundColor: '#101726',
            color: '#00ffcc',
            border: '1px solid #1a2636',
            borderRadius: '3px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: 'monospace'
          }}
        >
          <span>📱</span>
          INSTALL ON IOS
        </button>

        {showIOSGuide && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '360px',
                backgroundColor: '#0a0f1d',
                border: '1px solid #00ffcc',
                borderRadius: '8px',
                padding: '20px',
                fontFamily: 'monospace',
                color: '#ffffff'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', color: '#00ffcc', fontSize: '1.05em' }}>
                INSTALL ON IPHONE / IPAD
              </h3>
              <p style={{ margin: '0 0 14px 0', fontSize: '0.85em', color: '#c5d1e0', lineHeight: 1.5 }}>
                1. Tap the <strong>Share</strong> button in Safari toolbar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#00ffcc',
                  color: '#0a0f1d',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
