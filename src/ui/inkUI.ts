import React, { useState, useEffect } from 'react';
import { render } from 'ink';
import { App } from './components/App.js';
import { NobleDevice } from '../types/ble.js';
import { ScaleWeightReading } from '../scales/scaleConnectionService.js';

export interface InkUIState {
  devices: NobleDevice[];
  selectedDevice?: NobleDevice;
  isConnected: boolean;
  lastWeight?: ScaleWeightReading;
  batteryLevel?: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'; 
}

function InkApp() {
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
      if (onDeviceSelect) {
        onDeviceSelect(device);
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

export function createInkUI() {
  let hasStarted = false;

  function start() {
    if (hasStarted) {
      return; // Prevent multiple renders
    }
    hasStarted = true;
    render(React.createElement(InkApp), {
      stdout: process.stdout,
      stdin: process.stdin
    });
  }

  function updateState(newState: Partial<InkUIState>) {
    if ((global as any).updateInkState) {
      (global as any).updateInkState(newState);
    }
  }

  function setDeviceSelectHandler(handler: (device: NobleDevice) => void) {
    if ((global as any).setInkDeviceSelectHandler) {
      (global as any).setInkDeviceSelectHandler(handler);
    }
  }

  function setExitHandler(handler: () => void) {
    if ((global as any).setInkExitHandler) {
      (global as any).setInkExitHandler(handler);
    }
  }

  function setBatteryReadHandler(handler: () => void) {
    if ((global as any).setInkBatteryReadHandler) {
      (global as any).setInkBatteryReadHandler(handler);
    }
  }

  return {
    start,
    updateState,
    setDeviceSelectHandler,
    setExitHandler,
    setBatteryReadHandler,
  };
} 