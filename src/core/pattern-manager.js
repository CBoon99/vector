// Pattern Manager for Vector Patterns
class PatternManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.patterns = new Map();
        this.categories = new Set();
        this.createDefaultPatterns();
    }

    // Pattern Management
    createPattern(name, objects, options = {}) {
        const id = crypto.randomUUID();
        const pattern = {
            id,
            name,
            category: options.category || 'Uncategorized',
            objects: objects.map(obj => this.cloneObject(obj)),
            repeat: {
                mode: options.repeatMode || 'tile',
                spacing: options.spacing || { x: 0, y: 0 },
                offset: options.offset || { x: 0, y: 0 }
            },
            transform: {
                scale: options.scale || { x: 1, y: 1 },
                rotation: options.rotation || 0,
                skew: options.skew || { x: 0, y: 0 }
            },
            metadata: {
                created: new Date(),
                modified: new Date(),
                tags: options.tags || [],
                description: options.description || ''
            }
        };

        this.patterns.set(id, pattern);
        this.categories.add(pattern.category);
        return id;
    }

    updatePattern(id, updates) {
        const pattern = this.patterns.get(id);
        if (!pattern) return false;

        Object.assign(pattern, updates);
        pattern.metadata.modified = new Date();
        return true;
    }

    deletePattern(id) {
        return this.patterns.delete(id);
    }

    // Pattern Rendering
    renderPattern(patternId, context, bounds) {
        const pattern = this.patterns.get(patternId);
        if (!pattern) return;

        const { x, y, width, height } = bounds;
        const { mode, spacing, offset } = pattern.repeat;
        const { scale, rotation, skew } = pattern.transform;

        context.save();

        // Apply pattern transform
        context.translate(x + offset.x, y + offset.y);
        context.rotate(rotation);
        context.scale(scale.x, scale.y);
        context.transform(1, skew.y, skew.x, 1, 0, 0);

        // Calculate pattern bounds
        const patternBounds = this.calculatePatternBounds(pattern.objects);
        const patternWidth = patternBounds.width + spacing.x;
        const patternHeight = patternBounds.height + spacing.y;

        // Calculate repeat counts
        const repeatX = Math.ceil(width / patternWidth) + 1;
        const repeatY = Math.ceil(height / patternHeight) + 1;

        // Render pattern based on repeat mode
        switch (mode) {
            case 'tile':
                this.renderTiledPattern(pattern, context, repeatX, repeatY, patternWidth, patternHeight);
                break;
            case 'mirror':
                this.renderMirroredPattern(pattern, context, repeatX, repeatY, patternWidth, patternHeight);
                break;
            case 'radial':
                this.renderRadialPattern(pattern, context, width, height);
                break;
            case 'spiral':
                this.renderSpiralPattern(pattern, context, width, height);
                break;
        }

        context.restore();
    }

    renderTiledPattern(pattern, context, repeatX, repeatY, patternWidth, patternHeight) {
        for (let i = 0; i < repeatX; i++) {
            for (let j = 0; j < repeatY; j++) {
                context.save();
                context.translate(i * patternWidth, j * patternHeight);
                this.renderPatternObjects(pattern.objects, context);
                context.restore();
            }
        }
    }

    renderMirroredPattern(pattern, context, repeatX, repeatY, patternWidth, patternHeight) {
        for (let i = 0; i < repeatX; i++) {
            for (let j = 0; j < repeatY; j++) {
                context.save();
                context.translate(i * patternWidth, j * patternHeight);
                
                // Original
                this.renderPatternObjects(pattern.objects, context);
                
                // Horizontal mirror
                context.save();
                context.translate(patternWidth, 0);
                context.scale(-1, 1);
                this.renderPatternObjects(pattern.objects, context);
                context.restore();
                
                // Vertical mirror
                context.save();
                context.translate(0, patternHeight);
                context.scale(1, -1);
                this.renderPatternObjects(pattern.objects, context);
                context.restore();
                
                // Diagonal mirror
                context.save();
                context.translate(patternWidth, patternHeight);
                context.scale(-1, -1);
                this.renderPatternObjects(pattern.objects, context);
                context.restore();

                context.restore();
            }
        }
    }

    renderRadialPattern(pattern, context, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.max(width, height);
        const patternBounds = this.calculatePatternBounds(pattern.objects);
        const patternSize = Math.max(patternBounds.width, patternBounds.height);
        const numRepeats = Math.ceil(maxRadius / patternSize);

        for (let i = 0; i < numRepeats; i++) {
            const angle = (i * 2 * Math.PI) / numRepeats;
            context.save();
            context.translate(centerX, centerY);
            context.rotate(angle);
            this.renderPatternObjects(pattern.objects, context);
            context.restore();
        }
    }

    renderSpiralPattern(pattern, context, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.max(width, height);
        const patternBounds = this.calculatePatternBounds(pattern.objects);
        const patternSize = Math.max(patternBounds.width, patternBounds.height);
        const spacing = patternSize * 1.5;
        const numRepeats = Math.ceil(maxRadius / spacing);

        for (let i = 0; i < numRepeats; i++) {
            const angle = i * 0.5;
            const radius = i * spacing;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            context.save();
            context.translate(x, y);
            context.rotate(angle);
            this.renderPatternObjects(pattern.objects, context);
            context.restore();
        }
    }

    renderPatternObjects(objects, context) {
        objects.forEach(obj => {
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
                // Add more object types as needed
            }
        });
    }

    // Pattern Organization
    getPatternsByCategory(category) {
        return Array.from(this.patterns.values())
            .filter(pattern => pattern.category === category);
    }

    getCategories() {
        return Array.from(this.categories);
    }

    addCategory(category) {
        this.categories.add(category);
    }

    removeCategory(category) {
        if (category === 'Uncategorized') return false;

        // Move patterns to Uncategorized
        this.patterns.forEach(pattern => {
            if (pattern.category === category) {
                pattern.category = 'Uncategorized';
            }
        });

        this.categories.delete(category);
        return true;
    }

    // Pattern Search
    searchPatterns(query) {
        query = query.toLowerCase();
        return Array.from(this.patterns.values()).filter(pattern => 
            pattern.name.toLowerCase().includes(query) ||
            pattern.metadata.tags.some(tag => tag.toLowerCase().includes(query)) ||
            pattern.metadata.description.toLowerCase().includes(query)
        );
    }

    // Utility Methods
    cloneObject(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    calculatePatternBounds(objects) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        objects.forEach(obj => {
            switch (obj.type) {
                case 'rect':
                    minX = Math.min(minX, obj.x);
                    minY = Math.min(minY, obj.y);
                    maxX = Math.max(maxX, obj.x + obj.width);
                    maxY = Math.max(maxY, obj.y + obj.height);
                    break;
                case 'circle':
                    minX = Math.min(minX, obj.x);
                    minY = Math.min(minY, obj.y);
                    maxX = Math.max(maxX, obj.x + obj.width);
                    maxY = Math.max(maxY, obj.y + obj.height);
                    break;
                case 'path':
                    // For paths, we'd need to parse the path data
                    // This is a simplified version
                    const path = new Path2D(obj.d);
                    const bounds = path.getBoundingBox();
                    minX = Math.min(minX, bounds.x);
                    minY = Math.min(minY, bounds.y);
                    maxX = Math.max(maxX, bounds.x + bounds.width);
                    maxY = Math.max(maxY, bounds.y + bounds.height);
                    break;
            }
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    // Default Patterns
    createDefaultPatterns() {
        // Create some basic patterns
        this.createPattern('Dots', [{
            type: 'circle',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            fill: '#000000'
        }], {
            category: 'Basic',
            repeatMode: 'tile',
            spacing: { x: 20, y: 20 }
        });

        this.createPattern('Stripes', [{
            type: 'rect',
            x: 0,
            y: 0,
            width: 20,
            height: 5,
            fill: '#000000'
        }], {
            category: 'Basic',
            repeatMode: 'tile',
            spacing: { x: 0, y: 10 }
        });

        this.createPattern('Grid', [
            {
                type: 'rect',
                x: 0,
                y: 0,
                width: 20,
                height: 1,
                fill: '#000000'
            },
            {
                type: 'rect',
                x: 0,
                y: 0,
                width: 1,
                height: 20,
                fill: '#000000'
            }
        ], {
            category: 'Basic',
            repeatMode: 'tile',
            spacing: { x: 20, y: 20 }
        });
    }

    // Export/Import
    exportPatterns() {
        return {
            patterns: Array.from(this.patterns.entries()),
            categories: Array.from(this.categories)
        };
    }

    importPatterns(data) {
        if (data.patterns) {
            data.patterns.forEach(([id, pattern]) => {
                this.patterns.set(id, pattern);
            });
        }
        if (data.categories) {
            data.categories.forEach(category => {
                this.categories.add(category);
            });
        }
    }
}

export default PatternManager; 