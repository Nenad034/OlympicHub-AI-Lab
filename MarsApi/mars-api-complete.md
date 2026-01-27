# Mars API V1 - Complete Documentation

**Source:** https://marsapi.stoplight.io/docs/mars-api-v1/

---

## 🔐 Authentication

**Type:** HTTP Basic Authentication  
**Method:** Send username and password in Authorization header

```
Authorization: Basic {base64(username:password)}
```

**Example:**
```bash
curl --request GET \
  --url https://yourMarsDomain/mapi/v1/objects/index \
  --header 'Authorization: Basic 123'
```

---

## 🌐 Base URLs

- **Live Server:** `https://yourMarsDomain`
- **Mock Server:** `https://stoplight.io/mocks/marsapi/mars-api-v1/73778095`

---

## 📡 API Endpoints

### 1. Index Service
**GET** `/mapi/v1/objects/index`

**Description:** Get list of all accommodations with their IDs and last modified dates.

**Query Parameters:**
- `responseType` (optional): `json` or `xml` (default: `json`)

**Response Example (JSON):**
```json
{
  "status": true,
  "messages": [],
  "data": [
    {
      "object": {
        "id": 41,
        "last_modified": "2020-06-19 10:43:05"
      }
    },
    {
      "object": {
        "id": 1,
        "last_modified": "2020-07-08 10:50:12"
      }
    }
  ]
}
```

---

### 2. Details Service
**GET** `/mapi/v1/objects/details`

**Description:** Get full accommodation details including name, location, units, pricelist, and common items.

**Query Parameters:**
- `id` (required): Accommodation ID (number)
- `responseType` (optional): `json` or `xml` (default: `json`)

**Response Structure:**
```json
{
  "status": true,
  "messages": [],
  "data": [
    {
      "name": "API showcase",
      "id": 119,
      "location": {
        "address": "Anticova 9",
        "lat": 44.8677674,
        "lng": 13.8463567,
        "place": "Pula"
      },
      "images": [
        {
          "big": "https://mars.neolab.hr/data/objects/images/26698/adventure-usdqef-l-kgwyz7.jpg"
        }
      ],
      "amenities": [...],
      "units": [...],
      "commonItems": {...}
    }
  ]
}
```

---

## 🏨 Accommodation Data Structure

### High-Level Overview

```
Accommodation
├── Name (string)
├── Id (integer)
├── Location
│   ├── Address
│   ├── Lat (GPS latitude)
│   ├── Lng (GPS longitude)
│   └── Place (city)
├── Images[]
│   └── Big (URL to Full HD image)
├── Amenities[]
│   ├── Name
│   └── Values (bool, string, or CSV string)
├── Units[]
│   ├── id
│   ├── name
│   ├── type
│   ├── baseService
│   ├── basicBeds
│   ├── extraBeds
│   ├── minOccupancy
│   ├── Images[]
│   ├── Amenities[] (grouped: GENERAL, Room_1-9)
│   ├── Availabilities[]
│   └── Pricelist
│       ├── baseRate[]
│       ├── supplement[]
│       ├── discount[]
│       └── touristTax[]
└── CommonItems
    ├── supplement[]
    ├── discount[]
    └── touristTax[]
```

---

## 🛏️ Unit Structure

Each unit has:

- **id** - unit identifier
- **name** - name of the unit
- **type** - type of the unit (room, apartment, etc.)
- **baseService** - service level: `classic`, `junior`, `superior`, `executive`, `business`, `standard`, `comfort`, `deluxe`, `presidentialSuite`, `premium`, `duplex`, `mezzanin`, `family`
- **basicBeds** - number of basic beds
- **extraBeds** - number of extra beds
- **minOccupancy** - minimum number of persons

---

## 📅 Availabilities

Each availability has:

```json
{
  "dateFrom": "2022-01-01",
  "dateTo": "2024-01-01",
  "type": "Instant booking",
  "validUntil": null,
  "quantity": 3
}
```

---

## 💰 Pricelist Structure

### Four Sections:

1. **baseRate** - Base accommodation rate
2. **supplement** - Additional charges
3. **discount** - Reductions
4. **touristTax** - Taxes

### Pricelist Item Properties:

- `dateFrom` / `dateTo` - Validity period (YYYY-MM-DD)
- `price` - Selling price
- `currency` - Currency code (EUR, USD, etc.)
- `percent` - Fee in percentage %
- `arrivalDays` - Allowed arrival days (1-7, Mon-Sun)
- `departureDays` - Allowed departure days (1-7, Mon-Sun)
- `ageFrom` / `ageTo` - Age range
- `minAdult` / `maxAdult` - Adult count constraints
- `minChild` - Minimum children
- `minStay` / `maxStay` - Stay duration constraints
- `release` - Minimum days before arrival for booking
- `onSpot` - Pay on arrival (boolean)
- `subtractDays` - For special offers (e.g., pay 7 stay 10)
- `numberOfPersons` - Number of persons
- `paymentType` - `perPersonPerDay`, `perPerson`, `Once`, `perUnitPerWeek`, `perHour`
- `definitionId` - Definition identifier
- `type` - Type of pricelist item
- `title` - Title/description

**Example:**
```json
{
  "dateFrom": "2022-07-11",
  "dateTo": "2022-07-22",
  "price": 100,
  "currency": "EUR",
  "minStay": 5,
  "maxStay": 30,
  "paymentType": "perDay",
  "type": "baseRate",
  "title": "Overnight"
}
```

---

## 🎯 Amenities

### Categories:

- **activities** - diving, bicycleRental, cycling, spa, gameRoom, etc.
- **additionalContentInTheFacility** - kidsPlayground, massage, sauna, jacuzzi, etc.
- **adultsOnly** - boolean
- **aircondition** / **airConditioning** - boolean
- **airportDistance** - integer (meters)
- **airportPickup** - `no`, `yesPaid`, `yesFree`
- **area** - float (m²)
- **bathroom** - multiple values (toilet, shower, bathtub, hairDryer, etc.)
- **beachDistance** - integer (meters)
- **category** - 1-5 stars
- **centerDistance** - integer (meters)
- **checkIn** / **checkOut** - time strings
- **internet** - `yesFree`, `no`, `yes`, `yesPaid`
- **parking** - `no`, `yes`
- **petAllowed** - `yes`, `yesPaid`, `yesFree`, `yesRequest`, `no`
- **pool** - `no`, `yes`, `yesPaid`, `yesFree`
- **poolTypes** - sharedPool, indoorPool, childrenPool, outdoorPool, heatedPool

### Room-Specific Amenities (Room_1 to Room_9):

- `roomSize_X` - float (m²)
- `numberOfGuestsPerRoom_X` - string
- `singleBed_X` - count
- `doubleBed_X` - count
- `kingBed_X` - count
- `queenBed_X` - count
- `sofaBed_X` - count
- `bunkBed_X` - count
- `futonMat_X` - count
- `privateBathroom_X` - boolean or multiple values
- `roomType_X` - riverView, skiView, poolView, seaView, parkView, gardenView, lakeView, cityView, seaside, mountainView, streetSide, landmarkView

---

## 🔄 Common Items

Applied to ALL units on accommodation.

**Structure:** Same as pricelist but WITHOUT `baseRate`.

Sections:
- `supplement[]`
- `discount[]`
- `touristTax[]`

**Example:**
```json
{
  "discount": [
    {
      "dateFrom": "2022-10-30",
      "dateTo": "2023-03-31",
      "percent": 15,
      "minStay": 20,
      "type": "forLongerStay",
      "title": "Reduction for long stay"
    }
  ]
}
```

---

## 📊 Response Codes

- **200** - Success
- **400** - Bad Request / Generic Error
- **401** - Not Authorized
- **404** - Not Found

---

## 🎯 Key Features

✅ **Simple REST API** (not SOAP like Solvex)  
✅ **Basic Auth** (easier than token management)  
✅ **JSON & XML** support  
✅ **Detailed pricing** (baseRate, supplements, discounts, taxes)  
✅ **Multi-room units** (up to 9 rooms per unit)  
✅ **Rich amenities** (100+ amenity types)  
✅ **Availability tracking**  
✅ **GPS coordinates**  
✅ **Image URLs**  

---

## 🔗 API Contact

**Provider:** Neolab  
**Website:** https://www.neolab.hr/en/contact  
**Email:** info@neolab.hr

---

## 📝 Notes

- This API is for **accommodation details only** (no search or booking endpoints visible yet)
- Base URL is customizable (`https://yourMarsDomain`)
- Mock server available for testing
- Supports both JSON and XML responses
- Very detailed pricing structure with multiple discount/supplement types
- Amenities are extremely comprehensive (100+ types)

---

## 🚀 Next Steps

Need to find:
1. **Search endpoint** - How to search accommodations?
2. **Booking endpoint** - How to create reservations?
3. **Availability check** - Real-time availability?
4. **Credentials** - Username/password for testing

