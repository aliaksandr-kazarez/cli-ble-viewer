import { createBluetoothService } from './services/bluetoothService.js';
import { render } from 'ink';
import React from 'react';
import { Application } from './ui/index.js';

export interface Application {
  halt: () => Promise<void>;
}

export async function createApplication(): Promise<Application> {
  // create services
  const bluetoothService = await createBluetoothService();
  // const scaleConnection = await createScaleConnection();

  render(React.createElement(Application, { bluetoothService }), {
    stdout: process.stdout,
    stdin: process.stdin
  });

  return {
    halt: async () => {
      await bluetoothService.stop();
    },
  };
} 