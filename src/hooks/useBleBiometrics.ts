import { useState, useEffect, useRef } from 'react';

export interface BleState {
  heartRate: number;
  hrvMs: number;
  isBleConnected: boolean;
  isSimulated: boolean;
  deviceName: string | null;
  error: string | null;
}

export const useBleBiometrics = () => {
  const [heartRate, setHeartRate] = useState<number>(76);
  const [hrvMs, setHrvMs] = useState<number>(55);
  const [isBleConnected, setIsBleConnected] = useState<boolean>(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(true);
  const [bleDevice, setBleDevice] = useState<any | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const simulationIntervalRef = useRef<number | null>(null);

  // Background fluctuation simulation when connected (simulates real-time biometric telemetry)
  useEffect(() => {
    if (isBleConnected && isSimulated) {
      simulationIntervalRef.current = window.setInterval(() => {
        // Natural slight heart rate drift around baseline
        setHeartRate((prev) => {
          const delta = (Math.random() - 0.48) * 3;
          const next = Math.round(prev + delta);
          return Math.max(58, Math.min(130, next));
        });

        // HRV inversely correlates with stress
        setHrvMs((prev) => {
          const delta = (Math.random() - 0.5) * 4;
          const next = Math.round(prev + delta);
          return Math.max(25, Math.min(85, next));
        });
      }, 1500);
    } else {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    }

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [isBleConnected, isSimulated]);

  // Connect to physical Web Bluetooth GATT device if available, otherwise toggle high-fidelity simulated link
  const connectGattDevice = async () => {
    setError(null);
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      try {
        console.log('Scanning for Bluetooth SIG Heart Rate peripherals...');
        const device = await (navigator as any).bluetooth.requestDevice({
          filters: [{ services: ['heart_rate'] }]
        });
        setBleDevice(device);
        setDeviceName(device.name || 'BLE Heart Band');

        const server = await device.gatt?.connect();
        if (!server) throw new Error('Could not establish secure GATT channel');

        const service = await server.getPrimaryService('heart_rate');
        const characteristic = await service.getCharacteristic('heart_rate_measurement');
        await characteristic.startNotifications();

        characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
          const value: DataView = event.target.value;
          const flags = value.getUint8(0);
          const rate = (flags & 1) === 1 ? value.getUint16(1, true) : value.getUint8(1);
          setHeartRate(rate);

          // Approximate HRV or parse RR intervals if present
          if (value.byteLength >= 4) {
            const rr = value.getUint16(2, true);
            const calculatedHrv = Math.round(rr / 1024 * 60);
            if (calculatedHrv > 10 && calculatedHrv < 150) setHrvMs(calculatedHrv);
          }
        });

        device.addEventListener('gattserverdisconnected', () => {
          setIsBleConnected(false);
          setDeviceName(null);
        });

        setIsBleConnected(true);
        setIsSimulated(false);
        return;
      } catch (err: any) {
        console.warn('Physical Web Bluetooth unavailable or cancelled; activating high-fidelity bio-telemetry stream emulator:', err.message);
      }
    }

    // High-fidelity fallback stream emulator (perfect for desktop/testing/non-supported browsers)
    setIsBleConnected(true);
    setIsSimulated(true);
    setDeviceName('Bio-Telemetry Neural Band (Virtual Stream)');
    setHeartRate(78);
    setHrvMs(54);
  };

  const disconnectGattDevice = () => {
    if (bleDevice && bleDevice.gatt?.connected) {
      bleDevice.gatt.disconnect();
    }
    setBleDevice(null);
    setIsBleConnected(false);
    setDeviceName(null);
  };

  const triggerElevatedStressTest = () => {
    setHeartRate(104);
    setHrvMs(32);
    setIsBleConnected(true);
  };

  const triggerOptimalBioCoherence = () => {
    setHeartRate(68);
    setHrvMs(72);
    setIsBleConnected(true);
  };

  return {
    heartRate,
    hrvMs,
    isBleConnected,
    isSimulated,
    deviceName,
    error,
    connectGattDevice,
    disconnectGattDevice,
    triggerElevatedStressTest,
    triggerOptimalBioCoherence,
    setHeartRate,
    setHrvMs
  };
};
