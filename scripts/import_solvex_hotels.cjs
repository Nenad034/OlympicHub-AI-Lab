const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const { createClient } = require('@supabase/supabase-js');

// --- CONFIGURATION ---
const ENV_PATH = path.join(__dirname, '.env');
const envConfig = parseEnv(ENV_PATH);

const SUPABASE_URL = envConfig.VITE_SUPABASE_URL;
const SUPABASE_KEY = envConfig.VITE_SUPABASE_ANON_KEY;
// Better to use SERVICE_ROLE key if available for bulk inserts to bypass RLS, 
// but assuming ANON key allows inserts for authenticated users or public (based on project state).
// If RLS blocks, user might need to adjust policies. For now using provided key.

const SOLVEX_URL = envConfig.VITE_SOLVEX_API_URL || 'https://iservice.solvex.bg/IntegrationService.asmx';
const SOLVEX_LOGIN = envConfig.VITE_SOLVEX_LOGIN || 'sol611s';
const SOLVEX_PASSWORD = envConfig.VITE_SOLVEX_PASSWORD || 'AqC384lF';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parser (Ignore attributes to fix [object Object] issue)
const parser = new XMLParser({
    ignoreAttributes: true,
    removeNSPrefix: true,
    textNodeName: 'value',
    parseAttributeValue: true,
    trimValues: true
});

// --- HELPERS ---
function parseEnv(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1'); // Remove quotes
            result[key] = value;
        }
    });
    return result;
}

async function fetchRequest(method, body) {
    try {
        const response = await fetch(SOLVEX_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': `http://www.megatec.ru/${method}` },
            body: body
        });
        return await response.text();
    } catch (e) {
        console.error(`Request ${method} failed:`, e);
        return null;
    }
}

function parseResponse(xml) {
    try {
        const parsed = parser.parse(xml);
        // Navigate to body
        const body = parsed?.Envelope?.Body;
        if (!body) return null;

        // Body usually contains MethodResponse, e.g. ConnectResponse
        // But fast-xml-parser might put keys directly if namespaces are stripped oddly
        // Let's iterate keys to find *Response
        const keys = Object.keys(body);
        const responseKey = keys.find(k => k.endsWith('Response'));
        const responseObj = responseKey ? body[responseKey] : body; // Fallback to body if no wrapper

        if (!responseObj) return null;

        // Inside MethodResponse, look for MethodResult e.g. ConnectResult
        const resKeys = Object.keys(responseObj);
        const resultKey = resKeys.find(k => k.endsWith('Result'));
        return resultKey ? responseObj[resultKey] : null;
    } catch (e) { return null; }
}

function extractArray(obj, key) {
    if (!obj) return [];
    // Handle case where fast-xml-parser returns object for single item or array for multiple
    // Also handle 'NewDataSet' wrapper often used by Solvex
    let target = obj;
    if (obj.NewDataSet && obj.NewDataSet[key]) target = obj.NewDataSet;

    if (!target[key]) return [];
    return Array.isArray(target[key]) ? target[key] : [target[key]];
}

// --- MAIN LOGIC ---

async function runImport() {
    console.log("🚀 STARTING SOLVEX HOTEL IMPORT...");
    console.log(`Target Supabase: ${SUPABASE_URL}`);

    // 1. Connect
    const connectXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><Connect xmlns="http://www.megatec.ru/"><login>${SOLVEX_LOGIN}</login><password>${SOLVEX_PASSWORD}</password></Connect></soap:Body></soap:Envelope>`;
    const connectRes = await fetchRequest('Connect', connectXml);
    const connectParsed = parseResponse(connectRes);
    const guid = connectParsed;

    if (!guid || typeof guid !== 'string' || guid.length < 10) {
        console.error("❌ Login Failed. Response:", connectParsed);
        return;
    }
    console.log(`✅ Connected! GUID: ${guid}`);

    // 2. Iterate Countries
    const targets = [
        { id: 4, name: 'Bulgaria' },
        { id: 16, name: 'Greece' }
    ];

    let totalImported = 0;

    for (const country of targets) {
        console.log(`\n🌍 Processing Country: ${country.name} (${country.id})`);

        // Get Regions
        const regXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetRegions xmlns="http://www.megatec.ru/"><guid>${guid}</guid><countryKey>${country.id}</countryKey></GetRegions></soap:Body></soap:Envelope>`;
        const regRes = await fetchRequest('GetRegions', regXml);
        const regParsed = parseResponse(regRes);
        const regions = extractArray(regParsed, 'Region');

        console.log(`   Found ${regions.length} regions.`);

        for (const region of regions) {
            console.log(`   📍 Processing Region: ${region.Name} (${region.ID})`);

            // Get Cities for Region
            const cityXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetCities xmlns="http://www.megatec.ru/"><guid>${guid}</guid><regionKey>${region.ID}</regionKey></GetCities></soap:Body></soap:Envelope>`;
            const cityRes = await fetchRequest('GetCities', cityXml);
            const cityParsed = parseResponse(cityRes);
            const cities = extractArray(cityParsed, 'City');

            for (const city of cities) {
                // Get Hotels for City
                const hotelsXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetHotels xmlns="http://www.megatec.ru/"><guid>${guid}</guid><cityKey>${city.ID}</cityKey></GetHotels></soap:Body></soap:Envelope>`;
                const hotelsRes = await fetchRequest('GetHotels', hotelsXml);
                const hotelsParsed = parseResponse(hotelsRes);
                const hotels = extractArray(hotelsParsed, 'Hotel');

                if (hotels.length > 0) {
                    process.stdout.write(`      Processing City: ${city.Name} (${city.ID}) - ${hotels.length} hotels`);

                    // Process Hotels in Batches to avoid rate limits
                    const batchSize = 10;
                    for (let i = 0; i < hotels.length; i += batchSize) {
                        const batch = hotels.slice(i, i + batchSize);
                        const promises = batch.map(h => importHotel(guid, h, city, country));
                        await Promise.all(promises);
                        process.stdout.write('.');
                    }
                    console.log(' Done.');
                    totalImported += hotels.length;
                }
            }
        }
    }

    console.log(`\n🎉 IMPORT COMPLETE! Total Hotels Processed: ${totalImported}`);
}

async function importHotel(guid, hotel, city, country) {
    try {
        // 1. Fetch Description
        const descXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetHotelDescription xmlns="http://www.megatec.ru/"><guid>${guid}</guid><hotelCode>${hotel.ID}</hotelCode></GetHotelDescription></soap:Body></soap:Envelope>`;
        const descRes = await fetchRequest('GetHotelDescription', descXml);
        const descParsed = parseResponse(descRes);
        const description = (descParsed && typeof descParsed === 'string') ? descParsed : '';

        // 2. Fetch Images
        const imgXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetHotelImages xmlns="http://www.megatec.ru/"><guid>${guid}</guid><hotelCode>${hotel.ID}</hotelCode></GetHotelImages></soap:Body></soap:Envelope>`;
        const imgRes = await fetchRequest('GetHotelImages', imgXml);
        const imgParsed = parseResponse(imgRes);
        const rawImages = extractArray(imgParsed, 'Image');

        const images = rawImages.map(img => ({
            url: img.Url,
            title: img.Description || '',
            isMain: false
        })).filter(img => img.url);

        if (images.length > 0) images[0].isMain = true;

        // 3. Determine Stars
        let stars = 0;
        if (hotel.Stars) stars = parseInt(hotel.Stars);
        if (isNaN(stars) || stars === 0) {
            const starMatch = hotel.Name.match(/(\d)\*/);
            if (starMatch) stars = parseInt(starMatch[1]);
        }

        // 4. Construct DB Object
        const property = {
            id: `solvex_${hotel.ID}`,
            name: hotel.Name,
            propertyType: 'Hotel', // Default
            starRating: stars || 3,
            isActive: true,
            address: {
                city: city.Name,
                country: country.name,
                addressLine: '' // Not reliably available
            },
            geoCoordinates: {
                latitude: hotel.Latitude || null,
                longitude: hotel.Longitude || null
            },
            content: {
                description: description
            },
            images: images,
            propertyAmenities: [],
            updated_at: new Date().toISOString()
        };

        // SAVE TO ARRAY (Global or verify logic)
        // For now, let's append to a file synchronously to be safe
        const fileData = JSON.stringify(property) + ',\n';
        fs.appendFileSync('solvex_hotels.json', fileData);

        // 5. Upsert to Supabase (SKIPPED FOR NOW TO ENSURE DATA COLLECTION FIRST)
        /*
        const { error } = await supabase
            .from('properties')
            .upsert(property, { onConflict: 'id' });

        if (error) {
            console.error(`\n❌ Failed to insert ${hotel.Name}:`, error.message);
        }
        */

    } catch (e) {
        console.error(`\n⚠️ Error importing hotel ${hotel.ID}:`, e.message);
    }
}

// Initialize file
fs.writeFileSync('solvex_hotels.json', '[\n');

runImport().then(() => {
    fs.appendFileSync('solvex_hotels.json', '{}]'); // Close array with dummy object or just ']'
    // Fix trailing comma later or valid JSON stream
});
