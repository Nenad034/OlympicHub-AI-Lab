-- Profitability and Margin Tracking
-- Ensuring Net, Gross, and Profit (Zarada) are tracked at all levels.

-- ============================================
-- 1. PRICE_PERIODS (Item level)
-- ============================================
ALTER TABLE price_periods ADD COLUMN IF NOT EXISTS gross_price NUMERIC(12, 2);
ALTER TABLE price_periods ADD COLUMN IF NOT EXISTS margin_amount NUMERIC(12, 2);
ALTER TABLE price_periods ADD COLUMN IF NOT EXISTS margin_percent NUMERIC(5, 2);

-- Update trigger logic to auto-calculate Zarada
CREATE OR REPLACE FUNCTION calculate_period_profitability()
RETURNS TRIGGER AS $$
BEGIN
    -- If margin_percent is provided but margin_amount isn't
    IF NEW.margin_percent IS NOT NULL AND NEW.margin_amount IS NULL THEN
        NEW.margin_amount := NEW.net_price * (NEW.margin_percent / 100);
    END IF;

    -- Calculate Gross if missing
    IF NEW.gross_price IS NULL AND NEW.margin_amount IS NOT NULL THEN
        NEW.gross_price := NEW.net_price + NEW.margin_amount;
    END IF;

    -- Ensure margin_amount is always Gross - Net
    IF NEW.gross_price IS NOT NULL AND NEW.net_price IS NOT NULL THEN
        NEW.margin_amount := NEW.gross_price - NEW.net_price;
        IF NEW.net_price > 0 THEN
            NEW.margin_percent := (NEW.margin_amount / NEW.net_price) * 100;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_period_profitability ON price_periods;
CREATE TRIGGER trg_calculate_period_profitability
BEFORE INSERT OR UPDATE ON price_periods
FOR EACH ROW EXECUTE FUNCTION calculate_period_profitability();

-- ============================================
-- 2. SMART_RULES (Rules level)
-- ============================================
ALTER TABLE smart_rules ADD COLUMN IF NOT EXISTS net_value NUMERIC(12, 2);
ALTER TABLE smart_rules ADD COLUMN IF NOT EXISTS gross_value NUMERIC(12, 2);
ALTER TABLE smart_rules ADD COLUMN IF NOT EXISTS margin_value NUMERIC(12, 2);

-- ============================================
-- 3. PRICELISTS (Global level)
-- = :::::::::::::::::::::::::::::::::::::::::::
ALTER TABLE pricelists ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
ALTER TABLE pricelists ADD COLUMN IF NOT EXISTS total_margin_target NUMERIC(5, 2) DEFAULT 21.00;
