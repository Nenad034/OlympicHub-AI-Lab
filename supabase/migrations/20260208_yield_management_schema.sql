-- ============================================
-- YIELD MANAGEMENT & DYNAMIC PRICING SCHEMA
-- Created: 2026-02-08
-- Purpose: Price intelligence, competitor tracking, and dynamic markup management
-- ============================================

-- ============================================
-- 1. COMPETITOR PRICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS competitor_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Competitor Info
    competitor_name TEXT NOT NULL, -- 'travelland', 'bigblue', 'filiptravel'
    competitor_url TEXT NOT NULL,
    
    -- Hotel Identification
    hotel_name TEXT NOT NULL,
    hotel_location TEXT,
    hotel_stars INTEGER,
    
    -- Search Parameters
    destination TEXT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights INTEGER NOT NULL,
    adults INTEGER NOT NULL,
    children INTEGER DEFAULT 0,
    
    -- Pricing Data
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    meal_plan TEXT, -- 'BB', 'HB', 'FB', 'AI'
    room_type TEXT,
    
    -- Metadata
    scraped_at TIMESTAMP DEFAULT NOW(),
    scrape_session_id UUID,
    is_available BOOLEAN DEFAULT TRUE,
    
    -- Indexing
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX idx_competitor_prices_hotel ON competitor_prices(hotel_name, check_in);
CREATE INDEX idx_competitor_prices_destination ON competitor_prices(destination, check_in);
CREATE INDEX idx_competitor_prices_scraped_at ON competitor_prices(scraped_at DESC);

-- ============================================
-- 2. PRICE INTELLIGENCE LOG
-- ============================================
CREATE TABLE IF NOT EXISTS price_intelligence_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Service Identification
    service_type TEXT NOT NULL, -- 'hotel', 'package', 'charter', 'transfer'
    service_id TEXT, -- External ID from provider
    hotel_name TEXT,
    destination TEXT,
    
    -- Search Context
    check_in DATE,
    check_out DATE,
    search_params JSONB, -- Full search parameters
    
    -- Multi-Provider Prices
    provider_prices JSONB NOT NULL, -- Array of {provider, price, currency, available}
    -- Example: [{"provider": "solvex", "price": 450, "currency": "EUR", "available": true}, ...]
    
    -- Competitor Prices
    competitor_prices JSONB, -- Array of competitor prices
    
    -- Best Price Analysis
    lowest_provider TEXT, -- Which provider has lowest price
    lowest_price DECIMAL(10, 2),
    competitor_avg_price DECIMAL(10, 2),
    price_advantage DECIMAL(10, 2), -- How much cheaper/expensive vs competitors
    
    -- Metadata
    timestamp TIMESTAMP DEFAULT NOW(),
    session_id UUID,
    user_id UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_price_intelligence_hotel ON price_intelligence_log(hotel_name, check_in);
CREATE INDEX idx_price_intelligence_timestamp ON price_intelligence_log(timestamp DESC);

-- ============================================
-- 3. MARKUP PROPOSALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS markup_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Service Reference
    service_type TEXT NOT NULL,
    service_id TEXT,
    hotel_name TEXT,
    destination TEXT,
    
    -- Pricing Data
    base_cost DECIMAL(10, 2) NOT NULL, -- Lowest provider price
    competitor_avg_price DECIMAL(10, 2),
    
    -- Current Markup
    current_markup_percent DECIMAL(5, 2),
    current_selling_price DECIMAL(10, 2),
    
    -- Proposed Markup
    proposed_markup_percent DECIMAL(5, 2) NOT NULL,
    proposed_selling_price DECIMAL(10, 2) NOT NULL,
    
    -- Calculation Logic
    calculation_factors JSONB, -- Factors that influenced the proposal
    -- Example: {"competitor_price": 500, "season": "high", "demand": "medium", "risk": "low"}
    
    -- Approval Workflow
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
    proposed_by TEXT DEFAULT 'system', -- 'system' or user_id
    proposed_at TIMESTAMP DEFAULT NOW(),
    
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    
    -- Auto-Approval Settings
    auto_approved BOOLEAN DEFAULT FALSE,
    auto_approval_reason TEXT,
    
    -- Validity
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_markup_proposals_status ON markup_proposals(status, proposed_at DESC);
CREATE INDEX idx_markup_proposals_hotel ON markup_proposals(hotel_name);

-- ============================================
-- 4. MARKUP HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS markup_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reference to Proposal
    proposal_id UUID REFERENCES markup_proposals(id),
    
    -- Service Reference
    service_type TEXT NOT NULL,
    service_id TEXT,
    hotel_name TEXT,
    
    -- Price Change
    old_markup_percent DECIMAL(5, 2),
    new_markup_percent DECIMAL(5, 2),
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2),
    
    -- Reason for Change
    change_reason TEXT NOT NULL, -- 'competitor_price', 'manual_override', 'seasonal_adjustment'
    trigger_data JSONB, -- Additional context
    
    -- Who Made the Change
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP DEFAULT NOW(),
    
    -- Impact Tracking
    sales_before INTEGER, -- Number of sales before change
    sales_after INTEGER, -- Number of sales after change
    revenue_impact DECIMAL(10, 2) -- Estimated revenue change
);

-- Index
CREATE INDEX idx_markup_history_changed_at ON markup_history(changed_at DESC);

-- ============================================
-- 5. SCRAPING SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scraping_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Session Info
    session_type TEXT NOT NULL, -- 'scheduled', 'manual', 'on_demand'
    target_competitors TEXT[], -- Array of competitor names
    
    -- Search Parameters
    destinations TEXT[],
    date_ranges JSONB, -- Array of {check_in, check_out}
    
    -- Execution
    status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed', 'partial'
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Results
    total_prices_scraped INTEGER DEFAULT 0,
    successful_scrapes INTEGER DEFAULT 0,
    failed_scrapes INTEGER DEFAULT 0,
    
    -- Error Tracking
    errors JSONB, -- Array of error messages
    
    -- Performance
    duration_seconds INTEGER,
    
    -- Metadata
    triggered_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX idx_scraping_sessions_started_at ON scraping_sessions(started_at DESC);

-- ============================================
-- 6. HOTEL MATCHING TABLE (Fuzzy Deduplication)
-- ============================================
CREATE TABLE IF NOT EXISTS hotel_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Master Hotel Record
    master_hotel_name TEXT NOT NULL,
    master_hotel_location TEXT,
    master_hotel_stars INTEGER,
    
    -- Matched Variants (from different sources)
    variants JSONB NOT NULL, -- Array of {source, name, similarity_score}
    -- Example: [{"source": "solvex", "name": "Hilton Resort", "score": 0.95}, ...]
    
    -- Matching Metadata
    matching_algorithm TEXT DEFAULT 'fuzzy', -- 'fuzzy', 'manual', 'ai'
    confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
    
    -- Manual Override
    manually_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX idx_hotel_matches_master ON hotel_matches(master_hotel_name);

-- ============================================
-- 7. YIELD SETTINGS TABLE (Configuration)
-- ============================================
CREATE TABLE IF NOT EXISTS yield_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Setting Type
    setting_type TEXT NOT NULL UNIQUE, -- 'global', 'seasonal', 'destination_specific'
    
    -- Markup Rules
    default_markup_percent DECIMAL(5, 2) DEFAULT 15.00,
    min_markup_percent DECIMAL(5, 2) DEFAULT 5.00,
    max_markup_percent DECIMAL(5, 2) DEFAULT 30.00,
    
    -- Auto-Approval Thresholds
    auto_approve_threshold_percent DECIMAL(5, 2) DEFAULT 5.00, -- Auto-approve if change < 5%
    
    -- Competitor Price Strategy
    match_competitor_price BOOLEAN DEFAULT FALSE,
    undercut_competitor_by_percent DECIMAL(5, 2) DEFAULT 2.00,
    
    -- Scraping Schedule
    scraping_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
    scraping_enabled BOOLEAN DEFAULT TRUE,
    
    -- Notification Settings
    notify_on_price_change BOOLEAN DEFAULT TRUE,
    notify_on_competitor_lower_price BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO yield_settings (setting_type, default_markup_percent, min_markup_percent, max_markup_percent)
VALUES ('global', 15.00, 5.00, 30.00)
ON CONFLICT (setting_type) DO NOTHING;

-- ============================================
-- 8. RLS POLICIES (Row Level Security)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE competitor_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_intelligence_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE markup_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE markup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE yield_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Authenticated users can read all data
CREATE POLICY "Allow authenticated read on competitor_prices" ON competitor_prices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on price_intelligence_log" ON price_intelligence_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on markup_proposals" ON markup_proposals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on markup_history" ON markup_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on scraping_sessions" ON scraping_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on hotel_matches" ON hotel_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on yield_settings" ON yield_settings FOR SELECT TO authenticated USING (true);

-- Policies: Only admins can insert/update (you can adjust this based on your user roles)
CREATE POLICY "Allow service role insert on competitor_prices" ON competitor_prices FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Allow service role insert on price_intelligence_log" ON price_intelligence_log FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Allow authenticated insert on markup_proposals" ON markup_proposals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on markup_proposals" ON markup_proposals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on markup_history" ON markup_history FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_competitor_prices_updated_at BEFORE UPDATE ON competitor_prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_markup_proposals_updated_at BEFORE UPDATE ON markup_proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotel_matches_updated_at BEFORE UPDATE ON hotel_matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_yield_settings_updated_at BEFORE UPDATE ON yield_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
