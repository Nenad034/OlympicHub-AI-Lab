
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

const resorts = [
    {
        id: 'kopaonik-serbia',
        name: 'Kopaonik',
        country: 'Srbija',
        region: 'Raški okrug',
        latitude: 43.2855,
        longitude: 20.8115,
        status: 'open',
        map_image_url: 'https://www.infokop.net/images/stories/mape_skicentra/mapa_skicentra_kopaonik_velika.jpg',
        website_url: 'https://www.infokop.net',
        activities: ['downhill', 'night_skiing', 'snowboarding'],
        stats: {
            runs: {
                count: 36,
                byActivity: {
                    downhill: {
                        byDifficulty: {
                            easy: { count: 18, lengthInKm: 30 },
                            intermediate: { count: 12, lengthInKm: 20 },
                            advanced: { count: 6, lengthInKm: 10 }
                        }
                    }
                }
            },
            lifts: {
                count: 24,
                byType: {
                    chair_lift: { count: 15 },
                    drag_lift: { count: 9 }
                }
            }
        }
    },
    {
        id: 'bansko-bulgaria',
        name: 'Bansko',
        country: 'Bugarska',
        region: 'Blagoevgrad',
        latitude: 41.8384,
        longitude: 23.4885,
        status: 'open',
        map_image_url: 'https://www.bulgarian-ski.com/uploads/maps/bansko_ski_map.jpg',
        website_url: 'https://www.banskoski.com',
        activities: ['downhill', 'snowboarding'],
        stats: {
            runs: {
                count: 22,
                byActivity: {
                    downhill: {
                        byDifficulty: {
                            easy: { count: 10, lengthInKm: 35 },
                            intermediate: { count: 8, lengthInKm: 25 },
                            advanced: { count: 4, lengthInKm: 15 }
                        }
                    }
                }
            },
            lifts: {
                count: 14,
                byType: {
                    gondola: { count: 1 },
                    chair_lift: { count: 8 },
                    drag_lift: { count: 5 }
                }
            }
        }
    },
    {
        id: 'st-anton-austria',
        name: 'St. Anton am Arlberg',
        country: 'Austrija',
        region: 'Tirol',
        latitude: 47.1296,
        longitude: 10.2682,
        status: 'open',
        map_image_url: 'https://www.st-anton.at/en/global/images/skimaps/skimap_arlberg_east.jpg',
        website_url: 'https://www.stantonamarlberg.com',
        activities: ['downhill', 'backcountry', 'nordic'],
        stats: {
            runs: {
                count: 88,
                byActivity: {
                    downhill: {
                        byDifficulty: {
                            easy: { count: 30, lengthInKm: 130 },
                            intermediate: { count: 40, lengthInKm: 120 },
                            advanced: { count: 18, lengthInKm: 55 }
                        }
                    }
                }
            },
            lifts: {
                count: 88,
                byType: {
                    cable_car: { count: 12 },
                    chair_lift: { count: 45 },
                    drag_lift: { count: 31 }
                }
            }
        }
    }
];

async function seedResorts() {
    console.log('Seeding Ski Resorts...');
    for (const resort of resorts) {
        const { error } = await supabase.from('ski_resorts').upsert(resort);
        if (error) {
            console.error(`Error seeding ${resort.name}:`, error);
        } else {
            console.log(`Successfully seeded ${resort.name}`);
        }
    }
}

seedResorts();
