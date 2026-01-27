# 📊 Integracija Baze Podataka za Rezervacije

**Kreirano:** 17.01.2026.  
**Verzija:** 1.0.0  
**Svrha:** Integracija između sistema za rezervacije i Supabase tabele `reservations`

---

## 🎯 **Pregled**

Nakon uspešne rezervacije kroz sistem za rezervacije, podaci se automatski čuvaju u Supabase tabeli `reservations`. Ovo omogućava korisnicima da vide sve svoje rezervacije u Dashboard-u za rezervacije.

---

## 📊 **Tok Podataka**

```
Korisnik popunjava formular za rezervaciju
    ↓
Validacija prolazi
    ↓
Rezervacija se šalje provajderu (Solvex/TCT/OpenGreece)
    ↓
Provajder vraća ID rezervacije
    ↓
Rezervacija se čuva u Supabase bazi ← NOVO!
    ↓
Korisnik vidi rezervaciju u dashboard-u
```

---

## 🗄️ **Šema Baze Podataka**

### **Tabela:** `public.reservations`

| Kolona | Tip | Opis |
|--------|------|------|
| `id` | UUID | Primarni ključ |
| `cis_code` | TEXT | Interni CIS kod (CIS-YYYYMMDD-XXXX) |
| `ref_code` | TEXT | Referentni kod (REF-XXXXXXXX) |
| `booking_id` | TEXT | ID rezervacije od provajdera |
| `status` | TEXT | pending \| confirmed \| cancelled \| completed |
| `customer_name` | TEXT | Puno ime glavnog gosta |
| `customer_type` | TEXT | B2C-Individual \| B2C-Legal \| B2B-Subagent |
| `email` | TEXT | Email kupca |
| `phone` | TEXT | Telefon kupca |
| `lead_passenger` | TEXT | Ime glavnog putnika |
| `destination` | TEXT | Destinacija grad/država |
| `accommodation_name` | TEXT | Naziv hotela |
| `hotel_category` | INTEGER | Broj zvezdica (1-5) |
| `check_in` | DATE | Datum prijave |
| `check_out` | DATE | Datum odjave |
| `nights` | INTEGER | Broj noćenja |
| `pax_count` | INTEGER | Ukupan broj putnika |
| `total_price` | DECIMAL | Ukupna cena |
| `paid` | DECIMAL | Plaćeni iznos (podrazumevano: 0) |
| `currency` | TEXT | Kod valute (EUR, USD, itd.) |
| `supplier` | TEXT | Naziv dobavljača (Solvex, TCT, itd.) |
| `provider` | TEXT | Kod provajdera (solvex \| tct \| opengreece) |
| `trip_type` | TEXT | Tip putovanja (Smeštaj, Avio karte, itd.) |
| `hotel_notified` | BOOLEAN | Status obaveštenja hotela |
| `reservation_confirmed` | BOOLEAN | Status potvrde rezervacije |
| `proforma_invoice_sent` | BOOLEAN | Status profakture |
| `final_invoice_created` | BOOLEAN | Status finalne fakture |
| `guests_data` | JSONB | Sve informacije o gostima + posebni zahtevi |
| `created_at` | TIMESTAMP | Vreme kreiranja |
| `updated_at` | TIMESTAMP | Vreme poslednje izmene |

---

## 🔐 **Row Level Security (RLS)**

### **Politike:**

1. **"Korisnici mogu videti samo svoje rezervacije"**
   - Korisnici mogu videti samo rezervacije gde se `email` poklapa sa njihovim auth email-om
   - Tip: SELECT

2. **"Korisnici mogu kreirati rezervacije"**
   - Korisnici mogu kreirati rezervacije samo sa svojim email-om
   - Tip: INSERT

3. **"Service role ima potpun pristup"**
   - Service role ima potpun CRUD pristup
   - Tip: ALL

---

## 📝 **Integracija Koda**

### **1. Servis za Rezervacije** (`src/services/reservationService.ts`)

```typescript
// Čuvanje rezervacije u bazu
const result = await saveBookingToDatabase(bookingRequest, bookingResponse);
```

### **2. Modal za Rezervacije** (`src/components/booking/BookingModal.tsx`)

Nakon uspešne rezervacije:
```typescript
if (response.success && response.bookingId) {
    // Čuvanje u bazu
    const dbResult = await saveBookingToDatabase(bookingRequest, response);
    
    if (dbResult.success) {
        console.log('Rezervacija uspešno sačuvana u bazu');
    }
    
    onSuccess(response.bookingId);
}
```

---

## 🔄 **Automatske Funkcionalnosti**

### **1. Generisanje CIS Koda**
Format: `CIS-YYYYMMDD-XXXX`
- Primer: `CIS-20260117-1234`

### **2. Generisanje REF Koda**
Format: `REF-XXXXXXXX`
- Primer: `REF-A7B9C2D4`

### **3. Upravljanje Vremenskim Oznakama**
- `created_at`: Automatski se postavlja pri unosu
- `updated_at`: Automatski se ažurira pri svakoj izmeni (preko trigger-a)

---

## 📊 **Indeksi**

Za optimalnu performansu upita:
- `idx_reservations_cis_code`
- `idx_reservations_ref_code`
- `idx_reservations_email`
- `idx_reservations_status`
- `idx_reservations_check_in`
- `idx_reservations_created_at`
- `idx_reservations_provider`

---

## 🚀 **Uputstvo za Podešavanje**

### **1. Pokretanje Migracije**

```bash
# Korišćenjem Supabase CLI
supabase db push

# Ili ručno u Supabase Dashboard-u
# SQL Editor → Pokrenite migration fajl
```

### **2. Verifikacija Tabele**

```sql
SELECT * FROM public.reservations LIMIT 10;
```

### **3. Testiranje RLS Politika**

```sql
-- Kao autentifikovani korisnik
SELECT * FROM public.reservations WHERE email = 'user@example.com';
```

---

## 📋 **Primer Podataka**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "cis_code": "CIS-20260117-1234",
  "ref_code": "REF-A7B9C2D4",
  "booking_id": "SOLVEX-1737144916568-XYZ123ABC",
  "status": "pending",
  "customer_name": "Proba Proba",
  "customer_type": "B2C-Individual",
  "email": "nenad.tomic1403@gmail.com",
  "phone": "+381638738288",
  "lead_passenger": "Proba Proba",
  "destination": "Sunny Beach",
  "accommodation_name": "Hotel Example 4*",
  "hotel_category": 4,
  "check_in": "2026-08-01",
  "check_out": "2026-08-11",
  "nights": 10,
  "pax_count": 2,
  "total_price": 1250.00,
  "paid": 0.00,
  "currency": "EUR",
  "supplier": "Solvex (Bulgaria)",
  "provider": "solvex",
  "trip_type": "Smeštaj",
  "hotel_notified": false,
  "reservation_confirmed": false,
  "proforma_invoice_sent": false,
  "final_invoice_created": false,
  "guests_data": {
    "guests": [
      {
        "firstName": "Proba",
        "lastName": "Proba",
        "email": "nenad.tomic1403@gmail.com",
        "phone": "+381638738288",
        "dateOfBirth": "1999-10-02",
        "passportNumber": "AB1233445",
        "nationality": "RS"
      }
    ],
    "specialRequests": ""
  },
  "created_at": "2026-01-17T20:15:00Z",
  "updated_at": "2026-01-17T20:15:00Z"
}
```

---

## 🔍 **Upiti za Rezervacije**

### **Preuzimanje svih rezervacija za korisnika**
```typescript
const { data } = await getUserReservations('user@example.com');
```

### **Preuzimanje pojedinačne rezervacije**
```typescript
const { data } = await getReservationById('550e8400-e29b-41d4-a716-446655440000');
```

---

## ⚠️ **Važne Napomene**

1. **Mock Mode:** Trenutno, Solvex rezervacije rade u MOCK MODE-u (čeka se WSDL dokumentacija)
2. **Plaćanje:** Polje `paid` je inicijalno 0 - integracija plaćanja je u toku
3. **Email:** RLS politike koriste `auth.email()` - osigurajte da su korisnici autentifikovani
4. **Offline Mode:** Ako Supabase kredencijali nedostaju, aplikacija radi u demo režimu

---

## 🎯 **Sledeći Koraci**

1. ✅ Tabela u bazi kreirana
2. ✅ Servisni sloj implementiran
3. ✅ Integracija sa modal-om za rezervacije
4. ⏳ Testiranje sa pravom Supabase instancom
5. ⏳ Dodavanje u prikaz Dashboard-a za rezervacije
6. ⏳ Implementacija praćenja plaćanja
7. ⏳ Dodavanje email notifikacija

---

**Poslednje Ažuriranje:** 17.01.2026.  
**Status:** ✅ Implementirano (Čeka se Supabase migracija)
