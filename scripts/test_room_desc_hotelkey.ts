
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
  const hotelId = 5676;

  const SOLVEX_API_URL = process.env.VITE_SOLVEX_API_URL || 'https://iservice.solvex.bg/IntegrationService.asmx';

  const response = await fetch(SOLVEX_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': '"http://www.megatec.ru/GetRoomDescriptions"'
    },
    body: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <GetRoomDescriptions xmlns="http://www.megatec.ru/">
      <guid>${auth.data}</guid>
      <hotelKey>${hotelId}</hotelKey>
    </GetRoomDescriptions>
  </soap:Body>
</soap:Envelope>`
  });

  const xml = await response.text();
  fs.writeFileSync('room_desc_debug.xml', xml);
  console.log('Saved to room_desc_debug.xml. Size:', xml.length);

  // Quick extract images
  const regex = /https?:\/\/[^\s\"\'<>]+?\.(jpg|jpeg|png|webp|gif|ashx)[^\s\"\'<>]*/gi;
  const urls = xml.match(regex);
  console.log("URLs found:", urls?.length || 0);
  if (urls) console.log("First 5 URLs:", urls.slice(0, 5));
}

test();
