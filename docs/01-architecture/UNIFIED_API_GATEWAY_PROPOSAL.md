# 🌐 Unified API Gateway - Proposal

## 📋 Overview

**Predlog:** Konsolidacija svih eksternih API konekcija pod jedinstveni API Gateway  
**Cilj:** Poboljšanje sigurnosti, performansi i upravljanja resursima  
**Status:** 📋 PROPOSAL / U RAZMATRANJU

---

## 🎯 Trenutno Stanje

### Aktuelne API Integracije
| API | Tip | Protokol | Status |
|-----|-----|----------|--------|
| Open Greece | XML/SOAP | HTTPS | ✅ Aktivno |
| TCT B2B | REST | HTTPS | ✅ Aktivno |
| Supabase | REST | HTTPS | ✅ Aktivno |
| Vercel | REST | HTTPS | ✅ Aktivno |
| (Budući) Stripe | REST | HTTPS | 📋 Planirano |
| (Budući) Twilio | REST | HTTPS | 📋 Planirano |

### Problemi sa Trenutnim Pristupom
1. **Raspršene Kredencijale** - Svaki servis ima sopstvene credentials
2. **Dupliciran Kod** - Sličan error handling i retry logika u svakom servisu
3. **Teško Praćenje** - Nema centralizovanog logovanja API poziva
4. **Security Rizici** - Više tačaka potencijalnog curenja podataka
5. **Rate Limiting** - Bez centralizovanog upravljanja limitima

---

## 🏗️ Predložena Arhitektura

### Unified API Gateway Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    OLYMPIC HUB FRONTEND                        │
├─────────────────────────────────────────────────────────────────┤
│                           │                                     │
│                    ┌──────▼──────┐                             │
│                    │   API PROXY  │                             │
│                    │   (Backend)  │                             │
│                    └──────┬──────┘                             │
│                           │                                     │
│              ┌────────────▼────────────┐                       │
│              │   UNIFIED API GATEWAY   │                       │
│              │  ┌───────────────────┐  │                       │
│              │  │ - Auth Manager    │  │                       │
│              │  │ - Rate Limiter    │  │                       │
│              │  │ - Request Queue   │  │                       │
│              │  │ - Response Cache  │  │                       │
│              │  │ - Error Handler   │  │                       │
│              │  │ - Logging/Audit   │  │                       │
│              │  │ - Health Monitor  │  │                       │
│              │  └───────────────────┘  │                       │
│              └────────────┬────────────┘                       │
│                           │                                     │
│     ┌─────────────────────┼─────────────────────┐              │
│     │                     │                     │              │
│ ┌───▼───┐            ┌───▼───┐            ┌───▼───┐           │
│ │OpenGR │            │  TCT  │            │Supabase│           │
│ │Adapter│            │Adapter│            │Adapter │           │
│ └───┬───┘            └───┬───┘            └───┬───┘           │
│     │                     │                     │              │
└─────┼─────────────────────┼─────────────────────┼──────────────┘
      │                     │                     │
┌─────▼─────┐         ┌────▼────┐          ┌─────▼─────┐
│Open Greece│         │TCT B2B  │          │ Supabase  │
│   API     │         │   API   │          │    API    │
└───────────┘         └─────────┘          └───────────┘
```

---

## 💡 Prednosti Unified API Gateway

### 1. **Centralizovana Sigurnost** 🔒
- Sve credentials na jednom mestu
- JWT token management
- API key rotation bez promene frontend koda
- Audit log svih API poziva

### 2. **Rate Limiting & Throttling** ⚡
- Globalni rate limits za svaki API
- Queue system za visok load
- Graceful degradation

### 3. **Caching** 📦
- Response caching za česte upite
- Smanjenje API poziva za 60-80%
- Smanjenje latencije

### 4. **Error Handling** 🛡️
- Centralizovani retry logic
- Circuit breaker pattern
- Failover strategije

### 5. **Monitoring & Logging** 📊
- Svi API pozivi na jednom dashboard-u
- Real-time health monitoring
- Cost tracking po API-u

### 6. **Ušteda Resursa** 💰
- Manje konekcija ka eksternim servisima
- Connection pooling
- Smanjeni bandwidth

---

## 🔧 Tehnička Implementacija

### Struktura Fajlova
```
src/
├── gateway/
│   ├── ApiGateway.ts          # Glavni gateway class
│   ├── adapters/
│   │   ├── OpenGreeceAdapter.ts
│   │   ├── TctAdapter.ts
│   │   ├── SupabaseAdapter.ts
│   │   └── BaseAdapter.ts
│   ├── middleware/
│   │   ├── RateLimiter.ts
│   │   ├── CacheManager.ts
│   │   ├── AuthManager.ts
│   │   └── Logger.ts
│   ├── utils/
│   │   ├── CircuitBreaker.ts
│   │   ├── RetryStrategy.ts
│   │   └── HealthCheck.ts
│   └── types/
│       └── gateway.types.ts
```

### Osnovni Interface
```typescript
interface ApiGateway {
  // Core methods
  request<T>(config: ApiRequest): Promise<ApiResponse<T>>;
  
  // Adapter registration
  registerAdapter(name: string, adapter: BaseAdapter): void;
  
  // Health & Status
  healthCheck(): Promise<HealthStatus>;
  getMetrics(): GatewayMetrics;
  
  // Configuration
  configure(options: GatewayOptions): void;
}

interface ApiRequest {
  adapter: string;        // 'opengreece' | 'tct' | 'supabase'
  method: string;         // API method name
  params: Record<string, unknown>;
  options?: {
    cache?: boolean;
    cacheTTL?: number;
    priority?: 'low' | 'normal' | 'high';
    timeout?: number;
  };
}
```

### Primer Korišćenja
```typescript
// Umesto direktnog poziva
const openGreeceService = new OpenGreeceApiService();
const hotels = await openGreeceService.startPush();

// Sa Unified Gateway
const gateway = ApiGateway.getInstance();
const hotels = await gateway.request({
  adapter: 'opengreece',
  method: 'startPush',
  params: { isFullPush: false },
  options: { cache: true, cacheTTL: 3600 }
});
```

---

## 📅 Implementacioni Plan

### Faza 1: Foundation (1 nedelja)
- [ ] Kreiranje ApiGateway klase
- [ ] BaseAdapter interface
- [ ] Podstawni rate limiter

### Faza 2: Adapteri (1 nedelja)
- [ ] OpenGreeceAdapter migracija
- [ ] TctAdapter migracija
- [ ] SupabaseAdapter (ako je potrebno)

### Faza 3: Middleware (1 nedelja)
- [ ] CacheManager implementacija
- [ ] AuthManager security
- [ ] Logger i audit trail

### Faza 4: Advanced (1 nedelja)
- [ ] Circuit breaker
- [ ] Health monitoring
- [ ] Dashboard za praćenje

---

## ⚠️ Rizici i Mitigacija

| Rizik | Verovatnoća | Uticaj | Mitigacija |
|-------|-------------|--------|------------|
| Single point of failure | Srednja | Visok | Fallback direktni pozivi |
| Kompleksnost | Srednja | Srednji | Fazna implementacija |
| Performance overhead | Niska | Srednji | Optimizovano caching |
| Migration issues | Srednja | Srednji | Postepena migracija |

---

## 🎯 Preporuka

**Predlog:** ✅ PREPORUČUJEM IMPLEMENTACIJU

**Razlozi:**
1. Značajno poboljšanje sigurnosti
2. Jednostavnije održavanje
3. Bolji monitoring i debugging
4. Priprema za skaliranje
5. Ušteda resursa dugoročno

**Prioritet:** SREDNJI - Nije blocker za produkciju, ali je strateški važno

**Sledeći Koraci:**
1. ✅ Odluka o implementaciji
2. 📋 Detaljan tehnički spec
3. 🚀 Implementacija Faze 1
4. 🧪 Testiranje
5. 🔄 Postepena migracija

---

## 📚 Reference

- [API Gateway Pattern - Microsoft](https://docs.microsoft.com/en-us/azure/architecture/microservices/design/gateway)
- [Kong API Gateway](https://konghq.com/)
- [Express Gateway](https://www.express-gateway.io/)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

---

**Kreirano:** 2026-01-05  
**Status:** PROPOSAL  
**Autor:** Antigravity AI  
