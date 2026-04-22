import { Tool } from './tool.js';

export class PenTool extends Tool {
    constructor() {
        super('Pen Tool', '✏️', 'crosshair');
        this.isDrawing = false;
        this.currentPath = null;
        this.points = [];
    }

    initialize(layerManager, stateManager) {
        super.initialize(layerManager, stateManager);
    }

    startDrawing(event, canvas, context) {
        this.isDrawing = true;
        const point = this.getCanvasPoint(event, canvas);
        
        this.currentPath = {
            type: 'path',
            points: [point],
            stroke: this.stateManager.getState().currentColor,
            strokeWidth: this.stateManager.getState().strokeWidth || 1,
            fill: 'transparent'
        };
        
        this.points = [point];
        
        // Start the path
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.strokeStyle = this.currentPath.stroke;
        context.lineWidth = this.currentPath.strokeWidth;
    }

    draw(event, canvas, context) {
        if (!this.isDrawing || !this.currentPath) return;
        
        const point = this.getCanvasPoint(event, canvas);
        this.points.push(point);
        this.currentPath.points = [...this.points];
        
        // Draw line to current point
        context.lineTo(point.x, point.y);
        context.stroke();
    }

    stopDrawing(event, canvas, context) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        if (this.currentPath && this.currentPath.points.length > 1) {
            // Add the path to the layer
            this.layerManager.addObject(this.currentPath);
            this.stateManager.saveHistory();
        }
        
        this.currentPath = null;
        this.points = [];
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
