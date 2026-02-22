-- ============================================================================
-- 🔒 SECURITY RLS POLICIES - OLYMPIC HUB
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. PROPERTIES TABLE - Hotels Security
-- ============================================================================

-- Enable RLS
ALTER TABLE IF EXISTS properties ENABLE ROW LEVEL SECURITY;

-- Clear old policies
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Service role can manage properties" ON properties;
DROP POLICY IF EXISTS "Read properties" ON properties;
DROP POLICY IF EXISTS "Authenticated can read properties" ON properties;

-- Policy: Everyone can READ active hotels
CREATE POLICY "Anyone can view active properties"
    ON properties
    FOR SELECT
    USING (isActive = true);

-- Policy: Only backend (SERVICE_ROLE) can write to properties
CREATE POLICY "Service role can manage properties"
    ON properties
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 2. RESERVATIONS TABLE - Booking Security
-- ============================================================================

-- Enable RLS
ALTER TABLE IF EXISTS reservations ENABLE ROW LEVEL SECURITY;

-- Clear old policies
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Anonymous users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Service role can view all reservations" ON reservations;

-- Policy: CREATE for authenticated users (agents)
CREATE POLICY "Authenticated users can create reservations"
    ON reservations
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: CREATE for anonymous users (public booking)
CREATE POLICY "Anonymous users can create reservations"
    ON reservations
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy: SELECT - Users see only THEIR reservations (by email)
CREATE POLICY "Users can view own reservations"
    ON reservations
    FOR SELECT
    USING (auth.email() = email);

-- Policy: SELECT - Service role (admin) sees all
CREATE POLICY "Service role can view all reservations"
    ON reservations
    FOR SELECT
    USING (auth.role() = 'service_role');

-- Policy: UPDATE - Service role only
CREATE POLICY "Service role can update reservations"
    ON reservations
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 3. CUSTOMERS TABLE - Customer Data Security
-- ============================================================================

-- Enable RLS
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;

-- Clear old policies
DROP POLICY IF EXISTS "Customers can view own profile" ON customers;
DROP POLICY IF EXISTS "Service role can manage customers" ON customers;

-- Policy: Users see only THEIR profile
CREATE POLICY "Customers can view own profile"
    ON customers
    FOR SELECT
    USING (auth.email() = email OR auth.role() = 'service_role');

-- Policy: Service role full access
CREATE POLICY "Service role can manage customers"
    ON customers
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 4. SUPPLIERS TABLE - Supplier Data Security  
-- ============================================================================

-- Enable RLS
ALTER TABLE IF EXISTS suppliers ENABLE ROW LEVEL SECURITY;

-- Clear old policies
DROP POLICY IF EXISTS "Suppliers viewable by authenticated" ON suppliers;
DROP POLICY IF EXISTS "Service role can manage suppliers" ON suppliers;

-- Policy: Authenticated users can view suppliers
CREATE POLICY "Suppliers viewable by authenticated"
    ON suppliers
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Service role full access
CREATE POLICY "Service role can manage suppliers"
    ON suppliers
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify RLS is working)
-- ============================================================================

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('properties', 'reservations', 'customers', 'suppliers')
-- ORDER BY tablename;

-- Check policies:
-- SELECT policyname, tablename, policytype
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- ============================================================================
-- DONE! RLS Policies Applied Successfully ✅
-- ============================================================================
