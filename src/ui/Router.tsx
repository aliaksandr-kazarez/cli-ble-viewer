import { createContext, useCallback, useContext, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { DeviceList } from './components/DeviceList';
import { DeviceInfo } from './components/DeviceInfo';

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
      return DeviceList.helpText;
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
      return <DeviceInfo />;
    case 'connected':
      return <DeviceInfo />;
    case 'error':
      return <Error />;
  }
};

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (_key: any, value: object | null) => {
      if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
              return; // Remove circular reference
          }
          seen.add(value);
      }
      return value;
  };
};

function Connecting() {
  const { navigateTo, params } = useRouter();
  const { device } = params;

  console.log(device);
  
  useInput((input, key) => {
    if (key.escape || (input === 'q' || input === 'Q')) {
      navigateTo('device-list');
    }
  });

  // print full device info in beaurtiful formatted manner, but not JSON stringify
  return <Text>{JSON.stringify(device, getCircularReplacer(), 2)}</Text>;

}

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
// MOVED TO DeviceList.tsx
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