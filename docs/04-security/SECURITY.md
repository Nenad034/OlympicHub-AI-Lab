# 🔒 OlympicHub - Sigurnosna Dokumentacija

## 📋 Pregled

Ovaj dokument pokriva **SVE** sigurnosne aspekte OlympicHub aplikacije i kako ih implementirati.

---

# 🚨 TRENUTNO STANJE SIGURNOSTI

## ✅ ŠTA JE DOBRO:

### 1. Environment Variables
- ✅ `.env` fajl je u `.gitignore`
- ✅ Kredencijali nisu na GitHub-u
- ✅ `.env.example` sadrži samo template

### 2. Authentication Sistem
- ✅ Postoji auth sistem (`authStore.ts`)
- ✅ Protected routes implementirani
- ✅ Login/Logout funkcionalnost

### 3. Supabase Integration
- ✅ Supabase ima ugrađenu sigurnost
- ✅ Row Level Security (RLS) policies
- ✅ JWT tokeni za autentifikaciju

---

## 🚨 KRITIČNI PROBLEMI:

### 1. 🔴 API Kredencijali u Frontend Kodu

**Problem:**
```typescript
// tctApiService.ts
const username = import.meta.env.VITE_TCT_USERNAME; // ⚠️ VIDLJIVO U BROWSER-U!
const password = import.meta.env.VITE_TCT_PASSWORD; // ⚠️ VIDLJIVO U BROWSER-U!
```

**Zašto je opasno:**
- `VITE_` prefix znači da se kompajluje u frontend bundle
- Bilo ko može otvoriti DevTools → Sources → main.js
- Kredencijali su **plain text** u JavaScript fajlu!

**Rešenje:**
```typescript
// ❌ LOŠE - Frontend direktno poziva API
fetch('https://api.tct.travel', {
  headers: {
    'Authorization': `Basic ${btoa(username:password)}` // Vidljivo!
  }
});

// ✅ DOBRO - Frontend poziva backend proxy
fetch('/api/tct/search', {
  headers: {
    'Authorization': `Bearer ${userToken}` // User token, ne API kredencijali
  }
});

// Backend (Edge Function) poziva pravi API
// Kredencijali su na serveru, ne u browser-u!
```

---

### 2. 🔴 Nema HTTPS

**Problem:**
- Lokalni server: `http://localhost:5173` ❌
- Produkcija: Mora biti HTTPS ✅

**Zašto je opasno:**
- Man-in-the-Middle napadi
- Kredencijali se šalju nezaštićeno
- Session hijacking

**Rešenje:**
```bash
# Lokalni razvoj sa HTTPS
npm install -D @vitejs/plugin-basic-ssl

# vite.config.ts
import basicSsl from '@vitejs/plugin-basic-ssl'

export default {
  plugins: [basicSsl()],
  server: {
    https: true
  }
}

# Produkcija - Automatski HTTPS na Vercel/Netlify
```

---

### 3. 🔴 localStorage za Authentication

**Problem:**
```typescript
// authStore.ts
localStorage.setItem('userLevel', userLevel); // ⚠️ RANJIVO NA XSS!
```

**Zašto je opasno:**
- XSS napad može ukrasti token
- JavaScript može pristupiti localStorage
- Nema zaštite

**Rešenje:**
```typescript
// ✅ DOBRO - httpOnly cookies (server-side)
// Cookie se ne može čitati iz JavaScript-a
// Automatski se šalje sa svakim zahtevom
// Zaštićeno od XSS napada

// Ili koristiti Supabase auth (već implementirano)
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
// Supabase automatski koristi httpOnly cookies!
```

---

## 🟡 SREDNJI PROBLEMI:

### 4. 🟡 Nema Input Validation

**Problem:**
```typescript
// Nema validacije
const searchHotels = async (city: string) => {
  // Direktno koristi user input ⚠️
  fetch(`/api/hotels?city=${city}`);
};
```

**Zašto je opasno:**
- XSS napadi: `<script>alert('hacked')</script>`
- SQL Injection (ako ima backend)
- Path traversal

**Rešenje:**
```typescript
// ✅ DOBRO - Validacija i sanitizacija
import DOMPurify from 'dompurify';
import validator from 'validator';

const searchHotels = async (city: string) => {
  // 1. Validacija
  if (!validator.isAlphanumeric(city.replace(/\s/g, ''))) {
    throw new Error('Invalid city name');
  }
  
  // 2. Sanitizacija
  const sanitizedCity = DOMPurify.sanitize(city);
  
  // 3. Encoding
  const encodedCity = encodeURIComponent(sanitizedCity);
  
  // 4. Koristi sanitizovani input
  fetch(`/api/hotels?city=${encodedCity}`);
};
```

---

### 5. 🟡 Nema Rate Limiting

**Problem:**
- Nema ograničenja broja zahteva
- Ranjivo na DDoS napade
- API abuse

**Rešenje:**
```typescript
// Rate Limiter za API pozive
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minut
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Ukloni stare zahteve
    const recentRequests = requests.filter(
      time => now - time < this.windowMs
    );
    
    if (recentRequests.length >= this.maxRequests) {
      return false; // Rate limit exceeded
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }
}

// Korišćenje
const limiter = new RateLimiter(100, 60000); // 100 zahteva po minuti

const makeRequest = async (endpoint: string) => {
  const userId = getCurrentUserId();
  
  if (!limiter.isAllowed(userId)) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  return fetch(endpoint);
};
```

---

## 🟢 NISKI PROBLEMI:

### 6. 🟢 Nema Security Logging

**Problem:**
- Nema logovanja sigurnosnih događaja
- Teško je detektovati napade

**Rešenje:**
```typescript
// Security Logger
class SecurityLogger {
  private logs: SecurityEvent[] = [];
  
  logEvent(event: SecurityEvent) {
    this.logs.push({
      ...event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ip: 'client-ip' // Dobija se sa servera
    });
    
    // Pošalji na server za analizu
    this.sendToServer(event);
  }
  
  logFailedLogin(username: string) {
    this.logEvent({
      type: 'FAILED_LOGIN',
      severity: 'WARNING',
      details: { username }
    });
  }
  
  logSuspiciousActivity(details: any) {
    this.logEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'CRITICAL',
      details
    });
  }
  
  private async sendToServer(event: SecurityEvent) {
    await fetch('/api/security/log', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }
}
```

---

# 🛡️ IMPLEMENTACIJA SIGURNOSNIH MERA

## 1. Backend Proxy za API Pozive (KRITIČNO!)

### **Kreiranje Edge Function:**

```typescript
// supabase/functions/tct-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  // 1. Proveri user autentifikaciju
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // 2. Validuj Supabase JWT token
  const token = authHeader.replace('Bearer ', '');
  const { data: user, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return new Response('Invalid token', { status: 401 });
  }
  
  // 3. Kredencijali su SAMO na serveru (environment variables)
  const TCT_USERNAME = Deno.env.get('TCT_USERNAME')!;
  const TCT_PASSWORD = Deno.env.get('TCT_PASSWORD')!;
  
  // 4. Pozovi pravi TCT API
  const tctResponse = await fetch('https://imc-dev.tct.travel/v1/hotel/searchSync', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${TCT_USERNAME}:${TCT_PASSWORD}`)}`,
      'API-SOURCE': 'B2B',
      'Content-Type': 'application/json'
    },
    body: await req.text()
  });
  
  // 5. Vrati rezultat klijentu
  const data = await tctResponse.json();
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### **Frontend poziva proxy:**

```typescript
// tctApiService.ts (SIGURNA verzija)
const searchHotels = async (params: SearchParams) => {
  // Dobavi Supabase user token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }
  
  // Pozovi Edge Function (ne direktno TCT API!)
  const response = await fetch('/api/tct-proxy/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`, // User token
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
  
  return response.json();
};
```

**Prednosti:**
- ✅ Kredencijali su **SAMO na serveru**
- ✅ Frontend **NIKAD** ne vidi TCT kredencijale
- ✅ User mora biti autentifikovan
- ✅ Može se dodati rate limiting
- ✅ Može se dodati logging

---

## 2. HTTPS Setup

### **Lokalni Razvoj:**

```bash
# Instalacija
npm install -D @vitejs/plugin-basic-ssl
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    react(),
    basicSsl() // HTTPS za lokalni razvoj
  ],
  server: {
    https: true,
    port: 5173
  }
});
```

### **Produkcija:**

```bash
# Vercel/Netlify automatski dodaju HTTPS
# Nema dodatne konfiguracije!
```

---

## 3. Input Validation & Sanitization

```bash
# Instalacija
npm install dompurify validator
npm install -D @types/dompurify @types/validator
```

```typescript
// utils/validation.ts
import DOMPurify from 'dompurify';
import validator from 'validator';

export const validateEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

export const validateCity = (city: string): boolean => {
  // Samo slova, razmaci i crtice
  return /^[a-zA-Z\s-]+$/.test(city);
};

export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

export const sanitizeInput = (input: string): string => {
  // Ukloni HTML tagove
  let sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  
  // Escape special characters
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
};

// Korišćenje
const searchHotels = async (city: string) => {
  if (!validateCity(city)) {
    throw new Error('Invalid city name');
  }
  
  const sanitizedCity = sanitizeInput(city);
  // Koristi sanitizedCity
};
```

---

## 4. Content Security Policy (CSP)

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://imc-dev.tct.travel https://*.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

---

## 5. Security Headers

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
  }
});
```

---

## 6. Secure Authentication

```typescript
// authStore.ts (SIGURNA verzija)
import { create } from 'zustand';
import { supabase } from './supabaseClient';

interface AuthState {
  user: User | null;
  userLevel: number;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userLevel: 0,
  
  login: async (email: string, password: string) => {
    // Validacija
    if (!validator.isEmail(email)) {
      throw new Error('Invalid email');
    }
    
    // Supabase login (koristi httpOnly cookies!)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      // Log failed login
      securityLogger.logFailedLogin(email);
      throw error;
    }
    
    // Dobavi user level iz database-a
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_level')
      .eq('id', data.user.id)
      .single();
    
    set({
      user: data.user,
      userLevel: profile?.user_level || 0
    });
    
    // Log successful login
    securityLogger.logEvent({
      type: 'LOGIN_SUCCESS',
      severity: 'INFO',
      details: { userId: data.user.id }
    });
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, userLevel: 0 });
  },
  
  checkAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_level')
        .eq('id', session.user.id)
        .single();
      
      set({
        user: session.user,
        userLevel: profile?.user_level || 0
      });
    }
  }
}));
```

---

# ✅ SIGURNOSNI CHECKLIST

## Pre Produkcije:

```
□ 1. API kredencijali su SAMO na serveru (Edge Functions)
□ 2. HTTPS je omogućen (SSL sertifikat)
□ 3. Input validation implementirana
□ 4. Sanitizacija HTML-a implementirana
□ 5. CSP headers postavljeni
□ 6. Security headers postavljeni
□ 7. Rate limiting implementiran
□ 8. Security logging implementiran
□ 9. Supabase RLS policies konfigurisane
□ 10. .env fajl je u .gitignore
□ 11. Nema hardcoded kredencijala u kodu
□ 12. Authentication koristi httpOnly cookies
□ 13. Session timeout implementiran
□ 14. CORS pravilno konfigurisan
□ 15. Error messages ne otkrivaju osetljive podatke
□ 16. Dependency security audit (npm audit)
□ 17. Penetration testing urađen
□ 18. Security review urađen
```

---

# 🎯 PRIORITETI

## KRITIČNO (Odmah):
1. ✅ Implementiraj Edge Functions za API pozive
2. ✅ Omogući HTTPS
3. ✅ Prebaci auth na Supabase (httpOnly cookies)

## VISOK (Ove nedelje):
4. ✅ Implementiraj input validation
5. ✅ Dodaj CSP headers
6. ✅ Implementiraj rate limiting

## SREDNJI (Ovaj mesec):
7. ✅ Dodaj security logging
8. ✅ Implementiraj session timeout
9. ✅ Security audit

## NISKI (Kada ima vremena):
10. ✅ Penetration testing
11. ✅ Security training za tim
12. ✅ Incident response plan

---

# 📚 DODATNI RESURSI

## Security Best Practices:
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Web Security Academy: https://portswigger.net/web-security
- MDN Security: https://developer.mozilla.org/en-US/docs/Web/Security

## Tools:
- npm audit - Dependency security
- Snyk - Vulnerability scanning
- OWASP ZAP - Penetration testing
- Burp Suite - Security testing

---

**Poslednje ažuriranje:** 2026-01-04  
**Verzija:** 1.0  
**Status:** Kritično - Zahteva implementaciju!
