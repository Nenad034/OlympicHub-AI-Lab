import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ClickToTravelLogo } from '../components/icons/ClickToTravelLogo';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores';
import {
    Sparkles, Hotel, Plane, Package, Bus, Compass, LayoutTemplate,
    MapPin, Calendar, CalendarDays, Users, UtensilsCrossed, Star,
    Search, Bot, TrendingUp, Zap, Shield, X, Loader2, MoveRight, MoveLeft, Users2, ChevronDown,
    LayoutGrid, List as ListIcon, Map as MapIcon, ArrowDownWideNarrow, ArrowUpNarrowWide,
    CheckCircle2, CheckCircle, XCircle, RefreshCw, Clock, ArrowRight, ShieldCheck, Info, Calendar as CalendarIcon,
    Plus, Globe, AlignLeft, Mountain, DollarSign, Coffee, Building2, Filter
} from 'lucide-react';
import { useThemeStore } from '../stores';
import { performSmartSearch, type SmartSearchResult, PROVIDER_MAPPING } from '../services/smartSearchService';
import { searchPrefetchService } from '../services/searchPrefetchService';
import { sentinelEvents } from '../utils/sentinelEvents';
import { getMonthlyReservationCount } from '../services/reservationService';
import solvexDictionaryService from '../services/solvex/solvexDictionaryService';
import { ModernCalendar } from '../components/ModernCalendar';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { BookingModal } from '../components/booking/BookingModal';
import { BookingSuccessModal } from '../components/booking/BookingSuccessModal';
import { formatDate } from '../utils/dateUtils';
import PackageSearch from './PackageSearch';
import FlightSearch from './FlightSearch';
import { useConfig } from '../context/ConfigContext';
import { BudgetTypeToggle } from '../components/BudgetTypeToggle';
import { getProxiedImageUrl } from '../utils/imageProxy';
import './SmartSearch.css';
import './SmartSearchFix2.css';
import './SmartSearchRedesign.css';
import './SmartSearchFerrariFix.css';
import './ModalFixDefinitive.css';
import './SmartSearchStylesFix.css';
import './SmartSearchGridFix.css';
import './SmartSearchLightMode.css';
import './GlobalHubSearch.css';

/**
 * Constants for filtering
 */
const CATEGORY_OPTIONS = [
    { value: 'all', label: 'Sve Kategorije' },
    { value: '5', label: '5 Zvezdica' },
    { value: '4', label: '4 Zvezdice' },
    { value: '3', label: '3 Zvezdice' },
    { value: '2', label: '2 Zvezdice' }
];

const MEAL_PLAN_OPTIONS = [
    { value: 'all', label: 'Sve Usluge' },
    { value: 'RO', label: 'Najam (RO)' },
    { value: 'BB', label: 'Noćenje sa doručkom (BB)' },
    { value: 'HB', label: 'Polupansion (HB)' },
    { value: 'FB', label: 'Pun pansion (FB)' },
    { value: 'AI', label: 'All Inclusive (AI)' },
    { value: 'UAI', label: 'Ultra All Inclusive (UAI)' },
];

const NATIONALITY_OPTIONS = [
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

/**
 * Normalize meal plan code to standard types
 */
const normalizeMealPlan = (plan: string): string => {
    if (!plan) return 'RO';
    let p = plan.toUpperCase().trim();

    if (p === 'UAI') return 'UAI';
    if (p === 'AI' || p === 'ALL') return 'AI';
    if (p === 'FB' || p === 'PA') return 'FB';
    if (p === 'HB' || p === 'PP' || p === 'НВ' || p === 'ПП') return 'HB';
    if (p === 'BB' || p === 'ND') return 'BB';
    if (p === 'RO' || p === 'RR' || p === 'OB' || p === 'SC' || p === 'NA' || p === 'NM') return 'RO';

    if (p.includes('ULTRA')) return 'UAI';
    if (p.includes('ALL INCL') || p.includes('SVE UKLJ')) return 'AI';
    if ((p.includes('FULL') || p.includes('PUN') || p.includes('PANSION')) && !p.includes('POLU') && !p.includes('HALF')) return 'FB';
    if (p.includes('HALF') || p.includes('POLU') || p.includes('HB') || p.includes('DORUCAK I VECERA') || p.includes('DORUČAK I VEČERA')) return 'HB';
    if (p.includes('BED') || p.includes('BREAKFAST') || p.includes('DORUCAK') || p.includes('DORUČAK') || p.includes('NOCENJE') || p.includes('NOĆENJE') || p.includes('BB')) return 'BB';
    if (p.includes('ROOM') || p.includes('NAJAM') || p.includes('ONLY') || p.includes('BEZ USLUGE')) return 'RO';

    return 'RO';
};

/**
 * Get full meal plan display name in Serbian
 */
const formatPrice = (price: number) => {
    return price.toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const getMealPlanDisplayName = (code: string | undefined): string => {
    if (!code) return 'Samo Smeštaj';
    const normalized = normalizeMealPlan(code);

    const mealPlanNames: Record<string, string> = {
        'RO': 'Samo Smeštaj',
        'BB': 'Noćenje sa Doručkom',
        'HB': 'Polupansion',
        'FB': 'Pun Pansion',
        'AI': 'All Inclusive',
        'UAI': 'Ultra All Inclusive',
        'NM': 'Bez Obroka',
        'SC': 'Samo Smeštaj',
        'ND': 'Noćenje sa Doručkom',
        'PP': 'Polupansion',
        'PA': 'Pun Pansion'
    };

    return mealPlanNames[normalized] || mealPlanNames[code.toUpperCase()] || code;
};

const renderAvailabilityStatus = (status: string | undefined) => {
    if (!status) return null;
    const s = status.toLowerCase();

    let Icon = RefreshCw;
    let label = 'NA UPIT';
    let className = 'status-on-request';

    if (s === 'available' || s === 'slobodno' || s === 'instant') {
        Icon = Zap;
        label = 'ODMAH DOSTUPNO';
        className = 'status-available';
    } else if (s === 'unavailable' || s === 'rasprodato' || s === 'stop_sale') {
        Icon = XCircle;
        label = 'RASPRODATO';
        className = 'status-sold-out';
    }

    return (
        <div className={`availability-status-v6 ${className}`}>
            <Icon size={10} />
            <span>{label}</span>
        </div>
    );
};

const renderMealPlanBadge = (mp: string, isLedger: boolean = false) => {
    const name = getMealPlanDisplayName(mp);
    const code = normalizeMealPlan(mp);
    let Icon = UtensilsCrossed;
    if (code === 'BB') Icon = Coffee;
    if (code === 'HB') Icon = UtensilsCrossed;
    if (code === 'AI' || code === 'UAI') Icon = Sparkles;
    if (code === 'RO') Icon = Building2;

    return (
        <div className={isLedger ? "meal-plan-ledger-display" : "meal-plan-badge-v2"}>
            <Icon size={isLedger ? 14 : 12} />
            <span>{name}</span>
        </div>
    );
};

/**
 * Strips redundant destination info from room names
 */
const cleanRoomName = (name: string): string => {
    if (!name) return '';
    return name
        .replace(/\s*\(\s*Dest:[^)]*\)/gi, '') // Remove (Dest: ...)
        .replace(/\s*Dest:[^)]*/gi, '')       // Remove Dest: ... without parens
        .replace(/\s*\(\s*(Golden Sands|Sunny Beach|Nessebar|Albena|Bansko|Borovets|Pamporovo|Burgas|Varna|Sofia|Sozopol|Primorsko|St\.Vlas|Obzor)\s*\)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
};

interface Destination {
    id: string;
    name: string;
    type: 'destination' | 'hotel' | 'country';
    country?: string;
    stars?: number;
    provider?: string;
}

interface RoomAllocation {
    adults: number;
    children: number;
    childrenAges: number[];
}

import { NarrativeSearch } from '../components/packages/Steps/NarrativeSearch';
import { ImmersiveSearch, type ImmersiveSearchData } from '../components/packages/Steps/ImmersiveSearch';
import type { BasicInfoData, DestinationInput } from '../types/packageSearch.types';


const SmartSearch: React.FC = () => {
    const { userLevel, impersonatedSubagent } = useAuthStore();
    const isSubagent = userLevel < 6 || !!impersonatedSubagent;
    const { theme } = useThemeStore();
    const isActuallyDark = theme === 'navy';
    const isLightMode = !isActuallyDark;
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    // MODE SWITCH
    const [searchMode, setSearchMode] = useState<'classic' | 'narrative' | 'immersive'>('immersive');

    // Reset search performed when mode changes so the wizard is visible
    useEffect(() => {
        setSearchPerformed(false);
    }, [searchMode]);

    const activeTab = (searchParams.get('tab') as 'hotel' | 'flight' | 'package' | 'transfer' | 'tour' | 'ski') || 'hotel';

    const setActiveTab = (newTab: 'hotel' | 'flight' | 'package' | 'transfer' | 'tour' | 'ski') => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('tab', newTab);
            return newParams;
        }, { replace: true });
    };

    const [selectedDestinations, setSelectedDestinations] = useState<Destination[]>([]);
    const [destinationInput, setDestinationInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<Destination[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    // Recent searches state kept but not used for display anymore
    const [recentSearches, setRecentSearches] = useState<Destination[]>([]);

    const [checkIn, setCheckIn] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    });
    const [checkOut, setCheckOut] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 8);
        return d.toISOString().split('T')[0];
    });
    const [nights, setNights] = useState(7);
    const [activeCalendar, setActiveCalendar] = useState<'in' | 'out' | null>(null);
    const [flexibleDays, setFlexibleDays] = useState(0);

    // Multi-room state
    const [activeRoomTab, setActiveRoomTab] = useState(0);
    const [roomAllocations, setRoomAllocations] = useState<RoomAllocation[]>([
        { adults: 2, children: 0, childrenAges: [] },
        { adults: 0, children: 0, childrenAges: [] },
        { adults: 0, children: 0, childrenAges: [] },
        { adults: 0, children: 0, childrenAges: [] },
        { adults: 0, children: 0, childrenAges: [] }
    ]);
    const [showRoomPicker, setShowRoomPicker] = useState(false);
    const [showStarPicker, setShowStarPicker] = useState(false);
    const [showMealPicker, setShowMealPicker] = useState(false);
    const [showNationalityPicker, setShowNationalityPicker] = useState(false);

    const [mealPlan, setMealPlan] = useState('');
    const [nationality, setNationality] = useState('RS');
    const [budgetType, setBudgetType] = useState<'total' | 'person'>('person');
    const [showModes, setShowModes] = useState(true);

    // NARRATIVE TO SMART SEARCH ADAPTER
    const handleNarrativeUpdate = (data: BasicInfoData) => {
        let mappedDestinations = selectedDestinations;
        let mappedCheckIn = checkIn;
        let mappedCheckOut = checkOut;
        let mappedAllocations = roomAllocations;

        // 1. Map Destinations
        if (data.destinations && data.destinations.length > 0) {
            const newMappedDestinations = data.destinations.map(dest => {
                let finalId = dest.id;
                let finalType = (dest as any).type || 'destination';
                let finalCountry = (dest as any).country_name || dest.country || 'Bugarska';

                const isRealProviderId = finalId && !String(finalId).startsWith('narrative');

                if (!isRealProviderId) {
                    const existingDest = mockDestinations.find(d => d.name.toLowerCase() === dest.city.toLowerCase());
                    if (existingDest) {
                        finalId = existingDest.id;
                        finalType = existingDest.type;
                        finalCountry = existingDest.country;
                    } else {
                        finalId = `narrative-${dest.city}`;
                    }
                }

                return {
                    id: finalId,
                    name: dest.city,
                    type: finalType as 'destination' | 'hotel' | 'country',
                    country: finalCountry
                };
            });

            mappedDestinations = newMappedDestinations;

            // Only update state if effectively changed
            const currentIds = selectedDestinations.map(d => d.id).sort().join(',');
            const newIds = mappedDestinations.map(d => d.id).sort().join(',');
            if (currentIds !== newIds) {
                setSelectedDestinations(mappedDestinations);
            }
        }

        // 2. Map Dates
        if (data.startDate !== checkIn) {
            mappedCheckIn = data.startDate;
            setCheckIn(mappedCheckIn);
        }
        if (data.endDate !== checkOut) {
            mappedCheckOut = data.endDate;
            setCheckOut(mappedCheckOut);
        }
        if (data.totalDays !== nights) setNights(data.totalDays || 0);

        // 3. Map Travelers
        if (data.roomAllocations && data.roomAllocations.length > 0) {
            mappedAllocations = data.roomAllocations.map(r => ({
                adults: r.adults,
                children: r.children,
                childrenAges: r.childrenAges || []
            }));
            if (JSON.stringify(roomAllocations) !== JSON.stringify(mappedAllocations)) {
                setRoomAllocations(mappedAllocations);
            }
        } else if (data.travelers) {
            const travelers = data.travelers;
            const newAllocations = [{
                adults: travelers.adults,
                children: travelers.children,
                childrenAges: travelers.childrenAges || []
            }];
            mappedAllocations = newAllocations;
            const current = roomAllocations[0];
            if (roomAllocations.length !== 1 || current.adults !== travelers.adults || current.children !== travelers.children || JSON.stringify(current.childrenAges) !== JSON.stringify(travelers.childrenAges)) {
                setRoomAllocations(mappedAllocations);
            }
        }

        // 4. Map Advanced Filters
        if (data.nationality && data.nationality !== nationality) {
            setNationality(data.nationality);
        }

        if (data.destinations[0]?.service && data.destinations[0].service.length > 0) {
            const service = data.destinations[0].service[0];
            if (service !== mealPlan && service !== 'all') {
                setMealPlan(service);
            }
        }

        if (data.budgetType && data.budgetType !== budgetType) {
            setBudgetType(data.budgetType);
        }

        return {
            destinations: mappedDestinations,
            checkIn: mappedCheckIn,
            checkOut: mappedCheckOut,
            allocations: mappedAllocations
        };
    };

    // Prepare Initial Data for Narrative Search
    const getInitialNarrativeData = (): BasicInfoData => {
        return {
            destinations: [{
                id: '1',
                city: selectedDestinations[0]?.name || '',
                checkIn: checkIn,
                checkOut: checkOut,
                nights: nights,
                travelers: roomAllocations[0],
                category: [],
                service: [],
                flexibleDays: 0,
                country: '',
                countryCode: '',
                airportCode: ''
            }],
            travelers: roomAllocations[0],
            budgetFrom: budgetFrom ? Number(budgetFrom) : undefined,
            budgetTo: budgetTo ? Number(budgetTo) : undefined,
            budgetType: budgetType,
            nationality: nationality,
            currency: 'EUR',
            startDate: checkIn,
            endDate: checkOut,
            totalDays: nights
        };
    };

    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SmartSearchResult[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [selectedArrivalDate, setSelectedArrivalDate] = useState<string | null>(null);

    // Smart Suggestions state
    const [smartSuggestions, setSmartSuggestions] = useState<{
        type: 'flexible_dates' | 'similar_hotels',
        data: SmartSearchResult[],
        message: string
    } | null>(null);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
    const [availabilityTimeline, setAvailabilityTimeline] = useState<Record<string, { available: boolean, price?: number, isCheapest?: boolean }>>({});


    // Filter & UI States
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'notepad'>('grid');
    const [sortBy, setSortBy] = useState<'smart' | 'price_low' | 'price_high'>('smart');
    const [hotelNameFilter, setHotelNameFilter] = useState('');
    const [selectedStars, setSelectedStars] = useState<string[]>(['all']);
    const [selectedMealPlans, setSelectedMealPlans] = useState<string[]>(['all']);
    const [budgetFrom, setBudgetFrom] = useState<string>('');
    const [budgetTo, setBudgetTo] = useState<string>('');

    // Booking states
    const [expandedHotel, setExpandedHotel] = useState<SmartSearchResult | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [notepadMealFilters, setNotepadMealFilters] = useState<Record<string, string>>({});
    const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<any>(null);
    const [bookingSuccessData, setBookingSuccessData] = useState<{ id: string, code: string, provider: string } | null>(null);
    const [bookingAlertError, setBookingAlertError] = useState<string | null>(null);
    const [prefetchedResults, setPrefetchedResults] = useState<SmartSearchResult[]>([]);
    const [prefetchKey, setPrefetchKey] = useState<string>('');
    const [isPrefetching, setIsPrefetching] = useState(false);
    const tabId = useRef(Math.random().toString(36).substring(2, 11));

    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    // Mock data
    const mockDestinations: Destination[] = [
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
        { id: 'h2', name: 'Hotel Budva Riviera', type: 'hotel', country: 'Montenegro', stars: 4, provider: 'Solvex' }
    ];

    const tabs = [
        { id: 'hotel' as const, label: 'Smeštaj', icon: Hotel },
        { id: 'flight' as const, label: 'Letovi', icon: Plane },
        { id: 'package' as const, label: 'DYNAMIC WIZARD', icon: Package },
        { id: 'transfer' as const, label: 'Transferi', icon: Bus },
        { id: 'tour' as const, label: 'Putovanja', icon: Compass },
        { id: 'ski' as const, label: 'SKI', icon: Mountain },
    ];

    // Helper to sync nights when dates change
    const syncNightsFromDates = (start: string, end: string) => {
        if (!start || !end) return;
        const s = new Date(start);
        const e = new Date(end);
        if (isNaN(s.getTime()) || isNaN(e.getTime())) return;
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setNights(diffDays);
    };

    useEffect(() => {
        const stored = localStorage.getItem('smartSearchRecent');
        if (stored) {
            try {
                setRecentSearches(JSON.parse(stored));
            } catch (e) {
                console.warn('Failed to parse recent searches:', e);
            }
        }

        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const checkInDate = tomorrow.toISOString().split('T')[0];
        setCheckIn(checkInDate);

        const checkOutDate = new Date(tomorrow);
        checkOutDate.setDate(checkOutDate.getDate() + 7);
        setCheckOut(checkOutDate.toISOString().split('T')[0]);
        setNights(7);

        // Ported from GlobalHubSearch
        if (!selectedArrivalDate) {
            setSelectedArrivalDate(checkInDate);
        }

        // TAB HEARTBEAT LOGIC (Reliable cross-tab counting)
        const HEARTBEAT_INTERVAL = 2000;
        const TAB_PREFIX = 'search_tab_';

        const updateHeartbeat = () => {
            localStorage.setItem(`${TAB_PREFIX}${tabId.current}`, Date.now().toString());
        };

        const cleanupOldTabs = () => {
            const now = Date.now();
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(TAB_PREFIX)) {
                    const timestamp = parseInt(localStorage.getItem(key) || '0');
                    if (now - timestamp > 5000) {
                        localStorage.removeItem(key);
                    }
                }
            }
        };

        updateHeartbeat();
        const heartbeatTimer = setInterval(updateHeartbeat, HEARTBEAT_INTERVAL);
        const cleanupTimer = setInterval(cleanupOldTabs, 10000);

        // Click outside handler
        const handleClickOutside = (event: MouseEvent) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            clearInterval(heartbeatTimer);
            clearInterval(cleanupTimer);
            localStorage.removeItem(`${TAB_PREFIX}${tabId.current}`);
        };
    }, []);

    const handleNewSearchTab = () => {
        const TAB_PREFIX = 'search_tab_';
        const now = Date.now();
        let activeCount = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(TAB_PREFIX)) {
                const timestamp = parseInt(localStorage.getItem(key) || '0');
                if (now - timestamp < 6000) { // Check tabs active in the last 6 seconds
                    activeCount++;
                }
            }
        }

        if (activeCount >= 5) {
            alert("⚠️ LIMIT DOSTIGNUT: Imate otvorenih 5 pretraga. Molimo zatvorite neki tab pre nego što pokrenete novu pretragu radi boljih performansi.");
            return;
        }
        window.open(window.location.href, '_blank');
    };

    useEffect(() => {
        const fetchSuggestions = async () => {
            // ONLY search if input length >= 2. NO RECENT SEARCHES ON EMPTY INPUT.
            if (destinationInput.length >= 2) {
                setIsLoadingSuggestions(true);
                setSelectedIndex(-1);
                const searchTerm = destinationInput.toLowerCase();

                const localMatches = mockDestinations.filter(dest =>
                    dest.name.toLowerCase().includes(searchTerm) &&
                    !selectedDestinations.find(selected => selected.id === dest.id)
                );

                setSuggestions(localMatches.slice(0, 10));
                setShowSuggestions(true);

                try {
                    const citiesToSearch = [33, 68, 9];
                    const dynamicResults: Destination[] = [];

                    for (const cityId of citiesToSearch) {
                        const hotelsRes = await solvexDictionaryService.getHotels(cityId);
                        if (hotelsRes.success && hotelsRes.data) {
                            const matching = (hotelsRes.data as any[])
                                .filter(h => h.name.toLowerCase().includes(searchTerm))
                                .map(h => ({
                                    id: `solvex-h-${h.id}`,
                                    name: h.name,
                                    type: 'hotel' as const,
                                    country: 'Bulgaria',
                                    provider: 'Solvex',
                                    stars: h.stars
                                }));
                            dynamicResults.push(...matching);
                        }
                    }

                    if (dynamicResults.length > 0) {
                        setSuggestions(prev => {
                            const combined = [...prev, ...dynamicResults];
                            return combined.filter((item, index, self) =>
                                index === self.findIndex((t) => t.id === item.id)
                            ).slice(0, 15);
                        });
                        setShowSuggestions(true);
                    }
                } catch (err) {
                    console.warn('[SmartSearch] Solvex API failed:', err);
                } finally {
                    setIsLoadingSuggestions(false);
                }
            } else {
                // If input is short or empty, HIDE EVERYTHING.
                setSuggestions([]);
                setShowSuggestions(false);
                setIsLoadingSuggestions(false);
                setSelectedIndex(-1);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [destinationInput, selectedDestinations]); // recentSearches REMOVED from dependency array

    // Subscribe to prefetch service ONCE on mount
    useEffect(() => {
        const unsubscribe = searchPrefetchService.subscribe('smart-search', {
            onComplete: (results, key) => {
                setPrefetchedResults(results);
                setPrefetchKey(key);
            },
            onStart: () => setIsPrefetching(true),
            onEnd: () => setIsPrefetching(false),
        });
        return () => {
            unsubscribe();
            searchPrefetchService.cancel();
        };
    }, []);

    // Schedule pre-fetch when search params change (Classic/Narrative modes)
    useEffect(() => {
        if (selectedDestinations.length > 0 && checkIn && checkOut && searchMode !== 'immersive') {
            searchPrefetchService.schedule({
                destinations: selectedDestinations,
                checkIn,
                checkOut,
                allocations: roomAllocations,
                mealPlan,
                nationality,
                searchType: activeTab
            });
        }
    }, [selectedDestinations, checkIn, checkOut, roomAllocations, searchMode, activeTab, mealPlan, nationality]);

    const handleImmersiveUpdate = useCallback((data: ImmersiveSearchData) => {
        // Schedule pre-fetch when immersive wizard has enough data
        if (data.destinations.length > 0 && data.checkIn && data.checkOut) {
            searchPrefetchService.schedule({
                destinations: data.destinations as any,
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                allocations: data.roomAllocations,
                mealPlan: (data.services && data.services.length > 0) ? data.services[0] : mealPlan,
                nationality: data.nationality || nationality,
                searchType: activeTab
            });
        }
    }, [activeTab, mealPlan, nationality]);

    const generateFlexDates = (baseDate: string, range: number) => {
        if (!baseDate) return [];
        const dates = [];
        const base = new Date(baseDate);
        for (let i = -range; i <= range; i++) {
            const d = new Date(base);
            d.setDate(d.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    };

    const handleAddDestination = (destination: Destination) => {
        if (selectedDestinations.length < 3) {
            setSelectedDestinations([...selectedDestinations, destination]);
            setDestinationInput('');
            setSuggestions([]);
            setShowSuggestions(false);
            setSelectedIndex(-1);

            const updated = [destination, ...recentSearches.filter(r => r.id !== destination.id)].slice(0, 5);
            setRecentSearches(updated);
            localStorage.setItem('smartSearchRecent', JSON.stringify(updated));
            inputRef.current?.focus();
        }
    };

    const handleSearch = async (overrideParams?: {
        checkIn?: string,
        checkOut?: string,
        destinations?: Destination[],
        allocations?: RoomAllocation[]
    }) => {
        const activeCheckIn = overrideParams?.checkIn || checkIn;
        const activeCheckOut = overrideParams?.checkOut || checkOut;
        const activeDestinations = overrideParams?.destinations || selectedDestinations;
        const activeAllocations = (overrideParams?.allocations || roomAllocations).filter(r => r.adults > 0);

        if (activeDestinations.length === 0) {
            setSearchError('Molimo odaberite najmanje jednu destinaciju');
            return;
        }

        if (!activeCheckIn || !activeCheckOut) {
            setSearchError('Molimo unesite datume');
            return;
        }

        // CHECK PREFETCH CACHE - use singleton service key
        const currentKey = searchPrefetchService.buildKey({
            destinations: activeDestinations,
            checkIn: activeCheckIn,
            checkOut: activeCheckOut,
            allocations: activeAllocations,
            mealPlan,
            nationality,
            searchType: activeTab
        });
        if (prefetchedResults.length > 0 && prefetchKey === currentKey) {
            console.log('[SmartSearch] ✅ Using prefetched results! Instant display.');
            setSearchResults(prefetchedResults);
            setSearchPerformed(true);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        setSearchError(null);
        setSearchResults([]);
        setSearchPerformed(false);
        setSmartSuggestions(null);
        setSelectedArrivalDate(activeCheckIn);

        try {
            if (activeAllocations.length === 0) {
                setSearchError('Molimo definišite bar jednu sobu sa odraslim putnicima.');
                setIsSearching(false);
                return;
            }

            const results = await performSmartSearch({
                searchType: activeTab,
                destinations: activeDestinations.map(d => ({
                    id: String(d.id).replace('solvex-c-', ''),
                    name: d.name,
                    type: d.type
                })),
                checkIn: activeCheckIn,
                checkOut: activeCheckOut,
                rooms: activeAllocations,
                mealPlan,
                currency: 'EUR',
                nationality: nationality || 'RS',
            });

            // ENHANCE WITH CRM SALES DATA (only if cache miss - otherwise already enriched)
            const resultsWithSales = await Promise.all(results.map(async (h) => {
                const count = await getMonthlyReservationCount(h.name);
                return { ...h, salesCount: count };
            }));

            setSearchResults(resultsWithSales);
            setSearchPerformed(true);

            // Access potential errors from performers (using the hack we added in service)
            if (resultsWithSales.length === 0 && (results as any)._lastError) {
                setSearchError((results as any)._lastError);
            }

            if (resultsWithSales.length === 0 && !overrideParams) {
                // SOLVEX AI ASSISTANT DISABLED - PURE API MODE
                setSearchError('Nažalost, nema slobodnih mesta za izabrane parametre. Pokušajte sa drugim datumima ili destinacijom.');
            }
        } catch (error) {
            console.error('[SmartSearch] Search error:', error);
            setSearchError(error instanceof Error ? error.message : 'Greška pri pretrazi');
        } finally {
            setIsSearching(false);
        }
    };


    const getPriceWithMargin = (price: number) => Number((price * 1.15).toFixed(2));

    const getFinalDisplayPrice = (hotel: SmartSearchResult) => {
        let total = 0;
        if (hotel.allocationResults && Object.keys(hotel.allocationResults).length > 0) {
            Object.values(hotel.allocationResults).forEach((rooms: any) => {
                if (!rooms || rooms.length === 0) return;
                const minPrice = Math.min(...rooms.map((r: any) => r.price));
                total += isSubagent ? getPriceWithMargin(minPrice) : Number(minPrice);
            });
        } else {
            total = isSubagent ? getPriceWithMargin(hotel.price) : Number(hotel.price);
        }
        return total;
    };

    const filteredResults = searchResults.filter(hotel => {
        // TEMPORARY: Only show Solvex results as other APIs are undergoing maintenance
        if (hotel.provider.toLowerCase() !== 'solvex') return false;

        if (hotelNameFilter) {
            const searchTerm = hotelNameFilter.toLowerCase();
            const matchesName = hotel.name.toLowerCase().includes(searchTerm);
            const matchesLocation = (hotel.location || '').toLowerCase().includes(searchTerm);

            // Check original data for more specific destination info if available
            const matchesOriginal = (
                (hotel.originalData?.hotel?.city?.name || '').toLowerCase().includes(searchTerm) ||
                (hotel.originalData?.hotel?.country?.name || '').toLowerCase().includes(searchTerm) ||
                (hotel.originalData?.location?.city || '').toLowerCase().includes(searchTerm)
            );

            if (!matchesName && !matchesLocation && !matchesOriginal) return false;
        }

        if (selectedStars.length > 0 && !selectedStars.includes('all')) {
            if (!selectedStars.includes(String(hotel.stars || 0))) {
                return false;
            }
        }

        if (selectedMealPlans.length > 0 && !selectedMealPlans.includes('all')) {
            const normalized = normalizeMealPlan(hotel.mealPlan || '');
            if (!selectedMealPlans.includes(normalized)) {
                return false;
            }
        }

        const totalPrice = getFinalDisplayPrice(hotel);
        const totalPax = (roomAllocations.filter(r => r.adults > 0).reduce((sum, r) => sum + r.adults + r.children, 0)) || 1;
        const price = budgetType === 'person' ? (totalPrice / totalPax) : totalPrice;

        // Robust filtering
        if (budgetFrom) {
            const minBudget = Number(budgetFrom);
            if (!isNaN(minBudget) && price < minBudget) return false;
        }
        if (budgetTo) {
            const maxBudget = Number(budgetTo);
            if (!isNaN(maxBudget) && price > maxBudget) return false;
        }

        return true;
    }).sort((a, b) => {
        if (sortBy === 'price_low') return getFinalDisplayPrice(a) - getFinalDisplayPrice(b);
        if (sortBy === 'price_high') return getFinalDisplayPrice(b) - getFinalDisplayPrice(a);
        if (sortBy === 'smart') {
            // Smart sort: Best Sellers first, then Stars descending, then price ascending
            const salesA = a.salesCount || 0;
            const salesB = b.salesCount || 0;
            if (salesB >= 10 && salesA < 10) return 1;
            if (salesA >= 10 && salesB < 10) return -1;

            if ((b.stars || 0) !== (a.stars || 0)) return (b.stars || 0) - (a.stars || 0);
            return getFinalDisplayPrice(a) - getFinalDisplayPrice(b);
        }
        return 0;
    });

    const handleReserveClick = (room: any, rIdx: number, hotelOverride?: SmartSearchResult) => {
        const hotel = hotelOverride || expandedHotel;
        if (!hotel) return;

        setSelectedRoomForBooking({ ...room, allocationIndex: rIdx });
        setExpandedHotel(hotel);
        setIsBookingModalOpen(true);
    };



    const toggleStarFilter = (star: string) => {
        if (star === 'all') {
            setSelectedStars(['all']);
        } else {
            setSelectedStars(prev => {
                const withoutAll = prev.filter(s => s !== 'all');
                if (withoutAll.includes(star)) {
                    const next = withoutAll.filter(s => s !== star);
                    return next.length === 0 ? ['all'] : next;
                } else {
                    return [...withoutAll, star];
                }
            });
        }
    };

    const toggleMealPlanFilter = (plan: string) => {
        if (plan === 'all') {
            setSelectedMealPlans(['all']);
        } else {
            setSelectedMealPlans(prev => {
                const withoutAll = prev.filter(p => p !== 'all');
                if (withoutAll.includes(plan)) {
                    const next = withoutAll.filter(p => p !== plan);
                    return next.length === 0 ? ['all'] : next;
                } else {
                    return [...withoutAll, plan];
                }
            });
        }
    };

    const handleQuickFilter = (type: string) => {
        if (type === 'last-minute') {
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);
            setCheckIn(today.toISOString().split('T')[0]);
            setCheckOut(nextWeek.toISOString().split('T')[0]);
            setNights(7);
        }
    };

    const formatRoomConfigLabel = (alloc: any, idx: number) => {
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

    const renderStars = (count: number) => {
        const goldOld = 'var(--accent)'; // Old gold color
        return (
            <div className="star-rating-filter">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star
                        key={i}
                        size={12}
                        fill={i <= count ? goldOld : 'transparent'}
                        color={goldOld}
                        style={{ marginRight: '1px' }}
                    />
                ))}
            </div>
        );
    };

    const renderStarsMini = (count: number) => {
        const brandPurple = '#8E24AC';
        if (count === 0) return <span style={{ fontSize: '10px' }}>Bez kategorije</span>;
        return (
            <div className="star-row-mini">
                {[...Array(count)].map((_, i) => (
                    <Star key={i} size={10} fill={brandPurple} color={brandPurple} />
                ))}
            </div>
        );
    };

    return (
        <div className="smart-search-container-v2">
            {/* Booking Modal & Success Modal are now handled in the portal at the bottom for reliable stacking */}
            {/* Moved to portal */}

            {/* Booking Error Alert */}
            {bookingAlertError && (
                <div className="booking-status-alert error-alert">
                    <div className="alert-icon"><XCircle size={32} /></div>
                    <div className="alert-content">
                        <h4>Greška pri rezervaciji</h4>
                        <p>{bookingAlertError}</p>
                    </div>
                    <button className="close-alert" onClick={() => setBookingAlertError(null)}><X size={20} /></button>
                </div>
            )}



            {/* TAB NAVIGATION */}
            <div className="tabs-nav-container">
                {
                    tabs.map(tab => (
                        <a
                            key={tab.id}
                            href={`/smart-search?tab=${tab.id}`}
                            className={`nav-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                setActiveTab(tab.id);
                            }}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </a>
                    ))
                }
            </div>

            {/* CONDITIONAL RENDER: SMESHTAJ vs LETOVI vs PAKETI */}
            {activeTab === 'package' ? (
                <div className="package-builder-inline animate-fade-in" style={{ marginTop: '2rem' }}>
                    <PackageSearch
                        initialDestinations={selectedDestinations}
                        initialCheckIn={checkIn}
                        initialCheckOut={checkOut}
                        initialTravelers={roomAllocations}
                    />
                </div>
            ) : activeTab === 'flight' ? (
                <div className="flight-search-inline animate-fade-in" style={{ marginTop: '2rem' }}>
                    <FlightSearch isInline={true} />
                </div>
            ) : activeTab === 'ski' ? (
                <div className="ski-search-wrapper animate-fade-in" style={{ marginTop: '2rem' }}>
                    <div className="search-card-frame" style={{ textAlign: 'center', padding: '60px' }}>
                        <Mountain size={48} color="var(--accent)" style={{ marginBottom: '20px', opacity: 0.5 }} />
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>SKI SEARCH - COMING SOON</h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Uskoro: Najbolje ski ponude, ski pass i oprema na jednom mestu.</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="search-layout-container" style={{ width: '100%', maxWidth: '1550px', margin: '0 auto' }}>
                        <main className={`search-main-content ${searchPerformed ? 'results-active' : ''}`}>

                            {/* MODE SELECTOR WITH TOGGLE */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px', gap: '15px' }}>
                                <button
                                    onClick={() => setShowModes(!showModes)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: 'var(--glass-bg)',
                                        border: 'var(--border-thin)',
                                        color: 'var(--text-secondary)',
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        letterSpacing: '1px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        backdropFilter: 'blur(10px)',
                                    }}
                                    className="mode-visibility-toggle"
                                >
                                    {showModes ? <Zap size={10} style={{ color: 'var(--accent)' }} /> : <Sparkles size={10} style={{ color: 'var(--accent)' }} />}
                                    {showModes ? 'SAKRIJ MODOVE PRETRAGE' : 'PROMENI MOD PRETRAGE'}
                                </button>

                                {showModes && (
                                    <div className="mode-toggle-group animate-fade-in-up" style={{
                                        display: 'flex',
                                        background: 'var(--bg-card)',
                                        padding: '5px',
                                        borderRadius: '30px',
                                        border: 'var(--border-thin)',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: 'var(--shadow-lg)'
                                    }}>
                                        <button
                                            className={`mode-switch-btn ${searchMode === 'classic' ? 'active' : ''}`}
                                            onClick={() => { setSearchMode('classic'); setShowModes(false); }}
                                            style={{
                                                padding: '10px 24px',
                                                borderRadius: '25px',
                                                border: 'none',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s',
                                                background: searchMode === 'classic' ? 'var(--accent)' : 'transparent',
                                                color: searchMode === 'classic' ? '#fff' : 'var(--text-secondary)'
                                            }}
                                        >
                                            <LayoutTemplate size={14} /> Klasična
                                        </button>
                                        <button
                                            className={`mode-switch-btn ${searchMode === 'narrative' ? 'active' : ''}`}
                                            onClick={() => { setSearchMode('narrative'); setShowModes(false); }}
                                            style={{
                                                padding: '10px 24px',
                                                borderRadius: '25px',
                                                border: 'none',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s',
                                                background: searchMode === 'narrative' ? 'var(--accent)' : 'transparent',
                                                color: searchMode === 'narrative' ? '#fff' : 'rgba(255,255,255,0.5)'
                                            }}
                                        >
                                            <Sparkles size={14} /> Futuristička
                                        </button>
                                        <button
                                            className={`mode-switch-btn ${searchMode === 'immersive' ? 'active' : ''}`}
                                            onClick={() => { setSearchMode('immersive'); setShowModes(false); }}
                                            style={{
                                                padding: '10px 24px',
                                                borderRadius: '25px',
                                                border: 'none',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s',
                                                background: searchMode === 'immersive' ? 'var(--accent)' : 'transparent',
                                                color: searchMode === 'immersive' ? '#fff' : 'var(--text-secondary)'
                                            }}
                                        >
                                            <Zap size={14} /> Immersive
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* IMMERSIVE SEARCH UI */}
                            {searchMode === 'immersive' && !searchPerformed && (
                                <ImmersiveSearch
                                    onPartialUpdate={handleImmersiveUpdate}
                                    onSearch={(data: ImmersiveSearchData) => {
                                        // Map immersive data to standard format and trigger search
                                        const cin = new Date(data.checkIn);
                                        const cout = new Date(data.checkOut);
                                        const nights = Math.ceil((cout.getTime() - cin.getTime()) / (1000 * 60 * 60 * 24)) || 7;

                                        // Sync filters and budget from ImmersiveSearch to SmartSearch states
                                        if (data.categories && data.categories.length > 0) {
                                            setSelectedStars(data.categories);
                                        }
                                        if (data.services && data.services.length > 0) {
                                            setSelectedMealPlans(data.services);
                                        }
                                        if (data.budget) {
                                            setBudgetFrom(data.budget.from?.toString() || '');
                                            setBudgetTo(data.budget.to?.toString() || '');
                                        }

                                        const mappedData: BasicInfoData = {
                                            destinations: data.destinations.map((d: any) => ({
                                                id: d.id,
                                                city: d.name,
                                                country: d.country_name || 'Unknown',
                                                countryCode: d.country_code || 'XX',
                                                airportCode: 'BEG',
                                                checkIn: data.checkIn,
                                                checkOut: data.checkOut,
                                                nights: nights,
                                                travelers: {
                                                    adults: data.adults,
                                                    children: data.children,
                                                    childrenAges: data.childrenAges
                                                },
                                                roomAllocations: data.roomAllocations,
                                                type: d.type
                                            })),
                                            startDate: data.checkIn,
                                            endDate: data.checkOut,
                                            totalDays: nights,
                                            currency: 'EUR',
                                            travelers: {
                                                adults: data.adults,
                                                children: data.children,
                                                childrenAges: data.childrenAges
                                            },
                                            roomAllocations: data.roomAllocations
                                        };
                                        const updates = handleNarrativeUpdate(mappedData);
                                        handleSearch({
                                            destinations: updates.destinations,
                                            checkIn: updates.checkIn,
                                            checkOut: updates.checkOut,
                                            allocations: updates.allocations
                                        });
                                    }}
                                />
                            )}

                            {/* NARRATIVE SEARCH UI */}
                            {searchMode === 'narrative' && !searchPerformed && (
                                <div className="narrative-mode-container" style={{ padding: '0 2rem 2rem 2rem' }}>
                                    <NarrativeSearch
                                        basicInfo={getInitialNarrativeData()}
                                        onUpdate={(data: any) => handleNarrativeUpdate(data)}
                                        onNext={(data: any) => {
                                            const updates = handleNarrativeUpdate(data);
                                            handleSearch({
                                                destinations: updates.destinations,
                                                checkIn: updates.checkIn,
                                                checkOut: updates.checkOut,
                                                allocations: updates.allocations
                                            });
                                        }}
                                    />
                                    {isSearching && (
                                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                                            <Loader2 className="spin-slow" size={40} color="#8E24AC" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* IMMERSIVE SEARCH LOADER */}
                            {searchMode === 'immersive' && isSearching && !searchPerformed && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                                    <Loader2 className="spin-slow" size={40} color="#8E24AC" />
                                </div>
                            )}

                            {/* CLASSIC SEARCH UI */}
                            {searchMode === 'classic' && (
                                <div className="search-card-frame">

                                    {/* ROW 1: DESTINATION */}
                                    < div className="destination-row" >
                                        <div className="field-label"><MapPin size={14} /> Destinacija ili Smeštaj (do 3)</div>
                                        <div className="destination-input-wrapper" ref={autocompleteRef}>
                                            <div className="multi-destination-input premium">
                                                {selectedDestinations.map(dest => (
                                                    <div key={dest.id} className="destination-chip">
                                                        {dest.type === 'hotel' ? <Hotel size={14} /> : <MapPin size={14} />}
                                                        <span>{dest.name}</span>
                                                        <button className="chip-remove" onClick={() => setSelectedDestinations(selectedDestinations.filter(d => d.id !== dest.id))}><X size={14} /></button>
                                                    </div>
                                                ))}
                                                {selectedDestinations.length < 3 && (
                                                    <input
                                                        ref={inputRef}
                                                        type="text"
                                                        placeholder={selectedDestinations.length === 0 ? "npr. Golden Sands, Hotel Park..." : "Dodaj još..."}
                                                        value={destinationInput}
                                                        onChange={(e) => setDestinationInput(e.target.value)}
                                                        className="smart-input-inline"
                                                        onFocus={() => { if (destinationInput.length >= 2) setShowSuggestions(true); }}
                                                    />
                                                )}
                                            </div>
                                            {/* Suggestions Dropdown */}
                                            {showSuggestions && suggestions.length > 0 && (
                                                <div className="autocomplete-dropdown premium">
                                                    {suggestions.map(s => (
                                                        <div key={s.id} className="suggestion-item" onClick={() => handleAddDestination(s)}>
                                                            {s.type === 'hotel' ? <Hotel size={16} className="suggestion-icon hotel" /> : <MapPin size={16} className="suggestion-icon destination" />}
                                                            <div className="suggestion-content">
                                                                <span className="suggestion-name">{s.name}</span>
                                                                <span className="suggestion-meta">
                                                                    {s.type === 'hotel' ? (s.stars ? `${s.stars}★ ${s.provider}` : s.provider) : s.country}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ROW 2: PARAMETERS GRID */}
                                    < div className="params-grid" >
                                        {/* Check In */}
                                        < div className="col-checkin param-item" >
                                            <div className="field-label"><CalendarIcon size={14} /> Check-in</div>
                                            <div className="input-box" onClick={() => setActiveCalendar('in')} style={{ cursor: 'pointer' }}>
                                                {checkIn ? formatDate(checkIn) : <span style={{ color: '#64748b' }}>mm/dd/yyyy</span>}
                                            </div>
                                        </div >

                                        {/* Check Out */}
                                        < div className="col-checkout param-item" >
                                            <div className="field-label"><CalendarIcon size={14} /> Check-out</div>
                                            <div className="input-box" onClick={() => setActiveCalendar('out')} style={{ cursor: 'pointer' }}>
                                                {checkOut ? formatDate(checkOut) : <span style={{ color: '#64748b' }}>mm/dd/yyyy</span>}
                                            </div>
                                        </div >

                                        {/* Flexibility */}
                                        < div className="col-flex param-item" >
                                            <div className="field-label"><ArrowDownWideNarrow size={14} /> Fleksibilnost</div>
                                            <div className="flex-toggle-group">
                                                {[0, 1, 3, 5].map(day => (
                                                    <button
                                                        key={day}
                                                        className={`flex-btn ${flexibleDays === day ? 'active' : ''}`}
                                                        onClick={() => setFlexibleDays(day)}
                                                    >
                                                        {day === 0 ? 'Tačno' : `±${day}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div >

                                        {/* Category Selector */}
                                        <div className="col-stars param-item" style={{ position: 'relative' }}>
                                            <div className="field-label"><Star size={14} /> Odaberi Kategoriju</div>
                                            <div className="input-box" onClick={() => setShowStarPicker(!showStarPicker)} style={{ cursor: 'pointer' }}>
                                                <span style={{ fontSize: '0.85rem' }}>
                                                    {selectedStars.includes('all') ? 'Sve kategorije' : (selectedStars.length === 1 ? CATEGORY_OPTIONS.find(o => o.value === selectedStars[0])?.label : selectedStars.filter(s => s !== 'all').sort().join(', '))}
                                                </span>
                                                <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                            </div>
                                            {showStarPicker && (
                                                <div className="vertical-filters-popover animate-fade-in-up">
                                                    <div className="vertical-filter-group">
                                                        <button className={`v-filter-btn ${selectedStars.includes('all') ? 'active' : ''}`} onClick={() => { toggleStarFilter('all'); setShowStarPicker(false); }}>Sve</button>
                                                        {[5, 4, 3, 2, 0].map(s => (
                                                            <button key={s} className={`v-filter-btn ${selectedStars.includes(s.toString()) ? 'active' : ''}`} onClick={() => toggleStarFilter(s.toString())}>
                                                                {renderStarsMini(s)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '10px', marginTop: '10px' }}>
                                                        <button className="v-filter-btn active" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowStarPicker(false)}>Zatvori</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Meal Selector */}
                                        <div className="col-meals param-item" style={{ position: 'relative' }}>
                                            <div className="field-label"><UtensilsCrossed size={14} /> Odaberi Uslugu</div>
                                            <div className="input-box" onClick={() => setShowMealPicker(!showMealPicker)} style={{ cursor: 'pointer' }}>
                                                <span style={{ fontSize: '0.85rem' }}>
                                                    {selectedMealPlans.includes('all') ? 'Sve usluge' : (selectedMealPlans.length === 1 ? MEAL_PLAN_OPTIONS.find(o => o.value === selectedMealPlans[0])?.label : selectedMealPlans.filter(p => p !== 'all').join(', '))}
                                                </span>
                                                <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                            </div>
                                            {showMealPicker && (
                                                <div className="vertical-filters-popover animate-fade-in-up">
                                                    <div className="vertical-filter-group">
                                                        <button className={`v-filter-btn ${selectedMealPlans.includes('all') ? 'active' : ''}`} onClick={() => { toggleMealPlanFilter('all'); setShowMealPicker(false); }}>Sve usluge</button>
                                                        {[
                                                            { id: 'RO', label: 'Na - Najam' },
                                                            { id: 'BB', label: 'ND - Doručak' },
                                                            { id: 'HB', label: 'HB - Polupansion' },
                                                            { id: 'FB', label: 'FB - Pun pansion' },
                                                            { id: 'AI', label: 'All - All Inclusive' },
                                                            { id: 'UAI', label: 'UAll - Ultra Inclusive' }
                                                        ].map(mp => (
                                                            <button key={mp.id} className={`v-filter-btn ${selectedMealPlans.includes(mp.id) ? 'active' : ''}`} onClick={() => toggleMealPlanFilter(mp.id)}>
                                                                {mp.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '10px', marginTop: '10px' }}>
                                                        <button className="v-filter-btn active" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowMealPicker(false)}>Zatvori</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-nationality" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {/* Nationality Selector */}
                                            <div className="param-item" style={{ position: 'relative' }}>
                                                <div className="field-label"><Globe size={14} /> NACIONALNOST</div>
                                                <div className="input-box" onClick={() => setShowNationalityPicker(!showNationalityPicker)} style={{ cursor: 'pointer' }}>
                                                    <span style={{ fontSize: '0.85rem' }}>
                                                        {NATIONALITY_OPTIONS.find(n => n.code === nationality)?.name || 'Odaberi državu'}
                                                    </span>
                                                    <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                                </div>
                                                {showNationalityPicker && (
                                                    <div className="vertical-filters-popover animate-fade-in-up">
                                                        <div className="vertical-filter-group" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
                                                            {NATIONALITY_OPTIONS.map(n => (
                                                                <button
                                                                    key={n.code}
                                                                    className={`v-filter-btn ${nationality === n.code ? 'active' : ''}`}
                                                                    onClick={() => {
                                                                        setNationality(n.code);
                                                                        setShowNationalityPicker(false);
                                                                    }}
                                                                >
                                                                    {n.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Budget Filter */}
                                            <div className="param-item">
                                                <div className="field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <DollarSign size={14} /> BUDŽET
                                                    </div>
                                                    <BudgetTypeToggle
                                                        type={budgetType}
                                                        onChange={setBudgetType}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                                    <input
                                                        type="number"
                                                        placeholder="Od"
                                                        value={budgetFrom}
                                                        onChange={(e) => setBudgetFrom(e.target.value)}
                                                        className="budget-input"
                                                        style={{
                                                            flex: 1,
                                                            borderRadius: '12px',
                                                            padding: '12px',
                                                            background: 'rgba(255,255,255,0.05)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            color: '#fff',
                                                            fontSize: '0.85rem',
                                                            outline: 'none',
                                                            width: '100%'
                                                        }}
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Do"
                                                        value={budgetTo}
                                                        onChange={(e) => setBudgetTo(e.target.value)}
                                                        className="budget-input"
                                                        style={{
                                                            flex: 1,
                                                            borderRadius: '12px',
                                                            padding: '12px',
                                                            background: 'rgba(255,255,255,0.05)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            color: '#fff',
                                                            fontSize: '0.85rem',
                                                            outline: 'none',
                                                            width: '100%'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Room Tabs & Pax Configuration */}
                                        <div className="col-rooms-tabs">
                                            <div className="room-tabs-header" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                                                {roomAllocations.map((room, idx) => (
                                                    <button
                                                        key={idx}
                                                        className={`room-tab-btn ${activeRoomTab === idx ? 'active' : ''} ${room.adults > 0 ? 'is-searching' : 'inactive'}`}
                                                        onClick={() => {
                                                            if (activeRoomTab === idx && idx !== 0) {
                                                                // Reset room if clicked while active (except for Room 1)
                                                                const newAlloc = [...roomAllocations];
                                                                newAlloc[idx] = { adults: 0, children: 0, childrenAges: [] };
                                                                setRoomAllocations(newAlloc);
                                                            } else {
                                                                setActiveRoomTab(idx);
                                                            }
                                                        }}
                                                    >
                                                        <div className={`status-dot ${room.adults > 0 ? 'enabled' : ''}`}></div>
                                                        Soba {idx + 1}
                                                        {room.adults > 0 && <span className="tab-pax-hint">{room.adults}+{room.children}</span>}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="active-room-config full-width animate-fade-in" key={activeRoomTab}>
                                                <div className="passenger-row-redesign-v2">
                                                    {/* Adults */}
                                                    <div className="flight-counter-group-v2">
                                                        <span className="counter-label">Odrasli</span>
                                                        <div className="counter-controls-v2">
                                                            <button
                                                                onClick={() => {
                                                                    const newAlloc = [...roomAllocations];
                                                                    newAlloc[activeRoomTab].adults = Math.max(1, newAlloc[activeRoomTab].adults - 1);
                                                                    setRoomAllocations(newAlloc);
                                                                }}
                                                            >−</button>
                                                            <span className="flight-counter-val">{roomAllocations[activeRoomTab].adults}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const newAlloc = [...roomAllocations];
                                                                    newAlloc[activeRoomTab].adults = Math.min(10, newAlloc[activeRoomTab].adults + 1);
                                                                    setRoomAllocations(newAlloc);
                                                                }}
                                                            >+</button>
                                                        </div>
                                                    </div>

                                                    {/* Children */}
                                                    <div className="flight-counter-group-v2">
                                                        <span className="counter-label">Deca</span>
                                                        <div className="counter-controls-v2">
                                                            <button
                                                                onClick={() => {
                                                                    const newAlloc = [...roomAllocations];
                                                                    if (newAlloc[activeRoomTab].children > 0) {
                                                                        newAlloc[activeRoomTab].children -= 1;
                                                                        newAlloc[activeRoomTab].childrenAges.pop();
                                                                        setRoomAllocations(newAlloc);
                                                                    }
                                                                }}
                                                            >−</button>
                                                            <span className="flight-counter-val">{roomAllocations[activeRoomTab].children}</span>
                                                            <button
                                                                onClick={() => {
                                                                    if (roomAllocations[activeRoomTab].children < 4) {
                                                                        const newAlloc = [...roomAllocations];
                                                                        newAlloc[activeRoomTab].children += 1;
                                                                        newAlloc[activeRoomTab].childrenAges.push(0);
                                                                        setRoomAllocations(newAlloc);
                                                                    }
                                                                }}
                                                            >+</button>
                                                        </div>
                                                    </div>

                                                    {/* Children Ages In Line */}
                                                    {roomAllocations[activeRoomTab].children > 0 && (
                                                        <div className="children-ages-row-v2">
                                                            {roomAllocations[activeRoomTab].childrenAges.map((age, idx) => (
                                                                <div key={idx} className="age-input-v2">
                                                                    <input
                                                                        type="number"
                                                                        min="0" max="17"
                                                                        value={age || ''}
                                                                        placeholder={`Dete ${idx + 1}`}
                                                                        onChange={e => {
                                                                            const val = e.target.value;
                                                                            const newAlloc = [...roomAllocations];
                                                                            newAlloc[activeRoomTab].childrenAges[idx] = val === '' ? ('' as any) : Math.min(17, Math.max(0, parseInt(val)));
                                                                            setRoomAllocations(newAlloc);
                                                                        }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div >
                                    </div>

                                    {/* SEARCH BUTTONS ROW */}
                                    <div className="action-row-container" style={{ display: 'flex', gap: '20px', alignItems: 'center', width: '100%', marginTop: '10px' }}>
                                        <button className="btn-search-main" onClick={() => handleSearch()} disabled={isSearching} style={{ flex: '2', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ opacity: isSearching ? 0.2 : 1, transition: 'all 0.3s ease' }}>
                                                <ClickToTravelLogo height={65} iconOnly={true} iconScale={4.4} forceOutline={true} />
                                            </div>
                                            {isSearching && (
                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Loader2 className="spin" size={32} color="#fff" />
                                                </div>
                                            )}
                                        </button>

                                        <button className="btn-new-search-tag" onClick={() => { setSearchPerformed(false); setSearchResults([]); setSearchError(null); }}>
                                            <Plus size={16} />
                                            <span>POKRENI NOVU PRETRAGU</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* FLEXIBLE DATES RIBBON */}
                            {
                                searchPerformed && flexibleDays > 0 && (
                                    <div className="flexible-dates-ribbon-container animate-fade-in" style={{ marginBottom: '2rem' }}>
                                        <div className="ribbon-header-v4">
                                            <div className="header-left-v4">
                                                <CalendarDays size={20} className="glow-icon" />
                                                <div className="header-text-v4">
                                                    <span className="title-v4">Fleksibilni datumi (±{flexibleDays} dana)</span>
                                                    <span className="sub-v4">Odaberite datum za promenu pretrage</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flexible-dates-strip">
                                            {generateFlexDates(selectedArrivalDate || checkIn, flexibleDays).map((dateStr) => {
                                                const dateObj = new Date(dateStr);
                                                const isActive = dateStr === checkIn;
                                                const dayName = dateObj.toLocaleDateString('sr-Latn-RS', { weekday: 'short' });
                                                const dayNum = dateObj.getDate();
                                                const monthName = dateObj.toLocaleDateString('sr-Latn-RS', { month: 'short' });

                                                return (
                                                    <div
                                                        key={dateStr}
                                                        className={`flex-date-tile-premium ${isActive ? 'active' : ''}`}
                                                        onClick={() => {
                                                            if (!isActive) {
                                                                setCheckIn(dateStr);
                                                                const newOut = new Date(dateStr);
                                                                newOut.setDate(newOut.getDate() + nights);
                                                                const newOutStr = newOut.toISOString().split('T')[0];
                                                                setCheckOut(newOutStr);
                                                                handleSearch({ checkIn: dateStr, checkOut: newOutStr });
                                                            }
                                                        }}
                                                    >
                                                        <span className="flex-day-name">{dayName}</span>
                                                        <span className="flex-day-num">{dayNum}</span>
                                                        <span className="flex-month">{monthName}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )
                            }

                            {/* SMART SUGGESTIONS SECTION */}
                            {
                                (smartSuggestions || isSearchingSuggestions) && (
                                    <div className="smart-suggestions-box animate-fade-in">
                                        <div className="ss-header">
                                            <Sparkles size={18} className="ss-icon" />
                                            <h3>{isSearchingSuggestions ? 'Analiziramo alternativne termine...' : 'Olympic Smart Predlog'}</h3>
                                        </div>
                                        {isSearchingSuggestions ? (
                                            <div className="ss-loading">
                                                <Loader2 size={24} className="spin" />
                                                <p>Proveravamo dostupnost u opsegu od +/- 5 dana...</p>
                                            </div>
                                        ) : (
                                            <div className="ss-body">
                                                <div className="ss-message">
                                                    <CheckCircle2 size={16} color="#10b981" />
                                                    <span>{smartSuggestions?.message}</span>
                                                </div>

                                                {/* Availability Heatmap Timeline */}
                                                <div className="ss-availability-heatmap">
                                                    <div className="heatmap-label"><Calendar size={12} /> Uporedni prikaz dostupnosti:</div>
                                                    <div className="heatmap-grid">
                                                        {Object.entries(availabilityTimeline)
                                                            .sort((a, b) => a[0].localeCompare(b[0]))
                                                            .map(([date, status]) => (
                                                                <div
                                                                    key={date}
                                                                    className={`heatmap-day ${status.available ? 'available' : 'stop-sale'} ${date === checkIn ? 'requested' : ''}`}
                                                                    onClick={() => {
                                                                        if (status.available) {
                                                                            setCheckIn(date);
                                                                            const newOut = new Date(date);
                                                                            newOut.setDate(newOut.getDate() + nights);
                                                                            const newOutStr = newOut.toISOString().split('T')[0];
                                                                            setCheckOut(newOutStr);
                                                                            handleSearch({ checkIn: date, checkOut: newOutStr });
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className="h-day-name">{new Date(date).toLocaleDateString('sr-RS', { weekday: 'short' })}</div>
                                                                    <div className="h-day-num">{new Date(date).getDate()}</div>
                                                                    <div className="h-status-icon">
                                                                        {status.available ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                                                    </div>
                                                                    {status.price && <div className="h-price">{status.price}€</div>}
                                                                    {status.isCheapest && <div className="h-cheapest-badge">Najbolja cena</div>}
                                                                    {date === checkIn && <div className="h-requested-tag">Traženo</div>}
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                                <div className="ss-results-mini">
                                                    {smartSuggestions?.data.slice(0, 3).map(hotel => {
                                                        // Real CRM logic: If hotel has > 5 reservations in last 30 days, it's a Best Seller
                                                        const isBestSeller = (hotel.salesCount || 0) > 5;
                                                        return (
                                                            <div key={hotel.id} className={`ss-result-item ${isBestSeller ? 'best-seller' : ''}`}>
                                                                <div className="ss-res-info">
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <strong>{hotel.name}</strong>
                                                                        {isBestSeller && (
                                                                            <span className="best-seller-mini-badge" title={`Preko ${hotel.salesCount} rezervacija u poslednjih 30 dana`}>
                                                                                <TrendingUp size={10} /> BEST SELLER
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span>{hotel.location} • {hotel.stars}★</span>
                                                                </div>
                                                                <div className="ss-res-price">
                                                                    <span className="p-sm">od</span>
                                                                    <span className="p-val">{formatPrice(getFinalDisplayPrice(hotel))} €</span>
                                                                    <button className="ss-apply-btn" onClick={() => {
                                                                        // Re-run search with these specific dates
                                                                        // Find date in timeline that matches this price if possible or just use the firstAvailableDate
                                                                        if (smartSuggestions.type === 'flexible_dates') {
                                                                            // We apply the date and trigger search
                                                                        }
                                                                    }}>
                                                                        Izaberi
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {smartSuggestions && smartSuggestions.data.length > 3 && (
                                                        <div className="ss-more">I još {smartSuggestions.data.length - 3} sličnih ponuda...</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            {/* ERROR ALERT */}
                            {
                                searchError && (
                                    <div className="search-error animate-fade-in" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Info size={18} />
                                            <span>{searchError}</span>
                                        </div>
                                        <button
                                            className="new-search-pill"
                                            onClick={() => {
                                                setSearchMode('immersive');
                                                setSearchPerformed(false);
                                                setSearchResults([]);
                                                setSearchError(null);
                                                setSmartSuggestions(null);
                                            }}
                                        >
                                            <Sparkles size={14} /> POKRENI NOVU PRETRAGU
                                        </button>
                                    </div>
                                )
                            }

                            {/* RESULTS SECTION (EXISTING LOGIC) */}


                            {
                                searchPerformed && (
                                    <div className="content-workflow animate-fade-in" style={{ marginTop: '3rem' }}>
                                        {/* Force Single Row Toolbar */}
                                        <div className="filters-toolbar-v4 premium" style={{ display: 'flex', flexWrap: 'nowrap', gap: '16px', alignItems: 'center', background: 'var(--glass-bg)', border: 'var(--border-thin)', borderRadius: '20px', padding: '1.25rem 2rem' }}>
                                            <div className="name-filter-wrapper" style={{ flex: 1.5, minWidth: '0' }}>
                                                <Search size={14} className="filter-icon" style={{ color: 'var(--text-secondary)' }} />
                                                <input
                                                    type="text"
                                                    className="smart-input premium"
                                                    style={{ width: '100%', paddingLeft: '40px', height: '48px', background: 'var(--bg-input)', border: 'var(--border-thin)', color: 'var(--text-primary)', borderRadius: '12px' }}
                                                    placeholder="Traži po hotelu ili destinaciji..."
                                                    value={hotelNameFilter}
                                                    onChange={(e) => setHotelNameFilter(e.target.value)}
                                                />
                                            </div>
                                            <div style={{ flex: 1, minWidth: '0' }}>
                                                <MultiSelectDropdown options={CATEGORY_OPTIONS} selected={selectedStars} onChange={setSelectedStars} placeholder="Kategorija" />
                                            </div>
                                            <div style={{ flex: 1, minWidth: '0' }}>
                                                <MultiSelectDropdown options={MEAL_PLAN_OPTIONS} selected={selectedMealPlans} onChange={setSelectedMealPlans} placeholder="Usluga" />
                                            </div>
                                            <div className="view-mode-switcher" style={{ flexShrink: 0, background: 'var(--bg-input)', border: 'var(--border-thin)', borderRadius: '12px', padding: '4px' }}>
                                                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid"><LayoutGrid size={18} /></button>
                                                <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List"><ListIcon size={18} /></button>
                                                <button className={`view-btn ${viewMode === 'notepad' ? 'active' : ''}`} onClick={() => setViewMode('notepad')} title="Notepad"><AlignLeft size={18} /></button>
                                            </div>
                                        </div>

                                        <div className="results-summary-bar-v4 premium" style={{ background: 'var(--glass-bg)', border: 'var(--border-thin)', borderRadius: '12px', padding: '0.35rem 1.25rem', marginBottom: '0.75rem' }}>
                                            <div className="summary-info" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>REZULTATA: <strong style={{ color: 'var(--accent)', fontSize: '1.2rem', marginLeft: '6px' }}>{filteredResults.length}</strong></span>
                                                <button
                                                    className="new-search-pill"
                                                    onClick={() => {
                                                        setSearchMode('immersive');
                                                        setSearchPerformed(false);
                                                        setSearchResults([]);
                                                        setSearchError(null);
                                                        setSmartSuggestions(null);
                                                    }}
                                                    style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                                                >
                                                    <Sparkles size={14} /> POKRENI NOVU PRETRAGU
                                                </button>
                                            </div>
                                            <div className="sort-actions" style={{ background: 'var(--bg-input)', border: 'var(--border-thin)', borderRadius: '12px', padding: '4px' }}>
                                                <button className={`view-btn ${sortBy === 'smart' ? 'active' : ''}`} onClick={() => setSortBy('smart')} style={{ background: sortBy === 'smart' ? 'var(--accent)' : 'transparent', color: sortBy === 'smart' ? 'white' : 'var(--text-secondary)' }}>Smart</button>
                                                <button
                                                    className={`view-btn ${sortBy.startsWith('price') ? 'active' : ''}`}
                                                    onClick={() => setSortBy(sortBy === 'price_low' ? 'price_high' : 'price_low')}
                                                    style={{ background: sortBy.startsWith('price') ? 'var(--accent)' : 'transparent', color: sortBy.startsWith('price') ? 'white' : 'var(--text-secondary)' }}
                                                >
                                                    Cena {sortBy === 'price_low' ? '↑' : sortBy === 'price_high' ? '↓' : '↕'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className={`results-container ${viewMode}-view`} style={{ width: '100%' }}>
                                            {viewMode === 'notepad' ? (
                                                <div className="notepad-view-v6 animate-fade-in" style={{ padding: '0', width: '100%' }}>
                                                    {filteredResults.map((hotel, hIdx) => (
                                                        <div key={`${hotel.provider}-${hotel.id}-${hIdx}`} className="hotel-notepad-card-premium">
                                                            {/* Header matching screenshot top row */}
                                                            <div className="notepad-header-v6">
                                                                <div className="notepad-title-stacked">
                                                                    <div className="notepad-main-title">
                                                                        <h3 onClick={() => navigate('/hotel-view/' + hotel.id)} style={{ cursor: 'pointer' }}>{hotel.name}</h3>
                                                                        <div className="hotel-stars-badge-v6">
                                                                            {Array(Math.max(0, Math.min(5, Math.floor(Number(hotel.stars || 0)) || 0))).fill(0).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="hotel-location-tag-v6">
                                                                        <MapPin size={14} /> <span>{hotel.location}</span>
                                                                        <span className="dot-separator">•</span>
                                                                        <span>{hotel.mealPlan || 'Sve usluge'}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="notepad-header-price">
                                                                    <span className="label">UKUPNA CENA OD</span>
                                                                    <span className="val">{formatPrice(getFinalDisplayPrice(hotel))} EUR</span>
                                                                </div>
                                                            </div>

                                                            {/* Configuration/Date headers */}
                                                            {roomAllocations.map((alloc, roomIdx) => {
                                                                if (alloc.adults === 0) return null;

                                                                const allRooms = (hotel.allocationResults && hotel.allocationResults[roomIdx] ? [...hotel.allocationResults[roomIdx]].sort((a, b) => (a.price || 0) - (b.price || 0)) : (hotel.rooms || [hotel]));
                                                                const activeMealFilter = notepadMealFilters[hotel.id] || 'all';
                                                                const filteredRooms = allRooms.filter(r => activeMealFilter === 'all' || (r.mealPlan || hotel.mealPlan) === activeMealFilter);

                                                                return (
                                                                    <div key={`alloc-${roomIdx}`} className="notepad-allocation-segment">
                                                                        <div className="notepad-sub-header-v6">
                                                                            <div className="notepad-date-info">
                                                                                <CalendarDays size={18} />
                                                                                <span>{checkIn ? new Date(checkIn).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</span>
                                                                                <ArrowRight size={14} style={{ opacity: 0.5 }} />
                                                                                <span>{checkOut ? new Date(checkOut).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</span>
                                                                                <span className="nights-badge">{nights} noćenja</span>
                                                                            </div>

                                                                            <div className="notepad-config-actions">
                                                                                {allRooms.length > 5 && (
                                                                                    <div className="notepad-mini-filter">
                                                                                        <Filter size={14} />
                                                                                        <select
                                                                                            value={activeMealFilter}
                                                                                            onChange={(e) => setNotepadMealFilters(prev => ({ ...prev, [hotel.id]: e.target.value }))}
                                                                                        >
                                                                                            <option value="all">Sve usluge</option>
                                                                                            {Array.from(new Set(allRooms.map(r => r.mealPlan || hotel.mealPlan))).filter(Boolean).map(mp => (
                                                                                                <option key={mp as string} value={mp as string}>{getMealPlanDisplayName(mp as string)}</option>
                                                                                            ))}
                                                                                        </select>
                                                                                    </div>
                                                                                )}
                                                                                <div className="notepad-config-pill">
                                                                                    {formatRoomConfigLabel(alloc, roomIdx)}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="notepad-ledger-header">
                                                                            <div style={{ paddingLeft: '20px' }}>TIP SMEŠTAJA</div>
                                                                            <div style={{ textAlign: 'center' }}>USLUGA</div>
                                                                            <div style={{ textAlign: 'center' }}>KAPACITET</div>
                                                                            <div style={{ textAlign: 'right', paddingRight: '20px' }}>CENA & AKCIJA</div>
                                                                        </div>

                                                                        <div className="notepad-room-list">
                                                                            {filteredRooms.length > 0 ? (
                                                                                filteredRooms.map((room, rIdx) => (
                                                                                    <div key={`room-${room.id}-${rIdx}`} className="notepad-ledger-row">
                                                                                        <div className="ledger-room-name">
                                                                                            {cleanRoomName(room.name || 'Standardna Soba')}
                                                                                        </div>
                                                                                        <div className="ledger-meal">
                                                                                            {renderMealPlanBadge(room.mealPlan || hotel.mealPlan, true)}
                                                                                        </div>
                                                                                        <div className="ledger-capacity">
                                                                                            <Users size={16} />
                                                                                            <span>{room.capacity || `${alloc.adults}+${alloc.children}`}</span>
                                                                                        </div>
                                                                                        <div className="ledger-action-zone">
                                                                                            <div className="ledger-status-price">
                                                                                                {renderAvailabilityStatus(room.availability || hotel.availability)}
                                                                                                <div className="ledger-price">
                                                                                                    {formatPrice(isSubagent ? getPriceWithMargin(room.price) : Number(room.price))} <span className="curr">EUR</span>
                                                                                                </div>
                                                                                            </div>
                                                                                            <button
                                                                                                className="btn-ledger-reserve"
                                                                                                onClick={() => handleReserveClick(room, roomIdx, hotel)}
                                                                                            >
                                                                                                REZERVIŠI <ArrowRight size={14} />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
                                                                                    Nema dostupnih soba za izabranu uslugu.
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className={`results-mosaic ${viewMode === 'list' ? 'list-layout' : 'grid-layout'}`} style={{ width: '100%' }}>
                                                    {filteredResults.map((hotel, hIdx) => (
                                                        <div key={`${hotel.provider}-${hotel.id}-${hIdx}`} className={`hotel-result-card-premium unified ${hotel.provider.toLowerCase().replace(/\s+/g, '')} ${viewMode === 'list' ? 'horizontal' : ''}`}>
                                                            <div className="hotel-card-image" onClick={() => navigate('/hotel-view/' + hotel.id)}>
                                                                <img src={getProxiedImageUrl(hotel.images?.[0]) || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800"} alt="" />
                                                                {renderMealPlanBadge(hotel.mealPlan || '')}
                                                                {renderAvailabilityStatus(hotel.availability)}
                                                                <div className="hotel-stars-badge">
                                                                    {Array(Math.max(0, Math.min(5, Math.floor(Number(hotel.stars || 0)) || 0))).fill(0).map((_, i) => <Star key={i} size={12} fill="#ce93d8" color="#ce93d8" />)}
                                                                </div>
                                                            </div>
                                                            <div className="hotel-card-content">
                                                                <div className="hotel-info-text">
                                                                    <div className="hotel-title-row">
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/hotel-view/' + hotel.id)}>
                                                                            <h3 style={{ margin: 0 }}>{hotel.name}</h3>
                                                                            {(hotel.salesCount || 0) > 5 && (
                                                                                <span className="best-seller-premium-badge" title={`Preko ${hotel.salesCount} rezervacija u poslednjih 30 dana`}>
                                                                                    <TrendingUp size={10} /> BEST SELLER
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="hotel-location-tag"><MapPin size={14} /> <span>{hotel.location}</span></div>
                                                                        <div className="hotel-date-badge"><CalendarDays size={14} /> <span>{formatDate(checkIn)} - {formatDate(checkOut)} ({nights} noćenja)</span></div>
                                                                    </div>
                                                                </div>
                                                                <div className="price-action-section">
                                                                    <div className="lowest-price-tag">
                                                                        <span className="price-val">od {formatPrice(getFinalDisplayPrice(hotel))} €</span>
                                                                        {roomAllocations.filter(r => r.adults > 0).length > 1 && (
                                                                            <span className="price-label-multi"># Za {roomAllocations.reduce((sum, r) => sum + r.adults + r.children, 0)} osoba</span>
                                                                        )}
                                                                    </div>
                                                                    <button className="view-more-btn" onClick={() => setExpandedHotel(hotel)}>Detalji... <ArrowRight size={16} /></button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            }

                            {/* Calendars */}
                            {
                                activeCalendar && (
                                    <ModernCalendar
                                        startDate={checkIn} endDate={checkOut}
                                        onChange={(s, e) => {
                                            setCheckIn(s);
                                            if (e) { setCheckOut(e); syncNightsFromDates(s, e); }
                                            setActiveCalendar(null);
                                        }}
                                        onClose={() => setActiveCalendar(null)}
                                    />
                                )
                            }



                            {/* Hotel Details Modal - RENDERED IN PORTAL */}
                            {
                                expandedHotel && !isBookingModalOpen && createPortal(
                                    <div
                                        className="modern-calendar-overlay hotel-modal-overlay"
                                        onClick={() => setExpandedHotel(null)}
                                        style={{
                                            position: 'fixed',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            width: '100vw',
                                            height: '100vh',
                                            background: 'rgba(26, 43, 60, 0.95)',
                                            backdropFilter: 'blur(20px) saturate(180%)',
                                            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '40px 20px',
                                            overflowY: 'auto',
                                            zIndex: 9999999
                                        }}
                                    >
                                        <div
                                            className="modern-calendar-popup wide hotel-details-wide animate-fade-in"
                                            onClick={e => e.stopPropagation()}
                                            style={{
                                                margin: 'auto',
                                                maxHeight: '85vh',
                                                maxWidth: '1400px',
                                                width: '95%',
                                                background: 'var(--bg-card)',
                                                border: 'var(--border-thin)',
                                                borderRadius: '24px',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}
                                        >
                                            <div className="hotel-rooms-modal-header notepad-header-v6" style={{ padding: '30px 40px', background: 'var(--bg-card)', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                                                <div className="modal-title-zone" style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                                        <h2 className="modal-hotel-title-premium-v6" style={{
                                                            margin: 0,
                                                            fontSize: '1.8rem',
                                                            fontWeight: 900,
                                                            letterSpacing: '-0.5px',
                                                            color: isActuallyDark ? '#FFFFFF' : '#0e4b5e',
                                                            WebkitTextFillColor: isActuallyDark ? '#FFFFFF' : '#0e4b5e',
                                                            background: 'none',
                                                            WebkitBackgroundClip: 'initial',
                                                            backgroundClip: 'initial',
                                                            opacity: 1
                                                        }}>
                                                            {expandedHotel.name.toUpperCase()}
                                                        </h2>
                                                        <div className="hotel-stars-badge-inline-v6" style={{ display: 'flex', gap: '3px', color: '#ce93d8' }}>
                                                            {Array(Math.max(0, Math.min(5, Math.floor(Number(expandedHotel.stars || 0)) || 0))).fill(0).map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                                                        </div>
                                                    </div>
                                                    <div className="modal-meta-row-v6" style={{ display: 'flex', alignItems: 'center', gap: '15px', opacity: 0.7, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {expandedHotel.location}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarDays size={16} /> {formatDate(checkIn)} - {formatDate(checkOut)} ({nights} noćenja)</div>
                                                    </div>
                                                </div>
                                                <div className="modal-header-price-zone" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                                    <div className="notepad-header-price">
                                                        <span className="price-val" style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ce93d8', lineHeight: 1 }}>{formatPrice(getFinalDisplayPrice(expandedHotel))} €</span>
                                                        <span className="price-label" style={{ display: 'block', fontSize: '0.75rem', opacity: 0.5, fontWeight: 800, letterSpacing: '1px', marginTop: '4px' }}>UKUPNA CENA ARANŽMANA</span>
                                                    </div>
                                                    {renderAvailabilityStatus(expandedHotel.availability)}
                                                </div>
                                                <button className="close-modal-btn" onClick={() => setExpandedHotel(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}><X size={20} /></button>
                                            </div>
                                            <div className="modal-body-v6" style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
                                                {roomAllocations.map((alloc, rIdx) => {
                                                    if (alloc.adults === 0) return null;
                                                    const roomsForThisConfig = (expandedHotel.allocationResults && expandedHotel.allocationResults[rIdx]) || [];
                                                    return (
                                                        <div key={rIdx} className="room-allocation-section-v6">
                                                            <div className="notepad-sub-header-v6" style={{ padding: '1.5rem 2.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                                <div className="notepad-config-pill">
                                                                    {formatRoomConfigLabel(alloc, rIdx)}
                                                                </div>
                                                            </div>

                                                            <div className="notepad-ledger-header">
                                                                <div style={{ paddingLeft: '20px' }}>TIP SMEŠTAJA</div>
                                                                <div style={{ textAlign: 'center' }}>USLUGA</div>
                                                                <div style={{ textAlign: 'center' }}>KAPACITET</div>
                                                                <div style={{ textAlign: 'right', paddingRight: '20px' }}>CENA & AKCIJA</div>
                                                            </div>

                                                            <div className="notepad-room-list">
                                                                {roomsForThisConfig.length > 0 ? (
                                                                    roomsForThisConfig.map((room: any, idx: number) => (
                                                                        <div key={`room-modal-${room.id}-${idx}`} className="notepad-ledger-row">
                                                                            <div className="ledger-room-name">
                                                                                {cleanRoomName(room.name || 'Standardna Soba')}
                                                                            </div>
                                                                            <div className="ledger-meal">
                                                                                {renderMealPlanBadge(room.mealPlan || expandedHotel.mealPlan, true)}
                                                                            </div>
                                                                            <div className="ledger-capacity">
                                                                                <Users size={16} />
                                                                                <span>{room.capacity || `${alloc.adults}+${alloc.children}`}</span>
                                                                            </div>
                                                                            <div className="ledger-action-zone">
                                                                                <div className="ledger-status-price">
                                                                                    {renderAvailabilityStatus(room.availability || expandedHotel.availability)}
                                                                                    <div className="ledger-price">
                                                                                        {formatPrice(isSubagent ? getPriceWithMargin(room.price) : Number(room.price))} <span className="curr">EUR</span>
                                                                                    </div>
                                                                                </div>
                                                                                <button
                                                                                    className="btn-ledger-reserve"
                                                                                    onClick={() => handleReserveClick(room, rIdx, expandedHotel)}
                                                                                >
                                                                                    REZERVIŠI <ArrowRight size={14} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
                                                                        Nema slobodnih soba za ovu konfiguraciju.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>,
                                    document.getElementById('portal-root') || document.body
                                )
                            }

                            {/* Booking Management Portal (Z-Index fix) */}
                            {
                                createPortal(
                                    <div className="booking-portal-host" style={{ position: 'relative', zIndex: 99999999 }}>
                                        {isBookingModalOpen && expandedHotel && selectedRoomForBooking && (
                                            <BookingModal
                                                isOpen={isBookingModalOpen}
                                                onClose={() => {
                                                    setIsBookingModalOpen(false);
                                                    if (viewMode === 'notepad') setExpandedHotel(null);
                                                }}
                                                provider={expandedHotel.provider.toLowerCase() as any}
                                                bookingData={{
                                                    hotelName: expandedHotel.name,
                                                    location: expandedHotel.location,
                                                    checkIn,
                                                    checkOut,
                                                    nights,
                                                    roomType: selectedRoomForBooking.name,
                                                    mealPlan: getMealPlanDisplayName(expandedHotel.mealPlan),
                                                    adults: roomAllocations.reduce((sum, r) => sum + r.adults, 0),
                                                    children: roomAllocations.reduce((sum, r) => sum + r.children, 0),
                                                    totalPrice: (isSubagent ? getPriceWithMargin(selectedRoomForBooking.price) : Number(selectedRoomForBooking.price)) * (viewMode === 'notepad' ? 0.8 : 1),
                                                    currency: 'EUR',
                                                    stars: expandedHotel.stars,
                                                    providerData: expandedHotel.originalData,
                                                    serviceName: expandedHotel.name,
                                                    serviceType: 'hotel'
                                                }}
                                                onSuccess={(code, cis, id, prov) => {
                                                    setIsBookingModalOpen(false);
                                                    setBookingSuccessData({ id: id || '', code: code || '', provider: prov || '' });
                                                }}
                                                onError={err => {
                                                    setBookingAlertError(err);
                                                    setTimeout(() => setBookingAlertError(null), 8000);
                                                }}
                                            />
                                        )}

                                        <BookingSuccessModal
                                            isOpen={!!bookingSuccessData}
                                            onClose={() => setBookingSuccessData(null)}
                                            onOpenDossier={() => {
                                                setBookingSuccessData(null);
                                                window.open('/reservation-architect?loadFrom=pending_booking', '_blank');
                                            }}
                                            bookingCode={bookingSuccessData?.code || ''}
                                            internalId={bookingSuccessData?.id || ''}
                                            provider={bookingSuccessData?.provider || 'Solvex'}
                                            hotelName={expandedHotel?.name || 'Hotel'}
                                        />
                                    </div>,
                                    document.getElementById('portal-root') || document.body
                                )
                            }
                        </main>
                    </div>
                </>
            )}
        </div >
    );
};

export default SmartSearch;
