import { Box, Text, useInput } from 'ink';
import { getManufacturerName } from '../../utils/manufacturer.js';
import { JSX, useCallback, useMemo, useState } from 'react';
import { useBluetooth } from '../hooks/useBluetooth.js';
import { useRouter } from '../Router.js';
import { logger } from '../../utils/logger.js';
import { DiscoveredDevice } from '../../services/bluetooth/bluetooth.js';
import { Peripheral } from '@abandonware/noble';

const ELLIPSIS = '\u2026';

interface DevicePresentation {
  id: string;
  name: string;
  address: string;
  services: string[];
  manufacturer: string;
  txPower: number;
  seen: boolean;
}

function peripheralToDevice(device: DiscoveredDevice): DevicePresentation {
  return {
    id: device.id,
    name: device.peripheral.advertisement.localName || '(no name)',
    address: device.peripheral.address || '(no address)',
    services: device.peripheral.advertisement.serviceUuids || [],
    manufacturer: getManufacturerName(device.peripheral.advertisement.manufacturerData),
    txPower: device.peripheral.advertisement.txPowerLevel || 0,
    seen: seenDevicesSet.has(device.id)
  }
}

const seenDevicesSet = new Set<string>();

// filter devices that have manufacturer data starting with bytes 0F FF AC A0 
function hasTargetManufacturerPrefix(peripheral: Peripheral, targetPrefix: string = '0FFFACA0'): boolean {

  const targetPrefixBuffer = Buffer.from(targetPrefix.replace(/\s+/g,'').toLowerCase(), 'hex');
  // logger.info('Checking manufacturer prefix', { targetPrefixBuffer, manufacturerData: peripheral.advertisement.manufacturerData });
  // Compare the first bytes of manufacturerData with targetPrefix
  for (let i = 0; i < targetPrefixBuffer.length; i++) {
    if (peripheral.advertisement.manufacturerData?.[i] !== targetPrefixBuffer[i]) {
      return false;
    }
  }
  return true;
}

// filter based on advertised service FFB0 after you connect; others use FFE0
function hasAdvertisedService(peripheral: Peripheral, targetServices: string[]): boolean {
  targetServices = targetServices.map(service => service.toLowerCase());
  return targetServices.some(service => peripheral.advertisement.serviceUuids?.includes(service));
}


// function that connects to device and looks for andverised services passed in as arguments
async function connectToDeviceAndLookForServices(device: DiscoveredDevice, lookForServices: string[]): Promise<void> {
  lookForServices = lookForServices.map(service => service.toLowerCase());
  const peripheral = device.peripheral;
  await peripheral.connectAsync();
  const services = await peripheral.discoverAllServicesAndCharacteristicsAsync();
  const service = services.services?.find(service => lookForServices.includes(service.uuid));
  if (service) {
    logger.info('Discovered service', { service: service.uuid, device: device.id });
    const characteristic = service.characteristics?.find(characteristic => characteristic.properties.includes('read'));
    if (characteristic) {
      const value = await characteristic.readAsync();
      logger.info('Read characteristic', { value, device: device.id });
    }
  }
  await peripheral.disconnectAsync();
}

export function DeviceList(): JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [shouldFilterNoName, setShouldFilterNoName] = useState<boolean>(false);
  const [shouldFilterSeenDevices, setShouldFilterSeenDevices] = useState<boolean>(true);

  const { devices: bluetoothDevices } = useBluetooth({
    onNewDevice: async (device: DiscoveredDevice) => {
      try {
        // await connectToDeviceAndLookForServices(device, ['FFB0', 'FFE0', 'fff0']);
      } catch (error) {
        logger.error('Error connecting to device', { error, device: device.id });
      }
      // 
      // seenDevicesSet.add(device.id);
    }
  });
  const { navigateTo } = useRouter();
  const onDeviceSelect = useCallback((device: DiscoveredDevice) => {
    seenDevicesSet.add(device.id);
    navigateTo('connecting', { device });
  }, []);

  const filteredDevices = useMemo(() => {
    return bluetoothDevices.filter(device => {
      if (
        hasTargetManufacturerPrefix(device.peripheral) 
        // && hasAdvertisedService(device.peripheral, ['FFB0', 'FFE0'])
        || true
      ) {
        return true;
      }
      return false;

      // if (shouldFilterSeenDevices && seenDevicesSet.has(device.id)) {
      //   return false;
      // }
      // if (shouldFilterNoName) {
      //   return device.peripheral.advertisement.localName && device.peripheral.advertisement.localName.length > 0;
      // }

      // if (device.peripheral.advertisement.serviceUuids?.includes('FFB0')) {
      //   return true;
      // }
      // return false;
  
      return true;
    });

  }, [bluetoothDevices, shouldFilterNoName]);

  const devices = useMemo(() => {
    return filteredDevices.map(peripheralToDevice);
  }, [filteredDevices]);

  useInput((input, key) => {
    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (key.downArrow && selectedIndex < filteredDevices.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else if (key.return && filteredDevices.length > 0) {
      const selectedDevice = filteredDevices[selectedIndex];
      logger.debug('Enter pressed, selecting device', {
        deviceName: selectedDevice.peripheral?.advertisement.localName || '(no name)',
        deviceAddress: selectedDevice.peripheral.address || '(no address)',
        deviceIndex: selectedIndex
      });
      onDeviceSelect(selectedDevice);
    } else if (input === 'n') {
      setShouldFilterNoName(!shouldFilterNoName);
    } else if (input === 'h') {
      setShouldFilterSeenDevices(!shouldFilterSeenDevices);
    }
  });

  if (devices.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">🔍 Scanning for devices{ELLIPSIS}</Text>
        <Text color="gray">Found 0 devices</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Text color="cyan" bold>📱 Available Devices ({devices.length})</Text>
      {/* <Box marginTop={1} flexDirection="column"> */}
      <DeviceListHeader config={columnConfigs} />

      {devices
        .map((deivce, index) => (
          <Text color={getDeviceColor(deivce, index === selectedIndex)} key={deivce.id}>
            {index === selectedIndex ? <Text>▶ </Text> : <Text>  </Text>}
            {columnConfigs.map((column) => (
              <Text key={column.name}>{formatString(deivce[column.property].toString(), column.width)}</Text>
            ))}
          </Text>
        ))}
    </Box>
  );
}

function getDeviceColor(device: DevicePresentation, selected: boolean) {
  if (device.seen) {
    return 'blue';
  } else if (selected) {
    return 'green';
  } else {
    return 'white';
  }
}

const formatString = (text: string, width: number, align: 'left' | 'right' = 'left'): string => {
  // Truncate with ellipsis if text is too long
  const truncatedText = text.length > width - 1
    ? text.substring(0, width - 2) + '…'
    : text;

  const padding = width - truncatedText.length;
  if (align === 'left') {
    return truncatedText + ' '.repeat(Math.max(0, padding));
  } else {
    return ' '.repeat(Math.max(0, padding)) + truncatedText;
  }
};

export function DeviceListHeader({ config }: { config: ColumnConfig[] }) {
  return (
    <Box marginLeft={2} flexDirection="column" gap={0}>
      <Text color="cyan" bold>
        {config.map((column) => (
          <Text key={column.name}>{formatString(column.name, column.width)}</Text>
        ))}
      </Text>
      <Text>
        {config.map((column) => (
          <Text color="gray" key={column.name}>{'-'.repeat(column.width - 1)}|</Text>
        ))}
      </Text>
    </Box>
  );
}

interface ColumnConfig {
  name: string;
  width: number;
  property: keyof DevicePresentation;
}

const columnConfigs: ColumnConfig[] = [
  { name: 'Device Name', width: 20, property: 'name' },
  { name: 'Address', width: 20, property: 'address' },
  { name: 'Services', width: 20, property: 'services' },
  { name: 'Manufacturer', width: 20, property: 'manufacturer' },
  { name: 'TX Power', width: 20, property: 'txPower' },
];

DeviceList.helpText = '↑↓ Select • Enter Connect • n Toggle filtering of devices with no name • Q Exit';