import React, { useEffect, useState } from 'react';

export const PwaUpdatePrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;

        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setShowPrompt(true);
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(reg.waiting);
              setShowPrompt(true);
            }
          });
        });
      });
    }
  }, []);

  const handleExecuteUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowPrompt(false);
    } else {
      window.location.reload();
    }
  };

  if (!showPrompt) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 40px)',
        maxWidth: '560px',
        backgroundColor: '#0a0f1d',
        border: '2px solid #00ffcc',
        borderRadius: '4px',
        boxShadow: '0 0 25px rgba(0, 255, 204, 0.35)',
        padding: '16px',
        zIndex: 9999,
        fontFamily: 'monospace',
        color: '#ffffff'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: '#00ffcc', fontSize: '0.95em' }}>
            🛰️ SYSTEM MATRIX UPDATE DOWNLOADED
          </h4>
          <p style={{ margin: 0, fontSize: '0.8em', color: '#8fa0ba', lineHeight: 1.4 }}>
            A newer operational deployment layout is ready in the service worker cache. Re-calibrate device memory now.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowPrompt(false)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              color: '#8fa0ba',
              border: '1px solid #1a2636',
              borderRadius: '2px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '0.78em'
            }}
          >
            DISMISS
          </button>
          <button
            onClick={handleExecuteUpdate}
            style={{
              padding: '6px 16px',
              backgroundColor: '#00ffcc',
              color: '#0a0f1d',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: '0.78em'
            }}
          >
            🔄 EXECUTE RELOAD
          </button>
        </div>
      </div>
    </div>
  );
};
