// Tool Manager for Doppleit Vector
import PenTool from './pen-tool.js';
import RectTool from './rect-tool.js';
import CircleTool from './circle-tool.js';
import TextTool from './text-tool.js';
import SelectTool from './select-tool.js';
import EyedropperTool from './eyedropper-tool.js';
import PathTool from './path-tool.js';
import PolygonTool from './polygon-tool.js';
import LineTool from './line-tool.js';
import TransformTool from './transform-tool.js';

class ToolManager {
    constructor(stateManager, layerManager) {
        this.stateManager = stateManager;
        this.layerManager = layerManager;
        this.tools = {
            pen: new PenTool(stateManager, layerManager),
            rect: new RectTool(stateManager, layerManager),
            circle: new CircleTool(stateManager, layerManager),
            text: new TextTool(stateManager, layerManager),
            select: new SelectTool(stateManager, layerManager),
            eyedropper: new EyedropperTool(stateManager, layerManager),
            path: new PathTool(stateManager, layerManager),
            polygon: new PolygonTool(stateManager, layerManager),
            line: new LineTool(stateManager, layerManager),
            transform: new TransformTool(stateManager, layerManager)
        };
        this.currentTool = this.tools.pen;
    }

    // Tool Management
    setTool(toolName) {
        if (this.tools[toolName]) {
            this.currentTool = this.tools[toolName];
            this.stateManager.setState({ currentTool: toolName });
            return true;
        }
        return false;
    }

    getCurrentTool() {
        return this.currentTool;
    }

    // Tool Operations
    startDrawing(event, canvas, context) {
        return this.currentTool.startDrawing(event, canvas, context);
    }

    draw(event, canvas, context) {
        return this.currentTool.draw(event, canvas, context);
    }

    stopDrawing(event, canvas, context) {
        return this.currentTool.stopDrawing(event, canvas, context);
    }

    // Tool Options
    getToolOptions(toolName) {
        const tool = this.tools[toolName];
        return tool ? tool.getOptions() : null;
    }

    setToolOption(toolName, option, value) {
        const tool = this.tools[toolName];
        if (tool && tool.setOption) {
            tool.setOption(option, value);
            return true;
        }
        return false;
    }

    // Tool Cursors
    getToolCursor(toolName) {
        const tool = this.tools[toolName];
        return tool ? tool.getCursor() : 'default';
    }

    // Tool Shortcuts
    handleShortcut(key, modifiers) {
        const tool = this.currentTool;
        if (tool && tool.handleShortcut) {
            return tool.handleShortcut(key, modifiers);
        }
        return false;
    }

    // Tool State
    saveToolState() {
        const toolStates = {};
        Object.entries(this.tools).forEach(([name, tool]) => {
            if (tool.saveState) {
                toolStates[name] = tool.saveState();
            }
        });
        return toolStates;
    }

    loadToolState(states) {
        Object.entries(states).forEach(([name, state]) => {
            const tool = this.tools[name];
            if (tool && tool.loadState) {
                tool.loadState(state);
            }
        });
    }

    // Tool Registration
    registerTool(name, tool) {
        if (tool && typeof tool.startDrawing === 'function' &&
            typeof tool.draw === 'function' &&
            typeof tool.stopDrawing === 'function') {
            this.tools[name] = tool;
            return true;
        }
        return false;
    }

    unregisterTool(name) {
        if (this.tools[name] && name !== 'select') {
            delete this.tools[name];
            return true;
        }
        return false;
    }
}

export default ToolManager; 