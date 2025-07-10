import noble from '@abandonware/noble';
import { NobleDevice } from '../types/ble.js';
import { logger } from '../utils/logger.js';
import { getManufacturerId } from '../utils/manufacturer.js';

export interface BluetoothService {
  waitForReady: () => Promise<void>;
  startScanning: (onDeviceUpdate: (devices: NobleDevice[]) => void) => Promise<void>;
  stopScanning: () => void;
}

export function createBluetoothService(): BluetoothService {
  let isScanning = false;
  let currentUpdateHandler: ((devices: NobleDevice[]) => void) | undefined;
  let discoveredDevices: NobleDevice[] = [];
  let updateTimeout: NodeJS.Timeout | null = null;

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
      discoveredDevices[existingIndex] = { ...device, lastSeen: now, firstSeen: (existingDevice as any).firstSeen || now };
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
    discoveredDevices = discoveredDevices.filter(d => (d as any).lastSeen >= cutoff);
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
      clearTimeout(updateTimeout);
    }
    updateTimeout = setTimeout(() => {
      // Sort devices by firstSeen (ascending)
      const sortedDevices = [...discoveredDevices].sort((a, b) => ((a as any).firstSeen || 0) - ((b as any).firstSeen || 0));
      if (currentUpdateHandler) {
        currentUpdateHandler(sortedDevices);
      }
    }, 100); // 100ms debounce
  }

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

  async function startScanning(onDeviceUpdate: (devices: NobleDevice[]) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (isScanning) {
        reject(new Error('Already scanning'));
        return;
      }

      // Clear any existing timeout
      if (updateTimeout) {
        clearTimeout(updateTimeout);
        updateTimeout = null;
      }

      // Reset discovered devices
      discoveredDevices = [];
      currentUpdateHandler = onDeviceUpdate;
      isScanning = true;
      
      logger.info('Starting BLE scan');
      noble.on('discover', handleDeviceDiscover);
      
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
      
      noble.removeListener('discover', handleDeviceDiscover);
      currentUpdateHandler = undefined;
      
      if (updateTimeout) {
        clearTimeout(updateTimeout);
        updateTimeout = null;
      }
      
      discoveredDevices = [];
    }
  }

  return {
    waitForReady,
    startScanning,
    stopScanning,
  };
} 