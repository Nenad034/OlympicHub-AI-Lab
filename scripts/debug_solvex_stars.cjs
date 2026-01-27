
const fs = require('fs');

async function debugSolvexStars() {
    const API_URL = 'https://evaluation.solvex.bg/iservice/integrationservice.asmx';
    const LOGIN = 'sol611s';
    const PASSWORD = 'En5AL535';
    const CITY_KEY = 33; // Golden Sands

    console.log('Connecting to Solvex API...');

    // 1. Authenticate
    const authEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <Connect xmlns="http://www.megatec.ru/">
      <login>${LOGIN}</login>
      <password>${PASSWORD}</password>
    </Connect>
  </soap:Body>
</soap:Envelope>`;

    const authRes = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://www.megatec.ru/Connect'
        },
        body: authEnvelope
    });

    const authXml = await authRes.text();
    const guidMatch = authXml.match(/<ConnectResult>([^<]+)<\/ConnectResult>/);
    const guid = guidMatch ? guidMatch[1] : null;

    if (!guid) {
        console.error('Failed to authenticate');
        return;
    }

    console.log('Authenticated! GUID:', guid);

    // 2. Get Hotels
    const hotelsEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <GetHotels xmlns="http://www.megatec.ru/">
      <guid>${guid}</guid>
      <cityKey>${CITY_KEY}</cityKey>
    </GetHotels>
  </soap:Body>
</soap:Envelope>`;

    const hotelsRes = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://www.megatec.ru/GetHotels'
        },
        body: hotelsEnvelope
    });

    const hotelsXml = await hotelsRes.text();

    // Save raw XML for inspection
    fs.writeFileSync('d:/OlympicHub/solvex_raw_response.xml', hotelsXml);
    console.log('Raw XML saved to: d:/OlympicHub/solvex_raw_response.xml');

    // Parse and analyze
    const hotelMatches = hotelsXml.matchAll(/<Hotel>([\s\S]*?)<\/Hotel>/g);
    const hotels = [];
    const starDistribution = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };

    for (const match of hotelMatches) {
        const content = match[1];
        const name = (content.match(/<Name>([^<]*)<\/Name>/) || [])[1] || '';
        const description = (content.match(/<Description>([^<]*)<\/Description>/) || [])[1] || '';
        const id = (content.match(/<ID>([^<]*)<\/ID>/) || [])[1] || '';

        // Extract stars from description (e.g. "5*  (\Golden Sands)")
        let starNum = 0;
        const starMatch = description.match(/(\d)\s*\*+/);
        if (starMatch) {
            starNum = parseInt(starMatch[1]);
        }

        starDistribution[starNum.toString()] = (starDistribution[starNum.toString()] || 0) + 1;

        hotels.push({ id, name, stars: starNum });

        // Log Admiral specifically
        if (name.toLowerCase().includes('admiral') || name.toLowerCase().includes('адмирал')) {
            console.log('\n=== ADMIRAL HOTEL FOUND ===');
            console.log('Name:', name);
            console.log('Description:', description);
            console.log('ID:', id);
            console.log('Stars:', starNum);
            console.log('Raw XML snippet:', content.substring(0, 500));
        }
    }

    console.log('\n=== STAR DISTRIBUTION ===');
    console.log('0 stars:', starDistribution['0']);
    console.log('1 star:', starDistribution['1']);
    console.log('2 stars:', starDistribution['2']);
    console.log('3 stars:', starDistribution['3']);
    console.log('4 stars:', starDistribution['4']);
    console.log('5 stars:', starDistribution['5']);

    console.log('\n=== ALL 5-STAR HOTELS ===');
    const fiveStarHotels = hotels.filter(h => h.stars === 5);
    if (fiveStarHotels.length > 0) {
        fiveStarHotels.forEach(h => console.log(`${h.name} (ID: ${h.id})`));
    } else {
        console.log('NO 5-STAR HOTELS FOUND!');
    }

    console.log('\n=== SAMPLE HOTELS (first 5) ===');
    hotels.slice(0, 5).forEach(h => {
        console.log(`${h.name} - ${h.stars}* (ID: ${h.id})`);
    });
}

debugSolvexStars().catch(err => {
    console.error('Error:', err);
});
