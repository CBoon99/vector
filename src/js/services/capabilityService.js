class CapabilityService {
    constructor() {
        this.capabilities = {
            device: this.detectDeviceCapabilities(),
            connection: this.detectConnectionCapabilities(),
            screen: this.detectScreenCapabilities()
        };

        // Monitor connection changes
        window.addEventListener('online', () => this.updateConnectionCapabilities());
        window.addEventListener('offline', () => this.updateConnectionCapabilities());
        
        // Monitor screen size changes
        window.addEventListener('resize', () => this.updateScreenCapabilities());
    }

    detectDeviceCapabilities() {
        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
        const isDesktop = !isMobile && !isTablet;

        // Check for hardware acceleration
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const hasHardwareAcceleration = gl && gl.getParameter(gl.MAX_TEXTURE_SIZE) > 4096;

        // Check for WebAssembly support
        const hasWebAssembly = typeof WebAssembly === 'object';

        // Check for Web Workers support
        const hasWebWorkers = typeof Worker !== 'undefined';

        return {
            type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
            hasHardwareAcceleration,
            hasWebAssembly,
            hasWebWorkers,
            isLowEnd: !hasHardwareAcceleration || !hasWebAssembly
        };
    }

    detectConnectionCapabilities() {
        if (!navigator.connection) {
            return {
                type: 'unknown',
                speed: 'unknown',
                isLowBandwidth: false
            };
        }

        const connection = navigator.connection;
        const isLowBandwidth = connection.saveData || 
                              connection.effectiveType === 'slow-2g' || 
                              connection.effectiveType === '2g';

        return {
            type: connection.effectiveType,
            speed: connection.downlink,
            isLowBandwidth
        };
    }

    detectScreenCapabilities() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const pixelRatio = window.devicePixelRatio || 1;

        return {
            width,
            height,
            pixelRatio,
            isSmall: width < 768,
            isMedium: width >= 768 && width < 1024,
            isLarge: width >= 1024
        };
    }

    updateConnectionCapabilities() {
        this.capabilities.connection = this.detectConnectionCapabilities();
        this.notifyCapabilityChange('connection');
    }

    updateScreenCapabilities() {
        this.capabilities.screen = this.detectScreenCapabilities();
        this.notifyCapabilityChange('screen');
    }

    notifyCapabilityChange(type) {
        // Dispatch event for other services to react to capability changes
        window.dispatchEvent(new CustomEvent('capabilityChange', {
            detail: { type, capabilities: this.capabilities[type] }
        }));
    }

    canPerformOperation(operation) {
        const requirements = this.getOperationRequirements(operation);
        return this.meetsRequirements(requirements);
    }

    getOperationRequirements(operation) {
        const requirements = {
            'highQualityVectorization': {
                device: { hasHardwareAcceleration: true, hasWebAssembly: true },
                connection: { isLowBandwidth: false },
                screen: { isSmall: false }
            },
            'realtimePreview': {
                device: { hasHardwareAcceleration: true },
                connection: { isLowBandwidth: false }
            },
            'batchProcessing': {
                device: { hasWebWorkers: true },
                connection: { isLowBandwidth: false }
            },
            'patternRecognition': {
                device: { hasWebAssembly: true },
                connection: { isLowBandwidth: false }
            },
            'stylePreservation': {
                device: { hasHardwareAcceleration: true },
                connection: { isLowBandwidth: false }
            }
        };

        return requirements[operation] || {};
    }

    meetsRequirements(requirements) {
        for (const [capability, required] of Object.entries(requirements)) {
            if (!this.capabilities[capability]) continue;

            for (const [key, value] of Object.entries(required)) {
                if (this.capabilities[capability][key] !== value) {
                    return false;
                }
            }
        }
        return true;
    }

    getOptimizedSettings(operation) {
        const settings = {
            'highQualityVectorization': {
                edgeThreshold: this.capabilities.device.isLowEnd ? 30 : 10,
                minPathLength: this.capabilities.device.isLowEnd ? 10 : 5,
                simplifyTolerance: this.capabilities.device.isLowEnd ? 2 : 0.5,
                colorQuantization: this.capabilities.device.isLowEnd ? 8 : 32
            },
            'realtimePreview': {
                previewQuality: this.capabilities.connection.isLowBandwidth ? 'low' : 'high',
                updateInterval: this.capabilities.connection.isLowBandwidth ? 500 : 100
            },
            'patternRecognition': {
                blockSize: this.capabilities.device.isLowEnd ? 16 : 8,
                patternThreshold: this.capabilities.device.isLowEnd ? 0.8 : 0.6
            }
        };

        return settings[operation] || {};
    }

    getRecommendedFeatures() {
        const features = [];

        if (this.canPerformOperation('highQualityVectorization')) {
            features.push('highQualityVectorization');
        }
        if (this.canPerformOperation('realtimePreview')) {
            features.push('realtimePreview');
        }
        if (this.canPerformOperation('batchProcessing')) {
            features.push('batchProcessing');
        }
        if (this.canPerformOperation('patternRecognition')) {
            features.push('patternRecognition');
        }
        if (this.canPerformOperation('stylePreservation')) {
            features.push('stylePreservation');
        }

        return features;
    }
}

export default new CapabilityService(); 