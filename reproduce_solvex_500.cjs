const https = require('https');

// UPDATED CREDENTIALS from .env
const SOLVEX_API_URL = 'https://evaluation.solvex.bg/iservice/integrationservice.asmx';
const LOGIN = 'sol611s';
const PASSWORD = 'En5AL535';

async function soapRequest(method, body, soapAction) {
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    ${body}
  </soap:Body>
</soap:Envelope>`;

    return new Promise((resolve, reject) => {
        const url = new URL(SOLVEX_API_URL);
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': soapAction || `http://www.megatec.ru/${method}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });

        req.on('error', reject);
        req.write(envelope);
        req.end();
    });
}

async function run() {
    try {
        console.log('--- SOLVEX 500 REPRODUCTION ---');

        // 1. Get Token
        console.log('1. Connecting...');
        const connectBody = `<Connect xmlns="http://www.megatec.ru/"><login>${LOGIN}</login><password>${PASSWORD}</password></Connect>`;
        const connectRes = await soapRequest('Connect', connectBody);

        const guidMatch = connectRes.data.match(/<ConnectResult>(.*?)<\/ConnectResult>/);
        if (!guidMatch) {
            console.error('Failed to get GUID:', connectRes.data);
            return;
        }
        const guid = guidMatch[1];
        console.log('GUID obtained:', guid);

        // 2. Exact Failing Request
        console.log('2. Sending failing SearchHotelServices request...');
        const searchBody = `<SearchHotelServices xmlns="http://www.megatec.ru/">
      <guid>${guid}</guid>
      <request>
        <PageSize>500</PageSize>
        <RowIndexFrom>0</RowIndexFrom>
        <DateFrom>2026-07-12</DateFrom>
        <DateTo>2026-07-19</DateTo>
        <CityKeys>
          <int>33</int>
        </CityKeys>
        <Pax>2</Pax>
        <Tariffs>
          <int>0</int>
          <int>1993</int>
        </Tariffs>
        <ResultView>1</ResultView>
        <Mode>0</Mode>
        <QuotaTypes>
          <int>0</int>
          <int>1</int>
        </QuotaTypes>
      </request>
    </SearchHotelServices>`;

        const searchRes = await soapRequest('SearchHotelServices', searchBody);
        console.log('Status:', searchRes.status);
        console.log('Response Snippet:', searchRes.data);

    } catch (e) {
        console.error('Error in run():', e);
    }
}

run();
