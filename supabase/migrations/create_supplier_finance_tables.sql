-- Supplier Finance Module - Subabase Schema
-- Handles supplier obligations, payment rules, and transaction history

-- 1. Supplier Obligations
CREATE TABLE IF NOT EXISTS public.supplier_obligations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID, -- Removed FK for testing
    cis_code TEXT NOT NULL,
    supplier_id TEXT, -- Removed FK for testing
    
    -- Financials
    net_amount DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    exchange_rate_at_booking DECIMAL(12, 6),
    
    -- Deadlines
    cancellation_deadline TIMESTAMP WITH TIME ZONE,
    payment_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Status & Score
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'processing', 'paid', 'disputed', 'refund_pending')),
    priority_score INTEGER DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
    
    -- Methods
    payment_method_preferred TEXT DEFAULT 'bank' CHECK (payment_method_preferred IN ('bank', 'vcc', 'cash', 'compensation')),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Supplier Payment Rules
CREATE TABLE IF NOT EXISTS public.supplier_payment_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('DaysBeforeArrival', 'DaysAfterBooking', 'EndOfMonthPlusDays', 'Manual')),
    rule_value INTEGER NOT NULL,
    apply_to TEXT NOT NULL CHECK (apply_to IN ('FreeCancellationDate', 'CheckInDate', 'BookingDate')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Supplier Transactions
CREATE TABLE IF NOT EXISTS public.supplier_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obligation_id UUID REFERENCES public.supplier_obligations(id) ON DELETE CASCADE,
    amount_paid DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    bank_name TEXT,
    transaction_ref TEXT,
    vcc_id TEXT,
    executed_by TEXT, -- User email or ID
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Supplier VCC Settings
CREATE TABLE IF NOT EXISTS public.supplier_vcc_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE CASCADE UNIQUE,
    auto_generate BOOLEAN DEFAULT FALSE,
    trigger_days_before INTEGER DEFAULT 1,
    max_limit_percent INTEGER DEFAULT 100,
    provider_config JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_sup_ob_res_id ON public.supplier_obligations(reservation_id);
CREATE INDEX IF NOT EXISTS idx_sup_ob_cis_code ON public.supplier_obligations(cis_code);
CREATE INDEX IF NOT EXISTS idx_sup_ob_status ON public.supplier_obligations(status);
CREATE INDEX IF NOT EXISTS idx_sup_ob_deadline ON public.supplier_obligations(payment_deadline);
CREATE INDEX IF NOT EXISTS idx_sup_rules_supplier ON public.supplier_payment_rules(supplier_id);

-- Updated At Trigger
CREATE TRIGGER update_supplier_obligations_updated_at
    BEFORE UPDATE ON public.supplier_obligations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.supplier_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_vcc_settings ENABLE ROW LEVEL SECURITY;

-- For now, allow service role full access and authenticated users read access
CREATE POLICY "Service role full access AP" ON public.supplier_obligations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Authenticated users view AP" ON public.supplier_obligations FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role full access Rules" ON public.supplier_payment_rules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Authenticated users view Rules" ON public.supplier_payment_rules FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role full access Trans" ON public.supplier_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access VCC" ON public.supplier_vcc_settings FOR ALL USING (auth.role() = 'service_role');
