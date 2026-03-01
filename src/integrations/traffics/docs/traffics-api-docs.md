# Traffics IBE — Feeds API v3 — Integraciona Dokumentacija
## ClickToTravel Hub

> **Datum:** 2026-03-01  
> **Status:** Mock Ready / Sandbox Implementation  
> **Verzija API:** Feeds v3  
> **Kategorija:** Hotelski agregate / IBE platforma

---

## 1. Pregled

**Traffics** je kompanija koja razvija **Evolution IBE 3.0** — Internet Booking Engine platformu za turoperatere i online agencije. IBE je Single-Page Application (SPA) koja se konfiguriše po agenciji i integriše sa Traffics feed-ovima.

### Ključne komponente:
1. **Feeds REST API v3** — programski pristup hotelima, cenama, top listama
2. **IBE Deep Links** — generisanje direktnih URL-ova u IBE za specifične pretrage

---

## 2. Autentifikacija

**Metod:** Query parametar `?licence=<16-cifrani-broj>`

```
GET https://ibe.traffics.de/api/v3/rest/feeds/hotels?licence=1234567890123456&...
```

- Licence broj je 16-cifren identifikator agencije/partnera
- Nema OAuth tokena, nema API ključa u headeru — sve putem query stringa
- Format odgovora: `application/json` ili `application/xml`

---

## 3. Base URL

```
https://ibe.traffics.de/api/v3/rest/feeds
```

---

## 4. Endpoints

### 4.1 GET `/hotels` — Pretraga hotela

Pretražuje hotele po zadatim kriterijumima.

**Obavezni parametri:**
| Parametar | Tip | Opis |
|-----------|-----|------|
| `licence` | string | 16-cifreni broj licence |
| `productType` | string | `pauschal` ili `hotelonly` |
| `searchDate` | string | CSV: fromDate,toDate,duration **ili** `fromDate` (dani od danas) |
| `adults` | string | Broj odraslih (1-8), default: 2 |

**Opcioni parametri:**
| Parametar | Tip | Opis |
|-----------|-----|------|
| `children` | string | CSV uzrasti dece: `3,7,12` |
| `regionId` | string | Traffics region ID |
| `giataId` | string | GIATA hotel ID |
| `category` | integer | Min broj zvezdica |
| `minPrice` / `maxPrice` | number | Raspon cena |
| `currency` | string | Default: EUR |
| `sortBy` | string | `price`, `category`, `quality` |
| `page` | integer | Stranica (od 0) |
| `pageSize` | integer | Veličina stranice, default: 10 |
| `language` | string | Default: `de` |

**Primer zahteva:**
```http
GET https://ibe.traffics.de/api/v3/rest/feeds/hotels
    ?licence=1234567890123456
    &productType=hotelonly
    &fromDate=10
    &duration=7
    &adults=2
    &category=4
    &sortBy=price
    &pageSize=20
    &language=en
    &currency=EUR
```

**Odgovor:**
```json
{
  "totalResultCount": 145,
  "page": 0,
  "pageSize": 10,
  "hotelList": [
    {
      "code": "TRF-HTL-001",
      "name": "Maritim Hotel Düsseldorf",
      "category": 4,
      "location": { "city": "Düsseldorf", "country": "Germany", "countryCode": "DE" },
      "region": { "id": "133", "name": "Mallorca" },
      "bestPricePerPerson": 489.00,
      "totalPrice": 978.00,
      "currency": "EUR",
      "giata": { "id": "12345", "name": "Maritim Hotel Düsseldorf" }
    }
  ]
}
```

---

### 4.2 GET `/hotels/top` — Top hoteli po regionu

Vraća top listu hotela za određeni region.

**Parametri:**
| Parametar | Tip | Opis |
|-----------|-----|------|
| `licence` | string | 16-cifreni broj licence (obavezan) |
| `productType` | string | `pauschal` ili `hotelonly` (obavezan) |
| `regionId` | string | Traffics region ID (obavezan) |
| `fromDate` | string | Datum polaska |
| `toDate` | string | Datum povratka |
| `duration` | integer | Broj noći |
| `adults` | string | Broj odraslih |
| `children` | string | CSV uzrasti dece |
| `category` | integer | Min zvezdice |
| `language` | string | Jezik |

---

### 4.3 GET `/hotels/{giataId}` — Statički sadržaj hotela

Vraća detalje hotela (slike, opis, amenities) po GIATA ID-u.

**Path parametar:**
- `giataId` — GIATA identifikator hotela

**Query parametar:**
- `licence` — 16-cifreni broj licence (obavezan)

**Odgovor sadrži:**
- Naziv, kategorija, opis
- Slike (galerija)
- Lokacija i koordinate
- Amenities / sadržaj (bazen, spa, parking...)
- Podaci o sobama
- Check-in / Check-out vreme
- Kontakt informacije

---

## 5. IBE Deep Linkovi

IBE Deep linkovi omogućavaju direktno otvaranje pretrage unutar Evolution IBE 3.0.

### Struktura URL-a:
```
/<productType>/<view>?param1=val1&param2=val2&...
```

### Primeri:
```
# Lista regiona (paket):
/pauschalreise/regionen?minCategory=3&sortBy=quality&searchDate=041119,181119,7&adults=2

# Lista hotela (samo hotel):
/hotel/hotels?regionList=133&destinationName=Mallorca&minCategory=3
             &searchDate=041119,181119,7&adults=2&sortBy=price

# Hotel detail:
/hotel/hotel?giataId=12345&searchDate=041119,181119,7&adults=2
```

### Ključni parametri deep linka:
| Parametar | Opis |
|-----------|------|
| `regionList` | CSV region ID-jevi: `133,134` |
| `destinationName` | Display naziv destinacije |
| `minCategory` | Minimum zvezdica |
| `searchDate` | `ddMMyy,ddMMyy,dani` format |
| `adults` | Broj odraslih |
| `children` | CSV uzrasti dece |
| `sortBy` | Sortiranje prema ceni/kvalitetu |
| `giataId` | Za direktan hotel detalj |

---

## 6. Integracija u ClickToTravel

| Komponenta | Lokacija |
|------------|----------|
| **Types** | `src/integrations/traffics/types/trafficsTypes.ts` |
| **Service** | `src/integrations/traffics/api/trafficsApiService.ts` |
| **Docs** | `src/integrations/traffics/docs/traffics-api-docs.md` |
| **Test Page** | `src/pages/TrafficsTest.tsx` |
| **Route** | `/traffics-test` |

---

## 7. Korišćenje Servisa

```typescript
import { trafficsApiService } from '@/integrations/traffics/api/trafficsApiService';

// Konfiguracija
trafficsApiService.configure({
    credentials: {
        licenceNumber: '1234567890123456',
        environment: 'sandbox'
    },
    defaultLanguage: 'en',
    defaultCurrency: 'EUR'
});

// Pretraga hotela
const results = await trafficsApiService.searchHotels({
    productType: 'hotelonly',
    fromDate: '01062026',
    toDate: '08062026',
    duration: 7,
    adults: 2,
    category: 4,
    sortBy: 'price'
});

// Top hoteli za region
const topHotels = await trafficsApiService.getTopHotels({ regionId: '133' });

// Sadržaj hotela po GIATA ID
const content = await trafficsApiService.getHotelContent('12345');

// Generisanje IBE deep linka
const ibeUrl = trafficsApiService.generateDeeplink({
    travelType: 'hotel',
    view: 'hotels',
    ibeBaseUrl: 'https://myagency.ibe.traffics.de',
    regionList: '133',
    destinationName: 'Mallorca',
    adults: 2,
    minCategory: 4
});
```

---

## 8. Resursi

| Resurs | Link |
|--------|------|
| **IBE Dokumentacija (Deep Links)** | [ibe-dokumentation.traffics.de](https://ibe-dokumentation.traffics.de) |
| **Feeds API Swagger** | [docs.traffics.de/feeds/v3](https://docs.traffics.de/feeds/v3) |
| **Traffics Website** | [traffics.de](https://www.traffics.de) |
