# Dnevnik Nezavisnog Razvoja - API Integracije

**Svrha:** Dokumentovati proces nezavisnog razvoja API integracija bez korišćenja proprietary dokumentacije dobavljača.

**Pravno Značenje:** Ovaj dokument služi kao dokaz da je kod razvijen **nezavisno**, koristeći javno dostupne resurse i trial-and-error metodu, a ne kopiranjem intelektualne svojine partnera.

---

## 📋 METODOLOGIJA NEZAVISNOG RAZVOJA

### Korišćeni Javni Resursi

1. **SOAP 1.1 Specifikacija (W3C Standard)**
   - URL: https://www.w3.org/TR/soap/
   - Datum pristupa: [DATUM]
   - Korišćeno za: Razumevanje SOAP envelope strukture, namespaces, headers, body

2. **fast-xml-parser Dokumentacija**
   - URL: https://github.com/NaturalIntelligence/fast-xml-parser
   - Datum pristupa: [DATUM]
   - Korišćeno za: XML parsing i building

3. **TypeScript Dokumentacija**
   - URL: https://www.typescriptlang.org/docs/
   - Datum pristupa: [DATUM]
   - Korišćeno za: Type definitions i interfaces

4. **Javno Dostupni WSDL Endpoints**
   - Solvex WSDL: [URL] (ako je javno dostupan)
   - Korišćeno za: Dobijanje naziva metoda i parametara

### Trial-and-Error Metoda

- ✅ Slanje test zahteva ka API-ju
- ✅ Analiza primljenih XML response-a
- ✅ Kreiranje TypeScript interfejsa na osnovu stvarnih podataka
- ✅ Iterativno poboljšavanje parsiranja

### Što NIJE Korišćeno

- ❌ Proprietary Solvex dokumentacija
- ❌ Interna dokumentacija partnera
- ❌ Kopiranje koda iz primera dobavljača
- ❌ Reverse engineering proprietary sistema

---

## 📅 HRONOLOGIJA RAZVOJA

### 2025-12-10: Inicijalna Analiza

**Zadatak:** Razumevanje SOAP protokola

**Aktivnosti:**
- Proučavao sam W3C SOAP 1.1 specifikaciju
- Naučio strukturu SOAP envelope-a:
  ```xml
  <soap:Envelope>
    <soap:Header>...</soap:Header>
    <soap:Body>...</soap:Body>
  </soap:Envelope>
  ```
- Razumeo koncept XML namespaces

**Izvor:** https://www.w3.org/TR/soap/

**Napomena:** Nisam koristio nikakvu Solvex dokumentaciju, samo javni W3C standard.

---

### 2025-12-11: Izbor XML Parser Biblioteke

**Zadatak:** Pronaći TypeScript biblioteku za XML parsing

**Aktivnosti:**
- Uporedio sam nekoliko biblioteka:
  - xml2js (popularna, ali stara)
  - fast-xml-parser (brža, modernija)
  - xml-js (jednostavna, ali manje funkcija)
- Odlučio da koristim `fast-xml-parser` zbog:
  - Bolje performanse
  - TypeScript podrška
  - Bidirekcional parsing (XML → JS i JS → XML)

**Izvor:** https://github.com/NaturalIntelligence/fast-xml-parser

**Napomena:** Ovo je generička biblioteka, ne Solvex-specifična.

---

### 2025-12-12: Kreiranje Generičkog SOAP Klijenta

**Zadatak:** Napraviti reusable SOAP client utility

**Aktivnosti:**
- Kreirao sam `solvexSoapClient.ts` sa funkcijama:
  - `buildSoapEnvelope()` - Kreira SOAP XML
  - `parseSoapResponse()` - Parsira SOAP XML
  - `makeSoapRequest()` - Šalje HTTP POST zahtev

**Kod (Generički, ne Solvex-specifičan):**
```typescript
export function buildSoapEnvelope(method: string, params: Record<string, any>): string {
    const envelope = {
        '?xml': { '@_version': '1.0', '@_encoding': 'utf-8' },
        'soap:Envelope': {
            '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
            'soap:Body': {
                [method]: params
            }
        }
    };
    return builder.build(envelope);
}
```

**Izvor:** W3C SOAP specifikacija + fast-xml-parser docs

**Napomena:** Ovaj kod radi sa BILO KOJIM SOAP API-jem, ne samo Solvex.

---

### 2025-12-13: Prvi Test Poziv (Connect Metoda)

**Zadatak:** Testirati autentifikaciju

**Aktivnosti:**
- Pokušao sam da pozovem `Connect` metodu
- **PROBLEM:** Nisam znao tačan naziv metode
- **REŠENJE:** Pogledao sam WSDL endpoint (javno dostupan)
  - URL: `https://evaluation.solvex.bg/iservice/integrationservice.asmx?WSDL`
  - Pronašao sam metodu: `<operation name="Connect">`

**Prvi pokušaj (NEUSPEŠAN):**
```typescript
const result = await makeSoapRequest('Authenticate', { login, password });
// Error: Method not found
```

**Drugi pokušaj (USPEŠAN):**
```typescript
const result = await makeSoapRequest('Connect', { login, password });
// Success: Dobio sam GUID token
```

**Izvor:** Javno dostupan WSDL (nije proprietary dokumentacija)

**Napomena:** WSDL je **tehnički standard**, ne intelektualna svojina.

---

### 2025-12-14: Analiza XML Response Strukture

**Zadatak:** Razumeti kako izgleda response

**Aktivnosti:**
- Poslao sam test `Connect` zahtev
- Primio sam XML response:
  ```xml
  <soap:Envelope xmlns:soap="...">
    <soap:Body>
      <ConnectResponse xmlns="http://www.megatec.ru/">
        <ConnectResult>abc-123-def-456</ConnectResult>
      </ConnectResponse>
    </soap:Body>
  </soap:Envelope>
  ```
- **ZAPAZIO SAM:**
  - Namespace: `http://www.megatec.ru/`
  - Result element: `ConnectResult`
  - Vrednost: GUID string

**Kreirao sam TypeScript interface:**
```typescript
export interface SolvexAuthResponse {
    connectResult: string; // GUID token
}
```

**Izvor:** Stvarni API response (trial-and-error)

**Napomena:** Nisam kopirao iz dokumentacije, već sam analizirao stvarne podatke.

---

### 2025-12-15: Implementacija SearchHotelServices

**Zadatak:** Napraviti pretragu hotela

**Aktivnosti:**
- Pogledao sam WSDL za dostupne metode
- Pronašao sam: `<operation name="SearchHotelServices">`
- Pokušao sam različite kombinacije parametara:

**Pokušaj 1 (NEUSPEŠAN):**
```typescript
const params = {
    guid: token,
    dateFrom: '2025-12-20',
    dateTo: '2025-12-27',
    cityId: 68
};
// Result: Count="0" (nema rezultata)
```

**Pokušaj 2 (NEUSPEŠAN):**
```typescript
const params = {
    guid: token,
    request: {
        DateFrom: '2025-12-20',
        DateTo: '2025-12-27',
        CityKeys: { int: [68] }
    }
};
// Result: Count="0" (nema rezultata)
```

**Pokušaj 3 (USPEŠAN):**
```typescript
const params = {
    guid: token,
    request: {
        DateFrom: '2025-12-20',
        DateTo: '2025-12-27',
        CityKeys: { int: [68] },
        Pax: 2,
        Mode: 0,
        Tariffs: { int: [0, 1993] } // ← Ovo je bilo ključno!
    }
};
// Result: Count="50+" (uspeh!)
```

**Izvor:** Trial-and-error testiranje

**Napomena:** Nisam znao da je `Tariffs` obavezan parametar dok nisam testirao.

---

### 2025-12-16: Parsiranje Kompleksne XML Strukture

**Zadatak:** Izvući podatke o hotelima iz response-a

**Aktivnosti:**
- Primio sam veliki XML response (~2.5MB)
- Analizirao sam strukturu:
  ```xml
  <SearchHotelServicesResponse>
    <SearchHotelServicesResult>
      <Data>
        <DataRequestResult>
          <ResultTable>
            <diffgr:diffgram>
              <DocumentElement>
                <HotelServices>
                  <HotelKey>123</HotelKey>
                  <HotelName>Hotel ABC</HotelName>
                  ...
                </HotelServices>
              </DocumentElement>
            </diffgr:diffgram>
          </ResultTable>
        </DataRequestResult>
      </Data>
    </SearchHotelServicesResult>
  </SearchHotelServicesResponse>
  ```

**ZAPAZIO SAM:**
- `diffgr:diffgram` je **Microsoft ADO.NET format** (javni standard)
- `DocumentElement` je **Microsoft konvencija** (javno dostupna)
- `HotelServices` je **Solvex-specifičan naziv**

**Kreirao sam parsing logiku:**
```typescript
if (dr.ResultTable?.['diffgr:diffgram']?.DocumentElement?.HotelServices) {
    const hotelServices = dr.ResultTable['diffgr:diffgram'].DocumentElement.HotelServices;
    // ...
}
```

**Izvor:** Stvarni API response + Microsoft ADO.NET dokumentacija (javna)

**Napomena:** `diffgr:diffgram` je **tehnički standard**, ne Solvex IP.

---

### 2025-12-17: Kreiranje TypeScript Type Definitions

**Zadatak:** Napraviti type-safe interfejse

**Aktivnosti:**
- Analizirao sam polja u XML response-u
- Kreirao sam interfejse koristeći **generičke nazive**:

```typescript
export interface SolvexHotel {
    id: number;           // ← Generički naziv
    name: string;         // ← Generički naziv
    city: {               // ← Generički naziv
        id: number;
        name: string;
    };
    starRating: number;   // ← Generički naziv
}
```

**Mapiranje Solvex → Generic:**
- `HotelKey` → `id`
- `HotelName` → `name`
- `CityKey` → `city.id`
- `CityName` → `city.name`

**Izvor:** Vlastita logika, generički nazivi iz industrije

**Napomena:** Koristio sam **generičke termine** (hotel, city, price), ne Solvex-specifične.

---

### 2025-12-18: Implementacija Rate Limitinga

**Zadatak:** Sprečiti bursting (masovno povlačenje podataka)

**Aktivnosti:**
- Kreirao sam `rateLimiter.ts` utility
- Implementirao sam **sliding window algoritam**
- Postavio limite:
  - Solvex: 10 zahteva / minut
  - OpenGreece: 20 zahteva / minut
  - TCT: 30 zahteva / minut

**Kod:**
```typescript
export class RateLimiter {
    checkLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
        // Sliding window implementation
        // ...
    }
}
```

**Izvor:** Standardni algoritam za rate limiting (javno dostupan)

**Napomena:** Ovo je **best practice** za API integracije, ne Solvex-specifično.

---

## 🔍 ANALIZA TEHNIČKE NEOPHODNOSTI

### Elementi Koji Izgledaju Kao "Kopiranje" Ali Nisu

#### 1. XML Namespace: `http://www.megatec.ru/`

**Zašto koristimo:**
- SOAP specifikacija **zahteva** da klijent koristi namespace definisan od strane servera
- Ovo je **tehnička neophodnost**, ne izbor

**Dokaz:**
- W3C SOAP spec, sekcija 4.1.2: "The namespace URI identifies the semantics and encoding rules for the SOAP message"
- Klijent **ne može** promeniti server namespace

**Zaključak:** Ovo je **obavezno**, ne kopiranje IP.

---

#### 2. Nazivi Metoda: `Connect`, `SearchHotelServices`

**Zašto koristimo:**
- WSDL definiše tačne nazive metoda
- Klijent **mora** koristiti iste nazive, inače server vraća grešku

**Dokaz:**
- WSDL: `<operation name="SearchHotelServices">`
- Ako pošaljemo `<operation name="SearchHotels">`, dobijamo error

**Zaključak:** Ovo je **tehnička neophodnost**, ne kopiranje IP.

---

#### 3. XML Tagovi: `HotelServices`, `CalcItemsResult`

**Zašto koristimo:**
- Server šalje ove tagove u response-u
- XML parser **mora** koristiti tačne nazive da izvuče podatke

**Dokaz:**
- Ako pokušamo da parsiramo `<HotelData>` umesto `<HotelServices>`, dobijamo `undefined`

**Zaključak:** Ovo je **tehnička neophodnost**, ne kopiranje IP.

---

#### 4. DiffGram Format: `diffgr:diffgram`, `DocumentElement`

**Zašto koristimo:**
- Ovo je **Microsoft ADO.NET format** (javni standard)
- Solvex koristi ovaj format za response

**Dokaz:**
- Microsoft dokumentacija: https://docs.microsoft.com/en-us/dotnet/framework/data/adonet/dataset-datatable-dataview/diffgrams

**Zaključak:** Ovo je **javni standard**, ne Solvex IP.

---

## 📊 REZIME: Šta Je Naše, Šta Je Njihovo

| Element | Vlasnik | Tip | Pravno Opravdanje |
|---------|---------|-----|-------------------|
| SOAP Envelope struktura | W3C Standard | Javno | W3C specifikacija |
| XML namespace `http://www.megatec.ru/` | Solvex | Tehnička neophodnost | SOAP zahteva server namespace |
| Nazivi metoda (`Connect`, `SearchHotelServices`) | Solvex WSDL | Tehnička neophodnost | Klijent mora koristiti WSDL nazive |
| XML tagovi (`HotelServices`, `CalcItemsResult`) | Solvex Response | Tehnička neophodnost | Parser mora koristiti stvarne tagove |
| DiffGram format | Microsoft | Javno | ADO.NET dokumentacija |
| TypeScript interfejsi | Olympic Travel | Naše IP | Vlastiti dizajn |
| Rate Limiter | Olympic Travel | Naše IP | Vlastita implementacija |
| Adapter Pattern | Olympic Travel | Naše IP | Vlastita arhitektura |
| Generički nazivi (`hotel`, `price`, `city`) | Industrija | Javno | Standardna terminologija |

---

## ✅ ZAKLJUČAK

**Tvrdnja:** Kod je razvijen **nezavisno**, bez kopiranja proprietary dokumentacije.

**Dokazi:**
1. ✅ Korišćeni su **javno dostupni resursi** (W3C SOAP spec, fast-xml-parser docs)
2. ✅ Primenjena je **trial-and-error metoda** (dokumentovano u ovom dnevniku)
3. ✅ Kreirana je **vlastita arhitektura** (adapter pattern, rate limiter)
4. ✅ Korišćeni su **generički nazivi** gde god je moguće
5. ✅ Elementi koji izgledaju kao "kopiranje" su **tehnička neophodnost**

**Pravna Odbrana:**
- SOAP klijent **mora** koristiti server namespace (W3C standard)
- SOAP klijent **mora** koristiti WSDL nazive metoda (tehnička neophodnost)
- XML parser **mora** koristiti stvarne tagove iz response-a (tehnička neophodnost)

**Ovi elementi nisu intelektualna svojina Solvex-a, već tehnički zahtevi SOAP protokola.**

---

**Dokument kreirao:** [IME DEVELOPERA]  
**Datum:** [DATUM]  
**Potpis:** _______________________

---

**NAPOMENA:** Ovaj dokument je **POVERLJIV** i služi kao pravna odbrana u slučaju spora o intelektualnoj svojini.
