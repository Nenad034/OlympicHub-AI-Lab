import { create } from 'zustand';
import { SearchState, SearchTabType, SearchModeType, Destination, RoomAllocation, BudgetType } from '../types';

interface SearchActions {
    setActiveTab: (tab: SearchTabType) => void;
    setSearchMode: (mode: SearchModeType) => void;
    setCheckIn: (date: string) => void;
    setCheckOut: (date: string) => void;
    setFlexDays: (days: number) => void;
    addDestination: (dest: Destination) => void;
    removeDestination: (id: string) => void;
    updateRoomAllocation: (index: number, adults: number, children: number, childrenAges: number[]) => void;
    updateFilter: (key: string, value: any) => void;
    setIsSearching: (val: boolean) => void;
    setSearchPerformed: (val: boolean) => void;
    setResults: (results: any[]) => void;
    setSortBy: (val: string) => void;
    resetSearch: () => void;
}

const initialState: SearchState = {
    activeTab: 'hotel',
    searchMode: 'classic',
    destinations: [],
    checkIn: '',
    checkOut: '',
    flexDays: 0,
    roomAllocations: [{ adults: 2, children: 0, childrenAges: [] }],
    nationality: 'RS',
    filters: {
        stars: ['all'],
        mealPlans: ['all'],
        availability: ['available'],
        onlyRefundable: false,
        budgetFrom: '',
        budgetTo: '',
        budgetType: 'total'
    },
    isSearching: false,
    searchPerformed: false,
    results: [],
    sortBy: 'smart'
};

export const useSearchStore = create<SearchState & SearchActions>((set) => ({
    ...initialState,

    setActiveTab: (tab) => set({ activeTab: tab }),
    setSearchMode: (mode) => set({ searchMode: mode }),
    setCheckIn: (date) => set({ checkIn: date }),
    setCheckOut: (date) => set({ checkOut: date }),
    setFlexDays: (days) => set({ flexDays: days }),
    
    addDestination: (dest) => set((state) => ({
        destinations: state.destinations.length < 3 ? [...state.destinations, dest] : state.destinations
    })),
    
    removeDestination: (id) => set((state) => ({
        destinations: state.destinations.filter(d => d.id !== id)
    })),

    updateRoomAllocation: (idx, adults, children, childrenAges) => set((state) => {
        const newAlloc = [...state.roomAllocations];
        newAlloc[idx] = { adults, children, childrenAges };
        return { roomAllocations: newAlloc };
    }),

    updateFilter: (key, value) => set((state) => ({
        filters: { ...state.filters, [key]: value }
    })),

    setIsSearching: (isSearching) => set({ isSearching }),
    setSearchPerformed: (searchPerformed) => set({ searchPerformed }),
    setResults: (results) => set({ results }),
    setSortBy: (sortBy) => set({ sortBy }),
    
    resetSearch: () => set(initialState)
}));
