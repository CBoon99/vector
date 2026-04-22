// Polygon Tool with Star Shape Support
export class PolygonTool {
    constructor(stateManager, layerManager) {
        this.stateManager = stateManager;
        this.layerManager = layerManager;
        this.currentShape = null;
        this.options = {
            sides: 5,
            radius: 50,
            starRatio: 0.5,
            rotation: 0,
            strokeWidth: 1,
            strokeStyle: 'solid',
            fill: 'transparent',
            isStar: false
        };
    }

    // Tool Interface
    startDrawing(event, canvas, context) {
        const center = this.getCanvasPoint(event, canvas);
        
        this.currentShape = {
            type: 'polygon',
            center: center,
            sides: this.options.sides,
            radius: this.options.radius,
            starRatio: this.options.starRatio,
            rotation: this.options.rotation,
            stroke: this.stateManager.getState().currentColor,
            fill: this.options.fill,
            strokeWidth: this.options.strokeWidth,
            strokeStyle: this.options.strokeStyle,
            isStar: this.options.isStar
        };
    }

    draw(event, canvas, context) {
        if (!this.currentShape) return;

        const point = this.getCanvasPoint(event, canvas);
        const center = this.currentShape.center;
        
        // Calculate radius based on distance from center
        this.currentShape.radius = Math.sqrt(
            Math.pow(point.x - center.x, 2) +
            Math.pow(point.y - center.y, 2)
        );
        
        // Calculate rotation based on angle from center
        this.currentShape.rotation = Math.atan2(
            point.y - center.y,
            point.x - center.x
        );
        
        this.drawShape(context);
    }

    stopDrawing(event, canvas, context) {
        if (this.currentShape) {
            this.layerManager.addObject(this.currentShape);
            this.stateManager.saveHistory();
        }
        this.currentShape = null;
    }

    // Shape Drawing
    drawShape(context) {
        if (!this.currentShape) return;
        if (!context) {
            console.warn('Invalid canvas context provided to drawShape');
            return;
        }

        try {
            context.save();
            context.beginPath();
            
            const { center, sides, radius, starRatio, rotation, isStar } = this.currentShape;
            const angleStep = (Math.PI * 2) / sides;
            
            // Calculate points
            const points = [];
            for (let i = 0; i < sides; i++) {
                const angle = rotation + i * angleStep;
                const r = isStar && i % 2 === 1 ? radius * starRatio : radius;
                
                points.push({
                    x: center.x + Math.cos(angle) * r,
                    y: center.y + Math.sin(angle) * r
                });
            }
            
            // Draw shape
            context.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                context.lineTo(points[i].x, points[i].y);
            }
            context.closePath();
            
            // Apply styles
            if (this.currentShape.fill !== 'transparent') {
                context.fillStyle = this.currentShape.fill;
                context.fill();
            }
            
            context.strokeStyle = this.currentShape.stroke;
            context.lineWidth = this.currentShape.strokeWidth;
            
            // Apply stroke style
            if (this.currentShape.strokeStyle === 'dashed') {
                context.setLineDash([5, 5]);
            } else if (this.currentShape.strokeStyle === 'dotted') {
                context.setLineDash([2, 2]);
            }
            
            context.stroke();
            context.restore();
            
        } catch (error) {
            console.error('Error drawing polygon shape:', error);
        }
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

    setOption(key, value) {
        if (this.options.hasOwnProperty(key)) {
            this.options[key] = value;
        }
    }

    getOptions() {
        return { ...this.options };
    }

    // Shape Manipulation
    rotateShape(angle) {
        if (this.currentShape) {
            this.currentShape.rotation += angle;
            this.drawShape(this.context);
        }
    }

    scaleShape(factor) {
        if (this.currentShape) {
            this.currentShape.radius *= factor;
            this.drawShape(this.context);
        }
    }

    cancelDrawing() {
        this.currentShape = null;
    }

    // State Management
    saveState() {
        return {
            options: { ...this.options },
            currentShape: this.currentShape ? { ...this.currentShape } : null
        };
    }

    loadState(state) {
        if (state.options) {
            this.options = { ...state.options };
        }
        if (state.currentShape) {
            this.currentShape = { ...state.currentShape };
        }
    }
}
