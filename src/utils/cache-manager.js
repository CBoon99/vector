class CacheManager {
    constructor() {
        this.cache = new Map();
        this.ttls = new Map();
        this.events = new Map();
        this.config = {
            maxSize: Infinity,
            defaultTTL: 0,
            persistenceEnabled: false,
            persistencePath: null
        };
    }

    set(key, value) {
        try {
            if (key == null) {
                console.error('Invalid cache key provided');
                return;
            }
            if (value == null) {
                console.error('Invalid cache value provided');
                return;
            }

            if (this.cache.size >= this.config.maxSize) {
                console.warn('Cache size limit exceeded');
                this.evictOldest();
            }

            this.cache.set(key, value);
            if (this.config.defaultTTL > 0) {
                this.ttls.set(key, Date.now() + this.config.defaultTTL);
            }
            this.emit('set', { key, value });
        } catch (error) {
            console.error('Error setting cache:', error);
        }
    }

    get(key) {
        try {
            if (key == null) {
                console.error('Invalid cache key provided');
                return null;
            }

            if (this.isExpired(key)) {
                this.delete(key);
                return null;
            }

            const value = this.cache.get(key);
            this.emit('get', { key, value });
            return value;
        } catch (error) {
            console.error('Error getting cache:', error);
            return null;
        }
    }

    delete(key) {
        try {
            if (key == null) {
                console.error('Invalid cache key provided');
                return;
            }

            this.cache.delete(key);
            this.ttls.delete(key);
            this.emit('delete', { key });
        } catch (error) {
            console.error('Error deleting cache:', error);
        }
    }

    clear() {
        try {
            this.cache.clear();
            this.ttls.clear();
            this.emit('clear');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    configure(config) {
        try {
            if (config == null) {
                console.error('Invalid cache configuration provided');
                return;
            }

            this.config = { ...this.config, ...config };
            this.emit('configure', { config: this.config });
        } catch (error) {
            console.error('Error configuring cache:', error);
        }
    }

    setTTL(key, ttl) {
        try {
            if (ttl == null) {
                console.error('Invalid TTL provided');
                return;
            }

            if (this.cache.has(key)) {
                this.ttls.set(key, Date.now() + ttl);
                this.emit('ttl', { key, ttl });
            }
        } catch (error) {
            console.error('Error setting TTL:', error);
        }
    }

    persist(config) {
        try {
            if (config == null) {
                console.error('Invalid persistence configuration provided');
                return;
            }

            if (this.cache.size === 0) {
                console.warn('No cache entries to persist');
                return;
            }

            const data = {
                cache: Array.from(this.cache.entries()),
                ttls: Array.from(this.ttls.entries()),
                config: this.config
            };

            if (typeof window !== 'undefined') {
                localStorage.setItem('cache', JSON.stringify(data));
            } else {
                const fs = require('fs');
                fs.writeFileSync(config.path || 'cache.json', JSON.stringify(data));
            }

            this.emit('persist', { data });
        } catch (error) {
            console.error('Error persisting cache:', error);
        }
    }

    restore() {
        try {
            let data;

            if (typeof window !== 'undefined') {
                data = JSON.parse(localStorage.getItem('cache'));
            } else {
                const fs = require('fs');
                data = JSON.parse(fs.readFileSync(this.config.persistencePath || 'cache.json'));
            }

            if (data) {
                this.cache = new Map(data.cache);
                this.ttls = new Map(data.ttls);
                this.config = data.config;
                this.emit('restore', { data });
            }
        } catch (error) {
            console.error('Error restoring cache:', error);
        }
    }

    on(event, handler) {
        try {
            if (event == null) {
                console.error('Invalid event name provided');
                return;
            }
            if (handler == null) {
                console.error('Invalid event handler provided');
                return;
            }

            if (!this.events.has(event)) {
                this.events.set(event, new Set());
            }
            this.events.get(event).add(handler);
        } catch (error) {
            console.error('Error adding event handler:', error);
        }
    }

    emit(event, data) {
        try {
            if (this.events.has(event)) {
                for (const handler of this.events.get(event)) {
                    handler(data);
                }
            }
        } catch (error) {
            console.error('Error emitting event:', error);
        }
    }

    isExpired(key) {
        try {
            const ttl = this.ttls.get(key);
            return ttl && ttl < Date.now();
        } catch (error) {
            console.error('Error checking expiration:', error);
            return true;
        }
    }

    evictOldest() {
        try {
            const oldestKey = Array.from(this.cache.keys())[0];
            if (oldestKey) {
                this.delete(oldestKey);
            }
        } catch (error) {
            console.error('Error evicting cache entry:', error);
        }
    }

    size() {
        return this.cache.size;
    }

    has(key) {
        return this.cache.has(key) && !this.isExpired(key);
    }

    keys() {
        return Array.from(this.cache.keys());
    }

    values() {
        return Array.from(this.cache.values());
    }

    entries() {
        return Array.from(this.cache.entries());
    }
}

export default CacheManager; 