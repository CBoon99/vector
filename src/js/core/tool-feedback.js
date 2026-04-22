// Tool Feedback Module
class ToolFeedback {
    constructor() {
        this.feedbackElement = null;
        this.isVisible = false;
        this.timeoutId = null;
    }

    initialize() {
        this.createFeedbackElement();
    }

    createFeedbackElement() {
        this.feedbackElement = document.createElement('div');
        this.feedbackElement.id = 'tool-feedback';
        this.feedbackElement.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
            display: none;
            pointer-events: none;
        `;
        document.body.appendChild(this.feedbackElement);
    }

    show(message, duration = 2000) {
        if (!this.feedbackElement) {
            this.initialize();
        }

        this.feedbackElement.textContent = message;
        this.feedbackElement.style.display = 'block';
        this.isVisible = true;

        // Clear existing timeout
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        // Auto-hide after duration
        this.timeoutId = setTimeout(() => {
            this.hide();
        }, duration);
    }

    hide() {
        if (this.feedbackElement) {
            this.feedbackElement.style.display = 'none';
            this.isVisible = false;
        }
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    update(message) {
        if (this.isVisible) {
            this.feedbackElement.textContent = message;
        }
    }

    showProgress(message, progress) {
        const progressMessage = `${message} ${Math.round(progress * 100)}%`;
        this.show(progressMessage, 0); // Don't auto-hide
    }
}

export default ToolFeedback; 