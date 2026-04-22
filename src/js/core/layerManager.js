export class LayerManager {
    constructor() {
        this.layers = [];
        this.selectedObjects = new Set();
    }

    addObject(object) {
        this.layers.push(object);
        return object;
    }

    removeObject(object) {
        const index = this.layers.indexOf(object);
        if (index !== -1) {
            this.layers.splice(index, 1);
            this.selectedObjects.delete(object);
        }
    }

    getAllObjects() {
        return this.layers;
    }

    getSelectedObjects() {
        return Array.from(this.selectedObjects);
    }

    setSelection(objects) {
        this.selectedObjects.clear();
        objects.forEach(obj => this.selectedObjects.add(obj));
    }

    clearSelection() {
        this.selectedObjects.clear();
    }

    isSelected(object) {
        return this.selectedObjects.has(object);
    }

    getObjectById(id) {
        return this.layers.find(obj => obj.id === id);
    }

    getObjectsInArea(x, y, width, height) {
        return this.layers.filter(obj => {
            return obj.x < x + width &&
                   obj.x + obj.width > x &&
                   obj.y < y + height &&
                   obj.y + obj.height > y;
        });
    }

    getObjectAtPoint(x, y) {
        return this.layers.find(obj => {
            return x >= obj.x &&
                   x <= obj.x + obj.width &&
                   y >= obj.y &&
                   y <= obj.y + obj.height;
        });
    }

    moveObject(object, dx, dy) {
        object.x += dx;
        object.y += dy;
    }

    resizeObject(object, width, height) {
        object.width = width;
        object.height = height;
    }

    bringToFront(object) {
        const index = this.layers.indexOf(object);
        if (index !== -1) {
            this.layers.splice(index, 1);
            this.layers.push(object);
        }
    }

    sendToBack(object) {
        const index = this.layers.indexOf(object);
        if (index !== -1) {
            this.layers.splice(index, 1);
            this.layers.unshift(object);
        }
    }

    getBounds() {
        if (this.layers.length === 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }

        const bounds = {
            left: Math.min(...this.layers.map(obj => obj.x)),
            right: Math.max(...this.layers.map(obj => obj.x + obj.width)),
            top: Math.min(...this.layers.map(obj => obj.y)),
            bottom: Math.max(...this.layers.map(obj => obj.y + obj.height))
        };

        return {
            x: bounds.left,
            y: bounds.top,
            width: bounds.right - bounds.left,
            height: bounds.bottom - bounds.top
        };
    }
} 