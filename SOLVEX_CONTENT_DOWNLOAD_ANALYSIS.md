# Solvex API - Preuzimanje Sadržaja Hotela (2000+ Hotels)

## Trenutno Stanje

✅ **Što je urađeno:**
- Povezana Solvex SOAP API integracija
- Import 2000+ hotela u bazu sa osnovnim podacima (ID, naziv, lokacija)
- Struktura u `solvex_hotels.json` već ima mjesta za: `content.description` i `images[]`

❌ **Što nedostaje:**
- Slike hotela (HotelImage)
- Detaljni opisi hotela (Description)
- Dodatne informacije o sadržaju

---

## Analiza API Mogućnosti

### 1. **SearchHotelServices** (Dokumentovani u API)
- Parametri: `guid`, `request` (sa datumima, regionima, hotelima...)
- **Vraća:** `HotelImage` polje (URL do slike)
- **Problem:** Vraća samo jednu sliku po hotelu, i samo kada se pretraži sa specifičnom datumskom rentom
- **Primjena:** ✅ Dobar početak za preuzimanje jedne glavne slike po hotelu

**Primjer poziva:**
```xml
<meg:SearchHotelServices>
  <meg:guid>{GUID}</meg:guid>
  <meg:request>
    <meg:PageSize>100</meg:PageSize>
    <meg:RowIndexFrom>0</meg:RowIndexFrom>
    <meg:DateFrom>2026-06-01T00:00:00</meg:DateFrom>
    <meg:DateTo>2026-06-08T00:00:00</meg:DateTo>
    <meg:Pax>2</meg:Pax>
    <meg:Mode>0</meg:Mode>
    <meg:ResultView>1</meg:ResultView>
    <meg:HotelKeys>
      <meg:int>{HOTEL_ID}</meg:int>
    </meg:HotelKeys>
  </meg:request>
</meg:SearchHotelServices>
```

---

### 2. **GetHotelDescription** (UNDOCUMENTED - Testiran u `test_solvex_search_fixed.cjs`)
- Parametri: `guid`, `hotelCode` (hotel ID)
- **Vraća:** Detaljni HTML/XML opis hotela
- **Primjena:** ✅ Preuzimanje detaljnog opisa

**Primjer poziva:**
```xml
<meg:GetHotelDescription>
  <meg:guid>{GUID}</meg:guid>
  <meg:hotelCode>{HOTEL_ID}</meg:hotelCode>
</meg:GetHotelDescription>
```

---

### 3. **GetHotelImages** (UNDOCUMENTED - Testiran u `test_solvex_search_fixed.cjs`)
- Parametri: `guid`, `hotelCode` (hotel ID)
- **Vraća:** XML sa kolekcijom `<Image>` elemenata (URL-ovi slika)
- **Primjena:** ✅ Preuzimanje VIŠE slika po hotelu (galerija)

**Primjer poziva:**
```xml
<meg:GetHotelImages>
  <meg:guid>{GUID}</meg:guid>
  <meg:hotelCode>{HOTEL_ID}</meg:hotelCode>
</meg:GetHotelImages>
```

---

### 4. **GetRoomDescriptions** (Dokumentovano u API)
- Vraća opis tipova soba (npr. "Double Room", "Suite", itd.)
- **Primjena:** Dodatna informacija ako trebamo

---

## 🎯 PREPORUČENI PRISTUP

### Faza 1: Preuzimanje Glavne Slike + Opisa (Brzo)
**Za svih 2000+ hotela:**

1. Iteracija kroz svaki `hotelId` iz baze
2. Pozivanje `GetHotelDescription` → Ekstrahovanje HTML opisa
3. Pozivanje `GetHotelImages` → Preuzimanje URL-ova svih slika
4. Čuvanje u strukturi:
```json
{
  "id": "solvex_2189",
  "content": {
    "description": "Html/plain text opis",
    "descriptionRaw": "Original XML ako trebamo"
  },
  "images": [
    {
      "url": "https://...",
      "title": "Main view",
      "order": 0
    },
    {
      "url": "https://...",
      "title": "Room",
      "order": 1
    }
  ]
}
```

### Faza 2: Optimizacija Slika (Opciono)
- Keširanje slika lokalno umjesto čuvanja samo URL-ova
- Resize slike za različite rezolucije (thumbnail, medium, full)

### Faza 3: Async Batch Processing
- Podjela na batch-eve od 50-100 hotela
- Paralelizacija sa `Promise.all()` sa rate limitingom

---

## ⚠️ OGRANIČENJA SOLVEX API-ja

1. **Nema aktivne dokumentacije za GetHotelDescription i GetHotelImages**
   - Ove metode nisu u API dokumentaciji (`Api dokumentacija Solvex.txt`)
   - Korištene u `test_solvex_search_fixed.cjs` ali bez specifikacije

2. **Mogući Rate Limits**
   - Nepoznato je da li postoji ograničenje poziva po sekundi
   - Trebam testirati sa batch-evima

3. **Kvaliteta Sadržaja**
   - Nisu svi hoteli će imati slike ili opise
   - Neki hoteli mogu imati samo placeholder slike

4. **Session Timeout**
   - GUID iz `Connect()` može istjeći
   - Trebam implementirati re-connect logiku

---

## 🚀 PREPORUKE ZA IMPLEMENTACIJU

### Skript 1: `download_hotel_content.cjs`
```javascript
// Pseudo kod
const hotelIds = getHotelIdsFromDB(); // 2000+ hotela
const guid = await connectToSolvex();

for (let i = 0; i < hotelIds.length; i += 50) {
  const batch = hotelIds.slice(i, i + 50);
  
  const results = await Promise.all(batch.map(hotelId => 
    downloadHotelContent(guid, hotelId)
  ));
  
  await saveBatchToSupabase(results);
  
  if (i % 500 === 0) console.log(`Progress: ${i}/${hotelIds.length}`);
}
```

### Što trebam znati prije implementacije:
1. ✅ Postoji li `GetHotelDescription` i `GetHotelImages` metoda?
2. ✅ Koji format vrnjenih podataka (HTML, plain text, XML)?
3. ? Koliko slika po hotelu u prosjeku?
4. ? Da li postoje rate limits?
5. ? Koliko dugo traje preuzimanje 2000+ hotela?

---

## 📋 CHECKLIST ZA SLJEDEĆE KORAKE

- [ ] Testiranje `GetHotelDescription` na primjeru hotela
- [ ] Testiranje `GetHotelImages` na primjeru hotela
- [ ] Analiza formata vraćenih podataka
- [ ] Implementacija batch download scripte
- [ ] Rate limit testing
- [ ] Integration sa Supabase
- [ ] Monitor za failed requests + retry logika
- [ ] Backup strategija ako download padne

---

## DALJE KORAKE ZA ISTRAŽIVANJE:

1. **Provjeriti Docword fajl** u `Solvex api/Master-InterlookIntegrationService.docx`
   - Može sadržavati dodatne metode za preuzimanje sadržaja

2. **Kontaktirati Solvex support**
   - Pitati za GetHotelDescription i GetHotelImages specifikacije

3. **Analizirati existing test skripte**
   - `test_solvex_search_fixed.cjs` koristi ove metode - trebam viditi ponos da se pozivaju
