import { App } from '../app.js';
import { StateManager } from '../core/stateManager.js';
import { LayerManager } from '../core/layerManager.js';
import { SelectionTool } from '../tools/selection-tool.js';
import { TextTool } from '../tools/text-tool.js';
import { BezierTool } from '../tools/bezier-tool.js';

class IntegrationTests {
    constructor() {
        this.app = new App();
        this.stateManager = new StateManager();
        this.layerManager = new LayerManager();
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    async runAllTests() {
        console.log('Starting integration tests...');
        
        // Test tool interactions
        await this.testToolInteractions();
        
        // Test layer management
        await this.testLayerManagement();
        
        // Test state management
        await this.testStateManagement();
        
        // Test UI interactions
        await this.testUIInteractions();
        
        // Print results
        this.printResults();
    }

    async testToolInteractions() {
        console.log('\nTesting tool interactions...');
        
        // Test tool switching
        this.test('Tool switching preserves state', () => {
            const selectionTool = new SelectionTool();
            const textTool = new TextTool();
            const bezierTool = new BezierTool();
            
            this.app.setCurrentTool('selection');
            const selectionState = this.app.getCurrentTool().getState();
            
            this.app.setCurrentTool('text');
            const textState = this.app.getCurrentTool().getState();
            
            this.app.setCurrentTool('bezier');
            const bezierState = this.app.getCurrentTool().getState();
            
            return selectionState && textState && bezierState;
        });

        // Test tool feedback
        this.test('Tool feedback updates cursor', () => {
            const canvas = document.getElementById('drawing-canvas');
            const event = new MouseEvent('mousemove', {
                clientX: 100,
                clientY: 100
            });
            
            canvas.dispatchEvent(event);
            return canvas.style.cursor !== 'default';
        });
    }

    async testLayerManagement() {
        console.log('\nTesting layer management...');
        
        // Test layer operations
        this.test('Layer operations affect state', () => {
            const layer = this.layerManager.createLayer();
            const initialState = this.stateManager.getCurrentState();
            
            this.layerManager.updateLayer(layer);
            const updatedState = this.stateManager.getCurrentState();
            
            return initialState !== updatedState;
        });

        // Test layer visibility
        this.test('Layer visibility updates canvas', () => {
            const layer = this.layerManager.createLayer();
            this.layerManager.setLayerVisibility(layer.id, false);
            
            return !this.layerManager.getLayer(layer.id).visible;
        });

        // Test layer groups
        this.test('Layer groups maintain hierarchy', () => {
            const group = this.layerManager.createGroup();
            const layer = this.layerManager.createLayer();
            
            this.layerManager.addToGroup(group.id, layer.id);
            const groupLayers = this.layerManager.getGroup(group.id).layers;
            
            return groupLayers.includes(layer.id);
        });
    }

    async testStateManagement() {
        console.log('\nTesting state management...');
        
        // Test undo/redo
        this.test('Undo/redo maintains layer state', () => {
            const layer = this.layerManager.createLayer();
            const initialState = this.stateManager.getCurrentState();
            
            this.layerManager.updateLayer(layer);
            this.stateManager.undo();
            
            return this.stateManager.getCurrentState() === initialState;
        });

        // Test state history
        this.test('State history is maintained', () => {
            const layer = this.layerManager.createLayer();
            this.layerManager.updateLayer(layer);
            this.layerManager.updateLayer(layer);
            
            return this.stateManager.getHistory().length > 1;
        });
    }

    async testUIInteractions() {
        console.log('\nTesting UI interactions...');
        
        // Test keyboard shortcuts
        this.test('Keyboard shortcuts trigger actions', () => {
            const deleteEvent = new KeyboardEvent('keydown', {
                key: 'Delete',
                bubbles: true
            });
            
            document.dispatchEvent(deleteEvent);
            return this.layerManager.getLayers().length === 0;
        });

        // Test tool buttons
        this.test('Tool buttons update current tool', () => {
            const penToolBtn = document.getElementById('pen-tool');
            penToolBtn.click();
            
            return this.app.getCurrentTool().name === 'pen';
        });

        // Test layer panel
        this.test('Layer panel updates on layer changes', () => {
            const layer = this.layerManager.createLayer();
            const layerList = document.getElementById('layer-list');
            
            return layerList.children.length > 0;
        });
    }

    test(name, testFn) {
        this.testResults.total++;
        try {
            const result = testFn();
            if (result) {
                this.testResults.passed++;
                console.log(`✅ ${name}`);
            } else {
                this.testResults.failed++;
                console.log(`❌ ${name}`);
            }
        } catch (error) {
            this.testResults.failed++;
            console.log(`❌ ${name} - Error: ${error.message}`);
        }
    }

    printResults() {
        console.log('\nIntegration Test Results:');
        console.log(`Total tests: ${this.testResults.total}`);
        console.log(`Passed: ${this.testResults.passed}`);
        console.log(`Failed: ${this.testResults.failed}`);
        console.log(`Success rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%`);
    }
}

// Run integration tests when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const tests = new IntegrationTests();
    tests.runAllTests();
}); 