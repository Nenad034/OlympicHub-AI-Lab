
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmbeddings() {
  const { count, error } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Hotels with embeddings: ${count}`);
  }

  const { count: total, error: error2 } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true });
    
  if (error2) {
    console.error('Error total:', error2);
  } else {
    console.log(`Total hotels: ${total}`);
  }
}

checkEmbeddings();
