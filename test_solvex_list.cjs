const fs = require('fs');
const path = require('path');

// Load .env
try {
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach((line) => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, '');
                process.env[key] = value;
            }
        });
    }
} catch (e) { }

const SOLVEX_API_URL = process.env.VITE_SOLVEX_API_URL || 'https://evaluation.solvex.bg/iservice/integrationservice.asmx';
const LOGIN = process.env.VITE_SOLVEX_LOGIN;
const PASSWORD = process.env.VITE_SOLVEX_PASSWORD;

async function soapRequest(method, params) {
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="http://www.megatec.ru/">
      ${Object.entries(params).map(([k, v]) => `<${k}>${v}</${k}>`).join('\n')}
    </${method}>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch(SOLVEX_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': `http://www.megatec.ru/${method}`
        },
        body: envelope
    });

    return await response.text();
}

function formatSolvexDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function run() {
    console.log('--- TESTING GetReservationsFrom ---');
    const connectRes = await soapRequest('Connect', { login: LOGIN, password: PASSWORD });
    const guid = connectRes.match(/<ConnectResult>(.*?)<\/ConnectResult>/)[1];

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 120);
    const dateTo = new Date();
    dateTo.setDate(dateTo.getDate() + 1);

    console.log(`Searching from ${formatSolvexDate(dateFrom)} to ${formatSolvexDate(dateTo)}`);

    const listXml = await soapRequest('GetReservationsFrom', {
        guid: guid,
        dateFrom: formatSolvexDate(dateFrom) + 'T00:00:00',
        dateTo: formatSolvexDate(dateTo) + 'T00:00:00'
    });

    fs.writeFileSync('solvex_list_response.xml', listXml);
    console.log('Saved list to solvex_list_response.xml');

    // Check if 2315791 is in there
    if (listXml.includes('2315791')) {
        console.log('SUCCESS: Found 2315791 in the list!');
        const match = listXml.match(/<ReservationKeyCode[^>]*Key="(\d+)"[^>]*Code="2315791"/);
        if (match) {
            console.log('Match found! Key:', match[1]);
        } else {
            console.log('Found string but regex failed. Check XML manually.');
            // Try another regex
            const match2 = listXml.match(/Key="(\d+)"[^>]*>2315791/);
            if (match2) console.log('Found with #text match! Key:', match2[1]);
        }
    } else {
        console.log('FAIL: 2315791 not found in the list for this date range.');
    }
}

run();
