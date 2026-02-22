/**
 * SmartSearch – Pure Helper Functions
 * Extracted from SmartSearch.tsx for maintainability.
 */

import type { HotelRoom } from '../../types/hotel';

// ──────────────────────────────────────────────────────────────────────────────
// Meal Plan Helpers
// ──────────────────────────────────────────────────────────────────────────────

export const normalizeMealPlan = (plan: string): string => {
    if (!plan) return 'RO';
    let p = plan.toUpperCase().trim();
    if (p === 'AIP' || p === 'PAI' || p === 'PRM') return 'AIP';
    if (p === 'UAI' || p === 'AI+') return 'UAI';
    if (p === 'AI' || p === 'ALL') return 'AI';
    if (p === 'FB' || p === 'PA') return 'FB';
    if (p === 'HB' || p === 'PP' || p === 'НВ' || p === 'ПП') return 'HB';
    if (p === 'BB') return 'BB';
    if (p === 'RO' || p === 'RR' || p === 'OB' || p === 'SC' || p === 'NA' || p === 'NM') return 'RO';

    if (p.includes('ULTRA') || p.includes('PLUS')) return 'UAI';
    if (p.includes('PREMIUM')) return 'AIP';
    if (p.includes('ALL INCL') || p.includes('SVE UKLJ')) return 'AI';
    if ((p.includes('FULL') || p.includes('PUN') || p.includes('PANSION')) && !p.includes('POLU') && !p.includes('HALF')) return 'FB';
    if (p.includes('HALF') || p.includes('POLU') || p.includes('HB') || p.includes('DORUCAK I VECERA') || p.includes('DORUČAK I VEČERA')) return 'HB';
    if (p.includes('BED') || p.includes('BREAKFAST') || p.includes('DORUCAK') || p.includes('DORUČAK') || p.includes('NOCENJE') || p.includes('NOĆENJE') || p.includes('BB')) return 'BB';
    if (p.includes('ROOM') || p.includes('NAJAM') || p.includes('ONLY') || p.includes('BEZ USLUGE')) return 'RO';

    return 'RO';
};

export const getMealPlanDisplayName = (code: string | undefined): string => {
    if (!code) return 'Samo Smeštaj';
    const normalized = normalizeMealPlan(code);
    const mealPlanNames: Record<string, string> = {
        'RO': 'Samo Smeštaj',
        'BB': 'Noćenje sa Doručkom',
        'HB': 'Polupansion',
        'FB': 'Pun Pansion',
        'AI': 'All Inclusive',
        'AIP': 'All Inclusive Premium',
        'UAI': 'Ultra All Inclusive',
    };

    // If the code itself is a descriptive name, and we mapped it to Premium or Ultra, use the descriptive one if it is better.
    // E.g. "Premium All Inclusive" -> "AIP" -> "All Inclusive Premium", but maybe original was fine.
    // In this case, mealPlanNames will prefer our standard mapped name.
    // However, if the code isn't abbreviated, let's keep it clean
    if (code.length > 5 && !code.toUpperCase().includes('AIP')) {
        const up = code.toUpperCase();
        if (up.includes('PREMIUM') && (up.includes('ALL') || up.includes('AI'))) return 'Premium All Inclusive';
        if (up.includes('ULTRA') && (up.includes('ALL') || up.includes('AI'))) return 'Ultra All Inclusive';
    }

    // If we have a specific name for the normalized code, use it, otherwise use original code
    return mealPlanNames[normalized] || code;
};

// ──────────────────────────────────────────────────────────────────────────────
// Price Helpers
// ──────────────────────────────────────────────────────────────────────────────

export const formatPrice = (price: number) =>
    price.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const getPriceWithMargin = (price: number) => Number((price * 1.15).toFixed(2));

// ──────────────────────────────────────────────────────────────────────────────
// Availability & Cancellation Helpers
// ──────────────────────────────────────────────────────────────────────────────

export const isStatusOnRequest = (status: string | undefined): boolean => {
    if (!status) return true;
    const s = status.toLowerCase();
    if (s === 'available' || s === 'slobodno' || s === 'instant') return false;
    if (s === 'unavailable' || s === 'rasprodato' || s === 'stop_sale') return false;
    return true;
};

export const getRoomCancelStatus = (room: HotelRoom | any): 'non-refundable' | 'free' | 'penalty' => {
    // 1. Check known non-refundable tariff IDs (e.g. Solvex 1993)
    if (room?.tariff?.id === 1993) return 'non-refundable';

    // 2. Check for keywords in Name, Tariff Name, or Description
    const searchString = `${room?.name || ''} ${room?.tariff?.name || ''} ${room?.description || ''}`.toUpperCase();
    if (searchString.includes('NON REFUNDABLE') ||
        searchString.includes('NON-REFUNDABLE') ||
        searchString.includes('NONREF') ||
        searchString.includes('NEPOVRATN') ||
        searchString.includes('N-REF') ||
        searchString.includes('NO REFUN')) {
        return 'non-refundable';
    }

    // 3. Process cancellation policy parameters
    const params = room.cancellationPolicyRequestParams;
    if (params && (params.CancellationDate || params.DaysBeforeCheckIn)) {
        const cancelDate = params.CancellationDate;
        if (cancelDate && new Date(cancelDate) > new Date()) return 'free';
        if (params.DaysBeforeCheckIn) return 'free';
        return 'penalty';
    }

    // Default to 'free' only if we have no reason to suspect otherwise, 
    // but in some systems no info might mean 'penalty' or 'on-request'.
    // Given the current UX, 'free' is the most optimistic, but checking names first is crucial.
    return 'free';
};

// ──────────────────────────────────────────────────────────────────────────────
// Room Name Cleaner
// ──────────────────────────────────────────────────────────────────────────────

export const cleanRoomName = (name: string): string => {
    if (!name) return '';
    return name
        .replace(/\s*\(\s*Dest:[^)]*\)/gi, '')
        .replace(/\s*Dest:[^)]*/gi, '')
        .replace(/\s*\(\s*(Golden Sands|Sunny Beach|Nessebar|Albena|Bansko|Borovets|Pamporovo|Burgas|Varna|Sofia|Sozopol|Primorsko|St\.Vlas|Obzor)\s*\)/gi, '')
        .replace(/NOT DEFINED/gi, '')
        .replace(/- NON REFUNDABLE -/gi, '')
        .replace(/\(NON REFUNDABLE\)/gi, '')
        .replace(/NON REFUNDABLE/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
};

// ──────────────────────────────────────────────────────────────────────────────
// Room Config Label
// ──────────────────────────────────────────────────────────────────────────────

export const formatRoomConfigLabel = (alloc: any, idx: number): string => {
    const getAdultsText = (n: number) => {
        if (n === 1) return 'jedna odrasla osoba';
        if (n >= 2 && n <= 4) {
            const names = ['nula', 'jedna', 'dve', 'tri', 'četiri'];
            return `${names[n]} odrasle osobe`;
        }
        return `${n} odraslih osoba`;
    };

    let label = `Ponuda za sobu ${idx + 1} - ${getAdultsText(alloc.adults)}`;
    if (alloc.children > 0) {
        const childrenText = alloc.childrenAges.map((age: number) => ` + dete ${age} godina`).join('');
        label += childrenText;
    }
    return label;
};

// ──────────────────────────────────────────────────────────────────────────────
// Flexible Date Generator
// ──────────────────────────────────────────────────────────────────────────────

export const generateFlexDates = (baseDate: string, range: number): string[] => {
    if (!baseDate) return [];
    const dates: string[] = [];
    const base = new Date(baseDate);
    for (let i = -range; i <= range; i++) {
        const d = new Date(base);
        d.setDate(d.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
};

// ──────────────────────────────────────────────────────────────────────────────
// Date Sync
// ──────────────────────────────────────────────────────────────────────────────

export const calcNightsFromDates = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    return Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
};
