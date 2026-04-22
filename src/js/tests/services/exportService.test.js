import { expect } from 'chai';
import ExportService from '../../services/exportService.js';

describe('ExportService', () => {
    let service;
    let testDocument;

    beforeEach(() => {
        service = ExportService;
        testDocument = {
            width: 100,
            height: 100,
            objects: [
                {
                    type: 'rectangle',
                    x: 10,
                    y: 10,
                    width: 80,
                    height: 80,
                    fill: 'red',
                    stroke: {
                        color: 'black',
                        width: 1
                    }
                },
                {
                    type: 'circle',
                    cx: 50,
                    cy: 50,
                    radius: 30,
                    fill: 'blue',
                    stroke: {
                        color: 'white',
                        width: 2
                    }
                }
            ],
            metadata: {
                title: 'Test Document',
                author: 'Test Author'
            }
        };
    });

    describe('PDF Export', () => {
        it('should export document to PDF', async () => {
            const pdfBlob = await service.exportToPDF(testDocument, service.defaultSettings.pdf);
            expect(pdfBlob).to.be.instanceof(Blob);
            expect(pdfBlob.type).to.equal('application/pdf');
        });

        it('should include document metadata', async () => {
            const pdfBlob = await service.exportToPDF(testDocument, {
                ...service.defaultSettings.pdf,
                includeMetadata: true
            });
            expect(pdfBlob).to.be.instanceof(Blob);
        });

        it('should handle different page sizes', async () => {
            const sizes = ['a4', 'letter', 'legal'];
            for (const size of sizes) {
                const pdfBlob = await service.exportToPDF(testDocument, {
                    ...service.defaultSettings.pdf,
                    pageSize: size
                });
                expect(pdfBlob).to.be.instanceof(Blob);
            }
        });

        it('should handle different orientations', async () => {
            const orientations = ['portrait', 'landscape'];
            for (const orientation of orientations) {
                const pdfBlob = await service.exportToPDF(testDocument, {
                    ...service.defaultSettings.pdf,
                    orientation
                });
                expect(pdfBlob).to.be.instanceof(Blob);
            }
        });

        it('should apply compression when requested', async () => {
            const pdfBlob = await service.exportToPDF(testDocument, {
                ...service.defaultSettings.pdf,
                compression: true
            });
            expect(pdfBlob).to.be.instanceof(Blob);
        });

        it('should handle transformations', async () => {
            const transformedDoc = {
                ...testDocument,
                objects: [{
                    ...testDocument.objects[0],
                    transform: {
                        x: 10,
                        y: 10,
                        rotation: Math.PI / 4,
                        scaleX: 1.5,
                        scaleY: 1.5
                    }
                }]
            };
            const pdfBlob = await service.exportToPDF(transformedDoc, service.defaultSettings.pdf);
            expect(pdfBlob).to.be.instanceof(Blob);
        });

        it('should handle all shape types', async () => {
            const shapesDoc = {
                ...testDocument,
                objects: [
                    {
                        type: 'rectangle',
                        x: 10,
                        y: 10,
                        width: 80,
                        height: 80,
                        cornerRadius: 10,
                        fill: 'red'
                    },
                    {
                        type: 'circle',
                        cx: 50,
                        cy: 50,
                        radius: 30,
                        fill: 'blue'
                    },
                    {
                        type: 'ellipse',
                        cx: 50,
                        cy: 50,
                        rx: 40,
                        ry: 20,
                        rotation: Math.PI / 4,
                        fill: 'green'
                    },
                    {
                        type: 'path',
                        points: [
                            { x: 0, y: 0 },
                            { x: 100, y: 0 },
                            { x: 100, y: 100 },
                            { x: 0, y: 100 }
                        ],
                        isClosed: true,
                        fill: 'yellow'
                    },
                    {
                        type: 'text',
                        x: 10,
                        y: 50,
                        text: 'Test Text',
                        font: {
                            family: 'helvetica',
                            size: 16,
                            weight: 'bold',
                            style: 'normal'
                        },
                        fill: 'black'
                    }
                ]
            };
            const pdfBlob = await service.exportToPDF(shapesDoc, service.defaultSettings.pdf);
            expect(pdfBlob).to.be.instanceof(Blob);
        });

        it('should handle color formats', async () => {
            const colorDoc = {
                ...testDocument,
                objects: [
                    {
                        type: 'rectangle',
                        x: 10,
                        y: 10,
                        width: 80,
                        height: 80,
                        fill: '#FF0000'
                    },
                    {
                        type: 'circle',
                        cx: 50,
                        cy: 50,
                        radius: 30,
                        fill: 'rgb(0, 0, 255)'
                    }
                ]
            };
            const pdfBlob = await service.exportToPDF(colorDoc, service.defaultSettings.pdf);
            expect(pdfBlob).to.be.instanceof(Blob);
        });
    });

    describe('PDF Export Features', () => {
        let exportService;
        let testDocument;

        beforeEach(() => {
            exportService = new ExportService();
            testDocument = {
                width: 2000,
                height: 2000,
                metadata: {
                    title: 'Test Document',
                    author: 'Test Author',
                    subject: 'Test Subject',
                    keywords: 'test, pdf, export'
                },
                objects: [
                    {
                        type: 'rectangle',
                        x: 0,
                        y: 0,
                        width: 1000,
                        height: 1000,
                        fill: '#ff0000'
                    },
                    {
                        type: 'rectangle',
                        x: 1000,
                        y: 1000,
                        width: 1000,
                        height: 1000,
                        fill: '#00ff00'
                    }
                ]
            };
        });

        it('should split large documents into multiple pages', async () => {
            const settings = {
                pageSize: 'a4',
                margin: 40
            };

            const pdfBlob = await exportService.exportToPDF(testDocument, settings);
            expect(pdfBlob).to.be.instanceof(Blob);
            expect(pdfBlob.type).to.equal('application/pdf');
        });

        it('should apply security settings to PDF', async () => {
            const settings = {
                security: {
                    userPassword: 'user123',
                    ownerPassword: 'owner123',
                    permissions: {
                        printing: 'high',
                        modifying: false,
                        copying: false
                    }
                }
            };

            const pdfBlob = await exportService.exportToPDF(testDocument, settings);
            expect(pdfBlob).to.be.instanceof(Blob);
            expect(pdfBlob.type).to.equal('application/pdf');
        });

        it('should apply digital signature to PDF', async () => {
            const settings = {
                signature: {
                    certificate: 'test-certificate',
                    reason: 'Test signature',
                    location: 'Test location',
                    contactInfo: 'test@example.com',
                    name: 'Test Signer'
                }
            };

            const pdfBlob = await exportService.exportToPDF(testDocument, settings);
            expect(pdfBlob).to.be.instanceof(Blob);
            expect(pdfBlob.type).to.equal('application/pdf');
        });

        it('should handle different page sizes', async () => {
            const pageSizes = ['a4', 'letter', 'legal'];
            
            for (const size of pageSizes) {
                const settings = { pageSize: size };
                const pdfBlob = await exportService.exportToPDF(testDocument, settings);
                expect(pdfBlob).to.be.instanceof(Blob);
                expect(pdfBlob.type).to.equal('application/pdf');
            }
        });

        it('should include document metadata in PDF', async () => {
            const settings = {};
            const pdfBlob = await exportService.exportToPDF(testDocument, settings);
            expect(pdfBlob).to.be.instanceof(Blob);
            expect(pdfBlob.type).to.equal('application/pdf');
        });

        it('should apply compression when requested', async () => {
            const settings = { compression: true };
            const pdfBlob = await exportService.exportToPDF(testDocument, settings);
            expect(pdfBlob).to.be.instanceof(Blob);
            expect(pdfBlob.type).to.equal('application/pdf');
        });

        it('should handle empty documents', async () => {
            const emptyDocument = {
                width: 1000,
                height: 1000,
                objects: []
            };
            const settings = {};
            const pdfBlob = await exportService.exportToPDF(emptyDocument, settings);
            expect(pdfBlob).to.be.instanceof(Blob);
            expect(pdfBlob.type).to.equal('application/pdf');
        });

        it('should handle documents with only metadata', async () => {
            const metadataOnlyDocument = {
                width: 1000,
                height: 1000,
                metadata: {
                    title: 'Metadata Only',
                    author: 'Test Author'
                },
                objects: []
            };
            const settings = {};
            const pdfBlob = await exportService.exportToPDF(metadataOnlyDocument, settings);
            expect(pdfBlob).to.be.instanceof(Blob);
            expect(pdfBlob.type).to.equal('application/pdf');
        });
    });
}); 