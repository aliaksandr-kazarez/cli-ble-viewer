import { setLoggerOutput, logger } from './logger.js';
import { showHelp } from './help.js';

export type AppOptions = {
  logOutput: 'file';
  logFile: string;
  debug: boolean;
} | {
  logOutput: 'null';
  debug: false;
}

export function parseArgs(): AppOptions {
  const args = process.argv.slice(2);
  let logOutput: 'file' | 'null' = 'null';
  let logFile: string = 'app.log';
  let debug: boolean = false;

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--log-file':
      case '-f':
        logOutput = 'file';
        logFile = args[i + 1];
        i++; // Skip next argument
        break;
      case '--no-logs':
      case '-n':
        logOutput = 'null';
        break;
      case '--debug':
      case '-d':
        debug = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
    }
  }

  // Environment variables take precedence over command line arguments
  if (process.env.LOG_OUTPUT) {
    logOutput = process.env.LOG_OUTPUT as 'file' | 'null';
  }
  
  if (process.env.LOG_FILE) {
    logFile = process.env.LOG_FILE;
  }
  
  if (process.env.DEBUG === 'true') {
    debug = true;
  }

  if (debug === true) {
    process.env.DEBUG = 'true';
  }

  // If debug is enabled but no file logging is specified, default to file logging
  if (debug && logOutput === 'null' && !process.env.LOG_OUTPUT) {
    logOutput = 'file';
  }

  // Return the appropriate type based on logOutput
  if (logOutput === 'file') {
    return {
      logOutput: 'file',
      logFile,
      debug
    };
  } else {
    return {
      logOutput: 'null',
      debug: false
    };
  }
}
