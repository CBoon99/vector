// History Manager with Visual Diff Support
class HistoryManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.history = [];
        this.currentIndex = -1;
        this.maxHistoryLength = 50;
        this.isRecording = true;
    }

    // State Management
    pushState(state) {
        if (!this.isRecording) return;

        // Remove any future states if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Add new state with visual diff
        const newState = {
            ...state,
            timestamp: Date.now(),
            visualDiff: this.calculateVisualDiff(state)
        };

        this.history.push(newState);
        this.currentIndex++;

        // Trim history if it exceeds max length
        if (this.history.length > this.maxHistoryLength) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    // Navigation
    undo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.applyState(this.history[this.currentIndex]);
            return true;
        }
        return false;
    }

    redo() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            this.applyState(this.history[this.currentIndex]);
            return true;
        }
        return false;
    }

    // State Application
    applyState(state) {
        this.isRecording = false;
        this.stateManager.setState(state);
        this.isRecording = true;
    }

    // Visual Diff Calculation
    calculateVisualDiff(newState) {
        if (this.currentIndex < 0) return null;

        const oldState = this.history[this.currentIndex];
        const diff = {
            added: [],
            removed: [],
            modified: [],
            unchanged: []
        };

        // Compare objects
        const oldObjects = new Map(oldState.objects.map(obj => [obj.id, obj]));
        const newObjects = new Map(newState.objects.map(obj => [obj.id, obj]));

        // Find added and modified objects
        newState.objects.forEach(obj => {
            const oldObj = oldObjects.get(obj.id);
            if (!oldObj) {
                diff.added.push(obj);
            } else if (!this.areObjectsEqual(oldObj, obj)) {
                diff.modified.push({
                    id: obj.id,
                    old: oldObj,
                    new: obj,
                    changes: this.calculateObjectChanges(oldObj, obj)
                });
            } else {
                diff.unchanged.push(obj);
            }
        });

        // Find removed objects
        oldState.objects.forEach(obj => {
            if (!newObjects.has(obj.id)) {
                diff.removed.push(obj);
            }
        });

        return diff;
    }

    calculateObjectChanges(oldObj, newObj) {
        const changes = {
            position: false,
            size: false,
            rotation: false,
            style: false,
            content: false
        };

        // Position changes
        if (oldObj.x !== newObj.x || oldObj.y !== newObj.y) {
            changes.position = {
                old: { x: oldObj.x, y: oldObj.y },
                new: { x: newObj.x, y: newObj.y }
            };
        }

        // Size changes
        if (oldObj.width !== newObj.width || oldObj.height !== newObj.height) {
            changes.size = {
                old: { width: oldObj.width, height: oldObj.height },
                new: { width: newObj.width, height: newObj.height }
            };
        }

        // Rotation changes
        if (oldObj.rotation !== newObj.rotation) {
            changes.rotation = {
                old: oldObj.rotation,
                new: newObj.rotation
            };
        }

        // Style changes
        if (oldObj.fill !== newObj.fill || 
            oldObj.stroke !== newObj.stroke || 
            oldObj.strokeWidth !== newObj.strokeWidth) {
            changes.style = {
                old: {
                    fill: oldObj.fill,
                    stroke: oldObj.stroke,
                    strokeWidth: oldObj.strokeWidth
                },
                new: {
                    fill: newObj.fill,
                    stroke: newObj.stroke,
                    strokeWidth: newObj.strokeWidth
                }
            };
        }

        // Content changes (for text, paths, etc.)
        if (oldObj.content !== newObj.content || 
            oldObj.d !== newObj.d) {
            changes.content = {
                old: oldObj.content || oldObj.d,
                new: newObj.content || newObj.d
            };
        }

        return changes;
    }

    // Utility Methods
    areObjectsEqual(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    getCurrentState() {
        return this.history[this.currentIndex];
    }

    getStateAt(index) {
        return this.history[index];
    }

    getHistoryLength() {
        return this.history.length;
    }

    getCurrentIndex() {
        return this.currentIndex;
    }

    clearHistory() {
        this.history = [];
        this.currentIndex = -1;
    }

    // Visual Diff Rendering
    renderVisualDiff(context, diff, bounds) {
        if (!diff) return;

        context.save();

        // Render added objects
        context.fillStyle = 'rgba(0, 255, 0, 0.2)';
        diff.added.forEach(obj => {
            this.renderObjectHighlight(context, obj, bounds);
        });

        // Render removed objects
        context.fillStyle = 'rgba(255, 0, 0, 0.2)';
        diff.removed.forEach(obj => {
            this.renderObjectHighlight(context, obj, bounds);
        });

        // Render modified objects
        context.fillStyle = 'rgba(0, 0, 255, 0.2)';
        diff.modified.forEach(({ new: obj }) => {
            this.renderObjectHighlight(context, obj, bounds);
        });

        context.restore();
    }

    renderObjectHighlight(context, obj, bounds) {
        const { x, y, width, height } = this.calculateObjectBounds(obj);
        
        // Transform coordinates to viewport
        const viewportX = (x - bounds.x) * bounds.scale;
        const viewportY = (y - bounds.y) * bounds.scale;
        const viewportWidth = width * bounds.scale;
        const viewportHeight = height * bounds.scale;

        context.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);
    }

    calculateObjectBounds(obj) {
        switch (obj.type) {
            case 'rect':
                return {
                    x: obj.x,
                    y: obj.y,
                    width: obj.width,
                    height: obj.height
                };
            case 'circle':
                return {
                    x: obj.x - obj.width / 2,
                    y: obj.y - obj.height / 2,
                    width: obj.width,
                    height: obj.height
                };
            case 'path':
                // For paths, we'd need to parse the path data
                // This is a simplified version
                const path = new Path2D(obj.d);
                const bounds = path.getBoundingBox();
                return {
                    x: bounds.x,
                    y: bounds.y,
                    width: bounds.width,
                    height: bounds.height
                };
            default:
                return {
                    x: obj.x,
                    y: obj.y,
                    width: obj.width || 0,
                    height: obj.height || 0
                };
        }
    }
}

export default HistoryManager; 