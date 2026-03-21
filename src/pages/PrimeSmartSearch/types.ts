import { LucideIcon } from 'lucide-react';

export type SearchTabType = 'hotel' | 'flight' | 'package' | 'transfer' | 'tour' | 'ski';

export type SearchModeType = 'classic' | 'narrative' | 'immersive' | 'immersive-v2' | 'immersive-map' | 'semantic';

export interface SearchTab {
    id: SearchTabType;
    label: string;
    icon: LucideIcon;
}

export interface Destination {
    id: string;
    name: string;
    type: 'city' | 'hotel' | 'airport' | 'country';
    country: string;
    stars?: number;
    provider?: string;
}

export interface RoomAllocation {
    adults: number;
    children: number;
    childrenAges: number[];
}

export type BudgetType = 'total' | 'person' | 'room';

export interface SearchFilters {
    hotelName?: string;
    stars: string[];
    mealPlans: string[];
    availability: string[];
    onlyRefundable: boolean;
    budgetFrom: string;
    budgetTo: string;
    budgetType: BudgetType;
}

export interface SearchState {
    activeTab: SearchTabType;
    searchMode: SearchModeType;
    destinations: Destination[];
    checkIn: string;
    checkOut: string;
    flexDays: number;
    roomAllocations: RoomAllocation[];
    nationality: string;
    filters: SearchFilters;
    isSearching: boolean;
    searchPerformed: boolean;
    results: any[];
    sortBy: string;
}
