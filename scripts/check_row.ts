
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRow() {
  const { data, error } = await supabase
    .from('properties')
    .select('id, name, embedding')
    .eq('id', 'solvex_2189')
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`ID: ${data.id}`);
    console.log(`Name: ${data.name}`);
    console.log(`Embedding exists: ${data.embedding !== null}`);
    if (data.embedding) {
      console.log(`Embedding length (raw): ${data.embedding.length}`);
    }
  }
}

checkRow();
