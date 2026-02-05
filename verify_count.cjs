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

async function checkCount() {
    console.log("Checking row count in 'properties'...");
    const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.log("Error:", error.message);
    } else {
        console.log(`✅ Total rows in DB: ${count}`);
    }
}

checkCount();
