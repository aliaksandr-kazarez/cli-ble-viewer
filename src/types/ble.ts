// BLE device type definitions
export interface DiscoveredDevice {
  localName: string;
  address: string;
  serviceUuids: string[];
}

export interface NobleDevice {
  advertisement: {
    localName?: string;
    serviceUuids?: string[];
  };
  address: string;
}

// Extend noble types
declare module '@abandonware/noble' {
  interface Noble {
    state: string;
    _state: string;
  }
} 