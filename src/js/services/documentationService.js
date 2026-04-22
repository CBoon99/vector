import capabilityService from './capabilityService.js';
import uiService from './uiService.js';
import html2pdf from 'html2pdf.js';

class DocumentationService {
    constructor() {
        this.docs = {
            beginner: {
                title: 'Getting Started',
                sections: [
                    {
                        title: 'Welcome to Smart Constraints Tool',
                        content: `Smart Constraints Tool is a high-performance vector graphics editor with intelligent snapping, alignment guides, and dynamic constraints.

Key Features:
• WebGL-accelerated rendering
• Smart snapping and alignment
• Pattern detection and replication
• Touch-optimized interface
• Memory-efficient processing`
                    },
                    {
                        title: 'Basic Interface',
                        content: `The interface consists of three main areas:

1. Toolbar (Top)
   • Drawing tools
   • Smart constraint tools
   • Undo/Redo buttons
   • Performance monitor

2. Canvas (Center)
   • Main editing area
   • WebGL-accelerated rendering
   • Touch gesture support
   • Real-time feedback

3. Sidebar (Right)
   • Layer management
   • Properties panel
   • Performance metrics
   • Memory usage monitor`
                    },
                    {
                        title: 'First Steps',
                        content: `1. Drawing
   • Select a drawing tool
   • Click/tap to place points
   • Use smart snapping (Shift)
   • Complete shape (double-click/tap)

2. Smart Constraints
   • Hold Shift for snapping
   • Hold Alt for spacing
   • Use Alt + E for distribution
   • Watch for alignment guides

3. Performance Tips
   • Monitor FPS counter
   • Check memory usage
   • Use layer caching
   • Enable WebGL rendering`
                    }
                ]
            },
            intermediate: {
                title: 'Advanced Features',
                sections: [
                    {
                        title: 'Performance Optimization',
                        content: `1. WebGL Rendering
   • Hardware acceleration
   • Layer compositing
   • Texture management
   • Automatic fallback

2. Web Worker Processing
   • Offloaded computations
   • Layer processing
   • Memory optimization
   • Touch prediction

3. Memory Management
   • Texture pooling
   • Automatic cleanup
   • Usage monitoring
   • Resource optimization`
                    },
                    {
                        title: 'Pattern Detection',
                        content: `The pattern detection system identifies and replicates patterns:

1. Grid Patterns
   • Automatic detection
   • Spacing analysis
   • Alignment verification
   • Pattern replication

2. Alternating Patterns
   • Element alternation
   • Spacing variation
   • Pattern recognition
   • Smart replication

3. Progressive Patterns
   • Size progression
   • Spacing progression
   • Pattern analysis
   • Dynamic replication`
                    },
                    {
                        title: 'Touch Optimization',
                        content: `Advanced touch handling for mobile devices:

1. Touch Prediction
   • Kalman filtering
   • Velocity tracking
   • Acceleration analysis
   • Confidence scoring

2. Gesture Recognition
   • Multi-touch support
   • Gesture detection
   • Pattern matching
   • Response optimization

3. Performance
   • Touch event throttling
   • Memory optimization
   • Layer caching
   • Adaptive quality`
                    }
                ]
            },
            advanced: {
                title: 'Expert Features',
                sections: [
                    {
                        title: 'WebGL Optimization',
                        content: `1. Rendering Pipeline
   • Shader optimization
   • Batch processing
   • Texture management
   • Memory efficiency

2. Layer Compositing
   • Efficient blending
   • Dirty region tracking
   • Layer caching
   • Update optimization

3. Performance Monitoring
   • FPS tracking
   • Memory profiling
   • Resource usage
   • Optimization suggestions`
                    },
                    {
                        title: 'Memory Management',
                        content: `Advanced memory optimization techniques:

1. Texture Pooling
   • Dynamic allocation
   • Size optimization
   • Reuse strategy
   • Cleanup scheduling

2. Resource Management
   • Memory monitoring
   • Usage tracking
   • Automatic cleanup
   • Optimization triggers

3. Cache Management
   • Layer caching
   • Pattern caching
   • Resource pooling
   • Memory limits`
                    },
                    {
                        title: 'Advanced Touch',
                        content: `Sophisticated touch handling:

1. Prediction System
   • Kalman filtering
   • Motion analysis
   • Confidence scoring
   • Adaptive prediction

2. Gesture System
   • Multi-touch support
   • Gesture recognition
   • Pattern matching
   • Response optimization

3. Performance
   • Event throttling
   • Memory efficiency
   • Layer optimization
   • Quality adaptation`
                    }
                ]
            }
        };

        this.tutorials = [
            {
                id: 'performance-optimization',
                title: 'Performance Optimization',
                level: 'advanced',
                steps: [
                    {
                        title: 'WebGL Rendering',
                        content: 'Learn how to optimize WebGL rendering for better performance.',
                        target: '[data-panel="webgl"]',
                        position: 'left'
                    },
                    {
                        title: 'Memory Management',
                        content: 'Optimize memory usage and resource management.',
                        target: '[data-panel="memory"]',
                        position: 'left'
                    },
                    {
                        title: 'Touch Optimization',
                        content: 'Configure touch handling and prediction.',
                        target: '[data-panel="touch"]',
                        position: 'left'
                    }
                ]
            }
        ];

        this.currentLevel = 'beginner';
        this.activeModal = null;
        this.eventListeners = new Map();
    }

    getBeginnerDocs() {
        return {
            title: 'Getting Started',
            sections: [
                {
                    title: 'Welcome to DoppleIt Vector',
                    content: `DoppleIt Vector is a powerful browser-based vector graphics editor that lets you create, edit, and export vector graphics in various formats.

Key Features:
• Import multiple file formats (SVG, PDF, AI, EPS, DXF, PNG, JPG, WEBP, TIFF, BMP)
• Edit vector graphics with intuitive tools
• Export to various formats
• Smart vectorization of raster images
• Touch-friendly interface for mobile devices`
                },
                {
                    title: 'Basic Interface',
                    content: `The interface consists of three main areas:

1. Toolbar (Top)
   • Import/Export buttons
   • Basic editing tools
   • Undo/Redo buttons

2. Canvas (Center)
   • Main editing area
   • Zoom controls
   • Touch gestures supported

3. Sidebar (Right)
   • Layers panel
   • Properties panel
   • Additional tools based on device capabilities`
                },
                {
                    title: 'First Steps',
                    content: `1. Import a File
   • Click the Import button (📁)
   • Select a file from your device
   • Supported formats will be automatically detected

2. Basic Navigation
   • Pan: Drag the canvas
   • Zoom: Pinch or double-tap on mobile
   • Zoom: Mouse wheel or double-click on desktop

3. Basic Editing
   • Select objects by tapping/clicking
   • Move objects by dragging
   • Resize using corner handles
   • Rotate using the rotation handle`
                },
                {
                    title: 'Touch Gestures',
                    content: `Mobile and tablet users can use these gestures:

• Swipe left: Open sidebar
• Swipe right: Close sidebar
• Swipe up: Show toolbar
• Swipe down: Hide toolbar
• Double tap: Toggle zoom
• Pinch: Zoom in/out`
                }
            ]
        };
    }

    getIntermediateDocs() {
        return {
            title: 'Intermediate Features',
            sections: [
                {
                    title: 'Advanced Editing',
                    content: `1. Object Manipulation
   • Group objects (Ctrl/Cmd + G)
   • Ungroup objects (Ctrl/Cmd + Shift + G)
   • Align objects using the alignment tools
   • Distribute objects evenly

2. Path Editing
   • Edit anchor points
   • Convert points between corner and smooth
   • Add/remove points
   • Join/split paths

3. Color Management
   • Use the color picker
   • Save colors to swatches
   • Apply gradients
   • Use opacity controls`
                },
                {
                    title: 'Vectorization',
                    content: `The vectorization feature converts raster images to vector graphics:

1. Import a raster image (PNG, JPG, etc.)
2. Click the Vectorize button
3. Adjust settings:
   • Quality: Low/Medium/High
   • Color reduction
   • Edge detection sensitivity
   • Path simplification

The process is automatic but can be fine-tuned based on your needs.`
                },
                {
                    title: 'Export Options',
                    content: `Export your work in various formats:

1. Vector Formats
   • SVG: Web-friendly vector format
   • PDF: Print-ready format
   • AI: Adobe Illustrator format
   • EPS: Encapsulated PostScript
   • DXF: CAD format

2. Raster Formats
   • PNG: Lossless with transparency
   • JPG: Compressed format
   • WEBP: Modern web format
   • TIFF: High-quality format
   • BMP: Basic bitmap format

Each format has specific options for quality and optimization.`
                }
            ]
        };
    }

    getAdvancedDocs() {
        return {
            title: 'Advanced Features',
            sections: [
                {
                    title: 'Smart Features',
                    content: `1. Style Preservation
   • Automatic style detection
   • Style transfer between objects
   • Style library management
   • Custom style creation

2. Pattern Recognition
   • Automatic pattern detection
   • Pattern creation and editing
   • Pattern library
   • Pattern application tools

3. Batch Processing
   • Multiple file import
   • Batch vectorization
   • Batch export
   • Custom batch workflows`
                },
                {
                    title: 'Performance Optimization',
                    content: `1. Device-Specific Features
   • Automatic capability detection
   • Feature adaptation
   • Performance optimization
   • Memory management

2. Export Optimization
   • File size optimization
   • Quality vs. size balance
   • Custom export presets
   • Batch optimization

3. Advanced Settings
   • Cache management
   • History settings
   • Auto-save configuration
   • Performance monitoring`
                },
                {
                    title: 'Keyboard Shortcuts',
                    content: `1. File Operations
   • Ctrl/Cmd + O: Open file
   • Ctrl/Cmd + S: Save
   • Ctrl/Cmd + Shift + S: Save as
   • Ctrl/Cmd + E: Export
   • Ctrl/Cmd + P: Print

2. Edit Operations
   • Ctrl/Cmd + Z: Undo
   • Ctrl/Cmd + Shift + Z: Redo
   • Ctrl/Cmd + X: Cut
   • Ctrl/Cmd + C: Copy
   • Ctrl/Cmd + V: Paste
   • Delete: Remove selected
   • Ctrl/Cmd + A: Select all
   • Ctrl/Cmd + D: Deselect

3. Object Operations
   • Ctrl/Cmd + G: Group
   • Ctrl/Cmd + Shift + G: Ungroup
   • Ctrl/Cmd + [: Send backward
   • Ctrl/Cmd + ]: Bring forward
   • Ctrl/Cmd + Shift + [: Send to back
   • Ctrl/Cmd + Shift + ]: Bring to front
   • Ctrl/Cmd + L: Lock
   • Ctrl/Cmd + Shift + L: Unlock

4. View Operations
   • Ctrl/Cmd + 0: Fit to screen
   • Ctrl/Cmd + 1: Actual size
   • Ctrl/Cmd + +: Zoom in
   • Ctrl/Cmd + -: Zoom out
   • Space + Drag: Pan
   • H: Hand tool
   • V: Selection tool

5. Vectorization
   • Ctrl/Cmd + V: Vectorize
   • Ctrl/Cmd + Shift + V: Vectorize with settings
   • Ctrl/Cmd + Alt + V: Batch vectorize

6. Style Operations
   • Ctrl/Cmd + B: Bold
   • Ctrl/Cmd + I: Italic
   • Ctrl/Cmd + U: Underline
   • Ctrl/Cmd + Shift + C: Copy style
   • Ctrl/Cmd + Shift + V: Paste style

7. Grid and Guides
   • Ctrl/Cmd + ': Show/hide grid
   • Ctrl/Cmd + ;: Show/hide guides
   • Ctrl/Cmd + Shift + ': Snap to grid
   • Ctrl/Cmd + Shift + ;: Snap to guides

8. Advanced Tools
   • B: Brush tool
   • P: Pen tool
   • T: Text tool
   • R: Rectangle tool
   • C: Circle tool
   • L: Line tool
   • A: Direct selection
   • E: Eraser tool`
                },
                {
                    title: 'Pro Tips',
                    content: `1. Workflow Optimization
   • Custom tool presets
   • Workspace layouts
   • Quick access tools
   • Custom panels

2. Advanced Techniques
   • Complex path creation
   • Advanced masking
   • Custom effects
   • Script automation

3. Performance Tips
   • Use appropriate quality settings
   • Optimize file size
   • Manage memory usage
   • Regular auto-save
   • Cache management`
                }
            ]
        };
    }

    getTutorials() {
        return [
            {
                id: 'first-steps',
                title: 'First Steps',
                level: 'beginner',
                steps: [
                    {
                        title: 'Welcome',
                        content: 'Welcome to DoppleIt Vector! Let\'s get started with the basics.',
                        target: '.toolbar',
                        position: 'bottom'
                    },
                    {
                        title: 'Import a File',
                        content: 'Click the Import button to add your first file.',
                        target: '[data-tool="import"]',
                        position: 'bottom'
                    },
                    {
                        title: 'Basic Navigation',
                        content: 'Use touch gestures or mouse to navigate the canvas.',
                        target: '.canvas-container',
                        position: 'center'
                    }
                ]
            },
            {
                id: 'vectorization',
                title: 'Vectorization',
                level: 'intermediate',
                steps: [
                    {
                        title: 'Vectorization Basics',
                        content: 'Learn how to convert raster images to vector graphics.',
                        target: '[data-tool="vectorize"]',
                        position: 'bottom'
                    },
                    {
                        title: 'Quality Settings',
                        content: 'Adjust vectorization quality based on your needs.',
                        target: '[data-tool="quality"]',
                        position: 'bottom'
                    }
                ]
            },
            {
                id: 'advanced-features',
                title: 'Advanced Features',
                level: 'advanced',
                steps: [
                    {
                        title: 'Style Preservation',
                        content: 'Learn how to preserve and transfer styles between objects.',
                        target: '[data-panel="styles"]',
                        position: 'left'
                    },
                    {
                        title: 'Pattern Recognition',
                        content: 'Use pattern recognition to create complex designs.',
                        target: '[data-panel="patterns"]',
                        position: 'left'
                    }
                ]
            },
            {
                id: 'touch-gestures',
                title: 'Touch Gestures',
                level: 'beginner',
                steps: [
                    {
                        title: 'Swipe Navigation',
                        content: 'Swipe left to open sidebar, right to close it.',
                        target: '.canvas-container',
                        position: 'center'
                    },
                    {
                        title: 'Zoom Controls',
                        content: 'Use pinch gestures to zoom in and out.',
                        target: '.canvas-container',
                        position: 'center'
                    },
                    {
                        title: 'Double Tap',
                        content: 'Double tap to toggle zoom level.',
                        target: '.canvas-container',
                        position: 'center'
                    }
                ]
            },
            {
                id: 'export-options',
                title: 'Export Options',
                level: 'intermediate',
                steps: [
                    {
                        title: 'Export Formats',
                        content: 'Choose from various vector and raster formats.',
                        target: '[data-tool="export"]',
                        position: 'bottom'
                    },
                    {
                        title: 'Quality Settings',
                        content: 'Adjust export quality and optimization settings.',
                        target: '[data-panel="export-settings"]',
                        position: 'left'
                    },
                    {
                        title: 'Batch Export',
                        content: 'Export multiple files at once with custom settings.',
                        target: '[data-tool="batch-export"]',
                        position: 'bottom'
                    }
                ]
            },
            {
                id: 'performance-optimization',
                title: 'Performance Optimization',
                level: 'advanced',
                steps: [
                    {
                        title: 'WebGL Rendering',
                        content: 'Learn how to optimize WebGL rendering for better performance.',
                        target: '[data-panel="webgl"]',
                        position: 'left'
                    },
                    {
                        title: 'Memory Management',
                        content: 'Optimize memory usage and resource management.',
                        target: '[data-panel="memory"]',
                        position: 'left'
                    },
                    {
                        title: 'Touch Optimization',
                        content: 'Configure touch handling and prediction.',
                        target: '[data-panel="touch"]',
                        position: 'left'
                    }
                ]
            }
        ];
    }

    showDocumentation(level = 'beginner') {
        this.currentLevel = level;
        const doc = this.docs[level];
        
        // Clean up any existing modal
        if (this.activeModal) {
            this.cleanupModal();
        }
        
        // Create documentation modal
        const modal = document.createElement('div');
        modal.className = 'documentation-modal';
        this.activeModal = modal;
        modal.innerHTML = `
            <div class="documentation-content">
                <div class="documentation-header">
                    <h1>${doc.title}</h1>
                    <div class="header-actions">
                        <div class="search-container">
                            <input type="text" class="search-input" placeholder="Search documentation...">
                            <button class="search-button">🔍</button>
                        </div>
                        <div class="print-options">
                            <button class="print-button" title="Print documentation">🖨️</button>
                            <div class="print-dropdown">
                                <button class="print-preview-button" title="Print preview">👁️</button>
                                <button class="pdf-export-button" title="Export as PDF">📄</button>
                                <div class="print-quality-options">
                                    <label>
                                        <input type="radio" name="print-quality" value="draft" checked>
                                        Draft
                                    </label>
                                    <label>
                                        <input type="radio" name="print-quality" value="normal">
                                        Normal
                                    </label>
                                    <label>
                                        <input type="radio" name="print-quality" value="high">
                                        High Quality
                                    </label>
                                </div>
                                <div class="print-advanced-options">
                                    <h4>Page Settings</h4>
                                    <div class="page-size-options">
                                        <label>Page Size:
                                            <select name="page-size">
                                                <option value="a4">A4</option>
                                                <option value="letter">Letter</option>
                                                <option value="legal">Legal</option>
                                                <option value="a3">A3</option>
                                                <option value="custom">Custom</option>
                                            </select>
                                        </label>
                                        <div class="custom-size-inputs" style="display: none;">
                                            <input type="number" name="custom-width" placeholder="Width (mm)" min="1" max="1000">
                                            <input type="number" name="custom-height" placeholder="Height (mm)" min="1" max="1000">
                                        </div>
                                    </div>
                                    <div class="layout-options">
                                        <label>Layout:
                                            <select name="page-layout">
                                                <option value="1-up">1-up (Single Page)</option>
                                                <option value="2-up">2-up (Two Pages)</option>
                                                <option value="4-up">4-up (Four Pages)</option>
                                            </select>
                                        </label>
                                    </div>
                                    <div class="margin-options">
                                        <label>Margins (mm):
                                            <div class="margin-inputs">
                                                <input type="number" name="margin-top" value="20" min="0" max="100">
                                                <input type="number" name="margin-right" value="20" min="0" max="100">
                                                <input type="number" name="margin-bottom" value="20" min="0" max="100">
                                                <input type="number" name="margin-left" value="20" min="0" max="100">
                                            </div>
                                        </label>
                                    </div>
                                    <div class="watermark-options">
                                        <label>
                                            <input type="checkbox" name="show-watermark">
                                            Show Watermark
                                        </label>
                                        <div class="watermark-settings" style="display: none;">
                                            <input type="text" name="watermark-text" placeholder="Watermark text">
                                            <input type="color" name="watermark-color" value="#cccccc">
                                            <input type="range" name="watermark-opacity" min="0" max="100" value="30">
                                        </div>
                                    </div>
                                    <div class="header-footer-options">
                                        <label>
                                            <input type="checkbox" name="show-header">
                                            Show Header
                                        </label>
                                        <div class="header-settings" style="display: none;">
                                            <input type="text" name="header-text" placeholder="Header text">
                                            <select name="header-position">
                                                <option value="left">Left</option>
                                                <option value="center">Center</option>
                                                <option value="right">Right</option>
                                            </select>
                                        </div>
                                        <label>
                                            <input type="checkbox" name="show-footer">
                                            Show Footer
                                        </label>
                                        <div class="footer-settings" style="display: none;">
                                            <input type="text" name="footer-text" placeholder="Footer text">
                                            <select name="footer-position">
                                                <option value="left">Left</option>
                                                <option value="center">Center</option>
                                                <option value="right">Right</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="page-numbering-options">
                                        <label>
                                            <input type="checkbox" name="show-page-numbers">
                                            Show Page Numbers
                                        </label>
                                        <div class="page-number-settings" style="display: none;">
                                            <select name="page-number-position">
                                                <option value="bottom-center">Bottom Center</option>
                                                <option value="bottom-right">Bottom Right</option>
                                                <option value="bottom-left">Bottom Left</option>
                                                <option value="top-center">Top Center</option>
                                                <option value="top-right">Top Right</option>
                                                <option value="top-left">Top Left</option>
                                            </select>
                                            <input type="text" name="page-number-format" placeholder="Page {page} of {total}" value="Page {page} of {total}">
                                            <input type="number" name="start-page-number" value="1" min="1">
                                        </div>
                                    </div>
                                    <div class="toc-options">
                                        <label>
                                            <input type="checkbox" name="include-toc">
                                            Include Table of Contents
                                        </label>
                                        <div class="toc-settings" style="display: none;">
                                            <select name="toc-position">
                                                <option value="start">At Start</option>
                                                <option value="end">At End</option>
                                            </select>
                                            <label>
                                                <input type="checkbox" name="toc-page-numbers">
                                                Show Page Numbers in TOC
                                            </label>
                                            <input type="number" name="toc-depth" value="2" min="1" max="6" title="Maximum heading level to include">
                                        </div>
                                    </div>
                                    <div class="section-break-options">
                                        <label>
                                            <input type="checkbox" name="section-breaks">
                                            Add Section Breaks
                                        </label>
                                        <div class="section-break-settings" style="display: none;">
                                            <select name="break-type">
                                                <option value="page">Page Break</option>
                                                <option value="column">Column Break</option>
                                                <option value="both">Both</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="column-options">
                                        <label>
                                            <input type="checkbox" name="use-columns">
                                            Use Columns
                                        </label>
                                        <div class="column-settings" style="display: none;">
                                            <input type="number" name="column-count" value="2" min="1" max="4">
                                            <input type="number" name="column-gap" value="12" min="0" max="50" title="Gap between columns (mm)">
                                            <label>
                                                <input type="checkbox" name="balance-columns">
                                                Balance Column Length
                                            </label>
                                        </div>
                                    </div>
                                    <div class="style-options">
                                        <h4>Style Options</h4>
                                        <div class="font-options">
                                            <label>Font Family:
                                                <select name="font-family">
                                                    <option value="serif">Serif</option>
                                                    <option value="sans-serif">Sans-serif</option>
                                                    <option value="monospace">Monospace</option>
                                                </select>
                                            </label>
                                            <div class="font-size-options">
                                                <label>Base Font Size:
                                                    <input type="number" name="base-font-size" value="12" min="8" max="24" title="Base font size in points">
                                                </label>
                                                <label>Heading Scale:
                                                    <input type="number" name="heading-scale" value="1.2" min="1" max="2" step="0.1" title="Scale factor for headings">
                                                </label>
                                            </div>
                                        </div>
                                        <div class="color-options">
                                            <label>Text Color:
                                                <input type="color" name="text-color" value="#000000">
                                            </label>
                                            <label>Heading Color:
                                                <input type="color" name="heading-color" value="#333333">
                                            </label>
                                            <label>Link Color:
                                                <input type="color" name="link-color" value="#0066cc">
                                            </label>
                                        </div>
                                    </div>
                                    <div class="export-options">
                                        <h4>Export Options</h4>
                                        <div class="file-options">
                                            <label>File Name:
                                                <input type="text" name="file-name" placeholder="Enter file name">
                                            </label>
                                            <label>File Format:
                                                <select name="file-format">
                                                    <option value="pdf">PDF</option>
                                                    <option value="html">HTML</option>
                                                    <option value="docx">DOCX</option>
                                                </select>
                                            </label>
                                        </div>
                                        <div class="compression-options">
                                            <label>
                                                <input type="checkbox" name="compress-pdf">
                                                Compress PDF
                                            </label>
                                            <div class="compression-settings" style="display: none;">
                                                <input type="range" name="compression-level" min="0" max="100" value="80" title="Compression level">
                                                <label>
                                                    <input type="checkbox" name="compress-images">
                                                    Compress Images
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="documentation-layout">
                    ${this.getTableOfContents(doc)}
                    <div class="documentation-sections">
                        ${doc.sections.map((section, index) => `
                            <section id="section-${index}" class="doc-section" data-search="${section.title.toLowerCase()} ${section.content.toLowerCase()}">
                                <h2><span class="section-number">${index + 1}.</span> ${section.title}</h2>
                                <div class="content">${section.content}</div>
                            </section>
                        `).join('')}
                    </div>
                </div>
            </div>
            <button class="back-to-top" title="Back to top">↑</button>
        `;
        
        document.body.appendChild(modal);
        uiService.showModal(modal);

        // Add event listeners with cleanup tracking
        const addEventListener = (element, event, handler) => {
            element.addEventListener(event, handler);
            if (!this.eventListeners.has(modal)) {
                this.eventListeners.set(modal, []);
            }
            this.eventListeners.get(modal).push({ element, event, handler });
        };

        // Search functionality
        const searchInput = modal.querySelector('.search-input');
        const sections = modal.querySelectorAll('.doc-section');
        
        addEventListener(searchInput, 'input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            sections.forEach(section => {
                const searchableContent = section.getAttribute('data-search');
                if (searchableContent.includes(searchTerm)) {
                    section.style.display = 'block';
                    // Highlight matching text
                    const content = section.querySelector('.content');
                    const text = content.textContent;
                    const highlightedText = text.replace(
                        new RegExp(searchTerm, 'gi'),
                        match => `<span class="highlight">${match}</span>`
                    );
                    content.innerHTML = highlightedText;
                } else {
                    section.style.display = 'none';
                }
            });
        });

        // Table of contents functionality
        const tocLinks = modal.querySelectorAll('.toc-link');
        const tocToggle = modal.querySelector('.toc-toggle');
        const tocList = modal.querySelector('.table-of-contents ul');
        
        addEventListener(tocToggle, 'click', () => {
            tocToggle.classList.toggle('collapsed');
            tocList.style.display = tocToggle.classList.contains('collapsed') ? 'none' : 'block';
        });

        tocLinks.forEach(link => {
            addEventListener(link, 'click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = modal.querySelector(`#${targetId}`);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                    // Highlight the section briefly
                    targetSection.classList.add('highlight-section');
                    setTimeout(() => {
                        targetSection.classList.remove('highlight-section');
                    }, 2000);
                }
            });
        });

        // Update active section in TOC while scrolling
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    const progress = entry.intersectionRatio;
                    
                    tocLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                            // Update progress indicator
                            const progressIndicator = link.parentElement.querySelector('.progress-indicator');
                            progressIndicator.style.transform = `scaleY(${progress})`;
                        }
                    });
                }
            });
        }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

        sections.forEach(section => observer.observe(section));

        // Back to top button
        const backToTop = modal.querySelector('.back-to-top');
        const content = modal.querySelector('.documentation-content');

        addEventListener(content, 'scroll', () => {
            if (content.scrollTop > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        addEventListener(backToTop, 'click', () => {
            content.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Print functionality
        const printButton = modal.querySelector('.print-button');
        const printDropdown = modal.querySelector('.print-dropdown');
        const printPreviewButton = modal.querySelector('.print-preview-button');
        const pdfExportButton = modal.querySelector('.pdf-export-button');
        
        addEventListener(printButton, 'click', () => {
            printDropdown.classList.toggle('visible');
        });

        addEventListener(document, 'click', (e) => {
            if (!printButton.contains(e.target) && !printDropdown.contains(e.target)) {
                printDropdown.classList.remove('visible');
            }
        });

        // Get selected print quality
        const getPrintQuality = () => {
            const selectedQuality = modal.querySelector('input[name="print-quality"]:checked').value;
            const qualitySettings = {
                draft: {
                    dpi: 72,
                    imageQuality: 0.7,
                    colorMode: 'grayscale'
                },
                normal: {
                    dpi: 150,
                    imageQuality: 0.85,
                    colorMode: 'color'
                },
                high: {
                    dpi: 300,
                    imageQuality: 1,
                    colorMode: 'color'
                }
            };
            return qualitySettings[selectedQuality];
        };

        // Add advanced print options functionality
        const pageSizeSelect = modal.querySelector('select[name="page-size"]');
        const customSizeInputs = modal.querySelector('.custom-size-inputs');
        const watermarkCheckbox = modal.querySelector('input[name="show-watermark"]');
        const watermarkSettings = modal.querySelector('.watermark-settings');
        const headerCheckbox = modal.querySelector('input[name="show-header"]');
        const headerSettings = modal.querySelector('.header-settings');
        const footerCheckbox = modal.querySelector('input[name="show-footer"]');
        const footerSettings = modal.querySelector('.footer-settings');

        addEventListener(pageSizeSelect, 'change', () => {
            customSizeInputs.style.display = pageSizeSelect.value === 'custom' ? 'block' : 'none';
        });

        addEventListener(watermarkCheckbox, 'change', () => {
            watermarkSettings.style.display = watermarkCheckbox.checked ? 'block' : 'none';
        });

        addEventListener(headerCheckbox, 'change', () => {
            headerSettings.style.display = headerCheckbox.checked ? 'block' : 'none';
        });

        addEventListener(footerCheckbox, 'change', () => {
            footerSettings.style.display = footerCheckbox.checked ? 'block' : 'none';
        });

        // Get print settings
        const getPrintSettings = () => {
            const quality = getPrintQuality();
            const pageSize = pageSizeSelect.value;
            const customWidth = modal.querySelector('input[name="custom-width"]').value;
            const customHeight = modal.querySelector('input[name="custom-height"]').value;
            const layout = modal.querySelector('select[name="page-layout"]').value;
            const margins = {
                top: modal.querySelector('input[name="margin-top"]').value,
                right: modal.querySelector('input[name="margin-right"]').value,
                bottom: modal.querySelector('input[name="margin-bottom"]').value,
                left: modal.querySelector('input[name="margin-left"]').value
            };
            const watermark = {
                show: watermarkCheckbox.checked,
                text: modal.querySelector('input[name="watermark-text"]').value,
                color: modal.querySelector('input[name="watermark-color"]').value,
                opacity: modal.querySelector('input[name="watermark-opacity"]').value
            };
            const header = {
                show: headerCheckbox.checked,
                text: modal.querySelector('input[name="header-text"]').value,
                position: modal.querySelector('select[name="header-position"]').value
            };
            const footer = {
                show: footerCheckbox.checked,
                text: modal.querySelector('input[name="footer-text"]').value,
                position: modal.querySelector('select[name="footer-position"]').value
            };
            const pageNumbers = {
                show: modal.querySelector('input[name="show-page-numbers"]').checked,
                position: modal.querySelector('select[name="page-number-position"]').value,
                format: modal.querySelector('input[name="page-number-format"]').value,
                startNumber: parseInt(modal.querySelector('input[name="start-page-number"]').value)
            };
            const tableOfContents = {
                include: modal.querySelector('input[name="include-toc"]').checked,
                position: modal.querySelector('select[name="toc-position"]').value,
                showPageNumbers: modal.querySelector('input[name="toc-page-numbers"]').checked,
                depth: parseInt(modal.querySelector('input[name="toc-depth"]').value)
            };
            const sectionBreaks = {
                enabled: modal.querySelector('input[name="section-breaks"]').checked,
                type: modal.querySelector('select[name="break-type"]').value
            };
            const columns = {
                enabled: modal.querySelector('input[name="use-columns"]').checked,
                count: parseInt(modal.querySelector('input[name="column-count"]').value),
                gap: parseInt(modal.querySelector('input[name="column-gap"]').value),
                balance: modal.querySelector('input[name="balance-columns"]').checked
            };
            const styles = {
                fontFamily: modal.querySelector('select[name="font-family"]').value,
                baseFontSize: parseInt(modal.querySelector('input[name="base-font-size"]').value),
                headingScale: parseFloat(modal.querySelector('input[name="heading-scale"]').value),
                textColor: modal.querySelector('input[name="text-color"]').value,
                headingColor: modal.querySelector('input[name="heading-color"]').value,
                linkColor: modal.querySelector('input[name="link-color"]').value
            };
            const exportOptions = {
                fileName: modal.querySelector('input[name="file-name"]').value || `${doc.title.toLowerCase().replace(/\s+/g, '-')}`,
                format: modal.querySelector('select[name="file-format"]').value,
                compression: {
                    enabled: modal.querySelector('input[name="compress-pdf"]').checked,
                    level: parseInt(modal.querySelector('input[name="compression-level"]').value),
                    compressImages: modal.querySelector('input[name="compress-images"]').checked
                }
            };

            return {
                quality,
                pageSize: pageSize === 'custom' ? { width: customWidth, height: customHeight } : pageSize,
                layout,
                margins,
                watermark,
                header,
                footer,
                pageNumbers,
                tableOfContents,
                sectionBreaks,
                columns,
                styles,
                export: exportOptions
            };
        };

        // Update print preview with new settings
        const updatePrintPreview = (settings) => {
            const previewWindow = window.open('', '_blank');
            previewWindow.document.write(this.getPrintPreview(doc, settings));
            previewWindow.document.close();
        };

        // Update print preview button click handler
        addEventListener(printPreviewButton, 'click', () => {
            const settings = getPrintSettings();
            updatePrintPreview(settings);
        });

        // Update PDF export button click handler
        addEventListener(pdfExportButton, 'click', async () => {
            const settings = getPrintSettings();
            try {
                uiService.showMessage('Generating PDF...', 'info');
                
                await this.exportToPDF(doc, settings);
            } catch (error) {
                console.error('PDF export failed:', error);
                uiService.showMessage('Failed to export PDF. Please try again.', 'error');
            }
        });

        // Add new event listeners for advanced options
        const pageNumberCheckbox = modal.querySelector('input[name="show-page-numbers"]');
        const pageNumberSettings = modal.querySelector('.page-number-settings');
        const tocCheckbox = modal.querySelector('input[name="include-toc"]');
        const tocSettings = modal.querySelector('.toc-settings');
        const sectionBreakCheckbox = modal.querySelector('input[name="section-breaks"]');
        const sectionBreakSettings = modal.querySelector('.section-break-settings');
        const columnCheckbox = modal.querySelector('input[name="use-columns"]');
        const columnSettings = modal.querySelector('.column-settings');
        const compressCheckbox = modal.querySelector('input[name="compress-pdf"]');
        const compressionSettings = modal.querySelector('.compression-settings');

        addEventListener(pageNumberCheckbox, 'change', () => {
            pageNumberSettings.style.display = pageNumberCheckbox.checked ? 'block' : 'none';
        });

        addEventListener(tocCheckbox, 'change', () => {
            tocSettings.style.display = tocCheckbox.checked ? 'block' : 'none';
        });

        addEventListener(sectionBreakCheckbox, 'change', () => {
            sectionBreakSettings.style.display = sectionBreakCheckbox.checked ? 'block' : 'none';
        });

        addEventListener(columnCheckbox, 'change', () => {
            columnSettings.style.display = columnCheckbox.checked ? 'block' : 'none';
        });

        addEventListener(compressCheckbox, 'change', () => {
            compressionSettings.style.display = compressCheckbox.checked ? 'block' : 'none';
        });
    }

    cleanupModal() {
        if (this.activeModal) {
            const listeners = this.eventListeners.get(this.activeModal) || [];
            listeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
            this.eventListeners.delete(this.activeModal);
            this.activeModal.remove();
            this.activeModal = null;
        }
    }

    startTutorial(tutorialId) {
        const tutorial = this.tutorials.find(t => t.id === tutorialId);
        if (!tutorial) return;

        let currentStep = 0;
        const showStep = () => {
            if (currentStep >= tutorial.steps.length) {
                this.endTutorial();
                return;
            }

            const step = tutorial.steps[currentStep];
            const target = document.querySelector(step.target);
            if (!target) return;

            const tooltip = document.createElement('div');
            tooltip.className = 'tutorial-tooltip';
            tooltip.innerHTML = `
                <h3>${step.title}</h3>
                <p>${step.content}</p>
                <div class="tutorial-controls">
                    <button class="prev-step">Previous</button>
                    <button class="next-step">Next</button>
                </div>
            `;

            target.appendChild(tooltip);
            this.positionTooltip(tooltip, target, step.position);

            tooltip.querySelector('.next-step').addEventListener('click', () => {
                tooltip.remove();
                currentStep++;
                showStep();
            });

            tooltip.querySelector('.prev-step').addEventListener('click', () => {
                tooltip.remove();
                currentStep--;
                showStep();
            });
        };

        showStep();
    }

    positionTooltip(tooltip, target, position) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        switch (position) {
            case 'top':
                tooltip.style.top = `${targetRect.top - tooltipRect.height - 10}px`;
                tooltip.style.left = `${targetRect.left + (targetRect.width - tooltipRect.width) / 2}px`;
                break;
            case 'bottom':
                tooltip.style.top = `${targetRect.bottom + 10}px`;
                tooltip.style.left = `${targetRect.left + (targetRect.width - tooltipRect.width) / 2}px`;
                break;
            case 'left':
                tooltip.style.left = `${targetRect.left - tooltipRect.width - 10}px`;
                tooltip.style.top = `${targetRect.top + (targetRect.height - tooltipRect.height) / 2}px`;
                break;
            case 'right':
                tooltip.style.left = `${targetRect.right + 10}px`;
                tooltip.style.top = `${targetRect.top + (targetRect.height - tooltipRect.height) / 2}px`;
                break;
            case 'center':
                tooltip.style.top = `${(window.innerHeight - tooltipRect.height) / 2}px`;
                tooltip.style.left = `${(window.innerWidth - tooltipRect.width) / 2}px`;
                break;
        }
    }

    endTutorial() {
        const tooltips = document.querySelectorAll('.tutorial-tooltip');
        tooltips.forEach(tooltip => tooltip.remove());
    }

    getLevel() {
        return this.currentLevel;
    }

    setLevel(level) {
        if (this.docs[level]) {
            this.currentLevel = level;
            return true;
        }
        return false;
    }

    getTableOfContents(doc) {
        const toc = `
            <div class="table-of-contents">
                <h3>
                    Contents
                    <button class="toc-toggle" title="Toggle table of contents">▼</button>
                </h3>
                <ul>
                    ${doc.sections.map((section, index) => `
                        <li>
                            <div class="progress-indicator"></div>
                            <a href="#section-${index}" class="toc-link">
                                <span class="section-number">${index + 1}.</span>
                                ${section.title}
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        return toc;
    }

    getPrintPreview(doc, settings) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Preview - ${doc.title}</title>
                <style>
                    body {
                        font-family: ${settings.styles.fontFamily};
                        line-height: 1.6;
                        color: ${settings.styles.textColor};
                        margin: 0;
                        padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
                        box-sizing: border-box;
                        font-size: ${settings.styles.baseFontSize}pt;
                    }
                    .page {
                        position: relative;
                        width: ${settings.pageSize === 'custom' ? settings.pageSize.width + 'mm' : '210mm'};
                        height: ${settings.pageSize === 'custom' ? settings.pageSize.height + 'mm' : '297mm'};
                        margin: 0 auto;
                        background: white;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        ${settings.columns.enabled ? `
                            column-count: ${settings.columns.count};
                            column-gap: ${settings.columns.gap}mm;
                        ` : ''}
                    }
                    h1 {
                        font-size: ${settings.styles.baseFontSize * Math.pow(settings.styles.headingScale, 2)}pt;
                        color: ${settings.styles.headingColor};
                        margin-bottom: 1em;
                        border-bottom: 2px solid ${settings.styles.headingColor};
                        padding-bottom: 0.5em;
                    }
                    h2 {
                        font-size: ${settings.styles.baseFontSize * settings.styles.headingScale}pt;
                        color: ${settings.styles.headingColor};
                        margin: 1.5em 0 1em;
                    }
                    a {
                        color: ${settings.styles.linkColor};
                    }
                    ${settings.watermark.show ? `
                        .page::before {
                            content: "${settings.watermark.text}";
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%) rotate(-45deg);
                            font-size: 48px;
                            color: ${settings.watermark.color};
                            opacity: ${settings.watermark.opacity / 100};
                            pointer-events: none;
                            white-space: nowrap;
                        }
                    ` : ''}
                    ${settings.header.show ? `
                        .header {
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            padding: 10mm;
                            text-align: ${settings.header.position};
                            font-size: 10pt;
                            color: #666;
                        }
                    ` : ''}
                    ${settings.footer.show ? `
                        .footer {
                            position: absolute;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            padding: 10mm;
                            text-align: ${settings.footer.position};
                            font-size: 10pt;
                            color: #666;
                        }
                    ` : ''}
                    ${settings.pageNumbers.show ? `
                        .page-number {
                            position: absolute;
                            ${settings.pageNumbers.position.includes('top') ? 'top: 10mm;' : 'bottom: 10mm;'}
                            ${settings.pageNumbers.position.includes('left') ? 'left: 10mm;' : 
                              settings.pageNumbers.position.includes('right') ? 'right: 10mm;' : 
                              'left: 50%; transform: translateX(-50%);'}
                            font-size: 10pt;
                            color: #666;
                        }
                    ` : ''}
                    .content {
                        padding: ${settings.header.show ? '20mm' : '10mm'} 10mm ${settings.footer.show ? '20mm' : '10mm'} 10mm;
                    }
                    ${settings.tableOfContents.include ? `
                        .toc {
                            margin-bottom: 2em;
                            padding: 1em;
                            background: #f8f9fa;
                            border-radius: 4px;
                        }
                        .toc h2 {
                            margin-top: 0;
                        }
                        .toc ul {
                            list-style: none;
                            padding: 0;
                        }
                        .toc li {
                            margin: 0.5em 0;
                            padding-left: 1em;
                        }
                        .toc .page-number {
                            float: right;
                        }
                    ` : ''}
                    @media print {
                        .print-quality-info {
                            display: none;
                        }
                        body {
                            padding: 0;
                        }
                        .page {
                            box-shadow: none;
                        }
                        ${settings.sectionBreaks.enabled ? `
                            section {
                                break-after: ${settings.sectionBreaks.type === 'both' ? 'page column' : settings.sectionBreaks.type};
                            }
                        ` : ''}
                    }
                </style>
            </head>
            <body>
                <div class="print-quality-info">
                    <strong>Print Settings:</strong><br>
                    Quality: ${settings.quality.dpi} DPI, ${settings.quality.colorMode}<br>
                    Page Size: ${settings.pageSize === 'custom' ? `${settings.pageSize.width}mm × ${settings.pageSize.height}mm` : settings.pageSize.toUpperCase()}<br>
                    Layout: ${settings.layout}<br>
                    Margins: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm<br>
                    Font: ${settings.styles.fontFamily}, ${settings.styles.baseFontSize}pt<br>
                    ${settings.columns.enabled ? `Columns: ${settings.columns.count} (${settings.columns.gap}mm gap)<br>` : ''}
                    ${settings.tableOfContents.include ? 'Table of Contents: Included<br>' : ''}
                    ${settings.pageNumbers.show ? 'Page Numbers: Enabled<br>' : ''}
                </div>
                <div class="page">
                    ${settings.header.show ? `<div class="header">${settings.header.text}</div>` : ''}
                    <div class="content">
                        ${settings.tableOfContents.include && settings.tableOfContents.position === 'start' ? this.getTableOfContents(doc) : ''}
                        <h1>${doc.title}</h1>
                        ${doc.sections.map((section, index) => `
                            <section>
                                <h2><span class="section-number">${index + 1}.</span> ${section.title}</h2>
                                <div class="content">${section.content}</div>
                            </section>
                        `).join('')}
                        ${settings.tableOfContents.include && settings.tableOfContents.position === 'end' ? this.getTableOfContents(doc) : ''}
                    </div>
                    ${settings.footer.show ? `<div class="footer">${settings.footer.text}</div>` : ''}
                    ${settings.pageNumbers.show ? `
                        <div class="page-number">
                            ${settings.pageNumbers.format
                                .replace('{page}', settings.pageNumbers.startNumber)
                                .replace('{total}', doc.sections.length)}
                        </div>
                    ` : ''}
                </div>
            </body>
            </html>
        `;
    }

    async exportToPDF(doc, settings) {
        try {
            uiService.showMessage('Generating PDF...', 'info');
            
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = `
                <div class="pdf-content">
                    ${settings.header.show ? `<div class="header">${settings.header.text}</div>` : ''}
                    ${settings.tableOfContents.include && settings.tableOfContents.position === 'start' ? this.getTableOfContents(doc) : ''}
                    <h1>${doc.title}</h1>
                    ${doc.sections.map((section, index) => `
                        <section>
                            <h2><span class="section-number">${index + 1}.</span> ${section.title}</h2>
                            <div class="content">${section.content}</div>
                        </section>
                    `).join('')}
                    ${settings.tableOfContents.include && settings.tableOfContents.position === 'end' ? this.getTableOfContents(doc) : ''}
                    ${settings.footer.show ? `<div class="footer">${settings.footer.text}</div>` : ''}
                </div>
            `;

            const opt = {
                margin: [settings.margins.top, settings.margins.right, settings.margins.bottom, settings.margins.left],
                filename: `${settings.export.fileName}.${settings.export.format}`,
                image: { 
                    type: 'jpeg', 
                    quality: settings.quality.imageQuality,
                    compression: settings.export.compression.enabled ? settings.export.compression.level / 100 : 1
                },
                html2canvas: { 
                    scale: settings.quality.dpi / 96,
                    useCORS: true,
                    logging: false
                },
                jsPDF: { 
                    unit: 'mm',
                    format: settings.pageSize === 'custom' ? [settings.pageSize.width, settings.pageSize.height] : settings.pageSize,
                    orientation: 'portrait',
                    compress: settings.export.compression.enabled
                }
            };

            await html2pdf().set(opt).from(tempContainer).save();
            uiService.showMessage('PDF exported successfully!', 'success');
        } catch (error) {
            console.error('PDF export failed:', error);
            uiService.showMessage('Failed to export PDF. Please try again.', 'error');
        }
    }
}

export default new DocumentationService(); 