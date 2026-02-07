# SUPABASE STRUKTURA & PREUZIMANJE SADRŽAJA

## 📊 SUPABASE TABELE - ŠAŠTA VIDIM

### 1. **`properties` tabela** - Gdje se čuvaju hoteli
```sql
- id: TEXT PRIMARY KEY (npr. "solvex_2189")
- name: TEXT
- propertyType: TEXT ('Hotel', 'Apartment', 'Villa', itd.)
- starRating: INTEGER
- isActive: BOOLEAN
- address: JSONB
- geoCoordinates: JSONB
- content: JSONB ← 🎯 OVDJE IDE OPIS (content.description)
- images: JSONB ← 🎯 OVDJE IDU SLIKE
- updated_at: TIMESTAMP
```

### 2. **`hotel_master_mappings`** - Master identifikatori hotela
- Za dedupliciranje hotela između različitih providera
- Veza između Solvex, OpenGreece, TCT, ORS itd.

### 3. **`hotel_provider_sync`** - Sinhronizacija sa provajderima
- Prati koji hoteli su već sinhronizovani
- Status: 'active', 'inactive'

---

## 🎯 ŠAŠTA TREBAM URADITI

**Cilj:** Preuzeti slike i opise sa Solvex API-ja za sve 2000+ hotele koji su već u `properties` tabeli

### Koraci:

1. **Konekcija sa Solvex API** (SOAP)
   - `Connect()` → Dobijam GUID
   
2. **Za svaki hotel u `properties` tabeli:**
   - `GetHotelDescription(hotelId)` → HTML opis
   - `GetHotelImages(hotelId)` → Lista slika sa URL-ovima
   
3. **Ažuriranje `properties` tabele:**
   - Update `content.description`
   - Update `images[]` array
   - Update `updated_at` timestamp

4. **Batch processing:**
   - Obrada 50 hotela odjednom
   - Rate limiting između zahtjeva (300ms)
   - Retry logika (max 3 pokušaja)

---

## 🚀 KAKO POKRENUTI DOWNLOAD

### Korak 1: Provjeri `.env` fajl

```bash
cat .env | grep -E "SUPABASE|SOLVEX"
```

Trebam vidjeti:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxx...
VITE_SOLVEX_LOGIN=sol611s
VITE_SOLVEX_PASSWORD=AqC384lF
```

### Korak 2: Pokrenuti download script

```bash
node download_hotel_content.cjs
```

**Šta će se desiti:**
1. Konekcija sa Solvex API
2. Učitavanje hotela iz Supabase (`properties` tabela)
3. Za svaki hotel:
   - Preuzima opis (GetHotelDescription)
   - Preuzima slike (GetHotelImages)
   - Ažurira properties tabelu
4. Batch pauze od 5 sekundi između batch-eva
5. Rezime u `download_summary.json`

---

## 📈 OČEKIVANI REZULTATI

- **Vrijeme:** ~2-3 sata za 2000+ hotela
  - 50 hotela po batch-u
  - ~30 sekundi po hotelu (preuzimanje + upload)
  - 5 sekundi pauze između batch-eva

- **Uspešnost:** ~70-80% (jer nisu svi hoteli imaju slike/opise u Solvex sistemu)

- **Output:** `download_summary.json`
  ```json
  {
    "timestamp": "2026-02-06T15:30:00.000Z",
    "totalHotels": 2189,
    "successfulUploads": 1654,
    "failedUploads": 535
  }
  ```

---

## 🔧 ŠAŠTA SE MOŽE KONFIGURIRATI

U `download_hotel_content.cjs`:

```javascript
const BATCH_SIZE = 50;          // Koliko hotela po batch-u (↑ brže, ali ↑ opterećenje)
const RATE_LIMIT_MS = 300;      // Čekanje između Solvex zahtjeva (↓ brže, ali rizik)
const MAX_RETRIES = 3;          // Pokušaji ako API zahtjev padne
const REQUEST_TIMEOUT = 30000;  // Timeout za Solvex zahtjeve (ms)
```

---

## ⚠️ MOGUĆA ČEKANJA/GREŠKE

1. **"GUID not found"** → Solvex kredencijali su pogrešni
2. **"Connection timeout"** → Solvex server je nedostupan
3. **"Supabase update failed"** → Nema pristupa `properties` tabeli
4. **"No hotels found"** → `properties` tabela je prazna

---

## 📋 SKRIPTE KOJE POSTOJE

- `download_hotel_content.cjs` ← **KORISTI OVU**
- `test_solvex_content_download.cjs` (samo za testiranje)
- `sync_json_to_supabase.cjs` (za inicijalnu sinhronizaciju JSON-a)
- `test_solvex_search_fixed.cjs` (testira da li Solvex API radi)

---

## 🎁 DODATNI RESURSI

- Solvex API dokumentacija: `Solvex api/Api dokumentacija Solvex.txt`
- Struktura baze: `supabase_setup.sql`
- Migracije: `supabase/migrations/`

---

## ✅ READY TO GO!

Sve je spremljeno. Kada budeš spreman:

```bash
node download_hotel_content.cjs
```

Sript će:
1. ✅ Konekcija sa Solvex
2. ✅ Učitavanje hotela
3. ✅ Preuzimanje sadržaja
4. ✅ Ažuriranje Supabase
5. ✅ Logovanje progresa
