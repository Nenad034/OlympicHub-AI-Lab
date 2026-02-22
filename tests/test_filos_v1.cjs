const FILOS_CREDENTIALS = {
    username: 'demo@filostravel.gr',
    password: 'filosdemo2022!'
};

async function testV1() {
    const auth = Buffer.from(`${FILOS_CREDENTIALS.username}:${FILOS_CREDENTIALS.password}`).toString('base64');
    try {
        console.log('--- Testing V1 Search (Hotel Prassino Nissi) ---');
        const response = await fetch('https://api-static.onetourismo.com/availability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify({
                start_date: '2026-06-01',
                end_date: '2026-06-08',
                nationality: 'RS',
                rooms: [{ adults: 2, children: 0 }],
                hotelCodes: ['OT-PROP-A-100938']
            })
        });

        const data = await response.json();
        console.log('DataKeys:', Object.keys(data));
        if (data.results) {
            console.log('Results count:', data.results.length);
        } else if (data.hotels) {
            console.log('Hotels count:', data.hotels.length);
        } else if (Array.isArray(data)) {
            console.log('Array count:', data.length);
        }
        console.log('Full response:', JSON.stringify(data).substring(0, 500));
    } catch (e) {
        console.error(e);
    }
}

testV1();
