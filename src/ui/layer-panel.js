// Layer Panel UI Component
class LayerPanel {
    constructor(layerManager, stateManager) {
        this.layerManager = layerManager;
        this.stateManager = stateManager;
        this.selectedLayers = new Set();
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'layer-panel';
        this.panel.innerHTML = `
            <div class="layer-header">
                <h3>Layers</h3>
                <div class="layer-actions">
                    <button class="new-layer" title="New Layer">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                    </button>
                    <button class="new-group" title="New Group">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                        </svg>
                    </button>
                    <button class="delete-layer" title="Delete Layer" disabled>
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="layer-list"></div>
            <div class="layer-properties" style="display: none;">
                <h4>Layer Properties</h4>
                <div class="property-group">
                    <label>Name</label>
                    <input type="text" class="layer-name">
                </div>
                <div class="property-group">
                    <label>Opacity</label>
                    <input type="range" class="layer-opacity" min="0" max="100" value="100">
                    <span class="opacity-value">100%</span>
                </div>
                <div class="property-group">
                    <label>Blend Mode</label>
                    <select class="layer-blend-mode">
                        <option value="normal">Normal</option>
                        <option value="multiply">Multiply</option>
                        <option value="screen">Screen</option>
                        <option value="overlay">Overlay</option>
                        <option value="darken">Darken</option>
                        <option value="lighten">Lighten</option>
                        <option value="color-dodge">Color Dodge</option>
                        <option value="color-burn">Color Burn</option>
                        <option value="hard-light">Hard Light</option>
                        <option value="soft-light">Soft Light</option>
                        <option value="difference">Difference</option>
                        <option value="exclusion">Exclusion</option>
                        <option value="hue">Hue</option>
                        <option value="saturation">Saturation</option>
                        <option value="color">Color</option>
                        <option value="luminosity">Luminosity</option>
                    </select>
                </div>
                <div class="property-group">
                    <label>Color</label>
                    <input type="color" class="layer-color">
                </div>
                <div class="property-actions">
                    <button class="merge-layers" disabled>Merge Layers</button>
                    <button class="flatten-layers" disabled>Flatten Layers</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateLayerList();
    }

    setupEventListeners() {
        // New layer button
        this.panel.querySelector('.new-layer').addEventListener('click', () => {
            this.createNewLayer();
        });

        // New group button
        this.panel.querySelector('.new-group').addEventListener('click', () => {
            this.createNewGroup();
        });

        // Delete layer button
        this.panel.querySelector('.delete-layer').addEventListener('click', () => {
            this.deleteSelectedLayers();
        });

        // Layer list events
        this.panel.querySelector('.layer-list').addEventListener('click', (e) => {
            const layerItem = e.target.closest('.layer-item');
            if (layerItem) {
                const layerId = layerItem.dataset.layerId;
                if (e.ctrlKey || e.metaKey) {
                    this.toggleLayerSelection(layerId);
                } else {
                    this.selectLayer(layerId);
                }
            }

            // Handle visibility toggle
            if (e.target.classList.contains('layer-visibility')) {
                const layerId = e.target.closest('.layer-item').dataset.layerId;
                this.toggleLayerVisibility(layerId);
            }

            // Handle lock toggle
            if (e.target.classList.contains('layer-lock')) {
                const layerId = e.target.closest('.layer-item').dataset.layerId;
                this.toggleLayerLock(layerId);
            }

            // Handle expand/collapse
            if (e.target.classList.contains('layer-expand')) {
                const layerId = e.target.closest('.layer-item').dataset.layerId;
                this.toggleLayerExpand(layerId);
            }
        });

        // Layer properties events
        this.panel.querySelector('.layer-name').addEventListener('change', (e) => {
            this.updateLayerName(e.target.value);
        });

        this.panel.querySelector('.layer-opacity').addEventListener('input', (e) => {
            const value = e.target.value;
            this.panel.querySelector('.opacity-value').textContent = `${value}%`;
            this.updateLayerOpacity(value / 100);
        });

        this.panel.querySelector('.layer-blend-mode').addEventListener('change', (e) => {
            this.updateLayerBlendMode(e.target.value);
        });

        this.panel.querySelector('.layer-color').addEventListener('change', (e) => {
            this.updateLayerColor(e.target.value);
        });

        // Merge and flatten buttons
        this.panel.querySelector('.merge-layers').addEventListener('click', () => {
            this.mergeSelectedLayers();
        });

        this.panel.querySelector('.flatten-layers').addEventListener('click', () => {
            this.flattenSelectedLayers();
        });

        // Drag and drop for layer reordering
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const layerList = this.panel.querySelector('.layer-list');
        let draggedItem = null;

        layerList.addEventListener('dragstart', (e) => {
            const layerItem = e.target.closest('.layer-item');
            if (layerItem) {
                draggedItem = layerItem;
                e.dataTransfer.setData('text/plain', layerItem.dataset.layerId);
                layerItem.classList.add('dragging');
            }
        });

        layerList.addEventListener('dragend', (e) => {
            if (draggedItem) {
                draggedItem.classList.remove('dragging');
                draggedItem = null;
            }
        });

        layerList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const layerItem = e.target.closest('.layer-item');
            if (layerItem && layerItem !== draggedItem) {
                const rect = layerItem.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                layerItem.classList.remove('drop-above', 'drop-below');
                layerItem.classList.add(e.clientY < midY ? 'drop-above' : 'drop-below');
            }
        });

        layerList.addEventListener('dragleave', (e) => {
            const layerItem = e.target.closest('.layer-item');
            if (layerItem) {
                layerItem.classList.remove('drop-above', 'drop-below');
            }
        });

        layerList.addEventListener('drop', (e) => {
            e.preventDefault();
            const layerItem = e.target.closest('.layer-item');
            if (layerItem && draggedItem) {
                const sourceId = draggedItem.dataset.layerId;
                const targetId = layerItem.dataset.layerId;
                const rect = layerItem.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                const position = e.clientY < midY ? 'before' : 'after';

                this.moveLayer(sourceId, targetId, position);
                layerItem.classList.remove('drop-above', 'drop-below');
            }
        });
    }

    createNewLayer() {
        const layerId = this.layerManager.createLayer();
        this.updateLayerList();
        this.selectLayer(layerId);
    }

    createNewGroup() {
        const groupId = this.layerManager.createLayer({
            name: 'New Group',
            isGroup: true
        });
        this.updateLayerList();
        this.selectLayer(groupId);
    }

    deleteSelectedLayers() {
        if (this.selectedLayers.size === 0) return;

        if (confirm('Are you sure you want to delete the selected layers?')) {
            this.selectedLayers.forEach(layerId => {
                this.layerManager.deleteLayer(layerId);
            });
            this.selectedLayers.clear();
            this.updateLayerList();
            this.hideProperties();
        }
    }

    selectLayer(layerId) {
        this.selectedLayers.clear();
        this.selectedLayers.add(layerId);
        this.updateLayerList();
        this.showProperties(layerId);
    }

    toggleLayerSelection(layerId) {
        if (this.selectedLayers.has(layerId)) {
            this.selectedLayers.delete(layerId);
        } else {
            this.selectedLayers.add(layerId);
        }
        this.updateLayerList();
        this.updatePropertiesVisibility();
    }

    toggleLayerVisibility(layerId) {
        const layer = this.layerManager.getLayer(layerId);
        if (layer) {
            this.layerManager.setLayerVisibility(layerId, !layer.visible);
            this.updateLayerList();
        }
    }

    toggleLayerLock(layerId) {
        const layer = this.layerManager.getLayer(layerId);
        if (layer) {
            this.layerManager.setLayerLock(layerId, !layer.locked);
            this.updateLayerList();
        }
    }

    toggleLayerExpand(layerId) {
        const layer = this.layerManager.getLayer(layerId);
        if (layer) {
            layer.expanded = !layer.expanded;
            this.updateLayerList();
        }
    }

    updateLayerName(name) {
        this.selectedLayers.forEach(layerId => {
            this.layerManager.setLayerName(layerId, name);
        });
        this.updateLayerList();
    }

    updateLayerOpacity(opacity) {
        this.selectedLayers.forEach(layerId => {
            this.layerManager.setLayerOpacity(layerId, opacity);
        });
        this.updateLayerList();
    }

    updateLayerBlendMode(blendMode) {
        this.selectedLayers.forEach(layerId => {
            this.layerManager.setLayerBlendMode(layerId, blendMode);
        });
        this.updateLayerList();
    }

    updateLayerColor(color) {
        this.selectedLayers.forEach(layerId => {
            this.layerManager.setLayerColor(layerId, color);
        });
        this.updateLayerList();
    }

    mergeSelectedLayers() {
        if (this.selectedLayers.size < 2) return;

        const layerIds = Array.from(this.selectedLayers);
        const mergedLayerId = this.layerManager.mergeLayers(layerIds);
        if (mergedLayerId) {
            this.selectedLayers.clear();
            this.selectedLayers.add(mergedLayerId);
            this.updateLayerList();
            this.showProperties(mergedLayerId);
        }
    }

    flattenSelectedLayers() {
        if (this.selectedLayers.size === 0) return;

        const layerIds = Array.from(this.selectedLayers);
        const flattenedLayerId = this.layerManager.flattenLayers(layerIds);
        if (flattenedLayerId) {
            this.selectedLayers.clear();
            this.selectedLayers.add(flattenedLayerId);
            this.updateLayerList();
            this.showProperties(flattenedLayerId);
        }
    }

    moveLayer(sourceId, targetId, position) {
        const targetLayer = this.layerManager.getLayer(targetId);
        if (!targetLayer) return;

        const newParentId = targetLayer.parent;
        const targetIndex = position === 'before' ? 0 : 1;
        this.layerManager.moveLayer(sourceId, newParentId, targetIndex);
        this.updateLayerList();
    }

    updateLayerList() {
        const list = this.panel.querySelector('.layer-list');
        const hierarchy = this.layerManager.getLayerHierarchy();
        
        list.innerHTML = this.renderLayerHierarchy(hierarchy);
        this.updatePropertiesVisibility();
    }

    renderLayerHierarchy(hierarchy, depth = 0) {
        return hierarchy.map(layer => `
            <div class="layer-item ${this.selectedLayers.has(layer.id) ? 'selected' : ''}"
                 data-layer-id="${layer.id}"
                 style="padding-left: ${depth * 20}px"
                 draggable="true">
                <div class="layer-controls">
                    <button class="layer-visibility" title="${layer.visible ? 'Hide' : 'Show'}">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            ${layer.visible ? 
                                '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>' :
                                '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>'}
                        </svg>
                    </button>
                    <button class="layer-lock" title="${layer.locked ? 'Unlock' : 'Lock'}">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            ${layer.locked ?
                                '<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>' :
                                '<path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>'}
                        </svg>
                    </button>
                </div>
                <div class="layer-info">
                    <button class="layer-expand" style="visibility: ${layer.children.length > 0 ? 'visible' : 'hidden'}">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            ${layer.expanded ?
                                '<path d="M7 10l5 5 5-5z"/>' :
                                '<path d="M10 17l5-5-5-5z"/>'}
                        </svg>
                    </button>
                    <span class="layer-name" style="color: ${layer.color}">${layer.name}</span>
                </div>
            </div>
            ${layer.expanded && layer.children.length > 0 ? 
                this.renderLayerHierarchy(layer.children, depth + 1) : ''}
        `).join('');
    }

    showProperties(layerId) {
        const layer = this.layerManager.getLayer(layerId);
        if (!layer) return;

        const properties = this.panel.querySelector('.layer-properties');
        properties.style.display = 'block';

        // Update property values
        this.panel.querySelector('.layer-name').value = layer.name;
        this.panel.querySelector('.layer-opacity').value = layer.opacity * 100;
        this.panel.querySelector('.opacity-value').textContent = `${layer.opacity * 100}%`;
        this.panel.querySelector('.layer-blend-mode').value = layer.blendMode;
        this.panel.querySelector('.layer-color').value = layer.color;

        // Update button states
        this.panel.querySelector('.merge-layers').disabled = this.selectedLayers.size < 2;
        this.panel.querySelector('.flatten-layers').disabled = this.selectedLayers.size === 0;
    }

    hideProperties() {
        this.panel.querySelector('.layer-properties').style.display = 'none';
    }

    updatePropertiesVisibility() {
        const deleteButton = this.panel.querySelector('.delete-layer');
        deleteButton.disabled = this.selectedLayers.size === 0;

        if (this.selectedLayers.size === 1) {
            this.showProperties(Array.from(this.selectedLayers)[0]);
        } else if (this.selectedLayers.size > 1) {
            this.showProperties(Array.from(this.selectedLayers)[0]);
            this.panel.querySelector('.layer-name').value = 'Multiple Layers';
        } else {
            this.hideProperties();
        }
    }

    getPanel() {
        return this.panel;
    }
}

export default LayerPanel; 