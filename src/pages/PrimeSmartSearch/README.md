# PrimeSmartSearch V6 (Refaktorisano)

Ovaj modul predstavlja novu, šestu verziju pretrage (V6) koja objedini sve najbolje funkcionalnosti iz **Verzije 1** (v1.0.0) ali u modernom, modularnom i optimizovanom okruženju.

## Arhitektura (V6 Architecture)

- **Zustand Store**: Centralizovan state management (`stores/useSearchStore.ts`) umesto velikog broja lokalnih state-ova.
- **Modularni Komponenti**: Svaki mode (Classic, AI, Map) je izolovan u sopstveni direktorijum.
- **Typescript First**: Strogo definisani tipovi za sve parametre pretrage.
- **Ferrari & Expedia hybrid design**: Vrhunska estetika sa fokusom na UX.

## Funkcionalnosti preuzete iz V1 (Mapping)

### 1. Tabovi (Tabs)
| V1 Tab | V6 Komponenta | Status |
|---|---|---|
| Smeštaj | `SearchTabs/HotelForm` | Spremno za prebacivanje logike |
| Letovi | `SearchTabs/FlightForm` | Integrisano iz `FlightSearch.tsx` |
| Paketi | `SearchTabs/PackageForm` | Dynamic Wizard logika |
| SKI | `SearchTabs/SkiForm` | Placeholder |

### 2. Modovi (Modes)
| V1 Mode | V6 Implementacija | Opis |
|---|---|---|
| Classic | `SearchModes/ClassicMode` | Standardna pretraga |
| Narrative | `SearchModes/MilicaAI` | Milica AI Chat-vodič |
| Immersive | `SearchModes/ImmersiveMode` | Wizard step-by-step |
| Semantic | `SearchModes/SemanticAI` | Gemini Embedding Search |

### 3. Filteri
- **Multi-Destination**: Podržava do 3 destinacije paralelno.
- **Multi-Room**: Kompletan soba/putnici menadžment.
- **Advanced Pricing**: Po osobi/sobi/ukupno (V1 logika).
- **Flexible Dates**: ±1, 2, 3, 5 dana.

## Kako nastaviti razvoj
1. Prebaciti `handleSearch` logiku iz V1 u `hooks/useSearchLogic.ts`.
2. Implementirati UI za svaku sobu (Room Allocation) u `components/Shared/RoomPicker.tsx`.
3. Povezati `PrimeSmartSearch` sa rutama u `App.tsx`.
