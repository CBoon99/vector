import { generateId } from '../utils/id-generator.js';

/**
 * Layer + object model for the in-browser editor.
 * One active layer; objects are shapes or embedded rasters.
 */
export class LayerManager {
    constructor() {
        this.layers = [
            {
                id: 'default',
                name: 'Default Layer',
                objects: [],
                hidden: false,
                locked: false
            }
        ];
        this.activeLayerId = 'default';
        this._changeListeners = [];
    }

    on(event, fn) {
        if (event === 'change' && typeof fn === 'function') {
            this._changeListeners.push(fn);
        }
    }

    _emitChange() {
        this._changeListeners.forEach((fn) => {
            try {
                fn();
            } catch (_) {
                /* ignore */
            }
        });
    }

    getLayers() {
        return this.layers;
    }

    getActiveLayerId() {
        return this.activeLayerId;
    }

    getActiveLayer() {
        return this.layers.find((l) => l.id === this.activeLayerId) || this.layers[0];
    }

    getLayer(id) {
        return this.layers.find((l) => l.id === id);
    }

    setActiveLayer(id) {
        if (this.layers.some((l) => l.id === id)) {
            this.activeLayerId = id;
            this._emitChange();
        }
    }

    addLayer(name) {
        const id = `layer_${generateId('ly')}`;
        this.layers.push({
            id,
            name: name || `Layer ${this.layers.length + 1}`,
            objects: [],
            hidden: false,
            locked: false
        });
        this.activeLayerId = id;
        this._emitChange();
        return id;
    }

    deleteActiveLayer() {
        if (this.layers.length < 2) return;
        const idx = this.layers.findIndex((l) => l.id === this.activeLayerId);
        if (idx <= 0) return;
        this.layers.splice(idx, 1);
        this.activeLayerId = this.layers[0].id;
        this._emitChange();
    }

    duplicateActiveLayer() {
        const cur = this.getActiveLayer();
        if (!cur) return;
        const id = this.addLayer(`${cur.name} (copy)`);
        const newLayer = this.getLayer(id);
        newLayer.objects = cur.objects.map((o) => this._cloneObject(o));
        this._emitChange();
    }

    _cloneObject(obj) {
        return { ...obj, id: generateId('obj') };
    }

    renameActiveLayer(name) {
        const layer = this.getActiveLayer();
        if (layer && name) {
            layer.name = name;
            this._emitChange();
        }
    }

    moveLayerUp(layerId) {
        const id = layerId || this.activeLayerId;
        const i = this.layers.findIndex((l) => l.id === id);
        if (i < 0 || i >= this.layers.length - 1) return;
        [this.layers[i], this.layers[i + 1]] = [this.layers[i + 1], this.layers[i]];
        this._emitChange();
    }

    moveLayerDown(layerId) {
        const id = layerId || this.activeLayerId;
        const i = this.layers.findIndex((l) => l.id === id);
        if (i < 1) return;
        [this.layers[i], this.layers[i - 1]] = [this.layers[i - 1], this.layers[i]];
        this._emitChange();
    }

    toggleVisibility(layerId) {
        const id = layerId || this.activeLayerId;
        const layer = this.getLayer(id);
        if (layer) {
            layer.hidden = !layer.hidden;
            this._emitChange();
        }
    }

    toggleLock(layerId) {
        const id = layerId || this.activeLayerId;
        const layer = this.getLayer(id);
        if (layer) {
            layer.locked = !layer.locked;
            this._emitChange();
        }
    }

    groupSelectedLayers() {
        /* prototype stub */
    }

    ungroupSelectedLayers() {
        /* prototype stub */
    }

    addObjects(objects) {
        if (!objects) return;
        const list = Array.isArray(objects) ? objects : [objects];
        const layer = this.getActiveLayer();
        if (layer.locked) return;
        for (const obj of list) {
            if (!obj || typeof obj !== 'object') continue;
            if (!obj.id) obj.id = generateId('obj');
            layer.objects.push(obj);
        }
        this._emitChange();
    }

    addObject(object) {
        this.addObjects([object]);
    }

    updateLayer() {
        /* stub for text/selection */
        this._emitChange();
    }

    removeLayer() {
        /* legacy: remove object by id — not used for layers list */
    }

    removeObject(object) {
        for (const layer of this.layers) {
            const i = layer.objects.indexOf(object);
            if (i !== -1) {
                layer.objects.splice(i, 1);
                this._emitChange();
                return;
            }
        }
    }

    getAllObjects() {
        return this.layers.flatMap((l) => l.objects);
    }

    getSelectedObjects() {
        return [];
    }

    setSelection() {
        /* selection tool may call */
    }

    deleteObjects(selection) {
        if (!Array.isArray(selection) || !selection.length) return;
        const set = new Set(selection);
        for (const layer of this.layers) {
            layer.objects = layer.objects.filter((o) => !set.has(o));
        }
        this._emitChange();
    }

    replaceObjectWithRasterized(object, imageElement) {
        if (!object || !imageElement) return;
        object.type = 'raster';
        object.image = imageElement;
        this._emitChange();
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    drawLayers(ctx) {
        for (const layer of this.layers) {
            if (layer.hidden) continue;
            ctx.save();
            ctx.globalAlpha = 1;
            for (const obj of layer.objects) {
                this._drawObject(ctx, obj);
            }
            ctx.restore();
        }
    }

    _drawObject(ctx, obj) {
        if (!obj) return;
        try {
            switch (obj.type) {
                case 'raster': {
                    const { x = 0, y = 0, width, height, editCanvas } = obj;
                    if (editCanvas && editCanvas.getContext && width != null && height != null) {
                        ctx.drawImage(
                            editCanvas,
                            0,
                            0,
                            editCanvas.width,
                            editCanvas.height,
                            x,
                            y,
                            width,
                            height
                        );
                        break;
                    }
                    // Use editCanvas if it exists (pixel edits), otherwise use original image
                    if (obj.editCanvas) {
                        const w = width != null ? width : obj.editCanvas.width;
                        const h = height != null ? height : obj.editCanvas.height;
                        ctx.drawImage(obj.editCanvas, x, y, w, h);
                    } else if (obj.image && obj.image.complete && obj.image.naturalWidth) {
                        const w = width != null ? width : obj.image.naturalWidth;
                        const h = height != null ? height : obj.image.naturalHeight;
                        ctx.drawImage(obj.image, x, y, w, h);
                    } else if (obj.image) {
                        const im = obj.image;
                        const drawWhenReady = () => {
                            if (!im.naturalWidth) {
                                return;
                            }
                            const w = width != null ? width : im.naturalWidth;
                            const h = height != null ? height : im.naturalHeight;
                            ctx.drawImage(im, x, y, w, h);
                            if (typeof window !== 'undefined' && window.doppleitApp?.canvasManager) {
                                requestAnimationFrame(() => window.doppleitApp.canvasManager.draw());
                            }
                        };
                        im.addEventListener('load', drawWhenReady, { once: true });
                    }
                    break;
                }
                case 'rectangle': {
                    ctx.beginPath();
                    ctx.rect(obj.x, obj.y, obj.width, obj.height);
                    if (obj.fill && obj.fill !== 'none' && obj.fill !== 'transparent') {
                        ctx.fillStyle = obj.fill;
                        ctx.fill();
                    }
                    const scn = obj.stroke && (typeof obj.stroke === 'string' ? obj.stroke : obj.stroke?.color);
                    if (scn && scn !== 'none') {
                        ctx.strokeStyle = typeof obj.stroke === 'string' ? obj.stroke : obj.stroke?.color;
                        ctx.lineWidth = obj.strokeWidth || obj.stroke?.width || 1;
                        ctx.stroke();
                    }
                    break;
                }
                case 'path': {
                    if (obj.d) {
                        const p = new Path2D(obj.d);
                        if (obj.fill && obj.fill !== 'none' && obj.fill !== 'transparent') {
                            ctx.fillStyle = obj.fill;
                            ctx.fill(p);
                        }
                        const sc = obj.stroke;
                        if (sc && (typeof sc === 'string' ? sc : sc?.color) !== 'none') {
                            ctx.strokeStyle = typeof sc === 'string' ? sc : sc.color;
                            ctx.lineWidth = sc.width || 1;
                            ctx.stroke(p);
                        }
                    } else if (obj.points && obj.points.length) {
                        ctx.beginPath();
                        const p0 = obj.points[0];
                        const x0 = p0.x !== undefined ? p0.x : p0[0];
                        const y0 = p0.y !== undefined ? p0.y : p0[1];
                        ctx.moveTo(x0, y0);
                        for (let i = 1; i < obj.points.length; i++) {
                            const p = obj.points[i];
                            ctx.lineTo(p.x, p.y);
                        }
                        if (obj.isClosed) {
                            ctx.closePath();
                        }
                        if (obj.fill && obj.fill !== 'none' && obj.fill !== 'transparent') {
                            ctx.fillStyle = obj.fill;
                            ctx.fill();
                        }
                        if (obj.stroke && (obj.stroke.color || obj.stroke) !== 'none') {
                            ctx.strokeStyle = obj.stroke?.color || '#111';
                            ctx.lineWidth = obj.stroke?.width || 1;
                            ctx.stroke();
                        }
                    }
                    break;
                }
                case 'ellipse': {
                    ctx.save();
                    ctx.beginPath();
                    if (obj.rotation) {
                        ctx.translate(obj.cx, obj.cy);
                        ctx.rotate(obj.rotation);
                        ctx.ellipse(0, 0, obj.rx, obj.ry, 0, 0, Math.PI * 2);
                    } else {
                        ctx.ellipse(obj.cx, obj.cy, obj.rx, obj.ry, 0, 0, Math.PI * 2);
                    }
                    if (obj.fill && obj.fill !== 'none') {
                        ctx.fillStyle = obj.fill;
                        ctx.fill();
                    }
                    if (obj.stroke?.color && obj.stroke.color !== 'none') {
                        ctx.strokeStyle = obj.stroke.color;
                        ctx.lineWidth = obj.stroke.width || 1;
                        ctx.stroke();
                    }
                    ctx.restore();
                    break;
                }
                case 'circle': {
                    ctx.beginPath();
                    ctx.arc(obj.cx, obj.cy, obj.radius, 0, Math.PI * 2);
                    if (obj.fill && obj.fill !== 'none') {
                        ctx.fillStyle = obj.fill;
                        ctx.fill();
                    }
                    if (obj.stroke?.color && obj.stroke.color !== 'none') {
                        ctx.strokeStyle = obj.stroke.color;
                        ctx.lineWidth = obj.stroke.width || 1;
                        ctx.stroke();
                    }
                    break;
                }
                case 'polygon':
                case 'polyline': {
                    const pts = obj.points;
                    if (pts && pts.length) {
                        ctx.beginPath();
                        ctx.moveTo(pts[0], pts[1] || 0);
                        for (let i = 2; i < pts.length; i += 2) {
                            ctx.lineTo(pts[i], pts[i + 1]);
                        }
                        if (obj.type === 'polygon') ctx.closePath();
                        if (obj.fill && obj.fill !== 'none') {
                            ctx.fillStyle = obj.fill;
                            ctx.fill();
                        }
                        if (obj.stroke?.color) {
                            ctx.strokeStyle = obj.stroke.color;
                            ctx.lineWidth = obj.stroke.width || 1;
                            ctx.stroke();
                        }
                    }
                    break;
                }
                case 'line': {
                    if (obj.x1 != null) {
                        ctx.beginPath();
                        ctx.moveTo(obj.x1, obj.y1);
                        ctx.lineTo(obj.x2, obj.y2);
                        ctx.strokeStyle = obj.stroke || '#000';
                        ctx.lineWidth = obj.strokeWidth || 1;
                        ctx.stroke();
                    }
                    break;
                }
                default:
                    break;
            }
        } catch (e) {
            console.warn('draw object failed', obj?.type, e);
        }
    }
}
