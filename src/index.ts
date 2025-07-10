#!/usr/bin/env node

import { createAppService } from './createApp.js';
import { logger, setLoggerOutput } from './utils/logger.js';

// Check if raw mode is supported (required for Ink)
function isRawModeSupported(): boolean {
  return process.stdin.isTTY && process.stdin.setRawMode !== undefined;
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options: {
    logOutput: 'file' | 'null';
    logFile?: string;
    debug: boolean;
  } = {
    logOutput: 'null',
    debug: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--log-file':
      case '-f':
        options.logOutput = 'file';
        options.logFile = args[i + 1];
        i++; // Skip next argument
        break;
      case '--no-logs':
      case '-n':
        options.logOutput = 'null';
        break;
      case '--debug':
      case '-d':
        options.debug = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Gourmetmiles Smart Scale BLE Client

Usage: npm start [options]

Options:
  --log-file <filename>, -f <filename>  Log to file (default: app.log)
  --no-logs, -n                         Suppress all logging
  --debug, -d                           Enable debug logging
  --help, -h                            Show this help message

Environment Variables:
  DEBUG=true                            Enable debug logging
  LOG_OUTPUT=file|null                  Set logging output
  LOG_FILE=<filename>                   Set log filename (when LOG_OUTPUT=file)

Examples:
  npm start --log-file scale.log        # Log to scale.log
  npm start --no-logs                   # No logging
  npm start --debug                     # Debug mode with file logging
        `);
        process.exit(0);
    }
  }

  return options;
}

// Setup logging based on arguments and environment
function setupLogging() {
  const args = parseArgs();
  
  // Environment variables take precedence
  let logOutput = (process.env.LOG_OUTPUT as 'file' | 'null') || args.logOutput;
  const logFile = process.env.LOG_FILE || args.logFile;
  const debug = process.env.DEBUG === 'true' || args.debug;
  
  if (debug) {
    process.env.DEBUG = 'true';
    // If debug is enabled but no file logging is specified, default to file logging
    if (logOutput === 'null' && !process.env.LOG_OUTPUT) {
      logOutput = 'file';
    }
  }
  
  setLoggerOutput(logOutput, logFile);
  
  logger.info('Logging initialized', { 
    output: logOutput, 
    file: logFile, 
    debug 
  });
}

export function createApplication() {
  const appService = createAppService();

  async function start(): Promise<void> {
    // Setup logging first
    setupLogging();

    try {
      // Check if we can run Ink
      if (!isRawModeSupported()) {
        logger.error('❌ Error: Raw mode is not supported in this environment.');
        logger.error('This usually happens when running with nodemon or in a non-TTY environment.');
        logger.error('Try running without nodemon: npm start');
        process.exit(1);
      }

      // Let Ink handle all terminal input - don't configure raw mode manually
      // Ink will handle the terminal configuration internally
            
      await appService.initialize();
    } catch (error) {
      logger.error('Failed to start application', { error: (error as Error).message });
      process.exit(1);
    }
  }

  function stop(): void {
    logger.info('Stopping Gourmetmiles BLE Client');
    
    // Let Ink handle terminal cleanup
    appService.cleanup();
  }

  return {
    start,
    stop,
  };
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApplication();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    app.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    app.stop();
    process.exit(0);
  });

  app.start().catch((error) => {
    logger.error('Application failed', { error: (error as Error).message });
    process.exit(1);
  });
} 