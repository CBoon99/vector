// History Panel UI Component
class HistoryPanel {
    constructor(historyManager, stateManager) {
        this.historyManager = historyManager;
        this.stateManager = stateManager;
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'history-panel';
        this.panel.innerHTML = `
            <div class="history-header">
                <h3>History</h3>
                <div class="history-actions">
                    <button class="clear-history" title="Clear History">Clear</button>
                </div>
            </div>
            <div class="history-list"></div>
            <div class="history-preview" style="display: none;">
                <h4>State Preview</h4>
                <div class="preview-content">
                    <canvas width="200" height="150"></canvas>
                    <div class="preview-info"></div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateHistoryList();
    }

    setupEventListeners() {
        // Clear history button
        this.panel.querySelector('.clear-history').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the history?')) {
                this.historyManager.clearHistory();
                this.updateHistoryList();
            }
        });

        // History list events
        this.panel.querySelector('.history-list').addEventListener('click', (e) => {
            const historyItem = e.target.closest('.history-item');
            if (historyItem) {
                const index = parseInt(historyItem.dataset.index);
                this.showHistoryPreview(index);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        if (e.shiftKey) {
                            this.historyManager.redo();
                        } else {
                            this.historyManager.undo();
                        }
                        this.updateHistoryList();
                        e.preventDefault();
                        break;
                    case 'y':
                        this.historyManager.redo();
                        this.updateHistoryList();
                        e.preventDefault();
                        break;
                }
            }
        });
    }

    updateHistoryList() {
        const list = this.panel.querySelector('.history-list');
        const currentIndex = this.historyManager.getCurrentIndex();
        
        list.innerHTML = this.historyManager.history.map((state, index) => `
            <div class="history-item ${index === currentIndex ? 'active' : ''}" 
                 data-index="${index}">
                <div class="history-item-preview">
                    <canvas width="50" height="50"></canvas>
                </div>
                <div class="history-item-info">
                    <div class="history-item-title">
                        ${this.getStateTitle(state)}
                    </div>
                    <div class="history-item-time">
                        ${new Date(state.timestamp).toLocaleTimeString()}
                    </div>
                </div>
                <div class="history-item-diff">
                    ${this.renderDiffSummary(state.visualDiff)}
                </div>
            </div>
        `).join('');

        // Render previews
        this.historyManager.history.forEach((state, index) => {
            const canvas = list.querySelector(`[data-index="${index}"] canvas`);
            const ctx = canvas.getContext('2d');
            this.renderStatePreview(state, ctx);
        });
    }

    getStateTitle(state) {
        if (!state.visualDiff) return 'Initial State';

        const { added, removed, modified } = state.visualDiff;
        const parts = [];

        if (added.length > 0) {
            parts.push(`+${added.length}`);
        }
        if (removed.length > 0) {
            parts.push(`-${removed.length}`);
        }
        if (modified.length > 0) {
            parts.push(`~${modified.length}`);
        }

        return parts.length > 0 ? parts.join(' ') : 'No Changes';
    }

    renderDiffSummary(diff) {
        if (!diff) return '';

        const { added, removed, modified } = diff;
        const parts = [];

        if (added.length > 0) {
            parts.push(`<span class="diff-added">+${added.length}</span>`);
        }
        if (removed.length > 0) {
            parts.push(`<span class="diff-removed">-${removed.length}</span>`);
        }
        if (modified.length > 0) {
            parts.push(`<span class="diff-modified">~${modified.length}</span>`);
        }

        return parts.join(' ');
    }

    renderStatePreview(state, context) {
        // Clear canvas
        context.clearRect(0, 0, 50, 50);

        // Render state objects
        state.objects.forEach(obj => {
            context.save();
            this.renderObject(context, obj, {
                x: 0,
                y: 0,
                width: 50,
                height: 50,
                scale: 0.1
            });
            context.restore();
        });

        // Render visual diff
        if (state.visualDiff) {
            this.historyManager.renderVisualDiff(context, state.visualDiff, {
                x: 0,
                y: 0,
                width: 50,
                height: 50,
                scale: 0.1
            });
        }
    }

    renderObject(context, obj, bounds) {
        context.fillStyle = obj.fill || '#000000';
        context.strokeStyle = obj.stroke || 'none';
        context.lineWidth = obj.strokeWidth || 1;

        switch (obj.type) {
            case 'rect':
                context.fillRect(
                    (obj.x - bounds.x) * bounds.scale,
                    (obj.y - bounds.y) * bounds.scale,
                    obj.width * bounds.scale,
                    obj.height * bounds.scale
                );
                break;
            case 'circle':
                context.beginPath();
                context.arc(
                    (obj.x - bounds.x) * bounds.scale,
                    (obj.y - bounds.y) * bounds.scale,
                    Math.min(obj.width, obj.height) * bounds.scale / 2,
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
    }

    showHistoryPreview(index) {
        const state = this.historyManager.getStateAt(index);
        if (!state) return;

        const previewPanel = this.panel.querySelector('.history-preview');
        const canvas = previewPanel.querySelector('canvas');
        const info = previewPanel.querySelector('.preview-info');
        const ctx = canvas.getContext('2d');

        // Render preview
        this.renderStatePreview(state, ctx);

        // Update info
        info.innerHTML = `
            <div class="preview-time">
                ${new Date(state.timestamp).toLocaleString()}
            </div>
            <div class="preview-changes">
                ${this.renderDetailedDiff(state.visualDiff)}
            </div>
        `;

        previewPanel.style.display = 'block';
    }

    renderDetailedDiff(diff) {
        if (!diff) return 'Initial State';

        const { added, removed, modified } = diff;
        const parts = [];

        if (added.length > 0) {
            parts.push(`
                <div class="diff-section">
                    <h5>Added Objects (${added.length})</h5>
                    <ul>
                        ${added.map(obj => `
                            <li>${obj.type} at (${obj.x}, ${obj.y})</li>
                        `).join('')}
                    </ul>
                </div>
            `);
        }

        if (removed.length > 0) {
            parts.push(`
                <div class="diff-section">
                    <h5>Removed Objects (${removed.length})</h5>
                    <ul>
                        ${removed.map(obj => `
                            <li>${obj.type} at (${obj.x}, ${obj.y})</li>
                        `).join('')}
                    </ul>
                </div>
            `);
        }

        if (modified.length > 0) {
            parts.push(`
                <div class="diff-section">
                    <h5>Modified Objects (${modified.length})</h5>
                    <ul>
                        ${modified.map(({ id, changes }) => `
                            <li>
                                Object ${id}
                                <ul>
                                    ${Object.entries(changes)
                                        .filter(([_, value]) => value)
                                        .map(([key, value]) => `
                                            <li>${key}: ${this.formatChange(value)}</li>
                                        `).join('')}
                                </ul>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `);
        }

        return parts.join('');
    }

    formatChange(change) {
        if (typeof change === 'object') {
            if (change.old !== undefined && change.new !== undefined) {
                return `${change.old} → ${change.new}`;
            }
            return Object.entries(change)
                .map(([key, value]) => `${key}: ${this.formatChange(value)}`)
                .join(', ');
        }
        return change;
    }

    getPanel() {
        return this.panel;
    }
}

export default HistoryPanel; 