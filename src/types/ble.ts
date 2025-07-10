// BLE device type definitions
export interface DiscoveredDevice {
  localName: string;
  address: string;
  serviceUuids: string[];
  lastSeen: number; // Unix timestamp (ms)
}

export interface NobleDevice {
  advertisement: {
    localName?: string;
    serviceUuids?: string[];
    txPowerLevel?: number;
    manufacturerData?: Buffer;
    serviceData?: Array<{ uuid: string; data: Buffer }>;
    solicitedServiceUuids?: string[];
    [key: string]: unknown; // allow extra fields
  };
  address: string;
  connect: (callback: (error?: unknown) => void) => void;
  on: (event: string, callback: (data?: unknown) => void) => void;
  discoverAllServicesAndCharacteristics: (callback: (error?: unknown, services?: unknown[], characteristics?: unknown[]) => void) => void;
  disconnect: () => void;
  lastSeen?: number; // Add lastSeen for device pruning
  firstSeen?: number; // Add firstSeen for stable device ordering
}

// Extend noble types
declare module '@abandonware/noble' {
  interface Noble {
    state: string;
    _state: string;
  }
} 