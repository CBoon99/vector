import LayerManager from '../layer-manager';

describe('LayerManager', () => {
    let layerManager;
    let mockCanvas;
    let mockContext;

    beforeEach(() => {
        // Create canvas and context
        mockCanvas = document.createElement('canvas');
        mockContext = {
            save: jest.fn(),
            restore: jest.fn(),
            clearRect: jest.fn(),
            drawImage: jest.fn()
        };
        mockCanvas.getContext = jest.fn().mockReturnValue(mockContext);
        mockCanvas.width = 800;
        mockCanvas.height = 600;

        // Create layer manager
        layerManager = new LayerManager(mockCanvas);
    });

    describe('Error Handling', () => {
        it('should handle invalid canvas initialization', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const invalidManager = new LayerManager(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid canvas provided to LayerManager');
            expect(invalidManager.canvas).toBeNull();
        });

        it('should handle invalid layer addition', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            layerManager.addLayer(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid layer provided to addLayer');
        });

        it('should handle invalid layer removal', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            layerManager.removeLayer('non-existent-id');
            expect(consoleSpy).toHaveBeenCalledWith('Layer not found:', 'non-existent-id');
        });

        it('should handle invalid layer update', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            layerManager.updateLayer('non-existent-id', { visible: false });
            expect(consoleSpy).toHaveBeenCalledWith('Layer not found:', 'non-existent-id');
        });

        it('should handle invalid layer order change', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            layerManager.moveLayer('non-existent-id', 1);
            expect(consoleSpy).toHaveBeenCalledWith('Layer not found:', 'non-existent-id');
        });

        it('should handle invalid layer merge', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            layerManager.mergeLayers('layer1', 'layer2');
            expect(consoleSpy).toHaveBeenCalledWith('One or both layers not found');
        });
    });

    describe('Layer Operations', () => {
        it('should handle duplicate layer names', () => {
            const layer1 = { id: '1', name: 'Layer 1' };
            const layer2 = { id: '2', name: 'Layer 1' };
            
            layerManager.addLayer(layer1);
            layerManager.addLayer(layer2);
            
            expect(layer2.name).toBe('Layer 1 (1)');
        });

        it('should handle invalid layer visibility', () => {
            const layer = { id: '1', name: 'Layer 1' };
            layerManager.addLayer(layer);
            
            const consoleSpy = jest.spyOn(console, 'warn');
            layerManager.updateLayer('1', { visible: 'invalid' });
            
            expect(consoleSpy).toHaveBeenCalledWith('Invalid visibility value');
            expect(layer.visible).toBe(true);
        });

        it('should handle invalid layer opacity', () => {
            const layer = { id: '1', name: 'Layer 1' };
            layerManager.addLayer(layer);
            
            const consoleSpy = jest.spyOn(console, 'warn');
            layerManager.updateLayer('1', { opacity: 2 });
            
            expect(consoleSpy).toHaveBeenCalledWith('Invalid opacity value');
            expect(layer.opacity).toBe(1);
        });

        it('should handle invalid layer blend mode', () => {
            const layer = { id: '1', name: 'Layer 1' };
            layerManager.addLayer(layer);
            
            const consoleSpy = jest.spyOn(console, 'warn');
            layerManager.updateLayer('1', { blendMode: 'invalid' });
            
            expect(consoleSpy).toHaveBeenCalledWith('Invalid blend mode');
            expect(layer.blendMode).toBe('normal');
        });
    });

    describe('Rendering', () => {
        it('should handle rendering errors', () => {
            mockContext.drawImage.mockImplementation(() => {
                throw new Error('Rendering error');
            });
            
            const layer = { id: '1', name: 'Layer 1' };
            layerManager.addLayer(layer);
            
            const consoleSpy = jest.spyOn(console, 'error');
            layerManager.render();
            
            expect(consoleSpy).toHaveBeenCalledWith('Error rendering layer:', expect.any(Error));
            expect(mockContext.restore).toHaveBeenCalled();
        });

        it('should handle invalid canvas context during render', () => {
            const layer = { id: '1', name: 'Layer 1' };
            layerManager.addLayer(layer);
            
            mockCanvas.getContext = jest.fn().mockReturnValue(null);
            
            const consoleSpy = jest.spyOn(console, 'error');
            layerManager.render();
            
            expect(consoleSpy).toHaveBeenCalledWith('Invalid canvas context');
        });
    });

    describe('Layer State Management', () => {
        it('should handle invalid state loading', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            layerManager.loadState(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid state provided to loadState');
        });

        it('should handle partial state data', () => {
            const state = {
                layers: [
                    { id: '1', name: 'Layer 1' },
                    { id: '2' } // Missing name
                ]
            };
            
            layerManager.loadState(state);
            
            expect(layerManager.getLayer('1').name).toBe('Layer 1');
            expect(layerManager.getLayer('2').name).toBe('Layer 2');
        });

        it('should handle invalid layer state', () => {
            const state = {
                layers: [
                    { id: '1', name: 'Layer 1', visible: 'invalid' }
                ]
            };
            
            layerManager.loadState(state);
            
            expect(layerManager.getLayer('1').visible).toBe(true);
        });
    });

    describe('Layer Events', () => {
        it('should handle invalid event listeners', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            layerManager.on('invalid-event', () => {});
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event type: invalid-event');
        });

        it('should handle invalid event handler', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            layerManager.on('layer-added', null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid event handler');
        });

        it('should handle event handler errors', () => {
            const errorHandler = jest.fn().mockImplementation(() => {
                throw new Error('Handler error');
            });
            
            layerManager.on('layer-added', errorHandler);
            
            const consoleSpy = jest.spyOn(console, 'error');
            layerManager.addLayer({ id: '1', name: 'Layer 1' });
            
            expect(consoleSpy).toHaveBeenCalledWith('Error in event handler:', expect.any(Error));
        });
    });
}); 