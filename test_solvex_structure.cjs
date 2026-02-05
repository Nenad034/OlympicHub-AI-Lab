const fs = require('fs');
const https = require('https');

// PRODUCTION CREDENTIALS
const SOLVEX_API_URL = 'https://iservice.solvex.bg/IntegrationService.asmx';
const LOGIN = 'sol611s';
const PASSWORD = 'AqC384lF';

async function soapRequest(method, params) {
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="http://www.megatec.ru/">
      ${Object.entries(params).map(([k, v]) => `<${k}>${v}</${k}>`).join('\n')}
    </${method}>
  </soap:Body>
</soap:Envelope>`;

    console.log(`\n--- REQUEST: ${method} ---`);
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
        console.log(`--- RESPONSE STATUS: ${response.status} ${response.statusText} ---`);
        return text;
    } catch (e) {
        console.error("Fetch Error:", e);
        return null;
    }
}

async function run() {
    console.log('--- TESTING SOLVEX STRUCTURE ---');

    // 1. CONNECT
    const connectRes = await soapRequest('Connect', { login: LOGIN, password: PASSWORD });
    const guidMatch = connectRes.match(/<ConnectResult>(.*?)<\/ConnectResult>/);
    if (!guidMatch) return;
    const guid = guidMatch[1];

    // 2. GET REGIONS (For Bulgaria ID 4)
    console.log("Fetching Regions for Country 4...");
    const regionsRes = await soapRequest('GetRegions', { guid: guid, countryKey: 4 });
    console.log("Raw Regions:", regionsRes.substring(0, 500));

    const regionChunks = regionsRes.split('<Region>');
    console.log(`Regions found: ${regionChunks.length - 1}`);

    let firstRegionId = null;
    if (regionChunks.length > 1) {
        const chunk = regionChunks[1];
        firstRegionId = chunk.match(/<ID>(.*?)<\/ID>/)?.[1];
        console.log(`Picked RegionID: ${firstRegionId}`);
    }

    // 3. GET CITIES (Try with Region if found)
    if (firstRegionId) {
        console.log(`Fetching Cities for RegionID ${firstRegionId}...`);
        const citiesRes = await soapRequest('GetCities', { guid: guid, regionKey: firstRegionId });
        console.log("Raw Cities (by Region):", citiesRes.substring(0, 500));

        const cityChunks = citiesRes.split('<City>');
        console.log(`Cities found (by Region): ${cityChunks.length - 1}`);

        if (cityChunks.length > 1) {
            const chunk = cityChunks[1];
            const cityId = chunk.match(/<ID>(.*?)<\/ID>/)?.[1];
            console.log(`Picked CityID: ${cityId}`);

            // 4. GET HOTELS (by City)
            if (cityId) {
                console.log(`Fetching Hotels for CityID ${cityId}...`);
                const hotelsRes = await soapRequest('GetHotels', { guid: guid, cityKey: cityId });
                console.log("Raw Hotels:", hotelsRes.substring(0, 500));

                const hotelChunks = hotelsRes.split('<Hotel>');
                if (hotelChunks.length > 1) {
                    const hotelId = hotelChunks[1].match(/<ID>(.*?)<\/ID>/)?.[1];
                    console.log(`✅ FOUND HOTEL: ${hotelId}`);

                    // 5. TEST DESC
                    const descRes = await soapRequest('GetHotelDescription', { guid: guid, hotelCode: hotelId });
                    if (descRes.includes("Description")) console.log("✅ Description found.");
                }
            }
        }
    } else {
        // Try GetResorts?
        console.log("Fetching Resorts...");
        const resortsRes = await soapRequest('GetResorts', { guid: guid, countryKey: 4 }); // Or global
        console.log("Raw Resorts:", resortsRes.substring(0, 500));
    }
}

run();
