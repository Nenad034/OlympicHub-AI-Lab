/**
 * Mock podaci za charter letove.
 * Sadrži realan prikaz godišnjeg charter programa za letnju sezonu.
 * Faza Orchestrator: Zameniće ih pravi Charter DB iz Manual inventara.
 */

import type { CharterResult } from '../types';

// ─────────────────────────────────────────────────────────────
// HELPER — Kalkuliše povratni datum na osnovu noćenja
// ─────────────────────────────────────────────────────────────
const addDays = (date: string, days: number): string => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

// ─────────────────────────────────────────────────────────────
// ČARTER 1 — BEG → TIV (Air Serbia, PRIME allotment)
// Subote, Jul/Aug, 7/10/14 noćenja
// ─────────────────────────────────────────────────────────────
const BEG_TIV_DATES_7N = [
    { dep: '2026-06-27', ppp: 189, seats: 18, totalSeats: 50, note: undefined as string | undefined },
    { dep: '2026-07-04', ppp: 209, seats: 12, totalSeats: 50, note: 'Popularan datum!' },
    { dep: '2026-07-11', ppp: 225, seats: 4,  totalSeats: 50, note: '⚠️ Poslednja 4 mesta!' },
    { dep: '2026-07-18', ppp: 225, seats: 0,  totalSeats: 50, note: '🔴 Rasprodato' },
    { dep: '2026-07-25', ppp: 245, seats: 28, totalSeats: 50, note: undefined },
    { dep: '2026-08-01', ppp: 255, seats: 20, totalSeats: 50, note: undefined },
    { dep: '2026-08-08', ppp: 255, seats: 9,  totalSeats: 50, note: undefined },
    { dep: '2026-08-15', ppp: 249, seats: 31, totalSeats: 50, note: undefined },
    { dep: '2026-08-22', ppp: 235, seats: 40, totalSeats: 50, note: undefined },
    { dep: '2026-08-29', ppp: 219, seats: 44, totalSeats: 50, note: '🍂 Kraj sezone' },
];

export const CHARTER_BEG_TIV: CharterResult = {
    id: 'ch-beg-tiv-01',
    airline: 'Air Serbia',
    airlineLogo: '✈️',
    origin: 'BEG',
    originCity: 'Beograd',
    destination: 'TIV',
    destinationCity: 'Tivat',
    flightDuration: 55,
    flightNo: 'JU 480/481',
    departureTime: '07:30',
    returnTime: '09:25',
    cabinClass: 'economy',
    baggageIncluded: true,
    checkedBagKg: 20,
    isPrime: true,
    contractType: 'own',
    departures: BEG_TIV_DATES_7N.map((d, i) => ({
        id: `beg-tiv-7n-${i}`,
        departDate: d.dep,
        returnDate: addDays(d.dep, 7),
        nights: 7,
        availableSeats: d.seats,
        totalSeats: d.totalSeats,
        pricePerPerson: d.ppp,
        totalPrice: d.ppp * 2,      // 2 odrasla (default)
        currency: 'EUR',
        status: d.seats === 0 ? 'sold-out' : d.seats <= 5 ? 'on-request' : 'instant',
        isOwnAllotment: true,
        allotmentNote: d.note,
    })),
};

// ─────────────────────────────────────────────────────────────
// ČARTER 2 — BEG → TIV (Wizz Air, block allotment)
// Subote, Avg, 7 noćenja, jeftinija opcija
// ─────────────────────────────────────────────────────────────
export const CHARTER_BEG_TIV_BUDGET: CharterResult = {
    id: 'ch-beg-tiv-02',
    airline: 'Wizz Air',
    airlineLogo: '🟣',
    origin: 'BEG',
    originCity: 'Beograd',
    destination: 'TIV',
    destinationCity: 'Tivat',
    flightDuration: 55,
    flightNo: 'W6 3421/3422',
    departureTime: '05:45',
    returnTime: '07:40',
    cabinClass: 'economy',
    baggageIncluded: false,
    checkedBagKg: 0,
    isPrime: false,
    contractType: 'block',
    departures: [
        { id: 'wz-tiv-1', departDate: '2026-07-11', returnDate: addDays('2026-07-11', 7), nights: 7, availableSeats: 22, totalSeats: 60, pricePerPerson: 149, totalPrice: 298, currency: 'EUR', status: 'instant', isOwnAllotment: false },
        { id: 'wz-tiv-2', departDate: '2026-07-25', returnDate: addDays('2026-07-25', 7), nights: 7, availableSeats: 8,  totalSeats: 60, pricePerPerson: 159, totalPrice: 318, currency: 'EUR', status: 'on-request', isOwnAllotment: false, allotmentNote: '⚠️ Malo mesta' },
        { id: 'wz-tiv-3', departDate: '2026-08-08', returnDate: addDays('2026-08-08', 7), nights: 7, availableSeats: 35, totalSeats: 60, pricePerPerson: 169, totalPrice: 338, currency: 'EUR', status: 'instant', isOwnAllotment: false },
        { id: 'wz-tiv-4', departDate: '2026-08-22', returnDate: addDays('2026-08-22', 7), nights: 7, availableSeats: 45, totalSeats: 60, pricePerPerson: 155, totalPrice: 310, currency: 'EUR', status: 'instant', isOwnAllotment: false },
    ],
};

// ─────────────────────────────────────────────────────────────
// ČARTER 3 — BEG → DBV (Dubrovnik, Air Serbia, PRIME)
// ─────────────────────────────────────────────────────────────
export const CHARTER_BEG_DBV: CharterResult = {
    id: 'ch-beg-dbv-01',
    airline: 'Air Serbia',
    airlineLogo: '✈️',
    origin: 'BEG',
    originCity: 'Beograd',
    destination: 'DBV',
    destinationCity: 'Dubrovnik',
    flightDuration: 65,
    flightNo: 'JU 512/513',
    departureTime: '08:15',
    returnTime: '10:20',
    cabinClass: 'economy',
    baggageIncluded: true,
    checkedBagKg: 23,
    isPrime: true,
    contractType: 'own',
    departures: [
        { id: 'dbv-1', departDate: '2026-06-28', returnDate: addDays('2026-06-28', 7),  nights: 7,  availableSeats: 22, totalSeats: 50, pricePerPerson: 198, totalPrice: 396, currency: 'EUR', status: 'instant',    isOwnAllotment: true },
        { id: 'dbv-2', departDate: '2026-07-05', returnDate: addDays('2026-07-05', 7),  nights: 7,  availableSeats: 8,  totalSeats: 50, pricePerPerson: 219, totalPrice: 438, currency: 'EUR', status: 'on-request', isOwnAllotment: true, allotmentNote: '⚠️ 8 mesta' },
        { id: 'dbv-3', departDate: '2026-07-05', returnDate: addDays('2026-07-05', 10), nights: 10, availableSeats: 14, totalSeats: 50, pricePerPerson: 238, totalPrice: 476, currency: 'EUR', status: 'instant',    isOwnAllotment: true },
        { id: 'dbv-4', departDate: '2026-07-12', returnDate: addDays('2026-07-12', 7),  nights: 7,  availableSeats: 0,  totalSeats: 50, pricePerPerson: 229, totalPrice: 458, currency: 'EUR', status: 'sold-out',   isOwnAllotment: true, allotmentNote: '🔴 Rasprodato' },
        { id: 'dbv-5', departDate: '2026-08-02', returnDate: addDays('2026-08-02', 7),  nights: 7,  availableSeats: 31, totalSeats: 50, pricePerPerson: 245, totalPrice: 490, currency: 'EUR', status: 'instant',    isOwnAllotment: true },
        { id: 'dbv-6', departDate: '2026-08-16', returnDate: addDays('2026-08-16', 14), nights: 14, availableSeats: 19, totalSeats: 50, pricePerPerson: 278, totalPrice: 556, currency: 'EUR', status: 'instant',    isOwnAllotment: true },
    ],
};

// ─────────────────────────────────────────────────────────────
// ČARTER 4 — BEG → ATH (Atina, block)
// ─────────────────────────────────────────────────────────────
export const CHARTER_BEG_ATH: CharterResult = {
    id: 'ch-beg-ath-01',
    airline: 'Aegean Airlines',
    airlineLogo: '🔵',
    origin: 'BEG',
    originCity: 'Beograd',
    destination: 'ATH',
    destinationCity: 'Atina',
    flightDuration: 90,
    flightNo: 'A3 860/861',
    departureTime: '06:05',
    returnTime: '08:05',
    cabinClass: 'economy',
    baggageIncluded: true,
    checkedBagKg: 23,
    isPrime: false,
    contractType: 'seat-only',
    departures: [
        { id: 'ath-1', departDate: '2026-07-10', returnDate: addDays('2026-07-10', 7),  nights: 7,  availableSeats: 18, totalSeats: 40, pricePerPerson: 265, totalPrice: 530, currency: 'EUR', status: 'instant',    isOwnAllotment: false },
        { id: 'ath-2', departDate: '2026-07-24', returnDate: addDays('2026-07-24', 7),  nights: 7,  availableSeats: 6,  totalSeats: 40, pricePerPerson: 285, totalPrice: 570, currency: 'EUR', status: 'on-request', isOwnAllotment: false, allotmentNote: '⚠️ Malo mesta' },
        { id: 'ath-3', departDate: '2026-08-07', returnDate: addDays('2026-08-07', 14), nights: 14, availableSeats: 22, totalSeats: 40, pricePerPerson: 315, totalPrice: 630, currency: 'EUR', status: 'instant',    isOwnAllotment: false },
        { id: 'ath-4', departDate: '2026-08-21', returnDate: addDays('2026-08-21', 7),  nights: 7,  availableSeats: 30, totalSeats: 40, pricePerPerson: 269, totalPrice: 538, currency: 'EUR', status: 'instant',    isOwnAllotment: false },
    ],
};

// ─────────────────────────────────────────────────────────────
// SAŽETAK svih čartera (BEG polazak)
// ─────────────────────────────────────────────────────────────
export const MOCK_CHARTER_RESULTS: CharterResult[] = [
    CHARTER_BEG_TIV,
    CHARTER_BEG_TIV_BUDGET,
    CHARTER_BEG_DBV,
    CHARTER_BEG_ATH,
];
