// Base Tool Class
export class Tool {
    constructor(name, icon, cursor) {
        this.name = name;
        this.icon = icon;
        this.cursor = cursor;
        this.isActive = false;
        this.layerManager = null;
        this.stateManager = null;
    }

    initialize(layerManager, stateManager) {
        this.layerManager = layerManager;
        this.stateManager = stateManager;
    }

    activate() {
        this.isActive = true;
        this.onActivate();
    }

    deactivate() {
        this.isActive = false;
        this.onDeactivate();
    }

    onActivate() {
        // Override in subclasses
    }

    onDeactivate() {
        // Override in subclasses
    }

    startDrawing(event, canvas, context) {
        // Override in subclasses
    }

    draw(event, canvas, context) {
        // Override in subclasses
    }

    stopDrawing(event, canvas, context) {
        // Override in subclasses
    }

    getCursor() {
        return this.cursor;
    }

    getName() {
        return this.name;
    }

    getIcon() {
        return this.icon;
    }

    /**
     * Canvas/world-space point for pointer events (respects zoom/pan via CanvasManager).
     */
    getCanvasPoint(event, canvas) {
        const cm = this.stateManager?.canvasManager;
        if (cm && event && typeof event.clientX === 'number') {
            return cm.getMousePosition(event);
        }
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const cx = event?.clientX ?? 0;
        const cy = event?.clientY ?? 0;
        return {
            x: (cx - rect.left) * scaleX,
            y: (cy - rect.top) * scaleY
        };
    }
}
