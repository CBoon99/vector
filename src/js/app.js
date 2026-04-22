import { StateManager } from './core/stateManager.js';
import { LayerManager } from './core/layerManager.js';
import { CanvasManager } from './core/canvasManager.js';
import ToolFeedback from './core/tool-feedback.js';
import Onboarding from './ui/onboarding.js';
import { EnvironmentManager } from '../core/env.js';
import { PerformanceBanner } from './components/performance-banner.js';
import { SelectionTool } from './tools/selection-tool.js';
import { TextTool } from './tools/text-tool.js';
import { BezierTool } from './tools/bezier-tool.js';
import { PenTool } from './tools/pen-tool.js';
import { RectangleTool } from './tools/rectangle-tool.js';
import { CircleTool } from './tools/circle-tool.js';
import { PolygonTool } from './tools/polygon-tool.js';
import { ErrorHandler, FileError, DrawingError } from './utils/errorHandler.js';
import ShapeTool from './tools/shape-tool.js';
import ShapeToolUI from './components/shape-tool-ui.js';
import ErrorTracker from './utils/errorTracker.js';
import UIService from './services/uiService.js';
import DeviceService from './services/deviceService.js';
import FileService from './services/fileService.js';
import RasterizationService from './services/rasterizationService.js';
import FileImportService from './services/fileImportService.js';
import VectorizationService from './services/vectorizationService.js';
import ExportService from './services/exportService.js';
import DocumentationService from './services/documentationService.js';
import { LayerPanel } from './components/layer-panel.js';
import SmartShapeTool from './tools/smart-shape-tool.js';
import SmartConstraintsTool from './tools/smart-constraints-tool.js';

class App {
    constructor() {
        // Initialize environment manager early
        EnvironmentManager.init();
        
        this.stateManager = new StateManager();
        this.layerManager = new LayerManager();
        this.canvasManager = new CanvasManager();
        this.toolFeedback = new ToolFeedback();
        this.onboarding = new Onboarding();
        this.tools = new Map();
        this.currentTool = null;
        this.smartConstraints = new SmartConstraintsTool();
        this.performanceBanner = new PerformanceBanner();
        
        this.initializeServices();
        this.initializeComponents();
        this.setupEventListeners();
        this.showWelcome();
        
        // Create performance banner if needed
        if (EnvironmentManager.shouldWarnUser()) {
            this.performanceBanner.show();
        }

        // Initialize features based on environment
        this.initializeFeatures();
    }

    initializeServices() {
        // Initialize error tracking
        this.errorTracker = new ErrorTracker();

        // Initialize core components
        this.stateManager.setLayerManager(this.layerManager);
        this.stateManager.setCanvasManager(this.canvasManager);

        // Initialize services
        this.documentationService = new DocumentationService();

        // Initialize layer panel
        this.layerPanel = new LayerPanel(this.layerManager, this.stateManager);

        // Set up canvas drawing handlers
        this.canvasManager.setDrawHandlers({
            onDrawStart: this.handleDrawStart.bind(this),
            onDraw: this.handleDraw.bind(this),
            onDrawEnd: this.handleDrawEnd.bind(this),
            onDrawLayers: this.drawLayers.bind(this),
            onZoom: this.handleZoom.bind(this)
        });

        // Initialize tools
        this.initializeTools();
    }

    initializeComponents() {
        this.initializeColorPicker();
        this.initializeLayers();
        this.initializeExport();
        this.initializeSettings();
        this.initializeRasterize();
        this.initializeDeviceFeatures();
        this.initializeShapeTool();
        this.initializeToolbar();
        this.initializeEditControls();
    }

    initializeDeviceFeatures() {
        // Use EnvironmentManager instead of DeviceService
        const features = {
            canUseVectorization: EnvironmentManager.canUse('SVG'),
            canUseRealTime: EnvironmentManager.canUse('RealTime'),
            canUseAutoPlay: EnvironmentManager.canUse('AutoPlay'),
            canUseExport: EnvironmentManager.canUse('Export')
        };
        
        this.updateToolAvailability(features);
        this.updateMenuAvailability(features);
        this.updateLayerControls(features);
    }

    initializeRasterize() {
        const rasterizeButton = UIService.createButton(
            'auto-rasterize',
            'Auto Rasterize',
            'button',
            'Automatically rasterize complex vector objects for better performance'
        );
        
        const rasterizeGroup = UIService.createControlGroup();
        rasterizeGroup.appendChild(rasterizeButton);
        
        const controlsGrid = document.querySelector('.controls-grid');
        controlsGrid.appendChild(rasterizeGroup);

        rasterizeButton.addEventListener('click', () => this.autoRasterize());
    }

    async autoRasterize() {
        try {
            const activeLayer = this.layerManager.getActiveLayer();
            if (!activeLayer) {
                throw new DrawingError('No active layer to rasterize');
            }

            const complexObjects = activeLayer.objects.filter(obj => 
                VectorizationService.isObjectComplex(obj)
            );

            if (complexObjects.length === 0) {
                UIService.showMessage('No complex objects found to rasterize', 'info');
                return;
            }

            for (const object of complexObjects) {
                const rasterizedImage = await VectorizationService.rasterizeObject(object, this.canvasManager.canvas);
                if (rasterizedImage) {
                    this.layerManager.replaceObjectWithRasterized(object, rasterizedImage);
                }
            }

            this.canvasManager.draw();
            UIService.showMessage(`Rasterized ${complexObjects.length} complex objects`, 'success');
        } catch (error) {
            ErrorHandler.handle(error, 'autoRasterize');
        }
    }

    setupEventListeners() {
        this.setupFileUploadListeners();
        this.setupToolSelectionListeners();
        this.setupHelpModalListeners();
        this.setupErrorListeners();
        this.setupDocumentationListeners();
    }

    setupFileUploadListeners() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-upload');
        const browseButton = document.getElementById('browse-button');

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            UIService.addClass('upload-area', 'dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            UIService.removeClass('upload-area', 'dragover');
        });

        uploadArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            UIService.removeClass('upload-area', 'dragover');
            await this.handleFiles(e.dataTransfer.files);
        });

        browseButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', async () => {
            await this.handleFiles(fileInput.files);
            fileInput.value = '';
        });
    }

    setupToolSelectionListeners() {
        const toolButtons = document.querySelectorAll('#drawing-tools button');
        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                const toolId = button.id;
                this.selectTool(toolId);
                
                // Update tool-specific UI
                if (toolId === 'shape-tool') {
                    document.getElementById('shape-controls').style.display = 'block';
                } else {
                    document.getElementById('shape-controls').style.display = 'none';
                }
            });
        });
    }

    setupHelpModalListeners() {
        const helpModal = document.getElementById('help-modal');
        const closeHelp = document.getElementById('close-help');

        closeHelp.addEventListener('click', () => {
            UIService.hideModal('help-modal');
        });

        window.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                UIService.hideModal('help-modal');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && helpModal.style.display === 'block') {
                UIService.hideModal('help-modal');
            }
        });
    }

    setupErrorListeners() {
        window.addEventListener('app:error', (e) => {
            UIService.showMessage(e.detail.message, 'error');
        });
    }

    setupDocumentationListeners() {
        const documentationButton = document.getElementById('show-documentation');
        documentationButton.addEventListener('click', () => {
            this.documentationService.showDocumentation();
        });
    }

    async handleFiles(files) {
        try {
            for (const file of files) {
                const vectorObjects = await FileImportService.importFile(file);
                if (vectorObjects) {
                    this.layerManager.addObjects(vectorObjects);
                    this.canvasManager.draw();
                }
            }
        } catch (error) {
            ErrorHandler.handle(error, 'handleFiles');
        }
    }

    selectTool(toolId) {
        this.stateManager.setCurrentTool(toolId);
        this.updateToolUI(toolId);

        // Set up tool-specific event handlers
        switch (toolId) {
            case 'polygon-tool':
                this.setupPolygonToolHandlers();
                break;
            case 'shape-tool':
                this.setupShapeToolHandlers();
                break;
            default:
                this.removeToolHandlers();
        }
    }

    handleDrawStart(point) {
        try {
            // Apply smart constraints to the point
            const constrainedPoint = this.smartConstraints.applyConstraints(point);
            this.stateManager.startDrawing(constrainedPoint);
            this.canvasManager.draw();
        } catch (error) {
            ErrorHandler.handle(error, 'handleDrawStart');
        }
    }

    handleDraw(point) {
        try {
            // Apply smart constraints to the point
            const constrainedPoint = this.smartConstraints.applyConstraints(point);
            this.stateManager.updateDrawing(constrainedPoint);
            this.canvasManager.draw();
        } catch (error) {
            ErrorHandler.handle(error, 'handleDraw');
        }
    }

    handleDrawEnd(point) {
        try {
            this.stateManager.finishDrawing(point);
            this.canvasManager.draw();
        } catch (error) {
            ErrorHandler.handle(error, 'handleDrawEnd');
        }
    }

    drawLayers(ctx) {
        this.layerManager.drawLayers(ctx);
        // Draw smart constraints guides and snap points
        this.smartConstraints.drawGuides(ctx);
        this.smartConstraints.drawSnapPoints(ctx);
    }

    handleZoom(zoom, event) {
        try {
            this.canvasManager.setZoom(zoom, event);
            this.canvasManager.draw();
        } catch (error) {
            ErrorHandler.handle(error, 'handleZoom');
        }
    }

    showWelcome() {
        if (!localStorage.getItem('welcomeShown')) {
            UIService.showMessage('Welcome to Doppleit Vector! Use the tools on the left to start drawing.', 'info');
            localStorage.setItem('welcomeShown', 'true');
        }
    }

    updateToolAvailability(features) {
        const toolButtons = document.querySelectorAll('#drawing-tools button');
        toolButtons.forEach(button => {
            const feature = button.dataset.feature;
            if (feature && !features.includes(feature)) {
                button.disabled = true;
                button.title = 'This feature is not available on your device';
            }
        });
    }

    updateMenuAvailability(features) {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const feature = item.dataset.feature;
            if (feature && !features.includes(feature)) {
                item.classList.add('disabled');
                item.title = 'This feature is not available on your device';
            }
        });
    }

    updateLayerControls(features) {
        const layerControls = document.querySelectorAll('.layer-control');
        layerControls.forEach(control => {
            const feature = control.dataset.feature;
            if (feature && !features.includes(feature)) {
                control.classList.add('disabled');
                control.title = 'This feature is not available on your device';
            }
        });
    }

    initializeShapeTool() {
        this.shapeTool = new ShapeTool(this.stateManager, this.layerManager);
        this.shapeTool.initialize();
    }

    setupShapeToolHandlers() {
        this.canvasManager.canvas.addEventListener('mousedown', this.shapeTool.onMouseDown.bind(this.shapeTool));
        this.canvasManager.canvas.addEventListener('mousemove', this.shapeTool.onMouseMove.bind(this.shapeTool));
        this.canvasManager.canvas.addEventListener('mouseup', this.shapeTool.onMouseUp.bind(this.shapeTool));
    }

    removeToolHandlers() {
        this.canvasManager.canvas.removeEventListener('mousedown', this.shapeTool.onMouseDown);
        this.canvasManager.canvas.removeEventListener('mousemove', this.shapeTool.onMouseMove);
        this.canvasManager.canvas.removeEventListener('mouseup', this.shapeTool.onMouseUp);
    }

    initializeToolbar() {
        const toolbar = document.getElementById('drawing-tools');
        if (!toolbar) return;

        // Add shape tool button
        const shapeToolButton = ShapeToolUI.createToolButton();
        toolbar.appendChild(shapeToolButton);

        // Add shape tool controls
        const shapeControls = ShapeToolUI.createControls();
        document.getElementById('tool-controls').appendChild(shapeControls);
    }

    async exportDocument(format, settings = {}) {
        try {
            const document = {
                objects: this.layerManager.getAllObjects(),
                width: this.canvasManager.canvas.width,
                height: this.canvasManager.canvas.height,
                metadata: this.stateManager.getMetadata()
            };

            // Get export settings from UI
            const preset = document.getElementById('export-preset').value;
            const quality = document.getElementById('export-quality').value;
            const includeMetadata = document.getElementById('include-metadata').checked;
            const includeStyles = document.getElementById('include-styles').checked;
            const compressExport = document.getElementById('compress-export').checked;
            const includeTransparency = document.getElementById('include-transparency').checked;

            const exportSettings = {
                preset: preset || undefined,
                quality: quality,
                includeMetadata,
                includeStyles,
                compression: compressExport,
                includeTransparency,
                ...settings
            };

            const exportedFile = await ExportService.exportDocument(document, format, exportSettings);
            this.downloadFile(exportedFile, `document.${format}`);
        } catch (error) {
            ErrorHandler.handle(error, 'exportDocument');
        }
    }

    initializeExportControls() {
        const exportPreset = document.getElementById('export-preset');
        const exportQuality = document.getElementById('export-quality');
        const exportOptions = document.querySelector('.export-options');

        // Show/hide custom options based on preset selection
        exportPreset.addEventListener('change', () => {
            exportOptions.style.display = exportPreset.value === '' ? 'block' : 'none';
        });

        // Initialize export buttons
        document.getElementById('export-svg').addEventListener('click', () => this.exportDocument('svg'));
        document.getElementById('export-png').addEventListener('click', () => this.exportDocument('png'));
        document.getElementById('export-pdf').addEventListener('click', () => this.exportDocument('pdf'));
        document.getElementById('export-json').addEventListener('click', () => this.exportDocument('json'));
    }

    async exportSelection(format, settings = {}) {
        try {
            const selection = this.stateManager.getSelection();
            if (!selection.length) {
                throw new DrawingError('No objects selected');
            }

            const exportedFile = await ExportService.exportSelection(selection, format, settings);
            this.downloadFile(exportedFile, `selection.${format}`);
        } catch (error) {
            ErrorHandler.handle(error, 'exportSelection');
        }
    }

    async exportArtboard(artboard, format, settings = {}) {
        try {
            const exportedFile = await ExportService.exportArtboard(artboard, format, settings);
            this.downloadFile(exportedFile, `artboard.${format}`);
        } catch (error) {
            ErrorHandler.handle(error, 'exportArtboard');
        }
    }

    async exportLayers(layers, format, settings = {}) {
        try {
            const exportedFile = await ExportService.exportLayers(layers, format, settings);
            this.downloadFile(exportedFile, `layers.${format}`);
        } catch (error) {
            ErrorHandler.handle(error, 'exportLayers');
        }
    }

    downloadFile(file, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    initializeEditControls() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        const deleteBtn = document.getElementById('delete-btn');

        if (undoBtn) undoBtn.addEventListener('click', () => this.handleUndo());
        if (redoBtn) redoBtn.addEventListener('click', () => this.handleRedo());
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.handleDelete());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                this.handleUndo();
            } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
                e.preventDefault();
                this.handleRedo();
            } else if ((e.key === 'Delete' || e.key === 'Backspace') && this.stateManager.getSelection().length) {
                e.preventDefault();
                this.handleDelete();
            }
        });
    }

    handleUndo() {
        this.stateManager.undo();
        this.canvasManager.draw();
        UIService.showMessage('Undo', 'info');
    }

    handleRedo() {
        this.stateManager.redo();
        this.canvasManager.draw();
        UIService.showMessage('Redo', 'info');
    }

    handleDelete() {
        const selection = this.stateManager.getSelection();
        if (selection.length) {
            this.layerManager.deleteObjects(selection);
            this.stateManager.saveHistory();
            this.canvasManager.draw();
            UIService.showMessage('Deleted selected object(s)', 'success');
        }
    }

    initializeLayers() {
        this.renderLayerList();
        this.setupLayerControls();
        this.layerManager.on('change', () => this.renderLayerList());
    }

    renderLayerList() {
        const layerList = document.getElementById('layer-list');
        if (!layerList) return;
        layerList.innerHTML = '';
        const layers = this.layerManager.getLayers();
        const activeLayerId = this.layerManager.getActiveLayerId();
        layers.forEach((layer, idx) => {
            const li = document.createElement('li');
            li.className =
                (layer.id === activeLayerId ? 'selected ' : '') +
                (layer.locked ? 'locked ' : '') +
                (layer.hidden ? 'hidden' : '');
            li.dataset.layerId = layer.id;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'layer-name';
            nameSpan.textContent = layer.name || `Layer ${idx + 1}`;
            li.appendChild(nameSpan);

            const icons = document.createElement('span');
            icons.className = 'layer-icons';
            // Visibility
            const visIcon = document.createElement('span');
            visIcon.className = 'icon';
            visIcon.title = layer.hidden ? 'Show Layer' : 'Hide Layer';
            visIcon.textContent = layer.hidden ? '🙈' : '👁️';
            visIcon.onclick = (e) => {
                e.stopPropagation();
                this.layerManager.toggleVisibility(layer.id);
                this.renderLayerList();
            };
            icons.appendChild(visIcon);
            // Lock
            const lockIcon = document.createElement('span');
            lockIcon.className = 'icon';
            lockIcon.title = layer.locked ? 'Unlock Layer' : 'Lock Layer';
            lockIcon.textContent = layer.locked ? '🔒' : '🔓';
            lockIcon.onclick = (e) => {
                e.stopPropagation();
                this.layerManager.toggleLock(layer.id);
                this.renderLayerList();
            };
            icons.appendChild(lockIcon);
            // Move up
            const upIcon = document.createElement('span');
            upIcon.className = 'icon';
            upIcon.title = 'Move Up';
            upIcon.textContent = '↑';
            upIcon.onclick = (e) => {
                e.stopPropagation();
                this.layerManager.moveLayerUp(layer.id);
                this.renderLayerList();
            };
            icons.appendChild(upIcon);
            // Move down
            const downIcon = document.createElement('span');
            downIcon.className = 'icon';
            downIcon.title = 'Move Down';
            downIcon.textContent = '↓';
            downIcon.onclick = (e) => {
                e.stopPropagation();
                this.layerManager.moveLayerDown(layer.id);
                this.renderLayerList();
            };
            icons.appendChild(downIcon);
            li.appendChild(icons);

            li.onclick = () => {
                this.layerManager.setActiveLayer(layer.id);
                this.renderLayerList();
            };
            layerList.appendChild(li);
        });
    }

    setupLayerControls() {
        document.getElementById('add-layer').onclick = () => {
            this.layerManager.addLayer();
            UIService.showMessage('Layer added', 'success');
        };
        document.getElementById('delete-layer').onclick = () => {
            this.layerManager.deleteActiveLayer();
            UIService.showMessage('Layer deleted', 'success');
        };
        document.getElementById('duplicate-layer').onclick = () => {
            this.layerManager.duplicateActiveLayer();
            UIService.showMessage('Layer duplicated', 'success');
        };
        document.getElementById('rename-layer').onclick = () => {
            const name = prompt('Enter new layer name:');
            if (name) {
                this.layerManager.renameActiveLayer(name);
                UIService.showMessage('Layer renamed', 'success');
            }
        };
        document.getElementById('toggle-layer-visibility').onclick = () => {
            this.layerManager.toggleVisibility();
            this.renderLayerList();
        };
        document.getElementById('toggle-layer-lock').onclick = () => {
            this.layerManager.toggleLock();
            this.renderLayerList();
        };
        document.getElementById('move-layer-up').onclick = () => {
            this.layerManager.moveLayerUp();
            this.renderLayerList();
        };
        document.getElementById('move-layer-down').onclick = () => {
            this.layerManager.moveLayerDown();
            this.renderLayerList();
        };
        document.getElementById('group-layers').onclick = () => {
            this.layerManager.groupSelectedLayers();
            UIService.showMessage('Layers grouped', 'success');
        };
        document.getElementById('ungroup-layers').onclick = () => {
            this.layerManager.ungroupSelectedLayers();
            UIService.showMessage('Layers ungrouped', 'success');
        };
    }

    initializeTools() {
        this.tools = {
            select: new SelectionTool(this.layerManager, this.stateManager),
            rectangle: new RectangleTool(this.layerManager, this.stateManager),
            circle: new CircleTool(this.layerManager, this.stateManager),
            polygon: new PolygonTool(this.layerManager, this.stateManager),
            bezier: new BezierTool(this.layerManager, this.stateManager),
            text: new TextTool(this.layerManager, this.stateManager),
            smartShape: new SmartShapeTool(this.layerManager, this.stateManager),
            smartConstraints: new SmartConstraintsTool()
        };
        this.currentTool = this.tools.select;
    }

    setCurrentTool(toolName) {
        const tool = this.tools.get(toolName);
        if (tool) {
            if (this.currentTool) {
                this.currentTool.cleanup();
            }
            this.currentTool = tool;
            this.toolFeedback.setCurrentTool(tool);
            this.updateToolUI(toolName);
        }
    }

    updateToolUI(toolName) {
        // Update active tool button
        document.querySelectorAll('[data-tool]').forEach(element => {
            element.classList.toggle('active', element.getAttribute('data-tool') === toolName);
        });
    }

    cleanup() {
        // Clean up event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        this.canvasManager.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvasManager.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvasManager.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvasManager.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
        this.canvasManager.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvasManager.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvasManager.canvas.removeEventListener('touchend', this.handleTouchEnd);

        // Clean up tools
        this.tools.forEach(tool => tool.cleanup());

        // Clean up UI components
        this.toolFeedback.cleanup();
        this.onboarding.cleanup();
        this.smartConstraints.cleanup();
    }

    initializeFeatures() {
        // Example feature initialization
        if (EnvironmentManager.canUse('VectorTools')) {
            this.initializeVectorTools();
        }

        if (EnvironmentManager.canUse('3D')) {
            this.initialize3D();
        }

        if (EnvironmentManager.canUse('AudioFX')) {
            this.initializeAudio();
        }

        // Log initialization
        EnvironmentManager.logAnalytics('app_initialized', {
            features: EnvironmentManager.getDisabledFeatures()
        });
    }

    initializeVectorTools() {
        console.log('Vector tools initialized');
        // Implementation here
    }

    initialize3D() {
        console.log('3D features initialized');
        // Implementation here
    }

    initializeAudio() {
        console.log('Audio features initialized');
        // Implementation here
    }

    // Example of checking features during runtime
    handleUserAction(action) {
        switch (action) {
            case 'export':
                if (EnvironmentManager.canUse('CanvasExport')) {
                    this.exportCanvas();
                } else {
                    this.showExportWarning();
                }
                break;

            case 'undo':
                if (EnvironmentManager.canUse('UndoHistory')) {
                    this.undo();
                } else {
                    this.showUndoWarning();
                }
                break;

            case 'collaborate':
                if (EnvironmentManager.canUse('LiveCollab')) {
                    this.startCollaboration();
                } else {
                    this.showCollabWarning();
                }
                break;
        }
    }

    // Example of showing warnings
    showExportWarning() {
        const reason = EnvironmentManager.getFeatureDisabledReason('CanvasExport');
        console.warn('Export disabled:', reason);
        // Show user-friendly message
    }

    showUndoWarning() {
        const reason = EnvironmentManager.getFeatureDisabledReason('UndoHistory');
        console.warn('Undo disabled:', reason);
        // Show user-friendly message
    }

    showCollabWarning() {
        const reason = EnvironmentManager.getFeatureDisabledReason('LiveCollab');
        console.warn('Collaboration disabled:', reason);
        // Show user-friendly message
    }

    // Example of exporting debug info
    exportDebugInfo() {
        const debugData = EnvironmentManager.exportAnalytics();
        console.log('Debug info:', debugData);
        // Save or send debug data
    }
}

export default App;

// Add CSS for the upgrade message
const style = document.createElement('style');
style.textContent = `
    .upgrade-message {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .upgrade-content {
        text-align: center;
    }

    .upgrade-content h3 {
        margin: 0 0 10px 0;
        color: #4CAF50;
    }

    .upgrade-content p {
        margin: 5px 0;
    }

    .close-message {
        margin-top: 15px;
        padding: 8px 16px;
        background: #4CAF50;
        border: none;
        border-radius: 4px;
        color: white;
        cursor: pointer;
    }

    .disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .disabled:hover {
        background: none !important;
    }
`;
document.head.appendChild(style);