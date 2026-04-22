import EventManager from '../event-manager';

describe('EventManager', () => {
    let eventManager;
    let mockHandler;

    beforeEach(() => {
        eventManager = new EventManager();
        mockHandler = jest.fn();
    });

    describe('Error Handling', () => {
        it('should handle invalid event name', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.emit(null, {});
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event name provided');
        });

        it('should handle invalid event data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.emit('event', null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event data provided');
        });

        it('should handle event emission errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.emit = jest.fn().mockImplementation(() => {
                throw new Error('Event emission error');
            });
            eventManager.emit('event', {});
            expect(consoleSpy).toHaveBeenCalledWith('Error emitting event:', expect.any(Error));
        });

        it('should handle event listener errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const listener = jest.fn().mockImplementation(() => {
                throw new Error('Listener error');
            });
            eventManager.on('event', listener);
            eventManager.emit('event', {});
            expect(consoleSpy).toHaveBeenCalledWith('Error in event listener:', expect.any(Error));
        });

        it('should handle invalid event types', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.on(null, mockHandler);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event type provided');
        });

        it('should handle invalid event handlers', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.on('test-event', null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event handler provided');
        });

        it('should handle handler errors', () => {
            const errorHandler = jest.fn().mockImplementation(() => {
                throw new Error('Handler error');
            });
            
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.on('test-event', errorHandler);
            eventManager.emit('test-event', { data: 'test' });
            
            expect(consoleSpy).toHaveBeenCalledWith('Error in event handler:', expect.any(Error));
        });
    });

    describe('Event Registration', () => {
        it('should handle invalid event listener', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.on('event', null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event listener provided');
        });

        it('should handle registration errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.on = jest.fn().mockImplementation(() => {
                throw new Error('Registration error');
            });
            eventManager.on('event', () => {});
            expect(consoleSpy).toHaveBeenCalledWith('Error registering event listener:', expect.any(Error));
        });

        it('should handle unregistration errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.off = jest.fn().mockImplementation(() => {
                throw new Error('Unregistration error');
            });
            eventManager.off('event', () => {});
            expect(consoleSpy).toHaveBeenCalledWith('Error unregistering event listener:', expect.any(Error));
        });

        it('should handle duplicate event handlers', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            eventManager.on('test-event', mockHandler);
            eventManager.on('test-event', mockHandler);
            expect(consoleSpy).toHaveBeenCalledWith('Duplicate event handler registered');
        });

        it('should handle maximum handlers limit', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            eventManager.maxHandlersPerEvent = 2;
            
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            const handler3 = jest.fn();
            
            eventManager.on('test-event', handler1);
            eventManager.on('test-event', handler2);
            eventManager.on('test-event', handler3);
            
            expect(consoleSpy).toHaveBeenCalledWith('Maximum handlers limit reached for event: test-event');
            expect(eventManager.getHandlerCount('test-event')).toBe(2);
        });

        it('should handle invalid handler removal', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.off('test-event', mockHandler);
            expect(consoleSpy).toHaveBeenCalledWith('Handler not found for event: test-event');
        });
    });

    describe('Event Emission', () => {
        it('should handle unregistered events', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            eventManager.emit('unregistered-event', { data: 'test' });
            expect(consoleSpy).toHaveBeenCalledWith('No handlers registered for event: unregistered-event');
        });

        it('should handle async handler errors', async () => {
            const asyncHandler = jest.fn().mockRejectedValue(new Error('Async error'));
            
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.on('test-event', asyncHandler);
            await eventManager.emit('test-event', { data: 'test' });
            
            expect(consoleSpy).toHaveBeenCalledWith('Error in async event handler:', expect.any(Error));
        });

        it('should handle handler timeout', async () => {
            const slowHandler = jest.fn().mockImplementation(() => {
                return new Promise(resolve => setTimeout(resolve, 1000));
            });
            
            const consoleSpy = jest.spyOn(console, 'warn');
            eventManager.handlerTimeout = 100;
            eventManager.on('test-event', slowHandler);
            await eventManager.emit('test-event', { data: 'test' });
            
            expect(consoleSpy).toHaveBeenCalledWith('Event handler timeout for event: test-event');
        });
    });

    describe('Event Validation', () => {
        it('should validate event types', () => {
            const validTypes = ['click', 'change', 'submit', 'custom'];
            const invalidTypes = ['', null, undefined, 123];
            
            validTypes.forEach(type => {
                expect(eventManager.validateEventType(type)).toBe(true);
            });
            
            invalidTypes.forEach(type => {
                expect(eventManager.validateEventType(type)).toBe(false);
            });
        });

        it('should validate event data', () => {
            const validData = [{}, { key: 'value' }, []];
            const invalidData = [null, undefined, 123, 'string'];
            
            validData.forEach(data => {
                expect(eventManager.validateEventData(data)).toBe(true);
            });
            
            invalidData.forEach(data => {
                expect(eventManager.validateEventData(data)).toBe(false);
            });
        });

        it('should validate event handlers', () => {
            const validHandlers = [() => {}, async () => {}, function() {}];
            const invalidHandlers = [null, undefined, 123, 'string', {}];
            
            validHandlers.forEach(handler => {
                expect(eventManager.validateEventHandler(handler)).toBe(true);
            });
            
            invalidHandlers.forEach(handler => {
                expect(eventManager.validateEventHandler(handler)).toBe(false);
            });
        });

        it('should handle invalid event schema', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.validateEvent(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event schema provided');
        });

        it('should handle schema validation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.validateEvent = jest.fn().mockImplementation(() => {
                throw new Error('Schema validation error');
            });
            eventManager.validateEvent({});
            expect(consoleSpy).toHaveBeenCalledWith('Error validating event:', expect.any(Error));
        });

        it('should handle invalid event types', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.emit('event', undefined);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event data type');
        });
    });

    describe('Event Cleanup', () => {
        it('should handle invalid cleanup criteria', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.cleanupEvents(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid cleanup criteria provided');
        });

        it('should handle cleanup errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.cleanupEvents = jest.fn().mockImplementation(() => {
                throw new Error('Cleanup error');
            });
            
            eventManager.cleanupEvents({ age: '1d' });
            expect(consoleSpy).toHaveBeenCalledWith('Error during event cleanup:', expect.any(Error));
        });

        it('should handle partial cleanup', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            
            eventManager.on('event1', handler1);
            eventManager.on('event2', handler2);
            
            eventManager.cleanupEvents({ type: 'event1' });
            expect(eventManager.getHandlerCount('event1')).toBe(0);
            expect(eventManager.getHandlerCount('event2')).toBe(1);
        });
    });

    describe('Event Monitoring', () => {
        it('should handle invalid monitoring config', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.startMonitoring(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid monitoring configuration provided');
        });

        it('should handle monitoring errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.startMonitoring = jest.fn().mockImplementation(() => {
                throw new Error('Monitoring error');
            });
            eventManager.startMonitoring({});
            expect(consoleSpy).toHaveBeenCalledWith('Error starting event monitoring:', expect.any(Error));
        });

        it('should handle monitoring alert errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.sendAlert = jest.fn().mockImplementation(() => {
                throw new Error('Alert error');
            });
            eventManager.sendAlert({});
            expect(consoleSpy).toHaveBeenCalledWith('Error sending monitoring alert:', expect.any(Error));
        });

        it('should handle monitoring timeout', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            eventManager.monitoringTimeout = 100;
            
            eventManager.startMonitoring({ type: 'test-event' });
            setTimeout(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Event monitoring timeout for event: test-event');
            }, 200);
        });
    });

    describe('Event Queue', () => {
        it('should handle invalid queue item', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.addToQueue(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid queue item provided');
        });

        it('should handle queue errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.processQueue = jest.fn().mockImplementation(() => {
                throw new Error('Queue error');
            });
            eventManager.processQueue();
            expect(consoleSpy).toHaveBeenCalledWith('Error processing event queue:', expect.any(Error));
        });

        it('should handle queue overflow', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            eventManager.maxQueueSize = 2;
            eventManager.addToQueue({});
            eventManager.addToQueue({});
            eventManager.addToQueue({});
            expect(consoleSpy).toHaveBeenCalledWith('Event queue overflow');
        });
    });

    describe('Event History', () => {
        it('should handle invalid history entry', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.addToHistory(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid history entry provided');
        });

        it('should handle history errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.addToHistory = jest.fn().mockImplementation(() => {
                throw new Error('History error');
            });
            eventManager.addToHistory({});
            expect(consoleSpy).toHaveBeenCalledWith('Error adding to event history:', expect.any(Error));
        });

        it('should handle history limit exceeded', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            eventManager.maxHistorySize = 2;
            eventManager.addToHistory({});
            eventManager.addToHistory({});
            eventManager.addToHistory({});
            expect(consoleSpy).toHaveBeenCalledWith('Event history limit exceeded');
        });
    });

    describe('Event Middleware', () => {
        it('should handle invalid middleware', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.addMiddleware(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid middleware provided');
        });

        it('should handle middleware errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const middleware = jest.fn().mockImplementation(() => {
                throw new Error('Middleware error');
            });
            eventManager.addMiddleware(middleware);
            eventManager.applyMiddleware({});
            expect(consoleSpy).toHaveBeenCalledWith('Error in event middleware:', expect.any(Error));
        });

        it('should handle middleware chain errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.applyMiddleware = jest.fn().mockImplementation(() => {
                throw new Error('Middleware chain error');
            });
            eventManager.applyMiddleware({});
            expect(consoleSpy).toHaveBeenCalledWith('Error in middleware chain:', expect.any(Error));
        });
    });

    describe('Event Analytics', () => {
        it('should handle invalid analytics data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.trackEvent(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid analytics data provided');
        });

        it('should handle analytics errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.trackEvent = jest.fn().mockImplementation(() => {
                throw new Error('Analytics error');
            });
            eventManager.trackEvent({});
            expect(consoleSpy).toHaveBeenCalledWith('Error tracking event:', expect.any(Error));
        });

        it('should handle analytics report generation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            eventManager.generateReport = jest.fn().mockImplementation(() => {
                throw new Error('Report generation error');
            });
            eventManager.generateReport({});
            expect(consoleSpy).toHaveBeenCalledWith('Error generating analytics report:', expect.any(Error));
        });
    });
}); 