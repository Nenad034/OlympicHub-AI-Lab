#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

/**
 * SOLVEX API CONTENT DOWNLOAD - DETAILED TEST & DOCUMENTATION
 * 
 * Ispitivanje mogućnosti preuzimanja:
 * 1. Hotel Description (detaljnog opisa)
 * 2. Hotel Images (kolekcije slika)
 * 3. Batch processing implementacija
 */

// PRODUCTION CREDENTIALS (iz .env ili direktno)
const SOLVEX_API_URL = 'https://iservice.solvex.bg/IntegrationService.asmx';
const LOGIN = 'sol611s';
const PASSWORD = 'AqC384lF';

const Colors = {
    Reset: '\x1b[0m',
    Green: '\x1b[32m',
    Red: '\x1b[31m',
    Yellow: '\x1b[33m',
    Blue: '\x1b[34m',
    Magenta: '\x1b[35m',
    Cyan: '\x1b[36m'
};

function log(level, message) {
    const timestamp = new Date().toISOString().slice(11, 19);
    const color = {
        INFO: Colors.Blue,
        SUCCESS: Colors.Green,
        ERROR: Colors.Red,
        WARN: Colors.Yellow,
        TEST: Colors.Magenta,
        DATA: Colors.Cyan
    }[level] || Colors.Reset;
    
    console.log(`${color}[${timestamp}] ${level}${Colors.Reset} - ${message}`);
}

function formatSolvexDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
}

async function soapRequest(method, params, timeout = 30000) {
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="http://www.megatec.ru/">
      ${Object.entries(params)
          .map(([k, v]) => `<${k}>${v}</${k}>`)
          .join('\n')}
    </${method}>
  </soap:Body>
</soap:Envelope>`;

    log('TEST', `Pozivanje: ${method}`);
    
    try {
        const response = await Promise.race([
            fetch(SOLVEX_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': `http://www.megatec.ru/${method}`
                },
                body: envelope,
                timeout
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), timeout)
            )
        ]);

        const text = await response.text();
        
        if (response.status === 200) {
            log('SUCCESS', `${method} HTTP 200`);
            return { success: true, data: text, status: response.status };
        } else {
            log('ERROR', `${method} HTTP ${response.status}`);
            return { success: false, data: text, status: response.status };
        }
    } catch (e) {
        log('ERROR', `${method} Exception: ${e.message}`);
        return { success: false, error: e.message };
    }
}

function parseXMLValue(xml, tagName) {
    const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 's');
    const match = xml.match(regex);
    return match ? match[1] : null;
}

function extractImages(xmlResponse) {
    const images = [];
    const imageRegex = /<Image[^>]*>(.*?)<\/Image>/gs;
    let match;
    
    while ((match = imageRegex.exec(xmlResponse)) !== null) {
        const imageXml = match[1];
        const url = parseXMLValue(imageXml, 'ImageUrl');
        const title = parseXMLValue(imageXml, 'ImageName') || 'Hotel Image';
        const order = parseXMLValue(imageXml, 'Order') || images.length;
        
        if (url) {
            images.push({ url, title, order });
        }
    }
    
    return images;
}

function extractDescription(xmlResponse) {
    // Različiti mogući tag-ovi za description
    let desc = parseXMLValue(xmlResponse, 'Description');
    if (!desc) desc = parseXMLValue(xmlResponse, 'DescriptionText');
    if (!desc) desc = parseXMLValue(xmlResponse, 'HotelDescription');
    
    // Ako je HTML, može biti escaped
    if (desc && desc.includes('&lt;')) {
        desc = desc.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    }
    
    return desc || 'N/A';
}

async function testGetHotelDescription(guid, hotelId, hotelName) {
    log('TEST', `=== GetHotelDescription za ${hotelName} (ID: ${hotelId}) ===`);
    
    const response = await soapRequest('GetHotelDescription', {
        guid: guid,
        hotelCode: hotelId
    });
    
    if (!response.success) {
        log('ERROR', `GetHotelDescription failed: ${response.error}`);
        return null;
    }
    
    if (response.data.includes('Exception') || response.data.includes('Error')) {
        log('ERROR', `GetHotelDescription returned error`);
        log('DATA', response.data.substring(0, 500));
        return null;
    }
    
    const description = extractDescription(response.data);
    
    if (description !== 'N/A' && description.length > 50) {
        log('SUCCESS', `✅ Opis pronađen! Dužina: ${description.length} karaktera`);
        log('DATA', `Početak: ${description.substring(0, 100)}...`);
        return {
            hotelId,
            hotelName,
            description,
            rawXmlLength: response.data.length
        };
    } else {
        log('WARN', `❌ Opis nije pronađen ili je prazan`);
        return null;
    }
}

async function testGetHotelImages(guid, hotelId, hotelName) {
    log('TEST', `=== GetHotelImages za ${hotelName} (ID: ${hotelId}) ===`);
    
    const response = await soapRequest('GetHotelImages', {
        guid: guid,
        hotelCode: hotelId
    });
    
    if (!response.success) {
        log('ERROR', `GetHotelImages failed: ${response.error}`);
        return null;
    }
    
    if (response.data.includes('Exception') || response.data.includes('Error')) {
        log('ERROR', `GetHotelImages returned error`);
        log('DATA', response.data.substring(0, 500));
        return null;
    }
    
    const images = extractImages(response.data);
    
    if (images.length > 0) {
        log('SUCCESS', `✅ Pronađeno ${images.length} slika!`);
        images.slice(0, 3).forEach((img, idx) => {
            log('DATA', `  [${idx}] ${img.title}: ${img.url.substring(0, 60)}...`);
        });
        return {
            hotelId,
            hotelName,
            imageCount: images.length,
            images: images,
            rawXmlLength: response.data.length
        };
    } else {
        log('WARN', `❌ Slike nisu pronađene`);
        return null;
    }
}

async function testSearchHotelServicesForImage(guid, hotelId, hotelName) {
    log('TEST', `=== SearchHotelServices za ${hotelName} (ID: ${hotelId}) ===`);
    
    // Pretraga sa fiksnom datumskom rentom
    const d1 = new Date();
    d1.setDate(d1.getDate() + 30);
    const d2 = new Date();
    d2.setDate(d2.getDate() + 37);
    
    const requestXml = `
        <PageSize>10</PageSize>
        <RowIndexFrom>0</RowIndexFrom>
        <DateFrom>${formatSolvexDate(d1)}</DateFrom>
        <DateTo>${formatSolvexDate(d2)}</DateTo>
        <Pax>2</Pax>
        <Mode>0</Mode>
        <ResultView>1</ResultView>
        <QuotaTypes><int>0</int><int>1</int></QuotaTypes>
        <HotelKeys><int>${hotelId}</int></HotelKeys>
    `;
    
    const response = await soapRequest('SearchHotelServices', {
        guid: guid,
        request: requestXml
    });
    
    if (!response.success) {
        log('ERROR', `SearchHotelServices failed: ${response.error}`);
        return null;
    }
    
    if (response.data.includes('Exception')) {
        log('ERROR', `SearchHotelServices returned exception`);
        return null;
    }
    
    // Pronađi HotelImage tag
    const hotelImageMatch = response.data.match(/<HotelImage[^>]*>(.*?)<\/HotelImage>/);
    
    if (hotelImageMatch && hotelImageMatch[1].trim()) {
        const imageUrl = hotelImageMatch[1].trim();
        log('SUCCESS', `✅ Slika pronađena iz SearchHotelServices!`);
        log('DATA', `URL: ${imageUrl.substring(0, 100)}...`);
        return {
            hotelId,
            hotelName,
            imageUrl,
            imageFound: true
        };
    } else {
        log('WARN', `❌ HotelImage nije pronađena u SearchHotelServices`);
        return null;
    }
}

async function runComprehensiveTest() {
    log('INFO', '╔════════════════════════════════════════════════════════════╗');
    log('INFO', '║ SOLVEX API - CONTENT DOWNLOAD TEST                         ║');
    log('INFO', '║ Testiranje mogućnosti preuzimanja slika, opisa, sadržaja    ║');
    log('INFO', '╚════════════════════════════════════════════════════════════╝');
    
    // STEP 1: CONNECT
    log('INFO', '\n📍 KORAK 1: Konekcija sa Solvex API-jem...');
    const connectRes = await soapRequest('Connect', {
        login: LOGIN,
        password: PASSWORD
    });
    
    if (!connectRes.success) {
        log('ERROR', `Konekcija neuspešna: ${connectRes.error}`);
        return;
    }
    
    const guid = parseXMLValue(connectRes.data, 'ConnectResult');
    if (!guid) {
        log('ERROR', 'GUID nije pronađen u odgovoru');
        log('DATA', connectRes.data.substring(0, 500));
        return;
    }
    
    log('SUCCESS', `✅ Konekcija uspešna! GUID: ${guid.substring(0, 8)}...`);
    
    // STEP 2: FIND HOTELS
    log('INFO', '\n📍 KORAK 2: Pronalaženje hotela za testiranje...');
    
    const d1 = new Date();
    d1.setDate(d1.getDate() + 30);
    const d2 = new Date();
    d2.setDate(d2.getDate() + 37);
    
    const searchReq = `
        <PageSize>5</PageSize>
        <RowIndexFrom>0</RowIndexFrom>
        <DateFrom>${formatSolvexDate(d1)}</DateFrom>
        <DateTo>${formatSolvexDate(d2)}</DateTo>
        <Pax>2</Pax>
        <Mode>0</Mode>
        <ResultView>1</ResultView>
        <CountryKeys><int>4</int></CountryKeys>
    `;
    
    const searchRes = await soapRequest('SearchHotelServices', {
        guid: guid,
        request: searchReq
    });
    
    if (!searchRes.success) {
        log('ERROR', 'Pronalaženje hotela neuspešno');
        return;
    }
    
    // Pronađi hotel ID-eve
    const hotelMatches = [...searchRes.data.matchAll(/<HotelKey>(.*?)<\/HotelKey>/g)];
    const hotelNames = [...searchRes.data.matchAll(/<HotelName[^>]*>(.*?)<\/HotelName>/g)];
    
    if (hotelMatches.length === 0) {
        log('ERROR', 'Nema hotela u pretrazi');
        return;
    }
    
    const testHotels = hotelMatches.slice(0, 3).map((match, idx) => ({
        id: match[1],
        name: hotelNames[idx] ? hotelNames[idx][1].substring(0, 50) : `Hotel ${idx}`
    }));
    
    log('SUCCESS', `Pronađeno ${testHotels.length} hotela za testiranje`);
    testHotels.forEach(h => log('INFO', `  • ${h.name} (ID: ${h.id})`));
    
    // STEP 3: TEST EACH HOTEL
    log('INFO', '\n📍 KORAK 3: Testiranje metoda za preuzimanje sadržaja...\n');
    
    const results = {
        descriptions: [],
        images: [],
        searchImages: []
    };
    
    for (const hotel of testHotels) {
        log('INFO', `\n─────────────────────────────────────────────────────────`);
        log('INFO', `Testiranje: ${hotel.name} (${hotel.id})`);
        log('INFO', `─────────────────────────────────────────────────────────`);
        
        // Test GetHotelDescription
        const descResult = await testGetHotelDescription(guid, hotel.id, hotel.name);
        if (descResult) results.descriptions.push(descResult);
        
        // Pauza između zahtjeva
        await new Promise(r => setTimeout(r, 500));
        
        // Test GetHotelImages
        const imgResult = await testGetHotelImages(guid, hotel.id, hotel.name);
        if (imgResult) results.images.push(imgResult);
        
        await new Promise(r => setTimeout(r, 500));
        
        // Test SearchHotelServices for image
        const searchImgResult = await testSearchHotelServicesForImage(guid, hotel.id, hotel.name);
        if (searchImgResult) results.searchImages.push(searchImgResult);
        
        await new Promise(r => setTimeout(r, 500));
    }
    
    // STEP 4: SUMMARY
    log('INFO', '\n╔════════════════════════════════════════════════════════════╗');
    log('INFO', '║ REZULTATI TESTA                                            ║');
    log('INFO', '╚════════════════════════════════════════════════════════════╝');
    
    log('INFO', `\n✅ GetHotelDescription: ${results.descriptions.length}/${testHotels.length} hotela`);
    results.descriptions.forEach(r => {
        log('DATA', `   • ${r.hotelName}: ${r.description.substring(0, 50)}...`);
    });
    
    log('INFO', `\n✅ GetHotelImages: ${results.images.length}/${testHotels.length} hotela`);
    results.images.forEach(r => {
        log('DATA', `   • ${r.hotelName}: ${r.imageCount} slika`);
    });
    
    log('INFO', `\n✅ SearchHotelServices: ${results.searchImages.length}/${testHotels.length} hotela`);
    results.searchImages.forEach(r => {
        log('DATA', `   • ${r.hotelName}: ${r.imageFound ? 'Slika pronađena' : 'Nema slike'}`);
    });
    
    // Save results
    fs.writeFileSync('solvex_content_test_results.json', JSON.stringify(results, null, 2));
    log('SUCCESS', '✅ Rezultati sačuvani u: solvex_content_test_results.json');
    
    log('INFO', '\n╔════════════════════════════════════════════════════════════╗');
    log('INFO', '║ ZAKLJUČCI I PREPORUKE                                      ║');
    log('INFO', '╚════════════════════════════════════════════════════════════╝');
    
    if (results.descriptions.length > 0) {
        log('SUCCESS', '✅ GetHotelDescription - RADI! Koristi za opise hotela');
    }
    
    if (results.images.length > 0) {
        log('SUCCESS', '✅ GetHotelImages - RADI! Koristi za galerije slika');
    }
    
    if (results.searchImages.length > 0) {
        log('SUCCESS', '✅ SearchHotelServices - Sadrži HotelImage! Dodatni izvor za glavnu sliku');
    }
}

// Run the test
runComprehensiveTest().catch(e => {
    log('ERROR', `Fatal error: ${e.message}`);
    console.error(e);
    process.exit(1);
});
