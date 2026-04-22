import { jest } from '@jest/globals';
import FeatureAvailability from './feature-availability.js';

describe('FeatureAvailability', () => {
    let featureAvailability;
    let mockNavigator;
    let mockPerformance;
    let mockDocument;
    let mockMessaging;

    beforeEach(() => {
        // Mock navigator
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

        // Mock performance
        mockPerformance = {
            now: jest.fn().mockReturnValue(1000),
            memory: {
                usedJSHeapSize: 1000000,
                jsHeapSizeLimit: 2000000
            }
        };

        // Mock document
        mockDocument = {
            querySelectorAll: jest.fn().mockReturnValue([
                { classList: { add: jest.fn(), remove: jest.fn() }, addEventListener: jest.fn() }
            ])
        };

        // Mock messaging
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

        // Create instance
        featureAvailability = new FeatureAvailability();
    });

    describe('Device Detection', () => {
        test('should detect desktop device', () => {
            expect(featureAvailability.isMobile).toBe(false);
            expect(featureAvailability.deviceInfo.type).toBe('desktop');
        });

        test('should detect mobile device', () => {
            mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
            featureAvailability = new FeatureAvailability();
            expect(featureAvailability.isMobile).toBe(true);
            expect(featureAvailability.deviceInfo.type).toBe('ios');
        });

        test('should detect tablet device', () => {
            mockNavigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
            featureAvailability = new FeatureAvailability();
            expect(featureAvailability.deviceInfo.isTablet).toBe(true);
        });
    });

    describe('Performance Monitoring', () => {
        test('should track FPS', () => {
            // Simulate frame timing
            for (let i = 0; i < 60; i++) {
                mockPerformance.now.mockReturnValue(1000 + i * 16.67);
                featureAvailability.startPerformanceMonitoring();
            }
            expect(featureAvailability.performanceMetrics.fps).toBeGreaterThan(0);
        });

        test('should detect low performance', () => {
            mockPerformance.memory.usedJSHeapSize = 1900000;
            featureAvailability.startPerformanceMonitoring();
            expect(featureAvailability.performanceMetrics.memoryUsage).toBeGreaterThan(0.8);
        });

        test('should track CPU load', () => {
            featureAvailability.startPerformanceMonitoring();
            expect(featureAvailability.performanceMetrics.cpuLoad).toBeDefined();
        });
    });

    describe('Network Testing', () => {
        beforeEach(() => {
            global.fetch = jest.fn().mockImplementation((url) => {
                return Promise.resolve({
                    headers: new Headers({
                        'server-timing': 'tcp-rtt=50'
                    })
                });
            });
        });

        test('should measure connection speed', async () => {
            await featureAvailability.runSpeedTest();
            expect(featureAvailability.performanceMetrics.networkQuality).toBeDefined();
            expect(featureAvailability.performanceMetrics.networkQuality.latency).toBeGreaterThan(0);
        });

        test('should handle network errors', async () => {
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
            await featureAvailability.runSpeedTest();
            expect(featureAvailability.performanceMetrics.networkQuality.packetLoss).toBeGreaterThan(0);
        });
    });

    describe('Feature Management', () => {
        test('should enable basic features', () => {
            expect(featureAvailability.features.basicDrawing).toBe(true);
            expect(featureAvailability.features.basicLayers).toBe(true);
            expect(featureAvailability.features.basicExport).toBe(true);
        });

        test('should disable advanced features on mobile', () => {
            mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
            featureAvailability = new FeatureAvailability();
            expect(featureAvailability.features.advancedDrawing).toBe(false);
            expect(featureAvailability.features.realtimeCollaboration).toBe(false);
        });

        test('should adjust features based on performance', () => {
            mockPerformance.memory.usedJSHeapSize = 1900000;
            featureAvailability.updateFeatureAvailability();
            expect(featureAvailability.features.highResRendering).toBe(false);
        });
    });

    describe('Battery Management', () => {
        test('should handle battery status', async () => {
            await featureAvailability.checkBatteryStatus();
            expect(featureAvailability.performanceMetrics.batteryInfo).toBeDefined();
            expect(featureAvailability.performanceMetrics.batteryInfo.level).toBe(0.8);
        });

        test('should adjust features for low battery', async () => {
            mockNavigator.getBattery = jest.fn().mockResolvedValue({
                level: 0.1,
                charging: false,
                addEventListener: jest.fn()
            });
            await featureAvailability.checkBatteryStatus();
            featureAvailability.updateFeatureAvailability();
            expect(featureAvailability.features.backgroundProcessing).toBe(false);
        });
    });

    describe('GPU Detection', () => {
        test('should detect GPU capabilities', async () => {
            await featureAvailability.detectGPU();
            expect(featureAvailability.performanceMetrics.gpuInfo).toBeDefined();
        });

        test('should adjust features based on GPU', async () => {
            await featureAvailability.detectGPU();
            featureAvailability.updateFeatureAvailability();
            expect(featureAvailability.features.hardwareAcceleration).toBeDefined();
        });
    });

    describe('Storage Management', () => {
        test('should detect storage capabilities', async () => {
            const storageInfo = await featureAvailability.getStorageInfo();
            expect(storageInfo).toBeDefined();
            expect(storageInfo.quota).toBe(1000000000);
        });
    });

    describe('Rendering Metrics', () => {
        test('should track frame times', () => {
            featureAvailability.startRenderingMetrics();
            expect(featureAvailability.performanceMetrics.renderingMetrics.frameTime).toBeDefined();
        });

        test('should detect dropped frames', () => {
            mockPerformance.now = jest.fn()
                .mockReturnValueOnce(1000)
                .mockReturnValueOnce(1100); // Simulate dropped frame
            featureAvailability.startRenderingMetrics();
            expect(featureAvailability.performanceMetrics.renderingMetrics.droppedFrames).toBeGreaterThan(0);
        });
    });

    describe('Thermal Management', () => {
        test('should handle thermal events', () => {
            if ('thermal' in navigator) {
                const thermalEvent = new Event('thermalchange');
                thermalEvent.temperature = 80;
                thermalEvent.throttling = true;
                navigator.thermal.dispatchEvent(thermalEvent);
                expect(featureAvailability.performanceMetrics.thermalMetrics.throttling).toBe(true);
            }
        });
    });

    describe('Error Handling', () => {
        test('should handle GPU detection failure', async () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            mockNavigator.getBattery = jest.fn().mockRejectedValue(new Error('GPU detection failed'));
            await featureAvailability.detectGPU();
            expect(consoleSpy).toHaveBeenCalled();
        });

        test('should handle battery status failure', async () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            mockNavigator.getBattery = jest.fn().mockRejectedValue(new Error('Battery status failed'));
            await featureAvailability.checkBatteryStatus();
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('UI Updates', () => {
        test('should update UI elements', () => {
            featureAvailability.updateFeatureAvailability();
            expect(mockDocument.querySelectorAll).toHaveBeenCalled();
        });

        test('should show appropriate messages', () => {
            featureAvailability.showPerformanceMessage();
            expect(mockMessaging.showWarning).toHaveBeenCalled();
        });
    });
}); 