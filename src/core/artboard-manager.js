// Artboard Manager for Multiple Artboards
class ArtboardManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.artboards = new Map();
        this.activeArtboardId = null;
        this.createDefaultArtboard();
    }

    // Artboard Management
    createArtboard(name, width, height, x = 0, y = 0) {
        const id = crypto.randomUUID();
        const artboard = {
            id,
            name,
            width,
            height,
            x,
            y,
            backgroundColor: '#ffffff',
            objects: [],
            metadata: {
                created: new Date(),
                modified: new Date(),
                tags: [],
                description: ''
            }
        };

        this.artboards.set(id, artboard);
        if (!this.activeArtboardId) {
            this.activeArtboardId = id;
        }
        return id;
    }

    updateArtboard(id, updates) {
        const artboard = this.artboards.get(id);
        if (!artboard) return false;

        Object.assign(artboard, updates);
        artboard.metadata.modified = new Date();
        return true;
    }

    deleteArtboard(id) {
        if (this.artboards.size <= 1) return false;
        if (!this.artboards.has(id)) return false;

        this.artboards.delete(id);
        if (this.activeArtboardId === id) {
            this.activeArtboardId = Array.from(this.artboards.keys())[0];
        }
        return true;
    }

    // Object Management
    addObject(artboardId, object) {
        const artboard = this.artboards.get(artboardId);
        if (!artboard) return false;

        artboard.objects.push(object);
        artboard.metadata.modified = new Date();
        return true;
    }

    removeObject(artboardId, objectId) {
        const artboard = this.artboards.get(artboardId);
        if (!artboard) return false;

        const index = artboard.objects.findIndex(obj => obj.id === objectId);
        if (index === -1) return false;

        artboard.objects.splice(index, 1);
        artboard.metadata.modified = new Date();
        return true;
    }

    updateObject(artboardId, objectId, updates) {
        const artboard = this.artboards.get(artboardId);
        if (!artboard) return false;

        const object = artboard.objects.find(obj => obj.id === objectId);
        if (!object) return false;

        Object.assign(object, updates);
        artboard.metadata.modified = new Date();
        return true;
    }

    // Artboard Navigation
    setActiveArtboard(id) {
        if (!this.artboards.has(id)) return false;
        this.activeArtboardId = id;
        return true;
    }

    getActiveArtboard() {
        return this.artboards.get(this.activeArtboardId);
    }

    // Artboard Organization
    arrangeArtboards(layout = 'grid', options = {}) {
        const artboards = Array.from(this.artboards.values());
        if (artboards.length === 0) return;

        switch (layout) {
            case 'grid':
                this.arrangeGrid(artboards, options);
                break;
            case 'horizontal':
                this.arrangeHorizontal(artboards, options);
                break;
            case 'vertical':
                this.arrangeVertical(artboards, options);
                break;
            case 'custom':
                if (options.positions) {
                    this.arrangeCustom(artboards, options.positions);
                }
                break;
        }
    }

    arrangeGrid(artboards, options) {
        const {
            columns = Math.ceil(Math.sqrt(artboards.length)),
            spacing = 40,
            startX = 0,
            startY = 0
        } = options;

        let currentX = startX;
        let currentY = startY;
        let maxHeight = 0;

        artboards.forEach((artboard, index) => {
            artboard.x = currentX;
            artboard.y = currentY;

            maxHeight = Math.max(maxHeight, artboard.height);

            if ((index + 1) % columns === 0) {
                currentX = startX;
                currentY += maxHeight + spacing;
                maxHeight = 0;
            } else {
                currentX += artboard.width + spacing;
            }
        });
    }

    arrangeHorizontal(artboards, options) {
        const { spacing = 40, startX = 0, startY = 0 } = options;
        let currentX = startX;

        artboards.forEach(artboard => {
            artboard.x = currentX;
            artboard.y = startY;
            currentX += artboard.width + spacing;
        });
    }

    arrangeVertical(artboards, options) {
        const { spacing = 40, startX = 0, startY = 0 } = options;
        let currentY = startY;

        artboards.forEach(artboard => {
            artboard.x = startX;
            artboard.y = currentY;
            currentY += artboard.height + spacing;
        });
    }

    arrangeCustom(artboards, positions) {
        artboards.forEach((artboard, index) => {
            if (positions[index]) {
                artboard.x = positions[index].x;
                artboard.y = positions[index].y;
            }
        });
    }

    // Artboard Export
    exportArtboard(id) {
        const artboard = this.artboards.get(id);
        if (!artboard) return null;

        return {
            ...artboard,
            objects: artboard.objects.map(obj => this.cloneObject(obj))
        };
    }

    exportAllArtboards() {
        return Array.from(this.artboards.entries()).map(([id, artboard]) => ({
            id,
            ...artboard,
            objects: artboard.objects.map(obj => this.cloneObject(obj))
        }));
    }

    // Artboard Import
    importArtboard(data) {
        const id = data.id || crypto.randomUUID();
        const artboard = {
            id,
            name: data.name,
            width: data.width,
            height: data.height,
            x: data.x,
            y: data.y,
            backgroundColor: data.backgroundColor,
            objects: data.objects.map(obj => this.cloneObject(obj)),
            metadata: {
                created: new Date(),
                modified: new Date(),
                tags: data.metadata?.tags || [],
                description: data.metadata?.description || ''
            }
        };

        this.artboards.set(id, artboard);
        return id;
    }

    // Utility Methods
    cloneObject(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Default Artboard
    createDefaultArtboard() {
        this.createArtboard('Artboard 1', 800, 600);
    }

    // Artboard Search
    searchArtboards(query) {
        query = query.toLowerCase();
        return Array.from(this.artboards.values()).filter(artboard =>
            artboard.name.toLowerCase().includes(query) ||
            artboard.metadata.tags.some(tag => tag.toLowerCase().includes(query)) ||
            artboard.metadata.description.toLowerCase().includes(query)
        );
    }

    // Artboard Statistics
    getArtboardStats(id) {
        const artboard = this.artboards.get(id);
        if (!artboard) return null;

        return {
            objectCount: artboard.objects.length,
            totalArea: artboard.width * artboard.height,
            lastModified: artboard.metadata.modified,
            objectTypes: this.getObjectTypeCount(artboard.objects)
        };
    }

    getObjectTypeCount(objects) {
        return objects.reduce((counts, obj) => {
            counts[obj.type] = (counts[obj.type] || 0) + 1;
            return counts;
        }, {});
    }
}

export default ArtboardManager; 