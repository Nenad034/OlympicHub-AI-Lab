const fs = require('fs');
const https = require('https');

// PRODUCTION CREDENTIALS
const SOLVEX_API_URL = 'https://iservice.solvex.bg/IntegrationService.asmx';
const LOGIN = 'sol611s';
const PASSWORD = 'AqC384lF';

function formatSolvexDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function soapRequest(method, params) {
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="http://www.megatec.ru/">
      ${Object.entries(params).map(([k, v]) => {
        if (typeof v === 'object') {
            // Handle nested objects recursively if needed, or manual XML string
            // For this test, we assume 'v' might be a complex XML string logic or handled specifically
            // But for the 'request' parameter of SearchHotelServices, it's a complex object.
            // We will construct the inner XML manually in the 'run' function for simplicity.
            return `<${k}>${v}</${k}>`;
        }
        return `<${k}>${v}</${k}>`;
    }).join('\n')}
    </${method}>
  </soap:Body>
</soap:Envelope>`;

    console.log(`\n--- REQUEST: ${method} ---`);
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
        return text;
    } catch (e) {
        console.error("Fetch Error:", e);
        return null;
    }
}

async function run() {
    console.log('--- TESTING SOLVEX SEARCH ---');

    // 1. CONNECT
    const connectRes = await soapRequest('Connect', { login: LOGIN, password: PASSWORD });
    const guidMatch = connectRes.match(/<ConnectResult>(.*?)<\/ConnectResult>/);
    if (!guidMatch) {
        console.error("Connect Failed");
        return;
    }
    const guid = guidMatch[1];
    console.log(`✅ CONNECT SUCCESS! GUID: ${guid}`);

    // 2. SEARCH
    // Prepare dates
    const d1 = new Date(); d1.setDate(d1.getDate() + 30);
    const d2 = new Date(); d2.setDate(d2.getDate() + 37); // 7 nights

    // Construct Request XML for SearchHotelServices
    // We need to match the structure expected by 'request' parameter
    // <request>
    //   <PageSize>50</PageSize>
    //   ...
    //   <CountryKeys><int>4</int></CountryKeys>
    // </request>

    const requestXml = `
        <PageSize>20</PageSize>
        <RowIndexFrom>0</RowIndexFrom>
        <DateFrom>${formatSolvexDate(d1)}</DateFrom>
        <DateTo>${formatSolvexDate(d2)}</DateTo>
        <Pax>2</Pax>
        <Mode>0</Mode>
        <ResultView>1</ResultView>
        <QuotaTypes><int>0</int><int>1</int></QuotaTypes>
        <CountryKeys><int>16</int></CountryKeys> 
    `;
    // Using CountryID 16 (Greece) as it usually has content. Or 4 (Bulgaria).
    // Let's try 4 (Bulgaria) as Solvex is BG.

    console.log("Searching for hotels in Bulgaria (ID 4)...");

    const searchRes = await soapRequest('SearchHotelServices', {
        guid: guid,
        request: requestXml.replace(/\CountryKeys>.*?<\/CountryKeys>/, '<CountryKeys><int>4</int></CountryKeys>')
    });

    // console.log("Response sample:", searchRes.substring(0, 1000));

    // Parse results
    // Looking for <HotelKey>...</HotelKey> inside <HotelService> or similar
    const hotelMatches = [...searchRes.matchAll(/<HotelKey>(.*?)<\/HotelKey>/g)];
    console.log(`Found ${hotelMatches.length} hotel services/offers.`);

    if (hotelMatches.length > 0) {
        const firstHotelId = hotelMatches[0][1];
        console.log(`✅ Picked HotelID: ${firstHotelId} from search results.`);

        // 3. GET INFO
        console.log(`\n[Test] GetHotelDescription for HotelID ${firstHotelId}...`);
        const descRes = await soapRequest('GetHotelDescription', { guid: guid, hotelCode: firstHotelId });
        if (descRes.includes("Description") && descRes.length > 500) {
            console.log("✅ Description found.");
        } else {
            console.log("❌ No description or empty.");
            console.log(descRes.substring(0, 300));
        }

        console.log(`\n[Test] GetHotelImages for HotelID ${firstHotelId}...`);
        const imgRes = await soapRequest('GetHotelImages', { guid: guid, hotelCode: firstHotelId });
        if (imgRes.includes("Image")) {
            console.log("✅ Images found via GetHotelImages.");
        } else {
            console.log("❌ No images found.");
        }
    } else {
        console.log("No hotels found in search. Raw response:");
        console.log(searchRes.substring(0, 500));
    }
}

run();
