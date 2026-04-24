// Error tracking system
class ErrorTracker {
    constructor() {
        this.errors = [];
        this.maxErrors = 100; // Keep last 100 errors
        this.initializeErrorHandling();
    }

    initializeErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.trackError({
                type: 'runtime',
                category: 'system',
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError({
                type: 'promise',
                category: 'async',
                message: event.reason?.message || 'Promise rejected',
                stack: event.reason?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Canvas error handlers
        const canvas = document.getElementById('drawing-canvas');
        if (canvas) {
            // WebGL context errors
            canvas.addEventListener('webglcontextlost', (event) => {
                this.trackError({
                    type: 'webgl',
                    category: 'graphics',
                    message: 'WebGL context lost',
                    timestamp: new Date().toISOString()
                });
            });

            canvas.addEventListener('webglcontextrestored', (event) => {
                this.trackError({
                    type: 'webgl',
                    category: 'graphics',
                    message: 'WebGL context restored',
                    severity: 'info',
                    timestamp: new Date().toISOString()
                });
            });

            // Canvas errors
            canvas.addEventListener('error', (event) => {
                this.trackError({
                    type: 'canvas',
                    category: 'graphics',
                    message: 'Canvas error occurred',
                    timestamp: new Date().toISOString()
                });
            });
        }

        // Network errors
        window.addEventListener('offline', () => {
            this.trackError({
                type: 'network',
                category: 'connectivity',
                message: 'Network connection lost',
                severity: 'warning',
                timestamp: new Date().toISOString()
            });
        });

        window.addEventListener('online', () => {
            this.trackError({
                type: 'network',
                category: 'connectivity',
                message: 'Network connection restored',
                severity: 'info',
                timestamp: new Date().toISOString()
            });
        });

        // Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target instanceof HTMLImageElement || 
                event.target instanceof HTMLScriptElement || 
                event.target instanceof HTMLLinkElement) {
                this.trackError({
                    type: 'resource',
                    category: 'loading',
                    message: `Failed to load ${event.target.tagName.toLowerCase()}`,
                    source: event.target.src || event.target.href,
                    timestamp: new Date().toISOString()
                });
            }
        }, true);

        // Storage errors
        window.addEventListener('storage', (event) => {
            if (event.newValue === null) {
                this.trackError({
                    type: 'storage',
                    category: 'data',
                    message: 'Storage quota exceeded',
                    severity: 'warning',
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Performance monitoring
        if (window.performance && window.performance.memory) {
            setInterval(() => {
                const memory = window.performance.memory;
                if (memory.usedJSHeapSize > memory.totalJSHeapSize * 0.9) {
                    this.trackError({
                        type: 'performance',
                        category: 'memory',
                        message: 'High memory usage detected',
                        severity: 'warning',
                        memory: {
                            used: memory.usedJSHeapSize,
                            total: memory.totalJSHeapSize
                        },
                        timestamp: new Date().toISOString()
                    });
                }
            }, 30000); // Check every 30 seconds
        }
    }

    trackError(error) {
        // Add timestamp if not present
        if (!error.timestamp) {
            error.timestamp = new Date().toISOString();
        }

        // Add severity if not present
        if (!error.severity) {
            error.severity = this.determineSeverity(error);
        }

        // Add browser info
        error.browser = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            devicePixelRatio: window.devicePixelRatio
        };

        // Add memory info if available
        if (performance.memory) {
            error.memory = {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize
            };
        }

        // Add to errors array
        this.errors.unshift(error);

        // Trim array if too long
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(0, this.maxErrors);
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error tracked:', error);
        }

        // Send to server in production
        if (process.env.NODE_ENV === 'production') {
            this.sendToServer(error);
        }

        // Show user-friendly message if error severity is high enough
        if (this.shouldShowMessage(error)) {
            this.showErrorMessage(error);
        }
    }

    determineSeverity(error) {
        switch (error.type) {
            case 'runtime':
            case 'webgl':
                return 'error';
            case 'promise':
            case 'network':
                return 'warning';
            case 'performance':
                return 'warning';
            case 'storage':
                return 'warning';
            default:
                return 'info';
        }
    }

    shouldShowMessage(error) {
        const severityLevels = {
            'error': 3,
            'warning': 2,
            'info': 1
        };
        // Only show actual errors, not warnings from network/performance
        // This reduces error fatigue from non-critical issues
        return error.severity === 'error' && error.type !== 'performance' && error.type !== 'network';
    }

    sendToServer(error) {
        // In production, send to your error tracking service
        // Example: Sentry, LogRocket, etc.
        fetch('/api/error-tracking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(error)
        }).catch(() => {
            // If sending fails, store locally
            this.storeLocally(error);
        });
    }

    storeLocally(error) {
        try {
            const storedErrors = JSON.parse(localStorage.getItem('errorLog') || '[]');
            storedErrors.unshift(error);
            localStorage.setItem('errorLog', JSON.stringify(storedErrors.slice(0, 50)));
        } catch (e) {
            console.error('Failed to store error locally:', e);
        }
    }

    showErrorMessage(error) {
        const messageElement = document.createElement('div');
        messageElement.className = 'error-message';
        messageElement.innerHTML = `
            <div class="error-content">
                <h3>Something went wrong</h3>
                <p>${this.getUserFriendlyMessage(error)}</p>
                <button class="close-error">Dismiss</button>
                ${process.env.NODE_ENV === 'development' ? 
                    `<button class="show-details">Show Details</button>` : ''}
            </div>
        `;

        document.body.appendChild(messageElement);

        // Add event listeners
        messageElement.querySelector('.close-error').addEventListener('click', () => {
            messageElement.remove();
        });

        if (process.env.NODE_ENV === 'development') {
            messageElement.querySelector('.show-details').addEventListener('click', () => {
                console.error('Error details:', error);
            });
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    }

    getUserFriendlyMessage(error) {
        switch (error.type) {
            case 'runtime':
                return 'An unexpected error occurred. Please try refreshing the page.';
            case 'promise':
                return 'A network request failed. Please check your connection and try again.';
            case 'webgl':
                return 'The drawing system encountered an error. Please refresh the page.';
            case 'canvas':
                return 'There was a problem with the drawing canvas. Please refresh the page.';
            case 'network':
                return 'Network connection issues detected. Please check your internet connection.';
            case 'resource':
                return 'Failed to load some resources. Please refresh the page.';
            case 'storage':
                return 'Storage space is running low. Please clear some space and try again.';
            case 'performance':
                return 'The application is running slowly. Please close other applications and try again.';
            default:
                return 'An error occurred. Please try again.';
        }
    }

    getErrors() {
        return this.errors;
    }

    clearErrors() {
        this.errors = [];
    }

    getErrorsByType(type) {
        return this.errors.filter(error => error.type === type);
    }

    getErrorsByCategory(category) {
        return this.errors.filter(error => error.category === category);
    }

    getErrorsBySeverity(severity) {
        return this.errors.filter(error => error.severity === severity);
    }

    getErrorStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            byCategory: {},
            bySeverity: {
                error: 0,
                warning: 0,
                info: 0
            }
        };

        this.errors.forEach(error => {
            // Count by type
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            
            // Count by category
            stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
            
            // Count by severity
            stats.bySeverity[error.severity]++;
        });

        return stats;
    }
}

// Add CSS for error messages
const style = document.createElement('style');
style.textContent = `
    .error-message {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px;
        border-radius: 4px;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease-out;
    }

    .error-content {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .error-content h3 {
        margin: 0;
        font-size: 16px;
    }

    .error-content p {
        margin: 0;
        font-size: 14px;
    }

    .error-content button {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.2s;
    }

    .close-error {
        background: rgba(255, 255, 255, 0.2);
        color: white;
    }

    .close-error:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    .show-details {
        background: rgba(255, 255, 255, 0.2);
        color: white;
    }

    .show-details:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

export default ErrorTracker; 