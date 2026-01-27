-- Create reservations table for OlympicHub
-- This table stores all bookings made through the platform

CREATE TABLE IF NOT EXISTS public.reservations (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reservation codes
    cis_code TEXT NOT NULL UNIQUE,
    ref_code TEXT NOT NULL UNIQUE,
    booking_id TEXT, -- Provider booking ID (e.g., Solvex booking ID)
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    
    -- Customer information
    customer_name TEXT NOT NULL,
    customer_type TEXT NOT NULL CHECK (customer_type IN ('B2C-Individual', 'B2C-Legal', 'B2B-Subagent')),
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    lead_passenger TEXT,
    
    -- Accommodation details
    destination TEXT NOT NULL,
    accommodation_name TEXT NOT NULL,
    hotel_category INTEGER,
    
    -- Dates
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights INTEGER NOT NULL,
    
    -- Passengers
    pax_count INTEGER NOT NULL,
    
    -- Pricing
    total_price DECIMAL(10, 2) NOT NULL,
    paid DECIMAL(10, 2) DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EUR',
    
    -- Provider information
    supplier TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('solvex', 'tct', 'opengreece')),
    trip_type TEXT NOT NULL,
    
    -- Workflow status flags
    hotel_notified BOOLEAN DEFAULT FALSE,
    reservation_confirmed BOOLEAN DEFAULT FALSE,
    proforma_invoice_sent BOOLEAN DEFAULT FALSE,
    final_invoice_created BOOLEAN DEFAULT FALSE,
    
    -- Guest data (JSON)
    guests_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reservations_cis_code ON public.reservations(cis_code);
CREATE INDEX IF NOT EXISTS idx_reservations_ref_code ON public.reservations(ref_code);
CREATE INDEX IF NOT EXISTS idx_reservations_email ON public.reservations(email);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_check_in ON public.reservations(check_in);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON public.reservations(created_at);
CREATE INDEX IF NOT EXISTS idx_reservations_provider ON public.reservations(provider);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read their own reservations
CREATE POLICY "Users can view their own reservations"
    ON public.reservations
    FOR SELECT
    USING (auth.email() = email);

-- Create policy to allow authenticated users to insert reservations
CREATE POLICY "Users can create reservations"
    ON public.reservations
    FOR INSERT
    WITH CHECK (auth.email() = email);

-- Create policy to allow service role full access (for admin operations)
CREATE POLICY "Service role has full access"
    ON public.reservations
    FOR ALL
    USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE public.reservations IS 'Stores all hotel and travel bookings made through OlympicHub';
COMMENT ON COLUMN public.reservations.cis_code IS 'Internal CIS code (format: CIS-YYYYMMDD-XXXX)';
COMMENT ON COLUMN public.reservations.ref_code IS 'Reference code for customer (format: REF-XXXXXXXX)';
COMMENT ON COLUMN public.reservations.booking_id IS 'Provider-specific booking ID (e.g., Solvex booking ID)';
COMMENT ON COLUMN public.reservations.guests_data IS 'JSON object containing all guest information and special requests';
