# 🚀 GOTOVA CHECKLIST ZA PREUZIMANJE HOTELA
## 3 KORAKA - GOTOVO

### ✅ KORAK 1: Preuzmanje SERVICE_ROLE_KEY
```powershell
# Pokreni skript koji će te voditi kroz proces
.\setup-service-role-key.ps1
```

**Šta će se desiti:**
1. Otvorena Supabase dashboard URL
2. Pronađi "Service role secret"
3. Klikni "Reveal" 
4. Kopiraj ključ
5. Prosljeđi ključ skriptu

**Rezultat:** `.env.server` će biti ažuriran sa pravim SERVICE_ROLE_KEY

---

### ✅ KORAK 2: Primjena RLS Polícy-ja
**Lokacija:** https://app.supabase.com/project/fzupyhunlucpjaaxksoi/sql

**Šta trebam da uradim:**
1. Otvori SQL Editor
2. Kreiraj novi query
3. Kopiraj i prosljeđi sadržaj iz: `supabase/migrations/20260206_security_rls_improvements.sql`
4. Klikni "Run" 

**Predvideli rezultat:**
```
✅ Created policy "Anyone can view published properties"
✅ Created policy "Only service role can modify properties"
✅ Created policy "Only service role can delete properties"
...itd
```

---

### ✅ KORAK 3: Pokretanje Download Skripte

Kada su KORAK 1 i 2 gotovi, pokreni:

```powershell
cd d:\Antigravity\OlympicHub+B2B
node download_hotel_content.cjs
```

**Očekivani ispis:**
```
🚀 Starting hotel content download...
📥 Connected to Supabase ✅
🔗 Connected to Solvex API ✅
📊 Found 2000+ hotels to process
⏱️  Processing batch 1/44...
[1/50] Hotel Name (sol_XXXX)...
[2/50] Hotel Name (sol_XXXX)...
```

---

## ⚠️ AKO NEŠTO POĐE PO ZLU

### Problem: "Missing Supabase credentials"
**Rješenje:**
- Provjeri da li si završio KORAK 1 ✅
- Provjeri da li `.env.server` ima SERVICE_ROLE_KEY
- Pokreni `.\setup-service-role-key.ps1` opet

### Problem: "RLS Violation"
**Rješenje:**
- Provjeri da li si završio KORAK 2 ✅
- Otvori Supabase → Policies
- Trebalo bi vidjeti 6 politika na `properties` tabeli

### Problem: "GUID not found" (Solvex API)
**Rješenje:**
- Provjeri Solvex kredencijale u `.env.server`
- SOLVEX_LOGIN=sol611s
- SOLVEX_PASSWORD=En5AL535

### Problem: "Connection timeout"
**Rješenje:**
- Solvex server je spora konekcija
- Script se automatski pokušava 3 puta
- Čekaj da se završi (može potrajati 8-20 sati za 2000+ hotela)

---

## 📊 NAPREDAK TIJEKOM DOWNLOAD-a

Script kreira `download_summary.json` fajl sa info:
```json
{
  "total_hotels": 2000,
  "successful": 1950,
  "failed": 50,
  "time_elapsed": "12h 34m",
  "rate_limited": 15,
  "failed_hotels": ["sol_1234", "sol_5678"]
}
```

---

## ✅ SIGURNOST - ZAPAMTI

🔒 **Obavezno:**
- ✅ `.env.server` je lokalno samo za tebe
- ✅ NIKADA ne commit-aj `.env.server`
- ✅ NIKADA ne dijeli SERVICE_ROLE_KEY
- ✅ NIKADA ne stavi u Vite build

---

## 📞 POMOĆ

Ako kod nešto ne razumiješ, provjeri:
- [SECURITY_SETUP_GUIDE.md](SECURITY_SETUP_GUIDE.md) - detaljni sigurnosni setup
- [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) - korak po korak upustva
- [SECURITY_ANALYSIS.md](SECURITY_ANALYSIS.md) - zašto je sigurnost važna

---

**Spreman? 🚀 Kreni sa KORAK 1!**
