import { Tool } from './tool.js';
import { generateId } from '../utils/id-generator.js';

export class BezierTool extends Tool {
    constructor(stateManager, layerManager) {
        super(stateManager, layerManager);
        this.name = 'bezier';
        this.icon = 'bezier-icon';
        this.cursor = 'crosshair';
        this.points = [];
        this.controlPoints = [];
        this.isDrawing = false;
        this.selectedPoint = null;
        this.selectedControlPoint = null;
    }

    startDrawing(event, canvas, context) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (!this.isDrawing) {
            // Start new path
            this.points = [{
                x,
                y,
                type: 'anchor',
                controlPoint1: null,
                controlPoint2: null
            }];
            this.isDrawing = true;
        } else {
            // Add new point with control points
            const lastPoint = this.points[this.points.length - 1];
            const controlPoint1 = {
                x: lastPoint.x + (x - lastPoint.x) / 3,
                y: lastPoint.y + (y - lastPoint.y) / 3
            };
            const controlPoint2 = {
                x: x - (x - lastPoint.x) / 3,
                y: y - (y - lastPoint.y) / 3
            };

            this.points.push({
                x,
                y,
                type: 'anchor',
                controlPoint1,
                controlPoint2
            });

            // Update previous point's second control point
            lastPoint.controlPoint2 = controlPoint1;
        }

        this.draw(context);
    }

    draw(context) {
        if (this.points.length === 0) return;

        context.save();
        context.strokeStyle = this.stateManager.getState().currentColor;
        context.lineWidth = this.stateManager.getState().currentStrokeWidth;

        // Draw the path
        context.beginPath();
        context.moveTo(this.points[0].x, this.points[0].y);

        for (let i = 1; i < this.points.length; i++) {
            const point = this.points[i];
            const prevPoint = this.points[i - 1];

            if (point.controlPoint1 && prevPoint.controlPoint2) {
                context.bezierCurveTo(
                    prevPoint.controlPoint2.x, prevPoint.controlPoint2.y,
                    point.controlPoint1.x, point.controlPoint1.y,
                    point.x, point.y
                );
            } else {
                context.lineTo(point.x, point.y);
            }
        }

        context.stroke();

        // Draw points and control handles
        this.points.forEach((point, index) => {
            // Draw anchor point
            context.fillStyle = this.selectedPoint === index ? '#ff0000' : '#000000';
            context.beginPath();
            context.arc(point.x, point.y, 5, 0, Math.PI * 2);
            context.fill();

            // Draw control points and handles
            if (point.controlPoint1) {
                this.drawControlPoint(context, point.controlPoint1, index, 1);
            }
            if (point.controlPoint2) {
                this.drawControlPoint(context, point.controlPoint2, index, 2);
            }
        });

        context.restore();
    }

    drawControlPoint(context, point, anchorIndex, controlIndex) {
        // Draw control point
        context.fillStyle = this.selectedControlPoint === `${anchorIndex}-${controlIndex}` ? '#ff0000' : '#666666';
        context.beginPath();
        context.arc(point.x, point.y, 4, 0, Math.PI * 2);
        context.fill();

        // Draw handle line
        const anchorPoint = this.points[anchorIndex];
        context.strokeStyle = '#666666';
        context.setLineDash([2, 2]);
        context.beginPath();
        context.moveTo(anchorPoint.x, anchorPoint.y);
        context.lineTo(point.x, point.y);
        context.stroke();
        context.setLineDash([]);
    }

    movePoint(event, canvas) {
        if (!this.selectedPoint && !this.selectedControlPoint) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.selectedPoint !== null) {
            // Move anchor point
            const point = this.points[this.selectedPoint];
            const dx = x - point.x;
            const dy = y - point.y;

            point.x = x;
            point.y = y;

            // Move associated control points
            if (point.controlPoint1) {
                point.controlPoint1.x += dx;
                point.controlPoint1.y += dy;
            }
            if (point.controlPoint2) {
                point.controlPoint2.x += dx;
                point.controlPoint2.y += dy;
            }
        } else if (this.selectedControlPoint) {
            // Move control point
            const [anchorIndex, controlIndex] = this.selectedControlPoint.split('-');
            const point = this.points[anchorIndex];
            const controlPoint = controlIndex === '1' ? point.controlPoint1 : point.controlPoint2;

            if (controlPoint) {
                controlPoint.x = x;
                controlPoint.y = y;
            }
        }
    }

    selectPoint(event, canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check for control point selection first
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            if (point.controlPoint1 && this.isPointNear(x, y, point.controlPoint1)) {
                this.selectedControlPoint = `${i}-1`;
                this.selectedPoint = null;
                return;
            }
            if (point.controlPoint2 && this.isPointNear(x, y, point.controlPoint2)) {
                this.selectedControlPoint = `${i}-2`;
                this.selectedPoint = null;
                return;
            }
        }

        // Check for anchor point selection
        for (let i = 0; i < this.points.length; i++) {
            if (this.isPointNear(x, y, this.points[i])) {
                this.selectedPoint = i;
                this.selectedControlPoint = null;
                return;
            }
        }

        // No point selected
        this.selectedPoint = null;
        this.selectedControlPoint = null;
    }

    isPointNear(x, y, point) {
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        return distance < 10;
    }

    finishDrawing() {
        if (this.points.length > 1) {
            const path = {
                id: generateId(),
                type: 'bezier',
                points: this.points,
                stroke: this.stateManager.getState().currentColor,
                strokeWidth: this.stateManager.getState().currentStrokeWidth
            };

            this.layerManager.addLayer(path);
            this.stateManager.saveState();
        }

        this.points = [];
        this.isDrawing = false;
        this.selectedPoint = null;
        this.selectedControlPoint = null;
    }

    cleanup() {
        this.points = [];
        this.isDrawing = false;
        this.selectedPoint = null;
        this.selectedControlPoint = null;
    }
} 