/**
 * Central Tool Registry
 * Categorized listing of all available 100% frontend client-side tools.
 */

export const TOOL_CATEGORIES = [
    { id: 'all', name: 'All Tools' },
    { id: 'pdf', name: 'PDF Tools' },
    { id: 'documents', name: 'Word & Docs' },
    { id: 'images', name: 'Image Tools' },
    { id: 'spreadsheets', name: 'Spreadsheets' },
    { id: 'text', name: 'Text & Markdown' },
    { id: 'utilities', name: 'Utilities' }
];

export const TOOLS_REGISTRY = [
    // PDF Tools
    {
        id: 'pdf-to-word',
        name: 'PDF to Word (DOCX)',
        category: 'pdf',
        route: 'tools/pdf-to-word.html',
        desc: 'Extract text and structure from PDF into a genuine editable Microsoft Word (.docx) document.',
        badge: 'DOCX Engine',
        inputFormats: ['pdf'],
        outputFormats: ['docx'],
        available: true
    },
    {
        id: 'word-to-pdf',
        name: 'Word to PDF',
        category: 'pdf',
        route: 'tools/word-to-pdf.html',
        desc: 'Convert DOCX documents into clean, paginated PDF files preserving headings, formatting, and tables.',
        badge: 'Mammoth + PDF-Lib',
        inputFormats: ['docx'],
        outputFormats: ['pdf'],
        available: true
    },
    {
        id: 'pdf-merge',
        name: 'Merge PDF',
        category: 'pdf',
        route: 'tools/pdf-merge.html',
        desc: 'Combine multiple PDF documents into a single organized file with reordering.',
        badge: 'Multi-File',
        inputFormats: ['pdf'],
        outputFormats: ['pdf'],
        available: true
    },
    {
        id: 'split-pdf',
        name: 'Split & Extract PDF',
        category: 'pdf',
        route: 'tools/pdf-split.html',
        desc: 'Extract specific pages or page ranges (e.g. 1-3, 5) into a clean separate PDF.',
        badge: 'Range Extractor',
        inputFormats: ['pdf'],
        outputFormats: ['pdf'],
        available: true
    },
    {
        id: 'rotate-pdf',
        name: 'Rotate PDF',
        category: 'pdf',
        route: 'tools/pdf-rotate.html',
        desc: 'Fix upside-down pages by rotating 90°, 180°, or 270° clockwise with immediate preview.',
        badge: 'Orientation',
        inputFormats: ['pdf'],
        outputFormats: ['pdf'],
        available: true
    },
    {
        id: 'delete-pdf-pages',
        name: 'Delete PDF Pages',
        category: 'pdf',
        route: 'tools/delete-pdf-pages.html',
        desc: 'Select unwanted pages by number and generate a clean PDF with those pages removed.',
        badge: 'Page Remover',
        inputFormats: ['pdf'],
        outputFormats: ['pdf'],
        available: true
    },
    {
        id: 'reorder-pdf',
        name: 'Reorder PDF Pages',
        category: 'pdf',
        route: 'tools/pdf-reorder.html',
        desc: 'Visually rearrange the page order of your PDF document with live thumbnail controls.',
        badge: 'Visual Arranger',
        inputFormats: ['pdf'],
        outputFormats: ['pdf'],
        available: true
    },
    {
        id: 'compress-pdf',
        name: 'Compress PDF',
        category: 'pdf',
        route: 'tools/pdf-compress.html',
        desc: 'Optimize internal streams and object cross-reference tables to reduce PDF size.',
        badge: 'Stream Optimizer',
        inputFormats: ['pdf'],
        outputFormats: ['pdf'],
        available: true
    },
    {
        id: 'pdf-viewer',
        name: 'PDF Document Viewer',
        category: 'pdf',
        route: 'tools/pdf-viewer.html',
        desc: 'Read and inspect PDF documents directly in browser with zoom and page navigation.',
        badge: 'PDF.js Reader',
        inputFormats: ['pdf'],
        outputFormats: ['view'],
        available: true
    },
    {
        id: 'pdf-to-images',
        name: 'PDF to JPG / PNG',
        category: 'pdf',
        route: 'tools/pdf-to-images.html',
        desc: 'Render PDF pages to crisp images. Download individually or as a single ZIP bundle.',
        badge: 'High-Res Canvas',
        inputFormats: ['pdf'],
        outputFormats: ['png', 'jpg', 'zip'],
        available: true
    },
    {
        id: 'jpg-to-pdf',
        name: 'JPG / PNG to PDF',
        category: 'pdf',
        route: 'tools/jpg-to-pdf.html',
        desc: 'Assemble one or multiple images into a standard A4 PDF document.',
        badge: 'Multi-Image',
        inputFormats: ['jpg', 'jpeg', 'png'],
        outputFormats: ['pdf'],
        available: true
    },

    // Word & Document Tools
    {
        id: 'word-to-txt',
        name: 'Word to TXT',
        category: 'documents',
        route: 'tools/word-to-txt.html',
        desc: 'Extract clean unformatted plain text from any DOCX document in browser memory.',
        badge: 'Text Extractor',
        inputFormats: ['docx'],
        outputFormats: ['txt'],
        available: true
    },
    {
        id: 'word-to-html',
        name: 'Word to HTML',
        category: 'documents',
        route: 'tools/word-to-html.html',
        desc: 'Convert Word DOCX documents into clean semantic HTML markup with live preview.',
        badge: 'Semantic HTML',
        inputFormats: ['docx'],
        outputFormats: ['html'],
        available: true
    },
    {
        id: 'txt-to-word',
        name: 'TXT to Word (DOCX)',
        category: 'documents',
        route: 'tools/txt-to-word.html',
        desc: 'Convert plain text notes or logs into genuine Microsoft Word (.docx) documents.',
        badge: 'OpenXML Writer',
        inputFormats: ['txt', 'log', 'md'],
        outputFormats: ['docx'],
        available: true
    },
    {
        id: 'word-viewer',
        name: 'Word Document Viewer',
        category: 'documents',
        route: 'tools/word-viewer.html',
        desc: 'View and print Word (.docx) documents directly in your browser without MS Word installed.',
        badge: 'DOCX Reader',
        inputFormats: ['docx'],
        outputFormats: ['view'],
        available: true
    },

    // Image Tools
    {
        id: 'image-converter',
        name: 'Universal Image Converter',
        category: 'images',
        route: 'tools/image-converter.html',
        desc: 'Seamlessly convert between JPG, PNG, and next-gen WebP formats with quality controls.',
        badge: 'JPG • PNG • WEBP',
        inputFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        outputFormats: ['webp', 'png', 'jpg'],
        available: true
    },
    {
        id: 'jpg-to-png',
        name: 'JPG to PNG',
        category: 'images',
        route: 'tools/jpg-to-png.html',
        desc: 'Convert JPEG images to high-fidelity lossless PNG format in browser memory.',
        badge: 'Lossless',
        inputFormats: ['jpg', 'jpeg'],
        outputFormats: ['png'],
        available: true
    },
    {
        id: 'png-to-jpg',
        name: 'PNG to JPG',
        category: 'images',
        route: 'tools/png-to-jpg.html',
        desc: 'Convert PNG with transparency matte control and custom JPG output quality.',
        badge: 'Quality Slider',
        inputFormats: ['png'],
        outputFormats: ['jpg'],
        available: true
    },
    {
        id: 'compress-image',
        name: 'Compress Image',
        category: 'images',
        route: 'tools/image-compressor.html',
        desc: 'Reduce JPG, PNG, and WebP file sizes. Live byte reduction and side-by-side preview.',
        badge: 'Byte Reduction',
        inputFormats: ['jpg', 'jpeg', 'png', 'webp'],
        outputFormats: ['jpg', 'png', 'webp'],
        available: true
    },
    {
        id: 'resize-image',
        name: 'Resize Image',
        category: 'images',
        route: 'tools/image-resizer.html',
        desc: 'Change image width & height with aspect ratio preservation and crisp interpolation.',
        badge: 'Aspect Lock',
        inputFormats: ['jpg', 'jpeg', 'png', 'webp'],
        outputFormats: ['jpg', 'png', 'webp'],
        available: true
    },
    {
        id: 'crop-image',
        name: 'Crop Image',
        category: 'images',
        route: 'tools/image-cropper.html',
        desc: 'Select exact crop area with preset ratios (1:1, 4:3, 16:9, Free) and export immediately.',
        badge: 'Visual Canvas',
        inputFormats: ['jpg', 'jpeg', 'png', 'webp'],
        outputFormats: ['jpg', 'png'],
        available: true
    },
    {
        id: 'rotate-image',
        name: 'Rotate & Flip Image',
        category: 'images',
        route: 'tools/image-rotate.html',
        desc: 'Rotate images 90°, 180°, 270° or flip horizontally and vertically with live preview.',
        badge: 'Canvas Transform',
        inputFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        outputFormats: ['jpg', 'png', 'webp'],
        available: true
    },

    // Spreadsheet Tools
    {
        id: 'excel-to-csv',
        name: 'Excel to CSV',
        category: 'spreadsheets',
        route: 'tools/excel-to-csv.html',
        desc: 'Convert Excel spreadsheets (.xlsx, .xls) to standard CSV format directly in browser.',
        badge: 'SheetJS',
        inputFormats: ['xlsx', 'xls'],
        outputFormats: ['csv'],
        available: true
    },
    {
        id: 'csv-to-excel',
        name: 'CSV to Excel',
        category: 'spreadsheets',
        route: 'tools/csv-to-excel.html',
        desc: 'Transform comma-separated CSV text into a structured Microsoft Excel (.xlsx) workbook.',
        badge: 'XLSX Export',
        inputFormats: ['csv', 'txt'],
        outputFormats: ['xlsx'],
        available: true
    },

    // Text & Markdown Tools
    {
        id: 'txt-to-pdf',
        name: 'TXT to PDF',
        category: 'text',
        route: 'tools/txt-to-pdf.html',
        desc: 'Convert plain text or Markdown files into cleanly paginated A4 PDF documents.',
        badge: 'A4 Pagination',
        inputFormats: ['txt', 'md'],
        outputFormats: ['pdf'],
        available: true
    },
    {
        id: 'markdown-to-html',
        name: 'Markdown to HTML',
        category: 'text',
        route: 'tools/markdown-to-html.html',
        desc: 'Convert Markdown into clean semantic HTML with instant live rendered preview.',
        badge: 'Live Preview',
        inputFormats: ['md', 'txt'],
        outputFormats: ['html'],
        available: true
    },
    {
        id: 'text-counter',
        name: 'Word & Text Counter',
        category: 'text',
        route: 'tools/text-counter.html',
        desc: 'Analyze words, characters, sentences, paragraphs, reading and speaking duration in real-time.',
        badge: 'Live Metrics',
        inputFormats: ['txt', 'text'],
        outputFormats: ['stats'],
        available: true
    },

    // General Utilities
    {
        id: 'file-info',
        name: 'File Information & Inspector',
        category: 'utilities',
        route: 'tools/file-info.html',
        desc: 'Inspect detailed metadata, exact byte length, MIME type, and header magic bytes.',
        badge: 'Inspector',
        inputFormats: ['*'],
        outputFormats: ['json'],
        available: true
    },
    {
        id: 'file-size-converter',
        name: 'File Size Converter',
        category: 'utilities',
        route: 'tools/file-size-converter.html',
        desc: 'Convert storage units across Bytes, KB, MB, GB, TB, KiB, MiB, and GiB instantly.',
        badge: 'Decimal & IEC',
        inputFormats: ['num'],
        outputFormats: ['calc'],
        available: true
    },
    {
        id: 'base64-converter',
        name: 'Base64 Encoder / Decoder',
        category: 'utilities',
        route: 'tools/base64.html',
        desc: 'Encode and decode files or text to and from Base64 data strings directly in browser.',
        badge: 'Encoder',
        inputFormats: ['*'],
        outputFormats: ['txt'],
        available: true
    },
    {
        id: 'json-tools',
        name: 'JSON Formatter & Validator',
        category: 'utilities',
        route: 'tools/json-tools.html',
        desc: 'Format, prettify, minify, and validate JSON syntax with instant error highlighting.',
        badge: 'Formatter',
        inputFormats: ['json', 'txt'],
        outputFormats: ['json'],
        available: true
    }
];
