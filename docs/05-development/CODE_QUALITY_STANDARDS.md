# 💎 OlympicHub - Code Quality Standards

## 🎯 Cilj

Svaka linija koda u OlympicHub-u mora biti napisana po **najnovijim standardima** i **best practices** u programiranju. Aplikacija mora funkcionisati **besprekorno**, biti **modularna**, **skalabilna** i **maintainable**.

## 📋 Principi Razvoja

### 1. **SOLID Principi**

#### S - Single Responsibility Principle
```typescript
// ❌ LOŠE - Klasa radi previše stvari
class Hotel {
  saveToDatabase() { }
  sendEmail() { }
  calculatePrice() { }
  generateReport() { }
}

// ✅ DOBRO - Svaka klasa ima jednu odgovornost
class Hotel {
  // Samo hotel data
}

class HotelRepository {
  save(hotel: Hotel) { }
}

class EmailService {
  sendHotelConfirmation(hotel: Hotel) { }
}

class PricingService {
  calculatePrice(hotel: Hotel) { }
}
```

#### O - Open/Closed Principle
```typescript
// ✅ DOBRO - Otvoren za proširenje, zatvoren za modifikaciju
interface PaymentMethod {
  process(amount: number): Promise<PaymentResult>;
}

class CreditCardPayment implements PaymentMethod {
  async process(amount: number) { /* ... */ }
}

class PayPalPayment implements PaymentMethod {
  async process(amount: number) { /* ... */ }
}

// Dodavanje nove metode plaćanja ne zahteva izmenu postojećeg koda
class CryptoPayment implements PaymentMethod {
  async process(amount: number) { /* ... */ }
}
```

#### L - Liskov Substitution Principle
```typescript
// ✅ DOBRO - Podklase mogu zameniti baznu klasu
abstract class Accommodation {
  abstract getPrice(): number;
  abstract getCapacity(): number;
}

class Hotel extends Accommodation {
  getPrice() { return this.basePrice; }
  getCapacity() { return this.rooms.length * 2; }
}

class Apartment extends Accommodation {
  getPrice() { return this.rentPrice; }
  getCapacity() { return this.beds; }
}
```

#### I - Interface Segregation Principle
```typescript
// ❌ LOŠE - Prevelik interface
interface Booking {
  createBooking(): void;
  cancelBooking(): void;
  modifyBooking(): void;
  sendConfirmation(): void;
  processPayment(): void;
  generateInvoice(): void;
}

// ✅ DOBRO - Razdvojeni interfejsi
interface BookingManagement {
  createBooking(): void;
  cancelBooking(): void;
  modifyBooking(): void;
}

interface BookingNotification {
  sendConfirmation(): void;
}

interface BookingPayment {
  processPayment(): void;
  generateInvoice(): void;
}
```

#### D - Dependency Inversion Principle
```typescript
// ❌ LOŠE - Direktna zavisnost od konkretne implementacije
class BookingService {
  private database = new MySQLDatabase();
  
  save(booking: Booking) {
    this.database.insert(booking);
  }
}

// ✅ DOBRO - Zavisnost od apstrakcije
interface Database {
  insert(data: any): Promise<void>;
  find(id: string): Promise<any>;
}

class BookingService {
  constructor(private database: Database) {}
  
  async save(booking: Booking) {
    await this.database.insert(booking);
  }
}

// Možemo lako zameniti implementaciju
const service = new BookingService(new SupabaseDatabase());
```

### 2. **DRY (Don't Repeat Yourself)**

```typescript
// ❌ LOŠE - Duplirani kod
function calculateHotelPrice(hotel: Hotel, nights: number) {
  let price = hotel.basePrice * nights;
  if (nights > 7) price *= 0.9;
  if (nights > 14) price *= 0.85;
  return price;
}

function calculateApartmentPrice(apartment: Apartment, nights: number) {
  let price = apartment.basePrice * nights;
  if (nights > 7) price *= 0.9;
  if (nights > 14) price *= 0.85;
  return price;
}

// ✅ DOBRO - Reusable funkcija
function calculateAccommodationPrice(
  basePrice: number,
  nights: number,
  discounts: DiscountRule[]
) {
  let price = basePrice * nights;
  
  for (const discount of discounts) {
    if (nights >= discount.minNights) {
      price *= (1 - discount.percentage);
    }
  }
  
  return price;
}
```

### 3. **KISS (Keep It Simple, Stupid)**

```typescript
// ❌ LOŠE - Prekomplikovano
function isValidEmail(email: string): boolean {
  const regex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
  return regex.test(email);
}

// ✅ DOBRO - Jednostavno i čitljivo
function isValidEmail(email: string): boolean {
  return email.includes('@') && email.includes('.');
}

// Ili koristiti postojeću biblioteku
import { isEmail } from 'validator';
```

### 4. **YAGNI (You Aren't Gonna Need It)**

```typescript
// ❌ LOŠE - Implementacija funkcionalnosti koja možda nikad neće biti potrebna
class Hotel {
  id: string;
  name: string;
  // ... osnovni podaci
  
  // Možda će nam trebati u budućnosti?
  futureFeature1?: any;
  futureFeature2?: any;
  futureFeature3?: any;
  
  // Možda će nam trebati integracija sa 10 različitih sistema?
  integrations?: Map<string, any>;
}

// ✅ DOBRO - Implementiraj samo ono što trenutno treba
class Hotel {
  id: string;
  name: string;
  location: string;
  category: number;
  // Samo potrebni podaci
}

// Dodaj nove feature-e kada zaista zatrebaju
```

## 🏗️ Arhitekturalni Paterni

### 1. **Repository Pattern**

```typescript
// Interface za data access
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Implementacija za Hotel
class HotelRepository implements Repository<Hotel> {
  constructor(private db: Database) {}
  
  async findById(id: string): Promise<Hotel | null> {
    const { data, error } = await this.db
      .from('hotels')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return this.mapToHotel(data);
  }
  
  // ... ostale metode
}
```

### 2. **Service Layer Pattern**

```typescript
// Business logika odvojena od data access-a
class BookingService {
  constructor(
    private bookingRepo: Repository<Booking>,
    private hotelRepo: Repository<Hotel>,
    private pricingService: PricingService,
    private emailService: EmailService
  ) {}
  
  async createBooking(request: BookingRequest): Promise<Booking> {
    // 1. Validacija
    this.validateBookingRequest(request);
    
    // 2. Provera dostupnosti
    const hotel = await this.hotelRepo.findById(request.hotelId);
    if (!hotel) throw new Error('Hotel not found');
    
    const isAvailable = await this.checkAvailability(hotel, request);
    if (!isAvailable) throw new Error('Not available');
    
    // 3. Kalkulacija cene
    const price = await this.pricingService.calculate(request);
    
    // 4. Kreiranje booking-a
    const booking = await this.bookingRepo.create({
      ...request,
      price,
      status: 'pending'
    });
    
    // 5. Slanje email-a
    await this.emailService.sendConfirmation(booking);
    
    return booking;
  }
}
```

### 3. **Factory Pattern**

```typescript
// Factory za kreiranje različitih tipova accommodation-a
interface AccommodationFactory {
  create(data: any): Accommodation;
}

class HotelFactory implements AccommodationFactory {
  create(data: HotelData): Hotel {
    return new Hotel({
      id: data.id,
      name: data.name,
      category: data.category,
      rooms: data.rooms.map(r => new Room(r))
    });
  }
}

class ApartmentFactory implements AccommodationFactory {
  create(data: ApartmentData): Apartment {
    return new Apartment({
      id: data.id,
      name: data.name,
      beds: data.beds,
      amenities: data.amenities
    });
  }
}

// Upotreba
const factory = type === 'hotel' 
  ? new HotelFactory() 
  : new ApartmentFactory();
  
const accommodation = factory.create(data);
```

### 4. **Observer Pattern (Pub/Sub)**

```typescript
// Event-driven arhitektura za komunikaciju između modula
class EventBus {
  private listeners = new Map<string, Function[]>();
  
  subscribe(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  publish(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }
}

// Upotreba
eventBus.subscribe('booking.created', (booking) => {
  emailService.sendConfirmation(booking);
  analyticsService.track('booking_created', booking);
  notificationService.notify('New booking created!');
});

eventBus.publish('booking.created', newBooking);
```

## 📝 Code Style Guidelines

### 1. **Naming Conventions**

```typescript
// ✅ DOBRO - Deskriptivna imena
const MAX_BOOKING_DAYS = 365;
const MIN_ADVANCE_BOOKING_DAYS = 1;

class HotelBookingService { }
interface UserAuthentication { }
type PaymentMethod = 'card' | 'paypal' | 'crypto';

function calculateTotalPriceWithDiscounts(
  basePrice: number,
  discountPercentage: number
): number {
  return basePrice * (1 - discountPercentage / 100);
}

// ❌ LOŠE - Nejasna imena
const x = 365;
const d = 1;

class HBS { }
interface UA { }
type PM = 'c' | 'p' | 'cr';

function calc(p: number, d: number): number {
  return p * (1 - d / 100);
}
```

### 2. **TypeScript Best Practices**

```typescript
// ✅ DOBRO - Striktni tipovi
interface Hotel {
  id: string;
  name: string;
  category: 1 | 2 | 3 | 4 | 5;
  location: {
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  amenities: string[];
  createdAt: Date;
}

// ❌ LOŠE - any tipovi
interface Hotel {
  id: any;
  name: any;
  data: any;
}

// ✅ DOBRO - Generički tipovi
function findById<T>(
  collection: T[],
  id: string,
  idKey: keyof T
): T | undefined {
  return collection.find(item => item[idKey] === id);
}

// ✅ DOBRO - Utility types
type PartialHotel = Partial<Hotel>;
type RequiredHotel = Required<Hotel>;
type ReadonlyHotel = Readonly<Hotel>;
type HotelKeys = keyof Hotel;
type HotelValues = Hotel[keyof Hotel];
```

### 3. **Error Handling**

```typescript
// ✅ DOBRO - Custom error classes
class BookingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'BookingError';
  }
}

class NotFoundError extends BookingError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
  }
}

// Upotreba
try {
  const hotel = await hotelRepo.findById(id);
  if (!hotel) {
    throw new NotFoundError('Hotel', id);
  }
} catch (error) {
  if (error instanceof NotFoundError) {
    // Handle not found
  } else if (error instanceof BookingError) {
    // Handle booking error
  } else {
    // Handle unexpected error
  }
}
```

### 4. **Async/Await Best Practices**

```typescript
// ✅ DOBRO - Paralelno izvršavanje
async function getBookingDetails(bookingId: string) {
  const [booking, hotel, customer] = await Promise.all([
    bookingRepo.findById(bookingId),
    hotelRepo.findById(booking.hotelId),
    customerRepo.findById(booking.customerId)
  ]);
  
  return { booking, hotel, customer };
}

// ❌ LOŠE - Sekvencijalno izvršavanje (sporije)
async function getBookingDetails(bookingId: string) {
  const booking = await bookingRepo.findById(bookingId);
  const hotel = await hotelRepo.findById(booking.hotelId);
  const customer = await customerRepo.findById(booking.customerId);
  
  return { booking, hotel, customer };
}

// ✅ DOBRO - Error handling
async function createBooking(data: BookingData) {
  try {
    const booking = await bookingService.create(data);
    return { success: true, booking };
  } catch (error) {
    logger.error('Failed to create booking', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

## 🧪 Testing Standards

### 1. **Unit Tests**

```typescript
describe('PricingService', () => {
  let pricingService: PricingService;
  
  beforeEach(() => {
    pricingService = new PricingService();
  });
  
  it('should calculate correct price for 7 nights', () => {
    const result = pricingService.calculate({
      basePrice: 100,
      nights: 7
    });
    
    expect(result).toBe(700);
  });
  
  it('should apply 10% discount for 7+ nights', () => {
    const result = pricingService.calculate({
      basePrice: 100,
      nights: 7
    });
    
    expect(result).toBe(630); // 700 * 0.9
  });
});
```

### 2. **Integration Tests**

```typescript
describe('BookingService Integration', () => {
  it('should create booking end-to-end', async () => {
    // Arrange
    const hotel = await createTestHotel();
    const customer = await createTestCustomer();
    
    // Act
    const booking = await bookingService.create({
      hotelId: hotel.id,
      customerId: customer.id,
      checkIn: '2025-01-01',
      checkOut: '2025-01-07'
    });
    
    // Assert
    expect(booking.id).toBeDefined();
    expect(booking.status).toBe('confirmed');
    
    // Verify email was sent
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: customer.email,
        subject: expect.stringContaining('Booking Confirmation')
      })
    );
  });
});
```

## 📊 Performance Optimization

### 1. **Memoization**

```typescript
// Cache expensive calculations
const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

const expensiveCalculation = memoize((a: number, b: number) => {
  // Complex calculation
  return a * b;
});
```

### 2. **Lazy Loading**

```typescript
// React lazy loading
const HotelModule = lazy(() => import('./modules/hotels/HotelModule'));
const PricingModule = lazy(() => import('./modules/pricing/PricingModule'));

// Suspense fallback
<Suspense fallback={<LoadingSpinner />}>
  <HotelModule />
</Suspense>
```

### 3. **Debouncing & Throttling**

```typescript
// Debounce search input
const debouncedSearch = debounce((query: string) => {
  searchService.search(query);
}, 300);

// Throttle scroll events
const throttledScroll = throttle(() => {
  handleScroll();
}, 100);
```

## 🔒 Security Best Practices

### 1. **Input Validation**

```typescript
import { z } from 'zod';

const BookingSchema = z.object({
  hotelId: z.string().uuid(),
  customerId: z.string().uuid(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().min(1).max(10)
});

function createBooking(data: unknown) {
  const validated = BookingSchema.parse(data);
  // Now we know data is valid
}
```

### 2. **SQL Injection Prevention**

```typescript
// ✅ DOBRO - Prepared statements
const { data } = await supabase
  .from('hotels')
  .select('*')
  .eq('id', hotelId); // Safe

// ❌ LOŠE - String concatenation
const query = `SELECT * FROM hotels WHERE id = '${hotelId}'`; // Vulnerable!
```

### 3. **XSS Prevention**

```typescript
// ✅ DOBRO - Sanitize user input
import DOMPurify from 'dompurify';

const sanitizedHTML = DOMPurify.sanitize(userInput);
```

## 📚 Documentation Standards

```typescript
/**
 * Calculates the total price for a hotel booking including all discounts and taxes.
 * 
 * @param basePrice - The base price per night in EUR
 * @param nights - Number of nights (must be >= 1)
 * @param discounts - Array of applicable discount rules
 * @returns The final price after applying all discounts and taxes
 * 
 * @example
 * ```typescript
 * const price = calculateTotalPrice(100, 7, [
 *   { type: 'early_bird', percentage: 10 }
 * ]);
 * // Returns: 630 (700 * 0.9)
 * ```
 * 
 * @throws {ValidationError} If nights < 1 or basePrice < 0
 */
function calculateTotalPrice(
  basePrice: number,
  nights: number,
  discounts: Discount[]
): number {
  // Implementation
}
```

---

**Cilj**: Svaka linija koda mora biti **čista**, **testirana**, **dokumentovana** i **maintainable**! 💎
