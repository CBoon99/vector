import { Tool } from './tool.js';

export class SelectionTool extends Tool {
    constructor() {
        super('Selection', '↖', 'default');
        this.selectedObjects = new Set();
        this.selectionBox = null;
        this.isDragging = false;
        this.dragStart = null;
        this.resizeHandle = null;
        this.handleSize = 8;
    }

    startDrawing(event, canvas, context) {
        const pt = this.getCanvasPoint(event, canvas);
        const x = pt.x;
        const y = pt.y;

        const handle = this.getResizeHandle(x, y);
        if (handle) {
            this.resizeHandle = handle;
            this.isDragging = true;
            this.dragStart = { x, y };
            return;
        }

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

        const pt = this.getCanvasPoint(event, canvas);
        const x = pt.x;
        const y = pt.y;

        if (this.resizeHandle) {
            this.resizeObject(x, y);
        } else if (this.selectionBox) {
            this.updateSelectionBox(x, y);
        } else if (this.selectedObjects.size > 0) {
            this.moveSelectedObjects(x, y);
        }

        if (context) {
            this.drawSelection(context);
        }
    }

    drawSelection(context) {
        context.save();

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

        this.selectedObjects.forEach((object) => {
            const bounds = this.getObjectBounds(object);

            context.strokeStyle = '#0095ff';
            context.setLineDash([5, 5]);
            context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            context.setLineDash([]);

            this.drawResizeHandles(context, bounds);
        });

        context.restore();
    }

    drawResizeHandles(context, bounds) {
        const handles = this.getResizeHandlePositions(bounds);
        context.fillStyle = '#ffffff';
        context.strokeStyle = '#0095ff';

        handles.forEach((handle) => {
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
        const dx = x - this.dragStart.x;
        const dy = y - this.dragStart.y;

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
            default:
                break;
        }

        this.dragStart = { x, y };
        this.layerManager.updateLayer(object);
    }

    moveSelectedObjects(x, y) {
        const dx = x - this.dragStart.x;
        const dy = y - this.dragStart.y;

        this.selectedObjects.forEach((object) => {
            object.x += dx;
            object.y += dy;
            this.layerManager.updateLayer(object);
        });

        this.dragStart = { x, y };
    }

    updateSelectionBox(x, y) {
        if (!this.selectionBox) return;
        this.selectionBox.width = x - this.selectionBox.x;
        this.selectionBox.height = y - this.selectionBox.y;

        let bx = this.selectionBox.x;
        let by = this.selectionBox.y;
        let bw = this.selectionBox.width;
        let bh = this.selectionBox.height;
        if (bw < 0) {
            bx += bw;
            bw = Math.abs(bw);
        }
        if (bh < 0) {
            by += bh;
            bh = Math.abs(bh);
        }

        this.selectedObjects.clear();
        const layers = this.layerManager.getLayers();
        layers.forEach((layer) => {
            if (layer.hidden) return;
            (layer.objects || []).forEach((obj) => {
                if (this.isObjectInBox(obj, { x: bx, y: by, width: bw, height: bh })) {
                    this.selectedObjects.add(obj);
                }
            });
        });
    }

    isObjectInBox(object, box) {
        const bounds = this.getObjectBounds(object);
        const bx2 = box.x + box.width;
        const by2 = box.y + box.height;
        const ox2 = bounds.x + bounds.width;
        const oy2 = bounds.y + bounds.height;
        return bounds.x < bx2 && ox2 > box.x && bounds.y < by2 && oy2 > box.y;
    }

    getObjectBounds(object) {
        if (!object) return { x: 0, y: 0, width: 0, height: 0 };
        if (object.type === 'circle') {
            const r = object.radius || 0;
            return { x: object.x - r, y: object.y - r, width: 2 * r, height: 2 * r };
        }
        if (object.type === 'raster') {
            const w =
                object.width != null ? object.width : object.image?.naturalWidth || object.editCanvas?.width || 0;
            const h =
                object.height != null ? object.height : object.image?.naturalHeight || object.editCanvas?.height || 0;
            return { x: object.x || 0, y: object.y || 0, width: w, height: h };
        }
        return {
            x: object.x ?? 0,
            y: object.y ?? 0,
            width: object.width || 0,
            height: object.height || 0
        };
    }

    getObjectAtPosition(x, y) {
        const layers = this.layerManager.getLayers();
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (layer.hidden) continue;
            const objs = layer.objects || [];
            for (let j = objs.length - 1; j >= 0; j--) {
                const obj = objs[j];
                if (this.isPointInObject(x, y, obj)) {
                    return obj;
                }
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
        const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
        return distance < this.handleSize;
    }

    stopDrawing(_event, _canvas, _context) {
        if (!this.isDragging) return;

        if (this.selectionBox) {
            let bx = this.selectionBox.x;
            let by = this.selectionBox.y;
            let bw = this.selectionBox.width;
            let bh = this.selectionBox.height;
            if (bw < 0) {
                bx += bw;
                bw = Math.abs(bw);
            }
            if (bh < 0) {
                by += bh;
                bh = Math.abs(bh);
            }
            this.selectedObjects.clear();
            const layers = this.layerManager.getLayers();
            layers.forEach((layer) => {
                if (layer.hidden) return;
                (layer.objects || []).forEach((obj) => {
                    if (this.isObjectInBox(obj, { x: bx, y: by, width: bw, height: bh })) {
                        this.selectedObjects.add(obj);
                    }
                });
            });
        }

        if ((this.resizeHandle || this.selectedObjects.size > 0 || this.selectionBox) && this.layerManager) {
            this.stateManager.saveHistory();
        }

        this.isDragging = false;
        this.dragStart = null;
        this.resizeHandle = null;
        this.selectionBox = null;
    }

    deleteSelectedObjects() {
        if (this.selectedObjects.size === 0) return;

        this.layerManager.deleteObjects(Array.from(this.selectedObjects));
        this.selectedObjects.clear();
        this.stateManager.saveHistory();
        this.stateManager.canvasManager?.draw?.();
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
}
