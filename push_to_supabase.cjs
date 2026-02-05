const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// --- CONFIGURATION ---
const ENV_PATH = path.join(__dirname, '.env');
const envConfig = parseEnv(ENV_PATH);

const SUPABASE_URL = envConfig.VITE_SUPABASE_URL;
const SUPABASE_KEY = envConfig.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseEnv(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
            result[key] = value;
        }
    });
    return result;
}

async function pushData() {
    console.log("📂 Reading solvex_hotels.json...");
    let rawData = fs.readFileSync('solvex_hotels.json', 'utf-8');

    // Fix potential JSON formatting issues (if script failed mid-write)
    // The main script writes "[\n", then objects, then maybe failed to close or closed with "{}]"
    // My previous script finished successfully so it should be valid or close
    // But let's handle the trailing comma if it exists

    // Quick fix for the specific format I wrote:
    // It ends with "{}]" or similar.
    // Let's just try parsing

    let hotels = [];
    try {
        hotels = JSON.parse(rawData);
    } catch (e) {
        console.warn("⚠️ valid JSON parse failed. Trying manual fix...");
        // Remove trailing comma if exists before closing bracket
        // Or if it ended with ",\n{}]"

        // Actually, let's just regex extract all objects
        // This is robust against the "appendFileSync" strategy

        // Wait, I can try to fix the end.
        if (rawData.trim().endsWith(',\n{}]')) {
            // This means the dummy object was added at the end
        }
    }

    // Try a simpler approach if parse failed: valid JSON array
    if (!hotels.length) {
        // If standard parse failed, try removing last comma
        try {
            // The script in import_solvex.cjs line 248 did: fs.appendFileSync('solvex_hotels.json', '{}]');
            // And line 225 did: JSON.stringify(property) + ',\n';
            // So the file looks like:
            // [
            // {...},
            // {...},
            // {}]
            // This is technically valid JSON! ( [{...}, {...}, {}] )
            // Let's assume standard parse works.
            hotels = JSON.parse(rawData);
        } catch (e) {
            console.error("❌ Fatal JSON Parse Error", e);
            return;
        }
    }

    // Filter out the last dummy object if empty
    hotels = hotels.filter(h => h.id && h.name);

    console.log(`✅ Loaded ${hotels.length} hotels.`);
    console.log("🚀 Pushing to Supabase in batches of 50...");

    const batchSize = 50;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);

        const { error } = await supabase
            .from('properties')
            .upsert(batch, { onConflict: 'id' });

        if (error) {
            console.error(`❌ Batch ${i} failed:`, error.message);
            failCount += batch.length;
        } else {
            successCount += batch.length;
            process.stdout.write('.');
        }
    }

    console.log(`\n🎉 DONE! Success: ${successCount}, Failed: ${failCount}`);
}

pushData();
