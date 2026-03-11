
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.server' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('properties')
    .select('id, name, embedding')
    .limit(10);

  if (error) console.error(error);
  else {
    console.log('Rows found:', data.length);
    data.forEach(h => {
      console.log(`ID: ${h.id}, Name: ${h.name}, Has Embedding: ${!!h.embedding}`);
    });
  }
}
check();
