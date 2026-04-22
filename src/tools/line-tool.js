// Line Tool with Arrowhead Support
class LineTool {
    constructor(stateManager, layerManager) {
        this.stateManager = stateManager;
        this.layerManager = layerManager;
        this.currentLine = null;
        this.options = {
            strokeWidth: 1,
            strokeStyle: 'solid',
            startArrow: false,
            endArrow: true,
            arrowSize: 10,
            arrowAngle: Math.PI / 6, // 30 degrees
            arrowStyle: 'filled' // 'filled' or 'outline'
        };
    }

    // Tool Interface
    startDrawing(event, canvas, context) {
        const start = this.getCanvasPoint(event, canvas);
        
        this.currentLine = {
            type: 'line',
            start: start,
            end: start,
            stroke: this.stateManager.getState().currentColor,
            strokeWidth: this.options.strokeWidth,
            strokeStyle: this.options.strokeStyle,
            startArrow: this.options.startArrow,
            endArrow: this.options.endArrow,
            arrowSize: this.options.arrowSize,
            arrowAngle: this.options.arrowAngle,
            arrowStyle: this.options.arrowStyle
        };
    }

    draw(event, canvas, context) {
        if (!this.currentLine) return;

        const point = this.getCanvasPoint(event, canvas);
        this.currentLine.end = point;
        
        this.drawLine(context);
    }

    stopDrawing(event, canvas, context) {
        if (this.currentLine) {
            this.layerManager.addObject(this.currentLine);
            this.stateManager.saveHistory();
        }
        this.currentLine = null;
    }

    // Line Drawing
    drawLine(context) {
        if (!this.currentLine) return;

        context.save();
        context.beginPath();
        
        const { start, end, stroke, strokeWidth, strokeStyle } = this.currentLine;
        
        // Draw the main line
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        
        // Apply line styles
        context.strokeStyle = stroke;
        context.lineWidth = strokeWidth;
        context.setLineDash(
            strokeStyle === 'dashed' ? [5, 5] :
            strokeStyle === 'dotted' ? [2, 2] : []
        );
        context.stroke();
        
        // Draw arrows if enabled
        if (this.currentLine.startArrow) {
            this.drawArrow(context, end, start);
        }
        if (this.currentLine.endArrow) {
            this.drawArrow(context, start, end);
        }
        
        context.restore();
    }

    // Arrow Drawing
    drawArrow(context, from, to) {
        const { arrowSize, arrowAngle, arrowStyle } = this.currentLine;
        
        // Calculate arrow direction
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        
        // Calculate arrow points
        const arrowPoint1 = {
            x: to.x - arrowSize * Math.cos(angle - arrowAngle),
            y: to.y - arrowSize * Math.sin(angle - arrowAngle)
        };
        
        const arrowPoint2 = {
            x: to.x - arrowSize * Math.cos(angle + arrowAngle),
            y: to.y - arrowSize * Math.sin(angle + arrowAngle)
        };
        
        // Draw arrow
        context.beginPath();
        context.moveTo(to.x, to.y);
        context.lineTo(arrowPoint1.x, arrowPoint1.y);
        context.lineTo(arrowPoint2.x, arrowPoint2.y);
        context.closePath();
        
        if (arrowStyle === 'filled') {
            context.fillStyle = this.currentLine.stroke;
            context.fill();
        } else {
            context.strokeStyle = this.currentLine.stroke;
            context.lineWidth = this.currentLine.strokeWidth;
            context.stroke();
        }
    }

    // Line Manipulation
    rotateLine(angle) {
        if (this.currentLine) {
            const center = {
                x: (this.currentLine.start.x + this.currentLine.end.x) / 2,
                y: (this.currentLine.start.y + this.currentLine.end.y) / 2
            };
            
            this.rotatePoint(this.currentLine.start, center, angle);
            this.rotatePoint(this.currentLine.end, center, angle);
        }
    }

    rotatePoint(point, center, angle) {
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        point.x = center.x + dx * cos - dy * sin;
        point.y = center.y + dx * sin + dy * cos;
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

export default LineTool; 