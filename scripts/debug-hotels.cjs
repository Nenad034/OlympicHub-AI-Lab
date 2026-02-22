
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHotels() {
    console.log('Checking hotels in Supabase...');

    const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error counting properties:', error);
    } else {
        console.log(`Total properties in DB: ${count}`);
    }

    const { data, error: dataError } = await supabase
        .from('properties')
        .select('id, name')
        .limit(10);
    
    if (dataError) {
        console.error('Error fetching sample properties:', dataError);
    } else {
        console.log('Sample properties:', data);
    }
    
    // Check for Solvex/Filos specifically
    const { count: solvexCount, error: solvexError } = await supabase
         .from('properties')
         .select('*', { count: 'exact', head: true })
         .like('id', 'solvex-%');
         
    if (solvexError) console.error('Error counting Solvex properties:', solvexError);
    else console.log(`Solvex properties count: ${solvexCount}`);

    const { count: filosCount, error: filosError } = await supabase
         .from('properties')
         .select('*', { count: 'exact', head: true })
         .like('id', 'filos-%');
         
    if (filosError) console.error('Error counting Filos properties:', filosError);
    else console.log(`Filos properties count: ${filosCount}`);
}

checkHotels();
