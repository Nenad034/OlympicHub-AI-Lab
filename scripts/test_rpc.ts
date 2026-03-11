
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.server' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch() {
  // Test with a dummy vector first to see if RPC works
  const dummyVector = new Array(768).fill(0.1);
  
  console.log('Testing RPC match_hotels...');
  
  const { data, error } = await supabase.rpc('match_hotels', {
    query_embedding: dummyVector,
    match_threshold: 0.1, // Low threshold to find anything
    match_count: 5
  });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Search results:', data);
  }
}

testSearch();
