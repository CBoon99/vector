import { expect } from 'chai';
import uiService from '../../../services/uiService.js';
import capabilityService from '../../../services/capabilityService.js';

describe('UIService', () => {
    let container;

    beforeEach(() => {
        // Create a clean document body for each test
        document.body.innerHTML = '';
        container = document.createElement('div');
        container.className = 'app-container';
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Initialization', () => {
        it('should initialize with correct layout', () => {
            const { screen } = capabilityService.capabilities;
            const expectedLayout = screen.isSmall ? 'mobile' : 
                                 screen.isMedium ? 'tablet' : 'desktop';
            
            expect(uiService.currentLayout).to.equal(expectedLayout);
        });

        it('should initialize feature availability', () => {
            expect(uiService.featureAvailability).to.be.an('object');
            expect(uiService.featureAvailability).to.have.all.keys([
                'highQualityVectorization',
                'realtimePreview',
                'batchProcessing',
                'patternRecognition',
                'stylePreservation'
            ]);
        });

        it('should create basic UI structure', () => {
            const toolbar = document.querySelector('.toolbar');
            const content = document.querySelector('.content-area');
            const sidebar = document.querySelector('.sidebar');

            expect(toolbar).to.exist;
            expect(content).to.exist;
            expect(sidebar).to.exist;
        });
    });

    describe('Layout Management', () => {
        it('should update layout on screen size change', () => {
            // Simulate mobile screen
            window.innerWidth = 375;
            window.dispatchEvent(new Event('resize'));
            expect(uiService.currentLayout).to.equal('mobile');

            // Simulate tablet screen
            window.innerWidth = 768;
            window.dispatchEvent(new Event('resize'));
            expect(uiService.currentLayout).to.equal('tablet');

            // Simulate desktop screen
            window.innerWidth = 1024;
            window.dispatchEvent(new Event('resize'));
            expect(uiService.currentLayout).to.equal('desktop');
        });

        it('should apply correct layout classes', () => {
            // Test mobile layout
            uiService.currentLayout = 'mobile';
            uiService.applyLayout();
            expect(container.classList.contains('layout-mobile')).to.be.true;

            // Test tablet layout
            uiService.currentLayout = 'tablet';
            uiService.applyLayout();
            expect(container.classList.contains('layout-tablet')).to.be.true;

            // Test desktop layout
            uiService.currentLayout = 'desktop';
            uiService.applyLayout();
            expect(container.classList.contains('layout-desktop')).to.be.true;
        });
    });

    describe('Feature Management', () => {
        it('should show/hide features based on capabilities', () => {
            // Simulate high-end device
            capabilityService.capabilities.device.hasHardwareAcceleration = true;
            capabilityService.capabilities.device.hasWebAssembly = true;
            capabilityService.capabilities.connection.isLowBandwidth = false;

            uiService.handleCapabilityChange({
                type: 'device',
                capabilities: capabilityService.capabilities.device
            });

            const qualityButton = document.querySelector('[data-tool="quality"]');
            const patternPanel = document.querySelector('[data-panel="patterns"]');
            const stylePanel = document.querySelector('[data-panel="styles"]');

            expect(qualityButton.style.display).to.not.equal('none');
            expect(patternPanel.style.display).to.not.equal('none');
            expect(stylePanel.style.display).to.not.equal('none');
        });

        it('should update feature visibility on capability change', () => {
            // Simulate low-end device
            capabilityService.capabilities.device.hasHardwareAcceleration = false;
            capabilityService.capabilities.device.hasWebAssembly = false;
            capabilityService.capabilities.connection.isLowBandwidth = true;

            uiService.handleCapabilityChange({
                type: 'device',
                capabilities: capabilityService.capabilities.device
            });

            const qualityButton = document.querySelector('[data-tool="quality"]');
            const patternPanel = document.querySelector('[data-panel="patterns"]');
            const stylePanel = document.querySelector('[data-panel="styles"]');

            expect(qualityButton.style.display).to.equal('none');
            expect(patternPanel.style.display).to.equal('none');
            expect(stylePanel.style.display).to.equal('none');
        });
    });

    describe('UI Element Creation', () => {
        it('should create toolbar with basic tools', () => {
            const toolbar = uiService.createToolbar();
            const basicTools = ['import', 'export', 'undo', 'redo'];

            basicTools.forEach(toolId => {
                const tool = toolbar.querySelector(`[data-tool="${toolId}"]`);
                expect(tool).to.exist;
            });
        });

        it('should create content area with canvas', () => {
            const content = uiService.createContentArea();
            const canvasContainer = content.querySelector('.canvas-container');
            expect(canvasContainer).to.exist;
        });

        it('should create sidebar with basic panels', () => {
            const sidebar = uiService.createSidebar();
            const basicPanels = ['layers', 'properties'];

            basicPanels.forEach(panelId => {
                const panel = sidebar.querySelector(`[data-panel="${panelId}"]`);
                expect(panel).to.exist;
            });
        });

        it('should create tool buttons with correct structure', () => {
            const tool = {
                id: 'test',
                label: 'Test',
                icon: '🔧'
            };

            const button = uiService.createToolButton(tool);
            const icon = button.querySelector('.tool-icon');
            const label = button.querySelector('.tool-label');

            expect(button.dataset.tool).to.equal(tool.id);
            expect(icon.textContent).to.equal(tool.icon);
            expect(label.textContent).to.equal(tool.label);
        });

        it('should create panels with correct structure', () => {
            const panel = {
                id: 'test',
                label: 'Test Panel',
                icon: '🔧'
            };

            const panelElement = uiService.createPanel(panel);
            const header = panelElement.querySelector('.panel-header');
            const icon = header.querySelector('.panel-icon');
            const label = header.querySelector('.panel-label');
            const content = panelElement.querySelector('.panel-content');

            expect(panelElement.dataset.panel).to.equal(panel.id);
            expect(icon.textContent).to.equal(panel.icon);
            expect(label.textContent).to.equal(panel.label);
            expect(content).to.exist;
        });
    });

    describe('Message Handling', () => {
        it('should show and remove messages', () => {
            const message = 'Test message';
            uiService.showMessage(message, 'info');

            const messageElement = document.querySelector('.message');
            expect(messageElement).to.exist;
            expect(messageElement.textContent).to.equal(message);
            expect(messageElement.classList.contains('info')).to.be.true;

            // Wait for message to be removed
            return new Promise(resolve => {
                setTimeout(() => {
                    expect(document.querySelector('.message')).to.not.exist;
                    resolve();
                }, 3000);
            });
        });

        it('should handle different message types', () => {
            const types = ['info', 'success', 'error'];
            
            types.forEach(type => {
                uiService.showMessage('Test', type);
                const messageElement = document.querySelector('.message');
                expect(messageElement.classList.contains(type)).to.be.true;
            });
        });
    });

    describe('Modal Handling', () => {
        it('should show and hide modals', () => {
            const modalId = 'test-modal';
            const modal = document.createElement('div');
            modal.id = modalId;
            document.body.appendChild(modal);

            uiService.showModal(modalId);
            expect(modal.style.display).to.equal('block');

            uiService.hideModal(modalId);
            expect(modal.style.display).to.equal('none');
        });
    });
}); 