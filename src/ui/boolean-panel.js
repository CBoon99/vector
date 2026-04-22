// Boolean Operations Panel UI Component
class BooleanPanel {
    constructor(booleanOperations, stateManager) {
        this.booleanOperations = booleanOperations;
        this.stateManager = stateManager;
        this.selectedObjects = [];
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'boolean-panel';
        this.panel.innerHTML = `
            <div class="boolean-operations">
                <button data-operation="union" title="Union">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 3h18v18H3z"/>
                    </svg>
                    Union
                </button>
                <button data-operation="subtract" title="Subtract">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 3h18v18H3z"/>
                        <path d="M3 3h18v9H3z" fill="white"/>
                    </svg>
                    Subtract
                </button>
                <button data-operation="intersect" title="Intersect">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 3h18v18H3z"/>
                        <path d="M3 3h18v9H3z" fill="white"/>
                        <path d="M3 12h18v9H3z" fill="white"/>
                    </svg>
                    Intersect
                </button>
                <button data-operation="exclude" title="Exclude">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 3h18v18H3z"/>
                        <path d="M3 3h18v9H3z" fill="white"/>
                        <path d="M3 12h18v9H3z" fill="white"/>
                        <path d="M3 3h18v18H3z" fill="none" stroke="white"/>
                    </svg>
                    Exclude
                </button>
            </div>
            <div class="selection-info">
                <p>Select 2 or more objects to perform boolean operations</p>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.panel.querySelectorAll('.boolean-operations button').forEach(button => {
            button.addEventListener('click', () => {
                if (this.selectedObjects.length >= 2) {
                    this.performOperation(button.dataset.operation);
                }
            });
        });
    }

    performOperation(operation) {
        if (this.selectedObjects.length < 2) return;

        // Get the first two selected objects
        const shape1 = this.selectedObjects[0];
        const shape2 = this.selectedObjects[1];

        try {
            // Perform the boolean operation
            const result = this.booleanOperations.performOperation(operation, shape1, shape2);

            // Remove the original shapes
            this.selectedObjects.forEach(shape => {
                this.stateManager.removeObject(shape);
            });

            // Add the result shape
            this.stateManager.addObject(result);

            // Clear selection
            this.selectedObjects = [];
            this.updateUI();

            // Save history
            this.stateManager.saveHistory();
        } catch (error) {
            console.error('Boolean operation failed:', error);
            // Show error to user
            this.showError('Operation failed: ' + error.message);
        }
    }

    setSelectedObjects(objects) {
        this.selectedObjects = objects;
        this.updateUI();
    }

    updateUI() {
        const buttons = this.panel.querySelectorAll('.boolean-operations button');
        const info = this.panel.querySelector('.selection-info p');

        // Update button states
        buttons.forEach(button => {
            button.disabled = this.selectedObjects.length < 2;
        });

        // Update info text
        if (this.selectedObjects.length < 2) {
            info.textContent = 'Select 2 or more objects to perform boolean operations';
        } else {
            info.textContent = `${this.selectedObjects.length} objects selected`;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        this.panel.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    getPanel() {
        return this.panel;
    }
}

export default BooleanPanel; 