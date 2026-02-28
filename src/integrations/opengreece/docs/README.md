# 🇬🇷 Open Greece API — Integracija Dokumentacija

> **Poslednje ažuriranje:** 2026-02-28 (by Antigravity AI)

---

## 📊 Status API Endpointa — REALNI TESTOVI

| Endpoint | Metoda | Status | Šta vraća |
|----------|--------|--------|-----------|
| Push (StartPushProcessRQ) | `IsFullPush=true` | ✅ **RADI** | Lista hotela: kod, ime, status, datum ugovora |
| Push (StartPushProcessRQ) | `IsFullPush=false` | ✅ **RADI** | Delta izmene od poslednje sinhronizacije |
| Pull (OTA_HotelSearchRQ) | `HotelRef *` | ❌ **NE RADI** | "No OTA message received..." |
| Pull (OTA_HotelSearchRQ) | `CountryName Code=CY` | ❌ **NE RADI** | "No OTA message received..." |
| Pull (OTA_HotelSearchRQ) | `CityName=Ayia Napa` | ❌ **NE RADI** | "No OTA message received..." |
| Pull (OTA_HotelDescriptiveInfoRQ) | Bilo koji hotelCode | ❌ **NE RADI** | "No OTA message received..." |
| Pull (OTA_HotelAvailRQ) | Standardni | ❌ **NE RADI** | "No OTA message received..." |
| SOAP 1.1 wrapper | OTA_HotelSearchRQ | ❌ **NE RADI** | "No OTA message received..." |
| SOAP 1.2 wrapper | OTA_HotelSearchRQ | ❌ **NE RADI** | "Not Valid XML Message..." |

> **Zaključak:** Pull API nalog `olympictravel` nema aktiviran pristup ili zahteva specifičan session/token koji nije dokumentovan. Kontaktirati Open Greece podršku.

---

## ✅ Šta RADI — Push API

### Endpoint
```
POST https://online.open-greece.com/nsCallWebService_Push/handlerequest.aspx
Authorization: Basic base64(olympictravel:olympic2025!)
Content-Type: text/xml
```

### Full Push (sve hotele odjednom)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<StartPushProcessRQ xmlns="http://www.opentravel.org/OTA/2003/05" 
                    IsFullPush="true"
                    EchoToken="unique-token-here" 
                    TimeStamp="2026-02-28T10:00:00" 
                    Version="1.0">
  <POS>
    <Source>
      <RequestorID Type="1" ID="olympictravel" MessagePassword="olympic2025!"/>
    </Source>
  </POS>
</StartPushProcessRQ>
```

**Odgovor — uspešan primer:**
```xml
<StartPushProcessRS xmlns="http://www.opentravel.org/OTA/2003/05">
  <Success />
  <Hotels>
    <Hotel HotelCode="385" HotelName="MEDITERRANEAN HOTEL RHODES" ContractEndDate="31-05-2027" Status="UPDATED" />
    <Hotel HotelCode="16315" HotelName="AMARA CYPRUS" ContractEndDate="31-05-2027" Status="UPDATED" />
    <!-- ... 591 hotela total -->
  </Hotels>
</StartPushProcessRS>
```

### Delta Push (samo izmene)
Isti XML, samo `IsFullPush="false"`.

> ⚠️ **Napomena:** Nakon prvog Full Push, svaki naredni Full Push vraća `"No delta changes found."` jer API interno prati koji su podaci već dostavljeni. Treba koristiti **novi EchoToken** za svaki poziv ILI sačekati da server resetuje stanje.

---

## ❌ Šta NE RADI — Pull API (OTA_HotelDescriptiveInfoRQ)

### Isprobane varijante (sve vraćaju grešku)
```xml
<!-- Varijanta 1: Standardni OTA -->
<OTA_HotelDescriptiveInfoRQ xmlns="http://www.opentravel.org/OTA/2003/05" Version="1.0">
  <POS><Source><RequestorID ID="olympictravel" MessagePassword="olympic2025!"/></Source></POS>
  <HotelDescriptiveInfos>
    <HotelDescriptiveInfo HotelCode="16315"/>
  </HotelDescriptiveInfos>
</OTA_HotelDescriptiveInfoRQ>
```

**Sve varijante vraćaju:**
```xml
<OTA_HotelDescriptiveInfoRS xmlns="">
  <Errors>
    <Error Type="1" ShortText="No OTA message received..." />
  </Errors>
</OTA_HotelDescriptiveInfoRS>
```

---

## 📦 Podaci u Supabase — Šta je importovano

Importovano je **591 hotela** iz Open Greece baze koristeći lokalni XML snapshot (`opengreece-StartPushProcessRQ-OTA.xml`).

### Struktura podataka u `properties` tabeli

```json
{
  "id": "opengreece-16315",
  "name": "AMARA CYPRUS",
  "propertyType": "Hotel",
  "isActive": true,
  "address": {
    "country": "Kipar",
    "city": "Pafos"
  },
  "content": {
    "description": "Open Greece Hotel (Status: UPDATED, Contract: 31-05-2027)"
  },
  "images": [],
  "starRating": 0
}
```

> ⚠️ **NAPOMENA:** Slike (`images`) su **prazne** i opisi (`content.description`) su samo tehnički podaci. Push API ne daje slike, opise ni kategorije. Potreban je aktivni Pull API pristup za kompletne podatke.

---

## 🇨🇾 Kipar — Pronađeni hoteli (2026-02-28)

Od 591 hotela u Push listi, identifikovano je **20 hotela na Kipru** koji su importovani sa ispravnim tagom `country: "Kipar"`:

### Pafos area (14 hotela)
| HotelCode | Naziv |
|-----------|-------|
| 1828 | KING JASON PAPHOS (Adults Only 17+) Louis Hotels |
| 1832 | LOUIS LEDRA BEACH Louis Hotels |
| 2830 | POLIS 1907 Louis Hotels |
| 2841 | SOFIANNA RESORT & SPA Louis Hotels |
| 2880 | ANASSA HOTEL Cyprus Thanos Hotels |
| 8657 | ELYSIUM CYPRUS |
| 16319 | ALMYRA HOTEL Cyprus Thanos Hotels |
| 16320 | ANNABELLE Cyprus Thanos Hotels |
| 16393 | CALI RESORT and SPA (Adults only 16+) Louis Hotels |
| 16394 | ROYAL APOLLONIA Louis Hotels |
| 16430 | THE IVI MARE (Adults Only 16+) Louis Hotels |
| 16431 | LOUIS PAPHOS BREEZE Louis Hotels |
| 16785 | LOUIS PHAETHON BEACH Louis Hotels |
| 16788 | COLUMBIA BEACH RESORT PISSOURI BAY |

### Limassol (6 hotela)
| HotelCode | Naziv |
|-----------|-------|
| 2628 | FOUR SEASONS HOTEL CYPRUS |
| 16312 | AMATHUS BEACH HOTEL Limassol |
| 16315 | AMARA CYPRUS |
| 16317 | MEDITERRANEAN BEACH CYPRUS |
| 16394 | ROYAL APOLLONIA Louis Hotels |
| 17024 | CROWNE PLAZA LIMASSOL an IHG Hotel |

> **Napomena:** Hoteli kao NISSIBLU BEACH RESORT, ROBINSON CYPRUS, ANASSA MARE VILLAS imaju Status="DELETED" i nisu importovani.

> ⚠️ **Open Greece ima VEĆU bazu Kipar hotela** nego što nam je Push vratio. Posebno za destinacije Ayia Napa, Protaras, Larnaca — Pull API bi mogao prikazati te hotele ali trenutno ne radi.

---

## 🔑 Kredencijali

### API (HTTP Basic Auth)
```
Pull URL:  https://online.open-greece.com/nsCallWebServices/handlerequest.aspx
Push URL:  https://online.open-greece.com/nsCallWebService_Push/handlerequest.aspx
Username:  olympictravel
Password:  olympic2025!
```

### FTP
```
Host:      ftp.open-greece.com
Port:      21
Username:  olympictravel
Password:  0Fu7GD0znftX
```

> FTP nije testiran. Potencijalno se tu mogu naći XML feedovi sa kompletnim podacima (slike, opisi).

---

## 📋 Sledeći koraci / TODO

### Prioritet 1 — Kontaktirati Open Greece
- **Cilj:** Aktivacija Pull API pristupa za nalog `olympictravel`
- **Šta tražiti:** 
  - Potvrdu da `OTA_HotelDescriptiveInfoRQ` radi za naš nalog
  - Primer ispravnog XML zahteva koji je testiran i radi
  - Dokumentaciju za korišćenje FTP pristupa
- **Kontakt:** info@open-greece.com / https://www.netsemantics.gr

### Prioritet 2 — FTP Istraživanje
- Konektovati se na `ftp://ftp.open-greece.com` sa FTP kredencijalima
- Proveriti da li postoje XML/JSON fajlovi sa kompletnim podacima hotela (sa slikama i opisima)
- Ovo je alternativni kanal koji možda ima kompletne podatke

### Prioritet 3 — Dopuna slika i opisa
- Za 20 Cyprus hotela — ručni upload slika kroz "Uredi hotel" panel
- Alternativno: Google Places API za automatsko preuzimanje slika po imenu hotela

### Prioritet 4 — Redovna sinhronizacija
- Delta push (`IsFullPush=false`) pokretati jednom dnevno
- Pratiti nova/izmenjena/obrisana stanja

---

## 🔧 Skripte

### Import iz lokalnog XML snapshot-a
```bash
node scripts/import_opengreece_from_file.cjs
```
Importuje sve hotele iz: `src/integrations/opengreece/docs/opengreece-StartPushProcessRQ-OTA.xml`

### Import direktno sa API-ja (Full Push)
```bash
node scripts/import_opengreece_hotels.cjs
```
> Napomena: Posle prvog Full Push, API vraća "No delta changes found". Koristiti novi EchoToken.

---

## 📁 Struktura fajlova

```
src/integrations/opengreece/
├── api/
│   ├── opengreeceApiService.ts      # Glavni API servis
│   ├── opengreeceConfig.ts          # Konfiguracija i env varijable
│   ├── opengreeceXmlBuilder.ts      # XML request builder
│   └── opengreeceXmlParser.ts       # XML response parser
├── docs/
│   ├── README.md                    # Ova dokumentacija
│   ├── opengreece-StartPushProcessRQ-OTA.xml  # Snapshot 591 hotela (2026-02-28)
│   ├── test-opengreece-ota.ps1      # PowerShell test skripte
│   └── test-opengreece-curl.ps1     # cURL test skripte
└── types/
    └── opengreece.types.ts          # TypeScript tipovi
```

---

*Dokumentacija ažurirana: 2026-02-28 na osnovu realnih testova API-ja tokom sesije sa Antigravity AI.*
