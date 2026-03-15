import React, { useState, useEffect, useRef } from 'react';
import { 
  Hotel, 
  Plane, 
  Package, 
  Truck, 
  Compass, 
  Mountain,
  MapPin, 
  Calendar, 
  Users, 
  Search, 
  RefreshCw,
  Plus,
  X,
  ChevronDown,
  Navigation,
  Globe,
  Settings,
  History,
  Star,
  Zap,
  LayoutGrid,
  Map as MapIcon,
  AlignLeft,
  Filter,
  ArrowLeftRight,
  Database,
  Menu,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Building2,
  UtensilsCrossed
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { performSmartSearch, type SmartSearchResult } from '../services/smartSearchService';
import { searchPrefetchService } from '../services/searchPrefetchService';
import { useAuthStore, useThemeStore } from '../stores';
import { HotelCard } from './SmartSearch/components/HotelCard';
import './SmartSearchV2.css';

interface Destination {
    id: string;
    name: string;
    type: 'destination' | 'hotel' | 'country';
    country?: string;
}

// --- CONSTANTS & HELPERS FROM V1 ---
const MEAL_PLAN_OPTIONS = [
    { value: 'all', label: 'Sve Usluge' },
    { value: 'RO', label: 'Samo smeštaj' },
    { value: 'BB', label: 'Doručak' },
    { value: 'HB', label: 'Polupansion' },
    { value: 'FB', label: 'Pun pansion' },
    { value: 'AI', label: 'All Inclusive+' },
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

interface RoomAllocation {
    adults: number;
    children: number;
    childrenAges: number[];
}

const SmartSearchV2: React.FC = () => {
    const navigate = useNavigate();
    const { userLevel, impersonatedSubagent } = useAuthStore();
    const isSubagent = userLevel < 6 || !!impersonatedSubagent;
    const { theme } = useThemeStore();
    const isActuallyDark = theme === 'navy' || (theme as string) === 'dark';
    const isLightMode = theme === 'light' || (theme as string) === 'standard' || (theme as string) === 'white';

    // UI States
    const [activeTab, setActiveTab] = useState<'hotel' | 'flight' | 'package' | 'charter' | 'trip' | 'transfer' | 'excursion' | 'ski'>('hotel');
    const [searchPhase, setSearchPhase] = useState<'idle' | 'searching' | 'results'>('idle');
    const [viewMode, setViewMode] = useState<'grid' | 'notepad' | 'strip' | 'map'>('grid');
    const [sortBy, setSortBy] = useState<'smart' | 'price_low' | 'price_high'>('smart');

    // Search Fields
    const [destinationInput, setDestinationInput] = useState('');
    const [selectedDestinations, setSelectedDestinations] = useState<Destination[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<Destination[]>([]);
    
    // Dates & Nights Logic
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

    // Travelers & Rooms
    const [rooms, setRooms] = useState(1);
    const [roomAllocations, setRoomAllocations] = useState<RoomAllocation[]>([
        { adults: 2, children: 0, childrenAges: [] },
        { adults: 0, children: 0, childrenAges: [] },
        { adults: 0, children: 0, childrenAges: [] },
        { adults: 0, children: 0, childrenAges: [] },
        { adults: 0, children: 0, childrenAges: [] }
    ]);
    const [showPaxPicker, setShowPaxPicker] = useState(false);

    // Filter States (Accommodation)
    const [selectedStars, setSelectedStars] = useState<string[]>([]);
    const [mealPlan, setMealPlan] = useState('all');
    const [budgetFrom, setBudgetFrom] = useState('');
    const [budgetTo, setBudgetTo] = useState('');
    const [budgetType, setBudgetType] = useState<'total' | 'person' | 'room'>('person');
    const [flexibility, setFlexibility] = useState(0);
    const [nationality, setNationality] = useState('RS');

    // Results Store
    const [searchResults, setSearchResults] = useState<SmartSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // --- SEARCH MODES & MODALS ---
    const [searchMode, setSearchMode] = useState<'classic' | 'semantic'>('classic');
    const [showApiSelector, setShowApiSelector] = useState(false);
    const [activeApis, setActiveApis] = useState<string[]>(['Solvex', 'Amadeus']);
    const [showHistorySidebar, setShowHistorySidebar] = useState(false);
    const [enabledProviders, setEnabledProviders] = useState({
        opengreece: false, tct: false, solvex: true, solvexai: true, ors: false, filos: false, mtsglobe: false
    });

    // --- FLIGHT SPECIFIC STATES ---
    const [originInput, setOriginInput] = useState('');
    const [selectedOrigin, setSelectedOrigin] = useState<Destination | null>(null);
    const [tripType, setTripType] = useState<'round-trip' | 'one-way' | 'multi-city'>('round-trip');
    const [cabinClass, setCabinClass] = useState('economy');
    const [directFlightsOnly, setDirectFlightsOnly] = useState(false);
    const [maxStops, setMaxStops] = useState<'direct' | '1' | '2' | 'all'>('all');
    const [flightFlexibility, setFlightFlexibility] = useState(0);
    const [depTimeRange, setDepTimeRange] = useState({ start: '00:00', end: '23:59' });
    const [arrTimeRange, setArrTimeRange] = useState({ start: '00:00', end: '23:59' });
    const [retDepTimeRange, setRetDepTimeRange] = useState({ start: '00:00', end: '23:59' });
    const [retArrTimeRange, setRetArrTimeRange] = useState({ start: '00:00', end: '23:59' });
    const [showAdvanced, setShowAdvanced] = useState(false);

    // --- WIZARD / PACKAGE STATES ---
    const [packageMode, setPackageMode] = useState<'manual' | 'ai'>('manual');

    // --- DATE POPOVERS ---
    const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
    const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);

    // --- AUTOCOMPLETE REFS ---
    const destinationInputRef = useRef<HTMLInputElement>(null);
    const originInputRef = useRef<HTMLInputElement>(null);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Mock/Dictionary Search
    const mockSuggestions: Destination[] = [
        { id: 'BG', name: 'Bulgaria', type: 'country' },
        { id: 'GR', name: 'Greece', type: 'country' },
        { id: 'TR', name: 'Turkey', type: 'country' },
        { id: 'RS-9', name: 'Bansko', type: 'destination', country: 'Bulgaria' },
        { id: 'RS-33', name: 'Golden Sands', type: 'destination', country: 'Bulgaria' },
        { id: 'RS-68', name: 'Sunny Beach', type: 'destination', country: 'Bulgaria' },
        { id: 'H1', name: 'Hotel Melia Grand Hermitage', type: 'hotel', country: 'Bulgaria' },
        { id: 'H2', name: 'Hotel Barcelo Royal Beach', type: 'hotel', country: 'Bulgaria' },
    ];

    // --- LOGIC: Prefetch Subscription ---
    useEffect(() => {
        const unsubscribe = searchPrefetchService.subscribe('SmartSearchV2', {
            onStart: () => setIsSearching(true),
            onEnd: () => setIsSearching(false),
            onComplete: (results, key) => {
                const currentSearchKey = searchPrefetchService.buildKey({
                    destinations: selectedDestinations as any,
                    checkIn,
                    checkOut,
                    allocations: roomAllocations,
                    mealPlan: mealPlan,
                    nationality,
                    searchType: activeTab
                });

                // Only update if it's the current search or if we are in results phase
                if (key === currentSearchKey || searchPhase === 'results') {
                    setSearchResults(results);
                }
            }
        });
        return () => unsubscribe();
    }, [selectedDestinations, checkIn, checkOut, roomAllocations, mealPlan, nationality, activeTab, searchPhase]);

    // Schedule prefetch on any relevant change
    useEffect(() => {
        if (selectedDestinations.length > 0) {
            searchPrefetchService.schedule({
                destinations: selectedDestinations as any,
                checkIn,
                checkOut,
                allocations: roomAllocations,
                mealPlan: mealPlan,
                nationality,
                searchType: activeTab,
                enabledProviders: enabledProviders
            }, 800); // More aggressive debounce for V2
        }
    }, [selectedDestinations, checkIn, checkOut, roomAllocations, mealPlan, nationality, activeTab, enabledProviders]);

    const handleManualCheckOutChange = (date: string) => {
        setCheckOut(date);
        if (checkIn && date) {
            const start = new Date(checkIn);
            const end = new Date(date);
            const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            if (diff > 0) setNights(diff);
        }
    };

    const addTarget = (target: Destination) => {
        if (!selectedDestinations.find(d => d.id === target.id) && selectedDestinations.length < 3) {
            setSelectedDestinations([...selectedDestinations, target]);
        }
        setDestinationInput('');
        setShowSuggestions(false);
    };

    // Update suggestions based on input
    useEffect(() => {
        if (destinationInput.length >= 2) {
            const matches = mockSuggestions.filter(s => 
                s.name.toLowerCase().includes(destinationInput.toLowerCase())
            );
            setSuggestions(matches);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    }, [destinationInput]);

    useEffect(() => {
        if (!checkIn) return;
        const start = new Date(checkIn);
        const end = new Date(start);
        end.setDate(start.getDate() + nights);
        const newOut = end.toISOString().split('T')[0];
        if (newOut !== checkOut) {
            setCheckOut(newOut);
        }
    }, [checkIn, nights]);

    // Handle room count change
    useEffect(() => {
        if (rooms > roomAllocations.length) {
            const diff = rooms - roomAllocations.length;
            const newRooms = [...roomAllocations];
            for (let i = 0; i < diff; i++) {
                newRooms.push({ adults: 0, children: 0, childrenAges: [] });
            }
            setRoomAllocations(newRooms);
        } else if (rooms < roomAllocations.length) {
            setRoomAllocations(roomAllocations.slice(0, rooms));
        }
    }, [rooms]);

    const updateRoomConfig = (index: number, adults: number, children: number, childrenAges: number[]) => {
        const newConfigs = [...roomAllocations];
        newConfigs[index] = { adults, children, childrenAges };
        setRoomAllocations(newConfigs);
    };

    const removeRoom = (index: number) => {
        if (roomAllocations.length > 1) {
            const newConfigs = roomAllocations.filter((_, i) => i !== index);
            setRoomAllocations(newConfigs);
            setRooms(newConfigs.length);
        }
    };

    // --- LOGIC: Search Execution ---
    const startSearch = async () => {
        if (activeTab === 'hotel') {
            await startHotelSearch();
        } else if (activeTab === 'flight') {
            await startFlightSearch();
        } else if (activeTab === 'package') {
            navigate('/package-search', { state: { 
                initialDestinations: selectedDestinations,
                initialCheckIn: checkIn,
                initialCheckOut: checkOut,
                initialTravelers: roomAllocations
            }});
        } else {
            console.log(`Search for tab ${activeTab} not yet implemented`);
            setSearchError(`Pretraga za ${activeTab} je u pripremi.`);
        }
    };

    const startHotelSearch = async () => {
        console.log('[SmartSearchV2] Hotel search starting...');
        let finalDestinations = [...selectedDestinations];
        
        if (finalDestinations.length === 0 && destinationInput.length >= 2) {
            const matches = mockSuggestions.filter(s => 
                s.name.toLowerCase().includes(destinationInput.toLowerCase())
            );
            if (matches.length > 0) {
                finalDestinations = [matches[0] as Destination];
                setSelectedDestinations(finalDestinations);
            }
        }

        if (finalDestinations.length === 0) return;

        setSearchPhase('results');
        setIsSearching(true);

        const currentKey = searchPrefetchService.buildKey({
            destinations: finalDestinations as any,
            checkIn,
            checkOut,
            allocations: roomAllocations,
            mealPlan: mealPlan,
            nationality,
            searchType: activeTab
        });

        const inFlight = searchPrefetchService.getInFlight(currentKey);
        if (inFlight) {
            try {
                const results = await inFlight;
                setSearchResults(results);
                setIsSearching(false);
                return;
            } catch (e) {
                console.error('[SmartSearchV2] In-flight prefetch failed');
            }
        }

        const enabledProviders: Record<string, boolean> = {};
        activeApis.forEach(api => {
            const key = api.toLowerCase().replace(/\s+/g, '');
            enabledProviders[key] = true;
        });

        try {
            const results = await performSmartSearch({
                searchType: 'hotel',
                destinations: finalDestinations as any,
                checkIn,
                checkOut,
                roomConfig: roomAllocations.filter(r => r.adults > 0),
                mealPlan: mealPlan !== 'all' ? mealPlan : undefined,
                stars: selectedStars.length === 0 ? undefined : selectedStars,
                flexibility: flexibility,
                nationality: nationality,
                enabledProviders
            });
            setSearchResults(results);
            searchPrefetchService.notifyResultsUpdated(results);
        } catch (err) {
            console.error('[SmartSearchV2] Hotel search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const startFlightSearch = async () => {
        console.log('[SmartSearchV2] Flight search starting...');
        setIsSearching(true);
        setSearchPhase('results');

        try {
            const flightMgr = (await import('../services/flight/flightSearchManager')).default;
            const params = {
                origin: originInput,
                destination: destinationInput,
                departureDate: checkIn,
                returnDate: tripType === 'round-trip' ? checkOut : undefined,
                adults: roomAllocations.reduce((s: number, r: any) => s + (r.adults || 0), 0),
                children: roomAllocations.reduce((s: number, r: any) => s + (r.children || 0), 0),
                childrenAges: roomAllocations.flatMap(r => r.childrenAges),
                cabinClass: cabinClass as any,
                directFlightsOnly,
                maxStops: maxStops === 'all' ? undefined : (maxStops === 'direct' ? 0 : parseInt(maxStops)),
                flexibleDates: flightFlexibility,
                outboundDepartureFrom: depTimeRange.start,
                outboundDepartureTo: depTimeRange.end,
                outboundArrivalFrom: arrTimeRange.start,
                outboundArrivalTo: arrTimeRange.end,
                inboundDepartureFrom: retDepTimeRange.start,
                inboundDepartureTo: retDepTimeRange.end,
                inboundArrivalFrom: retArrTimeRange.start,
                inboundArrivalTo: retArrTimeRange.end,
            };

            const response = await flightMgr.searchFlights(params);
            
            // Map to a consistent format for the results grid
            if (response.offers) {
                const mapped = response.offers.map(o => ({
                    id: o.id,
                    hotelName: `${o.slices[0].segments[0].carrierName} - Flight`,
                    cityName: `${o.slices[0].origin.iataCode} ✈ ${o.slices[0].destination.iataCode}`,
                    price: o.price.total,
                    currency: o.price.currency,
                    mainImage: `https://images.kiwi.com/airlines/64/${o.slices[0].segments[0].carrierCode}.png`,
                    stars: '5',
                    provider: o.provider,
                    type: 'flight'
                }));
                // @ts-ignore
                setSearchResults(mapped);
            }
        } catch (err) {
            console.error('[SmartSearchV2] Flight search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    // --- COMPONENTS: Helper Renders ---
    const tabs = [
        { id: 'hotel', label: 'Smeštaj', icon: Hotel },
        { id: 'flight', label: 'Letovi', icon: Plane },
        { id: 'package', label: 'Wizard', icon: Package },
        { id: 'charter', label: 'Čarter', icon: Navigation },
        { id: 'trip', label: 'Putovanja', icon: Compass },
        { id: 'transfer', label: 'Transfer', icon: Truck },
        { id: 'ski', label: 'Ski', icon: Mountain },
    ];

    return (
        <div className={`ss-v2-container ${isLightMode ? 'light-mode' : ''}`}>
            
            {/* 1. TOP HEADER ACTIONS (Top Right) */}
            <AnimatePresence>
                {searchPhase === 'idle' && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="ss-v2-top-actions"
                    >
                        <div className="ss-v2-top-right-actions">
                            <div className="search-mode-toggle-v2">
                                <button 
                                    className={searchMode === 'classic' ? 'active' : ''} 
                                    onClick={() => setSearchMode('classic')}
                                >
                                    Klasična
                                </button>
                                <button 
                                    className={searchMode === 'semantic' ? 'active' : ''} 
                                    onClick={() => setSearchMode('semantic')}
                                >
                                    Semantic
                                </button>
                            </div>

                            <div className="api-selector-trigger-v2" onClick={() => setShowApiSelector(!showApiSelector)}>
                                <Database size={16} />
                                <span className="api-count">{activeApis.length}</span>
                                <ChevronDown size={14} />

                                <AnimatePresence>
                                    {showApiSelector && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="api-popup-v2"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <div className="api-popup-header-v2">API KONEKCIJE</div>
                                            <div className="api-list-v2">
                                                {['Solvex', 'Amadeus', 'Sabre', 'Hotelston', 'WebBeds'].map(api => (
                                                    <div 
                                                        key={api} 
                                                        className={`api-item-v2 ${activeApis.includes(api) ? 'active' : ''}`}
                                                        onClick={() => {
                                                            if (activeApis.includes(api)) {
                                                                setActiveApis(activeApis.filter(a => a !== api));
                                                            } else {
                                                                setActiveApis([...activeApis, api]);
                                                            }
                                                        }}
                                                    >
                                                        <div className="api-dot"></div>
                                                        {api}
                                                    </div>
                                                ))}
                                            </div>
                                            <button className="api-apply-btn-v2" onClick={() => setShowApiSelector(false)}>
                                                PRIMENI
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. CENTER TABS (Original Position) */}
            <AnimatePresence>
                {searchPhase === 'idle' && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ss-v2-top-nav"
                    >
                        {tabs.map(tab => (
                            <button 
                                key={tab.id}
                                className={`nav-item-v2 ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id as any)}
                            >
                                <tab.icon size={22} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. MAIN SEARCH AREA */}
            <AnimatePresence mode="wait">
                {searchPhase !== 'results' && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50, height: 0 }}
                        className="ss-v2-search-area"
                    >

                        <div className="global-search-bar">
                            <AnimatePresence mode="wait">
                                {activeTab === 'flight' ? (
                                    <motion.div 
                                        key="flight-bar"
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        exit={{ opacity: 0 }}
                                        className="flight-search-container-v2"
                                    >
                                        <div className="flight-options-top-v2">
                                            <div className="trip-type-pills-v2">
                                                <button className={tripType === 'round-trip' ? 'active' : ''} onClick={() => setTripType('round-trip')}>
                                                    <ArrowLeftRight size={14} /> POVRATNA KARTA
                                                </button>
                                                <button className={tripType === 'one-way' ? 'active' : ''} onClick={() => setTripType('one-way')}>
                                                    <Plane size={14} rotate={45} /> U JEDNOM PRAVCU
                                                </button>
                                                <button className={tripType === 'multi-city' ? 'active' : ''} onClick={() => setTripType('multi-city')}>
                                                    <Globe size={14} /> VIŠE DESTINACIJA
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flight-main-row-v2">
                                            <div className="f-input-group polaziste">
                                                <div className="f-input-wrapper">
                                                    <Search size={16} className="f-icon" />
                                                    <input 
                                                        ref={originInputRef}
                                                        type="text" 
                                                        placeholder="POLAZIŠTE"
                                                        value={originInput}
                                                        onChange={(e) => setOriginInput(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <button className="f-swap-btn" onClick={() => {
                                                const temp = originInput;
                                                setOriginInput(destinationInput);
                                                setDestinationInput(temp);
                                            }}>
                                                <ArrowLeftRight size={16} />
                                            </button>

                                            <div className="f-input-group odrediste">
                                                <div className="f-input-wrapper">
                                                    <Search size={16} className="f-icon" />
                                                    <input 
                                                        type="text" 
                                                        placeholder="ODREDIŠTE"
                                                        value={destinationInput}
                                                        onChange={(e) => setDestinationInput(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="f-input-group datum" onClick={() => setShowCheckInCalendar(!showCheckInCalendar)}>
                                                <div className="f-date-display">
                                                    <span>{formatDate(checkIn)} - {tripType === 'round-trip' ? formatDate(checkOut) : 'JEDAN PRAVAC'}</span>
                                                    <CalendarIcon size={16} />
                                                </div>
                                                <AnimatePresence>
                                                    {showCheckInCalendar && (
                                                        <CalendarPicker 
                                                            selectedDate={checkIn} 
                                                            selectedEndDate={tripType === 'round-trip' ? checkOut : null}
                                                            rangeMode={tripType === 'round-trip'}
                                                            onSelect={(start: string, end?: string) => { 
                                                                setCheckIn(start); 
                                                                if (end) setCheckOut(end);
                                                                if (tripType !== 'round-trip' || end) setShowCheckInCalendar(false); 
                                                            }} 
                                                            onClose={() => setShowCheckInCalendar(false)}
                                                            isLightMode={isLightMode}
                                                        />
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        <div className="flight-sub-row-v2">
                                            <div className="f-main-actions-v2">
                                                <div className="f-pax-class-v2" onClick={() => setShowPaxPicker(!showPaxPicker)}>
                                                    <div className="f-pax-content">
                                                        <div className="f-pax-summary">
                                                            <strong>{roomAllocations[0].adults}</strong> ODRASLIH, <strong>{roomAllocations[0].children}</strong> DECA
                                                        </div>
                                                        <div className="f-class-badge">
                                                            KLASA: <strong>{cabinClass === 'economy' ? 'Ekonomska' : cabinClass === 'business' ? 'Biznis' : 'Prva'}</strong>
                                                        </div>
                                                    </div>

                                                    <AnimatePresence>
                                                        {showPaxPicker && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.95 }}
                                                                className="f-pax-popover-v2"
                                                                onClick={e => e.stopPropagation()}
                                                            >
                                                                <div className="pax-header-v2">PUTNICI I KLASA</div>
                                                                <div className="pax-group-v2">
                                                                    <div className="pax-type">
                                                                        <label>Odrasli</label>
                                                                        <div className="pax-ctrl">
                                                                            <button onClick={() => updateRoomConfig(0, Math.max(1, roomAllocations[0].adults - 1), roomAllocations[0].children, roomAllocations[0].childrenAges)}>-</button>
                                                                            <span>{roomAllocations[0].adults}</span>
                                                                            <button onClick={() => updateRoomConfig(0, roomAllocations[0].adults + 1, roomAllocations[0].children, roomAllocations[0].childrenAges)}>+</button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="pax-type">
                                                                        <label>Deca</label>
                                                                        <div className="pax-ctrl">
                                                                            <button onClick={() => updateRoomConfig(0, roomAllocations[0].adults, Math.max(0, roomAllocations[0].children - 1), roomAllocations[0].childrenAges.slice(0, -1))}>-</button>
                                                                            <span>{roomAllocations[0].children}</span>
                                                                            <button onClick={() => updateRoomConfig(0, roomAllocations[0].adults, roomAllocations[0].children + 1, [...roomAllocations[0].childrenAges, 7])}>+</button>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {roomAllocations[0].children > 0 && (
                                                                    <div className="pax-children-ages-v2">
                                                                        <label>Godine dece</label>
                                                                        <div className="ages-grid-v2">
                                                                            {roomAllocations[0].childrenAges.map((age, idx) => (
                                                                                <input 
                                                                                    key={idx}
                                                                                    type="number" 
                                                                                    min="0" max="17" 
                                                                                    value={age} 
                                                                                    onChange={(e) => {
                                                                                        const newAges = [...roomAllocations[0].childrenAges];
                                                                                        newAges[idx] = parseInt(e.target.value) || 0;
                                                                                        updateRoomConfig(0, roomAllocations[0].adults, roomAllocations[0].children, newAges);
                                                                                    }}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="class-picker-v2">
                                                                    <label>Klasa</label>
                                                                    <div className="class-options-v2">
                                                                        {[
                                                                            {id: 'economy', label: 'Ekonomska'},
                                                                            {id: 'premium_economy', label: 'Premium'},
                                                                            {id: 'business', label: 'Biznis'},
                                                                            {id: 'first', label: 'Prva'}
                                                                        ].map(c => (
                                                                            <button key={c.id} className={cabinClass === c.id ? 'active' : ''} onClick={() => setCabinClass(c.id)}>
                                                                                {c.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <button className="pax-done-v2" onClick={() => setShowPaxPicker(false)}>GOTOVO</button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                <div className="f-action-buttons">

                                                    <button className={`f-btn-advanced-toggle ${showAdvanced ? 'active' : ''}`} onClick={() => setShowAdvanced(!showAdvanced)}>
                                                        <Filter size={16} /> 
                                                        <span>Napredna pretraga</span>
                                                        <motion.div
                                                            animate={{ rotate: showAdvanced ? 180 : 0 }}
                                                            transition={{ duration: 0.3 }}
                                                        >
                                                            <ChevronDown size={14} />
                                                        </motion.div>
                                                    </button>
                                                    
                                                    {!showAdvanced && (
                                                        <button 
                                                            className="search-bar-trigger-v2 flight-compact" 
                                                            onClick={(e) => { e.stopPropagation(); startSearch(); }}
                                                        >
                                                            <Search size={18} />
                                                            <span>TRAŽI</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="search-sections-row">
                                        <div className="search-section section-flex">
                                            <div className="flex-pills-v2">
                                                {[0, 1, 3, 5].map(d => (
                                                    <button 
                                                        key={d} 
                                                        className={flexibility === d ? 'active' : ''} 
                                                        onClick={() => setFlexibility(d)}
                                                    >
                                                        {d === 0 ? 'Tačno' : `±${d}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {/* DESTINATION / GDE PUTUJETE */}
                                        <div className="search-section section-destination">
                                            <div className="destination-input-wrapper-v2">
                                                <div className="dest-chips-container-v2">
                                                    {selectedDestinations.map(d => (
                                                        <div key={d.id} className="dest-tag-v2">
                                                            {d.type === 'hotel' ? <Building2 size={12} /> : <MapPin size={12} />}
                                                            <span>{d.name}</span>
                                                            <X size={12} className="tag-remove" onClick={(e) => { e.stopPropagation(); setSelectedDestinations(selectedDestinations.filter(x => x.id !== d.id)); }} />
                                                        </div>
                                                    ))}
                                                    {selectedDestinations.length < 3 && (
                                                        <input 
                                                            type="text" 
                                                            placeholder={selectedDestinations.length === 0 ? "Država, mesto ili hotel..." : "Dodaj još..."}
                                                            value={destinationInput}
                                                            onChange={(e) => setDestinationInput(e.target.value)}
                                                            onFocus={() => destinationInput.length >= 2 && setShowSuggestions(true)}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {showSuggestions && suggestions.length > 0 && (
                                                <div className="ac-dropdown-v2">
                                                    <div className="ac-header">PREPORUKE</div>
                                                    {suggestions.map(s => (
                                                        <div key={s.id} className="ac-item-v2" onClick={() => addTarget(s)}>
                                                            <div className="ac-icon">
                                                                {s.type === 'country' ? <Globe size={16} /> : s.type === 'hotel' ? <Building2 size={16} /> : <MapPin size={16} />}
                                                            </div>
                                                            <div className="ac-label">
                                                                <span className="ac-name">{s.name}</span>
                                                                <span className="ac-sub">{s.country || (s.type === 'country' ? 'Država' : 'Mesto')}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="search-section section-dates">
                                            <div className="date-field" onClick={() => setShowCheckInCalendar(!showCheckInCalendar)}>
                                                <div className="custom-date-display">{formatDate(checkIn)}</div>
                                                <AnimatePresence>
                                                    {showCheckInCalendar && (
                                                        <CalendarPicker 
                                                            selectedDate={checkIn} 
                                                            onSelect={(d: string) => { setCheckIn(d); setShowCheckInCalendar(false); }} 
                                                            onClose={() => setShowCheckInCalendar(false)}
                                                            isLightMode={isLightMode}
                                                        />
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <div className="nights-counter">
                                                <input 
                                                    type="number" 
                                                    value={nights} 
                                                    onChange={(e) => setNights(parseInt(e.target.value) || 0)} 
                                                />
                                            </div>
                                            <div className="date-field" onClick={() => setShowCheckOutCalendar(!showCheckOutCalendar)}>
                                                <div className="custom-date-display">{formatDate(checkOut)}</div>
                                                <AnimatePresence>
                                                    {showCheckOutCalendar && (
                                                        <CalendarPicker 
                                                            selectedDate={checkOut} 
                                                            onSelect={(d: string) => { handleManualCheckOutChange(d); setShowCheckOutCalendar(false); }} 
                                                            onClose={() => setShowCheckOutCalendar(false)}
                                                            minDate={checkIn}
                                                            isLightMode={isLightMode}
                                                        />
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        {activeTab === 'hotel' && (
                                            <div className="search-section section-flexibility">
                                                <label>FLEKSIBILNOST</label>
                                                <div className="flexi-input-v2">
                                                    <span>±</span>
                                                    <input 
                                                        type="number" 
                                                        value={flexibility} 
                                                        onChange={(e) => setFlexibility(parseInt(e.target.value) || 0)} 
                                                        min="0"
                                                        max="7"
                                                    />
                                                    <span className="unit">dana</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="search-section section-rooms">
                                            <label>SOBE</label>
                                            <input 
                                                type="number" 
                                                value={rooms} 
                                                onChange={(e) => setRooms(parseInt(e.target.value) || 1)} 
                                                min="1"
                                                max="5"
                                            />
                                        </div>

                                        <div className="search-section section-pax" onClick={() => setShowPaxPicker(!showPaxPicker)}>
                                            <div className="pax-display-v2">
                                                <Users size={16} />
                                                <span>
                                                    {roomAllocations.reduce((acc: number, r: any) => acc + (r.adults || 0) + (r.children || 0), 0)} Putnika ({roomAllocations.filter(r => (r.adults || 0) + (r.children || 0) > 0).length} Sobe)
                                                </span>
                                                <ChevronDown size={14} />
                                            </div>

                                            <AnimatePresence>
                                                {showPaxPicker && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="h-pax-popover-v2"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <div className="pax-popover-header">RASPORED PO SOBAMA</div>
                                                        <div className="room-allocation-list-v2">
                                                            {roomAllocations.map((room, rIdx) => (
                                                                <div key={rIdx} className={`room-row-v2 ${rIdx >= rooms ? 'disabled' : ''}`}>
                                                                    <div className="room-label-v2">SOBA {rIdx + 1}</div>
                                                                    <div className="room-controls-v2">
                                                                        <div className="ctrl-item">
                                                                            <span className="ctrl-label">Odrasli</span>
                                                                            <div className="ctrl-btns">
                                                                                <button onClick={() => updateRoomConfig(rIdx, Math.max(0, room.adults - 1), room.children, room.childrenAges)}>-</button>
                                                                                <span>{room.adults}</span>
                                                                                <button onClick={() => updateRoomConfig(rIdx, Math.min(4, room.adults + 1), room.children, room.childrenAges)}>+</button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="ctrl-item">
                                                                            <span className="ctrl-label">Deca</span>
                                                                            <div className="ctrl-btns">
                                                                                <button onClick={() => updateRoomConfig(rIdx, room.adults, Math.max(0, room.children - 1), room.childrenAges.slice(0, -1))}>-</button>
                                                                                <span>{room.children}</span>
                                                                                <button onClick={() => updateRoomConfig(rIdx, room.adults, Math.min(3, room.children + 1), [...room.childrenAges, 7])}>+</button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {room.children > 0 && (
                                                                        <div className="child-ages-v2">
                                                                            {room.childrenAges.map((age, cIdx) => (
                                                                                <div key={cIdx} className="age-input-v2">
                                                                                    <label>Dete {cIdx + 1}</label>
                                                                                    <input 
                                                                                        type="number" 
                                                                                        min="0" max="17" 
                                                                                        value={age} 
                                                                                        onChange={(e) => {
                                                                                            const newAges = [...room.childrenAges];
                                                                                            newAges[cIdx] = parseInt(e.target.value) || 0;
                                                                                            updateRoomConfig(rIdx, room.adults, room.children, newAges);
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="pax-popover-footer">
                                                            <button className="pax-apply-btn" onClick={() => setShowPaxPicker(false)}>PRIMENI</button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            <div className="search-section section-actions-h">
                                                <button className={`h-btn-advanced-toggle ${showAdvanced ? 'active' : ''}`} onClick={() => setShowAdvanced(!showAdvanced)}>
                                                    <Filter size={16} />
                                                </button>
                                                <button className="search-bar-trigger-v2 hotel-btn" onClick={startSearch}>
                                                    <Search size={22} />
                                                    <span>TRAŽI</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        <AnimatePresence>
                            {showAdvanced && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                    className="advanced-filters-panel-v2 visible"
                                >
                                    {activeTab === 'flight' ? (
                                        <div className="f-advanced-grid-v2">
                                            <div className="f-adv-column">
                                                <div className="f-adv-group">
                                                    <div className="f-button-row">
                                                        {[0, 1, 2, 3].map((val, i) => (
                                                            <button 
                                                                key={i} 
                                                                className={flightFlexibility === val ? 'active' : ''} 
                                                                onClick={() => setFlightFlexibility(val)}
                                                            >
                                                                {val === 0 ? 'Tačan datum' : `± ${val} dan`}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                <div className="f-adv-group">
                                                    <div className="f-button-row">
                                                        {[
                                                            { id: 'direct', label: 'Direktan' },
                                                            { id: '1', label: 'Max 1' },
                                                            { id: '2', label: 'Max 2' },
                                                            { id: 'all', label: 'Sve' }
                                                        ].map((stop) => (
                                                            <button 
                                                                key={stop.id} 
                                                                className={maxStops === stop.id ? 'active' : ''} 
                                                                onClick={() => setMaxStops(stop.id as any)}
                                                            >
                                                                {stop.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="f-adv-column">
                                                <div className="f-adv-time-group">
                                                    <div className="time-pick-row">
                                                        <div className="time-field">
                                                            <div className="time-range-v2">
                                                                <input type="text" value={depTimeRange.start} onChange={e => setDepTimeRange({...depTimeRange, start: e.target.value})} />
                                                                <Clock size={12} className="inner-icon" />
                                                                <span>-</span>
                                                                <input type="text" value={depTimeRange.end} onChange={e => setDepTimeRange({...depTimeRange, end: e.target.value})} />
                                                                <Clock size={12} className="inner-icon" />
                                                            </div>
                                                        </div>
                                                        <div className="time-field">
                                                            <div className="time-range-v2">
                                                                <input type="text" value={arrTimeRange.start} onChange={e => setArrTimeRange({...arrTimeRange, start: e.target.value})} />
                                                                <Clock size={12} className="inner-icon" />
                                                                <span>-</span>
                                                                <input type="text" value={arrTimeRange.end} onChange={e => setArrTimeRange({...arrTimeRange, end: e.target.value})} />
                                                                <Clock size={12} className="inner-icon" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="f-adv-time-group">
                                                    <div className="time-pick-row">
                                                        <div className="time-field">
                                                            <div className="time-range-v2">
                                                                <input type="text" value={retDepTimeRange.start} onChange={e => setRetDepTimeRange({...retDepTimeRange, start: e.target.value})} />
                                                                <Clock size={12} className="inner-icon" />
                                                                <span>-</span>
                                                                <input type="text" value={retDepTimeRange.end} onChange={e => setRetDepTimeRange({...retDepTimeRange, end: e.target.value})} />
                                                                <Clock size={12} className="inner-icon" />
                                                            </div>
                                                        </div>
                                                        <div className="time-field">
                                                            <div className="time-range-v2">
                                                                <input type="text" value={retArrTimeRange.start} onChange={e => setRetArrTimeRange({...retArrTimeRange, start: e.target.value})} />
                                                                <Clock size={12} className="inner-icon" />
                                                                <span>-</span>
                                                                <input type="text" value={retArrTimeRange.end} onChange={e => setRetArrTimeRange({...retArrTimeRange, end: e.target.value})} />
                                                                <Clock size={12} className="inner-icon" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="f-adv-actions">
                                                <button className="search-bar-trigger-v2 flight-alt" onClick={startSearch}>
                                                    <Search size={22} />
                                                    <span>TRAŽI LETOVE</span>
                                                </button>
                                                <button className="f-advanced-toggle" onClick={() => setShowAdvanced(false)}>
                                                    <Filter size={14} /> Zatvori Naprednu pretragu
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="filters-grid-v2">
                                            <div className="filter-group-v2">
                                                <label>KATEGORIJA (STAR)</label>
                                                <div className="star-selector-v2">
                                                    {[5,4,3,2,1].map(s => (
                                                        <button 
                                                            key={s}
                                                            className={selectedStars.includes(String(s)) ? 'active' : ''}
                                                            onClick={() => {
                                                                if (selectedStars.includes(String(s))) {
                                                                    setSelectedStars(selectedStars.filter(x => x !== String(s)));
                                                                } else {
                                                                    setSelectedStars([...selectedStars, String(s)]);
                                                                }
                                                            }}
                                                        >
                                                            {s} <Star size={12} fill={selectedStars.includes(String(s)) ? "currentColor" : "none"} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="filter-group-v2">
                                                <label>USLUGA (OBROCI)</label>
                                                <div className="meal-tag-selector-v2">
                                                    {MEAL_PLAN_OPTIONS.map(mp => (
                                                        <button 
                                                            key={mp.value}
                                                            className={mealPlan === mp.value ? 'active' : ''}
                                                            onClick={() => setMealPlan(mp.value)}
                                                        >
                                                            {mp.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="filter-group-v2">
                                                <label>BUDŽET (MAX EUR)</label>
                                                <input 
                                                    className="adv-budget-input"
                                                    type="number" 
                                                    placeholder="npr. 2000" 
                                                    value={budgetTo} 
                                                    onChange={(e) => setBudgetTo(e.target.value)} 
                                                />
                                            </div>
                                            <div className="filter-group-v2">
                                                <label>NACIONALNOST</label>
                                                <select className="adv-nationality-select" value={nationality} onChange={(e) => setNationality(e.target.value)}>
                                                    <option value="RS">Srbija</option>
                                                    <option value="BA">Bosna</option>
                                                    <option value="HR">Hrvatska</option>
                                                    <option value="ME">Crna Gora</option>
                                                    <option value="MK">S. Makedonija</option>
                                                </select>
                                            </div>
                                            <button className="search-bar-trigger-v2" onClick={startSearch}>
                                                <Search size={20} />
                                                <span>POKRENI</span>
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. CONTENT AREA */}
            <div className="ss-v2-main-content">
                {/* RECAP SIDEBAR (Only in results phase) */}
                <AnimatePresence>
                    {searchPhase === 'results' && (
                        <motion.aside 
                            initial={{ x: -250, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="recap-sidebar"
                        >
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '10px' }}>Pregled pretrage</h2>
                            
                            <div className="recap-card">
                                <div className="recap-title">ODABRANE DESTINACIJE</div>
                                {selectedDestinations.map(d => (
                                    <div key={d.id} className="recap-item">
                                        <MapPin size={14} className="recap-item-icon" />
                                        <span className="recap-item-text">{d.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="recap-card">
                                <div className="recap-title">PERIOD BORAVKA</div>
                                <div className="recap-item">
                                    <Calendar size={14} className="recap-item-icon" />
                                    <span className="recap-item-text">{checkIn} do {checkOut} ({nights} noći)</span>
                                </div>
                            </div>

                            <div className="recap-card">
                                <div className="recap-title">STRUKTURA PUTNIKA</div>
                                <div className="recap-item">
                                    <Users size={14} className="recap-item-icon" />
                                    <span className="recap-item-text">
                                        {roomAllocations.reduce((acc: number, r: any) => acc + (r.adults || 0), 0)} Odraslih, {roomAllocations.reduce((acc: number, r: any) => acc + (r.children || 0), 0)} Dece ({roomAllocations.filter(r => (r.adults || 0) + (r.children || 0) > 0).length} Sobe)
                                    </span>
                                </div>
                            </div>

                            <div className="sidebar-actions">
                                <div className="sidebar-action-links">
                                    <button className="link-action edit" onClick={() => setSearchPhase('idle')}>
                                        <RefreshCw size={14} /> IZMENI PRETRAGU
                                    </button>
                                    <span className="link-sep">+</span>
                                    <button className="link-action new" onClick={() => { setSearchPhase('idle'); setSelectedDestinations([]); }}>
                                        NOVA PRETRAGA
                                    </button>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* RESULTS VIEWPORT */}
                <main className="results-viewport-v2">
                    {isSearching ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                            <RefreshCw className="animate-spin" size={60} color="var(--navy-accent)" />
                            <h3 style={{ fontSize: '20px', fontWeight: 900 }}>DOHVATAM NAJBOLJE PONUDE...</h3>
                        </div>
                    ) : searchPhase === 'results' ? (
                        <div className="animate-fade-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--navy-border)', paddingBottom: '10px' }}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <h2 style={{ fontSize: '24px', fontWeight: 900 }}>Rezultati pretrage <span style={{ color: 'var(--navy-accent)', marginLeft: '10px' }}>({searchResults.length})</span></h2>
                                    <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px' }}>
                                        <button onClick={() => setViewMode('grid')} style={{ padding: '8px', borderRadius: '8px', background: viewMode === 'grid' ? 'var(--navy-accent)' : 'transparent', color: viewMode === 'grid' ? '#000' : '#fff', border: 'none', cursor: 'pointer' }} title="Grid view"><LayoutGrid size={18} /></button>
                                        <button onClick={() => setViewMode('notepad')} style={{ padding: '8px', borderRadius: '8px', background: viewMode === 'notepad' ? 'var(--navy-accent)' : 'transparent', color: viewMode === 'notepad' ? '#000' : '#fff', border: 'none', cursor: 'pointer' }} title="Notepad view"><AlignLeft size={18} /></button>
                                        <button onClick={() => setViewMode('strip')} style={{ padding: '8px', borderRadius: '8px', background: viewMode === 'strip' ? 'var(--navy-accent)' : 'transparent', color: viewMode === 'strip' ? '#000' : '#fff', border: 'none', cursor: 'pointer' }} title="Strip view"><Menu size={18} /></button>
                                        <button onClick={() => setViewMode('map')} style={{ padding: '8px', borderRadius: '8px', background: viewMode === 'map' ? 'var(--navy-accent)' : 'transparent', color: viewMode === 'map' ? '#000' : '#fff', border: 'none', cursor: 'pointer' }} title="Map view"><MapIcon size={18} /></button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button style={{ background: 'none', border: '1px solid var(--navy-accent)', color: 'var(--navy-accent)', borderRadius: '12px', padding: '10px 20px', fontWeight: 800, cursor: 'pointer' }}>SORTIRAJ: NAJBOLJE</button>
                                </div>
                            </div>

                            {/* QUICK FILTER BAR (Always Visible) */}
                            <div className="results-quick-filters-v2">
                                {activeTab === 'hotel' ? (
                                    <>
                                        <div className="q-filter-item">
                                            <div className="q-filter-label">Kategorija</div>
                                            <div className="q-filter-control">
                                                <select>
                                                    <option>Sve zvezdice</option>
                                                    <option>5 Zvezdica</option>
                                                    <option>4 Zvezdice</option>
                                                    <option>3 Zvezdice</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="q-filter-item">
                                            <div className="q-filter-label">Usluga</div>
                                            <div className="q-filter-control">
                                                <select>
                                                    <option>Sve usluge</option>
                                                    <option>All Inclusive</option>
                                                    <option>Polupansion</option>
                                                    <option>Noćenje sa doručkom</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="q-filter-search">
                                            <div className="q-filter-label">Naziv hotela</div>
                                            <div style={{ position: 'relative', marginTop: '5px' }}>
                                                <Search size={14} className="search-icon" />
                                                <input type="text" placeholder="Pretraži po nazivu..." />
                                            </div>
                                        </div>
                                    </>
                                ) : activeTab === 'flight' ? (
                                    <>
                                        <div className="q-filter-item">
                                            <div className="q-filter-label">Presedanja</div>
                                            <div className="q-filter-control wide">
                                                <select>
                                                    <option>Sve opcije (Direktni + Presedanja)</option>
                                                    <option>Direktni letovi</option>
                                                    <option>Max 1 presedanje</option>
                                                    <option>2+ presedanja</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="q-filter-item">
                                            <div className="q-filter-label">Avio kompanija</div>
                                            <div className="q-filter-control wide">
                                                <select>
                                                    <option>Sve avio kompanije</option>
                                                    <option>Air Serbia</option>
                                                    <option>Lufthansa Group</option>
                                                    <option>Turkish Airlines</option>
                                                    <option>Qatar Airways</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="q-filter-item">
                                            <div className="q-filter-label">Prtljag</div>
                                            <div className="q-filter-control">
                                                <select>
                                                    <option>Sav prtljag</option>
                                                    <option>Samo Ručni</option>
                                                    <option>Veliki (Čekiran)</option>
                                                    <option>Ručni + Veliki</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="q-filter-search">
                                            <div className="q-filter-label">Brza pretraga</div>
                                            <div style={{ position: 'relative', marginTop: '5px' }}>
                                                <Search size={14} className="search-icon" />
                                                <input type="text" placeholder="Broj leta, aerodrom, grad..." />
                                            </div>
                                        </div>
                                    </>
                                ) : null}
                                
                                <div className="q-filter-item no-min">
                                    <div className="q-filter-label">Cena (EUR)</div>
                                    <div className="q-price-range-v2">
                                        <input type="number" placeholder="od" />
                                        <span className="price-sep">-</span>
                                        <input type="number" placeholder="do" />
                                    </div>
                                </div>
                            </div>
                            
                            <div style={viewMode === 'notepad' ? { display: 'flex', flexDirection: 'column', gap: '20px' } : { display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr', gap: '25px' }}>
                                {viewMode === 'map' ? (
                                    <div style={{ height: '600px', background: 'var(--navy-medium)', border: '1px solid var(--navy-accent)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
                                        <MapIcon size={80} color="var(--navy-accent)" />
                                        <h3 style={{ fontWeight: 900 }}>GEO EXPLORER AKTIVAN</h3>
                                        <p style={{ color: 'var(--navy-text-dim)' }}>Interaktivna mapa sa cenama i brzim pregledom.</p>
                                    </div>
                                ) : (
                                    searchResults.map((hotel, idx) => (
                                        <HotelCard 
                                            key={hotel.id || idx} 
                                            hotel={hotel} 
                                            isSubagent={isSubagent}
                                            onOpenDetails={() => {}}
                                            viewMode={viewMode === 'strip' ? 'list' : viewMode as 'grid' | 'notepad'}
                                            checkIn={checkIn}
                                            checkOut={checkOut}
                                            nights={nights}
                                            roomAllocations={roomAllocations}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="search-init-v2">
                        </div>
                    )}
                </main>
            </div>

            {/* HISTORY SIDEBAR overlay */}
            <AnimatePresence>
                {showHistorySidebar && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="sidebar-backdrop-v2"
                            onClick={() => setShowHistorySidebar(false)}
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="history-sidebar-v2"
                        >
                            <div className="hs-header-v2">
                                <h3>ISTORIJA PRETRAGA</h3>
                                <button onClick={() => setShowHistorySidebar(false)}><X size={20} /></button>
                            </div>
                            <div className="hs-list-v2">
                                <div className="hs-empty-v2">
                                    <History size={40} />
                                    <p>Vaša istorija je prazna.</p>
                                    <span>Pretrage koje izvršite pojaviće se ovde za brz pristup.</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* FLOATING ACTION PILLS */}
            <div style={{ position: 'fixed', bottom: '30px', right: '30px', display: 'flex', gap: '15px', zIndex: 1000 }}>
                <button 
                    onClick={() => setShowApiSelector(!showApiSelector)}
                    style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--navy-medium)', border: '1px solid var(--navy-accent)', color: 'var(--navy-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.5)', cursor: 'pointer' }}
                >
                   <Database size={20} />
                </button>
                <button 
                    onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                    style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--navy-medium)', border: '1px solid var(--navy-accent)', color: 'var(--navy-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.5)', cursor: 'pointer' }}
                >
                   <History size={20} />
                </button>
            </div>
        </div>
    );
};

// --- INTERNAL COMPONENT: CalendarPicker ---
const CalendarPicker = ({ selectedDate, selectedEndDate, onSelect, onClose, minDate, rangeMode }: any) => {
    const [viewDate, setViewDate] = useState(new Date(selectedDate || new Date()));
    const [tempStart, setTempStart] = useState<string | null>(selectedDate);
    const [tempEnd, setTempEnd] = useState<string | null>(selectedEndDate);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const firstDay = (y: number, m: number) => new Date(y, m, 1).getDay();

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthName = viewDate.toLocaleString('sr-RS', { month: 'long' });

    const days = [];
    const totalDays = daysInMonth(year, month);
    const startOffset = (firstDay(year, month) + 6) % 7; 

    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);

    const isSelected = (day: number) => {
        if (!day) return false;
        const d = new Date(year, month, day).toISOString().split('T')[0];
        return d === tempStart || d === tempEnd;
    };

    const isInRange = (day: number) => {
        if (!day || !tempStart || !tempEnd) return false;
        const d = new Date(year, month, day).toISOString().split('T')[0];
        return d > tempStart && d < tempEnd;
    };

    const handleDateClick = (day: number) => {
        const dStr = new Date(year, month, day);
        dStr.setMinutes(dStr.getMinutes() - dStr.getTimezoneOffset());
        const finalized = dStr.toISOString().split('T')[0];

        if (rangeMode) {
            if (!tempStart || (tempStart && tempEnd)) {
                setTempStart(finalized);
                setTempEnd(null);
            } else if (tempStart && !tempEnd) {
                if (finalized < tempStart) {
                    setTempStart(finalized);
                    setTempEnd(null);
                } else {
                    setTempEnd(finalized);
                    onSelect(tempStart, finalized);
                }
            }
        } else {
            onSelect(finalized);
        }
    };

    return (
        <motion.div 
            ref={containerRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="calendar-popover-v2"
            onClick={e => e.stopPropagation()}
        >
            <div className="cal-top-meta-v2">
                <span>Izaberite datum</span>
                <button className="cal-close-x" onClick={onClose}><X size={14} /></button>
            </div>
            <div className="cal-header-v2">
                <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(year, month - 1, 1)); }}>
                    <ChevronLeft size={16} />
                </button>
                <span style={{ textTransform: 'capitalize' }}>{monthName} {year}</span>
                <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(year, month + 1, 1)); }}>
                    <ChevronRight size={16} />
                </button>
            </div>
            <div className="cal-days-grid-v2">
                {['P', 'U', 'S', 'Č', 'P', 'S', 'N'].map(d => (
                    <div key={d} className="cal-weekday-v2">{d}</div>
                ))}
                {days.map((day, idx) => (
                    <div 
                        key={idx} 
                        className={`cal-day-v2 ${!day ? 'empty' : ''} ${isSelected(day!) ? 'active' : ''} ${isInRange(day!) ? 'in-range' : ''}`}
                        onClick={() => day && handleDateClick(day)}
                    >
                        {day}
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default SmartSearchV2;
