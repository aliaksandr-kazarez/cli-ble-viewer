import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { DiscoveredDevice } from './bluetoothService.js';
import { Service, Characteristic } from '@abandonware/noble';

export type ScaleWeightReading = {
  grams: number;
  kg: number;
  raw: Buffer;
  timestamp: Date;
};

export type BatteryReading = {
  level: number; // 0-100 percentage
  raw: Buffer;
  timestamp: Date;
};

export type ScaleConnectionEventMap = {
  'connected': [];
  'disconnected': [];
  'error': [error: Error];
  'weight': [reading: ScaleWeightReading];
  'battery': [reading: BatteryReading];
};

export interface ScaleConnectionService extends EventEmitter<ScaleConnectionEventMap> {
  connect: (device: DiscoveredDevice) => Promise<void>;
  disconnect: () => Promise<void>;
  readBattery: () => Promise<BatteryReading | null>;
  getStatus: () => boolean;
};

export function createScaleConnectionService(): ScaleConnectionService {
  let device: DiscoveredDevice | null = null;
  let isConnected = false;
  let lastPayloadHex: string | null = null;
  let batteryCharacteristic: Characteristic | null = null;

  // Create EventEmitter instance
  const eventEmitter = new EventEmitter<ScaleConnectionEventMap>();

  async function connect(dev: DiscoveredDevice): Promise<void> {
    device = dev;
    return new Promise((resolve, reject) => {
      device!.peripheral.connect((error?: unknown) => {
        if (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          eventEmitter.emit('error', errorObj);
          return reject(error);
        }
        isConnected = true;
        eventEmitter.emit('connected');
        setupServices()
          .then(resolve)
          .catch((e) => {
            const errorObj = e instanceof Error ? e : new Error(String(e));
            eventEmitter.emit('error', errorObj);
            reject(e);
          });
      });
      device!.peripheral.on('disconnect', () => {
        isConnected = false;
        eventEmitter.emit('disconnected');
      });
    });
  }

  function disconnect(): void {
    if (device && isConnected) {
      device.peripheral.disconnect();
      isConnected = false;
    }
  }

  function getStatus(): boolean {
    return isConnected;
  }

  async function readBattery(): Promise<BatteryReading | null> {
    if (!batteryCharacteristic) {
      logger.warn('Battery service not available on this device');
      return null;
    }

    return new Promise((resolve, reject) => {
      batteryCharacteristic!.read((error: string, data: Buffer) => {
        if (error) {
          reject(new Error(error));
          return;
        }
        const level = data[0]; // Battery level is first byte (0-100)
        const reading: BatteryReading = {
          level,
          raw: data,
          timestamp: new Date(),
        };
        eventEmitter.emit('battery', reading);
        resolve(reading);
      });
    });
  }

  async function setupServices(): Promise<void> {
    if (!device) throw new Error('No device connected');
    return new Promise((resolve, reject) => {
      device!.peripheral.discoverAllServicesAndCharacteristics((error: string, services: Service[], characteristics: Characteristic[]) => {
        if (error) return reject(new Error(error));
        if (!characteristics) return reject(new Error('No characteristics found'));

        // Log all available services and characteristics for debugging
        logger.debug('Available Services', {
          services: services?.map((s) => ({ uuid: s.uuid, name: s.name || 'Unknown' }))
        });

        logger.debug('Available Characteristics', {
          characteristics: characteristics.map((c) => ({
            uuid: c.uuid,
            name: c.name || 'Unknown',
            properties: c.properties
          }))
        });

        // Setup weight notifications
        const weightChar = characteristics.find((c) =>
          String(c.uuid).toLowerCase() === 'ffb2' && c.properties.includes('notify')
        ) || characteristics.find((c) =>
          String(c.uuid).toLowerCase() === '2a9d' && c.properties.includes('indicate')
        );

        if (!weightChar) {
          logger.warn('No suitable weight characteristic found');
        } else {
          logger.info('Found weight characteristic', { uuid: weightChar.uuid });
          weightChar.on('data', (data: Buffer) => handleWeightData(data));
          weightChar.subscribe((err: string) => {
            if (err) {
              logger.error('Failed to subscribe to weight notifications', { error: err });
            } else {
              logger.info('Subscribed to weight notifications');
            }
          });
        }

        // Setup battery service
        const batteryService = services?.find((s) => String(s.uuid).toLowerCase() === '180f');
        if (batteryService) {
          logger.info('Found Battery Service');
          batteryCharacteristic = characteristics.find((c) =>
            String(c.uuid).toLowerCase() === '2a19' && c.properties.includes('read')
          ) || null;

          if (batteryCharacteristic) {
            logger.info('Found Battery Level characteristic');
            // Read initial battery level
            readBattery().then(reading => {
              if (reading) {
                logger.info('Battery Level', { level: reading.level });
              }
            }).catch(err => {
              logger.error('Failed to read battery level', { error: err.message });
            });
          } else {
            logger.warn('Battery Service found but no readable Battery Level characteristic');
          }
        } else {
          logger.warn('No Battery Service found on this device');
        }

        resolve();
      });
    });
  }

  function handleWeightData(data: Buffer): void {
    const hexStr = data.toString('hex');
    if (lastPayloadHex === hexStr) return; // dedupe
    lastPayloadHex = hexStr;
    let grams = 0;
    if (data.length === 8) {
      grams = data.readUInt16LE(2) / 10;
    }
    const reading: ScaleWeightReading = {
      grams,
      kg: grams / 1000,
      raw: data,
      timestamp: new Date(),
    };
    eventEmitter.emit('weight', reading);
  }

  // Create the ScaleConnection object by combining EventEmitter methods with our custom methods
  const scaleConnection = Object.assign(eventEmitter, {
    connect,
    disconnect,
    getStatus,
    readBattery,
  }) as ScaleConnectionService;

  return scaleConnection;
} 