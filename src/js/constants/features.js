export const FEATURE_AVAILABILITY = {
    desktop: {
        advancedDrawing: true,
        layerEffects: true,
        pathOperations: true,
        webglRendering: true,
        realtimeCollaboration: true,
        pluginSystem: true
    },
    mobile: {
        advancedDrawing: false,
        layerEffects: false,
        pathOperations: false,
        webglRendering: false,
        realtimeCollaboration: false,
        pluginSystem: false
    }
};

export const COMPLEXITY_THRESHOLDS = {
    PATH_POINTS: 100,
    POLYGON_SIDES: 8
};

export const MESSAGE_DURATION = 3000; // 3 seconds 