#!/usr/bin/env node
const LOGIN = 'sol611s';
const PASSWORD = 'AqC384lF';
const SOLVEX_API_URL = 'https://iservice.solvex.bg/IntegrationService.asmx';

async function testConnect() {
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Connect xmlns="http://www.megatec.ru/">
      <login>${LOGIN}</login>
      <password>${PASSWORD}</password>
    </Connect>
  </soap:Body>
</soap:Envelope>`;

    console.log('📤 Sending Connect request to:', SOLVEX_API_URL);
    
    try {
        const response = await fetch(SOLVEX_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://www.megatec.ru/Connect'
            },
            body: envelope
        });

        console.log('📥 Response Status:', response.status);
        const text = await response.text();
        
        // Extract GUID
        const guidMatch = text.match(/<ConnectResult>([^<]+)<\/ConnectResult>/);
        if (guidMatch) {
            console.log('✅ GUID:', guidMatch[1]);
        } else {
            console.log('❌ GUID not found in response');
            console.log('\nResponse (first 500 chars):\n', text.substring(0, 500));
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testConnect();
