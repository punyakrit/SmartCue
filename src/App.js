/**
 * Main AI Assistant Application Class
 * Orchestrates all services and manages application lifecycle
 */

const { app } = require('electron');
const WindowManager = require('./services/WindowManager');
const ShortcutManager = require('./services/ShortcutManager');
const DesktopFollower = require('./services/DesktopFollower');
const MenuManager = require('./services/MenuManager');
const IPCManager = require('./services/IPCManager');
const logger = require('./utils/logger');

class AIAssistantApp {
  constructor() {
    this.windowManager = new WindowManager();
    this.shortcutManager = new ShortcutManager(this.windowManager);
    this.desktopFollower = new DesktopFollower(this.windowManager);
    this.menuManager = new MenuManager(this.windowManager);
    this.ipcManager = new IPCManager(this.windowManager);
    
    this.isReady = false;
    this.setupAppEvents();
  }

  /**
   * Setup application event listeners
   */
  setupAppEvents() {
    // App ready event
    app.whenReady().then(() => {
      this.initialize();
    });

    // Window all closed event
    app.on('window-all-closed', () => {
      this.handleWindowAllClosed();
    });

    // App activate event (macOS)
    app.on('activate', () => {
      this.handleActivate();
    });

    // App before quit event
    app.on('before-quit', () => {
      this.handleBeforeQuit();
    });

    // App will quit event
    app.on('will-quit', () => {
      this.handleWillQuit();
    });
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      logger.info('Initializing AI Assistant App...');

      // Check system requirements
      if (!this.checkSystemRequirements()) {
        return;
      }

      // Create main window
      this.windowManager.createWindow();
      
      // Create menu
      this.menuManager.createMenu();
      
      // Register shortcuts
      this.shortcutManager.registerAllShortcuts();
      
      // Start desktop following
      this.desktopFollower.startDetection();
      
      this.isReady = true;
      logger.success('AI Assistant App initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize application:', error);
      app.quit();
    }
  }

  /**
   * Check system requirements
   */
  checkSystemRequirements() {
    // Check if running on macOS
    if (process.platform !== 'darwin') {
      this.showErrorDialog(
        'Unsupported Platform',
        'This application is designed exclusively for macOS.\n\nPlease run this app on a Mac computer.',
        'Platform not supported'
      );
      return false;
    }

    // Check if running on Apple Silicon
    const arch = process.arch;
    const isAppleSilicon = arch === 'arm64';
    
    if (!isAppleSilicon) {
      this.showErrorDialog(
        'Unsupported Architecture',
        'This application requires Apple Silicon (M1, M2, M3, or newer) chips.\n\nYour Mac appears to be using an Intel processor, which is not supported.\n\nPlease run this app on an Apple Silicon Mac.',
        'Architecture not supported'
      );
      return false;
    }

    // Check macOS version (require macOS 11.0+ for Apple Silicon)
    const os = require('os');
    const release = os.release();
    const majorVersion = parseInt(release.split('.')[0]);
    const minorVersion = parseInt(release.split('.')[1]);
    
    // macOS 11.0+ (Big Sur) is required for Apple Silicon
    if (majorVersion < 20) { // macOS 11.0 = Darwin 20.x
      this.showErrorDialog(
        'Unsupported macOS Version',
        'This application requires macOS 11.0 (Big Sur) or later.\n\nYour macOS version is too old for Apple Silicon support.\n\nPlease update your Mac to macOS 11.0 or later.',
        'macOS version not supported'
      );
      return false;
    }

    logger.info(`✅ System requirements met - Apple Silicon (${arch}) on macOS ${majorVersion}.${minorVersion}`);
    return true;
  }

  /**
   * Show error dialog and quit
   */
  showErrorDialog(title, message, detail) {
    const { dialog } = require('electron');
    
    logger.error(`${title}: ${message}`);
    
    dialog.showErrorBox(title, `${message}\n\n${detail}`);
    
    // Quit after showing the dialog
    setTimeout(() => {
      app.quit();
    }, 1000);
  }

  /**
   * Handle window all closed event
   */
  handleWindowAllClosed() {
    if (process.platform !== 'darwin') {
      this.cleanup();
      app.quit();
    }
  }

  /**
   * Handle app activate event (macOS)
   */
  handleActivate() {
    if (!this.windowManager.isWindowValid()) {
      this.initialize();
    } else {
      this.windowManager.showWindow();
    }
  }

  /**
   * Handle before quit event
   */
  handleBeforeQuit() {
    logger.info('Application is about to quit');
    this.cleanup();
  }

  /**
   * Handle will quit event
   */
  handleWillQuit() {
    logger.info('Application will quit');
    this.cleanup();
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    try {
      logger.info('Cleaning up resources...');

      // Stop desktop following
      this.desktopFollower.stopDetection();

      // Unregister shortcuts
      this.shortcutManager.unregisterAllShortcuts();

      // Close window
      if (this.windowManager.isWindowValid()) {
        this.windowManager.mainWindow.close();
      }

      logger.success('Cleanup completed');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }

  /**
   * Get application status
   */
  getStatus() {
    return {
      isReady: this.isReady,
      windowState: this.windowManager.getWindowState(),
      desktopFollowerStatus: this.desktopFollower.getStatus(),
      registeredShortcuts: this.shortcutManager.getRegisteredShortcuts(),
      notesDirectory: this.ipcManager.getNotesDirectory()
    };
  }

  /**
   * Restart the application
   */
  restart() {
    logger.info('Restarting application...');
    this.cleanup();
    setTimeout(() => {
      this.initialize();
    }, 1000);
  }

  /**
   * Get service instances (for debugging)
   */
  getServices() {
    return {
      windowManager: this.windowManager,
      shortcutManager: this.shortcutManager,
      desktopFollower: this.desktopFollower,
      menuManager: this.menuManager,
      ipcManager: this.ipcManager
    };
  }
}

module.exports = AIAssistantApp;
