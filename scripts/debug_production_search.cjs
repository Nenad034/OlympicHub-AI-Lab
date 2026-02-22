const https = require('https');
const { XMLParser } = require('fast-xml-parser');

async function runDebug() {
    const LOGIN = 'sol611s';
    const PASSWORD = 'AqC384lF';
    const URL = 'https://iservice.solvex.bg/IntegrationService.asmx';

    // 1. Connect
    console.log("Connecting...");
    const connectXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Connect xmlns="http://www.megatec.ru/">
      <login>${LOGIN}</login>
      <password>${PASSWORD}</password>
    </Connect>
  </soap:Body>
</soap:Envelope>`;

    const connectRes = await fetchRequest(URL, 'Connect', connectXml);
    const guidMatch = connectRes.match(/<ConnectResult>(.*?)<\/ConnectResult>/);
    if (!guidMatch) { console.error("Login failed", connectRes); return; }
    const guid = guidMatch[1];
    console.log("GUID:", guid);

    // 2. Search Parameters (Summer 2026, Greece as we know it works from previous tests or try generic)
    // We will search specifically to get at least ONE result.
    // Use dates from screenshot: 02.08.2026 - 09.08.2026
    const cityId = 440; // Bansko
    const dateFrom = '2026-08-02T00:00:00';
    const dateTo = '2026-08-09T00:00:00';
    // ... rest of xml ...
    const searchXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SearchHotelServices xmlns="http://www.megatec.ru/">
      <guid>${guid}</guid>
      <request>
        <PageSize>20</PageSize>
        <RowIndexFrom>0</RowIndexFrom>
        <DateFrom>${dateFrom}</DateFrom>
        <DateTo>${dateTo}</DateTo>
        <Pax>2</Pax>
        <Mode>0</Mode>
        <ResultView>1</ResultView>
        <QuotaTypes><int>0</int><int>1</int></QuotaTypes>
        <CityKeys><int>${cityId}</int></CityKeys>
      </request>
    </SearchHotelServices>
  </soap:Body>
</soap:Envelope>`;

    console.log("Searching...");
    const searchRes = await fetchRequest(URL, 'SearchHotelServices', searchXml);

    // 3. PARSE using fast-xml-parser SAME CONFIG as client
    const parserOptions = {
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        parseAttributeValue: true,
        trimValues: true,
        removeNSPrefix: true
    };
    const parser = new XMLParser(parserOptions);
    const parsed = parser.parse(searchRes);

    // 4. Mimic cleanAttributes
    const cleaned = cleanAttributes(parsed);

    // 5. Inspect Content
    try {
        const body = cleaned.Envelope.Body;
        const response = body.SearchHotelServicesResponse.SearchHotelServicesResult;
        console.log("Response Keys:", Object.keys(response));

        const dataRes = response.Data.DataRequestResult;
        console.log("DataRequestResult found.");

        // Ensure array
        const results = Array.isArray(dataRes) ? dataRes : [dataRes];
        const first = results[0]; // Usually multiple tables if multiple requests, but here 1

        const resultTable = first.ResultTable;
        const diffgram = resultTable.diffgram;
        const docElem = diffgram.NewDataSet || diffgram.DocumentElement; // Solvex often calls it NewDataSet or DocumentElement

        if (!docElem) {
            console.log("No DocumentElement/NewDataSet found. Diffgram keys:", Object.keys(diffgram));
            return;
        }

        const services = docElem.SetupPriceView || docElem.HotelServices;
        console.log("Services container found keys:", Object.keys(docElem));

        if (!services) {
            console.log("No services found.");
            return;
        }

        const list = Array.isArray(services) ? services : [services];
        console.log(`Found ${list.length} services.`);

        if (list.length > 0) {
            console.log("--- FIRST ITEM STRUCTURE ---");
            console.log(JSON.stringify(list[0], null, 2));

            console.log("--- SPECIFIC FIELDS ---");
            console.log("HotelName Type:", typeof list[0].HotelName);
            console.log("HotelName Value:", list[0].HotelName);
            console.log("Description Type:", typeof list[0].Description);
            console.log("Description Value:", list[0].Description);
        }

    } catch (e) {
        console.error("Deep inspection failed:", e);
        console.log("Parsed Structure:", JSON.stringify(cleaned, null, 2).substring(0, 2000));
    }
}

// Emulate Helper
function cleanAttributes(obj) {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(item => cleanAttributes(item));
    if (typeof obj === 'object') {
        const cleaned = {};
        let hasTextInfo = false;
        let textValue = null;

        for (const key in obj) {
            if (key === '#text') {
                hasTextInfo = true;
                textValue = obj[key];
                continue;
            }
            const targetKey = key.startsWith('@_') ? key.substring(2) : key;
            if (targetKey.includes(':') || targetKey === 'xmlns' || targetKey.startsWith('xsi:')) continue;
            cleaned[targetKey] = cleanAttributes(obj[key]);
        }

        if (hasTextInfo && Object.keys(cleaned).length === 0) return textValue;
        return cleaned;
    }
    return obj;
}

async function fetchRequest(url, method, body) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': `http://www.megatec.ru/${method}`
        },
        body: body
    });
    return await response.text();
}

runDebug();
