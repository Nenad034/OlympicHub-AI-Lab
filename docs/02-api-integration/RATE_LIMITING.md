# Rate Limiting Implementation

## Overview
Implementiran je centralizovani **Rate Limiter** sistem koji štiti aplikaciju od "bursting-a" i osigurava usklađenost sa uslovima API provajdera.

## Trenutni Limiti

| API Provider | Limit | Window | Razlog |
|--------------|-------|--------|--------|
| **Solvex** | 10 req/min | 60s | Konzervativan limit dok ne dobijemo zvaničnu specifikaciju |
| **OpenGreece** | 20 req/min | 60s | Standardni limit za B2B integracije |
| **TCT** | 30 req/min | 60s | Viši limit za veći volumen |
| **Gemini API** | 60 req/min | 60s | Free tier limit |

## Kako Funkcioniše

### 1. Sliding Window Algoritam
- Prati sve zahteve u poslednjih 60 sekundi
- Automatski briše zastarele zapise
- Računa trenutni broj zahteva u prozoru

### 2. Pre-Request Check
```typescript
const limitCheck = rateLimiter.checkLimit('solvex');
if (!limitCheck.allowed) {
    return {
        success: false,
        error: `Rate limit exceeded. Retry after ${limitCheck.retryAfter}s`
    };
}
```

### 3. Automatsko Resetovanje
- Limiti se automatski resetuju nakon isteka prozora
- Nema potrebe za manuelnom intervencijom

## Monitoring

### Admin Panel
- Real-time prikaz trenutnog korišćenja
- Vizuelni progress bar sa bojama:
  - 🟢 **Zelena** (0-69%): Normalno
  - 🟠 **Narandžasta** (70-89%): Upozorenje
  - 🔴 **Crvena** (90-100%): Kritično
- Manuelni "Reset" dugmad za testiranje

### Lokacija
- **Solvex Test stranica**: `/solvex-test` (na dnu)
- **Dashboard** (opciono): Može se dodati

## Podešavanje Limita

### Promena Limita
Editujte `src/utils/rateLimiter.ts`:

```typescript
rateLimiter.registerLimit({
    identifier: 'solvex',
    maxRequests: 20,        // Povećaj na 20
    windowMs: 60 * 1000     // Ostavi 1 minut
});
```

### Dodavanje Novog API-ja
```typescript
rateLimiter.registerLimit({
    identifier: 'new-api',
    maxRequests: 15,
    windowMs: 60 * 1000
});
```

Zatim u servisu:
```typescript
import { rateLimiter } from '../../utils/rateLimiter';

const check = rateLimiter.checkLimit('new-api');
if (!check.allowed) {
    return { success: false, error: 'Rate limit exceeded' };
}
```

## Compliance sa Ugovorima

### Član 39-41: Bursting Prevention
✅ **Implementirano:**
- Tehnički limiti su jasno definisani u kodu
- Automatska zaštita od prekoračenja
- Logging svih blokiranih zahteva
- Transparentno prikazivanje trenutnog statusa

### Preporuke za Ugovor
Tražite od API provajdera da specificiraju:
1. **Maksimalan broj zahteva** (npr. 100/min)
2. **Vremenski prozor** (npr. 60 sekundi)
3. **Posledice prekoračenja** (throttling vs. ban)
4. **Grace period** (koliko prekoračenja je dozvoljeno pre sankcija)

## Testiranje

### Manuelni Test
1. Idi na `/solvex-test`
2. Klikni "Test Search" 11 puta brzo
3. 11. zahtev će biti blokiran sa porukom "Rate limit exceeded"
4. Sačekaj 60 sekundi ili klikni "Reset Limit"

### Programski Test
```typescript
import { rateLimiter } from './utils/rateLimiter';

// Simuliraj 15 zahteva
for (let i = 0; i < 15; i++) {
    const check = rateLimiter.checkLimit('solvex');
    console.log(`Request ${i+1}: ${check.allowed ? 'OK' : 'BLOCKED'}`);
}
```

## Logging

Svi blokirani zahtevi se loguju u konzolu:
```
[RateLimiter] solvex rate limit exceeded: 11/10 in 60000ms. Retry after 45s
[Solvex Search] Rate limit exceeded. Retry after 45s
```

## Buduća Poboljšanja

1. **Perzistencija**: Čuvanje stanja u localStorage/Redis
2. **User-based limiting**: Različiti limiti po korisniku
3. **Adaptive limiting**: Automatsko prilagođavanje na osnovu server odgovora
4. **Metrics**: Integracija sa analytics sistemom

## Kontakt za Izmene

Za povećanje limita ili dodavanje novih API-ja, kontaktirajte:
- **Dev Team**: Izmena `src/utils/rateLimiter.ts`
- **API Provajder**: Zahtev za zvaničnu specifikaciju limita
