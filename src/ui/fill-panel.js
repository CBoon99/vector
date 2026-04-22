// Fill Panel UI Component
class FillPanel {
    constructor(fillManager, stateManager) {
        this.fillManager = fillManager;
        this.stateManager = stateManager;
        this.currentFill = null;
        this.selectedObject = null;
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'fill-panel';
        this.panel.innerHTML = `
            <div class="fill-type-selector">
                <button data-type="solid" class="active">Solid</button>
                <button data-type="gradient">Gradient</button>
                <button data-type="pattern">Pattern</button>
            </div>
            <div class="fill-options">
                <div class="solid-options">
                    <input type="color" class="color-picker">
                    <input type="range" class="opacity-slider" min="0" max="100" value="100">
                </div>
                <div class="gradient-options" style="display: none;">
                    <select class="gradient-type">
                        <option value="linear">Linear</option>
                        <option value="radial">Radial</option>
                        <option value="conical">Conical</option>
                    </select>
                    <div class="gradient-stops"></div>
                    <button class="add-stop">Add Stop</button>
                </div>
                <div class="pattern-options" style="display: none;">
                    <select class="pattern-type">
                        <option value="image">Image</option>
                        <option value="svg">SVG</option>
                        <option value="preset">Preset</option>
                    </select>
                    <div class="pattern-preview"></div>
                    <div class="pattern-transform">
                        <input type="number" class="scale-x" placeholder="Scale X" value="1">
                        <input type="number" class="scale-y" placeholder="Scale Y" value="1">
                        <input type="number" class="rotation" placeholder="Rotation" value="0">
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Fill type selection
        this.panel.querySelectorAll('.fill-type-selector button').forEach(button => {
            button.addEventListener('click', () => {
                this.setFillType(button.dataset.type);
            });
        });

        // Solid color options
        const colorPicker = this.panel.querySelector('.color-picker');
        const opacitySlider = this.panel.querySelector('.opacity-slider');
        
        colorPicker.addEventListener('input', (e) => {
            this.updateSolidFill(e.target.value, opacitySlider.value / 100);
        });
        
        opacitySlider.addEventListener('input', (e) => {
            this.updateSolidFill(colorPicker.value, e.target.value / 100);
        });

        // Gradient options
        const gradientType = this.panel.querySelector('.gradient-type');
        gradientType.addEventListener('change', () => {
            this.updateGradientType(gradientType.value);
        });

        this.panel.querySelector('.add-stop').addEventListener('click', () => {
            this.addGradientStop();
        });

        // Pattern options
        const patternType = this.panel.querySelector('.pattern-type');
        patternType.addEventListener('change', () => {
            this.updatePatternType(patternType.value);
        });

        // Pattern transform inputs
        this.panel.querySelectorAll('.pattern-transform input').forEach(input => {
            input.addEventListener('input', () => {
                this.updatePatternTransform();
            });
        });
    }

    setFillType(type) {
        // Update UI
        this.panel.querySelectorAll('.fill-type-selector button').forEach(button => {
            button.classList.toggle('active', button.dataset.type === type);
        });

        this.panel.querySelector('.solid-options').style.display = 
            type === 'solid' ? 'block' : 'none';
        this.panel.querySelector('.gradient-options').style.display = 
            type === 'gradient' ? 'block' : 'none';
        this.panel.querySelector('.pattern-options').style.display = 
            type === 'pattern' ? 'block' : 'none';

        // Update fill
        if (this.selectedObject) {
            switch (type) {
                case 'solid':
                    this.currentFill = {
                        type: 'solid',
                        color: '#000000',
                        opacity: 1
                    };
                    break;
                case 'gradient':
                    this.currentFill = {
                        type: 'gradient',
                        gradientId: this.fillManager.defaultGradients['linear-blue']
                    };
                    break;
                case 'pattern':
                    this.currentFill = {
                        type: 'pattern',
                        patternId: this.fillManager.defaultPatterns['dots']
                    };
                    break;
            }
            this.updateObjectFill();
        }
    }

    updateSolidFill(color, opacity) {
        if (this.currentFill?.type === 'solid') {
            this.currentFill.color = color;
            this.currentFill.opacity = opacity;
            this.updateObjectFill();
        }
    }

    updateGradientType(type) {
        if (this.currentFill?.type === 'gradient') {
            const stops = [
                { offset: 0, color: '#000000', opacity: 1 },
                { offset: 1, color: '#ffffff', opacity: 1 }
            ];

            let gradientId;
            switch (type) {
                case 'linear':
                    gradientId = this.fillManager.createLinearGradient(0, 0, 100, 0, stops);
                    break;
                case 'radial':
                    gradientId = this.fillManager.createRadialGradient(50, 50, 0, 50, 50, 50, stops);
                    break;
                case 'conical':
                    gradientId = this.fillManager.createConicalGradient(50, 50, 0, stops);
                    break;
            }

            this.currentFill.gradientId = gradientId;
            this.updateObjectFill();
            this.updateGradientStops();
        }
    }

    addGradientStop() {
        if (this.currentFill?.type === 'gradient') {
            const gradient = this.fillManager.gradients.get(this.currentFill.gradientId);
            if (gradient) {
                const newStop = {
                    offset: 0.5,
                    color: '#808080',
                    opacity: 1
                };
                gradient.stops.push(newStop);
                gradient.stops.sort((a, b) => a.offset - b.offset);
                this.updateGradientStops();
                this.updateObjectFill();
            }
        }
    }

    updateGradientStops() {
        const stopsContainer = this.panel.querySelector('.gradient-stops');
        stopsContainer.innerHTML = '';

        if (this.currentFill?.type === 'gradient') {
            const gradient = this.fillManager.gradients.get(this.currentFill.gradientId);
            if (gradient) {
                gradient.stops.forEach((stop, index) => {
                    const stopElement = document.createElement('div');
                    stopElement.className = 'gradient-stop';
                    stopElement.innerHTML = `
                        <input type="range" class="stop-offset" 
                               min="0" max="100" 
                               value="${stop.offset * 100}">
                        <input type="color" class="stop-color" 
                               value="${stop.color}">
                        <input type="range" class="stop-opacity" 
                               min="0" max="100" 
                               value="${stop.opacity * 100}">
                        <button class="remove-stop">×</button>
                    `;

                    // Event listeners for stop controls
                    stopElement.querySelector('.stop-offset').addEventListener('input', (e) => {
                        stop.offset = e.target.value / 100;
                        this.updateObjectFill();
                    });

                    stopElement.querySelector('.stop-color').addEventListener('input', (e) => {
                        stop.color = e.target.value;
                        this.updateObjectFill();
                    });

                    stopElement.querySelector('.stop-opacity').addEventListener('input', (e) => {
                        stop.opacity = e.target.value / 100;
                        this.updateObjectFill();
                    });

                    stopElement.querySelector('.remove-stop').addEventListener('click', () => {
                        if (gradient.stops.length > 2) {
                            gradient.stops.splice(index, 1);
                            this.updateGradientStops();
                            this.updateObjectFill();
                        }
                    });

                    stopsContainer.appendChild(stopElement);
                });
            }
        }
    }

    updatePatternType(type) {
        if (this.currentFill?.type === 'pattern') {
            let patternId;
            switch (type) {
                case 'preset':
                    patternId = this.fillManager.defaultPatterns['dots'];
                    break;
                case 'image':
                    // Handle image upload
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                const img = new Image();
                                img.onload = () => {
                                    patternId = this.fillManager.createPattern(img);
                                    this.currentFill.patternId = patternId;
                                    this.updateObjectFill();
                                    this.updatePatternPreview();
                                };
                                img.src = event.target.result;
                            };
                            reader.readAsDataURL(file);
                        }
                    };
                    input.click();
                    return;
                case 'svg':
                    // Handle SVG input
                    const svgInput = document.createElement('textarea');
                    svgInput.placeholder = 'Paste SVG code here';
                    svgInput.onchange = (e) => {
                        const parser = new DOMParser();
                        const svgDoc = parser.parseFromString(e.target.value, 'image/svg+xml');
                        const svgElement = svgDoc.documentElement;
                        if (svgElement.tagName === 'svg') {
                            patternId = this.fillManager.createSVGPattern(
                                svgElement,
                                parseInt(svgElement.getAttribute('width')) || 100,
                                parseInt(svgElement.getAttribute('height')) || 100
                            );
                            this.currentFill.patternId = patternId;
                            this.updateObjectFill();
                            this.updatePatternPreview();
                        }
                    };
                    svgInput.click();
                    return;
            }

            if (patternId) {
                this.currentFill.patternId = patternId;
                this.updateObjectFill();
                this.updatePatternPreview();
            }
        }
    }

    updatePatternTransform() {
        if (this.currentFill?.type === 'pattern') {
            const pattern = this.fillManager.patterns.get(this.currentFill.patternId);
            if (pattern) {
                pattern.transform = {
                    scaleX: parseFloat(this.panel.querySelector('.scale-x').value) || 1,
                    scaleY: parseFloat(this.panel.querySelector('.scale-y').value) || 1,
                    rotation: parseFloat(this.panel.querySelector('.rotation').value) || 0,
                    offsetX: 0,
                    offsetY: 0
                };
                this.updateObjectFill();
            }
        }
    }

    updatePatternPreview() {
        const preview = this.panel.querySelector('.pattern-preview');
        preview.innerHTML = '';

        if (this.currentFill?.type === 'pattern') {
            const pattern = this.fillManager.patterns.get(this.currentFill.patternId);
            if (pattern) {
                const canvas = document.createElement('canvas');
                canvas.width = 100;
                canvas.height = 100;
                const ctx = canvas.getContext('2d');

                if (pattern.type === 'svg') {
                    const svgData = new XMLSerializer().serializeToString(pattern.svg);
                    const img = new Image();
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0, 100, 100);
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                } else {
                    ctx.drawImage(pattern.image, 0, 0, 100, 100);
                }

                preview.appendChild(canvas);
            }
        }
    }

    updateObjectFill() {
        if (this.selectedObject && this.currentFill) {
            this.selectedObject.fill = { ...this.currentFill };
            this.stateManager.saveHistory();
        }
    }

    setSelectedObject(object) {
        this.selectedObject = object;
        if (object) {
            this.currentFill = object.fill ? { ...object.fill } : null;
            this.updateUI();
        }
    }

    updateUI() {
        if (this.currentFill) {
            // Set active fill type
            this.setFillType(this.currentFill.type);

            // Update fill-specific UI
            switch (this.currentFill.type) {
                case 'solid':
                    this.panel.querySelector('.color-picker').value = this.currentFill.color;
                    this.panel.querySelector('.opacity-slider').value = this.currentFill.opacity * 100;
                    break;
                case 'gradient':
                    const gradient = this.fillManager.gradients.get(this.currentFill.gradientId);
                    if (gradient) {
                        this.panel.querySelector('.gradient-type').value = gradient.type;
                        this.updateGradientStops();
                    }
                    break;
                case 'pattern':
                    const pattern = this.fillManager.patterns.get(this.currentFill.patternId);
                    if (pattern) {
                        this.panel.querySelector('.scale-x').value = pattern.transform.scaleX;
                        this.panel.querySelector('.scale-y').value = pattern.transform.scaleY;
                        this.panel.querySelector('.rotation').value = pattern.transform.rotation;
                        this.updatePatternPreview();
                    }
                    break;
            }
        }
    }

    getPanel() {
        return this.panel;
    }
}

export default FillPanel; 