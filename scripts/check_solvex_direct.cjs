
const fs = require('fs');
const path = require('path');

// Manually load .env for Node environment
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
        console.log('[Script] Loaded .env');
    }
} catch (e) {
    console.warn('[Script] Could not find or read .env');
}

// Now we can use dynamic import or just use the utils directly
// Since the project is ESM, we'll try to use the soap client directly with fetch

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

    const xml = await response.text();
    return xml;
}

async function run() {
    console.log('--- SOLVEX DIRECT CHECK ---');
    console.log('Login:', LOGIN);

    if (!LOGIN || !PASSWORD) {
        console.error('Missing credentials in .env');
        return;
    }

    try {
        console.log('1. Connecting...');
        const connectRes = await soapRequest('Connect', { login: LOGIN, password: PASSWORD });
        const guidMatch = connectRes.match(/<ConnectResult>(.*?)<\/ConnectResult>/);
        if (!guidMatch) {
            console.error('Failed to get GUID. Response:', connectRes);
            return;
        }
        const guid = guidMatch[1];
        console.log('GUID obtained:', guid);

        console.log('\n2. Fetching Reservation 706496...');
        const resXml = await soapRequest('GetReservation', { guid: guid, dgKey: '706496' });

        fs.writeFileSync('reservation_2315791_full.xml', resXml);
        console.log('Full response saved to reservation_2315791_full.xml');

        // Extract some values using regex for quick check
        const statusMatch = resXml.match(/<Status>(.*?)<\/Status>/);
        const nameMatch = resXml.match(/<Name>(.*?)<\/Name>/);
        const numberMatch = resXml.match(/<Number>(.*?)<\/Number>/);
        const codeMatch = resXml.match(/ Code="(.*?)"/);

        console.log('--- RESULTS ---');
        console.log('Status:', statusMatch ? statusMatch[1] : 'N/A');
        console.log('Name:', nameMatch ? nameMatch[1] : 'N/A');
        console.log('Number:', numberMatch ? numberMatch[1] : 'N/A');
        console.log('XML Code Attr:', codeMatch ? codeMatch[1] : 'N/A');

        console.log('\nFull Response (first 1000 chars):');
        console.log(resXml.substring(0, 1000));

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
