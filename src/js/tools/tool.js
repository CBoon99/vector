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
}
