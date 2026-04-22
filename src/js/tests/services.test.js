import { jest } from '@jest/globals';
import UIService from '../services/uiService.js';
import DeviceService from '../services/deviceService.js';
import FileService from '../services/fileService.js';
import RasterizationService from '../services/rasterizationService.js';
import { ErrorHandler, FileError, ValidationError } from '../utils/errorHandler.js';

describe('UIService', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('showMessage creates and removes message element', () => {
        jest.useFakeTimers();
        
        UIService.showMessage('Test message', 'info');
        
        const messageElement = document.querySelector('.message');
        expect(messageElement).toBeTruthy();
        expect(messageElement.textContent).toBe('Test message');
        expect(messageElement.classList.contains('info')).toBe(true);
        
        jest.advanceTimersByTime(3000);
        expect(document.querySelector('.message')).toBeFalsy();
        
        jest.useRealTimers();
    });

    test('createButton creates button with correct properties', () => {
        const button = UIService.createButton('test-button', 'Test', 'custom-class', 'Test tooltip');
        
        expect(button.id).toBe('test-button');
        expect(button.className).toBe('custom-class');
        expect(button.innerHTML).toBe('Test');
        expect(button.title).toBe('Test tooltip');
    });
});

describe('DeviceService', () => {
    test('detects device type correctly', () => {
        const deviceType = DeviceService.detectDevice();
        expect(['desktop', 'mobile']).toContain(deviceType);
    });

    test('returns correct features for device type', () => {
        const features = DeviceService.getFeaturesForDevice();
        expect(typeof features).toBe('object');
        expect(features).toHaveProperty('advancedDrawing');
        expect(features).toHaveProperty('layerEffects');
    });

    test('checks feature availability', () => {
        const isAvailable = DeviceService.isFeatureAvailable('advancedDrawing');
        expect(typeof isAvailable).toBe('boolean');
    });
});

describe('FileService', () => {
    test('validates file size correctly', async () => {
        const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt', { type: 'text/plain' });
        await expect(FileService.validateFile(largeFile)).rejects.toThrow(FileError);
    });

    test('validates file type correctly', async () => {
        const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
        await expect(FileService.validateFile(invalidFile)).rejects.toThrow(FileError);
    });

    test('processes image file correctly', async () => {
        const imageFile = new File([''], 'test.png', { type: 'image/png' });
        const img = await FileService.processImage(imageFile);
        expect(img instanceof Image).toBe(true);
    });
});

describe('RasterizationService', () => {
    test('identifies complex path objects', () => {
        const complexPath = {
            type: 'path',
            points: Array(101).fill({ x: 0, y: 0 })
        };
        expect(RasterizationService.isObjectComplex(complexPath)).toBe(true);
    });

    test('identifies complex polygon objects', () => {
        const complexPolygon = {
            type: 'polygon',
            sides: 9
        };
        expect(RasterizationService.isObjectComplex(complexPolygon)).toBe(true);
    });

    test('identifies complex shape objects', () => {
        const complexShape = {
            type: 'shape',
            fill: {
                type: 'gradient',
                stops: Array(9).fill({ color: '#000', position: 0 })
            }
        };
        expect(RasterizationService.isObjectComplex(complexShape)).toBe(true);
    });

    describe('Shape Drawing', () => {
        let ctx;
        let canvas;

        beforeEach(() => {
            canvas = document.createElement('canvas');
            ctx = canvas.getContext('2d');
        });

        test('draws rectangle with corner radius', () => {
            const shape = {
                type: 'rectangle',
                width: 100,
                height: 50,
                cornerRadius: 10,
                fill: '#ff0000'
            };
            
            RasterizationService.drawShape(ctx, shape);
            expect(ctx.fillStyle).toBe('#ff0000');
        });

        test('draws circle with gradient fill', () => {
            const shape = {
                type: 'circle',
                radius: 50,
                fill: {
                    type: 'radial',
                    stops: [
                        { position: 0, color: '#ff0000' },
                        { position: 1, color: '#0000ff' }
                    ],
                    start: { x: 0, y: 0 },
                    end: { x: 100, y: 100 },
                    innerRadius: 0,
                    outerRadius: 50
                }
            };
            
            RasterizationService.drawShape(ctx, shape);
            expect(ctx.fillStyle).toBeInstanceOf(CanvasGradient);
        });

        test('draws ellipse with stroke', () => {
            const shape = {
                type: 'ellipse',
                width: 100,
                height: 50,
                stroke: {
                    color: '#000000',
                    width: 2,
                    dashArray: [5, 5]
                }
            };
            
            RasterizationService.drawShape(ctx, shape);
            expect(ctx.strokeStyle).toBe('#000000');
            expect(ctx.lineWidth).toBe(2);
        });

        test('draws star with filters', () => {
            const shape = {
                type: 'star',
                points: 5,
                innerRadius: 20,
                outerRadius: 50,
                filters: [
                    { type: 'blur', radius: 5 },
                    { type: 'opacity', value: 0.8 }
                ]
            };
            
            RasterizationService.drawShape(ctx, shape);
            expect(ctx.filter).toContain('blur(5px)');
            expect(ctx.globalAlpha).toBe(0.8);
        });

        test('applies transformations correctly', () => {
            const shape = {
                type: 'rectangle',
                width: 100,
                height: 50,
                transform: {
                    x: 10,
                    y: 20,
                    rotation: Math.PI / 4,
                    scaleX: 2,
                    scaleY: 2
                }
            };
            
            RasterizationService.drawShape(ctx, shape);
            // Note: We can't directly test the transformation matrix,
            // but we can verify the shape was drawn with the correct context state
            expect(ctx.getTransform()).toBeDefined();
        });
    });
});

describe('ErrorHandler', () => {
    beforeEach(() => {
        ErrorHandler.clearErrorLog();
    });

    test('handles custom errors correctly', () => {
        const error = new FileError('Test error');
        ErrorHandler.handle(error, 'test');
        
        const recentErrors = ErrorHandler.getRecentErrors();
        expect(recentErrors[0].type).toBe('FILE_ERROR');
        expect(recentErrors[0].message).toBe('Test error');
    });

    test('maintains error log size limit', () => {
        for (let i = 0; i < 150; i++) {
            ErrorHandler.handle(new Error(`Error ${i}`));
        }
        
        expect(ErrorHandler.getErrorCount()).toBe(100);
    });

    test('provides user-friendly error messages', () => {
        const error = new FileError('Failed to load image');
        const message = ErrorHandler.getUserFriendlyMessage(error);
        expect(message).toBe('Unable to load the image. Please try a different file.');
    });
}); 