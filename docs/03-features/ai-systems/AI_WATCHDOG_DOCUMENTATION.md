# 🤖 AI WATCHDOG & RECOVERY MODULE

## 📋 Pregled

AI Watchdog je autonomni sistem za monitoring, self-healing i alerting koji prati zdravlje API-ja i automatski rešava probleme bez ljudske intervencije.

---

## ✨ Features

### 1. **Pulse Check** ⏱️
- Automatska provera zdravlja API-ja svakih 5 minuta
- Merenje latency-a (response time)
- Praćenje uptime-a i dostupnosti

### 2. **Latency Analyzer** 📊
- Detekcija visokog latency-a (>2000ms)
- Automatsko povećanje keširanja
- Alert za kritični latency (>5000ms)

### 3. **Self-Healing** 🔧
- **401 Unauthorized:** Automatsko osvežavanje tokena
- **5xx Server Errors:** Maintenance Mode za specifični modul
- **Retry Integration:** Svaki neuspešan retry se prijavljuje

### 4. **AI Diagnosis** 🧠
- Automatska dijagnoza grešaka
- Preporuke za rešavanje
- Kontekstualni alert-ovi

### 5. **Alert System** 🚨
- JSON izveštaji o kritičnim greškama
- Alert cooldown (5 minuta)
- Severity levels: info, warning, critical

---

## 🚀 Korišćenje

### Pokretanje AI Monitor-a:

```typescript
import { aiMonitor } from './services/aiMonitor';

// Pokreni monitoring
aiMonitor.start();

// Zaustavi monitoring
aiMonitor.stop();

// Proveri status
const status = aiMonitor.getStatus();
console.log(status);

// Proveri zdravlje
const health = aiMonitor.getHealthStats();
console.log(health);
```

### Ručno Prijavljivanje Grešaka:

```typescript
// Prijavi grešku
aiMonitor.handleError('/api/hotels', 500, new Error('Server error'));

// Proveri da li je endpoint u maintenance mode
if (aiMonitor.isInMaintenanceMode('/api/hotels')) {
  console.log('API is in maintenance mode');
}
```

---

## 📊 Konfiguracija

```typescript
const aiMonitor = new AIMonitor({
  pulseCheckInterval: 5 * 60 * 1000,    // 5 minuta
  latencyThreshold: 2000,                // 2 sekunde
  errorThreshold: 5,                     // 5 grešaka
  maintenanceModeTimeout: 15 * 60 * 1000, // 15 minuta
  alertCooldown: 5 * 60 * 1000           // 5 minuta
});
```

---

## 🔄 Self-Healing Logika

### 401 Unauthorized (3+ grešaka):
```
1. Detektuje seriju 401 grešaka
2. Automatski pokreće refresh token
3. Loguje pokušaj
4. Ako uspe: Reset error count
5. Ako ne uspe: Šalje critical alert
```

### 5xx Server Errors (5+ grešaka):
```
1. Detektuje seriju 5xx grešaka
2. Aktivira Maintenance Mode za taj endpoint
3. Obaveštava korisnika
4. Servira podatke iz cache-a
5. Automatski isključuje Maintenance Mode nakon 15 minuta
6. Reset error count
```

---

## 🚨 Alert System

### Alert Format:

```json
{
  "alert": {
    "id": "error-/api/hotels-1704385200000",
    "severity": "critical",
    "type": "HTTP_500",
    "message": "Multiple errors detected on /api/hotels: 500",
    "timestamp": "2026-01-04T18:00:00.000Z"
  },
  "details": {
    "apiEndpoint": "/api/hotels",
    "errorCode": 500,
    "lastSuccessfulLog": {
      "timestamp": "2026-01-04T17:30:00.000Z",
      "status": "success"
    }
  },
  "aiDiagnosis": {
    "diagnosis": "Internal server error - API server is experiencing issues",
    "recommendation": "Wait for API server to recover. If persists, contact API provider",
    "confidence": "high"
  },
  "systemStatus": {
    "healthHistory": [...],
    "maintenanceMode": [],
    "errorCounts": {},
    "memoryUsage": {
      "usedMB": "45.23",
      "totalMB": "128.00",
      "limitMB": "512.00",
      "usagePercent": "8.83"
    }
  },
  "actionRequired": true,
  "generatedBy": "AI Watchdog & Recovery Module",
  "version": "1.0.0"
}
```

---

## 🔧 Integracija sa Postojećim Sistemom

### 1. apiHelpers.ts Integration:

```typescript
// Svaki neuspešan retry se automatski prijavljuje AI Monitor-u
export const fetchWithRetry = async (url, options) => {
  try {
    // ... retry logika
  } catch (error) {
    // 🤖 AI Monitor Integration
    const { aiMonitor } = await import('../services/aiMonitor');
    aiMonitor.handleError(url, statusCode, error);
  }
};
```

### 2. performanceHelpers.ts Integration:

```typescript
// AI Monitor prati svoj memory usage
import { memoryMonitor } from '../utils/performanceHelpers';

// U alert report-u
systemStatus: {
  memoryUsage: memoryMonitor.getStats()
}
```

---

## ⏱️ Supabase Cron Job

### Setup:

1. **Deploy Edge Function:**
```bash
cd supabase/functions
supabase functions deploy ai-monitor-pulse
```

2. **Konfiguriši Cron Job:**

U Supabase Dashboard → Edge Functions → ai-monitor-pulse:

```
Schedule: */5 * * * *  (svakih 5 minuta)
```

Ili programski:

```sql
SELECT cron.schedule(
  'ai-monitor-pulse',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/ai-monitor-pulse',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

---

## 📈 Statistika i Reporting

### Health Stats:

```typescript
const health = aiMonitor.getHealthStats();

// Output:
{
  uptime: "95.00%",
  avgLatency: "1234ms",
  status: {
    healthy: 19,
    degraded: 1,
    down: 0
  },
  lastCheck: {
    status: "healthy",
    latency: 1123,
    timestamp: "2026-01-04T18:00:00.000Z"
  }
}
```

### Full Status:

```typescript
const status = aiMonitor.getStatus();

// Output:
{
  isRunning: true,
  healthStats: {...},
  maintenanceMode: [],
  errorCounts: {
    "/api/hotels-500": 3
  },
  config: {
    pulseCheckInterval: 300000,
    latencyThreshold: 2000,
    errorThreshold: 5,
    maintenanceModeTimeout: 900000,
    alertCooldown: 300000
  }
}
```

---

## 🎯 Primeri Korišćenja

### Primer 1: Monitoring u Production

```typescript
// main.tsx
import { aiMonitor } from './services/aiMonitor';

// Pokreni monitoring
aiMonitor.start();

// Loguj status svakih 30 minuta
setInterval(() => {
  const health = aiMonitor.getHealthStats();
  console.log('🤖 AI Monitor Health:', health);
}, 30 * 60 * 1000);
```

### Primer 2: Custom Alert Handler

```typescript
// Extend AIMonitor class
class CustomAIMonitor extends AIMonitor {
  protected sendAlert(alert: Alert) {
    super.sendAlert(alert);
    
    // Custom alert handling
    if (alert.severity === 'critical') {
      // Pošalji email
      sendEmail({
        to: 'admin@example.com',
        subject: `Critical Alert: ${alert.type}`,
        body: JSON.stringify(alert, null, 2)
      });
      
      // Pošalji Slack notifikaciju
      sendSlackMessage({
        channel: '#alerts',
        text: `🚨 ${alert.message}`
      });
    }
  }
}
```

### Primer 3: Dashboard Integration

```typescript
// Dashboard.tsx
import { aiMonitor } from './services/aiMonitor';

function Dashboard() {
  const [health, setHealth] = useState(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(aiMonitor.getHealthStats());
    }, 10000); // Svake 10 sekundi
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <h2>System Health</h2>
      <p>Uptime: {health?.uptime}</p>
      <p>Avg Latency: {health?.avgLatency}</p>
      <p>Status: {health?.lastCheck?.status}</p>
    </div>
  );
}
```

---

## 🔍 Troubleshooting

### Problem: AI Monitor ne pokreće pulse check

**Rešenje:**
```typescript
// Proveri da li je pokrenut
console.log(aiMonitor.getStatus().isRunning);

// Ručno pokreni
aiMonitor.start();
```

### Problem: Previše alert-ova

**Rešenje:**
```typescript
// Povećaj alert cooldown
const aiMonitor = new AIMonitor({
  alertCooldown: 15 * 60 * 1000 // 15 minuta
});
```

### Problem: Maintenance Mode se ne isključuje

**Rešenje:**
```typescript
// Ručno isključi
aiMonitor.disableMaintenanceMode('/api/hotels');

// Ili resetuj sve
aiMonitor.reset();
```

---

## 📝 Best Practices

1. **Pokreni u Production:** AI Monitor treba da radi 24/7
2. **Konfiguriši Cron Job:** Za Pulse Check svakih 5 minuta
3. **Prati Alert-ove:** Postavi email/Slack notifikacije
4. **Periodično Resetuj:** Reset-uj brojače jednom dnevno
5. **Monitor Memory:** Prati da AI Monitor ne troši previše resursa

---

## 🎊 Zaključak

AI Watchdog & Recovery Module je **autonomni operater** koji:

- ✅ Prati zdravlje sistema 24/7
- ✅ Automatski rešava lakše probleme
- ✅ Obaveštava samo kada je ljudska intervencija neophodna
- ✅ Pruža AI dijagnozu i preporuke
- ✅ Smanjuje downtime i poboljšava korisničko iskustvo

**Rezultat:** Manje stresa, više vremena za razvoj! 🚀

---

**Verzija:** 1.0.0  
**Datum:** 2026-01-04  
**Status:** Production Ready
