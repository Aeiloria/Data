import React, { useState } from 'react';
import { openDB } from 'idb';

interface BenchmarkResult {
  operation: string;
  totalCount: number;
  totalDurationMs: number;
  avgDurationPerOpMs: number;
  operationsPerSecond: number;
}

export const PerfTesterDeck: React.FC = () => {
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const runIndexedDBPerformanceSuite = async (): Promise<BenchmarkResult[]> => {
    const dbName = `GridGuardian_PerfTest_${Date.now()}`;
    const db = await openDB(dbName, 1, {
      upgrade(dbInstance) {
        dbInstance.createObjectStore('custom_pins', { keyPath: 'id' });
        dbInstance.createObjectStore('regional_landmarks', { keyPath: 'landmark_id' });
      },
    });

    const results: BenchmarkResult[] = [];
    const BATCH_SIZE = 250;

    // PHASE 1: BULK ASYNCHRONOUS WRITES
    const startWrite = performance.now();
    const writeTx = db.transaction('custom_pins', 'readwrite');
    const store = writeTx.objectStore('custom_pins');

    for (let i = 0; i < BATCH_SIZE; i++) {
      store.put({
        id: `pin-perf-${i}`,
        label: `Automated Test Node Marker #${i}`,
        latitude: 31.4351 + Math.random() * 0.01,
        longitude: -97.7439 + Math.random() * 0.01,
        droppedAt: new Date().toISOString()
      });
    }

    await writeTx.done;
    const endWrite = performance.now();
    const writeDuration = endWrite - startWrite;

    results.push({
      operation: 'Bulk Asynchronous Writes',
      totalCount: BATCH_SIZE,
      totalDurationMs: parseFloat(writeDuration.toFixed(2)),
      avgDurationPerOpMs: parseFloat((writeDuration / BATCH_SIZE).toFixed(4)),
      operationsPerSecond: Math.round((BATCH_SIZE / (writeDuration / 1000)))
    });

    // PHASE 2: ATOMIC COLLECTION UPGRADES & MIGRATIONS
    const startUpgrade = performance.now();
    const upgradeTx = db.transaction(['custom_pins', 'regional_landmarks'], 'readwrite');
    const pinsStore = upgradeTx.objectStore('custom_pins');
    const landmarksStore = upgradeTx.objectStore('regional_landmarks');

    for (let i = 0; i < BATCH_SIZE; i++) {
      const pinId = `pin-perf-${i}`;
      landmarksStore.put({
        landmark_id: `poi-transformed-${pinId}`,
        title: `Upgraded Automated Signet #${i}`,
        objective_type: 'ENERGY_STABILIZATION',
        latitude: 31.4351,
        longitude: -97.7439,
        required_proximity_meters: 100,
        synchronized_at: new Date().toISOString()
      });
      pinsStore.delete(pinId);
    }

    await upgradeTx.done;
    const endUpgrade = performance.now();
    const upgradeDuration = endUpgrade - startUpgrade;

    results.push({
      operation: 'Atomic Node Migrations',
      totalCount: BATCH_SIZE,
      totalDurationMs: parseFloat(upgradeDuration.toFixed(2)),
      avgDurationPerOpMs: parseFloat((upgradeDuration / BATCH_SIZE).toFixed(4)),
      operationsPerSecond: Math.round((BATCH_SIZE / (upgradeDuration / 1000)))
    });

    // Clean up temporary performance testing database
    db.close();
    indexedDB.deleteDatabase(dbName);

    return results;
  };

  const executeDiagnostics = async () => {
    setIsRunning(true);
    try {
      const report = await runIndexedDBPerformanceSuite();
      setBenchmarks(report);
    } catch (err) {
      console.error('Performance array testing error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ padding: '16px 20px', backgroundColor: '#060a13', borderTop: '1px solid #1a2636', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <h3 style={{ color: '#00ffcc', margin: 0, fontSize: '0.95em' }}>
          ⚡ HARDWARE DIAGNOSTICS // INDEXEDDB SPEED BENCHMARK
        </h3>
        <span style={{ fontSize: '0.68em', color: '#8fa0ba' }}>W3C PERF API</span>
      </div>

      <p style={{ color: '#8fa0ba', fontSize: '0.75em', margin: '0 0 10px 0', lineHeight: 1.4 }}>
        Run sub-millisecond execution stress tests against your device database memory to evaluate write throughput and atomic migrations.
      </p>

      {benchmarks.length > 0 && (
        <div style={{ marginBottom: '10px', backgroundColor: '#0a0f1d', border: '1px solid #1a2636', borderRadius: '4px', padding: '8px 10px' }}>
          {benchmarks.map((res, i) => (
            <div
              key={i}
              style={{
                borderBottom: i !== benchmarks.length - 1 ? '1px solid #1a2636' : 'none',
                padding: '6px 0',
                fontSize: '0.75em',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>▶ {res.operation}</span>
                <div style={{ color: '#8fa0ba', fontSize: '0.9em' }}>
                  Count: {res.totalCount} ops • Latency: {res.avgDurationPerOpMs} ms/op
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#ffaa00' }}>{res.totalDurationMs} ms</span>
                <div style={{ color: '#00ffcc', fontWeight: 'bold' }}>
                  {res.operationsPerSecond.toLocaleString()} ops/sec
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={executeDiagnostics}
        disabled={isRunning}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: isRunning ? '#101726' : 'rgba(0,255,204,0.1)',
          color: isRunning ? '#8fa0ba' : '#00ffcc',
          border: '1px solid #00ffcc',
          borderRadius: '4px',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          fontSize: '0.78em',
          transition: 'all 0.2s ease'
        }}
      >
        {isRunning ? '⏳ SIMULATING SECTOR SURGE INLOAD...' : '🔥 INITIATE HARDWARE SPEED BENCHMARK'}
      </button>
    </div>
  );
};
