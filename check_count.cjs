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

async function checkCount() {
    console.log("🔍 Checking Supabase properties count...");

    // Using head:true to get count only
    const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("❌ Error fetching count:", error.message);
    } else {
        console.log(`✅ Total properties in Supabase: ${count}`);
    }
}

checkCount();
