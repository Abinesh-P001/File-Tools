/**
 * Spreadsheet Processing Module
 * Handles client-side Excel to CSV and CSV to Excel using SheetJS.
 */

import { readFileAsArrayBuffer, readFileAsText, getBaseFilename } from './file-utils.js';

function ensureXLSX() {
    if (typeof window.XLSX === 'undefined') {
        throw new Error('SheetJS library is not loaded. Please ensure libraries/xlsx.full.min.js is present.');
    }
    return window.XLSX;
}

/**
 * Convert Excel (.xlsx, .xls) to CSV
 * @param {File} excelFile
 * @param {number} [sheetIndex=0]
 * @returns {Promise<{ blob: Blob, csvText: string, filename: string, sheetNames: string[], rowCount: number }>}
 */
export async function excelToCsv(excelFile, sheetIndex = 0) {
    const XLSX = ensureXLSX();
    const buffer = await readFileAsArrayBuffer(excelFile);
    const workbook = XLSX.read(buffer, { type: 'array' });

    const sheetNames = workbook.SheetNames;
    if (!sheetNames || sheetNames.length === 0) {
        throw new Error('The uploaded Excel spreadsheet contains no visible sheets.');
    }

    const selectedSheetName = sheetNames[sheetIndex] || sheetNames[0];
    const worksheet = workbook.Sheets[selectedSheetName];
    const csvText = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const base = getBaseFilename(excelFile.name);
    const rowCount = csvText.split('\n').filter(Boolean).length;

    return {
        blob,
        csvText,
        filename: `${base}-${selectedSheetName}.csv`,
        sheetNames,
        rowCount
    };
}

/**
 * Convert CSV to Excel (.xlsx) workbook
 * @param {File|string} csvData - File object or CSV text string
 * @param {string} [title='spreadsheet']
 * @returns {Promise<{ blob: Blob, filename: string, rowCount: number }>}
 */
export async function csvToExcel(csvData, title = 'spreadsheet') {
    const XLSX = ensureXLSX();
    let text = '';
    let base = title;

    if (csvData instanceof File) {
        text = await readFileAsText(csvData);
        base = getBaseFilename(csvData.name);
    } else {
        text = String(csvData);
    }

    const workbook = XLSX.read(text, { type: 'string' });
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const rowCount = text.split('\n').filter(Boolean).length;

    return {
        blob,
        filename: `${base}.xlsx`,
        rowCount
    };
}
