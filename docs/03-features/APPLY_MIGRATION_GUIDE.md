# Apply Reservations Table Migration

## Quick Start

### Option 1: Supabase Dashboard (Easiest)

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your OlympicHub project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy Migration SQL**
   - Open: `d:\OlympicHub\supabase\migrations\create_reservations_table.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)

4. **Run Migration**
   - Paste into SQL Editor
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for success message

5. **Verify**
   Run this query to verify the table was created:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'reservations' 
   ORDER BY ordinal_position;
   ```

   You should see all columns listed.

### Option 2: Supabase CLI (Advanced)

```powershell
# 1. Install Supabase CLI (if not installed)
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
# Get your project ref from: https://app.supabase.com/project/_/settings/general
supabase link --project-ref YOUR_PROJECT_REF

# 4. Apply all pending migrations
supabase db push

# 5. Verify
supabase db diff
```

## Migration File Location

```
d:\OlympicHub\supabase\migrations\create_reservations_table.sql
```

## What This Migration Does

1. **Creates `reservations` table** with all necessary columns
2. **Adds indexes** for fast queries on:
   - `cis_code` (unique reservation code)
   - `ref_code` (unique reference code)
   - `email` (customer email)
   - `status` (booking status)
   - `check_in` (check-in date)
   - `created_at` (creation timestamp)
   - `provider` (API provider)

3. **Enables Row Level Security (RLS)** with policies:
   - Users can view their own reservations
   - Users can create new reservations
   - Service role has full access

4. **Creates `updated_at` trigger** to automatically update timestamp on changes

## After Migration

### Test the Table

Run this query in Supabase SQL Editor:

```sql
-- Insert a test reservation
INSERT INTO public.reservations (
    cis_code,
    ref_code,
    status,
    customer_name,
    customer_type,
    email,
    phone,
    destination,
    accommodation_name,
    check_in,
    check_out,
    nights,
    total_price,
    paid,
    currency,
    supplier,
    trip_type,
    pax_count,
    provider
) VALUES (
    'CIS-TEST-0001',
    'REF-TEST-0001',
    'pending',
    'Test User',
    'B2C-Individual',
    'test@example.com',
    '+381601234567',
    'Athens',
    'Test Hotel',
    '2025-06-01',
    '2025-06-05',
    4,
    500.00,
    0.00,
    'EUR',
    'Solvex (Bulgaria)',
    'Smeštaj',
    2,
    'solvex'
);

-- Verify the insert
SELECT * FROM public.reservations WHERE cis_code = 'CIS-TEST-0001';

-- Clean up test data
DELETE FROM public.reservations WHERE cis_code = 'CIS-TEST-0001';
```

### Test the Booking Flow

1. Start the dev server:
   ```powershell
   npm run dev
   ```

2. Navigate to Global Hub Search

3. Search for a hotel (e.g., "Athens")

4. Click "Rezerviši" on any hotel

5. Fill in guest details and submit

6. Check Supabase dashboard → `reservations` table for the new record

## Troubleshooting

### Error: "relation 'reservations' already exists"
The table is already created. You can skip this migration.

### Error: "permission denied"
Make sure you're logged in as the project owner or have sufficient permissions.

### Error: "syntax error at or near..."
Make sure you copied the ENTIRE migration file, including all SQL statements.

### RLS Policy Errors
If you get RLS policy errors when testing:
1. Check that RLS is enabled: 
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'reservations';
   ```
2. Verify policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'reservations';
   ```

## Next Steps After Migration

1. ✅ Test the booking flow in the app
2. ✅ Verify reservations are saved to database
3. ✅ Check that CIS-CODE and REF-CODE are generated correctly
4. ⏳ Obtain Solvex Booking API documentation
5. ⏳ Implement real Solvex booking integration
6. ⏳ Build admin dashboard to view reservations

---

**Need Help?** Check `docs/03-features/BOOKING_DATABASE_STATUS.md` for full documentation.
