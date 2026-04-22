// Export Panel UI Component
class ExportPanel {
    constructor(exportManager, stateManager) {
        this.exportManager = exportManager;
        this.stateManager = stateManager;
        this.selectedFormat = 'svg';
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'export-panel';
        this.panel.innerHTML = `
            <div class="export-header">
                <h3>Export</h3>
            </div>
            <div class="export-content">
                <div class="format-selection">
                    <h4>Format</h4>
                    <div class="format-buttons">
                        <button class="format-button active" data-format="svg">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
                            </svg>
                            SVG
                        </button>
                        <button class="format-button" data-format="png">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                            </svg>
                            PNG
                        </button>
                        <button class="format-button" data-format="pdf">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5c0 1.38-1.12 2.5-2.5 2.5S10 13.88 10 12.5s1.12-2.5 2.5-2.5c.57 0 1.08.19 1.5.51V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/>
                            </svg>
                            PDF
                        </button>
                    </div>
                </div>
                <div class="export-options">
                    <div class="options-section svg-options">
                        <h4>SVG Options</h4>
                        <div class="option-group">
                            <label>
                                <input type="checkbox" class="include-metadata" checked>
                                Include Metadata
                            </label>
                        </div>
                        <div class="option-group">
                            <label>
                                <input type="checkbox" class="optimize-paths" checked>
                                Optimize Paths
                            </label>
                        </div>
                        <div class="option-group">
                            <label>
                                <input type="checkbox" class="embed-images" checked>
                                Embed Images
                            </label>
                        </div>
                        <div class="option-group">
                            <label>Precision</label>
                            <input type="number" class="precision" value="2" min="0" max="5">
                        </div>
                    </div>
                    <div class="options-section png-options" style="display: none;">
                        <h4>PNG Options</h4>
                        <div class="option-group">
                            <label>Scale</label>
                            <input type="number" class="scale" value="1" min="0.1" max="10" step="0.1">
                        </div>
                        <div class="option-group">
                            <label>Background</label>
                            <input type="color" class="background-color" value="#ffffff">
                        </div>
                        <div class="option-group">
                            <label>DPI</label>
                            <input type="number" class="dpi" value="72" min="72" max="600">
                        </div>
                    </div>
                    <div class="options-section pdf-options" style="display: none;">
                        <h4>PDF Options</h4>
                        <div class="option-group">
                            <label>Page Size</label>
                            <select class="page-size">
                                <option value="A4">A4</option>
                                <option value="A3">A3</option>
                                <option value="Letter">Letter</option>
                                <option value="Legal">Legal</option>
                            </select>
                        </div>
                        <div class="option-group">
                            <label>Orientation</label>
                            <select class="orientation">
                                <option value="portrait">Portrait</option>
                                <option value="landscape">Landscape</option>
                            </select>
                        </div>
                        <div class="option-group">
                            <label>Margin (pt)</label>
                            <input type="number" class="margin" value="0" min="0" max="100">
                        </div>
                        <div class="option-group">
                            <label>
                                <input type="checkbox" class="include-metadata" checked>
                                Include Metadata
                            </label>
                        </div>
                    </div>
                </div>
                <div class="export-preview">
                    <h4>Preview</h4>
                    <div class="preview-container">
                        <canvas width="200" height="150"></canvas>
                    </div>
                </div>
                <div class="export-actions">
                    <button class="export-button">Export</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updatePreview();
    }

    setupEventListeners() {
        // Format selection
        this.panel.querySelectorAll('.format-button').forEach(button => {
            button.addEventListener('click', () => {
                this.panel.querySelectorAll('.format-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                this.selectedFormat = button.dataset.format;
                this.updateOptionsVisibility();
                this.updatePreview();
            });
        });

        // Option changes
        this.panel.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => {
                this.updatePreview();
            });
        });

        // Export button
        this.panel.querySelector('.export-button').addEventListener('click', () => {
            this.export();
        });
    }

    updateOptionsVisibility() {
        this.panel.querySelectorAll('.options-section').forEach(section => {
            section.style.display = 'none';
        });
        this.panel.querySelector(`.${this.selectedFormat}-options`).style.display = 'block';
    }

    getExportOptions() {
        const options = {};

        switch (this.selectedFormat) {
            case 'svg':
                options.includeMetadata = this.panel.querySelector('.svg-options .include-metadata').checked;
                options.optimizePaths = this.panel.querySelector('.svg-options .optimize-paths').checked;
                options.embedImages = this.panel.querySelector('.svg-options .embed-images').checked;
                options.precision = parseInt(this.panel.querySelector('.svg-options .precision').value);
                break;

            case 'png':
                options.scale = parseFloat(this.panel.querySelector('.png-options .scale').value);
                options.backgroundColor = this.panel.querySelector('.png-options .background-color').value;
                options.dpi = parseInt(this.panel.querySelector('.png-options .dpi').value);
                break;

            case 'pdf':
                options.pageSize = this.panel.querySelector('.pdf-options .page-size').value;
                options.orientation = this.panel.querySelector('.pdf-options .orientation').value;
                options.margin = parseInt(this.panel.querySelector('.pdf-options .margin').value);
                options.includeMetadata = this.panel.querySelector('.pdf-options .include-metadata').checked;
                break;
        }

        return options;
    }

    async updatePreview() {
        const canvas = this.panel.querySelector('.preview-container canvas');
        const ctx = canvas.getContext('2d');
        const objects = this.stateManager.getObjects();
        const bounds = this.exportManager.calculateBounds(objects);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate scale to fit preview
        const scale = Math.min(
            canvas.width / bounds.width,
            canvas.height / bounds.height
        );

        // Apply transformations
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(-bounds.x, -bounds.y);

        // Render objects
        objects.forEach(obj => {
            this.exportManager.renderObject(ctx, obj);
        });

        ctx.restore();
    }

    async export() {
        const options = this.getExportOptions();
        let result;

        try {
            switch (this.selectedFormat) {
                case 'svg':
                    result = await this.exportManager.exportToSVG(options);
                    this.downloadFile(result, 'image/svg+xml', 'export.svg');
                    break;

                case 'png':
                    result = await this.exportManager.exportToPNG(options);
                    this.downloadFile(result, 'image/png', 'export.png');
                    break;

                case 'pdf':
                    result = await this.exportManager.exportToPDF(options);
                    result.save('export.pdf');
                    break;
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        }
    }

    downloadFile(data, mimeType, filename) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    getPanel() {
        return this.panel;
    }
}

export default ExportPanel; 