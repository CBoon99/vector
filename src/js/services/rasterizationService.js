import { COMPLEXITY_THRESHOLDS } from '../constants/features.js';
import { ErrorHandler } from '../utils/errorHandler.js';

class RasterizationService {
    constructor() {
        this.complexityMetrics = {
            pathPoints: COMPLEXITY_THRESHOLDS.PATH_POINTS,
            polygonSides: COMPLEXITY_THRESHOLDS.POLYGON_SIDES,
            bezierCurves: 5,
            gradientStops: 8,
            filterEffects: 3
        };
    }

    isObjectComplex(object) {
        try {
            switch (object.type) {
                case 'path':
                    return this.isPathComplex(object);
                case 'polygon':
                    return this.isPolygonComplex(object);
                case 'shape':
                    return this.isShapeComplex(object);
                default:
                    return false;
            }
        } catch (error) {
            ErrorHandler.handle(error, 'isObjectComplex');
            return false;
        }
    }

    isPathComplex(path) {
        if (!path.points) return false;
        
        const pointCount = path.points.length;
        const bezierCount = path.points.filter(p => p.type === 'bezier').length;
        
        return pointCount > this.complexityMetrics.pathPoints || 
               bezierCount > this.complexityMetrics.bezierCurves;
    }

    isPolygonComplex(polygon) {
        if (!polygon.sides) return false;
        
        return polygon.sides > this.complexityMetrics.polygonSides;
    }

    isShapeComplex(shape) {
        if (!shape.effects) return false;
        
        const hasComplexGradient = shape.fill?.type === 'gradient' && 
                                 shape.fill.stops?.length > this.complexityMetrics.gradientStops;
                                 
        const hasComplexFilters = shape.filters?.length > this.complexityMetrics.filterEffects;
        
        return hasComplexGradient || hasComplexFilters;
    }

    async rasterizeObject(object, canvas) {
        try {
            if (!this.isObjectComplex(object)) {
                return null;
            }

            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            
            // Set canvas size to match object bounds
            tempCanvas.width = object.bounds.width;
            tempCanvas.height = object.bounds.height;
            
            // Draw object to temporary canvas
            this.drawObjectToCanvas(object, ctx);
            
            // Create image from canvas
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = tempCanvas.toDataURL();
            });
        } catch (error) {
            ErrorHandler.handle(error, 'rasterizeObject');
            return null;
        }
    }

    drawObjectToCanvas(object, ctx) {
        // Save context state
        ctx.save();
        
        // Apply transformations
        ctx.translate(object.x, object.y);
        ctx.rotate(object.rotation);
        ctx.scale(object.scaleX, object.scaleY);
        
        // Draw based on object type
        switch (object.type) {
            case 'path':
                this.drawPath(ctx, object);
                break;
            case 'polygon':
                this.drawPolygon(ctx, object);
                break;
            case 'shape':
                this.drawShape(ctx, object);
                break;
        }
        
        // Restore context state
        ctx.restore();
    }

    drawPath(ctx, path) {
        if (!path.points?.length) return;
        
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        
        for (let i = 1; i < path.points.length; i++) {
            const point = path.points[i];
            if (point.type === 'bezier') {
                ctx.bezierCurveTo(
                    point.cp1x, point.cp1y,
                    point.cp2x, point.cp2y,
                    point.x, point.y
                );
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        
        if (path.closed) {
            ctx.closePath();
        }
        
        this.applyStyle(ctx, path);
    }

    drawPolygon(ctx, polygon) {
        if (!polygon.sides) return;
        
        const centerX = polygon.width / 2;
        const centerY = polygon.height / 2;
        const radius = Math.min(polygon.width, polygon.height) / 2;
        
        ctx.beginPath();
        for (let i = 0; i < polygon.sides; i++) {
            const angle = (i * 2 * Math.PI) / polygon.sides;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        this.applyStyle(ctx, polygon);
    }

    drawShape(ctx, shape) {
        if (!shape.type) return;

        // Save context state for shape-specific transformations
        ctx.save();

        // Apply shape-specific transformations
        if (shape.transform) {
            const { x, y, rotation, scaleX, scaleY } = shape.transform;
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.scale(scaleX, scaleY);
        }

        // Draw based on shape type
        switch (shape.type) {
            case 'rectangle':
                this.drawRectangle(ctx, shape);
                break;
            case 'circle':
                this.drawCircle(ctx, shape);
                break;
            case 'ellipse':
                this.drawEllipse(ctx, shape);
                break;
            case 'star':
                this.drawStar(ctx, shape);
                break;
            default:
                console.warn(`Unsupported shape type: ${shape.type}`);
        }

        // Restore context state
        ctx.restore();
    }

    drawRectangle(ctx, shape) {
        const { width, height, cornerRadius = 0 } = shape;
        
        if (cornerRadius > 0) {
            // Draw rounded rectangle
            ctx.beginPath();
            ctx.moveTo(cornerRadius, 0);
            ctx.lineTo(width - cornerRadius, 0);
            ctx.quadraticCurveTo(width, 0, width, cornerRadius);
            ctx.lineTo(width, height - cornerRadius);
            ctx.quadraticCurveTo(width, height, width - cornerRadius, height);
            ctx.lineTo(cornerRadius, height);
            ctx.quadraticCurveTo(0, height, 0, height - cornerRadius);
            ctx.lineTo(0, cornerRadius);
            ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
            ctx.closePath();
        } else {
            // Draw regular rectangle
            ctx.beginPath();
            ctx.rect(0, 0, width, height);
            ctx.closePath();
        }

        this.applyStyle(ctx, shape);
    }

    drawCircle(ctx, shape) {
        const { radius } = shape;
        
        ctx.beginPath();
        ctx.arc(radius, radius, radius, 0, Math.PI * 2);
        ctx.closePath();
        
        this.applyStyle(ctx, shape);
    }

    drawEllipse(ctx, shape) {
        const { width, height } = shape;
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.closePath();
        
        this.applyStyle(ctx, shape);
    }

    drawStar(ctx, shape) {
        const { points, innerRadius, outerRadius } = shape;
        const centerX = outerRadius;
        const centerY = outerRadius;
        
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        
        this.applyStyle(ctx, shape);
    }

    applyStyle(ctx, object) {
        // Apply fill
        if (object.fill) {
            if (typeof object.fill === 'string') {
                ctx.fillStyle = object.fill;
            } else if (object.fill.type === 'gradient') {
                const gradient = this.createGradient(ctx, object.fill);
                ctx.fillStyle = gradient;
            }
            ctx.fill();
        }
        
        // Apply stroke
        if (object.stroke) {
            ctx.strokeStyle = object.stroke.color;
            ctx.lineWidth = object.stroke.width;
            if (object.stroke.dashArray) {
                ctx.setLineDash(object.stroke.dashArray);
            }
            ctx.stroke();
        }
        
        // Apply filters
        if (object.filters) {
            this.applyFilters(ctx, object.filters);
        }
    }

    createGradient(ctx, gradient) {
        const { type, stops, start, end } = gradient;
        
        let gradientObj;
        if (type === 'linear') {
            gradientObj = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        } else if (type === 'radial') {
            const { innerRadius, outerRadius } = gradient;
            gradientObj = ctx.createRadialGradient(
                start.x, start.y, innerRadius,
                end.x, end.y, outerRadius
            );
        }
        
        stops.forEach(stop => {
            gradientObj.addColorStop(stop.position, stop.color);
        });
        
        return gradientObj;
    }

    applyFilters(ctx, filters) {
        filters.forEach(filter => {
            switch (filter.type) {
                case 'blur':
                    ctx.filter = `blur(${filter.radius}px)`;
                    break;
                case 'brightness':
                    ctx.filter = `brightness(${filter.value}%)`;
                    break;
                case 'contrast':
                    ctx.filter = `contrast(${filter.value}%)`;
                    break;
                case 'opacity':
                    ctx.globalAlpha = filter.value;
                    break;
            }
        });
    }
}

export default new RasterizationService(); 