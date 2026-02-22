# 📋 OLYMPIC HUB - NEZAVRŠENI ZADACI (TODO Overview)

**Generated:** 2026-01-17  
**Total Uncompleted Tasks:** 270  
**Status:** Ready for prioritization

---

## 🔴 **KRITIČNI ZADACI (FAZA 1 - Deployment)**

### **1. GitHub Repository - Make Private** (2 min)
- [ ] Otvori https://github.com/Nenad034/olympichub034
- [ ] Settings → Danger Zone → Change visibility
- [ ] Izaberi "Make private"
- [ ] Potvrdi sa imenom repo-a
- [ ] Verifikuj da je repo private

### **2. GitHub Security Setup** (5 min)
- [ ] Settings → Code security and analysis
- [ ] Enable Dependabot alerts
- [ ] Enable Dependabot security updates
- [ ] Enable Secret scanning
- [ ] Enable Code scanning (CodeQL)
- [ ] Settings → Branches → Add rule
  - [ ] Require pull request reviews
  - [ ] Require status checks
  - [ ] Include administrators

### **3. Vercel Deployment** (10-15 min)
- [ ] Vercel CLI instaliran
- [ ] Login u Vercel
- [ ] Deploy development
- [ ] Konfigurisani environment variables
- [ ] Production deploy
- [ ] Test deployment URL
- [ ] Verifikuj da sve radi

### **4. Supabase Production Setup** (15-20 min)
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

### **5. Production Testing** (30-45 min)
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
  - [ ] Simuliraj 5xx grešku
  - [ ] Proveri Telegram notifikaciju
  - [ ] Test Approve/Reject dugmadi

**Total FAZA 1 Tasks:** ~40 tasks  
**Estimated Time:** 1-2 sata

---

## 🔴 **FAZA 1.5: OFF-SITE BACKUP SYSTEM** ⏸️ ČEKA INFORMACIJE

**Status:** 🟡 PENDING - Daily Reminder ENABLED

### **Potrebne informacije pre implementacije:**
1. Da li već imamo AWS nalog? (S3 bucket preporuka)
2. Koja je veličina trenutne baze?
3. Da li postoje compliance zahtevi? (GDPR)
4. Prioritet: Cijena vs Pouzdanost?

### **Zadaci (nakon dobijanja informacija):**
- [ ] GitHub Actions Workflow (.github/workflows/db-backup.yml)
- [ ] Cron job: Svaki dan u 02:00h
- [ ] pg_dump alat za SQL dump
- [ ] Kompresija i GPG enkripcija
- [ ] AWS S3 ili GitHub Artifacts storage
- [ ] Telegram notifikacije za greške
- [ ] 30-dana retention policy
- [ ] Restore procedure dokumentacija
- [ ] Test procedure

**Total FAZA 1.5 Tasks:** ~20 tasks  
**Estimated Time:** 3-4 sata (nakon informacija)

---

## 🟠 **FAZA 1.6: ADMIN DASHBOARD SA SECURITY GATE** ⏸️ ČEKA UUID

**Status:** 🟡 PENDING - Čeka Admin UUID

### **Potrebne informacije:**
- [ ] Admin UUID (iz auth.users tabele)
- [ ] Supabase Project URL
- [ ] Supabase Service Key

### **KORAK 1: Security Gate**
- [ ] Pristup SAMO Admin UUID-u
- [ ] Next.js Middleware zaštita
- [ ] 404 redirect za neautorizovane
- [ ] Kreirati admin_logs tabelu
- [ ] RLS polisa za admin pristup

### **KORAK 2: Monitoring Panel (5 modula)**
**1. Backup Guard:**
- [ ] Status poslednjeg backup-a
- [ ] Datum i vreme
- [ ] Success/Failure indicator

**2. Cost & Usage Monitor:**
- [ ] Broj AI poziva (24h)
- [ ] Procenjeni trošak
- [ ] API logging integracija

**3. System Errors:**
- [ ] Poslednjih 10 kritičnih grešaka
- [ ] Real-time prikaz
- [ ] Timestamp i details

**4. Security Alerts:**
- [ ] Odbijeni pokušaji pristupa
- [ ] Unauthorized attempts log
- [ ] IP adrese i timestamp

**5. Database Latency:**
- [ ] Indikator brzine (<100ms = Healthy)
- [ ] Warning/Critical thresholds

### **KORAK 3: Audit Mode**
- [ ] Proveri SVE API rute
- [ ] Proveri SVE Edge funkcije
- [ ] Dodaj logovanje u admin_logs
- [ ] Potvrdi da nema test bypass-a

### **Output:**
- [ ] /admin-vitals stranica
- [ ] Dashboard UI sa Vitals
- [ ] Real-time updates
- [ ] admin_logs tabela
- [ ] RLS policies
- [ ] Middleware za autorizaciju
- [ ] Documentation

**Total FAZA 1.6 Tasks:** ~45 tasks  
**Estimated Time:** 4-6 sati (nakon UUID-a)

---

## 🟠 **FAZA 2: QUICK WINS** (5-10 sati)

### **1. README Update** (30-60 min)
- [ ] Screenshots aplikacije (Dashboard, Hotel Search, AI Watchdog, TCT Test)
- [ ] Quick Start Guide
- [ ] Feature List
- [ ] Tech Stack
- [ ] Deployment Instructions
- [ ] Environment Variables
- [ ] Contributing Guidelines

### **2. Error Boundaries** (1-2 sata)
- [ ] React Error Boundary komponenta
- [ ] Fallback UI
- [ ] Error reporting
- [ ] Reset functionality
- [ ] Implementacija u App.tsx
- [ ] Implementacija u Router
- [ ] Implementacija u kritične komponente

### **3. Loading States** (1-2 sata)
- [ ] Skeleton screens za hotel cards
- [ ] Loading spinners za API calls
- [ ] Progress bars za dugotrajne operacije
- [ ] Suspense fallbacks

### **4. Toast Notifications** (1 sat)
- [ ] Install react-hot-toast
- [ ] Success notifications
- [ ] Error notifications
- [ ] Warning notifications
- [ ] Info notifications

**Total FAZA 2 Tasks:** ~25 tasks  
**Estimated Time:** 5-10 sati

---

## 🟠 **FAZA 3: CORE FEATURES** (2-3 nedelje)

### **1. Hotel Details Page** (2-3 dana)
- [ ] Image gallery (carousel)
- [ ] Hotel information (Name, stars, location, description, amenities, policies)
- [ ] Map integration (Google Maps / Mapbox)
- [ ] Room types (cards, prices, availability)
- [ ] Reviews
- [ ] "Book Now" button

### **2. Booking Form** (2-3 dana)
- [ ] Guest information (First/Last name, Email, Phone, Nationality)
- [ ] Room selection (Number of rooms, Adults/Children per room)
- [ ] Special requests textarea
- [ ] Terms & Conditions checkbox
- [ ] Booking summary (Hotel details, Dates, Price breakdown, Total)
- [ ] "Confirm Booking" button

### **3. Booking Confirmation** (1-2 dana)
- [ ] Confirmation page (Booking reference, details, hotel info, guest info)
- [ ] Email notification (Confirmation email, Booking voucher PDF)
- [ ] Calendar integration (.ics file, Add to Google Calendar)
- [ ] "View Booking" button
- [ ] "Print Voucher" button

### **4. Booking Management** (2-3 dana)
- [ ] Booking list (All bookings, Filter by status, Search by reference)
- [ ] Booking detail (Full info, Cancellation, Modification, Resend confirmation)

**Total FAZA 3 Tasks:** ~40 tasks  
**Estimated Time:** 2-3 nedelje

---

## 🟡 **FAZA 4: MONETIZATION** (Mesec 2)

### **1. Payment Integration (Stripe)** (3-5 dana)
- [ ] Stripe account setup
- [ ] Install @stripe/stripe-js @stripe/react-stripe-js
- [ ] Payment form
- [ ] Card validation
- [ ] Payment processing
- [ ] Payment confirmation
- [ ] Invoice generation
- [ ] Refund handling

### **2. Commission System** (2-3 dana)
- [ ] Booking tracking
- [ ] Commission calculation (Percentage-based, Fixed amount, Tiered rates)
- [ ] Commission reporting (Daily, Monthly, Export to CSV/Excel)
- [ ] Payment tracking

**Total FAZA 4 Tasks:** ~20 tasks  
**Estimated Time:** 5-8 dana

---

## 🟢 **FAZA 5: SCALE & OPTIMIZE** (Mesec 3+)

### **1. Analytics** (1 dan)
- [ ] Install react-ga4
- [ ] Page view tracking
- [ ] Event tracking (Search, Booking, Payment events)
- [ ] Conversion funnel
- [ ] User behavior
- [ ] A/B testing setup

### **2. Testing Suite** (1 nedelja)
- [ ] Install Jest, @testing-library/react, Playwright
- [ ] Unit tests (Utils, Services, Components)
- [ ] Integration tests (API calls, State management)
- [ ] E2E tests (Search flow, Booking flow, Payment flow)

### **3. Performance Optimization** (Ongoing)
- [ ] Code splitting (Route-based, Component lazy loading)
- [ ] Image optimization (WebP, Lazy loading, Responsive images)
- [ ] Caching strategy (Service Worker, API caching, Static assets)
- [ ] CDN setup (Cloudflare / AWS CloudFront)

**Total FAZA 5 Tasks:** ~30 tasks  
**Estimated Time:** Ongoing

---

## 🎯 **MILESTONES (Nezavršeni)**

- [ ] **Milestone 1:** Production Deployment
- [ ] **Milestone 2:** Quick Wins Complete
- [ ] **Milestone 3:** Core Features Complete
- [ ] **Milestone 4:** Payment Integration
- [ ] **Milestone 5:** Full Production Launch

---

## 📊 **SUMMARY**

| Faza | Tasks | Status | Estimated Time |
|------|-------|--------|----------------|
| **FAZA 1** | 40 | 🔴 Not Started | 1-2 sata |
| **FAZA 1.5** | 20 | 🟡 Pending Info | 3-4 sata |
| **FAZA 1.6** | 45 | 🟡 Pending UUID | 4-6 sati |
| **FAZA 2** | 25 | 🔴 Not Started | 5-10 sati |
| **FAZA 3** | 40 | 🔴 Not Started | 2-3 nedelje |
| **FAZA 4** | 20 | 🔴 Not Started | 5-8 dana |
| **FAZA 5** | 30 | 🔴 Not Started | Ongoing |
| **Milestones** | 5 | 🔴 Not Started | - |
| **TOTAL** | **270** | - | - |

---

## 🚨 **IMMEDIATE ACTION REQUIRED**

### **Top 3 Priorities:**
1. 🔴 **FAZA 1: Deployment** (1-2 sata) - CRITICAL
2. 🟡 **FAZA 1.5: Backup System** - Čeka 4 pitanja od korisnika
3. 🟡 **FAZA 1.6: Admin Dashboard** - Čeka Admin UUID

### **Blokirano (Čeka informacije):**
- **FAZA 1.5:** AWS nalog?, Veličina baze?, Compliance?, Cijena vs Pouzdanost?
- **FAZA 1.6:** Admin UUID, Supabase Project URL, Supabase Service Key

---

**Next Steps:**
1. Odgovoriti na pitanja za FAZA 1.5
2. Dostaviti Admin UUID za FAZA 1.6
3. Započeti FAZA 1 deployment tasks

---

**Last Updated:** 2026-01-17  
**Generated by:** AI Agent Master System
