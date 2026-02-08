import React, { useState, useEffect, useRef } from 'react';
import './SmartSearchFerrariFix.css';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import {
    Sparkles, Hotel, Plane, Package, Bus, Compass,
    MapPin, Calendar, CalendarDays, Users, UtensilsCrossed, Star,
    Search, Bot, TrendingUp, Zap, Shield, X, Loader2, MoveRight, MoveLeft, Users2, ChevronDown,
    LayoutGrid, List as ListIcon, Map as MapIcon, ArrowDownWideNarrow, ArrowUpNarrowWide,
    CheckCircle2, CheckCircle, XCircle, Clock, ArrowRight, ShieldCheck, Info, Calendar as CalendarIcon,
    Plus, Globe, AlignLeft, Database, Power, Building2, Ship, Anchor, Ticket, Mountain, Settings
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
import Step5_ExtrasSelection from '../components/packages/Steps/Step5_ExtrasSelection';
import { useConfig } from '../context/ConfigContext';
import './GlobalHubSearch.css';
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

const formatPrice = (price: number) => {
    return price.toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

/**
 * Get full meal plan display name in Serbian
 */
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
    type: 'destination' | 'hotel';
    country?: string;
    stars?: number;
    provider?: string;
}

interface RoomAllocation {
    adults: number;
    children: number;
    childrenAges: number[];
}

const GlobalHubSearch: React.FC = () => {
    const { userLevel, impersonatedSubagent } = useAuthStore();
    const isSubagent = userLevel < 6 || !!impersonatedSubagent;
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'hotel' | 'flight' | 'package' | 'transfer' | 'tour' | 'charter' | 'cruise' | 'event' | 'ski'>('hotel');
    const [selectedDestinations, setSelectedDestinations] = useState<Destination[]>([]);
    const [destinationInput, setDestinationInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<Destination[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    // Recent searches state kept but not used for display anymore
    const [recentSearches, setRecentSearches] = useState<Destination[]>([]);

    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [nights, setNights] = useState(7);
    const [activeCalendar, setActiveCalendar] = useState<'in' | 'out' | null>(null);
    const [flexibleDays, setFlexibleDays] = useState(0);

    // API Providers State (from GlobalHubSearch)
    const [apiConnectionsEnabled, setApiConnectionsEnabled] = useState(true);
    const [enabledProviders, setEnabledProviders] = useState({
        opengreece: true,
        tct: true,
        solvex: true,
        solvexai: true,
        ors: true
    });

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

    // Booking states
    const [expandedHotel, setExpandedHotel] = useState<SmartSearchResult | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [notepadMealFilters, setNotepadMealFilters] = useState<Record<string, string>>({});
    const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<any>(null);
    const [bookingSuccessData, setBookingSuccessData] = useState<{ id: string, code: string, provider: string } | null>(null);
    const [bookingAlertError, setBookingAlertError] = useState<string | null>(null);
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
        { id: 'package' as const, label: 'Dynamic Wizard', icon: Package },
        { id: 'charter' as const, label: 'Čarteri', icon: Zap },
        { id: 'cruise' as const, label: 'Krstarenja', icon: Ship },
        { id: 'transfer' as const, label: 'Transferi', icon: Bus },
        { id: 'event' as const, label: 'Events', icon: Ticket },
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

    // --- PART 2 ---
    const handleSearch = async (overrideParams?: { checkIn?: string, checkOut?: string }) => {
        const activeCheckIn = overrideParams?.checkIn || checkIn;
        const activeCheckOut = overrideParams?.checkOut || checkOut;

        if (selectedDestinations.length === 0) {
            setSearchError('Molimo odaberite najmanje jednu destinaciju');
            return;
        }

        if (!activeCheckIn || !activeCheckOut) {
            setSearchError('Molimo unesite datume');
            return;
        }

        setIsSearching(true);
        setSearchError(null);
        setSearchResults([]);
        setSearchPerformed(false);
        setSmartSuggestions(null);
        setSelectedArrivalDate(activeCheckIn);

        try {
            const activeAllocations = roomAllocations.filter(r => r.adults > 0);
            if (activeAllocations.length === 0) {
                setSearchError('Molimo definišite bar jednu sobu sa odraslim putnicima.');
                setIsSearching(false);
                return;
            }

            const results = await performSmartSearch({
                searchType: activeTab as any,
                destinations: selectedDestinations,
                checkIn: activeCheckIn,
                checkOut: activeCheckOut,
                rooms: activeAllocations,
                mealPlan,
                currency: 'EUR',
                nationality: nationality || 'RS',
            });

            // ENHANCE WITH CRM SALES DATA
            const resultsWithSales = await Promise.all(results.map(async (h) => {
                const count = await getMonthlyReservationCount(h.name);
                return { ...h, salesCount: count };
            }));

            setSearchResults(resultsWithSales);
            setSearchPerformed(true);

            if (resultsWithSales.length === 0 && !overrideParams) {
                // START SMART SUGGESTIONS LOGIC
                setIsSearchingSuggestions(true);
                setAvailabilityTimeline({});

                const offsets = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5];
                const timeline: Record<string, { available: boolean, price?: number, isCheapest?: boolean, nights?: number }> = {};
                timeline[activeCheckIn] = { available: false };

                let minPriceFound = Infinity;
                let firstAvailableDate: { in: string, out: string, nights: number } | null = null;
                let bestDateResults: SmartSearchResult[] = [];

                const durationDiffs = [0, -1, -2];

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

                        if (timeline[sCheckIn]?.available) continue;

                        const flexTestResults = await performSmartSearch({
                            searchType: activeTab as any,
                            destinations: selectedDestinations,
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
                    if (foundForThisDuration) break;
                }

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
            console.error('[GlobalHubSearch] Search error:', error);
            setSearchError(error instanceof Error ? error.message : 'Greška pri pretrazi');
        } finally {
            setIsSearching(false);
        }
    };

    const getPriceWithMargin = (price: number) => Math.round(price * 1.15);
    const formatPrice = (val: number) => val.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
        if (hotelNameFilter && !hotel.name.toLowerCase().includes(hotelNameFilter.toLowerCase())) return false;
        if (selectedStars.length > 0 && !selectedStars.includes('all')) {
            if (!selectedStars.includes(String(hotel.stars || 0))) return false;
        }
        if (selectedMealPlans.length > 0 && !selectedMealPlans.includes('all')) {
            const normalized = normalizeMealPlan(hotel.mealPlan || '');
            if (!selectedMealPlans.includes(normalized)) return false;
        }
        return true;
    }).sort((a, b) => {
        if (sortBy === 'price_low') return getFinalDisplayPrice(a) - getFinalDisplayPrice(b);
        if (sortBy === 'price_high') return getFinalDisplayPrice(b) - getFinalDisplayPrice(a);
        if (sortBy === 'smart') {
            const salesA = a.salesCount || 0;
            const salesB = b.salesCount || 0;
            if (salesB >= 10 && salesA < 10) return 1;
            if (salesA >= 10 && salesB < 10) return -1;
            if ((b.stars || 0) !== (a.stars || 0)) return (b.stars || 0) - (a.stars || 0);
            return getFinalDisplayPrice(a) - getFinalDisplayPrice(b);
        }
        return 0;
    });

    const handleReserveClick = (serviceOrRoom: any, idx: number, sourceService?: SmartSearchResult) => {
        const service = sourceService || expandedHotel;
        if (!service) return;

        // If it's a generic service (not hotel), use it directly
        if (service.type !== 'hotel') {
            setSelectedRoomForBooking({
                id: service.id,
                name: service.name,
                price: service.price,
                allocationIndex: 0
            });
        } else {
            setSelectedRoomForBooking({ ...serviceOrRoom, allocationIndex: idx });
        }

        setExpandedHotel(service);
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

    return (
        <div className="smart-search-container-v2 global-hub-search-v2">
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
                            serviceName: expandedHotel.name,
                            serviceType: (expandedHotel.type as any) || 'hotel',
                            hotelName: expandedHotel.name,
                            location: expandedHotel.location,
                            checkIn,
                            checkOut: expandedHotel.type === 'hotel' ? checkOut : undefined,
                            nights: expandedHotel.type === 'hotel' ? nights : 0,
                            roomType: expandedHotel.type === 'hotel' ? selectedRoomForBooking.name : (expandedHotel.type === 'transfer' ? 'Transfer' : (expandedHotel.type === 'tour' ? 'Izlet' : 'Usluga')),
                            mealPlan: expandedHotel.type === 'hotel' ? getMealPlanDisplayName(expandedHotel.mealPlan) : undefined,
                            adults: roomAllocations.reduce((sum, r) => sum + r.adults, 0),
                            children: roomAllocations.reduce((sum, r) => sum + r.children, 0),
                            totalPrice: Math.round(isSubagent ? getPriceWithMargin(selectedRoomForBooking.price || expandedHotel.price) : Number(selectedRoomForBooking.price || expandedHotel.price)),
                            currency: expandedHotel.currency || 'EUR',
                            stars: expandedHotel.stars,
                            providerData: expandedHotel.originalData
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
                )
            }
            {/* Booking Success Modal */}
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

            {/* API Connection Section - THE KEY ADDITION FOR GLOBAL SEARCH HUB */}
            {!isSubagent ? (
                <div className="provider-toggles-section" style={{ margin: '0 0 20px 0', padding: '20px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                    <div className="provider-toggles-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.1rem' }}>
                            <Database size={22} className="text-blue-500" />
                            <span className="tracking-tight">PARTNERI - DOBAVLJAČI</span>
                        </div>
                        <div className="master-api-toggle-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                STATUS: {apiConnectionsEnabled ? <span className="text-emerald-500">POVEZANO</span> : <span className="text-rose-500">DISKONEKTOVANO</span>}
                            </span>
                            <button
                                className={`master-power-btn ${apiConnectionsEnabled ? 'on' : 'off'}`}
                                onClick={() => setApiConnectionsEnabled(!apiConnectionsEnabled)}
                                style={{
                                    background: apiConnectionsEnabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    border: 'none', borderRadius: '12px', padding: '10px', cursor: 'pointer', color: 'white',
                                    boxShadow: apiConnectionsEnabled ? '0 4px 15px rgba(16, 185, 129, 0.4)' : '0 4px 15px rgba(239, 68, 68, 0.4)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <Power size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="provider-toggles" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', opacity: apiConnectionsEnabled ? 1 : 0.4, pointerEvents: apiConnectionsEnabled ? 'auto' : 'none', transition: 'opacity 0.3s ease' }}>
                        {[
                            { id: 'opengreece', name: 'Open Greece', icon: Globe },
                            { id: 'tct', name: 'TCT', icon: Building2 },
                            { id: 'solvex', name: 'Solvex', icon: Database },
                            { id: 'solvexai', name: 'Solvex AI', icon: Sparkles },
                            { id: 'ors', name: 'ORS', icon: Zap }
                        ].map((prov) => {
                            const active = (enabledProviders as any)[prov.id];
                            return (
                                <button
                                    key={prov.id}
                                    className={`provider-toggle ${active ? 'active' : ''}`}
                                    onClick={() => setEnabledProviders(prev => ({ ...prev, [prov.id]: !active }))}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderRadius: '14px',
                                        background: active ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                                        border: `2px solid ${active ? '#3b82f6' : 'rgba(255,255,255,0.05)'}`,
                                        color: active ? '#3b82f6' : 'var(--text-secondary)',
                                        fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    <prov.icon size={18} />
                                    {prov.name}
                                    {active && <CheckCircle2 size={16} className="ml-2" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="subagent-ai-info" style={{ margin: '0 0 20px 0', padding: '20px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>PERSONALIZOVANI AI ASISTENT</span>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Umetnite svoj API ključ za brži rad i bolju kontrolu nad AI alatima.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.location.href = '/b2b-portal?tab=settings'}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: 'white',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                        }}
                    >
                        <Settings size={16} /> KONFIGURIŠI AI
                    </button>
                </div>
            )}



            {/* TAB NAVIGATION */}
            <div className="tabs-nav-container">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`nav-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={18} />
                        <span>{tab.label}</span>
                    </button>
                ))}
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
            ) : activeTab === 'event' ? (
                <div className="event-search-wrapper animate-fade-in" style={{ marginTop: '2rem' }}>
                    <Step5_ExtrasSelection
                        basicInfo={{
                            destinations: selectedDestinations.length > 0 ? selectedDestinations.map((d, idx) => ({
                                id: d.id,
                                city: d.name,
                                country: d.country || '',
                                countryCode: '',
                                airportCode: '',
                                checkIn: checkIn,
                                checkOut: checkOut,
                                nights: nights,
                                travelers: roomAllocations[idx] || roomAllocations[0]
                            })) : [{
                                id: 'placeholder',
                                city: 'Rim',
                                country: 'Italija',
                                countryCode: '',
                                airportCode: '',
                                checkIn: checkIn,
                                checkOut: checkOut,
                                nights: nights,
                                travelers: roomAllocations[0]
                            }],
                            travelers: {
                                adults: roomAllocations.reduce((s, r) => s + r.adults, 0),
                                children: roomAllocations.reduce((s, r) => s + r.children, 0),
                                childrenAges: roomAllocations.reduce((ages, r) => [...ages, ...r.childrenAges], [] as number[])
                            },
                            currency: 'EUR',
                            startDate: checkIn,
                            endDate: checkOut,
                            totalDays: nights
                        }}
                        data={[]}
                        onUpdate={() => { }}
                        onNext={() => { }}
                        onBack={() => setActiveTab('hotel')}
                    />
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
                    <div className="search-card-frame">
                        {/* ROW 1: DESTINATION */}
                        <div className="destination-row">
                            <div className="field-label"><MapPin size={14} /> Destinacija ili Smeštaj (do 3)</div>
                            <div className="destination-input-wrapper" ref={autocompleteRef}>
                                <div className="multi-destination-input premium" style={{ border: 'none', padding: 0, height: 'auto', background: 'transparent' }}>
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
                                            style={{ background: 'transparent', border: 'none', width: '100%', height: '100%', fontSize: '1rem', fontStyle: 'italic' }}
                                        />
                                    )}
                                </div>
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="autocomplete-dropdown premium" style={{ top: '100%', left: 0, right: 0, width: '100%' }}>
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
                        <div className="params-grid">
                            <div className="col-checkin param-item">
                                <div className="field-label"><CalendarIcon size={14} /> Check-in</div>
                                <div className="input-box" onClick={() => setActiveCalendar('in')} style={{ cursor: 'pointer' }}>
                                    {checkIn ? formatDate(checkIn) : <span style={{ color: '#64748b' }}>mm/dd/yyyy</span>}
                                </div>
                            </div>

                            <div className="col-checkout param-item">
                                <div className="field-label"><CalendarIcon size={14} /> Check-out</div>
                                <div className="input-box" onClick={() => setActiveCalendar('out')} style={{ cursor: 'pointer' }}>
                                    {checkOut ? formatDate(checkOut) : <span style={{ color: '#64748b' }}>mm/dd/yyyy</span>}
                                </div>
                            </div>

                            <div className="col-flex param-item">
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
                            </div>

                            <div className="col-stars param-item" style={{ position: 'relative' }}>
                                <div className="field-label"><Star size={14} /> Odaberi Kategoriju</div>
                                <div className="input-box" onClick={() => setShowStarPicker(!showStarPicker)} style={{ cursor: 'pointer' }}>
                                    <span style={{ fontSize: '0.85rem' }}>
                                        {selectedStars.includes('all') ? 'Sve kategorije' : `${selectedStars.length} odabrano`}
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

                            <div className="col-meals param-item" style={{ position: 'relative' }}>
                                <div className="field-label"><UtensilsCrossed size={14} /> Odaberi Uslugu</div>
                                <div className="input-box" onClick={() => setShowMealPicker(!showMealPicker)} style={{ cursor: 'pointer' }}>
                                    <span style={{ fontSize: '0.85rem' }}>
                                        {selectedMealPlans.includes('all') ? 'Sve usluge' : `${selectedMealPlans.length} odabrano`}
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

                            {/* Nationality Selector */}
                            <div className="col-nationality param-item" style={{ position: 'relative' }}>
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

                            {/* Room Configuration */}
                            <div className="col-rooms-tabs">
                                <div className="room-tabs-header" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                                    {roomAllocations.map((room, idx) => (
                                        <button
                                            key={idx}
                                            className={`room-tab-btn ${activeRoomTab === idx ? 'active' : ''} ${room.adults > 0 ? 'is-searching' : 'inactive'}`}
                                            onClick={() => {
                                                if (activeRoomTab === idx && idx !== 0) {
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
                                    <div className="passenger-row-redesign">
                                        <div className="flight-counter-group">
                                            <div className="field-label-mini"><Users size={14} /> ODRASLI</div>
                                            <div className="flight-counter-controls">
                                                <button className="flight-btn-counter" onClick={() => {
                                                    const newAlloc = [...roomAllocations];
                                                    newAlloc[activeRoomTab].adults = Math.max(1, newAlloc[activeRoomTab].adults - 1);
                                                    setRoomAllocations(newAlloc);
                                                }}>−</button>
                                                <span className="flight-counter-val">{roomAllocations[activeRoomTab].adults}</span>
                                                <button className="flight-btn-counter" onClick={() => {
                                                    const newAlloc = [...roomAllocations];
                                                    newAlloc[activeRoomTab].adults = Math.min(10, newAlloc[activeRoomTab].adults + 1);
                                                    setRoomAllocations(newAlloc);
                                                }}>+</button>
                                            </div>
                                        </div>

                                        <div className="flight-counter-group">
                                            <div className="field-label-mini"><Users2 size={14} /> DECA</div>
                                            <div className="flight-counter-controls">
                                                <button className="flight-btn-counter" onClick={() => {
                                                    const newAlloc = [...roomAllocations];
                                                    if (newAlloc[activeRoomTab].children > 0) {
                                                        newAlloc[activeRoomTab].children -= 1;
                                                        newAlloc[activeRoomTab].childrenAges.pop();
                                                        setRoomAllocations(newAlloc);
                                                    }
                                                }}>−</button>
                                                <span className="flight-counter-val">{roomAllocations[activeRoomTab].children}</span>
                                                <button className="flight-btn-counter" onClick={() => {
                                                    if (roomAllocations[activeRoomTab].children < 4) {
                                                        const newAlloc = [...roomAllocations];
                                                        newAlloc[activeRoomTab].children += 1;
                                                        newAlloc[activeRoomTab].childrenAges.push(7);
                                                        setRoomAllocations(newAlloc);
                                                    }
                                                }}>+</button>
                                            </div>
                                        </div>

                                        {roomAllocations[activeRoomTab].children > 0 && (
                                            <div className="children-ages-inline-flight">
                                                {roomAllocations[activeRoomTab].childrenAges.map((age, idx) => (
                                                    <div key={idx} className="age-input-compact" title={`${idx + 1}. DETE`}>
                                                        <input
                                                            type="number"
                                                            min="0" max="17"
                                                            value={age || ''}
                                                            placeholder="Godine"
                                                            onChange={e => {
                                                                const val = parseInt(e.target.value) || 0;
                                                                const newAlloc = [...roomAllocations];
                                                                newAlloc[activeRoomTab].childrenAges[idx] = Math.min(17, Math.max(0, val));
                                                                setRoomAllocations(newAlloc);
                                                            }}
                                                            className="child-age-input mini"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SEARCH BUTTONS ROW */}
                        <div className="action-row-container" style={{ display: 'flex', gap: '20px', alignItems: 'center', width: '100%', marginTop: '10px' }}>
                            <button className="btn-search-main" onClick={() => handleSearch()} disabled={isSearching} style={{ flex: '2' }}>
                                <span>{isSearching ? 'Pretražujem...' : <i>CLICK TO GET</i>}</span>
                            </button>
                            <button className="btn-new-search-tag" onClick={handleNewSearchTab}>
                                <Plus size={16} />
                                <span>POKRENI JOŠ JEDNU PRETRAGU</span>
                            </button>
                        </div>
                    </div>

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
                                                                setCheckOut(newOut.toISOString().split('T')[0]);
                                                                handleSearch({ checkIn: date, checkOut: newOut.toISOString().split('T')[0] });
                                                            }
                                                        }}
                                                    >
                                                        <div className="h-day-name">{new Date(date).toLocaleDateString('sr-RS', { weekday: 'short' })}</div>
                                                        <div className="h-day-num">{new Date(date).getDate()}</div>
                                                        <div className="h-status-icon">
                                                            {status.available ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                                        </div>
                                                        {status.price && <div className="h-price">{status.price}€</div>}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ERROR ALERT */}
                    {searchError && (
                        <div className="search-error animate-fade-in" style={{ marginTop: '2rem' }}>
                            <Info size={18} />
                            <span>{searchError}</span>
                        </div>
                    )}

                    {/* RESULTS SECTION */}
                    {searchPerformed && (
                        <div className="content-workflow animate-fade-in" style={{ marginTop: '3rem' }}>
                            <div className="filters-toolbar-v4 premium" style={{ display: 'flex', flexWrap: 'nowrap', gap: '16px', alignItems: 'center' }}>
                                <div className="name-filter-wrapper" style={{ flex: 1 }}>
                                    <Search size={14} className="filter-icon" />
                                    <input
                                        type="text"
                                        className="smart-input premium"
                                        placeholder="Traži po nazivu..."
                                        value={hotelNameFilter}
                                        onChange={(e) => setHotelNameFilter(e.target.value)}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <MultiSelectDropdown options={CATEGORY_OPTIONS} selected={selectedStars} onChange={setSelectedStars} placeholder="Kategorija" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <MultiSelectDropdown options={MEAL_PLAN_OPTIONS} selected={selectedMealPlans} onChange={setSelectedMealPlans} placeholder="Usluga" />
                                </div>
                                <div className="view-mode-switcher">
                                    <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={18} /></button>
                                    <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><ListIcon size={18} /></button>
                                    <button className={`view-btn ${viewMode === 'notepad' ? 'active' : ''}`} onClick={() => setViewMode('notepad')}><AlignLeft size={18} /></button>
                                </div>
                            </div>

                            <div className={`results-container ${viewMode}-view`}>
                                {viewMode === 'notepad' ? (
                                    <div className="notepad-view-v2 animate-fade-in" style={{ padding: '0', width: '100%' }}>
                                        {filteredResults.map((hotel, hIdx) => (
                                            <div key={hotel.id} className="hotel-notepad-card" style={{
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '20px',
                                                marginBottom: '2rem',
                                                overflow: 'hidden',
                                                boxShadow: 'var(--shadow-lg)'
                                            }}>
                                                {/* Header */}
                                                <div style={{
                                                    padding: '1.5rem 2rem',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                                        <h3
                                                            onClick={() => navigate('/hotel-view/' + hotel.id)}
                                                            style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                                                        >
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

                                                {/* Body */}
                                                <div style={{ padding: '2rem' }}>
                                                    {(() => {
                                                        const allRooms = (hotel.allocationResults && hotel.allocationResults[0] ? [...hotel.allocationResults[0]].sort((a, b) => (a.price || 0) - (b.price || 0)) : (hotel.rooms || [hotel]));
                                                        const activeMealFilter = notepadMealFilters[hotel.id] || 'all';
                                                        const filteredRooms = allRooms.filter(r => activeMealFilter === 'all' || (r.mealPlan || hotel.mealPlan) === activeMealFilter);
                                                        const uniqueMealPlans = Array.from(new Set(allRooms.map(r => r.mealPlan || hotel.mealPlan))).filter(Boolean);

                                                        return (
                                                            <>
                                                                {/* Stay Info & Offer Pill Row */}
                                                                <div style={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: '2.5fr 1.2fr 1fr 1.2fr 1fr',
                                                                    gap: '15px',
                                                                    alignItems: 'end',
                                                                    marginBottom: '1.5rem',
                                                                    padding: '0 25px'
                                                                }}>
                                                                    <div style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '12px',
                                                                        color: 'var(--text-secondary)',
                                                                        fontSize: '0.9rem',
                                                                        fontWeight: 600,
                                                                        background: 'rgba(255, 255, 255, 0.03)',
                                                                        padding: '8px 16px',
                                                                        borderRadius: '12px',
                                                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                                                        width: 'fit-content'
                                                                    }}>
                                                                        <CalendarDays size={16} className="text-indigo-400" />
                                                                        <span>
                                                                            {checkIn ? new Date(checkIn).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'} - {checkOut ? new Date(checkOut).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                                                        </span>
                                                                        <span style={{ opacity: 0.5 }}>|</span>
                                                                        <span style={{ color: 'var(--text-primary)' }}>{nights} noćenja</span>
                                                                    </div>

                                                                    {/* REDESIGNED MEAL FILTER - Now aligned with 'Usluga' column */}
                                                                    {allRooms.length > 10 ? (
                                                                        <div className="notepad-filter-section">
                                                                            <div className="notepad-filter-title">
                                                                                <Star size={12} fill="currentColor" />
                                                                                ODABERI USLUGU
                                                                            </div>
                                                                            <div className="notepad-filter-select-container">
                                                                                <select
                                                                                    className="notepad-filter-select-v2"
                                                                                    value={activeMealFilter}
                                                                                    onChange={(e) => setNotepadMealFilters(prev => ({ ...prev, [hotel.id]: e.target.value }))}
                                                                                >
                                                                                    <option value="all">Sve usluge</option>
                                                                                    {uniqueMealPlans.map(mp => (
                                                                                        <option key={mp} value={mp}>{getMealPlanDisplayName(mp)}</option>
                                                                                    ))}
                                                                                </select>
                                                                                <ChevronDown size={16} className="notepad-filter-chevron-v2" />
                                                                            </div>
                                                                        </div>
                                                                    ) : <div />}

                                                                    <div style={{
                                                                        gridColumn: '3 / span 3',
                                                                        display: 'flex',
                                                                        justifyContent: 'flex-end'
                                                                    }}>
                                                                        <div style={{
                                                                            background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                                                                            padding: '8px 24px',
                                                                            borderRadius: '20px',
                                                                            color: 'white',
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 800,
                                                                            fontStyle: 'italic',
                                                                            textTransform: 'uppercase',
                                                                            letterSpacing: '1px',
                                                                            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                                                                            width: 'fit-content'
                                                                        }}>
                                                                            {formatRoomConfigLabel(roomAllocations[0], 0)}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Table Header */}
                                                                <div className="room-header-v4">
                                                                    <div>{hotel.type === 'hotel' ? 'TIP SMEŠTAJA' : (hotel.type === 'transfer' ? 'TIP PREVOZA' : 'NAZIV')}</div>
                                                                    <div>{hotel.type === 'hotel' ? 'USLUGA' : 'DETALJI'}</div>
                                                                    <div>KAPACITET</div>
                                                                    <div>CENA (UKUPNO)</div>
                                                                    <div>AKCIJA</div>
                                                                </div>

                                                                {/* Room Rows */}
                                                                {filteredRooms.slice(0, 50).map((room: any, rIdx: number) => {
                                                                    const displayPrice = isSubagent ? getPriceWithMargin(room.price || hotel.price) : Number(room.price || hotel.price);
                                                                    return (
                                                                        <div key={rIdx} className="room-row-v4">
                                                                            {/* Name */}
                                                                            <div className="r-name">
                                                                                <span className="room-type-tag">
                                                                                    {cleanRoomName(room.name || hotel.name || 'Standardna Soba')}
                                                                                </span>
                                                                                {room.description && !room.description.includes('Dest:') && (
                                                                                    <span className="room-desc-mini">
                                                                                        {cleanRoomName(room.description)}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            {/* Service */}
                                                                            <div className="r-meal">
                                                                                <span className="meal-tag-v4">
                                                                                    {getMealPlanDisplayName(room.mealPlan || hotel.mealPlan)}
                                                                                </span>
                                                                            </div>
                                                                            {/* Capacity */}
                                                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                <Users size={14} />
                                                                                {roomAllocations[0].adults}+{roomAllocations[0].children}
                                                                            </div>
                                                                            {/* Price */}
                                                                            <div className="r-price">
                                                                                <span className="p-val">
                                                                                    {formatPrice(displayPrice)} EUR
                                                                                </span>
                                                                            </div>
                                                                            {/* Action */}
                                                                            <div>
                                                                                <button className="btn-book-v4" onClick={() => handleReserveClick(room, 0, hotel)}>
                                                                                    REZERVIŠI
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={`results-mosaic ${viewMode === 'list' ? 'list-layout' : 'grid-layout'}`}>
                                        {filteredResults.map(hotel => (
                                            <div key={hotel.id} className={`hotel-result-card-premium unified ${hotel.provider.toLowerCase().replace(/\s+/g, '')} ${viewMode === 'list' ? 'horizontal' : ''}`}>
                                                <div className="hotel-card-image" onClick={() => navigate('/hotel-view/' + hotel.id)}>
                                                    <img src={hotel.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800"} alt="" />
                                                    <div className="meal-plan-badge">{getMealPlanDisplayName(hotel.mealPlan)}</div>
                                                    <div className="hotel-stars-badge">
                                                        {Array(hotel.stars || 0).fill(0).map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
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
                                                            <span className="price-val">{formatPrice(getFinalDisplayPrice(hotel))} €</span>
                                                            {roomAllocations.filter(r => r.adults > 0).length > 1 && (
                                                                <span className="price-label-multi"># Za {roomAllocations.filter(r => r.adults > 0).length} sobe</span>
                                                            )}
                                                        </div>
                                                        {hotel.type === 'hotel' ? (
                                                            <button className="view-more-btn" onClick={() => setExpandedHotel(hotel)}>Detalji ponude <ArrowRight size={16} /></button>
                                                        ) : (
                                                            <button className="view-more-btn" onClick={() => handleReserveClick(hotel, 0, hotel)}>Rezerviši odmah <ArrowRight size={16} /></button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeCalendar && (
                        <ModernCalendar
                            startDate={checkIn} endDate={checkOut}
                            onChange={(s, e) => {
                                setCheckIn(s);
                                if (e) { setCheckOut(e); syncNightsFromDates(s, e); }
                                setActiveCalendar(null);
                            }}
                            onClose={() => setActiveCalendar(null)}
                        />
                    )}

                    {/* Hotel Details Modal Placeholder */}
                    {expandedHotel && !isBookingModalOpen && createPortal(
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
                                background: 'rgba(2, 6, 23, 0.95)',
                                backdropFilter: 'blur(20px) saturate(180%)',
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
                                    width: '95%'
                                }}
                            >
                                <div className="hotel-rooms-modal-header" style={{ padding: '12px 25px', background: '#1e293b' }}>
                                    <div className="modal-title-zone">
                                        <div className="modal-meta" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                            <span style={{ color: 'white', marginRight: '15px' }}>{expandedHotel.name.toUpperCase()}</span>
                                            <div style={{ marginRight: '15px', display: 'flex', gap: '2px', color: '#fbbf24' }}>
                                                {Array(expandedHotel.stars || 0).fill(0).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                                            </div>
                                            <MapPin size={14} /> {expandedHotel.location}
                                            <span style={{ marginLeft: '20px', color: '#fbbf24', fontWeight: 800 }}>
                                                Ukupna cena od: {formatPrice(getFinalDisplayPrice(expandedHotel))} EUR
                                            </span>
                                        </div>
                                    </div>
                                    <button className="close-modal-btn" onClick={() => setExpandedHotel(null)}><X size={18} /></button>
                                </div>
                                <div className="modal-body-v4">
                                    {roomAllocations.map((alloc, rIdx) => {
                                        if (alloc.adults === 0) return null;
                                        return (
                                            <div key={rIdx} className="room-allocation-section" style={{ marginTop: rIdx > 0 ? '30px' : '0' }}>
                                                <div className="section-divider-premium">
                                                    <span>{formatRoomConfigLabel(alloc, rIdx)}</span>
                                                </div>
                                                <div className="rooms-comparison-table">
                                                    <div className="room-header-v4">
                                                        <div className="h-room">TIP SMEŠTAJA</div>
                                                        <div className="h-servis">USLUGA</div>
                                                        <div className="h-cap">KAPACITET</div>
                                                        <div className="h-price">CENA (UKUPNO)</div>
                                                        <div className="h-action">AKCIJA</div>
                                                    </div>

                                                    {(expandedHotel.allocationResults && expandedHotel.allocationResults[rIdx]) ? (
                                                        expandedHotel.allocationResults[rIdx].map((room: any, idx: number) => (
                                                            <div key={room.id || idx} className="room-row-v4">
                                                                <div className="r-name">
                                                                    <span className="room-type-tag">{cleanRoomName(room.name || 'Standardna Soba')}</span>
                                                                    {room.description && !room.description.includes('Dest:') && (
                                                                        <span className="room-desc-mini">{cleanRoomName(room.description)}</span>
                                                                    )}
                                                                </div>
                                                                <div className="r-servis">
                                                                    <span className="meal-tag-v4">{getMealPlanDisplayName(room.mealPlan || expandedHotel.mealPlan)}</span>
                                                                </div>
                                                                <div className="r-cap"><Users size={14} /> {room.capacity || `${alloc.adults}+${alloc.children}`}</div>
                                                                <div className="r-price">
                                                                    <span className="notepad-price" style={{ fontSize: '1rem', fontWeight: 800, fontStyle: 'italic' }}>
                                                                        {isSubagent ? getPriceWithMargin(room.price) : Math.round(Number(room.price))} EUR
                                                                    </span>
                                                                </div>
                                                                <div className="r-action">
                                                                    <button className="btn-book-v4" onClick={() => handleReserveClick(room, rIdx)}>Rezerviši</button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="room-row-v4">
                                                            <div className="r-name"><span className="room-type-tag">Standardna Soba</span></div>
                                                            <div className="r-servis"><span className="meal-tag-v4">{getMealPlanDisplayName(expandedHotel.mealPlan)}</span></div>
                                                            <div className="r-cap"><Users size={14} /> {alloc.adults}+{alloc.children}</div>
                                                            <div className="r-price">
                                                                <span className="notepad-price" style={{ fontSize: '1rem', fontWeight: 800, fontStyle: 'italic' }}>
                                                                    {isSubagent ? getPriceWithMargin(expandedHotel.price) : Math.round(Number(expandedHotel.price))} EUR
                                                                </span>
                                                            </div>
                                                            <div className="r-action">
                                                                <button className="btn-book-v4" onClick={() => handleReserveClick({ id: 'default', name: 'Standardna Soba', price: expandedHotel.price }, rIdx)}>Rezerviši</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
                                    <button onClick={() => setExpandedHotel(null)} className="btn-search-main" style={{ maxWidth: '200px' }}>Zatvori Detalje</button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
                </>
            )}
        </div>
    );
};

export default GlobalHubSearch;
