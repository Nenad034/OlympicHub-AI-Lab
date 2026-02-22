const https = require('https');

// HARDCODED CREDENTIALS (from .env)
const SOLVEX_API_URL = 'https://evaluation.solvex.bg/iservice/integrationservice.asmx';
const LOGIN = 'sol611s';
const PASSWORD = 'En5AL535';

async function soapRequest(method, params, soapAction) {
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="http://www.megatec.ru/">
      ${Object.entries(params).map(([k, v]) => `<${k}>${v}</${k}>`).join('\n')}
    </${method}>
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
            res.on('end', () => resolve(data));
        });

        req.on('error', reject);
        req.write(envelope);
        req.end();
    });
}

function parseXML(xml) {
    // Simple regex parser for debugging
    const names = xml.match(/<Name>(.*?)<\/Name>/g);
    const codes = xml.match(/Code="(.*?)"/g);
    const ids = xml.match(/<Id>(.*?)<\/Id>/g);
    return { names, codes, ids };
}

async function verify() {
    try {
        console.log('--- SOLVEX VERIFICATION ---');
        console.log('1. Connecting...');
        const connectRes = await soapRequest('Connect', { login: LOGIN, password: PASSWORD });
        const guidMatch = connectRes.match(/<ConnectResult>(.*?)<\/ConnectResult>/);
        if (!guidMatch) {
            console.error('Failed to get GUID');
            return;
        }
        const guid = guidMatch[1];
        console.log('GUID obtained:', guid);

        const today = new Date().toISOString().split('T')[0];
        console.log(`2. Searching for ANY reservations modified/created today (${today})...`);

        // Try GetReservationsFrom
        // The API might require T00:00:00 or just date
        const res = await soapRequest('GetReservationsFrom', {
            guid: guid,
            dateFrom: today + 'T00:00:00',
            dateTo: today + 'T23:59:59'
        });

        console.log('--- Raw Response (Snippet) ---');
        console.log(res.substring(0, 2000));

        if (res.includes('REF-728')) {
            console.log('!!! FOUND REF-728 IN RESPONSE !!!');
        } else {
            console.log('REF-728 NOT found in GetReservationsFrom response text.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

verify();
