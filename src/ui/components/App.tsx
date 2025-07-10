import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { DeviceList } from './DeviceList.js';
import { ScaleInfo } from './ScaleInfo.js';
import { NobleDevice } from '../../types/ble.js';
import { ScaleWeightReading } from '../../scales/scaleConnectionService.js';

interface AppProps {
  devices: NobleDevice[];
  onDeviceSelect: (device: NobleDevice) => void;
  selectedDevice?: NobleDevice;
  isConnected: boolean;
  lastWeight?: ScaleWeightReading;
  batteryLevel?: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  onExit: () => void;
}

export function App({ 
  devices, 
  onDeviceSelect, 
  selectedDevice, 
  isConnected, 
  lastWeight, 
  batteryLevel, 
  connectionStatus, 
  onExit 
}: AppProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (key.downArrow && selectedIndex < devices.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else if (key.return && devices.length > 0) {
      onDeviceSelect(devices[selectedIndex]);
    } else if (key.escape || (input === 'q' || input === 'Q')) {
      onExit();
    }
  });

  // Reset selection when devices change
  useEffect(() => {
    if (selectedIndex >= devices.length && devices.length > 0) {
      setSelectedIndex(0);
    }
  }, [devices.length, selectedIndex]);

  return (
    <Box flexDirection="column" padding={1}>
      <Box>
        <Text color="cyan" bold>⚖️ Gourmetmiles Smart Scale BLE Client</Text>
      </Box>
      
      {!selectedDevice ? (
        <DeviceList 
          devices={devices} 
          selectedIndex={selectedIndex} 
          onDeviceSelect={onDeviceSelect} 
        />
      ) : (
        <ScaleInfo 
          deviceName={selectedDevice.advertisement.localName || '(no name)'}
          deviceAddress={selectedDevice.address}
          isConnected={isConnected}
          lastWeight={lastWeight}
          batteryLevel={batteryLevel}
          connectionStatus={connectionStatus}
        />
      )}
      
      <Box>
        <Text color="gray">
          {!selectedDevice ? '↑↓ Select • Enter Connect • Q Exit' : 'Ctrl-C Disconnect'}
        </Text>
      </Box>
    </Box>
  );
} 