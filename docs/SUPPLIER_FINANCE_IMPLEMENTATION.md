# Implementacija Modula za Plaćanje Dobavljačima (Accounts Payable)

Ovaj dokument prati sve korake u razvoju inteligentnog sistema za upravljanje obavezama prema dobavljačima, VCC automatizaciju i praćenje likvidnosti.

## 1. Arhitektura Baze Podataka (Database Schema)

### 1.1. `supplier_obligations` (Glavna tabela dugovanja)
Svaka stavka duga je povezana sa rezervacijom.
- `id`: UUID (Primary Key)
- `reservation_id`: UUID (Foreign Key ka `reservations.id`)
- `cis_code`: String (Radi brže pretrage i sravnjenja)
- `supplier_id`: UUID (Foreign Key ka `suppliers.id` ili sistemski ID)
- `net_amount`: Decimal (Iznos koji dugujemo dobavljaču)
- `currency`: String (ISO kod valute)
- `exchange_rate_at_booking`: Decimal (Kurs na dana rezervacije)
- `cancellation_deadline`: Timestamp (Kritični datum sa API-ja)
- `payment_deadline`: Timestamp (Datum dospelosti plaćanja - kalkulisan)
- `status`: Enum (`unpaid`, `processing`, `paid`, `disputed`, `refund_pending`)
- `priority_score`: Integer (0-100, automatski kalkulisan)
- `payment_method_preferred`: Enum (`bank`, `vcc`, `cash`, `compensation`)
- `notes`: Text
- `created_at`: Timestamp

### 1.2. `supplier_payment_rules` (Pravila po dobavljaču)
- `id`: UUID
- `supplier_id`: UUID
- `rule_name`: String
- `rule_type`: Enum (`DaysBeforeArrival`, `DaysAfterBooking`, `EndOfMonthPlusDays`, `Manual`)
- `rule_value`: Integer (Npr. 15 za 15. u mesecu)
- `apply_to`: Enum (`FreeCancellationDate`, `CheckInDate`, `BookingDate`)
- `is_active`: Boolean

### 1.3. `supplier_transactions` (Evidencija uplata)
- `id`: UUID
- `obligation_id`: UUID
- `amount_paid`: Decimal
- `currency`: String
- `payment_method`: String
- `bank_name`: String
- `transaction_ref`: String (Broj izvoda/transakcije)
- `vcc_id`: String (Ako je plaćeno virtuelnom karticom)
- `executed_by`: String (ID operatera)
- `executed_at`: Timestamp

### 1.4. `supplier_vcc_settings` (VCC Podešavanja)
- `id`: UUID
- `supplier_id`: UUID
- `auto_generate`: Boolean
- `trigger_days_before`: Integer (Npr. 1 dan pre penala)
- `max_limit_percent`: Integer (Npr. 100% neto iznosa)

---

## 2. Plan Implementacije

- [x] **Korak 1: Kreiranje SQL Šeme** -> Definisanje tabela u Supabase sistemu (Završeno).
- [x] **Korak 2: Inteligentna Logika Prioriteta** -> Razvoj skripte koja računa `priority_score` (Završeno).
- [x] **Korak 3: Supplier Finance Service** -> TypeScript servis za CRUD operacije (Završeno).
- [x] **Korak 4: Dashboard UI** -> "Semafor" prikaz za direktora i listu obaveza (Završeno).
- [x] **Korak 5: VCC Integracija (Mock/API)** -> Simulacija ili povezivanje sa API-jem za kartice (Završeno).
- [x] **Korak 6: FX Monitoring** -> Praćenje kursnih razlika u realnom vremenu (Završeno).

## Faza 2: Napredna Analitika i Profitabilnost (U RADU)
- [ ] **Korak 7: Sistem Delimičnih Plaćanja** -> Akontacije i praćenje preostalog duga.
- [ ] **Korak 8: Arhiva Plaćanja** -> Poseban pregled za istorijat transakcija.
- [ ] **Korak 9: Yield Reporting (Bruto vs Neto)** -> Izveštaji o zaradi po dobavljaču i rezervaciji.
- [ ] **Korak 10: Dualni Filteri** -> Filtriranje po datumu rezervacije i datumu boravka.
- [ ] **Korak 11: Realni vs Predviđeni Neto** -> Potvrda konačnih računa.
