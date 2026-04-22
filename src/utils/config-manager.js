class ConfigManager {
    constructor() {
        this.config = {};
        this.events = new Map();
        this.schema = null;
        this.environment = process.env.NODE_ENV || 'development';
        this.secrets = new Map();
    }

    set(key, value) {
        try {
            if (key == null) {
                console.error('Invalid config key provided');
                return;
            }
            if (value == null) {
                console.error('Invalid config value provided');
                return;
            }

            const path = key.split('.');
            let current = this.config;

            for (let i = 0; i < path.length - 1; i++) {
                if (!current[path[i]]) {
                    current[path[i]] = {};
                }
                current = current[path[i]];
            }

            current[path[path.length - 1]] = value;
            this.emit('set', { key, value });
        } catch (error) {
            console.error('Error setting config:', error);
        }
    }

    get(key) {
        try {
            if (key == null) {
                console.error('Invalid config key provided');
                return null;
            }

            const path = key.split('.');
            let current = this.config;

            for (const segment of path) {
                if (!current || !current.hasOwnProperty(segment)) {
                    return null;
                }
                current = current[segment];
            }

            return current;
        } catch (error) {
            console.error('Error getting config:', error);
            return null;
        }
    }

    delete(key) {
        try {
            if (key == null) {
                console.error('Invalid config key provided');
                return;
            }

            const path = key.split('.');
            let current = this.config;

            for (let i = 0; i < path.length - 1; i++) {
                if (!current || !current.hasOwnProperty(path[i])) {
                    return;
                }
                current = current[path[i]];
            }

            delete current[path[path.length - 1]];
            this.emit('delete', { key });
        } catch (error) {
            console.error('Error deleting config:', error);
        }
    }

    clear() {
        try {
            this.config = {};
            this.emit('clear');
        } catch (error) {
            console.error('Error clearing config:', error);
        }
    }

    load(path) {
        try {
            if (!path) {
                console.error('Invalid config path provided');
                return;
            }

            let data;
            if (typeof window !== 'undefined') {
                data = JSON.parse(localStorage.getItem(path));
            } else {
                const fs = require('fs');
                data = JSON.parse(fs.readFileSync(path));
            }

            if (data) {
                this.config = this.mergeConfig(this.config, data);
                this.emit('load', { path, data });
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    save(path) {
        try {
            if (!path) {
                console.error('Invalid config path provided');
                return;
            }

            const data = JSON.stringify(this.config, null, 2);

            if (typeof window !== 'undefined') {
                localStorage.setItem(path, data);
            } else {
                const fs = require('fs');
                fs.writeFileSync(path, data);
            }

            this.emit('save', { path });
        } catch (error) {
            console.error('Error saving config:', error);
        }
    }

    setSchema(schema) {
        try {
            if (!schema) {
                console.error('Invalid schema provided');
                return;
            }

            this.schema = schema;
            this.emit('schema', { schema });
        } catch (error) {
            console.error('Error setting schema:', error);
        }
    }

    validate() {
        try {
            if (!this.schema) {
                console.error('No schema defined');
                return false;
            }

            // Simple schema validation
            for (const [key, value] of Object.entries(this.schema)) {
                const configValue = this.get(key);
                if (configValue === null || typeof configValue !== value.type) {
                    console.error(`Invalid config value for ${key}. Expected ${value.type}, got ${typeof configValue}`);
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Error validating config:', error);
            return false;
        }
    }

    setEnvironment(env) {
        try {
            if (!env) {
                console.error('Invalid environment provided');
                return;
            }

            this.environment = env;
            this.emit('environment', { environment: env });
        } catch (error) {
            console.error('Error setting environment:', error);
        }
    }

    setSecret(key, value) {
        try {
            if (!key) {
                console.error('Invalid secret key provided');
                return;
            }

            this.secrets.set(key, this.encrypt(value));
            this.emit('secret', { key });
        } catch (error) {
            console.error('Error setting secret:', error);
        }
    }

    getSecret(key) {
        try {
            if (!key) {
                console.error('Invalid secret key provided');
                return null;
            }

            const secret = this.secrets.get(key);
            return secret ? this.decrypt(secret) : null;
        } catch (error) {
            console.error('Error getting secret:', error);
            return null;
        }
    }

    on(event, handler) {
        try {
            if (!event) {
                console.error('Invalid event name provided');
                return;
            }
            if (!handler) {
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

    mergeConfig(target, source) {
        try {
            for (const [key, value] of Object.entries(source)) {
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    target[key] = this.mergeConfig(target[key] || {}, value);
                } else {
                    target[key] = value;
                }
            }
            return target;
        } catch (error) {
            console.error('Error merging config:', error);
            return target;
        }
    }

    encrypt(value) {
        try {
            // Simple encryption for demonstration
            return Buffer.from(value).toString('base64');
        } catch (error) {
            console.error('Error encrypting value:', error);
            return null;
        }
    }

    decrypt(value) {
        try {
            // Simple decryption for demonstration
            return Buffer.from(value, 'base64').toString();
        } catch (error) {
            console.error('Error decrypting value:', error);
            return null;
        }
    }

    has(key) {
        return this.get(key) !== null;
    }

    keys() {
        return Object.keys(this.config);
    }

    values() {
        return Object.values(this.config);
    }

    entries() {
        return Object.entries(this.config);
    }

    toJSON() {
        return JSON.stringify(this.config, null, 2);
    }
}

export default ConfigManager; 