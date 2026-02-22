const FILOS_CREDENTIALS = {
    username: 'demo@filostravel.gr',
    password: 'filosdemo2022!'
};

async function testHotelSearch() {
    console.log('--- Testing Hotel Search (Hotel Prassino Nissi) ---');

    // Testing both full ID and extracted numeric ID
    const idsToTest = ['OT-PROP-A-100938', '100938'];

    for (const id of idsToTest) {
        console.log(`\nTesting ID: ${id}`);
        try {
            const response = await fetch('https://api-v2.onetourismo.com/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...FILOS_CREDENTIALS,
                    start_date: '2026-06-01',
                    end_date: '2026-06-08',
                    nationality: 'RS',
                    rooms: [{ adults: 2, children: 0 }],
                    hotelCodes: [id]
                })
            });

            const data = await response.json();
            console.log('Status:', data.status);
            console.log('Message:', data.message);
            if (data.results) {
                const results = Array.isArray(data.results) ? data.results : (data.results.hotels || data.results.results || []);
                console.log('Results count:', results.length);
                if (results.length > 0) {
                    console.log('Found:', results[0].hotel_name || results[0].name);
                }
            }
        } catch (e) {
            console.error('Fetch error:', e.message);
        }
    }
}

testHotelSearch();
