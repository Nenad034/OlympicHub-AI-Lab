const FILOS_CREDENTIALS = {
    username: 'demo@filostravel.gr',
    password: 'filosdemo2022!'
};

async function testCurrentAvailability() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 14); // 2 weeks from now
    const checkOut = new Date(nextWeek);
    checkOut.setDate(nextWeek.getDate() + 7);

    const formatDate = (d) => d.toISOString().split('T')[0];

    console.log(`--- Testing availability for ${formatDate(nextWeek)} to ${formatDate(checkOut)} ---`);

    const params = {
        ...FILOS_CREDENTIALS,
        start_date: formatDate(nextWeek),
        end_date: formatDate(checkOut),
        nationality: 'RS',
        rooms: [{ adults: 2, children: 0 }],
        hotelCodes: ['OT-PROP-A-100938']
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
                console.log('Found:', results[0].hotel_name);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

testCurrentAvailability();
