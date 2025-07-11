import { Router } from './Router.js';
import { Bluetooth } from '../services/bluetooth/bluetooth.js';
import { ServiceProvider } from './ServiceProvider.js';

export interface ApplicationProps {
  bluetooth: Bluetooth;
}

export function Application({ bluetooth }: ApplicationProps) {
  // Expose updateState function globally
  return (
    <ServiceProvider service={{ bluetooth }}>
      <Router />
    </ServiceProvider>
  );
}

