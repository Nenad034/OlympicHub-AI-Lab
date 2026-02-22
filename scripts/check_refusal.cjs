
const https = require('https');
const fs = require('fs');

const LOGIN = 'sol611s';
const PASSWORD = 'En5AL535';
const SOLVEX_API_URL = 'https://evaluation.solvex.bg/iservice/integrationservice.asmx';

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

async function checkRefusal() {
    try {
        console.log('Connecting...');
        const connectBody = `<Connect xmlns="http://www.megatec.ru/"><login>${LOGIN}</login><password>${PASSWORD}</password></Connect>`;
        const connectRes = await soapRequest('Connect', connectBody);
        const guidMatch = connectRes.match(/<ConnectResult>(.*?)<\/ConnectResult>/);
        if (!guidMatch) throw new Error('Auth failed');
        const guid = guidMatch[1];

        const dgKey = '706496'; // From previous steps

        console.log('Fetching Reservation Detail...');
        const detailBody = `<GetReservation xmlns="http://www.megatec.ru/"><guid>${guid}</guid><dgKey>${dgKey}</dgKey></GetReservation>`;
        const detailRes = await soapRequest('GetReservation', detailBody);

        console.log('Fetching Messages...');
        const msgBody = `<GetReservationMessages xmlns="http://www.megatec.ru/"><guid>${guid}</guid><dgKey>${dgKey}</dgKey><messageDirection>0</messageDirection></GetReservationMessages>`;
        const msgRes = await soapRequest('GetReservationMessages', msgBody);

        const allText = (detailRes + msgRes).toLowerCase();

        fs.writeFileSync('search_refusal.xml', detailRes + '\n\n--- MESSAGES ---\n\n' + msgRes);

        if (allText.includes('refusal') || allText.includes('rejected') || allText.includes('odbijen')) {
            console.log('!!! FOUND matches for rejection/refusal !!!');
            // Extract some context
            const index = allText.indexOf('refusal');
            if (index !== -1) {
                console.log('Context:', (detailRes + msgRes).substring(index - 50, index + 100));
            }
        } else {
            console.log('No mention of "Refusal" found in Reservation details or Messages.');
        }

    } catch (e) {
        console.error(e);
    }
}

checkRefusal();
