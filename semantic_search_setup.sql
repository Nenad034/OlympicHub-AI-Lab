-- Semantic Search Extension SQL
create extension if not exists vector;

-- Ensure properties table has embedding column
alter table if exists properties
add column if not exists embedding vector(766);

-- Create an index for HNSW search (much faster for large datasets)
create index if not exists property_embedding_idx
on properties
using hnsw (embedding vector_cosine_ops);

-- Search function for hotels
create or replace function match_hotels(
  query_embedding vector(766),
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
