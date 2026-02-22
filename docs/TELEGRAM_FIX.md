# 🔧 TELEGRAM BOT - BRZI FIX

## Problem: "chat not found"

Ovo znači da bot još nije primio prvu poruku od vas.

## ✅ REŠENJE (2 minuta):

### Korak 1: Pokrenite vašeg bota
1. Otvorite Telegram aplikaciju
2. Potražite vašeg bota: **@olympichub_ai_bot** (ili kako ste ga nazvali)
3. Kliknite **"START"** ili pošaljite `/start`

### Korak 2: Dobijte Chat ID
1. Otvorite u browseru:
   ```
   https://api.telegram.org/bot8416635544:AAGbG_vJWALi0tG0IkEnEsKhydgX_2OQ9pA/getUpdates
   ```

2. Videćete JSON odgovor, potražite:
   ```json
   {
     "message": {
       "chat": {
         "id": 123456789,  ← OVO JE VAŠ CHAT ID
         "first_name": "Nenad",
         "username": "..."
       }
     }
   }
   ```

3. Kopirajte taj broj (bez navodnika)

### Korak 3: Unesite u aplikaciju
1. Idite na `http://localhost:5173/settings`
2. Kliknite "AI Quota Tracker"
3. Kliknite "Notifications"
4. Unesite:
   - Bot Token: `8416635544:AAGbG_vJWALi0tG0IkEnEsKhydgX_2OQ9pA`
   - Chat ID: `<broj koji ste dobili>`
5. Čekirajte "Telegram Notifications"
6. Kliknite "Save Settings"

---

## 🚀 ALTERNATIVA - Automatski dobiti Chat ID:

Ako ne želite ručno, mogu da napravim skriptu koja će automatski detektovati vaš Chat ID nakon što pošaljete `/start` botu.

**Pošaljite `/start` vašem botu i javite mi!**
