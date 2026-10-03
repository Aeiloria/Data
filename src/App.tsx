import React, { useState, useEffect } from 'react';
import { MasterGridDashboard } from './components/MasterGridDashboard';
import { TelemetryBars } from './components/TelemetryBars';
import { BiometricActionDeck } from './components/BiometricActionDeck';
import { BiometricChart } from './components/BiometricChart';
import { AudioConfigMenu } from './components/AudioConfigMenu';
import { WaveAnalyzer } from './components/WaveAnalyzer';
import { ArcGISViewport, InfrastructureNode } from './components/ArcGISViewport';
import { RegionalLandmarkDeck } from './components/RegionalLandmarkDeck';
import { SecureLogGuard } from './components/SecureLogGuard';
import { SyncMonitorDeck } from './components/SyncMonitorDeck';
import { PerfTesterDeck } from './components/PerfTesterDeck';
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useBleBiometrics } from './hooks/useBleBiometrics';
import { useIndexedDB } from './hooks/useIndexedDB';
import {
  startAudioProtectionFreq,
  stopAudioProtectionFreq,
  getAnalyserNode,
  isAudioRunning
} from './utils/audioEngine';
import mockArcGISData from './data/mockArcGISInfrastructure.json';

// Core Geographic Coordinates for Gatesville, Texas
const GATESVILLE_LAT = 31.4351;
const GATESVILLE_LON = -97.7439;

export default function App() {
  // 1. Core State Channels
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<number>(432.0);
  const [waveType, setWaveType] = useState<OscillatorType>('sine');
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Live Space Weather Telemetry State (Default set to active solar storm condition)
  const [kpIndex, setKpIndex] = useState<number>(6.2);
  const [solarWindSpeed, setSolarWindSpeed] = useState<number>(742.8);
  const [radioBlackoutScale, setRadioBlackoutScale] = useState<number>(3);

  // Active Infrastructure nodes state
  const [nodes, setNodes] = useState<InfrastructureNode[]>(() =>
    mockArcGISData.features.map((f: any) => ({
      id: `arcgis-${f.attributes.OBJECTID}`,
      name: f.attributes.CarrierName,
      latitude: f.geometry.y,
      longitude: f.geometry.x,
      type: f.attributes.StructureType,
      baseEmissionRadiusMeters: f.attributes.TowerHeight * 2 || 60,
      isShielded: f.attributes.OBJECTID === 101, // 101 pre-shielded
    }))
  );

  // UI View Sections Tab state (allows compact mobile navigation or all-in-one view)
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'MAP' | 'AUDIO' | 'LOGS' | 'DIAGNOSTICS'>('OVERVIEW');

  // 2. Hardware Subsystems & Local Storage Hooks
  const {
    heartRate,
    hrvMs,
    isBleConnected,
    isSimulated,
    deviceName,
    connectGattDevice,
    disconnectGattDevice,
    triggerElevatedStressTest,
    triggerOptimalBioCoherence,
  } = useBleBiometrics();

  const {
    wellnessLogs,
    customPins,
    landmarks,
    saveWellnessLog,
    saveCustomPin,
    deleteCustomPin,
    clearWellnessLogs,
    clearCustomPins,
    clearEntireDatabase,
    transformCustomPinToActiveLandmark,
    completeLandmark,
  } = useIndexedDB();

  // Sync analyzer node link dynamically when audio is toggled
  useEffect(() => {
    if (isAudioActive) {
      setAnalyser(getAnalyserNode());
    } else {
      setAnalyser(null);
    }
  }, [isAudioActive]);

  // Performance telemetry logging (5 seconds post mount)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const resourceLogs = performance.getEntriesByType('resource');
        console.log('📡 [TELEMETRY] Audited', resourceLogs.length, 'runtime network resources');
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // 3. Centralized User Action Dispatches
  const handleAudioToggle = () => {
    if (isAudioActive || isAudioRunning()) {
      stopAudioProtectionFreq();
      setIsAudioActive(false);
      setAnalyser(null);
    } else {
      startAudioProtectionFreq(frequency, waveType);
      setIsAudioActive(true);
      setTimeout(() => setAnalyser(getAnalyserNode()), 150);
    }
  };

  const handleAudioConfigChange = (newFreq: number, newWave: OscillatorType) => {
    setFrequency(newFreq);
    setWaveType(newWave);
    if (isAudioActive) {
      startAudioProtectionFreq(newFreq, newWave);
    }
  };

  const handleActionTrigger = (actionType: string) => {
    if (actionType === 'ANUHAZI_CHANT') {
      handleAudioToggle();
    } else if (actionType === 'YOGA_STRETCH') {
      const hrBefore = heartRate || 78;
      const hrAfter = Math.max(62, hrBefore - 8);
      const hrvBefore = hrvMs || 42;
      const hrvAfter = Math.min(80, hrvBefore + 16);

      saveWellnessLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'YOGA_STRETCH & GROUNDING',
        heartRateBefore: hrBefore,
        heartRateAfter: hrAfter,
        hrvBefore,
        hrvAfter,
        notes: 'Bio-coherence routine executed in response to solar excitation.'
      }, '1212'); // Saved with AES-GCM encryption
    }
  };

  const handleLandmarkObjective = (landmarkId: string) => {
    completeLandmark(landmarkId);
  };

  const handleClearShield = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId ? { ...node, isShielded: true } : node
      )
    );
  };

  const handleSpaceWeatherChange = (
    field: 'kpIndex' | 'solarWindSpeed' | 'radioBlackoutScale',
    val: number
  ) => {
    if (field === 'kpIndex') setKpIndex(val);
    if (field === 'solarWindSpeed') setSolarWindSpeed(val);
    if (field === 'radioBlackoutScale') setRadioBlackoutScale(val);
  };

  return (
    <div
      style={{
        backgroundColor: '#020408',
        minHeight: '100vh',
        color: '#ffffff',
        fontFamily: 'monospace',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: '40px'
      }}
    >
      {/* 2099 Broadcast Status Overlay Banner */}
      <div
        style={{
          width: '100%',
          backgroundColor: isAudioActive ? '#00ffcc' : '#101726',
          color: isAudioActive ? '#0a0f1d' : '#8fa0ba',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: '0.78em',
          fontWeight: 'bold',
          borderBottom: '1px solid #1a2636',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>
          {isAudioActive
            ? `🔊 BROADCAST LIVE // ${frequency}Hz TYPE_${waveType.toUpperCase()} COHERENCE LOCK ACTIVE`
            : '📡 HUB STANDBY // SCALAR DATA ARRAYS OFFLINE'}
        </span>
        <PWAInstallButton />
      </div>

      {/* Main High-Density Interface Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: '#060a13',
          borderLeft: '1px solid #1a2636',
          borderRight: '1px solid #1a2636',
          boxShadow: '0 0 35px rgba(0, 255, 204, 0.08)'
        }}
      >
        {/* Core Shield Tracking Section */}
        <MasterGridDashboard
          kpIndex={kpIndex}
          solarWindSpeed={solarWindSpeed}
          radioBlackoutScale={radioBlackoutScale}
          onExamineTonalShield={() => setActiveSection('AUDIO')}
        />

        {/* Navigation Deck Bar */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#080d19',
            borderBottom: '1px solid #1a2636',
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'OVERVIEW', label: 'OVERVIEW' },
            { id: 'MAP', label: 'RADAR MAP' },
            { id: 'AUDIO', label: 'AUDIO SYNTH' },
            { id: 'LOGS', label: 'DATA VAULT' },
            { id: 'DIAGNOSTICS', label: 'BENCHMARK & SYNC' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              style={{
                flex: 1,
                padding: '10px 8px',
                fontSize: '0.72em',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                backgroundColor: activeSection === tab.id ? '#101726' : 'transparent',
                color: activeSection === tab.id ? '#00ffcc' : '#8fa0ba',
                border: 'none',
                borderBottom: activeSection === tab.id ? '2px solid #00ffcc' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SECTION 1: OVERVIEW */}
        {(activeSection === 'OVERVIEW' || activeSection === 'MAP') && (
          <>
            {/* Live Parameter Grouping */}
            <TelemetryBars
              kpIndex={kpIndex}
              solarWindSpeed={solarWindSpeed}
              radioBlackoutScale={radioBlackoutScale}
              onSimulateChange={handleSpaceWeatherChange}
            />

            {/* Localized Map Viewport Component */}
            <ArcGISViewport
              userLat={GATESVILLE_LAT}
              userLon={GATESVILLE_LON}
              nearbyNodes={nodes}
              customPins={customPins}
              onAddPin={saveCustomPin}
              onClearShield={handleClearShield}
            />

            {/* Regional Landmarks & Objectives Deck */}
            <RegionalLandmarkDeck
              userLat={GATESVILLE_LAT}
              userLon={GATESVILLE_LON}
              landmarks={landmarks}
              onExecuteObjective={handleLandmarkObjective}
            />
          </>
        )}

        {/* SECTION 2: AUDIO SYNTH & WAVEFORM */}
        {(activeSection === 'OVERVIEW' || activeSection === 'AUDIO') && (
          <>
            {/* Real-time Oscilloscope Visualization Canvas */}
            <WaveAnalyzer analyserNode={analyser} isAudioActive={isAudioActive} frequency={frequency} />

            {/* Custom Core Frequency Modulator Selection Deck */}
            <AudioConfigMenu
              activeFreq={frequency}
              activeWave={waveType}
              isAudioActive={isAudioActive}
              onSettingsChange={handleAudioConfigChange}
              onToggleAudio={handleAudioToggle}
            />
          </>
        )}

        {/* SECTION 3: BIOMETRIC FEEDBACK LOOP */}
        {(activeSection === 'OVERVIEW' || activeSection === 'AUDIO') && (
          <>
            {/* Biometric Integration Action Controls */}
            <BiometricActionDeck
              heartRateBpm={heartRate}
              hrvMs={hrvMs}
              isBleConnected={isBleConnected}
              deviceName={deviceName}
              onTriggerRoutine={handleActionTrigger}
              onSimulateElevated={triggerElevatedStressTest}
              onSimulateOptimal={triggerOptimalBioCoherence}
            />

            {/* Biometric Trend Chart */}
            <BiometricChart
              logs={wellnessLogs}
              currentHeartRate={heartRate}
              currentHrv={hrvMs}
            />
          </>
        )}

        {/* SECTION 4: DATA LOGS & ENCRYPTION */}
        {(activeSection === 'OVERVIEW' || activeSection === 'LOGS') && (
          <SecureLogGuard
            logs={wellnessLogs}
            pins={customPins}
            landmarks={landmarks}
            onClearLogs={clearWellnessLogs}
            onClearPins={clearCustomPins}
            onClearAllData={clearEntireDatabase}
            onDeletePin={deleteCustomPin}
            onTransformPin={transformCustomPinToActiveLandmark}
            onSaveLog={saveWellnessLog}
          />
        )}

        {/* SECTION 5: DIAGNOSTICS & SYNC */}
        {(activeSection === 'OVERVIEW' || activeSection === 'DIAGNOSTICS') && (
          <>
            {/* Outbound Webhook Integration Monitoring Grid */}
            <SyncMonitorDeck />

            {/* IndexedDB Benchmark Speed Tester */}
            <PerfTesterDeck />
          </>
        )}

        {/* Bluetooth Device Management Tray Layer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #1a2636',
            backgroundColor: '#0a0f1d',
            display: 'flex',
            gap: '10px'
          }}
        >
          <button
            onClick={isBleConnected ? disconnectGattDevice : connectGattDevice}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: isBleConnected ? 'rgba(255,0,51,0.1)' : 'rgba(0,255,204,0.1)',
              color: isBleConnected ? '#ff0033' : '#00ffcc',
              border: `1px solid ${isBleConnected ? '#ff0033' : '#00ffcc'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: '0.82em',
              transition: 'all 0.2s ease'
            }}
          >
            {isBleConnected ? '❌ DISCONNECT WEARABLE SENSOR' : '🔗 SYNC BIOMETRIC WEARABLE BAND (BLE)'}
          </button>
        </div>
      </div>

      {/* On-Screen PWA Update Notification Widget */}
      <PwaUpdatePrompt />
    </div>
  );
}
