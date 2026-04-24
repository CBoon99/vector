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
import * as pixelEdit from './services/pixelEditService.js';
import VectorizationService from './services/vectorizationService.js';
import ExportService from './services/exportService.js';
import documentationService from './services/documentationService.js';
import { LayerPanel } from './components/layer-panel.js';
import SmartShapeTool from './tools/smart-shape-tool.js';
import SmartConstraintsTool from './tools/smart-constraints-tool.js';
import { initColorPickerWheel } from './components/colorPickerWheel.js';

class App {
    constructor(canvasElement) {
        // Initialize environment manager early
        EnvironmentManager.init();
        
        this.stateManager = new StateManager();
        this.layerManager = new LayerManager();
        this.canvasManager = new CanvasManager(
            canvasElement || document.getElementById('drawing-canvas')
        );
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

        const canvasSection = document.getElementById('canvas-section');
        if (canvasSection) {
            canvasSection.classList.remove('hidden');
        }
    }

    initializeServices() {
        // Initialize error tracking
        this.errorTracker = new ErrorTracker();

        // Initialize core components
        this.stateManager.setLayerManager(this.layerManager);
        this.stateManager.setCanvasManager(this.canvasManager);

        // Initialize services
        this.documentationService = documentationService;

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
        this.initializeSnap();
        this.initializeVectorize();
        this.initializeEyedropper();
    }

    initializeSnap() {
        const snapCheckbox = document.getElementById('snap-grid');
        const gridSizeInput = document.getElementById('grid-size');

        const applyFromUI = () => {
            const on = snapCheckbox ? !!snapCheckbox.checked : false;
            const size = gridSizeInput ? Number(gridSizeInput.value) || 8 : 8;
            this.canvasManager.setGridSize(size);
            this.canvasManager.setSnapToGrid(on);
        };

        // Initialize state from current UI values
        applyFromUI();

        if (snapCheckbox) {
            snapCheckbox.addEventListener('change', applyFromUI);
        }
        if (gridSizeInput) {
            gridSizeInput.addEventListener('input', applyFromUI);
            gridSizeInput.addEventListener('change', applyFromUI);
        }
    }

    initializeVectorize() {
        const btn = document.getElementById('vectorize');
        if (!btn) return;
        btn.addEventListener('click', () => this.handleVectorize().catch((e) => {
            ErrorHandler.handle(e, 'vectorize');
        }));
    }

    initializeEyedropper() {
        const eyedropperBtn = document.getElementById('eyedropper-tool');
        if (!eyedropperBtn) {
            console.warn('[DEBUG] Eyedropper button not found');
            return;
        }

        console.log('[DEBUG] Eyedropper initialized');

        eyedropperBtn.addEventListener('click', () => {
            console.log('[DEBUG] Eyedropper activated');
            this.stateManager.setCurrentTool('eyedropper-tool');
            this.updateToolUI('eyedropper-tool');
            UIService.showMessage('Click on a pixel to pick its color', 'info');
        });

        // Handle eyedropper clicks on canvas
        this.canvasManager.canvas.addEventListener('click', (e) => {
            if (this.stateManager.currentTool !== 'eyedropper-tool') return;

            console.log('[DEBUG] Eyedropper click detected');

            // Get pixel color from canvas
            const rect = this.canvasManager.canvas.getBoundingClientRect();
            // Convert screen coordinates to canvas coordinates
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const x = Math.round((screenX - this.canvasManager.offsetX) / this.canvasManager.scale);
            const y = Math.round((screenY - this.canvasManager.offsetY) / this.canvasManager.scale);

            console.log(`[DEBUG] Click coords: screen(${screenX}, ${screenY}) → canvas(${x}, ${y})`);
            console.log(`[DEBUG] Canvas scale: ${this.canvasManager.scale}, offset: (${this.canvasManager.offsetX}, ${this.canvasManager.offsetY})`);

            // Get image data at that point
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvasManager.canvas.width;
            tempCanvas.height = this.canvasManager.canvas.height;
            const tempCtx = tempCanvas.getContext('2d');

            // Draw all objects to temp canvas
            const objects = this.layerManager.getAllObjects();
            console.log(`[DEBUG] Drawing ${objects.length} objects to temp canvas`);
            objects.forEach(obj => {
                if (obj.type === 'raster' && obj.image) {
                    console.log(`[DEBUG] Drawing raster at (${obj.x}, ${obj.y}) size ${obj.width}x${obj.height}`);
                    tempCtx.drawImage(obj.image, obj.x, obj.y, obj.width, obj.height);
                }
            });

            // Get color at click point
            const imageData = tempCtx.getImageData(x, y, 1, 1).data;
            console.log(`[DEBUG] Pixel RGBA: ${imageData[0]},${imageData[1]},${imageData[2]},${imageData[3]}`);
            const hex = '#' + ('000000' + (imageData[0] * 65536 + imageData[1] * 256 + imageData[2]).toString(16)).slice(-6);
            console.log(`[DEBUG] Picked color: ${hex}`);

            // Update color picker
            const hexInput = document.getElementById('hex-input');
            if (hexInput) {
                console.log(`[DEBUG] Updating HEX input to ${hex}`);
                hexInput.value = hex;
                hexInput.dispatchEvent(new Event('input'));
            } else {
                console.warn('[DEBUG] HEX input not found!');
            }

            // Switch to pixel tool
            console.log('[DEBUG] Switching to pixel tool');
            this.selectTool('pixel-tool');
            UIService.showMessage(`Color picked: ${hex}. Now use Pixel tool to paint.`, 'success');
        });
    }

    async handleVectorize() {
        // Find a raster to vectorize: prefer selection, else top-most raster.
        const layers = this.layerManager.getLayers();
        let target = null;
        const selection = this.stateManager.getSelection?.() || [];
        if (selection.length) {
            target = selection.find((o) => o && o.type === 'raster') || null;
        }
        if (!target) {
            outer: for (let i = layers.length - 1; i >= 0; i--) {
                const objs = layers[i].objects || [];
                for (let j = objs.length - 1; j >= 0; j--) {
                    if (objs[j].type === 'raster') {
                        target = objs[j];
                        break outer;
                    }
                }
            }
        }
        if (!target || !target.image) {
            UIService.showMessage('Load an image first, then press Vectorize.', 'info');
            return;
        }

        const cellSize = Math.max(2, Number(this.canvasManager.gridSize) || 8);
        const { cellularVectorizeFromImage } = await import('./services/cellularVectorize.js');

        // Render at full image resolution, one cell per grid unit.
        // maxSide is set to the image's larger side so no downscaling happens.
        const w = target.image.naturalWidth || target.image.width || 1;
        const h = target.image.naturalHeight || target.image.height || 1;
        const cells = cellularVectorizeFromImage(target.image, {
            maxSide: Math.max(w, h),
            cellSize
        });
        if (!cells.length) {
            UIService.showMessage('Vectorize produced no cells.', 'error');
            return;
        }

        // Scale cells from image space into the raster's on-canvas footprint,
        // and translate to the raster's position so the mosaic lines up with the image.
        const sx = (target.width || w) / w;
        const sy = (target.height || h) / h;
        for (const cell of cells) {
            cell.x = target.x + cell.x * sx;
            cell.y = target.y + cell.y * sy;
            cell.width = cell.width * sx;
            cell.height = cell.height * sy;
        }

        this.layerManager.addObjects(cells);
        this.stateManager.saveHistory?.();
        this.canvasManager.draw();
        UIService.showMessage(`Vectorized to ${cells.length} cells`, 'success');
    }

    initializeColorPicker() {
        const self = this;
        initColorPickerWheel({
            stateManager: this.stateManager,
            requestRedraw: () => {
                try {
                    if (self.canvasManager && typeof self.canvasManager.draw === 'function') {
                        self.canvasManager.draw();
                    }
                } catch (err) {
                    console.error('[DEBUG] Error in requestRedraw:', err);
                }
            }
        });
    }

    initializeSettings() {
        /* Placeholder for settings panel */
    }

    initializeExport() {
        this.wireBasicExportButtons();
        if (document.getElementById('export-preset')) {
            this.initializeExportControls();
        }
    }

    wireBasicExportButtons() {
        const safeExport = (format) => {
            this.exportDocument(format).catch(() => {});
        };
        const map = [
            ['export-svg', 'svg'],
            ['export-png', 'png'],
            ['export-jpg', 'jpg'],
            ['export-pdf', 'pdf']
        ];
        for (const [id, fmt] of map) {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', () => safeExport(fmt));
            }
        }
        const sel = document.getElementById('export-selection');
        if (sel) {
            sel.addEventListener('click', () => {
                this.exportSelection('svg').catch(() => {});
            });
        }
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
        if (!controlsGrid) {
            return;
        }
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
        this.setupZoomControls();
        this.setupSnapToGridControls();
        this.setupExportControls();
    }

    setupFileUploadListeners() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-upload');
        const browseButton = document.getElementById('browse-button');
        if (!uploadArea || !fileInput || !browseButton) {
            return;
        }

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
                const shapeControls = document.getElementById('shape-controls');
                if (shapeControls) {
                    shapeControls.style.display = toolId === 'shape-tool' ? 'block' : 'none';
                }
            });
        });
    }

    setupHelpModalListeners() {
        const helpModal = document.getElementById('help-modal');
        const closeHelp = document.getElementById('close-help');
        if (!helpModal) {
            return;
        }

        if (closeHelp) {
            closeHelp.addEventListener('click', () => {
                UIService.hideModal('help-modal');
            });
        }

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
        if (documentationButton) {
            documentationButton.addEventListener('click', () => {
                this.documentationService.showDocumentation();
            });
        }
    }

    setupZoomControls() {
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const resetZoomBtn = document.getElementById('reset-zoom');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.canvasManager.zoomIn();
                this.canvasManager.draw();
            });
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.canvasManager.zoomOut();
                this.canvasManager.draw();
            });
        }

        if (resetZoomBtn) {
            resetZoomBtn.addEventListener('click', () => {
                this.canvasManager.resetZoom();
                this.canvasManager.draw();
            });
        }

        // Also handle mouse wheel zoom
        this.canvasManager.canvas.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    this.canvasManager.zoomIn();
                } else {
                    this.canvasManager.zoomOut();
                }
                this.canvasManager.draw();
            }
        });
    }

    setupSnapToGridControls() {
        const snapGridCheckbox = document.getElementById('snap-grid');
        const gridSizeInput = document.getElementById('grid-size');

        if (snapGridCheckbox) {
            snapGridCheckbox.addEventListener('change', (e) => {
                this.canvasManager.snapToGrid = e.target.checked;
                this.canvasManager.scheduleDraw();
            });
            // Set initial state
            this.canvasManager.snapToGrid = snapGridCheckbox.checked;
        }

        if (gridSizeInput) {
            gridSizeInput.addEventListener('change', (e) => {
                const size = parseInt(e.target.value, 10);
                if (!isNaN(size) && size > 0) {
                    this.canvasManager.setGridSize(size);
                }
            });
            // Set initial state
            const initialSize = parseInt(gridSizeInput.value, 10);
            if (!isNaN(initialSize) && initialSize > 0) {
                this.canvasManager.setGridSize(initialSize);
            }
        }
    }

    setupExportControls() {
        const pngTransCheckbox = document.getElementById('png-transparent');
        const pngBgControl = document.getElementById('png-bg-control');

        if (pngTransCheckbox && pngBgControl) {
            pngTransCheckbox.addEventListener('change', (e) => {
                // Show background color control only when NOT transparent
                pngBgControl.style.display = e.target.checked ? 'none' : 'block';
            });
        }
    }

    async handleFiles(fileList) {
        if (!fileList || !fileList.length) {
            return;
        }
        for (const file of fileList) {
            try {
                const rasterOnly = document.getElementById('import-raster-only')?.checked;
                const opts = {
                    cellPoster: document.getElementById('import-cell-poster')?.checked,
                    rasterOnly
                };
                let result = await FileImportService.importFile(file, opts);
                let list = Array.isArray(result) ? result : result ? [result] : [];
                const mime = (file.type || '').toLowerCase();
                const lowerName = (file.name || '').toLowerCase();
                const isSvg = mime.includes('svg') || lowerName.endsWith('.svg');
                const looksLikeRaster =
                    (mime.startsWith('image/') && !isSvg) ||
                    /\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(lowerName);
                if (!list.length && looksLikeRaster && !rasterOnly) {
                    result = await FileImportService.importFile(file, {
                        ...opts,
                        rasterOnly: true,
                        cellPoster: false
                    });
                    list = Array.isArray(result) ? result : result ? [result] : [];
                }
                if (list.length) {
                    this.layerManager.addObjects(list);
                    this.canvasManager.draw();
                    requestAnimationFrame(() => this.canvasManager.draw());

                    // Auto-fit first raster image to canvas
                    const firstRaster = list.find(obj => obj.type === 'raster');
                    if (firstRaster && firstRaster.image) {
                        this.autoFitImageToViewport(firstRaster);
                    }

                    this.showImageUploadFeedback(file);
                    UIService.showMessage('Added to canvas', 'success');
                } else {
                    UIService.showMessage('No drawable content in file', 'info');
                }
            } catch (error) {
                ErrorHandler.handle(error, 'handleFiles');
            }
        }
    }

    autoFitImageToViewport(imageObj) {
        if (!imageObj || !imageObj.image) {
            console.warn('[DEBUG] Cannot auto-fit: no image object');
            return;
        }

        const imgWidth = imageObj.image.naturalWidth || imageObj.image.width || 100;
        const imgHeight = imageObj.image.naturalHeight || imageObj.image.height || 100;
        const canvasWidth = this.canvasManager.canvas.width;
        const canvasHeight = this.canvasManager.canvas.height;

        // Calculate scale to fit image in viewport with padding
        const padding = 40;
        const availWidth = canvasWidth - padding * 2;
        const availHeight = canvasHeight - padding * 2;
        const scaleX = availWidth / imgWidth;
        const scaleY = availHeight / imgHeight;
        const fitScale = Math.min(scaleX, scaleY, 1); // Don't upscale

        // Position at center
        const scaledWidth = imgWidth * fitScale;
        const scaledHeight = imgHeight * fitScale;
        imageObj.x = (canvasWidth - scaledWidth) / 2;
        imageObj.y = (canvasHeight - scaledHeight) / 2;
        imageObj.width = scaledWidth;
        imageObj.height = scaledHeight;

        // Reset zoom to fit the content
        this.canvasManager.resetZoom();

        console.log(`[DEBUG] Auto-fitted image: ${imgWidth}x${imgHeight} → ${scaledWidth.toFixed(0)}x${scaledHeight.toFixed(0)} at (${imageObj.x.toFixed(0)}, ${imageObj.y.toFixed(0)})`);
        this.canvasManager.draw();
    }

    showImageUploadFeedback(file) {
        if (!file) {
            return;
        }
        const type = String(file.type || '');
        const name = (file.name || '').toLowerCase();
        const isRasterBitmap =
            (type.startsWith('image/') && !type.includes('svg')) ||
            /\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(name);
        if (!isRasterBitmap) {
            return;
        }
        const thumb = document.getElementById('thumbnail-preview');
        if (thumb) {
            if (thumb.dataset.objectUrl) {
                try {
                    URL.revokeObjectURL(thumb.dataset.objectUrl);
                } catch (_) {
                    /* ignore */
                }
            }
            const objectUrl = URL.createObjectURL(file);
            thumb.dataset.objectUrl = objectUrl;
            thumb.src = objectUrl;
            thumb.classList.remove('hidden');
        }
        const ok = document.getElementById('confirmation-message');
        if (ok) {
            ok.classList.remove('hidden');
            setTimeout(() => ok.classList.add('hidden'), 2500);
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

    getStrokeColor() {
        return this.stateManager.getState().currentColor;
    }

    handleDrawStart(point) {
        try {
            if (this.stateManager.currentTool === 'pixel-tool') {
                console.log(`[DEBUG] Pixel tool: Click at (${point.x}, ${point.y}), color: ${this.getStrokeColor()}`);
                const obj = pixelEdit.findRasterUnderPoint(
                    this.layerManager.getLayers(),
                    point.x,
                    point.y
                );
                if (obj) {
                    console.log(`[DEBUG] Found raster at (${obj.x}, ${obj.y}) size ${obj.width}x${obj.height}`);
                    pixelEdit.paintPixelOnRaster(obj, point.x, point.y, this.getStrokeColor());
                    this.canvasManager.draw();
                } else {
                    console.warn(`[DEBUG] No raster found under point (${point.x}, ${point.y})`);
                }
                return;
            }
            const constrainedPoint = this.smartConstraints.applyConstraints(point);
            this.stateManager.startDrawing(constrainedPoint);
            this.canvasManager.draw();
        } catch (error) {
            ErrorHandler.handle(error, 'handleDrawStart');
        }
    }

    handleDraw(point) {
        try {
            if (this.stateManager.currentTool === 'pixel-tool') {
                const obj = pixelEdit.findRasterUnderPoint(
                    this.layerManager.getLayers(),
                    point.x,
                    point.y
                );
                if (obj) {
                    pixelEdit.paintPixelOnRaster(obj, point.x, point.y, this.getStrokeColor());
                    this.canvasManager.draw();
                } else {
                    // Silently ignore if dragging outside raster area
                }
                return;
            }
            const constrainedPoint = this.smartConstraints.applyConstraints(point);
            this.stateManager.updateDrawing(constrainedPoint);
            this.canvasManager.draw();
        } catch (error) {
            ErrorHandler.handle(error, 'handleDraw');
        }
    }

    handleDrawEnd(point) {
        try {
            if (this.stateManager.currentTool === 'pixel-tool') {
                return;
            }
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
        if (!Array.isArray(features)) {
            return;
        }
        const toolButtons = document.querySelectorAll('#drawing-tools button');
        toolButtons.forEach((button) => {
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
            const baseName =
                document.getElementById('filename')?.value?.trim()?.replace(/[^a-zA-Z0-9_-]/g, '_') ||
                'vectorized';
            const vectorDoc = {
                objects: this.layerManager.getAllObjects(),
                width: this.canvasManager.canvas.width,
                height: this.canvasManager.canvas.height,
                metadata: this.stateManager.getMetadata()
            };

            const presetEl = document.getElementById('export-preset');
            const qualityEl = document.getElementById('export-quality');
            const metaEl = document.getElementById('include-metadata');
            const stylesEl = document.getElementById('include-styles');
            const compressEl = document.getElementById('compress-export');
            const transEl = document.getElementById('include-transparency');
            const svgTransEl = document.getElementById('svg-transparent');
            const pngTransEl = document.getElementById('png-transparent');
            const pngBgColorEl = document.getElementById('png-bg-color');

            const exportSettings = {
                preset: presetEl?.value || undefined,
                quality: qualityEl?.value,
                includeMetadata: metaEl ? metaEl.checked : true,
                includeStyles: stylesEl ? stylesEl.checked : true,
                compression: compressEl ? compressEl.checked : true,
                includeTransparency: transEl ? transEl.checked : true,
                // SVG transparency: false = opaque (white bg), true = transparent
                transparency: svgTransEl ? svgTransEl.checked : true,
                // PNG transparency: true = transparent background, false = colored background
                transparent: pngTransEl ? pngTransEl.checked : false,
                backgroundColor: pngBgColorEl?.value || 'white',
                ...settings
            };

            const exportedFile = await ExportService.exportDocument(vectorDoc, format, exportSettings);
            const ext = format === 'jpg' ? 'jpg' : format;
            this.downloadFile(exportedFile, `${baseName}.${ext}`);
            UIService.showMessage(`Exported ${ext.toUpperCase()}`, 'success');
        } catch (error) {
            ErrorHandler.handle(error, 'exportDocument');
        }
    }

    initializeExportControls() {
        const exportPreset = document.getElementById('export-preset');
        const exportOptions = document.querySelector('.export-options');
        if (exportPreset && exportOptions) {
            exportPreset.addEventListener('change', () => {
                exportOptions.style.display = exportPreset.value === '' ? 'block' : 'none';
            });
        }
        const jsonBtn = document.getElementById('export-json');
        if (jsonBtn) {
            jsonBtn.addEventListener('click', () => this.exportDocument('json'));
        }
    }

    async exportSelection(format, settings = {}) {
        try {
            const selection = this.stateManager.getSelection();
            if (!selection.length) {
                throw new DrawingError('No objects selected');
            }

            const exportedFile = await ExportService.exportSelection(selection, format, {
                ...settings,
                width: this.canvasManager.canvas.width,
                height: this.canvasManager.canvas.height,
                metadata: this.stateManager.getMetadata()
            });
            const base =
                document.getElementById('filename')?.value?.trim()?.replace(/[^a-zA-Z0-9_-]/g, '_') ||
                'selection';
            this.downloadFile(exportedFile, `${base}-selection.${format}`);
            UIService.showMessage('Exported selection', 'success');
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
        const on = (id, fn) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', fn);
            }
        };
        on('add-layer', () => {
            this.layerManager.addLayer();
            UIService.showMessage('Layer added', 'success');
        });
        on('delete-layer', () => {
            this.layerManager.deleteActiveLayer();
            UIService.showMessage('Layer deleted', 'success');
        });
        on('duplicate-layer', () => {
            this.layerManager.duplicateActiveLayer();
            UIService.showMessage('Layer duplicated', 'success');
        });
        on('rename-layer', () => {
            const name = prompt('Enter new layer name:');
            if (name) {
                this.layerManager.renameActiveLayer(name);
                UIService.showMessage('Layer renamed', 'success');
            }
        });
        on('toggle-layer-visibility', () => {
            this.layerManager.toggleVisibility();
            this.renderLayerList();
        });
        on('toggle-layer-lock', () => {
            this.layerManager.toggleLock();
            this.renderLayerList();
        });
        on('move-layer-up', () => {
            this.layerManager.moveLayerUp();
            this.renderLayerList();
        });
        on('move-layer-down', () => {
            this.layerManager.moveLayerDown();
            this.renderLayerList();
        });
        on('group-layers', () => {
            this.layerManager.groupSelectedLayers();
            UIService.showMessage('Layers grouped', 'success');
        });
        on('add-group', () => {
            this.layerManager.groupSelectedLayers();
            UIService.showMessage('Layers grouped', 'success');
        });
        on('ungroup-layers', () => {
            this.layerManager.ungroupSelectedLayers();
            UIService.showMessage('Layers ungrouped', 'success');
        });
    }

    initializeTools() {
        this.tools = {
            select: new SelectionTool(this.stateManager, this.layerManager),
            rectangle: new RectangleTool(),
            circle: new CircleTool(),
            polygon: new PolygonTool(this.stateManager, this.layerManager),
            bezier: new BezierTool(this.stateManager, this.layerManager),
            text: new TextTool(this.stateManager, this.layerManager),
            smartShape: new SmartShapeTool(),
            smartConstraints: new SmartConstraintsTool()
        };
        this.currentTool = this.tools.select;
        Object.values(this.tools).forEach((tool) => {
            if (tool && typeof tool.initialize === 'function') {
                tool.initialize(this.layerManager, this.stateManager);
            }
        });
    }

    setCurrentTool(toolName) {
        if (!this.tools) {
            return;
        }
        const tool = this.tools[toolName];
        if (tool) {
            if (this.currentTool && typeof this.currentTool.cleanup === 'function') {
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
        if (typeof this.handleKeyDown === 'function') {
            document.removeEventListener('keydown', this.handleKeyDown);
        }
        /* Canvas listeners are bound in CanvasManager; removed via canvasManager.cleanup() if needed */

        if (this.tools) {
            Object.values(this.tools).forEach((tool) => {
                if (tool && typeof tool.cleanup === 'function') {
                    tool.cleanup();
                }
            });
        }

        this.toolFeedback.cleanup();
        if (this.onboarding && typeof this.onboarding.cleanup === 'function') {
            this.onboarding.cleanup();
        }
        if (this.smartConstraints && typeof this.smartConstraints.cleanup === 'function') {
            this.smartConstraints.cleanup();
        }
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

function bootstrapDoppleitApp() {
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) {
        console.error('Doppleit: #drawing-canvas not found');
        return;
    }
    window.doppleitApp = new App(canvas);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapDoppleitApp);
} else {
    bootstrapDoppleitApp();
}