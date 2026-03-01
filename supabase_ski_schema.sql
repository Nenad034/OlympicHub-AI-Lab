
-- Enable pg_trgm extension for fuzzy searching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create ski_resorts table
CREATE TABLE IF NOT EXISTS public.ski_resorts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    original_country TEXT,
    region TEXT,
    status TEXT DEFAULT 'open',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    activities TEXT[], -- Array of activity types
    stats JSONB, -- Store full statistics (runs, lifts, elevation)
    map_image_url TEXT,
    description TEXT,
    webcam_url TEXT,
    website_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster searches
CREATE INDEX IF NOT EXISTS idx_ski_resorts_country ON public.ski_resorts(country);
CREATE INDEX IF NOT EXISTS idx_ski_resorts_name ON public.ski_resorts USING gin (name gin_trgm_ops);

-- Search function for better performance
CREATE OR REPLACE FUNCTION search_ski_resorts(search_term TEXT)
RETURNS SETOF public.ski_resorts AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.ski_resorts
    WHERE 
        name ILIKE '%' || search_term || '%' OR
        country ILIKE '%' || search_term || '%' OR
        region ILIKE '%' || search_term || '%'
    ORDER BY (stats->'runs'->'byActivity'->'downhill'->'lengthInKm')::numeric DESC NULLS LAST
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;
