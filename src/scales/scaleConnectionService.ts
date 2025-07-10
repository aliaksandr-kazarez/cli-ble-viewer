import { NobleDevice } from '../types/ble.js';
import { logger } from '../utils/logger.js';

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

export type ScaleConnectionEvent =
  | { type: 'connected' }
  | { type: 'disconnected' }
  | { type: 'error'; error: Error }
  | { type: 'weight'; reading: ScaleWeightReading }
  | { type: 'battery'; reading: BatteryReading };

export type ScaleConnection = {
  connect: (device: NobleDevice) => Promise<void>;
  disconnect: () => void;
  on: (handler: (event: ScaleConnectionEvent) => void) => void;
  getStatus: () => boolean;
  readBattery: () => Promise<BatteryReading | null>;
};

export function createScaleConnection(): ScaleConnection {
  let device: NobleDevice | null = null;
  let isConnected = false;
  let lastPayloadHex: string | null = null;
  let eventHandlers: Array<(event: ScaleConnectionEvent) => void> = [];
  let batteryCharacteristic: any = null;

  function emit(event: ScaleConnectionEvent) {
    for (const handler of eventHandlers) handler(event);
  }

  async function connect(dev: NobleDevice): Promise<void> {
    device = dev;
    return new Promise((resolve, reject) => {
      device!.connect(async (err) => {
        if (err) {
          emit({ type: 'error', error: err });
          return reject(err);
        }
        isConnected = true;
        emit({ type: 'connected' });
        try {
          await setupServices();
          resolve();
        } catch (e) {
          emit({ type: 'error', error: e as Error });
          reject(e);
        }
      });
      device!.on('disconnect', () => {
        isConnected = false;
        emit({ type: 'disconnected' });
      });
    });
  }

  function disconnect() {
    if (device && isConnected) {
      device.disconnect();
      isConnected = false;
    }
  }

  function on(handler: (event: ScaleConnectionEvent) => void) {
    eventHandlers.push(handler);
  }

  function getStatus() {
    return isConnected;
  }

  async function readBattery(): Promise<BatteryReading | null> {
    if (!batteryCharacteristic) {
      logger.warn('Battery service not available on this device');
      return null;
    }

    return new Promise((resolve, reject) => {
      batteryCharacteristic.read((err: any, data: Buffer) => {
        if (err) {
          reject(err);
          return;
        }
        
        const level = data[0]; // Battery level is first byte (0-100)
        const reading: BatteryReading = {
          level,
          raw: data,
          timestamp: new Date(),
        };
        
        emit({ type: 'battery', reading });
        resolve(reading);
      });
    });
  }

  async function setupServices(): Promise<void> {
    if (!device) throw new Error('No device connected');
    return new Promise((resolve, reject) => {
      device!.discoverAllServicesAndCharacteristics((err, services, characteristics) => {
        if (err) return reject(err);
        if (!characteristics) return reject(new Error('No characteristics found'));

        // Log all available services and characteristics for debugging
        logger.debug('Available Services', { 
          services: services?.map((s: any) => ({ uuid: s.uuid, name: s.name || 'Unknown' }))
        });

        logger.debug('Available Characteristics', { 
          characteristics: characteristics.map((c: any) => ({ 
            uuid: c.uuid, 
            name: c.name || 'Unknown', 
            properties: c.properties 
          }))
        });

        // Setup weight notifications
        const weightChar = characteristics.find((c: any) =>
          String(c.uuid).toLowerCase() === 'ffb2' && c.properties.includes('notify')
        ) || characteristics.find((c: any) =>
          String(c.uuid).toLowerCase() === '2a9d' && c.properties.includes('indicate')
        );

        if (!weightChar) {
          logger.warn('No suitable weight characteristic found');
        } else {
          logger.info('Found weight characteristic', { uuid: weightChar.uuid });
          weightChar.on('data', (data: Buffer) => handleWeightData(data));
          weightChar.subscribe((err: any) => {
            if (err) {
              logger.error('Failed to subscribe to weight notifications', { error: err.message });
            } else {
              logger.info('Subscribed to weight notifications');
            }
          });
        }

        // Setup battery service
        const batteryService = services?.find((s: any) => String(s.uuid).toLowerCase() === '180f');
        if (batteryService) {
          logger.info('Found Battery Service');
          batteryCharacteristic = characteristics.find((c: any) => 
            String(c.uuid).toLowerCase() === '2a19' && c.properties.includes('read')
          );
          
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

  function handleWeightData(data: Buffer) {
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
    emit({ type: 'weight', reading });
  }

  return {
    connect,
    disconnect,
    on,
    getStatus,
    readBattery,
  };
} 