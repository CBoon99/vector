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
    }

    draw(event, canvas, context) {
        if (!this.isDrawing || !this.currentPath) return;

        const point = this.getCanvasPoint(event, canvas);
        const last = this.points[this.points.length - 1];
        if (!last || Math.hypot(point.x - last.x, point.y - last.y) > 0.5) {
            this.points.push(point);
        } else {
            this.points[this.points.length - 1] = point;
        }
        this.currentPath.points = [...this.points];

        if (!context) return;

        context.save();
        context.beginPath();
        context.strokeStyle = this.currentPath.stroke;
        context.lineWidth = this.currentPath.strokeWidth;
        if (this.points.length > 0) {
            context.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                context.lineTo(this.points[i].x, this.points[i].y);
            }
        }
        context.stroke();
        context.restore();
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
}
