import { Characteristic, Service } from "@abandonware/noble";
import { logger } from "../../utils/logger";
import { BatteryReading } from "../scaleConnectionService";

const BATTERY_SERVICE_UUID = '180f';
const BATTERY_LEVEL_CHARACTERISTIC_UUID = '2a19';

export interface BatteryService {
  read: () => Promise<BatteryReading>;
}

export async function setupBatteryService(services: Service[], characteristics: Characteristic[]): Promise<BatteryService | null> {
  const batteryService = services?.find((service) => String(service.uuid).toLowerCase() === BATTERY_SERVICE_UUID) ?? null;

  if (batteryService === null) {
    logger.warn('No Battery Service found on this device');
    return null;
  }

  logger.info('Found Battery Service');

  const batteryCharacteristic = characteristics.find((c) =>
    String(c.uuid).toLowerCase() === BATTERY_LEVEL_CHARACTERISTIC_UUID && c.properties.includes('read')
  ) ?? null;

  if (batteryCharacteristic === null) {
    logger.warn('Battery Service found but no readable Battery Level characteristic');
    return null;
  }

  logger.info('Found Battery Level Characteristic');
  // Read initial battery level
  try {
    return {
      read: async () => {
        const reading = await readBattery(batteryCharacteristic)
        logger.info('Battery Level', { level: reading.level });
        return reading;
      }
    }
  } catch (err: unknown) {
    logger.error('Failed to read battery level', { error: err });
  }

  return null;
}

async function readBattery(batteryCharacteristic: Characteristic): Promise<BatteryReading> {
  return new Promise((resolve, reject) => {
    batteryCharacteristic.read((error: string, data: Buffer) => {
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
      resolve(reading);
    });
  });
}

