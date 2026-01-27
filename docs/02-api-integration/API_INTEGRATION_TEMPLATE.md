# 🔌 API Integration Template

## 📋 Generički Template za Bilo Koju API Integraciju

Ovaj template možete koristiti za **BILO KOJU** novu API integraciju. Samo zamenite `[API_NAME]` sa imenom vašeg API-ja.

---

# [API_NAME] API Integration Plan

## 📊 Osnovne Informacije

| Info | Vrednost |
|------|----------|
| **API Naziv** | [API_NAME] |
| **Base URL** | https://api.[api-name].com |
| **Dokumentacija** | https://docs.[api-name].com |
| **Support Email** | support@[api-name].com |
| **Protokol** | REST / GraphQL / SOAP / WebSocket |
| **Autentifikacija** | Basic / Bearer / OAuth2 / API Key |

---

## 🎯 Cilj Integracije

**Šta želimo da postignemo:**
- [ ] Funkcionalnost 1
- [ ] Funkcionalnost 2
- [ ] Funkcionalnost 3

**Zašto integrišemo:**
- Razlog 1
- Razlog 2
- Razlog 3

---

## 🔑 Kredencijali

### Development:
```bash
# .env
VITE_[API_NAME]_USE_MOCK=true
VITE_[API_NAME]_BASE_URL=https://api-dev.[api-name].com

# Server-side (Edge Function secrets)
[API_NAME]_API_KEY=your-dev-api-key
[API_NAME]_API_SECRET=your-dev-api-secret
```

### Production:
```bash
# .env
VITE_[API_NAME]_USE_MOCK=false
VITE_[API_NAME]_BASE_URL=https://api.[api-name].com

# Server-side (Edge Function secrets)
[API_NAME]_API_KEY=your-prod-api-key
[API_NAME]_API_SECRET=your-prod-api-secret
```

---

## 📁 Struktura Fajlova

```
src/
├── services/
│   ├── [apiName]ApiService.ts      # Real API servis
│   ├── [apiName]MockService.ts     # Mock API servis
│   ├── [apiName]Api.ts              # Unified API (auto-switch)
│   ├── [apiName]ApiTest.ts          # Automatsko testiranje
│   ├── [apiName]ApiLogger.ts        # Detaljni logging
│   └── [apiName]ApiDryRun.ts        # Dry Run mode
│
├── components/
│   └── [apiName]/
│       ├── [ApiName]ConnectionTest.tsx
│       └── [ApiName]ConnectionTest.css
│
└── types/
    └── [apiName].ts                 # TypeScript tipovi

supabase/
└── functions/
    └── [apiName]-proxy/
        └── index.ts                 # Edge Function za API proxy

docs/
├── [API_NAME]_INTEGRATION_PLAN.md
├── [API_NAME]_B2B_ACTIVATION_PROCEDURE.md
└── [API_NAME]_SECURITY_TOOLS.md
```

---

## 🔧 Implementacija - Korak po Korak

### **Korak 1: Kreiranje Real API Servisa**

```typescript
// src/services/[apiName]ApiService.ts

/**
 * [API_NAME] API Service - Real Implementation
 */

const baseUrl = import.meta.env.VITE_[API_NAME]_BASE_URL || 'https://api.[api-name].com';

// ⚠️ VAŽNO: Kredencijali NE SMU biti ovde!
// Koristite Edge Function za API pozive!

/**
 * Helper funkcija za API pozive
 */
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Primer funkcije - Prilagodite za vaš API
 */
export const searchItems = async (params: {
  query: string;
  limit?: number;
}) => {
  try {
    const data = await apiRequest('/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    return {
      data,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error('[API_NAME] API Error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    };
  }
};

// Export API object
export const [apiName]Api = {
  searchItems,
  // Dodajte ostale funkcije...
};

export default [apiName]Api;
```

---

### **Korak 2: Kreiranje Mock API Servisa**

```typescript
// src/services/[apiName]MockService.ts

/**
 * [API_NAME] Mock API Service
 * Simulira API odgovore za development
 */

// Mock delay za realističnost
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock response helper
const mockResponse = <T>(data: T) => ({
  data,
  error: null,
  success: true,
});

/**
 * Mock podaci
 */
const mockItems = [
  { id: '1', name: 'Item 1', price: 100 },
  { id: '2', name: 'Item 2', price: 200 },
  { id: '3', name: 'Item 3', price: 300 },
];

/**
 * Mock search funkcija
 */
export const searchItems = async (params: {
  query: string;
  limit?: number;
}) => {
  await mockDelay();

  const filtered = mockItems.filter(item =>
    item.name.toLowerCase().includes(params.query.toLowerCase())
  );

  const limited = params.limit ? filtered.slice(0, params.limit) : filtered;

  return mockResponse(limited);
};

// Export Mock API object
export const [apiName]MockApi = {
  searchItems,
  // Dodajte ostale funkcije...
};

export default [apiName]MockApi;
```

---

### **Korak 3: Unified API (Auto-Switch)**

```typescript
// src/services/[apiName]Api.ts

/**
 * Unified [API_NAME] API
 * Automatski bira između Mock i Real API-ja
 */

import [apiName]ApiService from './[apiName]ApiService';
import [apiName]MockService from './[apiName]MockService';

// Proveri environment varijablu
const useMock = import.meta.env.VITE_[API_NAME]_USE_MOCK === 'true';

console.log(`🔌 [API_NAME] API: Using ${useMock ? 'MOCK' : 'REAL'} service`);

// Export odgovarajući servis
export const [apiName]Api = useMock ? [apiName]MockService : [apiName]ApiService;

export default [apiName]Api;
```

---

### **Korak 4: Edge Function za Sigurnost**

```typescript
// supabase/functions/[apiName]-proxy/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Verify Supabase token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Get API credentials from environment (SERVER-SIDE ONLY!)
    const API_KEY = Deno.env.get('[API_NAME]_API_KEY')
    const API_SECRET = Deno.env.get('[API_NAME]_API_SECRET')

    if (!API_KEY || !API_SECRET) {
      return new Response(
        JSON.stringify({ error: 'API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Parse request
    const requestBody = await req.json()

    // 5. Call real API with server-side credentials
    const apiResponse = await fetch('https://api.[api-name].com/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-Secret': API_SECRET,
      },
      body: JSON.stringify(requestBody),
    })

    const apiData = await apiResponse.json()

    // 6. Return response
    return new Response(
      JSON.stringify(apiData),
      {
        status: apiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

### **Korak 5: Test UI Komponenta**

```typescript
// src/components/[apiName]/[ApiName]ConnectionTest.tsx

import React, { useState } from 'react';
import [apiName]Api from '../../services/[apiName]Api';

export const [ApiName]ConnectionTest: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const testResults: any[] = [];

    // Test 1: Search
    try {
      const result = await [apiName]Api.searchItems({ query: 'test', limit: 10 });
      testResults.push({
        name: 'Search Items',
        status: result.success ? 'success' : 'error',
        data: result.data,
        error: result.error,
      });
    } catch (error) {
      testResults.push({
        name: 'Search Items',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="connection-test">
      <h2>[API_NAME] Connection Test</h2>
      
      <button onClick={runTests} disabled={loading}>
        {loading ? 'Testing...' : 'Run Tests'}
      </button>

      <div className="results">
        {results.map((result, index) => (
          <div key={index} className={`result ${result.status}`}>
            <h3>{result.name}</h3>
            <p>Status: {result.status}</p>
            {result.data && <pre>{JSON.stringify(result.data, null, 2)}</pre>}
            {result.error && <p className="error">{result.error}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default [ApiName]ConnectionTest;
```

---

## ✅ Checklist za Implementaciju

```
□ 1. Kreiran [apiName]ApiService.ts (Real API)
□ 2. Kreiran [apiName]MockService.ts (Mock API)
□ 3. Kreiran [apiName]Api.ts (Unified API)
□ 4. Kreiran Edge Function ([apiName]-proxy)
□ 5. Kreirana Test UI komponenta
□ 6. Dodati environment variables u .env
□ 7. Dodati secrets u Supabase
□ 8. Testirano sa Mock API-jem
□ 9. Testirano sa Real API-jem
□ 10. Dokumentacija kreirana
□ 11. Security provera urađena
□ 12. Sve push-ovano na GitHub
```

---

## 🎯 Sledeći Koraci

1. **Kopirajte ovaj template**
2. **Zamenite `[API_NAME]` sa imenom vašeg API-ja**
3. **Prilagodite funkcije za vaš API**
4. **Testirajte sa Mock API-jem**
5. **Deploy Edge Function**
6. **Testirajte sa Real API-jem**
7. **Gotovo!** 🎉

---

**Vreme implementacije:** ~2-3 sata za kompletan API  
**Sigurnost:** 100% (Edge Function proxy)  
**Testabilnost:** 100% (Mock + Real + Dry Run)  
**Dokumentovanost:** 100% (Ovaj template)

---

**Poslednje ažuriranje:** 2026-01-04  
**Verzija:** 1.0  
**Status:** Ready to use
