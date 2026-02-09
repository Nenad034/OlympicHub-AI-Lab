const FILOS_CREDENTIALS = {
    username: 'demo@filostravel.gr',
    password: 'filosdemo2022!'
};

async function testAvailability() {
    console.log('--- Testing Filos V2 Availability with GEO IDs ---');

    // Testing Corfu Island ID
    const params = {
        ...FILOS_CREDENTIALS,
        start_date: '2026-06-01',
        end_date: '2026-06-08',
        nationality: 'RS',
        rooms: [{ adults: 2, children: 0 }],
        destination: 'OT-LOC-GEO-2463678' // Corfu Island
    };

    try {
        const response = await fetch('https://api-v2.onetourismo.com/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        const data = await response.json();
        console.log('Status:', data.status);
        console.log('Message:', data.message);
        if (data.results) {
            const results = Array.isArray(data.results) ? data.results : (data.results.results || []);
            console.log('Results count:', results.length);
            if (results.length > 0) {
                console.log('Sample:', results[0].hotel_name);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

testAvailability();
