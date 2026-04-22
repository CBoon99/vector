import ValidationManager from '../validation-manager';

describe('ValidationManager', () => {
    let validationManager;

    beforeEach(() => {
        validationManager = new ValidationManager();
    });

    describe('Error Handling', () => {
        it('should handle invalid schema', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.validate(null, {});
            expect(consoleSpy).toHaveBeenCalledWith('Invalid schema provided');
        });

        it('should handle invalid data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.validate({}, null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid data provided');
        });

        it('should handle validation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.validate = jest.fn().mockImplementation(() => {
                throw new Error('Validation error');
            });
            validationManager.validate({}, {});
            expect(consoleSpy).toHaveBeenCalledWith('Error validating data:', expect.any(Error));
        });

        it('should handle schema parsing errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.parseSchema = jest.fn().mockImplementation(() => {
                throw new Error('Schema parsing error');
            });
            validationManager.parseSchema({});
            expect(consoleSpy).toHaveBeenCalledWith('Error parsing schema:', expect.any(Error));
        });
    });

    describe('Schema Validation', () => {
        it('should handle invalid schema format', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.validateSchema(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid schema format provided');
        });

        it('should handle schema validation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.validateSchema = jest.fn().mockImplementation(() => {
                throw new Error('Schema validation error');
            });
            validationManager.validateSchema({});
            expect(consoleSpy).toHaveBeenCalledWith('Error validating schema:', expect.any(Error));
        });

        it('should handle invalid schema types', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.validateSchema(undefined);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid schema type');
        });
    });

    describe('Data Validation', () => {
        it('should handle invalid data format', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.validateData(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid data format provided');
        });

        it('should handle data validation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.validateData = jest.fn().mockImplementation(() => {
                throw new Error('Data validation error');
            });
            validationManager.validateData({});
            expect(consoleSpy).toHaveBeenCalledWith('Error validating data:', expect.any(Error));
        });

        it('should handle invalid data types', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.validateData(undefined);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid data type');
        });
    });

    describe('Rule Validation', () => {
        it('should handle invalid rule', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.validateRule(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid rule provided');
        });

        it('should handle rule validation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.validateRule = jest.fn().mockImplementation(() => {
                throw new Error('Rule validation error');
            });
            validationManager.validateRule({});
            expect(consoleSpy).toHaveBeenCalledWith('Error validating rule:', expect.any(Error));
        });

        it('should handle rule execution errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.executeRule = jest.fn().mockImplementation(() => {
                throw new Error('Rule execution error');
            });
            validationManager.executeRule({}, {});
            expect(consoleSpy).toHaveBeenCalledWith('Error executing rule:', expect.any(Error));
        });
    });

    describe('Custom Validators', () => {
        it('should handle invalid validator', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.addValidator(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid validator provided');
        });

        it('should handle validator errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.addValidator = jest.fn().mockImplementation(() => {
                throw new Error('Validator error');
            });
            validationManager.addValidator({});
            expect(consoleSpy).toHaveBeenCalledWith('Error adding validator:', expect.any(Error));
        });

        it('should handle validator execution errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.executeValidator = jest.fn().mockImplementation(() => {
                throw new Error('Validator execution error');
            });
            validationManager.executeValidator({}, {});
            expect(consoleSpy).toHaveBeenCalledWith('Error executing validator:', expect.any(Error));
        });
    });

    describe('Error Messages', () => {
        it('should handle invalid error message', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.setErrorMessage(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid error message provided');
        });

        it('should handle error message errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.setErrorMessage = jest.fn().mockImplementation(() => {
                throw new Error('Error message error');
            });
            validationManager.setErrorMessage('key', 'message');
            expect(consoleSpy).toHaveBeenCalledWith('Error setting error message:', expect.any(Error));
        });

        it('should handle error message format errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.formatErrorMessage = jest.fn().mockImplementation(() => {
                throw new Error('Error message format error');
            });
            validationManager.formatErrorMessage('message', {});
            expect(consoleSpy).toHaveBeenCalledWith('Error formatting error message:', expect.any(Error));
        });
    });

    describe('Validation Results', () => {
        it('should handle invalid result', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.processResult(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid validation result provided');
        });

        it('should handle result processing errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.processResult = jest.fn().mockImplementation(() => {
                throw new Error('Result processing error');
            });
            validationManager.processResult({});
            expect(consoleSpy).toHaveBeenCalledWith('Error processing validation result:', expect.any(Error));
        });

        it('should handle result aggregation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.aggregateResults = jest.fn().mockImplementation(() => {
                throw new Error('Result aggregation error');
            });
            validationManager.aggregateResults([]);
            expect(consoleSpy).toHaveBeenCalledWith('Error aggregating validation results:', expect.any(Error));
        });
    });

    describe('Validation Context', () => {
        it('should handle invalid context', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.setContext(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid validation context provided');
        });

        it('should handle context errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.setContext = jest.fn().mockImplementation(() => {
                throw new Error('Context error');
            });
            validationManager.setContext({});
            expect(consoleSpy).toHaveBeenCalledWith('Error setting validation context:', expect.any(Error));
        });

        it('should handle context validation errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            validationManager.validateContext = jest.fn().mockImplementation(() => {
                throw new Error('Context validation error');
            });
            validationManager.validateContext({});
            expect(consoleSpy).toHaveBeenCalledWith('Error validating context:', expect.any(Error));
        });
    });
}); 