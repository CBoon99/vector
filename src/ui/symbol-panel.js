// Symbol Panel UI Component
class SymbolPanel {
    constructor(symbolManager, stateManager) {
        this.symbolManager = symbolManager;
        this.stateManager = stateManager;
        this.selectedCategory = 'All';
        this.searchQuery = '';
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'symbol-panel';
        this.panel.innerHTML = `
            <div class="symbol-header">
                <div class="symbol-search">
                    <input type="text" placeholder="Search symbols...">
                </div>
                <div class="symbol-categories">
                    <select>
                        <option value="All">All Categories</option>
                    </select>
                </div>
                <button class="create-symbol">Create Symbol</button>
            </div>
            <div class="symbol-grid"></div>
            <div class="symbol-details" style="display: none;">
                <h3>Symbol Details</h3>
                <div class="details-content"></div>
                <div class="details-actions">
                    <button class="edit-symbol">Edit</button>
                    <button class="delete-symbol">Delete</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateCategories();
        this.updateSymbolGrid();
    }

    setupEventListeners() {
        // Search
        const searchInput = this.panel.querySelector('.symbol-search input');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.updateSymbolGrid();
        });

        // Category selection
        const categorySelect = this.panel.querySelector('.symbol-categories select');
        categorySelect.addEventListener('change', (e) => {
            this.selectedCategory = e.target.value;
            this.updateSymbolGrid();
        });

        // Create symbol button
        this.panel.querySelector('.create-symbol').addEventListener('click', () => {
            this.showCreateSymbolDialog();
        });

        // Symbol grid events
        this.panel.querySelector('.symbol-grid').addEventListener('click', (e) => {
            const symbolElement = e.target.closest('.symbol-item');
            if (symbolElement) {
                this.showSymbolDetails(symbolElement.dataset.id);
            }
        });

        // Details panel events
        this.panel.querySelector('.edit-symbol').addEventListener('click', () => {
            this.showEditSymbolDialog();
        });

        this.panel.querySelector('.delete-symbol').addEventListener('click', () => {
            this.deleteSelectedSymbol();
        });
    }

    updateCategories() {
        const select = this.panel.querySelector('.symbol-categories select');
        const categories = ['All', ...this.symbolManager.getCategories()];
        
        select.innerHTML = categories.map(category => 
            `<option value="${category}">${category}</option>`
        ).join('');
    }

    updateSymbolGrid() {
        const grid = this.panel.querySelector('.symbol-grid');
        let symbols;

        if (this.searchQuery) {
            symbols = this.symbolManager.searchSymbols(this.searchQuery);
        } else if (this.selectedCategory === 'All') {
            symbols = Array.from(this.symbolManager.symbols.values());
        } else {
            symbols = this.symbolManager.getSymbolsByCategory(this.selectedCategory);
        }

        grid.innerHTML = symbols.map(symbol => `
            <div class="symbol-item" data-id="${symbol.id}">
                <div class="symbol-preview">
                    <canvas width="100" height="100"></canvas>
                </div>
                <div class="symbol-info">
                    <h4>${symbol.name}</h4>
                    <span class="category">${symbol.category}</span>
                </div>
            </div>
        `).join('');

        // Render previews
        symbols.forEach(symbol => {
            const canvas = grid.querySelector(`[data-id="${symbol.id}"] canvas`);
            const ctx = canvas.getContext('2d');
            this.renderSymbolPreview(symbol, ctx);
        });
    }

    renderSymbolPreview(symbol, context) {
        // Clear canvas
        context.clearRect(0, 0, 100, 100);

        // Center the symbol
        context.save();
        context.translate(50, 50);

        // Render each object
        symbol.objects.forEach(obj => {
            this.symbolManager.renderObject(obj, context);
        });

        context.restore();
    }

    showSymbolDetails(symbolId) {
        const symbol = this.symbolManager.symbols.get(symbolId);
        if (!symbol) return;

        const detailsPanel = this.panel.querySelector('.symbol-details');
        const detailsContent = this.panel.querySelector('.details-content');

        detailsContent.innerHTML = `
            <div class="detail-item">
                <label>Name:</label>
                <span>${symbol.name}</span>
            </div>
            <div class="detail-item">
                <label>Category:</label>
                <span>${symbol.category}</span>
            </div>
            <div class="detail-item">
                <label>Created:</label>
                <span>${symbol.metadata.created.toLocaleDateString()}</span>
            </div>
            <div class="detail-item">
                <label>Modified:</label>
                <span>${symbol.metadata.modified.toLocaleDateString()}</span>
            </div>
            <div class="detail-item">
                <label>Tags:</label>
                <span>${symbol.metadata.tags.join(', ') || 'None'}</span>
            </div>
            <div class="detail-item">
                <label>Description:</label>
                <p>${symbol.metadata.description || 'No description'}</p>
            </div>
        `;

        detailsPanel.style.display = 'block';
        detailsPanel.dataset.symbolId = symbolId;
    }

    showCreateSymbolDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'dialog create-symbol-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Create New Symbol</h3>
                <form>
                    <div class="form-group">
                        <label>Name:</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Category:</label>
                        <input type="text" name="category" list="categories">
                        <datalist id="categories">
                            ${this.symbolManager.getCategories().map(category =>
                                `<option value="${category}">`
                            ).join('')}
                        </datalist>
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
                alert('Please select objects to create a symbol');
                return;
            }

            const symbolId = this.symbolManager.createSymbol(
                formData.get('name'),
                selectedObjects,
                formData.get('category') || 'Uncategorized'
            );

            const symbol = this.symbolManager.symbols.get(symbolId);
            symbol.metadata.description = formData.get('description');
            symbol.metadata.tags = formData.get('tags')
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag);

            this.updateCategories();
            this.updateSymbolGrid();
            dialog.remove();
        });

        dialog.querySelector('.cancel').addEventListener('click', () => {
            dialog.remove();
        });
    }

    showEditSymbolDialog() {
        const symbolId = this.panel.querySelector('.symbol-details').dataset.symbolId;
        const symbol = this.symbolManager.symbols.get(symbolId);
        if (!symbol) return;

        const dialog = document.createElement('div');
        dialog.className = 'dialog edit-symbol-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Edit Symbol</h3>
                <form>
                    <div class="form-group">
                        <label>Name:</label>
                        <input type="text" name="name" value="${symbol.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Category:</label>
                        <input type="text" name="category" value="${symbol.category}" list="categories">
                        <datalist id="categories">
                            ${this.symbolManager.getCategories().map(category =>
                                `<option value="${category}">`
                            ).join('')}
                        </datalist>
                    </div>
                    <div class="form-group">
                        <label>Description:</label>
                        <textarea name="description">${symbol.metadata.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Tags:</label>
                        <input type="text" name="tags" value="${symbol.metadata.tags.join(', ')}" 
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

            this.symbolManager.updateSymbol(symbolId, {
                name: formData.get('name'),
                category: formData.get('category') || 'Uncategorized',
                metadata: {
                    ...symbol.metadata,
                    description: formData.get('description'),
                    tags: formData.get('tags')
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag)
                }
            });

            this.updateCategories();
            this.updateSymbolGrid();
            this.showSymbolDetails(symbolId);
            dialog.remove();
        });

        dialog.querySelector('.cancel').addEventListener('click', () => {
            dialog.remove();
        });
    }

    deleteSelectedSymbol() {
        const symbolId = this.panel.querySelector('.symbol-details').dataset.symbolId;
        if (!symbolId) return;

        if (confirm('Are you sure you want to delete this symbol?')) {
            this.symbolManager.deleteSymbol(symbolId);
            this.panel.querySelector('.symbol-details').style.display = 'none';
            this.updateCategories();
            this.updateSymbolGrid();
        }
    }

    getPanel() {
        return this.panel;
    }
}

export default SymbolPanel; 