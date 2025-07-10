import { createBluetoothService } from './bluetoothService.js';
import { createScaleConnection, ScaleConnectionEvent } from '../scales/scaleConnectionService.js';
import { createInkUI } from '../ui/inkUI.js';
import { NobleDevice } from '../types/ble.js';
import { logger } from '../utils/logger.js';

export function createAppService() {
  const bluetoothService = createBluetoothService();
  const scaleConnection = createScaleConnection();
  const inkUI = createInkUI();
  
  let discoveredDevices: NobleDevice[] = [];
  let isConnecting = false;
  let updateTimeout: NodeJS.Timeout | null = null;

  async function initialize() {
    try {
      await bluetoothService.waitForReady();
      setupUI();
      await startDiscovery();
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  function setupUI() {
    inkUI.setDeviceSelectHandler(async (device: NobleDevice) => {
      if (isConnecting) return;
      
      isConnecting = true;
      inkUI.updateState({ 
        selectedDevice: device, 
        connectionStatus: 'connecting' 
      });
      
      try {
        await connectAndReadWeightData(device);
      } catch (error) {
        logger.error('Failed to connect and read data', { error: (error as Error).message });
        inkUI.updateState({ 
          connectionStatus: 'error',
          isConnected: false 
        });
        isConnecting = false;
      }
    });

    inkUI.setExitHandler(() => {
      cleanup();
      process.exit(0);
    });

    inkUI.setBatteryReadHandler(async () => {
      try {
        const batteryReading = await scaleConnection.readBattery();
        if (batteryReading) {
          inkUI.updateState({ batteryLevel: batteryReading.level });
        }
      } catch (error) {
        logger.error('Failed to read battery', { error: (error as Error).message });
      }
    });

    inkUI.start();
  }

  async function startDiscovery() {
    try {
      await bluetoothService.startScanning((device: NobleDevice) => {
        handleDeviceDiscover(device);
      });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  function handleDeviceDiscover(device: NobleDevice) {
    const localName = device.advertisement.localName || '(no name)';
    const now = Date.now();
    
    // Create a better unique identifier that handles empty addresses
    const createDeviceId = (dev: NobleDevice) => {
      const name = dev.advertisement.localName || '(no name)';
      const address = dev.address || 'unknown';
      const serviceUuids = dev.advertisement.serviceUuids || [];
      const manufacturerData = dev.advertisement.manufacturerData;
      return `${name}-${address}-${serviceUuids.join(',')}-${manufacturerData ? manufacturerData.toString('hex').substring(0, 8) : 'no-manufacturer'}`;
    };
    
    const deviceId = createDeviceId(device);
    
    // Add or update device with lastSeen timestamp
    const existingIndex = discoveredDevices.findIndex(d => createDeviceId(d) === deviceId);
    if (existingIndex >= 0) {
      discoveredDevices[existingIndex] = { ...device, lastSeen: now };
    } else {
      discoveredDevices.push({ ...device, lastSeen: now });
      // Only log new devices, not every discovery
      logger.info('New device discovered', { 
        name: localName, 
        address: device.address || 'empty',
        services: device.advertisement.serviceUuids?.length || 0,
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
      inkUI.updateState({ devices: [...discoveredDevices] });
    }, 100); // 100ms debounce
  }

  async function connectAndReadWeightData(device: NobleDevice) {
    try {
      setupScaleEventHandlers();
      await scaleConnection.connect(device);
      inkUI.updateState({ 
        connectionStatus: 'connected',
        isConnected: true 
      });
      keepConnectionAlive();
    } catch (error) {
      scaleConnection.disconnect();
      throw error;
    }
  }

  function setupScaleEventHandlers() {
    scaleConnection.on((event: ScaleConnectionEvent) => {
      switch (event.type) {
        case 'connected':
          inkUI.updateState({ 
            connectionStatus: 'connected',
            isConnected: true 
          });
          break;
        case 'weight':
          inkUI.updateState({ lastWeight: event.reading });
          break;
        case 'battery':
          inkUI.updateState({ batteryLevel: event.reading.level });
          break;
        case 'disconnected':
          inkUI.updateState({ 
            connectionStatus: 'disconnected',
            isConnected: false 
          });
          break;
        case 'error':
          inkUI.updateState({ 
            connectionStatus: 'error',
            isConnected: false 
          });
          break;
      }
    });
  }

  function keepConnectionAlive() {
    const connectionCheck = setInterval(() => {
      if (!scaleConnection.getStatus()) {
        inkUI.updateState({ 
          connectionStatus: 'disconnected',
          isConnected: false 
        });
        clearInterval(connectionCheck);
        cleanup();
        process.exit(0);
      }
    }, 1000);

    // Let Ink handle all keyboard input to prevent screen clearing
    process.on('SIGINT', () => {
      logger.info('Disconnecting...');
      clearInterval(connectionCheck);
      scaleConnection.disconnect();
      cleanup();
      process.exit(0);
    });
  }

  function cleanup() {
    bluetoothService.stopScanning();
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
  }

  return {
    initialize,
    cleanup,
  };
} 