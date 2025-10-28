/**
 * Menu Manager Service
 * Handles application menu creation and management
 */

const { Menu, MenuItem } = require('electron');
const APP_CONFIG = require('../config/appConfig');
const logger = require('../utils/logger');

class MenuManager {
  constructor(windowManager) {
    this.windowManager = windowManager;
    this.menu = null;
  }

  /**
   * Create application menu
   */
  createMenu() {
    try {
      const template = this.getMenuTemplate();
      this.menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(this.menu);
      logger.success('Application menu created');
    } catch (error) {
      logger.error('Failed to create menu:', error);
    }
  }

  /**
   * Get menu template
   */
  getMenuTemplate() {
    const isMac = process.platform === 'darwin';
    
    const template = [
      // macOS specific app menu
      ...(isMac ? [{
        label: 'AI Assistant App',
        submenu: [
          {
            label: 'About AI Assistant App',
            role: 'about'
          },
          { type: 'separator' },
          {
            label: 'Hide AI Assistant App',
            accelerator: 'Command+H',
            role: 'hide'
          },
          {
            label: 'Hide Others',
            accelerator: 'Command+Shift+H',
            role: 'hideothers'
          },
          {
            label: 'Show All',
            role: 'unhide'
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: () => {
              this.windowManager.mainWindow?.close();
            }
          }
        ]
      }] : []),

      // File menu
      {
        label: 'File',
        submenu: [
          {
            label: 'New Conversation',
            accelerator: 'Command+N',
            click: () => {
              this.windowManager.mainWindow?.webContents.send('new-conversation');
            }
          },
          {
            label: 'Save Conversation',
            accelerator: 'Command+S',
            click: () => {
              this.windowManager.mainWindow?.webContents.send('save-conversation');
            }
          },
          { type: 'separator' },
          {
            label: isMac ? 'Quit' : 'Exit',
            accelerator: isMac ? 'Command+Q' : 'Ctrl+Q',
            click: () => {
              this.windowManager.mainWindow?.close();
            }
          }
        ]
      },

      // View menu
      {
        label: 'View',
        submenu: [
          {
            label: 'Toggle Incognito Mode',
            accelerator: APP_CONFIG.SHORTCUTS.TOGGLE_INCOGNITO,
            click: () => {
              this.windowManager.toggleIncognitoMode();
            }
          },
          {
            label: 'Show/Hide Application',
            accelerator: APP_CONFIG.SHORTCUTS.TOGGLE_VISIBILITY,
            click: () => {
              this.windowManager.toggleVisibility();
            }
          },
          { type: 'separator' },
          {
            label: 'Move Left',
            accelerator: APP_CONFIG.SHORTCUTS.MOVE_LEFT,
            click: () => {
              this.windowManager.moveWindow('left');
            }
          },
          {
            label: 'Move Right',
            accelerator: APP_CONFIG.SHORTCUTS.MOVE_RIGHT,
            click: () => {
              this.windowManager.moveWindow('right');
            }
          },
          {
            label: 'Move Up',
            accelerator: APP_CONFIG.SHORTCUTS.MOVE_UP,
            click: () => {
              this.windowManager.moveWindow('up');
            }
          },
          {
            label: 'Move Down',
            accelerator: APP_CONFIG.SHORTCUTS.MOVE_DOWN,
            click: () => {
              this.windowManager.moveWindow('down');
            }
          },
          { type: 'separator' },
          {
            label: 'Reload',
            accelerator: 'Command+R',
            role: 'reload'
          },
          {
            label: 'Force Reload',
            accelerator: 'Command+Shift+R',
            role: 'forceReload'
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: isMac ? 'Command+Alt+I' : 'Ctrl+Shift+I',
            role: 'toggleDevTools'
          }
        ]
      },

      // Window menu (macOS specific)
      ...(isMac ? [{
        label: 'Window',
        submenu: [
          {
            label: 'Close',
            accelerator: 'Command+W',
            role: 'close'
          },
          {
            label: 'Minimize',
            accelerator: 'Command+M',
            role: 'minimize'
          },
          {
            label: 'Zoom',
            role: 'zoom'
          },
          { type: 'separator' },
          {
            label: 'Bring All to Front',
            role: 'front'
          }
        ]
      }] : []),

      // Help menu
      {
        label: 'Help',
        submenu: [
          {
            label: 'Keyboard Shortcuts',
            click: () => {
              this.showKeyboardShortcuts();
            }
          },
          { type: 'separator' },
          {
            label: 'About',
            click: () => {
              this.showAbout();
            }
          }
        ]
      }
    ];

    return template;
  }

  /**
   * Show keyboard shortcuts help
   */
  showKeyboardShortcuts() {
    const shortcuts = [
      `${APP_CONFIG.SHORTCUTS.TOGGLE_INCOGNITO} - Toggle Incognito Mode`,
      `${APP_CONFIG.SHORTCUTS.TOGGLE_VISIBILITY} - Show/Hide Application`,
      `${APP_CONFIG.SHORTCUTS.MOVE_LEFT} - Move Window Left`,
      `${APP_CONFIG.SHORTCUTS.MOVE_RIGHT} - Move Window Right`,
      `${APP_CONFIG.SHORTCUTS.MOVE_UP} - Move Window Up`,
      `${APP_CONFIG.SHORTCUTS.MOVE_DOWN} - Move Window Down`
    ];

    logger.info('Keyboard Shortcuts:');
    shortcuts.forEach(shortcut => logger.info(`  ${shortcut}`));
  }

  /**
   * Show about dialog
   */
  showAbout() {
    logger.info('AI Assistant App - A minimalist desktop AI assistant');
  }

  /**
   * Update menu item state
   */
  updateMenuItem(label, enabled) {
    if (!this.menu) return;

    const menuItem = this.findMenuItem(this.menu, label);
    if (menuItem) {
      menuItem.enabled = enabled;
    }
  }

  /**
   * Find menu item by label
   */
  findMenuItem(menu, label) {
    for (const item of menu.items) {
      if (item.label === label) {
        return item;
      }
      if (item.submenu) {
        const found = this.findMenuItem(item.submenu, label);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Get menu instance
   */
  getMenu() {
    return this.menu;
  }
}

module.exports = MenuManager;
