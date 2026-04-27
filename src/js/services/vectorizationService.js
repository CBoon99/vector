import { ErrorHandler, DrawingError } from '../utils/errorHandler.js';
import { generateId } from '../utils/id-generator.js';
import capabilityService from './capabilityService.js';

class VectorizationService {
    constructor() {
        this.qualitySettings = {
            low: {
                edgeThreshold: 30,
                minPathLength: 10,
                simplifyTolerance: 2,
                colorQuantization: 8
            },
            medium: {
                edgeThreshold: 24,
                minPathLength: 2,
                simplifyTolerance: 1.5,
                colorQuantization: 16
            },
            high: {
                edgeThreshold: 10,
                minPathLength: 2,
                simplifyTolerance: 0.5,
                colorQuantization: 32
            }
        };

        // Listen for capability changes
        window.addEventListener('capabilityChange', (event) => {
            this.handleCapabilityChange(event.detail);
        });
    }

    handleCapabilityChange({ type, capabilities }) {
        if (type === 'device' || type === 'connection') {
            this.updateQualitySettings();
        }
    }

    updateQualitySettings() {
        if (capabilityService.capabilities.device.isLowEnd || 
            capabilityService.capabilities.connection.isLowBandwidth) {
            this.currentQuality = 'low';
        } else {
            this.currentQuality = 'medium';
        }
    }

    async vectorizeImage(image, quality = 'medium') {
        try {
            // Check if high quality vectorization is possible
            if (quality === 'high' && !capabilityService.canPerformOperation('highQualityVectorization')) {
                quality = 'medium';
            }

            const settings = this.getOptimizedSettings(quality);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new DrawingError('Canvas 2D not available for vectorization');
            }

            let w = image.naturalWidth || image.width || 1;
            let h = image.naturalHeight || image.height || 1;
            const maxEdge = 200;
            if (Math.max(w, h) > maxEdge) {
                const s = maxEdge / Math.max(w, h);
                w = Math.max(1, Math.floor(w * s));
                h = Math.max(1, Math.floor(h * s));
            }
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(image, 0, 0, w, h);

            const imageData = ctx.getImageData(0, 0, w, h);

            const edges = await this.detectEdges(imageData, settings);
            const paths = await this.tracePaths(edges, w, h, settings);
            const shapes = await this.detectShapes(paths, settings);
            const colors = await this.quantizeColors(imageData, settings);

            // Create vector objects from shapes and colors
            const vectorObjects = this.createVectorObjects(shapes, colors);

            return vectorObjects;
        } catch (error) {
            ErrorHandler.handle(error, 'VectorizationService.vectorizeImage');
            throw new DrawingError('Failed to vectorize image');
        }
    }

    getOptimizedSettings(quality) {
        const baseSettings = this.qualitySettings[quality] || this.qualitySettings.medium;
        const optimizedSettings = capabilityService.getOptimizedSettings('highQualityVectorization');
        
        return {
            ...baseSettings,
            ...optimizedSettings
        };
    }

    async detectEdges(imageData, settings) {
        const { width, height, data } = imageData;
        const edges = new Uint8ClampedArray(width * height);
        const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

        // Convert to grayscale
        const grayscale = new Uint8ClampedArray(width * height);
        for (let i = 0; i < data.length; i += 4) {
            grayscale[i / 4] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        }

        // Apply Sobel operator
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0;
                let gy = 0;

                // Apply convolution
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (y + ky) * width + (x + kx);
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);
                        gx += grayscale[idx] * sobelX[kernelIdx];
                        gy += grayscale[idx] * sobelY[kernelIdx];
                    }
                }

                // Calculate gradient magnitude
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                edges[y * width + x] = magnitude > settings.edgeThreshold ? 255 : 0;
            }
        }

        // NMS removed: prior implementation used out-of-scope gx/gy. Raw Sobel edges are sufficient for path tracing.
        return edges;
    }

    async tracePaths(edges, width, height, settings) {
        const visited = new Set();
        const paths = [];

        // Find starting points (edge pixels)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (edges[idx] > 0 && !visited.has(idx)) {
                    const path = this.tracePath(edges, visited, x, y, width, height, settings);
                    if (path.length >= settings.minPathLength) {
                        paths.push(this.simplifyPath(path, settings.simplifyTolerance));
                    }
                }
            }
        }

        return paths;
    }

    tracePath(edges, visited, startX, startY, width, height, settings) {
        const path = [];
        let x = startX;
        let y = startY;
        let idx = y * width + x;

        while (edges[idx] > 0 && !visited.has(idx)) {
            path.push({ x, y });
            visited.add(idx);

            // Find next pixel using 8-directional search
            let nextX = x;
            let nextY = y;
            let maxGradient = 0;

            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;

                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

                    const nidx = ny * width + nx;
                    if (edges[nidx] > maxGradient && !visited.has(nidx)) {
                        maxGradient = edges[nidx];
                        nextX = nx;
                        nextY = ny;
                    }
                }
            }

            if (maxGradient === 0) break;
            x = nextX;
            y = nextY;
            idx = y * width + x;
        }

        return path;
    }

    simplifyPath(path, tolerance) {
        if (path.length <= 2) return path;

        // Ensure tolerance is non-negative to prevent infinite recursion
        tolerance = Math.max(0, tolerance);

        const findPerpendicularDistance = (point, lineStart, lineEnd) => {
            const dx = lineEnd.x - lineStart.x;
            const dy = lineEnd.y - lineStart.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length === 0) return 0;

            const cross = Math.abs(
                (dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / length
            );
            return cross;
        };

        const douglasPeucker = (points, start, end, tolerance, result) => {
            if (end - start <= 1) return;

            let maxDistance = 0;
            let maxIndex = start;

            for (let i = start + 1; i < end; i++) {
                const distance = findPerpendicularDistance(points[i], points[start], points[end]);
                if (distance > maxDistance) {
                    maxDistance = distance;
                    maxIndex = i;
                }
            }

            if (maxDistance > tolerance) {
                result.add(maxIndex);
                douglasPeucker(points, start, maxIndex, tolerance, result);
                douglasPeucker(points, maxIndex, end, tolerance, result);
            }
        };

        const result = new Set([0, path.length - 1]);
        douglasPeucker(path, 0, path.length - 1, tolerance, result);
        return Array.from(result).sort((a, b) => a - b).map(i => path[i]);
    }

    async detectShapes(paths, settings) {
        const shapes = [];

        for (const path of paths) {
            // Try to fit basic shapes
            const rectangle = this.fitRectangle(path);
            if (rectangle) {
                shapes.push(rectangle);
                continue;
            }

            const circle = this.fitCircle(path);
            if (circle) {
                shapes.push(circle);
                continue;
            }

            const ellipse = this.fitEllipse(path);
            if (ellipse) {
                shapes.push(ellipse);
                continue;
            }

            // If no basic shape fits, create a path
            shapes.push({
                type: 'path',
                points: path,
                isClosed: this.isPathClosed(path)
            });
        }

        return shapes;
    }

    fitRectangle(path) {
        if (path.length < 4) return null;

        // Calculate bounding box
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const point of path) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }

        // Calculate area of bounding box
        const bboxArea = (maxX - minX) * (maxY - minY);
        
        // Calculate area of path using shoelace formula
        let pathArea = 0;
        for (let i = 0; i < path.length; i++) {
            const j = (i + 1) % path.length;
            pathArea += path[i].x * path[j].y;
            pathArea -= path[j].x * path[i].y;
        }
        pathArea = Math.abs(pathArea) / 2;

        // If areas are similar enough, it's a rectangle
        const areaRatio = pathArea / bboxArea;
        if (areaRatio > 0.9) {
            return {
                type: 'rectangle',
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
        }

        return null;
    }

    fitCircle(path) {
        if (path.length < 5) return null;

        // Calculate center using mean of points
        let centerX = 0, centerY = 0;
        for (const point of path) {
            centerX += point.x;
            centerY += point.y;
        }
        centerX /= path.length;
        centerY /= path.length;

        // Calculate average radius
        let totalRadius = 0;
        for (const point of path) {
            const dx = point.x - centerX;
            const dy = point.y - centerY;
            totalRadius += Math.sqrt(dx * dx + dy * dy);
        }
        const radius = totalRadius / path.length;

        // Calculate variance of radius
        let radiusVariance = 0;
        for (const point of path) {
            const dx = point.x - centerX;
            const dy = point.y - centerY;
            const r = Math.sqrt(dx * dx + dy * dy);
            radiusVariance += Math.pow(r - radius, 2);
        }
        radiusVariance /= path.length;

        // If variance is low enough, it's a circle
        const radiusStdDev = Math.sqrt(radiusVariance);
        if (radiusStdDev / radius < 0.1) {
            return {
                type: 'circle',
                cx: centerX,
                cy: centerY,
                radius: radius
            };
        }

        return null;
    }

    fitEllipse(path) {
        if (path.length < 5) return null;

        // Calculate center using mean of points
        let centerX = 0, centerY = 0;
        for (const point of path) {
            centerX += point.x;
            centerY += point.y;
        }
        centerX /= path.length;
        centerY /= path.length;

        // Calculate covariance matrix
        let covXX = 0, covYY = 0, covXY = 0;
        for (const point of path) {
            const dx = point.x - centerX;
            const dy = point.y - centerY;
            covXX += dx * dx;
            covYY += dy * dy;
            covXY += dx * dy;
        }
        covXX /= path.length;
        covYY /= path.length;
        covXY /= path.length;

        // Calculate eigenvalues and eigenvectors
        const trace = covXX + covYY;
        const det = covXX * covYY - covXY * covXY;
        const discriminant = Math.sqrt(trace * trace - 4 * det);
        const lambda1 = (trace + discriminant) / 2;
        const lambda2 = (trace - discriminant) / 2;

        // Calculate major and minor axes
        const majorAxis = Math.sqrt(lambda1);
        const minorAxis = Math.sqrt(lambda2);

        // Calculate rotation angle
        const angle = Math.atan2(covXY, lambda1 - covYY);

        if (majorAxis < 2 || minorAxis < 2) {
            return null;
        }

        return {
            type: 'ellipse',
            cx: centerX,
            cy: centerY,
            rx: majorAxis,
            ry: minorAxis,
            rotation: angle
        };
    }

    isPathClosed(path) {
        if (path.length < 3) return false;

        const first = path[0];
        const last = path[path.length - 1];
        const dx = last.x - first.x;
        const dy = last.y - first.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < 5; // Consider closed if endpoints are within 5 pixels
    }

    async quantizeColors(imageData, settings) {
        const { width, height, data } = imageData;
        const colors = new Map();
        const colorCount = settings.colorQuantization;

        // Count color frequencies
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            const key = `${r},${g},${b},${a}`;
            colors.set(key, (colors.get(key) || 0) + 1);
        }

        // Convert to array and sort by frequency
        const colorArray = Array.from(colors.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, colorCount)
            .map(([color, count]) => {
                const [r, g, b, a] = color.split(',').map(Number);
                return { r, g, b, a, count };
            });

        return colorArray;
    }

    createVectorObjects(shapes, colors) {
        const objects = [];

        for (const shape of shapes) {
            const baseFill =
                shape.type === 'path' ? 'none' : (this.findDominantColor(shape, colors) || '#555555');
            const object = {
                ...shape,
                id: generateId('vec'),
                fill: baseFill,
                stroke: {
                    color: shape.type === 'path' ? '#111111' : '#000000',
                    width: shape.type === 'path' ? 1 : 1
                }
            };
            objects.push(object);
        }

        return objects;
    }

    findDominantColor(shape, colors) {
        // For basic shapes, use the most common color from the quantized palette
        if (colors.length === 0) return '#cccccc';
        return colors[0] ? `rgba(${colors[0].r},${colors[0].g},${colors[0].b},${colors[0].a / 255})` : '#cccccc';
    }

}

export default new VectorizationService(); 