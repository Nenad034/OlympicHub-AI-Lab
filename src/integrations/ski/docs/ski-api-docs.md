# Ski Resort — Live Data API — Integraciona Dokumentacija
## ClickToTravel Hub

> **Datum:** 2026-03-01  
> **Svrha:** Live informacije za skijaše (visina snega, stanje staza, vremenska prognoza po visinama)  
> **Status:** Research / Mock Ready  
> **Glavni provajderi:** Mountain News (OnTheSnow), Weather Unlocked

---

## 1. Pregled SKI API Provajdera

Za kvalitetan Ski modul potrebni su podaci o tri ključna faktora:
1.  **Snow Report:** Visina snega (VRH, SREDINA, PODNOŽJE), novi sneg u poslednjih 24/48h.
2.  **Mountain Status:** Koje staze su otvorene, koji liftovi rade, težina staza.
3.  **Elevation Weather:** Vremenska prognoza precizna za različite nadmorske visine.

### Preporučeni izvori:

| Provajder | Snaga | Podaci |
| :--- | :--- | :--- |
| **Mountain News (OnTheSnow)** | Industrijalni standard | Najtačnije stanje liftova i staza globalno. |
| **Weather Unlocked** | Mountain Weather | Prognoza za 3 nivoa planine (Base, Mid, Summit). |
| **Ski Resort Conditions (RapidAPI)** | Jednostavnost | Agregirani podaci za brzu integraciju. |

---

## 2. Ključni Podaci (Data Model)

### 2.1 Sneg i padavine
- `snow_depth_summit`: Dubina snega na vrhu.
- `snow_depth_base`: Dubina snega u podnožju.
- `new_snow_24h`: Novopečeni sneg u poslednja 24 sata.
- `conditions`: Tip snega (puder, tvrda podloga, mokar sneg).

### 2.2 Stanje planine
- `lifts_open` / `lifts_total`: Broj aktivnih žičara.
- `trails_open` / `trails_total`: Broj otvorenih staza.
- `resort_status`: Da li je centar otvoren/zatvoren.

### 2.3 Vreme po nivoima
Skijašima je bitnije vreme na vrhu nego u gradu.
- `temp_summit`, `temp_base`.
- `wind_speed_summit` (bitno zbog zatvaranja liftova).
- `visibility`.

---

## 3. Implementacioni Plan

1.  **Geo-mapping:** Povezivanje GIATA hotelskih lokacija sa najbližim Ski Resort ID-jem.
2.  **Live Updates:** Osvežavanje podataka na svakih 1 do 3 sata.
3.  **Visual Alerts:** Notifikacije za "Powder Alert" (ako padne >20cm novog snega).

---

## 4. Dostupni Resursi

| Resurs | Link |
| :--- | :--- |
| **Mountain News API** | [mountainnews.com/partner-api](https://www.mountainnews.com) |
| **Weather Unlocked** | [weatherunlocked.com/ski-api](https://www.weatherunlocked.com) |
| **RapidAPI Ski Search** | [rapidapi.com/search/ski](https://rapidapi.com) |

---

## 5. Integracija u ClickToTravel

- **Servis:** `skiApiService.ts` (unificira podatke iz različitih izvora).
- **Komponenta:** `SkiConditionsWidget` — mali widget za hotelsku stranicu.
- **Test Stranica:** `SkiTest.tsx` — dashboard za pregled stanja u svim većim ski centrima (Kopaonik, Bansko, Borovets, Jahorina, Alpi).
