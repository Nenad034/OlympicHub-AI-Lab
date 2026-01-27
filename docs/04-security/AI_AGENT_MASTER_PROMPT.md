# 🤖 AI AGENT MASTER PROMPT

**Version:** 1.0  
**Last Updated:** 2026-01-16  
**Purpose:** Kombinovani prompt za AI agente koji rade na Olympic Hub projektu

---

## 📋 Core Instructions

Kada radiš na Olympic Hub projektu, **OBAVEZNO** prati sledeća pravila:

### 1. **Pre nego što počneš bilo koji zadatak:**
- Pročitaj `docs/04-security/SECURITY_CHECKLIST.md`
- Pročitaj `TODO_LIST.md` za kontekst prioriteta
- Proveri `docs/ARCHITECTURE.md` za strukturu projekta

### 2. **Tokom razvoja:**
- **NIKADA** ne commit-uj `.env` fajl
- **NIKADA** ne hardcode-uj credentials u kodu
- **UVEK** koristi TypeScript tipove
- **UVEK** implementiraj error handling
- **UVEK** dodaj input validation

### 3. **Pre nego što prijaviš zadatak kao završen:**

Uradi **Self-Reflection** korak:

```
SELF-REFLECTION CHECKLIST:
□ Da li moj kod krši ijednu stavku iz SECURITY_CHECKLIST.md?
□ Da li sam ostavio console.log sa sensitive data?
□ Da li sam proverio RLS policies ako radim sa bazom?
□ Da li sam implementirao rate limiting ako je API endpoint?
□ Da li sam dodao Telegram webhook secret validation?
□ Da li sam koristio fiksne verzije dependencies (ne ^1.0.0)?
□ Da li postoji logika koja zaobilazi validaciju (npr. NODE_ENV bypass)?
□ Da li sam testirao infinite loop scenarije u async funkcijama?
```

**Ako je odgovor "NE" na bilo koje pitanje, ISPRAVI pre nego što mi pošalješ kod.**

---

## 🔒 Security-First Development

### **Kritične "Sive Zone" koje AI često propušta:**

#### 1. **Database Role Permissions**
```sql
-- ❌ LOŠE (AI često generiše ovako)
GRANT ALL ON table_name TO anon;

-- ✅ DOBRO (Minimalne privilegije)
GRANT SELECT ON table_name TO anon;
GRANT INSERT, UPDATE ON table_name TO authenticated;
```

#### 2. **Telegram Webhook Validation**
```typescript
// ❌ LOŠE (Nema validacije)
export async function POST(req: Request) {
  const body = await req.json();
  // Procesuj odmah...
}

// ✅ DOBRO (Validacija secret tokena)
export async function POST(req: Request) {
  const secretToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  const body = await req.json();
  // Sada je sigurno...
}
```

#### 3. **Logic Hallucination Check**
```typescript
// ❌ LOŠE (AI često ostavlja development bypass)
if (user.isAdmin || process.env.NODE_ENV === 'development') {
  // Skip validation
}

// ✅ DOBRO (Nema bypass-a u produkciji)
if (user.isAdmin) {
  // Admin logic
}
```

#### 4. **Dependency Pinning**
```json
// ❌ LOŠE (package.json)
{
  "dependencies": {
    "react": "^18.0.0"  // Može povući malicioznu verziju
  }
}

// ✅ DOBRO
{
  "dependencies": {
    "react": "18.2.0"  // Fiksna verzija
  }
}
```

#### 5. **Token Usage Alerting**
```typescript
// ✅ Implementiraj u Edge Functions
const TOKEN_COST_THRESHOLD = 10; // $10/sat
const currentCost = calculateTokenCost(usage);

if (currentCost > TOKEN_COST_THRESHOLD) {
  await sendAlert('Token usage exceeded threshold!');
  throw new Error('Service temporarily disabled - cost limit reached');
}
```

---

## 📊 Prioriteti (Uvek konsultuj TODO_LIST.md)

1. 🔴 **CRITICAL:** Security, Deployment, Core API functionality
2. 🟠 **HIGH:** UX improvements, Error handling, Monitoring
3. 🟡 **MEDIUM:** New features, Optimizations
4. 🟢 **LOW:** Nice-to-have, Refactoring, Testing

---

## 🎯 Kada radiš na specifičnim modulima:

### **Supabase Edge Functions:**
- Proveri da su svi secrets postavljeni
- Implementiraj rate limiting per user
- Dodaj error logging
- Test CORS headers

### **Telegram Integration:**
- **OBAVEZNO:** Webhook secret validation
- Rate limiting per `user_id`
- Sanitizuj sve user input-e
- Log sve interakcije (bez sensitive data)

### **Frontend Components:**
- Input validation na svim formama
- Error boundaries
- Loading states
- Accessibility (a11y)

### **API Calls:**
- Timeout handling
- Retry logic sa exponential backoff
- Error messages bez system details
- Response sanitization

---

## 🚨 Emergency Response

Ako otkriješ **security vulnerability** u postojećem kodu:

1. **ODMAH** mi prijavi
2. **NE COMMIT-UJ** fix bez konsultacije
3. Dokumentuj u `docs/04-security/INCIDENTS.md`
4. Predloži fix sa testom

---

## 📝 Documentation Requirements

Kada dodaješ novu funkcionalnost:

- [ ] Ažuriraj `docs/API.md` ako je API endpoint
- [ ] Ažuriraj `docs/COMPONENTS.md` ako je komponenta
- [ ] Ažuriraj `docs/ARCHITECTURE.md` ako menja strukturu
- [ ] Dodaj TypeScript tipove u `src/types/`
- [ ] Dodaj komentare za kompleksnu logiku

---

## ✅ Final Checklist (Pre svakog commit-a)

```bash
# 1. TypeScript check
npx tsc --noEmit

# 2. Linting
npm run lint

# 3. Security audit
npm audit

# 4. Self-reflection
# Proveri SECURITY_CHECKLIST.md
```

---

## 🎓 Learning from Mistakes

Ako napraviš grešku:

1. Dokumentuj u `docs/LESSONS_LEARNED.md`
2. Objasni šta je pošlo po zlu
3. Predloži kako to sprečiti ubuduće
4. Ažuriraj ovaj prompt ako je potrebno

---

**Remember:** Bolje je da pitaš nego da pretpostaviš. Ako nisi siguran, konsultuj dokumentaciju ili me pitaj.

**Security > Speed > Features**

---

**Last Updated:** 2026-01-16  
**Version:** 1.0  
**Next Review:** Nakon svakog security incidenta ili major release-a
