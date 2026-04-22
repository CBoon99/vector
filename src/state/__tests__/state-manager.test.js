import StateManager from '../state-manager';

describe('StateManager', () => {
    let stateManager;
    let mockHistory;
    let mockState;

    beforeEach(() => {
        mockHistory = [];
        mockState = {
            currentColor: '#000000',
            strokeWidth: 1,
            fillEnabled: false
        };

        stateManager = new StateManager();
        stateManager.history = mockHistory;
        stateManager.state = mockState;
    });

    describe('Error Handling', () => {
        it('should handle invalid state updates', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.setState(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid state provided to setState');
        });

        it('should handle invalid state property updates', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.updateStateProperty('invalidProperty', 'value');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid state property:', 'invalidProperty');
        });

        it('should handle invalid history state', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.loadHistoryState(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid history state provided');
        });

        it('should handle invalid undo operation', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.undo();
            expect(consoleSpy).toHaveBeenCalledWith('No history states available for undo');
        });

        it('should handle invalid redo operation', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.redo();
            expect(consoleSpy).toHaveBeenCalledWith('No future states available for redo');
        });
    });

    describe('State Validation', () => {
        it('should handle invalid color values', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            stateManager.updateStateProperty('currentColor', 'invalid-color');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid color value:', 'invalid-color');
            expect(stateManager.state.currentColor).toBe('#000000');
        });

        it('should handle invalid stroke width values', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            stateManager.updateStateProperty('strokeWidth', -1);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid stroke width value:', -1);
            expect(stateManager.state.strokeWidth).toBe(1);
        });

        it('should handle invalid fill enabled values', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            stateManager.updateStateProperty('fillEnabled', 'invalid');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid fill enabled value:', 'invalid');
            expect(stateManager.state.fillEnabled).toBe(false);
        });
    });

    describe('History Management', () => {
        it('should handle history limit exceeded', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            stateManager.maxHistorySize = 2;
            
            stateManager.saveHistory();
            stateManager.saveHistory();
            stateManager.saveHistory();
            
            expect(consoleSpy).toHaveBeenCalledWith('History limit exceeded, removing oldest state');
            expect(stateManager.history.length).toBe(2);
        });

        it('should handle invalid history state format', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.history.push({ invalid: 'format' });
            stateManager.loadHistoryState(0);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid history state format');
        });

        it('should handle history state loading errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.history.push({
                state: {
                    currentColor: 'invalid-color',
                    strokeWidth: -1,
                    fillEnabled: 'invalid'
                }
            });
            
            stateManager.loadHistoryState(0);
            
            expect(consoleSpy).toHaveBeenCalledWith('Error loading history state:', expect.any(Error));
        });
    });

    describe('State Persistence', () => {
        it('should handle invalid state serialization', () => {
            const circularRef = {};
            circularRef.self = circularRef;
            stateManager.state = circularRef;
            
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.saveToLocalStorage();
            
            expect(consoleSpy).toHaveBeenCalledWith('Error serializing state:', expect.any(Error));
        });

        it('should handle invalid state deserialization', () => {
            localStorage.setItem('appState', 'invalid-json');
            
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.loadFromLocalStorage();
            
            expect(consoleSpy).toHaveBeenCalledWith('Error deserializing state:', expect.any(Error));
        });

        it('should handle missing localStorage', () => {
            const originalLocalStorage = window.localStorage;
            delete window.localStorage;
            
            const consoleSpy = jest.spyOn(console, 'warn');
            stateManager.saveToLocalStorage();
            
            expect(consoleSpy).toHaveBeenCalledWith('localStorage is not available');
            
            window.localStorage = originalLocalStorage;
        });
    });

    describe('State Events', () => {
        it('should handle invalid event listeners', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.on('invalid-event', () => {});
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event type: invalid-event');
        });

        it('should handle invalid event handler', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.on('state-changed', null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event handler');
        });

        it('should handle event handler errors', () => {
            const errorHandler = jest.fn().mockImplementation(() => {
                throw new Error('Handler error');
            });
            
            stateManager.on('state-changed', errorHandler);
            
            const consoleSpy = jest.spyOn(console, 'error');
            stateManager.setState({ currentColor: '#ff0000' });
            
            expect(consoleSpy).toHaveBeenCalledWith('Error in event handler:', expect.any(Error));
        });
    });

    describe('State Validation Rules', () => {
        it('should validate color format', () => {
            const validColors = ['#000000', '#fff', 'rgb(0,0,0)', 'rgba(0,0,0,1)'];
            const invalidColors = ['invalid', '#ggg', 'rgb(0,0)', 'rgba(0,0,0)'];
            
            validColors.forEach(color => {
                stateManager.updateStateProperty('currentColor', color);
                expect(stateManager.state.currentColor).toBe(color);
            });
            
            invalidColors.forEach(color => {
                stateManager.updateStateProperty('currentColor', color);
                expect(stateManager.state.currentColor).toBe('#000000');
            });
        });

        it('should validate stroke width range', () => {
            const validWidths = [0.5, 1, 10, 100];
            const invalidWidths = [-1, 0, 101, 'invalid'];
            
            validWidths.forEach(width => {
                stateManager.updateStateProperty('strokeWidth', width);
                expect(stateManager.state.strokeWidth).toBe(width);
            });
            
            invalidWidths.forEach(width => {
                stateManager.updateStateProperty('strokeWidth', width);
                expect(stateManager.state.strokeWidth).toBe(1);
            });
        });

        it('should validate boolean properties', () => {
            const validValues = [true, false];
            const invalidValues = ['true', 'false', 1, 0, null, undefined];
            
            validValues.forEach(value => {
                stateManager.updateStateProperty('fillEnabled', value);
                expect(stateManager.state.fillEnabled).toBe(value);
            });
            
            invalidValues.forEach(value => {
                stateManager.updateStateProperty('fillEnabled', value);
                expect(stateManager.state.fillEnabled).toBe(false);
            });
        });
    });
}); 