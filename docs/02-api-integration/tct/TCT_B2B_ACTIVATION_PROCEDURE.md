# 🚀 TCT B2B Aktivacija - Kompletna Procedura

## 📋 Kada Dobijete B2B Pristup - Tačni Koraci

---

## ⚠️ PRE NEGO ŠTO POČNETE

### Potvrda B2B Aktivacije:
1. ✅ Dobili ste email od TCT tima (sebastian.rabei@tct.travel)
2. ✅ U email-u piše da je B2B pristup **aktiviran**
3. ✅ Možete da se prijavite na https://imc-dev.tct.travel/dashboard

---

## 🔧 KORAK 1: Prebacivanje sa Mock na Real API

### 1.1. Otvorite `.env` fajl
```bash
# Lokacija: d:\OlympicHub\.env
```

### 1.2. Promenite JEDNU liniju
```bash
# BILO:
VITE_TCT_USE_MOCK=true

# POSTAJE:
VITE_TCT_USE_MOCK=false
```

### 1.3. Sačuvajte fajl
- Pritisnite `Ctrl + S`
- Zatvorite fajl

### 1.4. Restartujte Development Server
```bash
# U terminalu:
# 1. Zaustavite server: Ctrl + C
# 2. Pokrenite ponovo:
npm run dev
```

### 1.5. Proverite Console Log
Otvorite browser console i trebalo bi da vidite:
```
🔌 TCT API: Using REAL service
```

**✅ Ako vidite ovu poruku, uspešno ste prebacili na Real API!**

---

## 🧪 KORAK 2: Testiranje sa Dry Run Mode (Bezbedno)

### 2.1. Otvorite Browser Console
- Pritisnite `F12` u browseru
- Idite na tab "Console"

### 2.2. Omogućite Dry Run Mode
```javascript
// U browser console-u, ukucajte:
import('./src/services/tctApiDryRun.js').then(m => {
  m.tctDryRun.setEnabled(true);
  console.log('✅ Dry Run Mode ENABLED');
});
```

**ŠTA OVO RADI:**
- ✅ **Ništa se ne šalje** na TCT API
- ✅ Vidite **tačno šta bi se poslalo**
- ✅ Potpuno **bezbedno** za testiranje

### 2.3. Pokrenite Test
Idite na: http://localhost:5173/tct-test

Kliknite na **"Run Tests"** dugme.

### 2.4. Proverite Rezultate u Console-u
Trebalo bi da vidite:
```
🔍 DRY RUN: Connection Test
⚠️ THIS REQUEST WOULD BE SENT (but is not being sent)
🕐 Timestamp: 2026-01-04T...
📋 Method: POST
🔗 URL: https://imc-dev.tct.travel/v1/nbc/nationalities
📦 Headers: {
  "Content-Type": "application/json",
  "API-SOURCE": "B2B",
  "Authorization": "***HIDDEN***"
}
```

### 2.5. Analizirajte Dry Run Rezultate
```javascript
// U console-u:
import('./src/services/tctApiDryRun.js').then(m => {
  m.tctDryRun.printSummary();
});
```

**PROVERITE:**
- ✅ Da li su URL-ovi ispravni?
- ✅ Da li su Headers ispravni?
- ✅ Da li je Body ispravan (ako postoji)?

**Ako sve izgleda dobro, idite na sledeći korak!**

---

## 🔴 KORAK 3: Pravi Test (Šalje se na TCT API)

### 3.1. Onemogućite Dry Run Mode
```javascript
// U browser console-u:
import('./src/services/tctApiDryRun.js').then(m => {
  m.tctDryRun.setEnabled(false);
  console.log('✅ Dry Run Mode DISABLED - Real API calls will be made');
});
```

### 3.2. Omogućite Detaljni Logging
```javascript
// U browser console-u:
import('./src/services/tctApiLogger.js').then(m => {
  m.tctApiLogger.setEnabled(true);
  console.log('✅ Logging ENABLED');
});
```

### 3.3. Osvežite Stranicu
- Pritisnite `F5` ili `Ctrl + R`

### 3.4. Pokrenite Test Ponovo
- Idite na: http://localhost:5173/tct-test
- Kliknite **"Run Tests"**

### 3.5. Pratite Console Log
Trebalo bi da vidite:
```
📤 API Request: Connection Test
🕐 Time: 2026-01-04T...
🔗 URL: https://imc-dev.tct.travel/v1/nbc/nationalities
📋 Method: POST
📦 Headers: {...}

📥 API Response: Connection Test ✅
⏱️ Duration: 234ms
📊 Status: 200 OK
📄 Data: {
  "data": [
    {"id": "324528", "nationality": "Afghanistan", "code": "AF"},
    ...
  ]
}
```

---

## ✅ KORAK 4: Provera Rezultata

### 4.1. Proverite Test Rezultate na Stranici
Trebalo bi da vidite:
```
🎉 All tests passed! TCT API is fully functional.

✅ Configuration Check - TCT API credentials are configured
✅ Connection Test - Successfully connected to TCT API
✅ Get Nationalities - Retrieved 250 nationalities
✅ Get Geography - Retrieved 5000+ locations
✅ Get Airports - Retrieved 3000+ airports
✅ Get Hotel Categories - Retrieved 7 categories
✅ Get Package Departures - Package departures retrieved successfully
```

### 4.2. Proverite Logging Statistiku
```javascript
// U console-u:
import('./src/services/tctApiLogger.js').then(m => {
  m.tctApiLogger.printStats();
});
```

Trebalo bi da vidite:
```
============================================================
📊 TCT API LOGGING STATISTICS
============================================================
Total Requests: 7
✅ Successful: 7
❌ Failed: 0
⏱️ Average Duration: 345.67ms
============================================================
```

### 4.3. Proverite Neuspele Pozive (Ako Ih Ima)
```javascript
// U console-u:
import('./src/services/tctApiLogger.js').then(m => {
  const failed = m.tctApiLogger.getFailedLogs();
  if (failed.length > 0) {
    console.error('❌ Failed Requests:', failed);
  } else {
    console.log('✅ No failed requests!');
  }
});
```

---

## 🎊 KORAK 5: Finalna Potvrda

### 5.1. Pokrenite Automatski Test Suite
```javascript
// U console-u:
import('./src/services/tctApiTest.js').then(m => {
  m.runTCTTests().then(results => {
    console.log('✅ Test Suite Completed!');
    console.log('Results:', results);
  });
});
```

### 5.2. Proverite Summary
```javascript
// U console-u:
import('./src/services/tctApiTest.js').then(m => {
  const summary = m.tctApiTester.getSummary();
  console.log('📊 Summary:', summary);
  
  if (summary.successRate === 100) {
    console.log('🎉 PERFECT! All tests passed!');
  } else {
    console.warn('⚠️ Some tests failed. Check details above.');
  }
});
```

---

## 🚨 ŠTA AKO NEŠTO NE RADI?

### Problem 1: I dalje vidim "Invalid b2b system credentials"

**Rešenje:**
1. Proverite da li ste **zaista dobili B2B pristup** od TCT-a
2. Kontaktirajte `sebastian.rabei@tct.travel` i potvrdite aktivaciju
3. Proverite da li je `.env` fajl **sačuvan** sa `VITE_TCT_USE_MOCK=false`
4. **Restartujte server** (Ctrl+C, pa `npm run dev`)

### Problem 2: Vidim "Using MOCK service" umesto "Using REAL service"

**Rešenje:**
1. Proverite `.env` fajl - mora biti `VITE_TCT_USE_MOCK=false`
2. **Restartujte server** - Vite mora da učita novu env varijablu
3. **Osvežite browser** (Ctrl+Shift+R za hard refresh)

### Problem 3: Neki testovi prolaze, neki ne

**Rešenje:**
1. Proverite koje tačno testove ne prolaze:
```javascript
import('./src/services/tctApiLogger.js').then(m => {
  const failed = m.tctApiLogger.getFailedLogs();
  console.log('Failed:', failed);
});
```
2. Kontaktirajte TCT support sa detaljima grešaka
3. Možda nemate pristup svim endpointima - zatražite pun B2B pristup

### Problem 4: Timeout ili spori odgovori

**Rešenje:**
1. Ovo je normalno za prvi poziv - TCT API može biti sporiji
2. Pokušajte ponovo
3. Proverite internet konekciju

---

## 📊 OČEKIVANI REZULTATI

### Uspešna B2B Aktivacija:

| Test | Očekivani Rezultat |
|------|-------------------|
| Configuration Check | ✅ Passed |
| Connection Test | ✅ Passed (200 OK) |
| Get Nationalities | ✅ ~250 nacionalnosti |
| Get Geography | ✅ ~5000+ lokacija |
| Get Airports | ✅ ~3000+ aerodroma |
| Get Hotel Categories | ✅ 7 kategorija |
| Get Package Departures | ✅ Podaci o paketima |

### Vreme Izvršavanja:
- ⏱️ Prvi poziv: 500-1500ms (normalno)
- ⏱️ Sledeći pozivi: 200-500ms (brže)

---

## 🎯 SLEDEĆI KORACI NAKON USPEŠNE AKTIVACIJE

### 1. Testirajte Hotel Search
```javascript
// U console-u:
import('./src/services/tctApi.js').then(async m => {
  const result = await m.tctApi.searchHotelsSync({
    search_type: 'city',
    location: '647126', // Hurghada
    checkin: '2026-02-15',
    checkout: '2026-02-22',
    rooms: [{ adults: 2, children: 0 }],
    currency: 'EUR',
    nationality: '324667', // Serbia
    residence: '324667'
  });
  
  console.log('🏨 Hotel Search Results:', result);
});
```

### 2. Testirajte Package Search
```javascript
// U console-u:
import('./src/services/tctApi.js').then(async m => {
  const result = await m.tctApi.getPackageDepartures('all');
  console.log('📦 Package Departures:', result);
});
```

### 3. Razvijajte UI
- Sada možete da razvijate UI sa **pravim podacima**
- Sve mock komponente će automatski raditi sa real API-jem

---

## 📝 CHECKLIST - Korak po Korak

Kopirajte ovu listu i checkmark-ujte kako napredujete:

```
□ 1. Dobio sam email od TCT-a o B2B aktivaciji
□ 2. Promenio sam VITE_TCT_USE_MOCK=false u .env
□ 3. Restartovao sam dev server (npm run dev)
□ 4. Video sam "Using REAL service" u console-u
□ 5. Omogućio sam Dry Run mode
□ 6. Pokrenuo sam testove u Dry Run mode-u
□ 7. Proverio sam da li Dry Run rezultati izgledaju dobro
□ 8. Onemogućio sam Dry Run mode
□ 9. Omogućio sam Logging
□ 10. Pokrenuo sam prave testove
□ 11. Svi testovi su prošli (7/7)
□ 12. Proverio sam logging statistiku
□ 13. Nema neuspelih poziva
□ 14. Pokrenuo sam automatski test suite
□ 15. Success rate je 100%
□ 16. Testirao sam Hotel Search
□ 17. Testirao sam Package Search
□ 18. SVE RADI! 🎉
```

---

## 🆘 KONTAKT ZA POMOĆ

Ako nešto ne radi:

1. **TCT Support:**
   - Email: sebastian.rabei@tct.travel
   - Portal: https://imc-dev.tct.travel/dashboard

2. **Dokumentacija:**
   - `TCT_INTEGRATION_PLAN.md` - Kompletan plan
   - `TCT_SECURITY_TOOLS.md` - Alati za testiranje
   - `TCT_SECURITY_QUICK_START.md` - Brzi vodič

3. **Debug Alati:**
   - Browser Console (F12)
   - `tctApiLogger` - Vidi sve API pozive
   - `tctDryRun` - Testiraj bez slanja

---

## 🎊 ČESTITAMO!

Kada završite sve korake i vidite:
```
🎉 All tests passed! TCT API is fully functional.
```

**Uspešno ste povezali OlympicHub sa TCT B2B API-jem!** 🚀

Sada možete da:
- ✅ Pretražujete hotele
- ✅ Pretražujete letove
- ✅ Pretražujete pakete
- ✅ Kreirate rezervacije
- ✅ Upravljate rezervacijama

**Sve sa pravim podacima iz TCT sistema!**

---

**Poslednje ažuriranje:** 2026-01-04  
**Status:** Spremno za B2B aktivaciju  
**Verzija:** 1.0
