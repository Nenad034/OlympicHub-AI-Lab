# AI Quota Tracker - Troubleshooting Guide

## 📊 Kako sistem radi

AI Quota Tracker automatski prati upotrebu AI tokena kroz sledeće komponente:

### 1. **aiUsageService** (`src/services/aiUsageService.ts`)
- Čuva podatke o upotrebi u `localStorage`
- Ključevi: `ai_quota_gemini`, `ai_quota_openai`, `ai_quota_claude`
- Struktura podataka:
  ```json
  {
    "dailyUsed": 0,
    "weeklyUsed": 0,
    "monthlyUsed": 0,
    "totalCalls": 0,
    "avgPerRequest": 0,
    "lastReset": "2026-02-07T14:27:00.000Z"
  }
  ```

### 2. **multiKeyAI** (`src/services/multiKeyAI.ts`)
- Upravlja AI API ključevima sa automatskim failover-om
- **Poziva `aiUsageService.recordUsage()` nakon svakog uspešnog AI poziva**
- Koristi rate limiting i caching za optimizaciju

### 3. **AIQuotaDashboard** (`src/modules/system/AIQuotaDashboard.tsx`)
- Prikazuje real-time statistiku upotrebe
- Osvežava podatke svake 3 sekunde
- Prikazuje: Daily, Weekly, Monthly usage, Average per request

## 🔍 Kako proveriti da li radi

### Metoda 1: Korišćenje AI Chat-a u aplikaciji

1. Pokrenite aplikaciju: `npm run dev`
2. Otvorite aplikaciju u browseru: `http://localhost:5173`
3. Otvorite AI Chat (ikona u donjem desnom uglu)
4. Pošaljite nekoliko poruka AI asistentu
5. Otvorite **Settings > AI Quota** tab
6. Trebalo bi da vidite ažurirane brojeve za Gemini

### Metoda 2: Provera Browser Console-a

1. Otvorite Developer Tools (F12)
2. Idite na Console tab
3. Pošaljite poruku AI chat-u
4. Trebalo bi da vidite logove:
   ```
   🤖 [AI CHAT] Initiating Gemini API call
   📊 [AI USAGE] GEMINI
     Tokens: 1234
     Daily Total: 1234
     Weekly Total: 1234
   ```

### Metoda 3: Provera localStorage-a

1. Otvorite Developer Tools (F12)
2. Idite na Application > Local Storage > http://localhost:5173
3. Potražite ključeve:
   - `ai_quota_gemini`
   - `ai_quota_openai`
   - `ai_quota_claude`
4. Kliknite na `ai_quota_gemini` da vidite vrednosti

## 🐛 Najčešći problemi

### Problem 1: Dashboard prikazuje sve nule (0)

**Uzrok**: Nema AI poziva ili AI pozivi ne koriste `multiKeyAI` servis

**Rešenje**:
1. Proverite da li AI Chat koristi `multiKeyAI.generateContent()`
2. Proverite da li imate validan Gemini API ključ u `.env` fajlu:
   ```
   VITE_GEMINI_API_KEY_PRIMARY=your_key_here
   ```
3. Pošaljite test poruku u AI Chat-u

### Problem 2: Podaci se ne ažuriraju u real-time

**Uzrok**: Dashboard se ne osvežava ili `localStorage` nije dostupan

**Rešenje**:
1. Osvežite stranicu (F5)
2. Proverite da li je interval za osvežavanje aktivan (svake 3 sekunde)
3. Proverite browser console za greške

### Problem 3: "No available API keys" greška

**Uzrok**: Nijedan API ključ nije konfigurisan

**Rešenje**:
1. Dodajte API ključ u `.env` fajl:
   ```
   VITE_GEMINI_API_KEY_PRIMARY=your_key_here
   ```
2. Ili dodajte ključ u Settings > General > Gemini API Key
3. Restartujte dev server

## 📝 Gde se poziva `multiKeyAI.generateContent()`

Trenutno se koristi u:
- `src/components/GeneralAIChat.tsx` - AI Chat komponenta
- `src/services/gemini.ts` - Gemini servis
- `src/services/ai/AiIntelligenceService.ts` - AI Intelligence servis
- `src/pages/HotelPrices.tsx` - Hotel cene analiza

## 🔧 Debugging Tips

### Omogućite detaljne logove

U `src/services/aiUsageService.ts`, logovi su već omogućeni:
```typescript
console.group(`📊 [AI USAGE] ${provider.toUpperCase()}`);
console.log(`Tokens: ${tokens}`);
console.log(`Daily Total: ${data.dailyUsed}`);
console.log(`Weekly Total: ${data.weeklyUsed}`);
console.groupEnd();
```

### Ručno testirajte tracking

Otvorite browser console i izvršite:
```javascript
// Importujte servis (ako je dostupan globalno)
const { aiUsageService } = await import('./src/services/aiUsageService');

// Zabeležite test upotrebu
aiUsageService.recordUsage('gemini', 1000);

// Proverite trenutnu upotrebu
console.log(aiUsageService.getUsage('gemini'));
```

### Resetujte podatke

Ako želite da resetujete sve podatke:
```javascript
localStorage.removeItem('ai_quota_gemini');
localStorage.removeItem('ai_quota_openai');
localStorage.removeItem('ai_quota_claude');
location.reload();
```

## ✅ Verifikacija da sistem radi

Kada sistem pravilno radi, trebalo bi da vidite:

1. **U Console-u** (pri svakom AI pozivu):
   ```
   🤖 [AI CHAT] Initiating Gemini API call
   🎯 [MULTI-KEY] Selected: Primary (Frontend)
   📊 [AI USAGE] GEMINI
     Tokens: 1234
     Daily Total: 1234
   ✅ [MULTI-KEY] Success with Primary (Frontend)
   ```

2. **U AI Quota Dashboard-u**:
   - Daily Usage bar se popunjava
   - Brojevi za Daily, Weekly, Monthly se ažuriraju
   - Average per request pokazuje prosečan broj tokena

3. **U localStorage-u**:
   - `ai_quota_gemini` sadrži validne podatke
   - `dailyUsed`, `weeklyUsed`, `monthlyUsed` su veći od 0

## 🚀 Sledeći koraci

Ako i dalje imate problema:
1. Proverite da li je `multiKeyAI` pravilno inicijalizovan
2. Proverite da li AI Chat koristi `multiKeyAI.generateContent()`
3. Proverite browser console za greške
4. Proverite da li je Gemini API ključ validan
