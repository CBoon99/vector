import { jest } from '@jest/globals';
import FeatureAvailability from './feature-availability.js';

describe('FeatureAvailability Integration', () => {
    let featureAvailability;
    let mockNavigator;
    let mockPerformance;
    let mockDocument;
    let mockMessaging;
    let mockCanvas;
    let mockWebGLContext;

    beforeEach(() => {
        // Enhanced WebGL mock
        mockWebGLContext = {
            getParameter: jest.fn().mockImplementation((param) => {
                switch (param) {
                    case 0x1F00: return 'WebKit';
                    case 0x1F01: return 'WebKit WebGL';
                    case 0x1F02: return 'WebGL 1.0';
                    case 0x8B8C: return 'WebGL GLSL ES 1.0';
                    default: return null;
                }
            }),
            getExtension: jest.fn().mockReturnValue({
                UNMASKED_VENDOR_WEBGL: 0x1F00,
                UNMASKED_RENDERER_WEBGL: 0x1F01
            })
        };

        // Enhanced canvas mock
        mockCanvas = {
            getContext: jest.fn().mockReturnValue(mockWebGLContext),
            getBoundingClientRect: jest.fn().mockReturnValue({
                left: 0,
                top: 0,
                width: 800,
                height: 600
            })
        };

        // Enhanced navigator mock
        mockNavigator = {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            platform: 'MacIntel',
            vendor: 'Apple Computer, Inc.',
            deviceMemory: 8,
            hardwareConcurrency: 8,
            maxTouchPoints: 0,
            vibrate: jest.fn(),
            connection: {
                type: 'wifi',
                effectiveType: '4g',
                downlink: 10,
                addEventListener: jest.fn()
            },
            getBattery: jest.fn().mockResolvedValue({
                level: 0.8,
                charging: true,
                chargingTime: 0,
                dischargingTime: Infinity,
                addEventListener: jest.fn()
            }),
            storage: {
                estimate: jest.fn().mockResolvedValue({
                    quota: 1000000000,
                    usage: 100000000,
                    usageDetails: {}
                })
            }
        };

        // Enhanced performance mock
        mockPerformance = {
            now: jest.fn().mockReturnValue(1000),
            memory: {
                usedJSHeapSize: 1000000,
                jsHeapSizeLimit: 2000000
            }
        };

        // Enhanced document mock
        mockDocument = {
            createElement: jest.fn().mockReturnValue(mockCanvas),
            querySelectorAll: jest.fn().mockReturnValue([
                { 
                    classList: { add: jest.fn(), remove: jest.fn() }, 
                    addEventListener: jest.fn(),
                    getAttribute: jest.fn().mockReturnValue('basicDrawing')
                }
            ])
        };

        // Enhanced messaging mock
        mockMessaging = {
            showInfo: jest.fn(),
            showWarning: jest.fn(),
            showSuccess: jest.fn(),
            showFeatureTooltip: jest.fn(),
            showUpgradeMessage: jest.fn()
        };

        // Setup global mocks
        global.navigator = mockNavigator;
        global.performance = mockPerformance;
        global.document = mockDocument;
        global.messaging = mockMessaging;
        global.fetch = jest.fn().mockImplementation((url) => {
            return Promise.resolve({
                headers: new Headers({
                    'server-timing': 'tcp-rtt=50',
                    'content-length': '1024'
                })
            });
        });

        // Create instance
        featureAvailability = new FeatureAvailability();
    });

    describe('System Integration', () => {
        test('should initialize all components correctly', async () => {
            expect(featureAvailability.isMobile).toBeDefined();
            expect(featureAvailability.deviceInfo).toBeDefined();
            expect(featureAvailability.performanceMetrics).toBeDefined();
            expect(featureAvailability.features).toBeDefined();
        });

        test('should handle device changes and update features', async () => {
            // Simulate device change
            mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
            featureAvailability = new FeatureAvailability();
            
            // Verify feature updates
            expect(featureAvailability.isMobile).toBe(true);
            expect(featureAvailability.features.advancedDrawing).toBe(false);
        });

        test('should handle performance degradation', async () => {
            // Simulate performance degradation
            mockPerformance.memory.usedJSHeapSize = 1900000;
            featureAvailability.startPerformanceMonitoring();
            
            // Verify feature adjustments
            expect(featureAvailability.performanceMetrics.memoryUsage).toBeGreaterThan(0.8);
            expect(featureAvailability.features.highResRendering).toBe(false);
        });
    });

    describe('Network Integration', () => {
        test('should handle network changes and update features', async () => {
            // Simulate network change
            mockNavigator.connection.effectiveType = '3g';
            mockNavigator.connection.dispatchEvent(new Event('change'));
            
            // Verify feature updates
            expect(featureAvailability.performanceMetrics.networkQuality.effectiveType).toBe('3g');
            expect(featureAvailability.features.realtimeCollaboration).toBe(false);
        });

        test('should handle network errors gracefully', async () => {
            // Simulate network error
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
            await featureAvailability.runSpeedTest();
            
            // Verify error handling
            expect(featureAvailability.performanceMetrics.networkQuality.packetLoss).toBeGreaterThan(0);
        });
    });

    describe('Hardware Integration', () => {
        test('should handle GPU changes', async () => {
            // Simulate GPU change
            mockWebGLContext.getParameter.mockImplementation((param) => {
                if (param === 0x1F01) return 'Intel HD Graphics';
                return null;
            });
            
            await featureAvailability.detectGPU();
            featureAvailability.updateFeatureAvailability();
            
            // Verify feature updates
            expect(featureAvailability.performanceMetrics.gpuInfo.isIntegrated).toBe(true);
            expect(featureAvailability.features.hardwareAcceleration).toBe(false);
        });

        test('should handle battery changes', async () => {
            // Simulate battery change
            mockNavigator.getBattery = jest.fn().mockResolvedValue({
                level: 0.1,
                charging: false,
                addEventListener: jest.fn()
            });
            
            await featureAvailability.checkBatteryStatus();
            featureAvailability.updateFeatureAvailability();
            
            // Verify feature updates
            expect(featureAvailability.features.backgroundProcessing).toBe(false);
            expect(featureAvailability.features.autoSave).toBe(false);
        });
    });

    describe('UI Integration', () => {
        test('should update UI elements correctly', () => {
            // Simulate feature change
            featureAvailability.features.basicDrawing = false;
            featureAvailability.updateFeatureAvailability();
            
            // Verify UI updates
            expect(mockDocument.querySelectorAll).toHaveBeenCalled();
            expect(mockMessaging.showWarning).toHaveBeenCalled();
        });

        test('should show appropriate messages for different conditions', () => {
            // Simulate various conditions
            featureAvailability.performanceMetrics.fps = 20;
            featureAvailability.performanceMetrics.memoryUsage = 0.9;
            featureAvailability.performanceMetrics.cpuLoad = 0.9;
            
            featureAvailability.showPerformanceMessage();
            
            // Verify message display
            expect(mockMessaging.showWarning).toHaveBeenCalledWith(
                expect.stringContaining('Low frame rate')
            );
        });
    });

    describe('Error Recovery', () => {
        test('should recover from GPU detection failure', async () => {
            // Simulate GPU detection failure
            mockCanvas.getContext.mockReturnValue(null);
            
            await featureAvailability.detectGPU();
            featureAvailability.updateFeatureAvailability();
            
            // Verify system remains functional
            expect(featureAvailability.features.basicDrawing).toBe(true);
            expect(featureAvailability.features.advancedDrawing).toBe(false);
        });

        test('should recover from network test failure', async () => {
            // Simulate network test failure
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
            
            await featureAvailability.runSpeedTest();
            featureAvailability.updateFeatureAvailability();
            
            // Verify system remains functional
            expect(featureAvailability.features.basicDrawing).toBe(true);
            expect(featureAvailability.features.realtimeCollaboration).toBe(false);
        });
    });

    describe('Performance Monitoring Integration', () => {
        test('should track and respond to performance changes', () => {
            // Simulate performance changes
            let frameCount = 0;
            const simulateFrame = () => {
                mockPerformance.now.mockReturnValue(1000 + frameCount * 16.67);
                frameCount++;
                if (frameCount < 60) {
                    requestAnimationFrame(simulateFrame);
                }
            };
            
            requestAnimationFrame(simulateFrame);
            
            // Verify performance tracking
            expect(featureAvailability.performanceMetrics.fps).toBeGreaterThan(0);
            expect(featureAvailability.performanceMetrics.renderingMetrics.frameTime).toBeDefined();
        });

        test('should handle thermal throttling', () => {
            // Simulate thermal throttling
            if ('thermal' in navigator) {
                const thermalEvent = new Event('thermalchange');
                thermalEvent.temperature = 90;
                thermalEvent.throttling = true;
                navigator.thermal.dispatchEvent(thermalEvent);
                
                // Verify feature adjustments
                expect(featureAvailability.features.complexFilters).toBe(false);
                expect(featureAvailability.features.backgroundProcessing).toBe(false);
            }
        });
    });
}); 