-- Migration: Add VCC Approval Workflow
-- Description: Introduces a manual approval step before VCC generation for enhanced financial control.

ALTER TABLE public.supplier_obligations 
    ADD COLUMN IF NOT EXISTS vcc_approval_status TEXT DEFAULT 'not_required' 
    CHECK (vcc_approval_status IN ('not_required', 'pending', 'approved', 'rejected')),
    ADD COLUMN IF NOT EXISTS vcc_approved_by TEXT,
    ADD COLUMN IF NOT EXISTS vcc_approved_at TIMESTAMP WITH TIME ZONE;

-- Comment for clarity
COMMENT ON COLUMN public.supplier_obligations.vcc_approval_status IS 'Approval state for automated VCC: pending = waiting for admin, approved = cleared for gen, rejected = blocked.';
