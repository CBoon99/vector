// Onboarding Module
class Onboarding {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                title: 'Welcome to DoppleIt Vector!',
                content: 'Let\'s get you started with the basics of vector graphics editing.',
                target: '#drawing-tools',
                position: 'bottom'
            },
            {
                title: 'Drawing Tools',
                content: 'Use these tools to create shapes and paths. Start with the Pen tool for freehand drawing.',
                target: '#pen-tool',
                position: 'right'
            },
            {
                title: 'Color Controls',
                content: 'Choose colors using the color wheel, sliders, or input fields. You can set both fill and stroke colors.',
                target: '#color-wheel',
                position: 'left'
            },
            {
                title: 'Layers',
                content: 'Organize your artwork using layers. Each layer can contain multiple objects.',
                target: '#layer-section',
                position: 'top'
            },
            {
                title: 'Export',
                content: 'Save your work as SVG, PNG, or project files. Use the export section to save your creations.',
                target: '#export-section',
                position: 'bottom'
            }
        ];
        this.overlay = null;
        this.tooltip = null;
        this.isActive = false;
    }

    initialize() {
        this.createOverlay();
        this.createTooltip();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'onboarding-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            display: none;
        `;
        document.body.appendChild(this.overlay);
    }

    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'onboarding-tooltip';
        this.tooltip.style.cssText = `
            position: absolute;
            background: white;
            border: 2px solid #007acc;
            border-radius: 8px;
            padding: 15px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            display: none;
        `;
        document.body.appendChild(this.tooltip);
    }

    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentStep = 0;
        this.overlay.style.display = 'block';
        this.showStep();
        
        // Add event listeners
        this.overlay.addEventListener('click', this.nextStep.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    stop() {
        this.isActive = false;
        this.overlay.style.display = 'none';
        this.tooltip.style.display = 'none';
        
        // Remove event listeners
        this.overlay.removeEventListener('click', this.nextStep.bind(this));
        document.removeEventListener('keydown', this.handleKeydown.bind(this));
    }

    showStep() {
        if (this.currentStep >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[this.currentStep];
        const targetElement = document.querySelector(step.target);
        
        if (!targetElement) {
            this.nextStep();
            return;
        }

        // Update tooltip content
        this.tooltip.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #007acc;">${step.title}</h3>
            <p style="margin: 0 0 15px 0; line-height: 1.4;">${step.content}</p>
            <div style="text-align: right;">
                <span style="color: #666; font-size: 12px;">${this.currentStep + 1} of ${this.steps.length}</span>
            </div>
        `;

        // Position tooltip
        this.positionTooltip(targetElement, step.position);
        
        // Show tooltip
        this.tooltip.style.display = 'block';
        
        // Highlight target element
        this.highlightElement(targetElement);
    }

    positionTooltip(targetElement, position) {
        const targetRect = targetElement.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        let left, top;
        
        switch (position) {
            case 'top':
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                top = targetRect.top - tooltipRect.height - 10;
                break;
            case 'bottom':
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                top = targetRect.bottom + 10;
                break;
            case 'left':
                left = targetRect.left - tooltipRect.width - 10;
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                break;
            case 'right':
                left = targetRect.right + 10;
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                break;
            default:
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                top = targetRect.bottom + 10;
        }
        
        // Ensure tooltip stays within viewport
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));
        
        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
    }

    highlightElement(element) {
        // Add highlight class
        element.classList.add('onboarding-highlight');
        
        // Remove highlight after animation
        setTimeout(() => {
            element.classList.remove('onboarding-highlight');
        }, 2000);
    }

    nextStep() {
        this.currentStep++;
        this.showStep();
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep();
        }
    }

    complete() {
        this.stop();
        
        // Show completion message
        const completionMessage = document.createElement('div');
        completionMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #28a745;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        completionMessage.innerHTML = `
            <h3 style="color: #28a745; margin: 0 0 10px 0;">🎉 Onboarding Complete!</h3>
            <p style="margin: 0;">You're ready to start creating amazing vector graphics!</p>
        `;
        
        document.body.appendChild(completionMessage);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (completionMessage.parentNode) {
                completionMessage.parentNode.removeChild(completionMessage);
            }
        }, 3000);
    }

    handleKeydown(event) {
        switch (event.key) {
            case 'Escape':
                this.stop();
                break;
            case 'ArrowRight':
            case ' ':
                this.nextStep();
                break;
            case 'ArrowLeft':
                this.previousStep();
                break;
        }
    }

    cleanup() {
        this.stop();
        this.overlay?.remove();
        this.tooltip?.remove();
        this.overlay = null;
        this.tooltip = null;
    }
}

export default Onboarding; 