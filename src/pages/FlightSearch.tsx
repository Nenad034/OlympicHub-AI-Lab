import React, { useState, useEffect } from 'react';
import { ClickToTravelLogo } from '../components/icons/ClickToTravelLogo';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search, Plane, Calendar, Users, MapPin, ArrowRight,
    Loader2, Clock, Zap, Star,
    Briefcase, Users2, ChevronDown, ChevronUp, SlidersHorizontal,
    ArrowLeftRight, Globe
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

    // Time Filters (departure and arrival time ranges)
    const [outboundDepartureFrom, setOutboundDepartureFrom] = useState<string>('00:00');
    const [outboundDepartureTo, setOutboundDepartureTo] = useState<string>('23:59');
    const [outboundArrivalFrom, setOutboundArrivalFrom] = useState<string>('00:00');
    const [outboundArrivalTo, setOutboundArrivalTo] = useState<string>('23:59');

    const [inboundDepartureFrom, setInboundDepartureFrom] = useState<string>('00:00');
    const [inboundDepartureTo, setInboundDepartureTo] = useState<string>('23:59');
    const [inboundArrivalFrom, setInboundArrivalFrom] = useState<string>('00:00');
    const [inboundArrivalTo, setInboundArrivalTo] = useState<string>('23:59');

    // Results State
    const [results, setResults] = useState<UnifiedFlightOffer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [searchResponse, setSearchResponse] = useState<FlightSearchResponse | null>(null);

    // UI State
    const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'price' | 'duration' | 'departure'>('price');
    const [selectedAirline, setSelectedAirline] = useState<string>('all');

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

        // Enhance params with time filters if available
        const enhancedParams = {
            ...paramsToUse,
            outboundDepartureFrom,
            outboundDepartureTo,
            outboundArrivalFrom,
            outboundArrivalTo,
            inboundDepartureFrom,
            inboundDepartureTo,
            inboundArrivalFrom,
            inboundArrivalTo
        };

        try {
            // For multi-city, we would need to convert legs to search params
            // For now, using regular search params
            const response = await flightSearchManager.searchFlights(enhancedParams);
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

    // Filter results by airline
    const filteredResults = results.filter(offer => {
        if (selectedAirline === 'all') return true;
        return offer.slices.some(slice => slice.segments[0].carrierName === selectedAirline);
    });

    // Unique airlines for filter
    const uniqueAirlines = Array.from(new Set(
        results.flatMap(offer => offer.slices.flatMap(slice => slice.segments.map(seg => seg.carrierName)))
    )).sort();

    // Sort results
    const sortedResults = [...filteredResults].sort((a, b) => {
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

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('sr-Latn-RS', {
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
                <div className="trip-type-selector-v2">
                    <button
                        type="button"
                        className={`trip-type-pill ${tripType === 'round-trip' ? 'active' : ''}`}
                        onClick={() => setTripType('round-trip')}
                    >
                        <ArrowLeftRight size={16} />
                        <span>POVRATNA KARTA</span>
                    </button>
                    <button
                        type="button"
                        className={`trip-type-pill ${tripType === 'one-way' ? 'active' : ''}`}
                        onClick={() => setTripType('one-way')}
                    >
                        <Plane size={16} className="rotate-45" />
                        <span>U JEDNOM PRAVCU</span>
                    </button>
                    <button
                        type="button"
                        className={`trip-type-pill ${tripType === 'multi-city' ? 'active' : ''}`}
                        onClick={() => setTripType('multi-city')}
                    >
                        <Globe size={16} />
                        <span>VIŠE DESTINACIJA</span>
                    </button>
                </div>

                {/* Conditional Form Rendering */}
                {tripType !== 'multi-city' ? (
                    <>
                        <div className="flight-params-grid">
                            <div className="flight-grid-row">
                                <div className="flight-col-origin">
                                    <AirportAutocomplete
                                        label="Polazište"
                                        value={searchParams.origin}
                                        onChange={code => setSearchParams(prev => ({ ...prev, origin: code }))}
                                        placeholder="Unesite grad ili aerodrom"
                                    />
                                </div>
                                <div className="flight-col-swap">
                                    <button className="btn-swap-locations" onClick={() => {
                                        setSearchParams(prev => ({
                                            ...prev,
                                            origin: prev.destination,
                                            destination: prev.origin
                                        }));
                                    }}>
                                        <ArrowLeftRight size={18} />
                                    </button>
                                </div>
                                <div className="flight-col-destination">
                                    <AirportAutocomplete
                                        label="Odredište"
                                        value={searchParams.destination}
                                        onChange={code => setSearchParams(prev => ({ ...prev, destination: code }))}
                                        placeholder="Unesite grad ili aerodrom"
                                    />
                                </div>
                                <div className="flight-col-dates">
                                    <div className="flight-dates-row">
                                        <div className="input-group-flight">
                                            <CustomDatePicker
                                                label="Polazak"
                                                selectedDate={searchParams.departureDate}
                                                onDateSelect={date => setSearchParams(prev => {
                                                    const newState = { ...prev, departureDate: date };
                                                    if (prev.returnDate && date > prev.returnDate) {
                                                        newState.returnDate = date;
                                                    }
                                                    return newState;
                                                })}
                                                minDate={new Date().toISOString().split('T')[0]}
                                                returnDate={tripType === 'round-trip' ? searchParams.returnDate : undefined}
                                            />
                                        </div>
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
                                </div>
                            </div>

                            <div className="flight-grid-row second-row">
                                <div className="flight-pax-config">
                                    <div className="field-label-mini"><Users size={14} /> PUTNICI I KLASA</div>
                                    <div className="passenger-row-redesign-v2">
                                        <div className="flight-counter-group-v2">
                                            <span className="counter-label">Odrasli</span>
                                            <div className="counter-controls-v2">
                                                <button onClick={() => setSearchParams(prev => ({ ...prev, adults: Math.max(1, (prev.adults || 0) - 1) }))}>-</button>
                                                <span>{searchParams.adults || 0}</span>
                                                <button onClick={() => setSearchParams(prev => ({ ...prev, adults: Math.min(9, (prev.adults || 0) + 1) }))}>+</button>
                                            </div>
                                        </div>

                                        <div className="flight-counter-group-v2">
                                            <span className="counter-label">Deca</span>
                                            <div className="counter-controls-v2">
                                                <button onClick={() => {
                                                    const newCount = Math.max(0, (searchParams.children || 0) - 1);
                                                    setSearchParams(prev => ({
                                                        ...prev,
                                                        children: newCount,
                                                        childrenAges: prev.childrenAges.slice(0, newCount)
                                                    }));
                                                }}>-</button>
                                                <span>{searchParams.children || 0}</span>
                                                <button onClick={() => {
                                                    const newCount = Math.min(6, (searchParams.children || 0) + 1);
                                                    setSearchParams(prev => ({
                                                        ...prev,
                                                        children: newCount,
                                                        childrenAges: [...prev.childrenAges, 0].slice(0, newCount)
                                                    }));
                                                }}>+</button>
                                            </div>
                                        </div>

                                        {searchParams.children > 0 && (
                                            <div className="children-ages-row-v2">
                                                {searchParams.childrenAges.map((age, idx) => (
                                                    <div key={idx} className="age-input-v2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="17"
                                                            value={age || ''}
                                                            onChange={(e) => {
                                                                const newAges = [...searchParams.childrenAges];
                                                                newAges[idx] = parseInt(e.target.value) || 0;
                                                                setSearchParams(prev => ({ ...prev, childrenAges: newAges }));
                                                            }}
                                                            placeholder={`Dete ${idx + 1}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flight-class-selector">
                                            <span className="counter-label">Klasa</span>
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
                                </div>
                            </div>

                            <div className="flight-action-row">
                                <button
                                    className="btn-search-flights-premium"
                                    onClick={() => handleSearch()}
                                    disabled={isLoading}
                                >
                                    <div className="btn-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <div style={{ opacity: isLoading ? 0.2 : 1, transition: 'all 0.3s ease' }}>
                                            <ClickToTravelLogo height={65} iconOnly={true} iconScale={2.2} />
                                        </div>
                                        {isLoading && (
                                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Loader2 className="spin" size={32} color="#fff" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            </div>
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Loader2 size={20} className="spin" />
                                        <span>Pretražujem...</span>
                                    </div>
                                ) : (
                                    <ClickToTravelLogo height={32} iconOnly={true} />
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
                        {showAdvancedOptions ? 'Zatvori Naprednu pretragu' : 'Napredna pretraga'}
                        {showAdvancedOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>

                {/* Advanced Options Panel */}
                {showAdvancedOptions && (
                    <div className="advanced-options-panel">
                        <div className="advanced-options-grid">
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
                                        ± 2 d
                                    </button>
                                    <button
                                        className={`date-flex-btn ${flexibleDates === 3 ? 'active' : ''}`}
                                        onClick={() => setFlexibleDates(3)}
                                    >
                                        ± 3 d
                                    </button>
                                </div>
                            </div>

                            {/* Max Stops */}
                            <div className="advanced-option-group">
                                <label className="advanced-option-label">
                                    <Plane size={16} />
                                    Maksimalan broj presedanja
                                </label>
                                <div className="stops-options">
                                    <button
                                        className={`stops-btn ${searchParams.maxStops === 0 ? 'active' : ''}`}
                                        onClick={() => setSearchParams(prev => ({ ...prev, maxStops: 0, directFlightsOnly: true }))}
                                    >
                                        <Zap size={14} />
                                        Direktan
                                    </button>
                                    <button
                                        className={`stops-btn ${searchParams.maxStops === 1 ? 'active' : ''}`}
                                        onClick={() => setSearchParams(prev => ({ ...prev, maxStops: 1, directFlightsOnly: false }))}
                                    >
                                        Max 1
                                    </button>
                                    <button
                                        className={`stops-btn ${searchParams.maxStops === 2 ? 'active' : ''}`}
                                        onClick={() => setSearchParams(prev => ({ ...prev, maxStops: 2, directFlightsOnly: false }))}
                                    >
                                        Max 2
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="advanced-divider"></div>

                        {/* Departure/Arrival Times - Outbound */}
                        <div className="time-filters-section">
                            <h4 className="time-section-title"><Clock size={14} /> Vreme leta - POLAZAK</h4>
                            <div className="time-filters-grid">
                                <div className="time-filter-item">
                                    <label>Polazak od - do:</label>
                                    <div className="time-range-inputs">
                                        <input type="time" value={outboundDepartureFrom} onChange={e => setOutboundDepartureFrom(e.target.value)} />
                                        <span>-</span>
                                        <input type="time" value={outboundDepartureTo} onChange={e => setOutboundDepartureTo(e.target.value)} />
                                    </div>
                                </div>
                                <div className="time-filter-item">
                                    <label>Dolazak (sletanje) od - do:</label>
                                    <div className="time-range-inputs">
                                        <input type="time" value={outboundArrivalFrom} onChange={e => setOutboundArrivalFrom(e.target.value)} />
                                        <span>-</span>
                                        <input type="time" value={outboundArrivalTo} onChange={e => setOutboundArrivalTo(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {tripType === 'round-trip' && (
                            <>
                                <div className="advanced-divider"></div>
                                {/* Departure/Arrival Times - Inbound */}
                                <div className="time-filters-section">
                                    <h4 className="time-section-title"><Clock size={14} /> Vreme leta - POVRATAK</h4>
                                    <div className="time-filters-grid">
                                        <div className="time-filter-item">
                                            <label>Polazak od - do:</label>
                                            <div className="time-range-inputs">
                                                <input type="time" value={inboundDepartureFrom} onChange={e => setInboundDepartureFrom(e.target.value)} />
                                                <span>-</span>
                                                <input type="time" value={inboundDepartureTo} onChange={e => setInboundDepartureTo(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="time-filter-item">
                                            <label>Dolazak (sletanje) od - do:</label>
                                            <div className="time-range-inputs">
                                                <input type="time" value={inboundArrivalFrom} onChange={e => setInboundArrivalFrom(e.target.value)} />
                                                <span>-</span>
                                                <input type="time" value={inboundArrivalTo} onChange={e => setInboundArrivalTo(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
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
                        currency={searchParams.currency || 'EUR'}
                        onDateSelect={handleDateChange}
                    />

                    {/* Results Header */}
                    <div className="results-header">
                        <div className="results-count">
                            <Zap size={20} />
                            <span>Pronađeno {filteredResults.length} letova</span>
                        </div>
                        <div className="filters-group-row">
                            <div className="results-filter">
                                <label>Avio kompanija:</label>
                                <select value={selectedAirline} onChange={e => setSelectedAirline(e.target.value)}>
                                    <option value="all">Sve kompanije</option>
                                    {uniqueAirlines.map(airline => (
                                        <option key={airline} value={airline}>{airline}</option>
                                    ))}
                                </select>
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
                                        <div key={idx} className="flight-slice-compact">
                                            {/* Airline Logo & Info - Shared row */}
                                            <div className="slice-main-row">
                                                <div className="airline-brand">
                                                    <img
                                                        src={`https://images.kiwi.com/airlines/64/${slice.segments[0].carrierCode}.png`}
                                                        alt={slice.segments[0].carrierName}
                                                        className="airline-logo-small"
                                                        onError={(e) => {
                                                            e.currentTarget.src = `https://via.placeholder.com/64x64/667eea/ffffff?text=${slice.segments[0].carrierCode}`;
                                                        }}
                                                    />
                                                    <div className="airline-meta">
                                                        <span className="airline-name-compact">{slice.segments[0].carrierName}</span>
                                                        <span className="stops-tag">{slice.stops === 0 ? 'Direktan' : `${slice.stops} presedanje`}</span>
                                                    </div>
                                                </div>

                                                <div className="route-container-compact">
                                                    <div className="time-point origin">
                                                        <span className="t-time">{formatTime(slice.departure)}</span>
                                                        <span className="t-code">{slice.origin.iataCode}</span>
                                                    </div>

                                                    <div className="path-visual-compact">
                                                        <span className="p-duration">{formatDuration(slice.duration)}</span>
                                                        <div className="p-line">
                                                            <div className="p-dot"></div>
                                                            <div className="p-connector"></div>
                                                            <Plane size={12} className="p-plane" />
                                                            <div className="p-connector"></div>
                                                            <div className="p-dot"></div>
                                                        </div>
                                                    </div>

                                                    <div className="time-point destination">
                                                        <span className="t-time">{formatTime(slice.arrival)}</span>
                                                        <span className="t-code">{slice.destination.iataCode}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {idx < offer.slices.length - 1 && <div className="slice-divider-thin"></div>}
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

                                {expandedOfferId === offer.id && (
                                    <div className="flight-details-expanded-compact">
                                        <div className="details-header-row">
                                            {/* Price Breakdown */}
                                            <div className="detail-box price-box">
                                                <h4><Star size={14} /> CENA</h4>
                                                <div className="price-mini-table">
                                                    <div className="p-row"><span>Osnovna:</span><span>{offer.price.base.toFixed(2)} {offer.price.currency}</span></div>
                                                    <div className="p-row"><span>Takse:</span><span>{offer.price.taxes.toFixed(2)} {offer.price.currency}</span></div>
                                                    <div className="p-row bold"><span>Ukupno:</span><span>{offer.price.total.toFixed(2)} {offer.price.currency}</span></div>
                                                </div>
                                            </div>

                                            {/* Baggage */}
                                            {offer.baggageAllowance && (
                                                <div className="detail-box baggage-box">
                                                    <h4><Briefcase size={14} /> PRTLJAG</h4>
                                                    <div className="baggage-mini-list">
                                                        {offer.baggageAllowance.cabin && (
                                                            <div className="b-row"><span>Ručni:</span><span>{offer.baggageAllowance.cabin.quantity}x {offer.baggageAllowance.cabin.weight}kg</span></div>
                                                        )}
                                                        {offer.baggageAllowance.checked && (
                                                            <div className="b-row"><span>Predati:</span><span>{offer.baggageAllowance.checked.quantity}x {offer.baggageAllowance.checked.weight}kg</span></div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Flight Segments */}
                                        <div className="segments-section-compact">
                                            {offer.slices.map((slice, sliceIdx) => (
                                                <div key={sliceIdx} className="slice-segments-compact">
                                                    <h5 className="slice-title-mini">
                                                        {sliceIdx === 0 ? 'ODLAZAK' : 'POVRATAK'} ({slice.origin.iataCode} → {slice.destination.iataCode})
                                                    </h5>
                                                    <div className="segments-list-compact">
                                                        {slice.segments.map((segment, segIdx) => (
                                                            <div key={segIdx} className="segment-row-compact">
                                                                <div className="seg-time-code">
                                                                    <span className="s-time">{formatTime(segment.departure)}</span>
                                                                    <span className="s-iata">{segment.origin.iataCode}</span>
                                                                </div>
                                                                <div className="seg-connector">
                                                                    <div className="s-dot"></div>
                                                                    <div className="s-line"></div>
                                                                    <div className="s-dot"></div>
                                                                </div>
                                                                <div className="seg-time-code">
                                                                    <span className="s-time">{formatTime(segment.arrival)}</span>
                                                                    <span className="s-iata">{segment.destination.iataCode}</span>
                                                                </div>
                                                                <div className="seg-info-compact">
                                                                    <img src={`https://images.kiwi.com/airlines/32/${segment.carrierCode}.png`} alt="" className="s-airline-icon" />
                                                                    <span className="s-flight-no">{segment.carrierName} {segment.flightNumber}</span>
                                                                    <span className="s-aircraft">{segment.aircraft}</span>
                                                                </div>
                                                                {segIdx < slice.segments.length - 1 && (
                                                                    <div className="layover-tag-mini">
                                                                        Presedanje: {formatDuration((new Date(slice.segments[segIdx + 1].departure).getTime() - new Date(segment.arrival).getTime()) / 60000)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
