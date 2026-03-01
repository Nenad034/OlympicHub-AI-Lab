
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env variables manually for CJS script if needed, 
// but since we are running in the workspace we can expect them in process.env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_PATH = path.join(__dirname, 'src/integrations/ski/data/europe_ski_resorts.json');

async function migrate() {
    console.log('🚀 Starting migration to Supabase...');

    if (!fs.existsSync(DATA_PATH)) {
        console.error(`❌ Data file not found at ${DATA_PATH}`);
        return;
    }

    const rawData = fs.readFileSync(DATA_PATH, 'utf8');
    const resorts = JSON.parse(rawData);

    console.log(`📦 Found ${resorts.length} resorts to migrate.`);

    // Chunking to avoid large request payload errors
    const CHUNK_SIZE = 100;
    for (let i = 0; i < resorts.length; i += CHUNK_SIZE) {
        const chunk = resorts.slice(i, i + CHUNK_SIZE);

        const mappedBatch = chunk.map(r => ({
            id: r.id,
            name: r.name,
            country: r.country,
            original_country: r.originalCountry,
            region: r.region,
            status: r.status,
            latitude: r.location?.lat,
            longitude: r.location?.lng,
            activities: r.activities,
            stats: r.stats,
            updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('ski_resorts')
            .upsert(mappedBatch, { onConflict: 'id' });

        if (error) {
            console.error(`❌ Error in chunk ${i / CHUNK_SIZE + 1}:`, error.message);
        } else {
            console.log(`✅ Chunk ${i / CHUNK_SIZE + 1} uploaded (${mappedBatch.length} items)`);
        }
    }

    console.log('✨ Migration finished!');
}

migrate();
