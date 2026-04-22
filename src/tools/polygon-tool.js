// Polygon Tool with Star Shape Support
class PolygonTool {
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
            context.strokeStyle = this.currentShape.stroke;
            context.lineWidth = this.currentShape.strokeWidth;
            context.setLineDash(
                this.currentShape.strokeStyle === 'dashed' ? [5, 5] :
                this.currentShape.strokeStyle === 'dotted' ? [2, 2] : []
            );
            context.stroke();
            
            if (this.currentShape.fill !== 'transparent') {
                context.fillStyle = this.currentShape.fill;
                context.fill();
            }
        } catch (error) {
            console.error('Error drawing shape:', error);
        } finally {
            context.restore();
        }
    }

    // Shape Manipulation
    rotateShape(angle) {
        if (this.currentShape) {
            this.currentShape.rotation += angle;
        }
    }

    scaleShape(factor) {
        if (this.currentShape) {
            this.currentShape.radius *= factor;
        }
    }

    // Utility Methods
    getCanvasPoint(event, canvas) {
        if (!event || !canvas) {
            console.warn('Invalid event or canvas provided to getCanvasPoint');
            return { x: 0, y: 0 };
        }

        try {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            // Validate event coordinates
            const x = typeof event.clientX === 'number' ? event.clientX : 0;
            const y = typeof event.clientY === 'number' ? event.clientY : 0;
            
            return {
                x: (x - rect.left) * scaleX,
                y: (y - rect.top) * scaleY
            };
        } catch (error) {
            console.error('Error calculating canvas point:', error);
            return { x: 0, y: 0 };
        }
    }

    // Tool Options
    getOptions() {
        return this.options;
    }

    setOption(option, value) {
        if (this.options.hasOwnProperty(option)) {
            // Validate values before setting
            switch (option) {
                case 'sides':
                    value = Math.max(3, Math.min(20, Math.floor(value)));
                    break;
                case 'radius':
                    value = Math.max(1, value);
                    break;
                case 'starRatio':
                    value = Math.max(0.1, Math.min(0.9, value));
                    break;
                case 'strokeWidth':
                    value = Math.max(0.5, value);
                    break;
                case 'strokeStyle':
                    if (!['solid', 'dashed', 'dotted'].includes(value)) {
                        value = 'solid';
                    }
                    break;
            }
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
        if (!state || !state.options) {
            console.warn('Invalid state provided to loadState');
            return;
        }

        try {
            const validOptions = {};
            Object.entries(this.options).forEach(([key, defaultValue]) => {
                const value = state.options[key];
                if (value !== undefined) {
                    // Validate each option value
                    switch (key) {
                        case 'sides':
                            validOptions[key] = Math.max(3, Math.min(20, Math.floor(value)));
                            break;
                        case 'radius':
                            validOptions[key] = Math.max(1, value);
                            break;
                        case 'starRatio':
                            validOptions[key] = Math.max(0.1, Math.min(0.9, value));
                            break;
                        case 'strokeWidth':
                            validOptions[key] = Math.max(0.5, value);
                            break;
                        case 'strokeStyle':
                            validOptions[key] = ['solid', 'dashed', 'dotted'].includes(value) ? value : 'solid';
                            break;
                        default:
                            validOptions[key] = value;
                    }
                } else {
                    validOptions[key] = defaultValue;
                }
            });
            this.options = validOptions;
        } catch (error) {
            console.error('Error loading state:', error);
            // Reset to default options
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
    }

    // Tool Interface
    getCursor() {
        return 'crosshair';
    }

    cancelDrawing() {
        if (this.currentShape) {
            this.currentShape = null;
            if (this.layerManager) {
                this.layerManager.removeObject(this.currentShape);
            }
        }
    }
}

export default PolygonTool; 