// implement react context provider for services
import React, { createContext, useContext } from "react";
import { BluetoothService } from "../services/bluetoothService";

export interface ServiceProvider {
  bluetoothService: BluetoothService;
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