/// <reference types="node" />
import noble, { Peripheral } from '@abandonware/noble';
import { logger } from '../utils/logger.js';
import { getManufacturerId } from '../utils/manufacturer.js';
import EventEmitter from 'events';

export type DiscoveredDevice = {
  peripheral: Peripheral;
  lastSeen: number;
  firstSeen: number;
};

export type BluetoothServiceEventMap = {
  'device-discovered': [device: DiscoveredDevice];
  'devices-updated': [devices: DiscoveredDevice[]];
};

export interface BluetoothService extends EventEmitter<BluetoothServiceEventMap> {
  /**
   * Start scanning for BLE devices.
   * @returns A promise that resolves when the service is started.
   */
  start: () => Promise<void>;
  stop: () => void;
}

export async function createBluetoothService(): Promise<BluetoothService> {
  const eventEmitter = new EventEmitter() as BluetoothService;
  
  let isScanning = false;
  let discoveredDevices: DiscoveredDevice[] = [];
  // FIXME: use a better timeout mechanism
  let updateTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;

  // Create a better unique identifier that includes manufacturer ID
  function createDeviceId(peripheral: Peripheral): string {
    // const name = peripheral.advertisement.localName || '(no name)';
    // const address = peripheral.address || 'unknown';
    // const serviceUuids = peripheral.advertisement.serviceUuids || [];
    // const manufacturerId = getManufacturerId(peripheral.advertisement.manufacturerData);
    
    // // If we have a valid address, use it as primary identifier
    // if (address && address !== 'unknown' && address.trim() !== '') {
    //   return `addr-${address}-${manufacturerId}`;
    // }
    
    // // Otherwise use a combination of other stable identifiers including manufacturer ID
    // return `name-${name}-services-${serviceUuids.join(',')}-${manufacturerId}`;
    return peripheral.uuid;
  }

  function handleDeviceDiscover(peripheral: Peripheral) {
    const localName = peripheral.advertisement.localName || '(no name)';
    const now = Date.now();
    
    const deviceId = createDeviceId(peripheral);
    
    // Add or update device with lastSeen timestamp, and track firstSeen
    const existingIndex = discoveredDevices.findIndex(d => createDeviceId(d.peripheral) === deviceId);
    if (existingIndex >= 0) {
      // Only update lastSeen, preserve firstSeen
      const existingDevice = discoveredDevices[existingIndex];
      discoveredDevices[existingIndex] = {
        ...existingDevice, // Keep existing device as base
        lastSeen: now,
        // Preserve other fields we want to keep from existing device
        firstSeen: existingDevice.firstSeen || now,
        // Only update fields that could change from device
        peripheral: peripheral
      };
    } else {
      // For new devices, create a DiscoveredDevice by picking only the fields we need
      const newDevice: DiscoveredDevice = {
        peripheral: peripheral,
        lastSeen: now,
        firstSeen: now
      };
      discoveredDevices.push(newDevice);
      // Only log new devices, not every discovery
      logger.info('New device discovered', {
        name: localName, 
        address: peripheral.address || 'empty',
        services: peripheral.advertisement.serviceUuids?.length || 0,
        manufacturerId: getManufacturerId(peripheral.advertisement.manufacturerData),
        totalDevices: discoveredDevices.length
      });
      
      // Emit the device-discovered event for new devices
      eventEmitter.emit('device-discovered', newDevice);
    }
    
    // Remove devices not seen in the last 5 seconds
    const cutoff = now - 10000;
    const beforePrune = discoveredDevices.length;
    discoveredDevices = discoveredDevices.filter(d => d.lastSeen !== undefined && d.lastSeen! >= cutoff);
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
      const sortedDevices = [...discoveredDevices].sort((a, b) => (a.firstSeen || 0) - (b.firstSeen || 0));
      eventEmitter.emit('devices-updated', sortedDevices);
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

  async function start(): Promise<void> {
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
      
      if (updateTimeout) {
        globalThis.clearTimeout(updateTimeout);
        updateTimeout = null;
      }
      
      discoveredDevices = [];
    }
  }

  // Attach methods to the event emitter
  eventEmitter.start = start;
  eventEmitter.stop = stop;

  return eventEmitter;
} 