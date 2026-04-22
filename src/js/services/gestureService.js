class GestureService {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50;
        this.doubleTapTimeout = 300;
        this.lastTapTime = 0;
        this.pinchStartDistance = 0;
        this.currentScale = 1;
        
        this.gestureHandlers = new Map();
        this.initializeGestures();
    }

    initializeGestures() {
        // Initialize basic gesture handlers
        this.gestureHandlers.set('swipeLeft', () => this.handleSwipeLeft());
        this.gestureHandlers.set('swipeRight', () => this.handleSwipeRight());
        this.gestureHandlers.set('swipeUp', () => this.handleSwipeUp());
        this.gestureHandlers.set('swipeDown', () => this.handleSwipeDown());
        this.gestureHandlers.set('doubleTap', () => this.handleDoubleTap());
        this.gestureHandlers.set('pinch', (scale) => this.handlePinch(scale));
    }

    attachToElement(element) {
        if (!element) return;

        element.addEventListener('touchstart', this.handleTouchStart.bind(this));
        element.addEventListener('touchmove', this.handleTouchMove.bind(this));
        element.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    detachFromElement(element) {
        if (!element) return;

        element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
        element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    handleTouchStart(event) {
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;

        // Handle double tap
        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.lastTapTime;
        if (tapLength < this.doubleTapTimeout && tapLength > 0) {
            this.gestureHandlers.get('doubleTap')();
            event.preventDefault();
        }
        this.lastTapTime = currentTime;

        // Handle pinch start
        if (event.touches.length === 2) {
            this.pinchStartDistance = this.getDistance(
                event.touches[0].clientX,
                event.touches[0].clientY,
                event.touches[1].clientX,
                event.touches[1].clientY
            );
        }
    }

    handleTouchMove(event) {
        if (event.touches.length === 2) {
            // Handle pinch
            const currentDistance = this.getDistance(
                event.touches[0].clientX,
                event.touches[0].clientY,
                event.touches[1].clientX,
                event.touches[1].clientY
            );
            const scale = currentDistance / this.pinchStartDistance;
            this.gestureHandlers.get('pinch')(scale);
            event.preventDefault();
        }
    }

    handleTouchEnd(event) {
        const touch = event.changedTouches[0];
        this.touchEndX = touch.clientX;
        this.touchEndY = touch.clientY;

        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;

        // Determine if the swipe was horizontal or vertical
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > this.minSwipeDistance) {
                if (deltaX > 0) {
                    this.gestureHandlers.get('swipeRight')();
                } else {
                    this.gestureHandlers.get('swipeLeft')();
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > this.minSwipeDistance) {
                if (deltaY > 0) {
                    this.gestureHandlers.get('swipeDown')();
                } else {
                    this.gestureHandlers.get('swipeUp')();
                }
            }
        }
    }

    getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    handleSwipeLeft() {
        // Toggle sidebar visibility
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }

    handleSwipeRight() {
        // Close sidebar if open
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    }

    handleSwipeUp() {
        // Show toolbar if hidden
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            toolbar.classList.remove('collapsed');
        }
    }

    handleSwipeDown() {
        // Hide toolbar
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            toolbar.classList.add('collapsed');
        }
    }

    handleDoubleTap() {
        // Toggle zoom level
        const canvas = document.querySelector('.canvas-container');
        if (canvas) {
            const currentScale = parseFloat(canvas.style.transform.replace('scale(', '').replace(')', '')) || 1;
            const newScale = currentScale === 1 ? 2 : 1;
            canvas.style.transform = `scale(${newScale})`;
        }
    }

    handlePinch(scale) {
        // Update zoom level
        const canvas = document.querySelector('.canvas-container');
        if (canvas) {
            this.currentScale = Math.min(Math.max(0.5, this.currentScale * scale), 3);
            canvas.style.transform = `scale(${this.currentScale})`;
        }
    }

    registerGestureHandler(gesture, handler) {
        this.gestureHandlers.set(gesture, handler);
    }

    unregisterGestureHandler(gesture) {
        this.gestureHandlers.delete(gesture);
    }
}

export default new GestureService(); 