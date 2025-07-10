#!/usr/bin/env node

import { createAppService } from './services/appService.js';
import { logger } from './utils/logger.js';

export function createApplication() {
  const appService = createAppService();

  async function start(): Promise<void> {
    try {
      logger.info('Starting Gourmetmiles BLE Client with Ink UI');
      await appService.initialize();
    } catch (error) {
      logger.error('Failed to start application', { error: (error as Error).message });
      process.exit(1);
    }
  }

  function stop(): void {
    logger.info('Stopping Gourmetmiles BLE Client');
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