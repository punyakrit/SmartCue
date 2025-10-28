/**
 * Main Electron Process Entry Point
 * Clean, modular architecture for Meeting Notes App
 */

// Only require and initialize when running in Electron context
if (typeof require !== 'undefined' && require.main === module) {
  const MeetingNotesApp = require('./src/App');
  const logger = require('./src/utils/logger');

  // Create application instance
  const meetingNotesApp = new MeetingNotesApp();

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
} else {
  // Export for potential external use when not running as main
  module.exports = require('./src/App');
}
