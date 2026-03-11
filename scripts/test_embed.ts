
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; 
const geminiKey = process.env.VITE_GEMINI_KEY || process.env.GEMINI_API_KEY || ''; 

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function testOne() {
  const { data: hotel, error } = await supabase
    .from('properties')
    .select('id, name')
    .limit(1)
    .single();

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Testing embedding for: ${hotel.name} (ID: ${hotel.id})`);
  const result = await model.embedContent(`Hotel: ${hotel.name}`);
  let vector = result.embedding.values;
  console.log('Got vector, length:', vector.length);
  
  if (vector.length > 768) {
    console.log('Slicing vector to 768 dimensions...');
    vector = vector.slice(0, 768);
  }

  const { count, error: updateError } = await supabase
    .from('properties')
    .update({ embedding: vector }, { count: 'exact' })
    .eq('id', hotel.id);

  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log(`✅ Update reported success! Rows affected: ${count}`);
  }
}

testOne();
