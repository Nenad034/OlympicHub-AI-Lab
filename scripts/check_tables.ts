import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  const { data, error } = await supabase.rpc('get_table_names'); // Not a standard RPC, but maybe
  if (error) {
     // fallback to a query if possible, but standard anon key might not allow it
     console.log("Could not find get_table_names RPC. Trying direct select from INFORMATION_SCHEMA (won't work with anon key usually).");
  }
  
  // Try a common table
  const { data: res, error: re } = await supabase.from('reservations').select('*').limit(1);
  if (re) console.log("Reservations error:", re.message);
  else console.log("Reservations table exists.");

  const { data: hot, error: he } = await supabase.from('hotels').select('*').limit(1);
  if (he) console.log("Hotels error:", he.message);
  else console.log("Hotels table exists.");
}

listTables();
