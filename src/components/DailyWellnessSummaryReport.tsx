import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { WellnessLog } from '../hooks/useIndexedDB';

interface DailyWellnessSummaryReportProps {
  logs: WellnessLog[];
  isEncryptedView?: boolean;
}

export const DailyWellnessSummaryReport: React.FC<DailyWellnessSummaryReportProps> = ({
  logs = [],
  isEncryptedView = false,
}) => {
  const [filterMode, setFilterMode] = useState<'TODAY_ONLY' | 'ALL_TIME'>('TODAY_ONLY');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Filter logs for today (current calendar day)
  const todayStr = useMemo(() => new Date().toDateString(), []);

  const activeLogs = useMemo(() => {
    if (filterMode === 'ALL_TIME') return logs;
    return logs.filter((log) => {
      try {
        return new Date(log.timestamp).toDateString() === todayStr;
      } catch (e) {
        return false;
      }
    });
  }, [logs, filterMode, todayStr]);

  // Aggregate daily summary statistics
  const summaryMetrics = useMemo(() => {
    if (activeLogs.length === 0) {
      return {
        count: 0,
        avgHrBefore: 0,
        avgHrAfter: 0,
        avgHrvBefore: 0,
        avgHrvAfter: 0,
        minHr: 0,
        maxHr: 0,
        minHrv: 0,
        maxHrv: 0,
        avgHrVariance: 0,
        avgHrvVariance: 0,
      };
    }

    let totalHrBefore = 0;
    let totalHrAfter = 0;
    let totalHrvBefore = 0;
    let totalHrvAfter = 0;

    let minHr = Infinity;
    let maxHr = -Infinity;
    let minHrv = Infinity;
    let maxHrv = -Infinity;

    activeLogs.forEach((l) => {
      const hrB = l.heartRateBefore || 70;
      const hrA = l.heartRateAfter || 70;
      const hrvB = l.hrvBefore ?? 55;
      const hrvA = l.hrvAfter ?? 55;

      totalHrBefore += hrB;
      totalHrAfter += hrA;
      totalHrvBefore += hrvB;
      totalHrvAfter += hrvA;

      if (hrA < minHr) minHr = hrA;
      if (hrA > maxHr) maxHr = hrA;
      if (hrvA < minHrv) minHrv = hrvA;
      if (hrvA > maxHrv) maxHrv = hrvA;
    });

    const count = activeLogs.length;
    const avgHrBefore = Math.round(totalHrBefore / count);
    const avgHrAfter = Math.round(totalHrAfter / count);
    const avgHrvBefore = Math.round(totalHrvBefore / count);
    const avgHrvAfter = Math.round(totalHrvAfter / count);

    return {
      count,
      avgHrBefore,
      avgHrAfter,
      avgHrvBefore,
      avgHrvAfter,
      minHr: minHr === Infinity ? 0 : minHr,
      maxHr: maxHr === -Infinity ? 0 : maxHr,
      minHrv: minHrv === Infinity ? 0 : minHrv,
      maxHrv: maxHrv === -Infinity ? 0 : maxHrv,
      avgHrVariance: avgHrAfter - avgHrBefore,
      avgHrvVariance: avgHrvAfter - avgHrvBefore,
    };
  }, [activeLogs]);

  // Prepare chronological chart trend data points
  const chartData = useMemo(() => {
    return activeLogs.map((log, index) => {
      let timeLabel = `Entry #${index + 1}`;
      try {
        const d = new Date(log.timestamp);
        timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {}

      const hrBefore = log.heartRateBefore || 70;
      const hrAfter = log.heartRateAfter || 70;
      const hrvBefore = log.hrvBefore ?? 55;
      const hrvAfter = log.hrvAfter ?? 55;

      const hrVariance = hrAfter - hrBefore;
      const hrvVariance = hrvAfter - hrvBefore;

      let cleanType = log.type;
      if (typeof cleanType === 'string' && cleanType.startsWith('[ENC_AES256:')) {
        cleanType = isEncryptedView ? cleanType : 'WELLNESS_ROUTINE';
      }

      return {
        name: timeLabel,
        type: cleanType,
        heartRateBefore: hrBefore,
        heartRateAfter: hrAfter,
        hrVariance,
        hrvBefore,
        hrvAfter,
        hrvVariance,
      };
    });
  }, [activeLogs, isEncryptedView]);

  return (
    <div
      style={{
        margin: '14px 20px',
        backgroundColor: '#0a0f1d',
        border: '1px solid #1a2636',
        borderRadius: '6px',
        padding: '16px',
        fontFamily: 'monospace',
      }}
    >
      {/* Header Deck */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '1px solid #1a2636',
          paddingBottom: '12px',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2em' }}>📊</span>
          <div>
            <h4 style={{ color: '#00ffcc', margin: 0, fontSize: '0.92em', letterSpacing: '0.5px' }}>
              DAILY WELLNESS SUMMARY // BIOMETRIC VARIANCE REPORT
            </h4>
            <div style={{ fontSize: '0.68em', color: '#8fa0ba' }}>
              AGGREGATED TELEMETRY FOR {filterMode === 'TODAY_ONLY' ? `TODAY (${todayStr})` : 'ALL-TIME RECORDS'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid #1a2636', borderRadius: '3px', overflow: 'hidden' }}>
            <button
              onClick={() => setFilterMode('TODAY_ONLY')}
              style={{
                padding: '3px 8px',
                fontSize: '0.68em',
                fontFamily: 'monospace',
                backgroundColor: filterMode === 'TODAY_ONLY' ? '#00ffcc' : '#101726',
                color: filterMode === 'TODAY_ONLY' ? '#0a0f1d' : '#8fa0ba',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              TODAY ({todayStr.slice(4, 10)})
            </button>
            <button
              onClick={() => setFilterMode('ALL_TIME')}
              style={{
                padding: '3px 8px',
                fontSize: '0.68em',
                fontFamily: 'monospace',
                backgroundColor: filterMode === 'ALL_TIME' ? '#00ffcc' : '#101726',
                color: filterMode === 'ALL_TIME' ? '#0a0f1d' : '#8fa0ba',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ALL SESSIONS ({logs.length})
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '3px 8px',
              fontSize: '0.68em',
              backgroundColor: '#101726',
              color: '#8fa0ba',
              border: '1px solid #1a2636',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            {isExpanded ? '▲ COLLAPSE' : '▼ EXPAND'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Summary Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            <div style={{ backgroundColor: '#060a13', border: '1px solid #1a2636', padding: '10px', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.65em', color: '#8fa0ba' }}>LOGGED SESSIONS</div>
              <div style={{ fontSize: '1.2em', color: '#ffffff', fontWeight: 'bold' }}>
                {summaryMetrics.count}
              </div>
              <div style={{ fontSize: '0.62em', color: '#54657d' }}>ROUTINES COMMITTED</div>
            </div>

            <div style={{ backgroundColor: '#060a13', border: '1px solid #1a2636', padding: '10px', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.65em', color: '#8fa0ba' }}>AVG HEART RATE</div>
              <div style={{ fontSize: '1.2em', color: '#ff3366', fontWeight: 'bold' }}>
                {summaryMetrics.count > 0 ? `${summaryMetrics.avgHrAfter} BPM` : 'N/A'}
              </div>
              <div style={{ fontSize: '0.62em', color: summaryMetrics.avgHrVariance <= 0 ? '#00ffcc' : '#ffaa00' }}>
                Δ {summaryMetrics.avgHrVariance >= 0 ? `+${summaryMetrics.avgHrVariance}` : summaryMetrics.avgHrVariance} BPM post-routine
              </div>
            </div>

            <div style={{ backgroundColor: '#060a13', border: '1px solid #1a2636', padding: '10px', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.65em', color: '#8fa0ba' }}>AVG HRV TONE</div>
              <div style={{ fontSize: '1.2em', color: '#00ffcc', fontWeight: 'bold' }}>
                {summaryMetrics.count > 0 ? `${summaryMetrics.avgHrvAfter} ms` : 'N/A'}
              </div>
              <div style={{ fontSize: '0.62em', color: summaryMetrics.avgHrvVariance >= 0 ? '#00ffcc' : '#ff3366' }}>
                Δ {summaryMetrics.avgHrvVariance >= 0 ? `+${summaryMetrics.avgHrvVariance}` : summaryMetrics.avgHrvVariance} ms vagal shift
              </div>
            </div>

            <div style={{ backgroundColor: '#060a13', border: '1px solid #1a2636', padding: '10px', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.65em', color: '#8fa0ba' }}>HR RANGE</div>
              <div style={{ fontSize: '1.1em', color: '#ffffff', fontWeight: 'bold' }}>
                {summaryMetrics.count > 0 ? `${summaryMetrics.minHr} - ${summaryMetrics.maxHr}` : 'N/A'}
              </div>
              <div style={{ fontSize: '0.62em', color: '#54657d' }}>BPM (MIN - MAX)</div>
            </div>

            <div style={{ backgroundColor: '#060a13', border: '1px solid #1a2636', padding: '10px', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.65em', color: '#8fa0ba' }}>HRV RANGE</div>
              <div style={{ fontSize: '1.1em', color: '#ffffff', fontWeight: 'bold' }}>
                {summaryMetrics.count > 0 ? `${summaryMetrics.minHrv} - ${summaryMetrics.maxHrv}` : 'N/A'}
              </div>
              <div style={{ fontSize: '0.62em', color: '#54657d' }}>ms (MIN - MAX)</div>
            </div>
          </div>

          {/* Recharts Variance Trend Visualization */}
          {chartData.length > 0 ? (
            <div style={{ backgroundColor: '#060a13', border: '1px solid #1a2636', padding: '12px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.7em', color: '#8fa0ba', fontWeight: 'bold' }}>
                  CHRONOLOGICAL VARIANCE & COHERENCE DRIFT (RECHARTS)
                </span>
                <span style={{ fontSize: '0.65em', color: '#00ffcc' }}>
                  ● HR POST (BPM) &nbsp; ● HRV POST (MS) &nbsp; ▮ HRV VARIANCE (Δ)
                </span>
              </div>

              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2636" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#54657d"
                      fontSize={10}
                      tickLine={false}
                      fontFamily="monospace"
                    />
                    <YAxis
                      stroke="#54657d"
                      fontSize={10}
                      tickLine={false}
                      domain={['auto', 'auto']}
                      fontFamily="monospace"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#060a13',
                        border: '1px solid #00ffcc',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '0.72em',
                        boxShadow: '0 0 10px rgba(0,255,204,0.3)',
                      }}
                      itemStyle={{ color: '#ffffff' }}
                      formatter={(val: any, name: any) => {
                        if (name === 'heartRateAfter') return [`${val} BPM`, 'Heart Rate (Post)'];
                        if (name === 'hrvAfter') return [`${val} ms`, 'HRV (Post)'];
                        if (name === 'hrvVariance') return [`${val >= 0 ? `+${val}` : val} ms`, 'HRV Shift (Δ)'];
                        return [val, name];
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '6px' }}
                    />
                    <Bar
                      dataKey="hrvVariance"
                      name="HRV Shift (Δ)"
                      fill="#00ffcc"
                      opacity={0.4}
                      barSize={12}
                    />
                    <Line
                      type="monotone"
                      dataKey="heartRateAfter"
                      name="Heart Rate"
                      stroke="#ff3366"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#ff3366' }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hrvAfter"
                      name="HRV Tone"
                      stroke="#00ffcc"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#00ffcc' }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#060a13',
                border: '1px dashed #1a2636',
                padding: '24px',
                textAlign: 'center',
                borderRadius: '4px',
              }}
            >
              <span style={{ fontSize: '1.4em', display: 'block', marginBottom: '6px' }}>📭</span>
              <div style={{ fontSize: '0.78em', color: '#8fa0ba', fontWeight: 'bold' }}>
                NO WELLNESS LOGS RECORDED FOR TODAY
              </div>
              <p style={{ fontSize: '0.68em', color: '#54657d', margin: '4px 0 10px 0' }}>
                Trigger a biometric session (e.g. 432Hz Audio Shield, Grounding Routine) in the Biometric Action Deck to generate today's variance trends.
              </p>
              {logs.length > 0 && (
                <button
                  onClick={() => setFilterMode('ALL_TIME')}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: '#101726',
                    color: '#00ffcc',
                    border: '1px solid #00ffcc',
                    borderRadius: '2px',
                    fontSize: '0.7em',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                  }}
                >
                  VIEW ALL HISTORICAL SESSIONS ({logs.length})
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
