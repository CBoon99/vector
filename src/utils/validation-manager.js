class ValidationManager {
    constructor() {
        this.schemas = new Map();
        this.validators = new Map();
        this.events = new Map();
        this.errorMessages = new Map();
    }

    validate(schema, data) {
        try {
            if (!schema) {
                console.error('Invalid schema provided');
                return { valid: false, errors: ['Invalid schema'] };
            }
            if (!data) {
                console.error('Invalid data provided');
                return { valid: false, errors: ['Invalid data'] };
            }

            const errors = [];
            const result = this.validateObject(schema, data, '', errors);

            return {
                valid: errors.length === 0,
                errors
            };
        } catch (error) {
            console.error('Error validating data:', error);
            return { valid: false, errors: [error.message] };
        }
    }

    validateObject(schema, data, path, errors) {
        try {
            for (const [key, value] of Object.entries(schema)) {
                const currentPath = path ? `${path}.${key}` : key;
                const dataValue = data[key];

                if (value.required && (dataValue === undefined || dataValue === null)) {
                    errors.push(this.getErrorMessage('required', currentPath));
                    continue;
                }

                if (dataValue !== undefined && dataValue !== null) {
                    this.validateValue(value, dataValue, currentPath, errors);
                }
            }
        } catch (error) {
            console.error('Error validating object:', error);
            errors.push(error.message);
        }
    }

    validateValue(schema, value, path, errors) {
        try {
            switch (schema.type) {
                case 'string':
                    this.validateString(schema, value, path, errors);
                    break;
                case 'number':
                    this.validateNumber(schema, value, path, errors);
                    break;
                case 'boolean':
                    this.validateBoolean(schema, value, path, errors);
                    break;
                case 'array':
                    this.validateArray(schema, value, path, errors);
                    break;
                case 'object':
                    this.validateObject(schema.properties, value, path, errors);
                    break;
                default:
                    if (this.validators.has(schema.type)) {
                        this.validators.get(schema.type)(schema, value, path, errors);
                    } else {
                        errors.push(this.getErrorMessage('invalidType', path, { type: schema.type }));
                    }
            }
        } catch (error) {
            console.error('Error validating value:', error);
            errors.push(error.message);
        }
    }

    validateString(schema, value, path, errors) {
        try {
            if (typeof value !== 'string') {
                errors.push(this.getErrorMessage('type', path, { expected: 'string' }));
                return;
            }

            if (schema.minLength !== undefined && value.length < schema.minLength) {
                errors.push(this.getErrorMessage('minLength', path, { min: schema.minLength }));
            }

            if (schema.maxLength !== undefined && value.length > schema.maxLength) {
                errors.push(this.getErrorMessage('maxLength', path, { max: schema.maxLength }));
            }

            if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
                errors.push(this.getErrorMessage('pattern', path, { pattern: schema.pattern }));
            }

            if (schema.enum && !schema.enum.includes(value)) {
                errors.push(this.getErrorMessage('enum', path, { allowed: schema.enum.join(', ') }));
            }
        } catch (error) {
            console.error('Error validating string:', error);
            errors.push(error.message);
        }
    }

    validateNumber(schema, value, path, errors) {
        try {
            if (typeof value !== 'number') {
                errors.push(this.getErrorMessage('type', path, { expected: 'number' }));
                return;
            }

            if (schema.minimum !== undefined && value < schema.minimum) {
                errors.push(this.getErrorMessage('minimum', path, { min: schema.minimum }));
            }

            if (schema.maximum !== undefined && value > schema.maximum) {
                errors.push(this.getErrorMessage('maximum', path, { max: schema.maximum }));
            }

            if (schema.multipleOf !== undefined && value % schema.multipleOf !== 0) {
                errors.push(this.getErrorMessage('multipleOf', path, { multiple: schema.multipleOf }));
            }
        } catch (error) {
            console.error('Error validating number:', error);
            errors.push(error.message);
        }
    }

    validateBoolean(schema, value, path, errors) {
        try {
            if (typeof value !== 'boolean') {
                errors.push(this.getErrorMessage('type', path, { expected: 'boolean' }));
            }
        } catch (error) {
            console.error('Error validating boolean:', error);
            errors.push(error.message);
        }
    }

    validateArray(schema, value, path, errors) {
        try {
            if (!Array.isArray(value)) {
                errors.push(this.getErrorMessage('type', path, { expected: 'array' }));
                return;
            }

            if (schema.minItems !== undefined && value.length < schema.minItems) {
                errors.push(this.getErrorMessage('minItems', path, { min: schema.minItems }));
            }

            if (schema.maxItems !== undefined && value.length > schema.maxItems) {
                errors.push(this.getErrorMessage('maxItems', path, { max: schema.maxItems }));
            }

            if (schema.uniqueItems && new Set(value).size !== value.length) {
                errors.push(this.getErrorMessage('uniqueItems', path));
            }

            if (schema.items) {
                value.forEach((item, index) => {
                    this.validateValue(schema.items, item, `${path}[${index}]`, errors);
                });
            }
        } catch (error) {
            console.error('Error validating array:', error);
            errors.push(error.message);
        }
    }

    addValidator(type, validator) {
        try {
            if (!type) {
                console.error('Invalid validator type provided');
                return;
            }
            if (!validator || typeof validator !== 'function') {
                console.error('Invalid validator function provided');
                return;
            }

            this.validators.set(type, validator);
            this.emit('validatorAdded', { type });
        } catch (error) {
            console.error('Error adding validator:', error);
        }
    }

    removeValidator(type) {
        try {
            if (!type) {
                console.error('Invalid validator type provided');
                return;
            }

            this.validators.delete(type);
            this.emit('validatorRemoved', { type });
        } catch (error) {
            console.error('Error removing validator:', error);
        }
    }

    setErrorMessage(key, message) {
        try {
            if (!key) {
                console.error('Invalid error message key provided');
                return;
            }
            if (!message) {
                console.error('Invalid error message provided');
                return;
            }

            this.errorMessages.set(key, message);
        } catch (error) {
            console.error('Error setting error message:', error);
        }
    }

    getErrorMessage(key, path, params = {}) {
        try {
            let message = this.errorMessages.get(key) || this.getDefaultErrorMessage(key);
            message = message.replace('{path}', path);
            
            for (const [param, value] of Object.entries(params)) {
                message = message.replace(`{${param}}`, value);
            }

            return message;
        } catch (error) {
            console.error('Error getting error message:', error);
            return `Validation error at ${path}`;
        }
    }

    getDefaultErrorMessage(key) {
        const messages = {
            required: '{path} is required',
            type: '{path} must be of type {expected}',
            minLength: '{path} must be at least {min} characters long',
            maxLength: '{path} must be at most {max} characters long',
            pattern: '{path} must match pattern {pattern}',
            enum: '{path} must be one of: {allowed}',
            minimum: '{path} must be greater than or equal to {min}',
            maximum: '{path} must be less than or equal to {max}',
            multipleOf: '{path} must be a multiple of {multiple}',
            minItems: '{path} must contain at least {min} items',
            maxItems: '{path} must contain at most {max} items',
            uniqueItems: '{path} must contain unique items',
            invalidType: '{path} has invalid type {type}'
        };
        return messages[key] || 'Validation error at {path}';
    }

    on(event, handler) {
        try {
            if (!event) {
                console.error('Invalid event name provided');
                return;
            }
            if (!handler || typeof handler !== 'function') {
                console.error('Invalid event handler provided');
                return;
            }

            if (!this.events.has(event)) {
                this.events.set(event, new Set());
            }
            this.events.get(event).add(handler);
        } catch (error) {
            console.error('Error adding event handler:', error);
        }
    }

    emit(event, data) {
        try {
            if (this.events.has(event)) {
                for (const handler of this.events.get(event)) {
                    handler(data);
                }
            }
        } catch (error) {
            console.error('Error emitting event:', error);
        }
    }
}

export default ValidationManager; 