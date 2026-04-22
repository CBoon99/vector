export class DebugPanel {
    constructor() {
        this.panel = document.getElementById('debug-panel');
        this.output = document.getElementById('debug-output');
        this.isVisible = false;
        this.logs = [];
        this.maxLogs = 100;
    }

    initialize() {
        // Create debug panel if it doesn't exist
        if (!this.panel) {
            this.panel = document.createElement('div');
            this.panel.id = 'debug-panel';
            this.panel.className = 'debug-panel';
            
            this.output = document.createElement('pre');
            this.output.id = 'debug-output';
            
            const header = document.createElement('div');
            header.className = 'debug-header';
            header.innerHTML = `
                <h3>Debug Panel</h3>
                <button id="clear-debug">Clear</button>
                <button id="toggle-debug">Hide</button>
            `;
            
            this.panel.appendChild(header);
            this.panel.appendChild(this.output);
            document.body.appendChild(this.panel);
            
            // Add event listeners
            document.getElementById('clear-debug').addEventListener('click', () => this.clear());
            document.getElementById('toggle-debug').addEventListener('click', () => this.toggle());
        }
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type,
            message: typeof message === 'object' ? JSON.stringify(message, null, 2) : message
        };
        
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        this.updateDisplay();
    }

    error(message) {
        this.log(message, 'error');
    }

    warn(message) {
        this.log(message, 'warning');
    }

    info(message) {
        this.log(message, 'info');
    }

    updateDisplay() {
        if (!this.output) return;
        
        this.output.innerHTML = this.logs.map(log => {
            const className = `debug-${log.type}`;
            return `<div class="${className}">[${log.timestamp}] ${log.message}</div>`;
        }).join('\n');
        
        this.output.scrollTop = this.output.scrollHeight;
    }

    clear() {
        this.logs = [];
        this.updateDisplay();
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.panel.style.display = this.isVisible ? 'block' : 'none';
        document.getElementById('toggle-debug').textContent = this.isVisible ? 'Hide' : 'Show';
    }

    show() {
        this.isVisible = true;
        this.panel.style.display = 'block';
        document.getElementById('toggle-debug').textContent = 'Hide';
    }

    hide() {
        this.isVisible = false;
        this.panel.style.display = 'none';
        document.getElementById('toggle-debug').textContent = 'Show';
    }
} 