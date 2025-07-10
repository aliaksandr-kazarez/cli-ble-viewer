import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { DeviceList } from './DeviceList.js';
import { ScaleInfo } from './ScaleInfo.js';
import { NobleDevice } from '../../types/ble.js';
import { ScaleWeightReading } from '../../scales/scaleConnectionService.js';
import { logger } from '../../utils/logger.js';

type ScreenState = 'device-list' | 'connecting' | 'connected' | 'error';

interface AppProps {
  devices: NobleDevice[];
  onDeviceSelect: (device: NobleDevice) => void;
  selectedDevice?: NobleDevice;
  isConnected: boolean;
  lastWeight?: ScaleWeightReading;
  batteryLevel?: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  onExit: () => void;
  onBatteryRead?: () => void;
}

export function App({ 
  devices, 
  onDeviceSelect, 
  selectedDevice, 
  isConnected, 
  lastWeight, 
  batteryLevel, 
  connectionStatus, 
  onExit,
  onBatteryRead
}: AppProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('device-list');

  // Update screen state based on connection status and selected device
  useEffect(() => {
    if (connectionStatus === 'disconnected' && !selectedDevice) {
      setCurrentScreen('device-list');
    } else if (connectionStatus === 'connecting') {
      setCurrentScreen('connecting');
    } else if (connectionStatus === 'connected') {
      setCurrentScreen('connected');
    } else if (connectionStatus === 'error') {
      setCurrentScreen('error');
    }
  }, [connectionStatus, selectedDevice]);

  useInput((input, key) => {
    // Debug logging for input handling
    logger.debug('Input received', { input, key, currentScreen, selectedIndex, devicesLength: devices.length });
    
    // Handle navigation based on current screen
    if (currentScreen === 'device-list') {
      // Device List Screen Controls
      if (key.upArrow && selectedIndex > 0) {
        logger.debug('Moving up');
        setSelectedIndex(selectedIndex - 1);
      } else if (key.downArrow && selectedIndex < devices.length - 1) {
        logger.debug('Moving down');
        setSelectedIndex(selectedIndex + 1);
      } else if (key.return && devices.length > 0) {
        const selectedDevice = devices[selectedIndex];
        logger.debug('Enter pressed, selecting device', { 
          deviceName: selectedDevice.advertisement.localName || '(no name)',
          deviceAddress: selectedDevice.address || '(no address)',
          deviceIndex: selectedIndex
        });
        onDeviceSelect(devices[selectedIndex]);
      } else if (key.escape || (input === 'q' || input === 'Q')) {
        logger.debug('Exit requested');
        onExit();
      } else if (input === '\u0003') { // Ctrl+C
        logger.debug('Ctrl+C received');
        onExit();
      }
    } else {
      // Connected/Connecting/Error Screen Controls
      if (key.escape || (input === 'q' || input === 'Q')) {
        onExit();
      } else if ((input === 'b' || input === 'B') && onBatteryRead) {
        onBatteryRead();
      } else if (input === '\u0003') { // Ctrl+C
        onExit();
      }
    }
  });

  // Reset selection when devices change
  useEffect(() => {
    if (selectedIndex >= devices.length && devices.length > 0) {
      setSelectedIndex(0);
    }
  }, [devices.length, selectedIndex]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'device-list':
        return (
          <DeviceList 
            devices={devices} 
            selectedIndex={selectedIndex} 
            onDeviceSelect={onDeviceSelect} 
          />
        );
      case 'connecting':
      case 'connected':
      case 'error':
        return (
          <ScaleInfo 
            deviceName={selectedDevice?.advertisement.localName || '(no name)'}
            deviceAddress={selectedDevice?.address || '(no address)'}
            isConnected={isConnected}
            lastWeight={lastWeight}
            batteryLevel={batteryLevel}
            connectionStatus={connectionStatus}
          />
        );
      default:
        return null;
    }
  };

  const renderHelpText = () => {
    switch (currentScreen) {
      case 'device-list':
        return '↑↓ Select • Enter Connect • Q Exit';
      case 'connecting':
        return 'Connecting... • Q Cancel';
      case 'connected':
        return 'B Battery • Ctrl-C Disconnect • Q Exit';
      case 'error':
        return 'Q Exit • Try selecting another device';
      default:
        return '';
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box>
        <Text color="cyan" bold>⚖️ Gourmetmiles Smart Scale BLE Client</Text>
      </Box>
      
      {renderScreen()}
      
      <Box>
        <Text color="gray">{renderHelpText()}</Text>
      </Box>
    </Box>
  );
} 