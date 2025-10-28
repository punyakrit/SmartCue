/**
 * Application Configuration
 * Centralized configuration for the meeting notes app
 */

const APP_CONFIG = {
  // Window settings
  WINDOW: {
    WIDTH: 400,
    HEIGHT: 100,
    MIN_WIDTH: 300,
    MIN_HEIGHT: 80,
    ALWAYS_ON_TOP: true,
    TRANSPARENT: true,
    FRAME: false,
    RESIZABLE: false,
    SKIP_TASKBAR: false,
    HAS_SHADOW: false,
    VIBRANCY: 'hud-window'
  },

  // Desktop following settings
  DESKTOP_FOLLOWING: {
    DETECTION_INTERVAL: 1000, // ms
    REPOSITION_COOLDOWN: 2000, // ms
    MANUAL_MOVEMENT_TIMEOUT: 5000, // ms
    STEP_SIZE: 50, // pixels
    POSITION_THRESHOLD: 100, // pixels
    MOUSE_MOVEMENT_THRESHOLD: 500 // pixels
  },

  // Incognito mode settings
  INCOGNITO: {
    OPACITY: 0.8,
    CONTENT_PROTECTION: true,
    SKIP_TASKBAR: true,
    ALWAYS_ON_TOP: false
  },

  // Global shortcuts
  SHORTCUTS: {
    TOGGLE_INCOGNITO: 'Command+B',
    TOGGLE_VISIBILITY: 'Command+\\',
    MOVE_LEFT: 'Command+Left',
    MOVE_RIGHT: 'Command+Right',
    MOVE_UP: 'Command+Up',
    MOVE_DOWN: 'Command+Down'
  },

  // File paths
  PATHS: {
    HTML: 'public/index.html',
    CSS: 'public/styles.css',
    JS: 'public/app.js',
    ICON: 'public/in.png'
  },

  // Logging
  LOGGING: {
    ENABLED: true,
    DEBUG: process.env.NODE_ENV === 'development'
  }
};

module.exports = APP_CONFIG;
