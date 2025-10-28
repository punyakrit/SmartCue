/**
 * Window Manager Service
 * Handles all window-related operations and state management
 */

const { BrowserWindow, screen, app } = require('electron');
const path = require('path');
const APP_CONFIG = require('../config/appConfig');
const logger = require('../utils/logger');

class WindowManager {
  constructor(shortcutManager = null) {
    this.mainWindow = null;
    this.settingsWindow = null;
    this.isIncognitoMode = false;
    this.isManualMovement = false;
    this.manualMovementTimeout = null;
    this.lastKnownPosition = { x: 0, y: 50 }; // Will be updated when window is created
    this.shortcutManager = shortcutManager;
    this.previousFocusedWindow = null;
  }

  /**
   * Create the main application window
   */
  createWindow() {
    try {
      // Calculate center position at top of screen
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.bounds;
      const windowWidth = APP_CONFIG.WINDOW.WIDTH;
      const windowHeight = APP_CONFIG.WINDOW.HEIGHT;
      
      // Center horizontally, position at top with some margin
      const x = Math.round((screenWidth - windowWidth) / 2);
      const y = 50; // 50px from top of screen

      this.mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        x: x,
        y: y,
        alwaysOnTop: APP_CONFIG.WINDOW.ALWAYS_ON_TOP,
        transparent: APP_CONFIG.WINDOW.TRANSPARENT,
        frame: APP_CONFIG.WINDOW.FRAME,
        resizable: APP_CONFIG.WINDOW.RESIZABLE,
        skipTaskbar: APP_CONFIG.WINDOW.SKIP_TASKBAR,
        hasShadow: APP_CONFIG.WINDOW.HAS_SHADOW,
        vibrancy: APP_CONFIG.WINDOW.VIBRANCY,
        focusable: false,
        acceptFirstMouse: false,
        show: false, // Don't show immediately
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true,
          webSecurity: false,
          experimentalFeatures: true
        }
      });

      this.setupWindowEvents();
      this.loadContent();
      this.applyMacOSOptimizations();

      // Update last known position
      this.lastKnownPosition = { x, y };

      logger.success(`Main window created successfully at top center: ${x}, ${y}`);
      return this.mainWindow;
    } catch (error) {
      logger.error('Failed to create window:', error);
      throw error;
    }
  }

  /**
   * Setup window event listeners
   */
  setupWindowEvents() {
    if (!this.mainWindow) return;

    // Handle close event - on macOS, hide instead of close
    this.mainWindow.on('close', (event) => {
      if (process.platform === 'darwin') {
        // Prevent the default close behavior
        event.preventDefault();
        // Hide the window instead
        this.hideWindow();
        logger.info('Window hidden (Command+W pressed)');
      } else {
        // On other platforms, allow normal close behavior
        this.mainWindow = null;
        logger.info('Main window closed');
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
      logger.info('Main window closed');
    });

    this.mainWindow.on('focus', () => {
      logger.debug('Window focused');
    });

    this.mainWindow.on('blur', () => {
      logger.debug('Window blurred - may be switching desktops');
    });

    this.mainWindow.on('show', () => {
      logger.debug('Window shown');
    });
  }

  /**
   * Load window content
   */
  loadContent() {
    if (!this.mainWindow) return;

    const htmlPath = path.join(__dirname, '../../', APP_CONFIG.PATHS.HTML);
    this.mainWindow.loadFile(htmlPath);
    
    this.mainWindow.webContents.on('did-finish-load', () => {
      logger.success('Successfully loaded the app');
    });
  }

  /**
   * Apply macOS-specific optimizations
   */
  applyMacOSOptimizations() {
    if (!this.mainWindow || process.platform !== 'darwin') return;

    try {
      // Kernel-level always on top
      this.mainWindow.setAlwaysOnTop(true, 'screen-saver');
      
      // Make visible on all workspaces including full-screen
      this.mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      
      logger.debug('Applied macOS optimizations');
    } catch (error) {
      logger.error('Failed to apply macOS optimizations:', error);
    }
  }

  /**
   * Toggle incognito mode
   */
  toggleIncognitoMode() {
    if (!this.mainWindow) return;

    try {
      this.isIncognitoMode = !this.isIncognitoMode;

      if (this.isIncognitoMode) {
        this.enableIncognitoMode();
      } else {
        this.disableIncognitoMode();
      }

      // Notify renderer process
      if (this.mainWindow.webContents) {
        this.mainWindow.webContents.send('incognito-toggled', { enabled: this.isIncognitoMode });
      }

      logger.incognito(this.isIncognitoMode);
    } catch (error) {
      logger.error('Error toggling incognito mode:', error);
    }
  }

  /**
   * Enable incognito mode
   */
  enableIncognitoMode() {
    if (!this.mainWindow) return;

    this.mainWindow.setContentProtection(APP_CONFIG.INCOGNITO.CONTENT_PROTECTION);
    this.mainWindow.setAlwaysOnTop(APP_CONFIG.INCOGNITO.ALWAYS_ON_TOP);
    this.mainWindow.setSkipTaskbar(APP_CONFIG.INCOGNITO.SKIP_TASKBAR);
    this.mainWindow.setOpacity(APP_CONFIG.INCOGNITO.OPACITY);
    this.mainWindow.setFocusable(false);
    
    // Apply same protection to settings window if it exists
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.enableIncognitoModeForSettings();
    }
  }

  /**
   * Disable incognito mode
   */
  disableIncognitoMode() {
    if (!this.mainWindow) return;

    this.mainWindow.setContentProtection(false);
    this.mainWindow.setAlwaysOnTop(true, 'screen-saver');
    this.mainWindow.setSkipTaskbar(false);
    this.mainWindow.setOpacity(1.0);
    this.mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.mainWindow.setFocusable(false);
    
    // Apply same settings to settings window if it exists
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.disableIncognitoModeForSettings();
    }
  }

  /**
   * Toggle application visibility
   */
  toggleVisibility() {
    if (!this.mainWindow) return;

    try {
      const isVisible = this.mainWindow.isVisible();

      if (isVisible) {
        this.hideWindow();
      } else {
        this.showWindowWithoutFocus();
      }

      // Notify renderer process
      if (this.mainWindow.webContents) {
        this.mainWindow.webContents.send('visibility-toggled', { visible: !isVisible });
      }

      logger.visibility(!isVisible);
    } catch (error) {
      logger.error('Error toggling visibility:', error);
    }
  }

  /**
   * Hide window completely
   */
  hideWindow() {
    if (!this.mainWindow) return;

    this.mainWindow.setContentProtection(true);
    this.mainWindow.setAlwaysOnTop(false);
    this.mainWindow.setSkipTaskbar(true);
    this.mainWindow.setOpacity(0);
    this.mainWindow.hide();

    // Disable all shortcuts when hiding
    if (this.shortcutManager) {
      this.shortcutManager.disableAllShortcuts();
    }
  }

  /**
   * Show window
   */
  showWindow() {
    if (!this.mainWindow) return;

    // Apply settings based on current incognito state
    if (this.isIncognitoMode) {
      this.enableIncognitoMode();
    } else {
      this.mainWindow.setContentProtection(false);
      this.mainWindow.setAlwaysOnTop(true, 'screen-saver');
      this.mainWindow.setSkipTaskbar(false);
      this.mainWindow.setOpacity(1.0);
    }

    this.mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.mainWindow.show();
    // Don't focus or move to top - keep it invisible to user interaction
    this.mainWindow.setFocusable(false);

    // Re-enable all shortcuts when showing
    if (this.shortcutManager) {
      this.shortcutManager.enableAllShortcuts();
    }
  }

  /**
   * Move window in specified direction
   */
  moveWindow(direction) {
    if (!this.mainWindow) return;

    try {
      this.setManualMovementMode();

      const currentPosition = this.mainWindow.getPosition();
      const currentBounds = this.mainWindow.getBounds();
      const primaryDisplay = screen.getPrimaryDisplay();
      const desktopBounds = primaryDisplay.bounds;

      // Validate bounds
      if (!this.validateBounds(desktopBounds, currentBounds)) {
        return;
      }

      const newPosition = this.calculateNewPosition(
        direction, 
        currentPosition, 
        desktopBounds, 
        currentBounds
      );

      if (!this.validatePosition(newPosition)) {
        return;
      }

      this.mainWindow.setPosition(newPosition.x, newPosition.y);
      this.mainWindow.setAlwaysOnTop(true, 'screen-saver');
      this.mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      
      // Show window without stealing focus
      this.showWindowWithoutFocus();

      this.lastKnownPosition = newPosition;
      logger.windowMove(direction, `${newPosition.x} ${newPosition.y}`);

    } catch (error) {
      logger.error('Error moving window:', error);
    }
  }

  /**
   * Set manual movement mode with timeout
   */
  setManualMovementMode() {
    this.isManualMovement = true;
    
    if (this.manualMovementTimeout) {
      clearTimeout(this.manualMovementTimeout);
    }
    
    this.manualMovementTimeout = setTimeout(() => {
      this.isManualMovement = false;
      logger.debug('Manual movement timeout - re-enabling desktop following');
    }, APP_CONFIG.DESKTOP_FOLLOWING.MANUAL_MOVEMENT_TIMEOUT);
  }

  /**
   * Validate desktop bounds and window dimensions
   */
  validateBounds(desktopBounds, currentBounds) {
    if (!desktopBounds || desktopBounds.x === undefined || desktopBounds.y === undefined || 
        !desktopBounds.width || !desktopBounds.height) {
      logger.error('Invalid desktop bounds:', desktopBounds);
      return false;
    }

    if (!currentBounds.width || !currentBounds.height || 
        currentBounds.width <= 0 || currentBounds.height <= 0) {
      logger.error('Invalid window dimensions:', { 
        width: currentBounds.width, 
        height: currentBounds.height 
      });
      return false;
    }

    return true;
  }

  /**
   * Calculate new position based on direction
   */
  calculateNewPosition(direction, currentPosition, desktopBounds, currentBounds) {
    const stepSize = APP_CONFIG.DESKTOP_FOLLOWING.STEP_SIZE;
    let newX = currentPosition[0];
    let newY = currentPosition[1];

    switch (direction) {
      case 'left':
        newX = Math.max(desktopBounds.x, currentPosition[0] - stepSize);
        break;
      case 'right':
        newX = Math.min(
          desktopBounds.x + desktopBounds.width - currentBounds.width,
          currentPosition[0] + stepSize
        );
        break;
      case 'up':
        newY = Math.max(desktopBounds.y, currentPosition[1] - stepSize);
        break;
      case 'down':
        newY = Math.min(
          desktopBounds.y + desktopBounds.height - currentBounds.height,
          currentPosition[1] + stepSize
        );
        break;
    }

    // Ensure window stays within desktop bounds
    newX = Math.max(desktopBounds.x, Math.min(
      desktopBounds.x + desktopBounds.width - currentBounds.width,
      newX
    ));
    newY = Math.max(desktopBounds.y, Math.min(
      desktopBounds.y + desktopBounds.height - currentBounds.height,
      newY
    ));

    return {
      x: Math.round(newX),
      y: Math.round(newY)
    };
  }

  /**
   * Validate position values
   */
  validatePosition(position) {
    if (isNaN(position.x) || isNaN(position.y) || position.x < 0 || position.y < 0) {
      logger.error('Invalid position values:', position);
      return false;
    }
    return true;
  }

  /**
   * Get current window state
   */
  getWindowState() {
    if (!this.mainWindow) return null;

    return {
      isVisible: this.mainWindow.isVisible(),
      isFocused: this.mainWindow.isFocused(),
      position: this.mainWindow.getPosition(),
      bounds: this.mainWindow.getBounds(),
      isIncognitoMode: this.isIncognitoMode,
      isManualMovement: this.isManualMovement
    };
  }

  /**
   * Check if window exists and is not destroyed
   */
  isWindowValid() {
    return this.mainWindow && !this.mainWindow.isDestroyed();
  }

  /**
   * Store the currently focused window
   */
  storeFocusedWindow() {
    try {
      // Get the currently focused window
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow && focusedWindow !== this.mainWindow) {
        this.previousFocusedWindow = focusedWindow;
        logger.debug('Stored focused window for restoration');
      }
    } catch (error) {
      logger.error('Error storing focused window:', error);
    }
  }

  /**
   * Restore focus to the previously focused window
   */
  restoreFocusedWindow() {
    try {
      if (this.previousFocusedWindow && !this.previousFocusedWindow.isDestroyed()) {
        // Use setTimeout to ensure the window operations complete first
        setTimeout(() => {
          this.previousFocusedWindow.focus();
          logger.debug('Restored focus to previous window');
        }, 10);
      }
    } catch (error) {
      logger.error('Error restoring focused window:', error);
    }
  }

  /**
   * Show window without stealing focus
   */
  showWindowWithoutFocus() {
    if (!this.mainWindow) return;

    // Store current focus before showing
    this.storeFocusedWindow();

    // Apply settings based on current incognito state
    if (this.isIncognitoMode) {
      this.enableIncognitoMode();
    } else {
      this.mainWindow.setContentProtection(false);
      this.mainWindow.setAlwaysOnTop(true, 'screen-saver');
      this.mainWindow.setSkipTaskbar(false);
      this.mainWindow.setOpacity(1.0);
    }

    // Set window properties to prevent focus stealing
    this.mainWindow.setFocusable(false);
    this.mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    
    // Show window without activating it
    this.mainWindow.showInactive();
    
    // Force blur immediately
    this.mainWindow.blur();
    
    // Immediately restore focus to previous window
    this.restoreFocusedWindow();

    // Re-enable all shortcuts when showing
    if (this.shortcutManager) {
      this.shortcutManager.enableAllShortcuts();
    }
  }

  /**
   * Create settings window with kernel-level protection
   */
  createSettingsWindow() {
    try {
      // Check if settings window already exists
      if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
        this.settingsWindow.focus();
        logger.info('Settings window already open, focusing existing window');
        return this.settingsWindow;
      }

      // Calculate position for settings window
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.bounds;
      const windowWidth = 1000;
      const windowHeight = 700;
      
      // Center the settings window
      const x = Math.round((screenWidth - windowWidth) / 2);
      const y = Math.round((screenHeight - windowHeight) / 2);

      // Create settings window
      this.settingsWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        x: x,
        y: y,
        alwaysOnTop: false, // Will be set by incognito mode
        transparent: false,
        frame: true,
        resizable: true,
        skipTaskbar: false, // Will be set by incognito mode
        hasShadow: true,
        focusable: true,
        acceptFirstMouse: true,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: false,
          webSecurity: true
        },
        title: 'Settings - SmartCue',
        show: false
      });

      // Load settings HTML
      const settingsPath = path.join(__dirname, '../../public/settings.html');
      this.settingsWindow.loadFile(settingsPath);

      // Apply incognito mode settings by default (since main app is in incognito mode)
      this.settingsWindow.setContentProtection(APP_CONFIG.INCOGNITO.CONTENT_PROTECTION);
      this.settingsWindow.setAlwaysOnTop(APP_CONFIG.INCOGNITO.ALWAYS_ON_TOP);
      this.settingsWindow.setSkipTaskbar(APP_CONFIG.INCOGNITO.SKIP_TASKBAR);
      this.settingsWindow.setOpacity(APP_CONFIG.INCOGNITO.OPACITY);
      this.settingsWindow.setFocusable(false);

      // Show window when ready
      this.settingsWindow.once('ready-to-show', () => {
        this.settingsWindow.show();
        logger.success('Settings window created and shown');
      });

      // Handle window closed
      this.settingsWindow.on('closed', () => {
        this.settingsWindow = null;
        logger.info('Settings window closed');
      });

      // Apply additional kernel-level protection
      this.settingsWindow.webContents.once('did-finish-load', () => {
        this.settingsWindow.webContents.executeJavaScript(`
          console.log('🔒 Settings window loaded with kernel-level protection');
          
          // Add additional CSS protection
          const style = document.createElement('style');
          style.textContent = \`
            /* Enhanced kernel-level protection */
            * {
              -webkit-backface-visibility: hidden !important;
              backface-visibility: hidden !important;
              -webkit-transform: translateZ(0) !important;
              transform: translateZ(0) !important;
            }
            
            .settings-container {
              -webkit-backface-visibility: hidden !important;
              backface-visibility: hidden !important;
              -webkit-transform: translateZ(0) !important;
              transform: translateZ(0) !important;
              will-change: transform;
            }
          \`;
          document.head.appendChild(style);
          
          console.log('✅ Additional kernel-level protection applied to settings');
        `);
      });

      return this.settingsWindow;

    } catch (error) {
      logger.error('Failed to create settings window:', error);
      throw error;
    }
  }

  /**
   * Enable incognito mode for settings window
   */
  enableIncognitoModeForSettings() {
    if (!this.settingsWindow || this.settingsWindow.isDestroyed()) return;

    try {
      // Apply the same incognito settings as main window
      this.settingsWindow.setContentProtection(APP_CONFIG.INCOGNITO.CONTENT_PROTECTION);
      this.settingsWindow.setAlwaysOnTop(APP_CONFIG.INCOGNITO.ALWAYS_ON_TOP);
      this.settingsWindow.setSkipTaskbar(APP_CONFIG.INCOGNITO.SKIP_TASKBAR);
      this.settingsWindow.setOpacity(APP_CONFIG.INCOGNITO.OPACITY);
      this.settingsWindow.setFocusable(false);
      
      logger.success('🔒 Settings window incognito mode ENABLED - Hidden from screen capture');
    } catch (error) {
      logger.error('Error enabling incognito mode for settings:', error);
    }
  }

  /**
   * Disable incognito mode for settings window
   */
  disableIncognitoModeForSettings() {
    if (!this.settingsWindow || this.settingsWindow.isDestroyed()) return;

    try {
      // Apply normal visibility settings
      this.settingsWindow.setContentProtection(false);
      this.settingsWindow.setAlwaysOnTop(true, 'screen-saver');
      this.settingsWindow.setSkipTaskbar(false);
      this.settingsWindow.setOpacity(1.0);
      this.settingsWindow.setFocusable(true);
      
      logger.info('🔓 Settings window incognito mode DISABLED - Visible in screen capture');
    } catch (error) {
      logger.error('Error disabling incognito mode for settings:', error);
    }
  }
}

module.exports = WindowManager;
