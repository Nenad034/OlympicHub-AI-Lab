# 🏔️ Olympic API Gateway – The Developer’s Blueprint
> **Project Code Name:** ORCHESTRATOR  
> **Concept:** Unified Travel Commerce Engine (API-Agnostic)

Ovaj dokument definiše arhitektonsku viziju **Olympic Hub API Gateway-a**. Za razliku od standardnih API-ja, Olympic API deluje kao **jedinstveni orkestrator** koji apstrahuje kompleksnost različitih izvora podataka (Eksterni API-ji, Manuelni unosi, Excel importi) u jedan standardizovan format.

---

## 🏗️ 1. Arhitektura "Orkestratora"
Naša platforma ne zavisi od pojedinačnog dobavljača. Svaki upit prolazi kroz transformacioni sloj (**Adapter Pattern**) koji garantuje da dobijate isti format podataka bez obzira na to da li je izvor kompleksni SOAP (Solvex) ili moderni JSON (Filos).

### Izvori podataka (Agnostic Data Layer):
*   **Plug-and-Play Connectors:** (TCT, Solvex, Filos, Amadeus)
*   **Manual Entry Hub:** (Cenovnici uneti kroz PriceList Architect)
*   **Bulk Data Engine:** (Lokalni importi i Excel baze)

---

## 🔍 2. Unified Search Module (Unificirana Pretraga)
Umesto pozivanja specifičnih provajdera, developeri koriste unificirane endpointe. Sistem vrši "Federated Search", agregaciju i deduplikaciju.

### `POST /v1/search/unified`
**Primer unificiranog rezultata (agregirano):**
```json
{
  "hotel_id": "OH-GR-102",
  "name": "Olympic Palace Resort",
  "stars": 5,
  "location": { 
    "city": "Rhodes", 
    "country": "Greece", 
    "geo": [36.4432, 28.2274],
    "address": "Ialyssos Avenue 12"
  },
  "provider": { 
    "name": "Orchestrator", 
    "sources": ["Solvex", "LocalDB"],
    "original_ids": { "solvex": "2930", "local": "LP-99" }
  },
  "cheapest_offer": {
    "price": 1450.00,
    "currency": "EUR",
    "board": "All Inclusive",
    "room_type": "Superior Sea View (Main Building)"
  }
}
```

---

## 📦 3. Global Inventory & Unified PriceList
Ovo je srž sistema. Unificirani cenovnik apstrahuje kompleksnost SPO (Special Offers), sezonalnosti i doplata koje vidite u izvornim dokumentacijama Solvxa i Filosa.

### Unificirana struktura cenovnika (JSON Specimen):
```json
{
  "contract_id": "OH-2025-C12",
  "validity": { "from": "2025-05-01", "to": "2025-10-31" },
  "pricing": {
    "base_rates": [
      {
        "period": { "start": "2025-07-01", "end": "2025-08-31" },
        "room_id": "DBL_STD",
        "board": "HB",
        "net_price": 85.00,
        "gross_price": 105.00,
        "occupancy_logic": "PerPerson",
        "min_stay": 5
      }
    ],
    "supplements": [
      { "type": "Tax", "code": "CITY_TAX", "amount": 4.00, "basis": "PerNight" },
      { "type": "Event", "code": "GALA_DINNER", "amount": 80.00, "basis": "OneTime" },
      { "type": "Room", "code": "SEA_VIEW", "amount": 15.00, "basis": "PerNight" }
    ],
    "discounts": [
      { "type": "EarlyBooking", "value": "15%", "condition": "Until-2025-03-31" },
      { "type": "LongStay", "value": "5%", "min_nights": 14 }
    ],
    "child_policies": [
      { "age_from": 0, "age_to": 2, "price": 0, "label": "Infant" },
      { "age_from": 3, "age_to": 12, "reduction": "50%", "label": "First Child" }
    ]
  }
}
```

---

## 🛡️ 4. Security & Gateway Control
Sigurnosna barijera koja štiti kredencijale dobavljača i našu poslovnu logiku.
- **Credential Masking:** Developeri nikada ne vide ključeve dobavljača.
- **Rate Limiting:** Globalna zaštita sistema od preopterećenja.
- **Audit Logging:** Svaki poziv ka eksternom API-ju se beleži u "System Pulse".

---

## 🚀 5. Roadmap
- [ ] **Unified Booking Engine:** Jedna komanda za potvrdu rezervacije bilo kog tipa.
- [ ] **Financial Bridge:** Automatizovano fakturisanje bez obzira na izvor usluge.
- [ ] **Webhooks:** Notifikacije o promenama cena u realnom vremenu.

---

> **Napomena:** Olympic Hub API Gateway pretvara haotične podatke različitih provajdera (SOAP XML/JSON) u čistu, programabilnu strukturu koja omogućava razvoj vrhunskih putničkih aplikacija.

*© 2026 Olympic Hub Development Team*
