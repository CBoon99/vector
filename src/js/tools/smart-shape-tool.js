import { Tool } from './tool.js';

class SmartShapeTool extends Tool {
    constructor() {
        super('Smart Shape', '🔍', 'crosshair');
        this.points = [];
        this.isDrawing = false;
        this.recognitionThreshold = 0.85; // Confidence threshold for shape recognition
        this.shapeTypes = ['rectangle', 'circle', 'triangle', 'polygon'];
    }

    startDrawing(event, canvas, context) {
        this.isDrawing = true;
        this.points = [this.getCanvasPoint(event)];
        this.draw(event, canvas, context);
    }

    draw(event, canvas, context) {
        if (!this.isDrawing) return;

        const currentPoint = this.getCanvasPoint(event);
        this.points.push(currentPoint);

        // Clear previous drawing
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the current path
        context.beginPath();
        context.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            context.lineTo(this.points[i].x, this.points[i].y);
        }
        context.strokeStyle = '#00ff00';
        context.lineWidth = 2;
        context.stroke();

        // Show real-time shape recognition
        const recognizedShape = this.recognizeShape(this.points);
        if (recognizedShape) {
            this.drawRecognizedShape(context, recognizedShape);
        }
    }

    finishDrawing(event, canvas, context) {
        if (!this.isDrawing) return;
        
        const recognizedShape = this.recognizeShape(this.points);
        if (recognizedShape && recognizedShape.confidence > this.recognitionThreshold) {
            this.createShape(recognizedShape);
        }
        
        this.cleanup();
    }

    recognizeShape(points) {
        if (points.length < 3) return null;

        // Calculate basic shape properties
        const bounds = this.calculateBounds(points);
        const center = {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2
        };
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        const aspectRatio = width / height;

        // Calculate shape signatures
        const signatures = {
            rectangle: this.calculateRectangleSignature(points, bounds),
            circle: this.calculateCircleSignature(points, center, Math.max(width, height) / 2),
            triangle: this.calculateTriangleSignature(points),
            polygon: this.calculatePolygonSignature(points)
        };

        // Find the best match
        let bestMatch = null;
        let highestConfidence = 0;

        for (const [type, signature] of Object.entries(signatures)) {
            if (signature > highestConfidence) {
                highestConfidence = signature;
                bestMatch = {
                    type,
                    confidence: signature,
                    bounds,
                    center,
                    width,
                    height,
                    aspectRatio
                };
            }
        }

        return bestMatch;
    }

    calculateBounds(points) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        points.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });

        return { minX, minY, maxX, maxY };
    }

    calculateRectangleSignature(points, bounds) {
        // Check if points form a rectangle-like shape
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        const aspectRatio = width / height;

        // Calculate how well points align with rectangle edges
        const edgeAlignment = points.reduce((score, point) => {
            const isOnEdge = 
                Math.abs(point.x - bounds.minX) < 5 ||
                Math.abs(point.x - bounds.maxX) < 5 ||
                Math.abs(point.y - bounds.minY) < 5 ||
                Math.abs(point.y - bounds.maxY) < 5;
            return score + (isOnEdge ? 1 : 0);
        }, 0) / points.length;

        return edgeAlignment * 0.8 + (aspectRatio > 0.5 && aspectRatio < 2 ? 0.2 : 0);
    }

    calculateCircleSignature(points, center, radius) {
        // Check if points form a circle-like shape
        const radiusVariance = points.reduce((variance, point) => {
            const distance = Math.sqrt(
                Math.pow(point.x - center.x, 2) + 
                Math.pow(point.y - center.y, 2)
            );
            return variance + Math.abs(distance - radius) / radius;
        }, 0) / points.length;

        return 1 - Math.min(radiusVariance, 1);
    }

    calculateTriangleSignature(points) {
        if (points.length < 3) return 0;

        // Find the three most distant points
        const corners = this.findTriangleCorners(points);
        if (!corners) return 0;

        // Calculate how well other points align with triangle edges
        const edgeAlignment = points.reduce((score, point) => {
            const isOnEdge = this.isPointNearTriangleEdge(point, corners);
            return score + (isOnEdge ? 1 : 0);
        }, 0) / points.length;

        return edgeAlignment;
    }

    calculatePolygonSignature(points) {
        // Check if points form a regular polygon
        const center = {
            x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
            y: points.reduce((sum, p) => sum + p.y, 0) / points.length
        };

        const angles = points.map(point => 
            Math.atan2(point.y - center.y, point.x - center.x)
        ).sort((a, b) => a - b);

        const angleDifferences = [];
        for (let i = 1; i < angles.length; i++) {
            angleDifferences.push(angles[i] - angles[i-1]);
        }

        const averageDifference = angleDifferences.reduce((a, b) => a + b) / angleDifferences.length;
        const variance = angleDifferences.reduce((v, d) => v + Math.pow(d - averageDifference, 2), 0) / angleDifferences.length;

        return 1 - Math.min(variance, 1);
    }

    findTriangleCorners(points) {
        // Find the three points that form the largest triangle
        let maxArea = 0;
        let bestCorners = null;

        for (let i = 0; i < points.length - 2; i++) {
            for (let j = i + 1; j < points.length - 1; j++) {
                for (let k = j + 1; k < points.length; k++) {
                    const area = this.calculateTriangleArea(points[i], points[j], points[k]);
                    if (area > maxArea) {
                        maxArea = area;
                        bestCorners = [points[i], points[j], points[k]];
                    }
                }
            }
        }

        return bestCorners;
    }

    calculateTriangleArea(a, b, c) {
        return Math.abs(
            (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2
        );
    }

    isPointNearTriangleEdge(point, corners) {
        const threshold = 5;
        for (let i = 0; i < 3; i++) {
            const start = corners[i];
            const end = corners[(i + 1) % 3];
            if (this.distanceToLine(point, start, end) < threshold) {
                return true;
            }
        }
        return false;
    }

    distanceToLine(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    drawRecognizedShape(context, shape) {
        context.save();
        context.strokeStyle = '#ff0000';
        context.lineWidth = 2;
        context.setLineDash([5, 5]);

        switch (shape.type) {
            case 'rectangle':
                context.strokeRect(
                    shape.bounds.minX,
                    shape.bounds.minY,
                    shape.width,
                    shape.height
                );
                break;
            case 'circle':
                context.beginPath();
                context.arc(
                    shape.center.x,
                    shape.center.y,
                    Math.max(shape.width, shape.height) / 2,
                    0,
                    Math.PI * 2
                );
                context.stroke();
                break;
            case 'triangle':
                const corners = this.findTriangleCorners(this.points);
                if (corners) {
                    context.beginPath();
                    context.moveTo(corners[0].x, corners[0].y);
                    context.lineTo(corners[1].x, corners[1].y);
                    context.lineTo(corners[2].x, corners[2].y);
                    context.closePath();
                    context.stroke();
                }
                break;
            case 'polygon':
                // Draw the recognized polygon
                context.beginPath();
                context.moveTo(this.points[0].x, this.points[0].y);
                for (let i = 1; i < this.points.length; i++) {
                    context.lineTo(this.points[i].x, this.points[i].y);
                }
                context.closePath();
                context.stroke();
                break;
        }

        context.restore();
    }

    createShape(recognizedShape) {
        const shape = {
            id: `shape-${Date.now()}`,
            type: recognizedShape.type,
            x: recognizedShape.bounds.minX,
            y: recognizedShape.bounds.minY,
            width: recognizedShape.width,
            height: recognizedShape.height,
            stroke: '#000000',
            fill: 'transparent',
            strokeWidth: 2
        };

        if (recognizedShape.type === 'circle') {
            shape.radius = Math.max(recognizedShape.width, recognizedShape.height) / 2;
            shape.center = recognizedShape.center;
        }

        this.layerManager.addObject(shape);
        this.stateManager.saveState();
    }

    cleanup() {
        this.isDrawing = false;
        this.points = [];
    }
}

export default SmartShapeTool; 