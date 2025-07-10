import { createBluetoothService } from './services/bluetoothService.js';
import { createScaleConnection, ScaleConnectionEvent } from './scales/scaleConnectionService.js';
import { createUIService } from './services/createUIService.js';
import { NobleDevice } from './types/ble.js';
import { logger } from './utils/logger.js';

export function createApplication(): { halt: () => Promise<void> } {
  // create services
  const bluetoothService = createBluetoothService();
  const scaleConnection = createScaleConnection();

  // create UI Service and pass all the services as argument there. 
  const inkUI = createUIService({
    bluetoothService,
    scaleConnection,
  });
  
  let isConnecting = false;

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
    // Start the UI first so the global handlers are available
    inkUI.start();
    
    // Wait a bit for the UI to initialize, then set up handlers
    setTimeout(() => {
      inkUI.setDeviceSelectHandler(async (device: NobleDevice) => {
        logger.info('Device selection handler called', { deviceName: device.advertisement.localName });
        if (isConnecting) {
          logger.info('Already connecting, ignoring device selection');
          return;
        }
        
        logger.info('Starting connection process');
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
    }, 100); // Small delay to ensure UI is ready
  }

  async function startDiscovery() {
    try {
      await bluetoothService.startScanning((devices: NobleDevice[]) => {
        inkUI.updateState({ devices });
      });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      throw error;
    }
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
  }

  return {
    halt: async () => {
      cleanup();
    },
  };
} 