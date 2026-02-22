# Dynamic Package Builder - User Guide

## Pregled

Dynamic Package Builder je modul koji omogućava kreiranje i pregled kompleksnih putnih paketa koji kombinuju letove, smeštaj, transfere i dodatne usluge u jednu celinu. Modul pruža vizuelni prikaz itinerara dan-po-dan, detaljne informacije o svim komponentama paketa i transparentan pregled cena.

---

## Pristup Modulu

### Sa Dashboard-a
1. Prijavite se u Olympic Hub aplikaciju
2. Na Dashboard-u pronađite karticu **"Dynamic Package Builder"** (označena sa "NOVO" badge-om)
3. Kliknite na karticu da otvorite modul

### Iz Navigacije
1. U horizontalnom meniju na vrhu stranice kliknite na **"Paketi"**
2. Ili u URL bar-u unesite: `https://localhost:5173/packages`

---

## Interfejs Paketa

### 1. Zaglavlje Paketa (Package Header)

Na vrhu stranice videćete:

- **Ikona paketa**: Vizuelna reprezentacija paketa
- **Naziv paketa**: Npr. "Milano & Paris Adventure"
- **Opis**: Kratak opis paketa
- **Meta informacije**:
  - 📅 Trajanje (npr. "8 dana")
  - 👥 Broj putnika (npr. "2 putnika")
  - 📍 Broj destinacija (npr. "2 destinacije")
- **Cena**:
  - Ukupna cena (veliki broj)
  - Cena po osobi (manji tekst ispod)

**Primer**:
```
Milano & Paris Adventure
Otkrijte čaroliju Milana i Pariza u jednom nezaboravnom putovanju

📅 8 dana  👥 2 putnika  📍 2 destinacije

2978.80 €
1489.40 € po osobi
```

---

### 2. Pregled Destinacija (Destinations Overview)

Ova sekcija prikazuje sve destinacije u paketu u vizuelnom flow-u:

**Elementi**:
- **Zastava zemlje**: Dvoslovni kod zemlje (npr. "IT", "FR")
- **Grad**: Naziv grada (npr. "Milano", "Paris")
- **Broj noći**: Koliko noći provodite u destinaciji
- **Datumi**: Datum dolaska i odlaska
- **Strelice**: Pokazuju redosled destinacija

**Primer**:
```
[IT] Milano          →    [FR] Paris
     3 noći                    4 noći
     01. jun - 04. jun         04. jun - 08. jun
```

**Napomena**: Na mobilnim uređajima, destinacije se prikazuju vertikalno.

---

### 3. Selektor Dana (Day Selector)

Grid sa svim danima paketa koji omogućava pregled itinerara dan-po-dan.

**Kako koristiti**:
1. Kliknite na bilo koji dan da vidite detaljan itinerar za taj dan
2. Aktivni dan je označen sa **purple gradient** pozadinom
3. Svaki dan prikazuje:
   - **Broj dana**: "Dan 1", "Dan 2", itd.
   - **Datum**: Npr. "01. jun 2024"
   - **Destinacija**: Grad u kojem se nalazite tog dana

**Primer**:
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Dan 1     │   Dan 2     │   Dan 3     │   Dan 4     │
│ 01. jun     │ 02. jun     │ 03. jun     │ 04. jun     │
│   Milano    │   Milano    │   Milano    │   Paris     │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

---

### 4. Itinerar Dana (Day Itinerary)

Detaljni prikaz svih aktivnosti za selektovani dan.

**Zaglavlje dana**:
- Broj dana i dan u nedelji (npr. "Dan 1 - Subota")
- Puni datum (npr. "01. jun 2024")
- Trenutna destinacija sa ikonom lokacije

**Timeline aktivnosti**:

Svaka aktivnost prikazuje:
- **Vreme**: Kada počinje aktivnost (npr. "09:00")
- **Ikona**: Emoji ili ikona koja predstavlja tip aktivnosti
  - ✈️ Let
  - 🏨 Check-in/Check-out hotela
  - 🚗 Transfer
  - 🎫 Tura ili aktivnost
  - 🍽️ Restoran
- **Naziv**: Kratak naziv aktivnosti
- **Opis**: Detaljniji opis šta aktivnost uključuje
- **Trajanje**: Koliko dugo traje (ako je primenjivo)
- **Lokacija**: Gde se aktivnost odvija (ako je primenjivo)
- **Konektor**: Vertikalna linija koja povezuje aktivnosti

**Primer aktivnosti**:
```
09:00  ✈️  Let BEG → MXP
           Direktan let sa Air Serbia
           ⏱️ 2h 15min  📍 Aerodrom Beograd

12:30  🚗  Transfer Aerodrom → Hotel
           Privatni transfer do hotela
           ⏱️ 45min  📍 Hotel Principe di Savoia

14:00  🏨  Check-in Hotel
           Hotel Principe di Savoia - 5★
           📍 Milano
```

---

### 5. Pregled Komponenti (Components Summary)

Četiri kartice koje prikazuju sve komponente paketa:

#### A. Letovi ✈️
- **Broj letova**: Prikazan u badge-u
- **Lista letova**: Svaki let prikazuje:
  - Rutu (npr. "BEG → MXP")
  - Broj leta i avio-kompaniju
  - Cenu
- **Ukupno**: Suma svih letova

**Primer**:
```
✈️ Letovi                    [3]
────────────────────────────────
BEG → MXP                 400.00 €
AZ 123 • Air Serbia

MXP → CDG                 200.00 €
AF 456 • Air France

CDG → BEG                 200.00 €
JU 789 • Air Serbia
────────────────────────────────
Ukupno: 800.00 €
```

#### B. Hoteli 🏨
- **Broj hotela**: Prikazan u badge-u
- **Lista hotela**: Svaki hotel prikazuje:
  - Naziv hotela
  - Broj noći i tip ishrane
  - Cenu
- **Ukupno**: Suma svih hotela

**Primer**:
```
🏨 Hoteli                    [2]
────────────────────────────────
Hotel Principe di Savoia  840.00 €
3 noći • Polupansion

Hotel Le Marais           840.00 €
4 noći • Samo doručak
────────────────────────────────
Ukupno: 1,680.00 €
```

#### C. Transferi 🚗
- **Broj transfera**: Prikazan u badge-u
- **Lista transfera**: Svaki transfer prikazuje:
  - Rutu (npr. "Aerodrom → Hotel")
  - Tip vozila
  - Cenu
- **Ukupno**: Suma svih transfera

**Primer**:
```
🚗 Transferi                 [6]
────────────────────────────────
Aerodrom → Hotel           60.00 €
Privatni automobil

Hotel → Aerodrom           60.00 €
Privatni automobil
────────────────────────────────
Ukupno: 360.00 €
```

#### D. Dodatne Usluge 🎫
- **Broj usluga**: Prikazan u badge-u
- **Lista usluga**: Svaka usluga prikazuje:
  - Naziv usluge
  - Destinaciju i količinu
  - Ukupnu cenu
- **Ukupno**: Suma svih dodatnih usluga

**Primer**:
```
🎫 Dodatne Usluge            [4]
────────────────────────────────
Milan City Walking Tour    40.00 €
Milano • 2x

Disneyland Paris Tickets   80.00 €
Paris • 2x

Eiffel Tower Dinner        18.80 €
Paris • 2x
────────────────────────────────
Ukupno: 138.80 €
```

---

### 6. Detalji Cene (Price Breakdown)

Transparentan prikaz svih troškova paketa.

**Struktura**:
1. **Letovi**: Cena svih letova sa brojem putnika
2. **Hoteli**: Cena svih hotela sa ukupnim brojem noći
3. **Transferi**: Cena svih transfera sa brojem transfera
4. **Dodatne usluge**: Cena svih dodatnih usluga
5. **Međuzbir**: Suma svih komponenti (bold)
6. **Takse i naknade**: Dodatni troškovi
7. **UKUPNO**: Finalna cena (large, bold, purple)
8. **Po osobi**: Cena po putniku (highlighted sa gradient pozadinom)

**Primer**:
```
💶 Detalji Cene
─────────────────────────────────────────
Letovi (2 putnika):              800.00 €
Hoteli (7 noći):               1,680.00 €
Transferi (6x):                  360.00 €
Dodatne usluge:                  138.80 €
─────────────────────────────────────────
Međuzbir:                      2,978.80 €
Takse i naknade:                   0.00 €
─────────────────────────────────────────
UKUPNO:                        2,978.80 €
─────────────────────────────────────────
┌─────────────────────────────────────┐
│ Po osobi (2 putnika): 1,489.40 €   │
└─────────────────────────────────────┘
```

---

### 7. Akciona Dugmad (Action Buttons)

Na dnu stranice nalaze se dva dugmeta:

#### "Nazad na listu" (Secondary Button)
- Vraća vas na listu svih paketa
- Siva pozadina sa border-om
- Hover effect: svetlija pozadina

#### "Potvrdi Paket" (Primary Button)
- Pokreće proces rezervacije paketa
- Zeleni gradient pozadina
- Ikona check mark
- Hover effect: lift animation + shadow

---

## Responsive Dizajn

### Desktop (> 768px)
- Destinacije prikazane horizontalno sa strelicama
- Day selector u grid layout-u (više kolona)
- Components summary u 2-4 kolone
- Activity timeline sa vertikalnim konektorima

### Mobile (≤ 768px)
- Destinacije prikazane vertikalno
- Day selector u manje kolone
- Components summary u 1 kolonu
- Activity timeline prilagođen za mobilni prikaz
- Horizontalni scroll gde je potrebno

---

## Interaktivnost

### Hover Effects
- **Day buttons**: Svetlija pozadina i border
- **Activity cards**: Svetlija pozadina
- **Action buttons**: Lift animation i shadow
- **Component items**: Subtle highlight

### Active States
- **Selected day**: Purple gradient pozadina
- **Current section**: Highlighted u navigaciji

### Animacije
- Smooth transitions (0.2s - 0.3s)
- Gradient animations na hover
- Fade-in effects za content

---

## Tipovi Aktivnosti

Package Builder podržava različite tipove aktivnosti:

| Ikona | Tip Aktivnosti | Opis |
|-------|----------------|------|
| ✈️ | Let | Dolazni/odlazni/transfer letovi |
| 🏨 | Hotel | Check-in/Check-out |
| 🚗 | Transfer | Prevoz između lokacija |
| 🎫 | Tura | Organizovane ture i razgledanja |
| 🎭 | Kultura | Muzeji, pozorišta, koncerti |
| 🎢 | Zabava | Tematski parkovi, atrakcije |
| 🍽️ | Restoran | Rezervacije restorana |
| 🛍️ | Shopping | Shopping ture |
| 🏃 | Aktivnost | Sportske i outdoor aktivnosti |
| ⏰ | Slobodno vreme | Free time za samostalno istraživanje |

---

## Saveti za Korišćenje

### 1. Pregledanje Itinerara
- **Počnite sa Dan 1**: Kliknite na prvi dan da vidite arrival aktivnosti
- **Pratite timeline**: Vertikalna linija pokazuje redosled aktivnosti
- **Obratite pažnju na vremena**: Planirajte svoj dan prema vremenima aktivnosti

### 2. Analiza Cena
- **Proverite components**: Vidite šta je uključeno u svaku kategoriju
- **Uporedite cene**: Lako uporedite cene različitih komponenti
- **Razumite total**: Price breakdown pokazuje kako se formira finalna cena

### 3. Planiranje
- **Broj noći**: Proverite koliko noći provodite u svakoj destinaciji
- **Transferi**: Obratite pažnju na transfere između lokacija
- **Dodatne usluge**: Vidite koje ture i aktivnosti su uključene

### 4. Mobilno Korišćenje
- **Scroll horizontalno**: Za destinacije i day selector
- **Tap na dan**: Za promenu itinerara
- **Pinch to zoom**: Za detalje na manjim ekranima

---

## Često Postavljana Pitanja (FAQ)

### Q: Kako da kreiram novi paket?
**A**: Trenutno modul prikazuje postojeće pakete. Funkcionalnost za kreiranje novih paketa biće dostupna u sledećoj verziji sa interaktivnim wizard-om.

### Q: Mogu li da izmenim postojeći paket?
**A**: Funkcionalnost za izmenu paketa je u planu za buduće verzije.

### Q: Šta se dešava kada kliknem "Potvrdi Paket"?
**A**: Trenutno ovo dugme vodi na proces rezervacije paketa (u razvoju). U finalnoj verziji, otvoriće se booking flow sa formom za unos podataka putnika i plaćanje.

### Q: Da li mogu da sačuvam paket za kasnije?
**A**: Funkcionalnost za čuvanje paketa biće dostupna u sledećoj verziji sa integracijom baze podataka.

### Q: Kako se kalkulišu cene?
**A**: Cene se automatski kalkulišu sabiranjem svih komponenti (letovi + hoteli + transferi + dodatne usluge) plus takse i naknade. Cena po osobi se dobija deljenjem ukupne cene sa brojem putnika.

### Q: Mogu li da filtriram pakete?
**A**: Funkcionalnost za pretragu i filtriranje paketa biće dostupna kada se implementira lista svih paketa.

### Q: Da li su cene fiksne?
**A**: Trenutno prikazane cene su statične. U budućoj verziji, cene će se dinamički ažurirati na osnovu dostupnosti i real-time API podataka.

### Q: Šta znači "Novo" badge?
**A**: "Novo" badge označava da je ova funkcionalnost nedavno dodata u aplikaciju.

---

## Tehnička Podrška

### Problemi sa Prikazom
- **Refresh stranice**: Pritisnite F5 ili Ctrl+R
- **Clear cache**: Obrišite browser cache
- **Proverite konzolu**: Otvorite Developer Tools (F12) i proverite Console za greške

### Prijava Grešaka
Ako naiđete na problem:
1. Napravite screenshot problema
2. Zabeležite korake koji su doveli do problema
3. Kontaktirajte tehničku podršku sa detaljima

---

## Sledeće Verzije

### Planirane Funkcionalnosti

#### Verzija 2.0 - Interactive Package Builder
- ✨ 7-step wizard za kreiranje paketa
- ✨ Drag & drop za organizaciju aktivnosti
- ✨ Real-time price updates
- ✨ Multi-provider search integration

#### Verzija 2.1 - Package Management
- ✨ Lista svih paketa
- ✨ Search i filter
- ✨ Duplicate package
- ✨ Archive/Delete packages

#### Verzija 2.2 - Advanced Features
- ✨ Package templates
- ✨ Seasonal pricing
- ✨ Group discounts
- ✨ Custom branding

#### Verzija 3.0 - Booking Integration
- ✨ Complete booking flow
- ✨ Payment processing
- ✨ Email confirmations
- ✨ Booking management

---

## Zaključak

Dynamic Package Builder je moćan alat za pregled i upravljanje kompleksnim putnim paketima. Sa intuitivnim interfejsom, vizuelnim itinerarom i detaljnim prikazom cena, omogućava vam da lako razumete šta paket uključuje i kako je formirana cena.

Za dodatna pitanja ili podršku, kontaktirajte Olympic Hub tim.

**Verzija**: 1.0.0  
**Poslednje ažuriranje**: Januar 2026  
**Status**: Production Ready
