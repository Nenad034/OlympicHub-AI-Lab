
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCount() {
    console.log('Checking ski_resorts count...');
    const { count, error } = await supabase
        .from('ski_resorts')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total resorts in Supabase:', count);
    }

    // Try to fetch first 5 to see structure
    const { data, error: fetchError } = await supabase
        .from('ski_resorts')
        .select('id, name, country')
        .limit(5);

    if (fetchError) {
        console.error('Fetch error:', fetchError);
    } else {
        console.log('Sample data:', data);
    }
}

checkCount();
