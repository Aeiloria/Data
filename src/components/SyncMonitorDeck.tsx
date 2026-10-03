import React, { useState, useEffect } from 'react';

export interface SyncLogItem {
  sync_id: string;
  target_platform: string;
  event_type: string;
  triggered_at: string;
  delivery_status: 'SUCCESS' | 'FAILED' | 'PENDING_RETRY';
  http_status_code: number;
}

export interface HardwareMetric {
  timestamp: string;
  cpu: number;
  ram: number;
  usedMemoryMb: number;
}

export const SyncMonitorDeck: React.FC = () => {
  const [syncHistory, setSyncHistory] = useState<SyncLogItem[]>([
    {
      sync_id: 'sync-init-001',
      target_platform: 'MONDAY_COM',
      event_type: 'GRID_ANOMALY_STATUS',
      triggered_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
      delivery_status: 'SUCCESS',
      http_status_code: 200
    },
    {
      sync_id: 'sync-init-002',
      target_platform: 'NOTION_DATASETS',
      event_type: 'WELLNESS_BIOMETRICS_LOG',
      triggered_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      delivery_status: 'SUCCESS',
      http_status_code: 200
    },
    {
      sync_id: 'sync-init-003',
      target_platform: 'DISCORD_OPS_WEBHOOK',
      event_type: 'SOLAR_FLARE_ALERT_G2',
      triggered_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      delivery_status: 'SUCCESS',
      http_status_code: 204
    }
  ]);

  const [hardware, setHardware] = useState<HardwareMetric>({
    timestamp: new Date().toISOString(),
    cpu: 18.4,
    ram: 42.1,
    usedMemoryMb: 342
  });

  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Background fluctuation simulation for CPU & RAM monitoring
  useEffect(() => {
    const hwInterval = setInterval(() => {
      setHardware((prev) => {
        const deltaCpu = (Math.random() - 0.48) * 4;
        const deltaRam = (Math.random() - 0.5) * 1.5;
        const newCpu = Math.max(8.0, Math.min(65.0, prev.cpu + deltaCpu));
        const newRam = Math.max(30.0, Math.min(85.0, prev.ram + deltaRam));
        return {
          timestamp: new Date().toISOString(),
          cpu: parseFloat(newCpu.toFixed(1)),
          ram: parseFloat(newRam.toFixed(1)),
          usedMemoryMb: Math.round(newRam * 8.2)
        };
      });
    }, 2000);

    return () => clearInterval(hwInterval);
  }, []);

  const handleManualSyncDispatch = (platform: string, eventType: string) => {
    setIsDispatching(true);
    setTimeout(() => {
      const newEntry: SyncLogItem = {
        sync_id: `sync-py-${Math.random().toString(36).substring(2, 8)}`,
        target_platform: platform,
        event_type: eventType,
        triggered_at: new Date().toISOString(),
        delivery_status: 'SUCCESS',
        http_status_code: 200
      };
      setSyncHistory((prev) => [newEntry, ...prev.slice(0, 14)]);
      setIsDispatching(false);
    }, 600);
  };

  return (
    <div style={{ padding: '16px 20px', backgroundColor: '#060a13', borderTop: '1px solid #1a2636', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <h3 style={{ color: '#00ffcc', margin: 0, fontSize: '0.95em' }}>
            📡 INTEGRATION PLATFORM SYNC MONITOR & HARDWARE LOAD
          </h3>
          <span style={{ fontSize: '0.68em', color: '#8fa0ba' }}>
            OUTBOUND WEBHOOK PIPELINES & HARDWARE TELEMETRY
          </span>
        </div>

        <button
          onClick={() => handleManualSyncDispatch('MONDAY_COM', 'USER_PULSE_HEARTBEAT')}
          disabled={isDispatching}
          style={{
            padding: '4px 8px',
            fontSize: '0.7em',
            backgroundColor: '#101726',
            color: '#00ffcc',
            border: '1px solid #00ffcc',
            borderRadius: '2px',
            cursor: isDispatching ? 'wait' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isDispatching ? 'SENDING...' : '+ DISPATCH SYNC'}
        </button>
      </div>

      {/* Hardware Load Deck (CPU & RAM) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '12px',
          backgroundColor: '#0a0f1d',
          border: '1px solid #1a2636',
          padding: '8px 12px',
          borderRadius: '4px'
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72em', color: '#c5d1e0', marginBottom: '4px' }}>
            <span>⚙️ CPU UTILIZATION</span>
            <span style={{ color: hardware.cpu > 50 ? '#ffaa00' : '#00ffcc', fontWeight: 'bold' }}>{hardware.cpu}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#101726', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${hardware.cpu}%`,
                height: '100%',
                backgroundColor: hardware.cpu > 50 ? '#ffaa00' : '#00ffcc',
                transition: 'width 0.4s ease-in-out'
              }}
            />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72em', color: '#c5d1e0', marginBottom: '4px' }}>
            <span>🧠 RAM ALLOCATION</span>
            <span style={{ color: hardware.ram > 75 ? '#ff0033' : '#00ffcc', fontWeight: 'bold' }}>{hardware.ram}% ({hardware.usedMemoryMb} MB)</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#101726', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${hardware.ram}%`,
                height: '100%',
                backgroundColor: hardware.ram > 75 ? '#ff0033' : '#00ffcc',
                transition: 'width 0.4s ease-in-out'
              }}
            />
          </div>
        </div>
      </div>

      {/* Outbound Webhook Transmission Records Window */}
      <div
        style={{
          maxHeight: '130px',
          overflowY: 'auto',
          backgroundColor: '#0a0f1d',
          border: '1px solid #1a2636',
          borderRadius: '4px',
          padding: '6px 10px'
        }}
      >
        {syncHistory.length === 0 ? (
          <div style={{ color: '#8fa0ba', fontSize: '0.8em', textAlign: 'center', paddingTop: '45px' }}>
            NO ACTIVE WEBHOOK TRANSMISSIONS RECORDED
          </div>
        ) : (
          syncHistory.map((item) => (
            <div
              key={item.sync_id}
              style={{
                borderBottom: '1px solid #1a2636',
                padding: '5px 0',
                fontSize: '0.74em',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{item.target_platform}</span>
                <span style={{ color: '#8fa0ba', marginLeft: '6px' }}>({item.event_type})</span>
                <br />
                <span style={{ color: '#54657d', fontSize: '0.88em' }}>
                  ID: {item.sync_id} • {new Date(item.triggered_at).toLocaleTimeString()}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: '2px',
                    fontSize: '0.85em',
                    fontWeight: 'bold',
                    backgroundColor: item.delivery_status === 'SUCCESS' ? 'rgba(0, 255, 204, 0.15)' : '#ff0033',
                    color: item.delivery_status === 'SUCCESS' ? '#00ffcc' : '#ffffff',
                    border: `1px solid ${item.delivery_status === 'SUCCESS' ? '#00ffcc' : '#ff0033'}`
                  }}
                >
                  HTTP_{item.http_status_code}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Target PM dispatch shortcuts */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => handleManualSyncDispatch('NOTION_DATASETS', 'TELEMETRY_SNAPSHOT')}
          style={{
            padding: '3px 8px',
            fontSize: '0.68em',
            backgroundColor: 'transparent',
            color: '#8fa0ba',
            border: '1px solid #1a2636',
            borderRadius: '2px',
            cursor: 'pointer'
          }}
        >
          + Sync Notion
        </button>
        <button
          onClick={() => handleManualSyncDispatch('DISCORD_OPS_WEBHOOK', 'SECURITY_ANOMALY_PULSE')}
          style={{
            padding: '3px 8px',
            fontSize: '0.68em',
            backgroundColor: 'transparent',
            color: '#8fa0ba',
            border: '1px solid #1a2636',
            borderRadius: '2px',
            cursor: 'pointer'
          }}
        >
          + Webhook Alert
        </button>
      </div>
    </div>
  );
};
