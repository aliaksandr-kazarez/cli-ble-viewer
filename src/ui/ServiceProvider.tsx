// implement react context provider for services
import React, { createContext, useContext } from "react";
import { Bluetooth } from "../services/bluetooth/bluetooth";

export interface ServiceProvider {
  bluetooth: Bluetooth;
}

export const ServiceContext = createContext<ServiceProvider | null>(null);

export function ServiceProvider({ children, service }: { children: React.ReactNode, service: ServiceProvider }): React.ReactNode {
  return <ServiceContext.Provider value={service}>{children}</ServiceContext.Provider>;
}

// also implement hook to use services
export function useBluetoothService(): Bluetooth {
  const { bluetooth } = useContext(ServiceContext) ?? {};
  if (!bluetooth) {
    throw new Error("Bluetooth service not found");
  }
  return bluetooth;
}