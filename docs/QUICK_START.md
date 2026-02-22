# 🚀 BRZA CHECKLIST - PREUZIMANJE HOTELA

## 3 KORAKA - GOTOVO U 5 MINUTA

### 1️⃣ PRONAĐI SERVICE_ROLE_KEY (2 minute)
```
🔗 Otvori: https://app.supabase.com/project/fzupyhunlucpjaaxksoi/settings/api
📋 Pronađi: "Service role secret"
👁️ Klikni: "Reveal"
📋 Kopiraj: Kompletan ključ
```

### 2️⃣ ISPUNI `.env.server` (1 minut)
```
📄 Fajl: d:\Antigravity\OlympicHub+B2B\.env.server
✏️ Pronađi: SUPABASE_SERVICE_ROLE_KEY=eyJhb...EXAMPLE...
✏️ Zamijeni sa: SUPABASE_SERVICE_ROLE_KEY=[KLJUČ KOJI SI KOPIRAO]
💾 Spremi
```

### 3️⃣ PRIMIJENI RLS I POKRENNI DOWNLOAD (2 minute)
```
1. Otvori Supabase SQL Editor
   https://app.supabase.com/project/fzupyhunlucpjaaxksoi/sql

2. Klikni "New Query"

3. Otvori APPLY_RLS_POLICIES.sql
   d:\Antigravity\OlympicHub+B2B\APPLY_RLS_POLICIES.sql

4. Kopiraj SVE i zalijepi u SQL Editor

5. Klikni "Run"
   ✅ Query executed successfully

6. U PowerShell:
   cd d:\Antigravity\OlympicHub+B2B
   node download_hotel_content.cjs
```

---

## ✅ DONE! 🎉

Preuzimanje je pokrenut!

Možeš da:
- Ostaviš kao background process (overnight)
- Prosljeđuj log output na file: `node ... > download.log 2>&1`
- Vidiš rezultate u Supabase `properties` tabeli

---

## 📞 AKO NEŠTO NE RADI

Prikaži mi:
1. Grešku sa ekrana
2. Redak gdje se desila greška
3. Log iz PowerShell-a

Ja ću riješiti! 💪
