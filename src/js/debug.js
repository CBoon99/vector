import { DebugPanel } from './utils/debug-panel.js';
import { FeatureTests } from './tests/feature-tests.js';

class DebugMode {
    constructor() {
        this.debugPanel = new DebugPanel();
        this.featureTests = new FeatureTests();
        this.performanceMetrics = {
            fps: 0,
            memory: null,
            lastFrameTime: 0,
            frameCount: 0
        };
    }

    initialize() {
        // Initialize debug panel
        this.debugPanel.initialize();
        this.debugPanel.show();
        
        // Log startup
        this.debugPanel.info('Debug mode initialized');
        
        // Run feature tests
        this.runTests();
        
        // Set up error handling
        this.setupErrorHandling();
        
        // Set up performance monitoring
        this.setupPerformanceMonitoring();
        
        // Set up event monitoring
        this.setupEventMonitoring();
    }

    async runTests() {
        this.debugPanel.info('Running feature tests...');
        await this.featureTests.runAllTests();
    }

    setupErrorHandling() {
        window.onerror = (message, source, lineno, colno, error) => {
            this.debugPanel.error(`Error: ${message}\nSource: ${source}\nLine: ${lineno}\nColumn: ${colno}\n${error?.stack || ''}`);
            return false;
        };

        window.addEventListener('unhandledrejection', (event) => {
            this.debugPanel.error(`Unhandled Promise Rejection: ${event.reason}`);
        });
    }

    setupPerformanceMonitoring() {
        // Monitor memory usage
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                this.performanceMetrics.memory = {
                    total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
                    used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
                    limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
                };
                this.updatePerformanceDisplay();
            }, 5000);
        }

        // Monitor frame rate
        const checkFPS = () => {
            const currentTime = performance.now();
            this.performanceMetrics.frameCount++;
            
            if (currentTime - this.performanceMetrics.lastFrameTime >= 1000) {
                this.performanceMetrics.fps = Math.round(
                    (this.performanceMetrics.frameCount * 1000) / 
                    (currentTime - this.performanceMetrics.lastFrameTime)
                );
                this.performanceMetrics.frameCount = 0;
                this.performanceMetrics.lastFrameTime = currentTime;
                this.updatePerformanceDisplay();
            }
            
            requestAnimationFrame(checkFPS);
        };
        
        requestAnimationFrame(checkFPS);

        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) { // Tasks longer than 50ms
                        this.debugPanel.warn(`Long task detected: ${entry.name} (${Math.round(entry.duration)}ms)`);
                    }
                }
            });
            
            observer.observe({ entryTypes: ['longtask'] });
        }
    }

    setupEventMonitoring() {
        // Monitor mouse events
        const canvas = document.getElementById('drawing-canvas');
        if (canvas) {
            const events = ['mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend'];
            events.forEach(eventType => {
                canvas.addEventListener(eventType, (e) => {
                    this.debugPanel.info(`Canvas ${eventType}: (${e.clientX}, ${e.clientY})`);
                });
            });
        }

        // Monitor keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) {
                this.debugPanel.info(`Keyboard shortcut: ${e.key} (${e.ctrlKey ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.metaKey ? 'Meta+' : ''})`);
            }
        });

        // Monitor tool changes
        const toolButtons = document.querySelectorAll('[id$="-tool"]');
        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.debugPanel.info(`Tool changed to: ${button.id}`);
            });
        });
    }

    updatePerformanceDisplay() {
        const metrics = this.performanceMetrics;
        let display = `FPS: ${metrics.fps}`;
        
        if (metrics.memory) {
            display += `\nMemory: ${metrics.memory.used}MB / ${metrics.memory.total}MB (${metrics.memory.limit}MB limit)`;
        }
        
        this.debugPanel.info(display);
    }
}

// Initialize debug mode when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const debugMode = new DebugMode();
    debugMode.initialize();
}); 