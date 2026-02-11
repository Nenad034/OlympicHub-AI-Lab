
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
    console.log('Fetching...');
    const response = await fetch('https://b2b.solvex.bg/en/api/?limit=1000000');
    const rawResult = await response.json();
    const hotels = rawResult.data || rawResult.hotels || [];
    console.log('Found', hotels.length, 'hotels');

    const hotel2260 = hotels.find(h => h.id == '2260' || h.il_id == '2260');
    if (hotel2260) {
        console.log('Syncing Lilia (2260)...');
        const images = [];
        if (hotel2260.image?.url) images.push(hotel2260.image.url);
        if (hotel2260.images) {
            hotel2260.images.forEach(img => {
                if (img.url && !images.includes(img.url)) images.push(img.url);
            });
        }

        const upsertData = {
            id: `solvex_2260`,
            name: hotel2260.il_hotelname || hotel2260.name || 'Lilia',
            images: images,
            content: {
                description: hotel2260.description,
                notes: hotel2260.notes
            },
            propertyAmenities: [],
            address: {
                city: hotel2260.city?.name || 'Golden Sands',
                country: hotel2260.country?.name || 'Bulgaria'
            },
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('properties').upsert(upsertData);
        if (error) console.error('Error:', error);
        else console.log('Successfully synced Lilia with images!');
    } else {
        console.log('Lilia not found in API!');
    }
}
sync();
