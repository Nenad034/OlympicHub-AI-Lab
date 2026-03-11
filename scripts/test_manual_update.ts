
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.server' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  const id = 'solvex_4001';
  const dummyVector = new Array(768).fill(0.1);
  
  console.log(`Testing update for ID: ${id}`);
  
  const { data, error, count } = await supabase
    .from('properties')
    .update({ embedding: dummyVector }, { count: 'exact' })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Update result data:', data);
    console.log('Update count:', count);
  }
}

testUpdate();
