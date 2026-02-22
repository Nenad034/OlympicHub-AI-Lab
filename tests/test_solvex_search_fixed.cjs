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
    return `${year}-${month}-${day}T00:00:00`;
}

async function soapRequest(method, params) {
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="http://www.megatec.ru/">
      ${Object.entries(params).map(([k, v]) => {
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
    console.log('--- TESTING SOLVEX SEARCH (FIXED) ---');

    // 1. CONNECT
    const connectRes = await soapRequest('Connect', { login: LOGIN, password: PASSWORD });
    const guidMatch = connectRes.match(/<ConnectResult>(.*?)<\/ConnectResult>/);
    if (!guidMatch) {
        console.error("Connect Failed");
        console.log(connectRes);
        return;
    }
    const guid = guidMatch[1];
    console.log(`✅ CONNECT SUCCESS! GUID: ${guid}`);

    // 2. SEARCH
    // Prepare dates
    const d1 = new Date(); d1.setDate(d1.getDate() + 30);
    const d2 = new Date(); d2.setDate(d2.getDate() + 37); // 7 nights

    // Construct Request XML for SearchHotelServices
    // Adding T00:00:00 to dates
    // Using CountryID 4 (Bulgaria)

    const requestXml = `
        <PageSize>20</PageSize>
        <RowIndexFrom>0</RowIndexFrom>
        <DateFrom>${formatSolvexDate(d1)}</DateFrom>
        <DateTo>${formatSolvexDate(d2)}</DateTo>
        <Pax>2</Pax>
        <Mode>0</Mode>
        <ResultView>1</ResultView>
        <QuotaTypes><int>0</int><int>1</int></QuotaTypes>
        <CountryKeys><int>4</int></CountryKeys> 
    `;

    console.log("Searching for hotels in Bulgaria (ID 4)...");

    const searchRes = await soapRequest('SearchHotelServices', {
        guid: guid,
        request: requestXml
    });

    if (!searchRes) return;

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
            if (descRes.includes("Error")) console.log(descRes);
            else console.log(`Len: ${descRes.length}`);
        }

        console.log(`\n[Test] GetHotelImages for HotelID ${firstHotelId}...`);
        const imgRes = await soapRequest('GetHotelImages', { guid: guid, hotelCode: firstHotelId });
        if (imgRes.includes("<Image>")) {
            console.log("✅ Images found via GetHotelImages.");
        } else {
            console.log("❌ No images found.");
        }
    } else {
        console.log("No hotels found in search. Raw response sample:");
        console.log(searchRes.substring(0, 500));
    }
}

run();
