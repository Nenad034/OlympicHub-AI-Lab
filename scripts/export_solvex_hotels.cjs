
const ExcelJS = require('exceljs');
const fs = require('fs');

async function exportHotels() {
    const API_URL = 'https://evaluation.solvex.bg/iservice/integrationservice.asmx';
    const LOGIN = 'sol611s';
    const PASSWORD = 'En5AL535';
    const CITY_KEY = 33; // Golden Sands (Zlatni Pjasci)

    console.log('Connecting to Solvex API...');

    // 1. Authenticate
    const authEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <Connect xmlns="http://www.megatec.ru/">
      <login>${LOGIN}</login>
      <password>${PASSWORD}</password>
    </Connect>
  </soap:Body>
</soap:Envelope>`;

    const authRes = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://www.megatec.ru/Connect'
        },
        body: authEnvelope
    });

    const authXml = await authRes.text();
    const guidMatch = authXml.match(/<ConnectResult>([^<]+)<\/ConnectResult>/);
    const guid = guidMatch ? guidMatch[1] : null;

    if (!guid) {
        console.error('Failed to authenticate');
        console.log(authXml);
        return;
    }

    console.log('Authenticated! GUID:', guid);

    // 2. Get Hotels
    console.log(`Fetching hotels for city key ${CITY_KEY}...`);
    const hotelsEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <GetHotels xmlns="http://www.megatec.ru/">
      <guid>${guid}</guid>
      <cityKey>${CITY_KEY}</cityKey>
    </GetHotels>
  </soap:Body>
</soap:Envelope>`;

    const hotelsRes = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://www.megatec.ru/GetHotels'
        },
        body: hotelsEnvelope
    });

    const hotelsXml = await hotelsRes.text();

    // Simple regex parsing to avoid full XML parser overhead in this small script
    // Each hotel is in a <Hotel> tag
    const hotelMatches = hotelsXml.matchAll(/<Hotel>([\s\S]*?)<\/Hotel>/g);
    const hotels = [];

    for (const match of hotelMatches) {
        const content = match[1];
        const rawName = (content.match(/<Name>([^<]*)<\/Name>/) || [])[1] || '';
        const description = (content.match(/<Description>([^<]*)<\/Description>/) || [])[1] || '';
        const id = (content.match(/<ID>([^<]*)<\/ID>/) || [])[1] || '';

        // Extract stars from description (e.g. "5*  (\Golden Sands)")
        let stars = '0';
        const starMatch = description.match(/(\d)\s*\*+/);
        if (starMatch) {
            stars = starMatch[1];
        }

        // Clean name and append stars if available
        let cleanName = rawName.replace(/\s*\d+\s*\*+/g, '').replace(/\(Golden Sands\)/gi, '').trim();
        let displayName = cleanName;
        if (stars && stars !== '0') {
            displayName = `${cleanName} ${stars}*`;
        }

        hotels.push({ id, name: displayName, stars });
    }

    console.log(`Found ${hotels.length} hotels.`);

    if (hotels.length === 0) {
        console.warn('No hotels found. Check the XML response:');
        console.log(hotelsXml.substring(0, 1000));
        return;
    }

    // 3. Create Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Solvex Hoteli - Zlatni Pjasci');

    worksheet.columns = [
        { header: 'ID Hotela', key: 'id', width: 15 },
        { header: 'Naziv Hotela (sa kategorijom)', key: 'name', width: 45 },
        { header: 'Kategorija (Zvezdice)', key: 'stars', width: 25 }
    ];

    hotels.forEach(h => {
        worksheet.addRow(h);
    });

    // Styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE91E63' } // Solvex Pinkish
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    const timestamp = Date.now();
    const filePath = `d:/OlympicHub/Solvex_Hoteli_Zlatni_Pjasci_${timestamp}.xlsx`;
    await workbook.xlsx.writeFile(filePath);

    console.log(`Excel fajl je uspešno kreiran na putanji: ${filePath}`);
}

exportHotels().catch(err => {
    console.error('Error:', err);
});
