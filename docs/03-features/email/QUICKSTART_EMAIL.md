# 🚀 Quick Start - Olympic Hub Email System

## Za Korisnike (5 minuta)

### 1. Otvorite Olympic Mail
```
http://localhost:5173/mail
```

### 2. Podesite Email Nalog

1. Kliknite **⚙️ Settings** dugme
2. Izaberite **Gmail** (ili drugi provajder)
3. Unesite podatke:
   - **Email**: `vas-email@gmail.com`
   - **SMTP Password**: [Gmail App Password](https://myaccount.google.com/apppasswords)
   - **IMAP Password**: Isti App Password

### 3. Testirajte i Sačuvajte

1. Kliknite **"Testiraj konekciju"**
2. Ako je ✅ zeleno, kliknite **"Sačuvaj"**

### 4. Šaljite Email-ove! 📧

1. Kliknite **"Nova poruka"**
2. Unesite primaoca i tekst
3. Kliknite **"Pošalji"**

---

## Za Developere (15 minuta)

### Preduslov

```bash
# Instalirajte Supabase CLI
npm install -g supabase

# Login
supabase login
```

### Deploy Edge Functions

#### Windows:
```powershell
cd supabase/functions
.\deploy-functions.ps1
```

#### Linux/Mac:
```bash
cd supabase/functions
chmod +x deploy-functions.sh
./deploy-functions.sh
```

### Verifikacija

```bash
# Pratite logove
supabase functions logs send-email --follow

# Test lokalno
supabase functions serve send-email
```

---

## 🎯 Šta Dalje?

- 📖 **Detaljna dokumentacija**: `EMAIL_SETUP.md`
- 🔧 **Edge Functions guide**: `supabase/functions/README.md`
- 🐛 **Problemi?**: Pogledajte Troubleshooting sekciju u EMAIL_SETUP.md

---

## ⚡ Brze Komande

```bash
# Deploy sve funkcije
supabase functions deploy send-email
supabase functions deploy fetch-emails
supabase functions deploy test-email-connection

# Pratite logove
supabase functions logs send-email --follow

# Test lokalno
supabase functions serve

# Migrirajte bazu
supabase db push
```

---

## 📧 Gmail App Password

1. [Google Account Security](https://myaccount.google.com/security)
2. Omogućite **2-Step Verification**
3. [Kreirajte App Password](https://myaccount.google.com/apppasswords)
4. Kopirajte 16-cifreni kod

---

**Gotovo!** 🎉 Sada možete slati i primati email-ove direktno iz Olympic Hub-a!
