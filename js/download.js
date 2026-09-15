/**
 * Download Module
 * Provides safe client-side file download triggering and memory cleanup.
 */

import { urlRegistry } from './file-utils.js';

/**
 * Trigger an immediate download of a Blob in the user's browser.
 * @param {Blob} blob - The processed output Blob
 * @param {string} filename - Output filename (e.g. "image.png")
 */
export function triggerDownload(blob, filename) {
    if (!blob) {
        throw new Error('Cannot download empty or undefined file blob.');
    }

    const safeFilename = sanitizeFilename(filename);
    const objectUrl = urlRegistry.create(blob);

    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = objectUrl;
    anchor.download = safeFilename;

    document.body.appendChild(anchor);
    anchor.click();

    // Clean up DOM node and release memory shortly after download dispatch
    setTimeout(() => {
        if (anchor.parentNode) {
            anchor.parentNode.removeChild(anchor);
        }
        urlRegistry.revoke(objectUrl);
    }, 1500);
}

/**
 * Sanitize filename to avoid path traversal or invalid characters
 * @param {string} filename
 * @returns {string}
 */
export function sanitizeFilename(filename) {
    if (!filename) return 'converted_file';
    // Remove forbidden filesystem characters: / \ : * ? " < > |
    return filename.replace(/[/\\?%*:|"<>]/g, '_').trim();
}
