
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function sync() {
    console.log('Fetching first 100 hotels from Solvex...');
    const response = await fetch('https://b2b.solvex.bg/en/api/?limit=100');
    const rawResult = await response.json();
    const hotels = rawResult.data || rawResult.hotels || [];
    console.log('Syncing', hotels.length, 'hotels...');

    const upsertData = hotels.map(hotel => {
        const images = [];
        if (hotel.image?.url) images.push(hotel.image.url);
        if (hotel.images && Array.isArray(hotel.images)) {
            hotel.images.forEach(img => { if (img.url && !images.includes(img.url)) images.push(img.url); });
        }

        return {
            id: `solvex_${hotel.il_id || hotel.id}`,
            name: hotel.il_hotelname || hotel.name || 'Unknown Hotel',
            images: images,
            content: { description: hotel.description, notes: hotel.notes },
            address: {
                city: hotel.city?.name || '',
                country: hotel.country?.name || 'Bulgaria'
            },
            updated_at: new Date().toISOString()
        };
    });

    const { error } = await supabase.from('properties').upsert(upsertData);
    if (error) console.error('Error:', error);
    else console.log('Successfully synced 100 hotels!');
}
sync();
