import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('properties').select('*').limit(1);
  if (error) console.log("Properties error:", error.message);
  else console.log("Properties table exists. Sample:", JSON.stringify(data[0], null, 2));
}

check();
