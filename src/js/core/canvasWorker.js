// Web Worker for offloading heavy computations
self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch (type) {
        case 'processLayer':
            processLayer(data);
            break;
        case 'optimizeMemory':
            optimizeMemory(data);
            break;
        case 'predictTouch':
            predictTouch(data);
            break;
        default:
            console.warn('Unknown message type:', type);
    }
};

// Cache for processed data
const processedDataCache = new Map();
const MAX_CACHE_SIZE = 50;

function processLayer(data) {
    const { layerId, imageData, width, height, operations } = data;
    
    // Check cache first
    const cacheKey = `${layerId}-${operations.map(op => op.type).join('-')}`;
    if (processedDataCache.has(cacheKey)) {
        self.postMessage({
            type: 'layerProcessed',
            data: {
                layerId,
                processedData: processedDataCache.get(cacheKey)
            }
        });
        return;
    }
    
    // Create TypedArray for better performance
    const processedData = new Uint8ClampedArray(imageData);
    
    // Apply operations with optimized loops
    for (const op of operations) {
        switch (op.type) {
            case 'blur':
                applyBlurOptimized(processedData, width, height, op.radius);
                break;
            case 'sharpen':
                applySharpenOptimized(processedData, width, height, op.amount);
                break;
            case 'adjust':
                adjustImageOptimized(processedData, op.brightness, op.contrast, op.saturation);
                break;
        }
    }
    
    // Cache the result
    if (processedDataCache.size >= MAX_CACHE_SIZE) {
        const firstKey = processedDataCache.keys().next().value;
        processedDataCache.delete(firstKey);
    }
    processedDataCache.set(cacheKey, processedData);
    
    self.postMessage({
        type: 'layerProcessed',
        data: {
            layerId,
            processedData
        }
    });
}

function optimizeMemory(data) {
    const { layers, maxSize, visibleLayers, layerStates } = data;
    const optimizedLayers = new Map();
    let currentSize = 0;
    
    // Sort layers by last access time and visibility
    const sortedLayers = Array.from(layers.entries())
        .sort((a, b) => {
            const aVisible = visibleLayers.includes(a[0]);
            const bVisible = visibleLayers.includes(b[0]);
            if (aVisible !== bVisible) return bVisible - aVisible;
            return a[1].lastAccess - b[1].lastAccess;
        });
    
    // Keep most recently used and visible layers
    for (const [layerId, layer] of sortedLayers) {
        const layerSize = layer.width * layer.height * 4;
        
        if (currentSize + layerSize <= maxSize) {
            optimizedLayers.set(layerId, layer);
            currentSize += layerSize;
        } else {
            self.postMessage({
                type: 'releaseLayer',
                data: { layerId }
            });
        }
    }
    
    self.postMessage({
        type: 'memoryOptimized',
        data: {
            optimizedLayers,
            currentSize
        }
    });
}

function predictTouch(data) {
    const { positions, timestamps, velocities, accelerations } = data;
    
    // Calculate prediction using Kalman filter
    const prediction = calculateKalmanPrediction(positions, timestamps, velocities, accelerations);
    
    // Calculate confidence based on movement stability
    const confidence = calculatePredictionConfidence(positions, velocities, accelerations);
    
    self.postMessage({
        type: 'touchPredicted',
        data: {
            prediction,
            confidence
        }
    });
}

function calculateKalmanPrediction(positions, timestamps, velocities, accelerations) {
    // Kalman filter parameters
    const Q = 0.1; // Process noise
    const R = 0.1; // Measurement noise
    
    // Initialize state
    let x = positions[positions.length - 1].x;
    let y = positions[positions.length - 1].y;
    let vx = velocities[velocities.length - 1].x;
    let vy = velocities[velocities.length - 1].y;
    let ax = accelerations[accelerations.length - 1].x;
    let ay = accelerations[accelerations.length - 1].y;
    
    // State covariance
    let P = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
    ];
    
    // Predict next state
    const dt = 16.67 / 1000; // Assume 60fps
    
    // State transition matrix
    const F = [
        [1, dt, 0.5 * dt * dt],
        [0, 1, dt],
        [0, 0, 1]
    ];
    
    // Predict position
    const predictedX = x + vx * dt + 0.5 * ax * dt * dt;
    const predictedY = y + vy * dt + 0.5 * ay * dt * dt;
    
    // Update covariance
    P = multiplyMatrix(F, multiplyMatrix(P, transposeMatrix(F)));
    P[0][0] += Q;
    P[1][1] += Q;
    P[2][2] += Q;
    
    return {
        x: predictedX,
        y: predictedY
    };
}

function calculatePredictionConfidence(positions, velocities, accelerations) {
    if (positions.length < 2) return 0;
    
    // Calculate velocity stability
    const velocityStability = calculateStability(velocities);
    
    // Calculate acceleration stability
    const accelerationStability = calculateStability(accelerations);
    
    // Calculate position consistency
    const positionConsistency = calculatePositionConsistency(positions);
    
    // Combine metrics
    return (velocityStability * 0.4 + accelerationStability * 0.3 + positionConsistency * 0.3);
}

function calculateStability(values) {
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

function calculatePositionConsistency(positions) {
    if (positions.length < 2) return 0;
    
    let totalDistance = 0;
    let maxDistance = 0;
    
    for (let i = 1; i < positions.length; i++) {
        const dx = positions[i].x - positions[i-1].x;
        const dy = positions[i].y - positions[i-1].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        totalDistance += distance;
        maxDistance = Math.max(maxDistance, distance);
    }
    
    const averageDistance = totalDistance / (positions.length - 1);
    return 1 / (1 + Math.abs(averageDistance - maxDistance));
}

function multiplyMatrix(a, b) {
    const result = [];
    for (let i = 0; i < a.length; i++) {
        result[i] = [];
        for (let j = 0; j < b[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < a[0].length; k++) {
                sum += a[i][k] * b[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

function transposeMatrix(matrix) {
    return matrix[0].map((_, i) => matrix.map(row => row[i]));
}

// Optimized blur function using SIMD-like operations
function applyBlurOptimized(data, width, height, radius) {
    const kernel = createGaussianKernel(radius);
    const temp = new Uint8ClampedArray(data);
    const kernelSize = 2 * radius + 1;
    const kernelSum = kernel.reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0), 0);
    
    // Process pixels in chunks for better performance
    const chunkSize = 1024;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x += chunkSize) {
            const endX = Math.min(x + chunkSize, width);
            for (let px = x; px < endX; px++) {
                let r = 0, g = 0, b = 0, a = 0;
                
                for (let ky = -radius; ky <= radius; ky++) {
                    const py = Math.min(Math.max(y + ky, 0), height - 1);
                    const rowOffset = py * width;
                    
                    for (let kx = -radius; kx <= radius; kx++) {
                        const px2 = Math.min(Math.max(px + kx, 0), width - 1);
                        const idx = (rowOffset + px2) * 4;
                        const k = kernel[ky + radius][kx + radius];
                        
                        r += temp[idx] * k;
                        g += temp[idx + 1] * k;
                        b += temp[idx + 2] * k;
                        a += temp[idx + 3] * k;
                    }
                }
                
                const outIdx = (y * width + px) * 4;
                data[outIdx] = r / kernelSum;
                data[outIdx + 1] = g / kernelSum;
                data[outIdx + 2] = b / kernelSum;
                data[outIdx + 3] = a / kernelSum;
            }
        }
    }
}

function createGaussianKernel(radius) {
    const kernel = [];
    const sigma = radius / 3;
    let sum = 0;
    
    for (let y = -radius; y <= radius; y++) {
        kernel[y + radius] = [];
        for (let x = -radius; x <= radius; x++) {
            const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
            kernel[y + radius][x + radius] = value;
            sum += value;
        }
    }
    
    // Normalize
    for (let y = 0; y <= 2 * radius; y++) {
        for (let x = 0; x <= 2 * radius; x++) {
            kernel[y][x] /= sum;
        }
    }
    
    return kernel;
}

// Optimized sharpen function
function applySharpenOptimized(data, width, height, amount) {
    const kernel = [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ];
    const temp = new Uint8ClampedArray(data);
    
    // Process pixels in chunks
    const chunkSize = 1024;
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x += chunkSize) {
            const endX = Math.min(x + chunkSize, width - 1);
            for (let px = x; px < endX; px++) {
                let r = 0, g = 0, b = 0, a = 0;
                
                for (let ky = -1; ky <= 1; ky++) {
                    const py = y + ky;
                    const rowOffset = py * width;
                    
                    for (let kx = -1; kx <= 1; kx++) {
                        const px2 = px + kx;
                        const idx = (rowOffset + px2) * 4;
                        const k = kernel[ky + 1][kx + 1] * amount;
                        
                        r += temp[idx] * k;
                        g += temp[idx + 1] * k;
                        b += temp[idx + 2] * k;
                        a += temp[idx + 3] * k;
                    }
                }
                
                const outIdx = (y * width + px) * 4;
                data[outIdx] = Math.min(Math.max(r, 0), 255);
                data[outIdx + 1] = Math.min(Math.max(g, 0), 255);
                data[outIdx + 2] = Math.min(Math.max(b, 0), 255);
                data[outIdx + 3] = Math.min(Math.max(a, 0), 255);
            }
        }
    }
}

// Optimized image adjustment function
function adjustImageOptimized(data, brightness, contrast, saturation) {
    // Pre-calculate factors for better performance
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const brightnessFactor = brightness;
    const saturationFactor = saturation;
    
    // Process pixels in chunks
    const chunkSize = 1024;
    for (let i = 0; i < data.length; i += chunkSize * 4) {
        const end = Math.min(i + chunkSize * 4, data.length);
        for (let j = i; j < end; j += 4) {
            // Brightness
            data[j] *= brightnessFactor;
            data[j + 1] *= brightnessFactor;
            data[j + 2] *= brightnessFactor;
            
            // Contrast
            data[j] = contrastFactor * (data[j] - 128) + 128;
            data[j + 1] = contrastFactor * (data[j + 1] - 128) + 128;
            data[j + 2] = contrastFactor * (data[j + 2] - 128) + 128;
            
            // Saturation
            const gray = 0.2989 * data[j] + 0.5870 * data[j + 1] + 0.1140 * data[j + 2];
            data[j] = gray + (data[j] - gray) * saturationFactor;
            data[j + 1] = gray + (data[j + 1] - gray) * saturationFactor;
            data[j + 2] = gray + (data[j + 2] - gray) * saturationFactor;
            
            // Clamp values
            data[j] = Math.min(Math.max(data[j], 0), 255);
            data[j + 1] = Math.min(Math.max(data[j + 1], 0), 255);
            data[j + 2] = Math.min(Math.max(data[j + 2], 0), 255);
        }
    }
} 