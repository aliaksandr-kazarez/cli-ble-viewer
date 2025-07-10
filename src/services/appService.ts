import { DeviceManager } from './deviceManager.js';
import { BluetoothService } from './bluetoothService.js';
import { Display } from '../ui/display.js';
import { NobleDevice } from '../types/ble.js';
import { logger } from '../utils/logger.js';

// App service - coordinates between different modules
export class AppService {
  private deviceManager: DeviceManager;
  private bluetoothService: BluetoothService;

  constructor() {
    this.deviceManager = new DeviceManager();
    this.bluetoothService = new BluetoothService();
  }

  // Initialize the application
  async initialize(): Promise<void> {
    try {
      await this.bluetoothService.waitForReady();
      Display.showBluetoothReady();
    } catch (error) {
      Display.showError(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  // Start device discovery
  async startDiscovery(): Promise<void> {
    try {
      Display.showStartupMessage();
      
      await this.bluetoothService.startScanning((device: NobleDevice) => {
        this.handleDeviceDiscover(device);
      });
    } catch (error) {
      Display.showError(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  // Handle device discovery
  private handleDeviceDiscover(device: NobleDevice): void {
    logger.info('Device discovered', {
      deviceName: device.advertisement.localName || '(no name)',
      address: device.address,
      serviceUuids: device.advertisement.serviceUuids || []
    });
    
    this.deviceManager.addDevice(device);
    const devices = this.deviceManager.getAllDevices();
    logger.debug('Rendering device list', { deviceCount: devices.length });
    Display.renderDeviceList(devices);
  }

  // Cleanup resources
  cleanup(): void {
    Display.showCleanup();
    this.bluetoothService.stopScanning();
  }

  // Get device manager instance
  getDeviceManager(): DeviceManager {
    return this.deviceManager;
  }

  // Get bluetooth service instance
  getBluetoothService(): BluetoothService {
    return this.bluetoothService;
  }
} 