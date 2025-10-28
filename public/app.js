const { ipcRenderer } = require('electron');

class InterviewNotesApp {
  constructor() {
    this.notes = '';
    this.isVisible = true;
    this.isRecording = false;
    this.isScreenCapturing = false;
    this.isAudioRecording = false;
    this.isIncognitoMode = false;
    this.currentSection = 'Introduction';
    this.interviewStartTime = null;
    this.lastSaved = null;
    this.saveTimeout = null;
    this.mediaRecorder = null;
    this.screenStream = null;
    this.audioStream = null;

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
    const startListeningBtn = document.getElementById('start-listening-btn');
    const menuBtn = document.getElementById('menu-btn');
    const incognitoBtn = document.getElementById('incognito-btn');
    const hideBtn = document.getElementById('hide-btn');
    const showBtn = document.getElementById('show-btn');

    startListeningBtn.addEventListener('click', () => this.toggleRecording());
    menuBtn.addEventListener('click', () => this.showMenu());
    incognitoBtn.addEventListener('click', () => this.toggleIncognito());
    hideBtn.addEventListener('click', () => this.hide());
    showBtn.addEventListener('click', () => this.show());
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      } else if (e.metaKey && e.key === 'n') {
        e.preventDefault();
        this.newInterview();
      } else if (e.metaKey && e.key === 'r') {
        e.preventDefault();
        this.toggleRecording();
      } else if (e.metaKey && e.key === 's') {
        e.preventDefault();
        this.nextSection();
      } else if (e.metaKey && e.key === 't') {
        e.preventDefault();
        this.addTimestamp();
      } else if (e.metaKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        this.toggleScreenCapture();
      } else if (e.metaKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        this.toggleAudioRecording();
      }
    });
  }

  setupElectronEvents() {
    if (ipcRenderer) {
      ipcRenderer.on('new-interview', () => this.newInterview());
      ipcRenderer.on('toggle-recording', () => this.toggleRecording());
      ipcRenderer.on('next-section', () => this.nextSection());
      ipcRenderer.on('add-timestamp', () => this.addTimestamp());
      ipcRenderer.on('clear-notes', () => this.clearNotes());
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
    // Update recording button
    const startBtn = document.getElementById('start-listening-btn');
    const startText = document.getElementById('start-text');
    const incognitoBtn = document.getElementById('incognito-btn');
    
    if (this.isRecording) {
      startBtn.classList.add('recording');
      startText.textContent = 'Stop Listening';
    } else {
      startBtn.classList.remove('recording');
      startText.textContent = 'Start Listening';
    }

    // Update incognito button
    if (this.isIncognitoMode) {
      incognitoBtn.classList.add('active');
      incognitoBtn.title = 'Incognito Mode ON - App UI hidden from screen capture';
    } else {
      incognitoBtn.classList.remove('active');
      incognitoBtn.title = 'Incognito Mode OFF - Click to hide app UI from screen capture';
    }
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new InterviewNotesApp();
});
