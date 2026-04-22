import { Tool } from './tool.js';

export class CircleTool extends Tool {
    constructor() {
        super('Circle Tool', '⭕', 'crosshair');
        this.isDrawing = false;
        this.currentShape = null;
        this.startPoint = null;
    }

    initialize(layerManager, stateManager) {
        super.initialize(layerManager, stateManager);
    }

    startDrawing(event, canvas, context) {
        this.isDrawing = true;
        this.startPoint = this.getCanvasPoint(event, canvas);
        
        this.currentShape = {
            type: 'circle',
            x: this.startPoint.x,
            y: this.startPoint.y,
            radius: 0,
            stroke: this.stateManager.getState().currentColor,
            strokeWidth: this.stateManager.getState().strokeWidth || 1,
            fill: this.stateManager.getState().fillColor || 'transparent'
        };
    }

    draw(event, canvas, context) {
        if (!this.isDrawing || !this.currentShape) return;
        
        const currentPoint = this.getCanvasPoint(event, canvas);
        
        // Calculate radius based on distance from start point
        const dx = currentPoint.x - this.startPoint.x;
        const dy = currentPoint.y - this.startPoint.y;
        this.currentShape.radius = Math.sqrt(dx * dx + dy * dy);
        
        // Draw preview
        this.drawShape(context);
    }

    stopDrawing(event, canvas, context) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        if (this.currentShape && this.currentShape.radius > 5) {
            // Add the shape to the layer
            this.layerManager.addObject(this.currentShape);
            this.stateManager.saveHistory();
        }
        
        this.currentShape = null;
        this.startPoint = null;
    }

    drawShape(context) {
        if (!this.currentShape) return;
        
        context.save();
        context.beginPath();
        context.arc(
            this.currentShape.x,
            this.currentShape.y,
            this.currentShape.radius,
            0,
            2 * Math.PI
        );
        
        // Apply fill
        if (this.currentShape.fill !== 'transparent') {
            context.fillStyle = this.currentShape.fill;
            context.fill();
        }
        
        // Apply stroke
        context.strokeStyle = this.currentShape.stroke;
        context.lineWidth = this.currentShape.strokeWidth;
        context.stroke();
        
        context.restore();
    }

    getCanvasPoint(event, canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }
}
