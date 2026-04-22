class BaseError extends Error {
    constructor(message, context = '') {
        super(message);
        this.name = this.constructor.name;
        this.context = context;
        this.timestamp = new Date();
        Error.captureStackTrace(this, this.constructor);
    }
}

class FileError extends BaseError {
    constructor(message, context = '') {
        super(message, context);
        this.type = 'FILE_ERROR';
    }
}

class ValidationError extends BaseError {
    constructor(message, context = '') {
        super(message, context);
        this.type = 'VALIDATION_ERROR';
    }
}

class DrawingError extends BaseError {
    constructor(message, context = '') {
        super(message, context);
        this.type = 'DRAWING_ERROR';
    }
}

class StateError extends BaseError {
    constructor(message, context = '') {
        super(message, context);
        this.type = 'STATE_ERROR';
    }
}

class ErrorHandler {
    static errorTypes = {
        FILE_ERROR: 'File Operation Error',
        VALIDATION_ERROR: 'Validation Error',
        DRAWING_ERROR: 'Drawing Operation Error',
        STATE_ERROR: 'State Management Error'
    };

    static errorLog = [];
    static maxLogSize = 100;

    static handle(error, context = '') {
        // Add error to log
        this.logError(error, context);

        // Get user-friendly message
        const message = this.getUserFriendlyMessage(error);

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error(`[${error.name}] ${message}`, {
                context,
                stack: error.stack
            });
        }

        // Show error to user
        this.showErrorToUser(message);

        return message;
    }

    static logError(error, context) {
        const errorEntry = {
            type: error.type || 'UNKNOWN_ERROR',
            message: error.message,
            context,
            timestamp: new Date(),
            stack: error.stack
        };

        this.errorLog.unshift(errorEntry);

        // Maintain log size
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.pop();
        }
    }

    static getUserFriendlyMessage(error) {
        if (error instanceof BaseError) {
            return error.message;
        }

        // Map common error messages to user-friendly versions
        const errorMessages = {
            'Failed to load image': 'Unable to load the image. Please try a different file.',
            'Invalid SVG file': 'The SVG file appears to be invalid or corrupted.',
            'File size exceeds maximum limit': 'The file is too large. Please choose a smaller file.',
            'Unsupported file type': 'This file type is not supported. Please use a supported format.',
            'Failed to read file': 'Unable to read the file. Please try again.',
            'Invalid project file': 'The project file appears to be invalid or corrupted.'
        };

        return errorMessages[error.message] || 'An unexpected error occurred. Please try again.';
    }

    static showErrorToUser(message) {
        // Dispatch custom event for UI to handle
        const event = new CustomEvent('app:error', {
            detail: { message }
        });
        window.dispatchEvent(event);
    }

    static getErrorLog() {
        return [...this.errorLog];
    }

    static clearErrorLog() {
        this.errorLog = [];
    }

    static getErrorCount() {
        return this.errorLog.length;
    }

    static getRecentErrors(count = 5) {
        return this.errorLog.slice(0, count);
    }
}

export { ErrorHandler, FileError, ValidationError, DrawingError, StateError }; 