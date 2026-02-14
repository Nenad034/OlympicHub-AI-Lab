# ðŸ“‹ TODO LIST - OlympicHub Development Roadmap

**Last Updated:** 2026-01-26  
**Status:** Production Ready - Ready for Deployment  
**Pending:** Off-site Backup System (Äeka dodatne informacije)

---

## ðŸ”´ **FAZA 1: DEPLOY & VALIDATE** (Prioritet: CRITICAL)

### **Danas - Deployment** (1-2 sata)

#### âœ… **1. GitHub Repository - Make Private**
- [ ] Otvori https://github.com/Nenad034/olympichub034
- [ ] Settings â†’ Danger Zone â†’ Change visibility
- [ ] Izaberi "Make private"
- [ ] Potvrdi sa imenom repo-a
- [ ] Verifikuj da je repo private

**Vreme:** 2 minuta  
**Prioritet:** ðŸ”´ CRITICAL

---

#### âœ… **2. GitHub Security Setup**
- [ ] Settings â†’ Code security and analysis
- [ ] Enable Dependabot alerts
- [ ] Enable Dependabot security updates
- [ ] Enable Secret scanning
- [ ] Enable Code scanning (CodeQL)
- [ ] Settings â†’ Branches â†’ Add rule
  - [ ] Require pull request reviews
  - [ ] Require status checks
  - [ ] Include administrators

**Vreme:** 5 minuta  
**Prioritet:** ðŸ”´ CRITICAL

---

#### âœ… **3. Vercel Deployment**

**VeÄ‡ imaÅ¡ Vercel nalog âœ…**

```bash
# 1. Install Vercel CLI (ako nije instaliran)
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy (development)
vercel

# 4. KonfiguriÅ¡i environment variables u Vercel Dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_TELEGRAM_BOT_TOKEN (optional)
# - VITE_TELEGRAM_CHAT_ID (optional)

# 5. Production deploy
vercel --prod
```

**Checklist:**
- [ ] Vercel CLI instaliran
- [ ] Login u Vercel
- [ ] Deploy development
- [ ] Konfigurisani environment variables
- [ ] Production deploy
- [ ] Test deployment URL
- [ ] Verifikuj da sve radi

**Vreme:** 10-15 minuta  
**Prioritet:** ðŸ”´ CRITICAL

---

#### âœ… **4. Supabase Production Setup**

**VeÄ‡ imaÅ¡ Supabase nalog âœ…**

```bash
# 1. Login u Supabase
supabase login

# 2. Link projekat
supabase link --project-ref your-project-ref

# 3. Deploy Edge Functions
supabase functions deploy tct-proxy
supabase functions deploy ai-monitor-pulse
supabase functions deploy telegram-webhook

# 4. Set Production Secrets
supabase secrets set TCT_USERNAME=your-tct-username
supabase secrets set TCT_PASSWORD=your-tct-password
supabase secrets set TCT_API_SOURCE=B2B
supabase secrets set TELEGRAM_BOT_TOKEN=your-telegram-token
supabase secrets set TELEGRAM_CHAT_ID=your-chat-id

# 5. Verify secrets
supabase secrets list
```

**Checklist:**
- [ ] Supabase CLI instaliran
- [ ] Login u Supabase
- [ ] Projekat linked
- [ ] Edge Functions deployed
  - [ ] tct-proxy
  - [ ] ai-monitor-pulse
  - [ ] telegram-webhook
- [ ] Secrets postavljeni
  - [ ] TCT_USERNAME
  - [ ] TCT_PASSWORD
  - [ ] TCT_API_SOURCE
  - [ ] TELEGRAM_BOT_TOKEN
  - [ ] TELEGRAM_CHAT_ID
- [ ] Verifikuj da Edge Functions rade

**Vreme:** 15-20 minuta  
**Prioritet:** ðŸ”´ CRITICAL

---

#### âœ… **5. Production Testing**

**Test sve feature-e:**

- [ ] **TCT API Connection**
  - [ ] Otvori `/tct-test`
  - [ ] Run Tests
  - [ ] Verifikuj da svi testovi prolaze

- [ ] **Hotel Search**
  - [ ] Otvori `/tct`
  - [ ] Klikni "Search" tab
  - [ ] Popuni formu
  - [ ] Klikni "Search Hotels"
  - [ ] Verifikuj rezultate

- [ ] **AI Watchdog**
  - [ ] Otvori `/watchdog`
  - [ ] Proveri Overview tab
  - [ ] Proveri Health tab
  - [ ] Proveri Business tab
  - [ ] Proveri da se stats refresh-uju

- [ ] **HITL System**
  - [ ] Simuliraj 5xx greÅ¡ku (ako moguÄ‡e)
  - [ ] Proveri Telegram notifikaciju
  - [ ] Test Approve/Reject dugmadi

**Vreme:** 30-45 minuta  
**Prioritet:** ðŸ”´ CRITICAL

---

## ðŸ”´ **FAZA 1.5: OFF-SITE BACKUP SYSTEM** (Prioritet: CRITICAL - DAILY REMINDER)

### **â¸ï¸ ÄŒEKA DODATNE INFORMACIJE**

**Status:** ðŸŸ¡ PENDING  
**Daily Reminder:** âœ… ENABLED  
**Dodato:** 2026-01-17

---

#### ðŸŽ¯ **Cilj:**
Implementirati potpuno automatizovan Disaster Recovery sistem za Supabase bazu podataka sa svakodnevnim enkriptovanim backup-om na eksternoj lokaciji.

---

#### ðŸ“‹ **Specifikacija zadatka:**

**1. GitHub Actions Workflow (.github/workflows/db-backup.yml)**
- [ ] Cron job: Svaki dan u 02:00h ujutru
- [ ] Koristi `pg_dump` alat za SQL dump
- [ ] Obuhvata strukturu (schema) i podatke

**2. Bezbednost i Enkripcija (KRITIÄŒNO)**
- [ ] Kompresija .sql fajla
- [ ] Enkripcija sa GPG ili sliÄnim alatom
- [ ] Jak asimetriÄni kljuÄ ili lozinka
- [ ] Lozinka i DB URL u GitHub Actions Secrets (NIKADA u kodu)

**3. Eksterna Lokacija**
- [ ] **OPCIJA A:** AWS S3 bucket (preporuÄeno)
- [ ] **OPCIJA B:** GitHub Artifacts/Release (30 dana retention)
- [ ] **ODLUKA:** ÄŒeka analizu trenutne konfiguracije

**4. Notifikacije**
- [ ] Telegram alert ako backup ne uspe
- [ ] Detalji greÅ¡ke u notifikaciji
- [ ] Koristi postojeÄ‡i Telegram bot

**5. Retention Policy**
- [ ] Automatsko brisanje backup-a starijih od 30 dana
- [ ] Optimizacija prostora

---

#### ðŸ“¦ **OÄekivani Output:**

- [ ] Kompletan `.github/workflows/db-backup.yml` fajl
- [ ] Lista GitHub Secrets varijabli koje treba dodati
- [ ] Restore uputstvo (komanda za dekriptovanje i restore)
- [ ] Test procedure za verifikaciju backup-a

---

#### âš ï¸ **Pre Implementacije - Potrebne Informacije:**

**Pitanja za korisnika:**
1. Da li veÄ‡ imamo AWS nalog? (S3 bucket preporuka)
2. Koja je veliÄina trenutne baze? (za procenu storage potreba)
3. Da li postoje compliance zahtevi za backup retention? (GDPR, etc.)
4. Koji je prioritet: Cijena vs Pouzdanost?

**TehniÄki zahtevi:**
- [ ] Supabase DB connection string
- [ ] AWS credentials (ako koristimo S3)
- [ ] GPG key pair generisanje
- [ ] Telegram bot token (veÄ‡ postoji âœ…)

---

#### ðŸ” **Security Checklist (Pre implementacije):**

- [ ] Proveri da li Supabase ima PITR (Point-in-Time Recovery)
- [ ] Test restore procedure na staging okruÅ¾enju
- [ ] Dokumentuj encryption key storage procedure
- [ ] Implementiraj backup verification (hash check)
- [ ] Setup monitoring za backup job failures

---

**Vreme (Procena):** 3-4 sata (nakon dobijanja informacija)  
**Prioritet:** ðŸ”´ CRITICAL  
**Reminder Frequency:** ðŸ”” DAILY (svaki dan dok ne dobijemo informacije)

---

## ðŸ”´ **FAZA 1.6: ADMIN DASHBOARD SA SECURITY GATE** (Prioritet: HIGH)

### **â¸ï¸ ÄŒEKA UUID I CREDENTIALS**

**Status:** ðŸŸ¡ PENDING  
**Dodato:** 2026-01-17  
**Prioritet:** ðŸŸ  HIGH

---

#### ðŸŽ¯ **Cilj:**
Kreirati privatnu Admin Monitoring Stranicu (`/admin-vitals`) kao centralni sistem za nadzor zdravlja aplikacije sa maksimalnim security merama.

---

#### ðŸ“‹ **KORAK 1: Security Gate (Autorizacija)**

**Identitetska barijera:**
- [ ] Pristup SAMO korisniku sa Admin UUID-om (iz `auth.users` tabele)
- [ ] Middleware zaÅ¡tita (Next.js Middleware)
- [ ] Provera sesije: Ako nije ulogovan ili nije Admin â†’ Redirect na **404** (ne Login!)
- [ ] Razlog za 404: NapadaÄ ne sme znati da stranica postoji

**Database Security:**
- [ ] Kreirati tabelu `admin_logs`
- [ ] RLS polisa: 
  ```sql
  CREATE POLICY "Admins only" ON admin_logs 
  TO authenticated 
  USING (auth.uid() = 'ADMIN_UUID_OVDE');
  ```

---

#### ðŸ“‹ **KORAK 2: Monitoring Panel (Vitals)**

**Module za prikaz:**

**1. Backup Guard**
- [ ] Status poslednjeg GitHub Actions backup-a
- [ ] Datum i vreme poslednjeg uspeÅ¡nog backup-a
- [ ] Success/Failure indicator

**2. Cost & Usage Monitor**
- [ ] Broj AI poziva u poslednjih 24h
- [ ] Procenjeni troÅ¡ak
- [ ] Integracija sa API logging-om

**3. System Errors**
- [ ] Poslednjih 10 kritiÄnih greÅ¡aka
- [ ] Real-time prikaz iz baze ili Edge funkcija
- [ ] Timestamp i error details

**4. Security Alerts**
- [ ] Lista svih odbijenih pokuÅ¡aja pristupa
- [ ] Unauthorized attempts log
- [ ] IP adrese i timestamp

**5. Database Latency**
- [ ] Indikator brzine odziva baze
- [ ] Healthy: < 100ms
- [ ] Warning: 100-500ms
- [ ] Critical: > 500ms

---

#### ðŸ“‹ **KORAK 3: Retroaktivni Pregled (Audit Mode)**

**Pre zavrÅ¡etka implementacije:**
- [ ] Proveri SVE API rute
- [ ] Proveri SVE Edge funkcije
- [ ] Dodaj logovanje greÅ¡aka u `admin_logs` tabelu
- [ ] Potvrdi da nema testnih pristupa koji zaobilaze Security Gate
- [ ] Proveri da nigde nije ostao development bypass

---

#### ðŸ“¦ **OÄekivani Output:**

**Frontend:**
- [ ] `/admin-vitals` stranica sa Middleware zaÅ¡titom
- [ ] Dashboard UI sa svim Vitals modulima
- [ ] Real-time updates (WebSocket ili polling)

**Backend:**
- [ ] `admin_logs` tabela u Supabase
- [ ] RLS policies za admin pristup
- [ ] Edge funkcije za prikupljanje metrika
- [ ] Logging middleware za sve API rute

**Security:**
- [ ] Middleware za autorizaciju
- [ ] 404 redirect za neautorizovane korisnike
- [ ] Audit log svih pristupa

**Documentation:**
- [ ] Admin Dashboard uputstvo
- [ ] Security Gate dokumentacija
- [ ] Troubleshooting guide

---

#### âš ï¸ **Pre Implementacije - Potrebne Informacije:**

**ÄŒeka od korisnika:**
- [ ] **Admin UUID** (iz `auth.users` tabele)
- [ ] **Supabase Project URL** (ako nije veÄ‡ u .env)
- [ ] **Supabase Service Key** (za admin operacije)

**TehniÄki zahtevi:**
- [ ] Next.js Middleware setup
- [ ] Supabase Admin Client
- [ ] Real-time subscription setup
- [ ] Telegram bot integration (za alerts)

---

#### ðŸ” **Security Checklist:**

- [ ] UUID nikada ne hardcode-uj u kodu (koristi env variable)
- [ ] Middleware provera na server-side (ne client-side)
- [ ] RLS policies testirane sa non-admin korisnicima
- [ ] 404 redirect ne otkriva postojanje stranice
- [ ] Svi API pozivi loguju unauthorized attempts
- [ ] Admin logs tabela ima retention policy
- [ ] Backup Guard ne otkriva sensitive backup lokacije

---

#### ðŸŽ¨ **UI/UX Requirements:**

- [ ] Dark mode design (konzistentno sa ostatkom app-a)
- [ ] Real-time status indicators (zeleno/Å¾uto/crveno)
- [ ] Responsive design (desktop prioritet)
- [ ] Loading states za sve metrike
- [ ] Error boundaries
- [ ] Auto-refresh svakih 30 sekundi

---

**Vreme (Procena):** 4-6 sati (nakon dobijanja UUID-a)  
**Prioritet:** ðŸŸ  HIGH  
**Dependencies:** ÄŒeka Admin UUID i credentials

---

## ðŸŸ  **FAZA 2: QUICK WINS** (Ova nedelja - 5-10 sati)

### **1. README Update** ðŸ“

**Dodaj:**
- [ ] Screenshots aplikacije
  - [ ] Dashboard
  - [ ] Hotel Search
  - [ ] AI Watchdog
  - [ ] TCT Connection Test
- [ ] Quick Start Guide
- [ ] Feature List
- [ ] Tech Stack
- [ ] Deployment Instructions
- [ ] Environment Variables
- [ ] Contributing Guidelines

**Vreme:** 30-60 minuta  
**Prioritet:** ðŸŸ  HIGH

---

### **2. Error Boundaries** ðŸ›¡ï¸

**Kreiraj:**
```typescript
// src/components/ErrorBoundary.tsx
- React Error Boundary
- Fallback UI
- Error reporting
- Reset functionality
```

**Implementiraj u:**
- [ ] App.tsx (root level)
- [ ] Router (route level)
- [ ] KritiÄne komponente

**Vreme:** 1-2 sata  
**Prioritet:** ðŸŸ  HIGH

---

### **3. Loading States** â³

**Dodaj:**
- [ ] Skeleton screens za hotel cards
- [ ] Loading spinners za API calls
- [ ] Progress bars za dugotrajne operacije
- [ ] Suspense fallbacks

**Komponente:**
```typescript
// src/components/common/LoadingSpinner.tsx
// src/components/common/SkeletonCard.tsx
// src/components/common/ProgressBar.tsx
```

**Vreme:** 1-2 sata  
**Prioritet:** ðŸŸ¡ MEDIUM

---

### **4. Toast Notifications** ðŸ””

**Implementiraj:**
- [ ] Success notifications
- [ ] Error notifications
- [ ] Warning notifications
- [ ] Info notifications

**Library:**
```bash
npm install react-hot-toast
```

**Vreme:** 1 sat  
**Prioritet:** ðŸŸ¡ MEDIUM

---

## ðŸŸ  **FAZA 3: CORE FEATURES** (SledeÄ‡e 2-3 nedelje)

### **1. Hotel Details Page** ðŸ¨

**Kreiraj:**
```typescript
// src/components/tct/HotelDetails.tsx
```

**Features:**
- [ ] Image gallery (carousel)
- [ ] Hotel information
  - [ ] Name, stars, location
  - [ ] Description
  - [ ] Amenities
  - [ ] Policies
- [ ] Map integration (Google Maps / Mapbox)
- [ ] Room types
  - [ ] Room cards
  - [ ] Prices
  - [ ] Availability
- [ ] Reviews (ako dostupno)
- [ ] "Book Now" button

**Vreme:** 2-3 dana  
**Prioritet:** ðŸŸ  HIGH

---

### **2. Booking Form** ðŸ“

**Kreiraj:**
```typescript
// src/components/tct/BookingForm.tsx
```

**Features:**
- [ ] Guest information
  - [ ] First name, Last name
  - [ ] Email, Phone
  - [ ] Nationality
- [ ] Room selection
  - [ ] Number of rooms
  - [ ] Adults/Children per room
- [ ] Special requests (textarea)
- [ ] Terms & Conditions checkbox
- [ ] Booking summary
  - [ ] Hotel details
  - [ ] Dates
  - [ ] Price breakdown
  - [ ] Total price
- [ ] "Confirm Booking" button

**Vreme:** 2-3 dana  
**Prioritet:** ðŸŸ  HIGH

---

### **3. Booking Confirmation** âœ…

**Kreiraj:**
```typescript
// src/components/tct/BookingConfirmation.tsx
```

**Features:**
- [ ] Confirmation page
  - [ ] Booking reference number
  - [ ] Booking details
  - [ ] Hotel information
  - [ ] Guest information
- [ ] Email notification
  - [ ] Confirmation email
  - [ ] Booking voucher (PDF)
- [ ] Calendar integration
  - [ ] .ics file download
  - [ ] Add to Google Calendar
- [ ] "View Booking" button
- [ ] "Print Voucher" button

**Vreme:** 1-2 dana  
**Prioritet:** ðŸŸ¡ MEDIUM

---

### **4. Booking Management** ðŸ“‹

**Kreiraj:**
```typescript
// src/components/tct/BookingList.tsx
// src/components/tct/BookingDetail.tsx
```

**Features:**
- [ ] Booking list
  - [ ] All bookings
  - [ ] Filter by status
  - [ ] Search by reference
- [ ] Booking detail
  - [ ] Full booking info
  - [ ] Cancellation option
  - [ ] Modification option
  - [ ] Resend confirmation

**Vreme:** 2-3 dana  
**Prioritet:** ðŸŸ¡ MEDIUM

---

## ðŸŸ¡ **FAZA 4: MONETIZATION** (Mesec 2)

### **1. Payment Integration** ðŸ’³

**Stripe Setup:**
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

**Features:**
- [ ] Stripe account setup
- [ ] Payment form
- [ ] Card validation
- [ ] Payment processing
- [ ] Payment confirmation
- [ ] Invoice generation
- [ ] Refund handling

**Vreme:** 3-5 dana  
**Prioritet:** ðŸŸ¡ MEDIUM

---

### **2. Commission System** ðŸ’µ

**Kreiraj:**
```typescript
// src/services/commissionService.ts
```

**Features:**
- [ ] Booking tracking
- [ ] Commission calculation
  - [ ] Percentage-based
  - [ ] Fixed amount
  - [ ] Tiered rates
- [ ] Commission reporting
  - [ ] Daily report
  - [ ] Monthly report
  - [ ] Export to CSV/Excel
- [ ] Payment tracking

**Vreme:** 2-3 dana  
**Prioritet:** ðŸŸ¡ MEDIUM

---

## ðŸŸ¢ **FAZA 5: SCALE & OPTIMIZE** (Mesec 3+)

### **1. Analytics** ðŸ“Š

**Google Analytics Setup:**
```bash
npm install react-ga4
```

**Features:**
- [ ] Page view tracking
- [ ] Event tracking
  - [ ] Search events
  - [ ] Booking events
  - [ ] Payment events
- [ ] Conversion funnel
- [ ] User behavior
- [ ] A/B testing setup

**Vreme:** 1 dan  
**Prioritet:** ðŸŸ¢ LOW

---

### **2. Testing Suite** âœ…

**Setup:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @playwright/test
```

**Features:**
- [ ] Unit tests (Jest)
  - [ ] Utils functions
  - [ ] Services
  - [ ] Components
- [ ] Integration tests
  - [ ] API calls
  - [ ] State management
- [ ] E2E tests (Playwright)
  - [ ] Search flow
  - [ ] Booking flow
  - [ ] Payment flow

**Vreme:** 1 nedelja  
**Prioritet:** ðŸŸ¢ LOW

---

### **3. Performance Optimization** âš¡

**Continuous Improvements:**
- [ ] Code splitting
  - [ ] Route-based splitting
  - [ ] Component lazy loading
- [ ] Image optimization
  - [ ] WebP format
  - [ ] Lazy loading
  - [ ] Responsive images
- [ ] Caching strategy
  - [ ] Service Worker
  - [ ] API response caching
  - [ ] Static asset caching
- [ ] CDN setup
  - [ ] Cloudflare
  - [ ] AWS CloudFront

**Vreme:** Ongoing  
**Prioritet:** ðŸŸ¢ LOW

---

## ðŸ“Š **PROGRESS TRACKING**

### **Overall Progress:**
```
[â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘] 80% Complete

âœ… Infrastructure: 100%
âœ… Security: 100%
âœ… Monitoring: 100%
âœ… Documentation: 100%
ðŸŸ¡ UI Components: 60%
ðŸ”´ Booking Flow: 0%
ðŸ”´ Payment: 0%
ðŸ”´ Testing: 0%
```

### **Current Sprint:**
- **Focus:** Deployment & Validation
- **Duration:** 1-2 dana
- **Goal:** Live production application

### **Next Sprint:**
- **Focus:** Quick Wins
- **Duration:** 1 nedelja
- **Goal:** Improved UX

---

## ðŸŽ¯ **MILESTONES**

- [ ] **Milestone 1:** Production Deployment (Danas)
- [ ] **Milestone 2:** Quick Wins Complete (Ova nedelja)
- [ ] **Milestone 3:** Core Features Complete (2-3 nedelje)
- [ ] **Milestone 4:** Payment Integration (Mesec 2)
- [ ] **Milestone 5:** Full Production Launch (Mesec 3)

---

## ðŸ“ **NOTES**

### **VeÄ‡ Implementirano:**
- âœ… ~18,500 linija koda
- âœ… 53+ fajlova
- âœ… Kompletna dokumentacija
- âœ… Security 100%
- âœ… Monitoring 100%
- âœ… API Integration 100%

### **Prioriteti:**
1. ðŸ”´ Deploy ASAP
2. ðŸŸ  Quick wins za UX
3. ðŸŸ  Core booking features
4. ðŸŸ¡ Monetization
5. ðŸŸ¢ Scale & optimize

### **Resources:**
- Vercel nalog: âœ… Postoji
- Supabase nalog: âœ… Postoji
- TCT API credentials: âœ… Postoji
- Telegram bot: âœ… Setup

---

**Last Updated:** 2026-01-26  
**Next Review:** Nakon Milestone 1


---

##  **URGENT: Solvex Booking API Documentation**

**Status:**  PENDING  
**Priority:**  HIGH  
**Blocker:** Missing Solvex WSDL documentation for booking methods

### **Problem:**
Booking form system je implementiran ali **Solvex booking metoda nije dokumentovana**. Trenutno radi u **MOCK MODE** i vraca simulirane rezervacije.

### **Potrebno:**
1. **Solvex WSDL dokumentacija** za booking/rezervaciju
   - Tacan naziv SOAP metode (CreateBooking? MakeReservation? BookHotel?)
   - Struktura request-a (koja polja su obavezna)
   - Struktura response-a (kako izgleda booking ID i status)
   - Format podataka za putnike (array? pojedinacni objekti?)

2. **Test credentials** za Solvex booking (ako se razlikuju od search credentials)

### **Trenutno stanje:**
-  Booking form UI - 100% završen
-  Validation - 100% završena
-  Adapter pattern - 100% implementiran
-  Solvex SOAP integration - **MOCK MODE** (ceka dokumentaciju)

### **Fajlovi za ažuriranje:**
- src/services/booking/solvexBookingAdapter.ts (linija 41-63 - uncomment real API call)
- src/services/solvex/solvexConstants.ts (dodati SOAP metodu za booking)

### **Estimated Time:** 30 minuta (nakon dobijanja dokumentacije)

**Created:** 2026-01-17  
**Assigned to:** Pending Solvex documentation



---

##  **URGENT: Solvex Booking API Documentation**

**Status:**  PENDING  
**Priority:**  HIGH  
**Blocker:** Missing Solvex WSDL documentation for booking methods

### **Problem:**
Booking form system je implementiran ali **Solvex booking metoda nije dokumentovana**. Trenutno radi u **MOCK MODE** i vraÄ‡a simulirane rezervacije.

### **Potrebno:**
1. **Solvex WSDL dokumentacija** za booking/rezervaciju
   - TaÄan naziv SOAP metode (CreateBooking? MakeReservation? BookHotel?)
   - Struktura request-a (koja polja su obavezna)
   - Struktura response-a (kako izgleda booking ID i status)
   - Format podataka za putnike (array? pojedinaÄni objekti?)

2. **Test credentials** za Solvex booking (ako se razlikuju od search credentials)

### **Trenutno stanje:**
-  Booking form UI - 100% zavrÅ¡en
-  Validation - 100% zavrÅ¡ena
-  Adapter pattern - 100% implementiran
-  Solvex SOAP integration - **MOCK MODE** (Äeka dokumentaciju)

### **Fajlovi za aÅ¾uriranje:**
- `src/services/booking/solvexBookingAdapter.ts` (linija 41-63 - uncomment real API call)
- `src/services/solvex/solvexConstants.ts` (dodati SOAP metodu za booking)

### **Estimated Time:** 30 minuta (nakon dobijanja dokumentacije)

**Created:** 2026-01-17  
**Assigned to:** Pending Solvex documentation


---

---

### **Modularne forme u pretrazi**
- [ ] Implementirati logiku prikaza formi na osnovu statusa dostupnosti (Slobodno, na upit, Prodato):
  - [ ] **Slobodno**: Kreirati formu za instant **Potvrdu rezervacije** (Instant Booking).
  - [ ] **Na upit**: Kreirati formu za **Slanje upita** (Request for Availability).
  - [ ] **Prodato**: OnemoguÄ‡iti akciju ili ponuditi alternativne objekte u okolini.

**Vreme:** 4-6 sati
**Prioritet:**  HIGH

---

##  **UI ENHANCEMENTS: Time-Limited Badges**

### **Feature: Oznake za hotele i putovanja (Vremenski ograniÄene)**
- [ ] Implementirati sistem "Badges" (oznaka) koji imaju datum isteka (npr. "First Minute", "Last Minute", "Specijalna Ponuda").
- [ ] Dodati vizuelne indikatore na karticama hotela i u rezultatima pretrage.
- [ ] Implementirati logiku koja automatski sakriva oznaku nakon isteka definisanog datuma ili prikazuje preostalo vreme.
- [ ] Dodati podrÅ¡ku u provider interfejsima za ove metapodatke.

**Vreme:** 3-4 sata
**Prioritet:**  MEDIUM / HIGH


## ðŸ´ **URGENT FIXES**

### **Solvex B2B Status Check**
- **Status:** BROKEN (2026-02-03)
- **Issue:** API verification button in Reservation Architect fails.
- **Next Steps:** Debug SOAP GetReservation payload. Verify if 'ID' or 'ExternalID' is correct parameter.

---

##  **FAZA 1.7: AI LAB - API KEY SETUP** (Prioritet: HIGH)

### ** ČEKA DODAVANJE GEMINI KLJUČA**

**Status:**  PENDING (Trenutno koristi MOCK MODE)  
**Dodato:** 2026-02-14

####  **Cilj:**
Aktivirati punu AI snagu (Smart Concierge & Intelligence Service) dodavanjem validnog Google Gemini API ključa.

####  **Specifikacija zadatka:**
1. **Google AI Studio**
   - [ ] Otvori [Google AI Studio](https://aistudio.google.com/app/apikey)
   - [ ] Kreiraj "API Key in new project"
   - [ ] Kopiraj API ključ

2. **Environment Configuration**
   - [ ] Otvori .env fajl
   - [ ] Postavi VITE_GEMINI_API_KEY=TVOJ_KLJUČ_OVDE
   - [ ] Postavi VITE_AI_DEV_MODE=true
   - [ ] Restartuj 
pm run dev

3. **Verification**
   - [ ] Otvori Chat i pitaj "Daj mi ponudu za Krf"
   - [ ] Verifikuj da AI vraća realne podatke i aktivira alate (tools)

**Vreme (Procena):** 5-10 minuta  
**Prioritet:**  HIGH
