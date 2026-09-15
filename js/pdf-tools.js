/**
 * PDF Processing Module
 * 100% Client-side PDF manipulation using PDF-Lib, PDF.js, and JSZip.
 */

import { readFileAsArrayBuffer, getBaseFilename } from './file-utils.js';

/**
 * Ensures PDFLib is loaded from global scope
 */
function ensurePdfLib() {
    if (typeof window.PDFLib === 'undefined') {
        throw new Error('PDF-Lib is not loaded. Please check your internet connection or CDN availability.');
    }
    return window.PDFLib;
}

/**
 * Ensures PDFJS is loaded from global scope
 */
function ensurePdfJs() {
    if (typeof window.pdfjsLib === 'undefined') {
        throw new Error('PDF.js is not loaded. Please check your internet connection or CDN availability.');
    }
    return window.pdfjsLib;
}

/**
 * Ensures JSZip is loaded from global scope
 */
function ensureJSZip() {
    if (typeof window.JSZip === 'undefined') {
        throw new Error('JSZip is not loaded. Please check your internet connection or CDN availability.');
    }
    return window.JSZip;
}

/**
 * Merge multiple PDF files in sequential order
 * @param {File[]} pdfFiles - Ordered array of PDF File objects
 * @returns {Promise<{ blob: Blob, filename: string, pageCount: number }>}
 */
export async function mergePdfs(pdfFiles) {
    if (!pdfFiles || pdfFiles.length < 2) {
        throw new Error('Please upload at least 2 PDF files to merge.');
    }

    const { PDFDocument } = ensurePdfLib();
    const mergedDoc = await PDFDocument.create();
    let totalPages = 0;

    for (const file of pdfFiles) {
        const buffer = await readFileAsArrayBuffer(file);
        const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const pageIndices = sourceDoc.getPageIndices();
        const copiedPages = await mergedDoc.copyPages(sourceDoc, pageIndices);
        
        for (const page of copiedPages) {
            mergedDoc.addPage(page);
            totalPages++;
        }
    }

    const mergedBytes = await mergedDoc.save();
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const filename = `merged-${Date.now()}.pdf`;

    return {
        blob,
        filename,
        pageCount: totalPages
    };
}

/**
 * Split or extract specific pages from a PDF
 * @param {File} pdfFile
 * @param {string} rangeExpression - E.g. "1, 3-5, 8" (1-indexed)
 * @returns {Promise<{ blob: Blob, filename: string, pageCount: number }>}
 */
export async function splitPdf(pdfFile, rangeExpression) {
    if (!pdfFile) throw new Error('No PDF file provided.');
    if (!rangeExpression || !rangeExpression.trim()) {
        throw new Error('Please specify page numbers or ranges (e.g. 1-3, 5).');
    }

    const { PDFDocument } = ensurePdfLib();
    const buffer = await readFileAsArrayBuffer(pdfFile);
    const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const totalPages = sourceDoc.getPageCount();

    const selectedIndices = parsePageRanges(rangeExpression, totalPages);
    if (selectedIndices.length === 0) {
        throw new Error(`No valid pages match the requested range within this ${totalPages}-page document.`);
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(sourceDoc, selectedIndices);
    copiedPages.forEach(p => newDoc.addPage(p));

    const pdfBytes = await newDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const base = getBaseFilename(pdfFile.name);

    return {
        blob,
        filename: `${base}-extracted.pdf`,
        pageCount: selectedIndices.length
    };
}

/**
 * Rotate pages of a PDF
 * @param {File} pdfFile
 * @param {number} degrees - 90, 180, or 270 clockwise
 * @param {string} [pageSelection] - 'all' | 'odd' | 'even' | custom range string
 * @returns {Promise<{ blob: Blob, filename: string, pageCount: number }>}
 */
export async function rotatePdf(pdfFile, degrees = 90, pageSelection = 'all') {
    if (!pdfFile) throw new Error('No PDF file provided.');

    const { PDFDocument, degrees: pdfDegrees } = ensurePdfLib();
    const buffer = await readFileAsArrayBuffer(pdfFile);
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pages = doc.getPages();
    const totalPages = pages.length;

    let targetIndices = [];
    if (pageSelection === 'all') {
        targetIndices = pages.map((_, i) => i);
    } else if (pageSelection === 'odd') {
        targetIndices = pages.map((_, i) => i).filter(i => (i + 1) % 2 !== 0);
    } else if (pageSelection === 'even') {
        targetIndices = pages.map((_, i) => i).filter(i => (i + 1) % 2 === 0);
    } else {
        targetIndices = parsePageRanges(pageSelection, totalPages);
    }

    targetIndices.forEach(idx => {
        if (idx >= 0 && idx < totalPages) {
            const page = pages[idx];
            const currentRotation = page.getRotation().angle;
            page.setRotation(pdfDegrees((currentRotation + degrees) % 360));
        }
    });

    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const base = getBaseFilename(pdfFile.name);

    return {
        blob,
        filename: `${base}-rotated.pdf`,
        pageCount: totalPages
    };
}

/**
 * Convert PDF pages to JPG or PNG images using PDF.js
 * @param {File} pdfFile
 * @param {Object} options
 * @param {string} [options.format='image/png'] - 'image/png' | 'image/jpeg'
 * @param {number} [options.scale=2.0] - Render resolution multiplier (2.0 = crisp 144 DPI)
 * @param {function} [options.onProgress] - Callback (currentPage, totalPages)
 * @returns {Promise<{ pages: Array<{ pageNumber: number, blob: Blob, dataUrl: string }>, zipBlob: Blob|null, filename: string }>}
 */
export async function pdfToImages(pdfFile, options = {}) {
    const pdfjs = ensurePdfJs();
    const format = options.format || 'image/png';
    const scale = options.scale || 1.8;
    const onProgress = options.onProgress || (() => {});

    // Set worker src to local bundle with fallback
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = '../libraries/pdf.worker.min.js';
    }

    const buffer = await readFileAsArrayBuffer(pdfFile);
    const loadingTask = pdfjs.getDocument({ data: buffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const pages = [];
    const base = getBaseFilename(pdfFile.name);
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (format === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;

        const blob = await new Promise(resolve => canvas.toBlob(resolve, format, 0.92));
        const dataUrl = canvas.toDataURL(format, 0.85);

        pages.push({
            pageNumber: pageNum,
            blob,
            dataUrl,
            filename: `${base}-page-${pageNum}.${ext}`
        });

        onProgress(pageNum, numPages);
    }

    // If multiple pages, generate a ZIP archive using JSZip
    let zipBlob = null;
    if (pages.length > 1) {
        try {
            const JSZip = ensureJSZip();
            const zip = new JSZip();
            const folder = zip.folder(`${base}-images`);

            pages.forEach(p => {
                folder.file(p.filename, p.blob);
            });

            zipBlob = await zip.generateAsync({ type: 'blob' });
        } catch (zipErr) {
            console.warn('Zip creation failed:', zipErr);
        }
    }

    return {
        pages,
        zipBlob,
        filename: zipBlob ? `${base}-images.zip` : pages[0].filename
    };
}

/**
 * Convert plain text to a cleanly paginated PDF
 * @param {string} text
 * @param {string} [title='Document']
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export async function txtToPdf(text, title = 'Document') {
    const { PDFDocument, StandardFonts, rgb } = ensurePdfLib();
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const lineHeight = 16;
    const margin = 50;
    const pageWidth = 595.28;  // A4
    const pageHeight = 841.89; // A4
    const maxLineWidth = pageWidth - (margin * 2);

    const lines = text.split(/\r\n|\r|\n/);
    const wrappedLines = [];

    lines.forEach(rawLine => {
        if (!rawLine.trim()) {
            wrappedLines.push('');
            return;
        }

        const words = rawLine.split(' ');
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize);
            if (testWidth > maxLineWidth) {
                wrappedLines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine) {
            wrappedLines.push(currentLine);
        }
    });

    const linesPerPage = Math.floor((pageHeight - (margin * 2)) / lineHeight);
    let currentPage = doc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;

    wrappedLines.forEach(line => {
        if (currentY < margin + lineHeight) {
            currentPage = doc.addPage([pageWidth, pageHeight]);
            currentY = pageHeight - margin;
        }

        if (line) {
            currentPage.drawText(line, {
                x: margin,
                y: currentY,
                size: fontSize,
                font: font,
                color: rgb(0.15, 0.15, 0.2)
            });
        }
        currentY -= lineHeight;
    });

    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const safeTitle = getBaseFilename(title);

    return {
        blob,
        filename: `${safeTitle}.pdf`
    };
}

/**
 * Helper to parse range expression like "1, 3-5, 8" into 0-indexed page indices
 * @param {string} expression
 * @param {number} totalPages
 * @returns {number[]}
 */
function parsePageRanges(expression, totalPages) {
    const indices = new Set();
    const parts = expression.split(',').map(s => s.trim()).filter(Boolean);

    parts.forEach(part => {
        if (part.includes('-')) {
            const [startStr, endStr] = part.split('-').map(s => s.trim());
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            if (!isNaN(start) && !isNaN(end)) {
                const low = Math.max(1, Math.min(start, end));
                const high = Math.min(totalPages, Math.max(start, end));
                for (let i = low; i <= high; i++) {
                    indices.add(i - 1);
                }
            }
        } else {
            const num = parseInt(part, 10);
            if (!isNaN(num) && num >= 1 && num <= totalPages) {
                indices.add(num - 1);
            }
        }
    });

    return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Convert one or multiple JPG/PNG images to a single PDF document
 * @param {File[]} imageFiles
 * @param {Object} [options]
 * @param {string} [options.pageSize='A4']
 * @param {number} [options.margin=20]
 * @returns {Promise<{ blob: Blob, filename: string, pageCount: number }>}
 */
export async function jpgToPdf(imageFiles, options = {}) {
    if (!imageFiles || imageFiles.length === 0) {
        throw new Error('Please select at least one image file.');
    }

    const { PDFDocument } = ensurePdfLib();
    const doc = await PDFDocument.create();
    const margin = options.margin !== undefined ? options.margin : 20;

    for (const file of imageFiles) {
        const buffer = await readFileAsArrayBuffer(file);
        let embeddedImage;

        if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
            embeddedImage = await doc.embedPng(buffer);
        } else {
            embeddedImage = await doc.embedJpg(buffer);
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        // Standard A4 dimensions in points: 595.28 x 841.89
        const pageWidth = 595.28;
        const pageHeight = 841.89;

        const maxW = pageWidth - (margin * 2);
        const maxH = pageHeight - (margin * 2);

        const scale = Math.min(maxW / imgWidth, maxH / imgHeight, 1.0);
        const drawW = imgWidth * scale;
        const drawH = imgHeight * scale;

        const x = margin + (maxW - drawW) / 2;
        const y = margin + (maxH - drawH) / 2;

        const page = doc.addPage([pageWidth, pageHeight]);
        page.drawImage(embeddedImage, {
            x,
            y,
            width: drawW,
            height: drawH
        });
    }

    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const filename = `images-${Date.now()}.pdf`;

    return {
        blob,
        filename,
        pageCount: imageFiles.length
    };
}

/**
 * Delete specific pages from a PDF document
 * @param {File} pdfFile
 * @param {number[]} pagesToDelete - 1-indexed page numbers
 * @returns {Promise<{ blob: Blob, filename: string, remainingPages: number }>}
 */
export async function deletePdfPages(pdfFile, pagesToDelete) {
    if (!pdfFile) throw new Error('No PDF file provided.');
    if (!pagesToDelete || pagesToDelete.length === 0) {
        throw new Error('Please select at least one page to delete.');
    }

    const { PDFDocument } = ensurePdfLib();
    const buffer = await readFileAsArrayBuffer(pdfFile);
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const totalPages = doc.getPageCount();

    // Sort descending so deletion doesn't shift earlier indices
    const indicesToDelete = Array.from(new Set(pagesToDelete.map(p => p - 1)))
        .filter(idx => idx >= 0 && idx < totalPages)
        .sort((a, b) => b - a);

    if (indicesToDelete.length >= totalPages) {
        throw new Error('Cannot delete all pages from the PDF document.');
    }

    indicesToDelete.forEach(idx => {
        doc.removePage(idx);
    });

    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const base = getBaseFilename(pdfFile.name);

    return {
        blob,
        filename: `${base}-deleted-pages.pdf`,
        remainingPages: doc.getPageCount()
    };
}

/**
 * Client-Side PDF Stream Compression
 * Re-serializes the PDF document with object stream compression
 * @param {File} pdfFile
 * @returns {Promise<{ blob: Blob, filename: string, originalSize: number, compressedSize: number }>}
 */
export async function compressPdf(pdfFile) {
    const { PDFDocument } = ensurePdfLib();
    const buffer = await readFileAsArrayBuffer(pdfFile);
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

    // Save with useObjectStreams to consolidate cross-reference tables and streams
    const compressedBytes = await doc.save({ useObjectStreams: true });
    const blob = new Blob([compressedBytes], { type: 'application/pdf' });
    const base = getBaseFilename(pdfFile.name);

    return {
        blob,
        filename: `${base}-compressed.pdf`,
        originalSize: pdfFile.size,
        compressedSize: blob.size
    };
}

/**
 * Reorder pages of a PDF document
 * @param {File} pdfFile
 * @param {number[]} newPageOrder - Array of 1-based page numbers in desired sequence (e.g. [3, 1, 2])
 * @returns {Promise<{ blob: Blob, filename: string, pageCount: number }>}
 */
export async function reorderPdfPages(pdfFile, newPageOrder) {
    if (!pdfFile) throw new Error('No PDF file provided.');
    if (!newPageOrder || newPageOrder.length === 0) {
        throw new Error('Please provide the new page order.');
    }

    const { PDFDocument } = ensurePdfLib();
    const buffer = await readFileAsArrayBuffer(pdfFile);
    const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const totalPages = sourceDoc.getPageCount();

    const targetIndices = newPageOrder
        .map(p => p - 1)
        .filter(idx => idx >= 0 && idx < totalPages);

    if (targetIndices.length === 0) {
        throw new Error('No valid pages were specified in the reorder list.');
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(sourceDoc, targetIndices);
    copiedPages.forEach(p => newDoc.addPage(p));

    const pdfBytes = await newDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const base = getBaseFilename(pdfFile.name);

    return {
        blob,
        filename: `${base}-reordered.pdf`,
        pageCount: targetIndices.length
    };
}

