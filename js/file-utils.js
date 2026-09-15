/**
 * File Utilities Module
 * Handles file reading, byte formatting, and active Object URL lifecycle tracking.
 */

class ManagedUrlRegistry {
    constructor() {
        this.activeUrls = new Set();
    }

    /**
     * Create an Object URL and track it for cleanup.
     * @param {Blob|File} blob
     * @returns {string}
     */
    create(blob) {
        if (!blob) return '';
        const url = URL.createObjectURL(blob);
        this.activeUrls.add(url);
        return url;
    }

    /**
     * Revoke a single tracked URL.
     * @param {string} url
     */
    revoke(url) {
        if (!url) return;
        if (this.activeUrls.has(url)) {
            URL.revokeObjectURL(url);
            this.activeUrls.delete(url);
        }
    }

    /**
     * Revoke all currently tracked URLs to avoid memory leaks.
     */
    revokeAll() {
        this.activeUrls.forEach(url => {
            try {
                URL.revokeObjectURL(url);
            } catch (e) {
                console.warn('Error revoking Object URL:', e);
            }
        });
        this.activeUrls.clear();
    }
}

export const urlRegistry = new ManagedUrlRegistry();

// Clean up any remaining URLs when page unloads
window.addEventListener('beforeunload', () => {
    urlRegistry.revokeAll();
});

/**
 * Format bytes into human-readable strings (e.g. 2.4 MB)
 * @param {number} bytes
 * @param {number} decimals
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    if (!bytes || isNaN(bytes)) return 'Unknown size';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Read a File or Blob as an ArrayBuffer
 * @param {File|Blob} file
 * @returns {Promise<ArrayBuffer>}
 */
export function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file as ArrayBuffer'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Read a File or Blob as plain text
 * @param {File|Blob} file
 * @returns {Promise<string>}
 */
export function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file as text'));
        reader.readAsText(file);
    });
}

/**
 * Read a File or Blob as a Data URL (Base64)
 * @param {File|Blob} file
 * @returns {Promise<string>}
 */
export function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file as Data URL'));
        reader.readAsDataURL(file);
    });
}

/**
 * Load an image from a Blob or URL into an HTMLImageElement
 * @param {Blob|string} source
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(source) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        let objectUrl = null;

        img.onload = () => {
            if (objectUrl) {
                // Do not immediately revoke if it's still needed, but here it's loaded in memory
                urlRegistry.revoke(objectUrl);
            }
            resolve(img);
        };

        img.onerror = () => {
            if (objectUrl) urlRegistry.revoke(objectUrl);
            reject(new Error('Failed to load image into browser memory'));
        };

        if (source instanceof Blob) {
            objectUrl = urlRegistry.create(source);
            img.src = objectUrl;
        } else {
            img.src = source;
        }
    });
}

/**
 * Strip file extension from filename
 * @param {string} filename
 * @returns {string}
 */
export function getBaseFilename(filename) {
    if (!filename) return 'file';
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) return filename;
    return filename.substring(0, lastDotIndex);
}

/**
 * Extract file extension in lowercase without dot
 * @param {string} filename
 * @returns {string}
 */
export function getFileExtension(filename) {
    if (!filename) return '';
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) return '';
    return filename.substring(lastDotIndex + 1).toLowerCase();
}
