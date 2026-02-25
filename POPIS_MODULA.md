# 📋 Popis Modula i Status Razvoja - ClickToTravel Cloud

Ovaj dokument sadrži kompletan inventar modula integrisanih u ClickToTravel sistem, sa direktnim linkovima ka izvornom kodu i procenom završenosti.

---

## 🏛️ Centralna Inteligencija i Analitika

| Modul | Izvorna Datoteka (Link) | Namena | Status |
| :--- | :--- | :--- | :---: |
| **Mars ERP Analitika** | [MarsAnalysis.tsx](./src/modules/production/MarsAnalysis.tsx) | Finansijska i operativna analiza procesa i tržišnih kretanja. | **100%** |
| **Subagent Admin** | [SubagentAdmin.tsx](./src/pages/SubagentAdmin.tsx) | Upravljanje subagentima, dozvolama, provizijama i uvidima u prodaju. | **95%** |
| **Finansije Dobavljača** | [SupplierFinance.tsx](./src/pages/SupplierFinance.tsx) | Upravljanje plaćanjima, VCC karticama i yield analitikom dobiti. | **90%** |

---

## 🏨 Integracije Dobavljača (API Gateway)

| Modul | Izvorna Datoteka (Link) | Namena | Status |
| :--- | :--- | :--- | :---: |
| **MTS Globe Integration** | [MtsGlobeProvider.ts](./src/integrations/mtsglobe/MtsGlobeProvider.ts) | Povezivanje sa MTS Globe API-jem (OTA XML), dekodiranje soba. | **90%** |
| **Solvex Integration** | [solvex/api/](./src/integrations/solvex/api/) | Stabilna veza sa Bugarskim Solvex API-jem, slike i opisi hotela. | **95%** |
| **API Connections Hub** | [APIConnectionsHub.tsx](./src/pages/APIConnectionsHub.tsx) | Monitoring zdravlja svih eksternih API konekcija u realnom vremenu. | **90%** |
| **AI Hotel Importer** | [AdminHotelImport.tsx](./src/pages/AdminHotelImport.tsx) | Pametni uvoz i obrada hotela iz eksternih sistema (Solvex/OpenGreece). | **95%** |

---

## 🛒 Prodajni i Operativni Moduli

| Modul | Izvorna Datoteka (Link) | Namena | Status |
| :--- | :--- | :--- | :---: |
| **Smart Search (Hub)** | [SmartSearch.tsx](./src/pages/SmartSearch.tsx) | Centralna pretraga (Hoteli, Letovi, Paketi) sa AI asistencijom. | **85%** |
| **Reservations Dashboard** | [ReservationsDashboard.tsx](./src/pages/ReservationsDashboard.tsx) | Glavna konzola za agente, filtriranje, eksport PDF/Excel i sync. | **90%** |
| **Reservation Architect** | [ReservationArchitect.tsx](./src/pages/ReservationArchitect.tsx) | Arhitektura dosijea, upravljanje putnicima, finansijama i dokumentima. | **80%** |
| **Upravljanje Produkcijom** | [ProductionHub.tsx](./src/modules/production/ProductionHub.tsx) | Centralni hub za sve vrste usluga (smeštaj, putovanja, transferi). | **95%** |
| **Dynamic Package Builder** | [PackageBuilder.tsx](./src/pages/PackageBuilder.tsx) | Modul za kreiranje paketa (Let + Hotel + Transfer) u jednom toku. | **80%** |
| **Generator Cenovnika** | [PriceListArchitect.tsx](./src/pages/PriceListArchitect.tsx) | Kreiranje kompleksnih cenovnika i direktan import u Mars ERP. | **100%** |
| **Revenue Management** | [YieldDashboard.tsx](./src/modules/yield/YieldDashboard.tsx) | Dinamičko upravljanje cenama i optimizacija marži. | **85%** |

---

## 📂 Administracija i CRM

| Modul | Izvorna Datoteka (Link) | Namena | Status |
| :--- | :--- | :--- | :---: |
| **Master Contact Hub** | [ContactArchitect.tsx](./src/pages/ContactArchitect.tsx) | CRM sistem za bazu putnika, dobavljača i subagenata sa AI analizom. | **90%** |
| **Dest. Predstavnici** | [DestinationRep.tsx](./src/modules/destination/DestinationRep.tsx) | Modul za rad na terenu, check-in putnika i vaučer kontrolu. | **90%** |
| **Generator Smena** | [ShiftsGeneratorPage.tsx](./src/pages/ShiftsGeneratorPage.tsx) | Planiranje radnog vremena i dežurstava za zaposlene. | **100%** |
| **Katana (To-Do)** | [Katana.tsx](./src/modules/system/Katana.tsx) | Interni task manager za upravljanje operativnim zadacima. | **90%** |

---

## 🤖 AI i Napredne Tehnologije

| Modul | Izvorna Datoteka (Link) | Namena | Status |
| :--- | :--- | :--- | :---: |
| **Master Orchestrator** | [MasterOrchestrator.tsx](./src/modules/ai/MasterOrchestrator.tsx) | Glavni AI sistem koji koordinira rad 6 specijalizovanih agenata. | **80%** |
| **Vajckin Soft Zone** | [softZoneService.ts](./src/services/softZoneService.ts) | Napredni AI sloj za generisanje upita i automatizaciju procesa. | **70%** |
| **Smart Concierge** | [conciergeTools.ts](./src/services/conciergeTools.ts) | AI prodajni agent za automatizovanu pomoć klijentima. | **75%** |

---

## 🛡️ Sistemska Podrška i Bezbednost

| Modul | Izvorna Datoteka (Link) | Namena | Status |
| :--- | :--- | :--- | :---: |
| **Fortress Security** | [Fortress.tsx](./src/modules/system/Fortress.tsx) | Command centar za nadzor koda i sistemsku bezbednost. | **100%** |
| **Duboka Arhiva** | [DeepArchive.tsx](./src/modules/system/DeepArchive.tsx) | Trajni registar svih obrisanih i menjanih stavki u sistemu. | **100%** |
| **NBS Payment Core** | [paymentService.ts](./src/services/paymentService.ts) | Generisanje IPS QR kodova i RSD-EUR konverzije po kursu NBS. | **85%** |
| **Dnevni Izveštaj Aktivnosti** | [DailyActivityReport.tsx](./src/modules/system/DailyActivityReport.tsx) | Automatizovani log rada svih operatera u sistemu. | **100%** |

---

## 📧 Komunikacija

| Modul | Izvorna Datoteka (Link) | Namena | Status |
| :--- | :--- | :--- | :---: |
| **ClickToTravel Mail** | [ClickToTravelMail.tsx](./src/modules/mail/ClickToTravelMail.tsx) | Upravljanje email nalozima i zvaničnom korespondencijom. | **90%** |
| **Amazon SES Marketing** | [ContactArchitect.tsx](./src/pages/ContactArchitect.tsx) | Slanje masovnih newsletter-a i marketing kampanja. | **85%** |

---

*Napomena: Klikom na link u koloni "Izvorna Datoteka" otvarate direktno fajl sa kodom modula.*
