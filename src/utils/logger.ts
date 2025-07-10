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
  // Handle both relative and absolute paths
  let filePath: string;

  if (filename.includes('/') || filename.includes('\\')) {
    // If filename contains path separators, treat it as a full path
    filePath = filename;
    // Ensure the directory exists
    const dir = filename.substring(0, filename.lastIndexOf('/'));
    try {
      await mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
  } else {
    // If filename is just a name, put it in the logs directory
    const logsDir = join(process.cwd(), 'logs');
    try {
      await mkdir(logsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
    filePath = join(logsDir, filename);
  }

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

// Create logger instances
export const fileLogger = createLogger(createWriteStream('/dev/null')); // Placeholder, will be set up properly when needed
export const nullLogger = createLogger(createNullStream());

// Default logger (can be changed at runtime)
export let logger = nullLogger;

// Function to switch logger output
export async function setLoggerOutput(filename: string | null): Promise<void> {
  logger = nullLogger;

  if (filename === null) {
    return;
  }

  try {
    const stream = await createFileStream(filename);
    logger = createLogger(stream);
    logger.info('Switched to file logging', { file: filename });
  } catch (error) {
    console.error('Failed to create file logger:', error);
  }
} 