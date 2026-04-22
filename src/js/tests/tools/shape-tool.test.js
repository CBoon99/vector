import { jest } from '@jest/globals';
import ShapeTool from '../../tools/shape-tool.js';
import UIService from '../../services/uiService.js';

describe('ShapeTool', () => {
    let shapeTool;
    let mockStateManager;
    let mockLayerManager;
    let mockCanvas;

    beforeEach(() => {
        // Mock canvas
        mockCanvas = document.createElement('canvas');
        mockCanvas.getBoundingClientRect = jest.fn().mockReturnValue({
            left: 0,
            top: 0
        });

        // Mock state manager
        mockStateManager = {
            canvas: mockCanvas,
            requestRedraw: jest.fn(),
            addToHistory: jest.fn()
        };

        // Mock layer manager
        mockLayerManager = {
            addObject: jest.fn(),
            removeObject: jest.fn()
        };

        // Create tool instance
        shapeTool = new ShapeTool(mockStateManager, mockLayerManager);

        // Mock DOM elements
        document.body.innerHTML = `
            <div id="shape-controls"></div>
            <button class="shape-type-button" data-shape="rectangle">Rectangle</button>
            <button class="shape-type-button" data-shape="circle">Circle</button>
            <input type="number" id="corner-radius" value="0">
            <input type="number" id="star-points" value="5">
            <input type="color" id="shape-fill" value="#ffffff">
            <input type="color" id="shape-stroke" value="#000000">
            <input type="number" id="stroke-width" value="1">
        `;
    });

    test('initializes with default values', () => {
        expect(shapeTool.shapeType).toBe('rectangle');
        expect(shapeTool.shapeOptions.cornerRadius).toBe(0);
        expect(shapeTool.shapeOptions.points).toBe(5);
        expect(shapeTool.shapeOptions.fill).toBe('#ffffff');
        expect(shapeTool.shapeOptions.stroke.color).toBe('#000000');
        expect(shapeTool.shapeOptions.stroke.width).toBe(1);
    });

    test('creates shape controls', () => {
        shapeTool.initialize();
        const controlsContainer = document.getElementById('shape-controls');
        expect(controlsContainer.children.length).toBe(2); // Button group and options group
    });

    test('updates shape type when button is clicked', () => {
        shapeTool.initialize();
        const circleButton = document.querySelector('[data-shape="circle"]');
        circleButton.click();
        expect(shapeTool.shapeType).toBe('circle');
        expect(circleButton.classList.contains('active')).toBe(true);
    });

    test('creates rectangle shape on mouse down', () => {
        shapeTool.initialize();
        const event = {
            clientX: 100,
            clientY: 100
        };

        shapeTool.onMouseDown(event);
        expect(shapeTool.isDrawing).toBe(true);
        expect(shapeTool.startPoint).toEqual({ x: 100, y: 100 });
        expect(mockLayerManager.addObject).toHaveBeenCalled();
    });

    test('updates rectangle shape on mouse move', () => {
        shapeTool.initialize();
        shapeTool.onMouseDown({ clientX: 100, clientY: 100 });
        shapeTool.onMouseMove({ clientX: 200, clientY: 200 });

        const shape = mockLayerManager.addObject.mock.calls[0][0];
        expect(shape.width).toBe(100);
        expect(shape.height).toBe(100);
        expect(mockStateManager.requestRedraw).toHaveBeenCalled();
    });

    test('creates circle shape with correct radius', () => {
        shapeTool.initialize();
        document.querySelector('[data-shape="circle"]').click();
        
        shapeTool.onMouseDown({ clientX: 100, clientY: 100 });
        shapeTool.onMouseMove({ clientX: 150, clientY: 150 });

        const shape = mockLayerManager.addObject.mock.calls[0][0];
        expect(shape.radius).toBeCloseTo(70.71, 1); // sqrt(50^2 + 50^2)
    });

    test('removes shape if too small', () => {
        shapeTool.initialize();
        shapeTool.onMouseDown({ clientX: 100, clientY: 100 });
        shapeTool.onMouseMove({ clientX: 102, clientY: 102 });
        shapeTool.onMouseUp({ clientX: 102, clientY: 102 });

        expect(mockLayerManager.removeObject).toHaveBeenCalled();
    });

    test('updates shape options when inputs change', () => {
        shapeTool.initialize();
        
        const cornerRadiusInput = document.getElementById('corner-radius');
        cornerRadiusInput.value = '10';
        cornerRadiusInput.dispatchEvent(new Event('change'));
        expect(shapeTool.shapeOptions.cornerRadius).toBe(10);

        const fillColorInput = document.getElementById('shape-fill');
        fillColorInput.value = '#ff0000';
        fillColorInput.dispatchEvent(new Event('change'));
        expect(shapeTool.shapeOptions.fill).toBe('#ff0000');

        const strokeWidthInput = document.getElementById('stroke-width');
        strokeWidthInput.value = '2';
        strokeWidthInput.dispatchEvent(new Event('change'));
        expect(shapeTool.shapeOptions.stroke.width).toBe(2);
    });

    test('handles errors gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const errorHandlerSpy = jest.spyOn(ErrorHandler, 'handle');

        shapeTool.onMouseDown({ clientX: 'invalid', clientY: 'invalid' });
        
        expect(errorHandlerSpy).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });
}); 