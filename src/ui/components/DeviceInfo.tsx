import { Box, Text, useInput } from 'ink';
import { useRouter } from '../Router';
import { DiscoveredDevice } from '../../services/bluetooth/bluetooth';
import { getManufacturerName, logger } from '../../utils';
import { useEffect, useMemo, useState } from 'react';
import { Characteristic, Peripheral, Service } from '@abandonware/noble';
import { ScaleWeightReading } from '../../services/scaleConnectionService';

const getStatusColor = (status: Peripheral['state']) => {
  switch (status) {
    case 'connecting': return 'yellow';
    case 'connected': return 'green';
    case 'disconnected': return 'red';
    case 'disconnecting': return 'yellow';
    case 'error': return 'red';
    default: return 'gray';
  }
};

const getStatusIcon = (status: Peripheral['state']) => {
  switch (status) {
    case 'connecting': return '🔄';
    case 'connected': return '✅';
    case 'disconnected': return '❌';
    case 'disconnecting': return '🔄';
    case 'error': return '⚠️';
    default: return '❓';
  }
};

function useDeviceInfo({ device }: { device: DiscoveredDevice }) {
  const [services, setServices] = useState<Service[]>([]);
  const [state, setState] = useState<Peripheral['state']>('disconnected');

  useEffect(() => {
    async function connect() {
      try {
        setState('connecting');
        logger.info('Connecting to device', { device: device.peripheral.uuid });
        await device.peripheral.connectAsync();
        setState('connected');
        const discoveredData = await device.peripheral.discoverAllServicesAndCharacteristicsAsync();
        setServices(discoveredData.services);
      } catch (error) {
        logger.error('Failed to connect to device', { error });
        setState('error');
      }
    }

    connect();
    return () => {
      device.peripheral.disconnect();
      device.peripheral.removeAllListeners();
    };
  }, [device]);

  return {
    services,
    state,
    info: {
      name: device.peripheral.advertisement.localName,
      address: device.peripheral.address,
      udid: device.peripheral.uuid,
      advertisements: {
        services: device.peripheral.advertisement.serviceUuids,
        manufacturerName: getManufacturerName(device.peripheral.advertisement.manufacturerData),
        txPowerLevel: device.peripheral.advertisement.txPowerLevel
      },
    }
  }
}

export function DeviceInfo() {
  const { params, navigateTo } = useRouter();
  const device = params.device as DiscoveredDevice;
  const { services, state, info } = useDeviceInfo({ device });

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
          <Text color="green">{info.name}</Text>
        </Text>

        <Text>
          <Text color="white">udid: </Text>
          <Text color="gray">{info.udid}</Text>
        </Text>

        <Text>
          <Text color="white">Address: </Text>
          <Text color="gray">{info.address}</Text>
        </Text>

        {/* TODO: display advertisement data */}
        <Text>
          <Text color="white">Advertisement: </Text>
          {/* <Box flexDirection="column" paddingLeft={2}> */}
          {info.advertisements.services?.length > 0 && (
            <Text>
              <Text color="gray">Services: </Text>
              <Text color="yellow">{info.advertisements.services.join(', ')} </Text>
            </Text>
          )}
          {info.advertisements.manufacturerName && (
            <Text>
              <Text color="gray">Manufacturer Data: </Text>
              <Text color="yellow">{info.advertisements.manufacturerName} </Text>
            </Text>
          )}
          {info.advertisements.txPowerLevel && (
            <Text>
              <Text color="gray">TX Power Level: </Text>
              <Text color="yellow">{info.advertisements.txPowerLevel}dBm </Text>
            </Text>
          )}
          {/* </Box> */}
        </Text>

        <Text>
          <Text color="white">Status: </Text>
          <Text color={getStatusColor(state)}>
            {getStatusIcon(state)} {state}
          </Text>
        </Text>
      </Box>

      {state === 'connected' && (

        <Box flexDirection="column">
          <Box flexDirection="column">
            <Text color="cyan" bold>🔧 Available Services:</Text>
            <Box flexDirection="column" paddingLeft={2}>
              {services.map((service) => (
                <>
                  <Text color="blue" key={service.uuid}>{service.uuid} - {service.name || '(no name)'}</Text>
                  <Box flexDirection="column" paddingLeft={2}>
                    {service.characteristics.map((characteristic) => (
                      <CharacteristicView key={characteristic.uuid} characteristic={characteristic} />
                    ))}
                  </Box>
                </>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      <Box>
        <Text color="gray">press esc to go back</Text>
      </Box>
    </Box>
  );
}

function CharacteristicView({ characteristic }: { characteristic: Characteristic }) {
  return (
    <Box flexDirection="column" paddingLeft={2}>
      <Text color="gray" key={characteristic.uuid}>{characteristic.uuid} - {characteristic.name || '(no name)'} - {characteristic.properties.join(', ')}</Text>
      {characteristic.properties.map((property) => {
        switch (property) {
          case 'read':
            return <ReadCharacteristicValue key={characteristic.uuid} characteristic={characteristic} />;
          case 'indicate':
          case 'notify':
            return <NotifyCharacteristicValue key={characteristic.uuid} characteristic={characteristic} />;
          default:
            return null;
        }
      })}
    </Box>
  )
}

function NotifyCharacteristicValue({ characteristic }: { characteristic: Characteristic }) {
  const [value, setValue] = useState<string>('');
  useEffect(() => {
    characteristic.notify(true, (error) => {
      if (error) {
        logger.error('Failed to subscribe to characteristic', { error });
      }
      logger.info('Subscribed to characteristic', { name: characteristic.name, uuid: characteristic.uuid });

    });

    characteristic.on('data', (data) => {
      const reading = convertWeightData(data);
      // logger.info('Weight reading', { reading });
      setValue(reading.grams.toString());
    });

    return () => {
      characteristic.notify(false);
      characteristic.removeAllListeners();
    };
  }, [characteristic]);
  return <Text color="white" bold>📢 {value} - {new Date().toISOString()}</Text>
}

function ReadCharacteristicValue({ characteristic }: { characteristic: Characteristic }) {
  const [value, setValue] = useState<string>('');
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await characteristic.readAsync();
        setValue(data.toString('hex'));
      } catch (error) {
        logger.error('Failed to read characteristic', { error });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [characteristic]);
  return <Text color="white" bold>📖 {value} - {new Date().toISOString()}</Text>
}

function convertWeightData(data: Buffer): ScaleWeightReading {
  let grams = 0;
  if (data.length === 8) {
    grams = data.readUInt16LE(2) / 10;
  }
  return {
    grams,
    kg: grams / 1000,
    raw: data,
    timestamp: new Date(),
  };
}