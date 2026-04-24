export class CanvasManager {
    constructor(canvas) {
        this.canvas = canvas || document.getElementById('drawing-canvas');
        if (!this.canvas) {
            throw new Error('CanvasManager: no canvas element');
        }

        // 2D pipeline: app layers (vector + raster) render via onDrawLayers; WebGL path skips user content
        this.ctx = this.canvas.getContext('2d', {
            alpha: true,
            desynchronized: true,
            willReadFrequently: false
        });
        this.gl = null;
        this.useWebGL = false;

        try {
            this.worker = new Worker(new URL('./canvasWorker.js', import.meta.url));
            this.worker.onmessage = this.handleWorkerMessage.bind(this);
        } catch (e) {
            console.warn('Canvas worker unavailable:', e);
            this.worker = null;
        }

        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        // Snap-to-grid (driven by UI in app.js)
        this.snapToGrid = false;
        this.gridSize = 8;
        
        // Event handling state
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isPinching = false;
        this.initialPinchDistance = 0;
        this.initialScale = 1;

        // Throttling state
        this.lastDrawTime = 0;
        this.lastMoveTime = 0;
        this.lastZoomTime = 0;
        this.pendingDraw = false;
        this.pendingMove = false;
        this.pendingZoom = false;
        this.rafId = null;

        // Optimize throttling configuration
        this.drawThrottleMs = 8; // Increased from 16 to 8 for smoother updates
        this.moveThrottleMs = 8; // Increased from 16 to 8 for smoother updates
        this.zoomThrottleMs = 16; // Increased from 32 to 16 for smoother updates
        this.useRequestAnimationFrame = true;

        // Add frame skipping for better performance
        this.frameSkip = 0;
        this.maxFrameSkip = 0;

        // Add object pooling for better memory management
        this.objectPool = {
            positions: [],
            velocities: [],
            accelerations: [],
            matrices: []
        };

        // Canvas buffering
        this.bufferCanvas = document.createElement('canvas');
        this.bufferCtx = this.bufferCanvas.getContext('2d', {
            alpha: true,
            desynchronized: true,
            willReadFrequently: false
        });
        this.resizeBuffer();

        // Layer management
        this.layers = new Map();
        this.layerCache = new Map();
        this.dirtyLayers = new Set();
        this.visibleLayers = new Set();

        // Touch prediction
        this.touchPredictor = {
            positions: [],
            velocities: [],
            accelerations: [],
            timestamps: [],
            lastPrediction: null,
            confidence: 0,
            kalmanFilter: {
                x: 0, y: 0,
                vx: 0, vy: 0,
                ax: 0, ay: 0,
                P: [[1,0,0], [0,1,0], [0,0,1]],
                Q: 0.1,
                R: 0.1
            },
            gestureRecognizer: {
                gestures: new Map(),
                currentGesture: null,
                startTime: 0,
                startPosition: null,
                lastPosition: null,
                velocity: { x: 0, y: 0 },
                acceleration: { x: 0, y: 0 }
            }
        };

        // Initialize gesture patterns
        this.touchPredictor.gestureRecognizer.gestures.set('swipe', {
            minDistance: 50,
            maxTime: 300,
            minVelocity: 0.5,
            direction: null
        });

        this.touchPredictor.gestureRecognizer.gestures.set('pinch', {
            minScale: 0.1,
            maxScale: 10,
            minDistance: 20
        });

        this.touchPredictor.gestureRecognizer.gestures.set('rotate', {
            minAngle: 5,
            maxTime: 500
        });

        // Memory management
        this.memoryManager = {
            cacheSize: 0,
            maxCacheSize: 100 * 1024 * 1024, // 100MB
            layerCache: new Map(),
            texturePool: new Map(),
            lastCleanup: performance.now(),
            cleanupInterval: 5000, // 5 seconds
            gcThreshold: 0.8, // 80% of max cache size
            layerStates: new Map(),
            dirtyLayers: new Set(),
            visibleLayers: new Set()
        };

        // Debouncing timers
        this.debounceTimers = new Map();

        // Event handlers
        this.onDrawStart = null;
        this.onDraw = null;
        this.onDrawEnd = null;
        this.onDrawLayers = null;
        this.onZoom = null;
        this.onPan = null;

        // Initialize
        this.initializeEventListeners();
        this.initializeMemoryManagement();
        this.setupResizeObserver();
        this.startPerformanceMonitoring();
        requestAnimationFrame(() => this.syncCanvasSizeFromLayout());
    }

    /** When ResizeObserver reports 0×0 (flex not ready), still get a drawable bitmap. */
    syncCanvasSizeFromLayout() {
        const r = this.canvas.getBoundingClientRect();
        if (r.width >= 1 && r.height >= 1) {
            this.handleResize({ width: r.width, height: r.height });
        } else {
            const w = parseInt(this.canvas.getAttribute('width'), 10) || 800;
            const h = parseInt(this.canvas.getAttribute('height'), 10) || 600;
            this.handleResize({ width: w, height: h });
        }
    }

    initializeWebGL() {
        // Create WebGL context with performance optimizations
        this.gl = this.canvas.getContext('webgl', {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            desynchronized: true,
            powerPreference: 'high-performance'
        });

        if (!this.gl) {
            console.warn('WebGL not available, falling back to 2D context');
            this.ctx = this.canvas.getContext('2d');
            return;
        }

        // Create shader program
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            varying vec2 v_texCoord;
            uniform mat4 u_matrix;
            
            void main() {
                gl_Position = u_matrix * vec4(a_position, 0, 1);
                v_texCoord = a_texCoord;
            }
        `);

        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, `
            precision mediump float;
            varying vec2 v_texCoord;
            uniform sampler2D u_texture;
            uniform float u_opacity;
            uniform int u_blendMode;
            
            void main() {
                vec4 color = texture2D(u_texture, v_texCoord);
                
                // Apply blend modes
                if (u_blendMode == 1) { // Multiply
                    color.rgb *= color.a;
                } else if (u_blendMode == 2) { // Screen
                    color.rgb = 1.0 - (1.0 - color.rgb) * color.a;
                } else if (u_blendMode == 3) { // Overlay
                    color.rgb = color.rgb < 0.5 ? 
                        2.0 * color.rgb * color.a : 
                        1.0 - 2.0 * (1.0 - color.rgb) * (1.0 - color.a);
                }
                
                gl_FragColor = vec4(color.rgb, color.a * u_opacity);
            }
        `);

        // Create and link program
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Failed to link shader program:', this.gl.getProgramInfoLog(this.program));
            this.gl.deleteShader(shader);
            return;
        }

        // Get attribute and uniform locations
        this.attribLocations = {
            position: this.gl.getAttribLocation(this.program, 'a_position'),
            texCoord: this.gl.getAttribLocation(this.program, 'a_texCoord')
        };

        this.uniformLocations = {
            matrix: this.gl.getUniformLocation(this.program, 'u_matrix'),
            texture: this.gl.getUniformLocation(this.program, 'u_texture'),
            opacity: this.gl.getUniformLocation(this.program, 'u_opacity'),
            blendMode: this.gl.getUniformLocation(this.program, 'u_blendMode')
        };

        // Create buffers
        this.positionBuffer = this.gl.createBuffer();
        this.texCoordBuffer = this.gl.createBuffer();

        // Set up position buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ]), this.gl.STATIC_DRAW);

        // Set up texture coordinate buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ]), this.gl.STATIC_DRAW);

        // Enable attributes
        this.gl.enableVertexAttribArray(this.attribLocations.position);
        this.gl.enableVertexAttribArray(this.attribLocations.texCoord);

        // Set up texture parameters
        this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Failed to compile shader:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    startPerformanceMonitoring() {
        this.performanceMetrics = {
            frameTimes: [],
            lastFrameTime: performance.now(),
            fps: 0,
            memoryUsage: 0
        };

        // Monitor frame rate
        const updateMetrics = () => {
            const now = performance.now();
            const frameTime = now - this.performanceMetrics.lastFrameTime;
            this.performanceMetrics.frameTimes.push(frameTime);
            
            if (this.performanceMetrics.frameTimes.length > 60) {
                this.performanceMetrics.frameTimes.shift();
            }
            
            this.performanceMetrics.fps = 1000 / (this.performanceMetrics.frameTimes.reduce((a, b) => a + b) / this.performanceMetrics.frameTimes.length);
            this.performanceMetrics.lastFrameTime = now;

            // Monitor memory usage
            if (performance.memory) {
                this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
            }

            requestAnimationFrame(updateMetrics);
        };

        requestAnimationFrame(updateMetrics);
    }

    initializeMemoryManagement() {
        this.memoryManager = {
            cacheSize: 0,
            maxCacheSize: 100 * 1024 * 1024, // 100MB
            layerCache: new Map(),
            texturePool: new Map(),
            lastCleanup: performance.now(),
            cleanupInterval: 5000, // 5 seconds
            gcThreshold: 0.8, // 80% of max cache size
            layerStates: new Map(),
            dirtyLayers: new Set(),
            visibleLayers: new Set()
        };

        // Initialize layer states
        this.layers.forEach(layer => {
            this.memoryManager.layerStates.set(layer.id, {
                isDirty: true,
                isVisible: true,
                lastAccess: performance.now(),
                size: 0,
                texture: null
            });
            this.memoryManager.visibleLayers.add(layer.id);
        });

        // Start periodic cleanup
        setInterval(() => this.cleanupMemory(), this.memoryManager.cleanupInterval);
    }

    setupResizeObserver() {
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.target === this.canvas) {
                    this.handleResize(entry.contentRect);
                }
            }
        });
        resizeObserver.observe(this.canvas);
    }

    handleResize(rect) {
        const dpr = window.devicePixelRatio || 1;
        let rw = rect.width;
        let rh = rect.height;
        if (!rw || !rh) {
            rw = this.canvas.clientWidth || parseInt(this.canvas.getAttribute('width'), 10) || 800;
            rh = this.canvas.clientHeight || parseInt(this.canvas.getAttribute('height'), 10) || 600;
        }
        rw = Math.max(1, rw);
        rh = Math.max(1, rh);

        this.canvas.width = Math.floor(rw * dpr);
        this.canvas.height = Math.floor(rh * dpr);
        this.canvas.style.width = `${rw}px`;
        this.canvas.style.height = `${rh}px`;

        this.resizeBuffer();

        this.dirtyLayers = new Set(this.layers.keys());

        this.scheduleDraw();
    }

    resizeBuffer() {
        this.bufferCanvas.width = this.canvas.width;
        this.bufferCanvas.height = this.canvas.height;
    }

    // Layer management
    addLayer(id, layer) {
        this.layers.set(id, layer);
        this.dirtyLayers.add(id);
        this.visibleLayers.add(id);
        this.scheduleDraw();
    }

    removeLayer(id) {
        this.layers.delete(id);
        this.layerCache.delete(id);
        this.dirtyLayers.delete(id);
        this.visibleLayers.delete(id);
        this.scheduleDraw();
    }

    setLayerVisibility(id, visible) {
        if (visible) {
            this.visibleLayers.add(id);
        } else {
            this.visibleLayers.delete(id);
        }
        this.scheduleDraw();
    }

    // Touch prediction
    predictTouchPosition(touch) {
        const pos = this.getTouchPosition(touch);
        const now = performance.now();
        
        // Update position history
        this.touchPredictor.positions.push(pos);
        this.touchPredictor.timestamps.push(now);
        
        // Keep only recent history
        const maxHistory = 10;
        if (this.touchPredictor.positions.length > maxHistory) {
            this.touchPredictor.positions.shift();
            this.touchPredictor.timestamps.shift();
        }
        
        // Calculate velocity and acceleration
        if (this.touchPredictor.positions.length >= 2) {
            const dt = (now - this.touchPredictor.timestamps[this.touchPredictor.timestamps.length - 2]) / 1000;
            if (dt > 0) {
                const dx = pos.x - this.touchPredictor.positions[this.touchPredictor.positions.length - 2].x;
                const dy = pos.y - this.touchPredictor.positions[this.touchPredictor.positions.length - 2].y;
                
                const velocity = { x: dx / dt, y: dy / dt };
                this.touchPredictor.velocities.push(velocity);
                
                if (this.touchPredictor.velocities.length > maxHistory) {
                    this.touchPredictor.velocities.shift();
                }
                
                if (this.touchPredictor.velocities.length >= 2) {
                    const dvx = velocity.x - this.touchPredictor.velocities[this.touchPredictor.velocities.length - 2].x;
                    const dvy = velocity.y - this.touchPredictor.velocities[this.touchPredictor.velocities.length - 2].y;
                    
                    const acceleration = { x: dvx / dt, y: dvy / dt };
                    this.touchPredictor.accelerations.push(acceleration);
                    
                    if (this.touchPredictor.accelerations.length > maxHistory) {
                        this.touchPredictor.accelerations.shift();
                    }
                }
            }
        }
        
        // Update Kalman filter
        this.updateKalmanFilter(pos, 16.67 / 1000); // Assume 60fps
        
        // Predict future position
        const prediction = {
            x: this.touchPredictor.kalmanFilter.x + 
               this.touchPredictor.kalmanFilter.vx * 16.67 + 
               0.5 * this.touchPredictor.kalmanFilter.ax * 16.67 * 16.67,
            y: this.touchPredictor.kalmanFilter.y + 
               this.touchPredictor.kalmanFilter.vy * 16.67 + 
               0.5 * this.touchPredictor.kalmanFilter.ay * 16.67 * 16.67
        };
        
        // Calculate prediction confidence
        this.touchPredictor.confidence = this.calculatePredictionConfidence();
        
        this.touchPredictor.lastPrediction = prediction;
        return prediction;
    }

    updateKalmanFilter(position, dt) {
        const { kalmanFilter } = this.touchPredictor;
        
        // Predict
        const F = [
            [1, dt, 0.5 * dt * dt],
            [0, 1, dt],
            [0, 0, 1]
        ];
        
        // Update state
        const newX = F[0][0] * kalmanFilter.x + F[0][1] * kalmanFilter.vx + F[0][2] * kalmanFilter.ax;
        const newVx = F[1][0] * kalmanFilter.x + F[1][1] * kalmanFilter.vx + F[1][2] * kalmanFilter.ax;
        const newAx = F[2][0] * kalmanFilter.x + F[2][1] * kalmanFilter.vx + F[2][2] * kalmanFilter.ax;
        
        // Update covariance
        const P = kalmanFilter.P;
        const newP = [
            [P[0][0] + dt * P[0][1] + 0.5 * dt * dt * P[0][2], P[0][1] + dt * P[0][2], P[0][2]],
            [P[1][0] + dt * P[1][1] + 0.5 * dt * dt * P[1][2], P[1][1] + dt * P[1][2], P[1][2]],
            [P[2][0] + dt * P[2][1] + 0.5 * dt * dt * P[2][2], P[2][1] + dt * P[2][2], P[2][2]]
        ];
        
        // Add process noise
        newP[0][0] += kalmanFilter.Q;
        newP[1][1] += kalmanFilter.Q;
        newP[2][2] += kalmanFilter.Q;
        
        // Update
        const y = position.x - newX;
        const S = newP[0][0] + kalmanFilter.R;
        const K = newP[0][0] / S;
        
        kalmanFilter.x = newX + K * y;
        kalmanFilter.vx = newVx + K * y;
        kalmanFilter.ax = newAx + K * y;
        
        kalmanFilter.P = [
            [(1 - K) * newP[0][0], (1 - K) * newP[0][1], (1 - K) * newP[0][2]],
            [newP[1][0] - K * newP[0][0], newP[1][1] - K * newP[0][1], newP[1][2] - K * newP[0][2]],
            [newP[2][0] - K * newP[0][0], newP[2][1] - K * newP[0][1], newP[2][2] - K * newP[0][2]]
        ];
    }

    calculatePredictionConfidence() {
        if (this.touchPredictor.positions.length < 2) return 0;
        
        // Calculate velocity stability
        const velocityStability = this.calculateStability(this.touchPredictor.velocities);
        
        // Calculate acceleration stability
        const accelerationStability = this.calculateStability(this.touchPredictor.accelerations);
        
        // Calculate position consistency
        const positionConsistency = this.calculatePositionConsistency();
        
        // Combine metrics
        return (velocityStability * 0.4 + accelerationStability * 0.3 + positionConsistency * 0.3);
    }

    calculateStability(values) {
        if (values.length < 2) return 0;
        
        let sum = 0;
        let sumSq = 0;
        
        for (const value of values) {
            const magnitude = Math.sqrt(value.x * value.x + value.y * value.y);
            sum += magnitude;
            sumSq += magnitude * magnitude;
        }
        
        const mean = sum / values.length;
        const variance = (sumSq / values.length) - (mean * mean);
        
        return 1 / (1 + variance);
    }

    calculatePositionConsistency() {
        if (this.touchPredictor.positions.length < 2) return 0;
        
        let totalDistance = 0;
        let maxDistance = 0;
        
        for (let i = 1; i < this.touchPredictor.positions.length; i++) {
            const dx = this.touchPredictor.positions[i].x - this.touchPredictor.positions[i-1].x;
            const dy = this.touchPredictor.positions[i].y - this.touchPredictor.positions[i-1].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            totalDistance += distance;
            maxDistance = Math.max(maxDistance, distance);
        }
        
        const averageDistance = totalDistance / (this.touchPredictor.positions.length - 1);
        return 1 / (1 + Math.abs(averageDistance - maxDistance));
    }

    recognizeGesture(touch) {
        const { gestureRecognizer } = this.touchPredictor;
        const pos = this.getTouchPosition(touch);
        const now = performance.now();
        
        if (!gestureRecognizer.startPosition) {
            gestureRecognizer.startPosition = pos;
            gestureRecognizer.startTime = now;
            gestureRecognizer.lastPosition = pos;
            return null;
        }
        
        const dx = pos.x - gestureRecognizer.startPosition.x;
        const dy = pos.y - gestureRecognizer.startPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dt = now - gestureRecognizer.startTime;
        
        // Calculate velocity and acceleration
        const vx = (pos.x - gestureRecognizer.lastPosition.x) / 16.67;
        const vy = (pos.y - gestureRecognizer.lastPosition.y) / 16.67;
        
        gestureRecognizer.velocity = { x: vx, y: vy };
        gestureRecognizer.lastPosition = pos;
        
        // Check for swipe
        if (distance > 50 && dt < 300) {
            const velocity = Math.sqrt(vx * vx + vy * vy);
            if (velocity > 0.5) {
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                let direction;
                
                if (angle > -45 && angle <= 45) direction = 'right';
                else if (angle > 45 && angle <= 135) direction = 'down';
                else if (angle > 135 || angle <= -135) direction = 'left';
                else direction = 'up';
                
                return {
                    type: 'swipe',
                    direction,
                    velocity,
                    distance
                };
            }
        }
        
        return null;
    }

    // Memory management
    cleanupMemory() {
        const now = Date.now();
        
        // Clean up old layer caches
        for (const [id, cache] of this.layerCache.entries()) {
            if (now - cache.timestamp > this.memoryManager.cacheTimeout) {
                this.layerCache.delete(id);
                this.memoryManager.currentCacheSize -= cache.size;
            }
        }

        // Force garbage collection if cache is too large
        if (this.memoryManager.currentCacheSize > this.memoryManager.maxCacheSize) {
            this.layerCache.clear();
            this.memoryManager.currentCacheSize = 0;
            this.dirtyLayers = new Set(this.layers.keys());
        }

        this.memoryManager.lastCleanup = now;
    }

    // Debouncing
    debounce(key, fn, delay = 250) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        this.debounceTimers.set(key, setTimeout(() => {
            fn();
            this.debounceTimers.delete(key);
        }, delay));
    }

    // Optimized drawing
    draw() {
        // Implement frame skipping for better performance
        if (this.frameSkip < this.maxFrameSkip) {
            this.frameSkip++;
            return;
        }
        this.frameSkip = 0;

        if (this.useWebGL) {
            this.drawWebGL();
        } else {
            this.draw2D();
        }
    }

    drawWebGL() {
        if (!this.gl || !this.program) return;

        // Optimize WebGL state changes
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.STENCIL_TEST);
        this.gl.disable(this.gl.CULL_FACE);
        this.gl.disable(this.gl.BLEND);

        // Clear canvas with optimized clear
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Use shader program
        this.gl.useProgram(this.program);

        // Set up viewport
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Set up projection matrix (cached)
        if (!this.projectionMatrix) {
            this.projectionMatrix = new Float32Array([
                2 / this.canvas.width, 0, 0, 0,
                0, -2 / this.canvas.height, 0, 0,
                0, 0, 1, 0,
                -1, 1, 0, 1
            ]);
        }
        this.gl.uniformMatrix4fv(this.uniformLocations.matrix, false, this.projectionMatrix);

        // Draw visible layers with batching
        const visibleLayers = Array.from(this.memoryManager.visibleLayers);
        const batchSize = 10;
        
        for (let i = 0; i < visibleLayers.length; i += batchSize) {
            const batch = visibleLayers.slice(i, i + batchSize);
            this.drawLayerBatch(batch);
        }
    }

    drawLayerBatch(layerIds) {
        // Batch draw multiple layers
        for (const layerId of layerIds) {
            this.drawLayerWebGL(layerId);
        }
    }

    drawLayerWebGL(layerId) {
        const texture = this.getLayerTexture(layerId);
        if (!texture) return;

        const state = this.memoryManager.layerStates.get(layerId);
        if (!state) return;

        // Bind texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.uniform1i(this.uniformLocations.texture, 0);

        // Set opacity
        this.gl.uniform1f(this.uniformLocations.opacity, state.opacity || 1.0);

        // Set blend mode
        this.gl.uniform1i(this.uniformLocations.blendMode, state.blendMode || 0);

        // Set up position attribute
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(
            this.attribLocations.position,
            2,
            this.gl.FLOAT,
            false,
            0,
            0
        );

        // Set up texture coordinate attribute
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.vertexAttribPointer(
            this.attribLocations.texCoord,
            2,
            this.gl.FLOAT,
            false,
            0,
            0
        );

        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    draw2D() {
        // Clear buffer
        this.bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);

        // Save context state
        this.bufferCtx.save();

        // Apply transformations
        this.bufferCtx.translate(this.offsetX, this.offsetY);
        this.bufferCtx.scale(this.scale, this.scale);

        this.drawGrid();

        if (this.onDrawLayers) {
            this.onDrawLayers(this.bufferCtx);
        } else {
            for (const id of this.visibleLayers) {
                if (this.dirtyLayers.has(id)) {
                    this.updateLayerCache(id);
                }
                this.drawLayer(id);
            }
        }

        // Restore context state
        this.bufferCtx.restore();

        // Copy buffer to main canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.bufferCanvas, 0, 0);
    }

    updateLayerCache(id) {
        const layer = this.layers.get(id);
        if (!layer) return;

        // Create temporary canvas for layer
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;

        // Draw layer to temporary canvas
        layer.draw(tempCtx);

        // Store in cache
        this.layerCache.set(id, {
            canvas: tempCanvas,
            timestamp: Date.now(),
            size: tempCanvas.width * tempCanvas.height * 4 // Approximate size in bytes
        });

        this.memoryManager.currentCacheSize += tempCanvas.width * tempCanvas.height * 4;
        this.dirtyLayers.delete(id);
    }

    drawLayer(id) {
        const cache = this.layerCache.get(id);
        if (cache) {
            this.bufferCtx.drawImage(cache.canvas, 0, 0);
        }
    }

    initializeEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));

        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
    }

    handleMouseDown(event) {
        event.preventDefault();
        this.isDragging = true;
        const pos = this.getMousePosition(event);
        this.lastX = pos.x;
        this.lastY = pos.y;

        if (this.onDrawStart) {
            this.onDrawStart(this.maybeSnap(pos));
        }
    }

    handleMouseMove(event) {
        event.preventDefault();
        const now = performance.now();
        
        // Optimize move event handling
        if (now - this.lastMoveTime < this.moveThrottleMs) {
            if (!this.pendingMove) {
                this.pendingMove = true;
                if (this.useRequestAnimationFrame) {
                    if (this.rafId) {
                        cancelAnimationFrame(this.rafId);
                    }
                    this.rafId = requestAnimationFrame(() => this.processMouseMove(event));
                } else {
                    setTimeout(() => this.processMouseMove(event), this.moveThrottleMs);
                }
            }
            return;
        }

        this.processMouseMove(event);
        this.lastMoveTime = now;
    }

    processMouseMove(event) {
        this.pendingMove = false;
        const pos = this.getMousePosition(event);

        if (this.isDragging) {
            const dx = pos.x - this.lastX;
            const dy = pos.y - this.lastY;
            this.lastX = pos.x;
            this.lastY = pos.y;

            if (event.shiftKey) {
                // Pan the canvas when shift is held
                this.offsetX += dx * this.scale;
                this.offsetY += dy * this.scale;
                this.scheduleDraw();
                if (this.onPan) {
                    this.onPan(this.offsetX, this.offsetY);
                }
            } else if (this.onDraw) {
                this.onDraw(this.maybeSnap(pos));
            }
        }
    }

    handleMouseUp(event) {
        event.preventDefault();
        if (this.isDragging) {
            this.isDragging = false;
            const pos = this.getMousePosition(event);
            if (this.onDrawEnd) {
                this.onDrawEnd(this.maybeSnap(pos));
            }
        }
    }

    handleMouseLeave(event) {
        event.preventDefault();
        if (this.isDragging) {
            this.isDragging = false;
            if (this.onDrawEnd) {
                this.onDrawEnd(this.maybeSnap(this.getMousePosition(event)));
            }
        }
    }

    handleWheel(event) {
        event.preventDefault();
        const now = performance.now();
        
        // Throttle zoom events
        if (now - this.lastZoomTime < this.zoomThrottleMs) {
            if (!this.pendingZoom) {
                this.pendingZoom = true;
                if (this.useRequestAnimationFrame) {
                    this.rafId = requestAnimationFrame(() => this.processWheel(event));
                } else {
                    setTimeout(() => this.processWheel(event), this.zoomThrottleMs);
                }
            }
            return;
        }

        this.processWheel(event);
        this.lastZoomTime = now;
    }

    processWheel(event) {
        this.pendingZoom = false;
        const delta = event.deltaY > 0 ? 0.9 : 1.1;
        const pos = this.getMousePosition(event);
        
        // Calculate new scale
        const newScale = this.scale * delta;
        
        // Limit scale between 0.1 and 10
        if (newScale >= 0.1 && newScale <= 10) {
            // Calculate new offset to zoom towards mouse position
            this.offsetX = pos.x - (pos.x - this.offsetX) * delta;
            this.offsetY = pos.y - (pos.y - this.offsetY) * delta;
            this.scale = newScale;
            
            this.scheduleDraw();
            if (this.onZoom) {
                this.onZoom(this.scale, pos);
            }
        }
    }

    handleTouchStart(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            // Single touch - handle as mouse
            const touch = event.touches[0];
            this.isDragging = true;
            const pos = this.getTouchPosition(touch);
            this.lastX = pos.x;
            this.lastY = pos.y;
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;

            if (this.onDrawStart) {
                this.onDrawStart(this.maybeSnap(pos));
            }
        } else if (event.touches.length === 2) {
            // Two touches - handle pinch zoom
            this.isPinching = true;
            this.initialScale = this.scale;
            this.initialPinchDistance = this.getPinchDistance(event.touches);
        }
    }

    handleTouchMove(event) {
        event.preventDefault();
        const now = performance.now();
        
        // Throttle touch move events
        if (now - this.lastMoveTime < this.moveThrottleMs) {
            if (!this.pendingMove) {
                this.pendingMove = true;
                if (this.useRequestAnimationFrame) {
                    this.rafId = requestAnimationFrame(() => this.processTouchMove(event));
                } else {
                    setTimeout(() => this.processTouchMove(event), this.moveThrottleMs);
                }
            }
            return;
        }

        this.processTouchMove(event);
        this.lastMoveTime = now;
    }

    processTouchMove(event) {
        this.pendingMove = false;
        if (event.touches.length === 1 && this.isDragging) {
            // Single touch move
            const touch = event.touches[0];
            const pos = this.getTouchPosition(touch);
            const dx = pos.x - this.lastX;
            const dy = pos.y - this.lastY;
            this.lastX = pos.x;
            this.lastY = pos.y;

            // Check if this is a pan gesture (moved more than 10px)
            const moveDistance = Math.sqrt(
                Math.pow(touch.clientX - this.touchStartX, 2) +
                Math.pow(touch.clientY - this.touchStartY, 2)
            );

            if (moveDistance > 10) {
                // Pan the canvas
                this.offsetX += dx * this.scale;
                this.offsetY += dy * this.scale;
                this.scheduleDraw();
                if (this.onPan) {
                    this.onPan(this.offsetX, this.offsetY);
                }
            } else if (this.onDraw) {
                this.onDraw(this.maybeSnap(pos));
            }
        } else if (event.touches.length === 2 && this.isPinching) {
            // Pinch zoom
            const currentDistance = this.getPinchDistance(event.touches);
            const scale = this.initialScale * (currentDistance / this.initialPinchDistance);
            
            // Limit scale between 0.1 and 10
            if (scale >= 0.1 && scale <= 10) {
                this.scale = scale;
                this.scheduleDraw();
                if (this.onZoom) {
                    const center = this.getPinchCenter(event.touches);
                    this.onZoom(this.scale, center);
                }
            }
        }
    }

    handleTouchEnd(event) {
        event.preventDefault();
        if (event.touches.length === 0) {
            if (this.isDragging) {
                this.isDragging = false;
                if (this.onDrawEnd) {
                    this.onDrawEnd(this.maybeSnap({ x: this.lastX, y: this.lastY }));
                }
            }
            if (this.isPinching) {
                this.isPinching = false;
            }
        }
    }

    getTouchPosition(touch) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (touch.clientX - rect.left - this.offsetX) / this.scale,
            y: (touch.clientY - rect.top - this.offsetY) / this.scale
        };
    }

    getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getPinchCenter(touches) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (touches[0].clientX + touches[1].clientX) / 2;
        const y = (touches[0].clientY + touches[1].clientY) / 2;
        return {
            x: (x - rect.left - this.offsetX) / this.scale,
            y: (y - rect.top - this.offsetY) / this.scale
        };
    }

    setDrawHandlers({ onDrawStart, onDraw, onDrawEnd, onZoom, onPan, onDrawLayers }) {
        this.onDrawStart = onDrawStart;
        this.onDraw = onDraw;
        this.onDrawEnd = onDrawEnd;
        this.onZoom = onZoom;
        this.onPan = onPan;
        this.onDrawLayers = onDrawLayers;
    }

    setZoom(zoom) {
        const z = Math.max(0.1, Math.min(10, Number(zoom) || 1));
        this.scale = z;
        this.scheduleDraw();
    }

    // Zoom in by multiplying scale by 1.2
    zoomIn() {
        this.setZoom(this.scale * 1.2);
    }

    // Zoom out by dividing scale by 1.2
    zoomOut() {
        this.setZoom(this.scale / 1.2);
    }

    // Reset zoom to 100%
    resetZoom() {
        this.setZoom(1);
    }

    scheduleDraw() {
        const now = performance.now();
        
        // Throttle draw calls
        if (now - this.lastDrawTime < this.drawThrottleMs) {
            if (!this.pendingDraw) {
                this.pendingDraw = true;
                if (this.useRequestAnimationFrame) {
                    this.rafId = requestAnimationFrame(() => this.processDraw());
                } else {
                    setTimeout(() => this.processDraw(), this.drawThrottleMs);
                }
            }
            return;
        }

        this.processDraw();
        this.lastDrawTime = now;
    }

    processDraw() {
        this.pendingDraw = false;
        this.draw();
    }

    drawGrid() {
        const g = this.bufferCtx;
        if (!g) return;
        if (!this.snapToGrid) return; // only show grid when snap is on
        const gridSize = Math.max(2, Number(this.gridSize) || 8);
        const width = this.canvas.width / this.scale;
        const height = this.canvas.height / this.scale;

        g.save();
        g.beginPath();
        g.strokeStyle = 'rgba(120,120,120,0.22)';
        g.lineWidth = 0.5;

        for (let x = 0; x <= width; x += gridSize) {
            g.moveTo(x + 0.5, 0);
            g.lineTo(x + 0.5, height);
        }
        for (let y = 0; y <= height; y += gridSize) {
            g.moveTo(0, y + 0.5);
            g.lineTo(width, y + 0.5);
        }
        g.stroke();
        g.restore();
    }

    /** Round a point to the current grid if snap is on. */
    maybeSnap(pos) {
        if (!this.snapToGrid || !pos) return pos;
        const s = Math.max(2, Number(this.gridSize) || 8);
        return {
            x: Math.round(pos.x / s) * s,
            y: Math.round(pos.y / s) * s
        };
    }

    setSnapToGrid(on) {
        this.snapToGrid = !!on;
        this.scheduleDraw();
    }

    setGridSize(px) {
        const n = Math.max(2, Math.min(64, Math.floor(Number(px) || 8)));
        this.gridSize = n;
        this.scheduleDraw();
    }

    drawObjects() {
        // This should be implemented by the application to draw objects
    }

    setScale(scale) {
        this.scale = scale;
        this.draw();
    }

    setOffset(x, y) {
        this.offsetX = x;
        this.offsetY = y;
        this.draw();
    }

    getMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left - this.offsetX) / this.scale,
            y: (event.clientY - rect.top - this.offsetY) / this.scale
        };
    }

    screenToCanvas(x, y) {
        return {
            x: (x - this.offsetX) / this.scale,
            y: (y - this.offsetY) / this.scale
        };
    }

    canvasToScreen(x, y) {
        return {
            x: x * this.scale + this.offsetX,
            y: y * this.scale + this.offsetY
        };
    }

    getBounds() {
        return {
            x: -this.offsetX / this.scale,
            y: -this.offsetY / this.scale,
            width: this.canvas.width / this.scale,
            height: this.canvas.height / this.scale
        };
    }

    cleanup() {
        // Cancel any pending animations
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }

        // Clear all timers
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();

        // Clear caches
        this.layerCache.clear();
        this.memoryManager.currentCacheSize = 0;

        // Remove event listeners
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
        this.canvas.removeEventListener('wheel', this.handleWheel);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);
    }

    // Worker message handling
    handleWorkerMessage(event) {
        const { type, data } = event.data;
        switch (type) {
            case 'layerProcessed':
                this.handleProcessedLayer(data);
                break;
            case 'memoryOptimized':
                this.handleMemoryOptimization(data);
                break;
        }
    }

    // Memory optimization
    optimizeMemory() {
        const now = performance.now();
        if (now - this.memoryOptimizer.lastCleanup > this.memoryOptimizer.cleanupInterval) {
            // Optimize memory cleanup
            this.worker.postMessage({
                type: 'optimizeMemory',
                data: {
                    maxTextureSize: this.memoryOptimizer.maxTextureSize,
                    currentUsage: this.performanceMetrics.memoryUsage,
                    visibleLayers: Array.from(this.memoryManager.visibleLayers),
                    layerStates: Array.from(this.memoryManager.layerStates.entries())
                }
            });
            this.memoryOptimizer.lastCleanup = now;
        }
    }
} 