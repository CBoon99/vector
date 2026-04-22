// Text Tool with Advanced Features
class TextTool {
    constructor(stateManager, layerManager) {
        this.stateManager = stateManager;
        this.layerManager = layerManager;
        this.currentText = null;
        this.isEditing = false;
        this.options = {
            fontFamily: 'Arial',
            fontSize: 16,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            lineHeight: 1.2,
            letterSpacing: 0,
            textPath: null,
            fill: '#000000',
            stroke: 'transparent',
            strokeWidth: 0,
            textTransform: 'none', // 'none', 'uppercase', 'lowercase', 'capitalize'
            textDecoration: 'none', // 'none', 'underline', 'line-through'
            textShadow: 'none',
            textOpacity: 1
        };
    }

    // Tool Interface
    startDrawing(event, canvas, context) {
        if (this.isEditing) return;

        const point = this.getCanvasPoint(event, canvas);
        
        this.currentText = {
            type: 'text',
            x: point.x,
            y: point.y,
            text: '',
            width: 200, // Default width for text box
            height: 0, // Will be calculated based on content
            ...this.options
        };

        this.isEditing = true;
        this.createTextInput(canvas, point);
    }

    draw(event, canvas, context) {
        if (!this.currentText || this.isEditing) return;

        this.drawText(context);
    }

    stopDrawing(event, canvas, context) {
        if (this.currentText && this.currentText.text.trim()) {
            this.layerManager.addObject(this.currentText);
            this.stateManager.saveHistory();
        }
        this.currentText = null;
        this.isEditing = false;
    }

    // Text Input
    createTextInput(canvas, point) {
        const input = document.createElement('textarea');
        input.style.position = 'absolute';
        input.style.left = `${point.x}px`;
        input.style.top = `${point.y}px`;
        input.style.width = `${this.currentText.width}px`;
        input.style.font = `${this.options.fontStyle} ${this.options.fontWeight} ${this.options.fontSize}px ${this.options.fontFamily}`;
        input.style.border = '1px solid #00ff00';
        input.style.padding = '4px';
        input.style.margin = '0';
        input.style.overflow = 'hidden';
        input.style.resize = 'none';
        input.style.background = 'transparent';
        input.style.color = this.options.fill;
        input.style.textAlign = this.options.textAlign;
        input.style.lineHeight = `${this.options.lineHeight}em`;
        input.style.letterSpacing = `${this.options.letterSpacing}px`;
        input.style.transform = 'translate(-50%, -50%)';
        input.style.transformOrigin = 'center';

        input.addEventListener('input', (e) => {
            this.currentText.text = e.target.value;
            this.currentText.height = this.calculateTextHeight(e.target.value);
            e.target.style.height = `${this.currentText.height}px`;
        });

        input.addEventListener('blur', () => {
            this.stopDrawing();
            input.remove();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.stopDrawing();
                input.remove();
            }
        });

        canvas.parentElement.appendChild(input);
        input.focus();
    }

    // Text Drawing
    drawText(context) {
        if (!this.currentText) return;

        context.save();
        
        // Apply text styles
        context.font = `${this.currentText.fontStyle} ${this.currentText.fontWeight} ${this.currentText.fontSize}px ${this.currentText.fontFamily}`;
        context.textAlign = this.currentText.textAlign;
        context.textBaseline = 'top';
        context.fillStyle = this.currentText.fill;
        context.globalAlpha = this.currentText.textOpacity;

        // Apply text transform
        let text = this.currentText.text;
        switch (this.currentText.textTransform) {
            case 'uppercase':
                text = text.toUpperCase();
                break;
            case 'lowercase':
                text = text.toLowerCase();
                break;
            case 'capitalize':
                text = text.replace(/\b\w/g, l => l.toUpperCase());
                break;
        }

        // Draw text on path if specified
        if (this.currentText.textPath) {
            this.drawTextOnPath(context, text);
        } else {
            // Draw regular text
            const lines = this.wrapText(text, this.currentText.width);
            let y = this.currentText.y;

            lines.forEach(line => {
                context.fillText(line, this.currentText.x, y);
                
                // Draw text decoration
                if (this.currentText.textDecoration === 'underline') {
                    const metrics = context.measureText(line);
                    context.beginPath();
                    context.moveTo(this.currentText.x, y + this.currentText.fontSize);
                    context.lineTo(this.currentText.x + metrics.width, y + this.currentText.fontSize);
                    context.stroke();
                } else if (this.currentText.textDecoration === 'line-through') {
                    const metrics = context.measureText(line);
                    context.beginPath();
                    context.moveTo(this.currentText.x, y + this.currentText.fontSize / 2);
                    context.lineTo(this.currentText.x + metrics.width, y + this.currentText.fontSize / 2);
                    context.stroke();
                }

                y += this.currentText.fontSize * this.currentText.lineHeight;
            });
        }

        // Draw text shadow if specified
        if (this.currentText.textShadow !== 'none') {
            const [offsetX, offsetY, blur, color] = this.currentText.textShadow.split(' ');
            context.shadowColor = color;
            context.shadowBlur = parseInt(blur);
            context.shadowOffsetX = parseInt(offsetX);
            context.shadowOffsetY = parseInt(offsetY);
        }

        context.restore();
    }

    // Text on Path
    drawTextOnPath(context, text) {
        const path = this.currentText.textPath;
        const pathLength = this.getPathLength(path);
        const fontSize = this.currentText.fontSize;
        const letterSpacing = this.currentText.letterSpacing;
        let currentDistance = 0;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const metrics = context.measureText(char);
            const charWidth = metrics.width;

            // Calculate position on path
            const point = this.getPointOnPath(path, currentDistance);
            const angle = this.getAngleOnPath(path, currentDistance);

            // Draw character
            context.save();
            context.translate(point.x, point.y);
            context.rotate(angle);
            context.fillText(char, 0, 0);
            context.restore();

            currentDistance += charWidth + letterSpacing;
        }
    }

    getPathLength(path) {
        // Calculate approximate path length
        let length = 0;
        for (let i = 1; i < path.length; i++) {
            const dx = path[i].x - path[i-1].x;
            const dy = path[i].y - path[i-1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    }

    getPointOnPath(path, distance) {
        // Get point at distance along path
        let currentLength = 0;
        for (let i = 1; i < path.length; i++) {
            const segmentLength = Math.sqrt(
                Math.pow(path[i].x - path[i-1].x, 2) +
                Math.pow(path[i].y - path[i-1].y, 2)
            );

            if (currentLength + segmentLength >= distance) {
                const t = (distance - currentLength) / segmentLength;
                return {
                    x: path[i-1].x + t * (path[i].x - path[i-1].x),
                    y: path[i-1].y + t * (path[i].y - path[i-1].y)
                };
            }

            currentLength += segmentLength;
        }

        return path[path.length - 1];
    }

    getAngleOnPath(path, distance) {
        // Get angle at distance along path
        const point = this.getPointOnPath(path, distance);
        const nextPoint = this.getPointOnPath(path, distance + 1);
        return Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
    }

    // Text Utilities
    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = this.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    calculateTextHeight(text) {
        const lines = this.wrapText(text, this.currentText.width);
        return lines.length * this.currentText.fontSize * this.currentText.lineHeight;
    }

    measureText(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${this.currentText.fontStyle} ${this.currentText.fontWeight} ${this.currentText.fontSize}px ${this.currentText.fontFamily}`;
        return context.measureText(text);
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
        return 'text';
    }
}

export default TextTool; 