
const login = 'sol611s';
const password = 'En5AL535';
const url = 'https://evaluation.solvex.bg/iservice/integrationservice.asmx';

const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <Connect xmlns="http://www.megatec.ru/">
      <login>${login}</login>
      <password>${password}</password>
    </Connect>
  </soap:Body>
</soap:Envelope>`;

async function test() {
    console.log(`Testing Solvex Connect with login: ${login}, password: ${password}...`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': '"http://www.megatec.ru/Connect"'
            },
            body: soapRequest
        });

        const text = await res.text();
        console.log('Status:', res.status);
        if (text.includes('<ConnectResult>')) {
            const token = text.split('<ConnectResult>')[1].split('</ConnectResult>')[0];
            console.log('Token extracted:', token);
            if (token.includes('Invalid')) {
                console.error('FAILED: Invalid login or password');
            } else {
                console.log('SUCCESS: Token obtained!');
            }
        } else {
            console.error('FAILED: No ConnectResult found. Text:', text);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
