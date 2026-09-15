/**
 * Document Processing Module
 * Handles client-side PDF to DOCX, DOCX to PDF, DOCX to TXT, and DOCX to HTML.
 * Uses docx (UMD), mammoth (browser bundle), PDF.js, and PDF-Lib.
 */

import { readFileAsArrayBuffer, getBaseFilename } from './file-utils.js';

function ensureDocx() {
    if (typeof window.docx === 'undefined') {
        throw new Error('docx library is not loaded. Please ensure libraries/docx.umd.js is present.');
    }
    return window.docx;
}

function ensureMammoth() {
    if (typeof window.mammoth === 'undefined') {
        throw new Error('mammoth library is not loaded. Please ensure libraries/mammoth.browser.min.js is present.');
    }
    return window.mammoth;
}

function ensurePdfJs() {
    if (typeof window.pdfjsLib === 'undefined') {
        throw new Error('PDF.js is not loaded.');
    }
    if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = '../libraries/pdf.worker.min.js';
    }
    return window.pdfjsLib;
}

function ensurePdfLib() {
    if (typeof window.PDFLib === 'undefined') {
        throw new Error('PDF-Lib is not loaded.');
    }
    return window.PDFLib;
}

/**
 * Genuine PDF to Word (DOCX) Conversion
 * Extracts structured text and paragraphs from PDF using PDF.js
 * and constructs a real OpenXML DOCX file using docx library.
 * @param {File} pdfFile
 * @param {function} [onProgress]
 * @returns {Promise<{ blob: Blob, filename: string, pageCount: number, paragraphCount: number }>}
 */
export async function pdfToWord(pdfFile, onProgress = () => {}) {
    const pdfjs = ensurePdfJs();
    const docxLib = ensureDocx();
    const buffer = await readFileAsArrayBuffer(pdfFile);

    const loadingTask = pdfjs.getDocument({ data: buffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const docxParagraphs = [];
    let totalParagraphs = 0;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        onProgress(pageNum, numPages);
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Group text items by vertical line position (Y coordinate)
        const linesMap = new Map();
        textContent.items.forEach(item => {
            const y = Math.round(item.transform[5]); // Y coordinate
            if (!linesMap.has(y)) {
                linesMap.set(y, []);
            }
            linesMap.get(y).push(item.str);
        });

        // Sort descending by Y (top to bottom of page)
        const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);

        sortedY.forEach(y => {
            const lineText = linesMap.get(y).join(' ').trim();
            if (lineText) {
                docxParagraphs.push(
                    new docxLib.Paragraph({
                        children: [
                            new docxLib.TextRun({
                                text: lineText,
                                font: 'Calibri',
                                size: 22 // 11pt
                            })
                        ],
                        spacing: { after: 120 }
                    })
                );
                totalParagraphs++;
            }
        });

        // Add page break between pages (except after last page)
        if (pageNum < numPages) {
            docxParagraphs.push(
                new docxLib.Paragraph({
                    children: [new docxLib.TextRun({ text: '', break: 1 })]
                })
            );
        }
    }

    // Create real DOCX document
    const doc = new docxLib.Document({
        sections: [
            {
                properties: {},
                children: docxParagraphs.length > 0 ? docxParagraphs : [
                    new docxLib.Paragraph({
                        children: [new docxLib.TextRun('Document content extracted from PDF.')]
                    })
                ]
            }
        ]
    });

    const docxBlob = await docxLib.Packer.toBlob(doc);
    const base = getBaseFilename(pdfFile.name);

    return {
        blob: docxBlob,
        filename: `${base}.docx`,
        pageCount: numPages,
        paragraphCount: totalParagraphs
    };
}

/**
 * Word (DOCX) to PDF Conversion
 * Reads DOCX contents using Mammoth and formats into an A4 PDF using PDF-Lib.
 * @param {File} docxFile
 * @returns {Promise<{ blob: Blob, filename: string, pageCount: number }>}
 */
export async function wordToPdf(docxFile) {
    const mammoth = ensureMammoth();
    const { PDFDocument, StandardFonts, rgb } = ensurePdfLib();

    const buffer = await readFileAsArrayBuffer(docxFile);
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const text = result.value || '';

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const lineHeight = 16;
    const margin = 50;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
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

    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;
    let pageCount = 1;

    wrappedLines.forEach(line => {
        if (currentY < margin + lineHeight) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            currentY = pageHeight - margin;
            pageCount++;
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

    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const base = getBaseFilename(docxFile.name);

    return {
        blob: pdfBlob,
        filename: `${base}.pdf`,
        pageCount
    };
}

/**
 * Word (DOCX) to Plain Text (TXT)
 * @param {File} docxFile
 * @returns {Promise<{ blob: Blob, text: string, filename: string }>}
 */
export async function wordToTxt(docxFile) {
    const mammoth = ensureMammoth();
    const buffer = await readFileAsArrayBuffer(docxFile);
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const text = result.value || '';

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const base = getBaseFilename(docxFile.name);

    return {
        blob,
        text,
        filename: `${base}.txt`
    };
}

/**
 * Word (DOCX) to Semantic HTML
 * @param {File} docxFile
 * @returns {Promise<{ blob: Blob, html: string, filename: string }>}
 */
export async function wordToHtml(docxFile) {
    const mammoth = ensureMammoth();
    const buffer = await readFileAsArrayBuffer(docxFile);
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    const html = result.value || '';

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${getBaseFilename(docxFile.name)}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #333; }
        p { margin-bottom: 1rem; }
    </style>
</head>
<body>
${html}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const base = getBaseFilename(docxFile.name);

    return {
        blob,
        html,
        filename: `${base}.html`
    };
}
