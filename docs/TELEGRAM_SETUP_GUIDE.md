# 📱 TELEGRAM BOT SETUP - Uputstvo

## Korak 1: Kreiranje Telegram Bota

1. Otvorite Telegram aplikaciju
2. Potražite **@BotFather** (zvanični Telegram bot za kreiranje botova)
3. Pošaljite komandu: `/newbot`
4. Unesite ime bota (npr: "Olympic Hub AI Monitor")
5. Unesite username bota (mora da se završava sa `_bot`, npr: `olympichub_ai_bot`)
6. **SAČUVAJTE BOT TOKEN** koji dobijete (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Korak 2: Dobijanje Chat ID-a

### Opcija A: Lični Chat ID
1. Potražite **@userinfobot** na Telegramu
2. Pošaljite `/start`
3. Bot će vam vratiti vaš **Chat ID** (broj, npr: `123456789`)

### Opcija B: Grupni Chat ID (ako želite notifikacije u grupu)
1. Dodajte vašeg bota u grupu
2. Pošaljite bilo koju poruku u grupu
3. Idite na: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Pronađite `"chat":{"id":-1001234567890}` u odgovoru
5. To je vaš **Chat ID** (negativan broj za grupe)

## Korak 3: Testiranje

1. Pošaljite `/start` vašem botu
2. Bot bi trebalo da odgovori (ako je sve podešeno)

## Šta mi treba:

```
BOT_TOKEN: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
CHAT_ID: 123456789
```

Pošaljite mi ove podatke i ja ću ih integrisati u sistem!

---

## 📧 Email Setup (već imam):
- Email: nenad.tomic@olympic.rs ✅

## 🔔 Šta ćete dobijati:

### Telegram notifikacije:
- ⚠️ Kada potrošnja pređe 50% dnevnog limita
- 🚨 Kada potrošnja pređe 80% dnevnog limita
- 📊 Dnevni izveštaj (svaki dan u ponoć)
- 💰 Nedeljni izveštaj (svake nedelje)

### Email notifikacije:
- 📈 Mesečni izveštaj sa grafikonima
- 🚨 Kritična upozorenja (>90% potrošnje)
- 📊 CSV export podataka
