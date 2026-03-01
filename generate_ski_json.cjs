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

            let allResorts = [];
            const seen = new Set();

            geojson.features.forEach(feature => {
                const props = feature.properties;
                const nameEn = props.name || props.places?.[0]?.localized?.en?.locality || props.places?.[0]?.name;

                if (props && props.places && props.places.length > 0) {
                    const place = props.places[0].localized?.en;
                    if (place && place.country && targetCountries.includes(place.country) && nameEn) {

                        // Izračunaj stvarnu kilometražu i broj žičara kako bi ignorisali prazne (duplirane) objekte
                        let totalLength = 0;
                        const diffs = props.statistics?.runs?.byActivity?.downhill?.byDifficulty || {};
                        Object.values(diffs).forEach(d => { totalLength += d.lengthInKm || 0; });

                        let totalLifts = 0;
                        const types = props.statistics?.lifts?.byType || {};
                        Object.values(types).forEach(t => { totalLifts += t.count || 0; });

                        const validResort = totalLength > 0 || totalLifts > 0;

                        if (validResort) {
                            // dedupliciramo po nazivu i državi
                            const id = (nameEn + '_' + place.country).toLowerCase();
                            if (!seen.has(id)) {
                                seen.add(id);

                                // Get coordinates
                                let lat = 0;
                                let lng = 0;
                                if (feature.geometry?.type === 'Point') {
                                    [lng, lat] = feature.geometry.coordinates;
                                } else if (feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon') {
                                    const coordinates = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates[0] : feature.geometry.coordinates[0][0];
                                    if (coordinates && coordinates[0]) {
                                        [lng, lat] = coordinates[0];
                                    }
                                }

                                allResorts.push({
                                    id: props.id,
                                    name: nameEn,
                                    country: countryNamesSr[place.country],
                                    originalCountry: place.country,
                                    region: place.region || place.locality || '',
                                    status: props.status === 'operating' ? 'open' : 'closed',
                                    location: { lat, lng },
                                    activities: props.activities || [],
                                    stats: {
                                        runs: props.statistics?.runs || {},
                                        lifts: props.statistics?.lifts || {},
                                        elevation: props.statistics?.elevation || {}
                                    }
                                });
                            }
                        }
                    }
                }
            });

            // sort po veličini skijališta
            allResorts.sort((a, b) => {
                let lenA = 0, lenB = 0, liftsA = 0, liftsB = 0;
                Object.values(a.stats.runs?.byActivity?.downhill?.byDifficulty || {}).forEach(d => lenA += d.lengthInKm || 0);
                Object.values(b.stats.runs?.byActivity?.downhill?.byDifficulty || {}).forEach(d => lenB += d.lengthInKm || 0);
                Object.values(a.stats.lifts?.byType || {}).forEach(t => liftsA += t.count || 0);
                Object.values(b.stats.lifts?.byType || {}).forEach(t => liftsB += t.count || 0);

                return (lenB + liftsB * 2) - (lenA + liftsA * 2);
            });

            const targetDir = 'd:/PrimeClickToTravel - refaktorisano/src/integrations/ski/data';
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            fs.writeFileSync(targetDir + '/europe_ski_resorts.json', JSON.stringify(allResorts, null, 2));
            console.log('Successfully generated europe_ski_resorts.json with ' + allResorts.length + ' resorts.');

        } catch (e) {
            console.error('Error parsing data:', e.message);
        }
    });
});
req.on('error', (e) => {
    console.error('Request error:', e.message);
});
