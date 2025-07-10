import { DiscoveredDevice, NobleDevice } from '../types/ble.js';
import { logger } from '../utils/logger.js';

// Device manager service - handles device discovery and storage
export class DeviceManager {
  private devices = new Map<string, DiscoveredDevice>();

  // Add or update a discovered device
  addDevice(device: NobleDevice): void {
    const localName = device.advertisement.localName || '(no name)';
    const address = device.address;
    const serviceUuids = device.advertisement.serviceUuids || [];
    
    // Create a unique key using name + address + services to handle empty addresses
    const uniqueKey = `${localName}-${address}-${serviceUuids.join(',')}`;
    
    const isNewDevice = !this.devices.has(uniqueKey);
    this.devices.set(uniqueKey, { localName, address, serviceUuids });
    
    logger.debug('Device added/updated', {
      isNew: isNewDevice,
      deviceName: localName,
      address: address,
      serviceUuids: serviceUuids,
      uniqueKey: uniqueKey,
      totalDevices: this.devices.size
    });
  }

  // Get all discovered devices
  getAllDevices(): DiscoveredDevice[] {
    const devices = Array.from(this.devices.values());
    logger.debug('Getting all devices', { deviceCount: devices.length });
    return devices;
  }

  // Get device count
  getDeviceCount(): number {
    return this.devices.size;
  }

  // Clear all devices
  clearDevices(): void {
    this.devices.clear();
  }

  // Get device by address
  getDevice(address: string): DiscoveredDevice | undefined {
    return this.devices.get(address);
  }

  // Check if device exists
  hasDevice(address: string): boolean {
    return this.devices.has(address);
  }
} 