// Symbol Manager for Reusable Design Elements
class SymbolManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.symbols = new Map();
        this.symbolInstances = new Map();
        this.categories = new Set();
        this.createDefaultSymbols();
    }

    // Symbol Management
    createSymbol(name, objects, category = 'Uncategorized') {
        const id = crypto.randomUUID();
        const symbol = {
            id,
            name,
            category,
            objects: objects.map(obj => this.cloneObject(obj)),
            metadata: {
                created: new Date(),
                modified: new Date(),
                tags: [],
                description: ''
            }
        };

        this.symbols.set(id, symbol);
        this.categories.add(category);
        return id;
    }

    updateSymbol(id, updates) {
        const symbol = this.symbols.get(id);
        if (!symbol) return false;

        Object.assign(symbol, updates);
        symbol.metadata.modified = new Date();

        // Update all instances
        this.updateInstances(id);
        return true;
    }

    deleteSymbol(id) {
        if (!this.symbols.has(id)) return false;

        // Remove all instances
        this.symbolInstances.forEach((instance, instanceId) => {
            if (instance.symbolId === id) {
                this.deleteInstance(instanceId);
            }
        });

        this.symbols.delete(id);
        return true;
    }

    // Instance Management
    createInstance(symbolId, x = 0, y = 0, scale = 1, rotation = 0) {
        const symbol = this.symbols.get(symbolId);
        if (!symbol) return null;

        const instanceId = crypto.randomUUID();
        const instance = {
            id: instanceId,
            symbolId,
            transform: {
                x,
                y,
                scale,
                rotation
            },
            overrides: new Map()
        };

        this.symbolInstances.set(instanceId, instance);
        return instanceId;
    }

    updateInstance(instanceId, updates) {
        const instance = this.symbolInstances.get(instanceId);
        if (!instance) return false;

        if (updates.transform) {
            Object.assign(instance.transform, updates.transform);
        }

        if (updates.overrides) {
            Object.entries(updates.overrides).forEach(([key, value]) => {
                instance.overrides.set(key, value);
            });
        }

        return true;
    }

    deleteInstance(instanceId) {
        return this.symbolInstances.delete(instanceId);
    }

    // Symbol Rendering
    renderInstance(instanceId, context) {
        const instance = this.symbolInstances.get(instanceId);
        if (!instance) return;

        const symbol = this.symbols.get(instance.symbolId);
        if (!symbol) return;

        context.save();

        // Apply instance transform
        context.translate(instance.transform.x, instance.transform.y);
        context.rotate(instance.transform.rotation);
        context.scale(instance.transform.scale, instance.transform.scale);

        // Render each object in the symbol
        symbol.objects.forEach(obj => {
            // Apply any overrides
            const overriddenObj = this.applyOverrides(obj, instance.overrides);
            this.renderObject(overriddenObj, context);
        });

        context.restore();
    }

    // Symbol Organization
    getSymbolsByCategory(category) {
        return Array.from(this.symbols.values())
            .filter(symbol => symbol.category === category);
    }

    getCategories() {
        return Array.from(this.categories);
    }

    addCategory(category) {
        this.categories.add(category);
    }

    removeCategory(category) {
        if (category === 'Uncategorized') return false;

        // Move symbols to Uncategorized
        this.symbols.forEach(symbol => {
            if (symbol.category === category) {
                symbol.category = 'Uncategorized';
            }
        });

        this.categories.delete(category);
        return true;
    }

    // Symbol Search
    searchSymbols(query) {
        query = query.toLowerCase();
        return Array.from(this.symbols.values()).filter(symbol => 
            symbol.name.toLowerCase().includes(query) ||
            symbol.metadata.tags.some(tag => tag.toLowerCase().includes(query)) ||
            symbol.metadata.description.toLowerCase().includes(query)
        );
    }

    // Utility Methods
    cloneObject(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    applyOverrides(obj, overrides) {
        const result = this.cloneObject(obj);
        overrides.forEach((value, key) => {
            const path = key.split('.');
            let current = result;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
        });
        return result;
    }

    renderObject(obj, context) {
        switch (obj.type) {
            case 'rect':
                context.fillRect(obj.x, obj.y, obj.width, obj.height);
                break;
            case 'circle':
                context.beginPath();
                context.arc(
                    obj.x + obj.width / 2,
                    obj.y + obj.height / 2,
                    Math.min(obj.width, obj.height) / 2,
                    0,
                    Math.PI * 2
                );
                context.fill();
                break;
            case 'path':
                context.fill(new Path2D(obj.d));
                break;
            case 'text':
                context.font = `${obj.fontSize}px ${obj.fontFamily}`;
                context.fillText(obj.text, obj.x, obj.y);
                break;
            // Add more object types as needed
        }
    }

    updateInstances(symbolId) {
        this.symbolInstances.forEach((instance, instanceId) => {
            if (instance.symbolId === symbolId) {
                // Trigger redraw or update
                this.stateManager.triggerUpdate();
            }
        });
    }

    // Default Symbols
    createDefaultSymbols() {
        // Create some basic shapes as symbols
        this.createSymbol('Square', [{
            type: 'rect',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            fill: '#000000'
        }], 'Basic Shapes');

        this.createSymbol('Circle', [{
            type: 'circle',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            fill: '#000000'
        }], 'Basic Shapes');

        this.createSymbol('Star', [{
            type: 'path',
            d: 'M50,0 L61,35 L98,35 L68,57 L79,91 L50,71 L21,91 L32,57 L2,35 L39,35 Z',
            fill: '#000000'
        }], 'Basic Shapes');
    }

    // Export/Import
    exportSymbols() {
        return {
            symbols: Array.from(this.symbols.entries()),
            categories: Array.from(this.categories)
        };
    }

    importSymbols(data) {
        if (data.symbols) {
            data.symbols.forEach(([id, symbol]) => {
                this.symbols.set(id, symbol);
            });
        }
        if (data.categories) {
            data.categories.forEach(category => {
                this.categories.add(category);
            });
        }
    }
}

export default SymbolManager; 