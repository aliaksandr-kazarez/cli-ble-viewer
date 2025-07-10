import noble from '@abandonware/noble';
import { NobleDevice } from '../types/ble.js';
import { logger } from '../utils/logger.js';

// Bluetooth service - handles BLE operations independently
export class BluetoothService {
  private isScanning = false;
  private currentDiscoverHandler?: (device: NobleDevice) => void;

  // Wait for noble to be ready
  async waitForReady(): Promise<void> {
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

  // Start scanning for devices
  startScanning(onDeviceDiscover: (device: NobleDevice) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isScanning) {
        reject(new Error('Already scanning'));
        return;
      }

      // Remove any existing discover handler
      if (this.currentDiscoverHandler) {
        logger.debug('Removing previous discover handler');
        noble.removeListener('discover', this.currentDiscoverHandler);
      }

      this.currentDiscoverHandler = onDeviceDiscover;
      this.isScanning = true;
      logger.info('Starting BLE scan', { hasHandler: !!this.currentDiscoverHandler });
      noble.on('discover', onDeviceDiscover);
      
      noble.startScanning([], true, (error) => {
        if (error) {
          logger.error('Scan start error', { error: error.message });
          this.isScanning = false;
          reject(error);
        } else {
          logger.info('Scan started successfully');
          resolve();
        }
      });
    });
  }

  // Stop scanning
  stopScanning(): void {
    if (this.isScanning) {
      logger.info('Stopping BLE scan');
      noble.stopScanning();
      // Remove the discover handler
      if (this.currentDiscoverHandler) {
        noble.removeListener('discover', this.currentDiscoverHandler);
        this.currentDiscoverHandler = undefined;
      }
      this.isScanning = false;
    }
  }

  // Check if currently scanning
  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }

  // Get current bluetooth state
  getState(): string {
    return (noble as any).state;
  }
} 