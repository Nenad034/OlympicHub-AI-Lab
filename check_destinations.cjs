const FILOS_CREDENTIALS = {
    username: 'demo@filostravel.gr',
    password: 'filosdemo2022!'
};

async function checkDestinations() {
    const auth = Buffer.from(`${FILOS_CREDENTIALS.username}:${FILOS_CREDENTIALS.password}`).toString('base64');
    try {
        const response = await fetch('https://api-static.onetourismo.com/static/destinations', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        const destinations = Array.isArray(data) ? data : (data.destinations || data.results || []);

        console.log('Total destinations:', destinations.length);

        const corfu = destinations.filter(d => d.name.toLowerCase().includes('corfu') || d.name.toLowerCase().includes('krf'));
        console.log('Corfu matches:', corfu.map(c => `${c.id}: ${c.name}`));

        const athens = destinations.filter(d => d.name.toLowerCase().includes('athens') || d.name.toLowerCase().includes('atina'));
        console.log('Athens matches:', athens.map(a => `${a.id}: ${a.name}`));

    } catch (e) {
        console.error(e);
    }
}

checkDestinations();
