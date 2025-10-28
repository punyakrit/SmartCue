class SettingsManager {
  constructor() {
    this.settings = this.loadSettings();
    this.init();
    this.enableKernelProtection();
  }

  init() {
    this.setupEventListeners();
    this.loadSettingsValues();
    this.setupRangeSliders();
  }

  enableKernelProtection() {
    // Enable kernel-level screen sharing protection
    console.log('Enabling kernel-level screen sharing protection for settings...');
    
    try {
      // Check if we're in Electron environment
      if (typeof require !== 'undefined' && require('electron')) {
        const { ipcRenderer } = require('electron');
        
        // Request kernel-level protection for settings window
        ipcRenderer.invoke('enable-kernel-protection', {
          windowType: 'settings',
          protectionLevel: 'kernel'
        }).then(result => {
          if (result.success) {
            console.log('✅ Kernel-level protection enabled for settings window');
            this.showProtectionStatus('Settings protected from screen capture', 'success');
          } else {
            console.warn('⚠️ Could not enable kernel protection:', result.message);
            this.showProtectionStatus('Using fallback protection', 'warning');
          }
        }).catch(error => {
          console.error('❌ Error enabling kernel protection:', error);
          this.showProtectionStatus('Using fallback protection', 'warning');
        });
      } else {
        // Browser fallback - use CSS and DOM manipulation
        this.enableFallbackProtection();
      }
    } catch (error) {
      console.error('Error in kernel protection setup:', error);
      this.enableFallbackProtection();
    }
  }

  enableFallbackProtection() {
    console.log('Using fallback screen capture protection...');
    
    // Add additional CSS protection
    const style = document.createElement('style');
    style.textContent = `
      /* Enhanced screen capture protection */
      .settings-container {
        -webkit-backface-visibility: hidden !important;
        backface-visibility: hidden !important;
        -webkit-transform: translateZ(0) !important;
        transform: translateZ(0) !important;
        will-change: transform;
      }
      
      /* Hide sensitive content from screen capture */
      .settings-sidebar,
      .settings-main {
        -webkit-backface-visibility: hidden !important;
        backface-visibility: hidden !important;
        -webkit-transform: translateZ(0) !important;
        transform: translateZ(0) !important;
      }
      
      /* Additional protection for form elements */
      input, select, button, .setting-item {
        -webkit-backface-visibility: hidden !important;
        backface-visibility: hidden !important;
      }
    `;
    document.head.appendChild(style);
    
    // Add protection indicator
    this.showProtectionStatus('Fallback protection active', 'info');
  }

  setupEventListeners() {

    // Sidebar navigation
    const navItems = document.querySelectorAll('.nav-item');
    const settingsSections = document.querySelectorAll('.settings-section');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const section = item.getAttribute('data-section');
        
        // Update active nav item
        navItems.forEach(ni => ni.classList.remove('active'));
        item.classList.add('active');
        
        // Update active settings section
        settingsSections.forEach(sec => sec.classList.remove('active'));
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
          targetSection.classList.add('active');
        }
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.saveSettings();
      }
    });

    // Browse button for storage location
    const browseBtn = document.getElementById('browse-storage');
    if (browseBtn) {
      browseBtn.addEventListener('click', () => {
        this.browseStorageLocation();
      });
    }

    // Auto-save settings on change
    this.setupAutoSave();
  }

  setupAutoSave() {
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        this.saveSettings();
      });
    });
  }

  setupRangeSliders() {
    const rangeSliders = document.querySelectorAll('.modern-range');
    rangeSliders.forEach(slider => {
      const valueDisplay = slider.parentElement.querySelector('.range-value');
      
      slider.addEventListener('input', () => {
        if (slider.id === 'mic-sensitivity') {
          valueDisplay.textContent = `${slider.value}%`;
        } else if (slider.id === 'auto-save-interval') {
          valueDisplay.textContent = `${slider.value}s`;
        } else if (slider.id === 'font-size') {
          valueDisplay.textContent = `${slider.value}px`;
        }
      });
    });
  }

  loadSettings() {
    // Default settings
    const defaultSettings = {
      general: {
        autoStart: false,
        theme: 'system',
        incognitoMode: true
      },
      audio: {
        micSensitivity: 50,
        audioQuality: 'medium',
        noiseReduction: true
      },
      privacy: {
        dataCollection: false,
        analytics: false,
        autoDelete: 'never'
      },
      appearance: {
        colorScheme: 'auto',
        fontSize: 14
      },
      advanced: {
        debugMode: false,
        autoSaveInterval: 30,
        storageLocation: '~/Documents/SmartCue'
      }
    };

    // Try to load from localStorage, fallback to defaults
    try {
      const saved = localStorage.getItem('smartcue-settings');
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }

    return defaultSettings;
  }

  loadSettingsValues() {
    // General settings
    this.setCheckbox('auto-start', this.settings.general.autoStart);
    this.setSelect('theme-select', this.settings.general.theme);
    this.setCheckbox('incognito-mode', this.settings.general.incognitoMode);

    // Audio settings
    this.setRange('mic-sensitivity', this.settings.audio.micSensitivity);
    this.setSelect('audio-quality', this.settings.audio.audioQuality);
    this.setCheckbox('noise-reduction', this.settings.audio.noiseReduction);

    // Privacy settings
    this.setCheckbox('data-collection', this.settings.privacy.dataCollection);
    this.setCheckbox('analytics', this.settings.privacy.analytics);
    this.setSelect('auto-delete', this.settings.privacy.autoDelete);

    // Appearance settings
    this.setSelect('color-scheme', this.settings.appearance.colorScheme);
    this.setRange('font-size', this.settings.appearance.fontSize);

    // Advanced settings
    this.setCheckbox('debug-mode', this.settings.advanced.debugMode);
    this.setRange('auto-save-interval', this.settings.advanced.autoSaveInterval);
    this.setInput('storage-location', this.settings.advanced.storageLocation);
  }

  setCheckbox(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.checked = value;
    }
  }

  setSelect(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.value = value;
    }
  }

  setRange(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.value = value;
      // Update display value
      const valueDisplay = element.parentElement.querySelector('.range-value');
      if (valueDisplay) {
        if (id === 'mic-sensitivity') {
          valueDisplay.textContent = `${value}%`;
        } else if (id === 'auto-save-interval') {
          valueDisplay.textContent = `${value}s`;
        } else if (id === 'font-size') {
          valueDisplay.textContent = `${value}px`;
        }
      }
    }
  }

  setInput(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.value = value;
    }
  }

  saveSettings() {
    // Collect current values
    const newSettings = {
      general: {
        autoStart: document.getElementById('auto-start')?.checked || false,
        theme: document.getElementById('theme-select')?.value || 'system',
        incognitoMode: document.getElementById('incognito-mode')?.checked || true
      },
      audio: {
        micSensitivity: parseInt(document.getElementById('mic-sensitivity')?.value) || 50,
        audioQuality: document.getElementById('audio-quality')?.value || 'medium',
        noiseReduction: document.getElementById('noise-reduction')?.checked || true
      },
      privacy: {
        dataCollection: document.getElementById('data-collection')?.checked || false,
        analytics: document.getElementById('analytics')?.checked || false,
        autoDelete: document.getElementById('auto-delete')?.value || 'never'
      },
      appearance: {
        colorScheme: document.getElementById('color-scheme')?.value || 'auto',
        fontSize: parseInt(document.getElementById('font-size')?.value) || 14
      },
      advanced: {
        debugMode: document.getElementById('debug-mode')?.checked || false,
        autoSaveInterval: parseInt(document.getElementById('auto-save-interval')?.value) || 30,
        storageLocation: document.getElementById('storage-location')?.value || '~/Documents/SmartCue'
      }
    };

    // Save to localStorage
    try {
      localStorage.setItem('smartcue-settings', JSON.stringify(newSettings));
      this.settings = newSettings;
      console.log('Settings saved successfully');
      
      // Show subtle notification
      this.showNotification('Settings saved', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showNotification('Error saving settings', 'error');
    }
  }

  browseStorageLocation() {
    // In a real Electron app, this would open a folder picker
    // For now, we'll just show an alert
    alert('Folder picker would open here in the full Electron app.\n\nFor now, you can manually edit the path in the input field.');
  }


  showProtectionStatus(message, type = 'info') {
    // Create protection status indicator
    const status = document.createElement('div');
    status.className = `protection-status protection-${type}`;
    status.innerHTML = `
      <i class="fas fa-shield-alt"></i>
      <span>${message}</span>
    `;
    
    // Style the status indicator
    Object.assign(status.style, {
      position: 'fixed',
      top: '20px',
      left: '20px',
      padding: '8px 16px',
      borderRadius: '6px',
      color: '#ffffff',
      fontSize: '12px',
      fontWeight: '500',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateX(-100%)',
      transition: 'all 0.3s ease',
      background: type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#2196F3',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: 'monospace'
    });

    // Add to document
    document.body.appendChild(status);

    // Animate in
    setTimeout(() => {
      status.style.opacity = '1';
      status.style.transform = 'translateX(0)';
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      status.style.opacity = '0';
      status.style.transform = 'translateX(-100%)';
      setTimeout(() => {
        if (status.parentNode) {
          status.parentNode.removeChild(status);
        }
      }, 300);
    }, 3000);
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateX(100%)',
      transition: 'all 0.3s ease',
      background: type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'
    });

    // Add to document
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Remove after 2 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SettingsManager();
});