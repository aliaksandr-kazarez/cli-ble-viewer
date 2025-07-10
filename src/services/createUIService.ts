import React from 'react';
import { BluetoothService } from "./bluetoothService.js";
import { ScaleConnection } from "../scales/scaleConnectionService.js";
import { InkApp, InkUIState } from '../ui/inkUI.js';
import { logger } from '../utils/logger.js';
import { NobleDevice } from '../types/ble.js';
import { render } from 'ink';

export interface UIServiceConfig {
  bluetoothService: BluetoothService;
  scaleConnection: ScaleConnection;
}

export interface UIService {
  start: () => void;
  updateState: (state: Partial<InkUIState>) => void;
  setDeviceSelectHandler: (handler: (device: NobleDevice) => void) => void;
  setExitHandler: (handler: () => void) => void;
  setBatteryReadHandler: (handler: () => void) => void;
}

export function createUIService({ bluetoothService, scaleConnection }: UIServiceConfig): UIService {
  let isStarted = false;

  function start() {
    if (isStarted) {
      logger.warn('UI already started');
      return;
    }
    
    isStarted = true;
    render(React.createElement(InkApp), {
      stdout: process.stdout,
      stdin: process.stdin
    });
  }

  function updateState(state: Partial<InkUIState>) {
    if (typeof (global as any).updateInkState === 'function') {
      (global as any).updateInkState(state);
    } else {
      logger.warn('updateInkState not available yet');
    }
  }

  function setDeviceSelectHandler(handler: (device: NobleDevice) => void) {
    if (typeof (global as any).setInkDeviceSelectHandler === 'function') {
      (global as any).setInkDeviceSelectHandler(handler);
    } else {
      logger.warn('setInkDeviceSelectHandler not available yet');
    }
  }

  function setExitHandler(handler: () => void) {
    if (typeof (global as any).setInkExitHandler === 'function') {
      (global as any).setInkExitHandler(handler);
    } else {
      logger.warn('setInkExitHandler not available yet');
    }
  }

  function setBatteryReadHandler(handler: () => void) {
    if (typeof (global as any).setInkBatteryReadHandler === 'function') {
      (global as any).setInkBatteryReadHandler(handler);
    } else {
      logger.warn('setInkBatteryReadHandler not available yet');
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