/**
 * HSL color wheel (hue = angle, saturation = radius) + shared color I/O.
 */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function hexToRgb(hex) {
    let h = String(hex).trim();
    if (h.startsWith('#')) h = h.slice(1);
    if (h.length === 3) {
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    if (h.length !== 6) return null;
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return null;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r, g, b) {
    const toHex = (x) => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    const l = (max + min) / 2;
    let s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            default:
                h = (r - g) / d + 4;
        }
        h /= 6;
    }
    return { h: h * 360, s, l };
}

export function hslToRgb(h, s, l) {
    h = (((h % 360) + 360) % 360) / 360;
    s = clamp(s, 0, 1);
    l = clamp(l, 0, 1);
    let r; let g; let b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hueToRgb(p, q, h + 1 / 3);
        g = hueToRgb(p, q, h);
        b = hueToRgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}

export function hexToHsl(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return { h: 0, s: 0, l: 0.5 };
    return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

export function hslToHex(h, s, l) {
    const { r, g, b } = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
}

/** Wires the sidebar color wheel, sliders, and text fields to drawing state. */
export function initColorPickerWheel(p) {
    const { stateManager, requestRedraw } = p;
    const wheel = document.getElementById('color-wheel');
    const lightness = document.getElementById('lightness-slider');
    const lightnessVal = document.getElementById('lightness-value');
    const opacity = document.getElementById('opacity-slider');
    const opacityVal = document.getElementById('opacity-value');
    const strokeW = document.getElementById('stroke-width-slider');
    const strokeWVal = document.getElementById('stroke-width-value');
    const strokeStyle = document.getElementById('stroke-style');
    const hexIn = document.getElementById('hex-input');
    const rgbIn = document.getElementById('rgb-input');
    const hslIn = document.getElementById('hsl-input');
    const nativePicker = document.getElementById('native-picker');
    const systemBtn = document.getElementById('system-picker');
    const fillToggle = document.getElementById('fill-toggle');

    if (!wheel || typeof wheel.getContext !== 'function') {
        return;
    }

    const SIZE = 120;
    // Size the bitmap *before* getContext; some WebKit paths behave badly if the buffer was 0×0
    // or default (300×150) when the context is first created.
    wheel.width = SIZE;
    wheel.height = SIZE;
    const ctx = wheel.getContext('2d');
    if (!ctx) {
        return;
    }

    let w = wheel.width;
    let h = wheel.height;
    let cx = w / 2;
    let cy = h / 2;
    let R = Math.min(w, h) / 2 - 2;

    let hSel = 0;
    let sSel = 1;
    let lSel = 0.5;
    let syncing = false;

    function getLightness01() {
        if (!lightness) return lSel;
        return clamp(parseInt(lightness.value, 10) / 100, 0, 1);
    }

    function drawSelectionRing() {
        const ang = (hSel * Math.PI) / 180;
        const rad = sSel * R;
        const mx = cx + Math.cos(ang) * rad;
        const my = cy + Math.sin(ang) * rad;
        ctx.beginPath();
        ctx.arc(mx, my, 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(mx, my, 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    /**
     * Conic/linear fallback when putImageData is unavailable. We intentionally avoid the old
     * "conic + full-disk radial" combo: on some GPUs the radial overlay drowns the spectrum,
     * leaving a flat grey disk. White-to-transparent radial only tints the inner area (HSL: low S
     * at center) while the rim stays vivid.
     */
    function drawDiskConicFallback(L) {
        const Lpct = Math.round(L * 100);
        ctx.clearRect(0, 0, w, h);
        const g =
            typeof ctx.createConicGradient === 'function'
                ? ctx.createConicGradient(0, cx, cy)
                : null;
        if (g) {
            for (let i = 0; i <= 64; i++) {
                const hue = (i / 64) * 360;
                g.addColorStop(i / 64, `hsl(${hue}, 100%, ${Lpct}%)`);
            }
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.fill();
            const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
            rg.addColorStop(0, `hsl(0, 0%, ${Lpct}%)`);
            rg.addColorStop(0.65, 'hsla(0, 0%, 50%, 0)');
            rg.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
            ctx.fillStyle = rg;
            ctx.globalCompositeOperation = 'source-over';
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const linear = ctx.createLinearGradient(0, 0, w, h);
            linear.addColorStop(0, 'hsl(0, 100%, 50%)');
            linear.addColorStop(0.5, 'hsl(120, 100%, 50%)');
            linear.addColorStop(1, 'hsl(240, 100%, 50%)');
            ctx.fillStyle = linear;
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    /** Last-resort: block fill; always visible even if ImageData/gradients are broken. */
    function drawDiskRectBlockFallback(L) {
        const step = 2;
        ctx.clearRect(0, 0, w, h);
        for (let yp = 0; yp < h; yp += step) {
            for (let xp = 0; xp < w; xp += step) {
                const dx = xp - cx;
                const dy = yp - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > R) continue;
                const hueDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
                const H = hueDeg < 0 ? hueDeg + 360 : hueDeg;
                const S = dist / R;
                const { r, g, b } = hslToRgb(H, S, L);
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(xp, yp, step, step);
            }
        }
    }

    function drawDisk() {
        const L = getLightness01();
        lSel = L;
        w = wheel.width;
        h = wheel.height;
        if (w < 2 || h < 2) {
            wheel.width = SIZE;
            wheel.height = SIZE;
            w = wheel.width;
            h = wheel.height;
        }
        cx = w / 2;
        cy = h / 2;
        R = Math.max(2, Math.min(w, h) * 0.5 - 2);

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, w, h);

        let painted = false;
        try {
            if (typeof ctx.createImageData === 'function' && w > 0 && h > 0) {
                const img = ctx.createImageData(w, h);
                const data = img.data;
                for (let yp = 0; yp < h; yp++) {
                    for (let xp = 0; xp < w; xp++) {
                        const dx = xp - cx;
                        const dy = yp - cy;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const i = (yp * w + xp) * 4;
                        if (dist > R) {
                            data[i + 3] = 0;
                            continue;
                        }
                        const hueDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
                        const H = hueDeg < 0 ? hueDeg + 360 : hueDeg;
                        const S = R > 0 ? dist / R : 0;
                        const { r, g, b } = hslToRgb(H, S, L);
                        data[i] = r;
                        data[i + 1] = g;
                        data[i + 2] = b;
                        data[i + 3] = 255;
                    }
                }
                ctx.putImageData(img, 0, 0);
                painted = true;
            }
        } catch (_) {
            painted = false;
        }
        if (!painted) {
            try {
                drawDiskConicFallback(L);
            } catch (_) {
                drawDiskRectBlockFallback(L);
            }
        }
        drawSelectionRing();
    }

    function applyColorHex(hex) {
        let v = String(hex).trim();
        if (!v.startsWith('#')) v = `#${v}`;
        if (!/^#[0-9A-Fa-f]{3}$/i.test(v) && !/^#[0-9A-Fa-f]{6}$/i.test(v)) {
            return;
        }
        const full =
            v.length === 4
                ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`
                : v;
        const { h, s, l } = hexToHsl(full);
        hSel = h;
        sSel = s;
        lSel = l;
        if (lightness) {
            lightness.value = String(Math.round(l * 100));
            if (lightnessVal) lightnessVal.textContent = `${Math.round(l * 100)}%`;
        }
        if (stateManager && typeof stateManager.setCurrentColor === 'function') {
            stateManager.setCurrentColor(full);
        }
        syncInputsFromHex(full);
        drawDisk();
        requestRedraw();
    }

    function syncInputsFromHex(hex) {
        syncing = true;
        try {
            if (hexIn) {
                hexIn.value = hex;
            }
            const rgb = hexToRgb(hex);
            if (rgb && rgbIn) {
                rgbIn.value = `${rgb.r},${rgb.g},${rgb.b}`;
            }
            const { h, s, l } = hexToHsl(hex);
            if (hslIn) {
                hslIn.value = `${Math.round(h)},${Math.round(s * 100)}%,${Math.round(l * 100)}%`;
            }
            if (nativePicker) {
                try {
                    nativePicker.value = hex;
                } catch (_) {
                    /* some browsers throw on invalid */
                }
            }
        } finally {
            syncing = false;
        }
    }

    function pickFromEvent(ev) {
        const rect = wheel.getBoundingClientRect();
        const scaleX = w / rect.width;
        const scaleY = h / rect.height;
        const x = (ev.clientX - rect.left) * scaleX;
        const y = (ev.clientY - rect.top) * scaleY;
        const dx = x - cx;
        const dy = y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > R) {
            return;
        }
        hSel = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (hSel < 0) hSel += 360;
        sSel = d / R;
        const L = getLightness01();
        const next = hslToHex(hSel, sSel, L);
        if (stateManager && typeof stateManager.setCurrentColor === 'function') {
            stateManager.setCurrentColor(next);
        }
        syncInputsFromHex(next);
        drawDisk();
        requestRedraw();
    }

    // Initial state from hex input or app default (defer paint until layout; retry on load for Safari)
    let startHex = '#e37800';
    if (hexIn?.value) {
        const v = hexIn.value.trim();
        if (/^#[0-9A-Fa-f]{3}$/.test(v) || /^#[0-9A-Fa-f]{6}$/.test(v)) {
            startHex = v;
        }
    }
    const boot = () => {
        try {
            applyColorHex(startHex);
        } catch (err) {
            drawDisk();
        }
    };
    requestAnimationFrame(() => {
        requestAnimationFrame(boot);
    });
    window.addEventListener('load', boot, { once: true });

    if (lightness) {
        lightness.addEventListener('input', () => {
            if (lightnessVal) {
                lightnessVal.textContent = `${lightness.value}%`;
            }
            lSel = clamp(parseInt(lightness.value, 10) / 100, 0, 1);
            const next = hslToHex(hSel, sSel, lSel);
            if (stateManager && typeof stateManager.setCurrentColor === 'function') {
                stateManager.setCurrentColor(next);
            }
            syncInputsFromHex(next);
            drawDisk();
            requestRedraw();
        });
    }

    let dragging = false;
    wheel.addEventListener('mousedown', (e) => {
        e.preventDefault();
        dragging = true;
        pickFromEvent(e);
    });
    window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        pickFromEvent(e);
    });
    window.addEventListener('mouseup', () => {
        dragging = false;
    });
    wheel.addEventListener('touchstart', (e) => {
        e.preventDefault();
        dragging = true;
        if (e.touches[0]) pickFromEvent(e.touches[0]);
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
        if (!dragging || !e.touches[0]) return;
        e.preventDefault();
        pickFromEvent(e.touches[0]);
    }, { passive: false });
    window.addEventListener('touchend', () => {
        dragging = false;
    });

    const parseRGB = (str) => {
        const m = String(str).match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (!m) return null;
        return { r: +m[1], g: +m[2], b: +m[3] };
    };
    const parseHSL = (str) => {
        const m = String(str).match(/(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%/);
        if (!m) return null;
        return { h: +m[1], s: +m[2] / 100, l: +m[3] / 100 };
    };

    if (hexIn) {
        hexIn.addEventListener('change', () => {
            if (syncing) return;
            let v = hexIn.value.trim();
            if (!v.startsWith('#')) v = `#${v}`;
            if (/^#[0-9A-Fa-f]{3}$/.test(v) || /^#[0-9A-Fa-f]{6}$/.test(v)) {
                applyColorHex(v);
            }
        });
    }
    if (rgbIn) {
        rgbIn.addEventListener('change', () => {
            if (syncing) return;
            const parsed = parseRGB(rgbIn.value);
            if (parsed) {
                const hex = rgbToHex(parsed.r, parsed.g, parsed.b);
                applyColorHex(hex);
            }
        });
    }
    if (hslIn) {
        hslIn.addEventListener('change', () => {
            if (syncing) return;
            const parsed = parseHSL(hslIn.value);
            if (parsed) {
                const hex = hslToHex(parsed.h, parsed.s, parsed.l);
                hSel = parsed.h;
                sSel = parsed.s;
                lSel = parsed.l;
                if (lightness) {
                    lightness.value = String(Math.round(parsed.l * 100));
                    if (lightnessVal) lightnessVal.textContent = `${Math.round(parsed.l * 100)}%`;
                }
                if (stateManager && typeof stateManager.setCurrentColor === 'function') {
                    stateManager.setCurrentColor(hex);
                }
                syncInputsFromHex(hex);
                drawDisk();
                requestRedraw();
            }
        });
    }
    if (nativePicker) {
        nativePicker.addEventListener('input', () => {
            if (syncing) return;
            applyColorHex(nativePicker.value);
        });
    }
    if (systemBtn && nativePicker) {
        systemBtn.addEventListener('click', () => nativePicker.click());
    }

    if (opacity) {
        const syncOp = () => {
            if (syncing) return;
            const o = parseFloat(opacity.value) || 1;
            if (opacityVal) opacityVal.textContent = `${Math.round(o * 100)}%`;
            stateManager.setStrokeOpacity(o);
        };
        opacity.addEventListener('input', syncOp);
        syncOp();
    }
    if (strokeW) {
        const sw = () => {
            const n = Math.max(1, parseInt(strokeW.value, 10) || 1);
            if (strokeWVal) strokeWVal.textContent = `${n}px`;
            stateManager.setStrokeWidth(n);
        };
        strokeW.addEventListener('input', sw);
        sw();
    }
    if (strokeStyle) {
        strokeStyle.addEventListener('change', () => {
            stateManager.setStrokeStyle(strokeStyle.value);
        });
    }
    if (fillToggle) {
        const ft = () => {
            stateManager.setUseFill(!!fillToggle.checked);
        };
        fillToggle.addEventListener('change', ft);
        ft();
    }
}
