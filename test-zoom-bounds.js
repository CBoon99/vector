/**
 * Test zoom/pan bounds constraining logic
 * This verifies that images stay visible when zooming in/out
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

    /**
     * Constrain viewport to stay within world bounds
     */
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

    isImageVisible() {
        const contentMinX = this.bounds.minX;
        const contentMinY = this.bounds.minY;
        const contentMaxX = this.bounds.maxX;
        const contentMaxY = this.bounds.maxY;

        const viewportWorldX = -this.offsetX / this.scale;
        const viewportWorldY = -this.offsetY / this.scale;
        const viewportWorldWidth = this.canvas.width / this.scale;
        const viewportWorldHeight = this.canvas.height / this.scale;

        // Check if any part of content is visible
        const isVisibleX = viewportWorldX < contentMaxX && viewportWorldX + viewportWorldWidth > contentMinX;
        const isVisibleY = viewportWorldY < contentMaxY && viewportWorldY + viewportWorldHeight > contentMinY;

        return isVisibleX && isVisibleY;
    }
}

// Test cases
console.log('=== Zoom/Pan Bounds Test Suite ===\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passed++;
    } catch (error) {
        console.log(`✗ ${name}`);
        console.log(`  Error: ${error.message}`);
        failed++;
    }
}

// Test 1: Initial state - image should be visible
test('Initial state - image visible at scale 1', () => {
    const mgr = new TestCanvasManager();
    if (!mgr.isImageVisible()) {
        throw new Error('Image not visible at initial state');
    }
});

// Test 2: Zoom in 2x - image should stay visible
test('Zoom in 2x - image stays visible', () => {
    const mgr = new TestCanvasManager();
    mgr.setZoom(2);
    if (!mgr.isImageVisible()) {
        throw new Error('Image disappeared when zooming in to 2x');
    }
});

// Test 3: Zoom in 5x - image should stay visible
test('Zoom in 5x - image stays visible', () => {
    const mgr = new TestCanvasManager();
    mgr.setZoom(5);
    if (!mgr.isImageVisible()) {
        throw new Error('Image disappeared when zooming in to 5x');
    }
});

// Test 4: Zoom out 0.5x - image should stay visible and centered
test('Zoom out 0.5x - image stays visible and centered', () => {
    const mgr = new TestCanvasManager();
    mgr.setZoom(0.5);
    if (!mgr.isImageVisible()) {
        throw new Error('Image not visible when zoomed out to 0.5x');
    }
    // At 0.5x scale, content center (540 world units) should be at screen center (400)
    // screenX = worldX * scale + offsetX
    // 400 = 540 * 0.5 + offsetX
    // offsetX = 400 - 270 = 130
    const expectedOffsetX = 130;
    const actualOffsetX = mgr.offsetX;
    const tolerance = 10; // Allow small rounding differences
    if (Math.abs(actualOffsetX - expectedOffsetX) > tolerance) {
        throw new Error(`Image not centered. Expected offsetX ~${expectedOffsetX}, got ${actualOffsetX}`);
    }
});

// Test 5: Zoom out very far (0.1x) - image should stay visible and centered
test('Zoom out very far (0.1x) - image stays visible', () => {
    const mgr = new TestCanvasManager();
    mgr.setZoom(0.1);
    if (!mgr.isImageVisible()) {
        throw new Error('Image not visible when zoomed out to 0.1x');
    }
});

// Test 6: Progressive zoom in - image should stay visible at each step
test('Progressive zoom in - image stays visible at each step', () => {
    const mgr = new TestCanvasManager();
    for (let zoom = 1; zoom <= 10; zoom += 1) {
        mgr.setZoom(zoom);
        if (!mgr.isImageVisible()) {
            throw new Error(`Image disappeared at zoom level ${zoom}x`);
        }
    }
});

// Test 7: Progressive zoom out - image should stay visible at each step
test('Progressive zoom out - image stays visible at each step', () => {
    const mgr = new TestCanvasManager();
    for (let zoom = 1; zoom >= 0.1; zoom -= 0.1) {
        mgr.setZoom(zoom);
        if (!mgr.isImageVisible()) {
            throw new Error(`Image disappeared at zoom level ${zoom.toFixed(2)}x`);
        }
    }
});

// Test 8: Bounds set correctly - no content should be lost
test('Bounds enforced - viewport constrained to content', () => {
    const mgr = new TestCanvasManager();
    mgr.setZoom(2); // Zoom in

    // Viewport bounds in world space
    const viewportWorldX = -mgr.offsetX / mgr.scale;
    const viewportWorldY = -mgr.offsetY / mgr.scale;
    const viewportWorldWidth = mgr.canvas.width / mgr.scale;
    const viewportWorldHeight = mgr.canvas.height / mgr.scale;

    // Viewport should not go past content bounds
    if (viewportWorldX < mgr.bounds.minX) {
        throw new Error(`Viewport X before content bounds: ${viewportWorldX} < ${mgr.bounds.minX}`);
    }
    if (viewportWorldY < mgr.bounds.minY) {
        throw new Error(`Viewport Y before content bounds: ${viewportWorldY} < ${mgr.bounds.minY}`);
    }
    if (viewportWorldX + viewportWorldWidth > mgr.bounds.maxX) {
        throw new Error(`Viewport X beyond content bounds: ${viewportWorldX + viewportWorldWidth} > ${mgr.bounds.maxX}`);
    }
    if (viewportWorldY + viewportWorldHeight > mgr.bounds.maxY) {
        throw new Error(`Viewport Y beyond content bounds: ${viewportWorldY + viewportWorldHeight} > ${mgr.bounds.maxY}`);
    }
});

console.log(`\n=== Results ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n✓ All tests passed! Zoom/pan bounds logic is working correctly.');
    process.exit(0);
} else {
    console.log('\n✗ Some tests failed!');
    process.exit(1);
}
