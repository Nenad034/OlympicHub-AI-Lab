# TODO Lista za PrimeClickToTravel / Olympic Hub

## Smart Pretraga i Kartice Hotela
- [x] Vratiti `BEST SELLER` tag na hotel karticama (`SmartSearch/components/HotelCard.tsx`)
- [x] Ponovo omogućiti `smart` sortiranje kao podrazumevani metod u `SmartSearch.tsx` (trenutno je prebačeno na najnižu cenu `price_low`)
- [ ] **Alternative Availability Calendar**: Kada nema slobodnih kapaciteta za traženi datum, prikazati kalendar sa prvim slobodnim terminima pre i posle traženog datuma za isti broj noćenja

## Marketing i Komunikacija sa Klijentima
- [ ] **Automated & Manual Campaign System**: Sistem za slanje promocija i obaveštenja klijentima.
    - [ ] Integracija sa servisom za slanje (npr. Resend, SendGrid)
    - [ ] AI personalizacija poruka (topla, ljudska komunikacija bez spamovanja)
    - [ ] Tracking ponašanja (CTR, otvaranje, konverzije)
    - [ ] Pametna frekvencija (da se klijenti ne "dave" porukama)
- [ ] Refaktorisanje: Izdvojiti sekciju ''Stavke Rezervacije'' (Trip Items) iz ReservationArchitect.tsx u posebnu komponentu (npr. TripItemsTab.tsx). Ovo je prvi zadatak za sutra!
- [ ] **Technical Check**: Proveriti šta sve treba da se uradi na Google Console u vezi reCAPTCHA integracije.

