import React, { useState, useEffect } from 'react';
import { MasterGridDashboard } from './components/MasterGridDashboard';
import { TelemetryBars } from './components/TelemetryBars';
import { BiometricActionDeck } from './components/BiometricActionDeck';
import { BiometricChart } from './components/BiometricChart';
import { AudioConfigMenu } from './components/AudioConfigMenu';
import { WaveAnalyzer } from './components/WaveAnalyzer';
import { ArcGISViewport, InfrastructureNode } from './components/ArcGISViewport';
import { DashboardWidget } from './components/DashboardWidget';
import { RegionalLandmarkDeck } from './components/RegionalLandmarkDeck';
import { SecureLogGuard } from './components/SecureLogGuard';
import { SyncMonitorDeck } from './components/SyncMonitorDeck';
import { PerfTesterDeck } from './components/PerfTesterDeck';
import { BiometricHeatMap } from './components/BiometricHeatMap';
import { CoherenceWarningAlert } from './components/CoherenceWarningAlert';
import { BiometricThresholdPulseAlert } from './components/BiometricThresholdPulseAlert';
import { IonosphericThreatToast, IonosphericThreatInfo } from './components/IonosphericThreatToast';
import { CoherenceStreakLightWell } from './components/CoherenceStreakLightWell';
import { ScalarShieldDailyMessage } from './components/ScalarShieldDailyMessage';
import { AiAssistantSuite } from './components/AiAssistantSuite';
import { PokemonGoLoveMeetup } from './components/PokemonGoLoveMeetup';
import { ChildGuardianMode } from './components/ChildGuardianMode';
import { WearableManager } from './components/WearableManager';
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useBleBiometrics } from './hooks/useBleBiometrics';
import { useIndexedDB } from './hooks/useIndexedDB';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { useFirestoreSync } from './hooks/useFirestoreSync';
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

  // Real-time Ionospheric Disturbance Threat State (from NOAA SWPC & ArcGISViewport)
  const [ionosphericThreat, setIonosphericThreat] = useState<IonosphericThreatInfo | null>({
    isCritical: kpIndex >= 6.0 || solarWindSpeed >= 700 || radioBlackoutScale >= 3,
    threatLevel: kpIndex >= 6.0 ? 'CRITICAL' : 'ELEVATED',
    kpIndex,
    geomagneticStormScale: `G${Math.min(5, Math.max(1, Math.floor(kpIndex - 4)))}`,
    radioBlackoutScale: `R${radioBlackoutScale}`,
    solarWindSpeed,
    ionosphericTecVariancePct: Math.round(kpIndex * 6.2),
    lastUpdated: new Date().toLocaleTimeString(),
  });

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
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'MAP' | 'LOVE_MEETUP' | 'AUDIO' | 'LOGS' | 'DIAGNOSTICS' | 'AI'>('OVERVIEW');

  // Application Access State: 'CHILD' (Explorer Mode) vs 'MASTER' (Master Grid Operator Terminal)
  const [appMode, setAppMode] = useState<'CHILD' | 'MASTER'>('CHILD');

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

  // Firebase Authentication & Firestore Cloud Sync
  const { user, loginWithGoogle, logout } = useFirebaseAuth();
  const { isSyncing, pushLogToCloud, pushPinToCloud, deletePinFromCloud } = useFirestoreSync(user);

  // Wrapper to save log locally and sync to cloud if authenticated
  const handleSaveWellnessLog = (log: any, secretPassphrase?: string) => {
    saveWellnessLog(log, secretPassphrase);
    if (user) {
      pushLogToCloud(log);
    }
  };

  // Wrapper to save custom pin locally and sync to cloud if authenticated
  const handleSaveCustomPin = (pin: any) => {
    saveCustomPin(pin);
    if (user) {
      pushPinToCloud(pin);
    }
  };

  // Wrapper to delete pin locally and sync to cloud
  const handleDeleteCustomPin = (pinId: string) => {
    deleteCustomPin(pinId);
    if (user) {
      deletePinFromCloud(pinId);
    }
  };

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
    const hrBefore = heartRate || 78;
    const hrvBefore = hrvMs || 42;

    if (actionType === 'ANUHAZI_CHANT') {
      handleAudioToggle();
    } else if (actionType === 'YOGA_STRETCH') {
      const hrAfter = Math.max(62, hrBefore - 8);
      const hrvAfter = Math.min(80, hrvBefore + 16);

      handleSaveWellnessLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'YOGA_STRETCH & GROUNDING',
        heartRateBefore: hrBefore,
        heartRateAfter: hrAfter,
        hrvBefore,
        hrvAfter,
        notes: 'Bio-coherence routine executed in response to solar excitation.'
      }, '1212');
    } else if (actionType === 'JHAN_TU_RAPID_REACTIVATION') {
      const hrAfter = Math.max(60, hrBefore - 10);
      const hrvAfter = Math.min(85, hrvBefore + 20);

      handleSaveWellnessLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'JHAN-TU RAPID RE-ACTIVATION',
        heartRateBefore: hrBefore,
        heartRateAfter: hrAfter,
        hrvBefore,
        hrvAfter,
        notes: 'Re-activated DN-1 Spins & Flows via Power-Command "Jhan-TU\' Et-eur\' Deu-A\'". Lotus touch on AzurA/Thymus.'
      }, '1212');
    } else if (actionType === 'GRAIL_STATE_ENTRY') {
      const hrAfter = Math.max(58, hrBefore - 12);
      const hrvAfter = Math.min(90, hrvBefore + 24);

      handleSaveWellnessLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'GRAIL STATE IMMERSION',
        heartRateBefore: hrBefore,
        heartRateAfter: hrAfter,
        hrvBefore,
        hrvAfter,
        notes: 'Entered Kara-nA\'dis Seal Cloud Cocoon. Affirmed: "I AM THE WATERS, I AM THE VOICE!" Reclaimed atomic GharE\'.'
      }, '1212');
    } else if (actionType === 'DAILY_FOOD_WATER_CLEARING') {
      const hrAfter = Math.max(65, hrBefore - 5);
      const hrvAfter = Math.min(75, hrvBefore + 10);

      handleSaveWellnessLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'LIVING WATER & CONSUMABLES CHARGE',
        heartRateBefore: hrBefore,
        heartRateAfter: hrAfter,
        hrvBefore,
        hrvAfter,
        notes: 'Cleared and charged consumables with Allur-E\'ah Ra-sha-tan code. Restored organic Hydrolase pre-water matrix.'
      }, '1212');
    } else if (actionType === 'PHASE_TONING_VOICE') {
      const hrAfter = Math.max(64, hrBefore - 7);
      const hrvAfter = Math.min(82, hrvBefore + 18);

      handleSaveWellnessLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'PHASE-TONING 12-RHYTHM SEQUENCE',
        heartRateBefore: hrBefore,
        heartRateAfter: hrAfter,
        hrvBefore,
        hrvAfter,
        notes: 'Executed 12-Phase Tonal-Rhythm sequence. Released Ghar-o\'che\' static, unified Ego-Mind with Body-Mind.'
      }, '1212');
    } else if (actionType === 'LOGAYANAS_BREATHING') {
      const hrAfter = Math.max(60, hrBefore - 9);
      const hrvAfter = Math.min(88, hrvBefore + 22);

      handleSaveWellnessLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'LOGAYANAS FREQUENCY BREATHING',
        heartRateBefore: hrBefore,
        heartRateAfter: hrAfter,
        hrvBefore,
        hrvAfter,
        notes: 'Performed MCEO Logayanas Entry-Level Kathara 1-3. 36-point Lotus Breaths from Ra Centre, stimulating KS-2 Lotus Points.'
      }, '1212');
    } else if (actionType === 'AH_RAYAS_PRACTICUM') {
      const hrAfter = Math.max(66, hrBefore - 4);
      const hrvAfter = Math.min(78, hrvBefore + 14);

      handleSaveWellnessLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: '12:12 AH-RA\'-YAS PRACTICUM',
        heartRateBefore: hrBefore,
        heartRateAfter: hrAfter,
        hrvBefore,
        hrvAfter,
        notes: 'Engaged Sliders-3 12:12 Ah-RA\'-yas dynamic repetitive motions. Generated quantum power in Axiatonal Lines and Uni-genetic Underlay (UGU).'
      }, '1212');
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

  const handleShieldAllNodes = () => {
    setNodes((prev) => prev.map((node) => ({ ...node, isShielded: true })));
  };

  const handleSpaceWeatherChange = (
    field: 'kpIndex' | 'solarWindSpeed' | 'radioBlackoutScale',
    val: number
  ) => {
    const updatedKp = field === 'kpIndex' ? val : kpIndex;
    const updatedSpeed = field === 'solarWindSpeed' ? val : solarWindSpeed;
    const updatedBlackout = field === 'radioBlackoutScale' ? val : radioBlackoutScale;

    if (field === 'kpIndex') setKpIndex(val);
    if (field === 'solarWindSpeed') setSolarWindSpeed(val);
    if (field === 'radioBlackoutScale') setRadioBlackoutScale(val);

    const isCrit = updatedKp >= 6.0 || updatedSpeed >= 700 || updatedBlackout >= 3;
    setIonosphericThreat((prev) => ({
      isCritical: isCrit,
      threatLevel: isCrit ? 'CRITICAL' : updatedKp >= 4.5 ? 'ELEVATED' : 'MODERATE',
      kpIndex: updatedKp,
      geomagneticStormScale: `G${Math.min(5, Math.max(0, Math.floor(updatedKp - 4)) || 1)}`,
      radioBlackoutScale: `R${updatedBlackout}`,
      solarWindSpeed: updatedSpeed,
      ionosphericTecVariancePct: Math.round(updatedKp * 6.2),
      lastUpdated: new Date().toLocaleTimeString(),
    }));
  };

  // Safe Child / Explorer Mode Gated Interface
  if (appMode === 'CHILD') {
    return <ChildGuardianMode onUnlockMaster={() => setAppMode('MASTER')} />;
  }

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
      {/* Operator Quick Lock Back to Child Mode */}
      <button 
        onClick={() => setAppMode('CHILD')}
        style={{
          position: 'fixed',
          top: '12px',
          right: '12px',
          zIndex: 9998,
          padding: '6px 12px',
          backgroundColor: '#ff3366',
          color: '#ffffff',
          borderRadius: '4px',
          border: 'none',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          fontSize: '0.72em',
          cursor: 'pointer',
          boxShadow: '0 0 15px rgba(255, 51, 102, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}
        title="Lock terminal back to Child / Explorer Mode"
      >
        <span>🔒</span>
        <span>LOCK TERMINAL</span>
      </button>

      {/* Floating Critical Ionospheric Threat Toast Notification */}
      <IonosphericThreatToast
        threat={ionosphericThreat}
        currentActiveTab={activeSection}
        onNavigateToAudioSynth={() => setActiveSection('AUDIO')}
        onActivateAudioShield={() => {
          if (!isAudioActive) handleAudioToggle();
        }}
        onSimulateCriticalSpike={() => {
          setIonosphericThreat({
            isCritical: true,
            threatLevel: 'CRITICAL',
            kpIndex: 8.5,
            geomagneticStormScale: 'G4',
            radioBlackoutScale: 'R4',
            solarWindSpeed: 890.5,
            ionosphericTecVariancePct: 76,
            lastUpdated: new Date().toLocaleTimeString(),
          });
        }}
        onResetThreat={() => {
          setIonosphericThreat({
            isCritical: false,
            threatLevel: 'NOMINAL',
            kpIndex: 2.1,
            geomagneticStormScale: 'G0',
            radioBlackoutScale: 'R0',
            solarWindSpeed: 380,
            ionosphericTecVariancePct: 8,
            lastUpdated: new Date().toLocaleTimeString(),
          });
        }}
      />

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
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isAudioActive
            ? `🔊 BROADCAST LIVE // ${frequency}Hz TYPE_${waveType.toUpperCase()} COHERENCE LOCK ACTIVE`
            : '📡 HUB STANDBY // SCALAR DATA ARRAYS OFFLINE'}
        </span>

        {/* Cloud Account & PWA Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isSyncing && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                backgroundColor: 'rgba(0, 255, 204, 0.15)',
                border: '1px solid #00ffcc',
                borderRadius: '3px',
                fontSize: '0.68em',
                color: '#00ffcc',
                boxShadow: '0 0 10px rgba(0, 255, 204, 0.45)',
                transition: 'all 0.2s ease'
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#00ffcc',
                  boxShadow: '0 0 6px #00ffcc'
                }}
              />
              <span style={{ fontWeight: 'bold', letterSpacing: '0.5px' }}>
                SYNCING...
              </span>
            </div>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '0.7em',
                  color: '#00ffcc',
                  backgroundColor: 'rgba(0, 255, 204, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  border: '1px solid #00ffcc'
                }}
              >
                ☁️ {user.displayName?.split(' ')[0] || user.email || 'Operator'}
              </span>
              <button
                onClick={logout}
                style={{
                  padding: '3px 6px',
                  fontSize: '0.68em',
                  backgroundColor: '#0a0f1d',
                  color: '#8fa0ba',
                  border: '1px solid #1a2636',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              style={{
                padding: '3px 8px',
                fontSize: '0.7em',
                backgroundColor: '#101726',
                color: '#00ffcc',
                border: '1px solid #00ffcc',
                borderRadius: '2px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ☁️ Cloud Sign-In
            </button>
          )}
          <PWAInstallButton />
        </div>
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
            { id: 'LOVE_MEETUP', label: '💖 LOVE RADAR' },
            { id: 'AUDIO', label: 'AUDIO SYNTH' },
            { id: 'LOGS', label: 'DATA VAULT' },
            { id: 'DIAGNOSTICS', label: 'BENCHMARK & SYNC' },
            { id: 'AI', label: 'AI INTEL' }
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

        {/* Threshold-Based Biometric Deviation Visual Notification Pulse */}
        <div style={{ marginTop: '10px' }}>
          <BiometricThresholdPulseAlert
            currentHeartRate={heartRate}
            currentHrv={hrvMs}
            isBleConnected={isBleConnected}
            logs={wellnessLogs}
            onTriggerAudioShield={handleAudioToggle}
            onTriggerRecoveryRoutine={() => handleActionTrigger('LOGAYANAS_BREATHING')}
            onSimulateElevated={triggerElevatedStressTest}
            onSimulateOptimal={triggerOptimalBioCoherence}
          />
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

            {/* Daily 12D Scalar Shield Status Message */}
            {activeSection === 'OVERVIEW' && (
              <div style={{ padding: '0 16px' }}>
                <ScalarShieldDailyMessage />
              </div>
            )}

            {/* Daily Coherence Streaks & Light-Well Indicator */}
            {activeSection === 'OVERVIEW' && (
              <div style={{ padding: '0 16px' }}>
                <CoherenceStreakLightWell
                  logs={wellnessLogs}
                  onTriggerRoutine={handleActionTrigger}
                />
              </div>
            )}

            {/* Localized Map Viewport Component */}
            <ArcGISViewport
              userLat={GATESVILLE_LAT}
              userLon={GATESVILLE_LON}
              nearbyNodes={nodes}
              customPins={customPins}
              onAddPin={handleSaveCustomPin}
              onClearShield={handleClearShield}
              onIonosphericThreatChange={setIonosphericThreat}
            />

            {/* Real-time Shield Integrity Radial Progress Gauge */}
            <div style={{ padding: '0 16px' }}>
              <DashboardWidget
                nodes={nodes}
                onShieldNode={handleClearShield}
                onShieldAllNodes={handleShieldAllNodes}
              />
            </div>

            {/* Regional Landmarks & Objectives Deck */}
            <RegionalLandmarkDeck
              userLat={GATESVILLE_LAT}
              userLon={GATESVILLE_LON}
              landmarks={landmarks}
              onExecuteObjective={handleLandmarkObjective}
            />
          </>
        )}

        {/* SECTION: POKÉMON GO LOVE RADAR & 5-MILE MEETUPS */}
        {(activeSection === 'OVERVIEW' || activeSection === 'LOVE_MEETUP' || activeSection === 'MAP') && (
          <div style={{ padding: '0 16px' }}>
            <PokemonGoLoveMeetup
              onLogLoveRoutine={(log) => handleSaveWellnessLog(log as any)}
              userEmail={user?.email || undefined}
            />
          </div>
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
            {/* Child Wearable Band BLE Link & Traffic Light Interface */}
            <div style={{ padding: '0 16px', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <WearableManager />
            </div>

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
            onDeletePin={handleDeleteCustomPin}
            onTransformPin={transformCustomPinToActiveLandmark}
            onSaveLog={handleSaveWellnessLog}
          />
        )}

        {/* SECTION 5: DIAGNOSTICS & SYNC */}
        {(activeSection === 'OVERVIEW' || activeSection === 'DIAGNOSTICS') && (
          <>
            {/* Visual Coherence Warning Alert */}
            <CoherenceWarningAlert
              logs={wellnessLogs}
              currentHeartRate={heartRate}
              currentHrv={hrvMs}
              onTriggerHarmonicShield={handleAudioToggle}
              onTriggerRecoveryRoutine={() => handleActionTrigger('YOGA_STRETCH')}
              onSimulateElevated={triggerElevatedStressTest}
              onSimulateOptimal={triggerOptimalBioCoherence}
            />

            {/* 24-Hour Diurnal Biometric Heat Map */}
            <BiometricHeatMap
              logs={wellnessLogs}
              currentHeartRate={heartRate}
              currentHrv={hrvMs}
            />

            {/* Outbound Webhook Integration Monitoring Grid */}
            <SyncMonitorDeck />

            {/* IndexedDB Benchmark Speed Tester */}
            <PerfTesterDeck />
          </>
        )}

        {/* SECTION 6: AI INTEL SUITE */}
        {(activeSection === 'OVERVIEW' || activeSection === 'AI') && (
          <AiAssistantSuite />
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
