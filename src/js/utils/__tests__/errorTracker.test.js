import ErrorTracker from '../errorTracker';

describe('ErrorTracker', () => {
    let errorTracker;
    let mockConsole;
    let mockFetch;
    let mockLocalStorage;

    beforeEach(() => {
        // Mock console
        mockConsole = {
            error: jest.fn(),
            log: jest.fn()
        };
        global.console = mockConsole;

        // Mock fetch
        mockFetch = jest.fn();
        global.fetch = mockFetch;

        // Mock localStorage
        mockLocalStorage = {
            getItem: jest.fn(),
            setItem: jest.fn()
        };
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage
        });

        // Mock performance.memory
        Object.defineProperty(window.performance, 'memory', {
            value: {
                usedJSHeapSize: 1000000,
                totalJSHeapSize: 2000000
            }
        });

        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.id = 'drawing-canvas';
        document.body.appendChild(canvas);

        errorTracker = new ErrorTracker();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with empty errors array', () => {
            expect(errorTracker.errors).toEqual([]);
        });

        it('should set maxErrors to 100', () => {
            expect(errorTracker.maxErrors).toBe(100);
        });
    });

    describe('Error Tracking', () => {
        it('should track runtime errors', () => {
            const error = new Error('Test error');
            window.dispatchEvent(new ErrorEvent('error', {
                message: 'Test error',
                error: error,
                filename: 'test.js',
                lineno: 1,
                colno: 1
            }));

            expect(errorTracker.errors[0]).toMatchObject({
                type: 'runtime',
                category: 'system',
                message: 'Test error'
            });
        });

        it('should track promise rejections', () => {
            window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', {
                reason: new Error('Promise rejected')
            }));

            expect(errorTracker.errors[0]).toMatchObject({
                type: 'promise',
                category: 'async',
                message: 'Promise rejected'
            });
        });

        it('should track WebGL context errors', () => {
            const canvas = document.getElementById('drawing-canvas');
            canvas.dispatchEvent(new Event('webglcontextlost'));

            expect(errorTracker.errors[0]).toMatchObject({
                type: 'webgl',
                category: 'graphics',
                message: 'WebGL context lost'
            });
        });

        it('should track network errors', () => {
            window.dispatchEvent(new Event('offline'));

            expect(errorTracker.errors[0]).toMatchObject({
                type: 'network',
                category: 'connectivity',
                message: 'Network connection lost',
                severity: 'warning'
            });
        });

        it('should track resource loading errors', () => {
            const img = document.createElement('img');
            img.dispatchEvent(new Event('error'));

            expect(errorTracker.errors[0]).toMatchObject({
                type: 'resource',
                category: 'loading'
            });
        });
    });

    describe('Error Processing', () => {
        it('should add timestamp to errors', () => {
            errorTracker.trackError({ type: 'test' });
            expect(errorTracker.errors[0].timestamp).toBeDefined();
        });

        it('should add browser info to errors', () => {
            errorTracker.trackError({ type: 'test' });
            expect(errorTracker.errors[0].browser).toMatchObject({
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language
            });
        });

        it('should add memory info when available', () => {
            errorTracker.trackError({ type: 'test' });
            expect(errorTracker.errors[0].memory).toMatchObject({
                usedJSHeapSize: 1000000,
                totalJSHeapSize: 2000000
            });
        });

        it('should limit errors array to maxErrors', () => {
            for (let i = 0; i < 150; i++) {
                errorTracker.trackError({ type: 'test' });
            }
            expect(errorTracker.errors.length).toBe(100);
        });
    });

    describe('Error Severity', () => {
        it('should determine correct severity for runtime errors', () => {
            errorTracker.trackError({ type: 'runtime' });
            expect(errorTracker.errors[0].severity).toBe('error');
        });

        it('should determine correct severity for network errors', () => {
            errorTracker.trackError({ type: 'network' });
            expect(errorTracker.errors[0].severity).toBe('warning');
        });

        it('should respect manually set severity', () => {
            errorTracker.trackError({ type: 'test', severity: 'info' });
            expect(errorTracker.errors[0].severity).toBe('info');
        });
    });

    describe('Error Storage', () => {
        it('should store errors locally when server send fails', () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));
            errorTracker.trackError({ type: 'test' });
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });

        it('should handle localStorage errors gracefully', () => {
            mockLocalStorage.setItem.mockImplementationOnce(() => {
                throw new Error('Storage error');
            });
            errorTracker.trackError({ type: 'test' });
            expect(mockConsole.error).toHaveBeenCalled();
        });
    });

    describe('Error Filtering', () => {
        beforeEach(() => {
            errorTracker.trackError({ type: 'runtime', category: 'system', severity: 'error' });
            errorTracker.trackError({ type: 'network', category: 'connectivity', severity: 'warning' });
            errorTracker.trackError({ type: 'performance', category: 'memory', severity: 'info' });
        });

        it('should filter errors by type', () => {
            const runtimeErrors = errorTracker.getErrorsByType('runtime');
            expect(runtimeErrors.length).toBe(1);
            expect(runtimeErrors[0].type).toBe('runtime');
        });

        it('should filter errors by category', () => {
            const systemErrors = errorTracker.getErrorsByCategory('system');
            expect(systemErrors.length).toBe(1);
            expect(systemErrors[0].category).toBe('system');
        });

        it('should filter errors by severity', () => {
            const warningErrors = errorTracker.getErrorsBySeverity('warning');
            expect(warningErrors.length).toBe(1);
            expect(warningErrors[0].severity).toBe('warning');
        });
    });

    describe('Error Statistics', () => {
        beforeEach(() => {
            errorTracker.trackError({ type: 'runtime', category: 'system', severity: 'error' });
            errorTracker.trackError({ type: 'network', category: 'connectivity', severity: 'warning' });
            errorTracker.trackError({ type: 'performance', category: 'memory', severity: 'info' });
        });

        it('should calculate correct error statistics', () => {
            const stats = errorTracker.getErrorStats();
            expect(stats.total).toBe(3);
            expect(stats.byType.runtime).toBe(1);
            expect(stats.byCategory.system).toBe(1);
            expect(stats.bySeverity.error).toBe(1);
            expect(stats.bySeverity.warning).toBe(1);
            expect(stats.bySeverity.info).toBe(1);
        });
    });

    describe('Error Messages', () => {
        it('should show appropriate message for runtime errors', () => {
            const message = errorTracker.getUserFriendlyMessage({ type: 'runtime' });
            expect(message).toContain('unexpected error');
        });

        it('should show appropriate message for network errors', () => {
            const message = errorTracker.getUserFriendlyMessage({ type: 'network' });
            expect(message).toContain('connection');
        });

        it('should show appropriate message for WebGL errors', () => {
            const message = errorTracker.getUserFriendlyMessage({ type: 'webgl' });
            expect(message).toContain('drawing system');
        });
    });

    describe('Error UI', () => {
        it('should create error message element', () => {
            errorTracker.trackError({ type: 'test' });
            const messageElement = document.querySelector('.error-message');
            expect(messageElement).toBeTruthy();
        });

        it('should remove error message after timeout', () => {
            jest.useFakeTimers();
            errorTracker.trackError({ type: 'test' });
            jest.advanceTimersByTime(5000);
            const messageElement = document.querySelector('.error-message');
            expect(messageElement).toBeFalsy();
        });

        it('should show details button in development', () => {
            process.env.NODE_ENV = 'development';
            errorTracker.trackError({ type: 'test' });
            const detailsButton = document.querySelector('.show-details');
            expect(detailsButton).toBeTruthy();
        });
    });
}); 