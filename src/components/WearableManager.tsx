import React, { useState, useEffect, useRef } from 'react';
import { useGridWearableBLE, AlertLevel } from '../hooks/useGridWearableBLE';
import { playEmpathicChime } from '../utils/audioEngine';

export { type AlertLevel };

export type SensitivityPreset = 'LIGHT' | 'BALANCED' | 'FIRM' | 'CUSTOM';

interface TactileSensitivityConfig {
  preset: SensitivityPreset;
  doubleTapMs: number; // Max interval between taps to register double-tap
  hardPressMs: number; // Minimum hold duration to register hard press
  forceRatingN: number; // Approximate tactile force in Newtons
}

const PRESET_CONFIGS: Record<Exclude<SensitivityPreset, 'CUSTOM'>, Omit<TactileSensitivityConfig, 'preset'>> = {
  LIGHT: {
    doubleTapMs: 550,
    hardPressMs: 500,
    forceRatingN: 1.2,
  },
  BALANCED: {
    doubleTapMs: 380,
    hardPressMs: 850,
    forceRatingN: 2.4,
  },
  FIRM: {
    doubleTapMs: 250,
    hardPressMs: 1400,
    forceRatingN: 4.5,
  },
};

interface WearableManagerProps {
  onSosTriggered?: (sosData: { timestamp: string; heartRate: number; hrv: number }) => void;
}

const STORAGE_KEY = 'grid_guardian_wearable_sensitivity';

export const WearableManager: React.FC<WearableManagerProps> = ({ onSosTriggered }) => {
  const {
    isConnected,
    heartRate,
    alertLevel,
    connectDevice,
    disconnectDevice,
    simulateHardwareInput: bleSimulateInput,
    bleError,
    isSimulatedMode,
  } = useGridWearableBLE();

  // Synthetic HRV derived from incoming heart rate stream
  const hrv = isConnected ? Math.max(20, Math.round(100 - ((heartRate || 80) * 0.5))) : 0;

  const [sosBanner, setSosBanner] = useState<string | null>(null);
  const prevAlertRef = useRef<AlertLevel>(alertLevel);

  // Tactile Sensitivity Settings State
  const [sensitivity, setSensitivity] = useState<TactileSensitivityConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore parse error
    }
    return {
      preset: 'BALANCED',
      ...PRESET_CONFIGS.BALANCED,
    };
  });

  const [showAdvancedSliders, setShowAdvancedSliders] = useState(false);

  // Interactive Tactile Calibration Pad States
  const [padPressing, setPadPressing] = useState(false);
  const [padProgress, setPadProgress] = useState(0); // 0 to 100%
  const [lastTriggerFeedback, setLastTriggerFeedback] = useState<string | null>(null);

  const pressStartTimeRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Persist sensitivity configuration
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sensitivity));
    } catch {
      // LocalStorage access failsafe
    }
  }, [sensitivity]);

  // Monitor alertLevel changes to trigger SOS or notification with sensitive, empathic chimes
  useEffect(() => {
    if (prevAlertRef.current !== alertLevel) {
      if (alertLevel === 'RED') {
        playEmpathicChime('sos'); // Warm, grounding Tibetan singing bowl
        const message = 'CRITICAL SOS: Red panic button depressed. Broadcasting to local grid and emergency services.';
        setSosBanner(message);
        if (onSosTriggered) {
          onSosTriggered({
            timestamp: new Date().toISOString(),
            heartRate: Math.round(heartRate || 85),
            hrv: Math.round(hrv || 58),
          });
        }
      } else if (alertLevel === 'YELLOW') {
        playEmpathicChime('ground'); // Gentle 432Hz grounding bell
        setSosBanner('BOUNDARY CHECK: Yellow double-tap received. Proximity radius monitored.');
        const timer = setTimeout(() => setSosBanner(null), 4000);
        return () => clearTimeout(timer);
      } else if (alertLevel === 'GREEN' && prevAlertRef.current !== 'OFFLINE') {
        playEmpathicChime('ping'); // Soft 528Hz crystalline ping
        setSosBanner(null);
      }
      prevAlertRef.current = alertLevel;
    }
  }, [alertLevel, heartRate, hrv, onSosTriggered]);

  const handleSimulateInput = (level: AlertLevel) => {
    if (!isConnected) return;
    bleSimulateInput(level);
  };

  // Change preset
  const handleSelectPreset = (newPreset: SensitivityPreset) => {
    if (newPreset === 'CUSTOM') {
      setSensitivity((prev) => ({
        ...prev,
        preset: 'CUSTOM',
      }));
      setShowAdvancedSliders(true);
      return;
    }

    const config = PRESET_CONFIGS[newPreset];
    setSensitivity({
      preset: newPreset,
      ...config,
    });
  };

  // Adjust Double-Tap Threshold
  const handleDoubleTapChange = (val: number) => {
    setSensitivity((prev) => ({
      ...prev,
      preset: 'CUSTOM',
      doubleTapMs: val,
    }));
  };

  // Adjust Hard-Press Threshold
  const handleHardPressChange = (val: number) => {
    setSensitivity((prev) => ({
      ...prev,
      preset: 'CUSTOM',
      hardPressMs: val,
      forceRatingN: Number(((val / 850) * 2.4).toFixed(1)),
    }));
  };

  // -------------------------------------------------------------
  // Interactive Tactile Calibration Pad Logic
  // -------------------------------------------------------------
  const handlePadStart = () => {
    if (!isConnected) return;
    const now = Date.now();
    pressStartTimeRef.current = now;
    setPadPressing(true);
    setPadProgress(0);

    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }

    // Interval to track hold progress towards Hard-Press threshold
    holdIntervalRef.current = window.setInterval(() => {
      if (!pressStartTimeRef.current) return;
      const elapsed = Date.now() - pressStartTimeRef.current;
      const pct = Math.min(100, Math.round((elapsed / sensitivity.hardPressMs) * 100));
      setPadProgress(pct);

      // If hold threshold is reached, automatically fire Hard Press (RED SOS)
      if (elapsed >= sensitivity.hardPressMs) {
        clearInterval(holdIntervalRef.current!);
        holdIntervalRef.current = null;
        setPadPressing(false);
        setPadProgress(100);
        pressStartTimeRef.current = null;
        setLastTriggerFeedback(`Hard Press Triggered (${sensitivity.hardPressMs}ms)`);
        handleSimulateInput('RED');
      }
    }, 20);
  };

  const handlePadEnd = () => {
    if (!pressStartTimeRef.current) {
      setPadPressing(false);
      setPadProgress(0);
      return;
    }

    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }

    const pressDuration = Date.now() - pressStartTimeRef.current;
    pressStartTimeRef.current = null;
    setPadPressing(false);
    setPadProgress(0);

    // If it was already treated as hard press, exit
    if (pressDuration >= sensitivity.hardPressMs) {
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    // Check for Double-Tap threshold
    if (timeSinceLastTap > 0 && timeSinceLastTap <= sensitivity.doubleTapMs) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapTimeRef.current = 0;
      setLastTriggerFeedback(`Double-Tap Triggered (${timeSinceLastTap}ms interval)`);
      handleSimulateInput('YELLOW');
    } else {
      // Potential single tap or first tap of a double-tap
      lastTapTimeRef.current = now;
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }
      singleTapTimerRef.current = setTimeout(() => {
        setLastTriggerFeedback(`Single Tap Triggered (${pressDuration}ms press)`);
        handleSimulateInput('GREEN');
        singleTapTimerRef.current = null;
      }, sensitivity.doubleTapMs);
    }
  };

  return (
    <div className="bg-[#060a13] border border-gray-800 rounded-2xl p-6 text-white max-w-md w-full font-sans shadow-2xl relative overflow-hidden">
      {/* Background glow based on alert state */}
      <div
        className={`absolute inset-0 opacity-20 pointer-events-none transition-colors duration-1000 ${
          alertLevel === 'RED'
            ? 'bg-[#ff3366]'
            : alertLevel === 'YELLOW'
            ? 'bg-[#ffcc00]'
            : alertLevel === 'GREEN'
            ? 'bg-[#00ffcc]'
            : 'bg-transparent'
        }`}
      />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">⌚</span>
            <div>
              <h2 className="text-xl font-bold text-gray-200 tracking-wide">Wearable Link</h2>
              <p className="text-xs text-gray-500 font-mono">
                {isConnected
                  ? `STATUS: ${isSimulatedMode ? 'SIMULATED LINK' : 'LIVE GATT'} [${alertLevel}]`
                  : 'STATUS: OFFLINE // DISCONNECTED'}
              </p>
            </div>
          </div>
          <button
            onClick={() => (isConnected ? disconnectDevice() : connectDevice())}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              isConnected
                ? 'bg-gray-800 text-[#00ffcc] border border-[#00ffcc]/50 hover:bg-gray-700'
                : 'bg-[#ff3366] text-white hover:bg-[#ff1a53] shadow-[0_0_15px_rgba(255,51,102,0.4)]'
            }`}
          >
            {isConnected ? 'Disconnect' : 'Pair Device'}
          </button>
        </div>

        {/* BLE Error / Notification Banner if pairing was cancelled or rejected */}
        {bleError && !isConnected && (
          <div className="mb-4 p-2.5 rounded-lg border border-[#ffaa00] bg-[#ffaa00]/10 text-[#ffcc00] text-xs font-mono">
            ⚠️ {bleError}
          </div>
        )}

        {/* SOS In-UI Notification Banner */}
        {sosBanner && (
          <div
            className={`mb-4 p-3 rounded-xl border text-xs font-mono flex items-start justify-between gap-2 animate-pulse ${
              alertLevel === 'RED'
                ? 'bg-[#ff3366]/20 border-[#ff3366] text-[#ff3366]'
                : 'bg-[#ffcc00]/20 border-[#ffcc00] text-[#ffcc00]'
            }`}
          >
            <div>
              <span className="font-bold">
                ⚠️ {alertLevel === 'RED' ? 'EMERGENCY BROADCAST' : 'WATCH NOTIFICATION'}:{' '}
              </span>
              {sosBanner}
            </div>
            <button
              onClick={() => setSosBanner(null)}
              className="text-gray-400 hover:text-white cursor-pointer ml-1 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Biometric Readout */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black/50 rounded-xl p-4 border border-gray-800 flex flex-col items-center">
            <span className="text-gray-500 text-xs uppercase mb-1">Heart Rate</span>
            <span className={`text-3xl font-mono ${isConnected ? 'text-white' : 'text-gray-700'}`}>
              {isConnected ? Math.round(heartRate || 80) : '--'} <span className="text-sm">BPM</span>
            </span>
          </div>
          <div className="bg-black/50 rounded-xl p-4 border border-gray-800 flex flex-col items-center">
            <span className="text-gray-500 text-xs uppercase mb-1">HRV (Vagal)</span>
            <span className={`text-3xl font-mono ${isConnected ? 'text-[#00ffcc]' : 'text-gray-700'}`}>
              {isConnected ? Math.round(hrv) : '--'} <span className="text-sm">ms</span>
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Tactile Hardware Trigger Sensitivity Controls */}
        {/* ------------------------------------------------------------- */}
        <div className="mb-6 p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🎛️</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Tactile Trigger Sensitivity
              </span>
            </div>
            <button
              onClick={() => setShowAdvancedSliders((v) => !v)}
              className="text-[11px] font-mono text-[#00ffcc] hover:underline cursor-pointer"
            >
              {showAdvancedSliders ? 'Presets View' : 'Fine Tune'}
            </button>
          </div>

          {/* Preset Buttons Toggle */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {(['LIGHT', 'BALANCED', 'FIRM', 'CUSTOM'] as SensitivityPreset[]).map((preset) => {
              const isSelected = sensitivity.preset === preset;
              return (
                <button
                  key={preset}
                  onClick={() => handleSelectPreset(preset)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#00ffcc]/20 border-[#00ffcc] text-[#00ffcc] shadow-[0_0_10px_rgba(0,255,204,0.3)]'
                      : 'bg-black/40 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>

          {/* Quick Info Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
            <div className="bg-black/60 p-2 rounded-lg border border-gray-800/80">
              <div className="text-[10px] text-gray-500 uppercase">Double-Tap Window</div>
              <div className="text-[#ffcc00] font-bold text-sm">
                ≤ {sensitivity.doubleTapMs} <span className="text-[10px] text-gray-400">ms</span>
              </div>
              <div className="text-[9px] text-gray-500 truncate">Max interval for Yellow alert</div>
            </div>
            <div className="bg-black/60 p-2 rounded-lg border border-gray-800/80">
              <div className="text-[10px] text-gray-500 uppercase">Hard Press Hold</div>
              <div className="text-[#ff3366] font-bold text-sm">
                ≥ {sensitivity.hardPressMs} <span className="text-[10px] text-gray-400">ms</span>
              </div>
              <div className="text-[9px] text-gray-500 truncate">Hold duration for Red SOS</div>
            </div>
          </div>

          {/* Detailed Sliders (Shown when Fine Tune toggled or Custom mode) */}
          {showAdvancedSliders && (
            <div className="space-y-3 pt-2 border-t border-gray-800/80 animate-fadeIn">
              {/* Double Tap Threshold Slider */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-300 font-mono text-[11px]">Double-Tap Window:</span>
                  <span className="text-[#ffcc00] font-mono font-bold text-xs">{sensitivity.doubleTapMs} ms</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="700"
                  step="10"
                  value={sensitivity.doubleTapMs}
                  onChange={(e) => handleDoubleTapChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ffcc00]"
                />
                <div className="flex justify-between text-[9px] font-mono text-gray-500 mt-0.5">
                  <span>Fast (150ms)</span>
                  <span>Relaxed (700ms)</span>
                </div>
              </div>

              {/* Hard Press Duration Slider */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-300 font-mono text-[11px]">Hard Press Hold:</span>
                  <span className="text-[#ff3366] font-mono font-bold text-xs">{sensitivity.hardPressMs} ms</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="2000"
                  step="50"
                  value={sensitivity.hardPressMs}
                  onChange={(e) => handleHardPressChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ff3366]"
                />
                <div className="flex justify-between text-[9px] font-mono text-gray-500 mt-0.5">
                  <span>Hair-Trigger (300ms)</span>
                  <span>Deep Hold (2000ms)</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Tactile Calibration Pad */}
          <div className="mt-3 pt-3 border-t border-gray-800/60">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">
                Interactive Calibration Pad
              </span>
              {lastTriggerFeedback && (
                <span className="text-[10px] text-[#00ffcc] font-mono truncate max-w-[190px]">
                  ✓ {lastTriggerFeedback}
                </span>
              )}
            </div>

            <button
              onMouseDown={handlePadStart}
              onMouseUp={handlePadEnd}
              onMouseLeave={handlePadEnd}
              onTouchStart={handlePadStart}
              onTouchEnd={handlePadEnd}
              disabled={!isConnected}
              className={`w-full relative py-3 px-4 rounded-xl border text-center font-mono text-xs font-bold select-none transition-all cursor-pointer overflow-hidden ${
                !isConnected
                  ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                  : padPressing
                  ? 'bg-gray-800 border-[#00ffcc] text-white shadow-[0_0_15px_rgba(0,255,204,0.3)]'
                  : 'bg-black/60 border-gray-700 hover:border-gray-500 text-gray-300'
              }`}
            >
              {/* Dynamic Fill Meter showing hold duration to Hard-Press */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#ffcc00]/30 to-[#ff3366]/50 transition-all duration-75 pointer-events-none"
                style={{ width: `${padProgress}%` }}
              />

              <div className="relative z-10 flex items-center justify-center gap-2">
                <span>🎯</span>
                <span>
                  {padPressing
                    ? `HOLDING... ${padProgress}% (Charge to Red SOS)`
                    : 'Tap for Green • Double-Tap for Yellow • Hold for Red'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Traffic Light Hardware Simulator Quick Triggers */}
        <div className="space-y-2.5">
          <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-1">
            Direct Hardware Overrides
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSimulateInput('GREEN')}
              disabled={!isConnected}
              className="py-2.5 px-3 rounded-xl bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/30 hover:bg-[#00ffcc]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-bold text-xs font-mono"
            >
              Green Tap (Safe)
            </button>
            <button
              onClick={() => handleSimulateInput('YELLOW')}
              disabled={!isConnected}
              className="py-2.5 px-3 rounded-xl bg-[#ffcc00]/10 text-[#ffcc00] border border-[#ffcc00]/30 hover:bg-[#ffcc00]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-bold text-xs font-mono"
            >
              Yellow Double-Tap
            </button>
          </div>
          <button
            onClick={() => handleSimulateInput('RED')}
            disabled={!isConnected}
            className="w-full py-3 rounded-xl bg-[#ff3366]/20 text-[#ff3366] border border-[#ff3366] font-bold tracking-widest hover:bg-[#ff3366]/40 hover:shadow-[0_0_30px_rgba(255,51,102,0.6)] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-xs font-mono"
          >
            RED PANIC (SOS HARD PRESS)
          </button>
        </div>
      </div>
    </div>
  );
};
