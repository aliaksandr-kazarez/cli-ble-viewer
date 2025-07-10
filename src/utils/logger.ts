import { Writable } from 'stream';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';

// Logger utility for debugging
export function createLogger(outputStream: Writable) {
  const isDebugMode = process.env.DEBUG === 'true';

  function formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${dataStr}`;
  }

  function writeToStream(level: string, message: string, data?: any): void {
    const formattedMessage = formatMessage(level, message, data) + '\n';
    outputStream.write(formattedMessage);
  }

  function info(message: string, data?: any): void {
    writeToStream('info', message, data);
  }

  function debug(message: string, data?: any): void {
    if (isDebugMode) {
      writeToStream('debug', message, data);
    }
  }

  function error(message: string, data?: any): void {
    writeToStream('error', message, data);
  }

  function warn(message: string, data?: any): void {
    writeToStream('warn', message, data);
  }

  return {
    info,
    debug,
    error,
    warn,
  };
}

// Helper function to create a file stream
export async function createFileStream(filename: string): Promise<Writable> {
  // Ensure logs directory exists
  const logsDir = join(process.cwd(), 'logs');
  try {
    await mkdir(logsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }
  
  const filePath = join(logsDir, filename);
  return createWriteStream(filePath, { flags: 'a' }); // 'a' for append mode
}

// Helper function to create a null stream (no output)
export function createNullStream(): Writable {
  return new Writable({
    write(chunk, encoding, callback) {
      // Do nothing - discard all output
      callback();
    }
  });
}

// Create default logger instances
export const consoleLogger = createLogger(process.stderr);
export const fileLogger = createLogger(createWriteStream('/dev/null')); // Placeholder, will be set up properly when needed
export const nullLogger = createLogger(createNullStream());

// Default logger (can be changed at runtime)
export let logger = nullLogger;

// Function to switch logger output
export function setLoggerOutput(output: 'console' | 'file' | 'null', filename?: string): void {
  switch (output) {
    case 'console':
      logger = consoleLogger;
      break;
    case 'file':
      if (filename) {
        createFileStream(filename).then(stream => {
          logger = createLogger(stream);
        }).catch(error => {
          console.error('Failed to create file logger:', error);
          logger = consoleLogger;
        });
      } else {
        createFileStream('app.log').then(stream => {
          logger = createLogger(stream);
        }).catch(error => {
          console.error('Failed to create file logger:', error);
          logger = consoleLogger;
        });
      }
      break;
    case 'null':
      logger = nullLogger;
      break;
  }
} 