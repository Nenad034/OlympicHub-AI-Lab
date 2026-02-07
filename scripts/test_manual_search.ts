
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
    const id = 1060;

    const SOLVEX_API_URL = process.env.VITE_SOLVEX_API_URL || 'https://iservice.solvex.bg/IntegrationService.asmx';

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() + 45);
    const dateTo = new Date(dateFrom);
    dateTo.setDate(dateTo.getDate() + 7);

    const dfStr = dateFrom.toISOString().split('.')[0];
    const dtStr = dateTo.toISOString().split('.')[0];

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SearchHotelServices xmlns="http://www.megatec.ru/">
      <guid>${auth.data}</guid>
      <request>
        <PageSize>1</PageSize>
        <RowIndexFrom>0</RowIndexFrom>
        <DateFrom>${dfStr}</DateFrom>
        <DateTo>${dtStr}</DateTo>
        <HotelKeys>
          <int>${id}</int>
        </HotelKeys>
        <Pax>2</Pax>
        <ResultView>1</ResultView>
        <Mode>0</Mode>
      </request>
    </SearchHotelServices>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch(SOLVEX_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': '"http://www.megatec.ru/SearchHotelServices"'
        },
        body: xml
    });

    const text = await response.text();
    fs.writeFileSync('search_debug.xml', text);

    if (text.includes("CountryKey")) {
        const c1 = text.indexOf("<CountryKey>") + 12;
        const c2 = text.indexOf("</CountryKey>");
        const ci1 = text.indexOf("<CityKey>") + 9;
        const ci2 = text.indexOf("</CityKey>");
        console.log("CountryKey:", text.substring(c1, c2));
        console.log("CityKey:", text.substring(ci1, ci2));
    } else {
        console.log("Keys not found in response.");
    }
}

test();
