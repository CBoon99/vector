import { MESSAGE_DURATION } from '../constants/features.js';
import capabilityService from './capabilityService.js';
import gestureService from './gestureService.js';

class UIService {
    constructor() {
        this.messageQueue = [];
        this.isProcessingQueue = false;
        this.currentLayout = null;
        this.featureAvailability = {};
        this.initializeUI();
        
        // Listen for capability changes
        window.addEventListener('capabilityChange', (event) => {
            this.handleCapabilityChange(event.detail);
        });

        this.listenForCapabilityChanges();
        this.initializeGestures();
    }

    initializeUI() {
        // Get recommended features
        this.featureAvailability = this.getFeatureAvailability();
        
        // Set initial layout
        this.updateLayout();
        
        // Initialize UI elements
        this.initializeUIElements();
    }

    getFeatureAvailability() {
        const features = capabilityService.getRecommendedFeatures();
        return {
            highQualityVectorization: features.includes('highQualityVectorization'),
            realtimePreview: features.includes('realtimePreview'),
            batchProcessing: features.includes('batchProcessing'),
            patternRecognition: features.includes('patternRecognition'),
            stylePreservation: features.includes('stylePreservation')
        };
    }

    handleCapabilityChange({ type, capabilities }) {
        if (type === 'screen') {
            this.updateLayout();
        } else if (type === 'device' || type === 'connection') {
            this.featureAvailability = this.getFeatureAvailability();
            this.updateFeatureVisibility();
        }
    }

    updateLayout() {
        const { screen } = capabilityService.capabilities;
        let layout;

        if (screen.isSmall) {
            layout = 'mobile';
        } else if (screen.isMedium) {
            layout = 'tablet';
        } else {
            layout = 'desktop';
        }

        if (layout !== this.currentLayout) {
            this.currentLayout = layout;
            this.applyLayout();
        }
    }

    applyLayout() {
        const container = document.querySelector('.app-container');
        if (!container) return;

        // Remove existing layout classes
        container.classList.remove('layout-mobile', 'layout-tablet', 'layout-desktop');
        
        // Add new layout class
        container.classList.add(`layout-${this.currentLayout}`);

        // Update UI elements based on layout
        this.updateUIElements();
    }

    initializeUIElements() {
        // Create main UI structure
        const container = document.createElement('div');
        container.className = 'app-container';
        
        // Create toolbar
        const toolbar = this.createToolbar();
        container.appendChild(toolbar);
        
        // Create main content area
        const content = this.createContentArea();
        container.appendChild(content);
        
        // Create sidebar
        const sidebar = this.createSidebar();
        container.appendChild(sidebar);
        
        // Add to document
        document.body.appendChild(container);
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'toolbar';
        
        // Add basic tools that are always available
        const basicTools = [
            { id: 'import', label: 'Import', icon: '📁' },
            { id: 'export', label: 'Export', icon: '📤' },
            { id: 'undo', label: 'Undo', icon: '↩️' },
            { id: 'redo', label: 'Redo', icon: '↪️' }
        ];
        
        basicTools.forEach(tool => {
            const button = this.createToolButton(tool);
            toolbar.appendChild(button);
        });
        
        // Add advanced tools based on capabilities
        if (this.featureAvailability.highQualityVectorization) {
            const qualityButton = this.createToolButton({
                id: 'quality',
                label: 'Quality',
                icon: '⚡',
                submenu: [
                    { id: 'low', label: 'Low' },
                    { id: 'medium', label: 'Medium' },
                    { id: 'high', label: 'High' }
                ]
            });
            toolbar.appendChild(qualityButton);
        }
        
        return toolbar;
    }

    createContentArea() {
        const content = document.createElement('div');
        content.className = 'content-area';
        
        // Create canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';
        content.appendChild(canvasContainer);
        
        // Add preview if available
        if (this.featureAvailability.realtimePreview) {
            const preview = document.createElement('div');
            preview.className = 'preview-container';
            content.appendChild(preview);
        }
        
        return content;
    }

    createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.className = 'sidebar';
        
        // Add basic panels
        const basicPanels = [
            { id: 'layers', label: 'Layers', icon: '📑' },
            { id: 'properties', label: 'Properties', icon: '⚙️' }
        ];
        
        basicPanels.forEach(panel => {
            const panelElement = this.createPanel(panel);
            sidebar.appendChild(panelElement);
        });
        
        // Add advanced panels based on capabilities
        if (this.featureAvailability.patternRecognition) {
            const patternPanel = this.createPanel({
                id: 'patterns',
                label: 'Patterns',
                icon: '🔄'
            });
            sidebar.appendChild(patternPanel);
        }
        
        if (this.featureAvailability.stylePreservation) {
            const stylePanel = this.createPanel({
                id: 'styles',
                label: 'Styles',
                icon: '🎨'
            });
            sidebar.appendChild(stylePanel);
        }
        
        return sidebar;
    }

    createToolButton({ id, label, icon, submenu }) {
        const button = document.createElement('button');
        button.className = 'tool-button';
        button.dataset.tool = id;
        
        const iconSpan = document.createElement('span');
        iconSpan.className = 'tool-icon';
        iconSpan.textContent = icon;
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'tool-label';
        labelSpan.textContent = label;
        
        button.appendChild(iconSpan);
        button.appendChild(labelSpan);
        
        if (submenu) {
            const submenuElement = this.createSubmenu(submenu);
            button.appendChild(submenuElement);
            button.classList.add('has-submenu');
        }
        
        return button;
    }

    createPanel({ id, label, icon }) {
        const panel = document.createElement('div');
        panel.className = 'panel';
        panel.dataset.panel = id;
        
        const header = document.createElement('div');
        header.className = 'panel-header';
        
        const iconSpan = document.createElement('span');
        iconSpan.className = 'panel-icon';
        iconSpan.textContent = icon;
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'panel-label';
        labelSpan.textContent = label;
        
        header.appendChild(iconSpan);
        header.appendChild(labelSpan);
        
        const content = document.createElement('div');
        content.className = 'panel-content';
        
        panel.appendChild(header);
        panel.appendChild(content);
        
        return panel;
    }

    createSubmenu(items) {
        const submenu = document.createElement('div');
        submenu.className = 'submenu';
        
        items.forEach(item => {
            const option = document.createElement('div');
            option.className = 'submenu-item';
            option.dataset.value = item.id;
            option.textContent = item.label;
            submenu.appendChild(option);
        });
        
        return submenu;
    }

    updateFeatureVisibility() {
        // Update toolbar
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            this.updateToolbar(toolbar);
        }
        
        // Update sidebar
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            this.updateSidebar(sidebar);
        }
        
        // Update preview
        const preview = document.querySelector('.preview-container');
        if (preview) {
            preview.style.display = this.featureAvailability.realtimePreview ? 'block' : 'none';
        }
    }

    updateToolbar(toolbar) {
        // Update quality button visibility
        const qualityButton = toolbar.querySelector('[data-tool="quality"]');
        if (qualityButton) {
            qualityButton.style.display = this.featureAvailability.highQualityVectorization ? 'block' : 'none';
        }
    }

    updateSidebar(sidebar) {
        // Update pattern panel visibility
        const patternPanel = sidebar.querySelector('[data-panel="patterns"]');
        if (patternPanel) {
            patternPanel.style.display = this.featureAvailability.patternRecognition ? 'block' : 'none';
        }
        
        // Update style panel visibility
        const stylePanel = sidebar.querySelector('[data-panel="styles"]');
        if (stylePanel) {
            stylePanel.style.display = this.featureAvailability.stylePreservation ? 'block' : 'none';
        }
    }

    updateUIElements() {
        // Update element sizes and positions based on layout
        const container = document.querySelector('.app-container');
        if (!container) return;

        // Update toolbar
        const toolbar = container.querySelector('.toolbar');
        if (toolbar) {
            this.updateToolbarLayout(toolbar);
        }

        // Update content area
        const content = container.querySelector('.content-area');
        if (content) {
            this.updateContentLayout(content);
        }

        // Update sidebar
        const sidebar = container.querySelector('.sidebar');
        if (sidebar) {
            this.updateSidebarLayout(sidebar);
        }
    }

    updateToolbarLayout(toolbar) {
        if (this.currentLayout === 'mobile') {
            toolbar.classList.add('toolbar-mobile');
            toolbar.classList.remove('toolbar-tablet', 'toolbar-desktop');
        } else if (this.currentLayout === 'tablet') {
            toolbar.classList.add('toolbar-tablet');
            toolbar.classList.remove('toolbar-mobile', 'toolbar-desktop');
        } else {
            toolbar.classList.add('toolbar-desktop');
            toolbar.classList.remove('toolbar-mobile', 'toolbar-tablet');
        }
    }

    updateContentLayout(content) {
        if (this.currentLayout === 'mobile') {
            content.classList.add('content-mobile');
            content.classList.remove('content-tablet', 'content-desktop');
        } else if (this.currentLayout === 'tablet') {
            content.classList.add('content-tablet');
            content.classList.remove('content-mobile', 'content-desktop');
        } else {
            content.classList.add('content-desktop');
            content.classList.remove('content-mobile', 'content-tablet');
        }
    }

    updateSidebarLayout(sidebar) {
        if (this.currentLayout === 'mobile') {
            sidebar.classList.add('sidebar-mobile');
            sidebar.classList.remove('sidebar-tablet', 'sidebar-desktop');
        } else if (this.currentLayout === 'tablet') {
            sidebar.classList.add('sidebar-tablet');
            sidebar.classList.remove('sidebar-mobile', 'sidebar-desktop');
        } else {
            sidebar.classList.add('sidebar-desktop');
            sidebar.classList.remove('sidebar-mobile', 'sidebar-tablet');
        }
    }

    showMessage(message, type = 'info') {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        document.body.appendChild(messageElement);
        
        // Remove message after duration
        setTimeout(() => {
            messageElement.remove();
        }, MESSAGE_DURATION);
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    addClass(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add(className);
        }
    }

    removeClass(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove(className);
        }
    }

    createButton(id, text, className = 'button', title = '') {
        const button = document.createElement('button');
        button.id = id;
        button.className = className;
        button.innerHTML = text;
        if (title) {
            button.title = title;
        }
        return button;
    }

    createControlGroup() {
        const group = document.createElement('div');
        group.className = 'control-group';
        return group;
    }

    listenForCapabilityChanges() {
        // ... existing code ...
    }

    initializeGestures() {
        // Attach gesture handlers to main content area
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            gestureService.attachToElement(contentArea);
        }

        // Register custom gesture handlers
        gestureService.registerGestureHandler('swipeLeft', () => this.handleSwipeLeft());
        gestureService.registerGestureHandler('swipeRight', () => this.handleSwipeRight());
        gestureService.registerGestureHandler('swipeUp', () => this.handleSwipeUp());
        gestureService.registerGestureHandler('swipeDown', () => this.handleSwipeDown());
        gestureService.registerGestureHandler('doubleTap', () => this.handleDoubleTap());
        gestureService.registerGestureHandler('pinch', (scale) => this.handlePinch(scale));
    }

    handleSwipeLeft() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.add('active');
            this.showMessage('Sidebar opened', 'info');
        }
    }

    handleSwipeRight() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            this.showMessage('Sidebar closed', 'info');
        }
    }

    handleSwipeUp() {
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            toolbar.classList.remove('collapsed');
            this.showMessage('Toolbar shown', 'info');
        }
    }

    handleSwipeDown() {
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            toolbar.classList.add('collapsed');
            this.showMessage('Toolbar hidden', 'info');
        }
    }

    handleDoubleTap() {
        const canvas = document.querySelector('.canvas-container');
        if (canvas) {
            const currentScale = parseFloat(canvas.style.transform.replace('scale(', '').replace(')', '')) || 1;
            const newScale = currentScale === 1 ? 2 : 1;
            canvas.style.transform = `scale(${newScale})`;
            this.showMessage(`Zoom level: ${newScale}x`, 'info');
        }
    }

    handlePinch(scale) {
        const canvas = document.querySelector('.canvas-container');
        if (canvas) {
            const currentScale = parseFloat(canvas.style.transform.replace('scale(', '').replace(')', '')) || 1;
            const newScale = Math.min(Math.max(0.5, currentScale * scale), 3);
            canvas.style.transform = `scale(${newScale})`;
            this.showMessage(`Zoom level: ${newScale.toFixed(1)}x`, 'info');
        }
    }
}

export default new UIService(); 