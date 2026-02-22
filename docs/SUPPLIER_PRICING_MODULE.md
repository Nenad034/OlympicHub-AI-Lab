# Dokumentacija: Modul za Upravljanje Cenama Dobavljača (Supplier Pricing Module)

**Datum kreiranja**: 04.02.2026.
**Autor**: Olympic Hub AI Team

## Pregled
Ovaj modul (`SupplierAdmin.tsx`) je razvijen da omogući **centralizovano upravljanje cenovnom politikom** prema dobavljačima. Cilj je bio da se razdvoji logika *Ulaznih cena* (Neto trošak) od *Izlaznih cena* (Prodajna cena), pružajući granularnu kontrolu nad maržama i provizijama.

## Ključne Funkcionalnosti

### 1. Lista Dobavljača
Centralni pregled svih partnera sa ključnim informacijama:
- **Status konekcije**: API, Offline ili Hybrid.
- **Država**: Poreklo dobavljača.
- **Finansijski Pregled**: Prikaz definisane "Ulazne Provizije" i "Izlazne Marže" na globalnom nivou za svakog dobavljača.

### 2. Globalna Matrica Cena (Pricing Matrix)
Implementirana je logika "Vodopada cena" (Pricing Waterfall):
1.  **Bruto Cena (Gross)**: Cena koju dobijamo od dobavljača (npr. 100€).
2.  **Ulazna Provizija (Incoming Commission)**: Procenat koji dobavljač nama daje (npr. 10%). Ovo definiše naš **Neto Trošak** (90€).
3.  **Izlazna Marža (Outgoing Margin)**: Procenat ili fiksni iznos koji MI dodajemo na Neto Trošak (npr. 5%). Ovo definiše našu **Osnovnu Prodajnu Cenu** (94.5€).
4.  **B2B / Subagent Provizija**: (Već postojeći modul) Logika koja se primenjuje na Osnovnu Prodajnu Cenu za dalje partnere.

Matrica omogućava definisanje ovih pravila na tri nivoa:
*   **Globalno**: Za sve dobavljače.
*   **API Nivo**: Specifično za Solvex, Amadeus, itd.
*   **Destinacija**: Specifična pravila za određene regije (npr. Grčka).

### 3. Specijalni Izuzeci (Exceptions)
Mogućnost finog podešavanja ("Override") pravila za specifične scenarije:
- **Targeting**: Konkretan hotel, period putovanja ili tip sobe.
- **Fleksibilnost**: Definisanje drugačijih stopa provizije/marže koje važe samo u određenom periodu (npr. "Early Booking Akcija" za Hilton hotele).

## Tehnička Implementacija

### Fajlovi
-   `src/pages/SupplierAdmin.tsx`: Glavna komponenta modula. Koristi React State za upravljanje podacima (trenutno Mock podaci, spremno za API integraciju).
-   `src/pages/SubagentAdmin.css`: Stilovi su deljeni sa `SubagentAdmin` modulom radi konzistentnosti UI-a (Matrix tabele, kartice, bedževi).
-   `src/router/index.tsx`: Dodata nova ruta `/supplier-admin` zaštićena `minLevel={6}` (samo za administratore).
-   `src/components/layout/Sidebar.tsx`: Dodat link u navigaciji ka novom modulu.

### Vizuelni Identitet
Modul koristi uspostavljeni "Olympic Dark" dizajn sistem:
-   **Ikone**: `lucide-react` (Truck, Layers, Shield).
-   **Boje**: Korišćenje semantičkih boja za finansije (Zelena za Maržu/Proviziju, Plava za Neto).
-   **Interakcija**: Tabovi za navigaciju između pod-sekcija (Lista, Matrica, Izuzeci).

## Kako koristiti
1.  Pristupite modulu putem Sidebara: **"Supplier Pricing"**.
2.  Koristite tab **"Globalna Matrica"** za pregled logike formiranja cena.
3.  Koristite **"Novo Pravilo"** za dodavanje izuzetaka (npr. veća marža za specifičan hotel).

---
*Napomena: Trenutna verzija koristi simulirane podatke. Sledeći korak je povezivanje sa Backend API-jem za perzistenciju pravila.*
