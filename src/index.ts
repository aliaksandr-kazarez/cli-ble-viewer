#!/usr/bin/env node

import { logger, setLoggerOutput } from './utils/logger.js';
import { parseArgs } from './utils/args.js';

// Check if raw mode is supported (required for Ink)
function isRawModeSupported(): boolean {
  return process.stdin.isTTY && process.stdin.setRawMode !== undefined;
}

export async function setupLogging(): Promise<void> {
  const options = parseArgs();

  if (options.logOutput === 'file') {
    await setLoggerOutput(options.logFile);
  } else {
    await setLoggerOutput(null);
  }

  logger.info('Logging initialized', {
    output: options.logOutput,
    file: options.logOutput === 'file' ? options.logFile : "",
    debug: options.debug
  });
}

try {
  if (import.meta.url === `file://${process.argv[1]}`) {
    await setupLogging();

    if (!isRawModeSupported()) {
      logger.error('❌ Error: Raw mode is not supported in this environment.');
      logger.error('This usually happens when running with nodemon or in a non-TTY environment.');
      logger.error('Try running without nodemon: npm start');
      process.exit(1);
    }
  
    const app = await createApplication();

    process.on('SIGINT', () => {
      app.halt();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      app.halt();
      process.exit(0);
    });

  }
} catch (error) {
  logger.error('Application failed', { error: (error as Error).message });
  process.exit(1);
}