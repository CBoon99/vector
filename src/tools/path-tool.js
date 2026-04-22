// Path Tool with Bezier Curve Support
class PathTool {
    constructor(stateManager, layerManager) {
        this.stateManager = stateManager;
        this.layerManager = layerManager;
        this.currentPath = null;
        this.controlPoints = [];
        this.selectedPoint = null;
        this.selectedControl = null;
        this.options = {
            strokeWidth: 1,
            strokeStyle: 'solid',
            fill: 'transparent',
            tension: 0.5
        };
    }

    // Tool Interface
    startDrawing(event, canvas, context) {
        const point = this.getCanvasPoint(event, canvas);
        
        if (!this.currentPath) {
            // Start new path
            this.currentPath = {
                type: 'path',
                points: [point],
                controlPoints: [],
                closed: false,
                stroke: this.stateManager.getState().currentColor,
                fill: this.options.fill,
                strokeWidth: this.options.strokeWidth,
                strokeStyle: this.options.strokeStyle
            };
            this.controlPoints = [];
        } else {
            // Add point to existing path
            const lastPoint = this.currentPath.points[this.currentPath.points.length - 1];
            const controlPoint = this.calculateControlPoint(lastPoint, point);
            
            this.currentPath.points.push(point);
            this.currentPath.controlPoints.push(controlPoint);
            
            // If we're close to the start point, close the path
            if (this.currentPath.points.length > 2) {
                const startPoint = this.currentPath.points[0];
                const distance = Math.sqrt(
                    Math.pow(point.x - startPoint.x, 2) +
                    Math.pow(point.y - startPoint.y, 2)
                );
                
                if (distance < 10) {
                    this.closePath();
                }
            }
        }
    }

    draw(event, canvas, context) {
        if (!this.currentPath) return;

        const point = this.getCanvasPoint(event, canvas);
        const lastPoint = this.currentPath.points[this.currentPath.points.length - 1];
        
        // Draw the current path
        this.drawPath(context);
        
        // Draw the preview line
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(point.x, point.y);
        context.strokeStyle = this.stateManager.getState().currentColor;
        context.stroke();
        
        // Draw control points
        this.drawControlPoints(context);
    }

    stopDrawing(event, canvas, context) {
        if (this.currentPath && this.currentPath.points.length > 1) {
            this.layerManager.addObject(this.currentPath);
            this.stateManager.saveHistory();
        }
        this.currentPath = null;
        this.controlPoints = [];
    }

    // Path Operations
    closePath() {
        if (this.currentPath && this.currentPath.points.length > 2) {
            this.currentPath.closed = true;
            const startPoint = this.currentPath.points[0];
            const lastPoint = this.currentPath.points[this.currentPath.points.length - 1];
            const controlPoint = this.calculateControlPoint(lastPoint, startPoint);
            this.currentPath.controlPoints.push(controlPoint);
        }
    }

    // Control Point Management
    calculateControlPoint(start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const tension = this.options.tension;
        
        return {
            x: start.x + dx * tension,
            y: start.y + dy * tension
        };
    }

    drawControlPoints(context) {
        if (!this.currentPath) return;

        context.save();
        context.strokeStyle = '#00ff00';
        context.fillStyle = '#00ff00';
        
        this.currentPath.points.forEach((point, index) => {
            // Draw point
            context.beginPath();
            context.arc(point.x, point.y, 4, 0, Math.PI * 2);
            context.fill();
            
            // Draw control point and line if it exists
            if (index < this.currentPath.controlPoints.length) {
                const control = this.currentPath.controlPoints[index];
                context.beginPath();
                context.moveTo(point.x, point.y);
                context.lineTo(control.x, control.y);
                context.stroke();
                
                context.beginPath();
                context.arc(control.x, control.y, 3, 0, Math.PI * 2);
                context.fill();
            }
        });
        
        context.restore();
    }

    // Path Drawing
    drawPath(context) {
        if (!this.currentPath) return;

        context.save();
        context.beginPath();
        
        const points = this.currentPath.points;
        const controls = this.currentPath.controlPoints;
        
        context.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            const prevPoint = points[i - 1];
            const currentPoint = points[i];
            const control = controls[i - 1];
            
            if (control) {
                context.quadraticCurveTo(
                    control.x, control.y,
                    currentPoint.x, currentPoint.y
                );
            } else {
                context.lineTo(currentPoint.x, currentPoint.y);
            }
        }
        
        if (this.currentPath.closed) {
            context.closePath();
        }
        
        context.strokeStyle = this.currentPath.stroke;
        context.lineWidth = this.currentPath.strokeWidth;
        context.setLineDash(this.currentPath.strokeStyle === 'dashed' ? [5, 5] : 
                          this.currentPath.strokeStyle === 'dotted' ? [2, 2] : []);
        context.stroke();
        
        if (this.currentPath.fill !== 'transparent') {
            context.fillStyle = this.currentPath.fill;
            context.fill();
        }
        
        context.restore();
    }

    // Point Selection
    selectPoint(point) {
        this.selectedPoint = point;
        this.selectedControl = null;
    }

    selectControlPoint(point) {
        this.selectedPoint = null;
        this.selectedControl = point;
    }

    // Utility Methods
    getCanvasPoint(event, canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    // Tool Options
    getOptions() {
        return this.options;
    }

    setOption(option, value) {
        if (this.options.hasOwnProperty(option)) {
            this.options[option] = value;
            return true;
        }
        return false;
    }

    // Tool State
    saveState() {
        return {
            options: { ...this.options }
        };
    }

    loadState(state) {
        if (state.options) {
            this.options = { ...state.options };
        }
    }

    // Tool Interface
    getCursor() {
        return 'crosshair';
    }
}

export default PathTool; 