import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { InfrastructureNode } from './ArcGISViewport';

interface DashboardWidgetProps {
  nodes: InfrastructureNode[];
  onShieldNode?: (nodeId: string) => void;
  onShieldAllNodes?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  isSpark?: boolean;
}

interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
  color: string;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  nodes = [],
  onShieldNode,
  onShieldAllNodes,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<ShockwaveRing[]>([]);
  const prevPercentageRef = useRef<number>(0);
  const [hasPlayedChime, setHasPlayedChime] = useState<boolean>(false);

  // Real-time calculations
  const { totalNodes, shieldedNodes, unshieldedNodes, shieldPercentage, integrityStatus } = useMemo(() => {
    const total = nodes.length;
    const shielded = nodes.filter((n) => n.isShielded).length;
    const unshielded = total - shielded;
    const percentage = total === 0 ? 0 : Math.round((shielded / total) * 100);

    let status = {
      label: 'CRITICAL SHIELD DEFICIT',
      color: '#ff3366',
      bgGlow: 'rgba(255, 51, 102, 0.25)',
      description: 'Extensive scalar radiation exposure detected across local ArcGIS grid.',
    };

    if (percentage === 100) {
      status = {
        label: 'MAXIMUM INTEGRITY // FULL COHERENCE',
        color: '#00ffcc',
        bgGlow: 'rgba(0, 255, 204, 0.35)',
        description: 'All regional infrastructure nodes completely shielded and locked.',
      };
    } else if (percentage >= 75) {
      status = {
        label: 'HIGH SHIELD INTEGRITY',
        color: '#33ff99',
        bgGlow: 'rgba(51, 255, 153, 0.25)',
        description: 'Dominant local nodes stabilized. Minor peripheral leakage remains.',
      };
    } else if (percentage >= 50) {
      status = {
        label: 'MODERATE INTEGRITY',
        color: '#ffcc00',
        bgGlow: 'rgba(255, 204, 0, 0.25)',
        description: 'Partial dampening active. Half of regional emitters require harmonization.',
      };
    } else if (percentage >= 25) {
      status = {
        label: 'DEGRADED INTEGRITY',
        color: '#ff9900',
        bgGlow: 'rgba(255, 153, 0, 0.25)',
        description: 'Perimeter defense compromised. Priority towers emitting unchecked RF fields.',
      };
    }

    return {
      totalNodes: total,
      shieldedNodes: shielded,
      unshieldedNodes: unshielded,
      shieldPercentage: percentage,
      integrityStatus: status,
    };
  }, [nodes]);

  // Audio Solfeggio Lock Chime
  const playLockChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const freqs = [528, 660, 792, 1056]; // Coherent major chord
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 1.25);
      });
    } catch (e) {}
  }, []);

  // Particle Emitter Spawn Trigger
  const trigger100PercentParticleBurst = useCallback((isManual = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // 1. Spurt Shockwave Rings
    shockwavesRef.current.push(
      {
        x: cx,
        y: cy,
        radius: 30,
        maxRadius: 100,
        alpha: 1.0,
        speed: 2.2,
        color: '#00ffcc',
      },
      {
        x: cx,
        y: cy,
        radius: 15,
        maxRadius: 110,
        alpha: 0.8,
        speed: 1.6,
        color: '#ffaa00',
      },
      {
        x: cx,
        y: cy,
        radius: 5,
        maxRadius: 120,
        alpha: 0.6,
        speed: 1.2,
        color: '#ffffff',
      }
    );

    // 2. Spawn 70 Explosive Scalar Photon Particles
    const colors = ['#00ffcc', '#ffffff', '#33ff99', '#ffcc00', '#70e5ff'];
    for (let i = 0; i < 70; i++) {
      const angle = (Math.PI * 2 * i) / 70 + (Math.random() - 0.5) * 0.3;
      const speed = 1.8 + Math.random() * 4.2;
      particlesRef.current.push({
        x: cx + Math.cos(angle) * 35,
        y: cy + Math.sin(angle) * 35,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.8 + Math.random() * 3.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.012 + Math.random() * 0.018,
        isSpark: true,
      });
    }

    if (isManual || !hasPlayedChime) {
      playLockChime();
      setHasPlayedChime(true);
    }
  }, [hasPlayedChime, playLockChime]);

  // Trigger burst when shield transitions into 100%
  useEffect(() => {
    if (shieldPercentage === 100 && prevPercentageRef.current < 100) {
      trigger100PercentParticleBurst();
    } else if (shieldPercentage < 100) {
      setHasPlayedChime(false);
    }
    prevPercentageRef.current = shieldPercentage;
  }, [shieldPercentage, trigger100PercentParticleBurst]);

  // Main Particle Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;
    let frameCount = 0;

    const render = () => {
      if (!isMounted) return;
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // When at 100%, continuously emit gentle ambient scalar motes
      if (shieldPercentage === 100 && frameCount % 4 === 0) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 48 + (Math.random() - 0.5) * 16;
        particlesRef.current.push({
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.4 - Math.random() * 0.8,
          radius: 1.2 + Math.random() * 2.0,
          color: Math.random() > 0.4 ? '#00ffcc' : '#ffcc00',
          alpha: 0.85,
          decay: 0.02 + Math.random() * 0.02,
        });
      }

      // 1. Render and Update Shockwave Rings
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const ring = shockwavesRef.current[i];
        ring.radius += ring.speed;
        ring.alpha -= 0.015;

        if (ring.alpha <= 0 || ring.radius >= ring.maxRadius) {
          shockwavesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 2.5 * ring.alpha;
        ctx.globalAlpha = Math.max(0, ring.alpha);
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Render and Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [shieldPercentage]);

  // Radial Progress Geometry Calculations
  const radius = 56;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~351.86
  const strokeDashoffset = circumference - (shieldPercentage / 100) * circumference;

  return (
    <div
      style={{
        margin: '12px 0',
        backgroundColor: '#060b17',
        border: `1px solid ${shieldPercentage === 100 ? '#00ffcc' : '#1a2c48'}`,
        borderRadius: '8px',
        padding: '16px',
        fontFamily: 'monospace',
        position: 'relative',
        overflow: 'hidden',
        boxShadow:
          shieldPercentage === 100
            ? '0 0 30px rgba(0, 255, 204, 0.4), inset 0 0 20px rgba(0, 255, 204, 0.15)'
            : `0 0 20px rgba(0, 0, 0, 0.6), inset 0 0 15px ${integrityStatus.bgGlow}`,
        transition: 'all 0.5s ease',
      }}
    >
      {/* Top Header Deck */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '1px solid #162438',
          paddingBottom: '10px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2em' }}>{shieldPercentage === 100 ? '🔒' : '🛡️'}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h4 style={{ margin: 0, color: '#00ffcc', fontSize: '0.94em', letterSpacing: '0.5px' }}>
                SHIELD INTEGRITY MONITOR // ARCGIS NODES
              </h4>
              <span
                style={{
                  fontSize: '0.62em',
                  backgroundColor: shieldPercentage === 100 ? 'rgba(0, 255, 204, 0.25)' : 'rgba(0, 255, 204, 0.12)',
                  border: '1px solid #00ffcc',
                  color: '#00ffcc',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                }}
              >
                {shieldPercentage === 100 ? '🔒 100% SHIELD LOCKED' : 'LIVE TELEMETRY'}
              </span>
            </div>
            <div style={{ fontSize: '0.68em', color: '#8fa0ba' }}>
              LOCAL SCALAR DEFENSE COVERAGE RELATIVE TO ACTIVE TOWERS
            </div>
          </div>
        </div>

        {/* Status Classification Pill */}
        <div
          style={{
            fontSize: '0.68em',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: `${integrityStatus.color}1a`,
            border: `1px solid ${integrityStatus.color}`,
            color: integrityStatus.color,
            fontWeight: 'bold',
          }}
        >
          {integrityStatus.label}
        </div>
      </div>

      {/* Main Two-Column Stage: Radial Progress Bar + Grid Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(140px, 180px) 1fr',
          gap: '18px',
          alignItems: 'center',
        }}
      >
        {/* Radial Progress Gauge Container with Layered Canvas Particle Emitter */}
        <div
          onClick={() => shieldPercentage === 100 && trigger100PercentParticleBurst(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: shieldPercentage === 100 ? 'pointer' : 'default',
          }}
          title={shieldPercentage === 100 ? 'Click to pulse scalar lock wave' : undefined}
        >
          {/* Radial SVG Gauge */}
          <svg width="150" height="150" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00ffcc" />
                <stop offset="60%" stopColor={integrityStatus.color} />
                <stop offset="100%" stopColor="#ff3399" />
              </linearGradient>
            </defs>

            {/* Background Calibrated Track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#0f1b2d"
              strokeWidth={strokeWidth}
            />

            {/* Outer Subtle Dashed Ring */}
            <circle
              cx="70"
              cy="70"
              r={radius + 8}
              fill="none"
              stroke={shieldPercentage === 100 ? 'rgba(0, 255, 204, 0.4)' : 'rgba(0, 255, 204, 0.15)'}
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Glowing Active Radial Progress Arc */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="url(#shieldGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: `drop-shadow(0 0 ${shieldPercentage === 100 ? '14px' : '8px'} ${integrityStatus.color})`,
              }}
            />
          </svg>

          {/* Centered Percentage and Count Overlay */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          >
            <span
              style={{
                fontSize: '1.8em',
                fontWeight: 'bold',
                color: integrityStatus.color,
                lineHeight: 1,
                textShadow: `0 0 12px ${integrityStatus.color}`,
              }}
            >
              {shieldPercentage}%
            </span>
            <span
              style={{
                fontSize: '0.62em',
                color: '#8fa0ba',
                fontWeight: 'bold',
                marginTop: '4px',
              }}
            >
              {shieldedNodes} / {totalNodes} SHIELDED
            </span>
          </div>

          {/* Dedicated Canvas Layer for 100% Scalar Particle Emitter */}
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />
        </div>

        {/* Right Metric Details & Node List Summary */}
        <div>
          <div style={{ fontSize: '0.72em', color: '#b2c5df', marginBottom: '10px', lineHeight: '1.4' }}>
            {integrityStatus.description}
          </div>

          {/* Metric Counter Mini-Cards */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div
              style={{
                flex: 1,
                backgroundColor: '#0a1424',
                border: '1px solid #142236',
                borderRadius: '4px',
                padding: '6px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.6em', color: '#8fa0ba' }}>TOTAL ARCGIS NODES</div>
              <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#ffffff' }}>{totalNodes}</div>
            </div>

            <div
              style={{
                flex: 1,
                backgroundColor: '#0a1424',
                border: '1px solid #00ffcc',
                borderRadius: '4px',
                padding: '6px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.6em', color: '#00ffcc' }}>SHIELDED (SECURE)</div>
              <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#00ffcc' }}>{shieldedNodes}</div>
            </div>

            <div
              style={{
                flex: 1,
                backgroundColor: '#0a1424',
                border: `1px solid ${unshieldedNodes > 0 ? '#ff3366' : '#142236'}`,
                borderRadius: '4px',
                padding: '6px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.6em', color: unshieldedNodes > 0 ? '#ff3366' : '#8fa0ba' }}>UNSHIELDED</div>
              <div
                style={{
                  fontSize: '1.1em',
                  fontWeight: 'bold',
                  color: unshieldedNodes > 0 ? '#ff3366' : '#8fa0ba',
                }}
              >
                {unshieldedNodes}
              </div>
            </div>
          </div>

          {/* Action Trigger Deck */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {unshieldedNodes > 0 && onShieldAllNodes && (
              <button
                onClick={onShieldAllNodes}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'rgba(0, 255, 204, 0.15)',
                  color: '#00ffcc',
                  border: '1px solid #00ffcc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  fontSize: '0.72em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>⚡</span>
                <span>HARMONIZE ALL REMAINING ({unshieldedNodes}) NODES</span>
              </button>
            )}

            {shieldPercentage === 100 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.7em',
                    color: '#00ffcc',
                    fontWeight: 'bold',
                  }}
                >
                  <span>🔒</span>
                  <span>12D SCALAR SHIELD LOCKED // PERIMETER IMPENETRABLE</span>
                </div>

                <button
                  onClick={() => trigger100PercentParticleBurst(true)}
                  style={{
                    padding: '3px 8px',
                    backgroundColor: 'rgba(0, 255, 204, 0.1)',
                    color: '#00ffcc',
                    border: '1px dashed #00ffcc',
                    borderRadius: '3px',
                    fontSize: '0.64em',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                  }}
                  title="Trigger scalar lock particle burst again"
                >
                  ✨ RE-PULSE LOCK
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Node Roster Tray Preview */}
      <div
        style={{
          marginTop: '14px',
          paddingTop: '10px',
          borderTop: '1px solid #142236',
        }}
      >
        <div
          style={{
            fontSize: '0.64em',
            color: '#8fa0ba',
            fontWeight: 'bold',
            marginBottom: '6px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>LOCAL NODE STATUS LOG:</span>
          <span>CLICK NODE TO TOGGLE HARMONIC SHIELD</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '6px' }}>
          {nodes.map((node) => (
            <div
              key={node.id}
              onClick={() => onShieldNode && onShieldNode(node.id)}
              style={{
                backgroundColor: node.isShielded ? 'rgba(0, 255, 204, 0.08)' : 'rgba(255, 51, 102, 0.08)',
                border: `1px solid ${node.isShielded ? '#00ffcc' : '#ff3366'}`,
                borderRadius: '4px',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease',
              }}
              title={node.isShielded ? 'Shield active (Click to re-verify)' : 'Unshielded! Click to apply scalar shield'}
            >
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '0.68em',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {node.name}
                </div>
                <div style={{ fontSize: '0.58em', color: '#8fa0ba' }}>
                  {node.type}
                </div>
              </div>
              <span style={{ fontSize: '0.9em' }}>
                {node.isShielded ? '🛡️' : '⚠️'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
