/**
 * IPC Manager Service
 * Handles Inter-Process Communication between main and renderer processes
 */

const { ipcMain } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class IPCManager {
  constructor(windowManager) {
    this.windowManager = windowManager;
    this.notesDirectory = path.join(process.cwd(), 'notes');
    this.setupIPCHandlers();
  }

  /**
   * Setup all IPC handlers
   */
  setupIPCHandlers() {
    this.setupNoteHandlers();
    this.setupWindowHandlers();
    this.setupSystemHandlers();
    logger.info('IPC handlers registered');
  }

  /**
   * Setup note-related IPC handlers
   */
  setupNoteHandlers() {
    // Save note
    ipcMain.handle('save-note', async (event, noteData) => {
      try {
        await this.ensureNotesDirectory();
        const filename = this.generateFilename();
        const filepath = path.join(this.notesDirectory, filename);
        
        await fs.writeFile(filepath, JSON.stringify(noteData, null, 2));
        logger.success(`Note saved: ${filename}`);
        
        return { success: true, filename };
      } catch (error) {
        logger.error('Failed to save note:', error);
        return { success: false, error: error.message };
      }
    });

    // Load note
    ipcMain.handle('load-note', async (event, filename) => {
      try {
        const filepath = path.join(this.notesDirectory, filename);
        const data = await fs.readFile(filepath, 'utf8');
        const noteData = JSON.parse(data);
        
        logger.debug(`Note loaded: ${filename}`);
        return { success: true, data: noteData };
      } catch (error) {
        logger.error('Failed to load note:', error);
        return { success: false, error: error.message };
      }
    });

    // List notes
    ipcMain.handle('list-notes', async () => {
      try {
        await this.ensureNotesDirectory();
        const files = await fs.readdir(this.notesDirectory);
        const noteFiles = files.filter(file => file.endsWith('.json'));
        
        logger.debug(`Found ${noteFiles.length} notes`);
        return { success: true, files: noteFiles };
      } catch (error) {
        logger.error('Failed to list notes:', error);
        return { success: false, error: error.message };
      }
    });

    // Delete note
    ipcMain.handle('delete-note', async (event, filename) => {
      try {
        const filepath = path.join(this.notesDirectory, filename);
        await fs.unlink(filepath);
        
        logger.success(`Note deleted: ${filename}`);
        return { success: true };
      } catch (error) {
        logger.error('Failed to delete note:', error);
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Setup window-related IPC handlers
   */
  setupWindowHandlers() {
    // Get window state
    ipcMain.handle('get-window-state', () => {
      return this.windowManager.getWindowState();
    });

    // Toggle incognito mode
    ipcMain.handle('toggle-incognito', () => {
      this.windowManager.toggleIncognitoMode();
      return { success: true };
    });

    // Toggle visibility
    ipcMain.handle('toggle-visibility', () => {
      this.windowManager.toggleVisibility();
      return { success: true };
    });

    // Move window
    ipcMain.handle('move-window', (event, direction) => {
      this.windowManager.moveWindow(direction);
      return { success: true };
    });
  }

  /**
   * Setup system-related IPC handlers
   */
  setupSystemHandlers() {
    // Get app info
    ipcMain.handle('get-app-info', () => {
      return {
        version: process.env.npm_package_version || '1.0.0',
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        electronVersion: process.versions.electron
      };
    });

    // Get system info
    ipcMain.handle('get-system-info', () => {
      const { screen } = require('electron');
      const displays = screen.getAllDisplays();
      const primaryDisplay = screen.getPrimaryDisplay();
      
      return {
        displays: displays.map(display => ({
          id: display.id,
          bounds: display.bounds,
          workArea: display.workArea,
          scaleFactor: display.scaleFactor,
          rotation: display.rotation,
          internal: display.internal
        })),
        primaryDisplay: {
          id: primaryDisplay.id,
          bounds: primaryDisplay.bounds,
          workArea: primaryDisplay.workArea,
          scaleFactor: primaryDisplay.scaleFactor
        }
      };
    });

    // Ping (for connection testing)
    ipcMain.handle('ping', () => {
      return { success: true, timestamp: Date.now() };
    });
  }

  /**
   * Ensure notes directory exists
   */
  async ensureNotesDirectory() {
    try {
      await fs.access(this.notesDirectory);
    } catch (error) {
      await fs.mkdir(this.notesDirectory, { recursive: true });
      logger.info('Created notes directory');
    }
  }

  /**
   * Generate filename for note
   */
  generateFilename() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    return `note-${timestamp}.json`;
  }

  /**
   * Get notes directory path
   */
  getNotesDirectory() {
    return this.notesDirectory;
  }

  /**
   * Set notes directory path
   */
  setNotesDirectory(directory) {
    this.notesDirectory = directory;
    logger.info(`Notes directory changed to: ${directory}`);
  }
}

module.exports = IPCManager;
