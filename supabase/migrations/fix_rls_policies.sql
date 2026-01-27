-- Fix RLS policies for reservations
-- Allow authenticated users (agents) to create reservations for ANY client email
-- Allow anonymous users to create reservations (for public booking flow / dev testing)

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can view their own reservations" ON public.reservations;

-- 2. Create new INSERT policy for Authenticated Users (Agents)
-- Agents can create reservations where the client email is different from their own
CREATE POLICY "Authenticated users can create reservations"
    ON public.reservations
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 3. Create new INSERT policy for Anonymous Users (Public Booking)
-- Essential for Guest Checkout flow if implemented, or dev testing without auth
CREATE POLICY "Anonymous users can create reservations"
    ON public.reservations
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- 4. Create new SELECT policy
-- Agents can view all reservations created by them (if we track agent_id)
-- Or users can view reservations matching their email
CREATE POLICY "Users can view own reservations"
    ON public.reservations
    FOR SELECT
    USING (
        auth.email() = email 
        OR 
        auth.role() = 'service_role'
        OR
        auth.role() = 'authenticated' -- Temporarily allow all auth users to see all (for dev)
    );
