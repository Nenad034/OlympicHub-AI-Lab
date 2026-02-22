const FILOS_DEMO_CREDENTIALS = {
    username: 'demo@filostravel.gr',
    password: 'filosdemo2022!'
};

async function listCities() {
    const auth = Buffer.from(`${FILOS_DEMO_CREDENTIALS.username}:${FILOS_DEMO_CREDENTIALS.password}`).toString('base64');
    try {
        const response = await fetch(`https://api-static.onetourismo.com/static/my_properties?include_static=true`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        const hotels = Array.isArray(data) ? data : (data.hotels || data.results || data);

        const cities = new Set();
        hotels.forEach(h => {
            if (h.location && h.location.city) cities.add(h.location.city);
        });

        console.log('Available cities:', Array.from(cities).join(', '));
    } catch (e) {
        console.error(e);
    }
}

listCities();
