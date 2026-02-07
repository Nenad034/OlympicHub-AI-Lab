# 🚀 GOOGLE CLOUD PROJEKAT - Korak po korak uputstvo

## 📋 ŠTA ĆETE DOBITI:

```
PROJEKAT 1: Olympic Hub Production (Frontend AI)
├── API Key: [novi ključ]
├── Quota: 1,500 zahteva/dan
└── Koristi: AI Chat, Hotel Prices

PROJEKAT 2: Olympic Hub Backend (Backend AI)
├── API Key: AIzaSyCtjB0AodWDy_1GmNKHf3Y4EJ5yjBppMlM (trenutni)
├── Quota: 1,500 zahteva/dan
└── Koristi: AI Intelligence Service

UKUPNO: 3,000 zahteva/dan + Caching = 10,000+ efektivno
```

---

## 🔧 KORAK 1: Kreirajte novi Google Cloud Projekat

### 1.1 Otvorite Google Cloud Console
```
https://console.cloud.google.com/
```

### 1.2 Prijavite se
- Koristite isti Google nalog (nenad.tomic@olympic.rs ili koji već koristite)

### 1.3 Kreirajte novi projekat
1. **Kliknite** na dropdown meni pored "Google Cloud" (gore levo)
2. **Kliknite** "New Project" (ili "Novi projekat")
3. **Unesite ime projekta:**
   ```
   Olympic Hub Production
   ```
4. **Organization:** Ostavite prazno (ili izaberite ako imate)
5. **Location:** Ostavite "No organization"
6. **Kliknite** "CREATE" (ili "KREIRAJ")

⏱️ **Čekajte 30-60 sekundi** dok se projekat kreira

---

## 🔧 KORAK 2: Omogućite Gemini API

### 2.1 Proverite da li ste u novom projektu
- Gore levo treba da piše: **"Olympic Hub Production"**
- Ako ne, kliknite dropdown i izaberite ga

### 2.2 Idite na API Library
1. **Kliknite** na hamburger meni (☰) gore levo
2. **Idite na:** "APIs & Services" → "Library"
3. **Ili direktno:** https://console.cloud.google.com/apis/library

### 2.3 Pronađite Gemini API
1. **U search bar-u unesite:** `Generative Language API`
2. **Kliknite** na "Generative Language API" (Google AI)
3. **Kliknite** "ENABLE" (ili "OMOGUĆI")

⏱️ **Čekajte 10-20 sekundi**

---

## 🔧 KORAK 3: Kreirajte API Key

### 3.1 Idite na Credentials
1. **Kliknite** na hamburger meni (☰)
2. **Idite na:** "APIs & Services" → "Credentials"
3. **Ili direktno:** https://console.cloud.google.com/apis/credentials

### 3.2 Kreirajte novi API Key
1. **Kliknite** "CREATE CREDENTIALS" (gore)
2. **Izaberite:** "API Key"
3. **Popup će se pojaviti** sa vašim novim ključem

### 3.3 Kopirajte API Key
```
Format: AIzaSy... (39 karaktera)
```

**VAŽNO:** Sačuvajte ovaj ključ! Biće vam potreban za konfiguraciju.

### 3.4 (Opciono) Ograničite API Key
1. **Kliknite** "RESTRICT KEY"
2. **API restrictions:**
   - Izaberite "Restrict key"
   - Čekirajte samo "Generative Language API"
3. **Kliknite** "SAVE"

---

## 🔧 KORAK 4: Proverite Quota

### 4.1 Idite na Quotas
1. **Kliknite** hamburger meni (☰)
2. **Idite na:** "IAM & Admin" → "Quotas"
3. **Ili direktno:** https://console.cloud.google.com/iam-admin/quotas

### 4.2 Filtrirajte Gemini API
1. **U search bar-u:** `Generative Language API`
2. **Videćete:**
   ```
   Requests per minute per project: 15
   Requests per day per project: 1,500
   ```

✅ **Ovo potvrđuje da imate ODVOJEN quota od prvog projekta!**

---

## 🔧 KORAK 5: Ponovite za drugi projekat (opciono)

Ako želite 3 projekta (4,500 zahteva/dan):
1. Ponovite korake 1-4
2. Ime: "Olympic Hub Development"
3. Dobijete treći API Key

---

## 📝 KORAK 6: Sačuvajte API Keys

### Imate sada:

```
PROJEKAT 1: Olympic Hub Production
API Key: AIzaSy[NOVI_KLJUC_1]

PROJEKAT 2: Olympic Hub Backend
API Key: AIzaSyCtjB0AodWDy_1GmNKHf3Y4EJ5yjBppMlM (trenutni)
```

---

## 🚀 KORAK 7: Pošaljite mi novi API Key

**Kada dobijete novi API Key, pošaljite mi ga i ja ću:**

1. ✅ Ažurirati `.env` fajl
2. ✅ Implementirati Multi-Key Failover
3. ✅ Dodati Rate Limiter
4. ✅ Dodati Caching
5. ✅ Ažurirati Quota Dashboard
6. ✅ Testirati sve

---

## ❓ ČESTA PITANJA:

### Q: Da li moram da platim?
**A:** NE! Free tier je potpuno besplatan.

### Q: Hoće li mi naplatiti karticu?
**A:** NE! Gemini API Free tier ne zahteva kreditnu karticu.

### Q: Koliko projekata mogu da kreiram?
**A:** Do 5 projekata sa Gemini API na jednom Google nalogu.

### Q: Da li quota-i rade nezavisno?
**A:** DA! Svaki projekat ima svoj quota (1,500 zahteva/dan).

### Q: Šta ako pogrešim?
**A:** Možete obrisati projekat i kreirati novi.

---

## 🎯 SLEDEĆI KORACI:

1. ✅ Pratite ovo uputstvo
2. ✅ Kreirajte novi projekat
3. ✅ Dobijte novi API Key
4. ✅ Pošaljite mi ga
5. ✅ Ja implementiram sve (30-45 min)

---

## 📞 POMOĆ:

Ako negde zapnete:
- Pošaljite mi screenshot
- Opisujte gde ste stali
- Ja ću vam pomoći!

**Krenite sa Korakom 1!** 🚀
