import { ErrorHandler, FileError } from '../utils/errorHandler.js';
import { generateId } from '../utils/id-generator.js';
import { cellularVectorizeFromImage } from './cellularVectorize.js';
import VectorizationService from './vectorizationService.js';

class FileImportService {
    constructor() {
        this.supportedFormats = {
            vector: {
                'image/svg+xml': this.processSVG.bind(this),
                'application/pdf': this.processPDF.bind(this),
                'application/postscript': this.processEPS.bind(this),
                'application/dxf': this.processDXF.bind(this),
                'application/illustrator': this.processAI.bind(this)
            },
            raster: {
                'image/jpeg': this.processRaster.bind(this),
                'image/png': this.processRaster.bind(this),
                'image/gif': this.processRaster.bind(this),
                'image/webp': this.processRaster.bind(this),
                'image/tiff': this.processRaster.bind(this),
                'image/bmp': this.processRaster.bind(this)
            }
        };

        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        /** @type {Record<string, unknown>} */
        this._importOptions = {};
    }

    getMimeType(file) {
        let t = (file.type || '').toLowerCase();
        if (t) {
            return t;
        }
        const name = (file.name || '').toLowerCase();
        if (name.endsWith('.png')) {
            return 'image/png';
        }
        if (name.endsWith('.jpg') || name.endsWith('.jpeg')) {
            return 'image/jpeg';
        }
        if (name.endsWith('.gif')) {
            return 'image/gif';
        }
        if (name.endsWith('.webp')) {
            return 'image/webp';
        }
        if (name.endsWith('.svg')) {
            return 'image/svg+xml';
        }
        if (name.endsWith('.bmp')) {
            return 'image/bmp';
        }
        if (name.endsWith('.tif') || name.endsWith('.tiff')) {
            return 'image/tiff';
        }
        return '';
    }

    /**
     * @param {File} file
     * @param {{ cellPoster?: boolean, rasterOnly?: boolean, quality?: 'low' | 'medium' | 'high', cellSize?: number }} [options]
     */
    async importFile(file, options = {}) {
        this._importOptions = options || {};
        try {
            const mime = this.getMimeType(file);
            file = this._withType(file, mime);
            await this.validateFile(file);
            const processor = this.getFileProcessor(file);
            return await processor(file);
        } catch (error) {
            ErrorHandler.handle(error, 'FileImportService.importFile');
            throw error;
        } finally {
            this._importOptions = {};
        }
    }

    _withType(file, mime) {
        if (file.type || !mime) {
            return file;
        }
        return new File([file], file.name, { type: mime, lastModified: file.lastModified });
    }

    async validateFile(file) {
        if (!file) {
            throw new FileError('No file provided');
        }

        if (file.size > this.maxFileSize) {
            throw new FileError(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
        }

        const fileType = (file.type || this.getMimeType(file) || '').toLowerCase();
        const isSupported = Object.keys(this.supportedFormats.vector).includes(fileType) ||
            Object.keys(this.supportedFormats.raster).includes(fileType);

        if (!isSupported) {
            throw new FileError('Unsupported file type');
        }
    }

    getFileProcessor(file) {
        const fileType = (file.type || this.getMimeType(file) || '').toLowerCase();
        return (
            this.supportedFormats.vector[fileType] ||
            this.supportedFormats.raster[fileType] ||
            (() => {
                throw new FileError('No processor available for this file type');
            })
        );
    }

    async processSVG(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const parser = new DOMParser();
                    const svgDoc = parser.parseFromString(e.target.result, 'image/svg+xml');
                    
                    if (svgDoc.documentElement.nodeName !== 'svg') {
                        throw new FileError('Invalid SVG file');
                    }
                    
                    const vectorObjects = this.extractVectorObjects(svgDoc);
                    resolve(vectorObjects);
                } catch (error) {
                    reject(new FileError('Failed to parse SVG'));
                }
            };
            
            reader.onerror = () => reject(new FileError('Failed to read file'));
            reader.readAsText(file);
        });
    }

    async processPDF(file) {
        // TODO: Implement PDF processing using PDF.js
        throw new FileError('PDF processing not yet implemented');
    }

    async processEPS(file) {
        // TODO: Implement EPS processing
        throw new FileError('EPS processing not yet implemented');
    }

    async processDXF(file) {
        // TODO: Implement DXF processing
        throw new FileError('DXF processing not yet implemented');
    }

    async processAI(file) {
        // TODO: Implement AI processing
        throw new FileError('AI processing not yet implemented');
    }

    /**
     * @param {HTMLImageElement} image
     * @returns {Array<Record<string, unknown>>}
     */
    _rasterObjectFromImage(image) {
        const nw = image.naturalWidth || image.width;
        const nh = image.naturalHeight || image.height;
        if (!nw || !nh) {
            return [];
        }
        const maxW = 800;
        const maxH = 600;
        let w = nw;
        let h = nh;
        if (w > maxW || h > maxH) {
            const s = Math.min(maxW / w, maxH / h, 1);
            w = Math.max(1, Math.floor(w * s));
            h = Math.max(1, Math.floor(h * s));
        }
        return [
            {
                type: 'raster',
                id: generateId('raster'),
                x: 0,
                y: 0,
                width: w,
                height: h,
                image
            }
        ];
    }

    async processRaster(file) {
        const opts = this._importOptions || {};
        const image = await this.loadImage(file);
        if (opts.rasterOnly) {
            return this._rasterObjectFromImage(image);
        }
        if (opts.cellPoster) {
            return cellularVectorizeFromImage(image, {
                maxSide: 120,
                cellSize: opts.cellSize || 10
            });
        }
        try {
            const traced = await VectorizationService.vectorizeImage(
                image,
                opts.quality || 'medium'
            );
            if (traced && traced.length) {
                return traced;
            }
        } catch (e) {
            /* fall through to cell poster */
        }
        const fromCells = cellularVectorizeFromImage(image, { maxSide: 100, cellSize: 10 });
        if (fromCells && fromCells.length) {
            return fromCells;
        }
        return this._rasterObjectFromImage(image);
    }

    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    if (typeof img.decode === 'function') {
                        img
                            .decode()
                            .then(() => resolve(img))
                            .catch(() => resolve(img));
                    } else {
                        resolve(img);
                    }
                };
                img.onerror = () => reject(new FileError('Failed to load image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new FileError('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    extractVectorObjects(svgDoc) {
        const objects = [];
        const elements = svgDoc.documentElement.children;

        for (const element of elements) {
            const object = this.convertSVGElementToObject(element);
            if (object) {
                objects.push(object);
            }
        }

        return objects;
    }

    convertSVGElementToObject(element) {
        switch (element.tagName.toLowerCase()) {
            case 'path':
                return this.convertPathToObject(element);
            case 'rect':
                return this.convertRectToObject(element);
            case 'circle':
                return this.convertCircleToObject(element);
            case 'ellipse':
                return this.convertEllipseToObject(element);
            case 'polygon':
                return this.convertPolygonToObject(element);
            case 'polyline':
                return this.convertPolylineToObject(element);
            case 'text':
                return this.convertTextToObject(element);
            case 'g':
                return this.convertGroupToObject(element);
            default:
                return null;
        }
    }

    convertPathToObject(element) {
        return {
            type: 'path',
            d: element.getAttribute('d'),
            fill: element.getAttribute('fill') || 'none',
            stroke: {
                color: element.getAttribute('stroke') || 'none',
                width: parseFloat(element.getAttribute('stroke-width')) || 1
            },
            transform: this.parseTransform(element.getAttribute('transform'))
        };
    }

    convertRectToObject(element) {
        return {
            type: 'rectangle',
            x: parseFloat(element.getAttribute('x')) || 0,
            y: parseFloat(element.getAttribute('y')) || 0,
            width: parseFloat(element.getAttribute('width')) || 0,
            height: parseFloat(element.getAttribute('height')) || 0,
            cornerRadius: parseFloat(element.getAttribute('rx')) || 0,
            fill: element.getAttribute('fill') || 'none',
            stroke: {
                color: element.getAttribute('stroke') || 'none',
                width: parseFloat(element.getAttribute('stroke-width')) || 1
            },
            transform: this.parseTransform(element.getAttribute('transform'))
        };
    }

    convertCircleToObject(element) {
        return {
            type: 'circle',
            cx: parseFloat(element.getAttribute('cx')) || 0,
            cy: parseFloat(element.getAttribute('cy')) || 0,
            radius: parseFloat(element.getAttribute('r')) || 0,
            fill: element.getAttribute('fill') || 'none',
            stroke: {
                color: element.getAttribute('stroke') || 'none',
                width: parseFloat(element.getAttribute('stroke-width')) || 1
            },
            transform: this.parseTransform(element.getAttribute('transform'))
        };
    }

    convertEllipseToObject(element) {
        return {
            type: 'ellipse',
            cx: parseFloat(element.getAttribute('cx')) || 0,
            cy: parseFloat(element.getAttribute('cy')) || 0,
            rx: parseFloat(element.getAttribute('rx')) || 0,
            ry: parseFloat(element.getAttribute('ry')) || 0,
            fill: element.getAttribute('fill') || 'none',
            stroke: {
                color: element.getAttribute('stroke') || 'none',
                width: parseFloat(element.getAttribute('stroke-width')) || 1
            },
            transform: this.parseTransform(element.getAttribute('transform'))
        };
    }

    convertPolygonToObject(element) {
        return {
            type: 'polygon',
            points: this.parsePoints(element.getAttribute('points')),
            fill: element.getAttribute('fill') || 'none',
            stroke: {
                color: element.getAttribute('stroke') || 'none',
                width: parseFloat(element.getAttribute('stroke-width')) || 1
            },
            transform: this.parseTransform(element.getAttribute('transform'))
        };
    }

    convertPolylineToObject(element) {
        return {
            type: 'polyline',
            points: this.parsePoints(element.getAttribute('points')),
            fill: 'none',
            stroke: {
                color: element.getAttribute('stroke') || 'none',
                width: parseFloat(element.getAttribute('stroke-width')) || 1
            },
            transform: this.parseTransform(element.getAttribute('transform'))
        };
    }

    convertTextToObject(element) {
        return {
            type: 'text',
            x: parseFloat(element.getAttribute('x')) || 0,
            y: parseFloat(element.getAttribute('y')) || 0,
            text: element.textContent,
            font: {
                family: element.getAttribute('font-family') || 'Arial',
                size: parseFloat(element.getAttribute('font-size')) || 16,
                weight: element.getAttribute('font-weight') || 'normal',
                style: element.getAttribute('font-style') || 'normal'
            },
            fill: element.getAttribute('fill') || 'black',
            transform: this.parseTransform(element.getAttribute('transform'))
        };
    }

    convertGroupToObject(element) {
        const children = Array.from(element.children).map(child => 
            this.convertSVGElementToObject(child)
        ).filter(Boolean);

        return {
            type: 'group',
            children,
            transform: this.parseTransform(element.getAttribute('transform'))
        };
    }

    parsePoints(pointsString) {
        if (!pointsString) return [];
        return pointsString.trim().split(/[\s,]+/).map(Number);
    }

    parseTransform(transformString) {
        if (!transformString) return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };

        const transform = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
        const transforms = transformString.trim().split(/\)\s+/);

        transforms.forEach(t => {
            const [type, ...values] = t.split(/[(\s,]+/);
            const nums = values.map(Number);

            switch (type) {
                case 'translate':
                    transform.x += nums[0] || 0;
                    transform.y += nums[1] || 0;
                    break;
                case 'rotate':
                    transform.rotation += (nums[0] || 0) * Math.PI / 180;
                    break;
                case 'scale':
                    transform.scaleX *= nums[0] || 1;
                    transform.scaleY *= nums[1] || nums[0] || 1;
                    break;
            }
        });

        return transform;
    }
}

export default new FileImportService(); 