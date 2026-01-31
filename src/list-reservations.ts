import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually parse .env
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listReservations() {
    const { data, error } = await supabase
        .from('reservations')
        .select('id, ref_code, created_at, customer_name')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching reservations:', error);
        return;
    }

    console.log('--- Current Reservations ---');
    data.forEach((r, i) => {
        console.log(`${i + 1}. ID: ${r.id} | REF: ${r.ref_code} | Created: ${r.created_at} | Name: ${r.customer_name}`);
    });
}

listReservations();
