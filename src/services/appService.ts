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
    
    // Add to discovered devices if not already present
    const existingIndex = discoveredDevices.findIndex(d => d.address === device.address);
    if (existingIndex >= 0) {
      // Update existing device
      discoveredDevices[existingIndex] = device;
    } else {
      // Add new device
      discoveredDevices.push(device);
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

    // Handle keyboard input for battery reading
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (key) => {
      const keyStr = key.toString();
      if (keyStr === 'b' || keyStr === 'B') {
        try {
          const batteryReading = await scaleConnection.readBattery();
          if (batteryReading) {
            inkUI.updateState({ batteryLevel: batteryReading.level });
          }
        } catch (error) {
          logger.error('Failed to read battery', { error: (error as Error).message });
        }
      } else if (keyStr === '\u0003') { // Ctrl-C
        logger.info('Disconnecting...');
        clearInterval(connectionCheck);
        scaleConnection.disconnect();
        cleanup();
        process.exit(0);
      }
    });

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
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }

  return {
    initialize,
    cleanup,
  };
} 