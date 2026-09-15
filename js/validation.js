/**
 * Validation Module
 * Performs client-side file integrity, size, MIME type, and magic byte validation.
 */

export const MAX_FILE_SIZE_DEFAULT = 50 * 1024 * 1024; // 50MB browser safety limit

/**
 * File validation rules mapping
 */
export const VALIDATION_RULES = {
    IMAGE_ANY: {
        extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'],
        mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'],
        maxSize: 40 * 1024 * 1024,
        description: 'JPG, PNG, WebP, GIF, or BMP'
    },
    IMAGE_JPG: {
        extensions: ['jpg', 'jpeg'],
        mimes: ['image/jpeg', 'image/pjpeg'],
        maxSize: 40 * 1024 * 1024,
        description: 'JPG or JPEG image'
    },
    IMAGE_PNG: {
        extensions: ['png'],
        mimes: ['image/png'],
        maxSize: 40 * 1024 * 1024,
        description: 'PNG image'
    },
    PDF: {
        extensions: ['pdf'],
        mimes: ['application/pdf'],
        maxSize: 60 * 1024 * 1024,
        description: 'PDF document'
    },
    TXT: {
        extensions: ['txt', 'md', 'json', 'csv', 'log'],
        mimes: ['text/plain', 'text/markdown', 'application/json', 'text/csv'],
        maxSize: 15 * 1024 * 1024,
        description: 'Text document (.txt, .md, .csv)'
    }
};

/**
 * Validates a file against a rule set.
 * @param {File} file
 * @param {Object} rule
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateFile(file, rule = VALIDATION_RULES.IMAGE_ANY) {
    if (!file) {
        return { valid: false, error: 'No file was provided.' };
    }

    if (file.size === 0) {
        return { valid: false, error: 'The selected file is empty (0 Bytes).' };
    }

    const maxSize = rule.maxSize || MAX_FILE_SIZE_DEFAULT;
    if (file.size > maxSize) {
        const limitMb = Math.round(maxSize / (1024 * 1024));
        return {
            valid: false,
            error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${limitMb} MB for client-side processing.`
        };
    }

    // Check extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    const hasValidExt = rule.extensions ? rule.extensions.includes(ext) : true;

    // Check mime type (fallback to ext check if browser didn't supply MIME)
    let hasValidMime = true;
    if (rule.mimes && file.type) {
        hasValidMime = rule.mimes.includes(file.type.toLowerCase()) || 
                       rule.mimes.some(m => file.type.toLowerCase().startsWith(m.split('/')[0]));
    }

    if (!hasValidExt && !hasValidMime) {
        return {
            valid: false,
            error: `Unsupported file format. Please upload a valid ${rule.description || 'supported file'}.`
        };
    }

    return { valid: true, error: null };
}

/**
 * Check file magic bytes for PDF and common images to ensure file is not corrupted or mislabeled
 * @param {File} file
 * @returns {Promise<{ valid: boolean, detectedType: string, error: string|null }>}
 */
export async function checkFileSignature(file) {
    try {
        const slice = file.slice(0, 8);
        const buffer = await slice.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        // PDF signature: %PDF (0x25 0x50 0x44 0x46)
        if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
            return { valid: true, detectedType: 'application/pdf', error: null };
        }

        // PNG signature: 89 50 4E 47 0D 0A 1A 0A
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
            return { valid: true, detectedType: 'image/png', error: null };
        }

        // JPEG signature: FF D8 FF
        if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
            return { valid: true, detectedType: 'image/jpeg', error: null };
        }

        // WebP signature: RIFF....WEBP
        if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
            return { valid: true, detectedType: 'image/webp', error: null };
        }

        // Plain text files don't have fixed binary magic bytes
        return { valid: true, detectedType: file.type || 'unknown', error: null };
    } catch (e) {
        return { valid: false, detectedType: 'unknown', error: 'Could not read file header: ' + e.message };
    }
}
