import type { CruiseResult, CruiseRegion } from '../types';

export const CRUISE_REGIONS: { value: CruiseRegion | 'all'; label: string; emoji: string }[] = [
    { value: 'all',             label: 'Sve regije',          emoji: '🌍' },
    { value: 'mediterranean',   label: 'Mediteran',           emoji: '🏛️' },
    { value: 'caribbean',       label: 'Karibi',              emoji: '🌴' },
    { value: 'northern-europe', label: 'Severna Evropa',      emoji: '❄️' },
    { value: 'middle-east',     label: 'Bliski Istok',        emoji: '🐪' },
    { value: 'river',           label: 'Rečna Krstarenja',    emoji: '🏞️' },
];

export const MOCK_CRUISE_RESULTS: CruiseResult[] = [
    {
        id: 'cruise-001',
        cruiseLine: 'MSC Cruises',
        cruiseLineLogo: '🌊',
        shipName: 'MSC World Europa',
        image: 'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?auto=format&fit=crop&q=80&w=800',
        regionName: 'Zapadni Mediteran',
        durationDays: 8,
        durationNights: 7,
        departureDate: '2026-06-15',
        portOfDeparture: 'Đenova, Italija',
        itinerarySummary: ['Đenova', 'Napulj', 'Mesina', 'Valeta', 'Na moru', 'Barselona', 'Marsej', 'Đenova'],
        status: 'instant',
        isPrime: true,
        cancellationPolicy: 'Besplatno otkazivanje 60 dana pre polaska',
        rating: 4.8,
        reviewCount: 412,
        itineraryDetails: [
            { dayNumber: 1, port: 'Đenova, Italija', departureTime: '18:00', isSeaDay: false },
            { dayNumber: 2, port: 'Napulj, Italija', arrivalTime: '13:00', departureTime: '20:00', isSeaDay: false },
            { dayNumber: 3, port: 'Mesina, Italija', arrivalTime: '09:00', departureTime: '19:00', isSeaDay: false },
            { dayNumber: 4, port: 'Valeta, Malta', arrivalTime: '08:00', departureTime: '17:00', isSeaDay: false },
            { dayNumber: 5, port: 'Plovidba na moru', isSeaDay: true },
            { dayNumber: 6, port: 'Barselona, Španija', arrivalTime: '08:00', departureTime: '18:00', isSeaDay: false },
            { dayNumber: 7, port: 'Marsej, Francuska', arrivalTime: '07:00', departureTime: '18:00', isSeaDay: false },
            { dayNumber: 8, port: 'Đenova, Italija', arrivalTime: '08:00', isSeaDay: false }
        ],
        cabins: [
            { type: 'inside', label: 'Unutrašnja kabina Bella', pricePerPerson: 590, available: 12, included: ['Lučke takse', 'Pun pansion'] },
            { type: 'balcony', label: 'Balkon Fantastica', pricePerPerson: 850, available: 4, included: ['Lučke takse', 'Pun pansion', 'Usluga u sobi', 'Doručak u kabini'] }
        ]
    },
    {
        id: 'cruise-002',
        cruiseLine: 'Costa Cruises',
        cruiseLineLogo: '🚢',
        shipName: 'Costa Smeralda',
        image: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&q=80&w=800',
        regionName: 'Zapadni Mediteran',
        durationDays: 8,
        durationNights: 7,
        departureDate: '2026-07-20',
        portOfDeparture: 'Savona, Italija',
        itinerarySummary: ['Savona', 'Marsej', 'Barselona', 'Palma de Majorka', 'Na moru', 'Palermo', 'Civitavecchia (Rim)', 'Savona'],
        status: 'instant',
        isPrime: true,
        cancellationPolicy: 'Besplatno otkazivanje 45 dana pre polaska',
        rating: 4.5,
        reviewCount: 289,
        itineraryDetails: [],
        cabins: [
            { type: 'inside', label: 'Unutrašnja kabina', pricePerPerson: 620, available: 6, included: ['Lučke takse', 'Pun pansion'] },
            { type: 'oceanview', label: 'Kabina s prozorom', pricePerPerson: 750, available: 2, included: ['Lučke takse', 'Pun pansion'] },
            { type: 'balcony', label: 'Kabina s balkonom', pricePerPerson: 920, available: 8, included: ['Lučke takse', 'Pun pansion', 'Premium Wi-Fi paket'] }
        ]
    },
    {
        id: 'cruise-003',
        cruiseLine: 'Royal Caribbean',
        cruiseLineLogo: '⚓',
        shipName: 'Icon of the Seas',
        image: 'https://images.unsplash.com/photo-1505832018823-50331d70d237?auto=format&fit=crop&q=80&w=800',
        regionName: 'Istočni Karibi',
        durationDays: 8,
        durationNights: 7,
        departureDate: '2026-11-14',
        portOfDeparture: 'Majami, FL, USA',
        itinerarySummary: ['Majami', 'Na moru', 'Basse-Terre', 'St. Maarten', 'St. Thomas', 'Na moru', 'Perfect Day at CocoCay', 'Majami'],
        status: 'on-request',
        isPrime: false,
        cancellationPolicy: 'Besplatno otkazivanje 90 dana pre polaska',
        rating: 4.9,
        reviewCount: 955,
        itineraryDetails: [],
        cabins: [
            { type: 'balcony', label: 'Balkon sa pogledom na okean', pricePerPerson: 1450, available: 3, included: ['Lučke takse', 'Pun pansion', 'Zabavni program'] },
            { type: 'suite', label: 'Crown Loft Suite', pricePerPerson: 3200, available: 1, included: ['Lučke takse', 'Premium piće', 'Consierge servis', 'VIP pristup'] }
        ]
    }
];

export const POPULAR_CRUISE_PORTS = [
    'Đenova, Italija', 'Barselona, Španija', 'Majami, USA', 'Atina (Pirej), Grčka', 'Dubai, UAE'
];
