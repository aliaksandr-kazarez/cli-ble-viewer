import { Router } from './Router.js';
import { BluetoothService } from '../services/bluetoothService.js';
import { ServiceProvider } from './ServiceProvider.js';
import { ScaleConnectionService } from '../services/scaleConnectionService.js';

export interface ApplicationProps {
  bluetoothService: BluetoothService;
  scaleConnectionService: ScaleConnectionService;
}

export function Application({ bluetoothService, scaleConnectionService }: ApplicationProps) {
  // Expose updateState function globally
  return (
    <ServiceProvider service={{ bluetoothService, scaleConnectionService }}>
      <Router />
    </ServiceProvider>
  );
}

