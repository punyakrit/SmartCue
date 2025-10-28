/**
 * Desktop Follower Service
 * Handles automatic desktop following and window positioning
 */

const { screen } = require('electron');
const APP_CONFIG = require('../config/appConfig');
const logger = require('../utils/logger');

class DesktopFollower {
  constructor(windowManager) {
    this.windowManager = windowManager;
    this.detectionInterval = null;
    this.repositionCooldown = false;
    this.lastMousePosition = { x: 0, y: 0 };
    this.lastKnownDesktop = null;
  }

  /**
   * Start desktop following detection
   */
  startDetection() {
    if (this.detectionInterval) {
      this.stopDetection();
    }

    this.detectionInterval = setInterval(() => {
      this.detectDesktopChanges();
    }, APP_CONFIG.DESKTOP_FOLLOWING.DETECTION_INTERVAL);

    this.setupScreenEventListeners();
    logger.info('Started desktop following detection');
  }

  /**
   * Stop desktop following detection
   */
  stopDetection() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
      logger.info('Stopped desktop following detection');
    }
  }

  /**
   * Setup screen event listeners
   */
  setupScreenEventListeners() {
    screen.on('display-added', () => {
      logger.debug('Display added - following to current desktop');
      this.followToCurrentDesktop();
    });

    screen.on('display-removed', () => {
      logger.debug('Display removed - following to current desktop');
      this.followToCurrentDesktop();
    });

    screen.on('display-metrics-changed', () => {
      logger.debug('Display metrics changed - following to current desktop');
      this.followToCurrentDesktop();
    });
  }

  /**
   * Main desktop change detection logic
   */
  detectDesktopChanges() {
    if (!this.windowManager.isWindowValid()) return;

    const windowState = this.windowManager.getWindowState();
    if (!windowState) return;

    // Skip if window is not visible (hidden)
    if (!windowState.isVisible) {
      return;
    }

    // Skip if in manual movement mode
    if (windowState.isManualMovement) {
      return;
    }

    // Check for desktop changes
    if (this.hasDesktopChanged()) {
      this.followToCurrentDesktop();
    }

    // Ensure window stays on top
    this.ensureWindowOnTop();
  }

  /**
   * Check if desktop has changed
   */
  hasDesktopChanged() {
    const currentMousePosition = screen.getCursorScreenPoint();
    const currentDesktop = this.getCurrentDesktop();

    // Check mouse movement
    const mouseMoved = Math.abs(currentMousePosition.x - this.lastMousePosition.x) > 
                      APP_CONFIG.DESKTOP_FOLLOWING.MOUSE_MOVEMENT_THRESHOLD ||
                      Math.abs(currentMousePosition.y - this.lastMousePosition.y) > 
                      APP_CONFIG.DESKTOP_FOLLOWING.MOUSE_MOVEMENT_THRESHOLD;

    // Check desktop change
    const desktopChanged = this.lastKnownDesktop !== currentDesktop;

    if (mouseMoved) {
      this.lastMousePosition = currentMousePosition;
      logger.debug('Desktop change detected via mouse movement', currentMousePosition);
    }

    if (desktopChanged) {
      this.lastKnownDesktop = currentDesktop;
      logger.debug('Desktop change detected - following to current desktop');
    }

    return mouseMoved || desktopChanged;
  }

  /**
   * Get current desktop identifier
   */
  getCurrentDesktop() {
    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();
    
    // Simple desktop identification based on primary display bounds
    return `${primaryDisplay.bounds.x}-${primaryDisplay.bounds.y}-${primaryDisplay.bounds.width}-${primaryDisplay.bounds.height}`;
  }

  /**
   * Follow to current desktop
   */
  followToCurrentDesktop() {
    if (!this.windowManager.isWindowValid()) return;

    // Check if window is visible before moving
    const windowState = this.windowManager.getWindowState();
    if (!windowState || !windowState.isVisible) {
      return;
    }

    // Check cooldown
    if (this.repositionCooldown) {
      return;
    }

    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth } = primaryDisplay.bounds;
      const windowWidth = APP_CONFIG.WINDOW.WIDTH;
      
      // Center horizontally, position at top with some margin
      const targetPosition = { 
        x: Math.round((screenWidth - windowWidth) / 2), 
        y: 50 
      };

      // Apply incognito mode settings if active
      if (this.windowManager.isIncognitoMode) {
        this.windowManager.enableIncognitoMode();
      }

      // Move window to target position
      this.windowManager.mainWindow.setPosition(targetPosition.x, targetPosition.y);
      this.windowManager.mainWindow.setAlwaysOnTop(true, 'screen-saver');
      this.windowManager.mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      this.windowManager.mainWindow.show();
      this.windowManager.mainWindow.focus();
      this.windowManager.mainWindow.moveTop();

      this.windowManager.lastKnownPosition = targetPosition;
      logger.desktopFollowing('moved to', `${targetPosition.x} ${targetPosition.y}`);

      // Set cooldown
      this.setRepositionCooldown();

    } catch (error) {
      logger.error('Error following to current desktop:', error);
    }
  }

  /**
   * Ensure window stays on top
   */
  ensureWindowOnTop() {
    if (!this.windowManager.isWindowValid()) return;

    const windowState = this.windowManager.getWindowState();
    if (!windowState || !windowState.isVisible) return;

    try {
      this.windowManager.mainWindow.setAlwaysOnTop(true, 'screen-saver');
      this.windowManager.mainWindow.moveTop();
      logger.debug('Ensuring window stays on top');
    } catch (error) {
      logger.error('Error ensuring window on top:', error);
    }
  }

  /**
   * Set reposition cooldown
   */
  setRepositionCooldown() {
    this.repositionCooldown = true;
    setTimeout(() => {
      this.repositionCooldown = false;
    }, APP_CONFIG.DESKTOP_FOLLOWING.REPOSITION_COOLDOWN);
  }

  /**
   * Force window to front
   */
  forceToFront() {
    if (!this.windowManager.isWindowValid()) return;

    const windowState = this.windowManager.getWindowState();
    if (!windowState || !windowState.isVisible || windowState.isFocused) return;

    try {
      this.windowManager.mainWindow.setAlwaysOnTop(true, 'screen-saver');
      this.windowManager.mainWindow.show();
      this.windowManager.mainWindow.focus();
      this.windowManager.mainWindow.moveTop();
      logger.debug('Forced window to front');
    } catch (error) {
      logger.error('Error forcing window to front:', error);
    }
  }

  /**
   * Check if detection is running
   */
  isDetectionRunning() {
    return this.detectionInterval !== null;
  }

  /**
   * Get detection status
   */
  getStatus() {
    return {
      isRunning: this.isDetectionRunning(),
      lastMousePosition: this.lastMousePosition,
      lastKnownDesktop: this.lastKnownDesktop,
      repositionCooldown: this.repositionCooldown
    };
  }
}

module.exports = DesktopFollower;
