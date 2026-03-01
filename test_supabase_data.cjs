
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from the root or .env if it exists
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('No VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
    console.log('Testing Supabase Connection...');
    try {
        const { data, error, status } = await supabase.from('ski_resorts').select('*').limit(5);
        if (error) {
            console.error('Error fetching ski_resorts:', error);
            console.log('Status code:', status);
        } else {
            console.log('Success! Found', data.length, 'resorts.');
            console.log('Data:', JSON.stringify(data, null, 2));
        }

        // Check if table exists by querying information_schema if possible (might fail due to permissions)
        const { data: tableCheck, error: tableError } = await supabase.rpc('get_tables');
        if (tableError) {
            console.log('RPC get_tables failed (common)');
        } else {
            console.log('Tables in DB:', tableCheck);
        }

    } catch (e) {
        console.error('Thrown error:', e);
    }
}

testSupabase();
