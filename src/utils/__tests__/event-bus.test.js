import EventBus from '../event-bus';

describe('EventBus', () => {
    let eventBus;

    beforeEach(() => {
        eventBus = new EventBus();
    });

    describe('Error Handling', () => {
        it('should handle invalid event names', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventBus.on(null, () => {});
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event name provided');
        });

        it('should handle invalid event handlers', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventBus.on('test', null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event handler provided');
        });

        it('should handle handler execution errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const errorHandler = jest.fn().mockImplementation(() => {
                throw new Error('Handler error');
            });
            
            eventBus.on('test', errorHandler);
            eventBus.emit('test');
            
            expect(consoleSpy).toHaveBeenCalledWith('Error executing event handler:', expect.any(Error));
        });

        it('should handle multiple handler errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const errorHandler1 = jest.fn().mockImplementation(() => {
                throw new Error('Handler 1 error');
            });
            const errorHandler2 = jest.fn().mockImplementation(() => {
                throw new Error('Handler 2 error');
            });
            
            eventBus.on('test', errorHandler1);
            eventBus.on('test', errorHandler2);
            eventBus.emit('test');
            
            expect(consoleSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('Event Registration', () => {
        it('should handle duplicate event registrations', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            const handler = () => {};
            
            eventBus.on('test', handler);
            eventBus.on('test', handler);
            
            expect(consoleSpy).toHaveBeenCalledWith('Handler already registered for event:', 'test');
        });

        it('should handle maximum handler limit', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            eventBus.maxHandlers = 2;
            
            eventBus.on('test', () => {});
            eventBus.on('test', () => {});
            eventBus.on('test', () => {});
            
            expect(consoleSpy).toHaveBeenCalledWith('Maximum number of handlers reached for event:', 'test');
        });

        it('should handle invalid handler options', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventBus.on('test', () => {}, { invalid: true });
            expect(consoleSpy).toHaveBeenCalledWith('Invalid handler options provided');
        });
    });

    describe('Event Emission', () => {
        it('should handle non-existent events', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            eventBus.emit('non-existent');
            expect(consoleSpy).toHaveBeenCalledWith('No handlers registered for event:', 'non-existent');
        });

        it('should handle invalid event data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const handler = jest.fn();
            
            eventBus.on('test', handler);
            eventBus.emit('test', undefined);
            
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event data provided');
        });

        it('should handle circular event data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const handler = jest.fn();
            const circular = {};
            circular.self = circular;
            
            eventBus.on('test', handler);
            eventBus.emit('test', circular);
            
            expect(consoleSpy).toHaveBeenCalledWith('Circular reference detected in event data');
        });
    });

    describe('Event Unsubscription', () => {
        it('should handle non-existent event unsubscription', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            eventBus.off('non-existent', () => {});
            expect(consoleSpy).toHaveBeenCalledWith('No handlers registered for event:', 'non-existent');
        });

        it('should handle non-existent handler unsubscription', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            const handler = () => {};
            
            eventBus.on('test', () => {});
            eventBus.off('test', handler);
            
            expect(consoleSpy).toHaveBeenCalledWith('Handler not found for event:', 'test');
        });

        it('should handle invalid unsubscription criteria', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventBus.off(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid unsubscription criteria provided');
        });
    });

    describe('Event Cleanup', () => {
        it('should handle invalid cleanup criteria', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventBus.cleanup(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid cleanup criteria provided');
        });

        it('should handle cleanup errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventBus.cleanup = jest.fn().mockImplementation(() => {
                throw new Error('Cleanup error');
            });
            eventBus.cleanup({ age: '1d' });
            expect(consoleSpy).toHaveBeenCalledWith('Error during event cleanup:', expect.any(Error));
        });

        it('should handle partial cleanup', () => {
            const handlers = [
                { event: 'test1', handler: () => {}, timestamp: Date.now() - 86400000 },
                { event: 'test2', handler: () => {}, timestamp: Date.now() }
            ];
            
            eventBus.cleanup(handlers, { age: '12h' });
            expect(handlers.length).toBe(1);
            expect(handlers[0].event).toBe('test2');
        });
    });

    describe('Event Statistics', () => {
        it('should handle invalid statistics calculation', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventBus.getStats(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid statistics criteria provided');
        });

        it('should handle statistics calculation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventBus.getStats = jest.fn().mockImplementation(() => {
                throw new Error('Statistics error');
            });
            eventBus.getStats();
            expect(consoleSpy).toHaveBeenCalledWith('Error calculating event statistics:', expect.any(Error));
        });

        it('should handle empty event statistics', () => {
            const stats = eventBus.getStats();
            expect(stats).toEqual({
                totalEvents: 0,
                totalHandlers: 0,
                eventsEmitted: 0,
                handlersExecuted: 0
            });
        });
    });

    describe('Event Persistence', () => {
        it('should handle invalid persistence format', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventBus.persist('invalid-format');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid persistence format:', 'invalid-format');
        });

        it('should handle persistence errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventBus.persist = jest.fn().mockImplementation(() => {
                throw new Error('Persistence error');
            });
            eventBus.persist('json');
            expect(consoleSpy).toHaveBeenCalledWith('Error persisting events:', expect.any(Error));
        });

        it('should handle empty event persistence', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            eventBus.persist('json');
            expect(consoleSpy).toHaveBeenCalledWith('No events to persist');
        });
    });
}); 