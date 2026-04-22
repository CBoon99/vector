import UIService from '../services/uiService.js';

class ShapeToolUI {
    static createToolButton() {
        const button = UIService.createButton(
            'shape-tool',
            'Shapes',
            'tool-button',
            'Create shapes (rectangle, circle, ellipse, star)'
        );
        return button;
    }

    static createControls() {
        const container = document.createElement('div');
        container.id = 'shape-controls';
        container.className = 'tool-controls';
        container.style.display = 'none';

        // Shape type buttons
        const shapeTypes = ['rectangle', 'circle', 'ellipse', 'star'];
        const buttonGroup = UIService.createControlGroup();
        buttonGroup.className = 'shape-type-group';
        
        shapeTypes.forEach(type => {
            const button = UIService.createButton(
                `shape-${type}`,
                type.charAt(0).toUpperCase() + type.slice(1),
                'shape-type-button',
                `Create ${type}`
            );
            button.dataset.shape = type;
            buttonGroup.appendChild(button);
        });

        // Shape options
        const optionsGroup = UIService.createControlGroup();
        optionsGroup.className = 'shape-options-group';
        
        // Corner radius (for rectangle)
        const cornerRadiusControl = document.createElement('div');
        cornerRadiusControl.className = 'control-item';
        cornerRadiusControl.innerHTML = `
            <label for="corner-radius">Corner Radius:</label>
            <input type="number" id="corner-radius" min="0" value="0">
        `;
        optionsGroup.appendChild(cornerRadiusControl);

        // Star points
        const pointsControl = document.createElement('div');
        pointsControl.className = 'control-item';
        pointsControl.innerHTML = `
            <label for="star-points">Star Points:</label>
            <input type="number" id="star-points" min="3" max="20" value="5">
        `;
        optionsGroup.appendChild(pointsControl);

        // Fill color
        const fillControl = document.createElement('div');
        fillControl.className = 'control-item';
        fillControl.innerHTML = `
            <label for="shape-fill">Fill Color:</label>
            <input type="color" id="shape-fill" value="#ffffff">
        `;
        optionsGroup.appendChild(fillControl);

        // Stroke color
        const strokeControl = document.createElement('div');
        strokeControl.className = 'control-item';
        strokeControl.innerHTML = `
            <label for="shape-stroke">Stroke Color:</label>
            <input type="color" id="shape-stroke" value="#000000">
        `;
        optionsGroup.appendChild(strokeControl);

        // Stroke width
        const strokeWidthControl = document.createElement('div');
        strokeWidthControl.className = 'control-item';
        strokeWidthControl.innerHTML = `
            <label for="stroke-width">Stroke Width:</label>
            <input type="number" id="stroke-width" min="1" max="20" value="1">
        `;
        optionsGroup.appendChild(strokeWidthControl);

        container.appendChild(buttonGroup);
        container.appendChild(optionsGroup);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .shape-type-group {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
            }

            .shape-type-button {
                flex: 1;
                padding: 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
                background: #fff;
                cursor: pointer;
                transition: all 0.2s;
            }

            .shape-type-button:hover {
                background: #f0f0f0;
            }

            .shape-type-button.active {
                background: #e0e0e0;
                border-color: #999;
            }

            .shape-options-group {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .control-item {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .control-item label {
                font-size: 12px;
                color: #666;
            }

            .control-item input {
                padding: 4px;
                border: 1px solid #ccc;
                border-radius: 4px;
            }

            .control-item input[type="color"] {
                height: 32px;
                padding: 2px;
            }

            .control-item input[type="number"] {
                width: 60px;
            }
        `;
        document.head.appendChild(style);

        return container;
    }
}

export default ShapeToolUI; 