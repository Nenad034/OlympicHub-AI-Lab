# OlympicHub AI Lab: Agoda Intelligence Agent

## 1. Vizija i Analogija
Ovaj modul predstavlja prelazak sa "sirovog" preuzimanja podataka na **agentic data processing** inspirisan Agoda modelom.

*   **Analogija:** Umesto da agencija bude samo "prenosnik" haotičnih cena sa tržišta, AI Agent deluje kao **vrhunski kuvar** koji unifikuje, čisti i ocenjuje podatke pre nego što dođu do korisnika.

## 2. Ključni Stubovi Arhitekture

### A. Pametno Mapiranje (Declarative Recipes)
Implementirano u `AiIntelligenceService.ts`. Umesto hiljada `if-else` naredbi, koristimo "recepte" za normalizaciju:
- Čišćenje imena hotela (uklanjanje redundantnih reči poput "Hotel", "5*").
- Unifikacija soba i usluga.

### B. "Pocket SQL" Post-Processing
Inspirisano Agoda DuckDB integracijom. Na nivou provajdera (`SolvexAiProvider.ts`) vršimo SQL-like transformacije u realnom vremenu:
- **Filtering**: Izbacivanje "šuma".
- **Scoring**: Izračunavanje `aiScore` (Intelligence Score) na osnovu vrednosti za novac (cena vs. zvezdice).
- **Sorting**: Rezultati sa najboljim skorom se automatski penju na vrh.

### C. Sentinel Insights
Sistem za monitoring u realnom vremenu koji emituje "insajte" direktno u UI, informišući korisnika o tome šta je AI upravo uradio za njih.

## 3. Tehnička Implementacija
- **AiIntelligenceService**: Centralni singleton koji upravlja svom logikom.
- **SolvexAiProvider**: Specijalizovani provajder koji nasleđuje bazni Solvex API ali dodaje AI sloj.
- **UI Integracija**: Specijalizovani baneri, animirani tasteri i bedževi koji vizuelno razlikuju AI rezultate.

## 4. Sigurnosni Model
- **Data Leakage Prevention**: AI agent obrađuje isključivo javne podatke o objektima. Privatni podaci putnika nikada ne napuštaju serversko okruženje.
- **Secret Management**: API ključevi (za Gemini ili OpenAI) se čuvaju isključivo u Environment Variables (kriptovano na Vercelu).
- **Safe Execution**: AI služi za transformaciju pravih podataka, a ne za generisanje lažnih. Halucinacije su sprečene strogom query-results arhitekturom.

## 5. Kako testirati realnu funkcionalnost?
1.  **Lokalni rad**: Pokrenuti `npm run dev`.
2.  **Aktivacija**: U Global Hub Search meniju uključiti ljubičasti **Solvex AI** taster.
3.  **Pretraga**: Izvršiti pretragu.
4.  **Verifikacija**:
    - Proveriti da li se pojavljuje **AI Lab Insights Banner**.
    - Videti da li su imena hotela čistija.
    - Pogledati **Intelligence Boost** bedževe i uporediti redosled hotela (oni sa većim skorom bi trebali biti prvi).
