// Fill Manager for Gradient and Pattern Fills
class FillManager {
    constructor() {
        this.gradients = new Map();
        this.patterns = new Map();
        this.defaultGradients = this.createDefaultGradients();
        this.defaultPatterns = this.createDefaultPatterns();
    }

    // Gradient Management
    createLinearGradient(x0, y0, x1, y1, stops) {
        const id = crypto.randomUUID();
        const gradient = {
            id,
            type: 'linear',
            x0,
            y0,
            x1,
            y1,
            stops: stops.map(stop => ({
                offset: stop.offset,
                color: stop.color,
                opacity: stop.opacity || 1
            }))
        };
        this.gradients.set(id, gradient);
        return id;
    }

    createRadialGradient(x0, y0, r0, x1, y1, r1, stops) {
        const id = crypto.randomUUID();
        const gradient = {
            id,
            type: 'radial',
            x0,
            y0,
            r0,
            x1,
            y1,
            r1,
            stops: stops.map(stop => ({
                offset: stop.offset,
                color: stop.color,
                opacity: stop.opacity || 1
            }))
        };
        this.gradients.set(id, gradient);
        return id;
    }

    createConicalGradient(x, y, angle, stops) {
        const id = crypto.randomUUID();
        const gradient = {
            id,
            type: 'conical',
            x,
            y,
            angle,
            stops: stops.map(stop => ({
                offset: stop.offset,
                color: stop.color,
                opacity: stop.opacity || 1
            }))
        };
        this.gradients.set(id, gradient);
        return id;
    }

    // Pattern Management
    createPattern(image, repetition = 'repeat') {
        const id = crypto.randomUUID();
        const pattern = {
            id,
            type: 'pattern',
            image,
            repetition,
            transform: {
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                offsetX: 0,
                offsetY: 0
            }
        };
        this.patterns.set(id, pattern);
        return id;
    }

    createSVGPattern(svgElement, width, height, repetition = 'repeat') {
        const id = crypto.randomUUID();
        const pattern = {
            id,
            type: 'svg',
            svg: svgElement,
            width,
            height,
            repetition,
            transform: {
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                offsetX: 0,
                offsetY: 0
            }
        };
        this.patterns.set(id, pattern);
        return id;
    }

    // Fill Application
    applyFill(context, fill) {
        if (!fill) return;

        if (fill.type === 'solid') {
            context.fillStyle = fill.color;
            return;
        }

        if (fill.type === 'gradient') {
            const gradient = this.gradients.get(fill.gradientId);
            if (!gradient) return;

            let gradientObj;
            switch (gradient.type) {
                case 'linear':
                    gradientObj = context.createLinearGradient(
                        gradient.x0, gradient.y0,
                        gradient.x1, gradient.y1
                    );
                    break;
                case 'radial':
                    gradientObj = context.createRadialGradient(
                        gradient.x0, gradient.y0, gradient.r0,
                        gradient.x1, gradient.y1, gradient.r1
                    );
                    break;
                case 'conical':
                    // Custom conical gradient implementation
                    gradientObj = this.createConicalGradientObject(context, gradient);
                    break;
            }

            if (gradientObj) {
                gradient.stops.forEach(stop => {
                    gradientObj.addColorStop(
                        stop.offset,
                        this.colorWithOpacity(stop.color, stop.opacity)
                    );
                });
                context.fillStyle = gradientObj;
            }
            return;
        }

        if (fill.type === 'pattern') {
            const pattern = this.patterns.get(fill.patternId);
            if (!pattern) return;

            let patternObj;
            if (pattern.type === 'svg') {
                patternObj = this.createSVGPatternObject(context, pattern);
            } else {
                patternObj = context.createPattern(pattern.image, pattern.repetition);
            }

            if (patternObj) {
                // Apply pattern transformation
                const matrix = new DOMMatrix();
                matrix.translateSelf(pattern.transform.offsetX, pattern.transform.offsetY);
                matrix.rotateSelf(pattern.transform.rotation);
                matrix.scaleSelf(pattern.transform.scaleX, pattern.transform.scaleY);
                patternObj.setTransform(matrix);
                
                context.fillStyle = patternObj;
            }
        }
    }

    // Custom Gradient Implementations
    createConicalGradientObject(context, gradient) {
        // Create a canvas for the conical gradient
        const canvas = document.createElement('canvas');
        const size = Math.max(
            Math.abs(gradient.x1 - gradient.x0),
            Math.abs(gradient.y1 - gradient.y0)
        ) * 2;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        const centerX = size / 2;
        const centerY = size / 2;

        // Draw the conical gradient
        for (let angle = 0; angle < 360; angle++) {
            const stop = this.getGradientStopAtAngle(gradient.stops, angle);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, size / 2, angle * Math.PI / 180, (angle + 1) * Math.PI / 180);
            ctx.closePath();
            ctx.fillStyle = this.colorWithOpacity(stop.color, stop.opacity);
            ctx.fill();
        }

        return context.createPattern(canvas, 'no-repeat');
    }

    createSVGPatternObject(context, pattern) {
        const canvas = document.createElement('canvas');
        canvas.width = pattern.width;
        canvas.height = pattern.height;
        
        const ctx = canvas.getContext('2d');
        const svgData = new XMLSerializer().serializeToString(pattern.svg);
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        
        return new Promise((resolve) => {
            img.onload = () => {
                ctx.drawImage(img, 0, 0, pattern.width, pattern.height);
                resolve(context.createPattern(canvas, pattern.repetition));
            };
        });
    }

    // Utility Methods
    getGradientStopAtAngle(stops, angle) {
        const normalizedAngle = angle / 360;
        for (let i = 0; i < stops.length - 1; i++) {
            if (normalizedAngle >= stops[i].offset && normalizedAngle <= stops[i + 1].offset) {
                const t = (normalizedAngle - stops[i].offset) / 
                         (stops[i + 1].offset - stops[i].offset);
                return {
                    color: this.interpolateColor(stops[i].color, stops[i + 1].color, t),
                    opacity: this.interpolate(stops[i].opacity, stops[i + 1].opacity, t)
                };
            }
        }
        return stops[stops.length - 1];
    }

    interpolateColor(color1, color2, t) {
        const c1 = this.parseColor(color1);
        const c2 = this.parseColor(color2);
        return `rgb(${
            Math.round(this.interpolate(c1.r, c2.r, t))}, ${
            Math.round(this.interpolate(c1.g, c2.g, t))}, ${
            Math.round(this.interpolate(c1.b, c2.b, t))
        })`;
    }

    interpolate(start, end, t) {
        return start + (end - start) * t;
    }

    parseColor(color) {
        const hex = color.replace('#', '');
        return {
            r: parseInt(hex.substr(0, 2), 16),
            g: parseInt(hex.substr(2, 2), 16),
            b: parseInt(hex.substr(4, 2), 16)
        };
    }

    colorWithOpacity(color, opacity) {
        const c = this.parseColor(color);
        return `rgba(${c.r}, ${c.g}, ${c.b}, ${opacity})`;
    }

    // Default Fills
    createDefaultGradients() {
        return {
            'linear-blue': this.createLinearGradient(0, 0, 0, 100, [
                { offset: 0, color: '#0000ff', opacity: 1 },
                { offset: 1, color: '#000066', opacity: 1 }
            ]),
            'radial-red': this.createRadialGradient(50, 50, 0, 50, 50, 50, [
                { offset: 0, color: '#ff0000', opacity: 1 },
                { offset: 1, color: '#660000', opacity: 1 }
            ]),
            'conical-rainbow': this.createConicalGradient(50, 50, 0, [
                { offset: 0, color: '#ff0000', opacity: 1 },
                { offset: 0.33, color: '#00ff00', opacity: 1 },
                { offset: 0.66, color: '#0000ff', opacity: 1 },
                { offset: 1, color: '#ff0000', opacity: 1 }
            ])
        };
    }

    createDefaultPatterns() {
        return {
            'dots': this.createPattern(this.createDotsPattern(10, '#000000')),
            'stripes': this.createPattern(this.createStripesPattern(10, '#000000')),
            'grid': this.createPattern(this.createGridPattern(10, '#000000'))
        };
    }

    // Pattern Generators
    createDotsPattern(size, color) {
        const canvas = document.createElement('canvas');
        canvas.width = size * 2;
        canvas.height = size * 2;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(size, size, size / 4, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }

    createStripesPattern(size, color) {
        const canvas = document.createElement('canvas');
        canvas.width = size * 2;
        canvas.height = size * 2;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, size, size * 2);
        
        return canvas;
    }

    createGridPattern(size, color) {
        const canvas = document.createElement('canvas');
        canvas.width = size * 2;
        canvas.height = size * 2;
        const ctx = canvas.getContext('2d');
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(size, size * 2);
        ctx.moveTo(0, size);
        ctx.lineTo(size * 2, size);
        ctx.stroke();
        
        return canvas;
    }
}

export default FillManager; 