const FILOS_DEMO_CREDENTIALS = {
    username: 'demo@filostravel.gr',
    password: 'filosdemo2022!'
};

async function testV2() {
    try {
        const response = await fetch('https://api-v2.onetourismo.com/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...FILOS_DEMO_CREDENTIALS,
                start_date: '2026-06-01',
                end_date: '2026-06-08',
                nationality: 'RS',
                rooms: [{ adults: 2, children: 0 }],
                destination: '5' // Rhodes
            })
        });

        const data = await response.json();
        console.log('Status:', data.status);
        console.log('Message:', data.message);
        console.log('Results count:', data.results ? (Array.isArray(data.results) ? data.results.length : (data.results.hotels ? data.results.hotels.length : 0)) : 0);
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            console.log('Sample:', data.results[0].hotel_name);
        } else if (data.results && data.results.hotels && data.results.hotels.length > 0) {
            console.log('Sample (hotels):', data.results.hotels[0].hotel_name);
        }
    } catch (e) {
        console.error(e);
    }
}

testV2();
