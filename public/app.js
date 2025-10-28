const { ipcRenderer } = require('electron');

class InterviewNotesApp {
  constructor() {
    this.notes = '';
    this.isVisible = true;
    this.isRecording = false;
    this.isScreenCapturing = false;
    this.isAudioRecording = false;
    this.isIncognitoMode = true; // Default to incognito mode
    this.currentSection = 'Introduction';
    this.interviewStartTime = null;
    this.lastSaved = null;
    this.saveTimeout = null;
    this.mediaRecorder = null;
    this.screenStream = null;
    this.audioStream = null;
    this.settingsWindow = null; // Track settings window

    this.interviewSections = [
      'Introduction',
      'Technical Questions',
      'Behavioral Questions',
      'Company Culture',
      'Compensation Discussion',
      'Questions from Candidate',
      'Next Steps',
      'Closing'
    ];

    this.init();
  }

  init() {
    this.loadNotes();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.setupElectronEvents();
  }

  setupEventListeners() {
    // Settings button functionality
    const settingsBtn = document.getElementById('settings-btn');
    console.log('Settings button found:', settingsBtn);

    // Open settings in new window
    if (settingsBtn) {
      // Add visual feedback
      settingsBtn.addEventListener('mousedown', () => {
        settingsBtn.style.transform = 'scale(0.95)';
      });
      
      settingsBtn.addEventListener('mouseup', () => {
        settingsBtn.style.transform = 'scale(1)';
      });
      
      settingsBtn.addEventListener('click', (e) => {
        console.log('Settings button clicked!');
        e.preventDefault();
        e.stopPropagation();
        
        // Add visual feedback
        settingsBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        setTimeout(() => {
          settingsBtn.style.background = 'transparent';
        }, 150);
        
        this.openSettingsWindow();
      });
    } else {
      console.error('Settings button not found!');
    }
  }

  openSettingsWindow() {
    console.log('openSettingsWindow called');
    
    // Check if settings window is already open
    if (this.settingsWindow && !this.settingsWindow.closed) {
      console.log('Settings window already open, focusing...');
      this.settingsWindow.focus();
      return;
    }
    
    // Check if we're in Electron environment
    if (typeof require !== 'undefined' && require('electron')) {
      console.log('Running in Electron environment');
      // In Electron, open settings in a new window
      const { ipcRenderer } = require('electron');
      ipcRenderer.send('open-settings-window');
    } else {
      console.log('Running in browser environment');
      
      // Try multiple approaches
      this.tryOpenSettings();
    }
  }

  tryOpenSettings() {
    // First, let's test if we can access the file
    console.log('Current location:', window.location.href);
    console.log('Current directory:', window.location.pathname);
    
    // Test if the file exists by trying to fetch it
    fetch('settings.html')
      .then(response => {
        console.log('File fetch response:', response.status);
        if (response.ok) {
          console.log('File exists and is accessible');
          this.openSettingsWindow();
        } else {
          console.error('File not accessible:', response.status);
          this.showFileError();
        }
      })
      .catch(error => {
        console.error('Error fetching file:', error);
        this.showFileError();
      });
  }

  openSettingsWindow() {
    const approaches = [
      () => {
        console.log('Approach 1: Basic window.open with kernel protection');
        const win = window.open('settings.html', '_blank');
        if (win) {
          this.settingsWindow = win;
          // Enable kernel protection for settings window
          this.enableSettingsProtection(win);
          // Set up window close detection
          const checkClosed = setInterval(() => {
            if (win.closed) {
              this.settingsWindow = null;
              clearInterval(checkClosed);
            }
          }, 1000);
        }
        return win;
      },
      () => {
        console.log('Approach 2: Window with features and kernel protection');
        const win = window.open('settings.html', 'SmartCue_Settings', 'width=1000,height=700');
        if (win) {
          this.settingsWindow = win;
          // Enable kernel protection for settings window
          this.enableSettingsProtection(win);
          // Set up window close detection
          const checkClosed = setInterval(() => {
            if (win.closed) {
              this.settingsWindow = null;
              clearInterval(checkClosed);
            }
          }, 1000);
        }
        return win;
      },
      () => {
        console.log('Approach 3: Create link element');
        const link = document.createElement('a');
        link.href = 'settings.html';
        link.target = '_blank';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true; // Assume success
      },
      () => {
        console.log('Approach 4: Navigate in same window');
        if (confirm('Open settings in the same window?')) {
          window.location.href = 'settings.html';
          return true;
        }
        return false;
      }
    ];

    for (let i = 0; i < approaches.length; i++) {
      try {
        console.log(`Trying approach ${i + 1}`);
        const result = approaches[i]();
        
        if (result && result !== false) {
          console.log(`Approach ${i + 1} succeeded`);
          if (result.focus) {
            result.focus();
          }
          return;
        }
      } catch (error) {
        console.error(`Approach ${i + 1} failed:`, error);
      }
    }
    
    console.error('All approaches failed');
    alert('Unable to open settings. Please check if popups are blocked or try opening settings-test.html directly.');
  }

  enableSettingsProtection(settingsWindow) {
    // Enable kernel-level protection for settings window
    console.log('Enabling kernel-level protection for settings window...');
    
    try {
      // Check if we're in Electron environment
      if (typeof require !== 'undefined' && require('electron')) {
        const { ipcRenderer } = require('electron');
        
        // Request kernel-level protection for settings window
        ipcRenderer.invoke('enable-kernel-protection', {
          windowType: 'settings',
          protectionLevel: 'kernel',
          windowId: settingsWindow.name || 'settings'
        }).then(result => {
          if (result.success) {
            console.log('✅ Kernel-level protection enabled for settings window');
          } else {
            console.warn('⚠️ Could not enable kernel protection for settings:', result.message);
          }
        }).catch(error => {
          console.error('❌ Error enabling kernel protection for settings:', error);
        });
      } else {
        console.log('Browser environment - settings will use fallback protection');
      }
    } catch (error) {
      console.error('Error enabling settings protection:', error);
    }
  }

  showFileError() {
    alert('Settings file not found or not accessible. Please make sure you are running this from a web server (not file:// protocol).\n\nTry opening index.html through a local server like:\n- python3 -m http.server 8000\n- npx serve .\n- or any other local server');
  }


  setupKeyboardShortcuts() {
    // All keyboard shortcuts removed - will be handled by command shortcuts
    // Only keep essential functionality
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });
  }

  setupElectronEvents() {
    // Listen for incognito mode changes from main process
    if (ipcRenderer) {
      ipcRenderer.on('incognito-toggled', (event, data) => {
        this.isIncognitoMode = data.enabled;
        this.updateUI();
      });
    }
  }

  async loadNotes() {
    if (ipcRenderer) {
      try {
        const result = await ipcRenderer.invoke('load-notes');
        if (result.success) {
          this.notes = result.content;
          document.getElementById('notes-textarea').value = this.notes;
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    } else {
      // Fallback for development
      const savedNotes = localStorage.getItem('interview-notes');
      if (savedNotes) {
        this.notes = savedNotes;
        document.getElementById('notes-textarea').value = this.notes;
      }
    }
  }

  async saveNotes() {
    if (!this.notes.trim()) return;

    if (ipcRenderer) {
      try {
        const result = await ipcRenderer.invoke('save-notes', this.notes);
        if (result.success) {
          this.lastSaved = new Date().toLocaleTimeString();
          this.updateSaveIndicator();
        }
      } catch (error) {
        console.error('Error saving notes:', error);
      }
    } else {
      // Fallback for development
      localStorage.setItem('interview-notes', this.notes);
      this.lastSaved = new Date().toLocaleTimeString();
      this.updateSaveIndicator();
    }
  }

  autoSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveNotes();
    }, 1000);
  }

  updateSaveIndicator() {
    const saveIndicator = document.getElementById('save-indicator');
    if (this.lastSaved) {
      saveIndicator.textContent = `Saved ${this.lastSaved}`;
      saveIndicator.style.display = 'inline-block';
    }
  }

  newInterview() {
    const now = new Date();
    const timestamp = now.toLocaleString();
    const newInterview = `# Interview Notes - ${timestamp}\n\n## Introduction\n\n`;
    
    this.notes = newInterview;
    this.interviewStartTime = now;
    this.currentSection = 'Introduction';
    this.isRecording = true;
    
    // Auto-start screen and audio capture
    this.startScreenCapture();
    this.startAudioRecording();
    
    document.getElementById('notes-textarea').value = this.notes;
    this.updateUI();
    this.autoSave();
  }

  toggleRecording() {
    this.isRecording = !this.isRecording;
    if (this.isRecording && !this.interviewStartTime) {
      this.interviewStartTime = new Date();
    }
    this.updateUI();
  }

  nextSection() {
    const currentIndex = this.interviewSections.indexOf(this.currentSection);
    const nextIndex = (currentIndex + 1) % this.interviewSections.length;
    const nextSectionName = this.interviewSections[nextIndex];
    
    const timestamp = new Date().toLocaleTimeString();
    const sectionHeader = `\n\n## ${nextSectionName}\n\n`;
    
    this.notes += sectionHeader;
    this.currentSection = nextSectionName;
    
    document.getElementById('notes-textarea').value = this.notes;
    this.updateUI();
    this.autoSave();
  }

  addTimestamp() {
    const timestamp = new Date().toLocaleTimeString();
    const timeNote = `\n[${timestamp}] `;
    
    this.notes += timeNote;
    document.getElementById('notes-textarea').value = this.notes;
    this.autoSave();
  }

  clearNotes() {
    this.notes = '';
    document.getElementById('notes-textarea').value = '';
    this.autoSave();
  }

  hide() {
    this.isVisible = false;
    document.getElementById('app').style.display = 'none';
    document.getElementById('app-hidden').style.display = 'flex';
  }

  show() {
    this.isVisible = true;
    document.getElementById('app').style.display = 'flex';
    document.getElementById('app-hidden').style.display = 'none';
    document.getElementById('notes-textarea').focus();
  }

  async toggleScreenCapture() {
    if (this.isScreenCapturing) {
      this.stopScreenCapture();
    } else {
      await this.startScreenCapture();
    }
  }

  async startScreenCapture() {
    try {
      // Request screen recording permissions first
      const permissionResult = await ipcRenderer.invoke('request-screen-permissions');
      if (!permissionResult.hasPermission) {
        alert('Screen recording permission is required. Please grant permission in System Preferences.');
        return;
      }

      // Get screen sources
      const sourcesResult = await ipcRenderer.invoke('get-screen-sources');
      if (!sourcesResult.success || sourcesResult.sources.length === 0) {
        alert('No screen sources available');
        return;
      }

      // Use the first screen source
      const screenSource = sourcesResult.sources[0];
      
      // Create screen stream
      this.screenStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: screenSource.id,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080
          }
        }
      });

      this.isScreenCapturing = true;
      this.updateUI();
      console.log('Screen capture started');
    } catch (error) {
      console.error('Error starting screen capture:', error);
      alert('Failed to start screen capture: ' + error.message);
    }
  }

  stopScreenCapture() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
    this.isScreenCapturing = false;
    this.updateUI();
    console.log('Screen capture stopped');
  }

  async toggleAudioRecording() {
    if (this.isAudioRecording) {
      this.stopAudioRecording();
    } else {
      await this.startAudioRecording();
    }
  }

  async startAudioRecording() {
    try {
      // Request microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        },
        video: false
      });

      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Here you could save the audio data
          console.log('Audio data received:', event.data.size, 'bytes');
        }
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isAudioRecording = true;
      this.updateUI();
      console.log('Audio recording started');
    } catch (error) {
      console.error('Error starting audio recording:', error);
      alert('Failed to start audio recording: ' + error.message);
    }
  }

  stopAudioRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    this.mediaRecorder = null;
    this.isAudioRecording = false;
    this.updateUI();
    console.log('Audio recording stopped');
  }

  showMenu() {
    // For now, just show a simple alert
    alert('Menu functionality coming soon!');
  }

  goHome() {
    // Reset to home state
    this.currentSection = 'Introduction';
    this.updateUI();
  }

  sendMessage() {
    // Process the current notes/input
    const textarea = document.getElementById('notes-textarea');
    const message = textarea.value.trim();
    
    if (message) {
      // Add timestamp and process
      const timestamp = new Date().toLocaleTimeString();
      const processedMessage = `[${timestamp}] ${message}\n\n`;
      
      this.notes += processedMessage;
      textarea.value = '';
      this.autoSave();
    }
  }

  showSettings() {
    // For now, just show a simple alert
    alert('Settings panel coming soon!\n\nCurrent features:\n• Screen capture\n• Audio recording\n• Auto-save notes\n• Keyboard shortcuts');
  }

  async toggleIncognito() {
    try {
      if (!this.isIncognitoMode) {
        // Configure kernel-level screen sharing
        const configResult = await ipcRenderer.invoke('configure-kernel-screen-share');
        
        if (configResult.success) {
          // Enable incognito mode
          const toggleResult = await ipcRenderer.invoke('toggle-incognito-mode', true);
          
          if (toggleResult.success) {
            this.isIncognitoMode = true;
            this.updateUI();
            
            // Show success message
            alert(`✅ ${toggleResult.message}\n\n🔒 Kernel-level protection enabled\n📱 App UI will be hidden from screen capture\n🎯 Perfect for private interviews`);
          } else {
            alert(`❌ Failed to enable incognito mode: ${toggleResult.message}`);
          }
        } else {
          alert(`❌ Failed to configure kernel-level screen sharing: ${configResult.message}`);
        }
      } else {
        // Disable incognito mode
        const toggleResult = await ipcRenderer.invoke('toggle-incognito-mode', false);
        
        if (toggleResult.success) {
          this.isIncognitoMode = false;
          this.updateUI();
          
          // Show success message
          alert(`✅ ${toggleResult.message}\n\n🔓 Normal mode enabled\n📱 App UI will be visible in screen capture`);
        } else {
          alert(`❌ Failed to disable incognito mode: ${toggleResult.message}`);
        }
      }
    } catch (error) {
      console.error('Error toggling incognito mode:', error);
      alert(`❌ Error: ${error.message}`);
    }
  }

  updateUI() {
    const startBtn = document.getElementById('start-listening-btn');
    const startText = document.getElementById('start-text');
    const actionIcon = startBtn.querySelector('i');
    const incognitoBtn = document.getElementById('incognito-btn');
    const privateBadge = document.getElementById('private-badge');
    
    if (this.isRecording) {
      startBtn.classList.add('recording');
      startText.textContent = 'Stop';
      if (actionIcon) {
        actionIcon.className = 'fas fa-stop';
      }
    } else {
      startBtn.classList.remove('recording');
      startText.textContent = 'Start';
      if (actionIcon) {
        actionIcon.className = 'fas fa-play';
      }
    }

    // Always show incognito mode as active by default
    if (this.isIncognitoMode) {
      incognitoBtn.classList.add('active');
      privateBadge.classList.add('active');
      privateBadge.textContent = 'Private';
    } else {
      incognitoBtn.classList.remove('active');
      privateBadge.classList.remove('active');
      privateBadge.textContent = 'Public';
    }
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app...');
  const app = new InterviewNotesApp();
  console.log('App initialized:', app);
  
  // Test if settings button exists after initialization
  setTimeout(() => {
    const settingsBtn = document.getElementById('settings-btn');
    console.log('Settings button after init:', settingsBtn);
    if (settingsBtn) {
      console.log('Settings button is clickable:', settingsBtn.style.pointerEvents);
    }
  }, 100);
});
