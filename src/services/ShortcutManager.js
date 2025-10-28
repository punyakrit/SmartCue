/**
 * Shortcut Manager Service
 * Handles all global keyboard shortcuts
 */

const { globalShortcut } = require('electron');
const APP_CONFIG = require('../config/appConfig');
const logger = require('../utils/logger');

class ShortcutManager {
  constructor(windowManager) {
    this.windowManager = windowManager;
    this.registeredShortcuts = new Set();
  }

  /**
   * Register all global shortcuts
   */
  registerAllShortcuts() {
    try {
      this.registerShortcut(APP_CONFIG.SHORTCUTS.TOGGLE_INCOGNITO, () => {
        if (this.windowManager.isWindowValid()) {
          this.windowManager.toggleIncognitoMode();
        }
      });

      this.registerShortcut(APP_CONFIG.SHORTCUTS.TOGGLE_VISIBILITY, () => {
        if (this.windowManager.isWindowValid()) {
          this.windowManager.toggleVisibility();
        }
      });

      this.registerShortcut(APP_CONFIG.SHORTCUTS.MOVE_LEFT, () => {
        if (this.windowManager.isWindowValid()) {
          this.windowManager.moveWindow('left');
        }
      });

      this.registerShortcut(APP_CONFIG.SHORTCUTS.MOVE_RIGHT, () => {
        if (this.windowManager.isWindowValid()) {
          this.windowManager.moveWindow('right');
        }
      });

      this.registerShortcut(APP_CONFIG.SHORTCUTS.MOVE_UP, () => {
        if (this.windowManager.isWindowValid()) {
          this.windowManager.moveWindow('up');
        }
      });

      this.registerShortcut(APP_CONFIG.SHORTCUTS.MOVE_DOWN, () => {
        if (this.windowManager.isWindowValid()) {
          this.windowManager.moveWindow('down');
        }
      });

      logger.success(`Registered ${this.registeredShortcuts.size} global shortcuts`);
    } catch (error) {
      logger.error('Failed to register shortcuts:', error);
    }
  }

  /**
   * Register a single shortcut
   */
  registerShortcut(accelerator, callback) {
    try {
      const success = globalShortcut.register(accelerator, callback);
      
      if (success) {
        this.registeredShortcuts.add(accelerator);
        logger.debug(`Registered shortcut: ${accelerator}`);
      } else {
        logger.warn(`Failed to register shortcut: ${accelerator}`);
      }
    } catch (error) {
      logger.error(`Error registering shortcut ${accelerator}:`, error);
    }
  }

  /**
   * Unregister all shortcuts
   */
  unregisterAllShortcuts() {
    try {
      globalShortcut.unregisterAll();
      this.registeredShortcuts.clear();
      logger.info('Unregistered all global shortcuts');
    } catch (error) {
      logger.error('Error unregistering shortcuts:', error);
    }
  }

  /**
   * Unregister a specific shortcut
   */
  unregisterShortcut(accelerator) {
    try {
      globalShortcut.unregister(accelerator);
      this.registeredShortcuts.delete(accelerator);
      logger.debug(`Unregistered shortcut: ${accelerator}`);
    } catch (error) {
      logger.error(`Error unregistering shortcut ${accelerator}:`, error);
    }
  }

  /**
   * Check if a shortcut is registered
   */
  isShortcutRegistered(accelerator) {
    return this.registeredShortcuts.has(accelerator);
  }

  /**
   * Get list of registered shortcuts
   */
  getRegisteredShortcuts() {
    return Array.from(this.registeredShortcuts);
  }
}

module.exports = ShortcutManager;
