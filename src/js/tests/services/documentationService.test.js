import { expect } from 'chai';
import documentationService from '../../../js/services/documentationService';

describe('DocumentationService', () => {
    let originalDocument;

    beforeEach(() => {
        // Store original document methods
        originalDocument = {
            querySelector: document.querySelector,
            createElement: document.createElement,
            body: document.body
        };

        // Create clean document body
        document.body.innerHTML = '';
    });

    afterEach(() => {
        // Restore original document methods
        document.querySelector = originalDocument.querySelector;
        document.createElement = originalDocument.createElement;
        document.body = originalDocument.body;
    });

    describe('Documentation Levels', () => {
        it('should initialize with beginner level', () => {
            expect(documentationService.getLevel()).to.equal('beginner');
        });

        it('should change documentation level', () => {
            expect(documentationService.setLevel('intermediate')).to.be.true;
            expect(documentationService.getLevel()).to.equal('intermediate');
        });

        it('should not change to invalid level', () => {
            expect(documentationService.setLevel('invalid')).to.be.false;
            expect(documentationService.getLevel()).to.equal('beginner');
        });
    });

    describe('Documentation Content', () => {
        it('should have beginner documentation', () => {
            const docs = documentationService.docs.beginner;
            expect(docs).to.have.property('title');
            expect(docs).to.have.property('sections');
            expect(docs.sections).to.be.an('array');
        });

        it('should have intermediate documentation', () => {
            const docs = documentationService.docs.intermediate;
            expect(docs).to.have.property('title');
            expect(docs).to.have.property('sections');
            expect(docs.sections).to.be.an('array');
        });

        it('should have advanced documentation', () => {
            const docs = documentationService.docs.advanced;
            expect(docs).to.have.property('title');
            expect(docs).to.have.property('sections');
            expect(docs.sections).to.be.an('array');
        });
    });

    describe('Tutorials', () => {
        it('should have tutorials for all levels', () => {
            const tutorials = documentationService.tutorials;
            expect(tutorials).to.be.an('array');
            expect(tutorials.length).to.be.greaterThan(0);
        });

        it('should find tutorial by ID', () => {
            const tutorial = documentationService.tutorials.find(t => t.id === 'first-steps');
            expect(tutorial).to.exist;
            expect(tutorial.title).to.equal('First Steps');
        });

        it('should have steps in tutorials', () => {
            const tutorial = documentationService.tutorials.find(t => t.id === 'first-steps');
            expect(tutorial.steps).to.be.an('array');
            expect(tutorial.steps.length).to.be.greaterThan(0);
        });
    });

    describe('Documentation Display', () => {
        it('should create documentation modal', () => {
            documentationService.showDocumentation('beginner');
            const modal = document.querySelector('.documentation-modal');
            expect(modal).to.exist;
        });

        it('should show correct documentation content', () => {
            documentationService.showDocumentation('beginner');
            const content = document.querySelector('.documentation-content');
            expect(content).to.exist;
            expect(content.querySelector('h1').textContent).to.equal('Getting Started');
        });
    });

    describe('Tutorial Display', () => {
        beforeEach(() => {
            // Create necessary DOM elements
            const toolbar = document.createElement('div');
            toolbar.className = 'toolbar';
            document.body.appendChild(toolbar);

            const importButton = document.createElement('button');
            importButton.setAttribute('data-tool', 'import');
            toolbar.appendChild(importButton);

            const canvas = document.createElement('div');
            canvas.className = 'canvas-container';
            document.body.appendChild(canvas);
        });

        it('should start tutorial', () => {
            documentationService.startTutorial('first-steps');
            const tooltip = document.querySelector('.tutorial-tooltip');
            expect(tooltip).to.exist;
        });

        it('should show tutorial steps in sequence', () => {
            documentationService.startTutorial('first-steps');
            const tooltip = document.querySelector('.tutorial-tooltip');
            expect(tooltip).to.exist;
            expect(tooltip.querySelector('h3').textContent).to.equal('Welcome');
        });

        it('should end tutorial', () => {
            documentationService.startTutorial('first-steps');
            documentationService.endTutorial();
            const tooltip = document.querySelector('.tutorial-tooltip');
            expect(tooltip).to.not.exist;
        });
    });

    describe('Tooltip Positioning', () => {
        it('should position tooltip correctly', () => {
            const target = document.createElement('div');
            target.style.position = 'absolute';
            target.style.top = '100px';
            target.style.left = '100px';
            target.style.width = '200px';
            target.style.height = '200px';
            document.body.appendChild(target);

            const tooltip = document.createElement('div');
            tooltip.className = 'tutorial-tooltip';
            tooltip.style.width = '100px';
            tooltip.style.height = '100px';
            document.body.appendChild(tooltip);

            documentationService.positionTooltip(tooltip, target, 'bottom');
            expect(tooltip.style.top).to.equal('310px');
            expect(tooltip.style.left).to.equal('150px');
        });
    });
}); 