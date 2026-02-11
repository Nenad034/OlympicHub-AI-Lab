# Vodič za Rešavanje Kritičnih Grešaka i Deployment (Olympic Hub)

Ovaj dokument sadrži detaljne korake za rešavanje problema sa CORS-om, Proxy-jima, LocalStorage kvotama i proceduru za deployment, na osnovu iskustava od 11.02.2026.

## 1. Proxy i CORS Konfiguracija

**Problem:** Aplikacija ne može da komunicira sa eksternim API-jima (Solvex, Filos, OpenGreece) direktno iz pretraživača zbog CORS (Cross-Origin Resource Sharing) polisa.

**Rešenje:** Svi pozivi moraju ići preko našeg internog `/api` proxy-ja, koji je konfigurisan u `vite.config.ts` (za lokalni razvoj) i `vercel.json` (za produkciju).

**Ključno Pravilo:** Redosled proxy pravila je kritičan! **Specifičniji url-ovi moraju ići ISPRED opštijih.**

### Primer Ispravne Konfiguracije (`vite.config.ts` & `vercel.json`):

```javascript
// ✅ ISPRAVNO: B2B (specifičniji) je IZNAD običnog solvex-a
'/api/solvex-b2b': { target: 'https://b2b.solvex.bg' },
'/api/solvex':     { target: 'https://iservice.solvex.bg' }

// ❌ POGREŠNO: Običan solvex bi "progutao" i b2b zahteve da je prvi
'/api/solvex':     { target: 'https://iservice.solvex.bg' },
'/api/solvex-b2b': { target: 'https://b2b.solvex.bg' } // Nikada se ne bi okinuo
```

### Koraci za proveru:
1. Otvorite `vite.config.ts` i proverite `server.proxy` sekciju.
2. Otvorite `vercel.json` i proverite `rewrites` sekciju.
3. Uverite se da putanje (`/api/solvex-b2b`, `/api/filos-v2`) stoje IZNAD (`/api/solvex`, `/api/filos-static`).

## 2. LocalStorage Quota Exceeded (Crash Aplikacije)

**Problem:** Aplikacija se ruši sa greškom `QuotaExceededError` ili "Global System Fail" kada pokušate da učitate ili sačuvate veliki broj hotela (preko 500-1000) u `localStorage`.

**Rešenje:** Implementiran je `Safe Storage` mehanizam u `src/utils/storageUtils.ts`.

### Nove Funkcije:
*   `safeLocalStorageSetItem(key, data)`: Pokušava da sačuva podatke. Ako ne uspe zbog kvote, **hvata grešku** umesto da sruši aplikaciju, i ispisuje upozorenje u konzoli.
*   `updateLocalHotelCache(hotels)`: Automatski detektuje veličinu niza. Ako je niz veći od **500 hotela**, u keš čuva **samo prvih 200** kako bi osigurao brz rad, dok se svi podaci i svakako nalaze u Supabase bazi.

### Kako koristiti u kodu:
Umesto:
```typescript
localStorage.setItem('olympic_hub_hotels', JSON.stringify(hotels)); // ⚠️ OPASNO
```
Koristite:
```typescript
import { updateLocalHotelCache } from '../../utils/storageUtils';
updateLocalHotelCache(hotels); // ✅ BEZBEDNO
```

## 3. Procedura za Deployment (slanje na GitHub)

Kada su izmene spremne i testirane lokalno (`npm run dev`), pratite ove korake:

1.  **Provera Statusa:**
    ```bash
    git status
    ```
2.  **Dodavanje Izmena:**
    ```bash
    git add .
    ```
3.  **Commit (obavezno smislen opis):**
    ```bash
    git commit -m "Fix: Opis šta je popravljeno (npr. Proxy redosled)"
    ```
4.  **Slanje na GitHub (što automatski okida Vercel deploy):**
    ```bash
    git push origin main
    ```
5.  **Verifikacija:**
    *   Otvorite GitHub repo da vidite novi commit.
    *   Otvorite Vercel dashboard da pratite build proces.

## 4. Šta raditi ako se aplikacija "zaglavi" (White Screen)?

Ako se aplikacija ne učitava zbog korumpiranog keša (prethodna greška):

1.  Otvorite Developer Tools (F12).
2.  Idite na **Application** tab -> **Local Storage**.
3.  Desni klik na domen -> **Clear**.
4.  Osvežite stranicu.
    *   *Napomena: U `main.tsx` je dodat i automatski "Emergency Cleanup" koji ovo radi ako detektuje preveliki fajl pri startovanju.*
