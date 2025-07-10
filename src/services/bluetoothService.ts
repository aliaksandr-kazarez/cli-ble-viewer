import noble from '@abandonware/noble';
import { NobleDevice } from '../types/ble.js';
import { logger } from '../utils/logger.js';

export function createBluetoothService() {
  let isScanning = false;
  let currentDiscoverHandler: ((device: NobleDevice) => void) | undefined;

  async function waitForReady(): Promise<void> {
    return new Promise<void>((resolve) => {
      if ((noble as any).state === 'poweredOn') {
        resolve();
      } else {
        noble.on('stateChange', (state) => {
          if (state === 'poweredOn') {
            resolve();
          }
        });
      }
    });
  }

  async function startScanning(onDeviceDiscover: (device: NobleDevice) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (isScanning) {
        reject(new Error('Already scanning'));
        return;
      }

      if (currentDiscoverHandler) {
        logger.debug('Removing previous discover handler');
        noble.removeListener('discover', currentDiscoverHandler);
      }

      currentDiscoverHandler = onDeviceDiscover;
      isScanning = true;
      logger.info('Starting BLE scan', { hasHandler: !!currentDiscoverHandler });
      noble.on('discover', onDeviceDiscover);
      
      noble.startScanning([], true, (error) => {
        if (error) {
          logger.error('Scan start error', { error: error.message });
          isScanning = false;
          reject(error);
        } else {
          logger.info('Scan started successfully');
          resolve();
        }
      });
    });
  }

  function stopScanning(): void {
    if (isScanning) {
      logger.info('Stopping BLE scan');
      noble.stopScanning();
      isScanning = false;
      
      if (currentDiscoverHandler) {
        noble.removeListener('discover', currentDiscoverHandler);
        currentDiscoverHandler = undefined;
      }
    }
  }

  return {
    waitForReady,
    startScanning,
    stopScanning,
  };
} 