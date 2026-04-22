export class StateManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 50;
    }

    saveState() {
        // Remove any future states if we're not at the end of history
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Add new state
        this.history.push({
            timestamp: Date.now(),
            objects: this.getCurrentState()
        });

        // Update index
        this.currentIndex = this.history.length - 1;

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    getCurrentState() {
        // This should be implemented by the application to return the current state
        return [];
    }

    undo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return this.history[this.currentIndex].objects;
        }
        return null;
    }

    redo() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            return this.history[this.currentIndex].objects;
        }
        return null;
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