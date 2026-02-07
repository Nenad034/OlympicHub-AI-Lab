# ⚠️ SIGURNOSNA ANALIZA - SUPABASE & VITE

## 🔴 DETEKTOVANI PROBLEMI

### 1. **ANON KEY U VITE BUILD-u** (KRITIČNO)
```typescript
// src/supabaseClient.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;      // ✅ OK - može biti javno
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;  // 🚨 PROBLEM!
```

**Šašta se dešava:**
- `VITE_` varijable se kompajliraju u JavaScript kod tijekom `npm run build`
- ANON KEY postaje vidljiv u `dist/assets/*.js` fajlovima
- Bilo ko može da izvuče tvoj ANON KEY iz JavaScript koda
- Sa ANON KEY-em, neko može direktno pristupiti Supabase bazi kroz frontend

---

### 2. **RLS POLICIES PREVIŠE PERMISIVNI** (UPOZORENJE)

```sql
-- fix_rls_policies.sql
CREATE POLICY "Users can view own reservations"
    ON public.reservations
    FOR SELECT
    USING (
        auth.email() = email 
        OR 
        auth.role() = 'service_role'
        OR
        auth.role() = 'authenticated'  -- 🚨 SVE AUTHENTIFICIRANE OSOBE VIDE SVE!
    );
```

**Šašta se dešava:**
- Bilo koja ulogovana osoba može vidjeti SVE rezervacije
- Trebalo bi samo da vidje SVOJE rezervacije

---

### 3. **PROPERTIES TABELA - NEMA RLS POLICY-ja** (UPOZORENJE)

```sql
-- supabase_setup.sql
CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    ... ostale kolone
);
-- Nema CREATE POLICY!
```

**Šašta se dešava:**
- `properties` tabela ima sve `INSERT/UPDATE/DELETE/SELECT` dozvole za sve
- Sa ANON KEY-em iz frontend-a, neko može izmjeniti ili obrisati hotele!

---

## 🔒 KAKO ZAŠTITITI

### Rješenje 1: Koristi Backend/Serverless za Operacije Pisanja

Za `download_hotel_content.cjs` (pisanje u `properties` tabelu):
- ✅ Koristi **SERVICE_ROLE_KEY** (nikada ne stavi u Vite build!)
- ✅ Pokrenite kao Node.js skript (server-side)
- ✅ Nikada nemojte staviti SERVICE_ROLE_KEY u `.env` koji se koristi u Vite

**Struktura:**
```
.env (lokalno):
  VITE_SUPABASE_URL=...           # OK za Vite (javno)
  VITE_SUPABASE_ANON_KEY=...      # OK za Vite (ograničeno)
  SUPABASE_SERVICE_ROLE_KEY=...   # ⚠️ NIKADA U VITE! Samo za Node.js/backend

download_hotel_content.cjs:
  const supabase = createClient(url, SERVICE_ROLE_KEY);  # ✅ Puna kontrola
```

---

### Rješenje 2: Postavi RLS Policy-je za properties

```sql
-- Zaštita za properties tabelu (hotele)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Samo čitanje za sve korisnike
CREATE POLICY "Anyone can view published properties"
    ON properties
    FOR SELECT
    USING (isActive = true);

-- Samo admin može pisati (kroz backend sa SERVICE_ROLE_KEY)
CREATE POLICY "Only service role can modify properties"
    ON properties
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can delete properties"
    ON properties
    FOR DELETE
    USING (auth.role() = 'service_role');
```

---

### Rješenje 3: Popravka RLS za Reservations

```sql
-- fix_rls_policies.sql - POBOLJŠANO
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;

-- Samo SVOJE rezervacije!
CREATE POLICY "Users can view own reservations"
    ON public.reservations
    FOR SELECT
    USING (auth.email() = email);  -- Samo email koji se poklapa

-- Admin pristup
CREATE POLICY "Service role can view all"
    ON public.reservations
    FOR SELECT
    USING (auth.role() = 'service_role');
```

---

### Rješenje 4: .env Struktura

```env
# ✅ SIGURNO - U VITE BUILD
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...  (ograničene dozvole)

# ⚠️ NIKADA U VITE - SAMO ZA NODE.JS SKRIPTE
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  (puna kontrola)
```

**U `.gitignore`:**
```
.env
.env.local
.env*.local
```

---

### Rješenje 5: Supabase Functions (Serverless)

Alternativa za Node.js skripte - Supabase Edge Functions:
```typescript
// supabase/functions/download-hotel-content/index.ts
import { createClient } from '@supabase/supabase-js';

export default async (req: Request) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''  // ✅ Sigurno - na serveru
    );
    
    // Logika za preuzimanje
    return new Response(JSON.stringify({ success: true }));
};
```

---

## ✅ PREPORUKE ZA TVOj SLUČAJ

Za `download_hotel_content.cjs`:

1. **Kreiraj `.env.server` ili poseban file:**
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # PUNO PRISTUPA
   SOLVEX_LOGIN=...
   SOLVEX_PASSWORD=...
   ```

2. **Mod dozvola za .env fajlove:**
   ```bash
   chmod 600 .env
   chmod 600 .env.server
   ```

3. **Nikada nemoj:**
   - Commitati `.env` fajlove sa SERVICE_ROLE_KEY
   - Koristiti SERVICE_ROLE_KEY u frontend kodu
   - Javno dijeliti ANON_KEY sa ograničenjima

4. **Za Frontend:**
   - Koristi samo `VITE_SUPABASE_ANON_KEY`
   - RLS policies štite šašta može da uradi sa tim key-om
   - Ne pisuj direktno u `properties` iz frontend-a

5. **Za Backend Skripte:**
   - Koristi `SUPABASE_SERVICE_ROLE_KEY`
   - Pokrenite lokalno ili na svom serveru
   - Nikada nemojte staviti u Vite build

---

## 🛡️ CHECKLIST

- [ ] RLS je omogućen na svim tabelama
- [ ] SERVICE_ROLE_KEY je u `.env.server` ili `.env.local`
- [ ] SERVICE_ROLE_KEY NIJE u `.env.example`
- [ ] `.env` i `.env.server` su u `.gitignore`
- [ ] Frontend koristi samo ANON_KEY sa RLS limitacijama
- [ ] Backend skripte koriste SERVICE_ROLE_KEY
- [ ] RLS policy-ji su specifični (email == auth.email(), ne "authenticated")
- [ ] `properties` tabela ima RLS policy-je

---

## 🚨 TRENUTNO STANJE TVOJE APLIKACIJE

**Problem:** `download_hotel_content.cjs` koristi ANON_KEY
```javascript
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;  // 🚨 ANON KEY
```

**Trebam:**
```javascript
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;  // ✅ SERVICE ROLE KEY
```

Trebam li da ispravim skript?
