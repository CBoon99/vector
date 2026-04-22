import ErrorTracker from '../error-tracker';

describe('ErrorTracker', () => {
    let errorTracker;
    let mockConsole;
    let mockStorage;

    beforeEach(() => {
        // Mock console
        mockConsole = {
            error: jest.fn(),
            warn: jest.fn(),
            log: jest.fn()
        };
        global.console = mockConsole;

        // Mock storage
        mockStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn()
        };
        global.localStorage = mockStorage;

        errorTracker = new ErrorTracker();
    });

    describe('Error Handling', () => {
        it('should handle invalid error objects', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            errorTracker.trackError(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid error provided to trackError');
        });

        it('should handle missing error properties', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            const error = new Error();
            errorTracker.trackError(error);
            expect(consoleSpy).toHaveBeenCalledWith('Error missing required properties');
        });

        it('should handle invalid error types', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            const error = new Error('Test error');
            error.type = 'invalid-type';
            errorTracker.trackError(error);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid error type:', 'invalid-type');
        });

        it('should handle storage errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockStorage.setItem.mockImplementation(() => {
                throw new Error('Storage error');
            });
            const error = new Error('Test error');
            errorTracker.trackError(error);
            expect(consoleSpy).toHaveBeenCalledWith('Error saving to storage:', expect.any(Error));
        });
    });

    describe('Error Tracking', () => {
        it('should handle duplicate errors', () => {
            const error = new Error('Test error');
            errorTracker.trackError(error);
            errorTracker.trackError(error);
            expect(errorTracker.getErrors().length).toBe(1);
        });

        it('should handle error limit exceeded', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            errorTracker.maxErrors = 2;
            
            const error1 = new Error('Error 1');
            const error2 = new Error('Error 2');
            const error3 = new Error('Error 3');
            
            errorTracker.trackError(error1);
            errorTracker.trackError(error2);
            errorTracker.trackError(error3);
            
            expect(consoleSpy).toHaveBeenCalledWith('Error limit exceeded, removing oldest error');
            expect(errorTracker.getErrors().length).toBe(2);
        });

        it('should handle error grouping', () => {
            const error1 = new Error('Test error');
            const error2 = new Error('Test error');
            const error3 = new Error('Different error');
            
            errorTracker.trackError(error1);
            errorTracker.trackError(error2);
            errorTracker.trackError(error3);
            
            const groups = errorTracker.getErrorGroups();
            expect(groups['Test error'].count).toBe(2);
            expect(groups['Different error'].count).toBe(1);
        });
    });

    describe('Error Analysis', () => {
        it('should handle invalid error analysis', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            errorTracker.analyzeErrors(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid errors provided for analysis');
        });

        it('should handle empty error list', () => {
            const analysis = errorTracker.analyzeErrors([]);
            expect(analysis.totalErrors).toBe(0);
            expect(analysis.errorTypes).toEqual({});
        });

        it('should handle error pattern detection', () => {
            const error1 = new Error('Network error');
            const error2 = new Error('Network error');
            const error3 = new Error('File error');
            
            errorTracker.trackError(error1);
            errorTracker.trackError(error2);
            errorTracker.trackError(error3);
            
            const patterns = errorTracker.detectErrorPatterns();
            expect(patterns['Network error'].frequency).toBe(2);
            expect(patterns['File error'].frequency).toBe(1);
        });
    });

    describe('Error Reporting', () => {
        it('should handle invalid report format', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            errorTracker.generateReport('invalid-format');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid report format:', 'invalid-format');
        });

        it('should handle report generation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const error = new Error('Test error');
            errorTracker.trackError(error);
            
            errorTracker.generateReport = jest.fn().mockImplementation(() => {
                throw new Error('Report generation error');
            });
            
            errorTracker.exportReport();
            expect(consoleSpy).toHaveBeenCalledWith('Error generating report:', expect.any(Error));
        });

        it('should handle report export errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const error = new Error('Test error');
            errorTracker.trackError(error);
            
            errorTracker.exportReport = jest.fn().mockImplementation(() => {
                throw new Error('Export error');
            });
            
            errorTracker.exportReport();
            expect(consoleSpy).toHaveBeenCalledWith('Error exporting report:', expect.any(Error));
        });
    });

    describe('Error Cleanup', () => {
        it('should handle invalid cleanup criteria', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            errorTracker.cleanupErrors(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid cleanup criteria provided');
        });

        it('should handle cleanup errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockStorage.removeItem.mockImplementation(() => {
                throw new Error('Cleanup error');
            });
            
            errorTracker.cleanupErrors({ age: '1d' });
            expect(consoleSpy).toHaveBeenCalledWith('Error during cleanup:', expect.any(Error));
        });

        it('should handle partial cleanup', () => {
            const error1 = new Error('Error 1');
            const error2 = new Error('Error 2');
            
            errorTracker.trackError(error1);
            errorTracker.trackError(error2);
            
            errorTracker.cleanupErrors({ type: 'Error 1' });
            expect(errorTracker.getErrors().length).toBe(1);
        });
    });

    describe('Error Validation Rules', () => {
        it('should validate error types', () => {
            const validTypes = ['application', 'network', 'file', 'system'];
            const invalidTypes = ['invalid', 'unknown', null, undefined];
            
            validTypes.forEach(type => {
                const error = new Error('Test error');
                error.type = type;
                expect(errorTracker.validateErrorType(error)).toBe(true);
            });
            
            invalidTypes.forEach(type => {
                const error = new Error('Test error');
                error.type = type;
                expect(errorTracker.validateErrorType(error)).toBe(false);
            });
        });

        it('should validate error severity', () => {
            const validSeverities = ['low', 'medium', 'high', 'critical'];
            const invalidSeverities = ['invalid', 'unknown', null, undefined];
            
            validSeverities.forEach(severity => {
                const error = new Error('Test error');
                error.severity = severity;
                expect(errorTracker.validateErrorSeverity(error)).toBe(true);
            });
            
            invalidSeverities.forEach(severity => {
                const error = new Error('Test error');
                error.severity = severity;
                expect(errorTracker.validateErrorSeverity(error)).toBe(false);
            });
        });

        it('should validate error context', () => {
            const validContexts = ['ui', 'api', 'storage', 'network'];
            const invalidContexts = ['invalid', 'unknown', null, undefined];
            
            validContexts.forEach(context => {
                const error = new Error('Test error');
                error.context = context;
                expect(errorTracker.validateErrorContext(error)).toBe(true);
            });
            
            invalidContexts.forEach(context => {
                const error = new Error('Test error');
                error.context = context;
                expect(errorTracker.validateErrorContext(error)).toBe(false);
            });
        });
    });
}); 