import { generateId } from '../utils/id-generator.js';

/**
 * Poster-style vectorization: each cell becomes a small rectangle.
 * Fast, deterministic, and always returns drawable objects.
 * @param {HTMLImageElement} image
 * @param {{ maxSide?: number, cellSize?: number }} [options]
 */
export function cellularVectorizeFromImage(image, options = {}) {
    const maxSide = options.maxSide ?? 100;
    const cellSize = options.cellSize ?? 10;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
        return [];
    }
    let w = image.naturalWidth || image.width || 1;
    let h = image.naturalHeight || image.height || 1;
    const s = maxSide / Math.max(w, h, 1);
    w = Math.max(1, Math.floor(w * s));
    h = Math.max(1, Math.floor(h * s));
    c.width = w;
    c.height = h;
    ctx.drawImage(image, 0, 0, w, h);
    const idata = ctx.getImageData(0, 0, w, h);
    const out = [];
    for (let cy = 0; cy < h; cy += cellSize) {
        for (let cx = 0; cx < w; cx += cellSize) {
            const rw = Math.min(cellSize, w - cx);
            const rh = Math.min(cellSize, h - cy);
            let r = 0;
            let g = 0;
            let b = 0;
            let a = 0;
            let n = 0;
            for (let y = cy; y < cy + rh; y++) {
                for (let x = cx; x < cx + rw; x++) {
                    const i = (y * w + x) * 4;
                    r += idata.data[i];
                    g += idata.data[i + 1];
                    b += idata.data[i + 2];
                    a += idata.data[i + 3];
                    n += 1;
                }
            }
            n = Math.max(1, n);
            const fill = `rgba(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)},${
                a / n / 255
            })`;
            out.push({
                type: 'rectangle',
                id: generateId('cell'),
                x: cx,
                y: cy,
                width: rw,
                height: rh,
                fill,
                stroke: { color: 'none', width: 0 }
            });
        }
    }
    return out;
}
