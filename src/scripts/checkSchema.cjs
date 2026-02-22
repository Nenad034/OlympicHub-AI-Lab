
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    try {
        const { data, error } = await supabase.from('properties').select('*').limit(1);
        if (error) {
            console.error('Error fetching properties:', error);
        } else if (data && data.length > 0) {
            console.log('--- SCHEMA FOUND ---');
            console.log('Sample Property Data Keys:', Object.keys(data[0]));
        } else {
            console.log('Table is empty or no data found.');
        }
    } catch (e) {
        console.error('Catch error:', e);
    }
}

checkSchema();
