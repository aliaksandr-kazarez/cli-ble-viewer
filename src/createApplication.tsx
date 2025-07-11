import { createBluetooth } from './services/bluetooth/bluetooth.js';
import { withFullScreen } from 'fullscreen-ink';
import React from 'react';
import { Application } from './ui/index.js';

export interface Application {
  halt: () => Promise<void>;
}

export async function createApplication(): Promise<Application> {
  // create services
  const bluetooth = await createBluetooth();

  // Start the fullscreen application
  const fullscreenApp = withFullScreen(<Application bluetooth={bluetooth} />, {
    exitOnCtrlC: true
  });
  
  fullscreenApp.start();

  return {
    halt: async () => {
      await bluetooth.stop();
    },
  };
} 