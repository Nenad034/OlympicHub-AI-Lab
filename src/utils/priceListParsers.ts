// Price List Import Parsers

import type { ImportPreview, PersonCategory, RoomTypePricing, PricingRule } from '../types/pricing.types';

/**
 * Parse uploaded file and extract pricing data
 */
export async function parsePriceListFile(
    file: File,
    fileType: 'excel' | 'pdf' | 'json' | 'xml' | 'html'
): Promise<ImportPreview> {
    switch (fileType) {
        case 'excel':
            return parseExcelFile(file);
        case 'pdf':
            return parsePDFFile(file);
        case 'json':
            return parseJSONFile(file);
        case 'xml':
            return parseXMLFile(file);
        case 'html':
            return parseHTMLFile(file);
        default:
            throw new Error(`Unsupported file type: ${fileType}`);
    }
}

/**
 * Parse Excel file
 */
async function parseExcelFile(file: File): Promise<ImportPreview> {
    // TODO: Implement Excel parsing using xlsx library
    // For now, return mock data
    return {
        personCategories: [
            { code: 'ADL', label: 'Odrasli', ageFrom: 18, ageTo: 99 },
            { code: 'CHD1', label: 'Deca 2-7', ageFrom: 2, ageTo: 7 }
        ],
        roomTypePricing: [],
        warnings: ['Excel parsing not yet implemented'],
        errors: []
    };
}

/**
 * Parse PDF file
 */
async function parsePDFFile(file: File): Promise<ImportPreview> {
    // TODO: Implement PDF parsing using pdf.js or similar
    return {
        personCategories: [],
        roomTypePricing: [],
        warnings: ['PDF parsing not yet implemented'],
        errors: []
    };
}

/**
 * Parse JSON file
 */
async function parseJSONFile(file: File): Promise<ImportPreview> {
    try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate JSON structure
        if (!data.personCategories || !data.roomTypePricing) {
            return {
                personCategories: [],
                roomTypePricing: [],
                warnings: [],
                errors: ['Invalid JSON structure. Expected personCategories and roomTypePricing fields.']
            };
        }

        return {
            personCategories: data.personCategories || [],
            roomTypePricing: data.roomTypePricing || [],
            warnings: [],
            errors: []
        };
    } catch (error) {
        return {
            personCategories: [],
            roomTypePricing: [],
            warnings: [],
            errors: [`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`]
        };
    }
}

/**
 * Parse XML file
 */
async function parseXMLFile(file: File): Promise<ImportPreview> {
    try {
        const text = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        // Check for parsing errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            return {
                personCategories: [],
                roomTypePricing: [],
                warnings: [],
                errors: ['Invalid XML format']
            };
        }

        // Extract person categories
        const personCategories: PersonCategory[] = [];
        const categoryNodes = xmlDoc.querySelectorAll('personCategory');
        categoryNodes.forEach(node => {
            const code = node.getAttribute('code') as any;
            const label = node.getAttribute('label') || '';
            const ageFrom = parseInt(node.getAttribute('ageFrom') || '0', 10);
            const ageTo = parseInt(node.getAttribute('ageTo') || '99', 10);

            if (code) {
                personCategories.push({ code, label, ageFrom, ageTo });
            }
        });

        // TODO: Extract room type pricing
        const roomTypePricing: RoomTypePricing[] = [];

        return {
            personCategories,
            roomTypePricing,
            warnings: ['XML parsing partially implemented'],
            errors: []
        };
    } catch (error) {
        return {
            personCategories: [],
            roomTypePricing: [],
            warnings: [],
            errors: [`Failed to parse XML: ${error instanceof Error ? error.message : 'Unknown error'}`]
        };
    }
}

/**
 * Parse HTML file
 */
async function parseHTMLFile(file: File): Promise<ImportPreview> {
    try {
        const text = await file.text();
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(text, 'text/html');

        // Try to find pricing tables
        const tables = htmlDoc.querySelectorAll('table');

        if (tables.length === 0) {
            return {
                personCategories: [],
                roomTypePricing: [],
                warnings: ['No tables found in HTML'],
                errors: []
            };
        }

        // TODO: Implement smart table parsing
        // Look for headers like "Age Category", "Price", "Room Type", etc.

        return {
            personCategories: [],
            roomTypePricing: [],
            warnings: ['HTML parsing not yet fully implemented'],
            errors: []
        };
    } catch (error) {
        return {
            personCategories: [],
            roomTypePricing: [],
            warnings: [],
            errors: [`Failed to parse HTML: ${error instanceof Error ? error.message : 'Unknown error'}`]
        };
    }
}

/**
 * Detect file type from file extension
 */
export function detectFileType(fileName: string): 'excel' | 'pdf' | 'json' | 'xml' | 'html' | null {
    const ext = fileName.toLowerCase().split('.').pop();

    switch (ext) {
        case 'xlsx':
        case 'xls':
            return 'excel';
        case 'pdf':
            return 'pdf';
        case 'json':
            return 'json';
        case 'xml':
            return 'xml';
        case 'html':
        case 'htm':
            return 'html';
        default:
            return null;
    }
}

/**
 * Validate import preview data
 */
export function validateImportPreview(preview: ImportPreview): string[] {
    const errors: string[] = [];

    // Check person categories
    if (preview.personCategories.length === 0) {
        errors.push('No person categories found');
    }

    // Check for ADL category
    const hasADL = preview.personCategories.some(c => c.code === 'ADL');
    if (!hasADL) {
        errors.push('Missing ADL (Adult) category');
    }

    // Check age ranges
    for (const category of preview.personCategories) {
        if (category.ageFrom >= category.ageTo) {
            errors.push(`Invalid age range for ${category.label}: ${category.ageFrom}-${category.ageTo}`);
        }
    }

    // Check room type pricing
    if (preview.roomTypePricing.length === 0) {
        errors.push('No room type pricing found');
    }

    return errors;
}
