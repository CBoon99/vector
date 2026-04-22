import { ErrorHandler, DrawingError } from '../utils/errorHandler.js';
import UIService from '../services/uiService.js';

class ShapeTool {
    constructor(stateManager, layerManager) {
        this.stateManager = stateManager;
        this.layerManager = layerManager;
        this.currentShape = null;
        this.isDrawing = false;
        this.startPoint = null;
        this.shapeType = 'rectangle'; // Default shape type
        this.shapeOptions = {
            cornerRadius: 0,
            points: 5, // For star shape
            innerRadius: 20, // For star shape
            fill: '#ffffff',
            stroke: {
                color: '#000000',
                width: 1
            }
        };
    }

    initialize() {
        this.setupEventListeners();
        this.createShapeControls();
    }

    setupEventListeners() {
        // Shape type selection
        const shapeButtons = document.querySelectorAll('.shape-type-button');
        shapeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.shapeType = button.dataset.shape;
                this.updateActiveButton(button);
            });
        });

        // Shape options
        const cornerRadiusInput = document.getElementById('corner-radius');
        if (cornerRadiusInput) {
            cornerRadiusInput.addEventListener('change', (e) => {
                this.shapeOptions.cornerRadius = parseInt(e.target.value) || 0;
            });
        }

        const pointsInput = document.getElementById('star-points');
        if (pointsInput) {
            pointsInput.addEventListener('change', (e) => {
                this.shapeOptions.points = parseInt(e.target.value) || 5;
            });
        }

        const fillColorInput = document.getElementById('shape-fill');
        if (fillColorInput) {
            fillColorInput.addEventListener('change', (e) => {
                this.shapeOptions.fill = e.target.value;
            });
        }

        const strokeColorInput = document.getElementById('shape-stroke');
        if (strokeColorInput) {
            strokeColorInput.addEventListener('change', (e) => {
                this.shapeOptions.stroke.color = e.target.value;
            });
        }

        const strokeWidthInput = document.getElementById('stroke-width');
        if (strokeWidthInput) {
            strokeWidthInput.addEventListener('change', (e) => {
                this.shapeOptions.stroke.width = parseInt(e.target.value) || 1;
            });
        }
    }

    createShapeControls() {
        const controlsContainer = document.getElementById('shape-controls');
        if (!controlsContainer) return;

        // Shape type buttons
        const shapeTypes = ['rectangle', 'circle', 'ellipse', 'star'];
        const buttonGroup = UIService.createControlGroup();
        
        shapeTypes.forEach(type => {
            const button = UIService.createButton(
                `shape-${type}`,
                type.charAt(0).toUpperCase() + type.slice(1),
                'shape-type-button',
                `Create ${type}`
            );
            button.dataset.shape = type;
            buttonGroup.appendChild(button);
        });

        controlsContainer.appendChild(buttonGroup);

        // Shape options
        const optionsGroup = UIService.createControlGroup();
        
        // Corner radius (for rectangle)
        const cornerRadiusControl = document.createElement('div');
        cornerRadiusControl.innerHTML = `
            <label for="corner-radius">Corner Radius:</label>
            <input type="number" id="corner-radius" min="0" value="0">
        `;
        optionsGroup.appendChild(cornerRadiusControl);

        // Star points
        const pointsControl = document.createElement('div');
        pointsControl.innerHTML = `
            <label for="star-points">Star Points:</label>
            <input type="number" id="star-points" min="3" max="20" value="5">
        `;
        optionsGroup.appendChild(pointsControl);

        // Fill color
        const fillControl = document.createElement('div');
        fillControl.innerHTML = `
            <label for="shape-fill">Fill Color:</label>
            <input type="color" id="shape-fill" value="#ffffff">
        `;
        optionsGroup.appendChild(fillControl);

        // Stroke color
        const strokeControl = document.createElement('div');
        strokeControl.innerHTML = `
            <label for="shape-stroke">Stroke Color:</label>
            <input type="color" id="shape-stroke" value="#000000">
        `;
        optionsGroup.appendChild(strokeControl);

        // Stroke width
        const strokeWidthControl = document.createElement('div');
        strokeWidthControl.innerHTML = `
            <label for="stroke-width">Stroke Width:</label>
            <input type="number" id="stroke-width" min="1" max="20" value="1">
        `;
        optionsGroup.appendChild(strokeWidthControl);

        controlsContainer.appendChild(optionsGroup);
    }

    updateActiveButton(activeButton) {
        const buttons = document.querySelectorAll('.shape-type-button');
        buttons.forEach(button => button.classList.remove('active'));
        activeButton.classList.add('active');
    }

    onMouseDown(event) {
        try {
            this.isDrawing = true;
            this.startPoint = this.getCanvasPoint(event);
            this.createShape();
        } catch (error) {
            ErrorHandler.handle(error, 'ShapeTool.onMouseDown');
        }
    }

    onMouseMove(event) {
        if (!this.isDrawing) return;

        try {
            const currentPoint = this.getCanvasPoint(event);
            this.updateShape(currentPoint);
            this.stateManager.requestRedraw();
        } catch (error) {
            ErrorHandler.handle(error, 'ShapeTool.onMouseMove');
        }
    }

    onMouseUp(event) {
        if (!this.isDrawing) return;

        try {
            const endPoint = this.getCanvasPoint(event);
            this.finalizeShape(endPoint);
            this.isDrawing = false;
            this.startPoint = null;
            this.currentShape = null;
            this.stateManager.requestRedraw();
        } catch (error) {
            ErrorHandler.handle(error, 'ShapeTool.onMouseUp');
        }
    }

    getCanvasPoint(event) {
        const rect = this.stateManager.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    createShape() {
        const shape = {
            type: this.shapeType,
            ...this.shapeOptions,
            transform: {
                x: this.startPoint.x,
                y: this.startPoint.y,
                rotation: 0,
                scaleX: 1,
                scaleY: 1
            }
        };

        // Set initial dimensions based on shape type
        switch (this.shapeType) {
            case 'rectangle':
            case 'ellipse':
                shape.width = 0;
                shape.height = 0;
                break;
            case 'circle':
                shape.radius = 0;
                break;
            case 'star':
                shape.outerRadius = 0;
                shape.innerRadius = this.shapeOptions.innerRadius;
                break;
        }

        this.currentShape = shape;
        this.layerManager.addObject(shape);
    }

    updateShape(currentPoint) {
        if (!this.currentShape) return;

        const dx = currentPoint.x - this.startPoint.x;
        const dy = currentPoint.y - this.startPoint.y;

        switch (this.shapeType) {
            case 'rectangle':
            case 'ellipse':
                this.currentShape.width = Math.abs(dx);
                this.currentShape.height = Math.abs(dy);
                this.currentShape.transform.x = dx < 0 ? currentPoint.x : this.startPoint.x;
                this.currentShape.transform.y = dy < 0 ? currentPoint.y : this.startPoint.y;
                break;
            case 'circle':
                const radius = Math.sqrt(dx * dx + dy * dy);
                this.currentShape.radius = radius;
                break;
            case 'star':
                const outerRadius = Math.sqrt(dx * dx + dy * dy);
                this.currentShape.outerRadius = outerRadius;
                break;
        }
    }

    finalizeShape(endPoint) {
        if (!this.currentShape) return;

        // Remove shape if it's too small
        const minSize = 5;
        let isTooSmall = false;

        switch (this.shapeType) {
            case 'rectangle':
            case 'ellipse':
                isTooSmall = this.currentShape.width < minSize || this.currentShape.height < minSize;
                break;
            case 'circle':
                isTooSmall = this.currentShape.radius < minSize;
                break;
            case 'star':
                isTooSmall = this.currentShape.outerRadius < minSize;
                break;
        }

        if (isTooSmall) {
            this.layerManager.removeObject(this.currentShape);
            UIService.showMessage('Shape too small', 'warning');
            return;
        }

        // Add shape to history
        this.stateManager.addToHistory();
    }
}

export default ShapeTool; 