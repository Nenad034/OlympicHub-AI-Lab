# Solvex API Integration Guide

## 📋 Overview

Solvex (Master-Interlook) API omogućava pristup hotelskim podacima, rezervacijama i dodatnim uslugama preko SOAP protokola.

## 🔐 Authentication

### Test Environment
- **Base URL:** `https://evaluation.solvex.bg/iservice/integrationservice.asmx`
- **Login:** `sol611s`
- **Password:** `AqC384lF`
- **Protocol:** SOAP

### Production Environment
- **Base URL:** TBD (nakon završetka integracije)
- **Credentials:** TBD

## 📚 Documentation

- **Official Wiki:** http://wiki.megatec.ru/index.php/Master-Interlook:IntegrationService (Russian)
- **Local Copy:** `Api dokumentacija Solvex.txt` (6624 lines)

## 🔑 Authentication Flow

### 1. Connect (Get Auth Token)
```xml
<Connect>
  <login>sol611s</login>
  <password>AqC384lF</password>
</Connect>
```

**Response:**
```xml
<ConnectResult>9a1e4f2f-a4b0-4d60-8f17-e320031f44de</ConnectResult>
```

**Note:** Token treba koristiti u svim sledećim zahtevima kao `guid` parametar.

### 2. CheckConnect (Verify Token)
```xml
<CheckConnect>
  <guid>9a1e4f2f-a4b0-4d60-8f17-e320031f44de</guid>
</CheckConnect>
```

## 🏨 Hotel Search

### Best Practice (preporuka od Solvex-a):

**Korak 1:** Pretraga hotela - koristiti jedan od dva metoda:

#### A) SearchHotelServices
Vraća sve dostupne opcije sa cenama

#### B) SearchHotelServicesMinHotel (Preporučeno)
Vraća samo **minimalnu cenu po hotelu** - brže i efikasnije

**Ključni parametri u odgovoru:**
- `QuotaType`: 
  - `1` = Na kvoti (dostupno)
  - `0` = Na zahtev
  - `2` = Stop sales (nije dostupno)
- `TotalCost`: **Finalna cena** (uključuje sve obavezne servise)
- `AddHotsWithCosts`: Obavezne večere (Božić, Nova Godina)

**Tarife:**
- `0` = Ordinary (obična)
- `1993` = Non-Refundable (bez povraćaja)

### Search Parameters

```xml
<SearchHotelServicesMinHotel>
  <guid>[auth-token]</guid>
  <DateFrom>2024-01-15T00:00:00</DateFrom>
  <DateTo>2024-01-22T00:00:00</DateTo>
  <CityID>80</CityID>
  <HotelID>2930</HotelID> <!-- Optional -->
  <Adults>2</Adults>
  <Children>0</Children>
  <!-- ... -->
</SearchHotelServicesMinHotel>
```

## 📝 Booking Flow

### Korak 2: Kreiranje rezervacije

```xml
<CreateReservation>
  <guid>[auth-token]</guid>
  <reserv HasInvoices="false">
    <Rate><ID>1</ID></Rate>
    <Services>
      <Service xsi:type="HotelService">
        <Hotel><ID>2930</ID></Hotel>
        <Room>
          <RoomTypeID>3</RoomTypeID>
          <RoomCategoryID>20</RoomCategoryID>
          <RoomAccomodationID>5558</RoomAccomodationID>
        </Room>
        <PansionID>3</PansionID>
        <StartDate>2024-01-15T00:00:00</StartDate>
        <Duration>7</Duration>
      </Service>
    </Services>
    <Tourists>
      <Tourist Sex="Male" BirthDate="1990-01-01T00:00:00" 
               FirstNameLat="John" SurNameLat="Doe" 
               AgeType="Adult" IsMain="true" ID="-1">
        <ForeignPassport Serie="1234" Number="123456" 
                        EndDate="2030-01-01T00:00:00"/>
      </Tourist>
    </Tourists>
  </reserv>
</CreateReservation>
```

**Response:**
- `ExternalID`: **Broj rezervacije u Interlook sistemu** (koristiti za GetReservation, CancelReservation)
- `Name`: Interni broj rezervacije

## 🔍 Key Methods

### Search & Availability
| Method | Description |
|--------|-------------|
| `SearchHotelServices` | Pretraga svih opcija |
| `SearchHotelServicesMinHotel` | Minimalna cena po hotelu ⭐ |
| `CheckQuota` | Provera dostupnosti |
| `GetQuotaInfo` | Detalji kvota po danima |

### Booking Management
| Method | Description |
|--------|-------------|
| `CreateReservation` | Kreiranje rezervacije ⭐ |
| `GetReservation` | Detalji rezervacije |
| `CancelReservation` | Otkazivanje |
| `GetReservationPenalties` | Penali pre otkazivanja |

### Cancellation Policy
| Method | Description |
|--------|-------------|
| `GetCancellationPolicyInfoWithPenalty` | Info pre rezervacije |
| `GetReservationPenalties` | Penali za postojeću rezervaciju |

### Dictionaries (Šifarnici)
| Method | Description |
|--------|-------------|
| `GetRegions` | Regioni |
| `GetCities` | Gradovi |
| `GetCountries` | Države |
| `GetHotels` | Hoteli |
| `GetRoomType` | Tipovi soba |
| `GetRoomCategories` | Kategorije soba |
| `GetPansions` | Tipovi pansiona |
| `GetAccommodations` | Smeštaji |
| `GetTariffs` | Tarife |

## 🎯 Important Features

### 1. Mandatory Services (Auto-Added)
Obavezni servisi (WithCost, Hardlink) se **automatski dodaju** u rezervaciju.

### 2. Festive Dinners
API automatski kalkuliše i prikazuje cene za:
- Novogodišnju večeru
- Božićnu večeru

Prikazano kroz `AddHotsWithCosts` tag, uključeno u `TotalCost`.

### 3. Cancellation Policy
Potpuno funkcionalna politika otkazivanja sa:
- Datumima važenja
- Procentima/noćima
- Ukupnim penalima

## ⚙️ Environment Variables

```bash
# Solvex API - Test Environment
VITE_SOLVEX_API_URL=https://evaluation.solvex.bg/iservice/integrationservice.asmx
VITE_SOLVEX_LOGIN=sol611s
VITE_SOLVEX_PASSWORD=AqC384lF

# Production (TBD)
# VITE_SOLVEX_PROD_URL=
# VITE_SOLVEX_PROD_LOGIN=
# VITE_SOLVEX_PROD_PASSWORD=
```

## 🚨 Error Handling

### Common Errors

1. **Invalid GUID:**
   ```
   "Invalid user or password (Invalid GUID)"
   ```
   → Token istekao ili neispravan

2. **Cache Loading:**
   ```
   "The Cache is loading. Try again after some time"
   ```
   → Sačekati nekoliko sekundi nakon Connect-a

3. **XML Format Error:**
   ```
   "There is an error in the XML document (12, 49)"
   ```
   → Greška u liniji 12, karakter 49

4. **Missing Required Field:**
   ```
   "Parameter '[name]' is required"
   ```

5. **Invalid ID:**
   ```
   "There is no [Entity] with '[param]' = [value]"
   ```

## 📊 Data Formats

- **Dates:** `YYYY-MM-DDT00:00:00`
- **Sex:** Male=0, Female=1, Child=2, Infant=3
- **AgeType:** Adult=0, Child=1, Infant=2
- **QuotaType:** None=0, Yes=1, No=2, AFew=3, Request=4, StopSales=2

## 🔗 Integration Status

- [x] Documentation reviewed
- [ ] TypeScript types created
- [ ] SOAP client setup
- [ ] Authentication service
- [ ] Search service
- [ ] Booking service
- [ ] Dictionary services
- [ ] Error handling
- [ ] Test page
- [ ] Integration with Global Hub

## 📞 Support

**Contact:** [iz email-a]

---

**Last Updated:** 2026-01-06
