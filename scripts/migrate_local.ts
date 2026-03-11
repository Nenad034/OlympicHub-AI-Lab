import { Client } from 'pg';

async function testConnection() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:54322/postgres"
  });

  try {
    await client.connect();
    console.log("✅ Successfully connected to local database!");
    
    // Try to run the migration
    const sql = `
-- Semantic Search Extension SQL
create extension if not exists vector;

-- Ensure properties table has embedding column
alter table if exists properties 
add column if not exists embedding vector(768);

-- Create an index for HNSW search
create index if not exists property_embedding_idx 
on properties 
using hnsw (embedding vector_cosine_ops);

-- Search function for hotels
create or replace function match_hotels(
  query_embedding vector(768),
  match_threshold float default 0.4,
  match_count int default 20
)
returns table (
  id text,
  name text,
  property_type text,
  star_rating int,
  address jsonb,
  content jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    p.id,
    p.name,
    p."propertyType" as property_type,
    p."starRating" as star_rating,
    p.address,
    p.content,
    1 - (p.embedding <=> query_embedding) as similarity
  from properties p
  where p.embedding is not null
    and 1 - (p.embedding <=> query_embedding) > match_threshold
  order by p.embedding <=> query_embedding
  limit match_count;
end;
$$;
    `;
    
    console.log("🚀 Running migrations...");
    await client.query(sql);
    console.log("✅ Migrations applied successfully!");
    
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  } finally {
    await client.end();
  }
}

testConnection();
