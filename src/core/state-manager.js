// State Manager for Doppleit Vector
class StateManager {
    constructor() {
        this.state = {
            layers: [],
            currentTool: 'pen',
            selectedObjects: [],
            artboards: [],
            symbols: [],
            settings: {
                theme: 'dark',
                highContrast: false,
                autosave: true,
                shortcuts: true,
                gridSize: 10,
                snapToGrid: true,
                showGuides: true
            }
        };
        
        this.history = [];
        this.historyIndex = -1;
        this.maxHistoryStates = 100;
    }

    // State Management
    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.saveHistory();
    }

    // History Management
    saveHistory() {
        // Remove any future states if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        // Add current state to history
        this.history.push(JSON.stringify(this.state));
        this.historyIndex = this.history.length - 1;

        // Limit history size
        if (this.history.length > this.maxHistoryStates) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.state = JSON.parse(this.history[this.historyIndex]);
            return true;
        }
        return false;
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.state = JSON.parse(this.history[this.historyIndex]);
            return true;
        }
        return false;
    }

    // Layer Management
    addLayer(layer) {
        this.state.layers.push(layer);
        this.saveHistory();
    }

    removeLayer(index) {
        this.state.layers.splice(index, 1);
        this.saveHistory();
    }

    updateLayer(index, layer) {
        this.state.layers[index] = { ...this.state.layers[index], ...layer };
        this.saveHistory();
    }

    // Object Selection
    selectObject(object) {
        this.state.selectedObjects = [object];
        this.saveHistory();
    }

    selectObjects(objects) {
        this.state.selectedObjects = objects;
        this.saveHistory();
    }

    clearSelection() {
        this.state.selectedObjects = [];
        this.saveHistory();
    }

    // Settings Management
    updateSettings(settings) {
        this.state.settings = { ...this.state.settings, ...settings };
        this.saveHistory();
    }

    // Artboard Management
    addArtboard(artboard) {
        this.state.artboards.push(artboard);
        this.saveHistory();
    }

    removeArtboard(index) {
        this.state.artboards.splice(index, 1);
        this.saveHistory();
    }

    // Symbol Management
    addSymbol(symbol) {
        this.state.symbols.push(symbol);
        this.saveHistory();
    }

    removeSymbol(index) {
        this.state.symbols.splice(index, 1);
        this.saveHistory();
    }
}

export default StateManager; 