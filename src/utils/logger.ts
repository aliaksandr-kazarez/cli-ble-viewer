// Logger utility for debugging
export function createLogger() {
  const isDebugMode = process.env.DEBUG === 'true';
  const isSearchMode = process.argv.includes('--search');

  function formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${dataStr}`;
  }

  function info(message: string, data?: any): void {
    if (!isSearchMode) {
      process.stderr.write(formatMessage('info', message, data) + '\n');
    }
  }

  function debug(message: string, data?: any): void {
    if (isDebugMode && !isSearchMode) {
      process.stderr.write(formatMessage('debug', message, data) + '\n');
    }
  }

  function error(message: string, data?: any): void {
    process.stderr.write(formatMessage('error', message, data) + '\n');
  }

  function warn(message: string, data?: any): void {
    if (!isSearchMode) {
      process.stderr.write(formatMessage('warn', message, data) + '\n');
    }
  }

  return {
    info,
    debug,
    error,
    warn,
  };
}

// Create default logger instance
export const logger = createLogger(); 