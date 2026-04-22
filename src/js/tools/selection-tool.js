import { Tool } from './tool.js';

export class SelectionTool extends Tool {
    constructor(stateManager, layerManager) {
        super(stateManager, layerManager);
        this.name = 'selection';
        this.icon = 'selection-icon';
        this.cursor = 'default';
        this.selectedObjects = new Set();
        this.selectionBox = null;
        this.isDragging = false;
        this.dragStart = null;
        this.resizeHandle = null;
        this.handleSize = 8;
    }

    startDrawing(event, canvas, context) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if clicking on a resize handle
        const handle = this.getResizeHandle(x, y);
        if (handle) {
            this.resizeHandle = handle;
            this.isDragging = true;
            this.dragStart = { x, y };
            return;
        }

        // Check if clicking on a selected object
        const clickedObject = this.getObjectAtPosition(x, y);
        if (clickedObject) {
            if (!event.shiftKey) {
                this.selectedObjects.clear();
            }
            this.selectedObjects.add(clickedObject);
            this.isDragging = true;
            this.dragStart = { x, y };
            return;
        }

        // Start new selection box
        if (!event.shiftKey) {
            this.selectedObjects.clear();
        }
        this.selectionBox = {
            x,
            y,
            width: 0,
            height: 0
        };
        this.isDragging = true;
        this.dragStart = { x, y };
    }

    draw(event, canvas, context) {
        if (!this.isDragging) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.resizeHandle) {
            this.resizeObject(x, y);
        } else if (this.selectionBox) {
            this.updateSelectionBox(x, y);
        } else if (this.selectedObjects.size > 0) {
            this.moveSelectedObjects(x, y);
        }

        this.drawSelection(context);
    }

    drawSelection(context) {
        context.save();

        // Draw selection box
        if (this.selectionBox) {
            context.strokeStyle = '#0095ff';
            context.setLineDash([5, 5]);
            context.strokeRect(
                this.selectionBox.x,
                this.selectionBox.y,
                this.selectionBox.width,
                this.selectionBox.height
            );
            context.setLineDash([]);
        }

        // Draw selection for each selected object
        this.selectedObjects.forEach(object => {
            const bounds = this.getObjectBounds(object);
            
            // Draw selection rectangle
            context.strokeStyle = '#0095ff';
            context.setLineDash([5, 5]);
            context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            context.setLineDash([]);

            // Draw resize handles
            this.drawResizeHandles(context, bounds);
        });

        context.restore();
    }

    drawResizeHandles(context, bounds) {
        const handles = this.getResizeHandlePositions(bounds);
        context.fillStyle = '#ffffff';
        context.strokeStyle = '#0095ff';

        handles.forEach(handle => {
            context.beginPath();
            context.rect(
                handle.x - this.handleSize / 2,
                handle.y - this.handleSize / 2,
                this.handleSize,
                this.handleSize
            );
            context.fill();
            context.stroke();
        });
    }

    getResizeHandlePositions(bounds) {
        return [
            { x: bounds.x, y: bounds.y, type: 'nw' },
            { x: bounds.x + bounds.width / 2, y: bounds.y, type: 'n' },
            { x: bounds.x + bounds.width, y: bounds.y, type: 'ne' },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, type: 'e' },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height, type: 'se' },
            { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, type: 's' },
            { x: bounds.x, y: bounds.y + bounds.height, type: 'sw' },
            { x: bounds.x, y: bounds.y + bounds.height / 2, type: 'w' }
        ];
    }

    getResizeHandle(x, y) {
        for (const object of this.selectedObjects) {
            const bounds = this.getObjectBounds(object);
            const handles = this.getResizeHandlePositions(bounds);

            for (const handle of handles) {
                if (this.isPointNear(x, y, handle)) {
                    return { object, handle: handle.type };
                }
            }
        }
        return null;
    }

    resizeObject(x, y) {
        if (!this.resizeHandle) return;

        const { object, handle } = this.resizeHandle;
        const bounds = this.getObjectBounds(object);
        const dx = x - this.dragStart.x;
        const dy = y - this.dragStart.y;

        // Update object based on handle type
        switch (handle) {
            case 'nw':
                object.x += dx;
                object.y += dy;
                object.width -= dx;
                object.height -= dy;
                break;
            case 'n':
                object.y += dy;
                object.height -= dy;
                break;
            case 'ne':
                object.y += dy;
                object.width += dx;
                object.height -= dy;
                break;
            case 'e':
                object.width += dx;
                break;
            case 'se':
                object.width += dx;
                object.height += dy;
                break;
            case 's':
                object.height += dy;
                break;
            case 'sw':
                object.x += dx;
                object.width -= dx;
                object.height += dy;
                break;
            case 'w':
                object.x += dx;
                object.width -= dx;
                break;
        }

        this.dragStart = { x, y };
        this.layerManager.updateLayer(object);
    }

    moveSelectedObjects(x, y) {
        const dx = x - this.dragStart.x;
        const dy = y - this.dragStart.y;

        this.selectedObjects.forEach(object => {
            object.x += dx;
            object.y += dy;
            this.layerManager.updateLayer(object);
        });

        this.dragStart = { x, y };
    }

    updateSelectionBox(x, y) {
        this.selectionBox.width = x - this.selectionBox.x;
        this.selectionBox.height = y - this.selectionBox.y;

        // Select objects within the box
        const layers = this.layerManager.getLayers();
        layers.forEach(layer => {
            if (this.isObjectInBox(layer, this.selectionBox)) {
                this.selectedObjects.add(layer);
            }
        });
    }

    isObjectInBox(object, box) {
        const bounds = this.getObjectBounds(object);
        return (
            bounds.x >= box.x &&
            bounds.y >= box.y &&
            bounds.x + bounds.width <= box.x + box.width &&
            bounds.y + bounds.height <= box.y + box.height
        );
    }

    getObjectBounds(object) {
        return {
            x: object.x,
            y: object.y,
            width: object.width || 0,
            height: object.height || 0
        };
    }

    getObjectAtPosition(x, y) {
        const layers = this.layerManager.getLayers();
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (this.isPointInObject(x, y, layer)) {
                return layer;
            }
        }
        return null;
    }

    isPointInObject(x, y, object) {
        const bounds = this.getObjectBounds(object);
        return (
            x >= bounds.x &&
            x <= bounds.x + bounds.width &&
            y >= bounds.y &&
            y <= bounds.y + bounds.height
        );
    }

    isPointNear(x, y, point) {
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        return distance < this.handleSize;
    }

    finishDrawing() {
        if (this.isDragging) {
            this.stateManager.saveState();
        }
        this.isDragging = false;
        this.dragStart = null;
        this.resizeHandle = null;
        this.selectionBox = null;
    }

    cleanup() {
        this.selectedObjects.clear();
        this.isDragging = false;
        this.dragStart = null;
        this.resizeHandle = null;
        this.selectionBox = null;
    }

    handleKeyDown(event) {
        if (event.key === 'Delete' || event.key === 'Backspace') {
            this.deleteSelectedObjects();
        }
    }

    deleteSelectedObjects() {
        if (this.selectedObjects.size === 0) return;

        this.selectedObjects.forEach(object => {
            this.layerManager.removeLayer(object.id);
        });

        this.selectedObjects.clear();
        this.stateManager.saveState();
        this.canvasManager.draw();
    }
} 