export function showHelp(): void {
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
} 