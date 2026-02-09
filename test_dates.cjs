const FILOS_CREDENTIALS = {
    username: 'demo@filostravel.gr',
    password: 'filosdemo2022!'
};

async function findWorkingDates() {
    const auth = Buffer.from(`${FILOS_CREDENTIALS.username}:${FILOS_CREDENTIALS.password}`).toString('base64');

    // Try different date ranges
    const dateRanges = [
        { start: '2026-05-01', end: '2026-05-08', label: 'Early May' },
        { start: '2026-06-01', end: '2026-06-08', label: 'Early June' },
        { start: '2026-07-01', end: '2026-07-08', label: 'Early July' },
        { start: '2026-08-01', end: '2026-08-08', label: 'Early August' },
        { start: '2025-06-01', end: '2025-06-08', label: '2025 June' },
    ];

    const hotelIds = ['OT-PROP-A-975', 'OT-PROP-B-7383194', 'OT-PROP-B-7388080'];

    for (const dateRange of dateRanges) {
        console.log(`\nTrying ${dateRange.label} (${dateRange.start} to ${dateRange.end})...`);

        try {
            const resp = await fetch('https://api-v2.onetourismo.com/availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`
                },
                body: JSON.stringify({
                    username: FILOS_CREDENTIALS.username,
                    password: FILOS_CREDENTIALS.password,
                    start_date: dateRange.start,
                    end_date: dateRange.end,
                    nationality: 'RS',
                    rooms: [{ adults: 2, children: 0 }],
                    hotelCodes: hotelIds
                })
            });

            const data = await resp.json();
            const results = data.results || [];
            console.log(`  Results: ${results.length}`);

            if (results.length > 0) {
                console.log(`  ✅ FOUND AVAILABILITY!`);
                console.log(`  Hotel: ${results[0].name}`);
                console.log(`  Rooms: ${results[0].rooms?.length || 0}`);
                return;
            }
        } catch (e) {
            console.log(`  Error: ${e.message}`);
        }
    }

    console.log('\n❌ No availability found in any date range');
}

findWorkingDates();
