# 🔒 SIGURNOSNI SETUP - KORAK PO KORAK

## 📋 ŠTA TREBAM DA URADIM

### KORAK 1️⃣: Pronađi SERVICE_ROLE_KEY u Supabase

1. Otvori https://app.supabase.com/project/fzupyhunlucpjaaxksoi/settings/api
2. Skroluj do "Service role secret"
3. Klikni "Reveal" dugme
4. **KOPIRAJ** kompletan ključ (počinje sa `eyJh...`)

**Trebalo bi da vidim nešto kao:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dXB5aHVubHVjcGphYXhrc29pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUzNDM5OCwiZXhwIjoyMDg1MTEwMzk4fQ.XXXXXXXXXXXXXXX
```

---

### KORAK 2️⃣: Ispuni `.env.server` fajl

Fajl se nalazi u projektu (već sam ga kreirao):
```
d:\Antigravity\OlympicHub+B2B\.env.server
```

**Zamijeni ovaj dio:**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dXB5aHVubHVjcGphYXhrc29pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUzNDM5OCwiZXhwIjoyMDg1MTEwMzk4fQ.EXAMPLE_SERVICE_ROLE_KEY
```

**SA:**
```env
SUPABASE_SERVICE_ROLE_KEY=[PASTE KLJUČ KOJI SI KOPIRAO IZ SUPABASE]
```

Trebalo bi da izgleda:
```env
SUPABASE_URL=https://fzupyhunlucpjaaxksoi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dXB5aHVubHVjcGphYXhrc29pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUzNDM5OCwiZXhwIjoyMDg1MTEwMzk4fQ.XXXXXXXXXXXXXXX
```

---

### KORAK 3️⃣: Primijeni RLS Policies u Supabase

1. Otvori Supabase SQL Editor: https://app.supabase.com/project/fzupyhunlucpjaaxksoi/sql
2. Klikni "New Query"
3. **Kopiraj sav sadržaj iz:** `APPLY_RLS_POLICIES.sql`
   ```
   d:\Antigravity\OlympicHub+B2B\APPLY_RLS_POLICIES.sql
   ```
4. Zalijepi u SQL Editor
5. Klikni "Run" (ili Ctrl+Enter)

**Trebalo bi da vidiš:** `Query executed successfully ✓`

---

### KORAK 4️⃣: Verifikuj da je RLS Primijenjeno

U Supabase SQL Editor, pokreni:

```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('properties', 'reservations', 'customers', 'suppliers')
ORDER BY tablename;
```

**Trebalo bi da vidiš:**
```
properties      | t  ✅ (RLS je UKLJUČEN)
reservations    | t  ✅
customers       | t  ✅
suppliers       | t  ✅
```

---

### KORAK 5️⃣: Pokrenni Download

U PowerShell terminalnom:

```bash
cd d:\Antigravity\OlympicHub+B2B
node download_hotel_content.cjs
```

**Trebalo bi da vidiš:**
```
✅ [13:45:23] SUPABASE - Database connection successful
🟡 [13:45:24] Loading hotels from Supabase...
✅ [13:45:25] Loaded 2189 hotels
📦 Batch 1/44 - 50 hotels
[1-1/50] Hotel Name (ID)...
[1-2/50] Another Hotel (ID)...
...
```

---

## ⚠️ ŠAŠTA SE MOŽE POĆI PO ZLU

### ❌ Problem: "GUID not found"
- Solvex API je nedostupan ili kredencijali su pogrešni
- Provjeri Solvex VITE_SOLVEX_PASSWORD u `.env`

### ❌ Problem: "Missing Supabase credentials"
- `.env.server` nema SERVICE_ROLE_KEY
- Provjeri da li si popunio `.env.server` sa pravim ključem

### ❌ Problem: "RLS Violation"
- RLS polícy-ji nisu primijenjeni
- Provjeri KORAK 3 - da li je SQL query obavljen uspješno

### ❌ Problem: "Timeout after 30 seconds"
- Solvex server je spora internet konekcija
- Provjeri `REQUEST_TIMEOUT=30000` u `.env.server`

---

## ✅ CHECKLIST - ZAVRŠIO SI AKO:

- [ ] SERVICE_ROLE_KEY je pronađen u Supabase
- [ ] `.env.server` je ispunjen sa SERVICE_ROLE_KEY
- [ ] SQL polícy-ji su primijenjeni (APPLY_RLS_POLICIES.sql)
- [ ] RLS verifikacija vraća "t" za sve tabele
- [ ] `download_hotel_content.cjs` je pokrennut bez greške

🟢 **Kada su svi checkboxes označeni, preuzimanje je uspješno pokrenut!**

---

## 📊 OČEKIVANI REZULTATI

**Vrijeme trajanja:**
- 2000+ hotela × ~30 sekundi = ~16-20 sati
- Ili sa `BATCH_SIZE=100` i `RATE_LIMIT_MS=200` = ~8-10 sati
- Ili overnight/background

**Output:**
```json
{
  "timestamp": "2026-02-06T15:30:00Z",
  "totalHotels": 2189,
  "successfulUploads": 1654,  // ~75% jer nisu svi imaju slike
  "failedUploads": 535
}
```

**U Supabase `properties` tabeli:**
- `content.description` - HTML opis hotela ✅
- `images[]` - Array sa URL-ovima slika ✅
- `updated_at` - Timestamp ✅

---

## 🎁 DODATNI SAVJETI

### Ako je spora konekcija:
U `.env.server` promijeni:
```env
BATCH_SIZE=30              # Manji batch-evi
RATE_LIMIT_MS=500          # Veća pauza između zahtjeva
REQUEST_TIMEOUT=60000      # Veći timeout (60 sekundi)
```

### Ako hoćeš da vidis više detalja:
Skript je već sa detaljnim logging-om. Svi API zahtjevi su prikazani.

### Ako trebam da prekinem download:
```bash
Ctrl+C
```

---

## 🚀 SADA SI SPREMAN!

**Slijedi KORAK 1-5 gore i trebalo bi biti OK! 🎯**

Ako nešto ne radi, opiši grešku i ja ću pomoći! 💪
