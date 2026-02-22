# 📊 OLYMPIC HUB - GEMINI AI USAGE ANALIZA

## 🎯 GDE SE KORISTI GEMINI AI U APLIKACIJI:

### **1. General AI Chat (Glavni AI Asistent)** 🤖
**Fajl:** `src/components/GeneralAIChat.tsx`

**Šta radi:**
- Odgovara na pitanja korisnika
- Pomaže sa navigacijom
- Daje savete o korišćenju aplikacije
- Ima 3 persone: Specialist, General, Group

**Potrošnja:**
- **Po poruci:** ~150-300 tokena
- **Dnevno (procena):** 50 poruka × 250 tokena = **12,500 tokena**
- **Mesečno:** ~375,000 tokena

**Prioritet:** ⭐⭐⭐ VISOK (glavna AI funkcija)

---

### **2. AI Intelligence Service** 🧠
**Fajl:** `src/services/ai/AiIntelligenceService.ts`

**Šta radi:**
- Analizira podatke o hotelima
- Generiše preporuke
- Procesira kompleksne upite
- Inteligentna pretraga

**Potrošnja:**
- **Po analizi:** ~500-1000 tokena
- **Dnevno (procena):** 20 analiza × 750 tokena = **15,000 tokena**
- **Mesečno:** ~450,000 tokena

**Prioritet:** ⭐⭐⭐ VISOK (core business logic)

---

### **3. Hotel Prices AI** 💰
**Fajl:** `src/pages/HotelPrices.tsx`

**Šta radi:**
- Analizira cene hotela
- Generiše price insights
- Predlaže optimalne cene

**Potrošnja:**
- **Po analizi:** ~200-400 tokena
- **Dnevno (procena):** 10 analiza × 300 tokena = **3,000 tokena**
- **Mesečno:** ~90,000 tokena

**Prioritet:** ⭐⭐ SREDNJI (korisno, ali ne kritično)

---

## 📈 UKUPNA PROCENJENA POTROŠNJA:

### **Dnevno:**
```
General AI Chat:        12,500 tokena
AI Intelligence:        15,000 tokena
Hotel Prices:            3,000 tokena
──────────────────────────────────────
UKUPNO:                 30,500 tokena/dan
```

### **Mesečno:**
```
30,500 tokena/dan × 30 dana = 915,000 tokena/mesec
```

### **Gemini Free Tier Limit:**
```
Dnevni limit:   1,000,000 tokena ✅
Mesečni limit:  Nema (samo dnevni)
```

**ZAKLJUČAK:** Trenutna potrošnja je **~3% dnevnog limita** - ODLIČNO! ✅

---

## 🎯 PREPORUKE ZA OPTIMIZACIJU:

### **Scenario 1: Zadržite 1 API ključ (TRENUTNO)**
```
✅ Prednosti:
   - Jednostavno
   - Dovoljno quota-a (97% neiskorišćeno)
   - Lako praćenje

⚠️ Rizici:
   - Ako dodajete nove AI funkcije, može preći limit
   - Teško je videti koja funkcija troši najviše
```

### **Scenario 2: Podelite na 2 ključa (PREPORUČUJEM)**
```
API Key 1 - User-Facing AI (70% quota):
   ✅ General AI Chat
   ✅ Hotel Prices AI
   
API Key 2 - Backend AI (30% quota):
   ✅ AI Intelligence Service
   ✅ Automatske analize
   ✅ Background processing

✅ Prednosti:
   - User experience nije ugrožen ako backend troši puno
   - Lakše praćenje
   - Možete ograničiti backend da ne prekorači limit
```

### **Scenario 3: Podelite na 3 ključa (ZA BUDUĆNOST)**
```
API Key 1 - Production Chat:
   ✅ General AI Chat (korisnici)
   
API Key 2 - Production Backend:
   ✅ AI Intelligence Service
   ✅ Hotel Prices AI
   
API Key 3 - Development/Testing:
   ✅ Svi testovi
   ✅ Development environment

✅ Prednosti:
   - Potpuna izolacija
   - Development ne troši production quota
   - Maksimalna kontrola
```

---

## 💡 MOJA PREPORUKA ZA VAS:

### **SADA (Kratkoročno):**
✅ **Zadržite 1 API ključ**
- Potrošnja je samo 3% limita
- Nema potrebe za komplikacijom
- Sve radi odlično

### **KASNIJE (Kada potrošnja poraste):**
⚠️ **Pređite na 2 ključa** kada:
- Dnevna potrošnja pređe 500,000 tokena (50% limita)
- Dodajete nove AI funkcije
- Imate više korisnika

### **BUDUĆNOST (Scaling):**
🚀 **Pređite na 3 ključa** kada:
- Imate 100+ aktivnih korisnika dnevno
- Potrošnja je blizu limita
- Potrebna vam je paid tier

---

## 🔧 KAKO DA IMPLEMENTIRATE PODELU:

Ako želite da pređete na 2 ključa SADA, mogu da:

1. **Kreiram environment varijable:**
```env
VITE_GEMINI_API_KEY_CHAT=AIzaSyA64Xf-by7F8U7awbBZVJyZcbmQcwdtvcE
VITE_GEMINI_API_KEY_BACKEND=AIzaSyCtjB0AodWDy_1GmNKHf3Y4EJ5yjBppMlM
```

2. **Ažuriram komponente** da koriste odgovarajući ključ

3. **Dodam tracking** za svaki ključ posebno u Quota Dashboard

**Želite li da to uradim?** 🤔
