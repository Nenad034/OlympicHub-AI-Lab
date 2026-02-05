-- Create properties table explicitly for Solvex Hotels
CREATE TABLE IF NOT EXISTS public.properties (
    id TEXT PRIMARY KEY, -- solvex_123
    name TEXT NOT NULL,
    "propertyType" TEXT DEFAULT 'Hotel', 
    "starRating" INTEGER DEFAULT 3,
    "isActive" BOOLEAN DEFAULT TRUE,
    address JSONB DEFAULT '{}'::jsonb,
    "geoCoordinates" JSONB DEFAULT '{}'::jsonb,
    content JSONB DEFAULT '{}'::jsonb, -- description stored here
    images JSONB DEFAULT '[]'::jsonb,
    "propertyAmenities" JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic RLS Policies (Optional but good practice)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access" ON public.properties
    FOR SELECT USING (true);

-- Allow full access to authenticated users (or service role)
CREATE POLICY "Allow full access to authenticated users" ON public.properties
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Create an index on ID for faster lookups
CREATE INDEX IF NOT EXISTS properties_id_idx ON public.properties (id);
