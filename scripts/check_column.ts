
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
  const { data, error } = await supabase
    .rpc('get_column_info', { table_name: 'properties', column_name: 'embedding' });

  if (error) {
    console.log('RPC get_column_info failed. Trying raw query if possible...');
    // Try to see if we can get a hint by fetching one row and checking object keys
    const { data: row } = await supabase.from('properties').select('*').limit(1).single();
    if (row) {
        console.log('Columns found:', Object.keys(row));
        if ('embedding' in row) {
            console.log('Embedding column exists in row data');
        }
    }
  } else {
    console.log('Column info:', data);
  }
}

checkColumn();
