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

async function check() {
    console.log("Checking 'properties'...");
    const { data: pData, error: pError } = await supabase.from('properties').select('id').limit(1);
    if (pError) console.log("Properties Error:", pError.message);
    else console.log("Properties Exists. Count:", pData.length);

    console.log("Checking 'accommodations'...");
    const { data: aData, error: aError } = await supabase.from('accommodations').select('id').limit(1);
    if (aError) console.log("Accommodations Error:", aError.message);
    else console.log("Accommodations Exists. Count:", aData.length);
}

check();
