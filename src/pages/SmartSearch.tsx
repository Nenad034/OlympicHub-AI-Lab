import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores';
import {
    Sparkles, Hotel, Plane, Package, Bus, Compass,
    MapPin, Calendar, CalendarDays, Users, UtensilsCrossed, Star,
    Search, Bot, TrendingUp, Zap, Shield, X, Loader2, MoveRight, MoveLeft, Users2
} from 'lucide-react';
import { performSmartSearch, type SmartSearchResult, PROVIDER_MAPPING } from '../services/smartSearchService';
import solvexDictionaryService from '../services/solvex/solvexDictionaryService';
import { ModernCalendar } from '../components/ModernCalendar';
import { formatDate } from '../utils/dateUtils';
import './SmartSearch.css';

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
    const [selectedIndex, setSelectedIndex] = useState(-1); // For keyboard navigation
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false); // Loading state
    const [recentSearches, setRecentSearches] = useState<Destination[]>([]); // Recent searches
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [nights, setNights] = useState(7); // Default 7 nights
    const [activeCalendar, setActiveCalendar] = useState<'in' | 'out' | null>(null);
    const [flexibleDays, setFlexibleDays] = useState(0);
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [childrenAges, setChildrenAges] = useState<number[]>([]);
    const [mealPlan, setMealPlan] = useState('all-inclusive');

    // Helper to sync nights when dates change
    const syncNightsFromDates = (start: string, end: string) => {
        if (!start || !end) return;
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setNights(diffDays);
    };

    // Helper to update dates when nights change
    const handleNightsChange = (newNights: number) => {
        setNights(newNights);
        if (checkIn) {
            const date = new Date(checkIn);
            date.setDate(date.getDate() + newNights);
            setCheckOut(date.toISOString().split('T')[0]);
        }
    };
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SmartSearchResult[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    // Mock data - u realnoj aplikaciji ovo bi dolazilo iz API-ja
    const mockDestinations: Destination[] = [
        // Destinacije
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
        { id: 'd15', name: 'Golden Sands', type: 'destination', country: 'Bulgaria' },
        { id: 'd16', name: 'Sunny Beach', type: 'destination', country: 'Bulgaria' },
        { id: 'd17', name: 'Bansko', type: 'destination', country: 'Bulgaria' },
        { id: 'h1', name: 'Hotel Splendid', type: 'hotel', country: 'Montenegro', stars: 5, provider: 'Solvex' },
        { id: 'h2', name: 'Hotel Budva Riviera', type: 'hotel', country: 'Montenegro', stars: 4, provider: 'Solvex' },
        { id: 'h3', name: 'Corfu Palace Hotel', type: 'hotel', country: 'Greece', stars: 5, provider: 'OpenGreece' },
        { id: 'h4', name: 'Rodos Princess', type: 'hotel', country: 'Greece', stars: 4, provider: 'OpenGreece' },
        { id: 'h5', name: 'Hurghada Marriott Beach Resort', type: 'hotel', country: 'Egypt', stars: 5, provider: 'TCT' },
        { id: 'h6', name: 'Sharm Grand Plaza', type: 'hotel', country: 'Egypt', stars: 4, provider: 'TCT' },
        { id: 'h7', name: 'Antalya Lara Beach', type: 'hotel', country: 'Turkey', stars: 5, provider: 'TCT' },
        { id: 'h8', name: 'Dubai Marina Hotel', type: 'hotel', country: 'UAE', stars: 5, provider: 'TCT' },
    ];

    const tabs = [
        { id: 'hotel' as const, label: 'Smeštaj', icon: Hotel },
        { id: 'flight' as const, label: 'Letovi', icon: Plane },
        { id: 'package' as const, label: 'Paketi', icon: Package },
        { id: 'transfer' as const, label: 'Transferi', icon: Bus },
        { id: 'tour' as const, label: 'Ture', icon: Compass },
    ];

    const popularDestinations = [
        { name: 'Grčka', flag: '🇬🇷', deals: 234 },
        { name: 'Egipat', flag: '🇪🇬', deals: 189 },
        { name: 'Turska', flag: '🇹🇷', deals: 156 },
        { name: 'Dubai', flag: '🇦🇪', deals: 98 },
    ];

    const quickFilters = [
        { label: 'Last Minute', icon: Zap, color: '#ef4444' },
        { label: 'Early Bird', icon: TrendingUp, color: '#10b981' },
        { label: '5★ Hoteli', icon: Star, color: '#fbbf24' },
    ];

    // Load recent searches and initialize dates on mount
    useEffect(() => {
        const stored = localStorage.getItem('smartSearchRecent');
        if (stored) {
            try {
                setRecentSearches(JSON.parse(stored));
            } catch (e) {
                console.warn('Failed to parse recent searches:', e);
            }
        }

        // Initialize dates
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const checkInDate = tomorrow.toISOString().split('T')[0];
        setCheckIn(checkInDate);

        const checkOutDate = new Date(tomorrow);
        checkOutDate.setDate(checkOutDate.getDate() + 7); // Default 7 nights
        setCheckOut(checkOutDate.toISOString().split('T')[0]);
        setNights(7);
    }, []);

    // Advanced Autocomplete with Solvex API, debounce, and loading state
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (destinationInput.length >= 2) {
                setIsLoadingSuggestions(true);
                setSelectedIndex(-1); // Reset keyboard selection
                const searchTerm = destinationInput.toLowerCase();

                // 1. Local/Static matches - show immediately
                const localMatches = mockDestinations.filter(dest =>
                    dest.name.toLowerCase().includes(searchTerm) &&
                    !selectedDestinations.find(selected => selected.id === dest.id)
                );

                setSuggestions(localMatches.slice(0, 10));
                setShowSuggestions(localMatches.length > 0);

                // 2. Dynamic Solvex hotels - fetch asynchronously
                try {
                    const citiesToSearch = [33, 68, 9]; // Golden Sands, Sunny Beach, Bansko
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
                            // Remove duplicates by name
                            return combined.filter((item, index, self) =>
                                index === self.findIndex((t) => t.name === item.name)
                            ).slice(0, 12);
                        });
                        setShowSuggestions(true);
                    }
                } catch (err) {
                    console.warn('[SmartSearch] Solvex API failed:', err);
                } finally {
                    setIsLoadingSuggestions(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
                setIsLoadingSuggestions(false);
                setSelectedIndex(-1);
            }
        };

        // Debounce: wait 300ms after user stops typing
        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [destinationInput, selectedDestinations]);

    const handleAddDestination = (destination: Destination) => {
        if (selectedDestinations.length < 3) {
            setSelectedDestinations([...selectedDestinations, destination]);
            setDestinationInput('');
            setSuggestions([]);
            setShowSuggestions(false);
            setSelectedIndex(-1);

            // Save to recent searches
            const updated = [destination, ...recentSearches.filter(r => r.id !== destination.id)].slice(0, 5);
            setRecentSearches(updated);
            localStorage.setItem('smartSearchRecent', JSON.stringify(updated));

            inputRef.current?.focus();
        }
    };

    const handleRemoveDestination = (id: string) => {
        setSelectedDestinations(selectedDestinations.filter(dest => dest.id !== id));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) {
            // No suggestions - handle backspace to remove last chip
            if (e.key === 'Backspace' && !destinationInput && selectedDestinations.length > 0) {
                handleRemoveDestination(selectedDestinations[selectedDestinations.length - 1].id);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;

            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;

            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleAddDestination(suggestions[selectedIndex]);
                } else if (suggestions.length > 0) {
                    handleAddDestination(suggestions[0]);
                }
                break;

            case 'Escape':
                e.preventDefault();
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;

            case 'Backspace':
                if (!destinationInput && selectedDestinations.length > 0) {
                    handleRemoveDestination(selectedDestinations[selectedDestinations.length - 1].id);
                }
                break;
        }
    };

    // Highlight matching text in suggestions
    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === query.toLowerCase()
                ? <strong key={index} style={{ color: '#3b82f6', fontWeight: 600 }}>{part}</strong>
                : part
        );
    };

    const handlePopularClick = (destName: string) => {
        const destination = mockDestinations.find(d => d.name === destName);
        if (destination && selectedDestinations.length < 3) {
            handleAddDestination(destination);
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

        try {
            console.log('[SmartSearch] Starting search...', {
                searchType: activeTab,
                destinations: selectedDestinations,
                checkIn,
                checkOut,
                adults,
                children,
            });

            const results = await performSmartSearch({
                searchType: activeTab,
                destinations: selectedDestinations,
                checkIn,
                checkOut,
                adults,
                children,
                mealPlan,
                currency: 'EUR',
                nationality: 'RS',
            });

            console.log('[SmartSearch] Search results:', results);
            setSearchResults(results);

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
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={20} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Search Form */}
            <div className="search-form-smart">
                <div className="form-grid">
                    {/* Multi-Destination Input */}
                    <div className="form-field full-width">
                        <label>
                            <MapPin size={16} />
                            <span>Destinacija ili Smeštaj (do 3)</span>
                        </label>
                        <div className="multi-destination-input">
                            {/* Selected Destinations as Chips */}
                            {selectedDestinations.map(dest => (
                                <div key={dest.id} className={`destination-chip ${dest.type}`}>
                                    {dest.type === 'hotel' ? <Hotel size={14} /> : <MapPin size={14} />}
                                    <span>{dest.name}</span>
                                    {dest.stars && (
                                        <span className="chip-stars">
                                            {Array.from({ length: dest.stars }).map((_, i) => (
                                                <Star key={i} size={10} fill="#fbbf24" color="#fbbf24" />
                                            ))}
                                        </span>
                                    )}
                                    <button
                                        className="chip-remove"
                                        onClick={() => handleRemoveDestination(dest.id)}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}

                            {/* Input Field */}
                            {selectedDestinations.length < 3 && (
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder={selectedDestinations.length === 0 ? "Npr: Crna Gora, Hurghada, Hotel Splendid..." : "Dodaj još..."}
                                    value={destinationInput}
                                    onChange={(e) => setDestinationInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => {
                                        if (destinationInput.length >= 2 && suggestions.length > 0) {
                                            setShowSuggestions(true);
                                        } else if (destinationInput.length === 0 && recentSearches.length > 0) {
                                            setShowSuggestions(true);
                                        }
                                    }}
                                    onBlur={() => {
                                        // Delay to allow click on suggestion
                                        setTimeout(() => setShowSuggestions(false), 200);
                                    }}
                                    className="smart-input-inline"
                                />
                            )}
                        </div>



                        {/* Autocomplete Suggestions */}
                        {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions || (destinationInput.length < 2 && recentSearches.length > 0)) && (
                            <div className="autocomplete-dropdown">
                                {/* Loading State */}
                                {isLoadingSuggestions && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '12px 16px',
                                        color: 'rgba(255,255,255,0.6)',
                                        fontSize: '13px'
                                    }}>
                                        <Loader2 size={14} className="spin" />
                                        <span>Pretraživanje...</span>
                                    </div>
                                )}

                                {/* Recent Searches */}
                                {destinationInput.length < 2 && recentSearches.length > 0 && (
                                    <>
                                        <div style={{
                                            padding: '8px 16px',
                                            fontSize: '11px',
                                            color: 'rgba(255,255,255,0.4)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            fontWeight: 600
                                        }}>
                                            Nedavne pretrage
                                        </div>
                                        {recentSearches.map(recent => (
                                            <div
                                                key={recent.id}
                                                className="suggestion-item"
                                                onClick={() => handleAddDestination(recent)}
                                                style={{ opacity: 0.8 }}
                                            >
                                                {recent.type === 'hotel' ? (
                                                    <Hotel size={16} className="suggestion-icon hotel" />
                                                ) : (
                                                    <MapPin size={16} className="suggestion-icon destination" />
                                                )}
                                                <div className="suggestion-content">
                                                    <span className="suggestion-name">{recent.name}</span>
                                                    <span className="suggestion-meta">
                                                        {recent.type === 'hotel' ? (
                                                            <>
                                                                {recent.stars && (
                                                                    <span className="stars">
                                                                        {Array.from({ length: recent.stars }).map((_, i) => (
                                                                            <Star key={i} size={10} fill="#fbbf24" color="#fbbf24" />
                                                                        ))}
                                                                    </span>
                                                                )}
                                                                <span className="provider">{recent.provider}</span>
                                                            </>
                                                        ) : (
                                                            <span className="country">{recent.country}</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Main Suggestions */}
                                {suggestions.map((suggestion, index) => (
                                    <div
                                        key={suggestion.id}
                                        className={`suggestion-item ${selectedIndex === index ? 'selected' : ''}`}
                                        onClick={() => handleAddDestination(suggestion)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        {suggestion.type === 'hotel' ? (
                                            <Hotel size={16} className="suggestion-icon hotel" />
                                        ) : (
                                            <MapPin size={16} className="suggestion-icon destination" />
                                        )}
                                        <div className="suggestion-content">
                                            <span className="suggestion-name">
                                                {highlightMatch(suggestion.name, destinationInput)}
                                            </span>
                                            <span className="suggestion-meta">
                                                {suggestion.type === 'hotel' ? (
                                                    <>
                                                        {suggestion.stars && (
                                                            <span className="stars">
                                                                {Array.from({ length: suggestion.stars }).map((_, i) => (
                                                                    <Star key={i} size={10} fill="#fbbf24" color="#fbbf24" />
                                                                ))}
                                                            </span>
                                                        )}
                                                        <span className="provider">{suggestion.provider}</span>
                                                    </>
                                                ) : (
                                                    <span className="country">{suggestion.country}</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="form-field" onClick={() => setActiveCalendar('in')} style={{ cursor: 'pointer' }}>
                        <label>
                            <Calendar size={16} />
                            <span>Check-in</span>
                        </label>
                        <div className="smart-input" style={{ display: 'flex', alignItems: 'center' }}>
                            {formatDate(checkIn) || 'Odaberite datum'}
                        </div>
                    </div>

                    <div className="form-field" onClick={() => setActiveCalendar('out')} style={{ cursor: 'pointer' }}>
                        <label>
                            <Calendar size={16} />
                            <span>Check-out</span>
                        </label>
                        <div className="smart-input" style={{ display: 'flex', alignItems: 'center' }}>
                            {formatDate(checkOut) || 'Odaberite datum'}
                        </div>
                    </div>

                    {/* Flexibility */}
                    <div className="form-field">
                        <label>
                            <CalendarDays size={16} />
                            <span>Fleksibilnost</span>
                        </label>
                        <div className="flex-pill-selection">
                            {[0, 1, 3, 5].map(days => (
                                <button
                                    key={days}
                                    className={`flex-pill ${flexibleDays === days ? 'active' : ''}`}
                                    onClick={() => setFlexibleDays(days)}
                                >
                                    {days === 0 ? 'Tačno' : `± ${days}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Guests */}
                    <div className="form-field">
                        <label>
                            <Users size={16} />
                            <span>Odrasli</span>
                        </label>
                        <div className="guest-selector">
                            <button onClick={() => setAdults(Math.max(1, adults - 1))}>−</button>
                            <span>{adults}</span>
                            <button onClick={() => setAdults(adults + 1)}>+</button>
                        </div>
                    </div>

                    <div className="form-field">
                        <label>
                            <Users size={16} />
                            <span>Deca</span>
                        </label>
                        <div className="guest-selector">
                            <button onClick={() => {
                                const newCount = Math.max(0, children - 1);
                                setChildren(newCount);
                                setChildrenAges(prev => prev.slice(0, newCount));
                            }}>−</button>
                            <span>{children}</span>
                            <button onClick={() => {
                                const newCount = Math.min(4, children + 1);
                                setChildren(newCount);
                                setChildrenAges(prev => {
                                    const newAges = [...prev];
                                    while (newAges.length < newCount) newAges.push(7);
                                    return newAges;
                                });
                            }}>+</button>
                        </div>
                    </div>

                    {/* Children Ages */}
                    {children > 0 && (
                        <div className="children-ages-container" style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '-10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            {childrenAges.map((age, idx) => (
                                <div key={idx} className="age-input-field" style={{ flex: 1, minWidth: '80px' }}>
                                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', display: 'block' }}>Dete {idx + 1} (god.)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="17"
                                        value={age}
                                        onChange={e => {
                                            const val = parseInt(e.target.value) || 0;
                                            const newAges = [...childrenAges];
                                            newAges[idx] = Math.min(17, Math.max(0, val));
                                            setChildrenAges(newAges);
                                        }}
                                        className="smart-input"
                                        style={{ padding: '8px', textAlign: 'center' }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Meal Plan */}
                    <div className="form-field">
                        <label>
                            <UtensilsCrossed size={16} />
                            <span>Ishrana</span>
                        </label>
                        <select
                            value={mealPlan}
                            onChange={(e) => setMealPlan(e.target.value)}
                            className="smart-select"
                        >
                            <option value="all-inclusive">All Inclusive</option>
                            <option value="half-board">Polupansion</option>
                            <option value="breakfast">Doručak</option>
                            <option value="room-only">Samo Soba</option>
                        </select>
                    </div>
                </div>

                {/* Search Button */}
                <button
                    className="search-btn-smart"
                    onClick={handleSearch}
                    disabled={isSearching}
                >
                    {isSearching ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <Search size={20} />
                    )}
                    <span>
                        {isSearching
                            ? 'Pretražujem...'
                            : (selectedDestinations.length > 0
                                ? `Pretraži ${selectedDestinations.length} ${selectedDestinations.length === 1 ? 'Destinaciju' : 'Destinacije'}`
                                : 'Pretraži Sve Dobavljače')
                        }
                    </span>
                </button>
            </div>

            {/* Quick Filters */}
            <div className="quick-filters">
                <h3>🔥 Brzi Filteri</h3>
                <div className="filter-chips">
                    {quickFilters.map((filter, idx) => {
                        const Icon = filter.icon;
                        return (
                            <button key={idx} className="filter-chip" style={{ borderColor: filter.color }}>
                                <Icon size={16} style={{ color: filter.color }} />
                                <span>{filter.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Popular Destinations */}
            <div className="popular-destinations">
                <h3>🌍 Popularne Destinacije</h3>
                <div className="destination-grid">
                    {popularDestinations.map((dest, idx) => (
                        <button
                            key={idx}
                            className="destination-card"
                            onClick={() => handlePopularClick(dest.name)}
                        >
                            <span className="dest-flag">{dest.flag}</span>
                            <div className="dest-info">
                                <h4>{dest.name}</h4>
                                <p>{dest.deals} ponuda</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="search-results">
                    <h3>✨ Pronađeno {searchResults.length} {searchResults.length === 1 ? 'rezultat' : 'rezultata'}</h3>
                    <div className="results-grid">
                        {searchResults.map((result, idx) => (
                            <div key={idx} className="result-card">
                                <div className="result-header">
                                    <h4 className="result-name">{result.name}</h4>
                                    <span className="result-provider">{result.provider}</span>
                                </div>

                                <div className="result-location">
                                    <MapPin size={14} />
                                    <span>{result.location}</span>
                                </div>

                                {result.stars && (
                                    <div className="result-stars">
                                        {Array.from({ length: result.stars }).map((_, i) => (
                                            <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
                                        ))}
                                    </div>
                                )}

                                <div className="result-price">
                                    <div>
                                        <span className="price-amount">{result.price.toFixed(2)}</span>
                                        <span className="price-currency">{result.currency}</span>
                                    </div>
                                    {result.mealPlan && (
                                        <span className="result-meal">{result.mealPlan}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Assistant Button */}
            <button className="ai-assistant-btn">
                <Bot size={24} />
                <div className="ai-text">
                    <strong>Olympic Asistent</strong>
                    <span>Pomozi mi da pronađem...</span>
                </div>
                <Sparkles size={16} className="ai-sparkle" />
            </button>
            {/* Active Calendar Modal */}
            {activeCalendar === 'in' && (
                <ModernCalendar
                    startDate={checkIn}
                    endDate={checkOut}
                    onChange={(s, e) => {
                        setCheckIn(s);
                        if (e) {
                            setCheckOut(e);
                            syncNightsFromDates(s, e);
                        }
                        setActiveCalendar(null);
                    }}
                    onClose={() => setActiveCalendar(null)}
                />
            )}
            {activeCalendar === 'out' && (
                <ModernCalendar
                    startDate={checkIn}
                    endDate={checkOut}
                    onChange={(s, e) => {
                        setCheckIn(s);
                        if (e) {
                            setCheckOut(e);
                            syncNightsFromDates(s, e);
                        }
                        setActiveCalendar(null);
                    }}
                    onClose={() => setActiveCalendar(null)}
                />
            )}
        </div>
    );
};

export default SmartSearch;

