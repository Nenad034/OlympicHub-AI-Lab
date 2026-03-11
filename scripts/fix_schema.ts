
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.server' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSchema() {
  console.log('Fixing schema to use vector(3072)...');
  
  const sql = `
    ALTER TABLE properties DROP COLUMN IF EXISTS embedding;
    ALTER TABLE properties ADD COLUMN embedding vector(3072);
    
    DROP FUNCTION IF EXISTS match_hotels;
    
    CREATE OR REPLACE FUNCTION match_hotels(
      query_embedding vector(3072),
      match_threshold float DEFAULT 0.4,
      match_count int DEFAULT 20
    )
    RETURNS TABLE (
      id text,
      name text,
      property_type text,
      star_rating int,
      address jsonb,
      content jsonb,
      similarity float
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        p.id,
        p.name,
        p."propertyType" AS property_type,
        p."starRating" AS star_rating,
        p.address,
        p.content,
        1 - (p.embedding <=> query_embedding) AS similarity
      FROM properties p
      WHERE p.embedding IS NOT NULL
        AND 1 - (p.embedding <=> query_embedding) > match_threshold
      ORDER BY p.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$;
  `;

  // We can't run multi-statement SQL easily via RPC unless there's an 'exec_sql' RPC.
  // We'll try to run them one by one if there is no exec_sql.
  // But wait, the user Level might allow it.
  
  // Or I can just use the Dashboard if I had to.
  // Actually, I'll try to use a simple RPC call if it exists.
  
  // Alternative: Just use a migration file if they have a way to apply it.
  // I will try to apply it via 'exec_sql' if available.
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Failed to apply SQL via exec_sql:', error.message);
    console.log('Trying individual statements...');
    
    // This is a hack, but let's try.
    // Actually, usually Supabase doesn't have exec_sql unless manually added.
  } else {
    console.log('✅ Schema updated successfully!');
  }
}

fixSchema();
