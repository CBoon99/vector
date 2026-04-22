class Logger {
    constructor() {
        this.logs = [];
        this.events = new Map();
        this.config = {
            level: 'info',
            maxLogs: 1000,
            persistenceEnabled: false,
            persistencePath: null,
            format: 'json'
        };
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    log(level, message, meta = {}) {
        try {
            if (level == null) {
                console.error('Invalid log level provided');
                return;
            }
            if (message == null) {
                console.error('Invalid log message provided');
                return;
            }

            if (!this.levels.hasOwnProperty(level)) {
                console.error('Invalid log level:', level);
                return;
            }

            if (this.levels[level] > this.levels[this.config.level]) {
                return;
            }

            const logEntry = {
                timestamp: new Date().toISOString(),
                level,
                message,
                meta
            };

            this.logs.push(logEntry);
            this.emit('log', logEntry);

            if (this.logs.length > this.config.maxLogs) {
                this.logs.shift();
                this.emit('truncate');
            }

            if (this.config.persistenceEnabled) {
                this.persist();
            }

            console[level](this.formatLog(logEntry));
        } catch (error) {
            console.error('Error logging message:', error);
        }
    }

    error(message, meta = {}) {
        this.log('error', message, meta);
    }

    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    configure(config) {
        try {
            if (config == null) {
                console.error('Invalid logger configuration provided');
                return;
            }

            this.config = { ...this.config, ...config };
            this.emit('configure', { config: this.config });
        } catch (error) {
            console.error('Error configuring logger:', error);
        }
    }

    clear() {
        try {
            this.logs = [];
            this.emit('clear');
        } catch (error) {
            console.error('Error clearing logs:', error);
        }
    }

    persist() {
        try {
            if (this.logs.length === 0) {
                console.warn('No logs to persist');
                return;
            }

            const data = {
                logs: this.logs,
                config: this.config
            };

            if (typeof window !== 'undefined') {
                localStorage.setItem('logs', JSON.stringify(data));
            } else {
                const fs = require('fs');
                fs.writeFileSync(this.config.persistencePath || 'logs.json', JSON.stringify(data));
            }

            this.emit('persist', { data });
        } catch (error) {
            console.error('Error persisting logs:', error);
        }
    }

    restore() {
        try {
            let data;

            if (typeof window !== 'undefined') {
                data = JSON.parse(localStorage.getItem('logs'));
            } else {
                const fs = require('fs');
                data = JSON.parse(fs.readFileSync(this.config.persistencePath || 'logs.json'));
            }

            if (data) {
                this.logs = data.logs;
                this.config = data.config;
                this.emit('restore', { data });
            }
        } catch (error) {
            console.error('Error restoring logs:', error);
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

    formatLog(logEntry) {
        try {
            switch (this.config.format) {
                case 'json':
                    return JSON.stringify(logEntry);
                case 'text':
                    return `[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`;
                case 'pretty':
                    return `${logEntry.timestamp} - ${logEntry.level.toUpperCase()} - ${logEntry.message}\n${JSON.stringify(logEntry.meta, null, 2)}`;
                default:
                    console.error('Invalid log format:', this.config.format);
                    return JSON.stringify(logEntry);
            }
        } catch (error) {
            console.error('Error formatting log:', error);
            return JSON.stringify(logEntry);
        }
    }

    getLogsByLevel(level) {
        try {
            if (!this.levels.hasOwnProperty(level)) {
                console.error('Invalid log level:', level);
                return [];
            }
            return this.logs.filter(log => log.level === level);
        } catch (error) {
            console.error('Error getting logs by level:', error);
            return [];
        }
    }

    getLogsByTimeRange(startTime, endTime) {
        try {
            if (!startTime || !endTime) {
                console.error('Invalid time range provided');
                return [];
            }
            return this.logs.filter(log => {
                const timestamp = new Date(log.timestamp);
                return timestamp >= startTime && timestamp <= endTime;
            });
        } catch (error) {
            console.error('Error getting logs by time range:', error);
            return [];
        }
    }

    search(query) {
        try {
            if (!query) {
                console.error('Invalid search query provided');
                return [];
            }
            return this.logs.filter(log =>
                log.message.toLowerCase().includes(query.toLowerCase()) ||
                JSON.stringify(log.meta).toLowerCase().includes(query.toLowerCase())
            );
        } catch (error) {
            console.error('Error searching logs:', error);
            return [];
        }
    }

    count() {
        return this.logs.length;
    }

    getLevels() {
        return Object.keys(this.levels);
    }

    getCurrentLevel() {
        return this.config.level;
    }
}

export default Logger; 