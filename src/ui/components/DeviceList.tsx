import React from 'react';
import { Box, Text } from 'ink';
import { NobleDevice } from '../../types/ble.js';

interface DeviceListProps {
  devices: NobleDevice[];
  selectedIndex: number;
  onDeviceSelect: (device: NobleDevice) => void;
}

export function DeviceList({ devices, selectedIndex, onDeviceSelect }: DeviceListProps) {
  if (devices.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">🔍 Scanning for devices...</Text>
        <Text color="gray">Found 0 devices</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>📱 Available Devices ({devices.length})</Text>
      <Text color="gray">Use ↑↓ arrows to select, Enter to connect</Text>
      <Box marginTop={1} flexDirection="column">
        {devices.map((device, index) => {
          const localName = device.advertisement.localName || '(no name)';
          const isSelected = index === selectedIndex;
          // Use address if present and unique, otherwise fallback to index
          const key = device.address && device.address.trim() !== '' ? `${device.address}-${index}` : `device-${index}`;
          return (
            <Box key={key} marginY={0}>
              <Text color={isSelected ? 'green' : 'white'}>
                {isSelected ? '▶ ' : '  '}
                {localName}
              </Text>
              <Text color="gray">
                {'  '}({device.address})
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
} 