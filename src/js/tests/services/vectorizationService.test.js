import { expect } from 'chai';
import VectorizationService from '../../services/vectorizationService.js';

describe('VectorizationService', () => {
    let service;
    let testCanvas;
    let testCtx;

    beforeEach(() => {
        service = VectorizationService;
        testCanvas = document.createElement('canvas');
        testCanvas.width = 100;
        testCanvas.height = 100;
        testCtx = testCanvas.getContext('2d');
    });

    describe('Edge Detection', () => {
        it('should detect edges in a simple rectangle', async () => {
            // Draw a white rectangle on black background
            testCtx.fillStyle = 'black';
            testCtx.fillRect(0, 0, 100, 100);
            testCtx.fillStyle = 'white';
            testCtx.fillRect(20, 20, 60, 60);

            const imageData = testCtx.getImageData(0, 0, 100, 100);
            const edges = await service.detectEdges(imageData, service.qualitySettings.medium);

            // Check if edges are detected (should be white pixels)
            let edgeCount = 0;
            for (let i = 0; i < edges.length; i++) {
                if (edges[i] > 0) edgeCount++;
            }

            expect(edgeCount).to.be.greaterThan(0);
            expect(edgeCount).to.be.lessThan(10000); // Should not detect too many edges
        });

        it('should handle different quality settings', async () => {
            testCtx.fillStyle = 'black';
            testCtx.fillRect(0, 0, 100, 100);
            testCtx.fillStyle = 'white';
            testCtx.fillRect(20, 20, 60, 60);

            const imageData = testCtx.getImageData(0, 0, 100, 100);
            
            const lowQualityEdges = await service.detectEdges(imageData, service.qualitySettings.low);
            const highQualityEdges = await service.detectEdges(imageData, service.qualitySettings.high);

            let lowQualityCount = 0;
            let highQualityCount = 0;

            for (let i = 0; i < lowQualityEdges.length; i++) {
                if (lowQualityEdges[i] > 0) lowQualityCount++;
                if (highQualityEdges[i] > 0) highQualityCount++;
            }

            expect(highQualityCount).to.be.greaterThan(lowQualityCount);
        });
    });

    describe('Path Tracing', () => {
        it('should trace paths from edges', async () => {
            // Create a simple shape
            testCtx.fillStyle = 'black';
            testCtx.fillRect(0, 0, 100, 100);
            testCtx.fillStyle = 'white';
            testCtx.fillRect(20, 20, 60, 60);

            const imageData = testCtx.getImageData(0, 0, 100, 100);
            const edges = await service.detectEdges(imageData, service.qualitySettings.medium);
            const paths = await service.tracePaths(edges, service.qualitySettings.medium);

            expect(paths).to.be.an('array');
            expect(paths.length).to.be.greaterThan(0);
            expect(paths[0]).to.be.an('array');
            expect(paths[0][0]).to.have.property('x');
            expect(paths[0][0]).to.have.property('y');
        });

        it('should simplify paths using Douglas-Peucker algorithm', async () => {
            const path = [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
                { x: 2, y: 2 },
                { x: 3, y: 3 },
                { x: 4, y: 4 }
            ];

            const simplified = service.simplifyPath(path, 1);
            expect(simplified.length).to.be.lessThan(path.length);
            expect(simplified[0]).to.deep.equal(path[0]);
            expect(simplified[simplified.length - 1]).to.deep.equal(path[path.length - 1]);
        });
    });

    describe('Shape Detection', () => {
        it('should detect rectangles', async () => {
            const path = [
                { x: 0, y: 0 },
                { x: 0, y: 10 },
                { x: 10, y: 10 },
                { x: 10, y: 0 }
            ];

            const shapes = await service.detectShapes([path], service.qualitySettings.medium);
            expect(shapes[0].type).to.equal('rectangle');
            expect(shapes[0]).to.have.property('width', 10);
            expect(shapes[0]).to.have.property('height', 10);
        });

        it('should detect circles', async () => {
            const path = [];
            const center = { x: 50, y: 50 };
            const radius = 20;
            
            // Create a circular path
            for (let angle = 0; angle < 360; angle += 10) {
                const x = center.x + radius * Math.cos(angle * Math.PI / 180);
                const y = center.y + radius * Math.sin(angle * Math.PI / 180);
                path.push({ x, y });
            }

            const shapes = await service.detectShapes([path], service.qualitySettings.medium);
            expect(shapes[0].type).to.equal('circle');
            expect(shapes[0].radius).to.be.closeTo(radius, 1);
        });

        it('should detect ellipses', async () => {
            const path = [];
            const center = { x: 50, y: 50 };
            const rx = 30;
            const ry = 20;
            
            // Create an elliptical path
            for (let angle = 0; angle < 360; angle += 10) {
                const x = center.x + rx * Math.cos(angle * Math.PI / 180);
                const y = center.y + ry * Math.sin(angle * Math.PI / 180);
                path.push({ x, y });
            }

            const shapes = await service.detectShapes([path], service.qualitySettings.medium);
            expect(shapes[0].type).to.equal('ellipse');
            expect(shapes[0].rx).to.be.closeTo(rx, 1);
            expect(shapes[0].ry).to.be.closeTo(ry, 1);
        });
    });

    describe('Color Quantization', () => {
        it('should quantize colors based on frequency', async () => {
            // Create a simple image with two colors
            testCtx.fillStyle = 'red';
            testCtx.fillRect(0, 0, 50, 100);
            testCtx.fillStyle = 'blue';
            testCtx.fillRect(50, 0, 50, 100);

            const imageData = testCtx.getImageData(0, 0, 100, 100);
            const colors = await service.quantizeColors(imageData, service.qualitySettings.medium);

            expect(colors).to.be.an('array');
            expect(colors.length).to.be.lessThanOrEqual(service.qualitySettings.medium.colorQuantization);
            expect(colors[0]).to.have.property('r');
            expect(colors[0]).to.have.property('g');
            expect(colors[0]).to.have.property('b');
            expect(colors[0]).to.have.property('a');
        });

        it('should respect color quantization settings', async () => {
            testCtx.fillStyle = 'red';
            testCtx.fillRect(0, 0, 100, 100);

            const imageData = testCtx.getImageData(0, 0, 100, 100);
            
            const lowQualityColors = await service.quantizeColors(imageData, service.qualitySettings.low);
            const highQualityColors = await service.quantizeColors(imageData, service.qualitySettings.high);

            expect(highQualityColors.length).to.be.greaterThan(lowQualityColors.length);
        });
    });

    describe('Vector Object Creation', () => {
        it('should create vector objects with proper styling', () => {
            const shapes = [{
                type: 'rectangle',
                x: 0,
                y: 0,
                width: 10,
                height: 10
            }];

            const colors = [{
                r: 255,
                g: 0,
                b: 0,
                a: 255,
                count: 100
            }];

            const objects = service.createVectorObjects(shapes, colors);
            expect(objects[0]).to.have.property('fill');
            expect(objects[0]).to.have.property('stroke');
            expect(objects[0].stroke).to.have.property('color');
            expect(objects[0].stroke).to.have.property('width');
        });
    });
}); 