-- Travel Services (Excursions, Transport, Tickets, etc.)
CREATE TABLE IF NOT EXISTS travel_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('transport', 'excursion', 'ticket', 'transfer', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    
    -- Pricing
    price_net NUMERIC(12, 2),
    price_gross NUMERIC(12, 2),
    currency TEXT DEFAULT 'EUR',
    price_basis TEXT DEFAULT 'per_person', -- per_person, per_group, per_unit
    
    -- Availability
    valid_from DATE,
    valid_to DATE,
    
    -- Metadata
    tags TEXT[], -- npr. ['beograd', 'vodič', 'bus']
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for tags and category
CREATE INDEX IF NOT EXISTS idx_travel_services_category ON travel_services(category);
CREATE INDEX IF NOT EXISTS idx_travel_services_tags ON travel_services USING GIN (tags);

-- RLS
ALTER TABLE travel_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage services" ON travel_services FOR ALL TO authenticated USING (true) WITH CHECK (true);
