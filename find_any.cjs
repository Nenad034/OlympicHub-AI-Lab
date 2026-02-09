const FILOS_CREDENTIALS = {
    username: 'demo@filostravel.gr',
    password: 'filosdemo2022!'
};

async function findDetailed() {
    const auth = Buffer.from(`${FILOS_CREDENTIALS.username}:${FILOS_CREDENTIALS.password}`).toString('base64');
    try {
        const propResp = await fetch(`https://api-static.onetourismo.com/static/my_properties?include_static=true`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });
        const dataStatic = await propResp.json();
        const hotelsList = Array.isArray(dataStatic) ? dataStatic : (dataStatic.hotels || dataStatic.results || []);
        const ids = hotelsList.slice(0, 50).map(h => h.id);

        const response = await fetch('https://api-v2.onetourismo.com/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...FILOS_CREDENTIALS,
                start_date: '2026-06-01',
                end_date: '2026-06-08',
                nationality: 'RS',
                rooms: [{ adults: 2, children: 0 }],
                hotelCodes: ids
            })
        });

        const dataAvail = await response.json();
        if (dataAvail.results) {
            const results = Array.isArray(dataAvail.results) ? dataAvail.results : (dataAvail.results.results || dataAvail.results.hotels || []);
            if (results.length > 0) {
                console.log('--- SAMPLE RESULT ---');
                console.log(JSON.stringify(results[0], null, 2));
            } else {
                console.log('No availability for these hotels.');
            }
        }
    } catch (e) {
        console.error(e);
    }
}

findDetailed();
