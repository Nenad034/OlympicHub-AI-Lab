
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.server' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDim() {
  const { data, error } = await supabase.rpc('get_column_dim', { table_name: 'properties', column_name: 'embedding' });
  if (error) {
    console.log('Trying another way to find dimension...');
    // We can query information_schema.columns directly via RPC if we have one, 
    // or just try to insert a vector of size 768 and see if it works.
    
    const testVector = new Array(768).fill(0);
    const { count: c768, error: insertError } = await supabase.from('properties').update({ embedding: testVector }, { count: 'exact' }).eq('id', 'solvex_2189');
    console.log('Result of trying 768:', insertError?.message, 'Rows:', c768);
    
    const testVector766 = new Array(766).fill(0);
    const { count: c766, error: insertError766 } = await supabase.from('properties').update({ embedding: testVector766 }, { count: 'exact' }).eq('id', 'solvex_2189');
    console.log('Result of trying 766:', insertError766?.message, 'Rows:', c766);
  } else {
    console.log('Dimension:', data);
  }
}

checkDim();
