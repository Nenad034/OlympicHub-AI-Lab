# Flight Booking System - User Guide

## 📖 Vodič za Korišćenje

Dobrodošli u Olympic Hub Flight Booking System! Ovaj vodič će vas provesti kroz kompletan proces pretrage i rezervacije letova.

---

## 🔍 Pretraga Letova

### Pristup
Idite na: **`/flights`** ili kliknite **"Letovi"** u sidebar-u

### Osnovne Opcije

#### 1. **Polazište i Odredište**
- Unesite **IATA kod** aerodroma (3 slova)
- Primeri:
  - BEG - Beograd
  - CDG - Pariz
  - LHR - London
  - JFK - New York
  - FRA - Frankfurt

#### 2. **Datumi**
- **Polazak**: Datum odlaska
- **Povratak**: Datum povratka (opciono za one-way)
- Automatski se postavljaju na sutra + 7 dana

#### 3. **Putnici**
- **Odrasli**: Minimum 1, maksimum 9
- **Deca**: 0-9 (ispod 12 godina)

#### 4. **Klasa**
- Ekonomska
- Premium Ekonomska
- Biznis
- Prva

---

### Napredne Opcije

Kliknite **"Napredne opcije"** za dodatne filtere:

#### **Fleksibilni Datumi** 📅
Pretražite letove u rasponu oko izabranog datuma:
- **Tačan datum** - Samo izabrani datum
- **± 1 dan** - 3 dana (dan pre, izabrani, dan posle)
- **± 2 dana** - 5 dana
- **± 3 dana** - 7 dana

**Benefit**: Pronađite jeftinije letove ako ste fleksibilni!

#### **Broj Presedanja** ✈️
Filtrirajte po broju presedanja:
- **⚡ Direktan let** - Najbrže, ali može biti skuplje
- **Max 1 presedanje** - Dobar balans
- **Max 2 presedanja** - Više opcija, često jeftinije
- **Bilo koji** - Najširi izbor

---

### Pretraga

1. Popunite sva obavezna polja
2. (Opciono) Podesite napredne opcije
3. Kliknite **"Pretraži Letove"**
4. Sačekajte 1-2 sekunde dok sistem pretražuje

---

## 📊 Rezultati Pretrage

### Prikaz Rezultata

Svaka kartica prikazuje:
- **Airline logo** - Logo avio-kompanije
- **Ruta**: Polazište → Odredište
- **Vremena**: Polazak i dolazak
- **Trajanje** leta
- **Broj presedanja**
- **Cena** - Ukupna cena za sve putnike

### Sortiranje

Sortirajte rezultate po:
- **Ceni** (najjeftiniji prvo) - Default
- **Trajanju** (najkraći prvo)
- **Vremenu polaska** (najraniji prvo)

---

### Više Informacija

Kliknite **"Više informacija"** na bilo kojoj kartici da vidite:

#### **Detalji Cene** 💰
- Osnovna cena
- Takse i naknade
- **Ukupno**

#### **Prtljag** 🧳
- Ručni prtljag (količina + težina)
- Predati prtljag (količina + težina)

#### **Detaljni Segmenti** ✈️
Za svaki let:
- Airline logo + ime + broj leta
- Tip aviona (npr. A320)
- Polazak: Vreme, aerodrom, grad
- Dolazak: Vreme, aerodrom, grad
- Trajanje
- Presedanje info (ako postoji)

#### **Usluge** ⚡
- Wi-Fi
- In-flight entertainment
- Power outlets
- Itd.

---

## 🎫 Rezervacija Leta

### Korak 1: Izbor Leta

1. Pregledajte rezultate
2. Kliknite **"Više informacija"** za detalje
3. Kliknite **"Izaberi"** na željenom letu
4. Bićete preusmereni na stranicu za rezervaciju

---

### Korak 2: Podaci o Putnicima

#### Šta Treba Uneti

Za **svakog putnika**:
- **Ime** (kao u pasoš/ličnoj karti)
- **Prezime** (kao u pasoš/ličnoj karti)
- **Datum rođenja** (DD.MM.YYYY)
- **Pol** (Muški/Ženski)

Za **prvog putnika** (kontakt osoba):
- **Email** - Za potvrdu rezervacije
- **Telefon** - Za kontakt

#### ⚠️ Važno
- Podaci **moraju biti identični** sa dokumentima koje ćete koristiti za putovanje
- Proverite **pravopis** pre nego što nastavite
- Prvi putnik prima sve email notifikacije

#### Validacija
- Sistem proverava da li su sva polja popunjena
- Ako nešto nedostaje, dobićete upozorenje

#### Nastavak
Kliknite **"Nastavi na plaćanje"** kada završite

---

### Korak 3: Način Plaćanja

Izaberite način plaćanja:

#### **Opcija A: Kreditna/Debitna Kartica** 💳

**Potrebni Podaci**:
1. **Broj kartice** (16-19 cifara)
   - Format: 1234 5678 9012 3456
2. **Ime na kartici** (kao na kartici)
   - Format: MARKO MARKOVIC
3. **Datum isteka**:
   - Mesec (01-12)
   - Godina (2026-2036)
4. **CVV kod** (3-4 cifre)
   - Na poleđini kartice

**Sigurnost** 🔒:
- Svi podaci su zaštićeni SSL enkripcijom
- Kartični podaci se ne čuvaju
- PCI DSS compliant

#### **Opcija B: Bankarska Transakcija** 🏦

**Proces**:
1. Rezervacija se kreira
2. Dobijate email sa detaljima za uplatu:
   - Broj računa
   - Poziv na broj
   - Iznos
3. Izvršite uplatu u banci
4. Rezervacija se potvrđuje nakon prijema uplate (1-2 radna dana)

**Napomena**: Rezervacija je privremena dok se ne primi uplata

---

### Korak 4: Potvrda Rezervacije

#### Uspešna Rezervacija ✅

Videćete:
- **Zeleni check icon** - Potvrda uspeha
- **Booking Reference** - Interni broj rezervacije
- **PNR** - Airline booking code (koristite za check-in)
- **Status**: Potvrđeno

#### Email Potvrda 📧

Dobićete email sa:
- Detaljima leta
- Podacima o putnicima
- Booking reference i PNR
- Instrukcijama za check-in
- E-ticket (PDF)

#### Sledeći Koraci

1. **Sačuvajte PNR** - Potreban za check-in
2. **Proverite email** - Potvrda i e-ticket
3. **Check-in** - 24h pre leta (online ili na aerodromu)
4. **Prtljag** - Proverite dozvoljenu težinu
5. **Dokumenta** - Pasoš/lična karta, viza (ako je potrebna)

---

## 💡 Saveti i Trikovi

### Najbolje Cene
- Koristite **fleksibilne datume** (± 2-3 dana)
- Pretražujte **unapred** (2-3 meseca)
- Budite fleksibilni sa **presedanjima**
- Uporedite **različite dane u nedelji**

### Brže Putovanje
- Izaberite **direktan let**
- Proverite **vreme presedanja** (minimum 1h)
- Izaberite **jutarnje letove** (manje kašnjenja)

### Prtljag
- Proverite **dozvoljenu težinu** u detaljima
- **Ručni prtljag** - Obično 8kg
- **Predati prtljag** - Obično 23kg
- Dodatni prtljag se **naplaćuje**

### Check-in
- **Online check-in** - 24h pre leta
- **Aerodrom check-in** - 2-3h pre leta
- **Boarding pass** - Sačuvajte (digital ili print)

---

## ❓ Često Postavljana Pitanja

### **Kako da promenim rezervaciju?**
Kontaktirajte našu podršku sa PNR brojem. Izmene zavise od tarife.

### **Mogu li da otkažem rezervaciju?**
Da, ali zavisi od tarife. Neke tarife su non-refundable.

### **Šta ako propustim let?**
Kontaktirajte avio-kompaniju odmah. Možda možete da rebookujete.

### **Kako da dodam prtljag?**
Možete dodati tokom online check-in-a ili na aerodromu (skuplje).

### **Treba li mi viza?**
Proverite zahteve za destinaciju. Mi ne obezbedujemo vize.

### **Šta ako se cena promeni?**
Cena je garantovana nakon potvrde rezervacije.

### **Kako da kontaktiram podršku?**
Email: support@olympichub.com  
Telefon: +381 11 123 4567  
Radno vreme: 09:00 - 21:00

---

## 🔧 Tehnička Podrška

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Problemi sa Plaćanjem
- Proverite da li kartica podržava online plaćanje
- Proverite limit na kartici
- Pokušajte drugi browser
- Kontaktirajte banku

### Greške pri Pretrazi
- Proverite IATA kodove
- Proverite datume (ne mogu biti u prošlosti)
- Pokušajte refresh stranice
- Očistite cache

---

## 📞 Kontakt

**Olympic Hub Support**  
📧 Email: support@olympichub.com  
📱 Telefon: +381 11 123 4567  
🕐 Radno vreme: 09:00 - 21:00 (Pon-Ned)

**Emergency (24/7)**  
📱 +381 11 999 9999

---

**Srećan put!** ✈️🌍
