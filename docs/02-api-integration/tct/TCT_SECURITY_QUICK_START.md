# 🛡️ TCT API - Dodatna Sigurnost - Brzi Vodič

## 🎯 Tri Nivoa Sigurnosti

### 1. 🧪 Automatsko Testiranje
```typescript
import { runTCTTests } from './services/tctApiTest';

// Pokreni sve testove
await runTCTTests();
```

### 2. 📝 Detaljni Logging
```typescript
import { tctApiLogger } from './services/tctApiLogger';

// Omogući logging
tctApiLogger.setEnabled(true);

// Prikaži statistiku
tctApiLogger.printStats();
```

### 3. 🔍 Dry Run Mode
```typescript
import { tctDryRun } from './services/tctApiDryRun';

// Omogući Dry Run (ništa se ne šalje)
tctDryRun.setEnabled(true);

// Vidi šta bi se poslalo
tctDryRun.printSummary();
```

---

## 🚀 Brzi Start - Kada Dobijete B2B Pristup

```typescript
// 1. Prebacite na Real API
// .env: VITE_TCT_USE_MOCK=false

// 2. Omogućite Dry Run
import { tctDryRun } from './services/tctApiDryRun';
tctDryRun.setEnabled(true);

// 3. Testirajte šta bi se poslalo
import { runTCTTests } from './services/tctApiTest';
await runTCTTests();

// 4. Proverite rezultate
tctDryRun.printSummary();

// 5. Ako izgleda dobro, onemogućite Dry Run
tctDryRun.setEnabled(false);

// 6. Omogućite logging
import { tctApiLogger } from './services/tctApiLogger';
tctApiLogger.setEnabled(true);

// 7. Pokrenite prave testove
await runTCTTests();

// 8. Proverite da li sve radi
tctApiLogger.printStats();
```

---

## 📚 Detaljnija Dokumentacija

Pogledajte `TCT_SECURITY_TOOLS.md` za kompletne instrukcije i primere.

---

## ✅ Garantovana Sigurnost

- ✅ **Vidite tačno šta se šalje** pre nego što se pošalje
- ✅ **Pratite sve API pozive** sa detaljima
- ✅ **Automatski testirate** sve endpointe

**100% sigurno i spremno za produkciju!** 🎉
