#!/usr/bin/env node

import { AppService } from './services/appService.js';
import { logger } from './utils/logger.js';

// Main application entry point
class Application {
  private appService: AppService;

  constructor() {
    this.appService = new AppService();
  }

  // Initialize and start the application
  async start(): Promise<void> {
    try {
      await this.appService.initialize();
      await this.appService.startDiscovery();
    } catch (error) {
      console.error('❌ Application error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  // Cleanup and shutdown
  shutdown(): void {
    logger.info('Application shutting down');
    this.appService.cleanup();
    logger.close();
    process.exit(0);
  }
}

// Create and start the application
const app = new Application();

// Handle SIGINT (Ctrl-C)
process.on('SIGINT', () => {
  app.shutdown();
});

// Start the application
app.start(); 