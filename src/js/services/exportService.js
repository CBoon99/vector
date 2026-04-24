import { ErrorHandler, FileError } from '../utils/errorHandler.js';
import UIService from './uiService.js';

class ExportService {
    constructor() {
        this.supportedFormats = {
            vector: ['svg', 'pdf', 'ai', 'eps', 'dxf'],
            raster: ['png', 'jpg', 'webp', 'tiff', 'bmp']
        };

        this.exportPresets = {
            web: {
                svg: {
                    precision: 2,
                    includeMetadata: true,
                    includeStyles: true,
                    minify: true
                },
                png: {
                    quality: 0.8,
                    includeTransparency: true,
                    compression: true
                },
                webp: {
                    quality: 0.8,
                    lossless: false
                }
            },
            print: {
                pdf: {
                    pageSize: 'A4',
                    orientation: 'portrait',
                    includeMetadata: true,
                    compression: true,
                    quality: 'high'
                },
                svg: {
                    precision: 3,
                    includeMetadata: true,
                    includeStyles: true,
                    minify: false
                },
                tiff: {
                    quality: 1,
                    compression: 'lzw'
                }
            },
            social: {
                png: {
                    quality: 0.9,
                    includeTransparency: true,
                    compression: true
                },
                jpg: {
                    quality: 0.85,
                    compression: true
                }
            },
            archive: {
                svg: {
                    precision: 3,
                    includeMetadata: true,
                    includeStyles: true,
                    minify: false
                },
                pdf: {
                    pageSize: 'A4',
                    orientation: 'portrait',
                    includeMetadata: true,
                    compression: true,
                    quality: 'high'
                }
            }
        };

        this.qualitySettings = {
            low: {
                svg: { precision: 1, minify: true },
                png: { quality: 0.6, compression: true },
                jpg: { quality: 0.6, compression: true },
                pdf: { compression: true, quality: 'low' }
            },
            medium: {
                svg: { precision: 2, minify: false },
                png: { quality: 0.8, compression: true },
                jpg: { quality: 0.8, compression: true },
                pdf: { compression: true, quality: 'medium' }
            },
            high: {
                svg: { precision: 3, minify: false },
                png: { quality: 1, compression: false },
                jpg: { quality: 0.92, compression: true },
                pdf: { compression: true, quality: 'high' }
            }
        };

        this.defaultSettings = {
            svg: {
                precision: 2,
                includeMetadata: true,
                includeStyles: true,
                minify: false
            },
            pdf: {
                pageSize: 'A4',
                orientation: 'portrait',
                includeMetadata: true,
                compression: true,
                quality: 'medium'
            },
            png: {
                quality: 1,
                includeTransparency: true,
                compression: true
            },
            jpg: {
                quality: 0.92,
                compression: true
            },
            webp: {
                quality: 0.8,
                lossless: false
            }
        };
    }

    async exportDocument(document, format, settings = {}) {
        try {
            this.validateFormat(format);
            const exportSettings = this.getExportSettings(format, settings);

            let blob;
            if (this.supportedFormats.vector.includes(format)) {
                blob = await this.exportToVector(document, format, exportSettings);
            } else if (this.supportedFormats.raster.includes(format)) {
                blob = await this.exportToRaster(document, format, exportSettings);
            }

            return blob;
        } catch (error) {
            ErrorHandler.handle(error, 'exportService.exportDocument');
            throw error;
        }
    }

    validateFormat(format) {
        const allFormats = [...this.supportedFormats.vector, ...this.supportedFormats.raster];
        if (!allFormats.includes(format.toLowerCase())) {
            throw new FileError(`Unsupported export format: ${format}`);
        }
    }

    getExportSettings(format, userSettings = {}) {
        const preset = userSettings.preset ? this.exportPresets[userSettings.preset]?.[format] : null;
        const quality = userSettings.quality ? this.qualitySettings[userSettings.quality]?.[format] : null;
        
        return {
            ...this.defaultSettings[format],
            ...(preset || {}),
            ...(quality || {}),
            ...userSettings
        };
    }

    async exportToVector(document, format, settings) {
        switch (format.toLowerCase()) {
            case 'svg':
                return this.exportToSVG(document, settings);
            case 'pdf':
                return this.exportToPDF(document, settings);
            case 'ai':
                return this.exportToAI(document, settings);
            case 'eps':
                return this.exportToEPS(document, settings);
            case 'dxf':
                return this.exportToDXF(document, settings);
            default:
                throw new FileError(`Vector format not implemented: ${format}`);
        }
    }

    async exportToSVG(vectorDoc, settings) {
        const dom = typeof document !== 'undefined' ? document : null;
        if (!dom || !vectorDoc) {
            throw new FileError('Invalid export context');
        }
        const svg = dom.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const w = vectorDoc.width || 800;
        const h = vectorDoc.height || 600;
        svg.setAttribute('width', w);
        svg.setAttribute('height', h);
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

        if (settings.includeMetadata) {
            const metadata = dom.createElementNS('http://www.w3.org/2000/svg', 'metadata');
            metadata.textContent = JSON.stringify(vectorDoc.metadata || {});
            svg.appendChild(metadata);
        }

        if (settings.includeStyles) {
            const style = dom.createElementNS('http://www.w3.org/2000/svg', 'style');
            style.textContent = this.generateSVGStyles();
            svg.appendChild(style);
        }

        const objects = vectorDoc.objects || [];
        objects.forEach(obj => {
            const element = this.convertObjectToSVGElement(obj);
            if (element) svg.appendChild(element);
        });

        const svgString = new XMLSerializer().serializeToString(svg);
        return new Blob([svgString], { type: 'image/svg+xml' });
    }

    async exportToRaster(vectorDoc, format, settings) {
        const dom = typeof document !== 'undefined' ? document : null;
        if (!dom || !vectorDoc) {
            throw new FileError('Invalid export context');
        }
        const canvas = dom.createElement('canvas');
        const w = vectorDoc.width || 800;
        const h = vectorDoc.height || 600;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        // Draw background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const objects = vectorDoc.objects || [];
        objects.forEach(obj => {
            this.drawObjectToCanvas(ctx, obj);
        });

        // Convert to requested format
        const mimeType = this.getMimeType(format);
        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => resolve(blob),
                mimeType,
                settings.quality
            );
        });
    }

    getMimeType(format) {
        const mimeTypes = {
            png: 'image/png',
            jpg: 'image/jpeg',
            webp: 'image/webp',
            tiff: 'image/tiff',
            bmp: 'image/bmp'
        };
        return mimeTypes[format.toLowerCase()] || 'image/png';
    }

    drawObjectToCanvas(ctx, object) {
        ctx.save();
        
        // Apply transformations
        if (object.transform) {
            ctx.translate(object.transform.x || 0, object.transform.y || 0);
            ctx.rotate(object.transform.rotation || 0);
            ctx.scale(object.transform.scaleX || 1, object.transform.scaleY || 1);
        }

        // Set styles
        if (object.fill) {
            ctx.fillStyle = object.fill;
        }
        if (object.stroke) {
            ctx.strokeStyle = object.stroke.color;
            ctx.lineWidth = object.stroke.width;
        }

        // Draw based on object type
        switch (object.type) {
            case 'rectangle':
                this.drawRectangle(ctx, object);
                break;
            case 'circle':
                this.drawCircle(ctx, object);
                break;
            case 'ellipse':
                this.drawEllipse(ctx, object);
                break;
            case 'path':
                this.drawPath(ctx, object);
                break;
            case 'text':
                this.drawText(ctx, object);
                break;
        }

        ctx.restore();
    }

    drawRectangle(ctx, object) {
        if (object.cornerRadius) {
            ctx.beginPath();
            ctx.roundRect(
                object.x,
                object.y,
                object.width,
                object.height,
                object.cornerRadius
            );
        } else {
            ctx.beginPath();
            ctx.rect(object.x, object.y, object.width, object.height);
        }

        if (object.fill) ctx.fill();
        if (object.stroke) ctx.stroke();
    }

    drawCircle(ctx, object) {
        ctx.beginPath();
        ctx.arc(object.cx, object.cy, object.radius, 0, Math.PI * 2);
        if (object.fill) ctx.fill();
        if (object.stroke) ctx.stroke();
    }

    drawEllipse(ctx, object) {
        ctx.beginPath();
        ctx.ellipse(
            object.cx,
            object.cy,
            object.rx,
            object.ry,
            object.rotation || 0,
            0,
            Math.PI * 2
        );
        if (object.fill) ctx.fill();
        if (object.stroke) ctx.stroke();
    }

    drawPath(ctx, object) {
        if (!object.points || object.points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(object.points[0].x, object.points[0].y);

        for (let i = 1; i < object.points.length; i++) {
            const point = object.points[i];
            if (point.type === 'curve') {
                ctx.bezierCurveTo(
                    point.cp1x, point.cp1y,
                    point.cp2x, point.cp2y,
                    point.x, point.y
                );
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }

        if (object.isClosed) {
            ctx.closePath();
        }

        if (object.fill) ctx.fill();
        if (object.stroke) ctx.stroke();
    }

    drawText(ctx, object) {
        if (!object.text) return;

        ctx.font = this.getFontString(object.font);
        ctx.textAlign = object.textAlign || 'left';
        ctx.textBaseline = object.textBaseline || 'alphabetic';

        if (object.fill) {
            ctx.fillText(object.text, object.x, object.y);
        }
        if (object.stroke) {
            ctx.strokeText(object.text, object.x, object.y);
        }
    }

    getFontString(font) {
        if (!font) return '16px sans-serif';
        return `${font.style || ''} ${font.weight || ''} ${font.size || 16}px ${font.family || 'sans-serif'}`.trim();
    }

    generateSVGStyles() {
        return `
            .shape { fill: none; stroke: #000; stroke-width: 1; }
            .text { font-family: sans-serif; }
        `;
    }

    convertObjectToSVGElement(object) {
        const ns = 'http://www.w3.org/2000/svg';
        let element;

        switch (object.type) {
            case 'rectangle':
                element = document.createElementNS(ns, 'rect');
                element.setAttribute('x', object.x);
                element.setAttribute('y', object.y);
                element.setAttribute('width', object.width);
                element.setAttribute('height', object.height);
                if (object.cornerRadius) {
                    element.setAttribute('rx', object.cornerRadius);
                    element.setAttribute('ry', object.cornerRadius);
                }
                break;

            case 'circle':
                element = document.createElementNS(ns, 'circle');
                element.setAttribute('cx', object.cx);
                element.setAttribute('cy', object.cy);
                element.setAttribute('r', object.radius);
                break;

            case 'ellipse':
                element = document.createElementNS(ns, 'ellipse');
                element.setAttribute('cx', object.cx);
                element.setAttribute('cy', object.cy);
                element.setAttribute('rx', object.rx);
                element.setAttribute('ry', object.ry);
                if (object.rotation) {
                    element.setAttribute('transform', `rotate(${object.rotation} ${object.cx} ${object.cy})`);
                }
                break;

            case 'path':
                element = document.createElementNS(ns, 'path');
                const pathData = this.generatePathData(object.points, object.isClosed);
                element.setAttribute('d', pathData);
                break;

            case 'text':
                element = document.createElementNS(ns, 'text');
                element.setAttribute('x', object.x);
                element.setAttribute('y', object.y);
                element.textContent = object.text;
                if (object.font) {
                    element.setAttribute('font-family', object.font.family);
                    element.setAttribute('font-size', object.font.size);
                    element.setAttribute('font-weight', object.font.weight);
                    element.setAttribute('font-style', object.font.style);
                }
                break;
        }

        if (element) {
            if (object.fill) element.setAttribute('fill', object.fill);
            if (object.stroke) {
                element.setAttribute('stroke', object.stroke.color);
                element.setAttribute('stroke-width', object.stroke.width);
            }
        }

        return element;
    }

    generatePathData(points, isClosed) {
        if (!points || points.length < 2) return '';

        let pathData = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            if (point.type === 'curve') {
                pathData += ` C ${point.cp1x} ${point.cp1y}, ${point.cp2x} ${point.cp2y}, ${point.x} ${point.y}`;
            } else {
                pathData += ` L ${point.x} ${point.y}`;
            }
        }

        if (isClosed) {
            pathData += ' Z';
        }

        return pathData;
    }

    async exportToPDF(document, settings) {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({
            orientation: settings.orientation || 'portrait',
            unit: 'pt',
            format: settings.pageSize || 'a4'
        });

        // Set document properties
        if (document.metadata) {
            pdf.setProperties({
                title: document.metadata.title || 'Untitled',
                author: document.metadata.author || '',
                subject: document.metadata.subject || '',
                keywords: document.metadata.keywords || '',
                creator: 'Vector Graphics Editor'
            });
        }

        // Handle multi-page documents
        const pages = this.splitDocumentIntoPages(document, settings);
        for (let i = 0; i < pages.length; i++) {
            if (i > 0) pdf.addPage();
            await this.drawPageToPDF(pdf, pages[i], settings);
        }

        // Apply security settings
        if (settings.security) {
            this.applyPDFSecurity(pdf, settings.security);
        }

        // Apply digital signature if provided
        if (settings.signature) {
            await this.applyDigitalSignature(pdf, settings.signature);
        }

        // Apply compression if requested
        if (settings.compression) {
            pdf.compress = true;
        }

        return pdf.output('blob');
    }

    splitDocumentIntoPages(document, settings) {
        const pages = [];
        const pageSize = this.getPageSize(settings.pageSize);
        const pageWidth = pageSize.width;
        const pageHeight = pageSize.height;
        const margin = settings.margin || 40;

        // Calculate how many pages we need
        const cols = Math.ceil(document.width / (pageWidth - 2 * margin));
        const rows = Math.ceil(document.height / (pageHeight - 2 * margin));

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const page = {
                    width: pageWidth - 2 * margin,
                    height: pageHeight - 2 * margin,
                    objects: [],
                    metadata: document.metadata
                };

                // Filter objects that belong to this page
                page.objects = document.objects.filter(obj => {
                    const objRight = obj.x + (obj.width || 0);
                    const objBottom = obj.y + (obj.height || 0);
                    return (
                        obj.x >= col * pageWidth &&
                        objRight <= (col + 1) * pageWidth &&
                        obj.y >= row * pageHeight &&
                        objBottom <= (row + 1) * pageHeight
                    );
                });

                // Adjust object coordinates for this page
                page.objects = page.objects.map(obj => ({
                    ...obj,
                    x: obj.x - col * pageWidth,
                    y: obj.y - row * pageHeight
                }));

                pages.push(page);
            }
        }

        return pages;
    }

    getPageSize(format) {
        const sizes = {
            a4: { width: 595, height: 842 },
            letter: { width: 612, height: 792 },
            legal: { width: 612, height: 1008 }
        };
        return sizes[format] || sizes.a4;
    }

    async drawPageToPDF(pdf, page, settings) {
        // Calculate scaling to fit content on page
        const scale = Math.min(
            (page.width - 40) / page.width,
            (page.height - 40) / page.height
        );

        // Center content on page
        const offsetX = (page.width - page.width * scale) / 2;
        const offsetY = (page.height - page.height * scale) / 2;

        // Draw each object
        for (const obj of page.objects) {
            this.drawObjectToPDF(pdf, obj, scale, offsetX, offsetY);
        }
    }

    applyPDFSecurity(pdf, security) {
        const options = {
            userPassword: security.userPassword,
            ownerPassword: security.ownerPassword,
            permissions: security.permissions || {
                printing: 'high',
                modifying: false,
                copying: false,
                annotating: false,
                fillingForms: false,
                contentAccessibility: false,
                documentAssembly: false
            }
        };

        pdf.encrypt(options);
    }

    async applyDigitalSignature(pdf, signature) {
        const { PDFDocument } = await import('pdf-lib');
        const pdfBytes = await pdf.output('arraybuffer');
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // Add signature to PDF
        const signatureField = pdfDoc.getForm().createSignatureField('Signature');
        await signatureField.sign(signature.certificate, {
            reason: signature.reason,
            location: signature.location,
            contactInfo: signature.contactInfo,
            name: signature.name,
            date: new Date()
        });

        // Save the signed PDF
        const signedPdfBytes = await pdfDoc.save();
        return new Blob([signedPdfBytes], { type: 'application/pdf' });
    }

    async exportToAI(document, settings) {
        // Adobe Illustrator files are based on PDF format
        const pdf = await this.exportToPDF(document, settings);
        
        // Convert PDF to AI format
        const aiHeader = this.generateAIHeader(document);
        const aiContent = await this.convertPDFToAI(pdf);
        
        // Combine header and content
        const aiBlob = new Blob([aiHeader, aiContent], { type: 'application/postscript' });
        return aiBlob;
    }

    generateAIHeader(document) {
        const header = [
            '%!PS-Adobe-3.0',
            '%%Creator: Vector Graphics Editor',
            '%%Title: ' + (document.metadata?.title || 'Untitled'),
            '%%CreationDate: ' + new Date().toISOString(),
            '%%DocumentData: Clean7Bit',
            '%%LanguageLevel: 3',
            '%%Pages: 1',
            '%%BoundingBox: 0 0 ' + document.width + ' ' + document.height,
            '%%EndComments',
            '%%BeginProlog',
            '%%EndProlog',
            '%%BeginSetup',
            '%%EndSetup',
            '%%Page: 1 1',
            '%%BeginPageSetup',
            '%%EndPageSetup'
        ].join('\n') + '\n';

        return header;
    }

    async convertPDFToAI(pdfBlob) {
        // Convert PDF content to AI-compatible PostScript
        const pdfArrayBuffer = await pdfBlob.arrayBuffer();
        const pdfContent = new Uint8Array(pdfArrayBuffer);
        
        // Basic PDF to PostScript conversion
        // Note: This is a simplified conversion. A full implementation would require
        // a more sophisticated PDF parser and PostScript generator
        let psContent = '';
        const pdfText = new TextDecoder().decode(pdfContent);
        
        // Extract and convert PDF content
        const contentMatch = pdfText.match(/stream\n([\s\S]*?)\nendstream/);
        if (contentMatch) {
            psContent = this.convertPDFContentToPostScript(contentMatch[1]);
        }
        
        return psContent;
    }

    convertPDFContentToPostScript(pdfContent) {
        // Convert PDF content to PostScript commands
        // This is a simplified conversion that handles basic shapes and text
        let psCommands = '';
        
        // Split content into lines and convert each command
        const lines = pdfContent.split('\n');
        for (const line of lines) {
            if (line.includes('re')) {
                // Rectangle
                const [x, y, w, h] = line.split(' ').map(Number);
                psCommands += `${x} ${y} ${w} ${h} rect\n`;
            } else if (line.includes('m') && line.includes('l')) {
                // Path
                const points = line.split(' ').map(Number);
                psCommands += `${points[0]} ${points[1]} moveto\n`;
                for (let i = 2; i < points.length; i += 2) {
                    psCommands += `${points[i]} ${points[i + 1]} lineto\n`;
                }
            } else if (line.includes('Tf')) {
                // Text font
                const [font, size] = line.split(' ').map(Number);
                psCommands += `/${font} ${size} selectfont\n`;
            } else if (line.includes('Tj')) {
                // Text content
                const text = line.match(/\((.*?)\)/)?.[1] || '';
                psCommands += `(${text}) show\n`;
            }
        }
        
        return psCommands;
    }

    async exportToEPS(document, settings) {
        // EPS is a subset of PostScript
        const epsHeader = this.generateEPSHeader(document);
        const epsContent = await this.generateEPSContent(document);
        
        // Combine header and content
        const epsBlob = new Blob([epsHeader, epsContent], { type: 'application/postscript' });
        return epsBlob;
    }

    generateEPSHeader(document) {
        const header = [
            '%!PS-Adobe-3.0 EPSF-3.0',
            '%%Creator: Vector Graphics Editor',
            '%%Title: ' + (document.metadata?.title || 'Untitled'),
            '%%CreationDate: ' + new Date().toISOString(),
            '%%BoundingBox: 0 0 ' + document.width + ' ' + document.height,
            '%%HiResBoundingBox: 0 0 ' + document.width + ' ' + document.height,
            '%%DocumentData: Clean7Bit',
            '%%LanguageLevel: 3',
            '%%EndComments',
            '%%BeginProlog',
            '%%EndProlog',
            '%%BeginSetup',
            '%%EndSetup'
        ].join('\n') + '\n';

        return header;
    }

    async generateEPSContent(document) {
        let content = '';
        
        // Convert each object to EPS commands
        for (const obj of document.objects) {
            content += this.convertObjectToEPS(obj);
        }
        
        // Add trailer
        content += '%%Trailer\n';
        content += '%%EOF\n';
        
        return content;
    }

    convertObjectToEPS(object) {
        let commands = '';
        
        // Save graphics state
        commands += 'gsave\n';
        
        // Apply transformations
        if (object.transform) {
            const { x, y, rotation, scaleX, scaleY } = object.transform;
            if (x || y) commands += `${x || 0} ${y || 0} translate\n`;
            if (rotation) commands += `${rotation * 180 / Math.PI} rotate\n`;
            if (scaleX || scaleY) commands += `${scaleX || 1} ${scaleY || 1} scale\n`;
        }
        
        // Set colors
        if (object.fill) {
            const color = this.parseColor(object.fill);
            commands += `${color.r/255} ${color.g/255} ${color.b/255} setrgbcolor\n`;
        }
        if (object.stroke) {
            const color = this.parseColor(object.stroke.color);
            commands += `${color.r/255} ${color.g/255} ${color.b/255} setrgbcolor\n`;
            commands += `${object.stroke.width} setlinewidth\n`;
        }
        
        // Draw object
        switch (object.type) {
            case 'rectangle':
                commands += this.convertRectangleToEPS(object);
                break;
            case 'circle':
                commands += this.convertCircleToEPS(object);
                break;
            case 'ellipse':
                commands += this.convertEllipseToEPS(object);
                break;
            case 'path':
                commands += this.convertPathToEPS(object);
                break;
            case 'text':
                commands += this.convertTextToEPS(object);
                break;
        }
        
        // Restore graphics state
        commands += 'grestore\n';
        
        return commands;
    }

    convertRectangleToEPS(object) {
        let commands = '';
        commands += `newpath\n`;
        commands += `${object.x} ${object.y} moveto\n`;
        commands += `${object.width} 0 rlineto\n`;
        commands += `0 ${object.height} rlineto\n`;
        commands += `${-object.width} 0 rlineto\n`;
        commands += `closepath\n`;
        if (object.fill) commands += `fill\n`;
        if (object.stroke) commands += `stroke\n`;
        return commands;
    }

    convertCircleToEPS(object) {
        let commands = '';
        commands += `newpath\n`;
        commands += `${object.cx} ${object.cy} ${object.radius} 0 360 arc\n`;
        if (object.fill) commands += `fill\n`;
        if (object.stroke) commands += `stroke\n`;
        return commands;
    }

    convertEllipseToEPS(object) {
        let commands = '';
        commands += `newpath\n`;
        commands += `${object.cx} ${object.cy} ${object.rx} ${object.ry} 0 360 arc\n`;
        if (object.fill) commands += `fill\n`;
        if (object.stroke) commands += `stroke\n`;
        return commands;
    }

    convertPathToEPS(object) {
        if (!object.points || object.points.length < 2) return '';
        
        let commands = '';
        commands += `newpath\n`;
        commands += `${object.points[0].x} ${object.points[0].y} moveto\n`;
        
        for (let i = 1; i < object.points.length; i++) {
            const point = object.points[i];
            if (point.type === 'curve') {
                commands += `${point.cp1x} ${point.cp1y} ${point.cp2x} ${point.cp2y} ${point.x} ${point.y} curveto\n`;
            } else {
                commands += `${point.x} ${point.y} lineto\n`;
            }
        }
        
        if (object.isClosed) commands += `closepath\n`;
        if (object.fill) commands += `fill\n`;
        if (object.stroke) commands += `stroke\n`;
        
        return commands;
    }

    convertTextToEPS(object) {
        if (!object.text) return '';
        
        let commands = '';
        commands += `/${object.font?.family || 'Helvetica'} findfont\n`;
        commands += `${object.font?.size || 12} scalefont\n`;
        commands += `setfont\n`;
        commands += `${object.x} ${object.y} moveto\n`;
        commands += `(${object.text}) show\n`;
        
        return commands;
    }

    async exportToDXF(document, settings) {
        // DXF is a CAD format, so we'll focus on geometric shapes
        const dxfHeader = this.generateDXFHeader(document);
        const dxfContent = await this.generateDXFContent(document);
        const dxfFooter = this.generateDXFFooter();
        
        // Combine header, content, and footer
        const dxfBlob = new Blob([dxfHeader, dxfContent, dxfFooter], { type: 'application/dxf' });
        return dxfBlob;
    }

    generateDXFHeader(document) {
        const header = [
            '0',
            'SECTION',
            '2',
            'HEADER',
            '0',
            'ENDSEC',
            '0',
            'SECTION',
            '2',
            'TABLES',
            '0',
            'TABLE',
            '2',
            'LAYER',
            '70',
            '1',
            '0',
            'LAYER',
            '2',
            '0',
            '70',
            '0',
            '62',
            '7',
            '6',
            'CONTINUOUS',
            '0',
            'ENDTAB',
            '0',
            'ENDSEC',
            '0',
            'SECTION',
            '2',
            'ENTITIES'
        ].join('\n') + '\n';

        return header;
    }

    generateDXFFooter() {
        return [
            '0',
            'ENDSEC',
            '0',
            'EOF'
        ].join('\n') + '\n';
    }

    async generateDXFContent(document) {
        let content = '';
        
        // Convert each object to DXF entities
        for (const obj of document.objects) {
            content += this.convertObjectToDXF(obj);
        }
        
        return content;
    }

    convertObjectToDXF(object) {
        switch (object.type) {
            case 'rectangle':
                return this.convertRectangleToDXF(object);
            case 'circle':
                return this.convertCircleToDXF(object);
            case 'ellipse':
                return this.convertEllipseToDXF(object);
            case 'path':
                return this.convertPathToDXF(object);
            default:
                return '';
        }
    }

    convertRectangleToDXF(object) {
        const { x, y, width, height } = object;
        return [
            '0',
            'LWPOLYLINE',
            '8',
            '0',
            '90',
            '4',
            '70',
            '1',
            '10', x, '20', y,
            '10', x + width, '20', y,
            '10', x + width, '20', y + height,
            '10', x, '20', y + height,
            '10', x, '20', y
        ].join('\n') + '\n';
    }

    convertCircleToDXF(object) {
        const { cx, cy, radius } = object;
        return [
            '0',
            'CIRCLE',
            '8',
            '0',
            '10', cx, '20', cy, '30', 0,
            '40', radius
        ].join('\n') + '\n';
    }

    convertEllipseToDXF(object) {
        const { cx, cy, rx, ry, rotation } = object;
        return [
            '0',
            'ELLIPSE',
            '8',
            '0',
            '10', cx, '20', cy, '30', 0,
            '11', rx, '21', ry, '31', 0,
            '40', 0,
            '41', Math.PI * 2,
            '50', rotation || 0
        ].join('\n') + '\n';
    }

    convertPathToDXF(object) {
        if (!object.points || object.points.length < 2) return '';
        
        let content = [
            '0',
            'LWPOLYLINE',
            '8',
            '0',
            '90',
            object.points.length.toString(),
            '70',
            object.isClosed ? '1' : '0'
        ];
        
        for (const point of object.points) {
            content.push('10', point.x.toString(), '20', point.y.toString());
        }
        
        return content.join('\n') + '\n';
    }

    async exportSelection(selection, format, settings = {}) {
        try {
            this.validateFormat(format);
            const exportSettings = this.getExportSettings(format, settings);
            const tempDocument = {
                objects: Array.isArray(selection) ? selection : [],
                width: settings.width ?? 800,
                height: settings.height ?? 600,
                metadata: settings.metadata ?? {}
            };
            return await this.exportDocument(tempDocument, format, exportSettings);
        } catch (error) {
            ErrorHandler.handle(error, 'ExportService.exportSelection');
            throw error;
        }
    }

    async exportArtboard(artboard, format, settings = {}) {
        try {
            this.validateFormat(format);
            const exportSettings = this.getExportSettings(format, settings);
            const tempDocument = {
                objects: artboard?.objects || [],
                width: artboard?.width ?? 800,
                height: artboard?.height ?? 600,
                metadata: artboard?.metadata || {}
            };
            return await this.exportDocument(tempDocument, format, exportSettings);
        } catch (error) {
            ErrorHandler.handle(error, 'ExportService.exportArtboard');
            throw error;
        }
    }

    async exportLayers(layers, format, settings = {}) {
        try {
            this.validateFormat(format);
            const exportSettings = this.getExportSettings(format, settings);
            const objects = (layers || []).flatMap((layer) => layer?.objects || []);
            const tempDocument = {
                objects,
                width: settings.width ?? 800,
                height: settings.height ?? 600,
                metadata: settings.metadata ?? {}
            };
            return await this.exportDocument(tempDocument, format, exportSettings);
        } catch (error) {
            ErrorHandler.handle(error, 'ExportService.exportLayers');
            throw error;
        }
    }

    async exportWithMetadata(document, format, metadata, settings = {}) {
        try {
            this.validateFormat(format);
            const exportSettings = this.getExportSettings(format, {
                ...settings,
                metadata
            });
            
            return await this.exportDocument(document, format, exportSettings);
        } catch (error) {
            ErrorHandler.handle(error, 'ExportService.exportWithMetadata');
            throw error;
        }
    }

    async exportWithCompression(document, format, compressionSettings, settings = {}) {
        try {
            this.validateFormat(format);
            const exportSettings = this.getExportSettings(format, {
                ...settings,
                compression: compressionSettings
            });
            
            return await this.exportDocument(document, format, exportSettings);
        } catch (error) {
            ErrorHandler.handle(error, 'ExportService.exportWithCompression');
            throw error;
        }
    }

    async exportWithWatermark(document, format, watermark, settings = {}) {
        try {
            this.validateFormat(format);
            const exportSettings = this.getExportSettings(format, {
                ...settings,
                watermark
            });
            
            return await this.exportDocument(document, format, exportSettings);
        } catch (error) {
            ErrorHandler.handle(error, 'ExportService.exportWithWatermark');
            throw error;
        }
    }

    async exportWithPreview(document, format, previewSettings, settings = {}) {
        try {
            this.validateFormat(format);
            const exportSettings = this.getExportSettings(format, {
                ...settings,
                preview: previewSettings
            });
            
            return await this.exportDocument(document, format, exportSettings);
        } catch (error) {
            ErrorHandler.handle(error, 'ExportService.exportWithPreview');
            throw error;
        }
    }

    async exportWithPreset(document, format, preset, settings = {}) {
        try {
            this.validateFormat(format);
            const exportSettings = this.getExportSettings(format, {
                ...settings,
                preset
            });
            
            return await this.exportDocument(document, format, exportSettings);
        } catch (error) {
            ErrorHandler.handle(error, 'ExportService.exportWithPreset');
            throw error;
        }
    }

    async exportWithQuality(document, format, quality, settings = {}) {
        try {
            this.validateFormat(format);
            const exportSettings = this.getExportSettings(format, {
                ...settings,
                quality
            });
            
            return await this.exportDocument(document, format, exportSettings);
        } catch (error) {
            ErrorHandler.handle(error, 'ExportService.exportWithQuality');
            throw error;
        }
    }
}

export default new ExportService(); 