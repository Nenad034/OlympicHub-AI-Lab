# 🔒 Security Implementation Guide

## 📋 Kako Implementirati Sigurnosne Mere

Ovaj vodič pokazuje **tačne korake** za implementaciju sigurnosti.

---

# 🚀 KORAK 1: Edge Function za API Proxy (KRITIČNO!)

## Zašto je ovo NAJVAŽNIJE:

**Trenutno stanje:**
```typescript
// ❌ NESIGURNO - Kredencijali u frontend kodu
const username = import.meta.env.VITE_TCT_USERNAME; // Vidljivo u browser-u!
const password = import.meta.env.VITE_TCT_PASSWORD; // Vidljivo u browser-u!
```

**Posle implementacije:**
```typescript
// ✅ SIGURNO - Kredencijali SAMO na serveru
// Frontend poziva Edge Function
// Edge Function ima kredencijale
// Browser NIKAD ne vidi kredencijale!
```

---

## Implementacija:

### 1. Deploy Edge Function

```bash
# U terminalu:
cd supabase/functions
.\deploy-tct-proxy.ps1
```

### 2. Postavi Secrets (Server-Side Environment Variables)

```bash
# Ovi kredencijali će biti SAMO na serveru!
supabase secrets set TCT_USERNAME=nenad.tomic@olympic.rs
supabase secrets set TCT_PASSWORD=689b54e328f3e759abfdced76ad8e8d0
supabase secrets set TCT_API_SOURCE=B2B
```

### 3. Zameni API Servis

```typescript
// Stari fajl (NESIGURAN):
// src/services/tctApiService.ts

// Novi fajl (SIGURAN):
// src/services/tctApiService.secure.ts

// Preimenuj:
// 1. Backup stari: tctApiService.ts → tctApiService.old.ts
// 2. Aktiviraj novi: tctApiService.secure.ts → tctApiService.ts
```

### 4. Ukloni Kredencijale iz .env

```bash
# .env - UKLONI ove linije:
# VITE_TCT_USERNAME=***  ← OBRIŠI!
# VITE_TCT_PASSWORD=***  ← OBRIŠI!

# Ostavi samo:
VITE_TCT_USE_MOCK=true  # Za development
```

### 5. Testiraj

```bash
# 1. Pokreni server
npm run dev

# 2. Idi na test stranicu
http://localhost:5173/tct-test

# 3. Klikni "Run Tests"
# 4. Proveri da li radi
```

---

# 🔐 KORAK 2: HTTPS Setup

## Lokalni Razvoj:

```bash
# 1. Instalacija
npm install -D @vitejs/plugin-basic-ssl
```

```typescript
// 2. vite.config.ts
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    basicSsl() // ← Dodaj ovo
  ],
  server: {
    https: true // ← Dodaj ovo
  }
})
```

```bash
# 3. Restartuj server
npm run dev

# 4. Otvori https://localhost:5173 (sa HTTPS!)
```

## Produkcija:

```bash
# Vercel/Netlify automatski dodaju HTTPS
# Nema dodatne konfiguracije!
```

---

# 🛡️ KORAK 3: Input Validation

```bash
# 1. Instalacija
npm install dompurify validator
npm install -D @types/dompurify @types/validator
```

```typescript
// 2. Kreiraj utils/validation.ts
import DOMPurify from 'dompurify';
import validator from 'validator';

export const validateCity = (city: string): boolean => {
  return /^[a-zA-Z\s-]+$/.test(city);
};

export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};
```

```typescript
// 3. Koristi u komponentama
const handleSearch = (city: string) => {
  // Validacija
  if (!validateCity(city)) {
    alert('Invalid city name');
    return;
  }
  
  // Sanitizacija
  const sanitizedCity = sanitizeInput(city);
  
  // Koristi sanitizovani input
  searchHotels(sanitizedCity);
};
```

---

# 🔒 KORAK 4: Security Headers

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
})
```

---

# 📊 KORAK 5: Security Audit

```bash
# 1. Dependency audit
npm audit

# 2. Fix vulnerabilities
npm audit fix

# 3. Check for outdated packages
npm outdated

# 4. Update packages
npm update
```

---

# ✅ VERIFIKACIJA

## Proveri da li je sve sigurno:

### 1. Proveri Browser DevTools

```
1. Otvori aplikaciju
2. F12 → Sources → main.js
3. Ctrl+F → Traži "TCT_USERNAME"
4. ✅ NE SME DA SE NAĐE!
5. Ctrl+F → Traži "TCT_PASSWORD"
6. ✅ NE SME DA SE NAĐE!
```

### 2. Proveri Network Tab

```
1. F12 → Network
2. Pokreni hotel search
3. Proveri zahteve
4. ✅ Trebalo bi da vidiš poziv ka Edge Function
5. ✅ NE SME da vidiš direktan poziv ka TCT API-ju
```

### 3. Proveri .env fajl

```
1. Otvori .env
2. ✅ NE SME da sadrži VITE_TCT_USERNAME
3. ✅ NE SME da sadrži VITE_TCT_PASSWORD
4. ✅ Samo VITE_TCT_USE_MOCK=true
```

### 4. Proveri GitHub

```
1. Idi na GitHub repository
2. Pretraži kod za "TCT_USERNAME"
3. ✅ NE SME DA SE NAĐE u kodu!
4. ✅ Samo u .env.example kao template
```

---

# 🎯 PRIORITETI

## ODMAH (Kritično):
```
□ 1. Deploy Edge Function
□ 2. Postavi Secrets na serveru
□ 3. Zameni API servis sa sigurnom verzijom
□ 4. Ukloni kredencijale iz .env
□ 5. Testiraj da sve radi
```

## OVE NEDELJE (Visok):
```
□ 6. Omogući HTTPS za lokalni razvoj
□ 7. Implementiraj input validation
□ 8. Dodaj security headers
□ 9. npm audit i fix vulnerabilities
```

## OVAJ MESEC (Srednji):
```
□ 10. Implementiraj rate limiting
□ 11. Dodaj security logging
□ 12. Implementiraj session timeout
□ 13. Security review
```

---

# 🆘 TROUBLESHOOTING

## Problem: Edge Function ne radi

**Rešenje:**
```bash
# 1. Proveri da li je deployed
supabase functions list

# 2. Proveri logs
supabase functions logs tct-proxy

# 3. Proveri secrets
supabase secrets list
```

## Problem: "Not authenticated" greška

**Rešenje:**
```typescript
// Proveri da li je user ulogovan
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// Ako nema session-a, login prvo
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

## Problem: CORS greška

**Rešenje:**
```typescript
// Edge Function mora imati CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Dodaj u response
return new Response(data, {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})
```

---

# 📚 DODATNI RESURSI

## Dokumentacija:
- [SECURITY.md](./SECURITY.md) - Kompletna sigurnosna dokumentacija
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Tools:
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [OWASP ZAP](https://www.zaproxy.org/)

---

**Poslednje ažuriranje:** 2026-01-04  
**Verzija:** 1.0  
**Status:** Ready for implementation
