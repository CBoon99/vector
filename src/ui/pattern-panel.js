// Pattern Panel UI Component
class PatternPanel {
    constructor(patternManager, stateManager) {
        this.patternManager = patternManager;
        this.stateManager = stateManager;
        this.selectedCategory = 'All';
        this.searchQuery = '';
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'pattern-panel';
        this.panel.innerHTML = `
            <div class="pattern-header">
                <div class="pattern-search">
                    <input type="text" placeholder="Search patterns...">
                </div>
                <div class="pattern-categories">
                    <select>
                        <option value="All">All Categories</option>
                    </select>
                </div>
                <button class="create-pattern">Create Pattern</button>
            </div>
            <div class="pattern-grid"></div>
            <div class="pattern-details" style="display: none;">
                <h3>Pattern Details</h3>
                <div class="details-content"></div>
                <div class="pattern-preview">
                    <canvas width="200" height="200"></canvas>
                </div>
                <div class="pattern-controls">
                    <div class="control-group">
                        <label>Repeat Mode:</label>
                        <select class="repeat-mode">
                            <option value="tile">Tile</option>
                            <option value="mirror">Mirror</option>
                            <option value="radial">Radial</option>
                            <option value="spiral">Spiral</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>Spacing:</label>
                        <div class="spacing-controls">
                            <input type="number" class="spacing-x" placeholder="X">
                            <input type="number" class="spacing-y" placeholder="Y">
                        </div>
                    </div>
                    <div class="control-group">
                        <label>Scale:</label>
                        <div class="scale-controls">
                            <input type="number" class="scale-x" placeholder="X" step="0.1">
                            <input type="number" class="scale-y" placeholder="Y" step="0.1">
                        </div>
                    </div>
                    <div class="control-group">
                        <label>Rotation:</label>
                        <input type="number" class="rotation" step="1">
                    </div>
                    <div class="control-group">
                        <label>Skew:</label>
                        <div class="skew-controls">
                            <input type="number" class="skew-x" placeholder="X" step="0.1">
                            <input type="number" class="skew-y" placeholder="Y" step="0.1">
                        </div>
                    </div>
                </div>
                <div class="details-actions">
                    <button class="edit-pattern">Edit</button>
                    <button class="delete-pattern">Delete</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateCategories();
        this.updatePatternGrid();
    }

    setupEventListeners() {
        // Search
        const searchInput = this.panel.querySelector('.pattern-search input');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.updatePatternGrid();
        });

        // Category selection
        const categorySelect = this.panel.querySelector('.pattern-categories select');
        categorySelect.addEventListener('change', (e) => {
            this.selectedCategory = e.target.value;
            this.updatePatternGrid();
        });

        // Create pattern button
        this.panel.querySelector('.create-pattern').addEventListener('click', () => {
            this.showCreatePatternDialog();
        });

        // Pattern grid events
        this.panel.querySelector('.pattern-grid').addEventListener('click', (e) => {
            const patternElement = e.target.closest('.pattern-item');
            if (patternElement) {
                this.showPatternDetails(patternElement.dataset.id);
            }
        });

        // Pattern controls
        this.setupPatternControls();

        // Details panel events
        this.panel.querySelector('.edit-pattern').addEventListener('click', () => {
            this.showEditPatternDialog();
        });

        this.panel.querySelector('.delete-pattern').addEventListener('click', () => {
            this.deleteSelectedPattern();
        });
    }

    setupPatternControls() {
        const controls = this.panel.querySelector('.pattern-controls');
        const updatePattern = () => {
            const patternId = this.panel.querySelector('.pattern-details').dataset.patternId;
            if (!patternId) return;

            const pattern = this.patternManager.patterns.get(patternId);
            if (!pattern) return;

            pattern.repeat.mode = controls.querySelector('.repeat-mode').value;
            pattern.repeat.spacing = {
                x: parseFloat(controls.querySelector('.spacing-x').value) || 0,
                y: parseFloat(controls.querySelector('.spacing-y').value) || 0
            };
            pattern.transform.scale = {
                x: parseFloat(controls.querySelector('.scale-x').value) || 1,
                y: parseFloat(controls.querySelector('.scale-y').value) || 1
            };
            pattern.transform.rotation = parseFloat(controls.querySelector('.rotation').value) || 0;
            pattern.transform.skew = {
                x: parseFloat(controls.querySelector('.skew-x').value) || 0,
                y: parseFloat(controls.querySelector('.skew-y').value) || 0
            };

            this.updatePatternPreview(patternId);
        };

        controls.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', updatePattern);
            input.addEventListener('input', updatePattern);
        });
    }

    updateCategories() {
        const select = this.panel.querySelector('.pattern-categories select');
        const categories = ['All', ...this.patternManager.getCategories()];
        
        select.innerHTML = categories.map(category => 
            `<option value="${category}">${category}</option>`
        ).join('');
    }

    updatePatternGrid() {
        const grid = this.panel.querySelector('.pattern-grid');
        let patterns;

        if (this.searchQuery) {
            patterns = this.patternManager.searchPatterns(this.searchQuery);
        } else if (this.selectedCategory === 'All') {
            patterns = Array.from(this.patternManager.patterns.values());
        } else {
            patterns = this.patternManager.getPatternsByCategory(this.selectedCategory);
        }

        grid.innerHTML = patterns.map(pattern => `
            <div class="pattern-item" data-id="${pattern.id}">
                <div class="pattern-preview">
                    <canvas width="100" height="100"></canvas>
                </div>
                <div class="pattern-info">
                    <h4>${pattern.name}</h4>
                    <span class="category">${pattern.category}</span>
                </div>
            </div>
        `).join('');

        // Render previews
        patterns.forEach(pattern => {
            const canvas = grid.querySelector(`[data-id="${pattern.id}"] canvas`);
            const ctx = canvas.getContext('2d');
            this.renderPatternPreview(pattern, ctx);
        });
    }

    renderPatternPreview(pattern, context) {
        // Clear canvas
        context.clearRect(0, 0, 100, 100);

        // Render pattern
        this.patternManager.renderPattern(pattern.id, context, {
            x: 0,
            y: 0,
            width: 100,
            height: 100
        });
    }

    updatePatternPreview(patternId) {
        const canvas = this.panel.querySelector('.pattern-details .pattern-preview canvas');
        const ctx = canvas.getContext('2d');
        const pattern = this.patternManager.patterns.get(patternId);
        
        if (pattern) {
            ctx.clearRect(0, 0, 200, 200);
            this.patternManager.renderPattern(patternId, ctx, {
                x: 0,
                y: 0,
                width: 200,
                height: 200
            });
        }
    }

    showPatternDetails(patternId) {
        const pattern = this.patternManager.patterns.get(patternId);
        if (!pattern) return;

        const detailsPanel = this.panel.querySelector('.pattern-details');
        const detailsContent = this.panel.querySelector('.details-content');
        const controls = this.panel.querySelector('.pattern-controls');

        detailsContent.innerHTML = `
            <div class="detail-item">
                <label>Name:</label>
                <span>${pattern.name}</span>
            </div>
            <div class="detail-item">
                <label>Category:</label>
                <span>${pattern.category}</span>
            </div>
            <div class="detail-item">
                <label>Created:</label>
                <span>${pattern.metadata.created.toLocaleDateString()}</span>
            </div>
            <div class="detail-item">
                <label>Modified:</label>
                <span>${pattern.metadata.modified.toLocaleDateString()}</span>
            </div>
            <div class="detail-item">
                <label>Tags:</label>
                <span>${pattern.metadata.tags.join(', ') || 'None'}</span>
            </div>
            <div class="detail-item">
                <label>Description:</label>
                <p>${pattern.metadata.description || 'No description'}</p>
            </div>
        `;

        // Update controls
        controls.querySelector('.repeat-mode').value = pattern.repeat.mode;
        controls.querySelector('.spacing-x').value = pattern.repeat.spacing.x;
        controls.querySelector('.spacing-y').value = pattern.repeat.spacing.y;
        controls.querySelector('.scale-x').value = pattern.transform.scale.x;
        controls.querySelector('.scale-y').value = pattern.transform.scale.y;
        controls.querySelector('.rotation').value = pattern.transform.rotation;
        controls.querySelector('.skew-x').value = pattern.transform.skew.x;
        controls.querySelector('.skew-y').value = pattern.transform.skew.y;

        detailsPanel.style.display = 'block';
        detailsPanel.dataset.patternId = patternId;
        this.updatePatternPreview(patternId);
    }

    showCreatePatternDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'dialog create-pattern-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Create New Pattern</h3>
                <form>
                    <div class="form-group">
                        <label>Name:</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Category:</label>
                        <input type="text" name="category" list="categories">
                        <datalist id="categories">
                            ${this.patternManager.getCategories().map(category =>
                                `<option value="${category}">`
                            ).join('')}
                        </datalist>
                    </div>
                    <div class="form-group">
                        <label>Repeat Mode:</label>
                        <select name="repeatMode">
                            <option value="tile">Tile</option>
                            <option value="mirror">Mirror</option>
                            <option value="radial">Radial</option>
                            <option value="spiral">Spiral</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Description:</label>
                        <textarea name="description"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Tags:</label>
                        <input type="text" name="tags" placeholder="Comma-separated tags">
                    </div>
                    <div class="dialog-actions">
                        <button type="submit">Create</button>
                        <button type="button" class="cancel">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const selectedObjects = this.stateManager.getSelectedObjects();

            if (selectedObjects.length === 0) {
                alert('Please select objects to create a pattern');
                return;
            }

            const patternId = this.patternManager.createPattern(
                formData.get('name'),
                selectedObjects,
                {
                    category: formData.get('category') || 'Uncategorized',
                    repeatMode: formData.get('repeatMode'),
                    description: formData.get('description'),
                    tags: formData.get('tags')
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag)
                }
            );

            this.updateCategories();
            this.updatePatternGrid();
            dialog.remove();
        });

        dialog.querySelector('.cancel').addEventListener('click', () => {
            dialog.remove();
        });
    }

    showEditPatternDialog() {
        const patternId = this.panel.querySelector('.pattern-details').dataset.patternId;
        const pattern = this.patternManager.patterns.get(patternId);
        if (!pattern) return;

        const dialog = document.createElement('div');
        dialog.className = 'dialog edit-pattern-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Edit Pattern</h3>
                <form>
                    <div class="form-group">
                        <label>Name:</label>
                        <input type="text" name="name" value="${pattern.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Category:</label>
                        <input type="text" name="category" value="${pattern.category}" list="categories">
                        <datalist id="categories">
                            ${this.patternManager.getCategories().map(category =>
                                `<option value="${category}">`
                            ).join('')}
                        </datalist>
                    </div>
                    <div class="form-group">
                        <label>Description:</label>
                        <textarea name="description">${pattern.metadata.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Tags:</label>
                        <input type="text" name="tags" value="${pattern.metadata.tags.join(', ')}" 
                               placeholder="Comma-separated tags">
                    </div>
                    <div class="dialog-actions">
                        <button type="submit">Save</button>
                        <button type="button" class="cancel">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            this.patternManager.updatePattern(patternId, {
                name: formData.get('name'),
                category: formData.get('category') || 'Uncategorized',
                metadata: {
                    ...pattern.metadata,
                    description: formData.get('description'),
                    tags: formData.get('tags')
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag)
                }
            });

            this.updateCategories();
            this.updatePatternGrid();
            this.showPatternDetails(patternId);
            dialog.remove();
        });

        dialog.querySelector('.cancel').addEventListener('click', () => {
            dialog.remove();
        });
    }

    deleteSelectedPattern() {
        const patternId = this.panel.querySelector('.pattern-details').dataset.patternId;
        if (!patternId) return;

        if (confirm('Are you sure you want to delete this pattern?')) {
            this.patternManager.deletePattern(patternId);
            this.panel.querySelector('.pattern-details').style.display = 'none';
            this.updatePatternGrid();
        }
    }

    getPanel() {
        return this.panel;
    }
}

export default PatternPanel; 