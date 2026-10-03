import React, { useState } from 'react';
import { WellnessLog } from '../hooks/useIndexedDB';

interface BiometricChartProps {
  logs: WellnessLog[];
  currentHeartRate: number;
  currentHrv: number;
}

export const BiometricChart: React.FC<BiometricChartProps> = ({
  logs,
  currentHeartRate,
  currentHrv,
}) => {
  const [metricMode, setMetricMode] = useState<'HEART_RATE' | 'HRV' | 'BOTH'>('BOTH');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string } | null>(null);

  // Generate combined data series: historical logs + current live point
  const historicalPoints = logs
    .slice(-12)
    .map((log, idx) => ({
      time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hrBefore: log.heartRateBefore,
      hrAfter: log.heartRateAfter,
      hrv: log.hrvAfter || (log.heartRateAfter > 85 ? 38 : 58),
      label: `${log.type} (${log.heartRateBefore} ➔ ${log.heartRateAfter} BPM)`
    }));

  // Append live telemetry point
  const allPoints = [
    ...historicalPoints,
    {
      time: 'LIVE',
      hrBefore: currentHeartRate,
      hrAfter: currentHeartRate,
      hrv: currentHrv,
      label: `LIVE STREAM: ${currentHeartRate} BPM, ${currentHrv} ms HRV`
    }
  ];

  // SVG Chart dimensions
  const width = 520;
  const height = 130;
  const paddingX = 40;
  const paddingY = 20;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Scales
  const minHr = 50;
  const maxHr = 130;
  const minHrv = 20;
  const maxHrv = 90;

  const getX = (index: number) => {
    if (allPoints.length <= 1) return paddingX + chartWidth / 2;
    return paddingX + (index / (allPoints.length - 1)) * chartWidth;
  };

  const getHrY = (hr: number) => {
    const clamped = Math.max(minHr, Math.min(maxHr, hr));
    return paddingY + chartHeight - ((clamped - minHr) / (maxHr - minHr)) * chartHeight;
  };

  const getHrvY = (hrv: number) => {
    const clamped = Math.max(minHrv, Math.min(maxHrv, hrv));
    return paddingY + chartHeight - ((clamped - minHrv) / (maxHrv - minHrv)) * chartHeight;
  };

  // Build SVG path strings
  const hrPath = allPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getHrY(p.hrAfter)}`)
    .join(' ');

  const hrvPath = allPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getHrvY(p.hrv)}`)
    .join(' ');

  return (
    <div style={{ padding: '16px 20px', backgroundColor: '#060a13', borderTop: '1px solid #1a2636', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h3 style={{ color: '#00ffcc', margin: 0, fontSize: '0.95em' }}>
            📈 BIOMETRIC TIMELINE GRAPH // VECTOR COHERENCE CURVE
          </h3>
          <span style={{ fontSize: '0.68em', color: '#8fa0ba' }}>
            CHRONOLOGICAL HR (BPM) & HRV (MS) INTERPOLATION
          </span>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setMetricMode('HEART_RATE')}
            style={{
              padding: '3px 6px',
              fontSize: '0.7em',
              backgroundColor: metricMode === 'HEART_RATE' ? '#ff0033' : '#101726',
              color: metricMode === 'HEART_RATE' ? '#ffffff' : '#8fa0ba',
              border: '1px solid #1a2636',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            HR (❤️)
          </button>
          <button
            onClick={() => setMetricMode('HRV')}
            style={{
              padding: '3px 6px',
              fontSize: '0.7em',
              backgroundColor: metricMode === 'HRV' ? '#00ffcc' : '#101726',
              color: metricMode === 'HRV' ? '#0a0f1d' : '#8fa0ba',
              border: '1px solid #1a2636',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            HRV (⚡)
          </button>
          <button
            onClick={() => setMetricMode('BOTH')}
            style={{
              padding: '3px 6px',
              fontSize: '0.7em',
              backgroundColor: metricMode === 'BOTH' ? 'rgba(0,255,204,0.15)' : '#101726',
              color: metricMode === 'BOTH' ? '#00ffcc' : '#8fa0ba',
              border: '1px solid #00ffcc',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            BOTH
          </button>
        </div>
      </div>

      {/* SVG Canvas Chart */}
      <div style={{ position: 'relative', border: '1px solid #1a2636', borderRadius: '4px', backgroundColor: '#0a0f1d', padding: '6px 0' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '130px', display: 'block' }}>
          {/* Horizontal Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#1a2636" strokeDasharray="3 3" />
          <line x1={paddingX} y1={paddingY + chartHeight / 2} x2={width - paddingX} y2={paddingY + chartHeight / 2} stroke="#1a2636" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#1a2636" />

          {/* Stress Threshold Baseline Line (HR = 85 BPM) */}
          {(metricMode === 'HEART_RATE' || metricMode === 'BOTH') && (
            <line
              x1={paddingX}
              y1={getHrY(85)}
              x2={width - paddingX}
              y2={getHrY(85)}
              stroke="rgba(255, 0, 51, 0.35)"
              strokeDasharray="4 2"
              strokeWidth="1"
            />
          )}

          {/* HRV Optimal Baseline Line (HRV = 50 ms) */}
          {(metricMode === 'HRV' || metricMode === 'BOTH') && (
            <line
              x1={paddingX}
              y1={getHrvY(50)}
              x2={width - paddingX}
              y2={getHrvY(50)}
              stroke="rgba(0, 255, 204, 0.35)"
              strokeDasharray="4 2"
              strokeWidth="1"
            />
          )}

          {/* Heart Rate Plot Line */}
          {(metricMode === 'HEART_RATE' || metricMode === 'BOTH') && (
            <>
              <path d={hrPath} fill="none" stroke="#ff0033" strokeWidth="2" filter="drop-shadow(0px 0px 4px rgba(255,0,51,0.6))" />
              {allPoints.map((p, i) => (
                <circle
                  key={`hr-${i}`}
                  cx={getX(i)}
                  cy={getHrY(p.hrAfter)}
                  r={i === allPoints.length - 1 ? 4 : 3}
                  fill={i === allPoints.length - 1 ? '#ffffff' : '#ff0033'}
                  stroke="#ff0033"
                  strokeWidth="1.5"
                  onMouseEnter={() => setHoveredPoint({ x: getX(i), y: getHrY(p.hrAfter), label: `HR: ${p.hrAfter} BPM @ ${p.time}` })}
                  onMouseLeave={() => setHoveredPoint(null)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </>
          )}

          {/* HRV Plot Line */}
          {(metricMode === 'HRV' || metricMode === 'BOTH') && (
            <>
              <path d={hrvPath} fill="none" stroke="#00ffcc" strokeWidth="2" filter="drop-shadow(0px 0px 4px rgba(0,255,204,0.6))" />
              {allPoints.map((p, i) => (
                <circle
                  key={`hrv-${i}`}
                  cx={getX(i)}
                  cy={getHrvY(p.hrv)}
                  r={i === allPoints.length - 1 ? 4 : 3}
                  fill={i === allPoints.length - 1 ? '#ffffff' : '#00ffcc'}
                  stroke="#00ffcc"
                  strokeWidth="1.5"
                  onMouseEnter={() => setHoveredPoint({ x: getX(i), y: getHrvY(p.hrv), label: `HRV: ${p.hrv} ms @ ${p.time}` })}
                  onMouseLeave={() => setHoveredPoint(null)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </>
          )}

          {/* X-Axis Time Ticks */}
          {allPoints.map((p, i) => (
            <text
              key={`tick-${i}`}
              x={getX(i)}
              y={height - 5}
              fill="#8fa0ba"
              fontSize="7.5"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {p.time}
            </text>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
              transform: 'translate(-50%, -120%)',
              backgroundColor: '#060a13',
              border: '1px solid #00ffcc',
              padding: '2px 6px',
              borderRadius: '2px',
              fontSize: '0.68em',
              color: '#ffffff',
              pointerEvents: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            {hoveredPoint.label}
          </div>
        )}
      </div>

      {/* Legend & Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.7em', color: '#8fa0ba' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ color: '#ff0033' }}>● Heart Rate (Stress threshold: 85 BPM)</span>
          <span style={{ color: '#00ffcc' }}>● HRV (Target coherence: &gt;50 ms)</span>
        </div>
        <span>{allPoints.length} SAMPLES</span>
      </div>
    </div>
  );
};
