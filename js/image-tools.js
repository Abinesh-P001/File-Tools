/**
 * Image Processing Module
 * Pure browser-side Canvas & Blob image operations (zero server dependency).
 */

import { loadImage, getBaseFilename } from './file-utils.js';

/**
 * Convert JPG/JPEG to PNG
 * @param {File|Blob} file
 * @returns {Promise<{ blob: Blob, filename: string, width: number, height: number }>}
 */
export async function convertJpgToPng(file) {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => {
            if (b) resolve(b);
            else reject(new Error('Canvas failed to export PNG Blob'));
        }, 'image/png');
    });

    const base = getBaseFilename(file.name || 'converted');
    return {
        blob,
        filename: `${base}.png`,
        width: canvas.width,
        height: canvas.height
    };
}

/**
 * Convert PNG to JPG with customizable quality and matte background
 * (Handles PNG alpha transparency cleanly by filling with solid matte)
 * @param {File|Blob} file
 * @param {Object} options
 * @param {number} options.quality - Between 0.1 and 1.0 (default 0.85)
 * @param {string} options.background - Hex color for transparent areas (default '#FFFFFF')
 * @returns {Promise<{ blob: Blob, filename: string, width: number, height: number }>}
 */
export async function convertPngToJpg(file, options = {}) {
    const quality = options.quality !== undefined ? options.quality : 0.85;
    const background = options.background || '#FFFFFF';

    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill background color for transparent pixels
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => {
            if (b) resolve(b);
            else reject(new Error('Canvas failed to export JPG Blob'));
        }, 'image/jpeg', quality);
    });

    const base = getBaseFilename(file.name || 'converted');
    return {
        blob,
        filename: `${base}.jpg`,
        width: canvas.width,
        height: canvas.height
    };
}

/**
 * Compress an Image
 * @param {File|Blob} file
 * @param {Object} options
 * @param {number} options.quality - 0.1 to 1.0 (default 0.75)
 * @param {number} [options.maxWidth]
 * @param {number} [options.maxHeight]
 * @param {string} [options.outputFormat] - 'image/jpeg' | 'image/png' | 'image/webp'
 * @returns {Promise<{ blob: Blob, filename: string, width: number, height: number, originalSize: number, compressedSize: number }>}
 */
export async function compressImage(file, options = {}) {
    const quality = options.quality !== undefined ? options.quality : 0.75;
    const outputFormat = options.outputFormat || (file.type === 'image/png' ? 'image/png' : 'image/jpeg');

    const img = await loadImage(file);
    let targetWidth = img.naturalWidth || img.width;
    let targetHeight = img.naturalHeight || img.height;

    // Optional max dimension downscaling
    if (options.maxWidth && targetWidth > options.maxWidth) {
        const ratio = options.maxWidth / targetWidth;
        targetWidth = Math.round(targetWidth * ratio);
        targetHeight = Math.round(targetHeight * ratio);
    }
    if (options.maxHeight && targetHeight > options.maxHeight) {
        const ratio = options.maxHeight / targetHeight;
        targetWidth = Math.round(targetWidth * ratio);
        targetHeight = Math.round(targetHeight * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (outputFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => {
            if (b) resolve(b);
            else reject(new Error('Canvas failed to compress image'));
        }, outputFormat, quality);
    });

    const base = getBaseFilename(file.name || 'compressed');
    const ext = outputFormat === 'image/webp' ? 'webp' : (outputFormat === 'image/png' ? 'png' : 'jpg');

    return {
        blob,
        filename: `${base}-compressed.${ext}`,
        width: canvas.width,
        height: canvas.height,
        originalSize: file.size,
        compressedSize: blob.size
    };
}

/**
 * Resize Image with explicit dimensions and aspect ratio handling
 * @param {File|Blob} file
 * @param {Object} options
 * @param {number} options.width
 * @param {number} options.height
 * @param {string} [options.format]
 * @param {number} [options.quality]
 * @returns {Promise<{ blob: Blob, filename: string, width: number, height: number }>}
 */
export async function resizeImage(file, options = {}) {
    const img = await loadImage(file);
    const origWidth = img.naturalWidth || img.width;
    const origHeight = img.naturalHeight || img.height;

    const targetWidth = Math.max(1, Math.round(options.width || origWidth));
    const targetHeight = Math.max(1, Math.round(options.height || origHeight));
    const outputFormat = options.format || file.type || 'image/jpeg';
    const quality = options.quality !== undefined ? options.quality : 0.92;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (outputFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => {
            if (b) resolve(b);
            else reject(new Error('Canvas failed to resize image'));
        }, outputFormat, quality);
    });

    const base = getBaseFilename(file.name || 'resized');
    let ext = 'jpg';
    if (outputFormat.includes('png')) ext = 'png';
    else if (outputFormat.includes('webp')) ext = 'webp';

    return {
        blob,
        filename: `${base}-${targetWidth}x${targetHeight}.${ext}`,
        width: targetWidth,
        height: targetHeight
    };
}

/**
 * Crop an Image using normalized or pixel bounding coordinates
 * @param {File|Blob} file
 * @param {Object} crop - { x, y, width, height } in original image pixels
 * @param {string} [format] - Output mime type
 * @param {number} [quality] - 0.1 to 1.0
 * @returns {Promise<{ blob: Blob, filename: string, width: number, height: number }>}
 */
export async function cropImage(file, crop, format = 'image/jpeg', quality = 0.9) {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    
    const cropWidth = Math.max(1, Math.round(crop.width));
    const cropHeight = Math.max(1, Math.round(crop.height));
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(
        img,
        Math.max(0, crop.x),
        Math.max(0, crop.y),
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
    );

    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => {
            if (b) resolve(b);
            else reject(new Error('Canvas failed to crop image'));
        }, format, quality);
    });

    const base = getBaseFilename(file.name || 'cropped');
    const ext = format.includes('png') ? 'png' : 'jpg';

    return {
        blob,
        filename: `${base}-cropped.${ext}`,
        width: cropWidth,
        height: cropHeight
    };
}
