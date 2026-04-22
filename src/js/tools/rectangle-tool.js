import { Tool } from './tool.js';

export class RectangleTool extends Tool {
    constructor() {
        super('Rectangle Tool', '⬜', 'crosshair');
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
            type: 'rectangle',
            x: this.startPoint.x,
            y: this.startPoint.y,
            width: 0,
            height: 0,
            stroke: this.stateManager.getState().currentColor,
            strokeWidth: this.stateManager.getState().strokeWidth || 1,
            fill: this.stateManager.getState().fillColor || 'transparent'
        };
    }

    draw(event, canvas, context) {
        if (!this.isDrawing || !this.currentShape) return;
        
        const currentPoint = this.getCanvasPoint(event, canvas);
        
        // Calculate dimensions
        this.currentShape.width = currentPoint.x - this.startPoint.x;
        this.currentShape.height = currentPoint.y - this.startPoint.y;
        
        // Draw preview
        this.drawShape(context);
    }

    stopDrawing(event, canvas, context) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        if (this.currentShape && 
            Math.abs(this.currentShape.width) > 5 && 
            Math.abs(this.currentShape.height) > 5) {
            
            // Normalize dimensions (handle negative width/height)
            if (this.currentShape.width < 0) {
                this.currentShape.x += this.currentShape.width;
                this.currentShape.width = Math.abs(this.currentShape.width);
            }
            if (this.currentShape.height < 0) {
                this.currentShape.y += this.currentShape.height;
                this.currentShape.height = Math.abs(this.currentShape.height);
            }
            
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
        context.rect(
            this.currentShape.x,
            this.currentShape.y,
            this.currentShape.width,
            this.currentShape.height
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
