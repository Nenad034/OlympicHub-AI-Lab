# 🔒 SIGURNOSNI SETUP - PRIJE POKRETANJA

## ✅ ŠAŠTA JE ISPRAVLJENO

1. **download_hotel_content.cjs** sada koristi `SUPABASE_SERVICE_ROLE_KEY` umjesto ANON_KEY ✅
2. **RLS Policies** za `properties` tabelu - samo čitanje za javnost, pisanje samo za backend ✅
3. **RLS Policies** za `reservations` tabelu - popravljeno da korisnici vide samo SVOJE rezevacije ✅
4. **.gitignore** je ažuriran sa `.env.server` fajlovima ✅
5. **.env.server.example** template je kreiran ✅

---

## 📋 SETUP KORACI

### Korak 1: Kreiraj `.env.server` fajl

```bash
cp .env.server.example .env.server
```

Zatim uredi `.env.server` i popuni:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...  # ← Preuzmi sa Supabase Dashboard

# Ili koristi postojeće iz .env
SOLVEX_LOGIN=sol611s
SOLVEX_PASSWORD=AqC384lF
```

**Gdje preuzeti SERVICE_ROLE_KEY:**
1. Idi na https://app.supabase.com/project/xxxxx/settings/api
2. Pronađi "Service role secret"
3. Klikni "Reveal" i kopiraj

---

### Korak 2: Primijeni RLS Policies (sigurnost)

U Supabase SQL Editor, pokreni:
```sql
-- Kopiraj sadržaj iz ovog fajla i pokreni u Supabase:
-- supabase/migrations/20260206_security_rls_improvements.sql
```

Ili koristi Supabase CLI:
```bash
supabase db push
```

---

### Korak 3: Provjeri Dozvole Fajlova

```bash
# Linux/Mac - Čini .env fajlove vidljivi samo za tebe
chmod 600 .env
chmod 600 .env.server

# Windows - Nije neophodno, ali preporučujem:
# - Desni klik na fajl → Properties
# - Security → Edit → Remove "Users" → Apply
```

---

### Korak 4: Verifikuj Setup

Testiraj sa malim batch-om (1-5 hotela):

```bash
# Kreiraj temporary test script
cat > test_download.cjs << 'EOF'
require('dotenv').config({ path: '.env.server' });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('✅ SUPABASE_URL:', url.substring(0, 20) + '...');
console.log('✅ SERVICE_ROLE_KEY exists:', !!key);
console.log('✅ SERVICE_ROLE_KEY length:', key?.length);
EOF

node test_download.cjs
```

Trebao bi viditi:
```
✅ SUPABASE_URL: https://xxxxx.supabase...
✅ SERVICE_ROLE_KEY exists: true
✅ SERVICE_ROLE_KEY length: 500+
```

---

### Korak 5: Pokrenni Download

```bash
node download_hotel_content.cjs
```

**VAŽNO:** Script će čitati iz `.env` i `.env.server` fajlova

---

## ⚠️ SIGURNOSNE MJERE

### ✅ Učinio SI Sigurno:

```bash
# .env.server NIKADA ne ide na Git
grep ".env.server" .gitignore  # Trebalo bi biti OK

# Service role key je samo lokalno
ls -la .env.server  # Trebalo bi biti vidljivo samo tebi
```

### ⚠️ NIKADA NEMOJ:

- ❌ Staviti SERVICE_ROLE_KEY u `.env.example` 
- ❌ Commitati `.env.server` na Git
- ❌ Dijeliti SERVICE_ROLE_KEY na Slack/email
- ❌ Koristiti SERVICE_ROLE_KEY u frontend kodu
- ❌ Pushati `.env` ili `.env.server` u javni repo

### ✅ DOBAR OPIS:

- ✅ Koristi SERVICE_ROLE_KEY samo u Node.js skriptama
- ✅ Koristi ANON_KEY sa RLS policy-jima za frontend
- ✅ Čuva `.env.server` lokalno (nikad na serverima osim ako je trusted)
- ✅ Rotira SERVICE_ROLE_KEY ako je kompromitovan

---

## 📊 SIGURNOSNE PROVJERE

### 1. RLS Status

Pokreni u Supabase SQL Editor:
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename = 'properties' OR tablename = 'reservations');
```

Trebalo bi vidjeti:
```
properties      | t  (RLS je UKLJUČEN)
reservations    | t  (RLS je UKLJUČEN)
```

### 2. Policy Status

```sql
SELECT policyname, tablename FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Trebalo bi vidjeti ~6-7 policies

### 3. Testiraj Policy (kao Anon User)

```sql
-- U Supabase, postavi JWT na "anon" i pokreni:
SELECT COUNT(*) FROM properties WHERE isActive = true;  -- Trebalo bi OK
UPDATE properties SET name = 'test' WHERE id = 'solvex_1';  -- Trebalo bi ERROR
```

---

## 🚀 POKRETANJE

```bash
# Terminal 1: Frontend (već je pokrenut)
# npm run dev  # http://localhost:5173

# Terminal 2: Backend Download (NOVČEM)
node download_hotel_content.cjs
```

---

## 📚 DODATNI RESURSI

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase API Keys](https://supabase.com/docs/guides/api#api-url-and-keys)
- [Environment Variables Best Practices](https://12factor.net/config)

---

## ✅ CHECKLIST - PRIJE NEGO ŠTO POKRENUŠ

- [ ] `.env.server` je kreiran sa SERVICE_ROLE_KEY
- [ ] `.env.server` je u `.gitignore`
- [ ] RLS policies su primijenjene (20260206_security_rls_improvements.sql)
- [ ] Supabase SQL verifikacija - RLS je "t" (uključen)
- [ ] Test script je prošao OK
- [ ] `download_hotel_content.cjs` koristi `SUPABASE_SERVICE_ROLE_KEY`

🟢 **Kada su svi checklist stavke OK, spreman si za download!**

```bash
node download_hotel_content.cjs
```
