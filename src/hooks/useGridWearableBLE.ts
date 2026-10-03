import { useState, useCallback } from 'react';

// Using standard BLE UUID for Heart Rate, and custom UUIDs for our hardware buttons
const HR_SERVICE = 'heart_rate';
const HR_MEASUREMENT_CHAR = 'heart_rate_measurement';

// Custom UUIDs configured in physical microcontroller (ESP32 or Nordic nRF52)
const GRID_GUARDIAN_SERVICE = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
const TRAFFIC_LIGHT_CHAR = 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e';

export type AlertLevel = 'GREEN' | 'YELLOW' | 'RED' | 'OFFLINE';

export const useGridWearableBLE = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [heartRate, setHeartRate] = useState<number>(0);
  const [alertLevel, setAlertLevel] = useState<AlertLevel>('OFFLINE');
  const [device, setDevice] = useState<any | null>(null);
  const [bleError, setBleError] = useState<string | null>(null);
  const [isSimulatedMode, setIsSimulatedMode] = useState(false);

  const handleHeartRateChange = (event: any) => {
    const value = event.target?.value;
    if (!value) return;
    // Standard BLE Heart Rate parsing (Flags are in the first byte)
    const flags = value.getUint8(0);
    const rate16Bits = flags & 0x1;
    const hr = rate16Bits ? value.getUint16(1, true) : value.getUint8(1);
    setHeartRate(hr);
  };

  const handleTrafficLightChange = (event: any) => {
    const value = event.target?.value;
    if (!value) return;
    const byteVal = value.getUint8(0);
    // Map hardware bytes to our alert states
    if (byteVal === 0x01) setAlertLevel('GREEN'); // Tap
    else if (byteVal === 0x02) setAlertLevel('YELLOW'); // Double-tap
    else if (byteVal === 0x03) setAlertLevel('RED'); // Hard press
  };

  const connectDevice = useCallback(async () => {
    setBleError(null);

    // Check if Web Bluetooth API is supported in the current browser
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    if (!nav || !nav.bluetooth) {
      console.warn('Web Bluetooth API not available in this browser environment. Engaging simulated pairing link.');
      setIsConnected(true);
      setIsSimulatedMode(true);
      setAlertLevel('GREEN');
      setHeartRate(82);
      return;
    }

    try {
      // 1. Request the Bluetooth device
      const bleDevice = await nav.bluetooth.requestDevice({
        filters: [{ services: [HR_SERVICE, GRID_GUARDIAN_SERVICE] }],
        optionalServices: [HR_SERVICE, GRID_GUARDIAN_SERVICE],
      });

      bleDevice.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setAlertLevel('OFFLINE');
        setHeartRate(0);
        setDevice(null);
      });

      setDevice(bleDevice);

      // 2. Connect to the GATT server
      const server = await bleDevice.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      // 3. Start Heart Rate Stream
      try {
        const hrService = await server.getPrimaryService(HR_SERVICE);
        const hrChar = await hrService.getCharacteristic(HR_MEASUREMENT_CHAR);
        await hrChar.startNotifications();
        hrChar.addEventListener('characteristicvaluechanged', handleHeartRateChange);
      } catch (hrErr) {
        console.warn('Heart rate characteristic subscription failed, falling back:', hrErr);
      }

      // 4. Start Traffic Light Boundary Stream
      try {
        const gridService = await server.getPrimaryService(GRID_GUARDIAN_SERVICE);
        const trafficChar = await gridService.getCharacteristic(TRAFFIC_LIGHT_CHAR);
        await trafficChar.startNotifications();
        trafficChar.addEventListener('characteristicvaluechanged', handleTrafficLightChange);
      } catch (gridErr) {
        console.warn('Traffic Light characteristic subscription failed, falling back:', gridErr);
      }

      setIsConnected(true);
      setIsSimulatedMode(false);
      setAlertLevel('GREEN'); // Default to safe on successful pair
    } catch (error: any) {
      console.error('BLE Pairing Failed:', error);
      // User cancelled or security exception - offer simulated link option
      setBleError(error?.message || 'Bluetooth request cancelled or failed');
      setIsConnected(false);
      setAlertLevel('OFFLINE');
    }
  }, []);

  const disconnectDevice = useCallback(() => {
    if (device && device.gatt?.connected) {
      device.gatt.disconnect();
    }
    setDevice(null);
    setIsConnected(false);
    setIsSimulatedMode(false);
    setAlertLevel('OFFLINE');
    setHeartRate(0);
  }, [device]);

  // Support local simulation / override when testing without physical band
  const simulateHardwareInput = useCallback((level: AlertLevel) => {
    setAlertLevel(level);
  }, []);

  return {
    isConnected,
    heartRate,
    alertLevel,
    connectDevice,
    disconnectDevice,
    simulateHardwareInput,
    bleError,
    isSimulatedMode,
  };
};
