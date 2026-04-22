import { generateId } from '../utils/id-generator.js';

export class LayerPanel {
    constructor(layerManager, stateManager) {
        this.layerManager = layerManager;
        this.stateManager = stateManager;
        this.selectedLayers = new Set();
        this.draggedLayer = null;
        this.dragOverLayer = null;
    }

    initialize() {
        this.setupEventListeners();
        this.renderLayerList();
    }

    setupEventListeners() {
        // Add layer button
        document.getElementById('add-layer-btn').addEventListener('click', () => {
            this.createNewLayer();
        });

        // Add group button
        document.getElementById('add-group-btn').addEventListener('click', () => {
            this.createNewGroup();
        });

        // Delete button
        document.getElementById('delete-layer-btn').addEventListener('click', () => {
            this.deleteSelectedLayers();
        });

        // Layer visibility toggle
        document.getElementById('layer-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('visibility-toggle')) {
                const layerId = e.target.closest('.layer-item').dataset.layerId;
                this.toggleLayerVisibility(layerId);
            }
        });

        // Layer lock toggle
        document.getElementById('layer-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('lock-toggle')) {
                const layerId = e.target.closest('.layer-item').dataset.layerId;
                this.toggleLayerLock(layerId);
            }
        });

        // Layer selection
        document.getElementById('layer-list').addEventListener('click', (e) => {
            const layerItem = e.target.closest('.layer-item');
            if (layerItem && !e.target.classList.contains('layer-control')) {
                this.selectLayer(layerItem.dataset.layerId, e.shiftKey);
            }
        });

        // Layer properties
        document.getElementById('layer-properties').addEventListener('change', (e) => {
            if (e.target.matches('input, select')) {
                this.updateLayerProperties(e.target);
            }
        });

        // Merge and flatten buttons
        document.getElementById('merge-layers-btn').addEventListener('click', () => {
            this.mergeSelectedLayers();
        });

        document.getElementById('flatten-layers-btn').addEventListener('click', () => {
            this.flattenSelectedLayers();
        });

        // Drag and drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const layerList = document.getElementById('layer-list');

        layerList.addEventListener('dragstart', (e) => {
            const layerItem = e.target.closest('.layer-item');
            if (layerItem) {
                this.draggedLayer = layerItem.dataset.layerId;
                e.dataTransfer.setData('text/plain', this.draggedLayer);
                layerItem.classList.add('dragging');
            }
        });

        layerList.addEventListener('dragend', (e) => {
            const layerItem = e.target.closest('.layer-item');
            if (layerItem) {
                layerItem.classList.remove('dragging');
                this.draggedLayer = null;
                this.dragOverLayer = null;
            }
        });

        layerList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const layerItem = e.target.closest('.layer-item');
            if (layerItem && layerItem.dataset.layerId !== this.draggedLayer) {
                this.dragOverLayer = layerItem.dataset.layerId;
                this.updateDragIndicator(e);
            }
        });

        layerList.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedLayer && this.dragOverLayer) {
                this.reorderLayer(this.draggedLayer, this.dragOverLayer);
            }
        });
    }

    updateDragIndicator(event) {
        const layerList = document.getElementById('layer-list');
        const items = layerList.querySelectorAll('.layer-item');
        
        items.forEach(item => {
            item.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        const targetItem = event.target.closest('.layer-item');
        if (targetItem) {
            const rect = targetItem.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (event.clientY < midY) {
                targetItem.classList.add('drag-over-top');
            } else {
                targetItem.classList.add('drag-over-bottom');
            }
        }
    }

    createNewLayer() {
        const layer = {
            id: generateId(),
            name: `Layer ${this.layerManager.getLayers().length + 1}`,
            visible: true,
            locked: false,
            objects: []
        };

        this.layerManager.addLayer(layer);
        this.stateManager.saveState();
        this.renderLayerList();
    }

    createNewGroup() {
        const group = {
            id: generateId(),
            name: `Group ${this.layerManager.getLayers().length + 1}`,
            type: 'group',
            visible: true,
            locked: false,
            layers: []
        };

        this.layerManager.addLayer(group);
        this.stateManager.saveState();
        this.renderLayerList();
    }

    deleteSelectedLayers() {
        if (this.selectedLayers.size === 0) return;

        this.selectedLayers.forEach(layerId => {
            this.layerManager.removeLayer(layerId);
        });

        this.selectedLayers.clear();
        this.stateManager.saveState();
        this.renderLayerList();
        this.updateDeleteButton();
    }

    selectLayer(layerId, multiSelect = false) {
        if (!multiSelect) {
            this.selectedLayers.clear();
        }
        this.selectedLayers.add(layerId);
        this.renderLayerList();
        this.updateDeleteButton();
    }

    toggleLayerVisibility(layerId) {
        const layer = this.layerManager.getLayer(layerId);
        if (layer) {
            layer.visible = !layer.visible;
            this.stateManager.saveState();
            this.renderLayerList();
        }
    }

    toggleLayerLock(layerId) {
        const layer = this.layerManager.getLayer(layerId);
        if (layer) {
            layer.locked = !layer.locked;
            this.stateManager.saveState();
            this.renderLayerList();
        }
    }

    updateLayerProperties(input) {
        const layerId = input.closest('.layer-item').dataset.layerId;
        const layer = this.layerManager.getLayer(layerId);
        
        if (layer) {
            switch (input.name) {
                case 'layer-name':
                    layer.name = input.value;
                    break;
                case 'layer-opacity':
                    layer.opacity = parseFloat(input.value);
                    break;
                case 'layer-blend-mode':
                    layer.blendMode = input.value;
                    break;
            }
            
            this.stateManager.saveState();
            this.renderLayerList();
        }
    }

    mergeSelectedLayers() {
        if (this.selectedLayers.size < 2) return;

        const layers = Array.from(this.selectedLayers).map(id => this.layerManager.getLayer(id));
        const mergedLayer = this.layerManager.mergeLayers(layers);
        
        this.selectedLayers.clear();
        this.selectedLayers.add(mergedLayer.id);
        
        this.stateManager.saveState();
        this.renderLayerList();
        this.updateDeleteButton();
    }

    flattenSelectedLayers() {
        if (this.selectedLayers.size === 0) return;

        const layers = Array.from(this.selectedLayers).map(id => this.layerManager.getLayer(id));
        const flattenedLayer = this.layerManager.flattenLayers(layers);
        
        this.selectedLayers.clear();
        this.selectedLayers.add(flattenedLayer.id);
        
        this.stateManager.saveState();
        this.renderLayerList();
        this.updateDeleteButton();
    }

    reorderLayer(draggedId, targetId) {
        this.layerManager.reorderLayer(draggedId, targetId);
        this.stateManager.saveState();
        this.renderLayerList();
    }

    updateDeleteButton() {
        const deleteBtn = document.getElementById('delete-layer-btn');
        deleteBtn.disabled = this.selectedLayers.size === 0;
    }

    renderLayerList() {
        const layerList = document.getElementById('layer-list');
        const layers = this.layerManager.getLayers();
        
        layerList.innerHTML = layers.map(layer => this.createLayerItem(layer)).join('');
    }

    createLayerItem(layer) {
        const isSelected = this.selectedLayers.has(layer.id);
        const isGroup = layer.type === 'group';
        
        return `
            <div class="layer-item ${isSelected ? 'selected' : ''} ${layer.locked ? 'locked' : ''} ${!layer.visible ? 'hidden' : ''}"
                 data-layer-id="${layer.id}"
                 draggable="true">
                <div class="layer-controls">
                    <button class="visibility-toggle" title="${layer.visible ? 'Hide' : 'Show'}">
                        ${layer.visible ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button class="lock-toggle" title="${layer.locked ? 'Unlock' : 'Lock'}">
                        ${layer.locked ? '🔒' : '🔓'}
                    </button>
                </div>
                <div class="layer-info">
                    <span class="layer-name">${layer.name}</span>
                    ${isGroup ? '<span class="group-indicator">📁</span>' : ''}
                </div>
            </div>
        `;
    }

    cleanup() {
        // Remove event listeners
        document.getElementById('add-layer-btn').removeEventListener('click');
        document.getElementById('add-group-btn').removeEventListener('click');
        document.getElementById('delete-layer-btn').removeEventListener('click');
        document.getElementById('layer-list').removeEventListener('click');
        document.getElementById('layer-properties').removeEventListener('change');
        document.getElementById('merge-layers-btn').removeEventListener('click');
        document.getElementById('flatten-layers-btn').removeEventListener('click');
    }
} 