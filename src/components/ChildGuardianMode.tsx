import React, { useState } from 'react';
import { playEmpathicChime } from '../utils/audioEngine';

interface ChildGuardianModeProps {
  onUnlockMaster: () => void;
}

export const ChildGuardianMode: React.FC<ChildGuardianModeProps> = ({ onUnlockMaster }) => {
  const [shieldActive, setShieldActive] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [pinEntry, setPinEntry] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [lovePulse, setLovePulse] = useState(false);
  const [breatheMode, setBreatheMode] = useState(false);

  // Parental Gate validation
  const handlePinSubmit = () => {
    if (pinEntry === '2099') {
      playEmpathicChime('ping');
      onUnlockMaster();
    } else {
      setPinError('Harmonic frequency mismatch. Try again.');
      setPinEntry('');
      setTimeout(() => setPinError(null), 2500);
    }
  };

  const handleSendLove = () => {
    playEmpathicChime('love');
    setLovePulse(true);
    setTimeout(() => setLovePulse(false), 2000);
  };

  const handleBreatheWithEarth = () => {
    playEmpathicChime('breathe');
    setBreatheMode(!breatheMode);
  };

  const handleShieldToggle = () => {
    playEmpathicChime('shield');
    setShieldActive(!shieldActive);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020408] text-white font-sans p-6 relative overflow-hidden select-none">
      
      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h1 className="text-2xl font-bold text-[#00ffcc] tracking-wider">Explorer Mode</h1>
        </div>
        <button
          onClick={() => {
            setShowGate(true);
            setPinError(null);
          }}
          className="px-4 py-2 bg-gray-800 text-gray-400 rounded-full text-xs font-bold border border-gray-700 hover:text-white transition-colors cursor-pointer"
        >
          Operator Access
        </button>
      </div>

      {/* Love Pulse Floating Hearts Effect */}
      {lovePulse && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="text-6xl animate-ping opacity-90">💖</div>
          <div className="text-4xl animate-bounce absolute text-[#ff3366] font-bold">
            Grid Infused with Love! ✨
          </div>
        </div>
      )}

      {/* Central Interactive Shield */}
      <div
        onClick={handleShieldToggle}
        className={`w-72 h-72 rounded-full flex items-center justify-center cursor-pointer transition-all duration-700 shadow-[0_0_50px_rgba(0,255,204,0.2)] ${
          shieldActive
            ? 'bg-[#00ffcc]/20 scale-105 shadow-[0_0_100px_rgba(0,255,204,0.6)]'
            : 'bg-gray-800/50'
        } ${breatheMode ? 'animate-pulse' : ''}`}
      >
        <div
          className={`w-56 h-56 rounded-full border-4 border-[#00ffcc] flex items-center justify-center transition-all ${
            shieldActive ? 'animate-pulse' : ''
          }`}
        >
          <span className="text-2xl font-bold text-[#00ffcc] text-center px-4">
            {shieldActive ? 'Shield Glowing! 🛡️' : 'Tap to Power Up Shield'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-16 flex flex-col gap-6 w-full max-w-sm z-10">
        <button
          onClick={handleSendLove}
          className="py-5 bg-[#ff3366] text-white rounded-2xl text-xl font-bold hover:bg-[#ff1a53] transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,51,102,0.4)] cursor-pointer"
        >
          💖 Send Love to the Grid
        </button>
        <button
          onClick={handleBreatheWithEarth}
          className="py-5 bg-[#00ffcc] text-black rounded-2xl text-xl font-bold hover:bg-[#00e6b8] transition-transform active:scale-95 shadow-[0_0_20px_rgba(0,255,204,0.4)] cursor-pointer"
        >
          🧘 {breatheMode ? 'Breathe In... Breathe Out 🌊' : 'Breathe with the Earth'}
        </button>
      </div>

      {/* Parental Gate Overlay */}
      {showGate && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md p-4">
          <div className="bg-[#060a13] p-8 rounded-2xl border border-[#ff3366] text-center w-80 shadow-2xl">
            <h2 className="text-[#ff3366] text-lg font-bold mb-2">OPERATOR OVERRIDE</h2>
            <p className="text-gray-400 text-sm mb-6">Enter grid authorization code</p>
            
            <input 
              type="password" 
              maxLength={4}
              value={pinEntry}
              onChange={(e) => {
                setPinEntry(e.target.value);
                setPinError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePinSubmit();
              }}
              className="w-full bg-gray-900 text-center text-2xl tracking-[1em] text-white py-3 rounded-lg border border-gray-700 mb-2 focus:outline-none focus:border-[#00ffcc]"
              placeholder="••••"
              autoFocus
            />

            {pinError && (
              <p className="text-[#ff3366] text-xs font-bold mb-4 animate-shake">
                {pinError}
              </p>
            )}
            
            <div className="flex justify-between gap-4 mt-4">
              <button 
                onClick={() => {
                  setShowGate(false);
                  setPinEntry('');
                  setPinError(null);
                }} 
                className="flex-1 py-3 bg-gray-800 rounded-lg text-gray-300 font-bold hover:bg-gray-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handlePinSubmit} 
                className="flex-1 py-3 bg-[#ff3366] rounded-lg text-white font-bold hover:bg-[#ff1a53] transition cursor-pointer"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
