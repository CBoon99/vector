import App from '../app';
import ErrorTracker from '../utils/errorTracker';

jest.mock('../utils/errorTracker');

describe('App Integration with ErrorTracker', () => {
    let app;
    let mockErrorTracker;

    beforeEach(() => {
        // Mock DOM elements
        document.body.innerHTML = `
            <canvas id="drawing-canvas"></canvas>
            <div id="layer-list"></div>
            <div id="drawing-tools"></div>
            <input id="hex-input" value="#000000">
            <input id="stroke-width-slider" value="1">
            <input id="fill-toggle" type="checkbox">
        `;

        // Mock ErrorTracker
        mockErrorTracker = {
            trackError: jest.fn(),
            getErrors: jest.fn(),
            clearErrors: jest.fn()
        };
        ErrorTracker.mockImplementation(() => mockErrorTracker);

        // Create app instance
        app = new App();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Error Handling Integration', () => {
        it('should initialize ErrorTracker', () => {
            expect(ErrorTracker).toHaveBeenCalled();
            expect(app.errorTracker).toBe(mockErrorTracker);
        });

        it('should track errors through handleError method', () => {
            const error = new Error('Test error');
            app.handleError(error, 'test-context');

            expect(mockErrorTracker.trackError).toHaveBeenCalledWith({
                type: 'application',
                message: 'Test error',
                context: 'test-context',
                stack: error.stack,
                timestamp: expect.any(String)
            });
        });

        it('should handle FileError types correctly', () => {
            const fileError = new Error('File too large');
            fileError.code = 'FILE_TOO_LARGE';
            app.handleError(fileError, 'file-upload');

            expect(mockErrorTracker.trackError).toHaveBeenCalledWith({
                type: 'application',
                message: 'File too large',
                context: 'file-upload',
                code: 'FILE_TOO_LARGE',
                stack: fileError.stack,
                timestamp: expect.any(String)
            });
        });
    });

    describe('Error Message Display', () => {
        it('should show user-friendly message for FileError', () => {
            const fileError = new Error('File too large');
            fileError.code = 'FILE_TOO_LARGE';
            app.handleError(fileError, 'file-upload');

            const messageElement = document.querySelector('.message');
            expect(messageElement).toBeTruthy();
            expect(messageElement.textContent).toContain('too large');
        });

        it('should show generic message for unknown errors', () => {
            const error = new Error('Unknown error');
            app.handleError(error, 'unknown-context');

            const messageElement = document.querySelector('.message');
            expect(messageElement).toBeTruthy();
            expect(messageElement.textContent).toContain('unexpected error');
        });
    });

    describe('Error Recovery', () => {
        it('should handle canvas errors gracefully', () => {
            const canvas = document.getElementById('drawing-canvas');
            canvas.dispatchEvent(new Event('webglcontextlost'));

            expect(mockErrorTracker.trackError).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'webgl',
                    category: 'graphics'
                })
            );
        });

        it('should handle network errors gracefully', () => {
            window.dispatchEvent(new Event('offline'));

            expect(mockErrorTracker.trackError).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'network',
                    category: 'connectivity'
                })
            );
        });
    });

    describe('Error Context', () => {
        it('should include operation context in errors', () => {
            const error = new Error('Operation failed');
            app.handleError(error, 'drawing-operation');

            expect(mockErrorTracker.trackError).toHaveBeenCalledWith(
                expect.objectContaining({
                    context: 'drawing-operation'
                })
            );
        });

        it('should include state information in errors', () => {
            const error = new Error('State error');
            app.handleError(error, 'state-update');

            expect(mockErrorTracker.trackError).toHaveBeenCalledWith(
                expect.objectContaining({
                    context: 'state-update'
                })
            );
        });
    });

    describe('Error Prevention', () => {
        it('should validate file size before processing', () => {
            const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }); // 6MB

            app.handleFiles([file]);

            expect(mockErrorTracker.trackError).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'application',
                    context: 'file-upload'
                })
            );
        });

        it('should validate file type before processing', () => {
            const file = new File([''], 'test.txt', { type: 'text/plain' });
            app.handleFiles([file]);

            expect(mockErrorTracker.trackError).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'application',
                    context: 'file-upload'
                })
            );
        });
    });
}); 