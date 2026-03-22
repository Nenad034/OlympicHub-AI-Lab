import { create } from 'zustand';
import type {
    SearchState,
    SearchTabType,
    SearchModeType,
    Destination,
    RoomAllocation,
    SearchFilters,
    HotelSearchResult,
    FlightSearchResult,
    FlightSearchParams,
    CharterSearchParams,
    CharterResult,
    CarSearchParams,
    CarVehicle,
    TransferSearchParams,
    TransferResult,
    TourSearchParams,
    TourResult,
    ActivitySearchParams,
    ActivityResult,
    CruiseSearchParams,
    CruiseResult,
    PackageBasketItem,
    SearchAlert,
    AlternativeDateSuggestion,
    ConciergeOffer,
} from '../types';
import type { TransferOption, ActivityOption } from '../data/mockPackageData';

// ─────────────────────────────────────────────────────────────
// ACTIONS (Store Methods)
// ─────────────────────────────────────────────────────────────
interface SearchActions {
    // Tab & Mode
    setActiveTab: (tab: SearchTabType) => void;
    setSearchMode: (mode: SearchModeType) => void;
    setSemanticQuery: (query: string) => void;

    // Destinacije
    addDestination: (dest: Destination) => void;
    removeDestination: (id: string) => void;
    clearDestinations: () => void;

    // Datumi
    setCheckIn: (date: string) => void;
    setCheckOut: (date: string) => void;
    setFlexDays: (days: number) => void;

    // Putnici & Sobe
    addRoom: () => void;
    removeRoom: (index: number) => void;
    updateRoomAllocation: (index: number, allocation: Partial<RoomAllocation>) => void;
    setNationality: (nat: string) => void;

    // Filteri & Sortiranje
    updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
    setSortBy: (val: SearchState['sortBy']) => void;
    resetFilters: () => void;

    // Status Pretrage
    setIsSearching: (val: boolean) => void;
    setSearchPerformed: (val: boolean) => void;

    // Checkout proces za Package Basket
    showPackageCheckout: boolean;

    // Ostalo (UI)Rezultati
    setResults: (results: HotelSearchResult[]) => void;
    setSelectedHotel: (hotel: HotelSearchResult | null) => void;

    // Flight Rezultati
    setFlightSearchParams: (params: FlightSearchParams) => void;
    setFlightResults: (results: FlightSearchResult[]) => void;
    setSelectedFlight: (flight: FlightSearchResult | null) => void;

    // Package Wizard navigacija
    setPackageWizardStep: (step: number) => void;
    setPackageWizardFlight: (flight: FlightSearchResult | undefined) => void;
    setPackageWizardHotel: (hotelId: string | undefined, roomId: string | undefined, mealPlanCode: string | undefined) => void;
    setPackageWizardTransfer: (transferId: string | undefined) => void;
    togglePackageWizardExtra: (extraId: string) => void;
    resetPackageWizard: () => void;

    // Charter
    setCharterSearchParams: (params: CharterSearchParams) => void;
    setCharterResults: (results: CharterResult[]) => void;

    // Rent-a-Car
    setCarSearchParams: (params: CarSearchParams) => void;
    setCarResults: (results: CarVehicle[]) => void;

    // Transfer
    setTransferSearchParams: (params: TransferSearchParams) => void;
    setTransferResults: (results: TransferResult[]) => void;

    // Putovanja (Tours)
    setTourSearchParams: (params: TourSearchParams) => void;
    setTourResults: (results: TourResult[]) => void;

    // Izleti i Aktivnosti (Things to Do)
    setActivitySearchParams: (params: ActivitySearchParams) => void;
    setActivityResults: (results: ActivityResult[]) => void;

    // Krstarenja (Cruises)
    setCruiseSearchParams: (params: CruiseSearchParams) => void;
    setCruiseResults: (results: CruiseResult[]) => void;

    // Package Basket
    addToBasket: (item: PackageBasketItem) => void;
    removeFromBasket: (id: string) => void;
    clearBasket: () => void;
    setShowPackageCheckout: (val: boolean) => void;

    // UI & Alertovizorenja
    addAlert: (alert: SearchAlert) => void;
    dismissAlert: (id: string) => void;

    // Alternative Datumi
    setAlternativeDates: (dates: AlternativeDateSuggestion[]) => void;

    // Smart Concierge
    setConciergeOffers: (offers: ConciergeOffer[]) => void;
    dismissConciergeOffer: (id: string) => void;

    // Reset
    resetSearch: () => void;
}

// ─────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────
const defaultFilters: SearchFilters = {
    hotelName: '',
    stars: ['all'],
    mealPlans: ['all'],
    availability: ['instant', 'on-request'],
    onlyRefundable: false,
    onlyInstantBook: false,
    budgetFrom: '',
    budgetTo: '',
    budgetType: 'total'
};

const initialState: SearchState = {
    activeTab: 'hotel',
    searchMode: 'classic',
    semanticQuery: '', // AI Assistant raw input
    destinations: [],
    checkIn: '',
    checkOut: '',
    flexDays: 0,
    roomAllocations: [{ adults: 2, children: 0, childrenAges: [] }],
    nationality: 'RS',
    filters: defaultFilters,
    sortBy: 'smart',
    isSearching: false,
    searchPerformed: false,
    results: [],
    selectedHotel: null,
    flightSearchParams: null,
    flightResults: [],
    selectedFlight: null,
    charterSearchParams: null,
    charterResults: [],
    carSearchParams: null,
    carResults: [],
    transferSearchParams: null,
    transferResults: [],
    tourSearchParams: null,
    tourResults: [],
    activitySearchParams: null,
    activityResults: [],
    cruiseSearchParams: null,
    cruiseResults: [],
    packageBasket: [],
    packageWizardStep: 1,
    packageWizardSelections: { extraIds: [] },
    showPackageCheckout: false,
    alerts: [],
    alternativeDates: [],
    conciergeOffers: []
};

// ─────────────────────────────────────────────────────────────
// HELPER: Izračunaj Pax Summary (koristi se u UI komponentama)
// ─────────────────────────────────────────────────────────────
export const calcPaxSummary = (roomAllocations: RoomAllocation[], checkIn: string, checkOut: string) => {
    const totalAdults = roomAllocations.reduce((sum, r) => sum + r.adults, 0);
    const totalChildren = roomAllocations.reduce((sum, r) => sum + r.children, 0);
    const childrenAges = roomAllocations.flatMap(r => r.childrenAges);
    const totalRooms = roomAllocations.length;

    // Izračunaj broj noćenja
    const nights = checkIn && checkOut
        ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    return { totalAdults, totalChildren, childrenAges, totalRooms, nights, checkIn, checkOut };
};

// ─────────────────────────────────────────────────────────────
// HELPER: Izračunaj ukupnu cenu korpe (Package Basket)
// ─────────────────────────────────────────────────────────────
export const calcBasketTotal = (basket: PackageBasketItem[]): number =>
    basket.reduce((sum, item) => sum + item.totalPrice, 0);

// ─────────────────────────────────────────────────────────────
// ZUSTAND STORE
// ─────────────────────────────────────────────────────────────
export const useSearchStore = create<SearchState & SearchActions>((set, get) => ({
    ...initialState,

    // ── Tab & Mode ──────────────────────────────────────────
    setActiveTab: (tab) => set({ activeTab: tab, results: [], searchPerformed: false, alerts: [], alternativeDates: [] }),
    setSearchMode: (mode) => set({ searchMode: mode }),
    setSemanticQuery: (query) => set({ semanticQuery: query }),

    // ── Destinacije ─────────────────────────────────────────
    addDestination: (dest) => set((state) => ({
        destinations: state.destinations.length < 3
            ? [...state.destinations, dest]
            : state.destinations
    })),
    removeDestination: (id) => set((state) => ({
        destinations: state.destinations.filter(d => d.id !== id)
    })),
    clearDestinations: () => set({ destinations: [] }),

    // ── Datumi ──────────────────────────────────────────────
    setCheckIn: (date) => set({ checkIn: date }),
    setCheckOut: (date) => set({ checkOut: date }),
    setFlexDays: (days) => set({ flexDays: days }),

    // ── Putnici & Sobe ──────────────────────────────────────
    addRoom: () => set((state) => ({
        roomAllocations: [...state.roomAllocations, { adults: 2, children: 0, childrenAges: [] }]
    })),
    removeRoom: (index) => set((state) => ({
        roomAllocations: state.roomAllocations.filter((_, i) => i !== index)
    })),
    updateRoomAllocation: (index, allocation) => set((state) => {
        const newAlloc = [...state.roomAllocations];
        newAlloc[index] = { ...newAlloc[index], ...allocation };
        // Sinhronizuj childrenAges sa brojem dece
        if (allocation.children !== undefined) {
            const currentAges = newAlloc[index].childrenAges;
            if (allocation.children > currentAges.length) {
                // Dodaj nova deca sa default uzrastom 5
                newAlloc[index].childrenAges = [
                    ...currentAges,
                    ...Array(allocation.children - currentAges.length).fill(5)
                ];
            } else {
                // Ukloni višak
                newAlloc[index].childrenAges = currentAges.slice(0, allocation.children);
            }
        }
        return { roomAllocations: newAlloc };
    }),
    setNationality: (nationality) => set({ nationality }),

    // ── Filteri & Sortiranje ─────────────────────────────────
    updateFilter: (key, value) => set((state) => ({
        filters: { ...state.filters, [key]: value }
    })),
    setSortBy: (sortBy) => set({ sortBy }),
    resetFilters: () => set({ filters: defaultFilters }),

    // ── Status Pretrage ──────────────────────────────────────
    setIsSearching: (isSearching) => set({ isSearching }),
    setSearchPerformed: (searchPerformed) => set({ searchPerformed }),

    // ── Hotel Rezultati ─────────────────────────────────────
    setResults: (results) => set({ results, isSearching: false, searchPerformed: true }),
    setSelectedHotel: (selectedHotel) => set({ selectedHotel }),

    // ── Flight Rezultati ────────────────────────────────────
    setFlightSearchParams: (flightSearchParams) => set({ flightSearchParams }),
    setFlightResults: (flightResults) => set({ flightResults, isSearching: false, searchPerformed: true }),
    setSelectedFlight: (selectedFlight) => set({ selectedFlight }),

    // ── Charter ────────────────────────────────────
    setCharterSearchParams: (charterSearchParams) => set({ charterSearchParams }),
    setCharterResults: (charterResults) => set({ charterResults, isSearching: false, searchPerformed: true }),

    // ── Rent-a-Car ──────────────────────────────
    setCarSearchParams: (carSearchParams) => set({ carSearchParams }),
    setCarResults: (carResults) => set({ carResults, isSearching: false, searchPerformed: true }),

    // ── Transfer ───────────────────────────────
    setTransferSearchParams: (transferSearchParams) => set({ transferSearchParams }),
    setTransferResults: (transferResults) => set({ transferResults, isSearching: false, searchPerformed: true }),

    // ── Putovanja (Tours) ──────────────────────
    setTourSearchParams: (tourSearchParams) => set({ tourSearchParams }),
    setTourResults: (tourResults) => set({ tourResults, isSearching: false, searchPerformed: true }),

    // ── Izleti i Aktivnosti ────────────────────
    setActivitySearchParams: (activitySearchParams) => set({ activitySearchParams }),
    setActivityResults: (activityResults) => set({ activityResults, isSearching: false, searchPerformed: true }),

    // ── Krstarenja ─────────────────────────────
    setCruiseSearchParams: (cruiseSearchParams) => set({ cruiseSearchParams }),
    setCruiseResults: (cruiseResults) => set({ cruiseResults, isSearching: false, searchPerformed: true }),

    // ── Package Wizard ──────────────────────────────────
    setPackageWizardStep: (packageWizardStep) => set({ packageWizardStep }),
    setPackageWizardFlight: (flight) => set((state) => ({
        packageWizardSelections: { ...state.packageWizardSelections, flight }
    })),
    setPackageWizardHotel: (hotelId, roomId, mealPlanCode) => set((state) => ({
        packageWizardSelections: { ...state.packageWizardSelections, hotelId, roomId, mealPlanCode }
    })),
    setPackageWizardTransfer: (transferId) => set((state) => ({
        packageWizardSelections: { ...state.packageWizardSelections, transferId }
    })),
    togglePackageWizardExtra: (extraId) => set((state) => {
        const current = state.packageWizardSelections.extraIds;
        const next = current.includes(extraId)
            ? current.filter(id => id !== extraId)
            : [...current, extraId];
        return { packageWizardSelections: { ...state.packageWizardSelections, extraIds: next } };
    }),
    resetPackageWizard: () => set({
        packageWizardStep: 1,
        packageWizardSelections: { extraIds: [] },
    }),

    // ── Package Basket ───────────────────────────────────────
    addToBasket: (item) => set((state) => ({
        packageBasket: [...state.packageBasket, item]
    })),
    removeFromBasket: (id) => set((state) => {
        const items = state.packageBasket.filter(i => i.id !== id);
        return { packageBasket: items };
    }),
    clearBasket: () => set({ packageBasket: [] }),
    setShowPackageCheckout: (showPackageCheckout) => set({ showPackageCheckout }),

    // ── UI ──────────────────────────────────────────
    addAlert: (alert) => set((state) => ({
        alerts: [...state.alerts.filter(a => a.id !== alert.id), alert]
    })),
    dismissAlert: (id) => set((state) => ({
        alerts: state.alerts.filter(a => a.id !== id)
    })),

    // ── Alternative Datumi ───────────────────────────────────
    setAlternativeDates: (alternativeDates) => set({ alternativeDates }),

    // ── Smart Concierge ──────────────────────────────────────
    setConciergeOffers: (conciergeOffers) => set({ conciergeOffers }),
    dismissConciergeOffer: (id) => set((state) => ({
        conciergeOffers: state.conciergeOffers.filter(o => o.id !== id)
    })),

    // ── Reset ────────────────────────────────────────────────
    resetSearch: () => set(initialState)
}));
