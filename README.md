# Gourmetmiles Smart Scale BLE Client

A Node.js BLE client for connecting to Gourmetmiles smart scales and reading weight measurements in real-time.

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

4. **Power on your scale** and wait for connection. The script will:
   - Discover your scale automatically
   - Connect and subscribe to weight measurements
   - Display live weight readings in kg and grams

5. **Press Ctrl-C** to exit cleanly.

## Troubleshooting

- **"No scale found"**: Ensure scale is powered on and advertising
- **Permission errors**: Grant Bluetooth permissions in System Preferences
- **Connection issues**: Try restarting Bluetooth or the scale

## Features

- Auto-discovers scales by name prefix
- Supports both standard (0x181D) and custom BLE services
- 15-second discovery timeout with helpful error messages
- Clean shutdown handling
- Real-time weight parsing from 2-byte little-endian payload 