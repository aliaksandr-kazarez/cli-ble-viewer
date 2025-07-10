import { Box, Text, useInput } from 'ink';
import { useScales } from '../hooks/useScales';
import { useRouter } from '../Router';
import { DiscoveredDevice } from '../../services/bluetoothService';

const getStatusColor = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
  switch (status) {
    case 'connecting': return 'yellow';
    case 'connected': return 'green';
    case 'disconnected': return 'red';
    case 'error': return 'red';
    default: return 'gray';
  }
};

const getStatusIcon = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
  switch (status) {
    case 'connecting': return '🔄';
    case 'connected': return '✅';
    case 'disconnected': return '❌';
    case 'error': return '⚠️';
    default: return '❓';
  }
};

export function ScaleInfo() {
  const { params, navigateTo } = useRouter();
  const device = params.device as DiscoveredDevice;
  const { status, weight, battery } = useScales({ device });

  useInput((_input, key) => {
    if (key.escape) {
      navigateTo('device-list');
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
      <Text color="cyan" bold>⚖️ Scale Information</Text>

      <Box flexDirection="column">
        <Text>
          <Text color="white">Name: </Text>
          <Text color="green">{device.peripheral.advertisement.localName}</Text>
        </Text>

        <Text>
          <Text color="white">Address: </Text>
          <Text color="gray">{device.peripheral.address}</Text>
        </Text>

        <Text>
          <Text color="white">Status: </Text>
          <Text color={getStatusColor(status)}>
            {getStatusIcon(status)} {status}
          </Text>
        </Text>
      </Box>

      {status === 'connected' && (

        <Box flexDirection="column">
          <Box flexDirection="column">
            <Text color="cyan" bold>🔧 Available Services</Text>
            <Box paddingLeft={2}>
              {device.peripheral.advertisement.serviceUuids.map((serviceUuid) => (
                <Text key={serviceUuid}>{serviceUuid}</Text>
              ))}
            </Box>
          </Box>

          <Text color="cyan" bold>📊 Live Data</Text>

          {weight && (
            <Box>
              <Text color="white">Weight: </Text>
              <Text color="green" bold>
                {weight.kg.toFixed(3)} kg ({weight.grams.toFixed(1)} g)
              </Text>
              <Text color="gray">
                {'  '}{weight.timestamp.toLocaleTimeString()}
              </Text>
            </Box>
          )}

          {battery && (
            <Box>
              <Text color="white">Battery: </Text>
              <Text color={battery.level > 20 ? 'green' : 'yellow'} bold>
                {battery.level}%
              </Text>
            </Box>
          )}
        </Box>
      )}

      <Box>
        <Text color="gray">press esc to go back</Text>
      </Box>
    </Box>
  );
} 
