import React, { useMemo, useState } from 'react';
import { WellnessLog } from '../hooks/useIndexedDB';

interface CoherenceStreakLightWellProps {
  logs: WellnessLog[];
  onTriggerRoutine?: (routineType: string) => void;
}

export const CoherenceStreakLightWell: React.FC<CoherenceStreakLightWellProps> = ({
  logs = [],
  onTriggerRoutine,
}) => {
  const [isSparkling, setIsSparkling] = useState(false);

  // Compute Streak Metrics from historical logs
  const { currentStreak, maxStreak, completedToday, dayHistory, totalRoutines } = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        currentStreak: 0,
        maxStreak: 0,
        completedToday: false,
        dayHistory: [],
        totalRoutines: 0,
      };
    }

    // Set of distinct date strings (YYYY-MM-DD)
    const logDateSet = new Set<string>();
    logs.forEach((log) => {
      try {
        const d = new Date(log.timestamp);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        logDateSet.add(`${yyyy}-${mm}-${dd}`);
      } catch (e) {}
    });

    const now = new Date();
    const formatDay = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const todayStr = formatDay(now);
    const completedToday = logDateSet.has(todayStr);

    // Calculate current consecutive streak backwards
    let streak = 0;
    let checkDate = new Date(now);

    // If not completed today, start checking from yesterday
    if (!completedToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (logDateSet.has(formatDay(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Rolling 7-day visual history window
    const dayHistory: Array<{ dayName: string; dateStr: string; isComplete: boolean; isToday: boolean }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const str = formatDay(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      dayHistory.push({
        dayName,
        dateStr: str,
        isComplete: logDateSet.has(str),
        isToday: i === 0,
      });
    }

    // Max streak estimation (at least current streak)
    const maxStreak = Math.max(streak, Math.min(logDateSet.size, 14));

    return {
      currentStreak: streak,
      maxStreak,
      completedToday,
      dayHistory,
      totalRoutines: logs.length,
    };
  }, [logs]);

  // Light-Well Tier Progression & Fill Height calculation
  // Base visual height percentage: clamp between 15% (minimum ember) and 100% (supernova)
  const wellFillPercentage = useMemo(() => {
    if (currentStreak === 0) return completedToday ? 20 : 12;
    return Math.min(100, 15 + currentStreak * 12);
  }, [currentStreak, completedToday]);

  const tierInfo = useMemo(() => {
    if (currentStreak >= 10) {
      return {
        title: 'ASCENDED LIGHT-WELL GUARDIAN',
        color: '#ff3399',
        glow: '0 0 35px rgba(255, 51, 153, 0.75)',
        badge: '⚡ TIER IV: SUPERNOVA',
        lore: 'Photon emission operating at maximum harmonic capacity. Regional scalar fields are completely stabilized.',
      };
    }
    if (currentStreak >= 5) {
      return {
        title: 'SOLAR COHERENCE SENTINEL',
        color: '#ffaa00',
        glow: '0 0 25px rgba(255, 170, 0, 0.65)',
        badge: '☀️ TIER III: RADIANT',
        lore: 'Strong diurnal rhythm alignment. Cellular mitochondria absorbing coherent Schumann resonance.',
      };
    }
    if (currentStreak >= 3) {
      return {
        title: 'HARMONIC GRID WEAVER',
        color: '#00ffcc',
        glow: '0 0 20px rgba(0, 255, 204, 0.55)',
        badge: '✨ TIER II: COHERENT',
        lore: 'Consistent autonomic stabilization. Heart-rate variability variance is harmonizing.',
      };
    }
    return {
      title: 'NEOPHYTE RESONATOR',
      color: '#33ccff',
      glow: '0 0 15px rgba(51, 204, 255, 0.45)',
      badge: '🌱 TIER I: INITIATION',
      lore: 'The light-well is kindling. Commit daily bio-coherence routines to fuel the photon pillar.',
    };
  }, [currentStreak]);

  const handleWellClick = () => {
    setIsSparkling(true);
    setTimeout(() => setIsSparkling(false), 2000);
  };

  return (
    <div
      style={{
        margin: '12px 0',
        backgroundColor: '#070d1a',
        border: `1px solid ${tierInfo.color}`,
        borderRadius: '8px',
        padding: '16px',
        fontFamily: 'monospace',
        boxShadow: `0 0 20px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(0, 255, 204, 0.05)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Subtle Cyber Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: tierInfo.color,
          filter: 'blur(60px)',
          opacity: 0.15,
          pointerEvents: 'none',
        }}
      />

      {/* Header Deck */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '1px solid #1a2636',
          paddingBottom: '10px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3em', animation: 'spin 12s linear infinite' }}>🔮</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h4 style={{ margin: 0, color: tierInfo.color, fontSize: '0.92em', letterSpacing: '0.5px' }}>
                COHERENCE LIGHT-WELL // DAILY STREAK CONDUIT
              </h4>
              <span
                style={{
                  fontSize: '0.62em',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: tierInfo.color,
                  border: `1px solid ${tierInfo.color}`,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                }}
              >
                {tierInfo.badge}
              </span>
            </div>
            <div style={{ fontSize: '0.68em', color: '#8fa0ba' }}>
              {tierInfo.title} • {totalRoutines} BIO-ROUTINES LOGGED
            </div>
          </div>
        </div>

        {/* Status Pill Indicator */}
        <div
          style={{
            fontSize: '0.68em',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: completedToday ? 'rgba(0, 255, 204, 0.15)' : 'rgba(255, 170, 0, 0.15)',
            border: `1px solid ${completedToday ? '#00ffcc' : '#ffaa00'}`,
            color: completedToday ? '#00ffcc' : '#ffaa00',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: completedToday ? '#00ffcc' : '#ffaa00',
              boxShadow: `0 0 6px ${completedToday ? '#00ffcc' : '#ffaa00'}`,
            }}
          />
          {completedToday ? 'TODAY ANCHORED (STREAK ACTIVE)' : 'PENDING TODAY (STREAK AT RISK)'}
        </div>
      </div>

      {/* Main Interactive Stage: Holographic Light-Well + Streak Telemetry */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(140px, 170px) 1fr',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        {/* Visual Light-Well Energy Vessel */}
        <div
          onClick={handleWellClick}
          style={{
            height: '175px',
            backgroundColor: '#04070e',
            border: '2px solid #1a2636',
            borderRadius: '12px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '6px',
            cursor: 'pointer',
            boxShadow: tierInfo.glow,
            overflow: 'hidden',
          }}
          title="Click to pulse light-well energy"
        >
          {/* Internal Calibrated Gradation Lines */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '100% 25px',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />

          {/* Top Energy Emitter Ring */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              width: '60px',
              height: '8px',
              borderRadius: '50%',
              border: `2px solid ${tierInfo.color}`,
              boxShadow: `0 0 10px ${tierInfo.color}`,
              zIndex: 4,
            }}
          />

          {/* Glowing Liquid Photon Pillar (grows with streak) */}
          <div
            style={{
              width: '85%',
              height: `${wellFillPercentage}%`,
              background: `linear-gradient(180deg, #ffffff 0%, ${tierInfo.color} 30%, #002b28 100%)`,
              borderRadius: '8px 8px 6px 6px',
              boxShadow: `0 0 20px ${tierInfo.color}, inset 0 0 12px #ffffff`,
              transition: 'height 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {/* Photon Meniscus Ring */}
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                width: '100%',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                boxShadow: `0 0 12px #ffffff, 0 0 25px ${tierInfo.color}`,
              }}
            />

            {/* Ascending Particle Sparks when Sparkling or High Streak */}
            {(isSparkling || currentStreak >= 5) && (
              <div
                style={{
                  position: 'absolute',
                  top: '-15px',
                  fontSize: '0.8em',
                  animation: 'floatUp 1.2s infinite ease-out',
                }}
              >
                ✨
              </div>
            )}
          </div>

          {/* Bottom Generator Base */}
          <div
            style={{
              width: '100%',
              backgroundColor: '#0b1322',
              borderTop: '1px solid #1a2636',
              borderRadius: '0 0 6px 6px',
              padding: '4px',
              textAlign: 'center',
              zIndex: 4,
            }}
          >
            <span style={{ fontSize: '0.62em', color: '#8fa0ba', fontWeight: 'bold' }}>
              WELL FILL: {Math.round(wellFillPercentage)}%
            </span>
          </div>
        </div>

        {/* Right Details Deck: Current Streak & 7-Day Matrix */}
        <div>
          {/* Primary Streak Numerical Readout */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '2.4em',
                fontWeight: 'bold',
                color: tierInfo.color,
                lineHeight: 1,
                textShadow: `0 0 15px ${tierInfo.color}`,
              }}
            >
              {currentStreak}
            </span>
            <div style={{ fontSize: '0.85em', color: '#ffffff', fontWeight: 'bold' }}>
              DAY CONSECUTIVE STREAK
            </div>
          </div>

          <div style={{ fontSize: '0.68em', color: '#8fa0ba', marginBottom: '12px' }}>
            {tierInfo.lore}
          </div>

          {/* 7-Day Chronological Glyph Matrix */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.64em', color: '#54657d', marginBottom: '6px', fontWeight: 'bold' }}>
              LAST 7-DAY HARMONIC CYCLE:
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {dayHistory.map((d, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: d.isToday ? '#101c30' : '#04070e',
                    border: `1px solid ${d.isComplete ? tierInfo.color : d.isToday ? '#54657d' : '#1a2636'}`,
                    borderRadius: '4px',
                    padding: '6px 2px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '0.6em', color: d.isToday ? '#00ffcc' : '#8fa0ba', fontWeight: 'bold' }}>
                    {d.dayName}
                  </span>
                  <span
                    style={{
                      fontSize: '0.9em',
                      marginTop: '2px',
                      filter: d.isComplete ? `drop-shadow(0 0 6px ${tierInfo.color})` : 'grayscale(1)',
                      opacity: d.isComplete ? 1 : 0.25,
                    }}
                  >
                    💎
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Callout */}
          {!completedToday && onTriggerRoutine && (
            <button
              onClick={() => onTriggerRoutine('YOGA_STRETCH')}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'rgba(0, 255, 204, 0.12)',
                color: '#00ffcc',
                border: '1px solid #00ffcc',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                fontSize: '0.72em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>⚡</span>
              <span>COMPLETE TODAY'S BIO-COHERENCE ROUTINE (+1 DAY)</span>
            </button>
          )}

          {completedToday && (
            <div
              style={{
                backgroundColor: 'rgba(0, 255, 204, 0.08)',
                border: '1px solid rgba(0, 255, 204, 0.3)',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '0.66em',
                color: '#00ffcc',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>🌟</span>
              <span>Light-well energized for today! Return tomorrow to advance to the next harmonic tier.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
