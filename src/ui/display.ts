import { DiscoveredDevice } from '../types/ble.js';
import { logger } from '../utils/logger.js';
import Table from 'cli-table3';
import ansiEscapes from 'ansi-escapes';

// Get terminal width, fallback to 80 if not available
function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

// Display service - handles UI rendering independently
export class Display {

  // Robustly clear previous output for zsh and other shells
  private static clearPrevOutput() {
    if (process.stdout.isTTY) {
      // Use ansi-escapes for smooth, non-blinking cursor control
      process.stdout.write(ansiEscapes.cursorTo(0, 0) + ansiEscapes.eraseDown);
    } else {
      // Fallback: print a separator for non-TTY environments
      process.stdout.write('\n' + '-'.repeat(80) + '\n');
    }
  }

  // Render the device list to console
  static renderDeviceList(devices: DiscoveredDevice[]): void {
    logger.debug('Rendering device list', { deviceCount: devices.length });
    this.clearPrevOutput();

    const header = '🔍 BLE Devices Discovered (press Ctrl-C to exit)';
    
    // Calculate dynamic column widths based on terminal size
    const terminalWidth = getTerminalWidth();
    const fixedWidths = {
      address: 17,    // Fixed width for address column
      services: 40,   // Fixed width for services column
      borders: 6      // Account for table borders and padding
    };
    
    // Calculate available width for name column
    const nameWidth = Math.max(15, terminalWidth - fixedWidths.address - fixedWidths.services - fixedWidths.borders);
    
    const table = new Table({
      head: ['Name', 'Address', 'Services'],
      colWidths: [nameWidth, fixedWidths.address, fixedWidths.services],
      wordWrap: true,
      style: { head: ['cyan'] }
    });

    if (devices.length === 0) {
      table.push(['No devices found yet...', '', '']);
    } else {
      for (const device of devices) {
        table.push([
          device.localName,
          device.address,
          device.serviceUuids.join(', ')
        ]);
      }
    }

    // Print header and table
    process.stdout.write(header + '\n' + table.toString() + '\n');

    logger.debug('Finished rendering device list', { 
      deviceCount: devices.length, 
      terminalWidth, 
      nameWidth 
    });
  }

  // Display startup message
  static showStartupMessage(): void {
    process.stdout.write('🔍 Starting BLE discovery...\n');
    process.stdout.write('Listening for all BLE devices. Press Ctrl-C to stop.\n');
  }

  // Display bluetooth ready message
  static showBluetoothReady(): void {
    process.stdout.write('✅ Bluetooth adapter ready\n');
  }

  // Display error message
  static showError(message: string): void {
    process.stderr.write('❌ Error: ' + message + '\n');
  }

  // Display cleanup message
  static showCleanup(): void {
    process.stdout.write('\nCleaning up...\n');
  }
} 