import StorageManager from '../storage-manager';

describe('StorageManager', () => {
    let storageManager;
    let mockStorage;

    beforeEach(() => {
        // Mock storage
        mockStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
            key: jest.fn(),
            length: 0
        };
        global.localStorage = mockStorage;

        storageManager = new StorageManager();
    });

    describe('Error Handling', () => {
        it('should handle invalid storage keys', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.set(null, 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid storage key provided');
        });

        it('should handle invalid storage values', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.set('key', null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid storage value provided');
        });

        it('should handle storage errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockStorage.setItem.mockImplementation(() => {
                throw new Error('Storage error');
            });
            storageManager.set('key', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Error saving to storage:', expect.any(Error));
        });

        it('should handle storage retrieval errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockStorage.getItem.mockImplementation(() => {
                throw new Error('Retrieval error');
            });
            storageManager.get('key');
            expect(consoleSpy).toHaveBeenCalledWith('Error retrieving from storage:', expect.any(Error));
        });
    });

    describe('Storage Operations', () => {
        it('should handle storage misses', () => {
            mockStorage.getItem.mockReturnValue(null);
            const value = storageManager.get('non-existent');
            expect(value).toBeNull();
        });

        it('should handle storage quota exceeded', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            mockStorage.setItem.mockImplementation(() => {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                throw error;
            });
            storageManager.set('key', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Storage quota exceeded');
        });

        it('should handle storage permission denied', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            mockStorage.setItem.mockImplementation(() => {
                const error = new Error('PermissionDeniedError');
                error.name = 'PermissionDeniedError';
                throw error;
            });
            storageManager.set('key', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Storage permission denied');
        });
    });

    describe('Storage Validation', () => {
        it('should handle invalid storage data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockStorage.getItem.mockReturnValue('invalid-json');
            storageManager.get('key');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid storage data format');
        });

        it('should handle corrupted storage data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const corruptedData = {
                value: undefined,
                metadata: 'invalid'
            };
            mockStorage.getItem.mockReturnValue(JSON.stringify(corruptedData));
            
            storageManager.get('corrupted');
            expect(consoleSpy).toHaveBeenCalledWith('Corrupted storage data');
        });

        it('should handle invalid storage metadata', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const invalidData = {
                value: 'test',
                metadata: 'invalid'
            };
            mockStorage.getItem.mockReturnValue(JSON.stringify(invalidData));
            
            storageManager.get('invalid');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid storage metadata');
        });
    });

    describe('Storage Cleanup', () => {
        it('should handle invalid cleanup criteria', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.cleanup(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid cleanup criteria provided');
        });

        it('should handle cleanup errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.cleanup = jest.fn().mockImplementation(() => {
                throw new Error('Cleanup error');
            });
            storageManager.cleanup({ age: '1d' });
            expect(consoleSpy).toHaveBeenCalledWith('Error during storage cleanup:', expect.any(Error));
        });

        it('should handle partial cleanup', () => {
            const entries = [
                { key: 'key1', value: 'value1', timestamp: Date.now() - 86400000 },
                { key: 'key2', value: 'value2', timestamp: Date.now() }
            ];
            
            storageManager.cleanup(entries, { age: '12h' });
            expect(entries.length).toBe(1);
            expect(entries[0].key).toBe('key2');
        });
    });

    describe('Storage Migration', () => {
        it('should handle invalid migration version', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.migrate(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid migration version provided');
        });

        it('should handle migration errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.migrate = jest.fn().mockImplementation(() => {
                throw new Error('Migration error');
            });
            storageManager.migrate('1.0.0');
            expect(consoleSpy).toHaveBeenCalledWith('Error migrating storage:', expect.any(Error));
        });

        it('should handle partial migration', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            storageManager.migrate = jest.fn().mockImplementation(() => {
                throw new Error('Partial migration error');
            });
            storageManager.migrate('1.0.0');
            expect(consoleSpy).toHaveBeenCalledWith('Partial storage migration completed');
        });
    });

    describe('Storage Backup', () => {
        it('should handle invalid backup format', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.backup('invalid-format');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid backup format:', 'invalid-format');
        });

        it('should handle backup errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.backup = jest.fn().mockImplementation(() => {
                throw new Error('Backup error');
            });
            storageManager.backup('json');
            expect(consoleSpy).toHaveBeenCalledWith('Error backing up storage:', expect.any(Error));
        });

        it('should handle empty storage backup', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            storageManager.backup('json');
            expect(consoleSpy).toHaveBeenCalledWith('No storage to backup');
        });
    });

    describe('Storage Restore', () => {
        it('should handle invalid restore data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.restore(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid restore data provided');
        });

        it('should handle restore errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.restore = jest.fn().mockImplementation(() => {
                throw new Error('Restore error');
            });
            storageManager.restore({});
            expect(consoleSpy).toHaveBeenCalledWith('Error restoring storage:', expect.any(Error));
        });

        it('should handle partial restore', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            storageManager.restore = jest.fn().mockImplementation(() => {
                throw new Error('Partial restore error');
            });
            storageManager.restore({});
            expect(consoleSpy).toHaveBeenCalledWith('Partial storage restore completed');
        });
    });

    describe('Storage Reset', () => {
        it('should handle invalid reset criteria', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.reset(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid reset criteria provided');
        });

        it('should handle reset errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.reset = jest.fn().mockImplementation(() => {
                throw new Error('Reset error');
            });
            storageManager.reset({});
            expect(consoleSpy).toHaveBeenCalledWith('Error resetting storage:', expect.any(Error));
        });

        it('should handle partial reset', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            storageManager.reset = jest.fn().mockImplementation(() => {
                throw new Error('Partial reset error');
            });
            storageManager.reset({});
            expect(consoleSpy).toHaveBeenCalledWith('Partial storage reset completed');
        });
    });

    describe('Storage Export', () => {
        it('should handle invalid export format', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.export('invalid-format');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid export format:', 'invalid-format');
        });

        it('should handle export errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.export = jest.fn().mockImplementation(() => {
                throw new Error('Export error');
            });
            storageManager.export('json');
            expect(consoleSpy).toHaveBeenCalledWith('Error exporting storage:', expect.any(Error));
        });

        it('should handle empty storage export', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            storageManager.export('json');
            expect(consoleSpy).toHaveBeenCalledWith('No storage to export');
        });
    });

    describe('Storage Import', () => {
        it('should handle invalid import data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.import(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid import data provided');
        });

        it('should handle import errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            storageManager.import = jest.fn().mockImplementation(() => {
                throw new Error('Import error');
            });
            storageManager.import({});
            expect(consoleSpy).toHaveBeenCalledWith('Error importing storage:', expect.any(Error));
        });

        it('should handle partial import', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            storageManager.import = jest.fn().mockImplementation(() => {
                throw new Error('Partial import error');
            });
            storageManager.import({});
            expect(consoleSpy).toHaveBeenCalledWith('Partial storage import completed');
        });
    });
}); 