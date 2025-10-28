/**
 * Logger Utility
 * Centralized logging with different levels and formatting
 */

const APP_CONFIG = require('../config/appConfig');

class Logger {
  constructor() {
    this.enabled = APP_CONFIG.LOGGING.ENABLED;
    this.debugMode = APP_CONFIG.LOGGING.DEBUG;
  }

  log(level, message, data = null) {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    // Map debug to console.log if console.debug doesn't exist
    const consoleMethod = console[level] || console.log;
    
    if (data) {
      consoleMethod(`${prefix} ${message}`, data);
    } else {
      consoleMethod(`${prefix} ${message}`);
    }
  }

  info(message, data = null) {
    this.log('info', message, data);
  }

  warn(message, data = null) {
    this.log('warn', message, data);
  }

  error(message, data = null) {
    this.log('error', message, data);
  }

  debug(message, data = null) {
    if (this.debugMode) {
      this.log('debug', message, data);
    }
    // If debug is disabled, just don't log debug messages
  }

  success(message, data = null) {
    this.log('info', `✅ ${message}`, data);
  }

  // Specialized logging for app features
  incognito(enabled) {
    const status = enabled ? 'ENABLED' : 'DISABLED';
    const emoji = enabled ? '🕵️' : '🔓';
    this.info(`${emoji} Incognito mode ${status} - App UI ${enabled ? 'hidden from' : 'visible in'} screen capture`);
  }

  visibility(visible) {
    const status = visible ? 'SHOWN' : 'HIDDEN';
    const emoji = visible ? '👁️' : '👻';
    this.info(`${emoji} Application ${status} - ${visible ? 'Visible in UI' : 'Completely invisible from UI'}`);
  }

  windowMove(direction, position) {
    this.debug(`Window moved ${direction} to:`, position);
  }

  desktopFollowing(action, position) {
    this.debug(`🔄 Desktop following - ${action}:`, position);
  }
}

module.exports = new Logger();
