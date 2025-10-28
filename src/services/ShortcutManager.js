/**
 * Shortcut Manager Service
 * Handles all global keyboard shortcuts
 */

const { globalShortcut } = require('electron');
const APP_CONFIG = require('../config/appConfig');
const logger = require('../utils/logger');

class ShortcutManager {
  constructor() {
    this.registeredShortcuts = new Set();
    this.shortcutCallbacks = new Map();
    this.shortcutsDisabled = false;
  }

  /**
   * Register all global shortcuts
   */
  registerAllShortcuts(windowManager) {
    try {
      this.registerShortcut(APP_CONFIG.SHORTCUTS.TOGGLE_INCOGNITO, () => {
        if (windowManager.isWindowValid()) {
          windowManager.toggleIncognitoMode();
        }
      });

      this.registerShortcut(APP_CONFIG.SHORTCUTS.TOGGLE_VISIBILITY, () => {
        if (windowManager.isWindowValid()) {
          windowManager.toggleVisibility();
        }
      });

      this.registerShortcut(APP_CONFIG.SHORTCUTS.MOVE_LEFT, () => {
        if (windowManager.isWindowValid()) {
          windowManager.moveWindow('left');
        }
      });

      this.registerShortcut(APP_CONFIG.SHORTCUTS.MOVE_RIGHT, () => {
        if (windowManager.isWindowValid()) {
          windowManager.moveWindow('right');
        }
      });

      this.registerShortcut(APP_CONFIG.SHORTCUTS.MOVE_UP, () => {
        if (windowManager.isWindowValid()) {
          windowManager.moveWindow('up');
        }
      });

      this.registerShortcut(APP_CONFIG.SHORTCUTS.MOVE_DOWN, () => {
        if (windowManager.isWindowValid()) {
          windowManager.moveWindow('down');
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
      // Store the callback for later re-registration
      this.shortcutCallbacks.set(accelerator, callback);
      
      // Only register if shortcuts are not disabled
      if (!this.shortcutsDisabled) {
        const success = globalShortcut.register(accelerator, callback);
        
        if (success) {
          this.registeredShortcuts.add(accelerator);
          logger.debug(`Registered shortcut: ${accelerator}`);
        } else {
          logger.warn(`Failed to register shortcut: ${accelerator}`);
        }
      } else {
        logger.debug(`Shortcut ${accelerator} stored but not registered (shortcuts disabled)`);
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

  /**
   * Disable all shortcuts except visibility toggle
   */
  disableAllShortcuts() {
    try {
      if (this.shortcutsDisabled) {
        logger.debug('Shortcuts already disabled');
        return;
      }

      // Keep visibility toggle active, disable others
      const visibilityShortcut = APP_CONFIG.SHORTCUTS.TOGGLE_VISIBILITY;
      const visibilityCallback = this.shortcutCallbacks.get(visibilityShortcut);
      
      // Unregister all shortcuts
      globalShortcut.unregisterAll();
      this.registeredShortcuts.clear();
      
      // Re-register only the visibility toggle
      if (visibilityCallback) {
        const success = globalShortcut.register(visibilityShortcut, visibilityCallback);
        if (success) {
          this.registeredShortcuts.add(visibilityShortcut);
          logger.debug(`Kept visibility shortcut active: ${visibilityShortcut}`);
        }
      }
      
      this.shortcutsDisabled = true;
      logger.info('All shortcuts disabled except visibility toggle');
    } catch (error) {
      logger.error('Error disabling shortcuts:', error);
    }
  }

  /**
   * Enable all shortcuts (re-register them)
   */
  enableAllShortcuts() {
    try {
      if (!this.shortcutsDisabled) {
        logger.debug('Shortcuts already enabled');
        return;
      }

      this.shortcutsDisabled = false;
      
      // Unregister all first to clean up
      globalShortcut.unregisterAll();
      this.registeredShortcuts.clear();
      
      // Re-register all stored shortcuts
      for (const [accelerator, callback] of this.shortcutCallbacks) {
        const success = globalShortcut.register(accelerator, callback);
        
        if (success) {
          this.registeredShortcuts.add(accelerator);
          logger.debug(`Re-registered shortcut: ${accelerator}`);
        } else {
          logger.warn(`Failed to re-register shortcut: ${accelerator}`);
        }
      }
      
      logger.info(`Re-enabled ${this.registeredShortcuts.size} shortcuts`);
    } catch (error) {
      logger.error('Error enabling shortcuts:', error);
    }
  }

  /**
   * Check if shortcuts are currently disabled
   */
  areShortcutsDisabled() {
    return this.shortcutsDisabled;
  }
}

module.exports = ShortcutManager;
