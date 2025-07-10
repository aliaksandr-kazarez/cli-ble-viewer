/// <reference types="node" />
import noble from '@abandonware/noble';
import { NobleDevice } from '../types/ble.js';
import { logger } from '../utils/logger.js';
import { getManufacturerId } from '../utils/manufacturer.js';

export interface BluetoothService {
  /**
   * Start scanning for BLE devices.
   * @param onDevicesUpdated - Callback function to handle device updates. return full list of devices
   * @returns A promise that resolves when the service is started.
   */
  start: (onDevicesUpdated: (devices: NobleDevice[]) => void) => Promise<void>;
  stop: () => void;
}

export async function createBluetoothService(): Promise<BluetoothService> {

  let isScanning = false;
  let currentUpdateHandler: ((devices: NobleDevice[]) => void) | undefined;
  let discoveredDevices: NobleDevice[] = [];
  // FIXME: use a better timeout mechanism
  let updateTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;

  // Create a better unique identifier that includes manufacturer ID
  function createDeviceId(dev: NobleDevice): string {
    const name = dev.advertisement.localName || '(no name)';
    const address = dev.address || 'unknown';
    const serviceUuids = dev.advertisement.serviceUuids || [];
    const manufacturerId = getManufacturerId(dev.advertisement.manufacturerData);
    
    // If we have a valid address, use it as primary identifier
    if (address && address !== 'unknown' && address.trim() !== '') {
      return `addr-${address}-${manufacturerId}`;
    }
    
    // Otherwise use a combination of other stable identifiers including manufacturer ID
    return `name-${name}-services-${serviceUuids.join(',')}-${manufacturerId}`;
  }

  function handleDeviceDiscover(device: NobleDevice) {
    const localName = device.advertisement.localName || '(no name)';
    const now = Date.now();
    
    const deviceId = createDeviceId(device);
    
    // Add or update device with lastSeen timestamp, and track firstSeen
    const existingIndex = discoveredDevices.findIndex(d => createDeviceId(d) === deviceId);
    if (existingIndex >= 0) {
      // Only update lastSeen, preserve firstSeen
      const existingDevice = discoveredDevices[existingIndex];
      discoveredDevices[existingIndex] = { ...device, lastSeen: now, firstSeen: (existingDevice as NobleDevice).firstSeen || now };
    } else {
      discoveredDevices.push({ ...device, lastSeen: now, firstSeen: now });
      // Only log new devices, not every discovery
      logger.info('New device discovered', { 
        name: localName, 
        address: device.address || 'empty',
        services: device.advertisement.serviceUuids?.length || 0,
        manufacturerId: getManufacturerId(device.advertisement.manufacturerData),
        totalDevices: discoveredDevices.length
      });
    }
    
    // Remove devices not seen in the last 5 seconds
    const cutoff = now - 5000;
    const beforePrune = discoveredDevices.length;
    discoveredDevices = discoveredDevices.filter(d => (d as NobleDevice).lastSeen !== undefined && (d as NobleDevice).lastSeen! >= cutoff);
    const afterPrune = discoveredDevices.length;
    
    // Only log pruning if devices were actually removed
    if (beforePrune !== afterPrune && beforePrune - afterPrune > 0) {
      logger.debug('Removed stale devices', { 
        removed: beforePrune - afterPrune,
        remaining: afterPrune
      });
    }
    
    // Debounce UI updates to prevent flickering
    if (updateTimeout) {
      globalThis.clearTimeout(updateTimeout);
    }
    updateTimeout = globalThis.setTimeout(() => {
      // Sort devices by firstSeen (ascending)
      const sortedDevices = [...discoveredDevices].sort((a, b) => ((a as NobleDevice).firstSeen || 0) - ((b as NobleDevice).firstSeen || 0));
      if (currentUpdateHandler) {
        currentUpdateHandler(sortedDevices);
      }
    }, 100); // 100ms debounce
  }

  async function waitForReady(): Promise<void> {
    return new Promise<void>((resolve) => {
      if ((noble as unknown as { state: string }).state === 'poweredOn') {
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

  async function start(onDevicesUpdated: (devices: NobleDevice[]) => void): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (isScanning) {
        reject(new Error('Already scanning'));
        return;
      }

      try {
        // Wait for noble to be ready
        await waitForReady();

        // Clear any existing timeout
        if (updateTimeout) {
          globalThis.clearTimeout(updateTimeout);
          updateTimeout = null;
        }

        // Reset discovered devices
        discoveredDevices = [];
        currentUpdateHandler = onDevicesUpdated;
        isScanning = true;
        
        logger.info('Starting BLE scan');
        noble.on('discover', handleDeviceDiscover);
        
        noble.startScanning([], true, (error?: Error) => {
          if (error) {
            logger.error('Scan start error', { error: error.message });
            isScanning = false;
            reject(error);
          } else {
            logger.info('Scan started successfully');
            resolve();
          }
        });
      } catch (error) {
        isScanning = false;
        reject(error);
      }
    });
  }

  function stop(): void {
    if (isScanning) {
      logger.info('Stopping BLE scan');
      noble.stopScanning();
      isScanning = false;
      
      noble.removeListener('discover', handleDeviceDiscover);
      currentUpdateHandler = undefined;
      
      if (updateTimeout) {
        globalThis.clearTimeout(updateTimeout);
        updateTimeout = null;
      }
      
      discoveredDevices = [];
    }
  }

  return {
    start,
    stop,
  };
} 