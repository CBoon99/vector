import { jest } from '@jest/globals';
import PolygonTool from './polygon-tool.js';

describe('PolygonTool', () => {
    let polygonTool;
    let mockStateManager;
    let mockLayerManager;
    let mockCanvas;
    let mockContext;
    let mockEvent;

    beforeEach(() => {
        // Mock state manager with more detailed state
        mockStateManager = {
            getState: jest.fn().mockReturnValue({
                currentColor: '#000000',
                strokeWidth: 2,
                fillColor: '#ffffff',
                opacity: 1,
                blendMode: 'normal',
                layerOpacity: 1
            }),
            saveHistory: jest.fn(),
            undo: jest.fn(),
            redo: jest.fn()
        };

        // Mock layer manager with more functionality
        mockLayerManager = {
            addObject: jest.fn(),
            removeObject: jest.fn(),
            updateObject: jest.fn(),
            getActiveLayer: jest.fn().mockReturnValue({
                id: 'layer1',
                name: 'Layer 1',
                visible: true,
                locked: false
            }),
            getLayerById: jest.fn().mockReturnValue({
                id: 'layer1',
                name: 'Layer 1',
                visible: true,
                locked: false
            })
        };

        // Mock canvas with more properties
        mockCanvas = {
            getBoundingClientRect: jest.fn().mockReturnValue({
                left: 0,
                top: 0,
                width: 800,
                height: 600
            }),
            width: 800,
            height: 600,
            style: {
                cursor: ''
            }
        };

        // Mock context with more methods
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
            setTransform: jest.fn(),
            translate: jest.fn(),
            rotate: jest.fn(),
            scale: jest.fn(),
            clip: jest.fn(),
            clearRect: jest.fn(),
            fillRect: jest.fn(),
            strokeRect: jest.fn(),
            arc: jest.fn(),
            quadraticCurveTo: jest.fn(),
            bezierCurveTo: jest.fn(),
            rect: jest.fn(),
            ellipse: jest.fn()
        };

        // Mock event with more properties
        mockEvent = {
            clientX: 100,
            clientY: 100,
            preventDefault: jest.fn(),
            stopPropagation: jest.fn(),
            ctrlKey: false,
            shiftKey: false,
            altKey: false,
            metaKey: false,
            buttons: 1
        };

        // Create tool instance
        polygonTool = new PolygonTool(mockStateManager, mockLayerManager);
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            const options = polygonTool.getOptions();
            expect(options.sides).toBe(5);
            expect(options.radius).toBe(50);
            expect(options.starRatio).toBe(0.5);
            expect(options.rotation).toBe(0);
            expect(options.strokeWidth).toBe(1);
            expect(options.strokeStyle).toBe('solid');
            expect(options.fill).toBe('transparent');
            expect(options.isStar).toBe(false);
        });

        test('should initialize with correct cursor', () => {
            expect(polygonTool.getCursor()).toBe('crosshair');
        });

        test('should initialize with empty current shape', () => {
            expect(polygonTool.currentShape).toBeNull();
        });
    });

    describe('Drawing Operations', () => {
        test('should start drawing at correct position', () => {
            polygonTool.startDrawing(mockEvent, mockCanvas, mockContext);

            expect(polygonTool.currentShape).toBeDefined();
            expect(polygonTool.currentShape.center).toEqual({
                x: 100,
                y: 100
            });
            expect(polygonTool.currentShape.stroke).toBe('#000000');
        });

        test('should handle drawing with modifier keys', () => {
            const eventWithShift = { ...mockEvent, shiftKey: true };
            polygonTool.startDrawing(eventWithShift, mockCanvas, mockContext);
            polygonTool.draw(eventWithShift, mockCanvas, mockContext);

            // Should maintain aspect ratio with shift key
            expect(polygonTool.currentShape.radius).toBeGreaterThan(0);
        });

        test('should handle drawing with different mouse buttons', () => {
            const rightClickEvent = { ...mockEvent, buttons: 2 };
            polygonTool.startDrawing(rightClickEvent, mockCanvas, mockContext);
            
            // Should handle right-click differently
            expect(polygonTool.currentShape).toBeDefined();
        });

        test('should update shape during drawing with smooth transitions', () => {
            const events = [
                { ...mockEvent, clientX: 100, clientY: 100 },
                { ...mockEvent, clientX: 150, clientY: 150 },
                { ...mockEvent, clientX: 200, clientY: 200 }
            ];

            polygonTool.startDrawing(events[0], mockCanvas, mockContext);
            events.slice(1).forEach(event => {
                polygonTool.draw(event, mockCanvas, mockContext);
            });

            expect(polygonTool.currentShape.radius).toBeGreaterThan(0);
            expect(polygonTool.currentShape.rotation).toBeDefined();
        });

        test('should complete shape on stop drawing', () => {
            polygonTool.startDrawing(mockEvent, mockCanvas, mockContext);
            polygonTool.stopDrawing(mockEvent, mockCanvas, mockContext);

            expect(mockLayerManager.addObject).toHaveBeenCalled();
            expect(mockStateManager.saveHistory).toHaveBeenCalled();
            expect(polygonTool.currentShape).toBeNull();
        });

        test('should handle drawing cancellation', () => {
            polygonTool.startDrawing(mockEvent, mockCanvas, mockContext);
            polygonTool.cancelDrawing();

            expect(polygonTool.currentShape).toBeNull();
            expect(mockLayerManager.addObject).not.toHaveBeenCalled();
        });
    });

    describe('Shape Manipulation', () => {
        beforeEach(() => {
            polygonTool.startDrawing(mockEvent, mockCanvas, mockContext);
        });

        test('should rotate shape with different angles', () => {
            const angles = [Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 4];
            const initialRotation = polygonTool.currentShape.rotation;

            angles.forEach(angle => {
                polygonTool.rotateShape(angle);
                expect(polygonTool.currentShape.rotation).toBe(initialRotation + angle);
            });
        });

        test('should scale shape with different factors', () => {
            const factors = [0.5, 1.5, 2, 0.25];
            const initialRadius = polygonTool.currentShape.radius;

            factors.forEach(factor => {
                polygonTool.scaleShape(factor);
                expect(polygonTool.currentShape.radius).toBe(initialRadius * factor);
            });
        });

        test('should handle shape transformation combinations', () => {
            const initialRadius = polygonTool.currentShape.radius;
            const initialRotation = polygonTool.currentShape.rotation;

            polygonTool.rotateShape(Math.PI / 4);
            polygonTool.scaleShape(2);
            polygonTool.rotateShape(-Math.PI / 4);

            expect(polygonTool.currentShape.radius).toBe(initialRadius * 2);
            expect(polygonTool.currentShape.rotation).toBe(initialRotation);
        });
    });

    describe('Options Management', () => {
        test('should update all valid options', () => {
            const newOptions = {
                sides: 6,
                radius: 100,
                starRatio: 0.7,
                rotation: Math.PI / 4,
                strokeWidth: 2,
                strokeStyle: 'dashed',
                fill: '#ff0000',
                isStar: true
            };

            Object.entries(newOptions).forEach(([option, value]) => {
                polygonTool.setOption(option, value);
            });

            const options = polygonTool.getOptions();
            Object.entries(newOptions).forEach(([option, value]) => {
                expect(options[option]).toBe(value);
            });
        });

        test('should validate option values', () => {
            // Test invalid sides
            polygonTool.setOption('sides', 2);
            expect(polygonTool.getOptions().sides).toBe(3);

            // Test invalid radius
            polygonTool.setOption('radius', -50);
            expect(polygonTool.getOptions().radius).toBe(1);

            // Test invalid star ratio
            polygonTool.setOption('starRatio', 2);
            expect(polygonTool.getOptions().starRatio).toBe(1);
        });

        test('should handle option dependencies', () => {
            // Setting isStar should affect starRatio
            polygonTool.setOption('isStar', true);
            expect(polygonTool.getOptions().starRatio).toBeDefined();

            // Setting sides should affect star ratio limits
            polygonTool.setOption('sides', 6);
            polygonTool.setOption('starRatio', 0.8);
            expect(polygonTool.getOptions().starRatio).toBeLessThanOrEqual(1);
        });
    });

    describe('State Management', () => {
        test('should save and load complete state', () => {
            const testOptions = {
                sides: 8,
                radius: 75,
                starRatio: 0.6,
                rotation: Math.PI / 3,
                strokeWidth: 3,
                strokeStyle: 'dotted',
                fill: '#00ff00',
                isStar: true
            };

            Object.entries(testOptions).forEach(([option, value]) => {
                polygonTool.setOption(option, value);
            });

            const state = polygonTool.saveState();
            const newTool = new PolygonTool(mockStateManager, mockLayerManager);
            newTool.loadState(state);

            const loadedOptions = newTool.getOptions();
            Object.entries(testOptions).forEach(([option, value]) => {
                expect(loadedOptions[option]).toBe(value);
            });
        });

        test('should handle invalid state data', () => {
            const invalidState = {
                options: {
                    sides: 'invalid',
                    radius: -100,
                    starRatio: 2
                }
            };

            const newTool = new PolygonTool(mockStateManager, mockLayerManager);
            newTool.loadState(invalidState);

            const options = newTool.getOptions();
            expect(options.sides).toBe(5); // Default value
            expect(options.radius).toBe(50); // Default value
            expect(options.starRatio).toBe(0.5); // Default value
        });
    });

    describe('Drawing Styles', () => {
        test('should apply all stroke styles', () => {
            const styles = ['solid', 'dashed', 'dotted'];
            styles.forEach(style => {
                polygonTool.setOption('strokeStyle', style);
                polygonTool.startDrawing(mockEvent, mockCanvas, mockContext);
                polygonTool.drawShape(mockContext);

                if (style === 'dashed') {
                    expect(mockContext.setLineDash).toHaveBeenCalledWith([5, 5]);
                } else if (style === 'dotted') {
                    expect(mockContext.setLineDash).toHaveBeenCalledWith([2, 2]);
                } else {
                    expect(mockContext.setLineDash).toHaveBeenCalledWith([]);
                }
            });
        });

        test('should apply fill styles with different colors', () => {
            const colors = ['#ff0000', '#00ff00', '#0000ff', 'transparent'];
            colors.forEach(color => {
                polygonTool.setOption('fill', color);
                polygonTool.startDrawing(mockEvent, mockCanvas, mockContext);
                polygonTool.drawShape(mockContext);

                if (color === 'transparent') {
                    expect(mockContext.fill).not.toHaveBeenCalled();
                } else {
                    expect(mockContext.fillStyle).toBe(color);
                    expect(mockContext.fill).toHaveBeenCalled();
                }
            });
        });

        test('should handle stroke width changes', () => {
            const widths = [1, 2, 5, 10];
            widths.forEach(width => {
                polygonTool.setOption('strokeWidth', width);
                polygonTool.startDrawing(mockEvent, mockCanvas, mockContext);
                polygonTool.drawShape(mockContext);

                expect(mockContext.lineWidth).toBe(width);
            });
        });
    });

    describe('Star Shape', () => {
        test('should draw star shapes with different configurations', () => {
            const configurations = [
                { sides: 5, starRatio: 0.5 },
                { sides: 6, starRatio: 0.7 },
                { sides: 8, starRatio: 0.3 }
            ];

            configurations.forEach(config => {
                polygonTool.setOption('isStar', true);
                polygonTool.setOption('sides', config.sides);
                polygonTool.setOption('starRatio', config.starRatio);
                polygonTool.startDrawing(mockEvent, mockCanvas, mockContext);
                polygonTool.drawShape(mockContext);

                // Verify points
                const points = [];
                for (let i = 0; i < config.sides; i++) {
                    const angle = i * (Math.PI * 2) / config.sides;
                    const r = i % 2 === 1 ? 50 * config.starRatio : 50;
                    points.push({
                        x: 100 + Math.cos(angle) * r,
                        y: 100 + Math.sin(angle) * r
                    });
                }

                expect(mockContext.moveTo).toHaveBeenCalledWith(points[0].x, points[0].y);
                points.slice(1).forEach(point => {
                    expect(mockContext.lineTo).toHaveBeenCalledWith(point.x, point.y);
                });
            });
        });

        test('should handle star shape edge cases', () => {
            // Test minimum sides
            polygonTool.setOption('isStar', true);
            polygonTool.setOption('sides', 3);
            polygonTool.startDrawing(mockEvent, mockCanvas, mockContext);
            expect(polygonTool.currentShape.sides).toBe(3);

            // Test maximum sides
            polygonTool.setOption('sides', 20);
            polygonTool.startDrawing(mockEvent, mockCanvas, mockContext);
            expect(polygonTool.currentShape.sides).toBe(20);

            // Test star ratio limits
            polygonTool.setOption('starRatio', 0.1);
            expect(polygonTool.getOptions().starRatio).toBe(0.1);
            polygonTool.setOption('starRatio', 0.9);
            expect(polygonTool.getOptions().starRatio).toBe(0.9);
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid canvas context', () => {
            const invalidContext = null;
            polygonTool.startDrawing(mockEvent, mockCanvas, invalidContext);
            expect(() => polygonTool.drawShape(invalidContext)).not.toThrow();
        });

        test('should handle invalid event data', () => {
            const invalidEvent = { clientX: 'invalid', clientY: 'invalid' };
            polygonTool.startDrawing(invalidEvent, mockCanvas, mockContext);
            expect(polygonTool.currentShape).toBeDefined();
            expect(polygonTool.currentShape.center).toEqual({ x: 0, y: 0 });
        });

        test('should handle missing layer manager', () => {
            const toolWithoutLayerManager = new PolygonTool(mockStateManager, null);
            toolWithoutLayerManager.startDrawing(mockEvent, mockCanvas, mockContext);
            expect(() => toolWithoutLayerManager.stopDrawing(mockEvent, mockCanvas, mockContext)).not.toThrow();
        });
    });

    describe('Performance', () => {
        test('should handle rapid drawing operations', () => {
            const events = Array.from({ length: 100 }, (_, i) => ({
                ...mockEvent,
                clientX: 100 + i,
                clientY: 100 + i
            }));

            polygonTool.startDrawing(events[0], mockCanvas, mockContext);
            events.slice(1).forEach(event => {
                polygonTool.draw(event, mockCanvas, mockContext);
            });

            expect(polygonTool.currentShape).toBeDefined();
            expect(polygonTool.currentShape.radius).toBeGreaterThan(0);
        });

        test('should handle multiple shape transformations', () => {
            polygonTool.startDrawing(mockEvent, mockCanvas, mockContext);
            
            for (let i = 0; i < 100; i++) {
                polygonTool.rotateShape(Math.PI / 180);
                polygonTool.scaleShape(1.01);
            }

            expect(polygonTool.currentShape).toBeDefined();
            expect(polygonTool.currentShape.rotation).toBeGreaterThan(0);
            expect(polygonTool.currentShape.radius).toBeGreaterThan(0);
        });
    });
}); 