import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores';
import {
    Sparkles, Hotel, Plane, Package, Bus, Compass,
    MapPin, Calendar, CalendarDays, Users, UtensilsCrossed, Star,
    Search, Bot, TrendingUp, Zap, Shield, X, Loader2, MoveRight, MoveLeft, Users2, ChevronDown,
    LayoutGrid, List as ListIcon, Map as MapIcon, ArrowDownWideNarrow, ArrowUpNarrowWide,
    CheckCircle2, Clock, ArrowRight, ShieldCheck, Info, Calendar as CalendarIcon
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
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [childrenAges, setChildrenAges] = useState<number[]>([]);
    const [mealPlan, setMealPlan] = useState('');

    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SmartSearchResult[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchPerformed, setSearchPerformed] = useState(false);

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

        try {
            const results = await performSmartSearch({
                searchType: activeTab,
                destinations: selectedDestinations,
                checkIn,
                checkOut,
                adults,
                children,
                childrenAges,
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

        if (!selectedStars.includes('all')) {
            if (!selectedStars.includes(String(hotel.stars))) {
                return false;
            }
        }

        if (!selectedMealPlans.includes('all')) {
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

    return (
        <div className="smart-search-container">
            {/* Header */}
            <header className="smart-search-header">
                <div className="header-brand">
                    <div className="logo-olympic">
                        <Shield size={32} className="logo-icon" />
                        <div className="logo-text">
                            <h1>OLYMPIC HUB</h1>
                            <p>Jedan klik, svi dobavljači</p>
                        </div>
                    </div>
                </div>
                {isSubagent && (
                    <div className="b2b-badge-smart">
                        <Shield size={14} />
                        <span>B2B PARTNER</span>
                    </div>
                )}
            </header>

            {/* Tab Navigation */}
            <div className="search-tabs">
                {tabs.map(tab => (
                    <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        <tab.icon size={20} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Search Form */}
            <div className="search-form-smart">
                <div className="form-grid">
                    <div className="form-field" ref={autocompleteRef}>
                        <label><MapPin size={16} /> <span>Destinacija</span></label>
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
                                    placeholder={selectedDestinations.length === 0 ? "Npr: Crna Gora, Golden Sands..." : "Dodaj još..."}
                                    value={destinationInput}
                                    onChange={(e) => setDestinationInput(e.target.value)}
                                    className="smart-input-inline"
                                    onFocus={() => { if (destinationInput.length >= 2) setShowSuggestions(true); }}
                                />
                            )}
                        </div>
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

                    <div className="form-field" onClick={() => setActiveCalendar('in')} style={{ cursor: 'pointer' }}>
                        <label><CalendarIcon size={16} /> <span>Check-in</span></label>
                        <div className="smart-input premium">{formatDate(checkIn) || 'ODABERI'}</div>
                    </div>

                    <div className="form-field" onClick={() => setActiveCalendar('out')} style={{ cursor: 'pointer' }}>
                        <label><CalendarIcon size={16} /> <span>Check-out</span></label>
                        <div className="smart-input premium">{formatDate(checkOut) || 'ODABERI'}</div>
                    </div>

                    <div className="form-field">
                        <label><Users size={16} /> <span>Odrasli</span></label>
                        <div className="guest-selector premium">
                            <button onClick={() => setAdults(Math.max(1, adults - 1))}>−</button>
                            <span>{adults}</span>
                            <button onClick={() => setAdults(adults + 1)}>+</button>
                        </div>
                    </div>

                    <div className="form-field">
                        <label><Users size={16} /> <span>Deca {children > 0 ? '& Godine' : ''}</span></label>
                        <div className="guest-selector premium" style={{ justifyContent: 'flex-start', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0 4px', marginRight: children > 0 ? '8px' : '0' }}>
                                <button onClick={() => {
                                    const newCount = Math.max(0, children - 1);
                                    setChildren(newCount);
                                    setChildrenAges(prev => prev.slice(0, newCount));
                                }}>−</button>
                                <span style={{ minWidth: '20px' }}>{children}</span>
                                <button onClick={() => {
                                    const newCount = Math.min(4, children + 1);
                                    setChildren(newCount);
                                    setChildrenAges(prev => [...prev, 7].slice(0, newCount));
                                }}>+</button>
                            </div>

                            <div className="children-inputs-container">
                                {children > 0 && childrenAges.map((age, idx) => (
                                    <input
                                        key={idx}
                                        type="number"
                                        min="0"
                                        max="17"
                                        value={age}
                                        onChange={e => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val)) {
                                                const newAges = [...childrenAges];
                                                newAges[idx] = Math.min(17, Math.max(0, val));
                                                setChildrenAges(newAges);
                                            }
                                        }}
                                        className="smart-input premium age-input"
                                        title={`Dete ${idx + 1} godina`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <button className="search-btn-smart premium" onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? <Loader2 size={20} className="spin" /> : <Search size={20} />}
                    <span>{isSearching ? 'Pretražujem...' : 'Pretraži Sve Dobavljače'}</span>
                </button>
            </div>

            {/* ERROR ALERT */}
            {searchError && (
                <div className="search-error animate-fade-in">
                    <Info size={18} />
                    <span>{searchError}</span>
                </div>
            )}

            {/* Results Section */}
            {searchPerformed && (
                <div className="content-workflow animate-fade-in">
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
                                        <div className="source-badge">{hotel.provider} AI</div>
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
            )}

            {/* Hotel Details Modal */}
            {expandedHotel && (
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
                                    <div>Kapacitet</div>
                                    <div>Cena</div>
                                    <div>Akcija</div>
                                </div>
                                <div className="room-row-v4">
                                    <div className="r-name"><strong>Standardna Ponuda</strong><p>{getMealPlanDisplayName(expandedHotel.mealPlan)}</p></div>
                                    <div className="r-cap"><Users size={14} /> {adults}+{children}</div>
                                    <div className="r-price">{isSubagent ? getPriceWithMargin(expandedHotel.price) : expandedHotel.price}€</div>
                                    <div><button className="select-room-btn" onClick={() => handleReserveClick({ name: 'Standardna Ponuda', price: isSubagent ? getPriceWithMargin(expandedHotel.price) : expandedHotel.price })}>Rezerviši</button></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {isBookingModalOpen && expandedHotel && selectedRoomForBooking && (
                <BookingModal
                    isOpen={isBookingModalOpen}
                    onClose={() => setIsBookingModalOpen(false)}
                    provider={expandedHotel.provider.toLowerCase() as any}
                    bookingData={{
                        hotelName: expandedHotel.name, location: expandedHotel.location,
                        checkIn, checkOut, nights, roomType: selectedRoomForBooking.name,
                        mealPlan: getMealPlanDisplayName(expandedHotel.mealPlan),
                        adults, children, totalPrice: selectedRoomForBooking.price,
                        currency: 'EUR', stars: expandedHotel.stars, providerData: expandedHotel.originalData
                    }}
                    onSuccess={() => setIsBookingModalOpen(false)}
                    onError={err => console.error(err)}
                />
            )}

            {/* Calendars */}
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

            {/* AI Assistant */}
            <button className="ai-assistant-btn"><Bot size={24} /> <span>Olympic Asistent</span><Sparkles size={16} /></button>
        </div>
    );
};

export default SmartSearch;
