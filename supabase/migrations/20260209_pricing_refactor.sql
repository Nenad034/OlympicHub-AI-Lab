-- Update Pricelists Schema to match modern Pricing UI requirements
-- Date: 2026-02-09

-- 1. Extend PRICELISTS table
ALTER TABLE pricelists 
ADD COLUMN IF NOT EXISTS supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'HB' CHECK (service_type IN ('RO', 'BB', 'HB', 'FB', 'AI', 'UAI')),
ADD COLUMN IF NOT EXISTS global_margin_percent NUMERIC(5, 2) DEFAULT 20.00,
ADD COLUMN IF NOT EXISTS global_margin_amount NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS contract_number TEXT,
ADD COLUMN IF NOT EXISTS calculation_model TEXT DEFAULT 'PER_PERSON_DAY';

-- 2. Extend PRICE_PERIODS table
ALTER TABLE price_periods
ADD COLUMN IF NOT EXISTS room_type_id TEXT, -- ID from hotel definition
ADD COLUMN IF NOT EXISTS room_type_name TEXT, -- Human readable name (e.g. Double Standard)
ADD COLUMN IF NOT EXISTS days_of_week BOOLEAN[] DEFAULT '{true,true,true,true,true,true,true}'; -- Mon to Sun

-- 3. Add Index for suppliers
CREATE INDEX IF NOT EXISTS idx_pricelists_supplier ON pricelists(supplier_id);

-- 4. Utility function to calculate bruto based on net, provision and margins
-- This can be used later in views or calculated columns if needed
CREATE OR REPLACE FUNCTION calculate_bruto_price(
    net_price NUMERIC,
    provision_percent NUMERIC,
    margin_percent NUMERIC,
    margin_amount NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    after_provision NUMERIC;
BEGIN
    -- Formula: (Net - Provision) + Margin% + Margin Amount
    after_provision := net_price * (1 - provision_percent / 100);
    RETURN after_provision * (1 + margin_percent / 100) + margin_amount;
END;
$$ LANGUAGE plpgsql;
