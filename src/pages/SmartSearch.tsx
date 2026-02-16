import React, { useState, useEffect, useRef } from 'react';
import { ClickToTravelLogo } from '../components/icons/ClickToTravelLogo';
import './SmartSearchFerrariFix.css';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores';
import {
    Sparkles, Hotel, Plane, Package, Bus, Compass, LayoutTemplate,
    MapPin, Calendar, CalendarDays, Users, UtensilsCrossed, Star,
    Search, TrendingUp, Zap, Shield, X, Loader2, MoveRight, MoveLeft, Users2, ChevronDown,
    LayoutGrid, List as ListIcon, Map as MapIcon, ArrowDownWideNarrow, ArrowUpNarrowWide,
    CheckCircle2, CheckCircle, XCircle, Clock, ArrowRight, ShieldCheck, Info, Calendar as CalendarIcon,
    Plus, Globe, AlignLeft, Mountain, DollarSign
} from 'lucide-react';
import { performSmartSearch, type SmartSearchResult, PROVIDER_MAPPING } from '../services/smartSearchService';
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
import { getProxiedImageUrl } from '../utils/imageProxy';
import './SmartSearch.css';
import './SmartSearchFix2.css';
import './SmartSearchStylesFix.css';
import './SmartSearchLightMode.css';
import './SmartSearchRedesign.css';
import './SmartSearchGridFix.css';
import './ModalFixDefinitive.css';
import './SmartSearchZoom.css';

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
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    // MODE SWITCH
    const [searchMode, setSearchMode] = useState<'classic' | 'narrative' | 'immersive'>('classic');
    const [showModes, setShowModes] = useState(true);

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

    // Added missing states for Flight and Pax support
    const [showPax, setShowPax] = useState(false);
    const [originCity, setOriginCity] = useState('Beograd');
    const [originCode, setOriginCode] = useState('BEG');
    const [cabinClass, setCabinClass] = useState<'economy' | 'business' | 'first'>('economy');
    const [showOriginDropdown, setShowOriginDropdown] = useState(false);
    const [showCabinDropdown, setShowCabinDropdown] = useState(false);
    const [originInput, setOriginInput] = useState('');
    const [originSuggestions, setOriginSuggestions] = useState<Destination[]>([]);
    const paxRef = useRef<HTMLDivElement>(null);
    const originRef = useRef<HTMLDivElement>(null);
    const cabinRef = useRef<HTMLDivElement>(null);

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

        // 5. Map Flight Specifics
        if (data.originCity && data.originCity !== originCity) {
            setOriginCity(data.originCity);
        }
        if (data.originCode && data.originCode !== originCode) {
            setOriginCode(data.originCode);
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
            nationality: nationality,
            currency: 'EUR',
            startDate: checkIn,
            endDate: checkOut,
            totalDays: nights,
            originCity: originCity,
            originCode: originCode
        };
    };

    const updateRoom = (rIdx: number, field: 'adults' | 'children', delta: number) => {
        const newAlloc = [...roomAllocations];
        if (field === 'adults') {
            newAlloc[rIdx].adults = Math.max(1, Math.min(10, newAlloc[rIdx].adults + delta));
        } else {
            const currentChildren = newAlloc[rIdx].children;
            const newChildren = Math.max(0, Math.min(4, currentChildren + delta));
            newAlloc[rIdx].children = newChildren;
            if (delta > 0) {
                newAlloc[rIdx].childrenAges.push(0);
            } else if (delta < 0 && currentChildren > 0) {
                newAlloc[rIdx].childrenAges.pop();
            }
        }
        setRoomAllocations(newAlloc);
    };

    const addRoom = () => {
        if (roomAllocations.length < 5) {
            setRoomAllocations([...roomAllocations, { adults: 2, children: 0, childrenAges: [] }]);
        }
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
    const [budgetType, setBudgetType] = useState<'total' | 'person'>('person');

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
            if (paxRef.current && !paxRef.current.contains(event.target as Node)) {
                setShowPax(false);
            }
            if (originRef.current && !originRef.current.contains(event.target as Node)) {
                setShowOriginDropdown(false);
            }
            if (cabinRef.current && !cabinRef.current.contains(event.target as Node)) {
                setShowCabinDropdown(false);
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

    // Trigger background search for Classic and Futuristic modes when state changes
    useEffect(() => {
        if (selectedDestinations.length > 0 && checkIn && checkOut && searchMode !== 'immersive') {
            handleBackgroundSearch({
                destinations: selectedDestinations,
                checkIn,
                checkOut,
                allocations: roomAllocations
            });
        }
    }, [selectedDestinations, checkIn, checkOut, roomAllocations, searchMode]);

    const handleBackgroundSearch = async (params: {
        destinations: Destination[],
        checkIn: string,
        checkOut: string,
        allocations: RoomAllocation[],
        originCity?: string,
        originCode?: string,
        cabinClass?: 'economy' | 'business' | 'first'
    }) => {
        const { destinations, checkIn, checkOut, allocations, originCity: pOriginCity, originCode: pOriginCode, cabinClass: pCabinClass } = params;

        if (destinations.length === 0 || !checkIn || !checkOut || allocations.filter(r => r.adults > 0).length === 0) {
            setPrefetchedResults([]);
            setPrefetchKey('');
            return;
        }

        const currentKey = `${destinations.map(d => d.id).sort().join(',')}|${checkIn}|${checkOut}|${JSON.stringify(allocations)}|${pOriginCity || originCity}|${pCabinClass || cabinClass}`;
        if (prefetchKey === currentKey) {
            return; // Already prefetched or currently prefetching this exact query
        }

        setIsPrefetching(true);
        setPrefetchKey(currentKey);

        try {
            const results = await performSmartSearch({
                searchType: activeTab,
                destinations: destinations.map(d => ({
                    id: String(d.id).replace('solvex-c-', ''),
                    name: d.name,
                    type: d.type
                })),
                checkIn: checkIn,
                checkOut: checkOut,
                rooms: allocations.filter(r => r.adults > 0),
                mealPlan,
                currency: 'EUR',
                nationality: nationality || 'RS',
                originCity: pOriginCity || originCity,
                originCode: pOriginCode || originCode,
                cabinClass: pCabinClass || cabinClass,
            });

            const resultsWithSales = await Promise.all(results.map(async (h) => {
                const count = await getMonthlyReservationCount(h.name);
                return { ...h, salesCount: count };
            }));

            setPrefetchedResults(resultsWithSales);
        } catch (error) {
            console.error('Background search prefetch failed:', error);
            setPrefetchedResults([]);
            setPrefetchKey(''); // Clear key on error to allow re-attempt
        } finally {
            setIsPrefetching(false);
        }
    };

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
        allocations?: RoomAllocation[],
        originCity?: string,
        originCode?: string,
        cabinClass?: 'economy' | 'business' | 'first'
    }) => {
        const activeCheckIn = overrideParams?.checkIn || checkIn;
        const activeCheckOut = overrideParams?.checkOut || checkOut;
        const activeDestinations = overrideParams?.destinations || selectedDestinations;
        const activeAllocations = (overrideParams?.allocations || roomAllocations).filter(r => r.adults > 0);
        const activeOriginCity = overrideParams?.originCity || originCity;
        const activeOriginCode = overrideParams?.originCode || originCode;
        const activeCabinClass = overrideParams?.cabinClass || cabinClass;

        if (activeDestinations.length === 0) {
            setSearchError('Molimo odaberite najmanje jednu destinaciju');
            return;
        }

        if (!activeCheckIn || !activeCheckOut) {
            setSearchError('Molimo unesite datume');
            return;
        }

        // CHECK PREFETCH CACHE
        const currentKey = `${activeDestinations.map(d => d.id).sort().join(',')}|${activeCheckIn}|${activeCheckOut}|${JSON.stringify(activeAllocations)}|${activeOriginCity}|${activeCabinClass}`;
        if (prefetchedResults.length > 0 && prefetchKey === currentKey) {
            console.log('[SmartSearch] Using prefetched results! Instant display.');
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
                originCity: activeOriginCity,
                originCode: activeOriginCode,
                cabinClass: activeCabinClass,
            });

            // ENHANCE WITH CRM SALES DATA
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
                // START SMART SUGGESTIONS LOGIC
                setIsSearchingSuggestions(true);
                setAvailabilityTimeline({});
                // Variables redeclared below


                // We try specific offsets to build a small timeline
                // Fallback Logic: Try current nights, then nights-1, then nights-2 if nothing found
                const offsets = [1, -1, 2, -2, 3]; // Reduced offsets to avoid rate limits
                const timeline: Record<string, { available: boolean, price?: number, isCheapest?: boolean, nights?: number }> = {};
                timeline[activeCheckIn] = { available: false }; // Init original date as unavailable

                let minPriceFound = Infinity;
                let firstAvailableDate: { in: string, out: string, nights: number } | null = null;
                let bestDateResults: SmartSearchResult[] = [];

                const durationDiffs = [0, -1, -2]; // Priorities: 7 nights, 6 nights, 5 nights

                for (const dDiff of durationDiffs) {
                    const testNights = nights + dDiff;
                    if (testNights < 1) continue;

                    let foundForThisDuration = false;

                    for (const offset of offsets) {
                        const dIn = new Date(activeCheckIn);
                        dIn.setDate(dIn.getDate() + offset);
                        const dOut = new Date(dIn);
                        dOut.setDate(dOut.getDate() + testNights);

                        const sCheckIn = dIn.toISOString().split('T')[0];
                        const sCheckOut = dOut.toISOString().split('T')[0];

                        // Don't overwrite existing higher-priority results
                        if (timeline[sCheckIn]?.available) continue;

                        const flexTestResults = await performSmartSearch({
                            searchType: activeTab,
                            destinations: activeDestinations.map(d => ({
                                id: String(d.id).replace('solvex-c-', ''),
                                name: d.name,
                                type: d.type
                            })),
                            checkIn: sCheckIn,
                            checkOut: sCheckOut,
                            rooms: activeAllocations,
                            mealPlan,
                            currency: 'EUR',
                            nationality: nationality || 'RS',
                        });

                        if (flexTestResults.length > 0) {
                            const currentMinPrice = Math.min(...flexTestResults.map(r => getFinalDisplayPrice(r)));
                            timeline[sCheckIn] = { available: true, price: currentMinPrice, nights: testNights };
                            foundForThisDuration = true;

                            if (currentMinPrice < minPriceFound) {
                                minPriceFound = currentMinPrice;
                                firstAvailableDate = { in: sCheckIn, out: sCheckOut, nights: testNights };

                                const topCandidates = flexTestResults.slice(0, 5);
                                bestDateResults = await Promise.all(topCandidates.map(async (r) => {
                                    const count = await getMonthlyReservationCount(r.name);
                                    return { ...r, salesCount: count };
                                }));
                            }
                        } else {
                            if (!timeline[sCheckIn]) {
                                timeline[sCheckIn] = { available: false };
                            }
                        }
                    }

                    // If we found availability for this duration priority, stop looking for shorter durations
                    if (foundForThisDuration) {
                        break;
                    }
                }

                // Mark the absolute cheapest date in the timeline
                if (firstAvailableDate) {
                    timeline[firstAvailableDate.in].isCheapest = true;
                }

                setAvailabilityTimeline(timeline);

                if (firstAvailableDate) {
                    setSmartSuggestions({
                        type: 'flexible_dates',
                        data: bestDateResults.sort((a, b) => {
                            const priceDiff = getFinalDisplayPrice(a) - getFinalDisplayPrice(b);
                            if (Math.abs(priceDiff) < 5) return (b.salesCount || 0) - (a.salesCount || 0);
                            return priceDiff;
                        }),
                        message: `Olimpijski asistent je pronašao dostupnost za ${firstAvailableDate.nights} noći! Najpovoljnija opcija je za termin ${formatDate(firstAvailableDate.in)}.`
                    });
                } else {
                    setSearchError('Nažalost, nema slobodnih mesta ni u proširenom periodu (+/- 5 dana). Pokušajte sa drugim hotelom ili destinacijom.');
                }
                setIsSearchingSuggestions(false);
            }
        } catch (error) {
            console.error('[SmartSearch] Search error:', error);
            setSearchError(error instanceof Error ? error.message : 'Greška pri pretrazi');
        } finally {
            setIsSearching(false);
        }
    };


    const getPriceWithMargin = (price: number) => Math.round(price * 1.15);

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

        const price = getFinalDisplayPrice(hotel);

        let priceToCheck = price;
        if (budgetType === 'person') {
            const totalPax = roomAllocations.reduce((acc, r) => acc + r.adults + r.children, 0) || 1;
            priceToCheck = price / totalPax;
        }

        // Robust filtering
        if (budgetFrom) {
            const minBudget = Number(budgetFrom);
            if (!isNaN(minBudget) && priceToCheck < minBudget) return false;
        }
        if (budgetTo) {
            const maxBudget = Number(budgetTo);
            if (!isNaN(maxBudget) && priceToCheck > maxBudget) return false;
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
        const goldOld = '#CFB53B'; // Old gold color
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
        const goldOld = '#fbbf24';
        if (count === 0) return <span style={{ fontSize: '10px' }}>Bez kategorije</span>;
        return (
            <div className="star-row-mini">
                {[...Array(count)].map((_, i) => (
                    <Star key={i} size={10} fill={goldOld} color={goldOld} />
                ))}
            </div>
        );
    };

    return (
        <div className="smart-search-container-v2">
            {/* Booking Modal (Top Level) */}
            {
                isBookingModalOpen && expandedHotel && selectedRoomForBooking && (
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
                            totalPrice: Math.round((isSubagent ? getPriceWithMargin(selectedRoomForBooking.price) : Number(selectedRoomForBooking.price)) * (viewMode === 'notepad' ? 0.8 : 1)),
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
                            // Auto-clear error after 8s
                            setTimeout(() => setBookingAlertError(null), 8000);
                        }}
                    />
                )
            }
            {/* Booking Success Modal - Blocks UI via Portal */}
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
            <div className="tabs-nav-container" style={{ margin: '0 auto 15px auto' }}>
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

            {/* NARRATIVE MODE TOGGLE IN HEADER - MOVED OUTSIDE FOR ALL TABS */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '35px', position: 'relative' }}>
                <button
                    onClick={() => setShowModes(!showModes)}
                    style={{
                        background: showModes ? 'rgba(255,255,255,0.05)' : 'rgba(59, 130, 246, 0.1)',
                        border: `1px solid ${showModes ? 'rgba(255,255,255,0.2)' : 'rgba(59, 130, 246, 0.5)'}`,
                        borderRadius: '24px',
                        padding: '6px 20px',
                        fontSize: '11px',
                        color: showModes ? 'var(--text-secondary)' : '#60a5fa',
                        cursor: 'pointer',
                        marginBottom: showModes ? '20px' : '0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: showModes ? 'none' : '0 0 15px rgba(59, 130, 246, 0.2)'
                    }}
                >
                    {showModes ? <Zap size={12} /> : <Sparkles size={12} />}
                    {showModes ? 'SAKRIJ MODE SELEKTOR' : 'PRIKAŽI MODE SELEKTOR'}
                </button>

                {showModes && (
                    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center' }}>
                        <div className="mode-toggle-group">
                            <button
                                className={`mode-switch-btn ${searchMode === 'classic' ? 'active' : ''}`}
                                onClick={() => setSearchMode('classic')}
                            >
                                <LayoutTemplate size={16} style={{ marginRight: 8 }} />
                                Klasična
                            </button>
                            <button
                                className={`mode-switch-btn ${searchMode === 'narrative' ? 'active' : ''}`}
                                onClick={() => setSearchMode('narrative')}
                            >
                                <Sparkles size={16} style={{ marginRight: 8 }} />
                                Futuristička
                            </button>
                            <button
                                className={`mode-switch-btn ${searchMode === 'immersive' ? 'active' : ''}`}
                                onClick={() => setSearchMode('immersive')}
                            >
                                <Zap size={16} style={{ marginRight: 8 }} />
                                Immersive
                            </button>
                        </div>
                    </div>
                )}
            </div>


            {/* SEARCH AREA: INPUTS or RESULTS */}
            {
                searchPerformed ? (
                    <>
                        {/* FLEXIBLE DATES RIBBON */}
                        {flexibleDays > 0 && (
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
                        )}

                        {/* SMART SUGGESTIONS SECTION */}
                        {(smartSuggestions || isSearchingSuggestions) && (
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
                        )}

                        {/* RESULTS SECTION */}
                        <div className="content-workflow animate-fade-in" style={{ marginTop: '3rem' }}>
                            <div className="filters-toolbar-v4 premium" style={{ display: 'flex', flexWrap: 'nowrap', gap: '16px', alignItems: 'center' }}>
                                <div className="name-filter-wrapper" style={{ flex: 1, minWidth: '0' }}>
                                    <Search size={14} className="filter-icon" />
                                    <input
                                        type="text"
                                        className="smart-input premium"
                                        style={{ width: '100%', paddingLeft: '40px', height: '48px' }}
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
                                <div className="view-mode-switcher" style={{ flexShrink: 0 }}>
                                    <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid"><LayoutGrid size={18} /></button>
                                    <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List"><ListIcon size={18} /></button>
                                    <button className={`view-btn ${viewMode === 'notepad' ? 'active' : ''}`} onClick={() => setViewMode('notepad')} title="Notepad"><AlignLeft size={18} /></button>
                                </div>
                            </div>

                            <div className="results-summary-bar-v4 premium">
                                <div className="summary-info" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <span>REZULTATA: <strong>{filteredResults.length}</strong></span>
                                    <button
                                        className="new-search-pill"
                                        onClick={() => {
                                            setSearchPerformed(false);
                                            setSearchResults([]);
                                            setSearchError(null);
                                            setSmartSuggestions(null);
                                        }}
                                    >
                                        <Sparkles size={14} /> POKRENI NOVU PRETRAGU
                                    </button>
                                </div>
                                <div className="sort-actions">
                                    <button className={`view-btn ${sortBy === 'smart' ? 'active' : ''}`} onClick={() => setSortBy('smart')}>Smart</button>
                                    <button
                                        className={`view-btn ${sortBy.startsWith('price') ? 'active' : ''}`}
                                        onClick={() => setSortBy(sortBy === 'price_low' ? 'price_high' : 'price_low')}
                                    >
                                        Cena {sortBy === 'price_low' ? '↑' : sortBy === 'price_high' ? '↓' : '↕'}
                                    </button>
                                </div>
                            </div>

                            <div className={`results-container ${viewMode}-view`}>
                                {viewMode === 'notepad' ? (
                                    <div className="notepad-view-v2 animate-fade-in" style={{ padding: '0', width: '100%' }}>
                                        {filteredResults.map((hotel) => (
                                            <div key={hotel.id} className="hotel-notepad-card" style={{
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '20px',
                                                marginBottom: '2rem',
                                                overflow: 'hidden',
                                                boxShadow: 'var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.3))'
                                            }}>
                                                <div style={{
                                                    padding: '1.5rem 2rem',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            {hotel.name}
                                                            <span style={{ display: 'flex', color: '#fbbf24' }}>
                                                                {Array(hotel.stars || 0).fill(0).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                                                            </span>
                                                        </h3>
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                                                            <MapPin size={14} style={{ marginRight: '6px' }} />
                                                            {hotel.location}
                                                        </span>
                                                    </div>
                                                    <div style={{ color: '#fbbf24', fontSize: '1.1rem', fontWeight: 800, whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                                                        UKUPNA CENA OD: {formatPrice(getFinalDisplayPrice(hotel))} EUR
                                                    </div>
                                                </div>
                                                <div className="modal-body-v4" style={{ padding: '1.5rem 2rem' }}>
                                                    {roomAllocations.map((alloc, rIdx) => {
                                                        if (alloc.adults === 0) return null;
                                                        return (
                                                            <div key={rIdx} className="room-allocation-section" style={{ marginTop: rIdx > 0 ? '20px' : '0' }}>
                                                                <div className="section-divider-premium" style={{ marginBottom: '15px' }}>
                                                                    <span>{formatRoomConfigLabel(alloc, rIdx)}</span>
                                                                </div>
                                                                <div className="rooms-comparison-table">
                                                                    {(hotel.allocationResults?.[rIdx] || hotel.rooms || []).map((room: any, idx: number) => (
                                                                        <div key={room.id || idx} className="room-row-v4">
                                                                            <div className="r-name"><span className="room-type-tag">{room.name || 'Standardna Soba'}</span></div>
                                                                            <div className="r-servis"><span className="meal-tag-v4">{getMealPlanDisplayName(room.mealPlan || hotel.mealPlan)}</span></div>
                                                                            <div className="r-cap"><Users size={14} /> {room.capacity || `${alloc.adults}+${alloc.children}`}</div>
                                                                            <div className="r-price"><span className="notepad-price">{formatPrice(room.price)} EUR</span></div>
                                                                            <div className="r-action"><button className="btn-book-v4" onClick={() => handleReserveClick(room, rIdx)}>Rezerviši</button></div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={`results-mosaic ${viewMode === 'list' ? 'list-layout' : 'grid-layout'}`}>
                                        {filteredResults.map(hotel => (
                                            <div key={hotel.id} className={`hotel-result-card-premium unified ${hotel.provider.toLowerCase().replace(/\s+/g, '')} ${viewMode === 'list' ? 'horizontal' : ''}`}>
                                                <div className="hotel-card-image" onClick={() => navigate('/hotel-view/' + hotel.id)}>
                                                    <img src={getProxiedImageUrl(hotel.images?.[0]) || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800"} alt="" />
                                                    <div className="meal-plan-badge">{getMealPlanDisplayName(hotel.mealPlan)}</div>
                                                    <div className="hotel-stars-badge">
                                                        {Array(Math.floor(Number(hotel.stars || 0))).fill(0).map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                                                    </div>
                                                </div>
                                                <div className="hotel-card-content">
                                                    <div className="hotel-info-text">
                                                        <div className="hotel-title-row">
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/hotel-view/' + hotel.id)}>
                                                                <h3 style={{ margin: 0 }}>{hotel.name}</h3>
                                                                {(hotel.salesCount || 0) > 5 && (
                                                                    <span className="best-seller-mini-badge" title={`Preko ${hotel.salesCount} rezervacija u poslednjih 30 dana`}>
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
                    </>
                ) : (
                    <>
                        {/* ERROR ALERT */}
                        {searchError && (
                            <div className="search-error animate-fade-in" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Info size={18} />
                                    <span>{searchError}</span>
                                </div>
                                <button className="new-search-pill" onClick={() => { setSearchError(null); }}>PONUŠTI</button>
                            </div>
                        )}

                        {/* SEARCH INPUTS */}
                        {searchMode === 'classic' ? (
                            <>
                                {activeTab === 'package' ? (
                                    <div className="package-builder-inline animate-fade-in" style={{ marginTop: '2rem' }}>
                                        <PackageSearch initialDestinations={selectedDestinations} initialCheckIn={checkIn} initialCheckOut={checkOut} initialTravelers={roomAllocations} />
                                    </div>
                                ) : activeTab === 'flight' ? (
                                    <div className="flight-search-inline animate-fade-in" style={{ marginTop: '2rem' }}>
                                        <FlightSearch isInline />
                                    </div>
                                ) : activeTab === 'ski' ? (
                                    <div className="ski-search-wrapper animate-fade-in" style={{ marginTop: '2rem' }}>
                                        <div className="search-card-frame" style={{ textAlign: 'center', padding: '60px' }}>
                                            <Mountain size={48} color="var(--accent)" style={{ marginBottom: '20px', opacity: 0.5 }} />
                                            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>SKI PRETRAGA - USKORO</h2>
                                        </div>
                                    </div>
                                ) : (activeTab === 'hotel' || activeTab === 'transfer' || activeTab === 'tour') ? (
                                    <div className="search-card-frame">
                                        {/* Destination Input Row */}
                                        <div className="destination-row">
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
                                                            className="smart-input-inline"
                                                            placeholder={selectedDestinations.length === 0 ? "npr. Golden Sands, Hotel Park..." : "Dodaj još..."}
                                                            value={destinationInput}
                                                            onChange={(e) => setDestinationInput(e.target.value)}
                                                            onFocus={() => { if (destinationInput.length >= 2) setShowSuggestions(true); }}
                                                        />
                                                    )}
                                                </div>
                                                {showSuggestions && suggestions.length > 0 && (
                                                    <div className="autocomplete-dropdown premium">
                                                        {suggestions.map(s => (
                                                            <div key={s.id} className="suggestion-item" onClick={() => handleAddDestination(s)}>
                                                                {s.type === 'hotel' ? <Hotel size={16} className="suggestion-icon" /> : <MapPin size={16} className="suggestion-icon" />}
                                                                <div className="suggestion-info">
                                                                    <strong>{s.name}</strong>
                                                                    <small>{s.country}</small>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Parameters Grid */}
                                        <div className="params-grid" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', alignItems: 'end' }}>
                                            <div className="param-item" onClick={() => setActiveCalendar('in')} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div className="field-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}><CalendarIcon size={14} /> Check-in</div>
                                                <div className="input-box" style={{ fontWeight: 700, fontSize: '0.95rem' }}>{checkIn ? formatDate(checkIn) : 'mm/dd/yyyy'}</div>
                                            </div>
                                            <div className="param-item" onClick={() => setActiveCalendar('out')} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div className="field-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}><CalendarIcon size={14} /> Check-out</div>
                                                <div className="input-box" style={{ fontWeight: 700, fontSize: '0.95rem' }}>{checkOut ? formatDate(checkOut) : 'mm/dd/yyyy'}</div>
                                            </div>

                                            <div className="param-item" onClick={() => setShowPax(true)} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                                                <div className="field-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}><Users size={14} /> Putnici</div>
                                                <div className="input-box" style={{ fontWeight: 700, fontSize: '0.95rem' }}>{roomAllocations.length} Soba, {roomAllocations.reduce((acc, r) => acc + r.adults + r.children, 0)} Putnika</div>
                                                {showPax && (
                                                    <div className="pax-dropdown-v4" ref={paxRef} onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(100% + 10px)', left: 0, zIndex: 100, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '15px', padding: '20px', boxShadow: 'var(--shadow-xl)', width: '320px' }}>
                                                        {roomAllocations.map((room, rIdx) => (
                                                            <div key={rIdx} className="room-allocation-card" style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <div className="room-title" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '10px' }}>SOBA {rIdx + 1}</div>
                                                                <div className="pax-control" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                                    <span style={{ fontSize: '0.9rem' }}>Odrasli</span>
                                                                    <div className="counter-btn-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                        <button onClick={() => updateRoom(rIdx, 'adults', -1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', color: 'white', cursor: 'pointer' }}>-</button>
                                                                        <span style={{ fontWeight: 700, width: '20px', textAlign: 'center' }}>{room.adults}</span>
                                                                        <button onClick={() => updateRoom(rIdx, 'adults', 1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', color: 'white', cursor: 'pointer' }}>+</button>
                                                                    </div>
                                                                </div>
                                                                <div className="pax-control" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span style={{ fontSize: '0.9rem' }}>Deca</span>
                                                                    <div className="counter-btn-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                        <button onClick={() => updateRoom(rIdx, 'children', -1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', color: 'white', cursor: 'pointer' }}>-</button>
                                                                        <span style={{ fontWeight: 700, width: '20px', textAlign: 'center' }}>{room.children}</span>
                                                                        <button onClick={() => updateRoom(rIdx, 'children', 1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', color: 'white', cursor: 'pointer' }}>+</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                            <button onClick={addRoom} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}>+ Dodaj sobu</button>
                                                            <button onClick={() => setShowPax(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Potvrdi</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <button className="btn-search-main" onClick={() => handleSearch()} disabled={isSearching} style={{ background: 'var(--accent)', color: 'white', border: 'none', height: '48px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', padding: '0 24px' }}>
                                                {isSearching ? <Loader2 className="animate-spin" size={24} /> : 'PRETRAŽI'}
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </>
                        ) : searchMode === 'narrative' ? (
                            <div className="narrative-mode-container" style={{ padding: '0 2rem' }}>
                                <NarrativeSearch
                                    activeTab={activeTab as any}
                                    basicInfo={getInitialNarrativeData()}
                                    onUpdate={(data) => handleNarrativeUpdate(data)}
                                    onNext={(data) => {
                                        const updates = handleNarrativeUpdate(data);
                                        handleSearch(updates);
                                    }}
                                />
                            </div>
                        ) : (
                            <ImmersiveSearch
                                activeTab={activeTab as any}
                                onPartialUpdate={() => { }}
                                onSearch={(data) => {
                                    const cin = new Date(data.checkIn);
                                    const cout = new Date(data.checkOut);
                                    const nights = Math.ceil((cout.getTime() - cin.getTime()) / (1000 * 60 * 60 * 24)) || 7;
                                    const mappedData: BasicInfoData = {
                                        destinations: data.destinations.map((d: any) => ({
                                            ...d,
                                            city: d.name,
                                            checkIn: data.checkIn,
                                            checkOut: data.checkOut,
                                            nights: nights,
                                            roomAllocations: data.roomAllocations
                                        })),
                                        startDate: data.checkIn,
                                        endDate: data.checkOut,
                                        totalDays: nights,
                                        currency: 'EUR',
                                        roomAllocations: data.roomAllocations,
                                        travelers: { adults: data.adults, children: data.children, childrenAges: data.childrenAges }
                                    };
                                    const updates = handleNarrativeUpdate(mappedData);
                                    handleSearch(updates);
                                }}
                            />
                        )}
                    </>
                )
            }

            {/* SHARED OVERLAYS */}
            {
                activeCalendar && createPortal(
                    <div className="modern-calendar-overlay" onClick={() => setActiveCalendar(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div onClick={(e) => e.stopPropagation()}>
                            <ModernCalendar
                                startDate={checkIn}
                                endDate={checkOut}
                                onChange={(start, end) => {
                                    setCheckIn(start);
                                    setCheckOut(end);
                                    if (start && end) {
                                        const s = new Date(start);
                                        const e = new Date(end);
                                        setNights(Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
                                        setActiveCalendar(null);
                                    }
                                }}
                                onClose={() => setActiveCalendar(null)}
                            />
                        </div>
                    </div>,
                    document.getElementById('portal-root') || document.body
                )
            }

            {
                expandedHotel && createPortal(
                    <div className="hotel-details-modal animate-fade-in" onClick={() => setExpandedHotel(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 99999, padding: '40px 20px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
                        <div className="modal-content-v4 animate-popover-in" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '1200px', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', alignSelf: 'start' }}>
                            <div className="modal-header-v4" style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{expandedHotel.name}</h2>
                                    <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', marginTop: '8px' }}>
                                        {Array(expandedHotel.stars || 0).fill(0).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                                    </div>
                                </div>
                                <button onClick={() => setExpandedHotel(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <div className="modal-body-v4" style={{ padding: '30px' }}>
                                {roomAllocations.map((alloc, rIdx) => {
                                    if (alloc.adults === 0) return null;
                                    return (
                                        <div key={rIdx} style={{ marginBottom: '40px' }}>
                                            <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                                KONFIGURACIJA ZA SOBU {rIdx + 1}: {alloc.adults} odraslih, {alloc.children} dece
                                            </div>
                                            <div className="rooms-table" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {(expandedHotel.allocationResults?.[rIdx] || expandedHotel.rooms || []).map((room: any, idx: number) => (
                                                    <div key={room.id || idx} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 140px 140px', gap: '20px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', alignItems: 'center' }}>
                                                        <div style={{ fontWeight: 600 }}>{room.name || 'Standardna Soba'}</div>
                                                        <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem' }}>{getMealPlanDisplayName(room.mealPlan || expandedHotel.mealPlan)}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><Users size={16} /> {room.capacity || (alloc.adults + alloc.children)}</div>
                                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, textAlign: 'right' }}>{formatPrice(room.price || expandedHotel.price)} €</div>
                                                        <button className="btn-book-v4" onClick={() => handleReserveClick(room, rIdx)} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Rezerviši</button>
                                                    </div>
                                                ))}
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
        </div>
    );
};

export default SmartSearch;
