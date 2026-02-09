const FILOS_CREDENTIALS = {
    username: 'demo@filostravel.gr',
    password: 'filosdemo2022!'
};

async function testCorfuAvailability() {
    const auth = Buffer.from(`${FILOS_CREDENTIALS.username}:${FILOS_CREDENTIALS.password}`).toString('base64');

    try {
        // First, get all hotels
        console.log('Step 1: Getting all hotels...');
        const hotelsResp = await fetch(`https://api-static.onetourismo.com/static/my_properties?include_static=true`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });
        const hotelsData = await hotelsResp.json();
        const allHotels = Array.isArray(hotelsData) ? hotelsData : (hotelsData.hotels || hotelsData.results || []);

        // Filter Corfu hotels
        const corfuHotels = allHotels.filter(h => {
            let loc = '';
            if (h.location) {
                if (typeof h.location === 'string') loc = h.location.toLowerCase();
                else if (h.location.city) loc = h.location.city.toLowerCase();
            }
            return loc.includes('corfu') || loc.includes('krf') || loc.includes('kerkyra');
        });

        console.log(`Found ${corfuHotels.length} Corfu hotels`);
        if (corfuHotels.length > 0) {
            console.log('Sample hotel:', corfuHotels[0].name || corfuHotels[0].hotel_name, 'ID:', corfuHotels[0].id || corfuHotels[0].hotel_id);
        }

        // Get hotel IDs
        const hotelIds = corfuHotels.map(h => h.id || h.hotel_id).filter(Boolean).slice(0, 10);
        console.log('\nTesting with hotel IDs:', hotelIds);

        // Step 2: Check availability
        console.log('\nStep 2: Checking availability...');
        const availResp = await fetch('https://api-v2.onetourismo.com/availability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify({
                username: FILOS_CREDENTIALS.username,
                password: FILOS_CREDENTIALS.password,
                start_date: '2026-06-15',
                end_date: '2026-06-22',
                nationality: 'RS',
                rooms: [{ adults: 2, children: 0 }],
                hotelCodes: hotelIds
            })
        });

        const availData = await availResp.json();
        console.log('\nAvailability response status:', availResp.status);
        console.log('Response keys:', Object.keys(availData));

        const results = Array.isArray(availData) ? availData : (availData.results || availData.hotels || []);
        console.log('Results count:', results.length);

        if (results.length > 0) {
            console.log('\n✅ SUCCESS! Sample result:');
            console.log('Hotel:', results[0].name);
            console.log('Rooms available:', results[0].rooms?.length || 0);
        } else {
            console.log('\n❌ No availability found');
            console.log('Full response:', JSON.stringify(availData, null, 2));
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

testCorfuAvailability();
