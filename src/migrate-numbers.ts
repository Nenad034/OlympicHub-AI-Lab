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

async function migrate() {
    console.log('--- Starting Migration: Row Numbers ---');

    // 1. Get all reservations ordered by creation date
    const { data, error } = await supabase
        .from('reservations')
        .select('id, ref_code, created_at, customer_name')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching reservations:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No reservations found to migrate.');
        return;
    }

    console.log(`Found ${data.length} reservations. Starting update...`);

    const currentYear = new Date().getFullYear();

    for (let i = 0; i < data.length; i++) {
        const res = data[i];
        const nextNum = (i + 1).toString().padStart(7, '0');
        const newRefCode = `Ref - ${nextNum}/${currentYear}`;

        console.log(`UPDATING: ${res.id} | Old: ${res.ref_code} -> New: ${newRefCode} | For: ${res.customer_name}`);

        const { error: updateError } = await supabase
            .from('reservations')
            .update({ ref_code: newRefCode })
            .eq('id', res.id);

        if (updateError) {
            console.error(`Error updating record ${res.id}:`, updateError);
        }
    }

    console.log('--- Migration Completed! ---');
}

migrate();
