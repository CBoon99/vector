import { App } from '../app.js';
import { LayerManager } from '../core/layerManager.js';
import { StateManager } from '../core/stateManager.js';
import { CanvasManager } from '../core/canvasManager.js';
import { SelectionTool } from '../tools/selection-tool.js';
import { TextTool } from '../tools/text-tool.js';
import { BezierTool } from '../tools/bezier-tool.js';

class FeatureTests {
    constructor() {
        this.app = new App();
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    async runAllTests() {
        console.log('Starting feature tests...');
        
        // Test core systems
        await this.testCoreSystems();
        
        // Test tools
        await this.testTools();
        
        // Test layer management
        await this.testLayerManagement();
        
        // Test UI components
        await this.testUIComponents();
        
        // Test event handling
        await this.testEventHandling();
        
        // Test state management
        await this.testStateManagement();
        
        // Print results
        this.printResults();
    }

    async testCoreSystems() {
        console.log('\nTesting core systems...');
        
        // Test StateManager
        this.test('StateManager initialization', () => {
            const stateManager = new StateManager();
            return stateManager !== null;
        });

        // Test LayerManager
        this.test('LayerManager initialization', () => {
            const layerManager = new LayerManager();
            return layerManager !== null;
        });

        // Test CanvasManager
        this.test('CanvasManager initialization', () => {
            const canvasManager = new CanvasManager();
            return canvasManager !== null;
        });

        // Test state saving
        this.test('State saving functionality', () => {
            const stateManager = new StateManager();
            const testState = { test: 'data' };
            stateManager.saveState(testState);
            return stateManager.getCurrentState() === testState;
        });

        // Test layer operations
        this.test('Layer operations', () => {
            const layerManager = new LayerManager();
            const layer = layerManager.createLayer();
            layerManager.updateLayer(layer);
            return layerManager.getLayer(layer.id) === layer;
        });
    }

    async testTools() {
        console.log('\nTesting tools...');
        
        // Test SelectionTool
        this.test('SelectionTool initialization', () => {
            const selectionTool = new SelectionTool();
            return selectionTool !== null;
        });

        // Test TextTool
        this.test('TextTool initialization', () => {
            const textTool = new TextTool();
            return textTool !== null;
        });

        // Test BezierTool
        this.test('BezierTool initialization', () => {
            const bezierTool = new BezierTool();
            return bezierTool !== null;
        });

        // Test tool switching
        this.test('Tool switching', () => {
            const app = new App();
            app.setCurrentTool('selection');
            return app.getCurrentTool().name === 'selection';
        });

        // Test tool properties
        this.test('Tool properties', () => {
            const selectionTool = new SelectionTool();
            return selectionTool.name === 'selection' && 
                   selectionTool.icon === 'selection-icon' &&
                   selectionTool.cursor === 'default';
        });
    }

    async testLayerManagement() {
        console.log('\nTesting layer management...');
        
        const layerManager = new LayerManager();
        
        // Test layer creation
        this.test('Create new layer', () => {
            const layer = layerManager.createLayer();
            return layer !== null && layer.id !== undefined;
        });

        // Test layer deletion
        this.test('Delete layer', () => {
            const layer = layerManager.createLayer();
            layerManager.deleteLayer(layer.id);
            return layerManager.getLayer(layer.id) === null;
        });

        // Test layer visibility
        this.test('Toggle layer visibility', () => {
            const layer = layerManager.createLayer();
            layerManager.setLayerVisibility(layer.id, false);
            return !layerManager.getLayer(layer.id).visible;
        });

        // Test layer ordering
        this.test('Layer ordering', () => {
            const layer1 = layerManager.createLayer();
            const layer2 = layerManager.createLayer();
            layerManager.moveLayer(layer1.id, 1);
            return layerManager.getLayers()[1].id === layer1.id;
        });

        // Test layer groups
        this.test('Layer groups', () => {
            const group = layerManager.createGroup();
            const layer = layerManager.createLayer();
            layerManager.addToGroup(group.id, layer.id);
            return layerManager.getGroup(group.id).layers.includes(layer.id);
        });
    }

    async testUIComponents() {
        console.log('\nTesting UI components...');
        
        // Test tool buttons
        this.test('Tool buttons exist', () => {
            const penToolBtn = document.getElementById('pen-tool');
            const rectToolBtn = document.getElementById('rect-tool');
            const circleToolBtn = document.getElementById('circle-tool');
            const polygonToolBtn = document.getElementById('polygon-tool');
            
            return penToolBtn && rectToolBtn && circleToolBtn && polygonToolBtn;
        });

        // Test color picker
        this.test('Color picker exists', () => {
            const colorPicker = document.getElementById('color-picker');
            return colorPicker !== null;
        });

        // Test layer panel
        this.test('Layer panel exists', () => {
            const layerPanel = document.querySelector('.layer-panel');
            return layerPanel !== null;
        });

        // Test button states
        this.test('Button states', () => {
            const deleteBtn = document.getElementById('delete-layer-btn');
            return deleteBtn.disabled === true;
        });

        // Test input fields
        this.test('Input fields', () => {
            const strokeWidth = document.getElementById('stroke-width-slider');
            const hexInput = document.getElementById('hex-input');
            return strokeWidth && hexInput;
        });
    }

    async testEventHandling() {
        console.log('\nTesting event handling...');
        
        // Test mouse events
        this.test('Mouse event handling', () => {
            const canvas = document.getElementById('drawing-canvas');
            return canvas && 
                   typeof canvas.onmousedown === 'function' &&
                   typeof canvas.onmousemove === 'function' &&
                   typeof canvas.onmouseup === 'function';
        });

        // Test keyboard events
        this.test('Keyboard event handling', () => {
            return typeof document.onkeydown === 'function' &&
                   typeof document.onkeyup === 'function';
        });

        // Test touch events
        this.test('Touch event handling', () => {
            const canvas = document.getElementById('drawing-canvas');
            return canvas && 
                   typeof canvas.ontouchstart === 'function' &&
                   typeof canvas.ontouchmove === 'function' &&
                   typeof canvas.ontouchend === 'function';
        });
    }

    async testStateManagement() {
        console.log('\nTesting state management...');
        
        const stateManager = new StateManager();
        
        // Test state saving
        this.test('State saving', () => {
            const state = { test: 'data' };
            stateManager.saveState(state);
            return stateManager.getCurrentState() === state;
        });

        // Test undo/redo
        this.test('Undo/Redo functionality', () => {
            const state1 = { test: 'data1' };
            const state2 = { test: 'data2' };
            stateManager.saveState(state1);
            stateManager.saveState(state2);
            stateManager.undo();
            return stateManager.getCurrentState() === state1;
        });

        // Test state history
        this.test('State history', () => {
            return stateManager.getHistory().length > 0;
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
        console.log('\nTest Results:');
        console.log(`Total tests: ${this.testResults.total}`);
        console.log(`Passed: ${this.testResults.passed}`);
        console.log(`Failed: ${this.testResults.failed}`);
        console.log(`Success rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%`);
    }
}

// Run tests when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const tests = new FeatureTests();
    tests.runAllTests();
}); 