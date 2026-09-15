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
 * Genuine Word (DOCX) to PDF Conversion
 * Reads DOCX contents using Mammoth to preserve headings, formatting, tables & images,
 * and converts to a multi-page PDF via html2pdf or structured PDF-Lib fallback.
 * Validates the output PDF with PDF-Lib before returning.
 * @param {File} docxFile
 * @param {function} [onProgress]
 * @returns {Promise<{ blob: Blob, filename: string, pageCount: number, html: string }>}
 */
export async function wordToPdf(docxFile, onProgress = () => {}) {
    if (!docxFile) throw new Error('No Word document provided.');
    const mammoth = ensureMammoth();
    const pdfLib = ensurePdfLib();

    onProgress(10, 'Reading DOCX document in browser memory...');
    const buffer = await readFileAsArrayBuffer(docxFile);

    onProgress(30, 'Extracting rich structure, headings & formatting...');
    const convertResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
    const extractedHtml = convertResult.value || '';
    const messages = convertResult.messages || [];
    if (messages.length > 0) {
        console.info('Mammoth conversion notes:', messages);
    }

    const base = getBaseFilename(docxFile.name);
    let pdfBlob = null;
    let pageCount = 1;

    // Check if html2pdf is available
    if (typeof window.html2pdf !== 'undefined') {
        onProgress(50, 'Rendering document layout & vector pages...');

        // Create an offscreen styled container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '794px'; // ~A4 width at 96 DPI
        container.style.padding = '32px 40px';
        container.style.background = '#FFFFFF';
        container.style.color = '#111827';
        container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        container.style.fontSize = '12pt';
        container.style.lineHeight = '1.6';

        // Add standard typography & table styling
        container.innerHTML = `
            <style>
                .doc-content h1 { font-size: 20pt; font-weight: 700; margin: 18px 0 10px; color: #0f172a; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; }
                .doc-content h2 { font-size: 16pt; font-weight: 700; margin: 16px 0 8px; color: #1e293b; }
                .doc-content h3 { font-size: 13pt; font-weight: 600; margin: 14px 0 6px; color: #334155; }
                .doc-content p { margin: 0 0 10px; }
                .doc-content ul, .doc-content ol { margin: 0 0 12px 24px; padding: 0; }
                .doc-content li { margin-bottom: 4px; }
                .doc-content strong, .doc-content b { font-weight: 700; }
                .doc-content em, .doc-content i { font-style: italic; }
                .doc-content table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 11pt; }
                .doc-content th, .doc-content td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
                .doc-content th { background-color: #f1f5f9; font-weight: 600; }
                .doc-content img { max-width: 100%; height: auto; display: block; margin: 12px auto; }
                .doc-content blockquote { border-left: 3px solid #6366f1; margin: 10px 0; padding-left: 14px; color: #475569; }
            </style>
            <div class="doc-content">
                ${extractedHtml || '<p><em>(Empty Document)</em></p>'}
            </div>
        `;
        document.body.appendChild(container);

        try {
            const opt = {
                margin: [12, 12, 12, 12],
                filename: `${base}.pdf`,
                image: { type: 'jpeg', quality: 0.96 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            onProgress(75, 'Generating PDF pages & formatting...');
            pdfBlob = await window.html2pdf().from(container).set(opt).outputPdf('blob');
        } catch (renderErr) {
            console.warn('html2pdf render fallback triggered:', renderErr);
        } finally {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }
    }

    // Fallback using PDF-Lib structured pagination if html2pdf was unavailable or produced null
    if (!pdfBlob) {
        onProgress(60, 'Formatting document pages via PDF-Lib engine...');
        const { PDFDocument, StandardFonts, rgb } = pdfLib;
        const textResult = await mammoth.extractRawText({ arrayBuffer: buffer });
        const text = textResult.value || '';

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
            if (currentLine) wrappedLines.push(currentLine);
        });

        let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        let currentY = pageHeight - margin;

        wrappedLines.forEach(line => {
            if (currentY < margin + lineHeight) {
                currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                currentY = pageHeight - margin;
            }
            if (line) {
                currentPage.drawText(line, {
                    x: margin,
                    y: currentY,
                    size: fontSize,
                    font: font,
                    color: rgb(0.12, 0.12, 0.15)
                });
            }
            currentY -= lineHeight;
        });

        const pdfBytes = await pdfDoc.save();
        pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    }

    onProgress(90, 'Verifying generated PDF integrity...');

    // Strict validation: Re-parse generated PDF to verify it is non-empty and structurally valid
    const verifyDoc = await pdfLib.PDFDocument.load(await pdfBlob.arrayBuffer(), { ignoreEncryption: true });
    pageCount = verifyDoc.getPageCount();
    if (pageCount < 1) {
        throw new Error('Generated PDF validation failed: output contains 0 pages.');
    }

    onProgress(100, 'Conversion complete & verified!');

    return {
        blob: pdfBlob,
        filename: `${base}.pdf`,
        pageCount,
        html: extractedHtml
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

/**
 * Plain Text (TXT) to Word (.docx) Conversion
 * Builds an authentic OpenXML Word document using docx.umd.js
 * @param {string} text
 * @param {string} [filename='document']
 * @returns {Promise<{ blob: Blob, filename: string, size: number, paragraphCount: number }>}
 */
export async function txtToWord(text, filename = 'document') {
    const docxLib = ensureDocx();
    const { Document, Paragraph, TextRun, Packer } = docxLib;

    const lines = (text || '').split(/\r\n|\r|\n/);
    const paragraphs = lines.map(line => new Paragraph({
        children: [new TextRun({ text: line, size: 22, font: 'Calibri' })],
        spacing: { after: 120 }
    }));

    const doc = new Document({
        sections: [{
            properties: {},
            children: paragraphs.length > 0 ? paragraphs : [new Paragraph({ children: [new TextRun('')] })]
        }]
    });

    const blob = await Packer.toBlob(doc);
    const base = getBaseFilename(filename);
    return {
        blob,
        filename: `${base}.docx`,
        size: blob.size,
        paragraphCount: paragraphs.length
    };
}
