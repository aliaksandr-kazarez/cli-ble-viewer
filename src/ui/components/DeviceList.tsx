import { Box, Text, useInput } from 'ink';
import { NobleDevice } from '../../types/ble.js';
import { getManufacturerName } from '../../utils/manufacturer.js';
import { useCallback, useState } from 'react';
import { useBluetooth } from '../hooks/useBluetooth.js';
import { useRouter } from '../Router.js';
import { logger } from '../../utils/logger.js';


export function DeviceList() {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const { devices } = useBluetooth();
  const { navigateTo } = useRouter();
  const onDeviceSelect = useCallback((device: NobleDevice) => {
    navigateTo('connecting', { device });
  }, []);

  useInput((_, key) => {
    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (key.downArrow && selectedIndex < devices.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else if (key.return && devices.length > 0) {
      const selectedDevice = devices[selectedIndex];
      logger.debug('Enter pressed, selecting device', {
        deviceName: selectedDevice.advertisement.localName || '(no name)',
        deviceAddress: selectedDevice.address || '(no address)',
        deviceIndex: selectedIndex
      });
      onDeviceSelect(devices[selectedIndex]);
    }
  });



  if (devices.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">🔍 Scanning for devices...</Text>
        <Text color="gray">Found 0 devices</Text>
      </Box>
    );
  }

  // Calculate column widths based on content
  const getColumnWidths = () => {
    const nameWidth = Math.max(
      'Device Name'.length,
      ...devices.map(d => (d.advertisement.localName || '(no name)').length)
    );
    const addressWidth = Math.max(
      'Address'.length,
      ...devices.map(d => (d.address || '(no address)').length)
    );
    const servicesWidth = Math.max(
      'Services'.length,
      ...devices.map(d => {
        const services = d.advertisement.serviceUuids || [];
        const serviceStr = services.length > 0 ?
          (services[0].length > 12 ? services[0].substring(0, 12) + '…' : services[0]) : '';
        return serviceStr.length;
      })
    );
    const mfgWidth = Math.max(
      'Manufacturer'.length,
      ...devices.map(d => {
        const mfgName = getManufacturerName(d.advertisement.manufacturerData);
        return mfgName.length;
      })
    );
    const txWidth = Math.max(
      'TX Power'.length,
      ...devices.map(d => {
        const txStr = d.advertisement.txPowerLevel !== undefined ? `${d.advertisement.txPowerLevel}dBm` : '';
        return txStr.length;
      })
    );

    // Add some minimum padding to each column
    return {
      nameWidth: Math.max(nameWidth, 15),
      addressWidth: Math.max(addressWidth, 12),
      servicesWidth: Math.max(servicesWidth, 16), // Increased from 10 to 16
      mfgWidth: Math.max(mfgWidth, 25), // Adjusted for manufacturer names
      txWidth: Math.max(txWidth, 8)
    };
  };

  const { nameWidth, addressWidth, servicesWidth, mfgWidth, txWidth } = getColumnWidths();

  const formatCell = (text: string, width: number, align: 'left' | 'right' = 'left') => {
    const padding = width - text.length;
    if (align === 'left') {
      return text + ' '.repeat(Math.max(0, padding));
    } else {
      return ' '.repeat(Math.max(0, padding)) + text;
    }
  };

  const renderHeader = () => (
    <Box>
      <Text color="cyan" bold>
        {'  '}{formatCell('Device Name', nameWidth)} | {formatCell('Address', addressWidth)} | {formatCell('Services', servicesWidth)} | {formatCell('Manufacturer', mfgWidth)} | {formatCell('TX Power', txWidth)}
      </Text>
    </Box>
  );

  // Fix: Use dashes and pipes to match the header exactly
  const renderSeparator = () => (
    <Box>
      <Text color="gray">
        {'  '}
        {`${'-'.repeat(nameWidth)} | ${'-'.repeat(addressWidth)} | ${'-'.repeat(servicesWidth)} | ${'-'.repeat(mfgWidth)} | ${'-'.repeat(txWidth)}`}
      </Text>
    </Box>
  );

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>📱 Available Devices ({devices.length})</Text>
      <Text color="gray">Use ↑↓ arrows to select, Enter to connect</Text>
      <Box marginTop={1} flexDirection="column">
        {renderHeader()}
        {renderSeparator()}
        {devices.map((device, index) => {
          const localName = device.advertisement.localName || '(no name)';
          const address = device.address || '(no address)';
          const serviceUuids = device.advertisement.serviceUuids || [];
          const manufacturerName = getManufacturerName(device.advertisement.manufacturerData);
          const txPowerLevel = device.advertisement.txPowerLevel;
          const isSelected = index === selectedIndex;
          const key = device.address && device.address.trim() !== '' ? `${device.address}-${index}` : `device-${index}`;

          // Format data for table with consistent lengths
          const serviceStr = serviceUuids.length > 0
            ? (serviceUuids[0].length > 12 ? serviceUuids[0].substring(0, 12) + '…' : serviceUuids[0])
            : '';
          const mfgStr = manufacturerName;
          const txStr = txPowerLevel !== undefined ? `${txPowerLevel}dBm` : '';

          const prefix = isSelected ? '▶ ' : '  ';

          return (
            <Box key={key} marginY={0}>
              <Text color={isSelected ? 'green' : 'white'}>
                {prefix}
                {formatCell(localName, nameWidth)} | {formatCell(address, addressWidth)} | {formatCell(serviceStr, servicesWidth)} | {formatCell(mfgStr, mfgWidth)} | {formatCell(txStr, txWidth)}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
} 