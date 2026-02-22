const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const file = 'd:\\Antigravity\\OlympicHub\\Tipovi smestaja i cenovnika.xlsx';
const output = [];

output.push(`=== Analyzing: ${path.basename(file)} ===`);
try {
    const workbook = XLSX.readFile(file);
    workbook.SheetNames.forEach(sheetName => {
        output.push(`\n--- Sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        data.forEach((row, idx) => {
            const rowStr = row.map(cell => cell === null || cell === undefined ? '' : cell).join(' | ');
            output.push(`Row ${idx + 1}: ${rowStr}`);
        });
    });
    fs.writeFileSync('excel_content.txt', output.join('\n'));
    console.log('Analysis written to excel_content.txt');
} catch (err) {
    console.error(`Error reading ${file}:`, err.message);
}
