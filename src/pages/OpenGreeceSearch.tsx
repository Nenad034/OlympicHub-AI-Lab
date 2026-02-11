import React, { useState, useEffect } from 'react';
import { ClickToTravelLogo } from '../components/icons/ClickToTravelLogo';
import {
    Search, Hotel, MapPin, Calendar, Users, Sparkles,
    Loader2, CheckCircle2, MoveRight, MoveLeft, Moon,
    Zap, Home, Users2, Compass, AlertCircle, Star,
    ArrowLeft, RefreshCw, Info, Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OpenGreeceAPI from '../services/opengreeceApiService';
import { useThemeStore } from '../stores';
import { translations } from '../translations';
import '../modules/pricing/TotalTripSearch.css';
import './OpenGreeceSearch.css';

import type { OpenGreeceHotel, OpenGreeceAvailabilityResponse, OpenGreeceHotelResult } from '../types/opengreece.types';

const OpenGreeceSearch: React.FC = () => {
    const navigate = useNavigate();
    const { lang } = useThemeStore();
    const t = translations[lang];

    // Hotels from Push sync
    const [hotels, setHotels] = useState<OpenGreeceHotel[]>([]);
    const [loadingHotels, setLoadingHotels] = useState(false);

    // Search params
    const [selectedHotel, setSelectedHotel] = useState<string>('');
    const [hotelSearch, setHotelSearch] = useState('');
    const [showHotelDropdown, setShowHotelDropdown] = useState(false);
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [nights, setNights] = useState(7);
    const [rooms, setRooms] = useState(1);
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [childrenAges, setChildrenAges] = useState<number[]>([]);

    // Results
    const [results, setResults] = useState<OpenGreeceAvailabilityResponse | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load hotels on mount
    useEffect(() => {
        loadHotels();
    }, []);

    const loadHotels = async () => {
        setLoadingHotels(true);
        try {
            const response = await OpenGreeceAPI.startPushProcess(false);
            if (response.success && response.data) {
                setHotels(response.data.hotels);
            }
        } catch (err) {
            console.error('Failed to load hotels:', err);
        } finally {
            setLoadingHotels(false);
        }
    };

    // Filter hotels based on search
    const filteredHotels = hotels.filter(h =>
        h.hotelName.toLowerCase().includes(hotelSearch.toLowerCase()) ||
        h.hotelCode.includes(hotelSearch)
    );

    // Date handlers
    const handleCheckInChange = (date: string) => {
        setCheckIn(date);
        if (date && nights > 0) {
            const outDate = new Date(date);
            outDate.setDate(outDate.getDate() + nights);
            setCheckOut(outDate.toISOString().split('T')[0]);
        }
    };

    const handleNightsChange = (n: number) => {
        setNights(n);
        if (checkIn && n > 0) {
            const outDate = new Date(checkIn);
            outDate.setDate(outDate.getDate() + n);
            setCheckOut(outDate.toISOString().split('T')[0]);
        }
    };

    const handleCheckOutChange = (date: string) => {
        setCheckOut(date);
        if (checkIn && date) {
            const diffTime = Math.abs(new Date(date).getTime() - new Date(checkIn).getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setNights(diffDays);
        }
    };

    const handleChildrenChange = (count: number) => {
        const validCount = Math.min(4, Math.max(0, count));
        setChildren(validCount);
        setChildrenAges(Array(validCount).fill(7));
    };

    // Search availability
    const handleSearch = async () => {
        if (!selectedHotel) {
            setError('Molimo izaberite hotel');
            return;
        }
        if (!checkIn || !checkOut) {
            setError('Molimo unesite datume');
            return;
        }

        setIsSearching(true);
        setSearchPerformed(true);
        setError(null);

        try {
            const response = await OpenGreeceAPI.checkAvailability({
                hotelCode: selectedHotel,
                checkIn,
                checkOut,
                adults,
                children,
                childrenAges,
                rooms
            });

            if (response.success && response.data) {
                // Parse availability response
                setResults(response.data);
            } else {
                setError(response.errors?.map(e => e.message).join(', ') || 'Greška pri pretrazi');
            }
        } catch (err) {
            setError(String(err));
        } finally {
            setIsSearching(false);
        }
    };

    const selectHotel = (hotel: OpenGreeceHotel) => {
        setSelectedHotel(hotel.hotelCode);
        setHotelSearch(hotel.hotelName);
        setShowHotelDropdown(false);
    };

    return (
        <div className="total-trip-container opengreece-search">
            <header className="total-trip-header">
                <div className="header-content">
                    <button
                        className="back-btn"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1><Globe className="icon-main" /> Open Greece Pretraga</h1>
                        <p>Pretražite dostupnost u realnom vremenu preko Open Greece API</p>
                    </div>
                </div>
                <div className="header-badge ai-premium opengreece">
                    <Sparkles size={16} />
                    <span>🇬🇷 Live API</span>
                </div>
            </header>

            <div className="trip-builder-console">
                {/* Hotel Stats */}
                <div className="component-selector-v4">
                    <div className="selector-group left">
                        <div className="stats-chip">
                            <Hotel size={18} />
                            <span>{hotels.length} hotela učitano</span>
                            {loadingHotels && <Loader2 size={14} className="spin" />}
                        </div>
                        <button
                            className="comp-chip"
                            onClick={loadHotels}
                            disabled={loadingHotels}
                        >
                            <RefreshCw size={18} />
                            <span>Osvježi listu</span>
                        </button>
                    </div>
                </div>

                <div className="search-form-complex">
                    {/* Row 1: Hotel Selection */}
                    <div className="form-row main">
                        <div className="input-group-premium main-search wide">
                            <label className="smart-label">
                                <Hotel size={14} />
                                Izaberite hotel iz Open Greece ponude
                            </label>
                            <div className="smart-input-container">
                                <input
                                    type="text"
                                    placeholder="Pretražite hotel po imenu ili kodu..."
                                    value={hotelSearch}
                                    onChange={e => {
                                        setHotelSearch(e.target.value);
                                        setShowHotelDropdown(true);
                                    }}
                                    onFocus={() => setShowHotelDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowHotelDropdown(false), 200)}
                                    className="smart-query-input"
                                />
                                <div className="input-ai-waves"></div>
                            </div>
                            {showHotelDropdown && filteredHotels.length > 0 && (
                                <div className="search-suggestions-dropdown hotel-dropdown">
                                    {filteredHotels.slice(0, 10).map(hotel => (
                                        <div
                                            key={hotel.hotelCode}
                                            className="suggestion-item hotel-suggestion"
                                            onClick={() => selectHotel(hotel)}
                                        >
                                            <Hotel size={14} className="sugg-icon" />
                                            <div className="hotel-info">
                                                <span className="hotel-name">{hotel.hotelName}</span>
                                                <span className="hotel-meta">
                                                    Kod: {hotel.hotelCode} | Do: {hotel.contractEndDate}
                                                </span>
                                            </div>
                                            <span className={`status-pill ${hotel.status.toLowerCase()}`}>
                                                {hotel.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="date-cluster">
                            <div className="input-group-premium">
                                <label><MoveRight size={14} /> Check-in</label>
                                <div className="custom-date-wrapper">
                                    <input
                                        type="date"
                                        value={checkIn}
                                        onChange={e => handleCheckInChange(e.target.value)}
                                        className="native-date-input"
                                    />
                                    <div className="date-display-overlay">
                                        {checkIn ? new Date(checkIn).toLocaleDateString('sr-RS') : 'dd.mm.yyyy'}
                                    </div>
                                </div>
                            </div>
                            <div className="input-group-premium nights-tiny">
                                <label><Moon size={14} /> Noćenja</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={nights || ''}
                                    onChange={e => handleNightsChange(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="input-group-premium">
                                <label><MoveLeft size={14} /> Check-out</label>
                                <div className="custom-date-wrapper">
                                    <input
                                        type="date"
                                        value={checkOut}
                                        onChange={e => handleCheckOutChange(e.target.value)}
                                        className="native-date-input"
                                    />
                                    <div className="date-display-overlay">
                                        {checkOut ? new Date(checkOut).toLocaleDateString('sr-RS') : 'dd.mm.yyyy'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Passengers */}
                    <div className="form-row passengers-action-line-v4">
                        <div className="input-group-premium rooms-input">
                            <label><Home size={14} /> Sobe</label>
                            <input
                                type="number"
                                min="1"
                                value={rooms || ''}
                                onChange={e => setRooms(parseInt(e.target.value) || 1)}
                            />
                        </div>
                        <div className="input-group-premium adults-input">
                            <label><Users size={14} /> Odrasli</label>
                            <input
                                type="number"
                                min="1"
                                value={adults || ''}
                                onChange={e => setAdults(parseInt(e.target.value) || 1)}
                            />
                        </div>
                        <div className="input-group-premium children-input">
                            <label><Users2 size={14} /> Deca</label>
                            <input
                                type="number"
                                min="0"
                                max="4"
                                value={children || ''}
                                onChange={e => handleChildrenChange(parseInt(e.target.value) || 0)}
                            />
                        </div>

                        {children > 0 && (
                            <div className="children-ages-inline-v4">
                                {childrenAges.map((age, idx) => (
                                    <div key={idx} className="age-input-premium">
                                        <label>Dete {idx + 1}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="17"
                                            value={age || ''}
                                            onChange={e => {
                                                const newAges = [...childrenAges];
                                                newAges[idx] = parseInt(e.target.value) || 0;
                                                setChildrenAges(newAges);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            className="search-launch-btn-v4"
                            onClick={handleSearch}
                            disabled={isSearching || !selectedHotel}
                        >
                            {isSearching ? <Loader2 className="spin" /> : <ClickToTravelLogo height={32} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="content-workflow">
                {error && (
                    <div className="error-banner">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {!searchPerformed && (
                    <div className="zen-placeholder">
                        <div className="zen-content">
                            <div className="musashi-icon-large greece-icon">
                                <span style={{ fontSize: '80px' }}>🇬🇷</span>
                            </div>
                            <h2>Open Greece - Live Pretraga</h2>
                            <p>
                                Izaberite hotel iz liste i unesite datume za pretragu dostupnosti u realnom vremenu.
                                Podaci dolaze direktno sa Open Greece API-ja.
                            </p>
                            <div className="info-pills">
                                <span className="info-pill"><CheckCircle2 size={14} /> {hotels.length} aktivnih hotela</span>
                                <span className="info-pill"><Globe size={14} /> Live API konekcija</span>
                                <span className="info-pill"><Zap size={14} /> Real-time dostupnost</span>
                            </div>
                        </div>
                    </div>
                )}

                {isSearching && (
                    <div className="loading-orchestrator">
                        <div className="pulse-loader greece"></div>
                        <p>Proveravam dostupnost preko Open Greece API...</p>
                    </div>
                )}

                {results && !isSearching && (
                    <div className="results-container">
                        <section className="results-info-banner">
                            <div className="banner-left">
                                <Info size={20} />
                                <span>Pronađeno <strong>{results.totalHotelsFound}</strong> hotela za period <strong>{new Date(results.checkIn).toLocaleDateString('sr-RS')} - {new Date(results.checkOut).toLocaleDateString('sr-RS')}</strong> ({results.nights} noći)</span>
                            </div>
                        </section>

                        <div className="hotel-results-grid">
                            {results.hotelResults.map((hotel: OpenGreeceHotelResult) => (
                                <div key={hotel.hotelCode} className="hotel-result-card-premium">
                                    <div className="hotel-card-image">
                                        <img
                                            src={hotel.mainImage || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800"}
                                            alt={hotel.hotelName}
                                        />
                                        <div className="image-overlay">
                                            <div className="hotel-stars-badge">
                                                {Array(hotel.starRating || 4).fill(0).map((_, i) => (
                                                    <Star key={i} size={12} fill="currentColor" />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hotel-card-content">
                                        <div className="hotel-header-main">
                                            <div>
                                                <h3>{hotel.hotelName}</h3>
                                                <div className="hotel-location-tag">
                                                    <MapPin size={14} />
                                                    <span>{hotel.address?.cityName || 'Grčka'}</span>
                                                </div>
                                            </div>
                                            {hotel.lowestPrice && (
                                                <div className="lowest-price-tag">
                                                    <span className="from-label">Već od</span>
                                                    <span className="price-val">{hotel.lowestPrice.totalAmount} {hotel.lowestPrice.currency}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="room-options-list">
                                            {hotel.rooms.slice(0, 3).map((room, idx) => (
                                                <div key={idx} className="room-offer-line">
                                                    <div className="room-info-box">
                                                        <span className="room-name-main">{room.roomName}</span>
                                                        <div className="room-meta-tags">
                                                            <span className="meta-tag"><Users size={12} /> {room.maxOccupancy} osobe</span>
                                                            {room.rates[0]?.mealPlan && (
                                                                <span className="meta-tag meal-tag">{room.rates[0].mealPlan.name}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="room-price-box">
                                                        <span className="room-price-val">
                                                            {room.rates[0]?.price.totalAmount} {room.rates[0]?.price.currency}
                                                        </span>
                                                        <button
                                                            className="book-btn-small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/booking/OpenGreece/${hotel.hotelCode}`, {
                                                                    state: {
                                                                        bookingContext: {
                                                                            hotelName: hotel.hotelName,
                                                                            roomName: room.roomName,
                                                                            price: room.rates[0]?.price.totalAmount,
                                                                            currency: room.rates[0]?.price.currency,
                                                                            checkIn: results.checkIn,
                                                                            checkOut: results.checkOut,
                                                                            nights: results.nights,
                                                                            adults,
                                                                            children,
                                                                            image: hotel.mainImage
                                                                        }
                                                                    }
                                                                });
                                                            }}
                                                        >
                                                            Rezerviši <MoveRight size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {hotel.rooms.length > 3 && (
                                                <button className="show-more-rooms">
                                                    + još {hotel.rooms.length - 3} opcija smeštaja
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OpenGreeceSearch;
