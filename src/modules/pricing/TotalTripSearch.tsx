import React, { useState } from 'react';
import { ClickToTravelLogo } from '../../components/icons/ClickToTravelLogo';
import {
    Search, Plane, Home, MapPin, Calendar, Users, Sparkles,
    Bus, Compass, Ticket, Loader2, CheckCircle2, Hotel,
    Info, CarFront, Ship, TrainFront, Utensils, Waves,
    Castle, Users2, ChevronRight, PlusCircle, Trash2,
    Moon, RotateCcw, Zap, MoveRight, MoveLeft
} from 'lucide-react';
import { searchOffers, getSearchSuggestions, type OfferInquiry } from '../../services/aiOfferService';
import { useThemeStore } from '../../stores';
import { translations } from '../../translations';
import './TotalTripSearch.css';


const TotalTripSearch: React.FC = () => {
    const { lang } = useThemeStore();
    const t = translations[lang];

    const TRIP_CATEGORIES_PRIMARY = [
        { id: 'hotel', label: t.accommodation, icon: <Hotel size={18} /> },
        { id: 'flight', label: t.flight, icon: <Plane size={18} /> },
        { id: 'transfer', label: t.transfer, icon: <CarFront size={18} /> },
    ];

    const TRIP_CATEGORIES_SECONDARY = [
        { id: 'group', label: t.travels, icon: <Users2 size={18} /> },
        { id: 'ship', label: t.cruises, icon: <Ship size={18} /> },
    ];

    const [selectedComponents, setSelectedComponents] = useState<string[]>(['hotel', 'flight', 'transfer']);
    const [nights, setNights] = useState<number>(7);
    const [rooms, setRooms] = useState<number>(1);
    const [flexibleDays, setFlexibleDays] = useState<number>(0);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [inquiry, setInquiry] = useState<OfferInquiry>({
        hotelName: '',
        checkIn: '',
        checkOut: '',
        adults: 2,
        children: 0,
        childrenAges: [],
        transportRequired: true,
        additionalServices: []
    });

    const [results, setResults] = useState<{ hotels: any[], services: any[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // Suggestions Logic
    const handleHotelNameChange = async (val: string) => {
        setInquiry({ ...inquiry, hotelName: val });
        if (val.length >= 3) {
            const list = await getSearchSuggestions(val);
            setSuggestions(list);
            setShowSuggestions(list.length > 0);
        } else {
            setShowSuggestions(false);
        }
    };

    const selectSuggestion = (s: string) => {
        setInquiry({ ...inquiry, hotelName: s });
        setShowSuggestions(false);
    };

    // Smart Date Calculations
    const handleCheckInChange = (date: string) => {
        const newInquiry = { ...inquiry, checkIn: date };
        if (date && nights > 0) {
            const outDate = new Date(date);
            outDate.setDate(outDate.getDate() + nights);
            newInquiry.checkOut = outDate.toISOString().split('T')[0];
        }
        setInquiry(newInquiry);
    };

    const handleNightsChange = (n: number) => {
        setNights(n);
        if (inquiry.checkIn && n > 0) {
            const outDate = new Date(inquiry.checkIn);
            outDate.setDate(outDate.getDate() + n);
            setInquiry({ ...inquiry, checkOut: outDate.toISOString().split('T')[0] });
        }
    };

    const handleCheckOutChange = (date: string) => {
        const newInquiry = { ...inquiry, checkOut: date };
        if (inquiry.checkIn && date) {
            const diffTime = Math.abs(new Date(date).getTime() - new Date(inquiry.checkIn).getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setNights(diffDays);
        }
        setInquiry(newInquiry);
    };

    const handleSearch = async () => {
        setIsLoading(true);
        setSearchPerformed(true);
        try {
            const updatedInquiry = {
                ...inquiry,
                transportRequired: selectedComponents.some(c => ['flight', 'transfer', 'ship'].includes(c)),
                additionalServices: selectedComponents.filter(c => !['hotel', 'flight', 'transfer', 'ship'].includes(c))
            };
            const data = await searchOffers(updatedInquiry);
            setResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleComponent = (id: string) => {
        setSelectedComponents(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    return (
        <div className="total-trip-container">
            <header className="total-trip-header">
                <div className="header-content">
                    <h1><Compass className="icon-main" /> {t.tripCounselor}</h1>
                    <p>{t.hubDesc}</p>
                </div>
                <div className="header-badge ai-premium">
                    <Sparkles size={16} />
                    <span>AI Enhanced Planning</span>
                </div>
            </header>

            <div className="trip-builder-console">
                <div className="component-selector-v4">
                    <div className="selector-group left">
                        {TRIP_CATEGORIES_PRIMARY.map(cat => (
                            <button
                                key={cat.id}
                                className={`comp-chip ${selectedComponents.includes(cat.id) ? 'active' : ''}`}
                                onClick={() => toggleComponent(cat.id)}
                            >
                                <span className="comp-icon">{cat.icon}</span>
                                <span className="comp-label">{cat.label}</span>
                                {selectedComponents.includes(cat.id) && <CheckCircle2 size={12} className="check-indicator" />}
                            </button>
                        ))}
                    </div>

                    <div className="selector-group right">
                        {TRIP_CATEGORIES_SECONDARY.map(cat => (
                            <button
                                key={cat.id}
                                className={`comp-chip ${selectedComponents.includes(cat.id) ? 'active' : ''}`}
                                onClick={() => toggleComponent(cat.id)}
                            >
                                <span className="comp-icon">{cat.icon}</span>
                                <span className="comp-label">{cat.label}</span>
                                {selectedComponents.includes(cat.id) && <CheckCircle2 size={12} className="check-indicator" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="search-form-complex">
                    {/* Row 1: Destination and Dates */}
                    <div className="form-row main">
                        <div className="input-group-premium main-search wide">
                            <label className="smart-label">
                                <Sparkles size={14} className="sparkle-accent" />
                                {t.smartQueryLabel}
                            </label>
                            <div className="smart-input-container">
                                <input
                                    type="text"
                                    placeholder={t.smartQueryPlaceholder}
                                    value={inquiry.hotelName}
                                    onChange={e => handleHotelNameChange(e.target.value)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    onFocus={() => inquiry.hotelName.length >= 3 && setShowSuggestions(true)}
                                    className="smart-query-input"
                                />
                                <div className="input-ai-waves"></div>
                            </div>
                            {showSuggestions && (
                                <div className="search-suggestions-dropdown">
                                    {suggestions.map((s, idx) => (
                                        <div
                                            key={idx}
                                            className="suggestion-item"
                                            onClick={() => selectSuggestion(s)}
                                        >
                                            <MapPin size={12} className="sugg-icon" />
                                            <span>{s}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="date-cluster">
                            <div className="input-group-premium">
                                <label><MoveRight size={14} /> {t.checkIn}</label>
                                <div className="custom-date-wrapper">
                                    <input
                                        type="date"
                                        value={inquiry.checkIn}
                                        onChange={e => handleCheckInChange(e.target.value)}
                                        className="native-date-input"
                                    />
                                    <div className="date-display-overlay">
                                        {inquiry.checkIn ? new Date(inquiry.checkIn).toLocaleDateString(lang === 'sr' ? 'sr-RS' : 'en-GB').replace(/\//g, lang === 'sr' ? '.' : '/') : 'dd/mm/yyyy'}
                                    </div>
                                </div>
                            </div>
                            <div className="input-group-premium nights-tiny">
                                <label><Moon size={14} /> {t.nights}</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={nights || ''}
                                    onChange={e => handleNightsChange(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="input-group-premium">
                                <label><MoveLeft size={14} /> {t.checkOut}</label>
                                <div className="custom-date-wrapper">
                                    <input
                                        type="date"
                                        value={inquiry.checkOut}
                                        onChange={e => handleCheckOutChange(e.target.value)}
                                        className="native-date-input"
                                    />
                                    <div className="date-display-overlay">
                                        {inquiry.checkOut ? new Date(inquiry.checkOut).toLocaleDateString(lang === 'sr' ? 'sr-RS' : 'en-GB').replace(/\//g, lang === 'sr' ? '.' : '/') : 'dd/mm/yyyy'}
                                    </div>
                                </div>
                            </div>
                            <div className="input-group-premium flexibility-tiny">
                                <label><Zap size={14} /> {t.flexibility}</label>
                                <select value={flexibleDays} onChange={e => setFlexibleDays(parseInt(e.target.value))}>
                                    <option value={0}>{t.fixed}</option>
                                    <option value={1}>+/- 1 {lang === 'sr' ? 'dan' : 'day'}</option>
                                    <option value={2}>+/- 2 {lang === 'sr' ? 'dana' : 'days'}</option>
                                    <option value={3}>+/- 3 {lang === 'sr' ? 'dana' : 'days'}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Passengers and Action */}
                    <div className="form-row passengers-action-line-v4">
                        <div className="input-group-premium rooms-input">
                            <label><Home size={14} /> {t.rooms}</label>
                            <input
                                type="number"
                                min="1"
                                value={rooms || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    setRooms(val === '' ? 0 : parseInt(val) || 0);
                                }}
                            />
                        </div>
                        <div className="input-group-premium adults-input">
                            <label><Users size={14} /> {t.adults}</label>
                            <input
                                type="number"
                                min="1"
                                value={inquiry.adults || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    setInquiry({ ...inquiry, adults: val === '' ? 0 : parseInt(val) || 0 });
                                }}
                            />
                        </div>
                        <div className="input-group-premium children-input">
                            <label><Users2 size={14} /> {t.children}</label>
                            <input
                                type="number"
                                min="0"
                                max="4"
                                value={inquiry.children || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    const count = val === '' ? 0 : Math.min(4, parseInt(val) || 0);
                                    setInquiry({
                                        ...inquiry,
                                        children: count,
                                        childrenAges: Array(count).fill(7)
                                    });
                                }}
                            />
                        </div>

                        {inquiry.children > 0 && (
                            <div className="children-ages-inline-v4">
                                {inquiry.childrenAges.map((age, idx) => (
                                    <div key={idx} className="age-input-premium">
                                        <label>{t.childAge} {idx + 1}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="17"
                                            value={age || ''}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const newAge = val === '' ? 0 : parseInt(val) || 0;
                                                const newAges = [...inquiry.childrenAges];
                                                newAges[idx] = newAge;
                                                setInquiry({ ...inquiry, childrenAges: newAges });
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <button className="search-launch-btn-v4" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="spin" /> : <ClickToTravelLogo height={32} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="content-workflow">
                {!searchPerformed && (
                    <div className="zen-placeholder">
                        <div className="zen-content">
                            <div className="musashi-icon-large">
                                <Compass size={80} strokeWidth={1} />
                            </div>
                            <h2>Spremite se za savršeno putovanje</h2>
                            <p>Izaberite usluge iznad i unesite detalje za pretragu Olympic Hub baze.</p>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="loading-orchestrator">
                        <div className="pulse-loader"></div>
                        <p>AI sklapa vaš mozaik putovanja...</p>
                    </div>
                )}

                {results && !isLoading && (
                    <div className="results-mosaic">
                        {selectedComponents.includes('hotel') && (
                            <section className="results-category">
                                <div className="cat-header-premium">
                                    <Hotel size={20} />
                                    <h3>Smeštaj</h3>
                                    <span className="count-pill">{results.hotels.length}</span>
                                </div>
                                <div className="mosaic-grid">
                                    {results.hotels.length > 0 ? (
                                        results.hotels.map(hotel => (
                                            <div key={hotel.id} className="mosaic-card hotel">
                                                <div className="card-top">
                                                    <h4>{hotel.title}</h4>
                                                    <span className="stars">{'★'.repeat(hotel.stars || 5)}</span>
                                                </div>
                                                <div className="card-meta">
                                                    <MapPin size={12} /> {hotel.location || 'Lokacija na upit'}
                                                </div>
                                                <div className="card-price">
                                                    <span className="label">Od</span>
                                                    <span className="value">{hotel.price_periods?.[0]?.net_price || '??'} EUR</span>
                                                </div>
                                                <div className="card-actions">
                                                    <button className="btn-action">Dodaj u plan</button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-data-card">Nema slobodnih soba u bazi.</div>
                                    )}
                                </div>
                            </section>
                        )}

                        <section className="results-category">
                            <div className="cat-header-premium experiences">
                                <Sparkles size={20} />
                                <h3>Doživljaji i Prevoz</h3>
                                <span className="count-pill">{results.services.length}</span>
                            </div>
                            <div className="mosaic-grid">
                                {results.services.length > 0 ? (
                                    results.services.map(service => (
                                        <div key={service.id} className="mosaic-card service">
                                            <div className="service-tag">{service.category}</div>
                                            <h4>{service.title}</h4>
                                            <p className="description-short">{service.description}</p>
                                            <div className="card-price">
                                                <span className="value">{service.price_gross} {service.currency}</span>
                                            </div>
                                            <div className="card-actions">
                                                <button className="btn-action add">Dodaj</button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-data-card">Pokušajte sa širim filterima ili kontaktirajte operativu.</div>
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TotalTripSearch;
