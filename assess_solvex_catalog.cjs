const fs = require('fs');
const https = require('https');
const { XMLParser } = require('fast-xml-parser');

const LOGIN = 'sol611s';
const PASSWORD = 'AqC384lF';
const URL = 'https://iservice.solvex.bg/IntegrationService.asmx';

async function fetchRequest(method, body) {
    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': `http://www.megatec.ru/${method}` },
            body: body
        });
        return await response.text();
    } catch (e) { return null; }
}

async function runAssessment() {
    console.log("--- SOLVEX CATALOG ASSESSMENT ---");

    // 0. Parser
    const parser = new XMLParser({
        ignoreAttributes: true,
        removeNSPrefix: true,
        textNodeName: 'value'
    });

    // 1. Connect
    const connectXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><Connect xmlns="http://www.megatec.ru/"><login>${LOGIN}</login><password>${PASSWORD}</password></Connect></soap:Body></soap:Envelope>`;
    const connectRes = await fetchRequest('Connect', connectXml);
    const guidMatch = connectRes.match(/<ConnectResult>(.*?)<\/ConnectResult>/);
    if (!guidMatch) { console.log("Login Failed"); return; }
    const guid = guidMatch[1];
    console.log("✅ API Connected");

    // 2. Get Countries
    console.log("Fetching Countries...");
    const countriesXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetCountries xmlns="http://www.megatec.ru/"><guid>${guid}</guid></GetCountries></soap:Body></soap:Envelope>`;
    const countriesRes = await fetchRequest('GetCountries', countriesXml);

    // Simple regex count to avoid parsing huge XML for now
    const countryCount = (countriesRes.match(/<Country>/g) || []).length;
    console.log(`Found ${countryCount} countries.`);

    // 3. Deep Dive into Bulgaria (4) and Greece (16)
    const targets = [{ id: 4, name: 'Bulgaria' }, { id: 16, name: 'Greece' }];
    let totalHotelsEstimate = 0;

    for (const t of targets) {
        console.log(`\nScanning ${t.name} (ID: ${t.id})...`);

        // Get Regions
        const regionsXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetRegions xmlns="http://www.megatec.ru/"><guid>${guid}</guid><countryKey>${t.id}</countryKey></GetRegions></soap:Body></soap:Envelope>`;
        const regRes = await fetchRequest('GetRegions', regionsXml);
        const regionCount = (regRes.match(/<Region>/g) || []).length;
        console.log(`-> Regions: ${regionCount}`);

        // Get Cities (All for country)
        const citiesXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetCities xmlns="http://www.megatec.ru/"><guid>${guid}</guid><countryKey>${t.id}</countryKey></GetCities></soap:Body></soap:Envelope>`;
        const citiesRes = await fetchRequest('GetCities', citiesXml);
        const cityIds = [];
        const cityMatches = citiesRes.matchAll(/<ID>(\d+)<\/ID>/g);
        for (const m of cityMatches) cityIds.push(m[1]);

        const uniqueCities = [...new Set(cityIds)]; // Dedupe
        console.log(`-> Cities: ${uniqueCities.length}`);

        // Sample Hotel Count (estimate)
        // We can't call GetHotels for EVERY city without taking too long, let's sample 3 major ones
        // or just call GetHotels for the whole country if API allows (it usually doesn't, requires city or region)

        // Let's try GetHotels by Region for first 3 regions to estimate
        const regIds = [];
        const regMatches = regRes.matchAll(/<ID>(\d+)<\/ID>/g);
        for (const m of regMatches) regIds.push(m[1]);

        let countryHotels = 0;
        const sampleLimit = Math.min(regIds.length, 5);
        console.log(`-> Sampling ${sampleLimit} regions for hotel density...`);

        for (let i = 0; i < sampleLimit; i++) {
            const rId = regIds[i];
            // GetCities for this region first
            const rCitiesXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetCities xmlns="http://www.megatec.ru/"><guid>${guid}</guid><regionKey>${rId}</regionKey></GetCities></soap:Body></soap:Envelope>`;
            const rCitiesRes = await fetchRequest('GetCities', rCitiesXml);

            // Extract one city from region to get hotels
            const firstCityMatch = rCitiesRes.match(/<ID>(\d+)<\/ID>/);
            if (!firstCityMatch) continue;

            const cId = firstCityMatch[1];
            const hotelsXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetHotels xmlns="http://www.megatec.ru/"><guid>${guid}</guid><cityKey>${cId}</cityKey></GetHotels></soap:Body></soap:Envelope>`;
            const hotelsRes = await fetchRequest('GetHotels', hotelsXml);
            const hCount = (hotelsRes.match(/<Hotel>/g) || []).length;
            countryHotels += hCount;
            if (hCount > 0) console.log(`   -> Region ${rId}/City ${cId}: Found ${hCount} hotels.`);
        }

        // Rough extrapolation
        const avg = countryHotels / sampleLimit;
        const estimated = Math.floor(avg * regIds.length);
        console.log(`-> Estimated Total Hotels in ${t.name}: ~${estimated}`);
        totalHotelsEstimate += estimated;
    }

    console.log(`\n---------------------------------`);
    console.log(`TOTAL ESTIMATED HOTELS: ~${totalHotelsEstimate}`);
    console.log(`---------------------------------`);

    // 4. Sample Data Quality Check
    console.log("\nChecking Data Quality for ONE hotel...");
    // Hardcoded known hotel ID from previous Bansko search or similar
    // Using one from previous log logic if available, or just guess one from recent scrape
    // Let's use hotel ID 1689 (often a test one) or search a specific one.
    // Actually, let's grab the first encountered hotel ID from the loop above if we stored it
    // For now I'll search Bansko hotels to pick a real one.
    const banskoXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetHotels xmlns="http://www.megatec.ru/"><guid>${guid}</guid><cityKey>440</cityKey></GetHotels></soap:Body></soap:Envelope>`;
    const banskoRes = await fetchRequest('GetHotels', banskoXml);
    const hotelIdMatch = banskoRes.match(/<ID>(\d+)<\/ID>/);

    if (hotelIdMatch) {
        const hId = hotelIdMatch[1];
        console.log(`Inspecting Hotel ID: ${hId}`);

        // Desc
        const descXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetHotelDescription xmlns="http://www.megatec.ru/"><guid>${guid}</guid><hotelCode>${hId}</hotelCode></GetHotelDescription></soap:Body></soap:Envelope>`;
        const descRes = await fetchRequest('GetHotelDescription', descXml);

        // Images
        const imgXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetHotelImages xmlns="http://www.megatec.ru/"><guid>${guid}</guid><hotelCode>${hId}</hotelCode></GetHotelImages></soap:Body></soap:Envelope>`;
        const imgRes = await fetchRequest('GetHotelImages', imgXml);

        const hasDesc = descRes.includes('Description') && descRes.length > 500;
        const imgCount = (imgRes.match(/<Image>/g) || []).length;

        console.log(`- Description Available: ${hasDesc ? 'YES' : 'NO/Weak'}`);
        console.log(`- Images Found: ${imgCount}`);

        if (imgCount > 0) {
            const urlMatch = imgRes.match(/<Url>(.*?)<\/Url>/);
            if (urlMatch) console.log(`- Sample Image: ${urlMatch[1]}`);
        }
    }
}

runAssessment();
