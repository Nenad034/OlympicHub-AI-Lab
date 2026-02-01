import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores';
import {
    Sparkles, Hotel, Plane, Package, Bus, Compass,
    MapPin, Calendar, CalendarDays, Users, UtensilsCrossed, Star,
    Search, Bot, TrendingUp, Zap, Shield, X, Loader2, MoveRight, MoveLeft, Users2, ChevronDown,
    LayoutGrid, List as ListIcon, Map as MapIcon, ArrowDownWideNarrow, ArrowUpNarrowWide,
    CheckCircle2, Clock, ArrowRight, ShieldCheck, Info, Calendar as CalendarIcon,
    Plus
} from 'lucide-react';
import { performSmartSearch, type SmartSearchResult, PROVIDER_MAPPING } from '../services/smartSearchService';
import solvexDictionaryService from '../services/solvex/solvexDictionaryService';
import { ModernCalendar } from '../components/ModernCalendar';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { BookingModal } from '../components/booking/BookingModal';
import { formatDate } from '../utils/dateUtils';
import { useConfig } from '../context/ConfigContext';
import './SmartSearch.css';
import './SmartSearchFix2.css';
import './SmartSearchStylesFix.css';
import './SmartSearchLightMode.css';
import './SmartSearchRedesign.css';
import './SmartSearchGridFix.css';

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

const SmartSearch: React.FC = () => {
    const { userLevel } = useAuthStore();
    const isSubagent = userLevel < 6;

    const [activeTab, setActiveTab] = useState<'hotel' | 'flight' | 'package' | 'transfer' | 'tour'>('hotel');
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

    // Multi-room state
    const [rooms, setRooms] = useState(1);
    const [roomAllocations, setRoomAllocations] = useState<RoomAllocation[]>([
        { adults: 2, children: 0, childrenAges: [] }
    ]);
    const [showRoomPicker, setShowRoomPicker] = useState(false);

    const [mealPlan, setMealPlan] = useState('');

    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SmartSearchResult[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [selectedArrivalDate, setSelectedArrivalDate] = useState<string | null>(null);


    // Filter & UI States
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'smart' | 'price_low' | 'price_high'>('smart');
    const [hotelNameFilter, setHotelNameFilter] = useState('');
    const [selectedStars, setSelectedStars] = useState<string[]>(['all']);
    const [selectedMealPlans, setSelectedMealPlans] = useState<string[]>(['all']);

    // Booking states
    const [expandedHotel, setExpandedHotel] = useState<SmartSearchResult | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<any>(null);

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
        { id: 'package' as const, label: 'Paketi', icon: Package },
        { id: 'transfer' as const, label: 'Transferi', icon: Bus },
        { id: 'tour' as const, label: 'Ture', icon: Compass },
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

        // Click outside handler
        const handleClickOutside = (event: MouseEvent) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

    const handleSearch = async () => {
        if (selectedDestinations.length === 0) {
            setSearchError('Molimo odaberite najmanje jednu destinaciju');
            return;
        }

        if (!checkIn || !checkOut) {
            setSearchError('Molimo unesite datume');
            return;
        }

        setIsSearching(true);
        setSearchError(null);
        setSearchResults([]);
        setSearchPerformed(false);
        setSelectedArrivalDate(checkIn);

        try {
            // Mapping for service (currently uses first room or sum for simplicity)
            const results = await performSmartSearch({
                searchType: activeTab,
                destinations: selectedDestinations,
                checkIn,
                checkOut,
                adults: roomAllocations.reduce((sum, r) => sum + r.adults, 0),
                children: roomAllocations.reduce((sum, r) => sum + r.children, 0),
                childrenAges: roomAllocations.flatMap(r => r.childrenAges),
                mealPlan,
                currency: 'EUR',
                nationality: 'RS',
            });

            setSearchResults(results);
            setSearchPerformed(true);
            if (results.length === 0) {
                setSearchError('Nema dostupnih rezultata za izabrane parametre');
            }
        } catch (error) {
            console.error('[SmartSearch] Search error:', error);
            setSearchError(error instanceof Error ? error.message : 'Greška pri pretrazi');
        } finally {
            setIsSearching(false);
        }
    };

    const filteredResults = searchResults.filter(hotel => {
        if (hotelNameFilter && !hotel.name.toLowerCase().includes(hotelNameFilter.toLowerCase())) {
            return false;
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

        return true;
    }).sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        return 0;
    });

    const handleReserveClick = (room: any) => {
        setSelectedRoomForBooking(room);
        setIsBookingModalOpen(true);
    };

    const getPriceWithMargin = (price: number) => Math.round(price * 1.15);

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

    return (
        <div className="smart-search-container-v2">
            {/* Minimal Header */}
            <header className="smart-search-header">
                <div className="header-brand">
                    <div className="logo-olympic">
                        <Shield size={28} className="logo-icon" />
                        <div className="logo-text">
                            <h1 style={{ fontSize: '1.5rem' }}>Olympic B2B</h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* TAB NAVIGATION */}
            < div className="tabs-nav-container" >
                {
                    tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`nav-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    ))
                }
            </div >

            {/* MAIN SEARCH CARD */}
            < div className="search-card-frame" >

                {/* ROW 1: DESTINATION */}
                < div className="destination-row" >
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
                                    style={{ background: 'transparent', border: 'none', width: '100%', height: '100%', fontSize: '1rem' }}
                                />
                            )}
                        </div>
                        {/* Suggestions Dropdown */}
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
                </div >

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
                                    {day === 0 ? 'Tačno' : `+${day}`}
                                </button>
                            ))}
                        </div>
                    </div >

                    {/* Room & Passenger Picker */}
                    <div className="col-rooms param-item" style={{ position: 'relative' }}>
                        <div className="field-label"><Users size={14} /> Putnici i Sobe</div>
                        <div className="input-box" onClick={() => setShowRoomPicker(!showRoomPicker)} style={{ cursor: 'pointer' }}>
                            <span className="room-summary-text">
                                {roomAllocations.length} {roomAllocations.length === 1 ? 'soba' : 'sobe'}, {roomAllocations.reduce((a, b) => a + b.adults, 0)} odr.
                            </span>
                            <ChevronDown size={14} />
                        </div>

                        {showRoomPicker && (
                            <div className="room-picker-dropdown animate-fade-in">
                                <div className="room-picker-header">
                                    <h4>Konfiguracija Smeštaja</h4>
                                    <button className="close-mini" onClick={() => setShowRoomPicker(false)}><X size={14} /></button>
                                </div>
                                <div className="room-list-scrollable">
                                    {roomAllocations.map((room, idx) => (
                                        <div key={idx} className="room-config-item">
                                            <div className="room-label">Soba {idx + 1}</div>
                                            <div className="room-counters">
                                                <div className="counter-row">
                                                    <span>Odrasli</span>
                                                    <div className="mini-counter">
                                                        <button onClick={() => {
                                                            const newAlloc = [...roomAllocations];
                                                            newAlloc[idx].adults = Math.max(1, newAlloc[idx].adults - 1);
                                                            setRoomAllocations(newAlloc);
                                                        }}>−</button>
                                                        <span>{room.adults}</span>
                                                        <button onClick={() => {
                                                            const newAlloc = [...roomAllocations];
                                                            newAlloc[idx].adults += 1;
                                                            setRoomAllocations(newAlloc);
                                                        }}>+</button>
                                                    </div>
                                                </div>
                                                <div className="counter-row">
                                                    <span>Deca</span>
                                                    <div className="mini-counter">
                                                        <button onClick={() => {
                                                            const newAlloc = [...roomAllocations];
                                                            newAlloc[idx].children = Math.max(0, newAlloc[idx].children - 1);
                                                            newAlloc[idx].childrenAges.pop();
                                                            setRoomAllocations(newAlloc);
                                                        }}>−</button>
                                                        <span>{room.children}</span>
                                                        <button onClick={() => {
                                                            if (room.children < 4) {
                                                                const newAlloc = [...roomAllocations];
                                                                newAlloc[idx].children += 1;
                                                                newAlloc[idx].childrenAges.push(7);
                                                                setRoomAllocations(newAlloc);
                                                            }
                                                        }}>+</button>
                                                    </div>
                                                </div>
                                                {room.children > 0 && (
                                                    <div className="mini-ages-grid">
                                                        {room.childrenAges.map((age, cIdx) => (
                                                            <div key={cIdx} className="mini-age-item">
                                                                <small>Dete {cIdx + 1}</small>
                                                                <input
                                                                    type="number"
                                                                    min="0" max="17"
                                                                    value={age}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value) || 0;
                                                                        const newAlloc = [...roomAllocations];
                                                                        newAlloc[idx].childrenAges[cIdx] = Math.min(17, val);
                                                                        setRoomAllocations(newAlloc);
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {roomAllocations.length > 1 && (
                                                <button className="remove-room-link" onClick={() => setRoomAllocations(roomAllocations.filter((_, i) => i !== idx))}>Ukloni sobu</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="room-picker-footer">
                                    <button
                                        className="btn-add-room"
                                        disabled={roomAllocations.length >= 5}
                                        onClick={() => setRoomAllocations([...roomAllocations, { adults: 2, children: 0, childrenAges: [] }])}
                                    >
                                        <Plus size={14} /> Dodaj Sobu
                                    </button>
                                    <button className="btn-confirm-rooms" onClick={() => setShowRoomPicker(false)}>Potvrdi</button>
                                </div>
                            </div>
                        )}
                    </div>



                </div >

                {/* QUICK FILTERS - MOVED HERE */}
                <div className="quick-filters-inline-v2">
                    <button className="quick-filter-chip" onClick={() => handleQuickFilter('last-minute')}><Clock size={16} /> Last Minute</button>
                    <button className="quick-filter-chip" onClick={() => handleQuickFilter('early-bird')}><TrendingUp size={16} /> Early Bird</button>
                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>
                    <button className={`quick-filter-chip ${selectedStars.includes('all') ? 'active' : ''}`} onClick={() => toggleStarFilter('all')}>Sve kategorije</button>
                    <button className={`quick-filter-chip ${selectedStars.includes('5') ? 'active' : ''}`} onClick={() => toggleStarFilter('5')}>{renderStars(5)}</button>
                    <button className={`quick-filter-chip ${selectedStars.includes('4') ? 'active' : ''}`} onClick={() => toggleStarFilter('4')}>{renderStars(4)}</button>
                    <button className={`quick-filter-chip ${selectedStars.includes('3') ? 'active' : ''}`} onClick={() => toggleStarFilter('3')}>{renderStars(3)}</button>
                    <button className={`quick-filter-chip ${selectedStars.includes('2') ? 'active' : ''}`} onClick={() => toggleStarFilter('2')}>{renderStars(2)}</button>
                    <button className={`quick-filter-chip ${selectedStars.includes('0') ? 'active' : ''}`} onClick={() => toggleStarFilter('0')}>{renderStars(0)}</button>
                </div>

                {/* SEARCH BUTTON */}
                < div className="action-row" >
                    <button className="btn-search-main" onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <Loader2 size={24} className="spin" /> : <Search size={24} />}
                        <span>{isSearching ? 'Pretražujem...' : 'Pretraži Sve Dobavljače'}</span>
                    </button>
                </div >
            </div >

            {/* FLEXIBLE DATES RIBBON */}
            {searchPerformed && flexibleDays > 0 && (
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
                            const dayName = dateObj.toLocaleDateString('sr-RS', { weekday: 'short' });
                            const dayNum = dateObj.getDate();
                            const monthName = dateObj.toLocaleDateString('sr-RS', { month: 'short' });

                            return (
                                <div
                                    key={dateStr}
                                    className={`flex-date-tile-premium ${isActive ? 'active' : ''}`}
                                    onClick={() => {
                                        if (!isActive) {
                                            setCheckIn(dateStr);
                                            // Auto-update checkout while keeping nights same
                                            const newOut = new Date(dateStr);
                                            newOut.setDate(newOut.getDate() + nights);
                                            setCheckOut(newOut.toISOString().split('T')[0]);
                                            handleSearch();
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

            {/* ERROR ALERT */}
            {
                searchError && (
                    <div className="search-error animate-fade-in" style={{ marginTop: '2rem' }}>
                        <Info size={18} />
                        <span>{searchError}</span>
                    </div>
                )
            }

            {/* RESULTS SECTION (EXISTING LOGIC) */}
            {
                searchPerformed && (
                    <div className="content-workflow animate-fade-in" style={{ marginTop: '3rem' }}>
                        {/* Force Single Row Toolbar */}
                        <div className="filters-toolbar-v4 premium" style={{ display: 'flex', flexWrap: 'nowrap', gap: '16px', alignItems: 'center' }}>
                            <div className="name-filter-wrapper" style={{ flex: 1, minWidth: '0' }}>
                                <Search size={14} className="filter-icon" />
                                <input
                                    type="text"
                                    className="smart-input premium"
                                    style={{ width: '100%', paddingLeft: '40px', height: '48px' }}
                                    placeholder="Traži po nazivu..."
                                    value={hotelNameFilter}
                                    onChange={(e) => setHotelNameFilter(e.target.value)}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: '0' }}>
                                <MultiSelectDropdown options={CATEGORY_OPTIONS} selected={selectedStars} onChange={setSelectedStars} placeholder="Kategorija" />
                            </div>
                            <div style={{ flex: 1, minWidth: '0' }}>
                                <MultiSelectDropdown options={MEAL_PLAN_OPTIONS} selected={selectedMealPlans} onChange={setSelectedMealPlans} placeholder="Ishrana" />
                            </div>
                            <div className="view-mode-switcher" style={{ flexShrink: 0 }}>
                                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={18} /></button>
                                <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><ListIcon size={18} /></button>
                            </div>
                        </div>

                        <div className="results-summary-bar-v4 premium">
                            <div className="summary-info">
                                <span>REZULTATA: <strong>{filteredResults.length}</strong></span>
                            </div>
                            <div className="sort-actions">
                                <button className={`view-btn ${sortBy === 'smart' ? 'active' : ''}`} onClick={() => setSortBy('smart')}>Smart</button>
                                <button className={`view-btn ${sortBy === 'price_low' ? 'active' : ''}`} onClick={() => setSortBy('price_low')}>Cena ↓</button>
                            </div>
                        </div>

                        <div className={`results-container ${viewMode}-view`}>
                            <div className={`results-mosaic ${viewMode === 'list' ? 'list-layout' : 'grid-layout'}`}>
                                {filteredResults.map(hotel => (
                                    <div key={hotel.id} className={`hotel-result-card-premium unified ${hotel.provider.toLowerCase()} ${viewMode === 'list' ? 'horizontal' : ''}`}>
                                        <div className="hotel-card-image">
                                            <img src={hotel.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800"} alt="" />
                                            <div className="meal-plan-badge">{getMealPlanDisplayName(hotel.mealPlan)}</div>
                                            <div className="hotel-stars-badge">
                                                {Array(hotel.stars || 0).fill(0).map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                                            </div>
                                        </div>
                                        <div className="hotel-card-content">
                                            <div className="hotel-info-text">
                                                <div className="hotel-title-row">
                                                    <h3>{hotel.name}</h3>
                                                    <div className="hotel-location-tag"><MapPin size={14} /> <span>{hotel.location}</span></div>
                                                    <div className="hotel-date-badge"><CalendarDays size={14} /> <span>{formatDate(checkIn)} - {formatDate(checkOut)}</span></div>
                                                </div>
                                            </div>
                                            <div className="price-action-section">
                                                <div className="lowest-price-tag">
                                                    <span className="price-val">{isSubagent ? getPriceWithMargin(hotel.price) : hotel.price}€</span>
                                                </div>
                                                <button className="view-more-btn" onClick={() => setExpandedHotel(hotel)}>Detalji <ArrowRight size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Hotel Details Modal */}
            {
                expandedHotel && (
                    <div className="modern-calendar-overlay" onClick={() => setExpandedHotel(null)}>
                        {/* WIDE MODAL CLASS ADDED HERE */}
                        <div className="modern-calendar-popup wide hotel-details-wide animate-fade-in" onClick={e => e.stopPropagation()}>
                            <div className="hotel-rooms-modal-header">
                                <div className="modal-title-zone">
                                    <h2>{expandedHotel.name}</h2>
                                    <div className="modal-meta"><MapPin size={14} /> {expandedHotel.location}</div>
                                </div>
                                <button className="close-modal-btn" onClick={() => setExpandedHotel(null)}><X size={20} /></button>
                            </div>
                            <div className="modal-body-v4">
                                <div className="rooms-comparison-table">
                                    <div className="table-header">
                                        <div>Tip Smeštaja</div>
                                        <div>Usluga</div>
                                        <div>Kapacitet</div>
                                        <div>Cena</div>
                                        <div>Akcija</div>
                                    </div>
                                    {expandedHotel.rooms && expandedHotel.rooms.length > 0 ? (
                                        expandedHotel.rooms.map((room, idx) => (
                                            <div key={room.id || idx} className="room-row-v4">
                                                <div className="r-name">
                                                    <strong>{room.name || 'Standardna Soba'}</strong>
                                                    <p>{room.description || 'Standardna Ponuda'}</p>
                                                </div>
                                                <div className="r-meal">
                                                    <div className="meal-tag-mini">{getMealPlanDisplayName(expandedHotel.mealPlan)}</div>
                                                </div>
                                                <div className="r-cap"><Users size={14} /> {room.capacity || `${roomAllocations[0].adults}+${roomAllocations[0].children}`}</div>
                                                <div className="r-price">{isSubagent ? getPriceWithMargin(room.price) : room.price}€</div>
                                                <div>
                                                    <button
                                                        className="select-room-btn"
                                                        onClick={() => handleReserveClick({
                                                            name: room.name || 'Standardna Ponuda',
                                                            price: isSubagent ? getPriceWithMargin(room.price) : room.price
                                                        })}
                                                    >
                                                        Rezerviši
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="room-row-v4">
                                            <div className="r-name"><strong>Standardna Ponuda</strong><p>{expandedHotel.name}</p></div>
                                            <div className="r-meal">
                                                <div className="meal-tag-mini">{getMealPlanDisplayName(expandedHotel.mealPlan)}</div>
                                            </div>
                                            <div className="r-cap"><Users size={14} /> {roomAllocations[0].adults}+{roomAllocations[0].children}</div>
                                            <div className="r-price">{isSubagent ? getPriceWithMargin(expandedHotel.price) : expandedHotel.price}€</div>
                                            <div><button className="select-room-btn" onClick={() => handleReserveClick({ name: 'Standardna Ponuda', price: isSubagent ? getPriceWithMargin(expandedHotel.price) : expandedHotel.price })}>Rezerviši</button></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Booking Modal */}
            {
                isBookingModalOpen && expandedHotel && selectedRoomForBooking && (
                    <BookingModal
                        isOpen={isBookingModalOpen}
                        onClose={() => setIsBookingModalOpen(false)}
                        provider={expandedHotel.provider.toLowerCase() as any}
                        bookingData={{
                            hotelName: expandedHotel.name, location: expandedHotel.location,
                            checkIn, checkOut, nights, roomType: selectedRoomForBooking.name,
                            mealPlan: getMealPlanDisplayName(expandedHotel.mealPlan),
                            adults: roomAllocations.reduce((sum, r) => sum + r.adults, 0),
                            children: roomAllocations.reduce((sum, r) => sum + r.children, 0),
                            totalPrice: selectedRoomForBooking.price,
                            currency: 'EUR', stars: expandedHotel.stars, providerData: expandedHotel.originalData
                        }}
                        onSuccess={() => setIsBookingModalOpen(false)}
                        onError={err => console.error(err)}
                    />
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

            {/* AI Assistant */}
            <button className="ai-assistant-btn"><Bot size={24} /> <span>Olympic Asistent</span><Sparkles size={16} /></button>
        </div >
    );
};

export default SmartSearch;
