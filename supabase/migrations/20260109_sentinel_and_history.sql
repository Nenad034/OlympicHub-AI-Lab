-- Sentinel and Search History Migration
-- Created at: 2026-01-09

-- 1. Training Rules (if not existing)
CREATE TABLE IF NOT EXISTS training_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    trigger_text TEXT,
    action_text TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    enabled BOOLEAN DEFAULT true,
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sentinel Events (Logs for security and API health)
CREATE TABLE IF NOT EXISTS sentinel_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('critical', 'warning', 'info')),
    provider TEXT, -- Optional: which provider failed
    resolved BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Search History (Analytics and Business Intelligence)
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_type TEXT NOT NULL CHECK (search_type IN ('hotels', 'flights', 'packages', 'services')),
    search_params JSONB NOT NULL,
    results_count INTEGER DEFAULT 0,
    best_price NUMERIC(12, 2),
    providers_searched TEXT[], -- Array of provider names
    user_id TEXT, -- For future multi-user support
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sentinel_events_type ON sentinel_events(type);
CREATE INDEX IF NOT EXISTS idx_search_history_type ON search_history(search_type);
CREATE INDEX IF NOT EXISTS idx_training_rules_agent ON training_rules(agent_id);

-- Enable RLS
ALTER TABLE training_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentinel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Simple Policies (Allow authenticated access)
CREATE POLICY "Manage training rules" ON training_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Manage sentinel events" ON sentinel_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Manage search history" ON search_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
