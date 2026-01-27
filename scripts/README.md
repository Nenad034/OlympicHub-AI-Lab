# 🛠️ Scripts

Automatizovane skripte za razvoj i deployment.

---

## 📋 Dostupne Skripte

### 1. `create-api-integration.ps1`

Automatski kreira kompletnu strukturu za novu API integraciju.

**Korišćenje:**
```powershell
.\scripts\create-api-integration.ps1 -ApiName "Amadeus" -BaseUrl "https://api.amadeus.com" -Protocol "REST" -AuthType "OAuth2"
```

**Parametri:**
- `-ApiName` (obavezno) - Naziv API-ja (npr. "Amadeus", "Sabre", "Booking")
- `-BaseUrl` (opciono) - Base URL API-ja
- `-Protocol` (opciono) - REST | GraphQL | SOAP | WebSocket (default: REST)
- `-AuthType` (opciono) - Basic | Bearer | OAuth2 | APIKey (default: Bearer)

**Šta kreira:**
- ✅ Real API Service (`[apiName]ApiService.ts`)
- ✅ Mock API Service (`[apiName]MockService.ts`)
- ✅ Unified API (`[apiName]Api.ts`)
- ✅ TypeScript Types (`[apiName].ts`)
- ✅ Edge Function (`[apiName]-proxy/index.ts`)
- ✅ Test UI Component (`[ApiName]ConnectionTest.tsx`)
- ✅ CSS Styles (`[ApiName]ConnectionTest.css`)
- ✅ Documentation (`[API_NAME]_INTEGRATION.md`)
- ✅ Environment variables u `.env.example`

**Primer:**
```powershell
# Kreiranje Amadeus API integracije
.\scripts\create-api-integration.ps1 -ApiName "Amadeus" -BaseUrl "https://api.amadeus.com" -Protocol "REST" -AuthType "OAuth2"

# Kreiranje Sabre API integracije
.\scripts\create-api-integration.ps1 -ApiName "Sabre" -BaseUrl "https://api.sabre.com" -Protocol "SOAP" -AuthType "Basic"

# Kreiranje Booking.com API integracije
.\scripts\create-api-integration.ps1 -ApiName "Booking" -BaseUrl "https://api.booking.com" -Protocol "REST" -AuthType "APIKey"
```

**Vreme izvršavanja:** ~5 sekundi

---

## 🚀 Kako Koristiti

### Windows (PowerShell):
```powershell
cd d:\OlympicHub
.\scripts\create-api-integration.ps1 -ApiName "YourAPI"
```

### Linux/Mac (Bash):
```bash
cd /path/to/OlympicHub
pwsh ./scripts/create-api-integration.ps1 -ApiName "YourAPI"
```

---

## 📝 Posle Kreiranja

Nakon što skripta kreira strukturu, sledite ove korake:

1. **Ažurirajte `.env`:**
   ```bash
   VITE_YOURAPI_USE_MOCK=true
   ```

2. **Implementirajte API funkcije:**
   - `src/services/yourApiApiService.ts`

3. **Dodajte mock podatke:**
   - `src/services/yourApiMockService.ts`

4. **Deploy Edge Function:**
   ```bash
   cd supabase/functions
   supabase functions deploy yourapi-proxy
   ```

5. **Postavite secrets:**
   ```bash
   supabase secrets set YOURAPI_API_KEY=your-key
   supabase secrets set YOURAPI_API_SECRET=your-secret
   ```

6. **Dodajte route:**
   - U `src/router/index.tsx` dodajte `/yourapi-test` route

7. **Testirajte:**
   - Idite na `http://localhost:5173/yourapi-test`

---

## 🎯 Prednosti

- ⚡ **Brzo** - Kreira sve za ~5 sekundi
- ✅ **Kompletno** - Sve potrebne fajlove
- 🔒 **Sigurno** - Edge Function pattern
- 📝 **Dokumentovano** - Auto-generisana dokumentacija
- 🎨 **Konzistentno** - Isti pattern za sve API-je

---

## 📚 Dodatni Resursi

- [API Integration Template](../docs/API_INTEGRATION_TEMPLATE.md)
- [API Integration Checklist](../docs/API_INTEGRATION_CHECKLIST.md)
- [API Integration Patterns](../docs/API_INTEGRATION_PATTERNS.md)

---

**Poslednje ažuriranje:** 2026-01-04  
**Verzija:** 1.0
