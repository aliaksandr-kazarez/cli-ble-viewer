# Module Structure

This project has been split into logical, independent modules for better maintainability and testability.

## 📁 Directory Structure

```
src/
├── types/
│   ├── index.ts          # Type exports
│   └── ble.ts            # BLE-related type definitions
├── services/
│   ├── index.ts          # Service exports
│   ├── appService.ts     # Application coordination
│   ├── bluetoothService.ts # BLE operations
│   └── deviceManager.ts  # Device storage and management
├── ui/
│   ├── index.ts          # UI exports
│   └── display.ts        # Console display logic
└── index.ts              # Main application entry point
```

## 🔧 Module Independence

### **Types Module** (`src/types/`)
- **Purpose**: Centralized type definitions
- **Dependencies**: None (pure types)
- **Exports**: `DiscoveredDevice`, `NobleDevice`
- **Independence**: Can be used by any module without circular dependencies

### **Device Manager** (`src/services/deviceManager.ts`)
- **Purpose**: Device storage and management
- **Dependencies**: Only types
- **Responsibilities**: 
  - Store discovered devices
  - Provide device queries
  - Manage device lifecycle
- **Independence**: No dependencies on other business logic

### **Bluetooth Service** (`src/services/bluetoothService.ts`)
- **Purpose**: BLE operations abstraction
- **Dependencies**: Only `@abandonware/noble` and types
- **Responsibilities**:
  - Handle BLE state management
  - Control scanning operations
  - Provide BLE status information
- **Independence**: No UI or business logic dependencies

### **Display Module** (`src/ui/display.ts`)
- **Purpose**: UI rendering logic
- **Dependencies**: Only types
- **Responsibilities**:
  - Render device lists
  - Display status messages
  - Handle console output
- **Independence**: Pure UI logic, no business logic

### **App Service** (`src/services/appService.ts`)
- **Purpose**: Application coordination
- **Dependencies**: All other modules
- **Responsibilities**:
  - Coordinate between modules
  - Handle application lifecycle
  - Manage error handling
- **Independence**: Acts as a facade, doesn't contain business logic

### **Main Application** (`src/index.ts`)
- **Purpose**: Application entry point
- **Dependencies**: Only AppService
- **Responsibilities**:
  - Bootstrap the application
  - Handle process signals
  - Manage application lifecycle
- **Independence**: Minimal logic, delegates to AppService

## 🎯 Benefits of This Structure

1. **Testability**: Each module can be unit tested independently
2. **Maintainability**: Changes to one module don't affect others
3. **Reusability**: Modules can be reused in different contexts
4. **Clear Responsibilities**: Each module has a single, well-defined purpose
5. **Dependency Management**: Clear dependency flow from types → services → UI → app

## 🔄 Module Communication

```
Types ← DeviceManager ← AppService → Display
  ↑         ↑              ↑
  └── BluetoothService ────┘
```

- **Types** are used by all modules
- **Services** depend only on types and their specific dependencies
- **UI** depends only on types
- **AppService** coordinates between all modules
- **Main** only depends on AppService 