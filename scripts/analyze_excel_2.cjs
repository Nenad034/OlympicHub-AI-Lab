const XLSX = require('xlsx');
const path = require('path');

const file = 'D:\\OlympicHub\\Primeri cenovnika\\OLYMPIC CENE 2026.xls';

console.log(`\n=== Analyzing: ${path.basename(file)} ===`);
try {
    const workbook = XLSX.readFile(file);
    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        data.slice(0, 30).forEach((row, idx) => {
            if (row && row.length > 0) {
                // Limit columns to 12
                const cols = row.slice(0, 12).map(c => String(c).padEnd(15)).join(' | ');
                console.log(`R${String(idx + 1).padStart(2)}: ${cols}`);
            }
        });
    });
} catch (err) {
    console.error(`Error:`, err.message);
}
