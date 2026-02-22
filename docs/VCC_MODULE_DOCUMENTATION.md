# Dokumentacija VCC Modula (Virtual Credit Card Automation)

Ovaj dokument služi kao tehnički i operativni vodič za VCC modul unutar **Prime ClickToTravel** ERP sistema. Modul je dizajniran da automatizuje isplate dobavljačima uz maksimalnu sigurnost i eliminaciju deviznih rizika.

## 1. Arhitektura Podataka (Baza)

Centralno mesto za konfiguraciju je tabela `public.supplier_vcc_settings`.

### Ključne Kolone:
- `vcc_type`: Tip kartice (Visa, Mastercard, AMEX) - usklađeno sa zahtevima dobavljača.
- `activation_delay`: Broj dana u odnosu na check-in kada kartica postaje aktivna (negativno = pre, pozitivno = posle).
- `max_limit_buffer_percent`: Procenat tolerancije (npr. 2%) koji se dodaje na neto iznos radi pokrivanja kursnih razlika.
- `currency_code`: Valuta u kojoj se kartica generiše (EUR, USD, BGN...).
- `active_duration_days`: Koliko dugo kartica ostaje aktivna nakon aktivacije.

## 2. Automatizacija (Edge Function)

Logika se nalazi u Supabase Edge funkciji `vcc-automation`.

### Radni tok (Workflow):
1. **Trigger**: Funkcija se pokreće na `INSERT` operaciju u tabeli `reservations`.
2. **Pretraga Pravila**: Funkcija proverava `auto_generate` status za dobavljača iz rezervacije.
3. **Proračun**: 
    - Aktivacija = `check_in` + `activation_delay`.
    - Limit = `net_amount` * (1 + `max_limit_buffer_percent` / 100).
4. **Finalizacija**: Funkcija ažurira `supplier_obligations` status u `processing` i upisuje planirane parametre u `notes`.

## 3. Korisnički Interfejs (Finance Hub)

Unutar sekcije **Supplier Finance**, dodat je tab **VCC Postavke**.

### Mogućnosti:
- Pregled svih dobavljača i njihovih trenutnih pravila plaćanja.
- Brzi uvid u status automatizacije (UKLJUČENO/ISKLJUČENO).
- Uvid u konfiguraciju limita i valuta.

## 4. Sigurnosni Protokoli

- **RLS (Row Level Security)**: Tabela sa VCC postavkama je zaključana isključivo za `service_role`.
- **Maskiranje Podataka**: B2C klijenti i obični agenti u aplikaciji nemaju dozvolu da vide niti menjaju ove parametre direktno preko API-ja.
- **Audit Log**: Svaka isplata i generisanje kartice ostavlja trag u tabeli `supplier_transactions`.

## 5. Manuelno Odobravanje (Approval Workflow)

Radi dodatne finansijske kontrole, uveden je sistem manuelne potvrde pre finalnog generisanja kartice.

### Proces:
1. **Status "Na čekanju"**: Nakon što Edge funkcija odradi proračun, rezervacija dobija status `vcc_approval_status = 'pending'`.
2. **Vizuelno Upozorenje**: U listi dugovanja, ovakve stavke su označene pulsirajućim crvenim bedžom **"ČEKA ODOBRENJE VCC"**.
3. **Admin Akcija**: Administrator (ili korisnik visokog nivoa) mora kliknuti na dugme **"Odobri VCC"** i potvrditi akciju.
4. **Logovanje**: Sistem beleži ko je izvršio odobrenje i u koje tačno vreme (`vcc_approved_by`, `vcc_approved_at`).

---
*Dokumentacija ažurirana: 21.02.2026.*
*Status modula: Backend Baza (Spremna), Edge Funkcija (Implementirana sa Approval flag-om), UI Pregled i Approval UI (Implementirani).*
