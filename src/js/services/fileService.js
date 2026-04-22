import { ErrorHandler, FileError } from '../utils/errorHandler.js';

class FileService {
    constructor() {
        this.supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.supportedVectorTypes = ['image/svg+xml'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
    }

    async validateFile(file) {
        if (!file) {
            throw new FileError('No file provided');
        }

        if (file.size > this.maxFileSize) {
            throw new FileError(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
        }

        const fileType = file.type.toLowerCase();
        if (![...this.supportedImageTypes, ...this.supportedVectorTypes].includes(fileType)) {
            throw new FileError('Unsupported file type');
        }

        return true;
    }

    async processImage(file) {
        try {
            await this.validateFile(file);
            
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new FileError('Failed to load image'));
                    img.src = e.target.result;
                };
                
                reader.onerror = () => reject(new FileError('Failed to read file'));
                reader.readAsDataURL(file);
            });
        } catch (error) {
            ErrorHandler.handle(error, 'processImage');
            throw error;
        }
    }

    async processSVG(file) {
        try {
            await this.validateFile(file);
            
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const parser = new DOMParser();
                        const svgDoc = parser.parseFromString(e.target.result, 'image/svg+xml');
                        
                        if (svgDoc.documentElement.nodeName !== 'svg') {
                            throw new FileError('Invalid SVG file');
                        }
                        
                        resolve(svgDoc);
                    } catch (error) {
                        reject(new FileError('Failed to parse SVG'));
                    }
                };
                
                reader.onerror = () => reject(new FileError('Failed to read file'));
                reader.readAsText(file);
            });
        } catch (error) {
            ErrorHandler.handle(error, 'processSVG');
            throw error;
        }
    }

    async loadProject(file) {
        try {
            await this.validateFile(file);
            
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const projectData = JSON.parse(e.target.result);
                        resolve(projectData);
                    } catch (error) {
                        reject(new FileError('Invalid project file'));
                    }
                };
                
                reader.onerror = () => reject(new FileError('Failed to read file'));
                reader.readAsText(file);
            });
        } catch (error) {
            ErrorHandler.handle(error, 'loadProject');
            throw error;
        }
    }
}

export default new FileService(); 