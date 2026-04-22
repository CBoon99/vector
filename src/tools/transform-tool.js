// Transform Tool for Object Manipulation
class TransformTool {
    constructor(stateManager, layerManager) {
        this.stateManager = stateManager;
        this.layerManager = layerManager;
        this.selectedObject = null;
        this.transformMode = 'select'; // 'select', 'rotate', 'scale', 'skew'
        this.transformOrigin = { x: 0, y: 0 };
        this.startPoint = null;
        this.options = {
            maintainAspectRatio: true,
            snapToGrid: true,
            snapToAngle: true,
            snapAngle: 15, // degrees
            showGuides: true,
            showHandles: true
        };
    }

    // Tool Interface
    startDrawing(event, canvas, context) {
        const point = this.getCanvasPoint(event, canvas);
        this.startPoint = point;

        // Check if clicking on a transform handle
        const handle = this.getHandleAtPoint(point);
        if (handle) {
            this.transformMode = handle.type;
            this.selectedObject = handle.object;
            return;
        }

        // Check if clicking on an object
        const object = this.findObjectAtPoint(point);
        if (object) {
            this.selectedObject = object;
            this.transformMode = 'select';
            this.calculateTransformOrigin();
            this.stateManager.selectObject(object);
        } else {
            this.selectedObject = null;
            this.stateManager.clearSelection();
        }
    }

    draw(event, canvas, context) {
        if (!this.selectedObject || !this.startPoint) return;

        const point = this.getCanvasPoint(event, canvas);
        
        switch (this.transformMode) {
            case 'rotate':
                this.rotateObject(point);
                break;
            case 'scale':
                this.scaleObject(point);
                break;
            case 'skew':
                this.skewObject(point);
                break;
            case 'move':
                this.moveObject(point);
                break;
        }

        this.drawTransformHandles(context);
    }

    stopDrawing(event, canvas, context) {
        if (this.selectedObject) {
            this.stateManager.saveHistory();
        }
        this.startPoint = null;
        this.transformMode = 'select';
    }

    // Transform Operations
    rotateObject(point) {
        if (!this.selectedObject) return;

        const dx = point.x - this.transformOrigin.x;
        const dy = point.y - this.transformOrigin.y;
        const angle = Math.atan2(dy, dx);
        
        if (this.options.snapToAngle) {
            const snapAngle = this.options.snapAngle * Math.PI / 180;
            this.selectedObject.rotation = Math.round(angle / snapAngle) * snapAngle;
        } else {
            this.selectedObject.rotation = angle;
        }
    }

    scaleObject(point) {
        if (!this.selectedObject) return;

        const dx = point.x - this.transformOrigin.x;
        const dy = point.y - this.transformOrigin.y;
        const scaleX = Math.abs(dx) / this.selectedObject.width;
        const scaleY = Math.abs(dy) / this.selectedObject.height;

        if (this.options.maintainAspectRatio) {
            const scale = Math.max(scaleX, scaleY);
            this.selectedObject.scaleX = scale;
            this.selectedObject.scaleY = scale;
        } else {
            this.selectedObject.scaleX = scaleX;
            this.selectedObject.scaleY = scaleY;
        }
    }

    skewObject(point) {
        if (!this.selectedObject) return;

        const dx = point.x - this.transformOrigin.x;
        const dy = point.y - this.transformOrigin.y;
        
        this.selectedObject.skewX = dx / this.selectedObject.height;
        this.selectedObject.skewY = dy / this.selectedObject.width;
    }

    moveObject(point) {
        if (!this.selectedObject) return;

        const dx = point.x - this.startPoint.x;
        const dy = point.y - this.startPoint.y;

        if (this.options.snapToGrid) {
            const gridSize = this.stateManager.getState().settings.gridSize;
            this.selectedObject.x = Math.round((this.selectedObject.x + dx) / gridSize) * gridSize;
            this.selectedObject.y = Math.round((this.selectedObject.y + dy) / gridSize) * gridSize;
        } else {
            this.selectedObject.x += dx;
            this.selectedObject.y += dy;
        }

        this.startPoint = point;
    }

    // Transform Handles
    getHandleAtPoint(point) {
        if (!this.selectedObject) return null;

        const handles = this.getTransformHandles();
        return handles.find(handle => {
            const dx = handle.x - point.x;
            const dy = handle.y - point.y;
            return Math.sqrt(dx * dx + dy * dy) < 5;
        });
    }

    getTransformHandles() {
        if (!this.selectedObject) return [];

        const { x, y, width, height } = this.selectedObject;
        const handles = [];

        // Corner handles for scaling
        handles.push({ x: x, y: y, type: 'scale', object: this.selectedObject });
        handles.push({ x: x + width, y: y, type: 'scale', object: this.selectedObject });
        handles.push({ x: x + width, y: y + height, type: 'scale', object: this.selectedObject });
        handles.push({ x: x, y: y + height, type: 'scale', object: this.selectedObject });

        // Edge handles for skewing
        handles.push({ x: x + width/2, y: y, type: 'skew', object: this.selectedObject });
        handles.push({ x: x + width, y: y + height/2, type: 'skew', object: this.selectedObject });
        handles.push({ x: x + width/2, y: y + height, type: 'skew', object: this.selectedObject });
        handles.push({ x: x, y: y + height/2, type: 'skew', object: this.selectedObject });

        // Rotation handle
        handles.push({ 
            x: x + width/2, 
            y: y - 20, 
            type: 'rotate', 
            object: this.selectedObject 
        });

        return handles;
    }

    drawTransformHandles(context) {
        if (!this.selectedObject || !this.options.showHandles) return;

        context.save();
        context.strokeStyle = '#00ff00';
        context.fillStyle = '#00ff00';
        context.lineWidth = 1;

        // Draw selection box
        const { x, y, width, height } = this.selectedObject;
        context.strokeRect(x, y, width, height);

        // Draw transform handles
        const handles = this.getTransformHandles();
        handles.forEach(handle => {
            context.beginPath();
            context.arc(handle.x, handle.y, 4, 0, Math.PI * 2);
            context.fill();
        });

        // Draw rotation guide
        if (this.transformMode === 'rotate') {
            context.beginPath();
            context.moveTo(this.transformOrigin.x, this.transformOrigin.y);
            context.lineTo(this.startPoint.x, this.startPoint.y);
            context.stroke();
        }

        context.restore();
    }

    // Object Selection
    findObjectAtPoint(point) {
        const objects = this.layerManager.getVisibleLayers()
            .flatMap(layer => layer.objects)
            .reverse(); // Check top-most objects first

        return objects.find(object => this.isPointInObject(point, object));
    }

    isPointInObject(point, object) {
        // Basic bounding box check - can be enhanced for specific object types
        return point.x >= object.x && 
               point.x <= object.x + object.width &&
               point.y >= object.y && 
               point.y <= object.y + object.height;
    }

    calculateTransformOrigin() {
        if (!this.selectedObject) return;

        this.transformOrigin = {
            x: this.selectedObject.x + this.selectedObject.width / 2,
            y: this.selectedObject.y + this.selectedObject.height / 2
        };
    }

    // Utility Methods
    getCanvasPoint(event, canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    // Tool Options
    getOptions() {
        return this.options;
    }

    setOption(option, value) {
        if (this.options.hasOwnProperty(option)) {
            this.options[option] = value;
            return true;
        }
        return false;
    }

    // Tool State
    saveState() {
        return {
            options: { ...this.options }
        };
    }

    loadState(state) {
        if (state.options) {
            this.options = { ...state.options };
        }
    }

    // Tool Interface
    getCursor() {
        switch (this.transformMode) {
            case 'rotate':
                return 'crosshair';
            case 'scale':
                return 'nwse-resize';
            case 'skew':
                return 'move';
            default:
                return 'default';
        }
    }
}

export default TransformTool; 