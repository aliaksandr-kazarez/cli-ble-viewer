# Gourmetmiles Smart Scale BLE Client

A Node.js BLE client for connecting to Gourmetmiles smart scales and reading weight measurements in real-time with an interactive terminal UI.

## Prerequisites

- **Node.js ≥ 18**
- **macOS** with Bluetooth adapter
- **Gourmetmiles smart scale** (advertises as "CK2352BT" or "Macroscale-XXXX")

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the client:**
   ```bash
   npm start
   ```

3. **For development with auto-restart:**
   ```bash
   npm run dev
   ```

4. **Power on your scale** and wait for the interactive UI to appear. The app will:
   - Discover your scale automatically
   - Display all found devices in an interactive list
   - Allow you to select and connect to your scale
   - Show live weight readings and battery level

5. **Use the interactive UI:**
   - **Arrow keys**: Navigate through discovered devices
   - **Enter**: Connect to the selected device
   - **Q**: Exit the application
   - **Ctrl-C**: Disconnect and exit (when connected)

## Development with Live Reload

The app supports several development modes with automatic restart when you make changes:

### Standard Development (with TypeScript compilation)
```bash
npm run dev              # Full logging
npm run dev:clean        # No logging (clean UI)
npm run dev:file         # Log to file
npm run dev:debug        # Debug mode
```

### Fast Development (no compilation step)
```bash
npm run dev:fast         # Fast restart with full logging
npm run dev:fast:clean   # Fast restart with clean UI
```

### Features:
- **Auto-restart**: App restarts automatically when you save changes
- **File watching**: Monitors `.ts`, `.tsx`, `.js`, `.jsx`, and `.json` files
- **Smart restart**: Only restarts when necessary
- **Manual restart**: Type `rs` and press Enter to restart manually
- **Clean shutdown**: Properly handles BLE connections during restart

### Tips for Development:
- Use `npm run dev:clean` for a clean UI during development
- Use `npm run dev:fast` for faster iteration (no TypeScript compilation)
- The app will automatically reconnect to your scale after restart
- Check the terminal for restart notifications

## Troubleshooting

- **"No scale found"**: Ensure scale is powered on and advertising
- **Permission errors**: Grant Bluetooth permissions in System Preferences
- **Connection issues**: Try restarting Bluetooth or the scale
- **UI not rendering**: Make sure your terminal supports Unicode and colors

## Features

- **Interactive Terminal UI**: Built with Ink and React for a modern CLI experience
- **Auto-discovery**: Automatically finds and lists all BLE devices
- **Device Selection**: Interactive list to choose your scale
- **Real-time Data**: Live weight readings and battery level display
- **Supports both standard (0x181D) and custom BLE services**
- **Clean shutdown handling**
- **Modular, event-driven architecture for easy extension**

## Project Structure

```
src/
  scales/
    scaleConnectionService.ts   # All scale BLE connection, subscription, and parsing logic
    types.ts                    # Types for scale readings and events
  services/
    appService.ts               # Application coordination and Ink UI integration
    bluetoothService.ts         # BLE scanning and state
    deviceManager.ts            # Device discovery and management
  ui/
    components/
      App.tsx                   # Main React component for the UI
      DeviceList.tsx            # Interactive device selection list
      ScaleInfo.tsx             # Scale information and live data display
    inkUI.ts                    # Ink UI service and state management
    index.ts                    # UI exports
  types/
    ble.ts                      # BLE device type definitions
  index.ts                      # Main application entry point
```

### Module Responsibilities

- **ScaleConnectionService**: Encapsulates all BLE connection, subscription, and weight parsing logic for the scale. Emits events for connection, disconnection, errors, and weight readings. Event-driven and easy to extend for new scale models or protocols.
- **AppService**: Coordinates device discovery, Ink UI integration, and delegates scale connection to `ScaleConnectionService`. Handles application lifecycle and UI state management.
- **InkUI**: Manages the React-based terminal UI rendering and state updates. Provides a clean interface for updating the display.
- **BluetoothService**: Handles BLE scanning and state management.
- **DeviceManager**: Tracks discovered devices and manages their lifecycle.
- **React Components**: Provide the interactive UI elements for device selection and data display.

## Scale Connection API (for developers)

The `ScaleConnectionService` provides a clean, event-driven API:

```ts
import { ScaleConnectionService, ScaleWeightReading } from './scales/scaleConnectionService';

const scale = new ScaleConnectionService();
scale.on('connected', () => console.log('Connected!'));
scale.on('weight', (reading: ScaleWeightReading) => {
  console.log(`Weight: ${reading.kg} kg (${reading.grams} g)`);
});
scale.on('disconnected', () => console.log('Disconnected!'));
scale.on('error', (err) => console.error('Error:', err));

await scale.connect(device); // device is a NobleDevice from BLE scan
```

- **Weight parsing logic:** For custom `ffb2` characteristic, bytes 2-3 (u16le) divided by 10 gives grams.
- **Events:**
  - `'connected'`: When the scale is connected
  - `'weight'`: When a new weight reading is received
  - `'disconnected'`: When the scale disconnects
  - `'error'`: On connection or protocol error

## Extending

- To support new scale models, add parsing logic to `ScaleConnectionService`.
- To log or export weights, subscribe to the `'weight'` event.
- To add new UI components, create React components in `src/ui/components/`.
- To modify the UI layout, update the `App.tsx` component.

---

**This project is designed for clarity, maintainability, and extensibility with a modern interactive UI.**
If you have questions or want to contribute, please open an issue or PR! 