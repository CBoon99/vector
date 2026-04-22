// Boolean Operations for Shape Manipulation
class BooleanOperations {
    constructor() {
        this.operations = {
            union: this.union.bind(this),
            subtract: this.subtract.bind(this),
            intersect: this.intersect.bind(this),
            exclude: this.exclude.bind(this)
        };
    }

    // Main Operation Interface
    performOperation(operation, shape1, shape2) {
        if (!this.operations[operation]) {
            throw new Error(`Unknown operation: ${operation}`);
        }

        // Convert shapes to paths if they aren't already
        const path1 = this.shapeToPath(shape1);
        const path2 = this.shapeToPath(shape2);

        // Perform the boolean operation
        const result = this.operations[operation](path1, path2);

        // Convert the result back to a shape
        return this.pathToShape(result, shape1);
    }

    // Boolean Operations
    union(path1, path2) {
        const result = new Path2D();
        
        // Combine the paths
        result.addPath(path1);
        result.addPath(path2);

        // Remove overlapping areas
        this.removeOverlaps(result);

        return result;
    }

    subtract(path1, path2) {
        const result = new Path2D();
        
        // Start with the first path
        result.addPath(path1);

        // Create a hole using the second path
        const hole = new Path2D(path2);
        hole.closePath();
        result.addPath(hole, { winding: 'evenodd' });

        return result;
    }

    intersect(path1, path2) {
        const result = new Path2D();
        
        // Create a temporary path for the intersection
        const temp = new Path2D();
        temp.addPath(path1);
        temp.addPath(path2, { winding: 'evenodd' });

        // Get the intersection points
        const points = this.getIntersectionPoints(path1, path2);

        // Create the intersection path
        if (points.length > 0) {
            result.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                result.lineTo(points[i].x, points[i].y);
            }
            result.closePath();
        }

        return result;
    }

    exclude(path1, path2) {
        const result = new Path2D();
        
        // Create the union
        const union = this.union(path1, path2);
        
        // Create the intersection
        const intersection = this.intersect(path1, path2);
        
        // Subtract the intersection from the union
        result.addPath(union);
        result.addPath(intersection, { winding: 'evenodd' });

        return result;
    }

    // Path Manipulation
    shapeToPath(shape) {
        const path = new Path2D();

        switch (shape.type) {
            case 'rect':
                path.rect(shape.x, shape.y, shape.width, shape.height);
                break;
            case 'circle':
                path.arc(
                    shape.x + shape.width / 2,
                    shape.y + shape.height / 2,
                    Math.min(shape.width, shape.height) / 2,
                    0,
                    Math.PI * 2
                );
                break;
            case 'polygon':
                if (shape.points && shape.points.length > 0) {
                    path.moveTo(shape.points[0].x, shape.points[0].y);
                    for (let i = 1; i < shape.points.length; i++) {
                        path.lineTo(shape.points[i].x, shape.points[i].y);
                    }
                    path.closePath();
                }
                break;
            case 'path':
                path.addPath(new Path2D(shape.d));
                break;
            default:
                throw new Error(`Unsupported shape type: ${shape.type}`);
        }

        return path;
    }

    pathToShape(path, originalShape) {
        // Create a new shape based on the original shape's properties
        const newShape = {
            ...originalShape,
            type: 'path',
            d: path.toString()
        };

        // Calculate the bounding box
        const bbox = this.getPathBoundingBox(path);
        newShape.x = bbox.x;
        newShape.y = bbox.y;
        newShape.width = bbox.width;
        newShape.height = bbox.height;

        return newShape;
    }

    // Utility Methods
    removeOverlaps(path) {
        // This is a simplified version - in a real implementation,
        // you would need to use a more sophisticated algorithm
        // to properly handle overlapping areas
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.fill(path);
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Create a new path from the non-overlapping areas
        const newPath = new Path2D();
        // ... process imageData to create new path
        return newPath;
    }

    getIntersectionPoints(path1, path2) {
        const points = [];
        const ctx = document.createElement('canvas').getContext('2d');
        
        // Draw both paths
        ctx.stroke(path1);
        ctx.stroke(path2);
        
        // Get the intersection points
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        // ... process imageData to find intersection points
        return points;
    }

    getPathBoundingBox(path) {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.stroke(path);
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        // Find the bounding box
        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
                const i = (y * imageData.width + x) * 4;
                if (imageData.data[i + 3] > 0) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
}

export default BooleanOperations; 