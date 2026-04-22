import CacheManager from '../cache-manager';

describe('CacheManager', () => {
    let cacheManager;
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

        cacheManager = new CacheManager();
    });

    describe('Basic Operations', () => {
        it('should handle invalid cache key', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.set(null, 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid cache key provided');
        });

        it('should handle invalid cache value', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.set('key', null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid cache value provided');
        });

        it('should handle cache set errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.set = jest.fn().mockImplementation(() => {
                throw new Error('Cache set error');
            });
            cacheManager.set('key', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Error setting cache:', expect.any(Error));
        });

        it('should handle cache get errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.get = jest.fn().mockImplementation(() => {
                throw new Error('Cache get error');
            });
            cacheManager.get('key');
            expect(consoleSpy).toHaveBeenCalledWith('Error getting cache:', expect.any(Error));
        });

        it('should handle cache delete errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.delete = jest.fn().mockImplementation(() => {
                throw new Error('Cache delete error');
            });
            cacheManager.delete('key');
            expect(consoleSpy).toHaveBeenCalledWith('Error deleting cache:', expect.any(Error));
        });

        it('should handle cache clear errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.clear = jest.fn().mockImplementation(() => {
                throw new Error('Cache clear error');
            });
            cacheManager.clear();
            expect(consoleSpy).toHaveBeenCalledWith('Error clearing cache:', expect.any(Error));
        });
    });

    describe('Configuration', () => {
        it('should handle invalid config', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.configure(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid cache configuration provided');
        });

        it('should handle configuration errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.configure = jest.fn().mockImplementation(() => {
                throw new Error('Configuration error');
            });
            cacheManager.configure({});
            expect(consoleSpy).toHaveBeenCalledWith('Error configuring cache:', expect.any(Error));
        });

        it('should handle invalid TTL', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.setTTL(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid TTL provided');
        });
    });

    describe('Persistence', () => {
        it('should handle invalid persistence config', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.persist(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid persistence configuration provided');
        });

        it('should handle persistence errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.persist = jest.fn().mockImplementation(() => {
                throw new Error('Persistence error');
            });
            cacheManager.persist({});
            expect(consoleSpy).toHaveBeenCalledWith('Error persisting cache:', expect.any(Error));
        });

        it('should handle restore errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.restore = jest.fn().mockImplementation(() => {
                throw new Error('Restore error');
            });
            cacheManager.restore();
            expect(consoleSpy).toHaveBeenCalledWith('Error restoring cache:', expect.any(Error));
        });
    });

    describe('Events', () => {
        it('should handle invalid event name', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.on(null, () => {});
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event name provided');
        });

        it('should handle invalid event handler', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.on('event', null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event handler provided');
        });

        it('should handle event emission errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.emit = jest.fn().mockImplementation(() => {
                throw new Error('Event emission error');
            });
            cacheManager.emit('event', {});
            expect(consoleSpy).toHaveBeenCalledWith('Error emitting event:', expect.any(Error));
        });
    });

    describe('Cache Operations', () => {
        it('should handle cache misses', () => {
            mockStorage.getItem.mockReturnValue(null);
            const value = cacheManager.get('non-existent');
            expect(value).toBeNull();
        });

        it('should handle expired cache entries', () => {
            const expiredEntry = {
                value: 'test',
                expiry: Date.now() - 1000
            };
            mockStorage.getItem.mockReturnValue(JSON.stringify(expiredEntry));
            
            const value = cacheManager.get('expired');
            expect(value).toBeNull();
        });

        it('should handle cache size limits', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            cacheManager.maxSize = 2;
            
            cacheManager.set('key1', 'value1');
            cacheManager.set('key2', 'value2');
            cacheManager.set('key3', 'value3');
            
            expect(consoleSpy).toHaveBeenCalledWith('Cache size limit reached, removing oldest entry');
            expect(cacheManager.size()).toBe(2);
        });

        it('should handle invalid delete key', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.delete(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid cache key provided');
        });

        it('should handle storage errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockStorage.setItem.mockImplementation(() => {
                throw new Error('Storage error');
            });
            cacheManager.set('key', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Error saving to cache:', expect.any(Error));
        });

        it('should handle cache retrieval errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockStorage.getItem.mockImplementation(() => {
                throw new Error('Retrieval error');
            });
            cacheManager.get('key');
            expect(consoleSpy).toHaveBeenCalledWith('Error retrieving from cache:', expect.any(Error));
        });
    });

    describe('Cache Validation', () => {
        it('should handle invalid cache schema', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.validateCache(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid cache schema provided');
        });

        it('should handle schema validation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.validateCache = jest.fn().mockImplementation(() => {
                throw new Error('Schema validation error');
            });
            cacheManager.validateCache({});
            expect(consoleSpy).toHaveBeenCalledWith('Error validating cache:', expect.any(Error));
        });

        it('should handle invalid cache types', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.set('key', undefined);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid cache value type');
        });

        it('should handle invalid cache entries', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockStorage.getItem.mockReturnValue('invalid-json');
            cacheManager.get('key');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid cache entry format');
        });

        it('should handle corrupted cache data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const corruptedEntry = {
                value: undefined,
                expiry: 'invalid'
            };
            mockStorage.getItem.mockReturnValue(JSON.stringify(corruptedEntry));
            
            cacheManager.get('corrupted');
            expect(consoleSpy).toHaveBeenCalledWith('Corrupted cache entry');
        });

        it('should handle invalid cache metadata', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const invalidEntry = {
                value: 'test',
                metadata: 'invalid'
            };
            mockStorage.getItem.mockReturnValue(JSON.stringify(invalidEntry));
            
            cacheManager.get('invalid');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid cache metadata');
        });

        it('should handle invalid validation config', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.validate(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid validation configuration provided');
        });

        it('should handle validation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.validate = jest.fn().mockImplementation(() => {
                throw new Error('Validation error');
            });
            cacheManager.validate({});
            expect(consoleSpy).toHaveBeenCalledWith('Error validating cache:', expect.any(Error));
        });

        it('should handle integrity check errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.checkIntegrity = jest.fn().mockImplementation(() => {
                throw new Error('Integrity check error');
            });
            cacheManager.checkIntegrity();
            expect(consoleSpy).toHaveBeenCalledWith('Error checking cache integrity:', expect.any(Error));
        });
    });

    describe('Cache Expiration', () => {
        it('should handle invalid expiration time', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.setExpiration(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid expiration time provided');
        });

        it('should handle expiration errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.setExpiration = jest.fn().mockImplementation(() => {
                throw new Error('Expiration error');
            });
            cacheManager.setExpiration('key', 1000);
            expect(consoleSpy).toHaveBeenCalledWith('Error setting cache expiration:', expect.any(Error));
        });

        it('should handle cleanup errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.cleanup = jest.fn().mockImplementation(() => {
                throw new Error('Cleanup error');
            });
            cacheManager.cleanup();
            expect(consoleSpy).toHaveBeenCalledWith('Error cleaning up expired cache:', expect.any(Error));
        });
    });

    describe('Cache Storage', () => {
        it('should handle storage quota exceeded', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            mockStorage.setItem.mockImplementation(() => {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                throw error;
            });
            cacheManager.set('key', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Storage quota exceeded, clearing cache');
        });

        it('should handle storage permission denied', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            mockStorage.setItem.mockImplementation(() => {
                const error = new Error('PermissionDeniedError');
                error.name = 'PermissionDeniedError';
                throw error;
            });
            cacheManager.set('key', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Storage permission denied');
        });

        it('should handle missing storage', () => {
            const originalLocalStorage = window.localStorage;
            delete window.localStorage;
            
            const consoleSpy = jest.spyOn(console, 'warn');
            cacheManager.set('key', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('localStorage is not available');
            
            window.localStorage = originalLocalStorage;
        });
    });

    describe('Cache Cleanup', () => {
        it('should handle invalid cleanup criteria', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.cleanup(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid cleanup criteria provided');
        });

        it('should handle cleanup errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.cleanup = jest.fn().mockImplementation(() => {
                throw new Error('Cleanup error');
            });
            cacheManager.cleanup({ age: '1d' });
            expect(consoleSpy).toHaveBeenCalledWith('Error during cache cleanup:', expect.any(Error));
        });

        it('should handle partial cleanup', () => {
            const entries = [
                { key: 'key1', value: 'value1', timestamp: Date.now() - 86400000 },
                { key: 'key2', value: 'value2', timestamp: Date.now() }
            ];
            
            cacheManager.cleanup(entries, { age: '12h' });
            expect(entries.length).toBe(1);
            expect(entries[0].key).toBe('key2');
        });
    });

    describe('Cache Statistics', () => {
        it('should handle invalid statistics calculation', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.getStats(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid statistics criteria provided');
        });

        it('should handle statistics calculation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.getStats = jest.fn().mockImplementation(() => {
                throw new Error('Statistics error');
            });
            cacheManager.getStats();
            expect(consoleSpy).toHaveBeenCalledWith('Error calculating cache statistics:', expect.any(Error));
        });

        it('should handle empty cache statistics', () => {
            const stats = cacheManager.getStats();
            expect(stats).toEqual({
                size: 0,
                hits: 0,
                misses: 0,
                hitRate: 0
            });
        });

        it('should handle statistics errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.getStats = jest.fn().mockImplementation(() => {
                throw new Error('Statistics error');
            });
            cacheManager.getStats();
            expect(consoleSpy).toHaveBeenCalledWith('Error getting cache statistics:', expect.any(Error));
        });

        it('should handle hit rate calculation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.calculateHitRate = jest.fn().mockImplementation(() => {
                throw new Error('Hit rate calculation error');
            });
            cacheManager.calculateHitRate();
            expect(consoleSpy).toHaveBeenCalledWith('Error calculating hit rate:', expect.any(Error));
        });

        it('should handle memory usage errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.getMemoryUsage = jest.fn().mockImplementation(() => {
                throw new Error('Memory usage error');
            });
            cacheManager.getMemoryUsage();
            expect(consoleSpy).toHaveBeenCalledWith('Error getting memory usage:', expect.any(Error));
        });
    });

    describe('Cache Middleware', () => {
        it('should handle invalid middleware', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.addMiddleware(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid middleware provided');
        });

        it('should handle middleware errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const middleware = jest.fn().mockImplementation(() => {
                throw new Error('Middleware error');
            });
            cacheManager.addMiddleware(middleware);
            cacheManager.applyMiddleware({});
            expect(consoleSpy).toHaveBeenCalledWith('Error in cache middleware:', expect.any(Error));
        });

        it('should handle middleware chain errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.applyMiddleware = jest.fn().mockImplementation(() => {
                throw new Error('Middleware chain error');
            });
            cacheManager.applyMiddleware({});
            expect(consoleSpy).toHaveBeenCalledWith('Error in middleware chain:', expect.any(Error));
        });
    });

    describe('Cache Analytics', () => {
        it('should handle invalid analytics data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.trackCache(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid analytics data provided');
        });

        it('should handle analytics errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.trackCache = jest.fn().mockImplementation(() => {
                throw new Error('Analytics error');
            });
            cacheManager.trackCache({});
            expect(consoleSpy).toHaveBeenCalledWith('Error tracking cache:', expect.any(Error));
        });

        it('should handle analytics report generation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.generateReport = jest.fn().mockImplementation(() => {
                throw new Error('Report generation error');
            });
            cacheManager.generateReport({});
            expect(consoleSpy).toHaveBeenCalledWith('Error generating analytics report:', expect.any(Error));
        });
    });

    describe('Cache Monitoring', () => {
        it('should handle invalid monitoring config', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.startMonitoring(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid monitoring configuration provided');
        });

        it('should handle monitoring errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.startMonitoring = jest.fn().mockImplementation(() => {
                throw new Error('Monitoring error');
            });
            cacheManager.startMonitoring({});
            expect(consoleSpy).toHaveBeenCalledWith('Error starting cache monitoring:', expect.any(Error));
        });

        it('should handle monitoring alert errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.sendAlert = jest.fn().mockImplementation(() => {
                throw new Error('Alert error');
            });
            cacheManager.sendAlert({});
            expect(consoleSpy).toHaveBeenCalledWith('Error sending monitoring alert:', expect.any(Error));
        });
    });

    describe('Cache Limits', () => {
        it('should handle invalid size limit', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.setSizeLimit(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid size limit provided');
        });

        it('should handle size limit errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.setSizeLimit = jest.fn().mockImplementation(() => {
                throw new Error('Size limit error');
            });
            cacheManager.setSizeLimit(1000);
            expect(consoleSpy).toHaveBeenCalledWith('Error setting cache size limit:', expect.any(Error));
        });

        it('should handle size limit exceeded', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            cacheManager.maxSize = 2;
            cacheManager.set('key1', 'value1');
            cacheManager.set('key2', 'value2');
            cacheManager.set('key3', 'value3');
            expect(consoleSpy).toHaveBeenCalledWith('Cache size limit exceeded');
        });
    });

    describe('Cache Events', () => {
        it('should handle invalid event name', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.on(null, () => {});
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event name provided');
        });

        it('should handle invalid event handler', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.on('event', null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event handler provided');
        });

        it('should handle event emission errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            cacheManager.emit = jest.fn().mockImplementation(() => {
                throw new Error('Event emission error');
            });
            cacheManager.emit('event', {});
            expect(consoleSpy).toHaveBeenCalledWith('Error emitting event:', expect.any(Error));
        });
    });
}); 