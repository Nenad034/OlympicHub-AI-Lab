# Travelport+ (Galileo) — API Integraciona Dokumentacija
## ClickToTravel Hub

> **Datum:** 2026-03-01  
> **Platforma:** Travelport+ (uključuje Galileo 1G i Apollo 1V)  
> **Status:** Planirana integracija (Research Phase)  
> **Docs:** https://developer.travelport.com

---

## 1. Pregled Platforme

Travelport Galileo je sada deo unificirane **Travelport+** platforme. Integracija je moguća kroz dva glavna kanala, u zavisnosti od starosti sistema koji se integriše i tehničkih zahteva:

1.  **JSON Air APIs (Preporučeno):** Moderni RESTful API za avio pretragu i booking.
2.  **Universal API (Legacy/uAPI):** Tradicionalni SOAP/XML interfejs koji pokriva širi spektar funkcionalnosti (Hotels, Cars, Rail, Air).

---

## 2. Autentifikacija (OAuth 2.0)

> ⚠️ **KRITIČNO (Migracija 2026):** Od 30. januara 2026. godine, stari endpoint-i za autentifikaciju su ugašeni. Obavezno je korišćenje isključivo OAuth 2.0 protokola.

### Proces dobijanja tokena:
1.  Kreiranje naloga na [Travelport Developer Portalu](https://developer.travelport.com).
2.  Kreiranje aplikacije pod "My Apps" sekcijom.
3.  Dobijanje `Client ID` i `Client Secret`.
4.  Generisanje Bearer tokena pozivom na OAuth endpoint.

```bash
# Primer autentifikacije (Conceptual)
POST https://api.travelport.com/identity/v1/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(client_id:client_secret)}

grant_type=client_credentials
```

---

## 3. Tehnološki Smerovi

### 3.1 JSON Air APIs (v11)
Moderni pristup koji koristi JSON format, što rezultira manjim payload-ima i bržim odzivom.
- **Namena:** Retail pretraga, ponude, kreiranje porudžbina (Offers/Orders).
- **Vodič:** [JSON APIs Getting Started](https://developer.travelport.com).
- **Workflows:** Podržava kompletan ciklus od pretrage (`Search`) do izdavanja karte (`Ticketing`).

### 3.2 Universal API (SOAP/XML)
Sveobuhvatni API koji omogućava pristup baznim Galileo (1G) i Apollo (1V) sistemima.
- **Namena:** PNR menadžment, hotelski XML, rent-a-car i rail servisi.
- **Resurs:** [Universal API Help Center](https://developer.travelport.com).
- **Developer Notes:** Sadrži specifične instrukcije za Galileo sisteme, upravljanje putničkim podacima i redizajn PNR-a.

---

## 4. Ključni Resursi

| Resurs | Link / Opis |
| :--- | :--- |
| **Developer Hub** | [developer.travelport.com](https://developer.travelport.com) |
| **JSON Air APIs v11** | Dokumentacija za moderni RESTful pristup |
| **uAPI Tutorial** | [GitHub uAPI Tutorial](https://github.com/travelport/uapi-python) (WSDL primeri) |
| **Demo Sistem** | [Universal API Demo Platforma](https://developer.travelport.com) |
| **Format Guide** | [Galileo Formats Guide](https://developer.travelport.com) (Terminalske komande) |

---

## 5. Implementacioni Detalji (Faza 1: Pretraga Letova)

Planirani radni tok za JSON v11 integraciju:

1.  **Air Search:** `POST /air/search` — Pretraga dostupnosti na osnovu datuma i rute.
2.  **Offer Price:** `POST /air/price` — Potvrda cene za izabranu ponudu.
3.  **Order Create:** `POST /air/orders` — Kreiranje PNR-a i rezervacija mesta.
4.  **Fulfillment:** `POST /air/ticketing` — Finalno izdavanje elektronske karte.

---

## 6. Napomene za Razvojni Tim

-   **GWS Notes:** Proučiti "Galileo Web Services Notes" za specifičnosti kucanja karata i upravljanja PNR-om.
-   **Endpoint Migration:** Pratiti status endpoint-a na portalu kako bi se osiguralo korišćenje najnovijih verzija.
-   **Terminal Compatibility:** Iako je REST API moderan, mnoga polja direktno mapiraju na tradicionalne Galileo terminalske formate (npr. SSR poruke, OSI podaci).

---

## 7. Planirani Fajlovi u Projektu

Prateći standardnu arhitekturu ClickToTravel Hub-a, integracija će zahtevati:
- `src/integrations/travelport/types/travelportTypes.ts` — TypeScript definicije.
- `src/integrations/travelport/api/travelportApiService.ts` — API servis klasa.
- `src/pages/TravelportTest.tsx` — Test modula sa vizuelnom verifikacijom.
