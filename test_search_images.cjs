#!/usr/bin/env node
const LOGIN = 'sol611s';
const PASSWORD = 'AqC384lF';
const SOLVEX_API_URL = 'https://iservice.solvex.bg/IntegrationService.asmx';

async function soapRequest(method, params) {
    let bodyContent;
    
    if (method === 'SearchHotelServices' && params.request) {
        bodyContent = `
    <${method} xmlns="http://www.megatec.ru/">
      <guid>${params.guid}</guid>
      <request>${params.request}</request>
    </${method}>`;
    } else {
        bodyContent = `
    <${method} xmlns="http://www.megatec.ru/">
      ${Object.entries(params).map(([k, v]) => `<${k}>${v}</${k}>`).join('\n')}
    </${method}>`;
    }

    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>${bodyContent}
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
        console.error(`Error in ${method}:`, error.message);
        return null;
    }
}

async function test() {
    // 1. Connect
    console.log('📤 Connecting...');
    const connectRes = await soapRequest('Connect', { login: LOGIN, password: PASSWORD });
    const guidMatch = connectRes.match(/<ConnectResult>(.*?)<\/ConnectResult>/);
    if (!guidMatch) {
        console.error('❌ Connect failed');
        return;
    }
    const guid = guidMatch[1];
    console.log(`✅ GUID: ${guid}`);

    // 2. Search for one hotel with images
    const today = new Date();
    const checkIn = new Date(today);
    checkIn.setDate(checkIn.getDate() + 30);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 7);
    
    const dateFrom = checkIn.toISOString().split('T')[0] + 'T00:00:00';
    const dateTo = checkOut.toISOString().split('T')[0] + 'T00:00:00';

    const requestXml = `
        <PageSize>1</PageSize>
        <RowIndexFrom>0</RowIndexFrom>
        <DateFrom>${dateFrom}</DateFrom>
        <DateTo>${dateTo}</DateTo>
        <Pax>2</Pax>
        <Mode>0</Mode>
        <ResultView>1</ResultView>
        <HotelKeys><int>3962</int></HotelKeys>`;

    console.log('\n📤 SearchHotelServices for hotel 3962...');
    const searchRes = await soapRequest('SearchHotelServices', { guid: guid, request: requestXml });
    
    if (searchRes.includes('HotelImage')) {
        console.log('✅ HotelImage found!');
        const imageMatches = [...searchRes.matchAll(/<HotelImage>(.*?)<\/HotelImage>/gs)];
        console.log(`Found ${imageMatches.length} HotelImages`);
        if (imageMatches.length > 0) {
            console.log('\nFirst HotelImage:');
            console.log(imageMatches[0][1].substring(0, 500));
        } else {
            console.log('HotelImage is empty or no closing tag');
        }
    } else {
        console.log('❌ No HotelImage tag found');
    }
    
    // Also search for Image tag
    if (searchRes.includes('<Image>')) {
        const imgMatches = [...searchRes.matchAll(/<Image>(.*?)<\/Image>/gs)];
        console.log(`\n✅ Found ${imgMatches.length} Image tags`);
        if (imgMatches.length > 0) {
            console.log('First Image:');
            console.log(imgMatches[0][1].substring(0, 500));
        }
    }
    
    // Show entire response
    if (searchRes.length < 3000) {
        console.log('\n📋 Full response:');
        console.log(searchRes);
    } else {
        console.log('\n📋 Response preview (first 3000 chars):');
        console.log(searchRes.substring(0, 3000));
    }
}

test();
