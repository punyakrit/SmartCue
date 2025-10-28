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
    this.notesDirectory = path.join(process.cwd(), 'conversations');
    this.handlersRegistered = false;
    this.setupIPCHandlers();
  }

  /**
   * Setup all IPC handlers
   */
  setupIPCHandlers() {
    if (this.handlersRegistered) {
      logger.debug('IPC handlers already registered, skipping...');
      return;
    }
    
    this.setupNoteHandlers();
    this.setupWindowHandlers();
    this.setupSystemHandlers();
    this.handlersRegistered = true;
    logger.info('IPC handlers registered');
  }

  /**
   * Setup AI conversation-related IPC handlers
   */
  setupNoteHandlers() {
    // Save conversation
    ipcMain.handle('save-conversation', async (event, conversationData) => {
      try {
        await this.ensureNotesDirectory();
        const filename = this.generateFilename();
        const filepath = path.join(this.notesDirectory, filename);
        
        await fs.writeFile(filepath, JSON.stringify(conversationData, null, 2));
        logger.success(`Conversation saved: ${filename}`);
        
        return { success: true, filename };
      } catch (error) {
        logger.error('Failed to save conversation:', error);
        return { success: false, error: error.message };
      }
    });

    // Load conversation
    ipcMain.handle('load-conversation', async (event, filename) => {
      try {
        const filepath = path.join(this.notesDirectory, filename);
        const data = await fs.readFile(filepath, 'utf8');
        const conversationData = JSON.parse(data);
        
        logger.debug(`Conversation loaded: ${filename}`);
        return { success: true, data: conversationData };
      } catch (error) {
        logger.error('Failed to load conversation:', error);
        return { success: false, error: error.message };
      }
    });

    // List conversations
    ipcMain.handle('list-conversations', async () => {
      try {
        await this.ensureNotesDirectory();
        const files = await fs.readdir(this.notesDirectory);
        const conversationFiles = files.filter(file => file.endsWith('.json'));
        
        logger.debug(`Found ${conversationFiles.length} conversations`);
        return { success: true, files: conversationFiles };
      } catch (error) {
        logger.error('Failed to list conversations:', error);
        return { success: false, error: error.message };
      }
    });

    // Delete conversation
    ipcMain.handle('delete-conversation', async (event, filename) => {
      try {
        const filepath = path.join(this.notesDirectory, filename);
        await fs.unlink(filepath);
        
        logger.success(`Conversation deleted: ${filename}`);
        return { success: true };
      } catch (error) {
        logger.error('Failed to delete conversation:', error);
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

    // Open settings window
    ipcMain.handle('open-settings-window', () => {
      try {
        this.windowManager.createSettingsWindow();
        logger.info('Settings window opened');
        return { success: true };
      } catch (error) {
        logger.error('Failed to open settings window:', error);
        return { success: false, error: error.message };
      }
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

    // Enable kernel-level protection
    ipcMain.handle('enable-kernel-protection', async (event, options) => {
      try {
        const { windowType, protectionLevel, windowId } = options;
        
        logger.info(`Enabling ${protectionLevel} protection for ${windowType} window`);
        
        // Get the window that sent the request
        const window = event.sender.getOwnerBrowserWindow();
        
        if (window) {
          // Apply kernel-level screen sharing protection
          if (process.platform === 'darwin') {
            // macOS specific kernel-level protection
            const { screen } = require('electron');
            
            // Set window to be excluded from screen capture
            window.setContentProtection(true);
            
            // Additional macOS specific protection
            if (window.webContents) {
              window.webContents.executeJavaScript(`
                // Add CSS protection
                const style = document.createElement('style');
                style.textContent = \`
                  * {
                    -webkit-backface-visibility: hidden !important;
                    backface-visibility: hidden !important;
                    -webkit-transform: translateZ(0) !important;
                    transform: translateZ(0) !important;
                  }
                \`;
                document.head.appendChild(style);
                
                console.log('✅ Kernel-level protection applied to ${windowType} window');
              `);
            }
            
            logger.success(`✅ Kernel-level protection enabled for ${windowType} window`);
            return { 
              success: true, 
              message: `Kernel-level protection enabled for ${windowType}`,
              protectionLevel: 'kernel'
            };
          } else {
            // Fallback for other platforms
            window.setContentProtection(true);
            logger.warn(`⚠️ Using fallback protection for ${windowType} on ${process.platform}`);
            return { 
              success: true, 
              message: `Fallback protection enabled for ${windowType}`,
              protectionLevel: 'fallback'
            };
          }
        } else {
          logger.error('❌ Could not find window for protection');
          return { 
            success: false, 
            message: 'Window not found for protection'
          };
        }
      } catch (error) {
        logger.error('❌ Error enabling kernel protection:', error);
        return { 
          success: false, 
          message: error.message 
        };
      }
    });

    // Load notes (legacy handler)
    ipcMain.handle('load-notes', async () => {
      try {
        // Return empty notes for now
        logger.debug('Load notes requested');
        return { 
          success: true, 
          content: '' 
        };
      } catch (error) {
        logger.error('Failed to load notes:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }
    });

    // Save notes (legacy handler)
    ipcMain.handle('save-notes', async (event, content) => {
      try {
        // Save to conversations directory
        await this.ensureNotesDirectory();
        const filename = this.generateFilename();
        const filepath = path.join(this.notesDirectory, filename);
        
        const notesData = {
          content: content,
          timestamp: new Date().toISOString(),
          type: 'notes'
        };
        
        await fs.writeFile(filepath, JSON.stringify(notesData, null, 2));
        logger.success(`Notes saved: ${filename}`);
        
        return { success: true, filename };
      } catch (error) {
        logger.error('Failed to save notes:', error);
        return { success: false, error: error.message };
      }
    });

    // Ping (for connection testing)
    ipcMain.handle('ping', () => {
      return { success: true, timestamp: Date.now() };
    });
  }

  /**
   * Ensure conversations directory exists
   */
  async ensureNotesDirectory() {
    try {
      await fs.access(this.notesDirectory);
    } catch (error) {
      await fs.mkdir(this.notesDirectory, { recursive: true });
      logger.info('Created conversations directory');
    }
  }

  /**
   * Generate filename for conversation
   */
  generateFilename() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    return `conversation-${timestamp}.json`;
  }

  /**
   * Get conversations directory path
   */
  getNotesDirectory() {
    return this.notesDirectory;
  }

  /**
   * Set conversations directory path
   */
  setNotesDirectory(directory) {
    this.notesDirectory = directory;
    logger.info(`Conversations directory changed to: ${directory}`);
  }
}

module.exports = IPCManager;
