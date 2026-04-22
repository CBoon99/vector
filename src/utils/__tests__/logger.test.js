import Logger from '../logger';

describe('Logger', () => {
    let logger;
    let mockConsole;
    let mockStorage;

    beforeEach(() => {
        // Mock console
        mockConsole = {
            log: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        };
        global.console = mockConsole;

        // Mock storage
        mockStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn()
        };
        global.localStorage = mockStorage;

        logger = new Logger();
    });

    describe('Error Handling', () => {
        it('should handle invalid log level', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.log(null, 'message');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid log level provided');
        });

        it('should handle invalid log message', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.log('info', null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid log message provided');
        });

        it('should handle logging errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.log = jest.fn().mockImplementation(() => {
                throw new Error('Logging error');
            });
            logger.log('info', 'message');
            expect(consoleSpy).toHaveBeenCalledWith('Error logging message:', expect.any(Error));
        });

        it('should handle log formatting errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.formatLog = jest.fn().mockImplementation(() => {
                throw new Error('Format error');
            });
            logger.log('info', 'message');
            expect(consoleSpy).toHaveBeenCalledWith('Error formatting log message:', expect.any(Error));
        });

        it('should handle storage errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockStorage.setItem.mockImplementation(() => {
                throw new Error('Storage error');
            });
            logger.log('test');
            expect(consoleSpy).toHaveBeenCalledWith('Error saving log to storage:', expect.any(Error));
        });

        it('should handle log rotation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.rotateLogs = jest.fn().mockImplementation(() => {
                throw new Error('Rotation error');
            });
            logger.log('test');
            expect(consoleSpy).toHaveBeenCalledWith('Error rotating logs:', expect.any(Error));
        });
    });

    describe('Log Levels', () => {
        it('should handle debug level', () => {
            logger.log('test', 'debug');
            expect(mockConsole.debug).toHaveBeenCalledWith(expect.stringContaining('test'));
        });

        it('should handle info level', () => {
            logger.log('test', 'info');
            expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('test'));
        });

        it('should handle warn level', () => {
            logger.log('test', 'warn');
            expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('test'));
        });

        it('should handle error level', () => {
            logger.log('test', 'error');
            expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('test'));
        });
    });

    describe('Log Formatting', () => {
        it('should handle invalid timestamp format', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.formatTimestamp = jest.fn().mockImplementation(() => {
                throw new Error('Timestamp error');
            });
            logger.log('test');
            expect(consoleSpy).toHaveBeenCalledWith('Error formatting timestamp:', expect.any(Error));
        });

        it('should handle invalid log format', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.formatLog = jest.fn().mockImplementation(() => {
                throw new Error('Format error');
            });
            logger.log('test');
            expect(consoleSpy).toHaveBeenCalledWith('Error formatting log:', expect.any(Error));
        });

        it('should handle circular references', () => {
            const circular = {};
            circular.self = circular;
            logger.log(circular);
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('[Circular]'));
        });
    });

    describe('Log Storage', () => {
        it('should handle storage quota exceeded', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            mockStorage.setItem.mockImplementation(() => {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                throw error;
            });
            logger.log('test');
            expect(consoleSpy).toHaveBeenCalledWith('Storage quota exceeded, rotating logs');
        });

        it('should handle storage permission denied', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            mockStorage.setItem.mockImplementation(() => {
                const error = new Error('PermissionDeniedError');
                error.name = 'PermissionDeniedError';
                throw error;
            });
            logger.log('test');
            expect(consoleSpy).toHaveBeenCalledWith('Storage permission denied');
        });

        it('should handle missing storage', () => {
            const originalLocalStorage = window.localStorage;
            delete window.localStorage;
            
            const consoleSpy = jest.spyOn(console, 'warn');
            logger.log('test');
            expect(consoleSpy).toHaveBeenCalledWith('localStorage is not available');
            
            window.localStorage = originalLocalStorage;
        });
    });

    describe('Log Retrieval', () => {
        it('should handle invalid log retrieval', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.getLogs(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid log retrieval criteria provided');
        });

        it('should handle log parsing errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockStorage.getItem.mockReturnValue('invalid-json');
            logger.getLogs();
            expect(consoleSpy).toHaveBeenCalledWith('Error parsing logs:', expect.any(Error));
        });

        it('should handle empty log storage', () => {
            mockStorage.getItem.mockReturnValue(null);
            const logs = logger.getLogs();
            expect(logs).toEqual([]);
        });
    });

    describe('Log Filtering', () => {
        it('should handle invalid filter criteria', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.filterLogs(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid filter criteria provided');
        });

        it('should handle filter errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.filterLogs = jest.fn().mockImplementation(() => {
                throw new Error('Filter error');
            });
            logger.filterLogs({ level: 'error' });
            expect(consoleSpy).toHaveBeenCalledWith('Error filtering logs:', expect.any(Error));
        });

        it('should handle partial filter results', () => {
            const logs = [
                { level: 'error', message: 'error1' },
                { level: 'info', message: 'info1' },
                { level: 'error', message: 'error2' }
            ];
            
            const filtered = logger.filterLogs(logs, { level: 'error' });
            expect(filtered.length).toBe(2);
            expect(filtered.every(log => log.level === 'error')).toBe(true);
        });
    });

    describe('Log Export', () => {
        it('should handle invalid export format', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.exportLogs('invalid-format');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid export format:', 'invalid-format');
        });

        it('should handle export errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.exportLogs = jest.fn().mockImplementation(() => {
                throw new Error('Export error');
            });
            logger.exportLogs('json');
            expect(consoleSpy).toHaveBeenCalledWith('Error exporting logs:', expect.any(Error));
        });

        it('should handle empty log export', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            logger.exportLogs('json');
            expect(consoleSpy).toHaveBeenCalledWith('No logs to export');
        });
    });

    describe('Log Cleanup', () => {
        it('should handle invalid cleanup criteria', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.cleanupLogs(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid cleanup criteria provided');
        });

        it('should handle cleanup errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.cleanupLogs = jest.fn().mockImplementation(() => {
                throw new Error('Cleanup error');
            });
            logger.cleanupLogs({ age: '1d' });
            expect(consoleSpy).toHaveBeenCalledWith('Error during log cleanup:', expect.any(Error));
        });

        it('should handle partial cleanup', () => {
            const logs = [
                { timestamp: Date.now() - 86400000, message: 'old' },
                { timestamp: Date.now(), message: 'new' }
            ];
            
            logger.cleanupLogs(logs, { age: '12h' });
            expect(logs.length).toBe(1);
            expect(logs[0].message).toBe('new');
        });
    });

    describe('Log Validation', () => {
        it('should handle invalid log schema', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.validateLog(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid log schema provided');
        });

        it('should handle schema validation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.validateLog = jest.fn().mockImplementation(() => {
                throw new Error('Schema validation error');
            });
            logger.validateLog({});
            expect(consoleSpy).toHaveBeenCalledWith('Error validating log:', expect.any(Error));
        });

        it('should handle invalid log types', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.log('info', undefined);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid log message type');
        });
    });

    describe('Log Persistence', () => {
        it('should handle invalid persistence key', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.persist(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid persistence key provided');
        });

        it('should handle persistence errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.persist = jest.fn().mockImplementation(() => {
                throw new Error('Persistence error');
            });
            logger.persist('key');
            expect(consoleSpy).toHaveBeenCalledWith('Error persisting logs:', expect.any(Error));
        });

        it('should handle restoration errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.restore = jest.fn().mockImplementation(() => {
                throw new Error('Restoration error');
            });
            logger.restore('key');
            expect(consoleSpy).toHaveBeenCalledWith('Error restoring logs:', expect.any(Error));
        });
    });

    describe('Log Middleware', () => {
        it('should handle invalid middleware', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.addMiddleware(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid middleware provided');
        });

        it('should handle middleware errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const middleware = jest.fn().mockImplementation(() => {
                throw new Error('Middleware error');
            });
            logger.addMiddleware(middleware);
            logger.applyMiddleware({});
            expect(consoleSpy).toHaveBeenCalledWith('Error in log middleware:', expect.any(Error));
        });

        it('should handle middleware chain errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.applyMiddleware = jest.fn().mockImplementation(() => {
                throw new Error('Middleware chain error');
            });
            logger.applyMiddleware({});
            expect(consoleSpy).toHaveBeenCalledWith('Error in middleware chain:', expect.any(Error));
        });
    });

    describe('Log Analytics', () => {
        it('should handle invalid analytics data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.trackLog(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid analytics data provided');
        });

        it('should handle analytics errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.trackLog = jest.fn().mockImplementation(() => {
                throw new Error('Analytics error');
            });
            logger.trackLog({});
            expect(consoleSpy).toHaveBeenCalledWith('Error tracking log:', expect.any(Error));
        });

        it('should handle analytics report generation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.generateReport = jest.fn().mockImplementation(() => {
                throw new Error('Report generation error');
            });
            logger.generateReport({});
            expect(consoleSpy).toHaveBeenCalledWith('Error generating analytics report:', expect.any(Error));
        });
    });

    describe('Log Monitoring', () => {
        it('should handle invalid monitoring config', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.startMonitoring(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid monitoring configuration provided');
        });

        it('should handle monitoring errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.startMonitoring = jest.fn().mockImplementation(() => {
                throw new Error('Monitoring error');
            });
            logger.startMonitoring({});
            expect(consoleSpy).toHaveBeenCalledWith('Error starting log monitoring:', expect.any(Error));
        });

        it('should handle monitoring alert errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.sendAlert = jest.fn().mockImplementation(() => {
                throw new Error('Alert error');
            });
            logger.sendAlert({});
            expect(consoleSpy).toHaveBeenCalledWith('Error sending monitoring alert:', expect.any(Error));
        });
    });

    describe('Log Rotation', () => {
        it('should handle invalid rotation config', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.setRotationConfig(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid rotation configuration provided');
        });

        it('should handle rotation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.rotate = jest.fn().mockImplementation(() => {
                throw new Error('Rotation error');
            });
            logger.rotate();
            expect(consoleSpy).toHaveBeenCalledWith('Error rotating logs:', expect.any(Error));
        });

        it('should handle rotation cleanup errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.cleanup = jest.fn().mockImplementation(() => {
                throw new Error('Cleanup error');
            });
            logger.cleanup();
            expect(consoleSpy).toHaveBeenCalledWith('Error cleaning up rotated logs:', expect.any(Error));
        });
    });

    describe('Log Filtering', () => {
        it('should handle invalid filter criteria', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.filter(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid filter criteria provided');
        });

        it('should handle filter errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.filter = jest.fn().mockImplementation(() => {
                throw new Error('Filter error');
            });
            logger.filter({});
            expect(consoleSpy).toHaveBeenCalledWith('Error filtering logs:', expect.any(Error));
        });

        it('should handle filter chain errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            logger.applyFilters = jest.fn().mockImplementation(() => {
                throw new Error('Filter chain error');
            });
            logger.applyFilters({});
            expect(consoleSpy).toHaveBeenCalledWith('Error in filter chain:', expect.any(Error));
        });
    });
}); 