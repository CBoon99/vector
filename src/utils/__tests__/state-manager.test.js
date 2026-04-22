import StateManager from '../state-manager';

describe('StateManager', () => {
    let stateManager;

    beforeEach(() => {
        stateManager = new StateManager();
    });

    describe('Error Handling', () => {
        it('should handle invalid state key', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.setState(null, 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid state key provided');
        });

        it('should handle invalid state value', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.setState('key', null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid state value provided');
        });

        it('should handle state update errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.setState = jest.fn().mockImplementation(() => {
                throw new Error('State update error');
            });
            stateManager.setState('key', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Error updating state:', expect.any(Error));
        });

        it('should handle state retrieval errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.getState = jest.fn().mockImplementation(() => {
                throw new Error('State retrieval error');
            });
            stateManager.getState('key');
            expect(consoleSpy).toHaveBeenCalledWith('Error retrieving state:', expect.any(Error));
        });
    });

    describe('State Validation', () => {
        it('should handle invalid state schema', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.validateState(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid state schema provided');
        });

        it('should handle schema validation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.validateState = jest.fn().mockImplementation(() => {
                throw new Error('Schema validation error');
            });
            stateManager.validateState({});
            expect(consoleSpy).toHaveBeenCalledWith('Error validating state:', expect.any(Error));
        });

        it('should handle invalid state types', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.setState('key', undefined);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid state value type');
        });
    });

    describe('State Subscriptions', () => {
        it('should handle invalid subscriber', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.subscribe(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid subscriber provided');
        });

        it('should handle subscription errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.subscribe = jest.fn().mockImplementation(() => {
                throw new Error('Subscription error');
            });
            stateManager.subscribe(() => {});
            expect(consoleSpy).toHaveBeenCalledWith('Error subscribing to state:', expect.any(Error));
        });

        it('should handle unsubscription errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.unsubscribe = jest.fn().mockImplementation(() => {
                throw new Error('Unsubscription error');
            });
            stateManager.unsubscribe(() => {});
            expect(consoleSpy).toHaveBeenCalledWith('Error unsubscribing from state:', expect.any(Error));
        });
    });

    describe('State History', () => {
        it('should handle invalid history entry', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.addToHistory(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid history entry provided');
        });

        it('should handle history errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.addToHistory = jest.fn().mockImplementation(() => {
                throw new Error('History error');
            });
            stateManager.addToHistory({});
            expect(consoleSpy).toHaveBeenCalledWith('Error adding to state history:', expect.any(Error));
        });

        it('should handle history limit exceeded', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            stateManager.maxHistorySize = 2;
            stateManager.addToHistory({});
            stateManager.addToHistory({});
            stateManager.addToHistory({});
            expect(consoleSpy).toHaveBeenCalledWith('State history limit exceeded');
        });
    });

    describe('State Persistence', () => {
        it('should handle invalid persistence key', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.persistState(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid persistence key provided');
        });

        it('should handle persistence errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.persistState = jest.fn().mockImplementation(() => {
                throw new Error('Persistence error');
            });
            stateManager.persistState('key');
            expect(consoleSpy).toHaveBeenCalledWith('Error persisting state:', expect.any(Error));
        });

        it('should handle restoration errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.restoreState = jest.fn().mockImplementation(() => {
                throw new Error('Restoration error');
            });
            stateManager.restoreState('key');
            expect(consoleSpy).toHaveBeenCalledWith('Error restoring state:', expect.any(Error));
        });
    });

    describe('State Middleware', () => {
        it('should handle invalid middleware', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.addMiddleware(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid middleware provided');
        });

        it('should handle middleware errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const middleware = jest.fn().mockImplementation(() => {
                throw new Error('Middleware error');
            });
            stateManager.addMiddleware(middleware);
            stateManager.applyMiddleware({});
            expect(consoleSpy).toHaveBeenCalledWith('Error in state middleware:', expect.any(Error));
        });

        it('should handle middleware chain errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.applyMiddleware = jest.fn().mockImplementation(() => {
                throw new Error('Middleware chain error');
            });
            stateManager.applyMiddleware({});
            expect(consoleSpy).toHaveBeenCalledWith('Error in middleware chain:', expect.any(Error));
        });
    });

    describe('State Analytics', () => {
        it('should handle invalid analytics data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.trackState(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid analytics data provided');
        });

        it('should handle analytics errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.trackState = jest.fn().mockImplementation(() => {
                throw new Error('Analytics error');
            });
            stateManager.trackState({});
            expect(consoleSpy).toHaveBeenCalledWith('Error tracking state:', expect.any(Error));
        });

        it('should handle analytics report generation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.generateReport = jest.fn().mockImplementation(() => {
                throw new Error('Report generation error');
            });
            stateManager.generateReport({});
            expect(consoleSpy).toHaveBeenCalledWith('Error generating analytics report:', expect.any(Error));
        });
    });

    describe('State Monitoring', () => {
        it('should handle invalid monitoring config', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.startMonitoring(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid monitoring configuration provided');
        });

        it('should handle monitoring errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.startMonitoring = jest.fn().mockImplementation(() => {
                throw new Error('Monitoring error');
            });
            stateManager.startMonitoring({});
            expect(consoleSpy).toHaveBeenCalledWith('Error starting state monitoring:', expect.any(Error));
        });

        it('should handle monitoring alert errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.sendAlert = jest.fn().mockImplementation(() => {
                throw new Error('Alert error');
            });
            stateManager.sendAlert({});
            expect(consoleSpy).toHaveBeenCalledWith('Error sending monitoring alert:', expect.any(Error));
        });
    });
}); 