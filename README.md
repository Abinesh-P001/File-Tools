# FILETOOLS — 100% Frontend-Only File Conversion & Utility Website

A fast, modern, privacy-first online file utility platform built **exclusively using HTML5, CSS3, and Vanilla JavaScript**.

## Live Local Link
When running locally:
```text
http://localhost:8080/
```

---

## Architectural Guarantee: 100% Client-Side

This application requires **NO backend servers, NO Node.js / Express services, NO databases, and NO user accounts**.

All file validation, decoding, pixel processing, PDF manipulation, DOCX generation, spreadsheet conversions, and compression occur strictly within the user's browser memory sandbox:

```text
User Selects File
       ↓
Browser Validates File
       ↓
Local JavaScript / Canvas / WebAssembly Execution
       ↓
Blob Created in Browser Memory
       ↓
Instant Local Preview & Direct Browser Download
       ↓
Object URLs & Blobs Automatically Revoked
```

---

## Complete List of Supported Client-Side Tools

### PDF Tools
1. **PDF to Word (DOCX)** (`tools/pdf-to-word.html`) — Extracts text and paragraphs using `PDF.js` and creates a genuine OpenXML `.docx` file using `docx.js`.
2. **Word to PDF** (`tools/word-to-pdf.html`) — Reads `.docx` using `mammoth.js` and compiles into a clean A4 PDF using `pdf-lib`.
3. **Merge PDF** (`tools/pdf-merge.html`) — Combines multiple PDF documents into one with drag-and-drop reordering.
4. **Split & Extract PDF** (`tools/pdf-split.html`) — Extracts specific page spans (e.g. `1-3, 5`) into a separate PDF.
5. **Rotate PDF** (`tools/pdf-rotate.html`) — Rotates all, odd, or even pages 90°, 180°, or 270° clockwise.
6. **Delete PDF Pages** (`tools/delete-pdf-pages.html`) — Removes selected pages by number from any PDF.
7. **PDF to JPG / PNG** (`tools/pdf-to-images.html`) — Renders PDF pages to crisp images; download individually or as a ZIP archive.
8. **JPG & PNG to PDF** (`tools/jpg-to-pdf.html`) — Combines one or multiple images into a standard A4 PDF document.

### Word & Document Tools
9. **Word to TXT** (`tools/word-to-txt.html`) — Extracts raw plain text from any modern Word (.docx) document.
10. **Word to HTML** (`tools/word-to-html.html`) — Converts Word documents into clean semantic HTML5 markup with live preview.

### Image Tools
11. **JPG to PNG** (`tools/jpg-to-png.html`) — Converts JPEG to high-fidelity lossless PNG format in browser memory.
12. **PNG to JPG** (`tools/png-to-jpg.html`) — Converts PNG with transparency matte color control and custom JPG quality slider.
13. **Image Compressor** (`tools/image-compressor.html`) — Reduces JPG, PNG, and WebP file sizes with live byte reduction statistics.
14. **Image Resizer** (`tools/image-resizer.html`) — Scales width and height with aspect ratio locking and quick presets (25%–150%).
15. **Image Cropper** (`tools/image-cropper.html`) — Visual interactive cropping canvas with aspect ratio presets (1:1, 4:3, 16:9, Free).

### Spreadsheet Tools
16. **Excel to CSV** (`tools/excel-to-csv.html`) — Converts Excel spreadsheets (.xlsx, .xls) to standard CSV with sheet selection via `SheetJS`.
17. **CSV to Excel** (`tools/csv-to-excel.html`) — Transforms comma-separated CSV text into an Excel (.xlsx) workbook.

### Text & Utilities
18. **TXT to PDF** (`tools/txt-to-pdf.html`) — Formats plain text or Markdown into paginated A4 PDF documents.
19. **Markdown to HTML** (`tools/markdown-to-html.html`) — Live Markdown editor with split rendered HTML preview and `.html` export.
20. **JSON Formatter & Validator** (`tools/json-tools.html`) — Formats, prettifies, minifies, and validates JSON syntax with error detection.
21. **Base64 Converter** (`tools/base64.html`) — Encodes and decodes files and text to/from Base64 data strings.
22. **File Information & Inspector** (`tools/file-info.html`) — Inspects MIME types, exact byte length, timestamps, and binary hex magic bytes.

---

## Intentionally Unsupported Features (Zero Fake Conversions)

* **Legacy Binary Word (.doc) and PPTX to PDF**:
  * Legacy binary `.doc` formats from Microsoft Word 97–2003 are proprietary binary streams not reliably parsable client-side in pure JS without external cloud backends. The application explicitly detects and prompts the user to upload modern standard `.docx` files instead of pretending to convert or faking progress.

---

## Local Bundled Libraries (100% Offline Capable)

To prevent CDN outages and guarantee zero external network dependencies, all required browser engines are bundled directly in `libraries/`:

1. **`pdf-lib.min.js`**: Client-side PDF document manipulation (merge, split, rotate, delete, layout).
2. **`pdf.min.js` & `pdf.worker.min.js`**: Mozilla's HTML5 PDF reader and canvas renderer.
3. **`docx.umd.js`**: Microsoft Word (.docx) OpenXML document builder.
4. **`mammoth.browser.min.js`**: Modern Word (.docx) text and HTML parser.
5. **`xlsx.full.min.js`**: SheetJS pure client-side spreadsheet engine.
6. **`jszip.min.js`**: In-browser ZIP archive creator.

---

## Memory Hygiene & Resource Cleanup

To prevent memory leaks during client-side file processing:
* All `URL.createObjectURL()` handles are tracked in `ManagedUrlRegistry` (`js/file-utils.js`).
* URLs are revoked via `URL.revokeObjectURL()` immediately after file download, reset, or page navigation.
* No files or binary payloads are stored in `localStorage` or `sessionStorage`.

---

## Local Development & Testing

Run any static local web server:

```bash
# Python built-in server
python -m http.server 8080

# Or npx serve
npx serve .
```

Visit:
```text
http://localhost:8080/
```

---

## Static Deployment

Deploy to any static hosting provider by simply uploading the files:

* **GitHub Pages**: Push to GitHub, enable GitHub Pages pointing to root (`/`).
* **Hostinger**: Upload all files to `public_html/`. No PHP or Node.js runtime required.
* **Netlify**: Drag and drop the folder into Netlify Drop.
* **Vercel**: Deploy as a static project with zero build configuration.
