
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function testWrite() {
    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase config");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const testId = 'solvex_1060';

    console.log(`Testing write access for ${testId}...`);

    const { error } = await supabase
        .from('properties')
        .update({
            content: { last_enrichment_test: new Date().toISOString() }
        })
        .eq('id', testId);

    if (error) {
        if (error.code === '42501') {
            console.error("❌ RLS ERROR: Table is still protected. Please run the SQL command to DISABLE RLS.");
        } else {
            console.error("❌ DB ERROR:", error.message);
        }
    } else {
        console.log("✅ SUCCESS: Write access confirmed! I can now start the full sync.");
    }
}

testWrite();
