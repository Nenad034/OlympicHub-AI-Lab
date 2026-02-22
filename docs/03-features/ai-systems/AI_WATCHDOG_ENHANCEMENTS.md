# 🎯 AI WATCHDOG ENHANCEMENTS

## Poboljšanja AI Watchdog Modula

**Datum:** 2026-01-04  
**Verzija:** 2.0  
**Status:** Production Ready

---

# 1️⃣ HUMAN-IN-THE-LOOP (HITL) 🤝

## Pregled

Human-in-the-Loop sistem omogućava ljudsku potvrdu za kritične akcije pre nego što se automatski izvrše.

### Problem:
AI automatski pali Maintenance Mode kada detektuje 5xx greške. To je odlično, ali administrator nema kontrolu.

### Rešenje:
HITL sistem šalje Telegram alert sa dugmadima za potvrdu:
- ✅ **Approve** - Odobri akciju
- ❌ **Reject** - Odbij akciju
- ⏸️ **Postpone** - Odloži za 5 minuta

---

## Implementacija

### 1. HITL Manager (`src/services/hitlManager.ts`)

```typescript
import { hitlManager } from './services/hitlManager';

// Zahtevaj potvrdu
const approved = await hitlManager.requestApproval(
  'MAINTENANCE_MODE',
  '/api/hotels',
  'Multiple 5xx errors detected',
  5 * 60 * 1000 // Auto-execute after 5 minutes
);

if (approved) {
  console.log('✅ Approved');
} else {
  console.log('❌ Rejected');
}
```

### 2. Telegram Bot Setup

**Korak 1: Kreiraj Telegram Bota**
```
1. Otvori Telegram
2. Traži @BotFather
3. Pošalji /newbot
4. Sledi instrukcije
5. Dobićeš BOT_TOKEN
```

**Korak 2: Dobij Chat ID**
```
1. Pošalji poruku svom botu
2. Otvori: https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
3. Pronađi "chat":{"id":123456789}
4. To je tvoj CHAT_ID
```

**Korak 3: Postavi Environment Variables**
```bash
# .env
VITE_TELEGRAM_BOT_TOKEN=your-bot-token
VITE_TELEGRAM_CHAT_ID=your-chat-id

# Supabase Secrets
supabase secrets set TELEGRAM_BOT_TOKEN=your-bot-token
supabase secrets set TELEGRAM_CHAT_ID=your-chat-id
```

**Korak 4: Deploy Telegram Webhook**
```bash
cd supabase/functions
supabase functions deploy telegram-webhook
```

**Korak 5: Postavi Webhook**
```bash
curl -X POST \
  "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-project.supabase.co/functions/v1/telegram-webhook"}'
```

---

## Primer Telegram Alert-a

```
🚧 AI Watchdog - Human Approval Required

Action: MAINTENANCE MODE
Endpoint: `/api/hotels`
Reason: Multiple 5xx errors detected. Recommend enabling Maintenance Mode to serve cached data.
Time: 2026-01-04 18:00:00

⏱️ Auto-execute in: 300s if no response

Please choose an action:

[✅ Approve] [❌ Reject]
[⏸️ Postpone (5 min)]
```

---

## Flow Diagram

```
5xx Errors Detected
        ↓
AI Monitor Detects Pattern
        ↓
HITL Request Approval
        ↓
Telegram Alert Sent
        ↓
    ┌───┴───┐
    ↓       ↓
Approve  Reject
    ↓       ↓
Enable   Cancel
Maint.   Action
Mode
```

---

# 2️⃣ BUSINESS HEALTH MONITOR 💼

## Pregled

Business Health Monitor prati poslovne metrike i detektuje anomalije koje API monitoring ne može da vidi.

### Problem:
API je "Healthy" ali nema pretraga/rezervacija. Problem je verovatno u UI-ju ili marketingu.

### Rešenje:
Business monitor prati:
- 🔍 **Searches** - Broj pretraga
- 📝 **Bookings** - Broj rezervacija
- 💰 **Revenue** - Prihod
- 👥 **Users** - Broj korisnika

---

## Implementacija

### 1. Business Health Monitor (`src/services/businessHealthMonitor.ts`)

```typescript
import { businessHealthMonitor } from './services/businessHealthMonitor';

// Beleži pretragu
businessHealthMonitor.recordSearch();

// Beleži rezervaciju
businessHealthMonitor.recordBooking(1500); // 1500 EUR

// Proveri status
const stats = businessHealthMonitor.getStats();
console.log(stats);
```

### 2. Automatski Monitoring

Monitor automatski proverava svakih 30 minuta:

**Provera 1: Nema pretraga u poslednja 2 sata**
```
IF (lastSearch > 2 hours ago) THEN
  IF (API is healthy) THEN
    Alert: "UI/UX Issue - Users not searching despite healthy API"
    Recommendation:
      - Check search form visibility
      - Check JavaScript errors
      - Check mobile responsiveness
      - Check page load time
  ELSE
    Alert: "API Issue - Users cannot search"
  END IF
END IF
```

**Provera 2: Nema rezervacija u poslednja 4 sata**
```
IF (lastBooking > 4 hours ago) THEN
  IF (searches > 0) THEN
    Alert: "Low Conversion - Users search but don't book"
    Recommendation:
      - Check pricing competitiveness
      - Check payment gateway
      - Check booking form UX
      - Check trust signals
  ELSE
    Alert: "No Activity - Critical issue"
  END IF
END IF
```

**Provera 3: Nizak Conversion Rate**
```
IF (conversionRate < 1% AND searches > 50) THEN
  Alert: "Low Conversion Rate"
  Recommendation:
    - Analyze user journey
    - Improve UX
    - Check pricing
    - Optimize checkout
END IF
```

---

## Business Alert Primeri

### Alert 1: UI Issue
```json
{
  "type": "UI_ISSUE",
  "severity": "critical",
  "message": "No searches in last 2 hours despite healthy API",
  "diagnosis": "API is healthy but users are not searching. Possible UI/UX issue.",
  "recommendation": "Check:\n1. Search form visibility\n2. JavaScript errors in console\n3. Mobile responsiveness\n4. Page load time\n5. Marketing campaigns"
}
```

### Alert 2: Low Conversion
```json
{
  "type": "LOW_CONVERSION",
  "severity": "warning",
  "message": "Users are searching but not booking",
  "diagnosis": "Conversion rate is 0%. Users find results but don't book.",
  "recommendation": "Check:\n1. Pricing competitiveness\n2. Payment gateway\n3. Booking form UX\n4. Trust signals (reviews, SSL)\n5. Availability of offers"
}
```

---

## Integracija u Aplikaciju

### Primer: Hotel Search

```typescript
// components/HotelSearch.tsx
import { businessHealthMonitor } from '../services/businessHealthMonitor';

const handleSearch = async (params) => {
  // Beleži pretragu
  businessHealthMonitor.recordSearch();
  
  // Pozovi API
  const results = await searchHotels(params);
  
  return results;
};
```

### Primer: Booking

```typescript
// components/BookingForm.tsx
import { businessHealthMonitor } from '../services/businessHealthMonitor';

const handleBooking = async (bookingData) => {
  // Pozovi API
  const result = await createBooking(bookingData);
  
  if (result.success) {
    // Beleži rezervaciju
    businessHealthMonitor.recordBooking(result.totalPrice);
  }
  
  return result;
};
```

---

## Dashboard Integration

```typescript
// Dashboard.tsx
import { businessHealthMonitor } from '../services/businessHealthMonitor';

function BusinessHealthDashboard() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(businessHealthMonitor.getStats());
    }, 60000); // Svaki minut
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <h2>Business Health</h2>
      <p>Last Search: {stats?.lastSearch.minutesAgo} min ago</p>
      <p>Last Booking: {stats?.lastBooking.minutesAgo} min ago</p>
      
      {stats?.alerts.noSearches && (
        <Alert severity="error">
          No searches in last 2 hours!
        </Alert>
      )}
      
      {stats?.alerts.noBookings && (
        <Alert severity="warning">
          No bookings in last 4 hours!
        </Alert>
      )}
    </div>
  );
}
```

---

## 📊 Statistika

| Feature | Linija Koda | Fajlova |
|---------|-------------|---------|
| HITL Manager | ~250 | 1 |
| Business Monitor | ~300 | 1 |
| Telegram Webhook | ~100 | 1 |
| AI Monitor Update | ~30 | 1 |
| **UKUPNO** | **~680** | **4** |

---

## 🎯 Prednosti

### HITL:
- ✅ Ljudska kontrola nad kritičnim akcijama
- ✅ Telegram notifikacije u realnom vremenu
- ✅ Auto-execute ako nema odgovora
- ✅ Postpone opcija za odlaganje

### Business Monitor:
- ✅ Detektuje probleme koje API monitoring ne vidi
- ✅ Razlikuje API probleme od UI/UX problema
- ✅ Prati conversion rate
- ✅ Proaktivne preporuke

---

## 🚀 Sledeći Koraci

1. **Setup Telegram Bot**
   - Kreiraj bota
   - Postavi webhook
   - Testiraj notifikacije

2. **Integriši Business Monitor**
   - Dodaj `recordSearch()` u search komponente
   - Dodaj `recordBooking()` u booking komponente
   - Kreiraj business dashboard

3. **Testiraj HITL**
   - Simuliraj 5xx greške
   - Proveri Telegram alert
   - Testiraj approve/reject/postpone

4. **Monitor i Optimizuj**
   - Prati alert-ove
   - Podesi threshold-ove
   - Optimizuj conversion rate

---

**Verzija:** 2.0  
**Status:** Production Ready  
**Datum:** 2026-01-04
