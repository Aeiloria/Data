import React, { useState, useEffect, useRef } from 'react';
import { useGridWearableBLE, AlertLevel } from '../hooks/useGridWearableBLE';
import { playEmpathicChime } from '../utils/audioEngine';

export { type AlertLevel };

interface WearableManagerProps {
  onSosTriggered?: (sosData: { timestamp: string; heartRate: number; hrv: number }) => void;
}

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

        {/* Traffic Light Hardware Simulator */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-1">
            Hardware Input Simulator
          </p>
          <button
            onClick={() => handleSimulateInput('GREEN')}
            disabled={!isConnected}
            className="w-full py-2.5 rounded-xl bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/30 hover:bg-[#00ffcc]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-bold text-xs font-mono"
          >
            Green Tap (Safe / Coherence Ping)
          </button>
          <button
            onClick={() => handleSimulateInput('YELLOW')}
            disabled={!isConnected}
            className="w-full py-2.5 rounded-xl bg-[#ffcc00]/10 text-[#ffcc00] border border-[#ffcc00]/30 hover:bg-[#ffcc00]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-bold text-xs font-mono"
          >
            Yellow Double-Tap (Boundary Check)
          </button>
          <button
            onClick={() => handleSimulateInput('RED')}
            disabled={!isConnected}
            className="w-full py-3.5 rounded-xl bg-[#ff3366]/20 text-[#ff3366] border border-[#ff3366] font-bold tracking-widest hover:bg-[#ff3366]/40 hover:shadow-[0_0_30px_rgba(255,51,102,0.6)] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-xs font-mono"
          >
            RED PANIC (SOS)
          </button>
        </div>
      </div>
    </div>
  );
};
