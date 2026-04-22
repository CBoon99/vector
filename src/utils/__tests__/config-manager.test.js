import ConfigManager from '../config-manager';

describe('ConfigManager', () => {
    let configManager;
    let mockStorage;

    beforeEach(() => {
        // Mock storage
        mockStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };
        global.localStorage = mockStorage;

        configManager = new ConfigManager();
    });

    describe('Error Handling', () => {
        it('should handle invalid config key', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.set(null, 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid config key provided');
        });

        it('should handle invalid config value', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.set('key', null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid config value provided');
        });

        it('should handle config set errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.set = jest.fn().mockImplementation(() => {
                throw new Error('Config set error');
            });
            configManager.set('key', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Error setting config:', expect.any(Error));
        });

        it('should handle config get errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.get = jest.fn().mockImplementation(() => {
                throw new Error('Config get error');
            });
            configManager.get('key');
            expect(consoleSpy).toHaveBeenCalledWith('Error getting config:', expect.any(Error));
        });

        it('should handle storage errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockStorage.setItem.mockImplementation(() => {
                throw new Error('Storage error');
            });
            configManager.set('key', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Error saving config:', expect.any(Error));
        });

        it('should handle config retrieval errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockStorage.getItem.mockImplementation(() => {
                throw new Error('Retrieval error');
            });
            configManager.get('key');
            expect(consoleSpy).toHaveBeenCalledWith('Error retrieving config:', expect.any(Error));
        });
    });

    describe('Config Validation', () => {
        it('should handle invalid config schema', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.validateConfig(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid config schema provided');
        });

        it('should handle schema validation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.validateConfig = jest.fn().mockImplementation(() => {
                throw new Error('Schema validation error');
            });
            configManager.validateConfig({});
            expect(consoleSpy).toHaveBeenCalledWith('Error validating config:', expect.any(Error));
        });

        it('should handle invalid config types', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.set('key', undefined);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid config value type');
        });
    });

    describe('Config Storage', () => {
        it('should handle storage quota exceeded', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            mockStorage.setItem.mockImplementation(() => {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                throw error;
            });
            configManager.set('key', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Storage quota exceeded, clearing config');
        });

        it('should handle storage permission denied', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            mockStorage.setItem.mockImplementation(() => {
                const error = new Error('PermissionDeniedError');
                error.name = 'PermissionDeniedError';
                throw error;
            });
            configManager.set('key', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Storage permission denied');
        });

        it('should handle missing storage', () => {
            const originalLocalStorage = window.localStorage;
            delete window.localStorage;
            
            const consoleSpy = jest.spyOn(console, 'warn');
            configManager.set('key', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('localStorage is not available');
            
            window.localStorage = originalLocalStorage;
        });
    });

    describe('Config Migration', () => {
        it('should handle invalid migration version', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.migrate(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid migration version provided');
        });

        it('should handle migration errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.migrate = jest.fn().mockImplementation(() => {
                throw new Error('Migration error');
            });
            configManager.migrate('1.0.0');
            expect(consoleSpy).toHaveBeenCalledWith('Error migrating config:', expect.any(Error));
        });

        it('should handle partial migration', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            configManager.migrate = jest.fn().mockImplementation(() => {
                throw new Error('Partial migration error');
            });
            configManager.migrate('1.0.0');
            expect(consoleSpy).toHaveBeenCalledWith('Partial config migration completed');
        });
    });

    describe('Config Backup', () => {
        it('should handle invalid backup format', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.backup('invalid-format');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid backup format:', 'invalid-format');
        });

        it('should handle backup errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.backup = jest.fn().mockImplementation(() => {
                throw new Error('Backup error');
            });
            configManager.backup('json');
            expect(consoleSpy).toHaveBeenCalledWith('Error backing up config:', expect.any(Error));
        });

        it('should handle empty config backup', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            configManager.backup('json');
            expect(consoleSpy).toHaveBeenCalledWith('No config to backup');
        });
    });

    describe('Config Restore', () => {
        it('should handle invalid restore data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.restore(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid restore data provided');
        });

        it('should handle restore errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.restore = jest.fn().mockImplementation(() => {
                throw new Error('Restore error');
            });
            configManager.restore({});
            expect(consoleSpy).toHaveBeenCalledWith('Error restoring config:', expect.any(Error));
        });

        it('should handle partial restore', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            configManager.restore = jest.fn().mockImplementation(() => {
                throw new Error('Partial restore error');
            });
            configManager.restore({});
            expect(consoleSpy).toHaveBeenCalledWith('Partial config restore completed');
        });
    });

    describe('Config Reset', () => {
        it('should handle invalid reset criteria', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.reset(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid reset criteria provided');
        });

        it('should handle reset errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.reset = jest.fn().mockImplementation(() => {
                throw new Error('Reset error');
            });
            configManager.reset({});
            expect(consoleSpy).toHaveBeenCalledWith('Error resetting config:', expect.any(Error));
        });

        it('should handle partial reset', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            configManager.reset = jest.fn().mockImplementation(() => {
                throw new Error('Partial reset error');
            });
            configManager.reset({});
            expect(consoleSpy).toHaveBeenCalledWith('Partial config reset completed');
        });
    });

    describe('Config Export', () => {
        it('should handle invalid export format', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.export('invalid-format');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid export format:', 'invalid-format');
        });

        it('should handle export errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.export = jest.fn().mockImplementation(() => {
                throw new Error('Export error');
            });
            configManager.export('json');
            expect(consoleSpy).toHaveBeenCalledWith('Error exporting config:', expect.any(Error));
        });

        it('should handle empty config export', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            configManager.export('json');
            expect(consoleSpy).toHaveBeenCalledWith('No config to export');
        });
    });

    describe('Config Import', () => {
        it('should handle invalid import data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.import(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid import data provided');
        });

        it('should handle import errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.import = jest.fn().mockImplementation(() => {
                throw new Error('Import error');
            });
            configManager.import({});
            expect(consoleSpy).toHaveBeenCalledWith('Error importing config:', expect.any(Error));
        });

        it('should handle partial import', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            configManager.import = jest.fn().mockImplementation(() => {
                throw new Error('Partial import error');
            });
            configManager.import({});
            expect(consoleSpy).toHaveBeenCalledWith('Partial config import completed');
        });
    });

    describe('Config Loading', () => {
        it('should handle invalid config path', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.load(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid config path provided');
        });

        it('should handle load errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.load = jest.fn().mockImplementation(() => {
                throw new Error('Load error');
            });
            configManager.load('path');
            expect(consoleSpy).toHaveBeenCalledWith('Error loading config:', expect.any(Error));
        });

        it('should handle parse errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.parse = jest.fn().mockImplementation(() => {
                throw new Error('Parse error');
            });
            configManager.parse('content');
            expect(consoleSpy).toHaveBeenCalledWith('Error parsing config:', expect.any(Error));
        });
    });

    describe('Config Persistence', () => {
        it('should handle invalid persistence key', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.persist(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid persistence key provided');
        });

        it('should handle persistence errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.persist = jest.fn().mockImplementation(() => {
                throw new Error('Persistence error');
            });
            configManager.persist('key');
            expect(consoleSpy).toHaveBeenCalledWith('Error persisting config:', expect.any(Error));
        });

        it('should handle restoration errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.restore = jest.fn().mockImplementation(() => {
                throw new Error('Restoration error');
            });
            configManager.restore('key');
            expect(consoleSpy).toHaveBeenCalledWith('Error restoring config:', expect.any(Error));
        });
    });

    describe('Config Middleware', () => {
        it('should handle invalid middleware', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.addMiddleware(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid middleware provided');
        });

        it('should handle middleware errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const middleware = jest.fn().mockImplementation(() => {
                throw new Error('Middleware error');
            });
            configManager.addMiddleware(middleware);
            configManager.applyMiddleware({});
            expect(consoleSpy).toHaveBeenCalledWith('Error in config middleware:', expect.any(Error));
        });

        it('should handle middleware chain errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.applyMiddleware = jest.fn().mockImplementation(() => {
                throw new Error('Middleware chain error');
            });
            configManager.applyMiddleware({});
            expect(consoleSpy).toHaveBeenCalledWith('Error in middleware chain:', expect.any(Error));
        });
    });

    describe('Config Analytics', () => {
        it('should handle invalid analytics data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.trackConfig(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid analytics data provided');
        });

        it('should handle analytics errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.trackConfig = jest.fn().mockImplementation(() => {
                throw new Error('Analytics error');
            });
            configManager.trackConfig({});
            expect(consoleSpy).toHaveBeenCalledWith('Error tracking config:', expect.any(Error));
        });

        it('should handle analytics report generation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.generateReport = jest.fn().mockImplementation(() => {
                throw new Error('Report generation error');
            });
            configManager.generateReport({});
            expect(consoleSpy).toHaveBeenCalledWith('Error generating analytics report:', expect.any(Error));
        });
    });

    describe('Config Monitoring', () => {
        it('should handle invalid monitoring config', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.startMonitoring(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid monitoring configuration provided');
        });

        it('should handle monitoring errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.startMonitoring = jest.fn().mockImplementation(() => {
                throw new Error('Monitoring error');
            });
            configManager.startMonitoring({});
            expect(consoleSpy).toHaveBeenCalledWith('Error starting config monitoring:', expect.any(Error));
        });

        it('should handle monitoring alert errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.sendAlert = jest.fn().mockImplementation(() => {
                throw new Error('Alert error');
            });
            configManager.sendAlert({});
            expect(consoleSpy).toHaveBeenCalledWith('Error sending monitoring alert:', expect.any(Error));
        });
    });

    describe('Config Environment', () => {
        it('should handle invalid environment', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.setEnvironment(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid environment provided');
        });

        it('should handle environment errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.setEnvironment = jest.fn().mockImplementation(() => {
                throw new Error('Environment error');
            });
            configManager.setEnvironment('dev');
            expect(consoleSpy).toHaveBeenCalledWith('Error setting environment:', expect.any(Error));
        });

        it('should handle environment validation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.validateEnvironment = jest.fn().mockImplementation(() => {
                throw new Error('Environment validation error');
            });
            configManager.validateEnvironment('dev');
            expect(consoleSpy).toHaveBeenCalledWith('Error validating environment:', expect.any(Error));
        });
    });

    describe('Config Secrets', () => {
        it('should handle invalid secret key', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.setSecret(null, 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid secret key provided');
        });

        it('should handle secret errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.setSecret = jest.fn().mockImplementation(() => {
                throw new Error('Secret error');
            });
            configManager.setSecret('key', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Error setting secret:', expect.any(Error));
        });

        it('should handle secret encryption errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            configManager.encryptSecret = jest.fn().mockImplementation(() => {
                throw new Error('Encryption error');
            });
            configManager.encryptSecret('value');
            expect(consoleSpy).toHaveBeenCalledWith('Error encrypting secret:', expect.any(Error));
        });
    });
}); 