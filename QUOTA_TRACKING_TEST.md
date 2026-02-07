## 🧪 KAKO DA TESTIRATE QUOTA TRACKING

### Korak 1: Otvorite aplikaciju
1. Idite na http://localhost:5173 (ili vaš dev server)
2. Prijavite se ako je potrebno

### Korak 2: Otvorite AI Chat
**Opcija A:** Kliknite na plutajuće AI dugme (obično dolje levo)
**Opcija B:** Idite na "PARTNERI - DOBAVLJAČI" stranicu i kliknite "API Sentinel"

### Korak 3: Otvorite Developer Console
- Pritisnite **F12** na tastaturi
- Ili desni klik → "Inspect" → tab "Console"

### Korak 4: Pošaljite test poruku
U AI Chat-u napišite bilo šta, npr:
- "Zdravo"
- "Kako da dodam hotel?"
- "Test"

### Šta ćete videti:

#### U AI Chat header-u (gore):
```
Olympic Hub Intelligence • API Calls: 1
```
Ovaj broj će se povećavati sa svakom porukom!

#### U konzoli:
```
🤖 [AI CHAT] Initiating Gemini API call at: 2026-02-07T09:12:49.123Z
🤖 [AI CHAT] Persona: specialist | Context: Dashboard
🤖 [AI CHAT] Trying model: gemini-2.0-flash
✅ [AI CHAT] Success with model: gemini-2.0-flash
📊 [AI CHAT] Total API calls in this session: 1
```

### Korak 5: Pošaljite još poruka
- Svaka poruka će povećati brojač
- Ako prvi model ne uspe, videćete pokušaj sa drugim modelom
- Brojač će pokazati TAČAN broj API poziva

---

## 📊 Primer sa fallback-om:

Ako `gemini-2.0-flash` ne uspe:
```
🤖 [AI CHAT] Trying model: gemini-2.0-flash
❌ [AI CHAT] Failed with model gemini-2.0-flash: Rate limit exceeded
🤖 [AI CHAT] Trying model: gemini-1.5-flash
✅ [AI CHAT] Success with model: gemini-1.5-flash
📊 [AI CHAT] Total API calls in this session: 2
```

Brojač će pokazati **2** jer su napravljena **2 pokušaja**!

---

## 🎯 Zašto je ovo korisno?

- ✅ Vidite TAČNO koliko API poziva trošite
- ✅ Možete da pratite da li se fallback aktivira
- ✅ Lako otkrijete ako nešto troši previše kvota
- ✅ Transparentnost - znate šta se dešava u pozadini
