
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
    const hotelId = 5676; // Arena_GS

    const SOLVEX_API_URL = process.env.VITE_SOLVEX_API_URL || 'https://iservice.solvex.bg/IntegrationService.asmx';

    console.log(`Calling GetHotels for hotel ${hotelId}...`);

    const response = await fetch(SOLVEX_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': '"http://www.megatec.ru/GetHotels"'
        },
        body: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <GetHotels xmlns="http://www.megatec.ru/">
      <guid>${auth.data}</guid>
      <countryKey>4</countryKey>
    </GetHotels>
  </soap:Body>
</soap:Envelope>`
    });

    const xml = await response.text();
    fs.writeFileSync('get_hotels_debug.xml', xml);
    console.log('Saved to get_hotels_debug.xml. Size:', xml.length);

    // Quick extract description
    const descRegex = /<Description>([\s\S]*?)<\/Description>/i;
    const match = xml.match(descRegex);
    if (match) {
        console.log("Description found! Length:", match[1].length);
        console.log("Snippet:", match[1].substring(0, 200));
    } else {
        console.log("No Description found in GetHotels response.");
    }

    // Quick extract images if any
    const imgRegex = /https?:\/\/[^\s\"\'<>]+?\.(jpg|jpeg|png|webp|gif|ashx)[^\s\"\'<>]*/gi;
    const urls = xml.match(imgRegex);
    console.log("URLs found:", urls?.length || 0);
    if (urls) console.log("First 5 URLs:", urls.slice(0, 5));
}

test();
