# 📝 BOOKING FORM SYSTEM - Dokumentacija

**Created:** 2026-01-17  
**Version:** 1.0.0  
**Purpose:** Reusable booking form system za sve module (Solvex, TCT, OpenGreece, itd.)

---

## 🎯 **Pregled Sistema**

Booking Form System je **reusable** komponenta koja omogućava kreiranje rezervacija za različite API providere. Dizajnirana je da bude:
- ✅ **Modularna** - Lako se prilagođava različitim providerima
- ✅ **Scalable** - Podržava dinamički broj putnika
- ✅ **Consistent** - Isti UX za sve module
- ✅ **Type-safe** - Potpuna TypeScript podrška

---

## 📊 **Arhitektura**

### **Struktura fajlova:**

```
src/
├── components/
│   └── booking/
│       ├── BookingModal.tsx          # Glavni modal wrapper
│       ├── BookingModal.css          # Stilovi
│       ├── GuestForm.tsx             # Forma za jednog putnika
│       ├── GuestForm.css             # Stilovi za guest form
│       ├── BookingSummary.tsx        # Pregled rezervacije
│       └── BookingSuccess.tsx        # Success screen
│
├── services/
│   └── booking/
│       ├── bookingService.ts         # Generic booking logic
│       ├── solvexBookingAdapter.ts   # Solvex-specific adapter
│       ├── tctBookingAdapter.ts      # TCT-specific adapter (future)
│       └── openGreeceBookingAdapter.ts # OpenGreece adapter (future)
│
└── types/
    └── booking.types.ts              # Shared TypeScript types
```

---

## 🏗️ **Core Components**

### **1. BookingModal.tsx** (Main Component)

**Odgovornosti:**
- Renderuje modal overlay
- Upravlja state-om svih putnika
- Validacija pre submit-a
- Poziva adapter za specifičan provider

**Props:**
```typescript
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: 'solvex' | 'tct' | 'opengreece';
  bookingData: {
    hotelName: string;
    location: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    roomType: string;
    adults: number;
    children: number;
    totalPrice: number;
    currency: string;
    // Provider-specific data
    providerData: any;
  };
  onSuccess: (bookingId: string) => void;
  onError: (error: string) => void;
}
```

**State:**
```typescript
interface BookingState {
  mainGuest: Guest;
  additionalGuests: Guest[];
  specialRequests: string;
  termsAccepted: boolean;
  isSubmitting: boolean;
  validationErrors: Record<string, string>;
}
```

---

### **2. GuestForm.tsx** (Reusable Component)

**Odgovornosti:**
- Renderuje formu za jednog putnika
- Validacija input-a
- Razlikuje nosioca od ostalih putnika
- Razlikuje odrasle od dece

**Props:**
```typescript
interface GuestFormProps {
  guestNumber: number;        // 1, 2, 3...
  isMainGuest: boolean;        // true za nosioca
  isChild: boolean;            // true za dete
  guestData: Guest;
  onChange: (data: Guest) => void;
  errors?: Record<string, string>;
}
```

**Guest Type:**
```typescript
interface Guest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;        // YYYY-MM-DD
  passportNumber: string;
  nationality: string;
  email?: string;             // Samo za nosioca
  phone?: string;             // Samo za nosioca
}
```

---

### **3. BookingSummary.tsx**

**Odgovornosti:**
- Prikazuje pregled rezervacije
- Prikazuje sve putnike
- Prikazuje ukupnu cenu
- Prikazuje uslove rezervacije

**Props:**
```typescript
interface BookingSummaryProps {
  bookingData: BookingModalProps['bookingData'];
  guests: Guest[];
  specialRequests: string;
}
```

---

### **4. BookingSuccess.tsx**

**Odgovornosti:**
- Prikazuje success screen nakon rezervacije
- Prikazuje booking ID
- Prikazuje status rezervacije
- Opcije za download voucher-a

**Props:**
```typescript
interface BookingSuccessProps {
  bookingId: string;
  status: 'confirmed' | 'pending' | 'on-request';
  provider: string;
  onClose: () => void;
}
```

---

## 🔌 **Adapter Pattern**

### **Zašto Adapter Pattern?**

Svaki API provider (Solvex, TCT, OpenGreece) ima različitu strukturu request-a i response-a. Adapter pattern omogućava:
- ✅ Jedinstvenu formu za sve providere
- ✅ Lako dodavanje novih providera
- ✅ Centralizovanu validaciju
- ✅ Lakše testiranje

---

### **Generic Booking Service**

```typescript
// src/services/booking/bookingService.ts

export interface BookingAdapter {
  createBooking(data: BookingRequest): Promise<BookingResponse>;
  validateBooking(data: BookingRequest): Promise<ValidationResult>;
  getBookingStatus(bookingId: string): Promise<BookingStatus>;
}

export interface BookingRequest {
  provider: string;
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: Guest[];
  specialRequests?: string;
  totalPrice: number;
  providerSpecificData?: any;
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  status?: 'confirmed' | 'pending' | 'on-request';
  error?: string;
  providerResponse?: any;
}
```

---

### **Solvex Adapter**

```typescript
// src/services/booking/solvexBookingAdapter.ts

import { BookingAdapter, BookingRequest, BookingResponse } from './bookingService';
import { makeSoapRequest } from '../../utils/solvexSoapClient';

export class SolvexBookingAdapter implements BookingAdapter {
  async createBooking(data: BookingRequest): Promise<BookingResponse> {
    try {
      // 1. Transformiši generic BookingRequest u Solvex format
      const solvexRequest = this.transformToSolvexFormat(data);
      
      // 2. Pozovi Solvex SOAP API
      const response = await makeSoapRequest('CreateBooking', solvexRequest);
      
      // 3. Transformiši Solvex response u generic format
      return this.transformFromSolvexFormat(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private transformToSolvexFormat(data: BookingRequest): any {
    // Solvex-specific transformation
    return {
      guid: data.providerSpecificData.guid,
      hotelKey: parseInt(data.hotelId),
      roomTypeKey: parseInt(data.roomTypeId),
      dateFrom: data.checkIn,
      dateTo: data.checkOut,
      mainGuest: {
        firstName: data.guests[0].firstName,
        lastName: data.guests[0].lastName,
        email: data.guests[0].email,
        phone: data.guests[0].phone,
        // ... ostala polja
      },
      additionalGuests: data.guests.slice(1).map(guest => ({
        firstName: guest.firstName,
        lastName: guest.lastName,
        // ... ostala polja
      })),
      specialRequests: data.specialRequests,
      totalPrice: data.totalPrice
    };
  }

  private transformFromSolvexFormat(response: any): BookingResponse {
    // Transform Solvex response to generic format
    return {
      success: true,
      bookingId: response.bookingId,
      status: this.mapSolvexStatus(response.status),
      providerResponse: response
    };
  }

  private mapSolvexStatus(solvexStatus: string): 'confirmed' | 'pending' | 'on-request' {
    // Map Solvex-specific status to generic status
    switch (solvexStatus) {
      case 'CONFIRMED': return 'confirmed';
      case 'PENDING': return 'pending';
      default: return 'on-request';
    }
  }

  async validateBooking(data: BookingRequest): Promise<ValidationResult> {
    // Solvex-specific validation
    return { isValid: true };
  }

  async getBookingStatus(bookingId: string): Promise<BookingStatus> {
    // Solvex-specific status check
    return { status: 'confirmed' };
  }
}
```

---

## 🎨 **UI/UX Design Principles**

### **1. Consistent Styling**

**Color Palette:**
```css
/* Primary colors */
--booking-primary: #3b82f6;
--booking-success: #10b981;
--booking-error: #ef4444;
--booking-warning: #f59e0b;

/* Background */
--booking-bg-dark: #1e1e2e;
--booking-bg-light: #2a2a3e;

/* Text */
--booking-text-primary: #f8fafc;
--booking-text-secondary: #cbd5e1;
--booking-text-muted: #64748b;
```

**Typography:**
```css
/* Headings */
--booking-font-heading: 'Inter', sans-serif;
--booking-font-body: 'Inter', sans-serif;

/* Sizes */
--booking-text-xs: 12px;
--booking-text-sm: 14px;
--booking-text-base: 16px;
--booking-text-lg: 18px;
--booking-text-xl: 20px;
```

---

### **2. Responsive Design**

**Breakpoints:**
```css
/* Mobile */
@media (max-width: 640px) {
  .booking-modal {
    width: 100%;
    height: 100vh;
    border-radius: 0;
  }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  .booking-modal {
    width: 90%;
    max-width: 700px;
  }
}

/* Desktop */
@media (min-width: 1025px) {
  .booking-modal {
    width: 80%;
    max-width: 900px;
  }
}
```

---

### **3. Animations**

**Modal Entrance:**
```css
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.booking-modal {
  animation: modalFadeIn 0.2s ease-out;
}
```

**Form Validation:**
```css
.input-error {
  border-color: var(--booking-error);
  animation: shake 0.3s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
```

---

## 🔐 **Validation Rules**

### **Nosilac rezervacije (Main Guest):**

| Field | Rule | Error Message |
|-------|------|---------------|
| firstName | Min 2 chars, only letters | "Ime mora sadržati minimum 2 slova" |
| lastName | Min 2 chars, only letters | "Prezime mora sadržati minimum 2 slova" |
| email | Valid email format | "Unesite validnu email adresu" |
| phone | Valid international format | "Unesite validan broj telefona" |
| dateOfBirth | Must be 18+ years old | "Nosilac mora biti punoletan (18+)" |
| passportNumber | Min 6 chars | "Broj pasoša mora imati minimum 6 karaktera" |
| nationality | Required | "Nacionalnost je obavezna" |

---

### **Ostali putnici (Additional Guests):**

| Field | Rule | Error Message |
|-------|------|---------------|
| firstName | Min 2 chars, only letters | "Ime mora sadržati minimum 2 slova" |
| lastName | Min 2 chars, only letters | "Prezime mora sadržati minimum 2 slova" |
| dateOfBirth | Valid date | "Unesite validan datum rođenja" |
| passportNumber | Min 6 chars | "Broj pasoša mora imati minimum 6 karaktera" |
| nationality | Required | "Nacionalnost je obavezna" |

---

### **Deca (Children):**

| Field | Rule | Error Message |
|-------|------|---------------|
| dateOfBirth | Must be under 18 | "Datum rođenja ne odgovara kategoriji deteta" |

---

## 📝 **Validation Implementation**

```typescript
// src/utils/bookingValidation.ts

export const validateGuest = (
  guest: Guest,
  isMainGuest: boolean,
  isChild: boolean
): Record<string, string> => {
  const errors: Record<string, string> = {};

  // First name
  if (!guest.firstName || guest.firstName.length < 2) {
    errors.firstName = 'Ime mora sadržati minimum 2 slova';
  }
  if (!/^[a-zA-ZčćžšđČĆŽŠĐ\s]+$/.test(guest.firstName)) {
    errors.firstName = 'Ime može sadržati samo slova';
  }

  // Last name
  if (!guest.lastName || guest.lastName.length < 2) {
    errors.lastName = 'Prezime mora sadržati minimum 2 slova';
  }
  if (!/^[a-zA-ZčćžšđČĆŽŠĐ\s]+$/.test(guest.lastName)) {
    errors.lastName = 'Prezime može sadržati samo slova';
  }

  // Email (only for main guest)
  if (isMainGuest) {
    if (!guest.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
      errors.email = 'Unesite validnu email adresu';
    }

    // Phone (only for main guest)
    if (!guest.phone || !/^\+?[0-9\s\-()]+$/.test(guest.phone)) {
      errors.phone = 'Unesite validan broj telefona';
    }
  }

  // Date of birth
  if (!guest.dateOfBirth) {
    errors.dateOfBirth = 'Datum rođenja je obavezan';
  } else {
    const birthDate = new Date(guest.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (isMainGuest && age < 18) {
      errors.dateOfBirth = 'Nosilac mora biti punoletan (18+)';
    }

    if (isChild && age >= 18) {
      errors.dateOfBirth = 'Datum rođenja ne odgovara kategoriji deteta';
    }
  }

  // Passport number
  if (!guest.passportNumber || guest.passportNumber.length < 6) {
    errors.passportNumber = 'Broj pasoša mora imati minimum 6 karaktera';
  }

  // Nationality
  if (!guest.nationality) {
    errors.nationality = 'Nacionalnost je obavezna';
  }

  return errors;
};
```

---

## 🌍 **Nationality Dropdown**

### **Lista nacionalnosti:**

```typescript
// src/constants/nationalities.ts

export const NATIONALITIES = [
  { code: 'RS', name: 'Srbija', nameEn: 'Serbia' },
  { code: 'HR', name: 'Hrvatska', nameEn: 'Croatia' },
  { code: 'BA', name: 'Bosna i Hercegovina', nameEn: 'Bosnia and Herzegovina' },
  { code: 'ME', name: 'Crna Gora', nameEn: 'Montenegro' },
  { code: 'MK', name: 'Severna Makedonija', nameEn: 'North Macedonia' },
  { code: 'SI', name: 'Slovenija', nameEn: 'Slovenia' },
  { code: 'BG', name: 'Bugarska', nameEn: 'Bulgaria' },
  { code: 'RO', name: 'Rumunija', nameEn: 'Romania' },
  { code: 'GR', name: 'Grčka', nameEn: 'Greece' },
  { code: 'TR', name: 'Turska', nameEn: 'Turkey' },
  { code: 'DE', name: 'Nemačka', nameEn: 'Germany' },
  { code: 'AT', name: 'Austrija', nameEn: 'Austria' },
  { code: 'IT', name: 'Italija', nameEn: 'Italy' },
  { code: 'FR', name: 'Francuska', nameEn: 'France' },
  { code: 'GB', name: 'Velika Britanija', nameEn: 'United Kingdom' },
  { code: 'US', name: 'Sjedinjene Američke Države', nameEn: 'United States' },
  // ... ostale zemlje
];
```

---

## 🚀 **Usage Example**

### **Kako koristiti u Solvex modulu:**

```typescript
// src/pages/GlobalHubSearch.tsx

import { BookingModal } from '../components/booking/BookingModal';
import { SolvexBookingAdapter } from '../services/booking/solvexBookingAdapter';

const GlobalHubSearch = () => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleReserveClick = (room) => {
    setSelectedRoom(room);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = (bookingId) => {
    console.log('Booking successful:', bookingId);
    // Show success notification
    // Redirect to booking confirmation page
  };

  const handleBookingError = (error) => {
    console.error('Booking failed:', error);
    // Show error notification
  };

  return (
    <>
      {/* Hotel results */}
      <button onClick={() => handleReserveClick(room)}>
        Rezerviši
      </button>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        provider="solvex"
        bookingData={{
          hotelName: selectedRoom?.hotel.name,
          location: selectedRoom?.hotel.location,
          checkIn: searchParams.checkIn,
          checkOut: searchParams.checkOut,
          nights: calculateNights(searchParams.checkIn, searchParams.checkOut),
          roomType: selectedRoom?.roomType,
          adults: searchParams.adults,
          children: searchParams.children,
          totalPrice: selectedRoom?.price,
          currency: 'EUR',
          providerData: {
            guid: authToken,
            hotelKey: selectedRoom?.hotel.id,
            roomTypeKey: selectedRoom?.roomTypeId
          }
        }}
        onSuccess={handleBookingSuccess}
        onError={handleBookingError}
      />
    </>
  );
};
```

---

## 📊 **Implementation Phases**

### **Phase 1: Core Components (2h)**
- [ ] Create `BookingModal.tsx`
- [ ] Create `GuestForm.tsx`
- [ ] Create `BookingSummary.tsx`
- [ ] Create `BookingSuccess.tsx`
- [ ] Create CSS files

### **Phase 2: Validation (1h)**
- [ ] Implement `bookingValidation.ts`
- [ ] Add validation to GuestForm
- [ ] Add error messages

### **Phase 3: Adapter Pattern (1.5h)**
- [ ] Create `bookingService.ts`
- [ ] Create `solvexBookingAdapter.ts`
- [ ] Implement SOAP integration

### **Phase 4: Integration (1h)**
- [ ] Integrate with GlobalHubSearch
- [ ] Add onClick handlers
- [ ] Test end-to-end flow

### **Phase 5: Testing (30min)**
- [ ] Test with different guest combinations
- [ ] Test validation
- [ ] Test error scenarios

---

## 🔮 **Future Enhancements**

### **Phase 6: TCT Adapter** (Future)
- [ ] Create `tctBookingAdapter.ts`
- [ ] Map TCT API to generic format
- [ ] Test with TCT bookings

### **Phase 7: OpenGreece Adapter** (Future)
- [ ] Create `openGreeceBookingAdapter.ts`
- [ ] Map OpenGreece API to generic format
- [ ] Test with OpenGreece bookings

### **Phase 8: Payment Integration** (Future)
- [ ] Add payment step to booking flow
- [ ] Integrate Stripe/PayPal
- [ ] Update adapters to handle payment

---

## 📝 **Notes**

### **Design Decisions:**

1. **Adapter Pattern:** Izabran zbog fleksibilnosti i mogućnosti dodavanja novih providera bez menjanja core komponenti.

2. **Reusable GuestForm:** Jedna komponenta za sve putnike, sa props-ima koji određuju ponašanje (isMainGuest, isChild).

3. **Centralized Validation:** Sva validacija u jednom fajlu za lakše održavanje.

4. **TypeScript First:** Sve komponente su fully typed za bolju developer experience.

---

## 🎯 **Success Criteria**

Booking Form System se smatra uspešnim ako:
- ✅ Može se koristiti za Solvex, TCT i OpenGreece bez izmena core komponenti
- ✅ Validacija radi konzistentno za sve providere
- ✅ UX je identičan bez obzira na provider
- ✅ Lako se dodaju novi provideri
- ✅ Kod je maintainable i testable

---

**Last Updated:** 2026-01-17  
**Version:** 1.0.0  
**Status:** 🟡 In Development (Solvex implementation in progress)
