import React, { useState } from 'react';
import { App } from './components/App.js';
import { NobleDevice } from '../types/ble.js';
import { ScaleWeightReading } from '../scales/scaleConnectionService.js';
import { logger } from '../utils/logger.js';

export function Application() {
  const [state, setState] = useState<InkUIState>({
    devices: [],
    isConnected: false,
    connectionStatus: 'disconnected'
  });
  
  const [onDeviceSelect, setOnDeviceSelect] = useState<((device: NobleDevice) => void) | undefined>();
  const [onExit, setOnExit] = useState<(() => void) | undefined>();
  const [onBatteryRead, setOnBatteryRead] = useState<(() => void) | undefined>();

  // Expose updateState function globally
  (global as any).updateInkState = (newState: Partial<InkUIState>) => {
    setState(prevState => ({ ...prevState, ...newState }));
  };

  // Expose setDeviceSelectHandler globally
  (global as any).setInkDeviceSelectHandler = (handler: (device: NobleDevice) => void) => {
    setOnDeviceSelect(() => handler);
  };

  // Expose setExitHandler globally
  (global as any).setInkExitHandler = (handler: () => void) => {
    setOnExit(() => handler);
  };

  // Expose setBatteryReadHandler globally
  (global as any).setInkBatteryReadHandler = (handler: () => void) => {
    setOnBatteryRead(() => handler);
  };

  return React.createElement(App, {
    devices: state.devices,
    onDeviceSelect: (device: NobleDevice) => {
      logger.debug('onDeviceSelect called in InkApp', { deviceName: device.advertisement.localName, hasHandler: !!onDeviceSelect });
      if (onDeviceSelect) {
        onDeviceSelect(device);
      } else {
        logger.debug('No device select handler available');
      }
    },
    selectedDevice: state.selectedDevice,
    isConnected: state.isConnected,
    lastWeight: state.lastWeight,
    batteryLevel: state.batteryLevel,
    connectionStatus: state.connectionStatus,
    onExit: () => {
      if (onExit) {
        onExit();
      }
    },
    onBatteryRead: () => {
      if (onBatteryRead) {
        onBatteryRead();
      }
    }
  });
}

