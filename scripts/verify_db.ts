
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.server' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  const { data, count, error } = await supabase
    .from('properties')
    .select('id, name, embedding', { count: 'exact' })
    .not('embedding', 'is', null)
    .limit(5);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Actual count from DB (Service Role): ${count}`);
    console.log('Sample IDs:', data?.map(h => h.id));
    if (data && data[0]) {
      console.log('Sample embedding length:', data[0].embedding?.length);
    }
  }
}

verify();
