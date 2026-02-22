-- Migration: Extend Supplier VCC Settings for Automation
-- Description: Adds operational columns to support automated VCC generation and financial stability.

ALTER TABLE public.supplier_vcc_settings 
    ADD COLUMN IF NOT EXISTS vcc_type TEXT DEFAULT 'Mastercard' CHECK (vcc_type IN ('Visa', 'Mastercard', 'AMEX')),
    ADD COLUMN IF NOT EXISTS activation_delay INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS active_duration_days INTEGER DEFAULT 30,
    ADD COLUMN IF NOT EXISTS max_limit_buffer_percent DECIMAL(5, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'EUR';

-- Add comments for clarity
COMMENT ON COLUMN public.supplier_vcc_settings.activation_delay IS 'Activation offset relative to check-in. Negative = days before, Positive = days after, 0 = on check-in day.';
COMMENT ON COLUMN public.supplier_vcc_settings.max_limit_buffer_percent IS 'Buffer percentage added to the net amount to handle minor currency fluctuations or bank fees.';
COMMENT ON COLUMN public.supplier_vcc_settings.active_duration_days IS 'How many days the VCC remains valid after activation.';
