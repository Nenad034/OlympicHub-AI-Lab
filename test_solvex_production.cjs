const fs = require('fs');
const https = require('https');

// PRODUCTION CREDENTIALS
const SOLVEX_API_URL = 'https://iservice.solvex.bg/IntegrationService.asmx';
const LOGIN = 'sol611s';
const PASSWORD = 'AqC384lF';

async function soapRequest(method, params) {
    // Basic Envelope
    // Different methods might require different structure, but usually simple methods are direct children of Body
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="http://www.megatec.ru/">
      ${Object.entries(params).map(([k, v]) => `<${k}>${v}</${k}>`).join('\n')}
    </${method}>
  </soap:Body>
</soap:Envelope>`;

    console.log(`\n--- REQUEST: ${method} ---`);
    // console.log(envelope);

    try {
        const response = await fetch(SOLVEX_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': `http://www.megatec.ru/${method}` // Typical Megatec action
            },
            body: envelope
        });

        const text = await response.text();
        console.log(`--- RESPONSE STATUS: ${response.status} ${response.statusText} ---`);

        if (!response.ok) {
            console.error('Error Body:', text);
        }

        return text;
    } catch (e) {
        console.error("Fetch Error:", e);
        return null;
    }
}

async function run() {
    console.log('--- TESTING SOLVEX PRODUCTION ---');

    // 1. CONNECT
    const connectRes = await soapRequest('Connect', { login: LOGIN, password: PASSWORD });
    if (!connectRes || !connectRes.includes('ConnectResult')) {
        console.error('Connect Failed');
        return;
    }

    // Extract GUID
    const guidMatch = connectRes.match(/<ConnectResult>(.*?)<\/ConnectResult>/);
    if (!guidMatch) {
        console.error("Could not extract GUID");
        return;
    }
    const guid = guidMatch[1];
    console.log(`✅ CONNECT SUCCESS! GUID: ${guid}`);

    // 2. GET COUNTRIES
    console.log('\nFetching Countries...');
    const countriesRes = await soapRequest('GetCountries', { guid: guid });

    // Parse countries
    const countries = [];
    const countryChunks = countriesRes.split('<Country>');
    for (let i = 1; i < countryChunks.length; i++) {
        const chunk = countryChunks[i];
        const nameMatch = chunk.match(/<Name>(.*?)<\/Name>/);
        const idMatch = chunk.match(/<ID>(.*?)<\/ID>/);
        if (nameMatch && idMatch) {
            countries.push({ id: idMatch[1], name: nameMatch[1] });
        }
    }

    console.log(`Found ${countries.length} countries.`);

    let targetCity = null;
    let targetCountry = null;

    // 3. FIND CITIES (Loop countries until we find cities)
    for (const country of countries) {
        console.log(`Checking cities for ${country.name} (ID: ${country.id})...`);

        // Try variants
        const variants = [
            { countryKey: country.id },
            { CountryID: country.id },
            { countryId: country.id }
        ];

        let citiesRes = "";
        for (const params of variants) {
            citiesRes = await soapRequest('GetCities', { guid: guid, ...params });
            if (citiesRes.includes("<City") || citiesRes.includes("<City>")) {
                console.log(` -> Found cities using param: ${Object.keys(params)[0]}`);
                break;
            }
        }

        if (citiesRes.includes("<City") || citiesRes.includes("<City>")) {
            const cityChunks = citiesRes.split('<City>');
            if (cityChunks.length > 1) {
                const chunk = cityChunks[1];
                const idMatch = chunk.match(/<ID>(.*?)<\/ID>/);
                const nameMatch = chunk.match(/<Name>(.*?)<\/Name>/);
                if (idMatch) {
                    targetCity = { id: idMatch[1], name: nameMatch ? nameMatch[1] : 'Unknown' };
                    targetCountry = country;
                    console.log(` -> Picked City: ${targetCity.name} (ID: ${targetCity.id})`);
                    break; // Found a city, stop country loop
                }
            }
        }
    }

    if (!targetCity) {
        console.log("❌ Could not find ANY cities in any country. Checking global GetCities...");
        const citiesRes = await soapRequest('GetCities', { guid: guid });
        if (citiesRes.includes("<City")) {
            console.log(" -> Found global cities!");
            // Parse one...
            const chunk = citiesRes.split('<City>')[1];
            const idMatch = chunk.match(/<ID>(.*?)<\/ID>/);
            if (idMatch) targetCity = { id: idMatch[1], name: 'GlobalCity' };
        } else {
            console.log("❌ Global GetCities also returned empty.");
            return;
        }
    }

    if (!targetCity) { return; }

    // 4. GET HOTELS (for target city)
    console.log(`\nFetching Hotels for City: ${targetCity.name} (ID: ${targetCity.id})...`);

    // Try variants for GetHotels
    const hotelVariants = [
        { cityKey: targetCity.id },
        { CityID: targetCity.id },
        { cityId: targetCity.id }
    ];

    let hotelsRes = "";
    let firstHotelId = null;

    for (const params of hotelVariants) {
        hotelsRes = await soapRequest('GetHotels', { guid: guid, ...params });
        if (hotelsRes.includes("<Hotel") || hotelsRes.includes("<Hotel>")) {
            console.log(` -> Found hotels using param: ${Object.keys(params)[0]}`);
            // Extract ID
            const chunk = hotelsRes.split('<Hotel>')[1];
            const idMatch = chunk.match(/<ID>(.*?)<\/ID>/);
            if (idMatch) firstHotelId = idMatch[1];
            break;
        }
    }


    if (firstHotelId) {
        // 5. TEST HOTEL DESCRIPTION/IMAGES
        console.log(`\n✅ FOUND HOTEL ID: ${firstHotelId}`);
        console.log(`\n[Optional] Attempting GetHotelDescription for HotelID ${firstHotelId}...`);
        const descRes = await soapRequest('GetHotelDescription', { guid: guid, hotelCode: firstHotelId });

        if (descRes && descRes.includes("Description") && descRes.length > 500) {
            console.log("✅ Description found (Length > 500).");
        } else {
            console.log(`Response length: ${descRes ? descRes.length : 0}. Content sample: ${descRes ? descRes.substring(0, 200) : 'NULL'}`);
        }

        console.log(`\n[Optional] Attempting GetHotelImages for HotelID ${firstHotelId}...`);
        const imgRes = await soapRequest('GetHotelImages', { guid: guid, hotelCode: firstHotelId });

        if (imgRes && imgRes.includes("Image")) {
            console.log("✅ Images found via GetHotelImages.");
            const imgCount = (imgRes.match(/<Image>/g) || []).length;
            console.log(`Image count: ${imgCount}`);
        } else {
            console.log(`No images found or different format. Sample: ${imgRes ? imgRes.substring(0, 200) : 'NULL'}`);
        }
    } else {
        console.log("❌ No hotels found in the selected city.");
    }
}

run();
