/**
 * Debug zoom/pan bounds constraining logic
 */

// Mock canvas for testing
class MockCanvas {
    constructor() {
        this.width = 800;
        this.height = 600;
    }
}

// Simplified CanvasManager for testing bounds logic
class TestCanvasManager {
    constructor() {
        this.canvas = new MockCanvas();
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        // World bounds for a 1000x1000 image with padding
        this.bounds = {
            minX: 0,
            minY: 0,
            maxX: 1080,  // 1000 (image) + 80 (padding*2)
            maxY: 1080
        };
    }

    constrainViewport() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        // Calculate visible world bounds in screen coordinates
        const viewportWorldX = -this.offsetX / this.scale;
        const viewportWorldY = -this.offsetY / this.scale;
        const viewportWorldWidth = canvasWidth / this.scale;
        const viewportWorldHeight = canvasHeight / this.scale;

        // Calculate the edges of content in world space
        const contentMinX = this.bounds.minX;
        const contentMinY = this.bounds.minY;
        const contentMaxX = this.bounds.maxX;
        const contentMaxY = this.bounds.maxY;
        const contentWidth = contentMaxX - contentMinX;
        const contentHeight = contentMaxY - contentMinY;

        // Constrain viewport so it doesn't go beyond content bounds
        let newOffsetX = this.offsetX;
        let newOffsetY = this.offsetY;

        // Case 1: Content is larger than viewport - prevent panning past edges
        if (viewportWorldWidth < contentWidth) {
            // Prevent panning left beyond content
            if (viewportWorldX < contentMinX) {
                newOffsetX = contentMinX * this.scale;
            }
            // Prevent panning right beyond content
            if (viewportWorldX + viewportWorldWidth > contentMaxX) {
                newOffsetX = (contentMaxX - viewportWorldWidth) * this.scale;
            }
        } else {
            // Case 2: Content is smaller than viewport - center it
            const contentCenterX = (contentMinX + contentMaxX) / 2;
            newOffsetX = canvasWidth / 2 - contentCenterX * this.scale;
        }

        // Same logic for Y
        if (viewportWorldHeight < contentHeight) {
            // Prevent panning up beyond content
            if (viewportWorldY < contentMinY) {
                newOffsetY = contentMinY * this.scale;
            }
            // Prevent panning down beyond content
            if (viewportWorldY + viewportWorldHeight > contentMaxY) {
                newOffsetY = (contentMaxY - viewportWorldHeight) * this.scale;
            }
        } else {
            // Content is smaller than viewport - center it
            const contentCenterY = (contentMinY + contentMaxY) / 2;
            newOffsetY = canvasHeight / 2 - contentCenterY * this.scale;
        }

        this.offsetX = newOffsetX;
        this.offsetY = newOffsetY;
    }

    setZoom(zoom) {
        const oldScale = this.scale;
        const newScale = Math.max(0.1, Math.min(10, Number(zoom) || 1));

        if (oldScale === newScale) return;

        // Calculate viewport center in world coordinates before zoom
        const centerScreenX = this.canvas.width / 2;
        const centerScreenY = this.canvas.height / 2;
        const centerWorldX = (centerScreenX - this.offsetX) / oldScale;
        const centerWorldY = (centerScreenY - this.offsetY) / oldScale;

        // Apply new scale
        this.scale = newScale;

        // Adjust offset to keep world center at screen center
        this.offsetX = centerScreenX - centerWorldX * newScale;
        this.offsetY = centerScreenY - centerWorldY * newScale;

        // Constrain viewport to stay within bounds
        this.constrainViewport();
    }

    getViewportBounds() {
        const viewportWorldX = -this.offsetX / this.scale;
        const viewportWorldY = -this.offsetY / this.scale;
        const viewportWorldWidth = this.canvas.width / this.scale;
        const viewportWorldHeight = this.canvas.height / this.scale;

        return {
            minX: viewportWorldX,
            minY: viewportWorldY,
            maxX: viewportWorldX + viewportWorldWidth,
            maxY: viewportWorldY + viewportWorldHeight,
            width: viewportWorldWidth,
            height: viewportWorldHeight
        };
    }

    isImageVisible() {
        const contentMinX = this.bounds.minX;
        const contentMinY = this.bounds.minY;
        const contentMaxX = this.bounds.maxX;
        const contentMaxY = this.bounds.maxY;

        const vp = this.getViewportBounds();

        // Check if any part of content is visible
        const isVisibleX = vp.minX < contentMaxX && vp.maxX > contentMinX;
        const isVisibleY = vp.minY < contentMaxY && vp.maxY > contentMinY;

        return isVisibleX && isVisibleY;
    }
}

// Debug specific zoom level
const mgr = new TestCanvasManager();
console.log('=== Testing Zoom to 0.1x (zoom out very far) ===\n');

console.log('Before zoom:');
console.log(`  scale: ${mgr.scale}`);
console.log(`  offsetX: ${mgr.offsetX}, offsetY: ${mgr.offsetY}`);
let vp = mgr.getViewportBounds();
console.log(`  viewport world bounds: X[${vp.minX.toFixed(1)}, ${vp.maxX.toFixed(1)}], Y[${vp.minY.toFixed(1)}, ${vp.maxY.toFixed(1)}]`);
console.log(`  content bounds: X[${mgr.bounds.minX}, ${mgr.bounds.maxX}], Y[${mgr.bounds.minY}, ${mgr.bounds.maxY}]`);
console.log(`  image visible: ${mgr.isImageVisible()}`);

mgr.setZoom(0.1);

console.log('\nAfter zoom to 0.1x:');
console.log(`  scale: ${mgr.scale}`);
console.log(`  offsetX: ${mgr.offsetX}, offsetY: ${mgr.offsetY}`);
vp = mgr.getViewportBounds();
console.log(`  viewport world bounds: X[${vp.minX.toFixed(1)}, ${vp.maxX.toFixed(1)}], Y[${vp.minY.toFixed(1)}, ${vp.maxY.toFixed(1)}]`);
console.log(`  viewport world width: ${vp.width.toFixed(1)}, height: ${vp.height.toFixed(1)}`);
console.log(`  content bounds: X[${mgr.bounds.minX}, ${mgr.bounds.maxX}], Y[${mgr.bounds.minY}, ${mgr.bounds.maxY}]`);
console.log(`  content size: ${mgr.bounds.maxX - mgr.bounds.minX} x ${mgr.bounds.maxY - mgr.bounds.minY}`);
console.log(`  image visible: ${mgr.isImageVisible()}`);

// Check overlap
const contentMinX = mgr.bounds.minX;
const contentMaxX = mgr.bounds.maxX;
const contentMinY = mgr.bounds.minY;
const contentMaxY = mgr.bounds.maxY;

const isVisibleX = vp.minX < contentMaxX && vp.maxX > contentMinX;
const isVisibleY = vp.minY < contentMaxY && vp.maxY > contentMinY;

console.log(`\nVisibility check:`);
console.log(`  isVisibleX: viewport X[${vp.minX.toFixed(1)}, ${vp.maxX.toFixed(1)}] vs content X[${contentMinX}, ${contentMaxX}]`);
console.log(`    vp.minX (${vp.minX.toFixed(1)}) < contentMaxX (${contentMaxX})? ${vp.minX < contentMaxX}`);
console.log(`    vp.maxX (${vp.maxX.toFixed(1)}) > contentMinX (${contentMinX})? ${vp.maxX > contentMinX}`);
console.log(`    Result: ${isVisibleX}`);
console.log(`  isVisibleY: viewport Y[${vp.minY.toFixed(1)}, ${vp.maxY.toFixed(1)}] vs content Y[${contentMinY}, ${contentMaxY}]`);
console.log(`    Result: ${isVisibleY}`);
console.log(`  Overall visible: ${isVisibleX && isVisibleY}`);
