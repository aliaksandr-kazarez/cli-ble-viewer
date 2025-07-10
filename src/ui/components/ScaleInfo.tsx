import React from 'react';
import { Box, Text } from 'ink';
import { ScaleWeightReading } from '../../scales/scaleConnectionService.js';

interface ScaleInfoProps {
  deviceName: string;
  deviceAddress: string;
  isConnected: boolean;
  lastWeight?: ScaleWeightReading;
  batteryLevel?: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export function ScaleInfo({ 
  deviceName, 
  deviceAddress, 
  isConnected, 
  lastWeight, 
  batteryLevel, 
  connectionStatus 
}: ScaleInfoProps) {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connecting': return 'yellow';
      case 'connected': return 'green';
      case 'disconnected': return 'red';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connecting': return '🔄';
      case 'connected': return '✅';
      case 'disconnected': return '❌';
      case 'error': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
      <Text color="cyan" bold>⚖️ Scale Information</Text>
      
      <Box flexDirection="column">
        <Text>
          <Text color="white">Name: </Text>
          <Text color="green">{deviceName}</Text>
        </Text>
        
        <Text>
          <Text color="white">Address: </Text>
          <Text color="gray">{deviceAddress}</Text>
        </Text>
        
        <Text>
          <Text color="white">Status: </Text>
          <Text color={getStatusColor()}>
            {getStatusIcon()} {connectionStatus}
          </Text>
        </Text>
      </Box>

      {isConnected && (
        <Box flexDirection="column">
          <Text color="cyan" bold>📊 Live Data</Text>
          
          {lastWeight && (
            <Box>
              <Text color="white">Weight: </Text>
              <Text color="green" bold>
                {lastWeight.kg.toFixed(3)} kg ({lastWeight.grams.toFixed(1)} g)
              </Text>
              <Text color="gray">
                {'  '}{lastWeight.timestamp.toLocaleTimeString()}
              </Text>
            </Box>
          )}
          
          {batteryLevel !== undefined && (
            <Box>
              <Text color="white">Battery: </Text>
              <Text color={batteryLevel > 20 ? 'green' : 'yellow'} bold>
                {batteryLevel}%
              </Text>
            </Box>
          )}
        </Box>
      )}
      
      <Box>
        <Text color="gray">Press Ctrl-C to disconnect and exit</Text>
      </Box>
    </Box>
  );
} 