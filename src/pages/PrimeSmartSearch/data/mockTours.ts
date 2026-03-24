import type { TourResult, TourCategory } from '../types';

export const TOUR_CATEGORIES: { value: TourCategory | 'all'; label: string; emoji: string }[] = [
    { value: 'all',         label: 'Sva putovanja', emoji: '🌍' },
    { value: 'bus',         label: 'Autobuske ture',emoji: '🚌' },
    { value: 'flight',      label: 'Avio ture',     emoji: '✈️' },
    { value: 'weekend',     label: 'City Break',    emoji: '🏙️' },
    { value: 'exotic',      label: 'Egzotika',      emoji: '🌴' },
    { value: 'cruise-tour', label: 'Krstarenja',    emoji: '🚢' },
];

export const MOCK_TOUR_RESULTS: TourResult[] = [
    // ── Egzotika (Avio) ──────────────────────────────────
    {
        id: '001',
        name: 'Magični Bali - Ostrvo Bogova',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800',
        supplierName: 'PrimeClick Tours',
        supplierLogo: '🏆',
        destinationName: 'Bali, Indonezija',
        category: 'exotic',
        categoryLabel: 'Egzotična Putovanja',
        durationDays: 12,
        durationNights: 10,
        departureDates: ['2026-06-15', '2026-07-10', '2026-08-05'],
        transportType: 'plane',
        includedPax: 2,
        pricePerPerson: 1250,
        totalPrice: 2500,
        currency: 'EUR',
        included: { flights: true, transfers: true, hotels: true, guide: true, insurance: false, meals: true, visas: false },
        itinerarySummary: 'Ubud (4 noći) – Nusa Dua (6 noći). Poseta pirinčanim terasama, hramovima i rajskim plažama.',
        status: 'instant',
        isPrime: true,
        cancellationPolicy: 'Besplatno otkazivanje do 30 dana pre polaska.',
        rating: 4.9,
        reviewCount: 142,
        itineraryDetails: [
            { dayNumber: 1, title: 'Polazak iz Beograda', description: 'Let za Denpasar sa presedanjem u Dohi.', mealsIncluded: [] },
            { dayNumber: 2, title: 'Dolazak na Bali', description: 'Transfer do hotela u Ubudu, slobodno popodne.', mealsIncluded: ['V'] },
            { dayNumber: 3, title: 'Ubud: Kultura i Tradicija', description: 'Šuma majmuna, tradicionalni plesovi i pijaca umetnina.', mealsIncluded: ['D'] },
        ]
    },

    // ── Autobuske / Vikend (City Break) ─────────────────
    {
        id: 'tour-002',
        name: 'Klasična Italija: Rim, Firenca, Venecija',
        image: 'https://images.unsplash.com/photo-1515542622106-78bbf8ba2489?auto=format&fit=crop&q=80&w=800',
        supplierName: 'EuroTour Operator',
        supplierLogo: '🚌',
        destinationName: 'Italija',
        category: 'bus',
        categoryLabel: 'Autobuske Ture',
        durationDays: 7,
        durationNights: 5,
        departureDates: ['2026-05-01', '2026-05-15', '2026-06-03'],
        transportType: 'bus',
        includedPax: 2,
        pricePerPerson: 299,
        totalPrice: 598,
        currency: 'EUR',
        included: { flights: false, transfers: true, hotels: true, guide: true, insurance: false, meals: true, visas: false },
        itinerarySummary: 'Venecija – Firenca – Rim. Fakultativni izleti za Pizu i Veronu.',
        status: 'instant',
        isPrime: false,
        cancellationPolicy: 'Zadržavanje depozita za otkaz manje od 15 dana.',
        rating: 4.6,
        reviewCount: 315,
        itineraryDetails: [
            { dayNumber: 1, title: 'Noćna vožnja', description: 'Polazak iz Beograda u kasnim večernjim satima, vožnja kroz Hrvatsku i Sloveniju.', mealsIncluded: [] },
            { dayNumber: 2, title: 'Venecija', description: 'Dolazak u luku Punta Sabioni, vožnja brodićem do Trga Sv. Marka.', mealsIncluded: [] },
            { dayNumber: 3, title: 'Firenca', description: 'Obilazak renesansne prestonice: Duomo, Ponte Vekio.', mealsIncluded: ['D'] },
        ]
    },

    // ── City Break Avio ──────────────────────────────────
    {
        id: 'tour-003',
        name: 'Romantični Pariz (Jesen 2026)',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800',
        supplierName: 'PrimeClick Weekend',
        supplierLogo: '🏆',
        destinationName: 'Pariz, Francuska',
        category: 'weekend',
        categoryLabel: 'City Break',
        durationDays: 4,
        durationNights: 3,
        departureDates: ['2026-09-17', '2026-10-08'],
        transportType: 'plane',
        includedPax: 2,
        pricePerPerson: 450,
        totalPrice: 900,
        currency: 'EUR',
        included: { flights: true, transfers: true, hotels: true, guide: false, insurance: false, meals: true, visas: false },
        itinerarySummary: 'Direktan let Air Serbia. Hotel 3* u centru blizu metroa. Slobodno vreme za obilaske.',
        status: 'instant',
        isPrime: true,
        cancellationPolicy: 'Penali 50% za otkazivanje 14-7 dana, 100% ispod 7 dana.',
        rating: 4.8,
        reviewCount: 89,
        itineraryDetails: [
            { dayNumber: 1, title: 'Let do Pariza', description: 'Let u 06:40. Dolazak, ostavljanje stvari u hotelu i popodnevna šetnja Monmartrom.', mealsIncluded: [] },
            { dayNumber: 2, title: 'Muzeji i Ajfelova Kula', description: 'Slobodno vreme ili fakultativni odlazak u Luvr.', mealsIncluded: ['D'] },
            { dayNumber: 3, title: 'Dvorac Versaj', description: 'Fakultativni izlet vozom (RER) do Versaja.', mealsIncluded: ['D'] },
            { dayNumber: 4, title: 'Povratak', description: 'Jutarnja šetnja pored Sene, transfer na aerodrom oko 16:00.', mealsIncluded: ['D'] },
        ]
    },

    // ── Adventure / Ski ──────────────────────────────────
    {
        id: 'tour-004',
        name: 'Zimska Čarolija: Dolomiti (Sella Ronda)',
        image: 'https://images.unsplash.com/photo-1520114002934-58fffaac9df0?auto=format&fit=crop&q=80&w=800',
        supplierName: 'Ski & Snow Adventures',
        supplierLogo: '⛷️',
        destinationName: 'Dolomiti, Italija',
        category: 'ski',
        categoryLabel: 'Skijanje / Zima',
        durationDays: 8,
        durationNights: 7,
        departureDates: ['2026-01-10', '2026-02-14'],
        transportType: 'bus',
        includedPax: 2,
        pricePerPerson: 850,
        totalPrice: 1700,
        currency: 'EUR',
        included: { flights: false, transfers: false, hotels: true, guide: false, insurance: false, meals: true, visas: false },
        itinerarySummary: 'Smeštaj na bazi polupansiona (Doručak+Večera). Dolomiti Superski skipas se kupuje doplato na licu mesta.',
        status: 'on-request',
        isPrime: false,
        cancellationPolicy: 'Stroga politika – 100% penali mesec dana pre puta.',
        rating: 4.7,
        reviewCount: 45,
        itineraryDetails: [] // Nema dnevnog plana za statična skijanja
    },
];

export const POPULAR_TOUR_DESTINATIONS = [
    'Severna Italija', 'Atina', 'Istanbul', 'Pariz', 'Bali', 'Zanzibar', 'Maldivi', 'Alpi'
];
