// Browser-Native Web Audio API Sound Synthesizer Engine & Real-time Analyser

let audioCtx: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let analyserNode: AnalyserNode | null = null;

let currentFrequencyHz: number = 432.0;
let currentWaveType: OscillatorType = 'sine';

export const getAnalyserNode = (): AnalyserNode | null => analyserNode;

export const isAudioRunning = (): boolean => {
  return oscillator !== null && audioCtx !== null && audioCtx.state === 'running';
};

/**
 * Initializes and starts the audio protection frequency generator
 */
export const startAudioProtectionFreq = (
  frequency: number = currentFrequencyHz,
  waveType: OscillatorType = currentWaveType
): void => {
  try {
    currentFrequencyHz = frequency;
    currentWaveType = waveType;

    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        console.warn('Web Audio API is not supported in this client environment.');
        return;
      }
      audioCtx = new AudioCtxClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // If an oscillator is already actively humming, dynamically update frequency and waveform on-the-fly
    if (oscillator) {
      oscillator.frequency.setValueAtTime(currentFrequencyHz, audioCtx.currentTime);
      oscillator.type = currentWaveType;
      return;
    }

    // Create AnalyserNode for oscilloscope canvas
    if (!analyserNode) {
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.85;
    }

    // Instantiate high-fidelity oscillator source channel
    oscillator = audioCtx.createOscillator();
    oscillator.type = currentWaveType;
    oscillator.frequency.setValueAtTime(currentFrequencyHz, audioCtx.currentTime);

    // Configure standard Gain (Volume) control envelope to prevent click artifacts
    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.15);

    // Connect structural pipeline layout: Source -> Analyser -> Volume -> Audio Destination
    oscillator.connect(analyserNode);
    analyserNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    console.log(`🔊 [AUDIO ENGINE] Broadcasting at ${currentFrequencyHz}Hz (${currentWaveType})`);
  } catch (error) {
    console.error('Browser Web Audio API initialization channel blocked:', error);
  }
};

/**
 * Smoothly stops the audio protection frequency with a fade-out ramp
 */
export const stopAudioProtectionFreq = (): void => {
  if (!oscillator || !gainNode || !audioCtx) return;

  try {
    // Smoothly fade out volume over 0.25 seconds to protect speakers/hardware
    gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);

    setTimeout(() => {
      try {
        if (oscillator) {
          oscillator.stop();
          oscillator.disconnect();
          oscillator = null;
        }
        if (gainNode) {
          gainNode.disconnect();
          gainNode = null;
        }
        console.log('🔇 [AUDIO ENGINE] Frequency broadcast deactivated');
      } catch (e) {
        // ignore already stopped
      }
    }, 280);
  } catch (error) {
    console.error('Audio engine tracking release encountered an error:', error);
  }
};
