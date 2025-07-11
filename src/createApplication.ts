import { createBluetooth } from './services/bluetooth/bluetooth.js';
import { render } from 'ink';
import React from 'react';
import { Application } from './ui/index.js';
import { createScaleConnectionService } from './services/scaleConnectionService.js';

export interface Application {
  halt: () => Promise<void>;
}

export async function createApplication(): Promise<Application> {
  // create services
  const bluetooth = await createBluetooth();

  render(React.createElement(Application, { bluetooth }), {
    stdout: process.stdout,
    stdin: process.stdin
  });

  return {
    halt: async () => {
      await bluetooth.stop();
    },
  };
} 