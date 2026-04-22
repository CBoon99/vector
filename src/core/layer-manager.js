// Layer Manager for Vector Graphics
class LayerManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.layers = new Map();
        this.activeLayerId = null;
        this.nextLayerId = 1;
        this.createDefaultLayer();
    }

    // Layer Creation and Management
    createDefaultLayer() {
        const defaultLayer = {
            id: 'default',
            name: 'Default Layer',
            visible: true,
            locked: false,
            opacity: 1,
            blendMode: 'normal',
            objects: new Set(),
            parent: null,
            children: new Set(),
            expanded: true,
            color: '#808080'
        };
        this.layers.set('default', defaultLayer);
        this.activeLayerId = 'default';
    }

    createLayer(options = {}) {
        const id = `layer_${this.nextLayerId++}`;
        const layer = {
            id,
            name: options.name || `Layer ${this.nextLayerId}`,
            visible: options.visible !== undefined ? options.visible : true,
            locked: options.locked || false,
            opacity: options.opacity !== undefined ? options.opacity : 1,
            blendMode: options.blendMode || 'normal',
            objects: new Set(),
            parent: options.parent || null,
            children: new Set(),
            expanded: options.expanded !== undefined ? options.expanded : true,
            color: options.color || this.generateLayerColor()
        };

        this.layers.set(id, layer);
        if (layer.parent) {
            const parentLayer = this.layers.get(layer.parent);
            if (parentLayer) {
                parentLayer.children.add(id);
            }
        }

        return id;
    }

    deleteLayer(layerId) {
        const layer = this.layers.get(layerId);
        if (!layer) return false;

        // Delete all child layers
        layer.children.forEach(childId => {
            this.deleteLayer(childId);
        });

        // Remove from parent
        if (layer.parent) {
            const parentLayer = this.layers.get(layer.parent);
            if (parentLayer) {
                parentLayer.children.delete(layerId);
            }
        }

        // Move objects to parent layer or default layer
        const targetLayerId = layer.parent || 'default';
        layer.objects.forEach(objId => {
            this.moveObjectToLayer(objId, targetLayerId);
        });

        // Remove layer
        this.layers.delete(layerId);

        // Update active layer if needed
        if (this.activeLayerId === layerId) {
            this.activeLayerId = targetLayerId;
        }

        return true;
    }

    // Layer Organization
    moveLayer(layerId, newParentId = null, index = -1) {
        const layer = this.layers.get(layerId);
        if (!layer) return false;

        // Remove from old parent
        if (layer.parent) {
            const oldParent = this.layers.get(layer.parent);
            if (oldParent) {
                oldParent.children.delete(layerId);
            }
        }

        // Add to new parent
        layer.parent = newParentId;
        if (newParentId) {
            const newParent = this.layers.get(newParentId);
            if (newParent) {
                if (index >= 0) {
                    const childrenArray = Array.from(newParent.children);
                    childrenArray.splice(index, 0, layerId);
                    newParent.children = new Set(childrenArray);
                } else {
                    newParent.children.add(layerId);
                }
            }
        }

        return true;
    }

    duplicateLayer(layerId) {
        const layer = this.layers.get(layerId);
        if (!layer) return null;

        const newLayerId = this.createLayer({
            name: `${layer.name} (Copy)`,
            visible: layer.visible,
            locked: layer.locked,
            opacity: layer.opacity,
            blendMode: layer.blendMode,
            parent: layer.parent,
            expanded: layer.expanded,
            color: layer.color
        });

        // Duplicate objects
        layer.objects.forEach(objId => {
            const obj = this.stateManager.getObject(objId);
            if (obj) {
                const newObj = this.stateManager.cloneObject(obj);
                this.addObjectToLayer(newObj.id, newLayerId);
            }
        });

        return newLayerId;
    }

    // Object Management
    addObjectToLayer(objId, layerId) {
        const layer = this.layers.get(layerId);
        if (!layer) return false;

        // Remove from current layer if exists
        this.layers.forEach(l => {
            if (l.objects.has(objId)) {
                l.objects.delete(objId);
            }
        });

        layer.objects.add(objId);
        return true;
    }

    moveObjectToLayer(objId, layerId) {
        return this.addObjectToLayer(objId, layerId);
    }

    // Layer Properties
    setLayerVisibility(layerId, visible) {
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.visible = visible;
            return true;
        }
        return false;
    }

    setLayerLock(layerId, locked) {
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.locked = locked;
            return true;
        }
        return false;
    }

    setLayerOpacity(layerId, opacity) {
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.opacity = Math.max(0, Math.min(1, opacity));
            return true;
        }
        return false;
    }

    setLayerBlendMode(layerId, blendMode) {
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.blendMode = blendMode;
            return true;
        }
        return false;
    }

    setLayerName(layerId, name) {
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.name = name;
            return true;
        }
        return false;
    }

    setLayerColor(layerId, color) {
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.color = color;
            return true;
        }
        return false;
    }

    // Layer Queries
    getLayer(layerId) {
        return this.layers.get(layerId);
    }

    getActiveLayer() {
        return this.layers.get(this.activeLayerId);
    }

    getLayerObjects(layerId) {
        const layer = this.layers.get(layerId);
        if (!layer) return new Set();

        const objects = new Set(layer.objects);
        layer.children.forEach(childId => {
            const childObjects = this.getLayerObjects(childId);
            childObjects.forEach(objId => objects.add(objId));
        });

        return objects;
    }

    getLayerHierarchy() {
        const hierarchy = [];
        this.layers.forEach(layer => {
            if (!layer.parent) {
                hierarchy.push(this.buildLayerTree(layer.id));
            }
        });
        return hierarchy;
    }

    buildLayerTree(layerId) {
        const layer = this.layers.get(layerId);
        if (!layer) return null;

        const tree = {
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            locked: layer.locked,
            opacity: layer.opacity,
            blendMode: layer.blendMode,
            color: layer.color,
            expanded: layer.expanded,
            children: []
        };

        layer.children.forEach(childId => {
            const childTree = this.buildLayerTree(childId);
            if (childTree) {
                tree.children.push(childTree);
            }
        });

        return tree;
    }

    // Layer Operations
    mergeLayers(layerIds) {
        if (layerIds.length < 2) return null;

        const targetLayerId = layerIds[0];
        const targetLayer = this.layers.get(targetLayerId);
        if (!targetLayer) return null;

        // Collect all objects
        const allObjects = new Set();
        layerIds.forEach(id => {
            const layer = this.layers.get(id);
            if (layer) {
                layer.objects.forEach(objId => allObjects.add(objId));
            }
        });

        // Move objects to target layer
        allObjects.forEach(objId => {
            this.moveObjectToLayer(objId, targetLayerId);
        });

        // Delete other layers
        layerIds.slice(1).forEach(id => {
            this.deleteLayer(id);
        });

        return targetLayerId;
    }

    flattenLayers(layerIds) {
        if (layerIds.length === 0) return null;

        // Create new layer for flattened content
        const newLayerId = this.createLayer({
            name: 'Flattened Layer',
            parent: this.layers.get(layerIds[0]).parent
        });

        // Collect and move all objects
        layerIds.forEach(id => {
            const layer = this.layers.get(id);
            if (layer) {
                layer.objects.forEach(objId => {
                    this.moveObjectToLayer(objId, newLayerId);
                });
            }
        });

        // Delete original layers
        layerIds.forEach(id => {
            this.deleteLayer(id);
        });

        return newLayerId;
    }

    // Utility Methods
    generateLayerColor() {
        const colors = [
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
            '#FF00FF', '#00FFFF', '#FFA500', '#800080'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    isLayerVisible(layerId) {
        const layer = this.layers.get(layerId);
        if (!layer) return false;

        if (!layer.visible) return false;
        if (layer.parent) {
            return this.isLayerVisible(layer.parent);
        }
        return true;
    }

    isLayerLocked(layerId) {
        const layer = this.layers.get(layerId);
        if (!layer) return false;

        if (layer.locked) return true;
        if (layer.parent) {
            return this.isLayerLocked(layer.parent);
        }
        return false;
    }

    getLayerOpacity(layerId) {
        const layer = this.layers.get(layerId);
        if (!layer) return 1;

        let opacity = layer.opacity;
        if (layer.parent) {
            opacity *= this.getLayerOpacity(layer.parent);
        }
        return opacity;
    }
}

export default LayerManager; 