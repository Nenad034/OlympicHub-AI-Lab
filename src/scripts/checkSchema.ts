
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    const { data, error } = await supabase.from('properties').select('*').limit(1);
    if (error) {
        console.error('Error fetching properties:', error);
    } else {
        console.log('Sample Property Data Keys:', Object.keys(data?.[0] || {}));
        console.log('Data:', JSON.stringify(data?.[0], null, 2));
    }
}

checkSchema();
