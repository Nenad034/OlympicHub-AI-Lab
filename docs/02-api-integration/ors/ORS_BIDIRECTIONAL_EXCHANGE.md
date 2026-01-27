# ORS API - Obostrani Data Exchange Analiza

**Datum:** 2026-01-24  
**Pitanje:** Da li možemo da šaljemo naše aranžmane ORS-u?

---

## ✅ **ODGOVOR: DA, MOŽEMO!**

ORS API podržava **OBOSTRANI data exchange**:
1. ✅ **MI → ORS** - Možemo slati naše aranžmane (bookings)
2. ✅ **ORS → MI** - Možemo preuzimati njihove aranžmane

---

## 📤 **SLANJE NAŠIH ARANŽMANA → ORS**

### **1. Booking Registration (Preporučeno)**

**Endpoint:** `POST /offer/{TourOperator}/{HashCode}/register`

**Šta radi:**
- Kreira entry u ORS sistemu
- **NE šalje odmah** tour operatoru
- Agent može da pregleda i koriguje pre slanja
- **Bezbedno za testiranje** - ne utiče na stock

**Kada koristiti:**
- ✅ Za wire transfer plaćanja
- ✅ Za testiranje
- ✅ Kada želimo manuelnu potvrdu

```typescript
// Primer: Registracija našeg aranžmana
const response = await orsAuthService.post(
  `/offer/${tourOperator}/${hashCode}/register?test=true`,
  {
    Passengers: [
      {
        PassengerType: 'D', // Adult
        FirstName: 'Marko',
        LastName: 'Marković',
        BirthDate: '1990-01-01',
      }
    ],
    Customer: {
      FirstName: 'Marko',
      LastName: 'Marković',
      Email: 'marko@example.com',
      Phone: '+381641234567',
      Address: 'Bulevar Kralja Aleksandra 1',
      City: 'Beograd',
      ZIPCode: '11000',
      Country: 'RS',
    }
  }
);
```

---

### **2. Booking (Direktna Rezervacija)**

**Endpoint:** `POST /offer/{TourOperator}/{HashCode}/booking`

**Šta radi:**
- Kreira **potvrđenu** rezervaciju
- Šalje **odmah** tour operatoru
- **Utiče na stock** - smanjuje dostupnost
- Može kreirati **cancellation fees**

**Kada koristiti:**
- ✅ Za direktna plaćanja
- ✅ Kada smo sigurni u rezervaciju
- ✅ Production bookings

```typescript
// Primer: Direktna rezervacija
const response = await orsAuthService.post(
  `/offer/${tourOperator}/${hashCode}/booking`,
  {
    Passengers: [...],
    Customer: {...},
    ExtraServices: [
      {
        Type: 'EX',
        Code: '1040',
        Count: 2,
        TravelersList: [1, 2]
      }
    ]
  }
);
```

---

### **3. Booking Option (Opciona Rezervacija)**

**Endpoint:** `POST /offer/{TourOperator}/{HashCode}/booking_copy`

**Šta radi:**
- Kreira **opcionu** rezervaciju
- Može se **otkazati bez penala** u određenom periodu
- Automatski se potvrđuje ili otkazuje nakon isteka

**Kada koristiti:**
- ✅ Kada klijent nije siguran
- ✅ Za "hold" rezervacije
- ✅ Kada čekamo plaćanje

```typescript
// Primer: Opciona rezervacija
const response = await orsAuthService.post(
  `/offer/${tourOperator}/${hashCode}/booking_copy`,
  {
    Passengers: [...],
    Customer: {...}
  }
);

// Response sadrži:
// - OptionDate: "2026-01-27 23:59:59" (kada ističe)
// - OptionsStatusAfterExpiration: "confirmation" ili "cancellation"
```

---

## 📥 **PREUZIMANJE ARANŽMANA OD ORS-a**

### **1. Get Booking Information**

**Endpoint:** `GET /booking/by-id/{BookingCode}`

**Šta radi:**
- Preuzima informacije o postojećoj rezervaciji
- Vraća trenutni status
- Sve putnike i servise

```typescript
// Primer: Preuzimanje rezervacije
const booking = await orsAuthService.get(
  `/booking/by-id/${bookingCode}`
);

console.log(booking);
// {
//   StatusCode: { Status: 1, Text: "Status ok" },
//   Price: { TotalPrice: 1050, Currency: "EUR" },
//   Travelers: {...},
//   Services: {...}
// }
```

---

### **2. Search Our Bookings**

ORS API omogućava pretragu rezervacija po različitim kriterijumima (datum, status, klijent...).

---

## 🔄 **KOMPLETAN WORKFLOW - Naš Aranžman → ORS**

```
1. KREIRANJE ARANŽMANA U NAŠEM SISTEMU
   ↓
   Olympic Hub - ReservationArchitect
   - Klijent unosi podatke
   - Biramo hotel/usluge
   - Kalkulišemo cenu
   
2. SLANJE U ORS (3 opcije)
   ↓
   A) REGISTER (test/wire transfer)
      POST /offer/{TO}/{hash}/register
      → Kreira entry u ORS
      → Agent može pregledati
      → Manuelna potvrda
   
   B) BOOKING (direktno)
      POST /offer/{TO}/{hash}/booking
      → Potvrđena rezervacija
      → Šalje tour operatoru
      → Utiče na stock
   
   C) OPTION (opciona)
      POST /offer/{TO}/{hash}/booking_copy
      → Hold rezervacija
      → Može se otkazati bez penala
      → Auto-potvrda/otkazivanje

3. PRAĆENJE STATUSA
   ↓
   GET /booking/by-id/{bookingCode}
   → Provera statusa
   → Ažuriranje u našem sistemu

4. OTKAZIVANJE (ako treba)
   ↓
   POST /offer/{TO}/{hash}/cancel
   → Otkazuje rezervaciju
   → Vraća cancellation fees info
```

---

## 💡 **PRAKTIČNA IMPLEMENTACIJA**

### **Scenario 1: Klijent rezerviše preko našeg sistema**

```typescript
// 1. Klijent popuni formu u ReservationArchitect
const reservation = {
  hotel: 'Hotel Delfin',
  checkIn: '2026-07-01',
  checkOut: '2026-07-08',
  guests: [
    { firstName: 'Marko', lastName: 'Marković', birthDate: '1990-01-01' }
  ]
};

// 2. Pretražimo ORS za najbolju ponudu
const offers = await orsSearchService.searchHotels({
  dateFrom: reservation.checkIn,
  dateTo: reservation.checkOut,
  adults: 1,
  cityName: 'Porec'
});

// 3. Klijent bira ponudu
const selectedOffer = offers[0].offers[0];

// 4. Proverimo dostupnost
const availability = await orsAuthService.post(
  `/offer/${selectedOffer.tourOperator.code}/${selectedOffer.hashCode}/verify`,
  {
    Passengers: reservation.guests.map(g => ({
      PassengerType: 'D',
      FirstName: g.firstName,
      LastName: g.lastName,
      BirthDate: g.birthDate
    }))
  }
);

// 5. Ako je dostupno, kreiramo rezervaciju
if (availability.StatusCode.Status === 1) {
  const booking = await orsAuthService.post(
    `/offer/${selectedOffer.tourOperator.code}/${selectedOffer.hashCode}/register`,
    {
      Passengers: [...],
      Customer: {
        FirstName: 'Marko',
        LastName: 'Marković',
        Email: 'marko@example.com',
        Phone: '+381641234567'
      }
    }
  );
  
  // 6. Sačuvamo booking code u našoj bazi
  await saveToDatabase({
    bookingCode: booking.Record.BookingCode,
    orsBookingId: booking.Operator.BookingID,
    status: 'registered',
    totalPrice: booking.Price.TotalPrice
  });
}
```

---

### **Scenario 2: Sinhronizacija sa ORS-om**

```typescript
// Periodično proveravamo status naših rezervacija
async function syncBookingsWithORS() {
  const ourBookings = await getOurBookings({ status: 'pending' });
  
  for (const booking of ourBookings) {
    const orsBooking = await orsAuthService.get(
      `/booking/by-id/${booking.orsBookingCode}`
    );
    
    // Ažuriramo status u našoj bazi
    await updateBookingStatus(booking.id, {
      status: orsBooking.StatusCode.Text,
      currentPrice: orsBooking.Price.TotalPrice
    });
  }
}
```

---

## 🎯 **KLJUČNE PREDNOSTI**

### **Za Nas:**
1. ✅ **Širi izbor** - Pristup ORS mreži tour operatora
2. ✅ **Automatizacija** - API umesto manuelnog unosa
3. ✅ **Real-time dostupnost** - Trenutne informacije
4. ✅ **Centralizovano** - Sve rezervacije na jednom mestu

### **Za ORS:**
1. ✅ **Više rezervacija** - Mi im šaljemo naše klijente
2. ✅ **Šira distribucija** - Naša platforma kao kanal
3. ✅ **Automatizacija** - Manje manuelnog rada

---

## 📋 **POTREBNI KORACI ZA IMPLEMENTACIJU**

### **Faza 1: Booking Service** (Prioritet)
```typescript
// src/services/ors/orsBookingService.ts
export class OrsBookingService {
  async register(tourOperator, hashCode, data) { }
  async book(tourOperator, hashCode, data) { }
  async option(tourOperator, hashCode, data) { }
  async getBooking(bookingCode) { }
  async cancel(tourOperator, hashCode) { }
}
```

### **Faza 2: Integration sa ReservationArchitect**
- Dodati "Send to ORS" opciju
- Mapiranje naših podataka → ORS format
- Status tracking

### **Faza 3: Sync Service**
- Periodična sinhronizacija
- Status updates
- Price changes notification

---

## ✅ **ZAKLJUČAK**

**DA, MOŽEMO SLATI NAŠE ARANŽMANE ORS-u!**

### **3 Načina:**
1. **Register** - Za testiranje i wire transfer (preporučeno za početak)
2. **Booking** - Za direktne rezervacije (production)
3. **Option** - Za opcione rezervacije (hold)

### **Sledeći Koraci:**
1. ✅ Implementirati `orsBookingService.ts`
2. ✅ Dodati booking funkcionalnost u OrsProvider
3. ✅ Integrirati sa ReservationArchitect
4. ✅ Testirati sa `register` endpoint-om (test=true)
5. ✅ Production deployment

**Ovo otvara potpuno novu dimenziju - možemo biti i DISTRIBUTERI ORS ponuda! 🚀**

---

**Da li želiš da implementiram booking servis odmah?**
