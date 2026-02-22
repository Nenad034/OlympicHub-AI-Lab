# OLYMPIC HUB - SISTEM STABILNOSTI DIZAJNA I LOGIKE

Ovaj dokument služi kao zvanična check-lista za potvrdu izgleda i funkcionalnosti aplikacije. 
Stavke označene sa `[x]` su **POTVRĐENE** i ne smeju se menjati bez eksplicitnog zahteva korisnika.

---

## 1. SMART SEARCH & GLOBAL SEARCH (Hotel Results)
Status: *U toku provere*

### Layout & Sizing
- [ ] **Grid Mode**: Fiksno 4 kolone (banera) na desktopu (1400px+).
- [ ] **Card Height**: Visina od 540px u gridu kako bi sve informacije stale bez preklapanja.
- [ ] **Image Ratio**: Slika hotela zauzima gornji deo kartice sa `height: 240px`.
- [ ] **Price Section**: Cena i dugme "Detalji" su uvek na dnu kartice u gridu, vertikalno naslagani.

### Brending & Boje
- [ ] **Primary Action**: Sva glavna dugmad (Search, View More) koriste ljubičasti gradijent (`#8E24AC` -> `#6A1B9A`).
- [ ] **Card Background**: Midnight Blue (`#1A2B3C`) za tamnu temu / Prime temu.
- [ ] **Text Colors**: 
    - Naslovi: White
    - Lokacija/Datumi: Silver Slate (`#B0BEC5`)
    - Cene: Yellow/Gold (`#fbbf24`)

### Tipografija
- [ ] **Naslovi**: Montserrat font (Bold/ExtraBold).
- [ ] **Body**: Roboto ili Inter font.
- [ ] **Skaliranje**: Globalni `zoom: 0.92` je primenjen i stabilan.

---

## 2. FLIGHT SEARCH (Letovi)
Status: *U toku provere*

### Form Design
- [ ] **Trip Type**: Pill selektori (Round-trip, One-way) koriste ljubičastu boju za aktivno stanje.
- [ ] **Search Button**: Centralno dugme sa logotipom i ljubičastom pozadinom.
- [ ] **Counters**: Kontrole za putnike (+/-) imaju hover efekat u ljubičastoj boji.

### Results
- [ ] **Flight Cards**: Kompaktan prikaz sa jasnim logotipom avio kompanije i "Path" vizualom (aviončić između gradova).
- [ ] **Price Tag**: Jasno istaknuta cena u EUR.

---

## 3. RESERVATION ARCHITECT (Dossier & Dashboard)
Status: *Čeka na proveru*

### Dashboard
- [ ] **Stat Cards**: Suptilne bordure i Petroleum (Petrolej) akcenti u svetloj temi.
- [ ] **Table Layout**: Jasne kolone sa statusima rezervacija (Confirmed, Pending, Canceled).

### Dossier Form
- [ ] **Step Indicator**: Procesni koraci na vrhu su vidljivi i intuitivni.
- [ ] **Input Styles**: Konzistentni sa ostatkom aplikacije (border-radius: 12px).

---

## 4. B2B PORTAL / DASHBOARD
Status: *U toku provere*

### Branding & Search
- [x] **Quick Search**: Brza pretraga aplikacija je pomerena sa TopBar-a na Dashboard.
- [x] **Search Positioning**: Nalazi se tačno iznad središnje kartice (Globalni Hub Search), centrirano.
- [x] **Search Style**: Koristi brendiranu boju bordure (`#8E24AC`) i moderni shadow efekat.

### Sidebar
- [ ] **Collapsible**: Mogućnost skupljanja u icon-only mod.
- [ ] **Width**: Smanjena širina za 20% kako bi centralni sadržaj bio dominantan.

---

## 5. DYNAMIC PACKAGE WIZARD
Status: *Čeka na proveru*

### Step 1 (Destinations)
- [ ] **Horizontal Layout**: Polja za destinaciju, datume i putnike su grupisana horizontalno.
- [ ] **Visual Hierarchy**: Naziv destinacije je najistaknutiji element.

---

## OPŠTA PRAVILA ZA AGENTA (ANTIGRAVITY):
1. **ZABRANJENO** je menjati boje potvrđenih modula na generičke (plava, zelena) ako je potvrđena ljubičasta.
2. **ZABRANJENO** je menjati layout kolona (npr. sa 4 na 3) nakon potvrde.
3. Svaki novi CSS "Fix" fajl mora biti izolovan ili proveren u odnosu na ovaj dokument.
