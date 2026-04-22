import { FEATURE_AVAILABILITY } from '../constants/features.js';

class DeviceService {
    constructor() {
        this.deviceType = this.detectDevice();
        this.features = this.getFeaturesForDevice();
    }

    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /mobile|android|ios|iphone|ipad|ipod/i.test(userAgent);
        return isMobile ? 'mobile' : 'desktop';
    }

    getFeaturesForDevice() {
        return FEATURE_AVAILABILITY[this.deviceType];
    }

    isFeatureAvailable(featureName) {
        return this.features[featureName] || false;
    }

    getAvailableFeatures() {
        return Object.entries(this.features)
            .filter(([_, isAvailable]) => isAvailable)
            .map(([feature]) => feature);
    }

    getUnavailableFeatures() {
        return Object.entries(this.features)
            .filter(([_, isAvailable]) => !isAvailable)
            .map(([feature]) => feature);
    }

    isDesktop() {
        return this.deviceType === 'desktop';
    }

    isMobile() {
        return this.deviceType === 'mobile';
    }
}

export default new DeviceService(); 