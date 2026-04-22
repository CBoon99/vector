import { Tool } from './tool.js';

class SmartConstraintsTool extends Tool {
    constructor() {
        super('Smart Constraints', '🎯', 'crosshair');
        this.snapThreshold = 10;
        this.guideThreshold = 5;
        this.spacingThreshold = 20;
        this.constraints = new Map();
        this.alignmentGuides = [];
        this.snapPoints = [];
        this.spacingGuides = [];
        this.isActive = false;
        this.spacingMode = false;
        this.equalSpacingMode = false;
        this.distributionHistory = [];
        this.distributionHistoryIndex = -1;
        this.historyPanel = null;
    }

    initialize(layerManager, stateManager) {
        super.initialize(layerManager, stateManager);
        this.setupEventListeners();
        this.createHistoryPanel();
    }

    createHistoryPanel() {
        // Create panel container
        this.historyPanel = document.createElement('div');
        this.historyPanel.style.position = 'fixed';
        this.historyPanel.style.right = '20px';
        this.historyPanel.style.top = '20px';
        this.historyPanel.style.width = '300px';
        this.historyPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.historyPanel.style.color = 'white';
        this.historyPanel.style.padding = '10px';
        this.historyPanel.style.borderRadius = '5px';
        this.historyPanel.style.fontFamily = 'Arial, sans-serif';
        this.historyPanel.style.zIndex = '1000';
        this.historyPanel.style.display = 'none';
        this.historyPanel.style.maxHeight = '400px';
        this.historyPanel.style.overflowY = 'auto';

        // Create header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '10px';
        header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
        header.style.paddingBottom = '5px';

        const title = document.createElement('div');
        title.textContent = 'Distribution History';
        title.style.fontWeight = 'bold';

        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.color = 'white';
        closeButton.style.fontSize = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = () => this.historyPanel.style.display = 'none';

        header.appendChild(title);
        header.appendChild(closeButton);
        this.historyPanel.appendChild(header);

        // Create content container
        const content = document.createElement('div');
        content.id = 'distribution-history-content';
        this.historyPanel.appendChild(content);

        document.body.appendChild(this.historyPanel);
    }

    updateHistoryPanel() {
        const content = document.getElementById('distribution-history-content');
        if (!content) return;

        content.innerHTML = '';

        this.distributionHistory.forEach((entry, index) => {
            const item = document.createElement('div');
            item.style.padding = '10px';
            item.style.margin = '5px 0';
            item.style.borderRadius = '5px';
            item.style.cursor = 'pointer';
            item.style.backgroundColor = index === this.distributionHistoryIndex ? 
                'rgba(255, 255, 255, 0.2)' : 'transparent';
            item.style.display = 'flex';
            item.style.flexDirection = 'column';
            item.style.gap = '8px';

            const time = new Date(entry.timestamp).toLocaleTimeString();
            const objectCount = entry.newState.length;
            
            // Create thumbnail
            const thumbnail = this.createThumbnail(entry.newState);
            thumbnail.style.width = '100%';
            thumbnail.style.height = '100px';
            thumbnail.style.backgroundColor = '#1a1a1a';
            thumbnail.style.borderRadius = '3px';
            thumbnail.style.overflow = 'hidden';
            thumbnail.style.position = 'relative';

            // Create info section
            const info = document.createElement('div');
            info.innerHTML = `
                <div style="font-size: 12px; color: #aaa;">${time}</div>
                <div>${objectCount} objects distributed</div>
            `;

            item.appendChild(thumbnail);
            item.appendChild(info);
            item.onclick = () => this.jumpToHistoryState(index);
            content.appendChild(item);
        });
    }

    createThumbnail(state) {
        const canvas = document.createElement('canvas');
        canvas.width = 280;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate bounds
        const bounds = {
            left: Math.min(...state.map(s => s.x)),
            right: Math.max(...state.map(s => s.x + s.width)),
            top: Math.min(...state.map(s => s.y)),
            bottom: Math.max(...state.map(s => s.y + s.height))
        };

        // Calculate scale to fit
        const scale = Math.min(
            (canvas.width - 20) / (bounds.right - bounds.left),
            (canvas.height - 20) / (bounds.bottom - bounds.top)
        );

        // Center the preview
        const offsetX = (canvas.width - (bounds.right - bounds.left) * scale) / 2;
        const offsetY = (canvas.height - (bounds.bottom - bounds.top) * scale) / 2;

        // Draw objects and calculate spacing
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        // Sort objects by position
        const sortedByX = [...state].sort((a, b) => a.x - b.x);
        const sortedByY = [...state].sort((a, b) => a.y - b.y);

        // Calculate spacing
        const horizontalSpacing = [];
        const verticalSpacing = [];

        for (let i = 0; i < sortedByX.length - 1; i++) {
            const current = sortedByX[i];
            const next = sortedByX[i + 1];
            horizontalSpacing.push({
                value: next.x - (current.x + current.width),
                x: current.x + current.width + (next.x - (current.x + current.width)) / 2,
                y: Math.max(current.y, next.y) + Math.max(current.height, next.height) / 2
            });
        }

        for (let i = 0; i < sortedByY.length - 1; i++) {
            const current = sortedByY[i];
            const next = sortedByY[i + 1];
            verticalSpacing.push({
                value: next.y - (current.y + current.height),
                x: Math.max(current.x, next.x) + Math.max(current.width, next.width) / 2,
                y: current.y + current.height + (next.y - (current.y + current.height)) / 2
            });
        }

        // Calculate average spacing
        const avgHorizontalSpacing = horizontalSpacing.length > 0 ?
            horizontalSpacing.reduce((sum, s) => sum + s.value, 0) / horizontalSpacing.length : 0;
        const avgVerticalSpacing = verticalSpacing.length > 0 ?
            verticalSpacing.reduce((sum, s) => sum + s.value, 0) / verticalSpacing.length : 0;

        // Detect spacing patterns
        const patternInfo = this.detectSpacingPatterns(horizontalSpacing, verticalSpacing);

        // Draw objects
        state.forEach(obj => {
            // Draw object
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1 / scale;
            
            // Draw rectangle
            ctx.beginPath();
            ctx.rect(obj.x - bounds.left, obj.y - bounds.top, obj.width, obj.height);
            ctx.fill();
            ctx.stroke();

            // Draw center point
            ctx.beginPath();
            ctx.arc(
                obj.x - bounds.left + obj.width / 2,
                obj.y - bounds.top + obj.height / 2,
                2 / scale,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
        });

        // Draw spacing measurements
        ctx.font = `${10 / scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw horizontal spacing
        horizontalSpacing.forEach(spacing => {
            const x = spacing.x - bounds.left;
            const y = spacing.y - bounds.top;

            // Draw measurement line
            ctx.beginPath();
            ctx.moveTo(x, y - 10 / scale);
            ctx.lineTo(x, y + 10 / scale);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.stroke();

            // Draw measurement text
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(`${Math.round(spacing.value)}px`, x, y - 15 / scale);
        });

        // Draw vertical spacing
        verticalSpacing.forEach(spacing => {
            const x = spacing.x - bounds.left;
            const y = spacing.y - bounds.top;

            // Draw measurement line
            ctx.beginPath();
            ctx.moveTo(x - 10 / scale, y);
            ctx.lineTo(x + 10 / scale, y);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.stroke();

            // Draw measurement text
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(`${Math.round(spacing.value)}px`, x + 15 / scale, y);
        });

        // Draw average spacing and pattern info
        ctx.font = `${12 / scale}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        
        // Draw at the top of the thumbnail
        const infoY = 15 / scale;
        if (horizontalSpacing.length > 0) {
            ctx.fillText(`Avg H: ${Math.round(avgHorizontalSpacing)}px`, canvas.width / (2 * scale), infoY);
        }
        if (verticalSpacing.length > 0) {
            ctx.fillText(`Avg V: ${Math.round(avgVerticalSpacing)}px`, canvas.width / (2 * scale), infoY + 15 / scale);
        }

        // Draw pattern info if detected
        if (patternInfo.pattern) {
            ctx.fillStyle = patternInfo.isPerfect ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255, 152, 0, 0.9)';
            ctx.fillText(
                patternInfo.pattern,
                canvas.width / (2 * scale),
                infoY + 30 / scale
            );
        }

        ctx.restore();

        // Add hover effect
        canvas.style.transition = 'transform 0.2s';
        canvas.onmouseover = () => {
            canvas.style.transform = 'scale(1.05)';
        };
        canvas.onmouseout = () => {
            canvas.style.transform = 'scale(1)';
        };

        return canvas;
    }

    detectSpacingPatterns(horizontalSpacing, verticalSpacing) {
        const TOLERANCE = 1; // 1 pixel tolerance for pattern detection

        // Check if all spacings are equal (perfect distribution)
        const isPerfectHorizontal = horizontalSpacing.length > 0 &&
            horizontalSpacing.every(s => Math.abs(s.value - horizontalSpacing[0].value) <= TOLERANCE);
        const isPerfectVertical = verticalSpacing.length > 0 &&
            verticalSpacing.every(s => Math.abs(s.value - verticalSpacing[0].value) <= TOLERANCE);

        // Check for alternating patterns
        const hasAlternatingHorizontal = horizontalSpacing.length >= 3 &&
            this.checkAlternatingPattern(horizontalSpacing.map(s => s.value));
        const hasAlternatingVertical = verticalSpacing.length >= 3 &&
            this.checkAlternatingPattern(verticalSpacing.map(s => s.value));

        // Check for increasing/decreasing patterns
        const hasIncreasingHorizontal = horizontalSpacing.length >= 3 &&
            this.checkMonotonicPattern(horizontalSpacing.map(s => s.value));
        const hasIncreasingVertical = verticalSpacing.length >= 3 &&
            this.checkMonotonicPattern(verticalSpacing.map(s => s.value));

        // Determine the pattern type
        let pattern = null;
        let isPerfect = false;

        if (isPerfectHorizontal && isPerfectVertical) {
            pattern = 'Perfect Grid';
            isPerfect = true;
        } else if (isPerfectHorizontal) {
            pattern = 'Equal Horizontal';
            isPerfect = true;
        } else if (isPerfectVertical) {
            pattern = 'Equal Vertical';
            isPerfect = true;
        } else if (hasAlternatingHorizontal && hasAlternatingVertical) {
            pattern = 'Alternating Grid';
        } else if (hasAlternatingHorizontal) {
            pattern = 'Alternating Horizontal';
        } else if (hasAlternatingVertical) {
            pattern = 'Alternating Vertical';
        } else if (hasIncreasingHorizontal && hasIncreasingVertical) {
            pattern = 'Progressive Grid';
        } else if (hasIncreasingHorizontal) {
            pattern = 'Progressive Horizontal';
        } else if (hasIncreasingVertical) {
            pattern = 'Progressive Vertical';
        }

        return { pattern, isPerfect };
    }

    checkAlternatingPattern(values) {
        if (values.length < 3) return false;
        
        const diff1 = Math.abs(values[1] - values[0]);
        const diff2 = Math.abs(values[2] - values[1]);
        
        if (Math.abs(diff1 - diff2) > 1) return false;
        
        for (let i = 2; i < values.length - 1; i++) {
            const currentDiff = Math.abs(values[i + 1] - values[i]);
            if (Math.abs(currentDiff - diff1) > 1) return false;
        }
        
        return true;
    }

    checkMonotonicPattern(values) {
        if (values.length < 3) return false;
        
        const diffs = [];
        for (let i = 1; i < values.length; i++) {
            diffs.push(values[i] - values[i - 1]);
        }
        
        const isIncreasing = diffs.every(d => d > 0);
        const isDecreasing = diffs.every(d => d < 0);
        
        return isIncreasing || isDecreasing;
    }

    jumpToHistoryState(index) {
        if (index < 0 || index >= this.distributionHistory.length) return;

        const selectedObjects = this.layerManager.getSelectedObjects();
        const targetState = this.distributionHistory[index];

        // Restore state
        targetState.newState.forEach(state => {
            const obj = selectedObjects.find(o => o.id === state.id);
            if (obj) {
                obj.x = state.x;
                obj.y = state.y;
                obj.width = state.width;
                obj.height = state.height;
            }
        });

        this.distributionHistoryIndex = index;
        this.stateManager.saveState();
        this.canvasManager.draw();
        this.updateHistoryPanel();
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    handleKeyDown(event) {
        if (event.key === 'Shift') {
            this.isActive = true;
            this.updateSnapPoints();
            this.canvasManager.draw();
        } else if (event.key === 'Alt') {
            this.spacingMode = true;
            this.updateSpacingGuides();
            this.canvasManager.draw();
        } else if (event.key === 'e' && event.altKey) {
            this.distributeObjectsEqually();
            this.canvasManager.draw();
        } else if (event.key === 'z' && event.ctrlKey) {
            if (event.shiftKey) {
                this.redoDistribution();
            } else {
                this.undoDistribution();
            }
        } else if (event.key === 'h' && event.altKey) {
            this.toggleHistoryPanel();
        }
    }

    handleKeyUp(event) {
        if (event.key === 'Shift') {
            this.isActive = false;
            this.alignmentGuides = [];
            this.canvasManager.draw();
        } else if (event.key === 'Alt') {
            this.spacingMode = false;
            this.spacingGuides = [];
            this.canvasManager.draw();
        }
    }

    updateSnapPoints() {
        this.snapPoints = [];
        const objects = this.layerManager.getAllObjects();
        
        objects.forEach(object => {
            // Add object corners
            this.addObjectSnapPoints(object);
            
            // Add object centers
            this.addCenterSnapPoints(object);
            
            // Add object edges
            this.addEdgeSnapPoints(object);
        });
    }

    addObjectSnapPoints(object) {
        const bounds = this.getObjectBounds(object);
        this.snapPoints.push(
            { x: bounds.left, y: bounds.top, type: 'corner' },
            { x: bounds.right, y: bounds.top, type: 'corner' },
            { x: bounds.right, y: bounds.bottom, type: 'corner' },
            { x: bounds.left, y: bounds.bottom, type: 'corner' }
        );
    }

    addCenterSnapPoints(object) {
        const bounds = this.getObjectBounds(object);
        this.snapPoints.push(
            { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2, type: 'center' },
            { x: bounds.left + bounds.width / 2, y: bounds.top, type: 'center' },
            { x: bounds.left + bounds.width / 2, y: bounds.bottom, type: 'center' },
            { x: bounds.left, y: bounds.top + bounds.height / 2, type: 'center' },
            { x: bounds.right, y: bounds.top + bounds.height / 2, type: 'center' }
        );
    }

    addEdgeSnapPoints(object) {
        const bounds = this.getObjectBounds(object);
        this.snapPoints.push(
            { x: bounds.left, y: bounds.top + bounds.height / 3, type: 'edge' },
            { x: bounds.left, y: bounds.top + bounds.height * 2/3, type: 'edge' },
            { x: bounds.right, y: bounds.top + bounds.height / 3, type: 'edge' },
            { x: bounds.right, y: bounds.top + bounds.height * 2/3, type: 'edge' },
            { x: bounds.left + bounds.width / 3, y: bounds.top, type: 'edge' },
            { x: bounds.left + bounds.width * 2/3, y: bounds.top, type: 'edge' },
            { x: bounds.left + bounds.width / 3, y: bounds.bottom, type: 'edge' },
            { x: bounds.left + bounds.width * 2/3, y: bounds.bottom, type: 'edge' }
        );
    }

    getObjectBounds(object) {
        return {
            left: object.x,
            top: object.y,
            right: object.x + object.width,
            bottom: object.y + object.height,
            width: object.width,
            height: object.height
        };
    }

    findNearestSnapPoint(point) {
        let nearest = null;
        let minDistance = this.snapThreshold;

        this.snapPoints.forEach(snapPoint => {
            const distance = Math.sqrt(
                Math.pow(point.x - snapPoint.x, 2) + 
                Math.pow(point.y - snapPoint.y, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                nearest = snapPoint;
            }
        });

        return nearest;
    }

    findAlignmentGuides(point) {
        this.alignmentGuides = [];
        const objects = this.layerManager.getAllObjects();
        
        objects.forEach(object => {
            const bounds = this.getObjectBounds(object);
            
            // Check horizontal alignment
            if (Math.abs(point.y - bounds.top) < this.guideThreshold) {
                this.alignmentGuides.push({
                    type: 'horizontal',
                    position: bounds.top,
                    start: 0,
                    end: this.canvasManager.canvas.width
                });
            }
            if (Math.abs(point.y - bounds.bottom) < this.guideThreshold) {
                this.alignmentGuides.push({
                    type: 'horizontal',
                    position: bounds.bottom,
                    start: 0,
                    end: this.canvasManager.canvas.width
                });
            }
            if (Math.abs(point.y - (bounds.top + bounds.height / 2)) < this.guideThreshold) {
                this.alignmentGuides.push({
                    type: 'horizontal',
                    position: bounds.top + bounds.height / 2,
                    start: 0,
                    end: this.canvasManager.canvas.width
                });
            }

            // Check vertical alignment
            if (Math.abs(point.x - bounds.left) < this.guideThreshold) {
                this.alignmentGuides.push({
                    type: 'vertical',
                    position: bounds.left,
                    start: 0,
                    end: this.canvasManager.canvas.height
                });
            }
            if (Math.abs(point.x - bounds.right) < this.guideThreshold) {
                this.alignmentGuides.push({
                    type: 'vertical',
                    position: bounds.right,
                    start: 0,
                    end: this.canvasManager.canvas.height
                });
            }
            if (Math.abs(point.x - (bounds.left + bounds.width / 2)) < this.guideThreshold) {
                this.alignmentGuides.push({
                    type: 'vertical',
                    position: bounds.left + bounds.width / 2,
                    start: 0,
                    end: this.canvasManager.canvas.height
                });
            }
        });
    }

    drawGuides(context) {
        if (!this.isActive || this.alignmentGuides.length === 0) return;

        context.save();
        context.strokeStyle = '#00ff00';
        context.lineWidth = 1;
        context.setLineDash([5, 5]);

        this.alignmentGuides.forEach(guide => {
            context.beginPath();
            if (guide.type === 'horizontal') {
                context.moveTo(guide.start, guide.position);
                context.lineTo(guide.end, guide.position);
            } else {
                context.moveTo(guide.position, guide.start);
                context.lineTo(guide.position, guide.end);
            }
            context.stroke();
        });

        context.restore();
    }

    drawSnapPoints(context) {
        if (!this.isActive) return;

        context.save();
        this.snapPoints.forEach(point => {
            context.beginPath();
            context.arc(point.x, point.y, 3, 0, Math.PI * 2);
            context.fillStyle = point.type === 'corner' ? '#ff0000' : 
                              point.type === 'center' ? '#00ff00' : '#0000ff';
            context.fill();
        });
        context.restore();
    }

    drawSpacingGuides(context) {
        if (!this.spacingMode || this.spacingGuides.length === 0) return;

        context.save();
        context.strokeStyle = '#4CAF50';
        context.lineWidth = 1;
        context.setLineDash([5, 5]);
        context.font = '12px Arial';
        context.fillStyle = '#4CAF50';

        this.spacingGuides.forEach(guide => {
            context.beginPath();
            if (guide.type === 'horizontal') {
                context.moveTo(guide.position, guide.start);
                context.lineTo(guide.position, guide.end);
                // Draw spacing value
                context.fillText(
                    `${Math.round(guide.value)}px`,
                    guide.position + 5,
                    (guide.start + guide.end) / 2
                );
            } else {
                context.moveTo(guide.start, guide.position);
                context.lineTo(guide.end, guide.position);
                // Draw spacing value
                context.fillText(
                    `${Math.round(guide.value)}px`,
                    (guide.start + guide.end) / 2,
                    guide.position - 5
                );
            }
            context.stroke();
        });

        context.restore();
    }

    applySpacingConstraints(point) {
        if (!this.spacingMode || this.spacingGuides.length === 0) return point;

        let nearestGuide = null;
        let minDistance = this.spacingThreshold;

        this.spacingGuides.forEach(guide => {
            let distance;
            if (guide.type === 'horizontal') {
                distance = Math.abs(point.x - guide.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestGuide = guide;
                }
            } else {
                distance = Math.abs(point.y - guide.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestGuide = guide;
                }
            }
        });

        if (nearestGuide) {
            if (nearestGuide.type === 'horizontal') {
                point.x = nearestGuide.position;
            } else {
                point.y = nearestGuide.position;
            }
        }

        return point;
    }

    applyConstraints(point) {
        if (!this.isActive && !this.spacingMode) return point;

        // First apply spacing constraints if in spacing mode
        if (this.spacingMode) {
            point = this.applySpacingConstraints(point);
        }

        // Then apply regular constraints if active
        if (this.isActive) {
            const snapPoint = this.findNearestSnapPoint(point);
            if (snapPoint) {
                point.x = snapPoint.x;
                point.y = snapPoint.y;
            }

            const guides = this.findAlignmentGuides(point);
            if (guides.horizontal) {
                point.y = guides.horizontal;
            }
            if (guides.vertical) {
                point.x = guides.vertical;
            }
        }

        return point;
    }

    updateSpacingGuides() {
        this.spacingGuides = [];
        const objects = this.layerManager.getAllObjects();
        const selectedObjects = this.layerManager.getSelectedObjects();
        
        if (selectedObjects.length < 2) return;

        // Sort objects by position
        const sortedObjects = [...selectedObjects].sort((a, b) => {
            const boundsA = this.getObjectBounds(a);
            const boundsB = this.getObjectBounds(b);
            return boundsA.left - boundsB.left;
        });

        // Calculate horizontal spacing
        for (let i = 0; i < sortedObjects.length - 1; i++) {
            const current = this.getObjectBounds(sortedObjects[i]);
            const next = this.getObjectBounds(sortedObjects[i + 1]);
            const spacing = next.left - current.right;
            
            this.spacingGuides.push({
                type: 'horizontal',
                position: current.right + spacing / 2,
                start: current.bottom,
                end: next.bottom,
                value: spacing
            });
        }

        // Sort objects by vertical position
        const sortedVertically = [...selectedObjects].sort((a, b) => {
            const boundsA = this.getObjectBounds(a);
            const boundsB = this.getObjectBounds(b);
            return boundsA.top - boundsB.top;
        });

        // Calculate vertical spacing
        for (let i = 0; i < sortedVertically.length - 1; i++) {
            const current = this.getObjectBounds(sortedVertically[i]);
            const next = this.getObjectBounds(sortedVertically[i + 1]);
            const spacing = next.top - current.bottom;
            
            this.spacingGuides.push({
                type: 'vertical',
                position: current.bottom + spacing / 2,
                start: current.right,
                end: next.right,
                value: spacing
            });
        }
    }

    distributeObjectsEqually() {
        const selectedObjects = this.layerManager.getSelectedObjects();
        if (selectedObjects.length < 3) {
            console.log('Please select at least 3 objects to distribute equally');
            return;
        }

        // Store current state for undo
        const currentState = selectedObjects.map(obj => ({
            id: obj.id,
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height
        }));

        // Get bounds of all selected objects
        const bounds = selectedObjects.map(obj => this.getObjectBounds(obj));
        
        // Calculate total width and height
        const minX = Math.min(...bounds.map(b => b.left));
        const maxX = Math.max(...bounds.map(b => b.right));
        const minY = Math.min(...bounds.map(b => b.top));
        const maxY = Math.max(...bounds.map(b => b.bottom));
        
        const totalWidth = maxX - minX;
        const totalHeight = maxY - minY;
        
        // Sort objects by position
        const sortedByX = [...selectedObjects].sort((a, b) => a.x - b.x);
        const sortedByY = [...selectedObjects].sort((a, b) => a.y - b.y);
        
        // Calculate equal spacing
        const spacingX = totalWidth / (sortedByX.length - 1);
        const spacingY = totalHeight / (sortedByY.length - 1);
        
        // Apply equal spacing horizontally
        let currentX = minX;
        for (let i = 0; i < sortedByX.length; i++) {
            sortedByX[i].x = currentX;
            currentX += spacingX;
        }
        
        // Apply equal spacing vertically
        let currentY = minY;
        for (let i = 0; i < sortedByY.length; i++) {
            sortedByY[i].y = currentY;
            currentY += spacingY;
        }

        // Store new state for redo
        const newState = selectedObjects.map(obj => ({
            id: obj.id,
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height
        }));

        // Add to history
        this.addToDistributionHistory(currentState, newState);
        
        // Update state and redraw
        this.stateManager.saveState();
        this.canvasManager.draw();

        // Show feedback
        this.showDistributionFeedback(spacingX, spacingY);
    }

    addToDistributionHistory(oldState, newState) {
        // Remove any future states if we're not at the end of history
        if (this.distributionHistoryIndex < this.distributionHistory.length - 1) {
            this.distributionHistory = this.distributionHistory.slice(0, this.distributionHistoryIndex + 1);
        }

        // Add new state
        this.distributionHistory.push({
            oldState,
            newState,
            timestamp: Date.now()
        });

        // Update index
        this.distributionHistoryIndex = this.distributionHistory.length - 1;

        // Limit history size
        if (this.distributionHistory.length > 50) {
            this.distributionHistory.shift();
            this.distributionHistoryIndex--;
        }

        // Update history panel if visible
        this.updateHistoryPanel();
    }

    undoDistribution() {
        if (this.distributionHistoryIndex < 0) {
            console.log('No distribution history to undo');
            return;
        }

        const currentState = this.distributionHistory[this.distributionHistoryIndex];
        const selectedObjects = this.layerManager.getSelectedObjects();

        // Restore old state
        currentState.oldState.forEach(state => {
            const obj = selectedObjects.find(o => o.id === state.id);
            if (obj) {
                obj.x = state.x;
                obj.y = state.y;
                obj.width = state.width;
                obj.height = state.height;
            }
        });

        this.distributionHistoryIndex--;
        this.stateManager.saveState();
        this.canvasManager.draw();
        this.showUndoRedoFeedback('Undo distribution');
    }

    redoDistribution() {
        if (this.distributionHistoryIndex >= this.distributionHistory.length - 1) {
            console.log('No distribution history to redo');
            return;
        }

        this.distributionHistoryIndex++;
        const currentState = this.distributionHistory[this.distributionHistoryIndex];
        const selectedObjects = this.layerManager.getSelectedObjects();

        // Restore new state
        currentState.newState.forEach(state => {
            const obj = selectedObjects.find(o => o.id === state.id);
            if (obj) {
                obj.x = state.x;
                obj.y = state.y;
                obj.width = state.width;
                obj.height = state.height;
            }
        });

        this.stateManager.saveState();
        this.canvasManager.draw();
        this.showUndoRedoFeedback('Redo distribution');
    }

    showDistributionFeedback(spacingX, spacingY) {
        const selectedObjects = this.layerManager.getSelectedObjects();
        if (selectedObjects.length < 3) return;

        // Create feedback element
        const feedback = document.createElement('div');
        feedback.style.position = 'fixed';
        feedback.style.bottom = '20px';
        feedback.style.left = '50%';
        feedback.style.transform = 'translateX(-50%)';
        feedback.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        feedback.style.color = 'white';
        feedback.style.padding = '10px 20px';
        feedback.style.borderRadius = '5px';
        feedback.style.fontFamily = 'Arial, sans-serif';
        feedback.style.zIndex = '1000';
        feedback.innerHTML = `
            <div>Objects distributed equally</div>
            <div>Horizontal spacing: ${Math.round(spacingX)}px</div>
            <div>Vertical spacing: ${Math.round(spacingY)}px</div>
        `;

        // Add to document
        document.body.appendChild(feedback);

        // Remove after 2 seconds
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transition = 'opacity 0.5s';
            setTimeout(() => feedback.remove(), 500);
        }, 2000);
    }

    showUndoRedoFeedback(action) {
        const feedback = document.createElement('div');
        feedback.style.position = 'fixed';
        feedback.style.bottom = '20px';
        feedback.style.left = '50%';
        feedback.style.transform = 'translateX(-50%)';
        feedback.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        feedback.style.color = 'white';
        feedback.style.padding = '10px 20px';
        feedback.style.borderRadius = '5px';
        feedback.style.fontFamily = 'Arial, sans-serif';
        feedback.style.zIndex = '1000';
        feedback.textContent = action;

        document.body.appendChild(feedback);
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transition = 'opacity 0.5s';
            setTimeout(() => feedback.remove(), 500);
        }, 1500);
    }

    toggleHistoryPanel() {
        if (this.historyPanel) {
            this.historyPanel.style.display = 
                this.historyPanel.style.display === 'none' ? 'block' : 'none';
            if (this.historyPanel.style.display === 'block') {
                this.updateHistoryPanel();
            }
        }
    }

    cleanup() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.alignmentGuides = [];
        this.snapPoints = [];
        this.isActive = false;
        if (this.historyPanel) {
            this.historyPanel.remove();
        }
    }

    draw(context) {
        if (!this.isActive && !this.spacingMode) return;

        // Draw snap points
        if (this.isActive) {
            this.snapPoints.forEach(point => {
                context.beginPath();
                context.arc(point.x, point.y, 4, 0, Math.PI * 2);
                context.fillStyle = '#2196F3';
                context.fill();
            });

            // Draw alignment guides
            this.drawGuides(context);
        }

        // Draw spacing guides
        if (this.spacingMode) {
            this.drawSpacingGuides(context);
        }

        // Draw distribution preview when Alt is held
        if (this.spacingMode && this.layerManager.getSelectedObjects().length >= 3) {
            this.drawDistributionPreview(context);
        }
    }

    drawDistributionPreview(context) {
        const selectedObjects = this.layerManager.getSelectedObjects();
        if (selectedObjects.length < 3) return;

        context.save();
        context.strokeStyle = '#FF9800';
        context.lineWidth = 1;
        context.setLineDash([5, 5]);

        // Draw connecting lines between objects
        for (let i = 0; i < selectedObjects.length - 1; i++) {
            const current = selectedObjects[i];
            const next = selectedObjects[i + 1];
            
            context.beginPath();
            context.moveTo(current.x + current.width / 2, current.y + current.height / 2);
            context.lineTo(next.x + next.width / 2, next.y + next.height / 2);
            context.stroke();
        }

        context.restore();
    }
}

export default SmartConstraintsTool; 