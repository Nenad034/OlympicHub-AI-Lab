const XLSX = require('xlsx');
const path = require('path');

const file = 'D:\\OlympicHub\\Primeri cenovnika\\Copy of Allotment Price List hotels exported 23.12.2025 (1).xlsx';

console.log(`\n=== Analyzing: ${path.basename(file)} ===`);
try {
    const workbook = XLSX.readFile(file);
    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        data.slice(0, 30).forEach((row, idx) => {
            if (row && row.length > 0) {
                console.log(`R${idx + 1}: ${row.join(' | ')}`);
            }
        });
    });
} catch (err) {
    console.error(`Error:`, err.message);
}
