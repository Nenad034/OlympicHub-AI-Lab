# Google Maps Integration - Setup Guide

## 📍 Google Address Autocomplete

Polje za adresu u Reservation Architect formi koristi Google Places Autocomplete API za automatsko dovršavanje adresa.

### Kako Dobiti API Ključ:

1. **Idite na Google Cloud Console**:
   - Otvorite: https://console.cloud.google.com/

2. **Kreirajte Novi Projekat** (ili koristite postojeći):
   - Kliknite na dropdown projekta u gornjem levom uglu
   - Kliknite "New Project"
   - Unesite naziv (npr. "Olympic Hub")
   - Kliknite "Create"

3. **Omogućite API-je**:
   - Idite na: https://console.cloud.google.com/apis/library
   - Pretražite i omogućite sledeće API-je:
     - **Maps JavaScript API**
     - **Places API**

4. **Kreirajte API Ključ**:
   - Idite na: https://console.cloud.google.com/apis/credentials
   - Kliknite "Create Credentials" → "API key"
   - Kopirajte generirani ključ

5. **Ograničite API Ključ** (preporučeno za produkciju):
   - Kliknite na kreirani ključ
   - U "Application restrictions" izaberite "HTTP referrers"
   - Dodajte vaš domen (npr. `olympichub.com/*`)
   - U "API restrictions" izaberite "Restrict key"
   - Označite samo "Maps JavaScript API" i "Places API"
   - Sačuvajte

### Konfiguracija u Aplikaciji:

1. **Kopirajte `.env.example` u `.env`**:
   ```bash
   copy .env.example .env
   ```

2. **Dodajte API Ključ u `.env`**:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=vaš_api_ključ_ovde
   ```

3. **Restartujte Development Server**:
   ```bash
   npm run dev
   ```

### Kako Radi:

- Kada korisnik počne da kuca adresu, Google Places API prikazuje predloge
- Podržane su zemlje: Srbija, Crna Gora, Hrvatska, Bosna i Hercegovina, Slovenija
- Automatski se izvlače komponente adrese (ulica, grad, poštanski broj, država)
- Ako API nije konfigurisan ili ne radi, prikazuje se obično input polje

### Cena:

- Google nudi **$200 mesečno besplatnog kredita**
- Places Autocomplete košta **$2.83 po 1000 zahteva** (nakon besplatnog kredita)
- Za male agencije, besplatni kredit je obično dovoljan

### Troubleshooting:

**Problem**: "Greška pri učitavanju Google Maps"
- **Rešenje**: Proverite da li je API ključ ispravan u `.env` fajlu
- **Rešenje**: Proverite da li su Maps JavaScript API i Places API omogućeni

**Problem**: "This API project is not authorized to use this API"
- **Rešenje**: Omogućite Places API u Google Cloud Console

**Problem**: "RefererNotAllowedMapError"
- **Rešenje**: Dodajte `localhost` u HTTP referrers u API ključu (za development)

### Napomena:

Za development, možete koristiti neograničen API ključ, ali za produkciju **obavezno** ograničite ključ na vaš domen.
