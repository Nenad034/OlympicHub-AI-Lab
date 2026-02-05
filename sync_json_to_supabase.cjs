const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '.env');
function parseEnv(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) result[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
    });
    return result;
}
const env = parseEnv(ENV_PATH);
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function runSync() {
    console.log("📂 Reading solvex_hotels.json...");
    try {
        const raw = fs.readFileSync('solvex_hotels.json', 'utf-8');
        // The file format we created is: [ \n {obj}, \n {obj}, \n {}]
        // We can parse it directly if it is valid JSON.
        // If there were issues with trailing commas (JSON standard doesn't allow trailing comma before ]),
        // we might need to fix it.
        // My previous script did: `fs.appendFileSync('solvex_hotels.json', '{}]');`
        // So `... , \n {}]` -> valid JSON array where last item is empty object.

        const hotels = JSON.parse(raw);
        console.log(`📦 Loaded ${hotels.length} entries.`);

        // Filter out the dummy empty object we added at the end
        const validHotels = hotels.filter(h => h.id && h.name);
        console.log(`✨ Valid hotels to sync: ${validHotels.length}`);

        const BATCH_SIZE = 50;
        let synced = 0;
        let errors = 0;

        for (let i = 0; i < validHotels.length; i += BATCH_SIZE) {
            const batch = validHotels.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('properties').upsert(batch, { onConflict: 'id' });

            if (error) {
                console.error(`❌ Batch ${i} - ${i + BATCH_SIZE} failed:`, error.message);
                errors += batch.length;
            } else {
                synced += batch.length;
                process.stdout.write(`✅ Synced ${synced}/${validHotels.length}\r`);
            }
        }

        console.log(`\n🏁 Sync Complete. Success: ${synced}, Failed: ${errors}`);

    } catch (e) {
        console.error("Critical Error:", e.message);
    }
}

runSync();
