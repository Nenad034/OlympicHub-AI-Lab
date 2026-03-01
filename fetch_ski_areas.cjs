const fs = require('fs');
const https = require('https');

const url = 'https://tiles.openskimap.org/geojson/ski_areas.geojson';
const targetCountries = ['Serbia', 'Austria', 'Italy', 'Georgia', 'Azerbaijan', 'France', 'Switzerland'];
const countryNamesSr = {
    'Serbia': 'Srbija',
    'Austria': 'Austrija',
    'Italy': 'Italija',
    'Georgia': 'Gruzija',
    'Azerbaijan': 'Azerbejdžan',
    'France': 'Francuska',
    'Switzerland': 'Švajcarska'
};

console.log('Fetching OpenSkiMap data...');
const req = https.get(url, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            console.log('Data fetched, parsing JSON...');
            const geojson = JSON.parse(rawData);

            const results = {};
            targetCountries.forEach(c => results[c] = []);

            let totalCount = 0;

            geojson.features.forEach(feature => {
                const props = feature.properties;
                // 'places' array usually contains localized data
                if (props && props.places && props.places.length > 0) {
                    const place = props.places[0].localized?.en;
                    if (place && place.country && targetCountries.includes(place.country)) {
                        // Extract run lengths to sort by size
                        const lengthKm = props.statistics?.runs?.byActivity?.downhill?.lengthInKm || 0;
                        results[place.country].push({
                            name: props.name || 'Unknown',
                            lengthKm: parseFloat(lengthKm.toFixed(1))
                        });
                        totalCount++;
                    }
                }
            });

            console.log(`Found ${totalCount} resorts in target countries.`);

            let md = '# Lista Ski Centara (OpenSkiMap)\n\n';
            md += 'Ovo je izvod direktno iz globalne OpenSkiMap baze podataka.\n\n';

            targetCountries.forEach(country => {
                const resorts = results[country];
                // Sort by total downhill run length descending
                resorts.sort((a, b) => b.lengthKm - a.lengthKm);

                md += `## ${countryNamesSr[country]} (${resorts.length} skijališta)\n\n`;
                if (resorts.length === 0) {
                    md += '*Nema podataka*\n\n';
                } else {
                    md += '| R.B. | Naziv Ski Centra | Dužina Staza (km) |\n';
                    md += '|---|---|---|\n';
                    resorts.forEach((r, idx) => {
                        md += `| ${idx + 1} | ${r.name} | ${r.lengthKm > 0 ? r.lengthKm : '?'} |\n`;
                    });
                    md += '\n';
                }
            });

            fs.writeFileSync('C:/Users/nenad/.gemini/antigravity/brain/6513a28d-c9cd-40e9-adfd-052f1c1d1771/openskimap_resort_list_123.md', md);
            console.log('Report generated at C:/Users/nenad/.gemini/antigravity/brain/6513a28d-c9cd-40e9-adfd-052f1c1d1771/openskimap_resort_list_123.md');

        } catch (e) {
            console.error('Error parsing data:', e.message);
        }
    });
});
req.on('error', (e) => {
    console.error('Request error:', e.message);
});
