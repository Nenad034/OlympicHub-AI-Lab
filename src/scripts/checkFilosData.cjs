
async function checkFilos() {
    const username = 'demo@filostravel.gr';
    const password = 'filosdemo2022!';
    const auth = Buffer.from(`${username}:${password}`).toString('base64');

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

        if (hotels && hotels.length > 0) {
            console.log('--- SAMPLE FILOS HOTEL ---');
            const h = hotels[0];
            console.log('Keys:', Object.keys(h));
            console.log('Name:', h.name);
            console.log('Description:', h.description || h.content?.description || 'N/A');
            console.log('Description Subkeys:', h.description ? Object.keys(h.description) : 'N/A');
            console.log('Photos:', h.photos ? h.photos.length : 0);
            if (h.photos && h.photos.length > 0) console.log('First Photo:', h.photos[0]);
        } else {
            console.log('No hotels found.');
        }
    } catch (e) {
        console.error(e);
    }
}

checkFilos();
