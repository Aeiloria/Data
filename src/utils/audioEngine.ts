// Browser-Native Web Audio API Sound Synthesizer Engine & Real-time Analyser
// Specially engineered with Acoustic Sensitivity for Indigos, Empaths, and Neurodivergents
// Includes: Stereo Binaural Beats, Solfeggio 528Hz / 432Hz Harmonics, Low-Pass Warmth Filtering,
// Anti-Click Envelopes, and Anti-Overstimulation Protection.

let audioCtx: AudioContext | null = null;
let oscillatorL: OscillatorNode | null = null;
let oscillatorR: OscillatorNode | null = null;
let pannerL: StereoPannerNode | null = null;
let pannerR: StereoPannerNode | null = null;
let biquadFilter: BiquadFilterNode | null = null;
let gainNode: GainNode | null = null;
let analyserNode: AnalyserNode | null = null;

let currentFrequencyHz: number = 528.0; // Default to 528Hz Solfeggio Love / DNA Transformation
let currentWaveType: OscillatorType = 'sine';
let currentBinauralBeatHz: number = 0.0; // 0 = Monophonic / Centered; >0 = Stereo Binaural Beat
let sensoryComfortMode: boolean = true; // Default ON: Protects hypersensitive nervous systems
let masterVolumeLevel: number = 0.08; // Safe, gentle listening ceiling (ranges 0.01 to 0.20 max)

export interface IndigoPreset {
  name: string;
  frequency: number;
  category: 'indigo' | 'empath' | 'grounding' | 'cleansing';
  description: string;
  harmonicNote: string;
}

export const INDIGO_FREQUENCY_PRESETS: IndigoPreset[] = [
  {
    name: "528 Hz // Allur-E'ah Ra-sha-tan Love",
    frequency: 528.0,
    category: 'indigo',
    description: 'Sacred Solfeggio tone of spiritual rebirth, DNA resonance & biological water coherence.',
    harmonicNote: 'Living Water / Transformation',
  },
  {
    name: '432 Hz // Christos Cosmic Harmonic',
    frequency: 432.0,
    category: 'empath',
    description: 'Natural organic Aah-JhA alignment. Restores vagal harmony and quiets anxious sensory chatter.',
    harmonicNote: 'Autonomic Nervous Balance',
  },
  {
    name: '639 Hz // Celestallon Heart Resonance',
    frequency: 639.0,
    category: 'empath',
    description: 'Solfeggio heart chakra bridge for empathic auric shielding and deep interpersonal connection.',
    harmonicNote: 'Empathic Shield & Bonding',
  },
  {
    name: '852 Hz // Indigo Third-Eye Clarity',
    frequency: 852.0,
    category: 'indigo',
    description: 'Awakens higher intuition, aids sensory processing, and aligns the pineal gland.',
    harmonicNote: 'Intuitive Processing & Vision',
  },
  {
    name: '136.1 Hz // Cosmic Earth OM Tone',
    frequency: 136.1,
    category: 'grounding',
    description: 'Primordial planetary frequency (Year tone). Calms sensory overload, hyper-vigilance and stimming.',
    harmonicNote: 'Deep Grounding & Vagal Calm',
  },
  {
    name: '396 Hz // Root Center Solfeggio',
    frequency: 396.0,
    category: 'grounding',
    description: 'Dispels irrational dread, trauma-freeze responses, and restores physical body security.',
    harmonicNote: 'Releasing Fear & Over-arousal',
  },
  {
    name: '741 Hz // Cellular Transduction & Detoxing',
    frequency: 741.0,
    category: 'cleansing',
    description: 'Clears psychic static, electromagnetic smog, and environmental friction from the auric field.',
    harmonicNote: 'Cellular Cleanse & Intuition',
  },
  {
    name: '963 Hz // Crown Pure Light Equilibrium',
    frequency: 963.0,
    category: 'indigo',
    description: 'Crown center activation, connection to Oneness, and subtle body harmonization.',
    harmonicNote: 'Universal Consciousness',
  },
  {
    name: '174 Hz // Natural Anesthetic Foundation',
    frequency: 174.0,
    category: 'grounding',
    description: 'Lowest Solfeggio frequency. Provides gentle acoustic comfort for body aches and sensory strain.',
    harmonicNote: 'Subtle Body Somatic Relief',
  },
];

export interface BinauralPreset {
  name: string;
  beatHz: number;
  waveband: 'delta' | 'theta' | 'alpha' | 'none';
  description: string;
}

export const BINAURAL_BEAT_PRESETS: BinauralPreset[] = [
  {
    name: '7.83 Hz Schumann Earth Harmony',
    beatHz: 7.83,
    waveband: 'alpha',
    description: 'Earth ionospheric resonance. Induces calm wakefulness and emotional equilibrium.',
  },
  {
    name: '4.5 Hz Shamanic Theta Insight',
    beatHz: 4.5,
    waveband: 'theta',
    description: 'Deep meditative theta waveband. Enhances indigo dream-recall and intuitive processing.',
  },
  {
    name: '2.5 Hz Delta Somatic Restoration',
    beatHz: 2.5,
    waveband: 'delta',
    description: 'Restorative delta rhythm. Supports deep physical grounding, nervous recovery & sleep.',
  },
  {
    name: '10.0 Hz Alpha Sensory Ease',
    beatHz: 10.0,
    waveband: 'alpha',
    description: 'Soothing alpha frequency. Reduces neurodivergent overwhelm while staying clear and focused.',
  },
  {
    name: 'Pure Single Monophonic Tone',
    beatHz: 0.0,
    waveband: 'none',
    description: 'Zero phase-offset monophonic playback across both ears.',
  },
];

export const getAnalyserNode = (): AnalyserNode | null => analyserNode;

export const isAudioRunning = (): boolean => {
  return (oscillatorL !== null || oscillatorR !== null) && audioCtx !== null && audioCtx.state === 'running';
};

export const getSensoryComfortMode = (): boolean => sensoryComfortMode;
export const getMasterVolumeLevel = (): number => masterVolumeLevel;
export const getBinauralBeatOffset = (): number => currentBinauralBeatHz;

export const setSensoryComfortMode = (enabled: boolean): void => {
  sensoryComfortMode = enabled;
  if (biquadFilter && audioCtx) {
    const targetCutoff = enabled ? 720 : 1800;
    biquadFilter.frequency.exponentialRampToValueAtTime(targetCutoff, audioCtx.currentTime + 0.3);
  }
};

export const setMasterVolume = (volume: number): void => {
  masterVolumeLevel = Math.max(0.005, Math.min(0.20, volume));
  if (gainNode && audioCtx && isAudioRunning()) {
    gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(masterVolumeLevel, audioCtx.currentTime + 0.1);
  }
};

const getOrCreateAudioContext = (): AudioContext | null => {
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) {
      console.warn('Web Audio API is not supported in this client environment.');
      return null;
    }
    audioCtx = new AudioCtxClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

/**
 * Updates binaural beat offset on-the-fly with zero click artifacts
 */
export const setBinauralBeatOffset = (beatHz: number): void => {
  currentBinauralBeatHz = Math.max(0, beatHz);
  if (!audioCtx || !isAudioRunning()) return;

  const now = audioCtx.currentTime;
  if (oscillatorL && oscillatorR) {
    oscillatorL.frequency.cancelScheduledValues(now);
    oscillatorR.frequency.cancelScheduledValues(now);

    const base = Math.max(20, currentFrequencyHz);
    oscillatorL.frequency.exponentialRampToValueAtTime(base, now + 0.25);

    const targetR = currentBinauralBeatHz > 0 ? base + currentBinauralBeatHz : base;
    oscillatorR.frequency.exponentialRampToValueAtTime(Math.max(20, targetR), now + 0.25);
  }
};

/**
 * Starts or updates the audio protection frequency generator
 * Fully supports stereo Binaural Beats and acoustic low-pass warmth filtering
 */
export const startAudioProtectionFreq = (
  frequency: number = currentFrequencyHz,
  waveType: OscillatorType = currentWaveType,
  binauralBeatHz: number = currentBinauralBeatHz
): void => {
  try {
    currentFrequencyHz = frequency;
    currentBinauralBeatHz = binauralBeatHz;

    // Convert abrasive waveforms to pure sine or smooth triangle if Sensory Comfort Mode is active
    currentWaveType = sensoryComfortMode && waveType === 'sawtooth' ? 'sine' : waveType;

    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // If oscillators are already humming, smoothly glide both channels to target frequencies
    if (oscillatorL && oscillatorR) {
      const baseFreq = Math.max(20, currentFrequencyHz);
      const rightFreq = currentBinauralBeatHz > 0 ? baseFreq + currentBinauralBeatHz : baseFreq;

      oscillatorL.frequency.cancelScheduledValues(now);
      oscillatorR.frequency.cancelScheduledValues(now);

      oscillatorL.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.25);
      oscillatorR.frequency.exponentialRampToValueAtTime(Math.max(20, rightFreq), now + 0.25);

      oscillatorL.type = currentWaveType;
      oscillatorR.type = currentWaveType;
      return;
    }

    // 1. Analyser Node for Oscilloscope Canvas
    if (!analyserNode) {
      analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.88;
    }

    // 2. Warm Low-Pass Filter (prevents piercing frequencies that stress sensory systems)
    biquadFilter = ctx.createBiquadFilter();
    biquadFilter.type = 'lowpass';
    biquadFilter.frequency.setValueAtTime(sensoryComfortMode ? 720 : 1600, now);
    biquadFilter.Q.setValueAtTime(0.707, now);

    // 3. Master Volume Envelope Node
    gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    // Smooth 350ms fade-in ramp protects sensitive nervous systems
    gainNode.gain.exponentialRampToValueAtTime(masterVolumeLevel, now + 0.35);

    // 4. Stereo Oscillators & Panners for Binaural Beats
    const baseFreq = Math.max(20, currentFrequencyHz);
    const rightFreq = currentBinauralBeatHz > 0 ? baseFreq + currentBinauralBeatHz : baseFreq;

    // Left Channel Oscillator
    oscillatorL = ctx.createOscillator();
    oscillatorL.type = currentWaveType;
    oscillatorL.frequency.setValueAtTime(baseFreq, now);

    // Right Channel Oscillator
    oscillatorR = ctx.createOscillator();
    oscillatorR.type = currentWaveType;
    oscillatorR.frequency.setValueAtTime(Math.max(20, rightFreq), now);

    // Stereo Panning (Left = -0.95, Right = +0.95 for comfortable spatial separation)
    if (typeof ctx.createStereoPanner === 'function') {
      pannerL = ctx.createStereoPanner();
      pannerL.pan.setValueAtTime(currentBinauralBeatHz > 0 ? -0.95 : 0, now);

      pannerR = ctx.createStereoPanner();
      pannerR.pan.setValueAtTime(currentBinauralBeatHz > 0 ? 0.95 : 0, now);

      oscillatorL.connect(pannerL);
      oscillatorR.connect(pannerR);

      pannerL.connect(biquadFilter);
      pannerR.connect(biquadFilter);
    } else {
      // Fallback for environments without StereoPanner
      oscillatorL.connect(biquadFilter);
      oscillatorR.connect(biquadFilter);
    }

    biquadFilter.connect(analyserNode);
    analyserNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillatorL.start();
    oscillatorR.start();

    console.log(
      `🔊 [SENSORY-SAFE AUDIO] Broadcasting: ${currentFrequencyHz}Hz (${currentWaveType}) with Binaural Beat +${currentBinauralBeatHz}Hz`
    );
  } catch (error) {
    console.error('Audio initialization encountered an error:', error);
  }
};

/**
 * Smoothly stops the audio protection frequency with a soft release ramp
 */
export const stopAudioProtectionFreq = (): void => {
  if (!gainNode || !audioCtx) return;

  try {
    const ctx = audioCtx;
    const now = ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    // Soft exponential fade-out over 300ms prevents acoustic pop
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);

    setTimeout(() => {
      try {
        if (oscillatorL) {
          oscillatorL.stop();
          oscillatorL.disconnect();
          oscillatorL = null;
        }
        if (oscillatorR) {
          oscillatorR.stop();
          oscillatorR.disconnect();
          oscillatorR = null;
        }
        if (pannerL) {
          pannerL.disconnect();
          pannerL = null;
        }
        if (pannerR) {
          pannerR.disconnect();
          pannerR = null;
        }
        if (biquadFilter) {
          biquadFilter.disconnect();
          biquadFilter = null;
        }
        if (gainNode) {
          gainNode.disconnect();
          gainNode = null;
        }
        console.log('🔇 [SENSORY-SAFE AUDIO] Frequency broadcast gently released');
      } catch (e) {
        // Safe release
      }
    }, 320);
  } catch (error) {
    console.error('Audio release encountered an error:', error);
  }
};

/**
 * Empathic, gentle chime synthesizers for UI feedback, tactile signals, and meditative cues.
 * Completely free of abrasive clicks, high-pitched buzzers, or startling frequencies.
 */
export type ChimeTone = 'love' | 'ground' | 'shield' | 'ping' | 'sos' | 'breathe';

export const playEmpathicChime = (tone: ChimeTone): void => {
  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    let baseFreq = 528.0; // 528Hz Solfeggio Love / DNA Transformation
    let overtoneFreq = 1056.0;
    let duration = 1.6;
    let peakVol = Math.min(masterVolumeLevel * 0.9, 0.08);

    if (tone === 'love') {
      baseFreq = 528.0;      // 528Hz Love Tone
      overtoneFreq = 639.0;  // 639Hz Heart Chakra
      duration = 2.2;
    } else if (tone === 'ground') {
      baseFreq = 432.0;      // 432Hz Christos Cosmic Alignment
      overtoneFreq = 136.1;  // 136.1Hz Earth Om Frequency
      duration = 2.5;
      peakVol = Math.min(masterVolumeLevel * 0.8, 0.07);
    } else if (tone === 'shield') {
      baseFreq = 741.0;      // 741Hz Cellular Cleansing
      overtoneFreq = 528.0;
      duration = 1.8;
    } else if (tone === 'ping') {
      baseFreq = 528.0;      // Gentle crystalline ping
      overtoneFreq = 792.0;  // Perfect fifth harmonic
      duration = 1.0;
      peakVol = Math.min(masterVolumeLevel * 0.6, 0.05);
    } else if (tone === 'breathe') {
      baseFreq = 136.1;      // Earth Om Sub-harmonic
      overtoneFreq = 272.2;
      duration = 3.4;        // Long meditative breath envelope
      peakVol = Math.min(masterVolumeLevel * 0.7, 0.06);
    } else if (tone === 'sos') {
      baseFreq = 396.0;      // 396Hz Root grounding / releasing fear
      overtoneFreq = 594.0;
      duration = 2.4;
      peakVol = Math.min(masterVolumeLevel * 1.1, 0.10);
    }

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(overtoneFreq, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, now);
    filter.Q.setValueAtTime(0.707, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peakVol, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);

    setTimeout(() => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch (e) {
        // safe cleanup
      }
    }, (duration + 0.1) * 1000);
  } catch (err) {
    console.warn('Empathic chime generator caught:', err);
  }
};
