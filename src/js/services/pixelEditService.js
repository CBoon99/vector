/**
 * Single-pixel and micro-brush paint on imported raster objects (edit buffer).
 */
export function findRasterUnderPoint(layers, x, y) {
    const candidates = [];
    for (const layer of layers) {
        if (layer.hidden) {
            continue;
        }
        for (const o of layer.objects) {
            if (o.type !== 'raster') {
                continue;
            }
            const w = o.width != null ? o.width : 0;
            const h = o.height != null ? o.height : 0;
            if (x >= o.x && y >= o.y && x <= o.x + w && y <= o.y + h) {
                candidates.push(o);
            }
        }
    }
    return candidates.length ? candidates[candidates.length - 1] : null;
}

/**
 * @param {object} obj raster layer object
 * @param {string} color CSS color e.g. #rrggbb or rgba()
 * @param {number} x canvas space
 * @param {number} y canvas space
 */
export function ensureEditCanvas(obj) {
    if (!obj || obj.type !== 'raster') {
        return null;
    }
    const w = obj.image?.naturalWidth || obj.image?.width;
    const h = obj.image?.naturalHeight || obj.image?.height;
    if (!w || !h) {
        return null;
    }
    if (obj.editCanvas && obj.editCanvas.width === w && obj.editCanvas.height === h) {
        return obj.editCanvas.getContext('2d', { willReadFrequently: true });
    }
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
        return null;
    }
    if (obj.image) {
        ctx.drawImage(obj.image, 0, 0, w, h);
    } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
    }
    obj.editCanvas = c;
    return ctx;
}

export function paintPixelOnRaster(obj, x, y, color) {
    const ctx = ensureEditCanvas(obj);
    if (!ctx) {
        return false;
    }
    const w = obj.width != null ? obj.width : 1;
    const h = obj.height != null ? obj.height : 1;
    const srcW = obj.editCanvas.width;
    const srcH = obj.editCanvas.height;
    const lx = (x - obj.x) / w;
    const ly = (y - obj.y) / h;
    if (lx < 0 || lx > 1 || ly < 0 || ly > 1) {
        return false;
    }
    const px = Math.max(0, Math.min(srcW - 1, Math.floor(lx * srcW)));
    const py = Math.max(0, Math.min(srcH - 1, Math.floor(ly * srcH)));
    ctx.fillStyle = color;
    ctx.fillRect(px, py, 1, 1);
    return true;
}
