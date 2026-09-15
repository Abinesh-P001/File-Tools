/**
 * Text & Utilities Processing Module
 * Markdown parser, JSON formatter, Base64 encoder/decoder, and File Inspector.
 */

import { formatBytes, readFileAsArrayBuffer, getBaseFilename, getFileExtension } from './file-utils.js';

/**
 * Basic lightweight client-side Markdown to HTML renderer
 * (handles headers, bold, italics, code blocks, lists, links, quotes)
 * @param {string} md
 * @returns {string}
 */
export function markdownToHtml(md) {
    if (!md) return '';
    let html = md
        // Escape raw HTML tags
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Headings
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold & Italic
        .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        // Blockquotes
        .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
        // Unordered Lists
        .replace(/^\s*\-\s+(.*$)/gim, '<ul><li>$1</li></ul>')
        .replace(/<\/ul>\s?<ul>/gim, '')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        // Paragraphs
        .replace(/\n\n/gim, '</p><p>')
        .replace(/\n/gim, '<br>');

    return `<div class="rendered-markdown"><p>${html}</p></div>`;
}

/**
 * Format / Prettify / Minify JSON
 * @param {string} jsonString
 * @param {number} [indent=2] - 0 for minify, 2 or 4 for prettify
 * @returns {{ valid: boolean, output: string, error: string|null }}
 */
export function formatJson(jsonString, indent = 2) {
    try {
        const parsed = JSON.parse(jsonString);
        const output = indent === 0 ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
        return { valid: true, output, error: null };
    } catch (err) {
        return { valid: false, output: '', error: err.message };
    }
}

/**
 * Encode plain text or file to Base64
 * @param {string|File} input
 * @returns {Promise<string>}
 */
export async function encodeBase64(input) {
    if (typeof input === 'string') {
        return btoa(unescape(encodeURIComponent(input)));
    } else if (input instanceof File || input instanceof Blob) {
        const buffer = await readFileAsArrayBuffer(input);
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    throw new Error('Unsupported input type for Base64 encoding');
}

/**
 * Decode Base64 string to plain text
 * @param {string} base64Str
 * @returns {string}
 */
export function decodeBase64(base64Str) {
    const clean = base64Str.trim().replace(/^data:.*?;base64,/, '');
    return decodeURIComponent(escape(atob(clean)));
}

/**
 * Inspect File Details & Metadata
 * @param {File} file
 * @returns {Promise<Object>}
 */
export async function inspectFile(file) {
    const ext = getFileExtension(file.name);
    const lastMod = file.lastModified ? new Date(file.lastModified).toLocaleString() : 'Unknown';

    // Read first 16 bytes for hex magic preview
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let hexHeader = '';
    bytes.forEach(b => {
        hexHeader += b.toString(16).padStart(2, '0').toUpperCase() + ' ';
    });

    return {
        name: file.name,
        baseName: getBaseFilename(file.name),
        extension: ext ? `.${ext}` : 'None',
        sizeFormatted: formatBytes(file.size),
        sizeBytes: file.size.toLocaleString() + ' Bytes',
        mimeType: file.type || 'Not reported by browser (binary/unknown)',
        lastModified: lastMod,
        hexMagicBytes: hexHeader.trim()
    };
}
