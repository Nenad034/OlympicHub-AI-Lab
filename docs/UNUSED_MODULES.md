# Unused / Hidden Modules

Ovaj dokument sadrži listu modula koji su privremeno uklonjeni iz aplikacije (sakriveni) ali čiji fajlovi nisu obrisani, u skladu sa zahtevom.

## 1. Total Trip
Modul za kreiranje celokupnog putovanja (let + smeštaj + transfer).
**Status:** Sakriven iz navigacije (Sidebar, HorizontalNav) i rutera.
**Fajlovi:**
- `src/modules/pricing/TotalTripSearch.tsx`
- `src/modules/pricing/TotalTripResults.tsx`
- Povezane komponente u `src/modules/pricing/components/`

## 2. Master Pretraga (Master Search)
Stara verzija pretrage ili alternativni search modul.
**Status:** Sakriven iz navigacije (Sidebar, HorizontalNav) i rutera.
**Fajlovi:**
- `src/pages/MasterSearch.tsx`
- `src/pages/MasterSearch.css`

---
**Napomena:** Da biste vratili ove module, potrebno je odkomentarisati linije u `src/router/index.tsx`, `src/components/layout/Sidebar.tsx` i `src/components/layout/HorizontalNav.tsx`.
