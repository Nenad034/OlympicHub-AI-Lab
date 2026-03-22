# 📘 PrimeSmartSearch V6 — Kompletna Tehnička Dokumentacija i Implementacioni Plan

> [!IMPORTANT]
> Ovaj dokument je **Sveti Gral** PrimeSmartSearch V6 projekta.
> Svaka promena u biznis logici, dizajnu ili API integraciji **mora biti prvo evidentirana ovde** pre implementacije.
> Ovo je "North Star" (Putokaz) prema kome se meri svaki commit.

---

## 1. Vizija Projekta

PrimeSmartSearch V6 je **unifikovani sistem pretrage** koji spaja:
- Vrhunski **UX interaktivni dizajn** (Expedia funkcionalnost + Ferrari estetika)
- **Robusnu poslovnu logiku** (hibridni model inventara, favorizacija dobavljača)
- **Smart Concierge** (cross-sell upsell, marketing notifikacije)
- **Totalna transparentnost cena** (svaka stavka vidljiva, za svaku osobu i sobu)
- **Viralni Share Hub** (PDF/HTML export + direktno deljenje)

### Imperativni Vizuelni Standardi (Nulta Tolerancija):
- **Nema belo na belom, teget na teget** — svaki tekst mora biti čitljiv u oba moda
- **Sav V6 CSS** koristiće prefiks `.v6-` kako bi bio strogo izolovan od ostalih modula
- **Nema regresije** — nijedan drugi modul u aplikaciji ne sme biti narušen

---

## 2. Layout Sistem (95% Immersive Cockpit)

V6 koristi **Immersive Dashboard Layout** koji ispunjava vidno polje korisnika:

```css
/* Glavni kontejner */
.v6-prime-hub {
  width: 95vw;
  height: 95vh;
  margin: 2.5vh auto;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
}
```

### Responsive Grid (Adaptive Mosaic):
| Ekran | Kolone u Mosaicu | Breakpoint |
|---|---|---|
| Ultra-wide / Big Monitor | 4-5 kolona | > 1600px |
| Desktop / Laptop | 3 kolone | 1200-1600px |
| Tablet | 2 kolone | 768-1200px |
| Mobilni | 1 kolona | < 768px |

### Unutrašnji Skrol (Independent Scroll):
- **Fiksno (sticky):** Tabovi, Search Bar, Filteri
- **Skrolujuće:** Samo zona rezultata (`.v6-results-zone`)

---

## 3. Design System (Expedia Meets Ferrari)

### 3.1 Kolorni Kodeks (Semantičke Boje — Semafor Logika)

| Status | Boja | Hex | Primena |
|---|---|---|---|
| ✅ Slobodno / Odmah potvrđeno | **Emerald Zelena** | `#059669` | Badge, dugme "Rezerviši", border sobe |
| ⚠️ Na Upit (On Request) | **Amber Žuta** | `#D97706` | Badge, upozorenja, poruke |
| 🚫 Prodato | **Ne prikazujemo** | — | Filtrira se u Orchestratoru, ne dolazi do UI |
| 🏆 Prime Ponuda (Vaš inventar) | **Zlatni Badge** | `#B45309` | Oznaka na karticama i sobama |

**Nikakvo šarenilo boja van ovog kodeksa. Samo ove 4 semantičke boje za statusne informacije.**

### 3.2 Light Mode (Premium Silver)
- **Background:** `#F0F2F5` (Svetlo srebrna)
- **Card Background:** `#FFFFFF` (Čista bela)
- **Primary Text:** `#0F172A` (Tamno teget)
- **Buttons:** Background `#0F172A`, tekst `#FFFFFF`
- **Critical Alerts:** `#991B1B` sa belim slovima

### 3.3 Dark Mode (Deep Navy)
- **Background:** `#0B1629` (Duboko teget, NIKAD čista crna)
- **Card Background:** `#1B2A4E`
- **Primary Text:** `#E2E8F0` (Svetlo srebro)
- **Silver Blue Akcenti:** `#63B3ED`
- **Buttons:** Background `#2D4A8A`, tekst `#FFFFFF`

### 3.4 Tipografija
- Font: **Inter** (Google Fonts)
- Naslovi: `700` weight
- Body: `400` weight
- Cene: `700` weight, veći font size
- Nikada manje od `14px`

---

## 4. Arhitektura Sistema (Fusion Architecture)

### 4.1 Slojevi Sistema

```
[ UI Layer — 8 Tabova / Pretraga ] 
         ↓ (Unified SearchRequest objekat)
[ Unified Search Orchestrator — Agregator ]
         ↓ (Parallel Fan-Out)
┌─────────────────────────────────────────┐
│ Manual DB  │ Charter Mgr │ Solvex API   │
│ (Prioritet)│ (Allotments)│ (BG, GR, TR) │
│ weight:100 │  weight: 90 │  weight: 80  │
├─────────────────────────────────────────┤
│ Amadeus GDS│ Pricing Int │ ConciergeDB  │
│  weight:50 │ (Extras)    │ (Upsell)     │
└─────────────────────────────────────────┘
         ↓ (Merge + Deduplicate + Sort)
[ Results Mosaic — Unified Results JSON ]
```

### 4.2 State Management (Zustand)

Fajl: `src/pages/PrimeSmartSearch/stores/useSearchStore.ts`

Store mora da sadrži:
- `activeTab`: tip pretrage (svih 8)
- `searchMode`: Classic / AI Narrative / Immersive / Map / Semantic
- `destinations[]`: maksimalno 3 destinacije
- `checkIn` / `checkOut`: datumi
- `flexDays`: +/- dana fleksibilnost (0, 3, 7)
- `roomAllocations[]`: niz soba, svaka sa `{adults, children, childrenAges[]}`
- `nationality`: RS (važno za API pricing pravila)
- `filters`: stars, mealPlans, onlyRefundable, budgetFrom, budgetTo, onlyInstantBook
- `results[]`: unificirani rezultati
- `packageBasket[]`: stavke za Package Wizard (let + hotel + transfer + izlet...)
- `isSearching` / `searchPerformed`
- `sortBy`: `smart` | `price_asc` | `stars_desc`

---

## 5. Unified Search Orchestrator (Agregator)

### 5.1 Favorizacija Dobavljača (Weight System)

Konfiguracija u: `src/modules/search/orchestrator/config.ts`

```
Manual DB     → weight: 100  (UVEK na vrhu)
Charter Mgr   → weight: 90   (Vaši čarteri)
Solvex API    → weight: 80   (Bugarska, Grčka, Turska)
WebBeds       → weight: 40   (Standardni bed-bank)
Amadeus GDS   → weight: 50   (Letovi)
Skyscanner    → weight: 30   (Low-cost letovi)
```

**Bonus:** +20 weight za svaki provajder koji ima tagove koji odgovaraju destinaciji pretrage (npr. Solvex + "bulgaria" = 80 + 20 = 100 za tu destinaciju).

### 5.2 Parallel Fan-Out (Paralelno Povlačenje)
Orchestrator **istovremeno** šalje zahteve svim aktivnim provajderima. Ne čeka jedan da završi pre drugog. Korisnik vidi rezultate čim **bilo koji** provajder odgovori.

### 5.3 Deduplikacija (sa Failover Logikom)
- Isti hotel iz dva provajdera → **Spajamo u jednu karticu**
- Prikazujemo onaj sa višim weight-om (prioritet vašem inventaru)
- **Kritično:** U JSON objektu rezultata čuvamo ID-eve **oba provajdera**

```typescript
// UnifiedResult objekat MORA sadržati:
{
  primaryProvider: {
    id: 'solvex',
    hotelKey: 'SLX_12345',
    price: 1200
  },
  failoverProvider: {
    id: 'manual',
    hotelKey: 'MAN_00891',
    price: 1250
  }
}
```

**Failover Scenario:** Ako pri finalnoj rezervaciji primarni provajder vrati grešku (timeout, `sold_out`), sistem **tiho** prelazi na `failoverProvider` — bez novog češljanja baze. Korisnik ništa ne primećuje. Klijent dobija sobu.

### 5.4 Smart Alerts (Notifikacije u Formi)

**Minimalan broj noćenja:**
- Ako korisnik izabere datum koji kosi sa min-stay pravilom → Amber (žuta) poruka: *"Minimalan boravak za ovaj period je X noćenja. Molimo odaberite drugi datum."*
- Kalendar vizuelno osenčava zabranjena trajanja

**Alternative Date Engine (Obavezna Funkcija):**
- Ako nema rezultata za traženi termin → Orchestrator automatski vrši pretragu ±3 dana i ±7 dana
- Umesto praznog ekrana korisnik vidi: *"Za taj datum nema mesta. Pokazujemo najbliže slobodne termine:"*
  - Kartica: Datum PRE (npr. 7. avg - 14. avg)
  - Kartica: Datum POSLE (npr. 13. avg - 20. avg)

---

## 6. Moduli Pretrage (8 Tabova)

### 6.1 🛏️ SMEŠTAJ (Stays)

**Polja forme:**
- Destinacija (autocomplete, max 3 destinacije)
- Check-in / Check-out (Expedia-style kalendar)
- Fleksibilnost ±3 ili ±7 dana
- Putnici & Sobe (Occupancy Wizard)
- Nacionalnost putnika

**Occupancy Wizard:**
```
Soba 1: [2] Odrasli  [1] Deca  → Uzrast: [5]
Soba 2: [2] Odrasli  [2] Deca  → Uzrast: [8] [12]
[ + Dodaj Sobu ]
```

**Pax Summary Banner (Sticky — Uvek Vidljiv):**
```
📅 10. avg — 17. avg  |  👥 4 odr + 3 dece (5, 8, 12 god)  |  🏨 2 sobe  |  7 noćenja
```

---

### 6.2 ✈️ LETOVI (Flights)

**Polja forme:**
- Tip puta: Jednosmerni / Povratni / Multi-city
- Polazak (Grad/Aerodrom)
- Odredište (Grad/Aerodrom)
- Datumi (Polazak + Povratak)
- Klasa (Ekonomska / Biznis / Prva)
- Putnici (Odrasli, Deca, Bebe)

**Posebne funkcije:**
- ±3 dana fleksibilnost prikaza najjeftinijeg datuma
- Provajderi: Amadeus (GDS), Skyscanner (low-cost)

---

### 6.3 📦 PAKETI (Package Wizard)

**Wizard logika (Korak-po-Korak):**

**Korak 1 — Osnova:**
- Polazak + Odredište + Datumi + Putnici

**Korak 2 — Let:**
- Lista dostupnih letova (sa cenama po putniku)
- Status: ⚡ Odmah / ❓ Upit

**Korak 3 — Hotel:**
- Lista hotela filtrirana po destinaciji i terminima izabranog leta
- Slot selection (Soba-po-soba) — vidi Sekciju 7

**Korak 4 — Dodaci (Smart Concierge):**
- Transfer od aerodroma do hotela
- Izleti i aktivnosti (iz Pricing Intelligence baze)
- Ulaznice za atrakcije
- Osiguranje

**Korak 5 — Pregled & Export:**
- Package Ledger (Live Itemized List)
- Mapa Itinerera (Interactive Map)
- PDF / HTML Export + Share Hub

**Live Package Ledger (Uvek Vidljiv Panel sa desne strane):**
```
🛒 VAŠA KORPA
─────────────────────────────
✈️ Let (Air Serbia, 2+2)        450 €
🏨 Hotel (4 noći, All Inc.)   2.200 €
🚐 Privatni Transfer           60 €
🎟️ Karte za park (2 dana)      540 €
─────────────────────────────
UKUPNO (2 odr + 2 dece):    3.250 €
─────────────────────────────
[ Nastavi ka Rezervaciji ]
```

---

### 6.4 🚗 RENT-A-CAR

**Polja forme:**
- Mesto preuzimanja
- Mesto vraćanja (može biti različito)
- Datum i vreme preuzimanja
- Datum i vreme vraćanja
- Starost vozača
- Filter: Tip vozila (Ekonomik, Standard, Luksuz, SUV, Kombi)

---

### 6.5 🎟️ IZLETI (Things To Do)

**Polja forme:**
- Grad / Regija
- Datum (može biti opseg)
- Tip (Muzej, Sport, Avantura, Safari, Kultura)
- Broj odraslih i dece

**Prikaz:** Grid kartica sa slikom, nazivom, cenom po osobi i dugmetom za detalje.

---

### 6.6 🚢 KRSTARENJA (Cruises)

**Polja forme:**
- Polazna luka / Regija
- Trajanje krstarenja (2-5, 6-9, 10+ dana)
- Mesec polaska
- Brodska kompanija (filter)

**Prikaz:** Kartica sa slikom broda, rutom (luka po luka), trajanjem i "Već od" cenom.

---

### 6.7 🎫 ČARTERI (Charters — Allotment Logic)

**Prikaz — Fiksni Kalendar (Schedule):**
- Korisnik **ne bira** slobodan datum
- Sistem prikazuje samo vaše fiksne čarter letove (iz Pricing Intelligence baze)
- Pored svakog leta: Relacija, Dan polaska, Vreme, Cena, Status

**Semafor Za Čartera:**
```
BEG → AYT  |  Utorak 10. avg  |  07:30  |  199 €/os  |  ⚡ Slobodno (12 mesta)
BEG → AYT  |  Petak  14. avg  |  08:00  |  199 €/os  |  ⚠️ Poslednja 3 mesta
```

- **Zeleno:** Dosta slobodnih mesta
- **Žuto:** Manje od 5 slobodnih mesta
- **Ne prikazujemo** popunjene termne

---

### 6.8 🌍 PUTOVANJA (Tours)

**Polja forme:**
- Naziv ture / Destinacija
- Period polaska (mesec ili opseg)
- Tip ture (Grupna, Individualna, Porodična)

**Prikaz — Visual Timeline:**
```
📌 Dan 1  |  Dolazak, Transfer, Noćenje Hotel X
🌆 Dan 2  |  Razgledanje uz vodiča
🍇 Dan 3  |  Izlet u vinariju (Fakultativno - +35€)
🛫 Dan 7  |  Transfer, Polazak kući
```

**Šta je uključeno (Ikone):**
🚌 Prevoz | 🏨 Hotel 4* | 🥐 Doručak | 👮 Vodič | ✈️ Let (ako je uključen)

**Fiksni Polasci:**
```
15. Oktobar 2026  |  7 dana  |  385 €/os     ⚡ Slobodno
22. Oktobar 2026  |  7 dana  |  385 €/os     ⚠️ Poslednja 2 mesta
05. Novembar 2026 |  7 dana  |  350 €/os     ⚡ Slobodno
```

**Mapa Ture:**
- Interaktivna mini mapa sa markiranom rutom ture (npr. Beč → Prag → Budimpešta)

---

## 7. Classic Clarity — Prikaz Smeštajnih Jedinica

### 7.1 Nivo 1: Mosaic Kartica (Jedna po hotelu)

Svaka kartica prikazuje:
- Slika hotela (visoka rezolucija)
- Naziv + Zvezdice + Ocena gostiju
- Lokacija
- `🏆 PRIME` badge (ako je vaš inventar)
- **UKUPNA CENA** (izračunata za celu grupu, sva noćenja):
  ```
  UKUPNO ZA VAS: 2.800 €
  (2 sobe, 4 odr + 2 dece, 7 noćenja - Noćenje sa doručkom)
  ```
- Dugme: `[ Pogledaj opcije ]`

### 7.2 Nivo 2: Slot-Based Room Wizard

Korisnik ulazi u detalje hotela i bira sobu po sobu:

```
┌─────────────────────────────────────────────────────┐
│ SOBA 1  │  2 Odrasla                                │
├─────────────────────────────────────────────────────┤
│ Standard Double                                      │
│  • Noćenje sa doručkom      1.200 €   ⚡  [Izaberi]│
│  • Polupansion              1.560 €   ⚡  [Izaberi]│
│  • All Inclusive            1.980 €   ⚡  [Izaberi]│
│                                                      │
│ Studio Apart.                                        │
│  • Noćenje sa doručkom      1.400 €   ⚠️  [Upit]   │
│  • All Inclusive            2.200 €   ⚡  [Izaberi]│
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ SOBA 2  │  2 Odrasla + 1 dete (8 god)              │
├─────────────────────────────────────────────────────┤
│ Family Room                                          │
│  • Noćenje sa doručkom      1.680 €   ⚡  [Izaberi]│
│  • All Inclusive            2.400 €   ⚡  [Izaberi]│
│                                                      │
│ Deluxe Sea View                                      │
│  • Polupansion              1.890 €   ⚡  [Izaberi]│
└─────────────────────────────────────────────────────┘
```

**Pravila:**
- Svaka soba prikazuje **SAMO** smeštajne jedinice koje odgovaraju broju osoba (filtrira Orchestrator)
- Prodato se **ne prikazuje**
- Cena je uvek **UKUPNA** za tu strukturu osoba i broj noćenja
- Svaka usluga je punim nazivom (ne "ND", "PP", "AI")

### 7.3 Live Availability Validation
- Čim korisnik izabere određenu sobu, sistem **tiho proverava** dostupnost u realnom vremenu
- Ako je ta poslednja soba rezervisana u međuvremenu, stavka nestaje sa liste uz Amber notifikaciju

---

## 8. Smart Concierge (Upsell + Cross-Sell)

### 8.1 Context Engine Logika
Iz `PricingIntelligenceDB` Orchestrator povlači **"tagovan" upsell kontekst** za svaku destinaciju i hotel:

```
hotel_tag: "slovenska_plaza_budva"
  → transfer: "Privatni transfer Tivat → Budva | 35€ (cel kombi)"
  → izlet_1: "Sunset Boat Tour | 45€/os"
  → promo: "10% popust u restoranu 'Jadran' za PrimeClick putnike"
```

### 8.2 Trigger Momenti (Kada iskačemo)
- **Pri izboru hotela:** Transfer ponuda
- **Pri izboru datuma:** Lokalni eventi i koncerti u tom periodu
- **Pri izboru broja dece:** Atrakcije prikladne za decu
- **Pri završetku odabira sobe:** Osiguranje

### 8.3 Vizuelni Format ("Bubble" Animacija)
- Iskače kao mala kartica sa slike hotela i kratkim tekstom (Framer Motion animacija)
- Ugao: Donji desni ugao ekrana (ne blokira sadržaj)
- Dugmad: `[ Dodaj u putni plan ]` | `[ Ne hvala ]`
- Automatski nestaje posle 8 sekundi ako korisnik ne reaguje

---

## 9. Pricing Intelligence Admin Panel

### Ruta: `http://localhost:5173/pricing-intelligence`

Ovaj panel je vaš **operativni centar** za upravljanje svim manuelnim dodacima i marketing porukama.

### Struktura Unosa (Tabelarni Format):

| Polje | Opis |
|---|---|
| **Identifikator** | Hotel slug ili destinacija (npr. `slovenska_plaza_budva`) |
| **Tip Usluge** | Transfer / Izlet / Ulaznica / Promo |
| **Naziv** | Pun naziv (npr. "Privatni Transfer Tivat - Budva") |
| **Cena** | Jedinična cena u EUR |
| **Promo Poruka** | Tekst koji se prikazuje u Smart Conciergeu |
| **Period Aktivnosti** | Datum od - Datum do (kada je promo aktivan) |
| **Izvor** | Manual / API Link |
| **Prioritet** | 1-10 (koji se prikazuje prvi ako ih ima više) |

### Čarter Unosi:
- Unos čarter linija: Relacija, Dani letenja, Vreme, Cena, Ukupan kapacitet, Prodato mesta

---

## 10. Package Export & Share Hub

### 10.1 Unified Itinerary (Jedinstveni Itinerer)
Generiše se čim korisnik "složi" paket. Sadrži:
- Logo agencije
- Kratki ID ponude (generisan za deljenje)
- Ceo Pax Summary Banner
- Tabela svih stavki sa pojedinačnim cenama
- Interaktivna mapa putanje
- Timeline putovanja
- Uslovi otkazivanja
- "Powered by PrimeClick" footer

### 10.2 Format Izvoza
- **PDF:** jsPDF biblioteka (već u projektu) — professionalan dokument
- **HTML:** Statična stranica sa live mapom — deljiv link

### 10.3 Unique Share Link
- Format: `prime.click/[random-6-chars]` (npr. `prime.click/xy3k9q`)
- Važi 48h od generisanja
- Svako ko klikne link vidi isti itinerer (bez logina)

### 10.4 Share Hub Modal
```
┌─────────────────────────────────┐
│  📤 Podelite svoju ponudu       │
├─────────────────────────────────┤
│  🟢 WhatsApp    🔵 Viber        │
│  🔷 Telegram    📨 Email        │
│  📘 Facebook    📸 Instagram    │
│                                  │
│  📥 Preuzmi PDF                  │
│  🌐 Preuzmi HTML                 │
│  🔗 Kopiraj Link                 │
└─────────────────────────────────┘
```

**Mobilni:** Native Share API (sistemski meni) za najbrže iskustvo.

---

## 11. Semafor Sistem (Globalno Pravilo)

Ovo pravilo važi **NA SVIM MODULIMA** bez izuzetka:

| Status | Boja | Oznaka | Akcija |
|---|---|---|---|
| ✅ Slobodno, Odmah potvrđeno | Emerald `#059669` | ⚡ Odmah | Dugme "Rezerviši" aktivno |
| ⚠️ Na Upit | Amber `#D97706` | ❓ Na upit | Dugme "Pošalji upit" aktivo |
| 🚫 Prodato | Nije prikazano | — | Filtrira se u Orchestratoru |
| 🏆 Prime Inventar | Zlatni Badge | PRIME | Vašport inventar uvek na vrhu |

**Hibridna Rezervacija:** Ako u jednoj pretrazi korisnik izabere kombinaciju ⚡ i ❓, cela rezervacija dobija status **"Na Upit"**, ali sistem interno beleži koje su sobe garantovane.

---

## 12. Redosled Implementacije (Faze Rada)

### Faza 1 (Foundation — Osnova):
1. `src/pages/PrimeSmartSearch/types.ts` — Proširiti na svih 8 tabova + sva nova polja
2. `src/pages/PrimeSmartSearch/stores/useSearchStore.ts` — Dodati packageBasket, pax logiku
3. `src/modules/search/orchestrator/` — Finalizacija config + engine

### Faza 2 (Search Form — Forme):
4. `src/pages/PrimeSmartSearch/styles/PrimeSmartSearch.css` — Pun Design System (Light + Dark)
5. `src/pages/PrimeSmartSearch/components/SearchTabs/SearchTabs.tsx` — Svih 8 tabova
6. `src/pages/PrimeSmartSearch/components/OccupancyWizard/` — Soba+Osobe+Deca sa godinama
7. `src/pages/PrimeSmartSearch/components/DatePicker/` — Expedia-style kalendar

### Faza 3 (Results — Rezultati):
8. `src/pages/PrimeSmartSearch/components/ResultsMosaic/` — Grid kartica
9. `src/pages/PrimeSmartSearch/components/RoomWizard/` — Slot-Based Room Selection
10. `src/pages/PrimeSmartSearch/components/FilterBar/` — Sticky filter traka

### Faza 4 (Package Wizard + Concierge):
11. `src/pages/PrimeSmartSearch/components/PackageBuilder/` — Višekoračni wizard
12. `src/pages/PrimeSmartSearch/components/PackageLedger/` — Live korpa
13. `src/pages/PrimeSmartSearch/components/SmartConcierge/` — Bubble animacije

### Faza 5 (Export + Share + Pricing Admin):
14. `src/pages/PricingIntelligence/` — Admin panel za manuelni unos
15. `src/pages/PrimeSmartSearch/components/ItineraryExport/` — PDF + HTML generisanje
16. `src/pages/PrimeSmartSearch/components/ShareHub/` — Social sharing modal

---

## 13. Kritična Razvojna Pravila (Imperativno)

1.  **CSS Izolacija:** Sve klase počinju sa `.v6-`. Nema globalnih CSS overrides.
2.  **TypeScript Strictness:** `strict: true`. Nema `any` tipova u production kodu.
3.  **Nema Regresije:** Pre svakog commit-a proveriti vizuelni izgled bar 3 postojeća modula.
4.  **Kontrast Pre Svega:** Svaka boja teksta mora proći WCAG AA kontrast test (4.5:1 ratio).
5.  **Mobile-First:** Svaka komponenta se prvo piše za mobilni, pa se širi na desktop.
6.  **Izolovane Komponente:** Svaka V6 komponenta mora raditi samostalno bez oslanjanja na globalni state izvan `useSearchStore`.

---

> [!NOTE]
> Ovaj dokument je kreiran na osnovu sesije planiranja od 21. Marta 2026. Sve tačke su eksplicitno odobrene od strane vlasnika projekta. Implementacija se vrši tačno prema ovoj specifikaciji.
