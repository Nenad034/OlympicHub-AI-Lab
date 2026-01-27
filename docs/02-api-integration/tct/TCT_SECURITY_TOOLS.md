# 🔒 TCT API - Dodatna Sigurnost i Testiranje

## 📋 Pregled

Implementirali smo **3 nivoa dodatne sigurnosti** za TCT API integraciju:

1. ✅ **Automatsko Testiranje** - Test skripta koja testira sve endpointe
2. ✅ **Detaljni Logging** - Prati sve API pozive sa detaljima
3. ✅ **Dry Run Mode** - Vidi šta bi se poslalo bez slanja

---

## 🧪 1. Automatsko Testiranje

### Kako koristiti:

```typescript
import { runTCTTests, tctApiTester } from './services/tctApiTest';

// Jednostavno pokretanje svih testova
const results = await runTCTTests();

// Ili korak po korak
await tctApiTester.runAllTests();
tctApiTester.printReport();

// Dobavi summary
const summary = tctApiTester.getSummary();
console.log(`Success Rate: ${summary.successRate}%`);
```

### Šta testira:

- ✅ Connection Test
- ✅ Get Nationalities
- ✅ Get Geography
- ✅ Get Airports
- ✅ Get Hotel Categories
- ✅ Get Meal Plans
- ✅ Get Hotel Information
- ✅ Hotel Search (Sync)
- ✅ Package Departures

### Primer izlaza:

```
🧪 Starting TCT API Test Suite...
🔍 Testing: Connection Test...
✅ Connection Test - OK (234ms)
🔍 Testing: Get Nationalities...
✅ Get Nationalities - OK (456ms)
...

============================================================
📊 TCT API TEST REPORT
============================================================
Total Tests: 9
✅ Passed: 9
❌ Failed: 0
Success Rate: 100.00%
Total Duration: 3456ms
Average Duration: 384.00ms
============================================================
```

---

## 📝 2. Detaljni Logging

### Kako koristiti:

```typescript
import { tctApiLogger } from './services/tctApiLogger';

// Omogući logging (default je enabled)
tctApiLogger.setEnabled(true);

// Onemogući logging
tctApiLogger.setEnabled(false);

// Dobavi sve logove
const logs = tctApiLogger.getLogs();

// Dobavi logove za određeni endpoint
const hotelLogs = tctApiLogger.getLogsByEndpoint('Hotel Search');

// Dobavi samo neuspele pozive
const failed = tctApiLogger.getFailedLogs();

// Prikaži statistiku
tctApiLogger.printStats();

// Export logova u JSON
const json = tctApiLogger.exportLogs();
console.log(json);

// Očisti logove
tctApiLogger.clearLogs();
```

### Šta loguje:

#### Request:
- 🕐 Timestamp
- 🔗 URL
- 📋 HTTP Method
- 📦 Headers
- 📄 Request Body

#### Response:
- ⏱️ Duration (ms)
- 📊 HTTP Status
- 📦 Response Headers
- 📄 Response Data

#### Errors:
- 🚨 Error Message
- 📚 Stack Trace

### Primer izlaza:

```
📤 API Request: Hotel Search
🕐 Time: 2026-01-04T13:45:00.000Z
🔗 URL: https://imc-dev.tct.travel/v1/hotel/searchSync
📋 Method: POST
📦 Headers: {
  "Content-Type": "application/json",
  "API-SOURCE": "B2B",
  "Authorization": "Basic ***"
}
📄 Body: {
  "search_type": "city",
  "location": "647126",
  "checkin": "2026-02-15",
  "checkout": "2026-02-22",
  ...
}

📥 API Response: Hotel Search ✅
⏱️ Duration: 1234ms
📊 Status: 200 OK
📄 Data: {
  "hotels": [...],
  "total": 45
}
```

---

## 🔍 3. Dry Run Mode

### Kako koristiti:

```typescript
import { tctDryRun } from './services/tctApiDryRun';

// Omogući Dry Run mode
tctDryRun.setEnabled(true);

// Sada svi API pozivi neće biti poslati, već samo logovani
const result = await tctApi.searchHotelsSync({...});
// ⚠️ Zahtev NEĆE biti poslat, ali ćete videti šta bi se poslalo

// Dobavi sve intercepted zahteve
const results = tctDryRun.getResults();

// Prikaži summary
tctDryRun.printSummary();

// Export u JSON
const json = tctDryRun.exportResults();

// Onemogući Dry Run (vrati normalan rad)
tctDryRun.setEnabled(false);

// Očisti rezultate
tctDryRun.clearResults();
```

### Primer izlaza:

```
🔍 DRY RUN MODE ENABLED - No actual API calls will be made
📋 All requests will be logged but not sent

🔍 DRY RUN: Hotel Search
⚠️ THIS REQUEST WOULD BE SENT (but is not being sent)
🕐 Timestamp: 2026-01-04T13:45:00.000Z
📋 Method: POST
🔗 URL: https://imc-dev.tct.travel/v1/hotel/searchSync
📦 Headers: {
  "Content-Type": "application/json",
  "API-SOURCE": "B2B",
  "Authorization": "***HIDDEN***"
}
📄 Body: {
  "search_type": "city",
  "location": "647126",
  "checkin": "2026-02-15",
  "checkout": "2026-02-22",
  "rooms": [{ "adults": 2, "children": 0 }],
  "currency": "EUR",
  "nationality": "324667",
  "residence": "324667"
}

💡 To actually send this request, disable Dry Run mode:
   tctDryRun.setEnabled(false)
```

---

## 🎯 Preporučeni Workflow

### Pre B2B Aktivacije (Mock Mode):

```typescript
// 1. Koristite Mock API
// .env: VITE_TCT_USE_MOCK=true

// 2. Testirajte sve funkcionalnosti
await runTCTTests();

// 3. Razvijajte UI sa mock podacima
```

### Kada Dobijete B2B Pristup:

```typescript
// 1. Prebacite na Real API
// .env: VITE_TCT_USE_MOCK=false

// 2. Omogućite Dry Run mode
tctDryRun.setEnabled(true);

// 3. Testirajte šta bi se poslalo
await runTCTTests();
tctDryRun.printSummary();

// 4. Ako izgleda dobro, onemogućite Dry Run
tctDryRun.setEnabled(false);

// 5. Omogućite logging
tctApiLogger.setEnabled(true);

// 6. Pokrenite prave testove
await runTCTTests();

// 7. Proverite logove
tctApiLogger.printStats();
const failed = tctApiLogger.getFailedLogs();
if (failed.length > 0) {
  console.error('Some requests failed:', failed);
}

// 8. Ako sve radi - gotovo! 🎉
```

---

## 📊 Kombinovano Korišćenje

```typescript
// Omogući sve alate odjednom
tctApiLogger.setEnabled(true);
tctDryRun.setEnabled(true);

// Pokreni testove
await runTCTTests();

// Vidi šta bi se poslalo (Dry Run)
tctDryRun.printSummary();

// Vidi detaljne logove
tctApiLogger.printStats();

// Export sve za analizu
const dryRunData = tctDryRun.exportResults();
const logData = tctApiLogger.exportLogs();

// Sačuvaj u fajlove za kasnije
console.log('Dry Run Results:', dryRunData);
console.log('API Logs:', logData);
```

---

## 🛡️ Sigurnosne Napomene

### Logging:
- ⚠️ **Authorization headers su sakriveni** u dry run mode
- ⚠️ **Ne šaljite logove nikome** - mogu sadržati osetljive podatke
- ✅ Koristite samo za development i debugging

### Dry Run:
- ✅ **Potpuno bezbedno** - ništa se ne šalje
- ✅ Idealno za testiranje pre produkcije
- ⚠️ Mock responses nisu pravi podaci

### Testiranje:
- ✅ Testirajte prvo sa Mock API-jem
- ✅ Zatim sa Dry Run mode-om
- ✅ Na kraju sa pravim API-jem i logging-om

---

## 📝 Primer Kompletnog Testa

```typescript
import { runTCTTests } from './services/tctApiTest';
import { tctApiLogger } from './services/tctApiLogger';
import { tctDryRun } from './services/tctApiDryRun';

async function completeTest() {
  console.log('🚀 Starting Complete TCT API Test...\n');

  // 1. Omogući sve alate
  tctApiLogger.setEnabled(true);
  tctDryRun.setEnabled(true);

  // 2. Pokreni testove
  console.log('📋 Running automated tests...');
  const results = await runTCTTests();

  // 3. Prikaži rezultate
  console.log('\n📊 Test Results:');
  tctDryRun.printSummary();
  tctApiLogger.printStats();

  // 4. Proveri da li ima grešaka
  const failed = tctApiLogger.getFailedLogs();
  if (failed.length > 0) {
    console.error('\n❌ Failed Requests:');
    failed.forEach(log => {
      console.error(`- ${log.endpoint}: ${log.error}`);
    });
  } else {
    console.log('\n✅ All tests passed!');
  }

  // 5. Export rezultata
  const dryRunData = tctDryRun.exportResults();
  const logData = tctApiLogger.exportLogs();

  console.log('\n💾 Results exported and ready for review');

  return {
    testResults: results,
    dryRunData,
    logData,
  };
}

// Pokreni test
completeTest().then(data => {
  console.log('\n🎉 Complete test finished!');
  console.log('Review the data above for detailed information.');
});
```

---

## 🎓 Zaključak

Sa ovim alatima imate **potpunu kontrolu** i **100% sigurnost**:

1. ✅ **Vidite tačno šta se šalje** (Dry Run)
2. ✅ **Pratite sve pozive** (Logging)
3. ✅ **Automatski testirate** (Test Suite)

**Kada dobijete B2B pristup, bićete potpuno spremni!** 🚀
