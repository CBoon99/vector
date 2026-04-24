/**
 * App drawing state, selection, and history hooks used by App and tools.
 */
export class StateManager {
    constructor() {
        this.layerManager = null;
        this.canvasManager = null;
        /** @type {HTMLCanvasElement | null} */
        this.canvas = null;
        this.currentTool = null;
        this.selection = [];
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 50;

        /** Stroke / fill (used by tools via getState) */
        this._drawing = {
            currentColor: '#e37800',
            strokeWidth: 1,
            useFill: true,
            strokeOpacity: 1,
            strokeStyle: 'solid'
        };
    }

    setCurrentColor(hex) {
        if (typeof hex === 'string' && hex) {
            this._drawing.currentColor = hex;
        }
    }

    setStrokeWidth(n) {
        const w = Math.max(1, Math.min(64, Number(n) || 1));
        this._drawing.strokeWidth = w;
    }

    setStrokeOpacity(o) {
        this._drawing.strokeOpacity = Math.max(0, Math.min(1, Number(o) ?? 1));
    }

    setStrokeStyle(style) {
        if (typeof style === 'string') {
            this._drawing.strokeStyle = style;
        }
    }

    setUseFill(on) {
        this._drawing.useFill = !!on;
    }

    setLayerManager(layerManager) {
        this.layerManager = layerManager;
    }

    setCanvasManager(canvasManager) {
        this.canvasManager = canvasManager;
        this.canvas = canvasManager?.canvas || null;
    }

    setCurrentTool(toolId) {
        this.currentTool = toolId;
    }

    getSelection() {
        return this.selection;
    }

    setSelection(sel) {
        this.selection = Array.isArray(sel) ? sel : [];
    }

    getState() {
        const d = this._drawing;
        return {
            currentColor: d.currentColor,
            strokeWidth: d.strokeWidth,
            currentStrokeWidth: d.strokeWidth,
            fillColor: d.useFill ? d.currentColor : 'transparent',
            strokeOpacity: d.strokeOpacity,
            strokeStyle: d.strokeStyle
        };
    }

    getMetadata() {
        return { app: 'Doppleit Vector', version: '2' };
    }

    getCurrentState() {
        return this.layerManager ? this.layerManager.getAllObjects() : [];
    }

    startDrawing() {
        /* freehand hooks */
    }

    updateDrawing() {
        /* freehand hooks */
    }

    finishDrawing() {
        /* freehand hooks */
    }

    requestRedraw() {
        this.canvasManager?.draw?.();
    }

    addToHistory() {
        this.saveState();
    }

    saveHistory() {
        this.saveState();
    }

    saveState() {
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        this.history.push({
            timestamp: Date.now(),
            objects: this.getCurrentState()
        });
        this.currentIndex = this.history.length - 1;
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    undo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        }
    }

    redo() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
        }
    }

    canUndo() {
        return this.currentIndex > 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    clearHistory() {
        this.history = [];
        this.currentIndex = -1;
    }

    getHistory() {
        return this.history;
    }

    getCurrentIndex() {
        return this.currentIndex;
    }
}
