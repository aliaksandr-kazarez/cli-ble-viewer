import fs from 'fs';
import path from 'path';

// Logger utility for debugging
export class Logger {
  private logFile: string;
  private logStream: fs.WriteStream;

  constructor() {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create log file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(logsDir, `ble-client-${timestamp}.log`);
    
    // Create write stream
    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    
    // Log startup
    this.info('Logger initialized', { logFile: this.logFile });
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  private writeToFile(message: string): void {
    this.logStream.write(message + '\n');
  }

  private writeToConsole(message: string): void {
    console.log(message);
  }

  info(message: string, data?: any): void {
    const formattedMessage = this.formatMessage('INFO', message, data);
    this.writeToFile(formattedMessage);
    this.writeToConsole(formattedMessage);
  }

  debug(message: string, data?: any): void {
    const formattedMessage = this.formatMessage('DEBUG', message, data);
    this.writeToFile(formattedMessage);
    // Debug messages only go to file, not console
  }

  error(message: string, data?: any): void {
    const formattedMessage = this.formatMessage('ERROR', message, data);
    this.writeToFile(formattedMessage);
    this.writeToConsole(formattedMessage);
  }

  warn(message: string, data?: any): void {
    const formattedMessage = this.formatMessage('WARN', message, data);
    this.writeToFile(formattedMessage);
    this.writeToConsole(formattedMessage);
  }

  // Console-only logging (for user-facing messages)
  console(message: string): void {
    this.writeToConsole(message);
  }

  // Close the log stream
  close(): void {
    this.logStream.end();
  }
}

// Create a singleton logger instance
export const logger = new Logger(); 