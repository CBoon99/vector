import { Tool } from './tool.js';
import { generateId } from '../utils/id-generator.js';

export class TextTool extends Tool {
    constructor(stateManager, layerManager) {
        super(stateManager, layerManager);
        this.name = 'text';
        this.icon = 'text-icon';
        this.cursor = 'text';
        this.activeTextElement = null;
        this.textBox = null;
    }

    initialize() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle text input
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('input', this.handleTextInput.bind(this));
        document.addEventListener('blur', this.handleTextBlur.bind(this), true);
    }

    startDrawing(event, canvas, context) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Create new text element
        this.activeTextElement = {
            id: generateId(),
            type: 'text',
            x,
            y,
            text: '',
            fontSize: 16,
            fontFamily: 'Arial',
            color: this.stateManager.getState().currentColor,
            rotation: 0,
            width: 200,
            height: 24
        };

        // Create text input box
        this.createTextBox(x, y);
    }

    createTextBox(x, y) {
        // Remove existing text box if any
        if (this.textBox) {
            document.body.removeChild(this.textBox);
        }

        // Create new text box
        this.textBox = document.createElement('div');
        this.textBox.contentEditable = true;
        this.textBox.style.position = 'absolute';
        this.textBox.style.left = `${x}px`;
        this.textBox.style.top = `${y}px`;
        this.textBox.style.minWidth = '200px';
        this.textBox.style.minHeight = '24px';
        this.textBox.style.padding = '4px';
        this.textBox.style.border = '1px solid #ccc';
        this.textBox.style.backgroundColor = 'white';
        this.textBox.style.fontSize = '16px';
        this.textBox.style.fontFamily = 'Arial';
        this.textBox.style.outline = 'none';
        this.textBox.style.zIndex = '1000';

        document.body.appendChild(this.textBox);
        this.textBox.focus();
    }

    handleTextInput(event) {
        if (this.activeTextElement && this.textBox) {
            this.activeTextElement.text = this.textBox.textContent;
            this.layerManager.updateLayer(this.activeTextElement);
        }
    }

    handleKeyDown(event) {
        if (!this.activeTextElement || !this.textBox) return;

        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.finalizeText();
        } else if (event.key === 'Escape') {
            this.cancelText();
        }
    }

    handleTextBlur(event) {
        if (this.textBox && !this.textBox.contains(event.relatedTarget)) {
            this.finalizeText();
        }
    }

    finalizeText() {
        if (this.activeTextElement && this.textBox) {
            // Only save if there's actual text
            if (this.activeTextElement.text.trim()) {
                this.layerManager.addLayer(this.activeTextElement);
                this.stateManager.saveState();
            }
            
            // Clean up
            document.body.removeChild(this.textBox);
            this.textBox = null;
            this.activeTextElement = null;
        }
    }

    cancelText() {
        if (this.textBox) {
            document.body.removeChild(this.textBox);
            this.textBox = null;
            this.activeTextElement = null;
        }
    }

    draw(context) {
        // Draw existing text elements
        const layers = this.layerManager.getLayers();
        layers.forEach(layer => {
            if (layer.type === 'text') {
                this.drawTextElement(context, layer);
            }
        });
    }

    drawTextElement(context, element) {
        context.save();
        context.translate(element.x, element.y);
        context.rotate(element.rotation);
        
        context.font = `${element.fontSize}px ${element.fontFamily}`;
        context.fillStyle = element.color;
        context.textBaseline = 'top';
        
        // Draw text with word wrap
        const words = element.text.split(' ');
        let line = '';
        let y = 0;
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = context.measureText(testLine);
            
            if (metrics.width > element.width && i > 0) {
                context.fillText(line, 0, y);
                line = words[i] + ' ';
                y += element.fontSize;
            } else {
                line = testLine;
            }
        }
        
        context.fillText(line, 0, y);
        context.restore();
    }

    cleanup() {
        this.cancelText();
    }
} 