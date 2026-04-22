import PolygonTool from '../polygon-tool';

describe('PolygonTool', () => {
    let polygonTool;
    let mockStateManager;
    let mockLayerManager;
    let mockCanvas;
    let mockContext;

    beforeEach(() => {
        mockStateManager = {
            getState: jest.fn().mockReturnValue({ currentColor: '#000000' }),
            saveHistory: jest.fn()
        };

        mockLayerManager = {
            addObject: jest.fn(),
            removeObject: jest.fn()
        };

        mockCanvas = document.createElement('canvas');
        mockContext = {
            save: jest.fn(),
            restore: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            closePath: jest.fn(),
            stroke: jest.fn(),
            fill: jest.fn(),
            setLineDash: jest.fn(),
            clearRect: jest.fn()
        };
        mockCanvas.getContext = jest.fn().mockReturnValue(mockContext);
        mockCanvas.getBoundingClientRect = jest.fn().mockReturnValue({
            left: 0,
            top: 0,
            width: 800,
            height: 600
        });

        polygonTool = new PolygonTool(mockStateManager, mockLayerManager);
    });

    describe('constructor', () => {
        it('should initialize with default options', () => {
            expect(polygonTool.options).toEqual({
                sides: 5,
                radius: 50,
                starRatio: 0.5,
                rotation: 0,
                strokeWidth: 1,
                strokeStyle: 'solid',
                fill: 'transparent',
                isStar: false
            });
        });
    });

    describe('startDrawing', () => {
        it('should initialize currentShape with correct properties', () => {
            const event = { clientX: 100, clientY: 100 };
            polygonTool.startDrawing(event, mockCanvas, mockContext);

            expect(polygonTool.currentShape).toEqual(expect.objectContaining({
                type: 'polygon',
                sides: 5,
                radius: 50,
                starRatio: 0.5,
                rotation: 0,
                stroke: '#000000',
                fill: 'transparent',
                strokeWidth: 1,
                strokeStyle: 'solid',
                isStar: false
            }));
        });
    });

    describe('draw', () => {
        it('should update shape properties during drawing', () => {
            const startEvent = { clientX: 100, clientY: 100 };
            const drawEvent = { clientX: 200, clientY: 200 };

            polygonTool.startDrawing(startEvent, mockCanvas, mockContext);
            polygonTool.draw(drawEvent, mockCanvas, mockContext);

            expect(polygonTool.currentShape.radius).toBeGreaterThan(0);
            expect(polygonTool.currentShape.rotation).toBeDefined();
        });

        it('should not draw if no currentShape exists', () => {
            const drawEvent = { clientX: 200, clientY: 200 };
            polygonTool.draw(drawEvent, mockCanvas, mockContext);
            expect(mockContext.beginPath).not.toHaveBeenCalled();
        });
    });

    describe('stopDrawing', () => {
        it('should add shape to layer manager and save history', () => {
            const event = { clientX: 100, clientY: 100 };
            polygonTool.startDrawing(event, mockCanvas, mockContext);
            polygonTool.stopDrawing(event, mockCanvas, mockContext);

            expect(mockLayerManager.addObject).toHaveBeenCalled();
            expect(mockStateManager.saveHistory).toHaveBeenCalled();
            expect(polygonTool.currentShape).toBeNull();
        });
    });

    describe('setOption', () => {
        it('should validate and set valid options', () => {
            expect(polygonTool.setOption('sides', 6)).toBe(true);
            expect(polygonTool.options.sides).toBe(6);
        });

        it('should clamp sides between 3 and 20', () => {
            polygonTool.setOption('sides', 2);
            expect(polygonTool.options.sides).toBe(3);

            polygonTool.setOption('sides', 21);
            expect(polygonTool.options.sides).toBe(20);
        });

        it('should clamp starRatio between 0.1 and 0.9', () => {
            polygonTool.setOption('starRatio', 0);
            expect(polygonTool.options.starRatio).toBe(0.1);

            polygonTool.setOption('starRatio', 1);
            expect(polygonTool.options.starRatio).toBe(0.9);
        });

        it('should validate strokeStyle values', () => {
            polygonTool.setOption('strokeStyle', 'invalid');
            expect(polygonTool.options.strokeStyle).toBe('solid');
        });
    });

    describe('saveState and loadState', () => {
        it('should save and load state correctly', () => {
            const state = polygonTool.saveState();
            expect(state).toHaveProperty('options');

            polygonTool.options.sides = 8;
            polygonTool.loadState(state);
            expect(polygonTool.options.sides).toBe(5);
        });

        it('should handle invalid state gracefully', () => {
            polygonTool.loadState(null);
            expect(polygonTool.options).toEqual(expect.objectContaining({
                sides: 5,
                radius: 50,
                starRatio: 0.5
            }));
        });
    });

    describe('cancelDrawing', () => {
        it('should clear current shape and remove from layer manager', () => {
            const event = { clientX: 100, clientY: 100 };
            polygonTool.startDrawing(event, mockCanvas, mockContext);
            polygonTool.cancelDrawing();

            expect(polygonTool.currentShape).toBeNull();
            expect(mockLayerManager.removeObject).toHaveBeenCalled();
        });
    });

    describe('getCanvasPoint', () => {
        it('should calculate correct canvas coordinates', () => {
            const event = { clientX: 100, clientY: 100 };
            const point = polygonTool.getCanvasPoint(event, mockCanvas);

            expect(point).toEqual(expect.objectContaining({
                x: expect.any(Number),
                y: expect.any(Number)
            }));
        });

        it('should handle invalid input gracefully', () => {
            const point = polygonTool.getCanvasPoint(null, null);
            expect(point).toEqual({ x: 0, y: 0 });
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid canvas context', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            polygonTool.drawShape(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid canvas context provided to drawShape');
        });

        it('should handle drawing errors gracefully', () => {
            mockContext.beginPath.mockImplementation(() => {
                throw new Error('Drawing error');
            });
            const consoleSpy = jest.spyOn(console, 'error');
            
            polygonTool.drawShape(mockContext);
            
            expect(consoleSpy).toHaveBeenCalledWith('Error drawing shape:', expect.any(Error));
            expect(mockContext.restore).toHaveBeenCalled();
        });

        it('should handle invalid event coordinates', () => {
            const invalidEvent = { clientX: 'invalid', clientY: 'invalid' };
            const point = polygonTool.getCanvasPoint(invalidEvent, mockCanvas);
            
            expect(point).toEqual({ x: 0, y: 0 });
        });

        it('should handle invalid option values', () => {
            // Test negative sides
            polygonTool.setOption('sides', -1);
            expect(polygonTool.options.sides).toBe(3);

            // Test too many sides
            polygonTool.setOption('sides', 21);
            expect(polygonTool.options.sides).toBe(20);

            // Test invalid star ratio
            polygonTool.setOption('starRatio', 2);
            expect(polygonTool.options.starRatio).toBe(0.9);

            // Test invalid stroke style
            polygonTool.setOption('strokeStyle', 'invalid');
            expect(polygonTool.options.strokeStyle).toBe('solid');
        });

        it('should handle invalid state loading', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            polygonTool.loadState(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid state provided to loadState');
        });

        it('should handle state loading errors', () => {
            const invalidState = {
                options: {
                    sides: 'invalid',
                    starRatio: 'invalid',
                    strokeStyle: 'invalid'
                }
            };
            
            polygonTool.loadState(invalidState);
            
            expect(polygonTool.options.sides).toBe(5);
            expect(polygonTool.options.starRatio).toBe(0.5);
            expect(polygonTool.options.strokeStyle).toBe('solid');
        });
    });

    describe('Drawing Operations', () => {
        it('should handle drawing without current shape', () => {
            polygonTool.draw({ clientX: 100, clientY: 100 }, mockCanvas, mockContext);
            expect(mockContext.beginPath).not.toHaveBeenCalled();
        });

        it('should handle stop drawing without current shape', () => {
            polygonTool.stopDrawing({ clientX: 100, clientY: 100 }, mockCanvas, mockContext);
            expect(mockLayerManager.addObject).not.toHaveBeenCalled();
        });

        it('should handle invalid drawing coordinates', () => {
            polygonTool.startDrawing({ clientX: 100, clientY: 100 }, mockCanvas, mockContext);
            polygonTool.draw({ clientX: 'invalid', clientY: 'invalid' }, mockCanvas, mockContext);
            
            expect(polygonTool.currentShape.radius).toBeDefined();
            expect(polygonTool.currentShape.rotation).toBeDefined();
        });
    });

    describe('Shape Manipulation', () => {
        it('should handle rotation without current shape', () => {
            polygonTool.rotateShape(Math.PI / 2);
            expect(polygonTool.currentShape).toBeNull();
        });

        it('should handle scaling without current shape', () => {
            polygonTool.scaleShape(2);
            expect(polygonTool.currentShape).toBeNull();
        });

        it('should handle invalid rotation values', () => {
            polygonTool.startDrawing({ clientX: 100, clientY: 100 }, mockCanvas, mockContext);
            polygonTool.rotateShape('invalid');
            expect(polygonTool.currentShape.rotation).toBeDefined();
        });

        it('should handle invalid scale values', () => {
            polygonTool.startDrawing({ clientX: 100, clientY: 100 }, mockCanvas, mockContext);
            polygonTool.scaleShape('invalid');
            expect(polygonTool.currentShape.radius).toBeDefined();
        });
    });

    describe('Tool Options', () => {
        it('should handle invalid option names', () => {
            const result = polygonTool.setOption('invalidOption', 10);
            expect(result).toBe(false);
        });

        it('should handle missing option values', () => {
            const result = polygonTool.setOption('sides');
            expect(result).toBe(false);
        });

        it('should handle invalid option types', () => {
            polygonTool.setOption('sides', 'invalid');
            expect(polygonTool.options.sides).toBe(5);
        });
    });

    describe('State Management', () => {
        it('should handle invalid state format', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            polygonTool.loadState({ invalid: 'format' });
            expect(consoleSpy).toHaveBeenCalledWith('Error loading state:', expect.any(Error));
        });

        it('should handle partial state data', () => {
            const partialState = {
                options: {
                    sides: 6
                }
            };
            
            polygonTool.loadState(partialState);
            
            expect(polygonTool.options.sides).toBe(6);
            expect(polygonTool.options.starRatio).toBe(0.5); // Default value
        });
    });
}); 