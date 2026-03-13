-- Pricing Intelligence Advanced Schema
-- This schema extends the basic pricelist logic to support complex rule engines, 
-- cumulative/additive logic, and granular day-of-week controls.

-- ============================================
-- 1. ENHANCED PRICELISTS 
-- ============================================
-- Adding global intelligence flags to the main table
ALTER TABLE pricelists ADD COLUMN IF NOT EXISTS calculation_strategy TEXT DEFAULT 'cumulative' CHECK (calculation_strategy IN ('cumulative', 'additive'));
ALTER TABLE pricelists ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{
    "age_categories": {
      "infant": {"from": 0, "to": 1.99, "label": "Beba"},
      "child": {"from": 2, "to": 11.99, "label": "Dete"},
      "teen": {"from": 12, "to": 17.99, "label": "Junior"},
      "adult": {"from": 18, "to": 99, "label": "Odrasli"}
    }
}';

-- ============================================
-- 2. ENHANCED PRICE_PERIODS
-- ============================================
-- Adding day-of-week pricing and more granular restrictions
ALTER TABLE price_periods ADD COLUMN IF NOT EXISTS daily_prices JSONB; -- { "mon": 100, "tue": 100, "fri": 120 ... }
ALTER TABLE price_periods ADD COLUMN IF NOT EXISTS min_occupancy_multiplier NUMERIC(5, 2); -- for cases like "3.4 billing"
ALTER TABLE price_periods ADD COLUMN IF NOT EXISTS arrival_days_only BOOLEAN DEFAULT FALSE;
ALTER TABLE price_periods ADD COLUMN IF NOT EXISTS restriction_messages JSONB; -- { "sr": "...", "en": "..." }

-- ============================================
-- 3. INTELLIGENT RULES ENGINE (v2)
-- ============================================
-- A more flexible table for complex logic (replacing or augmenting price_rules)
CREATE TABLE IF NOT EXISTS smart_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pricelist_id UUID NOT NULL REFERENCES pricelists(id) ON DELETE CASCADE,
    
    -- Rule metadata
    label TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('discount', 'supplement', 'tax', 'recalculation')),
    
    -- Value definition
    percentage_value NUMERIC(12, 2), -- npr. 15.00 for 15%
    fixed_value NUMERIC(12, 2),      -- npr. 5.00 for 5 EUR
    is_combined BOOLEAN DEFAULT FALSE, -- if true, apply both % and fixed
    
    -- Validity Windows
    booking_window_start DATE,
    booking_window_end DATE,
    stay_window_start DATE,
    stay_window_end DATE,
    
    -- Day of week restrictions
    apply_on_stay_days INTEGER[], -- Days of week (1-7) rule applies to
    apply_on_arrival_days INTEGER[], -- Rule only applies if arrival is on these days
    
    -- Occupancy & Age Constraints
    min_adults INTEGER,
    max_adults INTEGER,
    min_children INTEGER,
    max_children INTEGER,
    child_age_from NUMERIC(4, 2),
    child_age_to NUMERIC(4, 2),
    
    -- advanced logic
    min_stay INTEGER,
    priority INTEGER DEFAULT 10,
    calculation_logic TEXT, -- e.g. 'SINGLE_USE_MAPPING' or 'BED_SHARING'
    excluded_room_types TEXT[],
    
    -- Conflict Resolution
    cannot_combine_with UUID[], -- IDs of other rules
    strategy_on_conflict TEXT DEFAULT 'BEST_VALUE' CHECK (strategy_on_conflict IN ('BEST_VALUE', 'FIRST_APPLIED', 'ALL')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smart_rules_pricelist ON smart_rules(pricelist_id);

-- ============================================
-- 4. INVENTORY & STOP SALES
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
    room_id TEXT, -- identifier from provider or internal
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    control_type TEXT DEFAULT 'stop_sale' CHECK (control_type IN ('stop_sale', 'on_request', 'limited_allotment')),
    value INTEGER, -- for limited_allotment
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_dates ON inventory_controls(date_from, date_to);
