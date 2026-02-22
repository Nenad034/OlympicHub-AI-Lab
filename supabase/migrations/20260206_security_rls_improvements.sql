-- ============================================================================
-- RLS POLICIES FOR PROPERTIES TABLE (HOTELS)
-- 
-- Ensures:
-- 1. Anyone can READ published hotels (public booking)
-- 2. Only backend (SERVICE_ROLE_KEY) can WRITE/UPDATE/DELETE
-- ============================================================================

-- Enable RLS on properties table
ALTER TABLE IF EXISTS properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Service role can manage properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can view properties" ON properties;

-- Policy 1: Anyone (including anon) can SELECT active hotels
CREATE POLICY "Anyone can view active properties"
    ON properties
    FOR SELECT
    USING (isActive = true);

-- Policy 2: Service role (backend) can do all operations
CREATE POLICY "Service role can manage properties"
    ON properties
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- RLS POLICIES FOR RESERVATIONS TABLE (FIX)
-- 
-- Current issue: Authenticated users can see ALL reservations (too permissive)
-- Fix: Only see own reservations (by email) or if service role (admin)
-- ============================================================================

-- Enable RLS on reservations
ALTER TABLE IF EXISTS reservations ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Anonymous users can create reservations" ON reservations;

-- Policy 1: INSERT for authenticated users (agents creating reservations)
CREATE POLICY "Authenticated users can create reservations"
    ON reservations
    FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- Allow agents to create any reservation

-- Policy 2: INSERT for anonymous users (public booking flow)
CREATE POLICY "Anonymous users can create reservations"
    ON reservations
    FOR INSERT
    TO anon
    WITH CHECK (true);  -- Allow public to create reservations

-- Policy 3: SELECT - Users can only see THEIR OWN reservations
CREATE POLICY "Users can view own reservations"
    ON reservations
    FOR SELECT
    USING (auth.email() = email);  -- Only by exact email match

-- Policy 4: SELECT - Service role (admin) can see all
CREATE POLICY "Service role can view all reservations"
    ON reservations
    FOR SELECT
    USING (auth.role() = 'service_role');

-- Policy 5: UPDATE - Service role only
CREATE POLICY "Service role can update reservations"
    ON reservations
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check RLS status:
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND (tablename = 'properties' OR tablename = 'reservations');

-- Check policies:
-- SELECT policyname, tablename, qual, with_check FROM pg_policies 
-- WHERE schemaname = 'public';
