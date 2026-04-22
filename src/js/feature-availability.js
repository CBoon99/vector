import messaging from './messaging.js';

class FeatureAvailability {
    constructor() {
        this.isMobile = this.detectMobile();
        this.deviceInfo = this.getDeviceInfo();
        this.performanceMetrics = {
            fps: 0,
            memoryUsage: 0,
            cpuLoad: 0,
            networkQuality: {
                effectiveType: '4g',
                latency: 0,
                packetLoss: 0
            },
            gpuInfo: {
                isIntegrated: false,
                vendor: '',
                renderer: ''
            },
            renderingMetrics: {
                frameTime: 0,
                droppedFrames: 0
            },
            thermalMetrics: {
                temperature: 0,
                throttling: false
            },
            batteryInfo: {
                level: 1,
                charging: true
            }
        };
        this.features = {
            basicDrawing: true,
            advancedDrawing: !this.isMobile,
            highResRendering: true,
            realtimeCollaboration: true,
            hardwareAcceleration: true,
            backgroundProcessing: true,
            autoSave: true,
            complexFilters: true
        };
        this.initialize();
    }

    async initialize() {
        await Promise.all([
            this.detectGPU(),
            this.checkBatteryStatus(),
            this.runSpeedTest()
        ]);
        this.startPerformanceMonitoring();
        this.startRenderingMetrics();
        this.updateFeatureAvailability();
    }

    detectMobile() {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }

    getDeviceInfo() {
        return {
            type: this.isMobile ? 'mobile' : 'desktop',
            isTablet: /iPad|Android/i.test(navigator.userAgent),
            platform: navigator.platform,
            vendor: navigator.vendor,
            memory: navigator.deviceMemory,
            cores: navigator.hardwareConcurrency
        };
    }

    async detectGPU() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl');
            if (!gl) {
                this.performanceMetrics.gpuInfo.isIntegrated = true;
                return;
            }
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                this.performanceMetrics.gpuInfo.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                this.performanceMetrics.gpuInfo.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                this.performanceMetrics.gpuInfo.isIntegrated = /Intel|AMD/i.test(this.performanceMetrics.gpuInfo.vendor);
            }
        } catch (error) {
            console.warn('GPU detection failed:', error);
            this.performanceMetrics.gpuInfo.isIntegrated = true;
        }
    }

    async checkBatteryStatus() {
        try {
            const battery = await navigator.getBattery();
            this.performanceMetrics.batteryInfo = {
                level: battery.level,
                charging: battery.charging
            };
            battery.addEventListener('levelchange', () => {
                this.performanceMetrics.batteryInfo.level = battery.level;
                this.updateFeatureAvailability();
            });
        } catch (error) {
            console.warn('Battery status check failed:', error);
        }
    }

    async runSpeedTest() {
        try {
            const start = performance.now();
            const response = await fetch('/ping', { signal: AbortSignal.timeout(5000) });
            const end = performance.now();
            
            this.performanceMetrics.networkQuality.latency = end - start;
            this.performanceMetrics.networkQuality.effectiveType = navigator.connection.effectiveType;
        } catch (error) {
            console.warn('Network speed test failed:', error);
            this.performanceMetrics.networkQuality.packetLoss = 1;
        }
    }

    startPerformanceMonitoring() {
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = () => {
            const now = performance.now();
            frames++;
            
            if (now - lastTime >= 1000) {
                this.performanceMetrics.fps = frames;
                this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
                frames = 0;
                lastTime = now;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }

    startRenderingMetrics() {
        let lastFrameTime = performance.now();
        
        const measureFrameTime = () => {
            const now = performance.now();
            const frameTime = now - lastFrameTime;
            
            this.performanceMetrics.renderingMetrics.frameTime = frameTime;
            if (frameTime > 32) { // More than 2 frames at 60fps
                this.performanceMetrics.renderingMetrics.droppedFrames++;
            }
            
            lastFrameTime = now;
            requestAnimationFrame(measureFrameTime);
        };
        
        requestAnimationFrame(measureFrameTime);
    }

    updateFeatureAvailability() {
        // Update features based on performance metrics
        this.features.highResRendering = this.performanceMetrics.fps >= 30;
        this.features.advancedDrawing = !this.isMobile && this.performanceMetrics.fps >= 30;
        this.features.realtimeCollaboration = this.performanceMetrics.networkQuality.latency < 100;
        this.features.hardwareAcceleration = !this.performanceMetrics.gpuInfo.isIntegrated;
        this.features.backgroundProcessing = this.performanceMetrics.batteryInfo.level > 0.2;
        this.features.autoSave = this.performanceMetrics.batteryInfo.charging;
        this.features.complexFilters = this.performanceMetrics.memoryUsage < 0.8;

        // Update UI
        this.updateUI();
    }

    updateUI() {
        const elements = document.querySelectorAll('[data-feature]');
        elements.forEach(element => {
            const feature = element.getAttribute('data-feature');
            if (this.features[feature]) {
                element.classList.remove('disabled');
            } else {
                element.classList.add('disabled');
            }
        });
    }

    showPerformanceMessage() {
        if (this.performanceMetrics.fps < 30) {
            messaging.showWarning('Low frame rate detected. Some features may be disabled.');
        }
        if (this.performanceMetrics.memoryUsage > 0.8) {
            messaging.showWarning('High memory usage detected. Some features may be disabled.');
        }
        if (this.performanceMetrics.cpuLoad > 0.8) {
            messaging.showWarning('High CPU load detected. Some features may be disabled.');
        }
    }
}

export default FeatureAvailability; 