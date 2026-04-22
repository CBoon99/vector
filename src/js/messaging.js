class MessagingSystem {
    constructor() {
        this.messageContainer = document.createElement('div');
        this.messageContainer.id = 'message-container';
        document.body.appendChild(this.messageContainer);
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close message when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.closest('.message') || e.target.closest('.upgrade-message')) return;
            this.closeAllMessages();
        });

        // Close message with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAllMessages();
        });
    }

    showMessage(message, type = 'info', duration = 3000) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        this.messageContainer.appendChild(messageElement);
        
        if (duration > 0) {
            setTimeout(() => {
                this.closeMessage(messageElement);
            }, duration);
        }
        
        return messageElement;
    }

    showUpgradeMessage(features) {
        const messageElement = document.createElement('div');
        messageElement.className = 'upgrade-message';
        
        const content = document.createElement('div');
        content.className = 'upgrade-content';
        
        const title = document.createElement('h3');
        title.textContent = 'Upgrade Available';
        
        const description = document.createElement('p');
        description.textContent = 'Unlock these premium features:';
        
        const featureList = document.createElement('ul');
        featureList.className = 'feature-list';
        
        features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            featureList.appendChild(li);
        });
        
        const closeButton = document.createElement('button');
        closeButton.className = 'close-message';
        closeButton.textContent = 'Close';
        closeButton.onclick = () => this.closeMessage(messageElement);
        
        content.appendChild(title);
        content.appendChild(description);
        content.appendChild(featureList);
        content.appendChild(closeButton);
        
        messageElement.appendChild(content);
        document.body.appendChild(messageElement);
        
        return messageElement;
    }

    showFeatureTooltip(element, message) {
        const tooltip = document.createElement('div');
        tooltip.className = 'feature-tooltip';
        tooltip.textContent = message;
        
        element.appendChild(tooltip);
        
        return tooltip;
    }

    closeMessage(messageElement) {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translate(-50%, -20px)';
        
        setTimeout(() => {
            messageElement.remove();
        }, 300);
    }

    closeAllMessages() {
        const messages = document.querySelectorAll('.message, .upgrade-message');
        messages.forEach(message => this.closeMessage(message));
    }

    // Convenience methods for different message types
    showInfo(message, duration) {
        return this.showMessage(message, 'info', duration);
    }

    showSuccess(message, duration) {
        return this.showMessage(message, 'success', duration);
    }

    showError(message, duration) {
        return this.showMessage(message, 'error', duration);
    }

    showWarning(message, duration) {
        return this.showMessage(message, 'warning', duration);
    }

    showFeature(message, duration) {
        return this.showMessage(message, 'feature', duration);
    }
}

// Export the messaging system
const messaging = new MessagingSystem();
export default messaging; 