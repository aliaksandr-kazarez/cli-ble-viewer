import React from 'react';
import { BluetoothService } from "./bluetoothService.js";
import { ScaleConnection } from "../scales/scaleConnectionService.js";
import { Application, InkUIState } from '../ui/Application.js';
import { logger } from '../utils/logger.js';
import { NobleDevice } from '../types/ble.js';
import { render } from 'ink';

export interface UIServiceConfig {
  bluetoothService: BluetoothService;
  // scaleConnection: ScaleConnection;
}

export interface UIService {
  start: () => void;
}

export function createUIService({ bluetoothService }: UIServiceConfig): UIService {
  let isStarted = false;

  function start() {
    if (isStarted) {
      logger.warn('UI already started');
      return;
    }
    
    isStarted = true;
    render(React.createElement(Application, {}), {
      stdout: process.stdout,
      stdin: process.stdin
    });
  }

  return {
    start
  };
} 