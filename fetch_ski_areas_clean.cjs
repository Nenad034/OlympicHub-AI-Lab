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

const req = https.get(url, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const geojson = JSON.parse(rawData);

            const results = {};
            targetCountries.forEach(c => results[c] = []);

            geojson.features.forEach(feature => {
                const props = feature.properties;
                const nameEn = props.name || props.places?.[0]?.localized?.en?.locality || props.places?.[0]?.name;

                if (props && props.places && props.places.length > 0) {
                    const place = props.places[0].localized?.en;
                    if (place && place.country && targetCountries.includes(place.country) && nameEn) {
                        const lengthKm = props.statistics?.runs?.byActivity?.downhill?.lengthInKm || 0;
                        const lifts = props.statistics?.lifts?.count || 0;
                        results[place.country].push({
                            name: nameEn,
                            lengthKm: parseFloat(lengthKm.toFixed(1)),
                            lifts: lifts
                        });
                    }
                }
            });

            let md = '# OpenSkiMap Baza - Lista Izabranih Ski Centara\n\n';
            md += 'Ovde su prikazani prepoznati ski centri za tražene države. Zbog veličine baze izbačena su mala neimenovana skijališta i livade.\n\n';

            targetCountries.forEach(country => {
                const resorts = results[country];
                // Ukloni duplikate i sortiraj
                const uniqueResorts = [];
                const seen = new Set();
                resorts.forEach(r => {
                    const id = r.name.toLowerCase();
                    if (!seen.has(id)) {
                        seen.add(id);
                        uniqueResorts.push(r);
                    }
                });

                // Sort by lifts / length descending
                uniqueResorts.sort((a, b) => (b.lengthKm + b.lifts * 2) - (a.lengthKm + a.lifts * 2));

                md += `## ${countryNamesSr[country]} (${uniqueResorts.length} skijališta)\n\n`;
                if (uniqueResorts.length === 0) {
                    md += '*Nema podataka*\n\n';
                } else {
                    md += '| R.B. | Naziv Ski Centra | Dužina Staza (km) | Broj Žičara |\n';
                    md += '|---|---|---|---|\n';
                    uniqueResorts.forEach((r, idx) => {
                        md += `| ${idx + 1} | ${r.name} | ${r.lengthKm > 0 ? r.lengthKm + ' km' : '-'} | ${r.lifts > 0 ? r.lifts : '-'} |\n`;
                    });
                    md += '\n';
                }
            });

            fs.writeFileSync('C:/Users/nenad/.gemini/antigravity/brain/6513a28d-c9cd-40e9-adfd-052f1c1d1771/openskimap_filtrirana_lista.md', md);
            console.log('Report generated.');

        } catch (e) {
            console.error('Error parsing data:', e.message);
        }
    });
});
req.on('error', (e) => {
    console.error('Request error:', e.message);
});
