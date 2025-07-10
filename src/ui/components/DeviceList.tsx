import { Box, Text, useInput } from 'ink';
import { getManufacturerName } from '../../utils/manufacturer.js';
import { useCallback, useMemo, useState } from 'react';
import { useBluetooth } from '../hooks/useBluetooth.js';
import { useRouter } from '../Router.js';
import { logger } from '../../utils/logger.js';
import { DiscoveredDevice } from '../../services/bluetoothService.js';

const ELLIPSIS = '\u2026';

interface DevicePresentation {
  id: string;
  name: string;
  address: string;
  services: string[];
  manufacturer: string;
  txPower: number;
}

function peripheralToDevice(device: DiscoveredDevice): DevicePresentation {
  return {
    id: device.peripheral.uuid,
    name: device.peripheral.advertisement.localName || '(no name)',
    address: device.peripheral.uuid || '(no address)',
    services: device.peripheral.advertisement.serviceUuids || [],
    manufacturer: getManufacturerName(device.peripheral.advertisement.manufacturerData),
    txPower: device.peripheral.advertisement.txPowerLevel || 0
  }
}

export function DeviceList() {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [shouldFilterNoName, setShouldFilterNoName] = useState<boolean>(false);

  const { devices } = useBluetooth();
  const { navigateTo } = useRouter();
  const onDeviceSelect = useCallback((device: DiscoveredDevice) => {
    navigateTo('connecting', { device });
  }, []);

  useInput((input, key) => {
    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (key.downArrow && selectedIndex < devices.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else if (key.return && devices.length > 0) {
      const selectedDevice = devices[selectedIndex];
      logger.debug('Enter pressed, selecting device', {
        deviceName: selectedDevice.peripheral.advertisement.localName || '(no name)',
        deviceAddress: selectedDevice.peripheral.address || '(no address)',
        deviceIndex: selectedIndex
      });
      onDeviceSelect(devices[selectedIndex]);
    } else if (input === 'n') {
      setShouldFilterNoName(!shouldFilterNoName);
    }
  });

  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      if (shouldFilterNoName) {
        return device.peripheral.advertisement.localName && device.peripheral.advertisement.localName.length > 0;
      }
      return true;
    });
  }, [devices, shouldFilterNoName]);

  if (filteredDevices.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">🔍 Scanning for devices{ELLIPSIS}</Text>
        <Text color="gray">Found 0 devices</Text>
      </Box>
    );
  }

  // Calculate column widths based on content
  // // const getColumnWidths = () => {
  // //   const nameWidth = Math.max(
  // //     'Device Name'.length,
  // //     ...filteredDevices.map(d => (d.advertisement.localName || '(no name)').length)
  // //   );
  // //   const addressWidth = Math.max(
  // //     'Address'.length,
  // //     ...filteredDevices.map(d => (d.address || '(no address)').length)
  // //   );
  // //   const servicesWidth = Math.max(
  // //     'Services'.length,
  // //     ...filteredDevices.map(d => {
  // //       const services = d.advertisement.serviceUuids || [];
  // //       const serviceStr = services.length > 0 ?
  // //         (services[0].length > 12 ? services[0].substring(0, 12) + '…' : services[0]) : '';
  // //       return serviceStr.length;
  // //     })
  // //   );
  // //   const mfgWidth = Math.max(
  // //     'Manufacturer'.length,
  // //     ...filteredDevices.map(d => {
  // //       const mfgName = getManufacturerName(d.advertisement.manufacturerData);
  // //       return mfgName.length;
  // //     })
  // //   );
  // //   const txWidth = Math.max(
  // //     'TX Power'.length,
  // //     ...filteredDevices.map(d => {
  // //       const txStr = d.advertisement.txPowerLevel !== undefined ? `${d.advertisement.txPowerLevel}dBm` : '';
  // //       return txStr.length;
  // //     })
  // //   );

  //   // Add some minimum padding to each column
  //   return {
  //     nameWidth: Math.max(nameWidth, 15),
  //     addressWidth: Math.max(addressWidth, 12),
  //     servicesWidth: Math.max(servicesWidth, 16), // Increased from 10 to 16
  //     mfgWidth: Math.max(mfgWidth, 25), // Adjusted for manufacturer names
  //     txWidth: Math.max(txWidth, 8)
  //   };
  // };

  // const { nameWidth, addressWidth, servicesWidth, mfgWidth, txWidth } = getColumnWidths();

  // // const formatCell = (text: string, width: number, align: 'left' | 'right' = 'left'): string => {
  // //   const padding = width - text.length;
  // //   if (align === 'left') {
  // //     return text + ' '.repeat(Math.max(0, padding));
  // //   } else {
  // //     return ' '.repeat(Math.max(0, padding)) + text;
  // //   }
  // // };

  // const renderHeader = () => (
  //   <>
  //     <Box>
  //       <Text color="cyan" bold>
  //         {'  '}{formatCell('Device Name', nameWidth)} | {formatCell('Address', addressWidth)} | {formatCell('Services', servicesWidth)} | {formatCell('Manufacturer', mfgWidth)} | {formatCell('TX Power', txWidth)}
  //       </Text>
  //     </Box>
  //     <Box>
  //       <Text color="gray">
  //         {'  '}
  //         {`${'-'.repeat(nameWidth)} | ${'-'.repeat(addressWidth)} | ${'-'.repeat(servicesWidth)} | ${'-'.repeat(mfgWidth)} | ${'-'.repeat(txWidth)}`}
  //       </Text>
  //     </Box>
  //   </>
  // );

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>📱 Available Devices ({devices.length})</Text>
      {/* <Box marginTop={1} flexDirection="column"> */}
      <DeviceListHeader config={columnConfigs} />

      {filteredDevices
        .map(peripheralToDevice)
        .map((deivce, index) => (
          <Text color={index === selectedIndex ? 'green' : 'white'} key={deivce.id}>
            {index === selectedIndex ? <Text>▶ </Text> : <Text>  </Text>}
            {columnConfigs.map((column) => (
              <Text key={column.name}>{formatString(deivce[column.property].toString(), column.width)}</Text>
            ))}
          </Text>
        ))}
    </Box>
  );
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