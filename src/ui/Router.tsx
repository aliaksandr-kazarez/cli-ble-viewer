import { createContext, useCallback, useContext, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { DeviceList } from './components/DeviceList';

export type Screens = 'device-list' | 'connecting' | 'connected' | 'error';

export interface RouterState {
  screen: Screens;
  params: Record<string, any>;
  navigateTo: (screen: Screens, params?: Record<string, any>) => void;
}

export const RouterContext = createContext<RouterState>({ screen: 'device-list', params: {}, navigateTo: () => {} });

export function useRouter(): RouterState {
  return useContext(RouterContext);
}

export function Router() {
  // const [selectedIndex, setSelectedIndex] = useState(0);
  const [screen, setScreen] = useState<Screens>('device-list');
  const [params, setParams] = useState<Record<string, any>>({});

  const navigateTo = useCallback(function navigateTo(screen: Screens, params: Record<string, any> = {}) {
    setScreen(screen);
    setParams(params);
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      <Box>
        <Text color="cyan" bold>⚖️ Gourmetmiles Smart Scale BLE Client</Text>
      </Box>

      <RouterContext.Provider value={{ screen, params, navigateTo }}>
        {renderScreen(screen)}
      </RouterContext.Provider>

      <Box>
        <Text color="gray">{renderHelpText(screen)}</Text>
      </Box>
    </Box>
  );
} 

function renderHelpText(screen: Screens): string {
  switch (screen) {
    case 'device-list':
      return '↑↓ Select • Enter Connect • Q Exit';
    case 'connecting':
      return Connecting.helpText;
    case 'connected':
      return 'B Battery • Q Exit';
    case 'error':
      return 'Q Exit • Try selecting another device';
    default:
      return '';
  }
};


function renderScreen(screen: Screens): React.ReactNode {
  switch (screen) {
    case 'device-list':
      return <DeviceList />;
    case 'connecting':
      return <Connecting />;
    case 'connected':
      return <Connected />;
    case 'error':
      return <Error />;
  }
};

function Connecting() {
  const { navigateTo } = useRouter();
  
  useInput((input, key) => {
    if (key.escape || (input === 'q' || input === 'Q')) {
      navigateTo('device-list');
    }
  });
  return <Text>Connecting...</Text>;
}

Connecting.helpText = 'Q Cancel';

const Connected = Connecting;
const Error = Connecting;


  // // Update screen state based on connection status and selected device
  // useEffect(() => {
  //   if (connectionStatus === 'disconnected' && !selectedDevice) {
  //     setCurrentScreen('device-list');
  //   } else if (connectionStatus === 'connecting') {
  //     setCurrentScreen('connecting');
  //   } else if (connectionStatus === 'connected') {
  //     setCurrentScreen('connected');
  //   } else if (connectionStatus === 'error') {
  //     setCurrentScreen('error');
  //   }
  // }, [connectionStatus, selectedDevice]);

  // useInput((input, key) => {
  //   // Debug logging for input handling
  //   logger.debug('Input received', { input, key, currentScreen, selectedIndex, devicesLength: devices.length });
    
  //   // Handle navigation based on current screen
  //   if (currentScreen === 'device-list') {
  //     // Device List Screen Controls
  //     if (key.upArrow && selectedIndex > 0) {
  //       logger.debug('Moving up');
  //       setSelectedIndex(selectedIndex - 1);
  //     } else if (key.downArrow && selectedIndex < devices.length - 1) {
  //       logger.debug('Moving down');
  //       setSelectedIndex(selectedIndex + 1);
  //     } else if (key.return && devices.length > 0) {
  //       const selectedDevice = devices[selectedIndex];
  //       logger.debug('Enter pressed, selecting device', { 
  //         deviceName: selectedDevice.advertisement.localName || '(no name)',
  //         deviceAddress: selectedDevice.address || '(no address)',
  //         deviceIndex: selectedIndex
  //       });
  //       onDeviceSelect(devices[selectedIndex]);
  //     } else if (key.escape || (input === 'q' || input === 'Q')) {
  //       logger.debug('Exit requested');
  //       onExit();
  //     } else if (input === '\u0003') { // Ctrl+C
  //       logger.debug('Ctrl+C received');
  //       onExit();
  //     }
  //   } else {
  //     // Connected/Connecting/Error Screen Controls
  //     if (key.escape || (input === 'q' || input === 'Q')) {
  //       onExit();
  //     } else if ((input === 'b' || input === 'B') && onBatteryRead) {
  //       onBatteryRead();
  //     } else if (input === '\u0003') { // Ctrl+C
  //       onExit();
  //     }
  //   }
  // });

  // // Reset selection when devices change
  // useEffect(() => {
  //   if (selectedIndex >= devices.length && devices.length > 0) {
  //     setSelectedIndex(0);
  //   }
  // }, [devices.length, selectedIndex]);