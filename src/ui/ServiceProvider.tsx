// implement react context provider for services
import React, { createContext, useContext } from "react";
import { BluetoothService } from "../services/bluetoothService";
import { ScaleConnectionService } from "../services/scaleConnectionService";

export interface ServiceProvider {
  bluetoothService: BluetoothService;
  scaleConnectionService: ScaleConnectionService;
}

export const ServiceContext = createContext<ServiceProvider | null>(null);

export function ServiceProvider({ children, service }: { children: React.ReactNode, service: ServiceProvider }): React.ReactNode {
  return <ServiceContext.Provider value={service}>{children}</ServiceContext.Provider>;
}

// also implement hook to use services
export function useBluetoothService(): BluetoothService {
  const service = useContext(ServiceContext);
  if (!service) {
    throw new Error("Bluetooth service not found");
  }
  return service.bluetoothService;
}

export function useScaleConnectionService(): ScaleConnectionService {
  const service = useContext(ServiceContext);
  if (!service) {
    throw new Error("Scale connection service not found");
  }
  return service.scaleConnectionService;
}