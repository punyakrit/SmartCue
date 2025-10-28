# SmartCue

[![GitHub](https://img.shields.io/github/license/punyakrit/SmartCue)](https://github.com/punyakrit/SmartCue/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/punyakrit/SmartCue)](https://github.com/punyakrit/SmartCue/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/punyakrit/SmartCue)](https://github.com/punyakrit/SmartCue/network)
[![Platform](https://img.shields.io/badge/platform-macOS%20(Apple%20Silicon)-blue)](https://github.com/punyakrit/SmartCue)

A minimalist desktop AI assistant with always-on-top floating window, designed exclusively for Apple Silicon Macs.

## Features

- 🤖 **AI Assistant** - Intelligent AI-powered assistance always at your fingertips
- 🪟 **Always-on-top floating window** - Stays visible above all other applications
- 🕵️ **Incognito mode** - Hide from screen sharing with kernel-level protection
- ⌨️ **Global keyboard shortcuts** - Control the app without clicking
- 🖥️ **Desktop following** - Automatically follows you across desktops/spaces
- 💾 **Auto-save conversations** - Automatically saves AI conversations to local files
- 🎨 **Minimalist UI** - Clean, pill-shaped interface that doesn't distract

## Architecture

The codebase is structured using a clean, modular architecture with separation of concerns:

```
src/
├── config/
│   └── appConfig.js          # Centralized configuration
├── utils/
│   └── logger.js             # Logging utility
├── services/
│   ├── WindowManager.js      # Window operations and state
│   ├── ShortcutManager.js    # Global keyboard shortcuts
│   ├── DesktopFollower.js    # Desktop following logic
│   ├── MenuManager.js        # Application menu
│   └── IPCManager.js         # Inter-process communication
└── App.js                    # Main application orchestrator

electron.js                   # Main entry point
public/
├── index.html               # UI structure
├── styles.css               # Styling
└── app.js                   # Renderer process logic
```

## Services Overview

### WindowManager
- Handles window creation, positioning, and state management
- Manages incognito mode and visibility toggles
- Provides window movement functionality

### ShortcutManager
- Registers and manages global keyboard shortcuts
- Handles shortcut conflicts and cleanup
- Provides shortcut status and debugging

### DesktopFollower
- Monitors desktop/space changes
- Automatically repositions window to current desktop
- Ensures window stays on top of full-screen applications

### MenuManager
- Creates and manages application menu
- Handles menu item updates and interactions
- Provides help and about dialogs

### IPCManager
- Manages communication between main and renderer processes
- Handles AI conversation saving/loading operations
- Provides system information and utilities

## Configuration

All app settings are centralized in `src/config/appConfig.js`:

- Window dimensions and behavior
- Desktop following intervals and thresholds
- Keyboard shortcuts
- AI assistant configuration
- File paths and logging settings

## System Requirements

### Required Hardware
- **Apple Silicon Mac** (M1, M2, M3, or newer)
- **Intel Macs are NOT supported**

### Required Software
- **macOS 11.0 (Big Sur) or later**
- **Node.js 16+**
- **npm or yarn**

### Why Apple Silicon Only?
This AI assistant is optimized specifically for Apple Silicon architecture to provide:
- Better performance and battery life for AI processing
- Native ARM64 optimizations for faster AI responses
- Enhanced security features for AI conversations
- Improved kernel-level functionality for seamless operation

### Installation
```bash
npm install
```

### System Check
Before running the app, verify your system meets the requirements:
```bash
npm run check
```

### Running
```bash
npm start
```

### Building
```bash
npm run build
```

## Keyboard Shortcuts

- `Cmd+B` - Toggle incognito mode
- `Cmd+\` - Show/hide application
- `Cmd+Left/Right/Up/Down` - Move window

## Features in Detail

### Incognito Mode
When enabled, the app becomes invisible to screen sharing applications using:
- `setContentProtection(true)` - Kernel-level screen capture protection
- `setAlwaysOnTop(false)` - Remove from always-on-top layer
- `setSkipTaskbar(true)` - Hide from dock/taskbar
- Reduced opacity for visual indication

### Desktop Following
The app automatically detects when you switch desktops/spaces and:
- Monitors mouse movement patterns
- Listens to display change events
- Repositions window to current desktop
- Ensures visibility above full-screen applications

### Window Management
- Pill-shaped floating interface for AI assistant
- Smooth movement with boundary constraints
- Manual movement mode with timeout
- Always-on-top with proper layering

## Error Handling

Comprehensive error handling throughout:
- Service-level error catching and logging
- Graceful degradation for failed operations
- Detailed logging with different levels
- Process-level exception handling

## Logging

Structured logging system with:
- Timestamped messages
- Different log levels (info, warn, error, debug)
- Specialized logging for app features
- Configurable debug mode

## Contributing

1. Follow the modular architecture
2. Add proper error handling
3. Include comprehensive logging
4. Update configuration as needed
5. Test on macOS for full compatibility

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

If you encounter any issues or have questions, please file an issue on [GitHub](https://github.com/punyakrit/SmartCue/issues).

## Repository

🔗 **[View on GitHub](https://github.com/punyakrit/SmartCue)**

⭐ **Star the repository** if you find SmartCue useful!