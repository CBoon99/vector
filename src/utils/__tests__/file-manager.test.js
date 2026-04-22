import FileManager from '../file-manager';

describe('FileManager', () => {
    let fileManager;
    let mockCanvas;
    let mockContext;

    beforeEach(() => {
        // Create canvas and context
        mockCanvas = document.createElement('canvas');
        mockContext = {
            getImageData: jest.fn().mockReturnValue({
                data: new Uint8ClampedArray(4),
                width: 1,
                height: 1
            }),
            putImageData: jest.fn()
        };
        mockCanvas.getContext = jest.fn().mockReturnValue(mockContext);
        mockCanvas.width = 800;
        mockCanvas.height = 600;

        fileManager = new FileManager(mockCanvas);
    });

    describe('Error Handling', () => {
        it('should handle invalid canvas initialization', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const invalidManager = new FileManager(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid canvas provided to FileManager');
            expect(invalidManager.canvas).toBeNull();
        });

        it('should handle invalid file type', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const file = new File([''], 'test.txt', { type: 'text/plain' });
            fileManager.saveFile(file);
            expect(consoleSpy).toHaveBeenCalledWith('Unsupported file type:', 'text/plain');
        });

        it('should handle file too large', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const largeFile = new File([''], 'test.png', { type: 'image/png' });
            Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB
            fileManager.saveFile(largeFile);
            expect(consoleSpy).toHaveBeenCalledWith('File too large:', 'test.png');
        });

        it('should handle file read errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const file = new File([''], 'test.png', { type: 'image/png' });
            fileManager.readFile(file);
            expect(consoleSpy).toHaveBeenCalledWith('Error reading file:', expect.any(Error));
        });

        it('should handle file write errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            fileManager.saveFile(null);
            expect(consoleSpy).toHaveBeenCalledWith('Error saving file:', expect.any(Error));
        });
    });

    describe('File Operations', () => {
        it('should handle invalid file names', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            const file = new File([''], 'test.png', { type: 'image/png' });
            fileManager.validateFileName(file.name);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid file name:', 'test.png');
        });

        it('should handle invalid file extensions', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            const file = new File([''], 'test.invalid', { type: 'image/png' });
            fileManager.validateFileExtension(file.name);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid file extension:', '.invalid');
        });

        it('should handle duplicate file names', () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            const file1 = new File([''], 'test.png', { type: 'image/png' });
            const file2 = new File([''], 'test.png', { type: 'image/png' });
            fileManager.handleDuplicateFileName(file1.name);
            expect(consoleSpy).toHaveBeenCalledWith('Duplicate file name:', 'test.png');
        });
    });

    describe('Image Processing', () => {
        it('should handle invalid image data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockContext.getImageData.mockReturnValue(null);
            fileManager.processImage();
            expect(consoleSpy).toHaveBeenCalledWith('Invalid image data');
        });

        it('should handle image processing errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockContext.getImageData.mockImplementation(() => {
                throw new Error('Processing error');
            });
            fileManager.processImage();
            expect(consoleSpy).toHaveBeenCalledWith('Error processing image:', expect.any(Error));
        });

        it('should handle invalid image dimensions', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockCanvas.width = 0;
            mockCanvas.height = 0;
            fileManager.validateImageDimensions();
            expect(consoleSpy).toHaveBeenCalledWith('Invalid image dimensions');
        });
    });

    describe('File Format Handling', () => {
        it('should handle unsupported image formats', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const file = new File([''], 'test.bmp', { type: 'image/bmp' });
            fileManager.validateImageFormat(file.type);
            expect(consoleSpy).toHaveBeenCalledWith('Unsupported image format:', 'image/bmp');
        });

        it('should handle invalid image data format', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const invalidData = new Uint8ClampedArray(3); // Invalid length
            fileManager.validateImageData(invalidData);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid image data format');
        });

        it('should handle corrupted image data', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const corruptedData = new Uint8ClampedArray(4);
            corruptedData[0] = 256; // Invalid value
            fileManager.validateImageData(corruptedData);
            expect(consoleSpy).toHaveBeenCalledWith('Corrupted image data');
        });
    });

    describe('File System Operations', () => {
        it('should handle file system errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const originalFileSystem = window.FileSystem;
            delete window.FileSystem;
            fileManager.saveToFileSystem();
            expect(consoleSpy).toHaveBeenCalledWith('File system not available');
            window.FileSystem = originalFileSystem;
        });

        it('should handle quota exceeded errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            fileManager.handleFileSystemError(error);
            expect(consoleSpy).toHaveBeenCalledWith('Storage quota exceeded');
        });

        it('should handle permission denied errors', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const error = new Error('PermissionDeniedError');
            error.name = 'PermissionDeniedError';
            fileManager.handleFileSystemError(error);
            expect(consoleSpy).toHaveBeenCalledWith('Permission denied');
        });
    });

    describe('File Validation Rules', () => {
        it('should validate file size limits', () => {
            const validSizes = [1024, 1024 * 1024, 5 * 1024 * 1024];
            const invalidSizes = [0, 6 * 1024 * 1024, -1];
            
            validSizes.forEach(size => {
                const file = new File([''], 'test.png', { type: 'image/png' });
                Object.defineProperty(file, 'size', { value: size });
                expect(fileManager.validateFileSize(file)).toBe(true);
            });
            
            invalidSizes.forEach(size => {
                const file = new File([''], 'test.png', { type: 'image/png' });
                Object.defineProperty(file, 'size', { value: size });
                expect(fileManager.validateFileSize(file)).toBe(false);
            });
        });

        it('should validate supported file types', () => {
            const validTypes = ['image/png', 'image/jpeg', 'image/gif'];
            const invalidTypes = ['text/plain', 'application/pdf', 'image/bmp'];
            
            validTypes.forEach(type => {
                const file = new File([''], 'test', { type });
                expect(fileManager.validateFileType(file)).toBe(true);
            });
            
            invalidTypes.forEach(type => {
                const file = new File([''], 'test', { type });
                expect(fileManager.validateFileType(file)).toBe(false);
            });
        });

        it('should validate file names', () => {
            const validNames = ['test.png', 'image_1.jpg', 'drawing-2.gif'];
            const invalidNames = ['', 'test', 'test.txt', 'test.bmp'];
            
            validNames.forEach(name => {
                expect(fileManager.validateFileName(name)).toBe(true);
            });
            
            invalidNames.forEach(name => {
                expect(fileManager.validateFileName(name)).toBe(false);
            });
        });
    });
}); 