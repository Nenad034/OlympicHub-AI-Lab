-- Pricing Module Tables for Olympic Hub
-- Created: 2025-12-29

-- ============================================
-- 1. PRICELISTS - Glavni entitet cenovnika
-- ============================================
CREATE TABLE IF NOT EXISTS pricelists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identifikacija
    title TEXT NOT NULL,
    internal_code TEXT, -- npr. "EB2026-A"
    
    -- Proizvod (Room + Service)
    product JSONB NOT NULL DEFAULT '{}',
    -- Struktura: { service, prefix, type, view, name }
    
    -- Validnost
    booking_from DATE,
    booking_to DATE,
    stay_from DATE,
    stay_to DATE,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    
    -- Veza sa hotelom (opciono)
    property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
    
    -- Metadata
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. PRICE_PERIODS - Cenovni periodi (Base Rates)
-- ============================================
CREATE TABLE IF NOT EXISTS price_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pricelist_id UUID NOT NULL REFERENCES pricelists(id) ON DELETE CASCADE,
    
    -- Period
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    
    -- Obračun
    basis TEXT DEFAULT 'PER_PERSON_DAY' CHECK (basis IN ('PER_PERSON_DAY', 'PER_ROOM_DAY', 'PER_UNIT_STAY')),
    
    -- Cene
    net_price NUMERIC(12, 2) NOT NULL,
    provision_percent NUMERIC(5, 2) DEFAULT 20.00,
    gross_price NUMERIC(12, 2) GENERATED ALWAYS AS (net_price * (1 + provision_percent / 100)) STORED,
    currency TEXT DEFAULT 'EUR',
    
    -- Restrikcije boravka
    min_stay INTEGER DEFAULT 1,
    max_stay INTEGER,
    release_days INTEGER DEFAULT 0,
    
    -- Osobe
    min_adults INTEGER DEFAULT 1,
    max_adults INTEGER DEFAULT 2,
    min_children INTEGER DEFAULT 0,
    max_children INTEGER DEFAULT 0,
    
    -- Dani dolaska (1-7, gde 1=Pon)
    arrival_days INTEGER[] DEFAULT '{1,2,3,4,5,6,7}',
    
    -- Sortiranje
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. PRICE_RULES - Doplate i Popusti
-- ============================================
CREATE TABLE IF NOT EXISTS price_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pricelist_id UUID NOT NULL REFERENCES pricelists(id) ON DELETE CASCADE,
    
    -- Tip pravila
    rule_type TEXT NOT NULL CHECK (rule_type IN ('SUPPLEMENT', 'DISCOUNT', 'TAX')),
    title TEXT NOT NULL,
    
    -- Vrednosti (zavisno od tipa)
    net_price NUMERIC(12, 2),          -- za SUPPLEMENT
    provision_percent NUMERIC(5, 2),    -- za SUPPLEMENT
    percent_value NUMERIC(5, 2),        -- za DISCOUNT (npr. -10%)
    fixed_value NUMERIC(12, 2),         -- za fiksne iznose
    
    -- Uslovi primene
    days_before_arrival INTEGER,        -- Early Booking uslov
    child_age_from INTEGER,
    child_age_to INTEGER,
    min_adults INTEGER,
    min_children INTEGER,
    
    -- Da li je obavezno
    is_mandatory BOOLEAN DEFAULT FALSE,
    
    -- Sortiranje
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEKSI za brže pretrage
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pricelists_status ON pricelists(status);
CREATE INDEX IF NOT EXISTS idx_pricelists_property ON pricelists(property_id);
CREATE INDEX IF NOT EXISTS idx_price_periods_pricelist ON price_periods(pricelist_id);
CREATE INDEX IF NOT EXISTS idx_price_periods_dates ON price_periods(date_from, date_to);
CREATE INDEX IF NOT EXISTS idx_price_rules_pricelist ON price_rules(pricelist_id);

-- ============================================
-- RLS (Row Level Security) - Opciono za multi-user
-- ============================================
-- ALTER TABLE pricelists ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE price_periods ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE price_rules ENABLE ROW LEVEL SECURITY;

-- Primer politike: Korisnik vidi samo svoje cenovnike
-- CREATE POLICY "Users can view own pricelists" ON pricelists
--     FOR SELECT USING (created_by = auth.uid()::text);

-- ============================================
-- TRIGGER za automatsko ažuriranje updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pricelists_updated_at ON pricelists;
CREATE TRIGGER update_pricelists_updated_at
    BEFORE UPDATE ON pricelists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
