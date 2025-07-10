import { App } from './components/App.js';
import { BluetoothService } from '../services/bluetoothService.js';
import { ServiceProvider } from './ServiceProvider.js';

export interface ApplicationProps {
  bluetoothService: BluetoothService;
}

export function Application({ bluetoothService }: ApplicationProps) {
  // Expose updateState function globally
  return (
    <ServiceProvider service={{ bluetoothService }}>
      <App />
    </ServiceProvider>
  );
}

