# Blueprint: Manual Pricelist Creation Module

## Status: Implementacija Mockupa & Core Logike
**Datum:** 09.02.2026.
**Autor:** Antigravity AI Lab

---

## 🎯 Cilj Projekta
Razvoj intuitivnog, brzog i vizuelno superiornog modula za manuelni unos hotelskih cenovnika unutar **Olympic Hub** platforme. Modul treba da omogući radnicima u back-office-u da unesu kompleksne ugovorne cene bez napora.

## 🏗️ Arhitektura Rešenja

### 1. Komponente
- **`PricingIntelligence.tsx`**: Glavni ulazni hub. Ručno kreiranje je postavljeno kao **primarni tab**.
- **`ManualPricelistCreator.tsx`**: Kontejner koji upravlja stanjem unetih stavki i navigacijom između modova (Brzo / Napredno / Bulk).
- **`QuickPricelistForm.tsx`**: Optimizovana forma za 80% standardnih slučajeva. Fokus na brzini.
- **`AdvancedPricelistForm.tsx`**: Detaljan wizard za kompleksne ugovore (kapaciteti, uzrasna ograničenja, doplate).
- **`PricelistItemsList.tsx`**: Real-time pregled unetih podataka u formatu horizontalnih kartica (stajling "liste smeštaja").

### 2. Design System
- **Tema**: Dark Mode (Glassmorphism inspirisan).
- **Inputi**: Jasno definisane ivice (`2px solid var(--border)`), kontrastni tekst i custom dizajnirani padajući meniji.
- **Feedback**: Auto-save status indikatori, validacioni simboli i live kalkulacija bruto cene.

## ✅ Završene Funkcionalnosti
- [x] **Tab Navigation**: Ručno kreiranje je prvi tab.
- [x] **Brzo Kreiranje**: Implementirana forma sa 3 kolone.
- [x] **Auto-kalkulacija**: Bruto cena se računa on-the-fly (Neto - Provizija + Marža).
- [x] **Real-time Lista**: Dodate stavke se odmah pojavljuju u interaktivnoj listi.
- [x] **Baza Podataka**: SQL tabele `pricelists` i `price_periods` su povezane.
- [x] **Trajno Skladištenje**: Implementiran `pricingService` za CRUD operacije.
- [x] **Napredni Filteri**: Filtriranje stavki po sobi, usluzi i datumu.
- [x] **UI Poliranje**: Rešeni problemi sa vidljivošću polja i teksta.

## 🚀 Plan za Dalji Razvoj
1. **Bulk Import**: Implementacija Excel parsera za masovni unos.
2. **Validacija**: Dodavanje kompleksnih provera za preklapanje perioda (Overlap Prevention).
3. **Doplate & Popusti**: Završetak preostalih sekcija u naprednoj formi.

---
*Dokumentacija generisana od strane Antigravity AI asistenta.*
