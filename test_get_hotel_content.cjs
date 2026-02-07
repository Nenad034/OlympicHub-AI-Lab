#!/usr/bin/env node
const LOGIN = 'sol611s';
const PASSWORD = 'AqC384lF';
const SOLVEX_API_URL = 'https://iservice.solvex.bg/IntegrationService.asmx';

async function soapRequest(method, params) {
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="http://www.megatec.ru/">
      ${Object.entries(params).map(([k, v]) => `<${k}>${v}</${k}>`).join('\n')}
    </${method}>
  </soap:Body>
</soap:Envelope>`;

    try {
        const response = await fetch(SOLVEX_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': `http://www.megatec.ru/${method}`
            },
            body: envelope
        });

        const text = await response.text();
        return text;
    } catch (error) {
        console.error(`Fetch Error in ${method}:`, error.message);
        return null;
    }
}

async function test() {
    // 1. Connect
    console.log('📤 Connecting to Solvex...');
    const connectRes = await soapRequest('Connect', { login: LOGIN, password: PASSWORD });
    const guidMatch = connectRes.match(/<ConnectResult>(.*?)<\/ConnectResult>/);
    if (!guidMatch) {
        console.error('❌ Connect failed');
        return;
    }
    const guid = guidMatch[1];
    console.log(`✅ GUID: ${guid}`);

    // 2. Test GetHotelDescription with simple hotel ID
    const hotelCode = '3962'; // Antilia
    console.log(`\n📤 Testing GetHotelDescription for hotel ${hotelCode}...`);
    const descRes = await soapRequest('GetHotelDescription', { guid: guid, hotelCode: hotelCode });
    
    if (descRes.includes('Description') || descRes.includes('description')) {
        console.log('✅ Got response with description');
        const descMatch = descRes.match(/<Description>(.*?)<\/Description>/s);
        if (descMatch) {
            const desc = descMatch[1].substring(0, 200);
            console.log('✅ Description found:', desc + '...');
        } else {
            console.log('No Description tag found. First 500 chars:');
            console.log(descRes.substring(0, 500));
        }
    } else if (descRes.includes('Exception') || descRes.includes('Error')) {
        console.log('❌ Got error:', descRes.substring(0, 200));
    } else {
        console.log('Response length:', descRes.length);
        console.log('Sample:', descRes.substring(0, 500));
    }

    // 3. Test GetHotelImages
    console.log(`\n📤 Testing GetHotelImages for hotel ${hotelCode}...`);
    const imgRes = await soapRequest('GetHotelImages', { guid: guid, hotelCode: hotelCode });
    
    if (imgRes.includes('Image') || imgRes.includes('image')) {
        console.log('✅ Got response with images');
        const imgMatches = [...imgRes.matchAll(/<Url>(.*?)<\/Url>/g)];
        console.log(`✅ Found ${imgMatches.length} images`);
        if (imgMatches.length > 0) {
            console.log('First image:', imgMatches[0][1]);
        } else {
            console.log('No <Url> tags found. First 500 chars:');
            console.log(imgRes.substring(0, 500));
        }
    } else if (imgRes.includes('Exception') || imgRes.includes('Error')) {
        console.log('❌ Got error:', imgRes.substring(0, 200));
    } else {
        console.log('Response length:', imgRes.length);
        console.log('Sample:', imgRes.substring(0, 500));
    }
}

test();
