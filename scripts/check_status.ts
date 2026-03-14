import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .not('embedding', 'is', null);
    
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total hotels with embeddings:', count);
    }

    const { count: total, error: err2 } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });
    
    if (err2) {
        console.error('Error total:', err2);
    } else {
        console.log('Total hotels in DB:', total);
    }
}

run();
