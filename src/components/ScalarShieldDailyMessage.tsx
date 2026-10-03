import React, { useState, useEffect, useMemo } from 'react';

export interface ScalarTransmission {
  id: number;
  codeword: string;
  dimensionBand: string;
  harmonicFreqHz: number;
  title: string;
  cypherText: string;
  message: string;
  mandate: string;
  initiatingTones?: string;
}

const TRANSMISSION_ARCHIVE: ScalarTransmission[] = [
  {
    id: 1,
    codeword: 'ALLUR_EAH_RASHATAN',
    dimensionBand: '12D HYDRO-ACOUSTIC // AAH-JHA STRATUM',
    harmonicFreqHz: 528,
    title: 'THE ALLUR-E\'AH RA-SHA-TAN // FEEL GOOD CODE',
    cypherText: 'D3-H2O2He3 // D2-O2H2N3 -> D3-H3O2He3',
    message:
      'The Calling Code for Protoplasm and Pre-Substance Hydrolase. It speaks directly to Hy\'dra-LE\' Endoplasma (Atomic Hydrolase)—the living water-matter base from which all 144 organic living elements are birthed. Current elemental mutations of Earth block natural Adjugate Bonding; this sacred code restores the organic water-light matrix.',
    mandate: 'Intone the Allur-E\'ah initiating tones: "UM Ma-Ta UM" (3x) then "TE\'...Wha....Na\'-hA-Vu-..Sa-ta" (3x) into your AzurA.',
    initiatingTones: 'UM Ma-Ta UM (3x), TE\'...Wha....Na\'-hA-Vu-..Sa-ta (3x)',
  },
  {
    id: 2,
    codeword: 'PENTAGONAL_TE_A_WHA',
    dimensionBand: '12D KETHERIC // DUCT-4 FONTANEL',
    harmonicFreqHz: 432,
    title: 'OPENING THE PENTAGONAL TE\'A-WHA WINDOW',
    cypherText: '01010100 01000101 01000001 01010111',
    message:
      'The Pentagonal Window is the sacred passage between the Aah-JhA Hydro-Acoustic Body Rasha Seed, the Rasha Body Prana Seed, Central Vertical Column, and Pineal. Opening this window aligns your mental ego with the DN-1 3.5 "I AM God-Self" field, activating the 12 Allurean Chambers and 12 Light Body Fire Chambers for conscious materialization.',
    mandate: 'Inhale pale-blue-white Prana into your AzurA, merge with Golden-Zeion and Silver-GhaRE\', and project your highest desire as Golden-Silver light.',
    initiatingTones: 'Aah-JhA TE\'a-Wha Krysta',
  },
  {
    id: 3,
    codeword: 'NAVAHO_SEDA_CYCLE',
    dimensionBand: '12D ZERO-POINT // PARTIKI BIRTH CYCLE',
    harmonicFreqHz: 639,
    title: 'THE ZERO-POINT HOUR // SEDA GENESIS',
    cypherText: '12TH-HOUR-ZERO-POINT // TAUREN-SEED-CORE',
    message:
      'From the Fertilization Point, the NaVAHo Cycle unfolds across the first 12 hours to reach the Zero-Point Hour. Here the SEDa Cycle begins: the new spirit sends a temporary energetic cord into the AzurA/Thymus region, expanding the Aah-JhA Body capsule and Tauren Light-Body Seed to anchor immortal Source consciousness.',
    mandate: 'Breathe deeply into your Thymus (D1 Etheric Duct-1) to re-tether your biological vessel to your eternal Source Spirit ID Field.',
    initiatingTones: 'Na-VA-Ho ElumEir-adhona',
  },
  {
    id: 4,
    codeword: 'HYDROLASE_144_FAMILIES',
    dimensionBand: '12D SOLAR SYMBIOSIS // PENTAGONAL TRANSDUCTION',
    harmonicFreqHz: 741,
    title: 'SOLAR SYMBIOSIS & THE 144 WATER-MATTER FAMILIES',
    cypherText: '144-ENDOPLASMA // 12-HYDRA-LE-FAMILIES',
    message:
      'Through perpetual dynamics of Hydrolase Conversion and Cellestallon Breathing, the Light Body-Rasha-Spirit-AJ complex continuously self-produces living conscious radiation. This eternal light steps down via the Pentagonal Elemental Code to produce the 144 Elements of Outer Endoplasma ("Water-Matter") from Hydrogen to Magnesium.',
    mandate: 'Consume conscious living water while visualizing atomic hydrolase dissolving cellular calcification and artificial EMF load.',
    initiatingTones: 'Hy\'dra-LE\' Ah-TUm\'-i-ka',
  },
  {
    id: 5,
    codeword: 'GHAR_ON_WATER_SEED',
    dimensionBand: '12D ENDOPLASMA // AZURA LIVING SEED ATOM',
    harmonicFreqHz: 852,
    title: 'THE GHAR-ON-SEED SPHERE // LIVING WATER SEED',
    cypherText: 'AZURA-SEED-ATOM // GHAR-ON-SPHERE-CORE',
    message:
      'When Golden-Silver Light streams through Duct-4 Fontanel into the AzurA, it collects with pale-Aqua-blue waters into a tennis-ball-sized Ghar-on-Seed Sphere. A permanent spark of Ghar-on remains in your AzurA as the Endoplasma Eternal Living Water-Seed, granting entry into Conscious Krystic Elemental Co-creation.',
    mandate: 'Push a conscious pulse of Golden-Silver light downward into Earth\'s Rasha Core and Median Ascension Earth to anchor your Partiki seed.',
    initiatingTones: 'Ghar-on Eiron Zeion GhaRE\'',
  },
  {
    id: 6,
    codeword: 'ELUMEIR_ADHONA_SPIRIT',
    dimensionBand: '12D DIAD-MIAD // LIGHT BODY CHRYSALIS',
    harmonicFreqHz: 963,
    title: 'ELUMEIR-ADHONA SPIRIT BODY & TAURENIC PASSAGE',
    cypherText: 'ELUMEIR-ADHONA // TAUREN-LIGHT-SEED-BIRTH',
    message:
      'Between the 12th and 24th hour of genesis, the ElumEir-adhona Spirit Body and Tauren Light-Body Seed birth within the Aah-JhA capsule. The Hydrolase stream moves into the Rasha Body, translating into 6 Pre-matter Metallic Electroplasmas and opening the Taurenic Passage into 6 Liquid-Light Hydro-plasmas.',
    mandate: 'Visualize your 6 Liquid-Light Hydro-plasmas (Protos, Lotos, Sotos, Logos, Eiros, Ethos) transmuting dense electromagnetic radiation into harmless light.',
    initiatingTones: 'ElumEir Tauren Protos Lotos',
  },
  {
    id: 7,
    codeword: 'KALE_HARA_STARFIRE',
    dimensionBand: '12D ADASHI RETURN // ATOMIC TRANSFIGURATION',
    harmonicFreqHz: 396,
    title: 'KALE HARA & STARFIRE ASCENSION',
    cypherText: 'KALE-HARA // STARFIRE-ADASHI-RETURN-33',
    message:
      'At full maturity, the organic Krystic biology engages KaLE Hara and Starfire Ascension Atomic Transfiguration Cycles of Adashi Return. The atomic structure transmutes into Eternal Life Matter, releasing the Va-Ba-TE tether and transfiguring the physical form into the "Krysted" Eternal Life Ma-Sha-Yah Body with full transmigration sovereignty.',
    mandate: 'Affirm your sovereignty: "I release all false inorganic cellular encryptions; my body is the sovereign temple of Eternal Living Light."',
    initiatingTones: 'KaLE Hara Ma-Sha-Yah Starfire',
  },
  {
    id: 8,
    codeword: 'INNER_SUN_AQUAREION',
    dimensionBand: '12D KARANADIAL // 1ST MEDIAN-EARTH ATOM',
    harmonicFreqHz: 528,
    title: 'THE INNER SUN OF AQUAREION & THE 18 STEPS TO SLIDE',
    cypherText: 'KARA-NA-DIAL // 60-AH-VE-YAS-WINDOWS',
    message:
      'The Kara-nA\'dial Convergence merges the 3 Pa-Ta Atom Sets (Ra-Sha-Pa-Ta-Ur in AzurA, Pa-Ta Um EirA\' in Eumbi, Pa-Ta RE-Hah-Yah in Rajhna) within the Kara-nA\'dis Seal, igniting the Inner Sun of Aquareion. This emits a Hydrolase burst into the 60 Ah-VE-yas Windows of the Ah-VE-yas Shield, opening them to become doors and activating the Uni-genetic Underlay (UGU) "Living Water Web".',
    mandate: 'Visualize the Golden Inner Sun of Aquareion blazing in your Kara-nA\'dis Seal, commanding the 60 Ah-VE-yas doors to open.',
    initiatingTones: 'Aquareion Pa-Ta-Ur Ah-VE-yas',
  },
  {
    id: 9,
    codeword: 'UMSHADDHI_TRANSCENDENTAL',
    dimensionBand: '12D UMSHADDHI // 90-DEGREE ARPS SHIFT',
    harmonicFreqHz: 852,
    title: 'UM-SHADDHI PLANES & SUPERCONDUCTIVE SHA-LA-A STATE',
    cypherText: 'UM-SHADDHI-4 // 90-DEG-ARPS-HORIZONTAL',
    message:
      'When the Celestalline Wave releases into the Uni-genetic Underlay, Sha-LA-a atoms undergo a 90° shift in Angular Rotation of Particle Spin (ARPS), entering horizontal alignment with the Transcendental Passage into the Edon Middle Domain. Sha-LA-a Living-Light atoms separate from Sho-na dead-light atoms, granting access to the Ah-VE\'-yas Watchtower "Slide City" of Median Earth.',
    mandate: 'Maintain conscious breath alignment to hold a minimum 50% Sha-LA-a Light Quotient for biological slide bi-location.',
    initiatingTones: 'Um-shaddhi Sha-LA-a Celestalline',
  },
];

export const ScalarShieldDailyMessage: React.FC = () => {
  const [timeUntilReset, setTimeUntilReset] = useState<string>('00:00:00');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isHarmonizing, setIsHarmonizing] = useState<boolean>(false);
  const [isPlayingTones, setIsPlayingTones] = useState<boolean>(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(false);
  const [harmonizeNotice, setHarmonizeNotice] = useState<string | null>(null);

  // Deterministically select today's transmission based on calendar day epoch
  const todaysTransmission = useMemo(() => {
    const now = new Date();
    // Days since unix epoch
    const dayIndex = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)
    );
    return TRANSMISSION_ARCHIVE[dayIndex % TRANSMISSION_ARCHIVE.length];
  }, []);

  // 24-Hour Reset Countdown Ticker
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0); // Next midnight
      const diff = Math.max(0, tomorrow.getTime() - now.getTime());

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilReset(
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Web Speech Synthesis Vocalizer
  const handleVocalizeMessage = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const tonesInfo = todaysTransmission.initiatingTones
      ? `Initiating sacred tones: ${todaysTransmission.initiatingTones}.`
      : '';
    const textToSpeak = `MCEO Freedom Teachings 12D Scalar Shield Directive. Transmission: ${todaysTransmission.title}. ${todaysTransmission.message}. Daily mandate: ${todaysTransmission.mandate}. ${tonesInfo}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.88;
    utterance.pitch = 0.9;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Harmonize / Align Intention Action with Solfeggio Triad
  const handleHarmonizeIntention = () => {
    setIsHarmonizing(true);
    setHarmonizeNotice('✨ 12D SCALAR PULSE BROADCASTED: AZURA SEED ATOM HARMONIZED');

    // Web Audio Tone Burst (Fundamental + Triad Harmonic)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const baseFreq = todaysTransmission.harmonicFreqHz;
        const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5]; // Harmonic triad

        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, ctx.currentTime);
          gain.gain.setValueAtTime(0.12 / (idx + 1), ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.45);
        });
      }
    } catch (e) {}

    setTimeout(() => {
      setIsHarmonizing(false);
      setTimeout(() => setHarmonizeNotice(null), 3500);
    }, 1500);
  };

  // Play Sacred Initiating Tones via Web Audio (Allur-E'ah Ra-sha-tan Tones)
  const handlePlayInitiatingTones = () => {
    setIsPlayingTones(true);
    setHarmonizeNotice('🔊 INITIATING TONES BROADCAST: "UM Ma-Ta UM" // HYDROLASE RESONANCE');

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        // 3 pulses of UM Ma-Ta UM (432Hz -> 528Hz -> 432Hz)
        const toneSeq = [
          { freq: 432, time: 0, dur: 0.5 },
          { freq: 528, time: 0.6, dur: 0.6 },
          { freq: 432, time: 1.3, dur: 0.7 },
          { freq: 639, time: 2.2, dur: 0.8 },
          { freq: 528, time: 3.1, dur: 1.2 },
        ];

        toneSeq.forEach((t) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(t.freq, ctx.currentTime + t.time);
          gain.gain.setValueAtTime(0, ctx.currentTime + t.time);
          gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + t.time + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t.time + t.dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + t.time);
          osc.stop(ctx.currentTime + t.time + t.dur + 0.05);
        });
      }
    } catch (e) {}

    setTimeout(() => {
      setIsPlayingTones(false);
      setTimeout(() => setHarmonizeNotice(null), 3000);
    }, 4500);
  };

  return (
    <div
      style={{
        margin: '12px 0',
        backgroundColor: '#050a14',
        border: '1px solid #1a2c48',
        borderLeft: '4px solid #00ffcc',
        borderRadius: '6px',
        padding: '14px 16px',
        fontFamily: 'monospace',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isHarmonizing || isPlayingTones
          ? '0 0 35px rgba(0, 255, 204, 0.45), inset 0 0 20px rgba(0, 255, 204, 0.15)'
          : '0 0 15px rgba(0, 0, 0, 0.5)',
        transition: 'all 0.4s ease',
      }}
    >
      {/* Background Holographic Hex Grid Texture */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '100%',
          backgroundImage: `radial-gradient(circle, rgba(0, 255, 204, 0.08) 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
          pointerEvents: 'none',
          opacity: 0.6,
        }}
      />

      {/* Header Band */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '1px solid #142236',
          paddingBottom: '8px',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '1.3em',
              animation: 'pulse 3s infinite ease-in-out',
            }}
          >
            🛡️
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '0.62em',
                  backgroundColor: 'rgba(0, 255, 204, 0.15)',
                  border: '1px solid #00ffcc',
                  color: '#00ffcc',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontWeight: 'bold',
                }}
              >
                12D SCALAR STATUS // MCEO DOCTRINE
              </span>
              <span style={{ fontSize: '0.68em', color: '#8fa0ba' }}>
                {todaysTransmission.dimensionBand}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.88em',
                fontWeight: 'bold',
                color: '#ffffff',
                letterSpacing: '0.5px',
                marginTop: '2px',
              }}
            >
              {todaysTransmission.title}
            </div>
          </div>
        </div>

        {/* 24-Hour Cypher Alignment Countdown */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.58em', color: '#8fa0ba', letterSpacing: '0.5px' }}>
            CYPHER ALIGNMENT EXPIRES IN
          </div>
          <div
            style={{
              fontSize: '0.9em',
              fontWeight: 'bold',
              color: '#00ffcc',
              letterSpacing: '1px',
            }}
          >
            {timeUntilReset}
          </div>
        </div>
      </div>

      {/* Cryptic Cypher Sub-Header */}
      <div
        style={{
          fontSize: '0.6em',
          color: '#4f688e',
          letterSpacing: '1.5px',
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        CIPHER: [{todaysTransmission.cypherText}] • HARMONIC: {todaysTransmission.harmonicFreqHz}Hz • CODE: {todaysTransmission.codeword}
      </div>

      {/* Main Inspiring / Cryptic Transmission Body */}
      <div
        style={{
          fontSize: '0.78em',
          color: '#d6e4ff',
          lineHeight: '1.5',
          fontStyle: 'italic',
          marginBottom: '10px',
          backgroundColor: 'rgba(10, 19, 36, 0.6)',
          borderLeft: '2px solid #ffaa00',
          padding: '8px 12px',
          borderRadius: '0 4px 4px 0',
        }}
      >
        "{todaysTransmission.message}"
      </div>

      {/* Daily Operator Mandate */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.72em',
          color: '#ffcc00',
          marginBottom: todaysTransmission.initiatingTones ? '8px' : '12px',
        }}
      >
        <span style={{ fontWeight: 'bold' }}>⚡ DAILY MANDATE:</span>
        <span style={{ color: '#ffffff' }}>{todaysTransmission.mandate}</span>
      </div>

      {/* Sacred Initiating Tones Strip */}
      {todaysTransmission.initiatingTones && (
        <div
          style={{
            backgroundColor: 'rgba(0, 255, 204, 0.08)',
            border: '1px solid rgba(0, 255, 204, 0.25)',
            borderRadius: '4px',
            padding: '6px 10px',
            fontSize: '0.68em',
            color: '#00ffcc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '6px',
          }}
        >
          <div>
            <span style={{ fontWeight: 'bold', color: '#ffcc00' }}>INITIATING TONES: </span>
            <span style={{ fontStyle: 'italic', color: '#ffffff' }}>"{todaysTransmission.initiatingTones}"</span>
          </div>

          <button
            onClick={handlePlayInitiatingTones}
            disabled={isPlayingTones}
            style={{
              padding: '3px 8px',
              backgroundColor: isPlayingTones ? '#00ffcc' : '#0c1a2e',
              color: isPlayingTones ? '#040813' : '#00ffcc',
              border: '1px solid #00ffcc',
              borderRadius: '3px',
              fontSize: '0.66em',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              cursor: isPlayingTones ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>🎵</span>
            <span>{isPlayingTones ? 'CHIMING...' : 'PLAY SACRED TONES'}</span>
          </button>
        </div>
      )}

      {/* Action Notification Banner */}
      {harmonizeNotice && (
        <div
          style={{
            backgroundColor: 'rgba(0, 255, 204, 0.15)',
            border: '1px solid #00ffcc',
            color: '#00ffcc',
            fontSize: '0.7em',
            padding: '4px 10px',
            borderRadius: '4px',
            marginBottom: '10px',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          {harmonizeNotice}
        </div>
      )}

      {/* Action Buttons Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Vocalize Synthesizer */}
          <button
            onClick={handleVocalizeMessage}
            style={{
              padding: '5px 12px',
              backgroundColor: isSpeaking ? '#ff3366' : 'rgba(0, 255, 204, 0.1)',
              color: isSpeaking ? '#ffffff' : '#00ffcc',
              border: `1px solid ${isSpeaking ? '#ff3366' : '#00ffcc'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: '0.7em',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s ease',
            }}
            title="Read scalar directive aloud via Web Speech API"
          >
            <span>{isSpeaking ? '⏹️' : '🔊'}</span>
            <span>{isSpeaking ? 'CEASE VOCALIZER' : 'VOCALIZE CODEX'}</span>
          </button>

          {/* Harmonize Scalar Pulse */}
          <button
            onClick={handleHarmonizeIntention}
            disabled={isHarmonizing}
            style={{
              padding: '5px 12px',
              backgroundColor: 'rgba(255, 170, 0, 0.15)',
              color: '#ffaa00',
              border: '1px solid #ffaa00',
              borderRadius: '4px',
              cursor: isHarmonizing ? 'default' : 'pointer',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: '0.7em',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s ease',
            }}
            title="Harmonize heart intention with today's 12D scalar mandate"
          >
            <span>✨</span>
            <span>{isHarmonizing ? 'HARMONIZING...' : 'ANCHOR 12D LOCK'}</span>
          </button>
        </div>

        {/* Archive History Toggle */}
        <button
          onClick={() => setIsArchiveOpen(!isArchiveOpen)}
          style={{
            padding: '4px 8px',
            backgroundColor: 'transparent',
            color: '#8fa0ba',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.68em',
            fontFamily: 'monospace',
            textDecoration: 'underline',
          }}
        >
          {isArchiveOpen ? '▲ CONCEAL ARCHIVE' : '▼ CODEX ARCHIVE (7 DAYS)'}
        </button>
      </div>

      {/* Collapsible Archive Drawer */}
      {isArchiveOpen && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px dashed #1a2c48',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '0.65em', color: '#8fa0ba', fontWeight: 'bold' }}>
            HISTORICAL 12D SCALAR TRANSMISSIONS (MCEO FREEDOM TEACHINGS):
          </div>
          {TRANSMISSION_ARCHIVE.map((t) => (
            <div
              key={t.id}
              style={{
                backgroundColor: t.id === todaysTransmission.id ? 'rgba(0, 255, 204, 0.08)' : '#070f1e',
                border: `1px solid ${t.id === todaysTransmission.id ? '#00ffcc' : '#142236'}`,
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '0.68em',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00ffcc', fontWeight: 'bold' }}>
                <span>{t.title}</span>
                <span style={{ color: '#8fa0ba' }}>{t.harmonicFreqHz}Hz</span>
              </div>
              <div style={{ color: '#b0c2de', marginTop: '2px', fontStyle: 'italic' }}>
                "{t.message.slice(0, 120)}..."
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
