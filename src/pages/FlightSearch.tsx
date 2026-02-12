import React, { useState, useEffect } from 'react';
import { ClickToTravelLogo } from '../components/icons/ClickToTravelLogo';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search, Plane, Calendar, Users, MapPin, ArrowRight,
    Loader2, Clock, Zap, Star,
    Briefcase, Users2, ChevronDown, ChevronUp, SlidersHorizontal
} from 'lucide-react';
import flightSearchManager from '../services/flight/flightSearchManager';
import type {
    FlightSearchParams,
    UnifiedFlightOffer,
    FlightSearchResponse
} from '../types/flight.types';
import { useThemeStore } from '../stores';
import { translations } from '../translations';
import CustomDatePicker from '../components/flight/CustomDatePicker';
import MultiCityFlightForm, { type FlightLeg } from '../components/flight/MultiCityFlightForm';
import AirportAutocomplete from '../components/flight/AirportAutocomplete';
import './FlightSearch.css';
import './SmartSearchFerrariFix.css';
import FlightDateCarousel from '../components/flight/FlightDateCarousel';

interface FlightSearchProps {
    isInline?: boolean;
}

const FlightSearch: React.FC<FlightSearchProps> = ({ isInline }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { lang } = useThemeStore();
    const t = translations[lang];

    // Trip Type
    const [tripType, setTripType] = useState<'round-trip' | 'one-way' | 'multi-city'>('round-trip');

    // Search Parameters
    const [searchParams, setSearchParams] = useState<FlightSearchParams>({
        origin: '',
        destination: '',
        departureDate: '',
        returnDate: '',
        adults: 1,
        children: 0,
        childrenAges: [],
        cabinClass: 'economy',
        currency: 'EUR',
        directFlightsOnly: false,
        maxStops: undefined
    });

    // Multi-City Legs
    const [multiCityLegs, setMultiCityLegs] = useState<FlightLeg[]>([
        { id: 'leg-1', origin: '', destination: '', departureDate: '' },
        { id: 'leg-2', origin: '', destination: '', departureDate: '' }
    ]);

    // Advanced Options
    const [flexibleDates, setFlexibleDates] = useState<number>(0); // +/- days
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    // Results State
    const [results, setResults] = useState<UnifiedFlightOffer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [searchResponse, setSearchResponse] = useState<FlightSearchResponse | null>(null);

    // UI State
    const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'price' | 'duration' | 'departure'>('price');

    // Initialize dates
    useEffect(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const weekLater = new Date(tomorrow);
        weekLater.setDate(weekLater.getDate() + 7);

        setSearchParams(prev => ({
            ...prev,
            departureDate: tomorrow.toISOString().split('T')[0],
            returnDate: weekLater.toISOString().split('T')[0]
        }));
    }, []);

    // Restore state from location (when coming back from booking)
    useEffect(() => {
        if (location.state) {
            const { searchParams: savedParams, tripType: savedTripType, multiCityLegs: savedLegs } = location.state;

            if (savedParams) {
                setSearchParams(savedParams);
            }

            if (savedTripType) {
                setTripType(savedTripType);
            }

            if (savedLegs && savedLegs.length > 0) {
                setMultiCityLegs(savedLegs);
            }
        }
    }, [location.state]);

    // Handle search
    const handleSearch = async (paramsOverride?: FlightSearchParams) => {
        const paramsToUse = paramsOverride || searchParams;

        // Validation based on trip type
        if (tripType === 'multi-city') {
            // Validate multi-city legs
            for (let i = 0; i < multiCityLegs.length; i++) {
                const leg = multiCityLegs[i];
                if (!leg.origin || !leg.destination || !leg.departureDate) {
                    alert(`Molimo popunite sva polja za Let ${i + 1}`);
                    return;
                }
            }
        } else {
            // Validate regular search
            if (!paramsToUse.origin || !paramsToUse.destination || !paramsToUse.departureDate) {
                alert('Molimo popunite sva obavezna polja');
                return;
            }

            // For round-trip, check return date
            if (tripType === 'round-trip' && !paramsToUse.returnDate) {
                alert('Molimo unesite datum povratka');
                return;
            }
        }

        setIsLoading(true);
        setSearchPerformed(true);

        try {
            // For multi-city, we would need to convert legs to search params
            // For now, using regular search params
            const response = await flightSearchManager.searchFlights(paramsToUse);
            setSearchResponse(response);
            setResults(response.offers);
        } catch (error) {
            console.error('Search failed:', error);
            alert('Pretraga nije uspela. Molimo pokušajte ponovo.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle date change from carousel
    const handleDateChange = (newDate: string) => {
        const newParams = { ...searchParams, departureDate: newDate };
        setSearchParams(newParams);
        handleSearch(newParams);
    };

    // Sort results
    const sortedResults = [...results].sort((a, b) => {
        switch (sortBy) {
            case 'price':
                return a.price.total - b.price.total;
            case 'duration':
                return a.slices[0].duration - b.slices[0].duration;
            case 'departure':
                return new Date(a.slices[0].departure).getTime() - new Date(b.slices[0].departure).getTime();
            default:
                return 0;
        }
    });

    // Format time
    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('sr-RS', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format duration
    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div className={isInline ? "flight-search-inline" : "flight-search-page"}>
            {/* Header - Only if not inline */}
            {!isInline && (
                <div className="flight-search-header">
                    <div className="header-icon-wrapper">
                        <Plane size={48} className="header-icon" />
                    </div>
                    <h1>Pretraga Letova</h1>
                    <p>Pronađite najbolje ponude za vaše putovanje širom sveta</p>
                </div>
            )}

            {/* Search Form */}
            <div className="flight-search-form">
                {/* Trip Type Selector */}
                <div className="trip-type-selector">
                    <button
                        type="button"
                        className={`trip-type-btn ${tripType === 'round-trip' ? 'active' : ''}`}
                        onClick={() => setTripType('round-trip')}
                    >
                        ↔️ Povratna karta
                    </button>
                    <button
                        type="button"
                        className={`trip-type-btn ${tripType === 'one-way' ? 'active' : ''}`}
                        onClick={() => setTripType('one-way')}
                    >
                        →  U jednom pravcu
                    </button>
                    <button
                        type="button"
                        className={`trip-type-btn ${tripType === 'multi-city' ? 'active' : ''}`}
                        onClick={() => setTripType('multi-city')}
                    >
                        🌍 Više destinacija
                    </button>
                </div>

                {/* Conditional Form Rendering */}
                {tripType !== 'multi-city' ? (
                    <>
                        <div className="form-row">
                            {/* Origin */}
                            <AirportAutocomplete
                                label="Polazište"
                                value={searchParams.origin}
                                onChange={code => setSearchParams(prev => ({ ...prev, origin: code }))}
                                placeholder="Unesite grad ili aerodrom"
                            />

                            {/* Destination */}
                            <AirportAutocomplete
                                label="Odredište"
                                value={searchParams.destination}
                                onChange={code => setSearchParams(prev => ({ ...prev, destination: code }))}
                                placeholder="Unesite grad ili aerodrom"
                            />

                            {/* Departure Date */}
                            <div className="input-group-flight">
                                <CustomDatePicker
                                    label="Polazak"
                                    selectedDate={searchParams.departureDate}
                                    onDateSelect={date => setSearchParams(prev => ({ ...prev, departureDate: date }))}
                                    minDate={new Date().toISOString().split('T')[0]}
                                    returnDate={tripType === 'round-trip' ? searchParams.returnDate : undefined}
                                />
                            </div>

                            {/* Return Date (only for round-trip) */}
                            {tripType === 'round-trip' && (
                                <div className="input-group-flight">
                                    <CustomDatePicker
                                        label="Povratak"
                                        selectedDate={searchParams.returnDate || ''}
                                        onDateSelect={date => setSearchParams(prev => ({ ...prev, returnDate: date }))}
                                        minDate={searchParams.departureDate}
                                        returnDate={searchParams.returnDate}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="passenger-row-flight">
                                {/* Adults */}
                                <div className="flight-counter-group">
                                    <label><Users size={16} /> ODRASLI</label>
                                    <div className="flight-counter-controls">
                                        <button
                                            type="button"
                                            className="flight-btn-counter"
                                            onClick={() => setSearchParams(prev => ({ ...prev, adults: Math.max(1, (prev.adults || 0) - 1) }))}
                                        >−</button>
                                        <span className="flight-counter-val">{searchParams.adults || 0}</span>
                                        <button
                                            type="button"
                                            className="flight-btn-counter"
                                            onClick={() => setSearchParams(prev => ({ ...prev, adults: Math.min(9, (prev.adults || 0) + 1) }))}
                                        >+</button>
                                    </div>
                                </div>

                                {/* Children */}
                                <div className="flight-counter-group">
                                    <label><Users2 size={16} /> DECA</label>
                                    <div className="flight-counter-controls">
                                        <button
                                            type="button"
                                            className="flight-btn-counter"
                                            onClick={() => {
                                                const newCount = Math.max(0, (searchParams.children || 0) - 1);
                                                setSearchParams(prev => ({
                                                    ...prev,
                                                    children: newCount,
                                                    childrenAges: prev.childrenAges.slice(0, newCount)
                                                }));
                                            }}
                                        >−</button>
                                        <span className="flight-counter-val">{searchParams.children || 0}</span>
                                        <button
                                            type="button"
                                            className="flight-btn-counter"
                                            onClick={() => {
                                                const newCount = Math.min(6, (searchParams.children || 0) + 1);
                                                setSearchParams(prev => ({
                                                    ...prev,
                                                    children: newCount,
                                                    childrenAges: [...prev.childrenAges, 7].slice(0, newCount)
                                                }));
                                            }}
                                        >+</button>
                                    </div>
                                </div>

                                {/* Children Ages In Line */}
                                {searchParams.children > 0 && (
                                    <div className="children-ages-inline-flight">
                                        {searchParams.childrenAges.map((age, idx) => (
                                            <div key={idx} className="age-input-compact" title={`${idx + 1}. DETE`}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="17"
                                                    placeholder="Godine"
                                                    value={age || ''}
                                                    onChange={e => {
                                                        const newAges = [...searchParams.childrenAges];
                                                        newAges[idx] = parseInt(e.target.value) || 0;
                                                        setSearchParams(prev => ({ ...prev, childrenAges: newAges }));
                                                    }}
                                                    className="child-age-input mini"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Cabin Class In Line */}
                                <div className="input-group-flight cabin-group-inline">
                                    <select
                                        value={searchParams.cabinClass}
                                        onChange={e => setSearchParams(prev => ({ ...prev, cabinClass: e.target.value as any }))}
                                    >
                                        <option value="economy">Ekonomska</option>
                                        <option value="premium_economy">Premium</option>
                                        <option value="business">Biznis</option>
                                        <option value="first">Prva</option>
                                    </select>
                                </div>
                            </div>

                            {/* Search Button */}
                            <button
                                className="search-flights-btn"
                                onClick={() => handleSearch()}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="spin" />
                                        Pretražujem...
                                    </>
                                ) : (
                                    <ClickToTravelLogo height={32} />
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Multi-City Form */}
                        <MultiCityFlightForm
                            legs={multiCityLegs}
                            onLegsChange={setMultiCityLegs}
                            maxLegs={5}
                        />

                        <div className="form-row">
                            <div className="passenger-row-flight">
                                {/* Adults */}
                                <div className="flight-counter-group">
                                    <label><Users size={16} /> ODRASLI</label>
                                    <div className="flight-counter-controls">
                                        <button
                                            type="button"
                                            className="flight-btn-counter"
                                            onClick={() => setSearchParams(prev => ({ ...prev, adults: Math.max(1, (prev.adults || 0) - 1) }))}
                                        >−</button>
                                        <span className="flight-counter-val">{searchParams.adults || 0}</span>
                                        <button
                                            type="button"
                                            className="flight-btn-counter"
                                            onClick={() => setSearchParams(prev => ({ ...prev, adults: Math.min(9, (prev.adults || 0) + 1) }))}
                                        >+</button>
                                    </div>
                                </div>

                                {/* Children */}
                                <div className="flight-counter-group">
                                    <label><Users2 size={16} /> DECA</label>
                                    <div className="flight-counter-controls">
                                        <button
                                            type="button"
                                            className="flight-btn-counter"
                                            onClick={() => {
                                                const newCount = Math.max(0, (searchParams.children || 0) - 1);
                                                setSearchParams(prev => ({
                                                    ...prev,
                                                    children: newCount,
                                                    childrenAges: prev.childrenAges.slice(0, newCount)
                                                }));
                                            }}
                                        >−</button>
                                        <span className="flight-counter-val">{searchParams.children || 0}</span>
                                        <button
                                            type="button"
                                            className="flight-btn-counter"
                                            onClick={() => {
                                                const newCount = Math.min(6, (searchParams.children || 0) + 1);
                                                setSearchParams(prev => ({
                                                    ...prev,
                                                    children: newCount,
                                                    childrenAges: [...prev.childrenAges, 7].slice(0, newCount)
                                                }));
                                            }}
                                        >+</button>
                                    </div>
                                </div>

                                {/* Children Ages In Line */}
                                {searchParams.children > 0 && (
                                    <div className="children-ages-inline-flight">
                                        {searchParams.childrenAges.map((age, idx) => (
                                            <div key={idx} className="age-input-compact" title={`${idx + 1}. DETE`}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="17"
                                                    placeholder="Godine"
                                                    value={age || ''}
                                                    onChange={e => {
                                                        const newAges = [...searchParams.childrenAges];
                                                        newAges[idx] = parseInt(e.target.value) || 0;
                                                        setSearchParams(prev => ({ ...prev, childrenAges: newAges }));
                                                    }}
                                                    className="child-age-input mini"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Cabin Class In Line */}
                                <div className="input-group-flight cabin-group-inline">
                                    <select
                                        value={searchParams.cabinClass}
                                        onChange={e => setSearchParams(prev => ({ ...prev, cabinClass: e.target.value as any }))}
                                    >
                                        <option value="economy">Ekonomska</option>
                                        <option value="premium_economy">Premium</option>
                                        <option value="business">Biznis</option>
                                        <option value="first">Prva</option>
                                    </select>
                                </div>
                            </div>

                            {/* Search Button */}
                            <button
                                className="search-flights-btn"
                                onClick={() => handleSearch()}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="spin" />
                                        Pretražujem...
                                    </>
                                ) : (
                                    <ClickToTravelLogo height={32} />
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* Advanced Options Toggle */}
                <div className="advanced-options-toggle">
                    <button
                        className="toggle-advanced-btn"
                        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    >
                        <SlidersHorizontal size={16} />
                        {showAdvancedOptions ? 'Sakrij napredne opcije' : 'Napredne opcije'}
                        {showAdvancedOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>

                {/* Advanced Options Panel */}
                {showAdvancedOptions && (
                    <div className="advanced-options-panel">
                        {/* Flexible Dates */}
                        <div className="advanced-option-group">
                            <label className="advanced-option-label">
                                <Calendar size={16} />
                                Fleksibilni Datumi
                            </label>
                            <div className="flexible-dates-options">
                                <button
                                    className={`date-flex-btn ${flexibleDates === 0 ? 'active' : ''}`}
                                    onClick={() => setFlexibleDates(0)}
                                >
                                    Tačan datum
                                </button>
                                <button
                                    className={`date-flex-btn ${flexibleDates === 1 ? 'active' : ''}`}
                                    onClick={() => setFlexibleDates(1)}
                                >
                                    ± 1 dan
                                </button>
                                <button
                                    className={`date-flex-btn ${flexibleDates === 2 ? 'active' : ''}`}
                                    onClick={() => setFlexibleDates(2)}
                                >
                                    ± 2 dana
                                </button>
                                <button
                                    className={`date-flex-btn ${flexibleDates === 3 ? 'active' : ''}`}
                                    onClick={() => setFlexibleDates(3)}
                                >
                                    ± 3 dana
                                </button>
                            </div>
                            <span className="option-hint">
                                Pretražite letove u rasponu od {flexibleDates} {flexibleDates === 1 ? 'dana' : 'dana'} oko izabranog datuma za najbolje cene
                            </span>
                        </div>

                        {/* Max Stops */}
                        <div className="advanced-option-group">
                            <label className="advanced-option-label">
                                <Plane size={16} />
                                Broj Presedanja
                            </label>
                            <div className="stops-options">
                                <button
                                    className={`stops-btn ${searchParams.maxStops === 0 ? 'active' : ''}`}
                                    onClick={() => setSearchParams(prev => ({ ...prev, maxStops: 0, directFlightsOnly: true }))}
                                >
                                    <Zap size={14} />
                                    Direktan let
                                </button>
                                <button
                                    className={`stops-btn ${searchParams.maxStops === 1 ? 'active' : ''}`}
                                    onClick={() => setSearchParams(prev => ({ ...prev, maxStops: 1, directFlightsOnly: false }))}
                                >
                                    Max 1 presedanje
                                </button>
                                <button
                                    className={`stops-btn ${searchParams.maxStops === 2 ? 'active' : ''}`}
                                    onClick={() => setSearchParams(prev => ({ ...prev, maxStops: 2, directFlightsOnly: false }))}
                                >
                                    Max 2 presedanja
                                </button>
                                <button
                                    className={`stops-btn ${searchParams.maxStops === undefined ? 'active' : ''}`}
                                    onClick={() => setSearchParams(prev => ({ ...prev, maxStops: undefined, directFlightsOnly: false }))}
                                >
                                    Bilo koji
                                </button>
                            </div>
                            <span className="option-hint">
                                {searchParams.maxStops === 0 && 'Samo direktni letovi - brže, ali može biti skuplje'}
                                {searchParams.maxStops === 1 && 'Do 1 presedanja - dobar balans cene i vremena'}
                                {searchParams.maxStops === 2 && 'Do 2 presedanja - više opcija, često jeftinije'}
                                {searchParams.maxStops === undefined && 'Svi letovi - najširi izbor i najbolje cene'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flight-loading">
                    <div className="loading-animation">
                        <Plane size={48} className="plane-loading" />
                    </div>
                    <p>Pretražujemo najbolje ponude...</p>
                    <div className="loading-providers">
                        <span className="provider-badge">Amadeus</span>
                        <span className="provider-badge">Kyte</span>
                        <span className="provider-badge">Kiwi.com</span>
                        <span className="provider-badge">Duffel</span>
                    </div>
                </div>
            )}

            {/* Results */}
            {searchPerformed && !isLoading && (
                <div className="flight-results-container">

                    {/* Date Carousel */}
                    <FlightDateCarousel
                        selectedDate={searchParams.departureDate || ''}
                        basePrice={results.length > 0 ? Math.min(...results.map(r => r.price.total)) : 500}
                        currency={searchParams.currency}
                        onDateSelect={handleDateChange}
                    />

                    {/* Results Header */}
                    <div className="results-header">
                        <div className="results-count">
                            <Zap size={20} />
                            <span>Pronađeno {results.length} letova</span>
                        </div>
                        <div className="results-sort">
                            <label>Sortiraj po:</label>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                                <option value="price">Ceni</option>
                                <option value="duration">Trajanju</option>
                                <option value="departure">Vremenu polaska</option>
                            </select>
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="flight-results-grid">
                        {sortedResults.map(offer => (
                            <div key={offer.id} className="flight-offer-card">
                                {/* Provider Badge */}
                                <div className="provider-badge-top">{offer.provider}</div>

                                {/* Flight Info */}
                                <div className="flight-info-section">
                                    {offer.slices.map((slice, idx) => (
                                        <div key={idx} className="flight-slice">
                                            {/* Airline Logo & Info */}
                                            <div className="airline-header">
                                                <img
                                                    src={`https://images.kiwi.com/airlines/64/${slice.segments[0].carrierCode}.png`}
                                                    alt={slice.segments[0].carrierName}
                                                    className="airline-logo"
                                                    onError={(e) => {
                                                        e.currentTarget.src = `https://via.placeholder.com/64x64/667eea/ffffff?text=${slice.segments[0].carrierCode}`;
                                                    }}
                                                />
                                                <div className="airline-info">
                                                    <span className="airline-name">{slice.segments[0].carrierName}</span>
                                                    <span className="flight-type">
                                                        {slice.stops === 0 ? '✈️ Direktan let' : `🔄 ${slice.stops} presedanje`}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Route */}
                                            <div className="flight-route">
                                                <div className="airport-info">
                                                    <span className="airport-code">{slice.origin.iataCode}</span>
                                                    <span className="airport-time">{formatTime(slice.departure)}</span>
                                                    <span className="airport-city">{slice.origin.city}</span>
                                                </div>
                                                <div className="flight-path">
                                                    <div className="flight-path-visual">
                                                        <div className="path-dot"></div>
                                                        <div className="path-line"></div>
                                                        <Plane size={14} className="path-plane" />
                                                        <div className="path-line"></div>
                                                        <div className="path-dot"></div>
                                                    </div>
                                                    <span className="flight-duration">{formatDuration(slice.duration)}</span>
                                                </div>
                                                <div className="airport-info">
                                                    <span className="airport-code">{slice.destination.iataCode}</span>
                                                    <span className="airport-time">{formatTime(slice.arrival)}</span>
                                                    <span className="airport-city">{slice.destination.city}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Price & Action */}
                                <div className="flight-price-section">
                                    <div className="price-display">
                                        <span className="price-amount">{offer.price.total.toFixed(2)} {offer.price.currency}</span>
                                        <span className="price-label">za {searchParams.adults + searchParams.children} putnika</span>
                                    </div>
                                    <button
                                        className="select-flight-btn"
                                        onClick={() => navigate('/booking', {
                                            state: {
                                                offer,
                                                searchParams,
                                                tripType,
                                                multiCityLegs: tripType === 'multi-city' ? multiCityLegs : undefined
                                            }
                                        })}
                                    >
                                        Izaberi
                                        <ArrowRight size={16} />
                                    </button>
                                </div>

                                {/* Expand Details Button */}
                                <button
                                    className="expand-details-btn"
                                    onClick={() => setExpandedOfferId(expandedOfferId === offer.id ? null : offer.id)}
                                >
                                    {expandedOfferId === offer.id ? (
                                        <>
                                            <ChevronUp size={18} />
                                            Sakrij detalje
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown size={18} />
                                            Više informacija
                                        </>
                                    )}
                                </button>

                                {/* Expanded Details */}
                                {expandedOfferId === offer.id && (
                                    <div className="flight-details-expanded">
                                        {/* Price Breakdown */}
                                        <div className="detail-section">
                                            <h4><Star size={16} /> Detalji Cene</h4>
                                            <div className="price-breakdown">
                                                <div className="price-row">
                                                    <span>Osnovna cena:</span>
                                                    <span>{offer.price.base.toFixed(2)} {offer.price.currency}</span>
                                                </div>
                                                <div className="price-row">
                                                    <span>Takse i naknade:</span>
                                                    <span>{offer.price.taxes.toFixed(2)} {offer.price.currency}</span>
                                                </div>
                                                <div className="price-row total">
                                                    <span>Ukupno:</span>
                                                    <span>{offer.price.total.toFixed(2)} {offer.price.currency}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Baggage */}
                                        {offer.baggageAllowance && (
                                            <div className="detail-section">
                                                <h4><Briefcase size={16} /> Prtljag</h4>
                                                <div className="baggage-info">
                                                    {offer.baggageAllowance.cabin && (
                                                        <div className="baggage-item">
                                                            <span className="baggage-type">Ručni:</span>
                                                            <span>{offer.baggageAllowance.cabin.quantity}x {offer.baggageAllowance.cabin.weight}kg</span>
                                                        </div>
                                                    )}
                                                    {offer.baggageAllowance.checked && (
                                                        <div className="baggage-item">
                                                            <span className="baggage-type">Predati:</span>
                                                            <span>{offer.baggageAllowance.checked.quantity}x {offer.baggageAllowance.checked.weight}kg</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Flight Segments */}
                                        {offer.slices.map((slice, sliceIdx) => (
                                            <div key={sliceIdx} className="detail-section">
                                                <h4>
                                                    <Plane size={16} />
                                                    {sliceIdx === 0 ? 'Odlazak' : 'Povratak'} - {slice.segments.length > 1 ? `${slice.segments.length} leta` : 'Direktan let'}
                                                </h4>
                                                <div className="segments-timeline">
                                                    {slice.segments.map((segment, segIdx) => (
                                                        <div key={segIdx} className="segment-card">
                                                            <div className="segment-header">
                                                                <img
                                                                    src={`https://images.kiwi.com/airlines/32/${segment.carrierCode}.png`}
                                                                    alt={segment.carrierName}
                                                                    className="segment-airline-logo"
                                                                    onError={(e) => {
                                                                        e.currentTarget.src = `https://via.placeholder.com/32x32/667eea/ffffff?text=${segment.carrierCode}`;
                                                                    }}
                                                                />
                                                                <div className="segment-airline">
                                                                    <span className="segment-carrier">{segment.carrierName}</span>
                                                                    <span className="segment-flight-number">{segment.flightNumber}</span>
                                                                </div>
                                                                <span className="segment-aircraft">✈️ {segment.aircraft}</span>
                                                            </div>
                                                            <div className="segment-route">
                                                                <div className="segment-point">
                                                                    <span className="segment-time">{formatTime(segment.departure)}</span>
                                                                    <span className="segment-airport">{segment.origin.iataCode}</span>
                                                                    <span className="segment-city">{segment.origin.city}</span>
                                                                </div>
                                                                <div className="segment-duration">
                                                                    <Clock size={14} />
                                                                    <span>{formatDuration(segment.duration)}</span>
                                                                </div>
                                                                <div className="segment-point">
                                                                    <span className="segment-time">{formatTime(segment.arrival)}</span>
                                                                    <span className="segment-airport">{segment.destination.iataCode}</span>
                                                                    <span className="segment-city">{segment.destination.city}</span>
                                                                </div>
                                                            </div>
                                                            {segIdx < slice.segments.length - 1 && (
                                                                <div className="layover-info">
                                                                    ⏱ Presedanje u {segment.destination.city}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Amenities */}
                                        {offer.amenities && offer.amenities.length > 0 && (
                                            <div className="detail-section">
                                                <h4><Zap size={16} /> Usluge</h4>
                                                <div className="amenities-list">
                                                    {offer.amenities.map((amenity, idx) => (
                                                        <span key={idx} className="amenity-badge">{amenity}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {searchPerformed && !isLoading && results.length === 0 && (
                <div className="flight-empty-state">
                    <Plane size={64} />
                    <h3>Nema dostupnih letova</h3>
                    <p>Pokušajte sa drugim datumima ili destinacijama</p>
                </div>
            )}

            {/* Initial State */}
            {!searchPerformed && !isLoading && (
                <div className="flight-initial-state">
                    <div className="initial-icon">
                        <Plane size={80} />
                    </div>
                    <h2>Započnite Pretragu</h2>
                    <p>Unesite detalje vašeg putovanja i pronađite najbolje ponude</p>
                </div>
            )}
        </div>
    );
};

export default FlightSearch;
