// Artboard Panel UI Component
class ArtboardPanel {
    constructor(artboardManager, stateManager) {
        this.artboardManager = artboardManager;
        this.stateManager = stateManager;
        this.selectedArtboardId = null;
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'artboard-panel';
        this.panel.innerHTML = `
            <div class="artboard-header">
                <div class="artboard-search">
                    <input type="text" placeholder="Search artboards...">
                </div>
                <button class="create-artboard">New Artboard</button>
            </div>
            <div class="artboard-list"></div>
            <div class="artboard-details" style="display: none;">
                <h3>Artboard Details</h3>
                <div class="details-content"></div>
                <div class="details-actions">
                    <button class="edit-artboard">Edit</button>
                    <button class="delete-artboard">Delete</button>
                </div>
            </div>
            <div class="artboard-arrange">
                <h4>Arrange Artboards</h4>
                <div class="arrange-buttons">
                    <button data-layout="grid" title="Grid Layout">
                        <svg viewBox="0 0 24 24">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                        </svg>
                    </button>
                    <button data-layout="horizontal" title="Horizontal Layout">
                        <svg viewBox="0 0 24 24">
                            <rect x="3" y="3" width="5" height="18"/>
                            <rect x="10" y="3" width="5" height="18"/>
                            <rect x="17" y="3" width="5" height="18"/>
                        </svg>
                    </button>
                    <button data-layout="vertical" title="Vertical Layout">
                        <svg viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="5"/>
                            <rect x="3" y="10" width="18" height="5"/>
                            <rect x="3" y="17" width="18" height="5"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateArtboardList();
    }

    setupEventListeners() {
        // Search
        const searchInput = this.panel.querySelector('.artboard-search input');
        searchInput.addEventListener('input', (e) => {
            this.updateArtboardList(e.target.value);
        });

        // Create artboard button
        this.panel.querySelector('.create-artboard').addEventListener('click', () => {
            this.showCreateArtboardDialog();
        });

        // Artboard list events
        this.panel.querySelector('.artboard-list').addEventListener('click', (e) => {
            const artboardElement = e.target.closest('.artboard-item');
            if (artboardElement) {
                this.showArtboardDetails(artboardElement.dataset.id);
            }
        });

        // Details panel events
        this.panel.querySelector('.edit-artboard').addEventListener('click', () => {
            this.showEditArtboardDialog();
        });

        this.panel.querySelector('.delete-artboard').addEventListener('click', () => {
            this.deleteSelectedArtboard();
        });

        // Arrange buttons
        this.panel.querySelectorAll('.artboard-arrange button').forEach(button => {
            button.addEventListener('click', () => {
                this.arrangeArtboards(button.dataset.layout);
            });
        });
    }

    updateArtboardList(searchQuery = '') {
        const list = this.panel.querySelector('.artboard-list');
        let artboards;

        if (searchQuery) {
            artboards = this.artboardManager.searchArtboards(searchQuery);
        } else {
            artboards = Array.from(this.artboardManager.artboards.values());
        }

        list.innerHTML = artboards.map(artboard => `
            <div class="artboard-item ${artboard.id === this.artboardManager.activeArtboardId ? 'active' : ''}" 
                 data-id="${artboard.id}">
                <div class="artboard-preview">
                    <canvas width="100" height="75"></canvas>
                </div>
                <div class="artboard-info">
                    <h4>${artboard.name}</h4>
                    <span class="dimensions">${artboard.width} × ${artboard.height}</span>
                </div>
            </div>
        `).join('');

        // Render previews
        artboards.forEach(artboard => {
            const canvas = list.querySelector(`[data-id="${artboard.id}"] canvas`);
            const ctx = canvas.getContext('2d');
            this.renderArtboardPreview(artboard, ctx);
        });
    }

    renderArtboardPreview(artboard, context) {
        // Clear canvas
        context.clearRect(0, 0, 100, 75);

        // Draw background
        context.fillStyle = artboard.backgroundColor;
        context.fillRect(0, 0, 100, 75);

        // Draw objects (simplified preview)
        context.fillStyle = '#000000';
        artboard.objects.forEach(obj => {
            switch (obj.type) {
                case 'rect':
                    context.fillRect(
                        obj.x * 100 / artboard.width,
                        obj.y * 75 / artboard.height,
                        obj.width * 100 / artboard.width,
                        obj.height * 75 / artboard.height
                    );
                    break;
                case 'circle':
                    context.beginPath();
                    context.arc(
                        (obj.x + obj.width / 2) * 100 / artboard.width,
                        (obj.y + obj.height / 2) * 75 / artboard.height,
                        Math.min(obj.width, obj.height) * 50 / artboard.width,
                        0,
                        Math.PI * 2
                    );
                    context.fill();
                    break;
                // Add more object types as needed
            }
        });
    }

    showArtboardDetails(artboardId) {
        const artboard = this.artboardManager.artboards.get(artboardId);
        if (!artboard) return;

        const detailsPanel = this.panel.querySelector('.artboard-details');
        const detailsContent = this.panel.querySelector('.details-content');
        const stats = this.artboardManager.getArtboardStats(artboardId);

        detailsContent.innerHTML = `
            <div class="detail-item">
                <label>Name:</label>
                <span>${artboard.name}</span>
            </div>
            <div class="detail-item">
                <label>Dimensions:</label>
                <span>${artboard.width} × ${artboard.height}</span>
            </div>
            <div class="detail-item">
                <label>Position:</label>
                <span>${artboard.x}, ${artboard.y}</span>
            </div>
            <div class="detail-item">
                <label>Background:</label>
                <span class="color-preview" style="background-color: ${artboard.backgroundColor}"></span>
            </div>
            <div class="detail-item">
                <label>Objects:</label>
                <span>${stats.objectCount}</span>
            </div>
            <div class="detail-item">
                <label>Created:</label>
                <span>${artboard.metadata.created.toLocaleDateString()}</span>
            </div>
            <div class="detail-item">
                <label>Modified:</label>
                <span>${artboard.metadata.modified.toLocaleDateString()}</span>
            </div>
            <div class="detail-item">
                <label>Tags:</label>
                <span>${artboard.metadata.tags.join(', ') || 'None'}</span>
            </div>
            <div class="detail-item">
                <label>Description:</label>
                <p>${artboard.metadata.description || 'No description'}</p>
            </div>
        `;

        detailsPanel.style.display = 'block';
        detailsPanel.dataset.artboardId = artboardId;
        this.selectedArtboardId = artboardId;
    }

    showCreateArtboardDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'dialog create-artboard-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Create New Artboard</h3>
                <form>
                    <div class="form-group">
                        <label>Name:</label>
                        <input type="text" name="name" value="Artboard ${this.artboardManager.artboards.size + 1}" required>
                    </div>
                    <div class="form-group">
                        <label>Width:</label>
                        <input type="number" name="width" value="800" required>
                    </div>
                    <div class="form-group">
                        <label>Height:</label>
                        <input type="number" name="height" value="600" required>
                    </div>
                    <div class="form-group">
                        <label>Background Color:</label>
                        <input type="color" name="backgroundColor" value="#ffffff">
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

            const artboardId = this.artboardManager.createArtboard(
                formData.get('name'),
                parseInt(formData.get('width')),
                parseInt(formData.get('height'))
            );

            const artboard = this.artboardManager.artboards.get(artboardId);
            artboard.backgroundColor = formData.get('backgroundColor');
            artboard.metadata.description = formData.get('description');
            artboard.metadata.tags = formData.get('tags')
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag);

            this.updateArtboardList();
            dialog.remove();
        });

        dialog.querySelector('.cancel').addEventListener('click', () => {
            dialog.remove();
        });
    }

    showEditArtboardDialog() {
        const artboardId = this.panel.querySelector('.artboard-details').dataset.artboardId;
        const artboard = this.artboardManager.artboards.get(artboardId);
        if (!artboard) return;

        const dialog = document.createElement('div');
        dialog.className = 'dialog edit-artboard-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Edit Artboard</h3>
                <form>
                    <div class="form-group">
                        <label>Name:</label>
                        <input type="text" name="name" value="${artboard.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Width:</label>
                        <input type="number" name="width" value="${artboard.width}" required>
                    </div>
                    <div class="form-group">
                        <label>Height:</label>
                        <input type="number" name="height" value="${artboard.height}" required>
                    </div>
                    <div class="form-group">
                        <label>Background Color:</label>
                        <input type="color" name="backgroundColor" value="${artboard.backgroundColor}">
                    </div>
                    <div class="form-group">
                        <label>Description:</label>
                        <textarea name="description">${artboard.metadata.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Tags:</label>
                        <input type="text" name="tags" value="${artboard.metadata.tags.join(', ')}" 
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

            this.artboardManager.updateArtboard(artboardId, {
                name: formData.get('name'),
                width: parseInt(formData.get('width')),
                height: parseInt(formData.get('height')),
                backgroundColor: formData.get('backgroundColor'),
                metadata: {
                    ...artboard.metadata,
                    description: formData.get('description'),
                    tags: formData.get('tags')
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag)
                }
            });

            this.updateArtboardList();
            this.showArtboardDetails(artboardId);
            dialog.remove();
        });

        dialog.querySelector('.cancel').addEventListener('click', () => {
            dialog.remove();
        });
    }

    deleteSelectedArtboard() {
        const artboardId = this.panel.querySelector('.artboard-details').dataset.artboardId;
        if (!artboardId) return;

        if (confirm('Are you sure you want to delete this artboard?')) {
            this.artboardManager.deleteArtboard(artboardId);
            this.panel.querySelector('.artboard-details').style.display = 'none';
            this.updateArtboardList();
        }
    }

    arrangeArtboards(layout) {
        this.artboardManager.arrangeArtboards(layout);
        this.updateArtboardList();
    }

    getPanel() {
        return this.panel;
    }
}

export default ArtboardPanel; 