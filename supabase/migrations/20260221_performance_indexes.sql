-- Migration: Database Indexing for Performance Optimization
-- Description: Adds indexes to frequently searched columns to ensure scalability as data grows.
-- Steps: Korak 5 of stability principles.

-- 1. Indexing Supplier Finance module
CREATE INDEX IF NOT EXISTS idx_supplier_obligations_supplier_id ON public.supplier_obligations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_obligations_status ON public.supplier_obligations(status);
CREATE INDEX IF NOT EXISTS idx_supplier_obligations_vcc_status ON public.supplier_obligations(vcc_approval_status);
CREATE INDEX IF NOT EXISTS idx_supplier_obligations_deadline ON public.supplier_obligations(payment_deadline);

-- 2. Indexing Reservations
CREATE INDEX IF NOT EXISTS idx_reservations_email ON public.reservations(email);
CREATE INDEX IF NOT EXISTS idx_reservations_check_in ON public.reservations(check_in);

-- 3. Indexing Properties (Search optimization)
-- Note: 'isActive' is used in every Smart Search query
CREATE INDEX IF NOT EXISTS idx_properties_isactive ON public.properties(isActive);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(cityId);

-- 4. Audit Log optimization
CREATE INDEX IF NOT EXISTS idx_supplier_transactions_obligation ON public.supplier_transactions(obligation_id);

-- Comment for documentation
COMMENT ON INDEX public.idx_properties_isactive IS 'Critical for public search performance.';
