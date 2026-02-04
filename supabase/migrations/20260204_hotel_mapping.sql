-- Hotel Mapping & Deduplication Schema
-- Part of Olympic Hub B2B Integration Strategy

-- Table for Master Hotel Identifiers (Mapping SID)
CREATE TABLE IF NOT EXISTS hotel_master_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giata_id TEXT UNIQUE, -- Industry Standard
    vervotech_id TEXT UNIQUE,
    master_name TEXT NOT NULL, -- Normalized name
    city_code TEXT,
    country_code TEXT,
    address_hash TEXT, -- To help AI match by physical location
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Links between external providers and our Master IDs
CREATE TABLE IF NOT EXISTS hotel_provider_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_mapping_id UUID REFERENCES hotel_master_mappings(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL, -- 'Solvex', 'OpenGreece', 'ORS', 'TCT', 'Kyte'
    external_id TEXT NOT NULL, -- Provider's specific ID
    status TEXT DEFAULT 'active',
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_name, external_id)
);

-- Table for Room Mapping (Normalizing 'Double Sea View' across providers)
CREATE TABLE IF NOT EXISTS room_type_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_mapping_id UUID REFERENCES hotel_master_mappings(id) ON DELETE CASCADE,
    normalized_name TEXT NOT NULL, -- e.g. 'Standard Double Room'
    normalized_category TEXT, -- 'Room', 'Suite', 'Villa'
    amenities_hash TEXT, -- For AI matching
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hotel_master_mappings_updated_at
    BEFORE UPDATE ON hotel_master_mappings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
