/**
 * EnvironmentManager
 * Centralized logic to detect device and connection capability
 * Provides feature flags based on device performance and connection quality
 */

// Create a proxy to make flags readonly
const createReadOnlyFlags = (flags) => {
  return new Proxy(flags, {
    set: () => {
      console.warn('[EnvironmentManager] Attempted to modify readonly flags');
      return true;
    }
  });
};

// Generate a unique session ID
const generateSessionId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const EnvironmentManager = {
  version: 'v1.1',
  sessionId: generateSessionId(),
  isLowPower: false,
  isSlowConnection: false,
  isMobile: false,
  isForceFullMode: false,
  flags: createReadOnlyFlags({
    disableAutoPlay: false,
    disableRealTime: false,
    disableExport: false,
    disableSVG: false,
    disable3D: false,
    disableAudioFX: false,
    disableHeavyFilters: false,
    disableLiveCollab: false,
    disableAnimations: false,
    disableVectorTools: false,
    disableCanvasExport: false,
    disableUndoHistory: false,
    disableGPUAcceleration: false,
    disableAutoSave: false
  }),

  /**
   * Initialize the environment manager
   * Detects device capabilities and sets appropriate feature flags
   */
  init() {
    // Check for force full mode override
    this.isForceFullMode = localStorage.getItem('env:forceFullMode') === 'true';
    
    if (this.isForceFullMode) {
      console.warn('[EnvironmentManager] Force full mode enabled - bypassing performance detection');
      return;
    }

    // Get connection info if available
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const ua = navigator.userAgent;
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;

    // Detect mobile devices
    this.isMobile = /Android|iPhone|iPad/i.test(ua);
    
    // Detect slow connections
    this.isSlowConnection = conn?.effectiveType && /2g|3g|slow-2g/.test(conn.effectiveType);
    
    // Detect low-spec devices
    const lowSpecs = memory <= 2 || cores <= 2;

    // Set low power mode based on any limiting factor
    this.isLowPower = this.isMobile || this.isSlowConnection || lowSpecs;

    // Check GPU support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const gpuUnsupported = !gl || !gl.getExtension('OES_texture_float');

    // Set feature flags based on device capabilities
    const newFlags = {
      disableAutoPlay: this.isLowPower,
      disableRealTime: this.isLowPower,
      disableExport: this.isLowPower && this.isSlowConnection,
      disableSVG: memory <= 2,
      disable3D: this.isLowPower || memory <= 4,
      disableAudioFX: this.isLowPower || this.isMobile,
      disableHeavyFilters: this.isLowPower || cores <= 2,
      disableLiveCollab: this.isSlowConnection,
      disableAnimations: this.isLowPower || this.isMobile,
      disableVectorTools: this.isLowPower || memory <= 2,
      disableCanvasExport: this.isSlowConnection || memory <= 2,
      disableUndoHistory: this.isLowPower || memory <= 2,
      disableGPUAcceleration: gpuUnsupported || this.isLowPower,
      disableAutoSave: this.isMobile || this.isLowPower
    };

    // Update flags through the proxy
    Object.assign(this.flags, newFlags);

    // Add low-perf class to body if needed
    if (this.isLowPower) {
      document.body.classList.add('low-perf');
    }

    // Log initialization details
    console.log('[EnvironmentManager] Initialized', {
      version: this.version,
      sessionId: this.sessionId,
      isMobile: this.isMobile,
      isSlowConnection: this.isSlowConnection,
      memory,
      cores,
      flags: this.flags
    });

    // Store device info in localStorage for diagnostics
    this.saveEnvironmentInfo();

    // Expose state globally for tools
    this.exportState();
  },

  /**
   * Save environment information to localStorage
   */
  saveEnvironmentInfo() {
    try {
      const info = {
        version: this.version,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        isMobile: this.isMobile,
        isSlowConnection: this.isSlowConnection,
        memory: navigator.deviceMemory,
        cores: navigator.hardwareConcurrency,
        userAgent: navigator.userAgent,
        connection: navigator.connection?.effectiveType,
        flags: this.flags,
        isForceFullMode: this.isForceFullMode
      };
      
      localStorage.setItem('dopple_device_info', JSON.stringify(info));
      
      // Log to analytics
      this.logAnalytics('environment_detection', info);
    } catch (e) {
      console.warn('[EnvironmentManager] Could not store device info:', e);
    }
  },

  /**
   * Log analytics event
   * @param {string} eventName - Name of the event
   * @param {Object} data - Event data
   */
  logAnalytics(eventName, data) {
    const analytics = {
      version: this.version,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      event: eventName,
      data: data
    };
    
    // Get existing analytics
    let analyticsLog = [];
    try {
      const stored = localStorage.getItem('dopple_analytics');
      if (stored) {
        analyticsLog = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[EnvironmentManager] Could not read analytics log:', e);
    }
    
    // Add new event
    analyticsLog.push(analytics);
    
    // Keep only last 100 events
    if (analyticsLog.length > 100) {
      analyticsLog = analyticsLog.slice(-100);
    }
    
    // Store updated log
    try {
      localStorage.setItem('dopple_analytics', JSON.stringify(analyticsLog));
    } catch (e) {
      console.warn('[EnvironmentManager] Could not store analytics log:', e);
    }
  },

  /**
   * Export analytics data
   * @returns {string} JSON string of analytics data
   */
  exportAnalytics() {
    try {
      const analytics = localStorage.getItem('dopple_analytics');
      const deviceInfo = localStorage.getItem('dopple_device_info');
      return JSON.stringify({
        version: this.version,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        analytics: JSON.parse(analytics || '[]'),
        deviceInfo: JSON.parse(deviceInfo || '{}')
      }, null, 2);
    } catch (e) {
      console.warn('[EnvironmentManager] Could not export analytics:', e);
      return null;
    }
  },

  /**
   * Toggle force full mode
   * @param {boolean} enabled - Whether to enable force full mode
   * @param {boolean} permanent - Whether to make this setting permanent
   */
  toggleForceFullMode(enabled, permanent = false) {
    this.isForceFullMode = enabled;
    localStorage.setItem('env:forceFullMode', enabled.toString());
    
    if (permanent) {
      localStorage.setItem('env:forceFullModePermanent', 'true');
    }
    
    if (enabled) {
      // Reset all flags to false
      Object.keys(this.flags).forEach(key => {
        this.flags[key] = false;
      });
      document.body.classList.remove('low-perf');
    } else {
      // Reinitialize to detect environment
      this.init();
    }
    
    this.logAnalytics('force_full_mode_toggle', { enabled, permanent });
  },

  /**
   * Check if a specific feature should be enabled
   * @param {string} featureName - Name of the feature to check
   * @returns {boolean} - Whether the feature should be enabled
   */
  canUse(featureName) {
    if (this.isForceFullMode) return true;
    return !this.flags[`disable${featureName}`];
  },

  /**
   * Check if we should warn the user about performance limitations
   * @returns {boolean} - Whether to show a warning
   */
  shouldWarnUser() {
    if (this.isForceFullMode) return false;
    if (localStorage.getItem('env:hideBanner') === 'true') return false;
    if (localStorage.getItem('env:showPerfBanner') !== 'true') {
      return false;
    }
    const mem = navigator.deviceMemory;
    const cores = navigator.hardwareConcurrency || 4;
    const veryTight = mem != null && mem <= 2 && cores <= 2;
    return veryTight && (this.isSlowConnection || this.isLowPower);
  },

  /**
   * Get a human-readable reason why a feature is disabled
   * @param {string} featureName - Name of the feature to check
   * @returns {string|null} - Reason for disabling, or null if enabled
   */
  getFeatureDisabledReason(featureName) {
    if (this.canUse(featureName)) {
      return null;
    }

    const reasons = [];
    if (this.isMobile) reasons.push('mobile device');
    if (this.isSlowConnection) reasons.push('slow connection');
    if (navigator.deviceMemory <= 2) reasons.push('low memory');
    if (navigator.hardwareConcurrency <= 2) reasons.push('limited CPU');

    return `Feature disabled due to: ${reasons.join(', ')}`;
  },

  /**
   * Get system information for display
   * @returns {Object} System information
   */
  getSystemInfo() {
    return {
      memory: `${navigator.deviceMemory || 'Unknown'} GB`,
      cores: navigator.hardwareConcurrency || 'Unknown',
      connection: navigator.connection?.effectiveType || 'Unknown',
      isMobile: this.isMobile,
      isForceFullMode: this.isForceFullMode
    };
  },

  /**
   * Get all disabled features and their reasons
   * @returns {Array} Array of disabled features with reasons
   */
  getDisabledFeatures() {
    return Object.keys(this.flags)
      .filter(key => this.flags[key])
      .map(key => ({
        feature: key.replace('disable', ''),
        reason: this.getFeatureDisabledReason(key.replace('disable', ''))
      }));
  },

  /**
   * Export current state for global access
   * @returns {Object} Current environment state
   */
  exportState() {
    const state = {
      version: this.version,
      sessionId: this.sessionId,
      isLowPower: this.isLowPower,
      isSlowConnection: this.isSlowConnection,
      isMobile: this.isMobile,
      isForceFullMode: this.isForceFullMode,
      flags: this.flags,
      systemInfo: this.getSystemInfo()
    };

    // Expose state globally
    window.__env__ = state;
    return state;
  }
}; 