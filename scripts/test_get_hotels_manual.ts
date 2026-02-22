
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function test() {
    const { connect } = await import('../src/services/solvex/solvexAuthService');
    const auth = await connect();

    const SOLVEX_API_URL = process.env.VITE_SOLVEX_API_URL || 'https://iservice.solvex.bg/IntegrationService.asmx';

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetHotels xmlns="http://www.megatec.ru/">
      <countryKey>4</countryKey>
      <regionKey>-1</regionKey>
      <cityKey>-1</cityKey>
    </GetHotels>
  </soap:Body>
</soap:Envelope>`;

    console.log("Sending manual SOAP request for GetHotels...");
    const response = await fetch(SOLVEX_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': '"http://www.megatec.ru/GetHotels"'
        },
        body: xml
    });

    const text = await response.text();
    fs.writeFileSync('hotels_bulgaria.xml', text);
    console.log("Saved to hotels_bulgaria.xml. Length:", text.length);

    if (text.includes("<Hotel ")) {
        console.log("FOUND HOTEL TAGS!");
        const count = (text.match(/<Hotel /g) || []).length;
        console.log("Hotel count:", count);
    }
}

test();
