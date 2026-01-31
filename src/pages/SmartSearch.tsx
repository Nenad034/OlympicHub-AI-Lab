import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores';
import {
    Sparkles, Hotel, Plane, Package, Bus, Compass,
    MapPin, Calendar, CalendarDays, Users, UtensilsCrossed, Star,
    Search, Bot, TrendingUp, Zap, Shield, X, Loader2
} from 'lucide-react';
import { performSmartSearch, type SmartSearchResult, PROVIDER_MAPPING } from '../services/smartSearchService';
import solvexDictionaryService from '../services/solvex/solvexDictionaryService';
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
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [flexibleDays, setFlexibleDays] = useState(0);
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [mealPlan, setMealPlan] = useState('all-inclusive');
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

    // SIMPLIFIED Autocomplete - samo lokalni podaci, bez API poziva
    useEffect(() => {
        if (destinationInput.length >= 2) {
            const searchTerm = destinationInput.toLowerCase();

            const matches = mockDestinations.filter(dest =>
                dest.name.toLowerCase().includes(searchTerm) &&
                !selectedDestinations.find(selected => selected.id === dest.id)
            );

            setSuggestions(matches.slice(0, 10));
            setShowSuggestions(matches.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [destinationInput, selectedDestinations]);

    const handleAddDestination = (destination: Destination) => {
        if (selectedDestinations.length < 3) {
            setSelectedDestinations([...selectedDestinations, destination]);
            setDestinationInput('');
            setSuggestions([]);
            setShowSuggestions(false);
            inputRef.current?.focus();
        }
    };

    const handleRemoveDestination = (id: string) => {
        setSelectedDestinations(selectedDestinations.filter(dest => dest.id !== id));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && destinationInput.trim()) {
            // Ako ima tačno jedno poklapanje, dodaj ga
            if (suggestions.length === 1) {
                handleAddDestination(suggestions[0]);
            } else if (suggestions.length > 1) {
                // Ako ima više poklapanja, dodaj prvo
                handleAddDestination(suggestions[0]);
            }
        } else if (e.key === 'Backspace' && !destinationInput && selectedDestinations.length > 0) {
            // Ako je input prazan i pritisne backspace, ukloni poslednju destinaciju
            handleRemoveDestination(selectedDestinations[selectedDestinations.length - 1].id);
        }
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
                                        }
                                    }}
                                    className="smart-input-inline"
                                />
                            )}
                        </div>


                        {/* Autocomplete Suggestions */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="autocomplete-dropdown">
                                {suggestions.map(suggestion => (
                                    <div
                                        key={suggestion.id}
                                        className="suggestion-item"
                                        onClick={() => handleAddDestination(suggestion)}
                                    >
                                        {suggestion.type === 'hotel' ? (
                                            <Hotel size={16} className="suggestion-icon hotel" />
                                        ) : (
                                            <MapPin size={16} className="suggestion-icon destination" />
                                        )}
                                        <div className="suggestion-content">
                                            <span className="suggestion-name">{suggestion.name}</span>
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
                    <div className="form-field">
                        <label>
                            <Calendar size={16} />
                            <span>Check-in</span>
                        </label>
                        <input
                            type="date"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            className="smart-input"
                        />
                    </div>

                    <div className="form-field">
                        <label>
                            <Calendar size={16} />
                            <span>Check-out</span>
                        </label>
                        <input
                            type="date"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            className="smart-input"
                        />
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
                            <button onClick={() => setChildren(Math.max(0, children - 1))}>−</button>
                            <span>{children}</span>
                            <button onClick={() => setChildren(children + 1)}>+</button>
                        </div>
                    </div>

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
        </div>
    );
};

export default SmartSearch;

