import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WellnessLog } from '../hooks/useIndexedDB';

export interface LoveMeetupLocation {
  id: string;
  name: string;
  category: 'PARK' | 'SANCTUARY' | 'WATERFRONT' | 'COMMUNITY_CENTER' | 'CRYSTAL_NODE';
  icon: string;
  distanceMiles: number; // strictly within 5.0 miles
  bearingDeg: number;
  scheduledTime: string;
  participants: number;
  loveEnergy: number; // 0 to 100
  isEnergizedToday: boolean;
  lore: string;
  latitudeOffset: number;
  longitudeOffset: number;
}

interface PokemonGoLoveMeetupProps {
  onLogLoveRoutine?: (log: Partial<WellnessLog>) => void;
  userEmail?: string;
}

const INITIAL_MEETUPS: LoveMeetupLocation[] = [
  {
    id: 'meetup-1',
    name: 'Emerald Harmony Grove',
    category: 'PARK',
    icon: '🌳',
    distanceMiles: 0.8,
    bearingDeg: 35,
    scheduledTime: '07:30 AM',
    participants: 42,
    loveEnergy: 65,
    isEnergizedToday: false,
    lore: 'Centuries-old cedar grove where local guardians broadcast morning cardiac coherence to revitalize urban biosphere.',
    latitudeOffset: 0.007,
    longitudeOffset: 0.005,
  },
  {
    id: 'meetup-2',
    name: 'Solar Springs Reflection Fountain',
    category: 'WATERFRONT',
    icon: '⛲',
    distanceMiles: 1.4,
    bearingDeg: 120,
    scheduledTime: '12:00 PM',
    participants: 78,
    loveEnergy: 80,
    isEnergizedToday: false,
    lore: 'Living water reservoir transmitting 528Hz frequency to dissolve electromagnetic stress and anxiety.',
    latitudeOffset: -0.009,
    longitudeOffset: 0.012,
  },
  {
    id: 'meetup-3',
    name: 'Starlight Community Healing Dome',
    category: 'COMMUNITY_CENTER',
    icon: '🏛️',
    distanceMiles: 2.3,
    bearingDeg: 215,
    scheduledTime: '03:15 PM',
    participants: 115,
    loveEnergy: 55,
    isEnergizedToday: false,
    lore: 'Inter-generational collective space dedicated to communal meditation, sound baths, and energetic shield repairs.',
    latitudeOffset: -0.018,
    longitudeOffset: -0.014,
  },
  {
    id: 'meetup-4',
    name: 'Peace Sanctuary Meadow',
    category: 'SANCTUARY',
    icon: '🌸',
    distanceMiles: 3.7,
    bearingDeg: 310,
    scheduledTime: '06:45 PM',
    participants: 94,
    loveEnergy: 40,
    isEnergizedToday: false,
    lore: 'Open wildflower meadow aligned with planetary ley lines, ideal for collective sunset gratitude transmissions.',
    latitudeOffset: 0.028,
    longitudeOffset: -0.026,
  },
  {
    id: 'meetup-5',
    name: 'Horizon Crystal Anchor Node',
    category: 'CRYSTAL_NODE',
    icon: '💎',
    distanceMiles: 4.8,
    bearingDeg: 80,
    scheduledTime: '09:00 PM',
    participants: 63,
    loveEnergy: 30,
    isEnergizedToday: false,
    lore: 'Perimeter 5-mile boundary stone that stabilizes the outer shield matrix against high-frequency solar storms.',
    latitudeOffset: 0.012,
    longitudeOffset: 0.045,
  },
];

export const PokemonGoLoveMeetup: React.FC<PokemonGoLoveMeetupProps> = ({
  onLogLoveRoutine,
  userEmail,
}) => {
  const [meetups, setMeetups] = useState<LoveMeetupLocation[]>(() => {
    const saved = localStorage.getItem('grid_guardian_love_meetups_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_MEETUPS;
  });

  const [selectedMeetup, setSelectedMeetup] = useState<LoveMeetupLocation | null>(null);
  const [viewMode, setViewMode] = useState<'RADAR_MAP' | 'PORTAL_ENCOUNTER' | 'SCHEDULE'>('RADAR_MAP');
  const [maxRadiusMiles, setMaxRadiusMiles] = useState<number>(5.0);

  // Encounter state
  const [isThrowing, setIsThrowing] = useState<boolean>(false);
  const [throwQuality, setThrowQuality] = useState<'NICE' | 'GREAT' | 'EXCELLENT' | null>(null);
  const [capturePhase, setCapturePhase] = useState<'AIMING' | 'FLYING' | 'IMPACT' | 'CELEBRATING'>('AIMING');
  const [targetRingScale, setTargetRingScale] = useState<number>(1.0);
  const [discRotation, setDiscRotation] = useState<number>(0);
  const [stardustCount, setStardustCount] = useState<number>(250);
  const [totalLoveSent, setTotalLoveSent] = useState<number>(1420);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; color: string }>>([]);

  // Time until next daily meetup countdown
  const [countdownStr, setCountdownStr] = useState<string>('00:00:00');

  // Save meetups to localStorage
  useEffect(() => {
    localStorage.setItem('grid_guardian_love_meetups_v1', JSON.stringify(meetups));
  }, [meetups]);

  // Daily Meetup Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Target next hour boundary or 6 PM
      const nextMeetup = new Date();
      nextMeetup.setMinutes(0);
      nextMeetup.setSeconds(0);
      nextMeetup.setHours(nextMeetup.getHours() + 1);

      const diff = Math.max(0, nextMeetup.getTime() - now.getTime());
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdownStr(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Shrinking Target Ring Animation (Pokémon GO capture circle)
  useEffect(() => {
    if (capturePhase !== 'AIMING') return;

    let animationFrame: number;
    let start = performance.now();

    const animateRing = (now: number) => {
      const elapsed = (now - start) % 1800; // 1.8s loop
      const progress = elapsed / 1800;
      // Shrinks from 1.0 down to 0.25, then resets
      const scale = 1.0 - progress * 0.75;
      setTargetRingScale(scale);
      animationFrame = requestAnimationFrame(animateRing);
    };

    animationFrame = requestAnimationFrame(animateRing);
    return () => cancelAnimationFrame(animationFrame);
  }, [capturePhase]);

  // Web Audio Procedural Chime Generator
  const playChimeSound = (type: 'THROW' | 'SUCCESS') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'THROW') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(864, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);
      } else {
        // C-Major / Solfeggio 528Hz Arpeggio Chord Burst
        const freqs = [528, 660, 792, 1056];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.82);
        });
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  // Launch Love Orb (Pokémon GO Throw)
  const handleLaunchLoveOrb = () => {
    if (capturePhase !== 'AIMING' || isThrowing) return;

    setIsThrowing(true);
    setCapturePhase('FLYING');
    playChimeSound('THROW');

    // Evaluate throw quality based on target ring scale
    let quality: 'NICE' | 'GREAT' | 'EXCELLENT' = 'NICE';
    if (targetRingScale < 0.45) {
      quality = 'EXCELLENT';
    } else if (targetRingScale < 0.7) {
      quality = 'GREAT';
    }
    setThrowQuality(quality);

    // Ball reaches target
    setTimeout(() => {
      setCapturePhase('IMPACT');
      setDiscRotation((prev) => prev + 720); // Spin the Pokéstop disc

      setTimeout(() => {
        setCapturePhase('CELEBRATING');
        playChimeSound('SUCCESS');

        // Spawn 25 floating celebration particles
        const newParticles = Array.from({ length: 28 }).map((_, i) => ({
          id: Math.random(),
          x: (Math.random() - 0.5) * 260,
          y: (Math.random() - 0.5) * 220 - 40,
          size: Math.random() * 18 + 12,
          delay: Math.random() * 0.2,
          color: ['#ff3399', '#00ffcc', '#ffcc00', '#ff66cc', '#33ff99'][i % 5],
        }));
        setParticles(newParticles);

        // Update Meetup energy
        if (selectedMeetup) {
          const energyBoost = quality === 'EXCELLENT' ? 35 : quality === 'GREAT' ? 25 : 15;
          setMeetups((prev) =>
            prev.map((m) =>
              m.id === selectedMeetup.id
                ? {
                    ...m,
                    loveEnergy: Math.min(100, m.loveEnergy + energyBoost),
                    participants: m.participants + 1,
                    isEnergizedToday: true,
                  }
                : m
            )
          );

          // Update stats
          setStardustCount((s) => s + (quality === 'EXCELLENT' ? 150 : 80));
          setTotalLoveSent((t) => t + energyBoost * 10);

          // Log wellness action
          if (onLogLoveRoutine) {
            onLogLoveRoutine({
              type: `LOVE_BEACON_${quality}`,
              heartRateBefore: 72,
              heartRateAfter: 64,
              hrvBefore: 52,
              hrvAfter: 68,
              notes: `Sent ${energyBoost}% love coherence to ${selectedMeetup.name} within 5.0mi radius with a ${quality} throw.`,
            });
          }
        }
      }, 500);
    }, 650);
  };

  // Reset encounter back to aiming or exit
  const handleResetEncounter = () => {
    setIsThrowing(false);
    setCapturePhase('AIMING');
    setThrowQuality(null);
    setParticles([]);
  };

  const filteredMeetups = useMemo(() => {
    return meetups.filter((m) => m.distanceMiles <= maxRadiusMiles);
  }, [meetups, maxRadiusMiles]);

  return (
    <div
      style={{
        backgroundColor: '#050a14',
        border: '1px solid #1a2636',
        borderRadius: '8px',
        overflow: 'hidden',
        fontFamily: 'monospace',
        color: '#ffffff',
        position: 'relative',
        margin: '12px 0',
      }}
    >
      {/* Top Pokemon GO Style Header HUD */}
      <div
        style={{
          background: 'linear-gradient(180deg, #0b1528 0%, #060b16 100%)',
          borderBottom: '2px solid #00ffcc',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#ff3366',
              border: '2px solid #ffffff',
              boxShadow: '0 0 12px #ff3366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2em',
            }}
          >
            💖
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '0.98em', color: '#00ffcc', letterSpacing: '0.5px' }}>
                LOVE RADAR // POKÉ-BEACON 5-MILE GRID
              </h3>
              <span
                style={{
                  fontSize: '0.62em',
                  backgroundColor: '#ff3366',
                  color: '#ffffff',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                }}
              >
                LIVE
              </span>
            </div>
            <div style={{ fontSize: '0.68em', color: '#8fa0ba' }}>
              DAILY SYNCHRONIZED COMMUNITY LOVE MEETUPS WITHIN 5.0 MILES
            </div>
          </div>
        </div>

        {/* Stardust & Love Energy Pouch Pills */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(255, 204, 0, 0.12)',
              border: '1px solid #ffcc00',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '0.68em',
              color: '#ffcc00',
              fontWeight: 'bold',
            }}
          >
            <span>✨</span>
            <span>{stardustCount} STARDUST</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(255, 51, 102, 0.15)',
              border: '1px solid #ff3366',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '0.68em',
              color: '#ff3366',
              fontWeight: 'bold',
            }}
          >
            <span>❤️</span>
            <span>{totalLoveSent} LOVE JOULES</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          backgroundColor: '#09101d',
          borderBottom: '1px solid #1a2636',
        }}
      >
        <button
          onClick={() => {
            setViewMode('RADAR_MAP');
            setSelectedMeetup(null);
          }}
          style={{
            flex: 1,
            padding: '8px 10px',
            fontSize: '0.72em',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            backgroundColor: viewMode === 'RADAR_MAP' ? '#101c30' : 'transparent',
            color: viewMode === 'RADAR_MAP' ? '#00ffcc' : '#8fa0ba',
            border: 'none',
            borderBottom: viewMode === 'RADAR_MAP' ? '2px solid #00ffcc' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          🌐 3D RADAR MAP (5 MI)
        </button>
        <button
          onClick={() => setViewMode('SCHEDULE')}
          style={{
            flex: 1,
            padding: '8px 10px',
            fontSize: '0.72em',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            backgroundColor: viewMode === 'SCHEDULE' ? '#101c30' : 'transparent',
            color: viewMode === 'SCHEDULE' ? '#00ffcc' : '#8fa0ba',
            border: 'none',
            borderBottom: viewMode === 'SCHEDULE' ? '2px solid #00ffcc' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          📅 DAILY MEETUP SCHEDULE ({countdownStr})
        </button>
      </div>

      {/* VIEW 1: 3D POKEMON GO STYLE RADAR MAP */}
      {viewMode === 'RADAR_MAP' && !selectedMeetup && (
        <div style={{ padding: '14px', position: 'relative' }}>
          {/* Daily Raid / Meetup Event Countdown Alert */}
          <div
            style={{
              background: 'linear-gradient(90deg, rgba(255,51,102,0.18) 0%, rgba(0,255,204,0.15) 100%)',
              border: '1px solid #ff3366',
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4em', animation: 'spin 4s linear infinite' }}>💫</span>
              <div>
                <div style={{ fontSize: '0.78em', fontWeight: 'bold', color: '#ffffff' }}>
                  SYNCHRONIZED LOVE BROADCAST GATHERING
                </div>
                <div style={{ fontSize: '0.66em', color: '#8fa0ba' }}>
                  Target: Solar Springs Fountain (1.4 mi) • 78 Guardians currently joined
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.62em', color: '#ff3366', fontWeight: 'bold' }}>NEXT EVENT COMMENCES IN</div>
              <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#00ffcc', letterSpacing: '1px' }}>
                {countdownStr}
              </div>
            </div>
          </div>

          {/* 5-Mile Radius Selector Pill Filter */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              fontSize: '0.7em',
              color: '#8fa0ba',
            }}
          >
            <span>SONAR SCAN PERIMETER:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1.0, 3.0, 5.0].map((r) => (
                <button
                  key={r}
                  onClick={() => setMaxRadiusMiles(r)}
                  style={{
                    padding: '2px 8px',
                    fontSize: '0.68em',
                    fontFamily: 'monospace',
                    borderRadius: '3px',
                    border: maxRadiusMiles === r ? '1px solid #00ffcc' : '1px solid #1a2636',
                    backgroundColor: maxRadiusMiles === r ? 'rgba(0,255,204,0.15)' : '#080e19',
                    color: maxRadiusMiles === r ? '#00ffcc' : '#8fa0ba',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {r.toFixed(1)} MI
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Pokémon GO Isometric Map Radar Arena */}
          <div
            style={{
              height: '320px',
              backgroundColor: '#070e1b',
              borderRadius: '8px',
              border: '1px solid #1a2636',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 40px rgba(0, 255, 204, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              perspective: '600px',
            }}
          >
            {/* Perspective Grid Floor */}
            <div
              style={{
                position: 'absolute',
                width: '180%',
                height: '180%',
                backgroundImage: `
                  linear-gradient(rgba(0, 255, 204, 0.12) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0, 255, 204, 0.12) 1px, transparent 1px)
                `,
                backgroundSize: '36px 36px',
                transform: 'rotateX(55deg) translateZ(-30px)',
                opacity: 0.7,
              }}
            />

            {/* 5-Mile Outer Radar Perimeter Ring */}
            <div
              style={{
                position: 'absolute',
                width: '260px',
                height: '260px',
                borderRadius: '50%',
                border: '2px dashed rgba(255, 51, 102, 0.45)',
                boxShadow: '0 0 15px rgba(255, 51, 102, 0.15)',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.58em',
                  color: '#ff3366',
                  backgroundColor: '#060a13',
                  padding: '1px 6px',
                  borderRadius: '6px',
                  border: '1px solid #ff3366',
                }}
              >
                5.0 MI PERIMETER
              </span>
            </div>

            {/* Middle 2.5-Mile Range Ring */}
            <div
              style={{
                position: 'absolute',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '1px solid rgba(0, 255, 204, 0.25)',
                pointerEvents: 'none',
              }}
            />

            {/* Center Player Avatar Pulse Rings */}
            <div
              style={{
                position: 'absolute',
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                border: '2px solid #00ffcc',
                animation: 'pulse 2s infinite ease-out',
                pointerEvents: 'none',
              }}
            />

            {/* Center Player Character Marker */}
            <div
              style={{
                position: 'absolute',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#00ffcc',
                  border: '2px solid #ffffff',
                  boxShadow: '0 0 14px #00ffcc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7em',
                }}
              >
                🧑‍🚀
              </div>
              <span
                style={{
                  fontSize: '0.6em',
                  color: '#00ffcc',
                  fontWeight: 'bold',
                  marginTop: '2px',
                  backgroundColor: 'rgba(6, 10, 19, 0.85)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                }}
              >
                YOU
              </span>
            </div>

            {/* Meetup Poké-Beacons rendered on the Radar */}
            {filteredMeetups.map((meetup) => {
              // Convert bearing and distance to coordinates in the circle
              const rad = (meetup.bearingDeg * Math.PI) / 180;
              const normalizedDist = (meetup.distanceMiles / 5.0) * 115; // max 115px radius
              const posX = Math.cos(rad) * normalizedDist;
              const posY = Math.sin(rad) * normalizedDist;

              return (
                <div
                  key={meetup.id}
                  onClick={() => setSelectedMeetup(meetup)}
                  style={{
                    position: 'absolute',
                    transform: `translate(${posX}px, ${posY}px)`,
                    cursor: 'pointer',
                    zIndex: 15,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'transform 0.2s ease',
                  }}
                  title={`Tap to open ${meetup.name} (${meetup.distanceMiles} mi)`}
                >
                  {/* Floating Pokéstop / Gym Crystal Symbol */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: meetup.isEnergizedToday ? '#ff3366' : '#00ffcc',
                      border: '2px solid #ffffff',
                      boxShadow: meetup.isEnergizedToday ? '0 0 15px #ff3366' : '0 0 15px #00ffcc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1em',
                      animation: 'bounce 2.5s infinite ease-in-out',
                    }}
                  >
                    {meetup.icon}
                  </div>

                  {/* Beacon Mini Label */}
                  <div
                    style={{
                      backgroundColor: 'rgba(6,10,19,0.92)',
                      border: `1px solid ${meetup.isEnergizedToday ? '#ff3366' : '#00ffcc'}`,
                      padding: '1px 5px',
                      borderRadius: '3px',
                      fontSize: '0.58em',
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      marginTop: '3px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    {meetup.name.split(' ')[0]} • {meetup.distanceMiles}mi
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom "Nearby Sightings" Pokémon GO Style Tray */}
          <div
            style={{
              marginTop: '12px',
              backgroundColor: '#070c17',
              border: '1px solid #1a2636',
              borderRadius: '6px',
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                fontSize: '0.68em',
                color: '#8fa0ba',
                fontWeight: 'bold',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>NEARBY LOVE MEETUPS (TAP TO TRANSMIT):</span>
              <span style={{ color: '#00ffcc' }}>{filteredMeetups.length} WITHIN {maxRadiusMiles} MILES</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '8px' }}>
              {filteredMeetups.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMeetup(m)}
                  style={{
                    backgroundColor: '#0b1322',
                    border: `1px solid ${m.isEnergizedToday ? '#ff3366' : '#1a2636'}`,
                    borderRadius: '4px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '1.4em' }}>{m.icon}</span>
                  <div style={{ overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: '0.7em',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {m.name}
                    </div>
                    <div style={{ fontSize: '0.62em', color: '#00ffcc' }}>
                      {m.distanceMiles} mi • {m.loveEnergy}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FULLSCREEN POKÉMON GO STYLE ENCOUNTER / LOVE ORB LAUNCH ARENA */}
      {selectedMeetup && (
        <div
          style={{
            minHeight: '440px',
            background: 'radial-gradient(circle at 50% 30%, #152744 0%, #060c18 100%)',
            padding: '16px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Top Encounter Navigation & Portal Info Header */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              zIndex: 20,
            }}
          >
            <button
              onClick={() => {
                setSelectedMeetup(null);
                handleResetEncounter();
              }}
              style={{
                backgroundColor: 'rgba(16, 23, 38, 0.85)',
                border: '1px solid #1a2636',
                color: '#8fa0ba',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1em',
              }}
            >
              ✕
            </button>

            {/* Meetup Location Info Banner */}
            <div
              style={{
                backgroundColor: 'rgba(6, 11, 22, 0.88)',
                border: '1px solid #00ffcc',
                borderRadius: '20px',
                padding: '6px 16px',
                textAlign: 'center',
                boxShadow: '0 0 15px rgba(0, 255, 204, 0.2)',
              }}
            >
              <div style={{ fontSize: '0.85em', color: '#ffffff', fontWeight: 'bold' }}>
                {selectedMeetup.icon} {selectedMeetup.name}
              </div>
              <div style={{ fontSize: '0.66em', color: '#00ffcc' }}>
                {selectedMeetup.distanceMiles} MILES AWAY • AREA COHERENCE: {selectedMeetup.loveEnergy}%
              </div>
            </div>

            {/* AR Cam / Mode Icon */}
            <div
              style={{
                backgroundColor: 'rgba(16, 23, 38, 0.85)',
                border: '1px solid #ff3366',
                color: '#ff3366',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8em',
                fontWeight: 'bold',
              }}
            >
              AR
            </div>
          </div>

          {/* Center Arena: 3D Spinning Pokéstop Photo-Disc & Target Bullseye */}
          <div
            style={{
              position: 'relative',
              width: '220px',
              height: '220px',
              margin: '20px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Outer Target Contracting Ring (Pokémon GO Throw Reticle) */}
            {capturePhase === 'AIMING' && (
              <div
                style={{
                  position: 'absolute',
                  width: `${160 * targetRingScale}px`,
                  height: `${160 * targetRingScale}px`,
                  borderRadius: '50%',
                  border: `3px solid ${targetRingScale < 0.45 ? '#00ffcc' : targetRingScale < 0.7 ? '#ffcc00' : '#ff3366'}`,
                  boxShadow: `0 0 12px ${targetRingScale < 0.45 ? '#00ffcc' : '#ff3366'}`,
                  transition: 'border-color 0.1s linear',
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* 3D Spinning Pokéstop Disc */}
            <div
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                backgroundColor: '#0a1628',
                border: `4px solid ${selectedMeetup.isEnergizedToday ? '#ff3366' : '#00ffcc'}`,
                boxShadow: selectedMeetup.isEnergizedToday
                  ? '0 0 25px rgba(255,51,102,0.6)'
                  : '0 0 25px rgba(0,255,204,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `rotateY(${discRotation}deg)`,
                transition: 'transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                cursor: 'pointer',
              }}
              onClick={() => setDiscRotation((r) => r + 360)}
            >
              <span style={{ fontSize: '3em' }}>{selectedMeetup.icon}</span>
              <span style={{ fontSize: '0.62em', color: '#00ffcc', fontWeight: 'bold' }}>
                SPIN TO HARMONIZE
              </span>
            </div>

            {/* Throw Quality Notification Popup */}
            {throwQuality && (
              <div
                style={{
                  position: 'absolute',
                  top: '-20px',
                  backgroundColor: throwQuality === 'EXCELLENT' ? '#00ffcc' : '#ffcc00',
                  color: '#060b14',
                  fontWeight: 'bold',
                  fontSize: '0.9em',
                  padding: '3px 12px',
                  borderRadius: '12px',
                  boxShadow: '0 0 12px rgba(255,255,255,0.6)',
                  animation: 'bounce 0.6s ease',
                  letterSpacing: '1px',
                }}
              >
                {throwQuality} LOVE LAUNCH!
              </div>
            )}

            {/* Celebration Particle Explosion Burst */}
            {capturePhase === 'CELEBRATING' &&
              particles.map((p) => (
                <div
                  key={p.id}
                  style={{
                    position: 'absolute',
                    transform: `translate(${p.x}px, ${p.y}px)`,
                    fontSize: `${p.size}px`,
                    color: p.color,
                    animation: 'floatUp 1.8s forwards ease-out',
                    pointerEvents: 'none',
                    filter: `drop-shadow(0 0 8px ${p.color})`,
                  }}
                >
                  💖
                </div>
              ))}
          </div>

          {/* Lore & Community Energy Progress Bar */}
          <div
            style={{
              width: '100%',
              maxWidth: '380px',
              backgroundColor: 'rgba(6, 12, 22, 0.8)',
              border: '1px solid #1a2636',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.68em', color: '#8fa0ba', marginBottom: '4px' }}>
              {selectedMeetup.lore}
            </div>
            {/* Energy Progress Meter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.64em', color: '#ff3366', fontWeight: 'bold' }}>ENERGY:</span>
              <div
                style={{
                  flex: 1,
                  height: '8px',
                  backgroundColor: '#101c30',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${selectedMeetup.loveEnergy}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #ff3366 0%, #00ffcc 100%)',
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.65em', color: '#00ffcc', fontWeight: 'bold' }}>
                {selectedMeetup.loveEnergy}%
              </span>
            </div>
          </div>

          {/* Bottom Throwing Deck & Pokéball / Love Orb */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              zIndex: 25,
            }}
          >
            {/* Love Orb (Pokéball style Throw mechanism) */}
            <div
              onClick={handleLaunchLoveOrb}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #ff6699 0%, #ff0055 70%, #990033 100%)',
                border: '3px solid #ffffff',
                boxShadow: '0 0 20px rgba(255, 51, 102, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: capturePhase === 'AIMING' ? 'pointer' : 'default',
                transform:
                  capturePhase === 'FLYING'
                    ? 'translateY(-140px) scale(0.5)'
                    : capturePhase === 'IMPACT'
                    ? 'translateY(-150px) scale(0)'
                    : 'scale(1)',
                transition: 'transform 0.65s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                position: 'relative',
              }}
              title="Click or Flick Upwards to Launch Love Orb"
            >
              {/* Center Heart Emblem on Pokéball */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8em',
                  boxShadow: '0 0 6px rgba(0,0,0,0.5)',
                }}
              >
                ❤️
              </div>
            </div>

            {/* Launch Instructions / Action Buttons */}
            {capturePhase === 'AIMING' ? (
              <button
                onClick={handleLaunchLoveOrb}
                style={{
                  padding: '8px 24px',
                  backgroundColor: '#ff3366',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  fontSize: '0.78em',
                  boxShadow: '0 0 15px rgba(255,51,102,0.5)',
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                }}
              >
                💖 TAP TO LAUNCH LOVE ORB
              </button>
            ) : capturePhase === 'CELEBRATING' ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleResetEncounter}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: '#00ffcc',
                    color: '#060b14',
                    border: 'none',
                    borderRadius: '16px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    fontSize: '0.72em',
                    cursor: 'pointer',
                  }}
                >
                  ✨ SEND MORE LOVE
                </button>
                <button
                  onClick={() => {
                    setSelectedMeetup(null);
                    handleResetEncounter();
                  }}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: '#101c30',
                    color: '#8fa0ba',
                    border: '1px solid #1a2636',
                    borderRadius: '16px',
                    fontFamily: 'monospace',
                    fontSize: '0.72em',
                    cursor: 'pointer',
                  }}
                >
                  RETURN TO RADAR
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '0.7em', color: '#00ffcc', fontWeight: 'bold' }}>
                TRANSMITTING COHERENCE PULSE...
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: SCHEDULE OF DAILY REGIONAL MEETUPS */}
      {viewMode === 'SCHEDULE' && (
        <div style={{ padding: '16px' }}>
          <div
            style={{
              fontSize: '0.74em',
              color: '#8fa0ba',
              marginBottom: '14px',
              lineHeight: '1.4',
            }}
          >
            Join regional guardians at these designated synchronized broadcast windows. Anchoring love in areas within a 5-mile radius raises local Schumann coherence and shields the biological matrix.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {meetups.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#080f1d',
                  border: `1px solid ${item.isEnergizedToday ? '#00ffcc' : '#1a2636'}`,
                  borderRadius: '6px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      fontSize: '1.8em',
                      width: '42px',
                      height: '42px',
                      backgroundColor: '#0f1c33',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85em', color: '#ffffff', fontWeight: 'bold' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.68em', color: '#8fa0ba' }}>
                      🕒 {item.scheduledTime} • 📍 {item.distanceMiles} mi away • 👥 {item.participants} Guardians
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.64em', color: '#8fa0ba' }}>AREA HARMONY</div>
                    <div
                      style={{
                        fontSize: '0.9em',
                        color: item.loveEnergy > 70 ? '#00ffcc' : '#ffaa00',
                        fontWeight: 'bold',
                      }}
                    >
                      {item.loveEnergy}%
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedMeetup(item);
                      setViewMode('PORTAL_ENCOUNTER');
                    }}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: item.isEnergizedToday ? 'rgba(0, 255, 204, 0.15)' : '#ff3366',
                      color: item.isEnergizedToday ? '#00ffcc' : '#ffffff',
                      border: item.isEnergizedToday ? '1px solid #00ffcc' : 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.72em',
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                    }}
                  >
                    {item.isEnergizedToday ? '💖 RE-ENERGIZE' : '⚡ TRANSMIT LOVE'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
