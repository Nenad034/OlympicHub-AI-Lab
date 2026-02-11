
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('properties').select('*').limit(1);
    if (error) console.log('Error:', error);
    else if (data.length > 0) console.log('Columns:', Object.keys(data[0]));
    else console.log('No data found to check columns');
}
check();
