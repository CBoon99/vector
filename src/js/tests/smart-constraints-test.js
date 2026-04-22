import { SmartConstraintsTool } from '../tools/smart-constraints-tool.js';
import { LayerManager } from '../core/layerManager.js';
import { StateManager } from '../core/stateManager.js';
import { CanvasManager } from '../core/canvasManager.js';

class SmartConstraintsTest {
    constructor() {
        this.setupTestEnvironment();
        this.runTests();
    }

    setupTestEnvironment() {
        // Create test canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = 800;
        this.canvas.height = 600;
        document.body.appendChild(this.canvas);

        // Initialize managers
        this.layerManager = new LayerManager();
        this.stateManager = new StateManager();
        this.canvasManager = new CanvasManager(this.canvas);

        // Initialize tool
        this.tool = new SmartConstraintsTool();
        this.tool.initialize(this.layerManager, this.stateManager);
        this.tool.canvasManager = this.canvasManager;
    }

    createTestObjects() {
        // Create test objects with different positions
        const objects = [
            { id: 1, x: 100, y: 100, width: 50, height: 50 },
            { id: 2, x: 200, y: 100, width: 50, height: 50 },
            { id: 3, x: 300, y: 100, width: 50, height: 50 },
            { id: 4, x: 100, y: 200, width: 50, height: 50 },
            { id: 5, x: 200, y: 200, width: 50, height: 50 }
        ];

        objects.forEach(obj => {
            this.layerManager.addObject(obj);
        });

        return objects;
    }

    async runTests() {
        console.log('Starting Smart Constraints Tool Tests...');

        try {
            // Test 1: Basic initialization
            console.log('Test 1: Tool Initialization');
            this.testInitialization();

            // Test 2: Distribution functionality
            console.log('Test 2: Distribution');
            await this.testDistribution();

            // Test 3: Pattern Detection
            console.log('Test 3: Pattern Detection');
            this.testPatternDetection();

            // Test 4: History Management
            console.log('Test 4: History Management');
            this.testHistoryManagement();

            console.log('All tests completed successfully!');
        } catch (error) {
            console.error('Test failed:', error);
        }
    }

    testInitialization() {
        // Verify tool properties
        if (!this.tool.snapThreshold || !this.tool.guideThreshold) {
            throw new Error('Tool not properly initialized');
        }

        // Verify event listeners
        const keyEvent = new KeyboardEvent('keydown', { key: 'Shift' });
        document.dispatchEvent(keyEvent);
        if (!this.tool.isActive) {
            throw new Error('Event listeners not working');
        }
    }

    async testDistribution() {
        const objects = this.createTestObjects();
        
        // Select objects
        this.layerManager.setSelection([1, 2, 3]);

        // Trigger distribution
        const event = new KeyboardEvent('keydown', { key: 'e', altKey: true });
        document.dispatchEvent(event);

        // Wait for distribution to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify distribution
        const distributedObjects = this.layerManager.getSelectedObjects();
        const spacing = distributedObjects[1].x - (distributedObjects[0].x + distributedObjects[0].width);
        const nextSpacing = distributedObjects[2].x - (distributedObjects[1].x + distributedObjects[1].width);

        if (Math.abs(spacing - nextSpacing) > 1) {
            throw new Error('Distribution not equal');
        }
    }

    testPatternDetection() {
        const objects = this.createTestObjects();
        
        // Create a perfect grid pattern
        objects[0].x = 100; objects[0].y = 100;
        objects[1].x = 200; objects[1].y = 100;
        objects[2].x = 300; objects[2].y = 100;
        objects[3].x = 100; objects[3].y = 200;
        objects[4].x = 200; objects[4].y = 200;

        this.layerManager.setSelection([0, 1, 2, 3, 4]);
        
        // Verify pattern detection
        const patternInfo = this.tool.detectSpacingPatterns(
            this.tool.calculateHorizontalSpacing(objects),
            this.tool.calculateVerticalSpacing(objects)
        );

        if (!patternInfo.pattern || !patternInfo.isPerfect) {
            throw new Error('Pattern detection failed');
        }
    }

    testHistoryManagement() {
        const objects = this.createTestObjects();
        this.layerManager.setSelection([0, 1, 2]);

        // Perform multiple distributions
        for (let i = 0; i < 3; i++) {
            const event = new KeyboardEvent('keydown', { key: 'e', altKey: true });
            document.dispatchEvent(event);
        }

        // Verify history
        if (this.tool.distributionHistory.length !== 3) {
            throw new Error('History not properly maintained');
        }

        // Test undo
        const undoEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
        document.dispatchEvent(undoEvent);

        if (this.tool.distributionHistoryIndex !== 1) {
            throw new Error('Undo not working properly');
        }
    }

    cleanup() {
        document.body.removeChild(this.canvas);
    }
}

// Run tests when the page loads
window.addEventListener('load', () => {
    const test = new SmartConstraintsTest();
}); 