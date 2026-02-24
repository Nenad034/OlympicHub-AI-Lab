const ExcelJS = require('exceljs');
const path = require('path');

async function analyzeRoomMapping() {
    const filePath = path.join(__dirname, '..', 'api', 'AxiosMtsGlobe', 'Room_Mapping.xlsx');
    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1); // Assuming first sheet

        console.log(`Analyzing Worksheet: ${worksheet.name}`);

        const mapping = {
            BASE: {},
            GRADE: {},
            SUBTYPE: {},
            TYPE: {},
            VIEW: {}
        };

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const values = row.values;
            const dimensionType = values[2];
            const code = values[3];
            const name = values[4];

            if (mapping[dimensionType]) {
                mapping[dimensionType][code] = name;
            }
        });

        const outputPath = path.join(__dirname, '..', 'src', 'integrations', 'mtsglobe', 'room_mapping.json');
        const fs = require('fs');
        fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));

        console.log(`Extracted mapping to ${outputPath}`);

        console.log('\nColumn Headers Identification:');
        const headers = worksheet.getRow(1).values;
        console.log(JSON.stringify(headers));

    } catch (error) {
        console.error('Error reading Excel file:', error);
    }
}

analyzeRoomMapping();
