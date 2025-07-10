import { createBluetoothService } from './services/bluetoothService.js';
import { render } from 'ink';
import React from 'react';
import { Application } from './ui/index.js';
import { createScaleConnectionService } from './services/scaleConnectionService.js';

export interface Application {
  halt: () => Promise<void>;
}

export async function createApplication(): Promise<Application> {
  // create services
  const bluetoothService = await createBluetoothService();
  const scaleConnectionService = await createScaleConnectionService();

  render(React.createElement(Application, { bluetoothService, scaleConnectionService }), {
    stdout: process.stdout,
    stdin: process.stdin
  });

  return {
    halt: async () => {
      await bluetoothService.stop();
    },
  };
} 