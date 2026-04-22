import { expect } from 'chai';
import gestureService from '../../../js/services/gestureService';

describe('GestureService', () => {
    let testElement;
    let originalDocument;

    beforeEach(() => {
        // Create test element
        testElement = document.createElement('div');
        document.body.appendChild(testElement);
        gestureService.attachToElement(testElement);

        // Store original document methods
        originalDocument = {
            querySelector: document.querySelector
        };
    });

    afterEach(() => {
        // Clean up
        gestureService.detachFromElement(testElement);
        document.body.removeChild(testElement);
        document.querySelector = originalDocument.querySelector;
    });

    describe('Touch Events', () => {
        it('should handle touch start', () => {
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 100 }]
            });
            testElement.dispatchEvent(touchStartEvent);
            expect(gestureService.touchStartX).to.equal(100);
            expect(gestureService.touchStartY).to.equal(100);
        });

        it('should handle touch end', () => {
            // Simulate touch start
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 100 }]
            });
            testElement.dispatchEvent(touchStartEvent);

            // Simulate touch end
            const touchEndEvent = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 200, clientY: 100 }]
            });
            testElement.dispatchEvent(touchEndEvent);

            expect(gestureService.touchEndX).to.equal(200);
            expect(gestureService.touchEndY).to.equal(100);
        });
    });

    describe('Swipe Gestures', () => {
        it('should detect right swipe', () => {
            // Mock sidebar element
            const sidebar = document.createElement('div');
            sidebar.className = 'sidebar';
            document.body.appendChild(sidebar);
            document.querySelector = () => sidebar;

            // Simulate right swipe
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 100 }]
            });
            testElement.dispatchEvent(touchStartEvent);

            const touchEndEvent = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 200, clientY: 100 }]
            });
            testElement.dispatchEvent(touchEndEvent);

            expect(sidebar.classList.contains('active')).to.be.false;
        });

        it('should detect left swipe', () => {
            // Mock sidebar element
            const sidebar = document.createElement('div');
            sidebar.className = 'sidebar';
            document.body.appendChild(sidebar);
            document.querySelector = () => sidebar;

            // Simulate left swipe
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{ clientX: 200, clientY: 100 }]
            });
            testElement.dispatchEvent(touchStartEvent);

            const touchEndEvent = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 100, clientY: 100 }]
            });
            testElement.dispatchEvent(touchEndEvent);

            expect(sidebar.classList.contains('active')).to.be.true;
        });
    });

    describe('Pinch Gesture', () => {
        it('should handle pinch zoom', () => {
            // Mock canvas element
            const canvas = document.createElement('div');
            canvas.className = 'canvas-container';
            document.body.appendChild(canvas);
            document.querySelector = () => canvas;

            // Simulate pinch start
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [
                    { clientX: 100, clientY: 100 },
                    { clientX: 200, clientY: 100 }
                ]
            });
            testElement.dispatchEvent(touchStartEvent);

            // Simulate pinch move
            const touchMoveEvent = new TouchEvent('touchmove', {
                touches: [
                    { clientX: 50, clientY: 100 },
                    { clientX: 250, clientY: 100 }
                ]
            });
            testElement.dispatchEvent(touchMoveEvent);

            expect(canvas.style.transform).to.include('scale(');
        });
    });

    describe('Double Tap', () => {
        it('should handle double tap', () => {
            // Mock canvas element
            const canvas = document.createElement('div');
            canvas.className = 'canvas-container';
            document.body.appendChild(canvas);
            document.querySelector = () => canvas;

            // Simulate first tap
            const firstTap = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 100 }]
            });
            testElement.dispatchEvent(firstTap);

            // Simulate second tap immediately after
            const secondTap = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 100 }]
            });
            testElement.dispatchEvent(secondTap);

            expect(canvas.style.transform).to.include('scale(2)');
        });
    });

    describe('Gesture Handlers', () => {
        it('should register custom gesture handler', () => {
            let handlerCalled = false;
            const customHandler = () => { handlerCalled = true; };

            gestureService.registerGestureHandler('customGesture', customHandler);
            gestureService.gestureHandlers.get('customGesture')();

            expect(handlerCalled).to.be.true;
        });

        it('should unregister gesture handler', () => {
            const customHandler = () => {};
            gestureService.registerGestureHandler('customGesture', customHandler);
            gestureService.unregisterGestureHandler('customGesture');

            expect(gestureService.gestureHandlers.has('customGesture')).to.be.false;
        });
    });
}); 