# Doppleit Vector

**Repository:** [github.com/CBoon99/vector-dp](https://github.com/CBoon99/vector-dp) · **Live demo:** [doppleit-vector.netlify.app](https://doppleit-vector.netlify.app)

An open-source, **in-browser vector graphics editor** built with **vanilla JavaScript** (no React/Vue). Draw with basic tools, **import** PNG, JPG, WebP, or SVG, optionally **vectorize** images (Sobel edge trace with cell-poster fallback), **paint individual pixels** on bitmap imports, use a **layer list**, zoom/pan on the canvas, and **export** (where wired). Built as a learning project—experimental, not a full replacement for Illustrator or Figma.

### Quick start

| Command | Purpose |
|--------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Local static server (`server.js`, port 3000) |
| `npm run build` | Webpack production build → `dist/` |
| `npm test` | Jest smoke test |
| `npm run lint` | ESLint on core demo files |

**Try the app:** run `npm run dev`, open the URL shown, then **Browse** or drag an image. Default import runs **edge tracing**; if that yields little, **cell poster** fills in. Check **Bitmap only** to keep a raster, then choose **Pixel** and the **HEX** color to edit pixels. See `old-doc/README.md` for optional local legacy files (folder is gitignored except that README).

### SEO & discovery

The app ships with `meta` description/keywords, Open Graph / Twitter tags, `canonical` URL, JSON-LD `WebApplication` schema in `index.html` (with `codeRepository` → **github.com/CBoon99/vector-dp**), and `public/robots.txt` + `public/sitemap.xml` (copied to `dist/` on build). Point the **canonical** and sitemap **loc** to your real host if you deploy somewhere other than Netlify.

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-netlify-badge-id/deploy-status)](https://app.netlify.com/sites/doppleit-vector/deploys)

## 🚀 Live Demo

Try DoppleIt Vector online: [Live Demo](https://doppleit-vector.netlify.app)

## ✨ Features

- **Drawing Tools**
  - Pen Tool
  - Rectangle Tool
  - Circle Tool
  - Polygon Tool
  - Shape Tool
  - Path Editing

- **Layer Management**
  - Layer Groups
  - Layer Properties (Opacity, Blend Modes)
  - Layer Locking
  - Layer Visibility
  - Drag & Drop Reordering

- **Advanced Features**
  - Smart Guides
  - Grid System
  - Rulers
  - Snap to Grid
  - Auto-save
  - Undo/Redo History

- **Export Options**
  - SVG Export
  - PNG Export
  - PDF Export
  - Project Save/Load

- **Mobile Support**
  - Touch Controls
  - Pinch-to-Zoom
  - Mobile-optimized UI
  - Responsive Design

## 🎮 Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|--------------|-----|
| Pen Tool | 1 | 1 |
| Rectangle Tool | 2 | 2 |
| Circle Tool | 3 | 3 |
| Polygon Tool | 4 | 4 |
| Undo | Ctrl + Z | ⌘ + Z |
| Redo | Ctrl + Y | ⌘ + Y |
| Save | Ctrl + S | ⌘ + S |
| Open | Ctrl + O | ⌘ + O |
| Delete | Delete | Delete |
| Select All | Ctrl + A | ⌘ + A |
| Deselect | Esc | Esc |
| Group | Ctrl + G | ⌘ + G |
| Ungroup | Ctrl + Shift + G | ⌘ + Shift + G |
| Lock Layer | Ctrl + L | ⌘ + L |
| Hide Layer | Ctrl + H | ⌘ + H |
| Show Grid | Ctrl + ' | ⌘ + ' |
| Show Rulers | Ctrl + R | ⌘ + R |

## 📱 Mobile Touch Controls

- **Drawing**
  - Single tap: Place point
  - Double tap: Complete shape
  - Long press: Context menu

- **Navigation**
  - Pinch: Zoom in/out
  - Two-finger drag: Pan canvas
  - Three-finger swipe: Undo/Redo

- **Selection**
  - Tap: Select object
  - Double tap: Edit object
  - Long press: Multi-select

## 🗺️ Feature Roadmap

### Version 1 (Current)
- Basic drawing tools
- Layer management
- File export
- Mobile support
- Basic shapes
- Grid system

### Version 2 (Q2 2024)
- Advanced path editing
- Gradient fills
- Pattern fills
- Text tool
- Image import
- Layer effects
- Custom brushes

### Pro Plan (Q3 2024)
- Team collaboration
- Cloud storage
- Version history
- Advanced export options
- Custom tool presets
- Plugin system
- API access

## 📊 Feature Comparison

| Feature | DoppleIt Vector | Adobe Illustrator | Inkscape | Figma |
|---------|----------------|-------------------|----------|-------|
| Free | ✅ | ❌ | ✅ | ✅ |
| Web-based | ✅ | ❌ | ❌ | ✅ |
| Mobile Support | ✅ | ❌ | ❌ | ✅ |
| Layer Management | ✅ | ✅ | ✅ | ✅ |
| Vector Tools | ✅ | ✅ | ✅ | ✅ |
| Export Options | ✅ | ✅ | ✅ | ✅ |
| Collaboration | Coming Pro | ✅ | ❌ | ✅ |
| Plugin System | Coming Pro | ✅ | ✅ | ✅ |
| Offline Mode | ✅ | ✅ | ✅ | ❌ |

## 📸 Screenshots

![DoppleIt Vector Interface](docs/screenshots/interface.png)
![Layer Management](docs/screenshots/layers.png)
![Mobile View](docs/screenshots/mobile.png)

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/CBoon99/vector-dp.git

# Navigate to the project directory
cd vector-dp

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📞 Support

- GitHub Issues: [Report a bug](https://github.com/CBoon99/vector-dp/issues)
- Email: support@doppleit-vector.com
- Discord: [Join our community](https://discord.gg/doppleit-vector)

# Polygon Tool

A powerful and flexible polygon drawing tool with star shape support, built for vector graphics applications.

## Features

### Basic Drawing
- Create regular polygons with 3-20 sides
- Draw star shapes with customizable ratios
- Support for both mouse and touch input
- Real-time shape preview while drawing

### Shape Manipulation
- Rotate shapes with precise angle control
- Scale shapes with aspect ratio preservation
- Transform shapes with modifier keys (Shift, Ctrl, Alt)
- Support for both clockwise and counter-clockwise rotation

### Styling Options
- Customizable stroke width (0.5px - 20px)
- Multiple stroke styles (solid, dashed, dotted)
- Fill color support with transparency
- Real-time style preview

### Star Shape Features
- Create star shapes with 3-20 points
- Adjustable star ratio (0.1 - 0.9)
- Automatic point calculation
- Smooth point transitions

### Performance
- Optimized drawing operations
- Efficient shape calculations
- Smooth animations
- Memory-efficient state management

### Error Handling
- Robust input validation
- Graceful error recovery
- Invalid state prevention
- Comprehensive error logging

## Usage

### Basic Polygon
```javascript
const polygonTool = new PolygonTool(stateManager, layerManager);

// Set basic options
polygonTool.setOption('sides', 6);
polygonTool.setOption('radius', 50);
polygonTool.setOption('strokeWidth', 2);

// Start drawing
polygonTool.startDrawing(event, canvas, context);
polygonTool.draw(event, canvas, context);
polygonTool.stopDrawing(event, canvas, context);
```

### Star Shape
```javascript
// Configure star shape
polygonTool.setOption('isStar', true);
polygonTool.setOption('sides', 5);
polygonTool.setOption('starRatio', 0.5);
```

### Shape Manipulation
```javascript
// Rotate shape
polygonTool.rotateShape(Math.PI / 4);

// Scale shape
polygonTool.scaleShape(2);

// Cancel drawing
polygonTool.cancelDrawing();
```

## Options

| Option | Type | Default | Range | Description |
|--------|------|---------|--------|-------------|
| sides | number | 5 | 3-20 | Number of polygon sides |
| radius | number | 50 | >0 | Base radius of the shape |
| starRatio | number | 0.5 | 0.1-0.9 | Ratio for star points |
| rotation | number | 0 | -π to π | Initial rotation angle |
| strokeWidth | number | 1 | ≥0.5 | Width of the stroke |
| strokeStyle | string | 'solid' | ['solid', 'dashed', 'dotted'] | Style of the stroke |
| fill | string | 'transparent' | Any valid color | Fill color |
| isStar | boolean | false | true/false | Enable star shape mode |

## State Management

The tool maintains its own state and can be saved/loaded:

```javascript
// Save current state
const state = polygonTool.saveState();

// Load saved state
polygonTool.loadState(state);
```

## Error Handling

The tool includes comprehensive error handling:

- Invalid input validation
- Canvas context checks
- State validation
- Drawing operation error recovery
- Graceful fallbacks for invalid states

## Performance Considerations

- Efficient point calculations
- Optimized drawing operations
- Memory-efficient state management
- Smooth animations
- Hardware acceleration support

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS/Android)

## Dependencies

- Canvas API
- ES6+ JavaScript
- No external dependencies

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

# Smart Constraints Tool

A high-performance vector graphics editor with advanced features and optimizations.

## Core Features

- **Intelligent Snapping**: Advanced snapping system with customizable rules and smart guides
- **Advanced Alignment**: Precise alignment tools with dynamic constraints
- **Pattern Detection**: Automatic pattern recognition and replication
- **High-Performance Rendering**: Hardware-accelerated graphics with WebGL support
- **Touch Optimization**: Advanced touch prediction and gesture recognition
- **Memory Management**: Efficient resource handling and automatic cleanup

## Performance Optimizations

### WebGL Rendering
- Hardware-accelerated graphics processing
- Optimized shader-based rendering
- Efficient texture management
- Automatic fallback to 2D canvas when needed

### Web Worker Processing
- Offloaded heavy computations to background threads
- Layer processing and image manipulation
- Memory optimization and cleanup
- Touch prediction and gesture analysis

### Memory Management
- Smart caching system with size limits
- Automatic resource cleanup
- Layer state tracking
- Texture pooling and reuse

### Touch Optimization
- Kalman filter-based touch prediction
- Advanced gesture recognition
- Velocity and acceleration tracking
- Confidence-based prediction

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/smart-constraints-tool.git
cd smart-constraints-tool
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Mobile Support

### Touch Gestures
- Single touch drawing
- Multi-touch pan and zoom
- Pinch-to-zoom with dynamic scaling
- Swipe gestures for navigation
- Rotation gestures for object manipulation

### Performance Features
- Touch prediction for smooth interactions
- Gesture recognition for intuitive controls
- Optimized rendering for mobile devices
- Efficient memory usage
- Battery-friendly processing

## Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|--------------|-----|
| Save | Ctrl + S | Cmd + S |
| Undo | Ctrl + Z | Cmd + Z |
| Redo | Ctrl + Y | Cmd + Y |
| Select All | Ctrl + A | Cmd + A |
| Copy | Ctrl + C | Cmd + C |
| Paste | Ctrl + V | Cmd + V |
| Delete | Delete | Delete |
| Zoom In | Ctrl + + | Cmd + + |
| Zoom Out | Ctrl + - | Cmd + - |
| Reset Zoom | Ctrl + 0 | Cmd + 0 |

## Advanced Features

### Performance Monitoring
- Real-time FPS tracking
- Memory usage monitoring
- Frame time analysis
- Performance bottleneck detection

### Layer Management
- Efficient layer caching
- Smart layer state tracking
- Automatic layer cleanup
- Texture optimization

### Memory Optimization
- Automatic resource cleanup
- Smart caching strategies
- Texture pooling
- Memory usage limits

## Testing

Run the test suite:
```bash
npm test
```

The test suite verifies:
- Tool functionality
- Performance optimizations
- Memory management
- Touch interactions
- WebGL rendering
- Worker processing

## Documentation

### Getting Started
- Basic usage
- Tool overview
- Performance considerations
- Mobile support

### Advanced Usage
- WebGL optimization
- Worker configuration
- Memory management
- Touch customization

### API Reference
- CanvasManager
- LayerManager
- TouchPredictor
- MemoryManager
- WebGLRenderer
- WorkerProcessor

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Updates

### Latest Updates
- Added WebGL rendering support
- Implemented advanced touch prediction
- Enhanced memory management
- Added worker-based processing
- Improved layer management

### Planned Features
- Advanced pattern recognition
- Machine learning-based predictions
- Enhanced gesture support
- Additional performance optimizations
- Extended mobile capabilities

## License

MIT License - see LICENSE file for details

# Dopple Environment Manager v4

A comprehensive environment detection and feature management system for web applications. Automatically detects device capabilities and connection quality to enable/disable features accordingly.

## Features

- Device performance detection (CPU, memory, GPU)
- Connection quality monitoring
- Mobile device detection
- Feature flag system with graceful fallbacks
- Performance warning UI
- Analytics logging
- Debug export capabilities
- Theme integration
- Global state access

## Installation

1. Copy the following files to your project:
   - `src/core/env.js`
   - `src/js/components/performance-banner.js`

2. Import and initialize in your main application file:

```javascript
import { EnvironmentManager } from './core/env.js';
import { PerformanceBanner } from './js/components/performance-banner.js';

// Initialize early in your app
EnvironmentManager.init();

// Create banner if needed
const banner = new PerformanceBanner();
if (EnvironmentManager.shouldWarnUser()) {
  banner.show();
}
```

## Usage

### Feature Detection

```javascript
// Check if a feature is available
if (EnvironmentManager.canUse('VectorTools')) {
  // Enable vector tools
}

// Get reason if feature is disabled
const reason = EnvironmentManager.getFeatureDisabledReason('VectorTools');
if (reason) {
  console.warn(reason);
}
```

### Available Feature Flags

- `VectorTools` - Complex path editing and smart selection
- `CanvasExport` - High-quality PNG and SVG exports
- `UndoHistory` - Complex state tracking
- `GPUAcceleration` - Hardware-accelerated rendering
- `AutoSave` - Automatic document saving
- `3D` - 3D transformations and effects
- `AudioFX` - Sound processing and playback
- `HeavyFilters` - Complex image filters
- `LiveCollab` - Real-time multi-user editing
- `Animations` - Complex motion and transitions
- `SVG` - SVG rendering and manipulation
- `RealTime` - Real-time updates and previews
- `AutoPlay` - Automatic media playback
- `Export` - File export capabilities

### Force Full Mode

```javascript
// Enable all features
EnvironmentManager.toggleForceFullMode(true);

// Enable permanently for this device
EnvironmentManager.toggleForceFullMode(true, true);

// Disable and return to auto-detection
EnvironmentManager.toggleForceFullMode(false);
```

### Analytics and Debug

```javascript
// Export debug information
const debugInfo = EnvironmentManager.exportAnalytics();

// Access global state
const envState = window.__env__;
```

### Theme Integration

The performance banner uses CSS variables for theming:

```css
:root {
  --banner-bg: #fff3cd;
  --banner-text: #856404;
  --banner-link: #856404;
  --banner-text-secondary: #666;
  --banner-details-bg: rgba(0,0,0,0.05);
  --banner-button-bg: #856404;
  --font-family: system-ui, -apple-system, sans-serif;
}
```

## API Reference

### EnvironmentManager

- `init()` - Initialize the environment manager
- `canUse(featureName)` - Check if a feature is available
- `getFeatureDisabledReason(featureName)` - Get reason for disabled feature
- `toggleForceFullMode(enabled, permanent)` - Toggle force full mode
- `exportAnalytics()` - Export debug information
- `getSystemInfo()` - Get current system information
- `getDisabledFeatures()` - Get list of disabled features
- `exportState()` - Export current state for global access

### PerformanceBanner

- `show()` - Show the performance banner
- `hide()` - Hide the performance banner
- `showDetails()` - Show detailed system information
- `showHelp()` - Show help documentation

## Debug Information

Debug information is stored in localStorage:
- `dopple_device_info` - Current device information
- `dopple_analytics` - Analytics event log
- `env:forceFullMode` - Force full mode setting
- `env:forceFullModePermanent` - Permanent force full mode setting
- `env:hideBanner` - Banner visibility setting

## Version History

- v4.0.0 - Current version
  - Added new feature flags
  - Enhanced analytics
  - Improved UI
  - Added theme integration
  - Added global state export
