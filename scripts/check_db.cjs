
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('properties').select('*').eq('id', 'solvex_2260').single();
    if (error) console.log('Error:', error.message);
    else console.log('Found:', data.name, 'Images count:', data.images?.length);
}
check();
