const https = require('https');

// HARDCODED CREDENTIALS
const SOLVEX_API_URL = 'https://evaluation.solvex.bg/iservice/integrationservice.asmx';
const LOGIN = 'sol611s';
const PASSWORD = 'En5AL535';

async function soapRequest(method, xmlBody, soapAction) {
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    ${xmlBody}
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

async function getDetails() {
    try {
        console.log('--- GETTING DETAILS FOR RESERVATION ID:706496 (ATTRIBUTE STYLE) ---');
        console.log('1. Connecting...');

        const connectBody = `<Connect xmlns="http://www.megatec.ru/"><login>${LOGIN}</login><password>${PASSWORD}</password></Connect>`;
        const connectRes = await soapRequest('Connect', connectBody);
        const guid = connectRes.match(/<ConnectResult>(.*?)<\/ConnectResult>/)[1];
        console.log('GUID:', guid);

        console.log('2. Fetching details...');

        // TRY ATTRIBUTE STYLE
        const body = `<GetReservation xmlns="http://www.megatec.ru/">
            <guid>${guid}</guid>
            <reserv ID="706496" />
        </GetReservation>`;

        const res = await soapRequest('GetReservation', body);

        console.log('--- FULL RESPONSE ---');
        console.log(res);

    } catch (e) {
        console.error('Error:', e);
    }
}

getDetails();
