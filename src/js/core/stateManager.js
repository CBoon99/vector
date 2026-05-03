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
            layers: this.snapshotLayers()
        });
        this.currentIndex = this.history.length - 1;
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    snapshotLayers() {
        if (!this.layerManager) return [];
        return this.layerManager.getLayers().map((l) => ({
            id: l.id,
            name: l.name,
            hidden: !!l.hidden,
            locked: !!l.locked,
            objects: (l.objects || []).map((o) => ({ ...o }))
        }));
    }

    applyHistorySnapshot() {
        const entry = this.history[this.currentIndex];
        if (!entry || !this.layerManager) return;

        if (entry.layers && Array.isArray(entry.layers)) {
            const lm = this.layerManager;
            lm.layers = entry.layers.map((l) => ({
                id: l.id,
                name: l.name,
                hidden: !!l.hidden,
                locked: !!l.locked,
                objects: (l.objects || []).map((o) => ({ ...o }))
            }));
            if (!lm.layers.some((l) => l.id === lm.activeLayerId)) {
                lm.activeLayerId = lm.layers[0]?.id || 'default';
            }
            lm._emitChange();
            return;
        }

        /* Legacy entries stored a flat object list on the first layer */
        if (Array.isArray(entry.objects)) {
            const layer = this.layerManager.getLayers()[0];
            if (layer) {
                layer.objects = entry.objects.map((o) => ({ ...o }));
                this.layerManager._emitChange();
            }
        }
    }

    undo() {
        if (this.currentIndex <= 0) return;
        this.currentIndex--;
        this.applyHistorySnapshot();
    }

    redo() {
        if (this.currentIndex >= this.history.length - 1) return;
        this.currentIndex++;
        this.applyHistorySnapshot();
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
