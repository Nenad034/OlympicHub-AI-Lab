const XLSX = require('xlsx');
const path = require('path');

const files = [
    'D:\\OlympicHub\\Primeri cenovnika\\Copy of Allotment Price List hotels exported 23.12.2025 (1).xlsx',
    'D:\\OlympicHub\\Primeri cenovnika\\OLYMPIC CENE 2026.xls'
];

files.forEach(file => {
    console.log(`\n=== Analyzing: ${path.basename(file)} ===`);
    try {
        const workbook = XLSX.readFile(file);
        workbook.SheetNames.forEach(sheetName => {
            console.log(`\n--- Sheet: ${sheetName} ---`);
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // Print first 20 rows to understand structure
            data.slice(0, 20).forEach((row, idx) => {
                console.log(`Row ${idx + 1}:`, row.join(' | '));
            });

            if (data.length > 20) {
                console.log('... (truncated)');
            }
        });
    } catch (err) {
        console.error(`Error reading ${file}:`, err.message);
    }
});
