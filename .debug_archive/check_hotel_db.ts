
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHotel() {
    const solvexId = 'solvex_2260';
    console.log(`Checking for ID: ${solvexId}`);

    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', solvexId)
        .single();

    if (error) {
        console.error('Error fetching hotel:', error.message);
        // Try without prefix
        const { data: data2, error: error2 } = await supabase
            .from('properties')
            .select('*')
            .eq('id', '2260')
            .single();

        if (data2) {
            console.log('Found without prefix:');
            console.log(JSON.stringify(data2, null, 2).substring(0, 1000));
        } else {
            console.log('Not found without prefix either.');
        }
    } else {
        console.log('Found with prefix:');
        console.log(JSON.stringify(data, null, 2).substring(0, 1000));
    }
}

checkHotel();
