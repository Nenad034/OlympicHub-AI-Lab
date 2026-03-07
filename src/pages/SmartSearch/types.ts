/**
 * SmartSearch – Shared Types
 * Extracted from SmartSearch.tsx for maintainability.
 */

export interface Destination {
    id: string | number;
    name: string;
    type: 'destination' | 'city' | 'hotel' | 'country';
    country?: string;
    stars?: number;
    region_id?: number;
    provider?: string;
}

export interface RoomAllocation {
    adults: number;
    children: number;
    childrenAges: number[];
}

export type TabId = 'hotel' | 'flight' | 'package' | 'transfer' | 'tour' | 'ski';
export type SearchMode = 'classic' | 'narrative' | 'immersive' | 'immersive-v2' | 'immersive-map';
export type ViewMode = 'grid' | 'list' | 'notepad';
export type SortBy = 'smart' | 'price_low' | 'price_high';
export type BudgetType = 'total' | 'person' | 'room';

export interface SearchHistoryItem {
    id: string;
    timestamp: number;
    query: {
        destinations: Destination[];
        checkIn: string;
        checkOut: string;
        roomAllocations: RoomAllocation[];
        mealPlan: string;
        nationality: string;
        budgetType: BudgetType;
        tab: TabId;
        searchMode: SearchMode;
        budgetFrom?: string;
        budgetTo?: string;
        flexibleDays?: number;
    };
    resultsSummary?: {
        count: number;
        minPrice?: number;
    };
}

export const NATIONALITY_OPTIONS = [
    { code: 'RS', name: 'Srbija' },
    { code: 'BA', name: 'Bosna i Hercegovina' },
    { code: 'ME', name: 'Crna Gora' },
    { code: 'MK', name: 'Severna Makedonija' },
    { code: 'HR', name: 'Hrvatska' },
    { code: 'BG', name: 'Bugarska' },
    { code: 'RO', name: 'Rumunija' },
    { code: 'HU', name: 'Mađarska' },
    { code: 'GR', name: 'Grčka' },
    { code: 'AL', name: 'Albanija' },
    { code: 'TR', name: 'Turska' },
    { code: 'DE', name: 'Nemačka' },
    { code: 'AT', name: 'Austrija' },
    { code: 'CH', name: 'Švajcarska' },
    { code: 'RU', name: 'Rusija' },
    { code: 'US', name: 'SAD' },
    { code: 'GB', name: 'Velika Britanija' },
    { code: 'IT', name: 'Italija' },
    { code: 'FR', name: 'Francuska' },
    { code: 'ES', name: 'Španija' },
];

export const CATEGORY_OPTIONS = [
    { value: 'all', label: 'Sve Kategorije' },
    { value: '5', label: '5 Zvezdica' },
    { value: '4', label: '4 Zvezdice' },
    { value: '3', label: '3 Zvezdice' },
    { value: '2', label: '2 Zvezdice' },
];

export const MEAL_PLAN_OPTIONS = [
    { value: 'all', label: 'Sve Usluge' },
    { value: 'RO', label: 'Najam (RO)' },
    { value: 'BB', label: 'Noćenje sa doručkom (BB)' },
    { value: 'HB', label: 'Polupansion (HB)' },
    { value: 'FB', label: 'Pun pansion (FB)' },
    { value: 'AI', label: 'All Inclusive (AI)' },
    { value: 'UAI', label: 'Ultra All Inclusive (UAI)' },
];

export const MOCK_DESTINATIONS: Destination[] = [
    { id: 'd1', name: 'Crna Gora', type: 'destination', country: 'Montenegro' },
    { id: 'd2', name: 'Budva', type: 'destination', country: 'Montenegro' },
    { id: 'd3', name: 'Kotor', type: 'destination', country: 'Montenegro' },
    { id: 'd4', name: 'Grčka', type: 'destination', country: 'Greece' },
    { id: 'd5', name: 'Krf (Corfu)', type: 'destination', country: 'Greece' },
    { id: 'd6', name: 'Rodos', type: 'destination', country: 'Greece' },
    { id: 'd7', name: 'Krit', type: 'destination', country: 'Greece' },
    { id: 'd8', name: 'Egipat', type: 'destination', country: 'Egypt' },
    { id: 'd9', name: 'Hurghada', type: 'destination', country: 'Egypt' },
    { id: 'd10', name: 'Sharm El Sheikh', type: 'destination', country: 'Egypt' },
    { id: 'd11', name: 'Turska', type: 'destination', country: 'Turkey' },
    { id: 'd12', name: 'Antalya', type: 'destination', country: 'Turkey' },
    { id: 'd13', name: 'Dubai', type: 'destination', country: 'UAE' },
    { id: 'd14', name: 'Bulgaria', type: 'destination', country: 'Bulgaria' },
    { id: 'solvex-c-33', name: 'Golden Sands', type: 'destination', country: 'Bulgaria' },
    { id: 'solvex-c-68', name: 'Sunny Beach', type: 'destination', country: 'Bulgaria' },
    { id: 'solvex-c-9', name: 'Bansko', type: 'destination', country: 'Bulgaria' },
    { id: 'h1', name: 'Hotel Splendid', type: 'hotel', country: 'Montenegro', stars: 5, provider: 'Solvex' },
    { id: 'h2', name: 'Hotel Budva Riviera', type: 'hotel', country: 'Montenegro', stars: 4, provider: 'Solvex' },
];
