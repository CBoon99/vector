import NetworkManager from '../network-manager';

describe('NetworkManager', () => {
    let networkManager;
    let mockFetch;

    beforeEach(() => {
        // Mock fetch
        mockFetch = jest.fn();
        global.fetch = mockFetch;

        networkManager = new NetworkManager();
    });

    describe('Error Handling', () => {
        it('should handle invalid request URL', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.request(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid request URL provided');
        });

        it('should handle invalid request options', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.request('url', null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid request options provided');
        });

        it('should handle network errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockFetch.mockRejectedValue(new Error('Network error'));
            networkManager.request('url');
            expect(consoleSpy).toHaveBeenCalledWith('Network error:', expect.any(Error));
        });

        it('should handle timeout errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.request = jest.fn().mockImplementation(() => {
                throw new Error('Timeout error');
            });
            networkManager.request('url');
            expect(consoleSpy).toHaveBeenCalledWith('Request timeout:', expect.any(Error));
        });
    });

    describe('Request Validation', () => {
        it('should handle invalid request method', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.request('url', { method: 'INVALID' });
            expect(consoleSpy).toHaveBeenCalledWith('Invalid request method:', 'INVALID');
        });

        it('should handle invalid request headers', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.request('url', { headers: null });
            expect(consoleSpy).toHaveBeenCalledWith('Invalid request headers provided');
        });

        it('should handle invalid request body', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.request('url', { body: undefined });
            expect(consoleSpy).toHaveBeenCalledWith('Invalid request body provided');
        });
    });

    describe('Response Handling', () => {
        it('should handle invalid response format', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.handleResponse(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid response format');
        });

        it('should handle response parsing errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.handleResponse = jest.fn().mockImplementation(() => {
                throw new Error('Response parsing error');
            });
            networkManager.handleResponse({});
            expect(consoleSpy).toHaveBeenCalledWith('Error parsing response:', expect.any(Error));
        });

        it('should handle error responses', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.handleErrorResponse({ status: 500 });
            expect(consoleSpy).toHaveBeenCalledWith('Server error:', 500);
        });
    });

    describe('Request Retry', () => {
        it('should handle invalid retry config', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.retryRequest(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid retry configuration provided');
        });

        it('should handle retry errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.retryRequest = jest.fn().mockImplementation(() => {
                throw new Error('Retry error');
            });
            networkManager.retryRequest({});
            expect(consoleSpy).toHaveBeenCalledWith('Error during request retry:', expect.any(Error));
        });

        it('should handle max retries exceeded', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            networkManager.maxRetries = 3;
            networkManager.retryCount = 4;
            networkManager.retryRequest({});
            expect(consoleSpy).toHaveBeenCalledWith('Maximum retries exceeded');
        });
    });

    describe('Request Interceptors', () => {
        it('should handle invalid interceptor', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.addInterceptor(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid interceptor provided');
        });

        it('should handle interceptor errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const interceptor = jest.fn().mockImplementation(() => {
                throw new Error('Interceptor error');
            });
            networkManager.addInterceptor(interceptor);
            networkManager.applyInterceptors({});
            expect(consoleSpy).toHaveBeenCalledWith('Error in request interceptor:', expect.any(Error));
        });

        it('should handle interceptor chain errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.applyInterceptors = jest.fn().mockImplementation(() => {
                throw new Error('Interceptor chain error');
            });
            networkManager.applyInterceptors({});
            expect(consoleSpy).toHaveBeenCalledWith('Error in interceptor chain:', expect.any(Error));
        });
    });

    describe('Request Cache', () => {
        it('should handle invalid cache key', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.cacheRequest(null, {});
            expect(consoleSpy).toHaveBeenCalledWith('Invalid cache key provided');
        });

        it('should handle cache errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.cacheRequest = jest.fn().mockImplementation(() => {
                throw new Error('Cache error');
            });
            networkManager.cacheRequest('key', {});
            expect(consoleSpy).toHaveBeenCalledWith('Error caching request:', expect.any(Error));
        });

        it('should handle cache misses', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            networkManager.getCachedRequest('non-existent');
            expect(consoleSpy).toHaveBeenCalledWith('No cached request found for key:', 'non-existent');
        });
    });

    describe('Request Queue', () => {
        it('should handle invalid queue item', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.addToQueue(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid queue item provided');
        });

        it('should handle queue errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.processQueue = jest.fn().mockImplementation(() => {
                throw new Error('Queue error');
            });
            networkManager.processQueue();
            expect(consoleSpy).toHaveBeenCalledWith('Error processing request queue:', expect.any(Error));
        });

        it('should handle queue overflow', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            networkManager.maxQueueSize = 2;
            networkManager.addToQueue({});
            networkManager.addToQueue({});
            networkManager.addToQueue({});
            expect(consoleSpy).toHaveBeenCalledWith('Request queue overflow');
        });
    });

    describe('Request Monitoring', () => {
        it('should handle invalid monitoring config', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.startMonitoring(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid monitoring configuration provided');
        });

        it('should handle monitoring errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.startMonitoring = jest.fn().mockImplementation(() => {
                throw new Error('Monitoring error');
            });
            networkManager.startMonitoring({});
            expect(consoleSpy).toHaveBeenCalledWith('Error starting request monitoring:', expect.any(Error));
        });

        it('should handle monitoring alert errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.sendAlert = jest.fn().mockImplementation(() => {
                throw new Error('Alert error');
            });
            networkManager.sendAlert({});
            expect(consoleSpy).toHaveBeenCalledWith('Error sending monitoring alert:', expect.any(Error));
        });
    });

    describe('Request Analytics', () => {
        it('should handle invalid analytics data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.trackRequest(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid analytics data provided');
        });

        it('should handle analytics errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.trackRequest = jest.fn().mockImplementation(() => {
                throw new Error('Analytics error');
            });
            networkManager.trackRequest({});
            expect(consoleSpy).toHaveBeenCalledWith('Error tracking request:', expect.any(Error));
        });

        it('should handle analytics report generation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            networkManager.generateReport = jest.fn().mockImplementation(() => {
                throw new Error('Report generation error');
            });
            networkManager.generateReport({});
            expect(consoleSpy).toHaveBeenCalledWith('Error generating analytics report:', expect.any(Error));
        });
    });
}); 