import React, { useState } from 'react';
import {
    Hotel, Globe, MapPin, Star, Users, Search,
    XCircle, Clock, CreditCard, ArrowRight,
    Activity, Car, Plane, RefreshCw, Info, AlertTriangle,
    ChevronDown, ChevronUp, Zap, Shield, Building2, Waves,
    ExternalLink, Euro, Calendar as CalendarIcon, Filter, Link2,
    ChevronRight, Image, Wifi, Dumbbell, Utensils, Copy, Eye, Bus, X, CheckCircle2
} from 'lucide-react';
import { ModernCalendar } from '../components/ModernCalendar';
import hotelbedsApiService from '../integrations/hotelbeds/api/hotelbedsApiService';
import type {
    HotelbedsCredentials,
    HotelAvailabilityResponse,
    ActivitySearchResponse,
    TransferSearchResponse,
    CheckRatesResponse,
    HotelBookingResponse,
    TransferBookingResponse,
} from '../integrations/hotelbeds/types/hotelbedsTypes';
import { useThemeStore } from '../stores';
import './HotelbedsTest.css';

type TabType = 'config' | 'hotels' | 'activities' | 'transfers' | 'bookings';

const HotelbedsTest: React.FC = () => {
    const { theme } = useThemeStore();
    const isLight = theme === 'light';
    const [activeTab, setActiveTab] = useState<TabType>('config');

    // ─── Konfiguracija ────────────────────────────────────────────────
    const [credentials, setCredentials] = useState<HotelbedsCredentials>({
        apiKey: '',
        apiSecret: '',
        environment: 'test',
    });
    const [isConfigured, setIsConfigured] = useState(false);
    const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // ─── Hotel Pretraga ───────────────────────────────────────────────
    const [hotelSearch, setHotelSearch] = useState({
        destinationCode: 'PMI',
        checkIn: '2026-07-15',
        checkOut: '2026-07-22',
        adults: 2,
        children: 0,
        rooms: 1,
    });
    const [hotelResults, setHotelResults] = useState<HotelAvailabilityResponse | null>(null);
    const [checkRatesResult, setCheckRatesResult] = useState<CheckRatesResponse | null>(null);
    const [bookingResult, setBookingResult] = useState<HotelBookingResponse | null>(null);
    const [selectedRateKey, setSelectedRateKey] = useState('');
    const [isHotelLoading, setIsHotelLoading] = useState(false);

    // ─── Activities ───────────────────────────────────────────────────
    const [activitySearch, setActivitySearch] = useState({
        destinationCode: 'PMI',
        from: '2026-07-15',
        to: '2026-07-22',
    });
    const [activityResults, setActivityResults] = useState<ActivitySearchResponse | null>(null);
    const [isActivityLoading, setIsActivityLoading] = useState(false);
    const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

    // ─── Transfers ────────────────────────────────────────────────────
    const [transferSearch, setTransferSearch] = useState({
        fromType: 'IATA',
        fromCode: 'PMI',
        toType: 'HOTELBEDS',
        toCode: '1234',
        dateTime: '2026-07-15T14:00:00',
        adults: 2,
    });
    const [transferResults, setTransferResults] = useState<TransferSearchResponse | null>(null);
    const [transferBooking, setTransferBooking] = useState<TransferBookingResponse | null>(null);
    const [isTransferLoading, setIsTransferLoading] = useState(false);

    // ─── Error / Status ───────────────────────────────────────────────
    const [error, setError] = useState<string | null>(null);
    const [activeCalendar, setActiveCalendar] = useState<'hotels' | 'activities' | null>(null);

    // ─── Handlers ─────────────────────────────────────────────────────

    const handleConfigure = () => {
        if (!credentials.apiKey || !credentials.apiSecret) {
            setConfigStatus('error');
            setError('API Key i API Secret su obavezni!');
            return;
        }
        hotelbedsApiService.configure(credentials);
        setIsConfigured(true);
        setConfigStatus('success');
        setError(null);
    };

    const handleConfigureDemo = () => {
        const demo: HotelbedsCredentials = {
            apiKey: 'DEMO_API_KEY_12345',
            apiSecret: 'DEMO_API_SECRET_67890',
            environment: 'test',
        };
        setCredentials(demo);
        hotelbedsApiService.configure(demo);
        setIsConfigured(true);
        setConfigStatus('success');
        setError(null);
    };

    const handleSearchHotels = async () => {
        setError(null);
        setIsHotelLoading(true);
        setHotelResults(null);
        setCheckRatesResult(null);
        setBookingResult(null);
        try {
            const result = await hotelbedsApiService.searchHotels({
                stay: { checkIn: hotelSearch.checkIn, checkOut: hotelSearch.checkOut },
                occupancies: [{ rooms: hotelSearch.rooms, adults: hotelSearch.adults, children: hotelSearch.children }],
                destination: { code: hotelSearch.destinationCode },
                filter: { maxHotels: 20 },
            });
            setHotelResults(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsHotelLoading(false);
        }
    };

    const handleCheckRates = async (rateKey: string) => {
        setError(null);
        setIsHotelLoading(true);
        setSelectedRateKey(rateKey);
        try {
            const result = await hotelbedsApiService.checkRates({ rooms: [{ rateKey }] });
            setCheckRatesResult(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsHotelLoading(false);
        }
    };

    const handleBookHotel = async () => {
        if (!selectedRateKey) return;
        setError(null);
        setIsHotelLoading(true);
        try {
            const result = await hotelbedsApiService.createBooking({
                holder: { name: 'Marko', surname: 'Marković', email: 'marko@clicktotavel.rs' },
                rooms: [{
                    rateKey: selectedRateKey,
                    paxes: [
                        { roomId: 1, type: 'AD', name: 'MARKO', surname: 'MARKOVIC' },
                        { roomId: 1, type: 'AD', name: 'JOVANA', surname: 'MARKOVIC' },
                    ]
                }],
                clientReference: `CTT-${Date.now()}`,
                remark: 'Rezervacija kreirana putem ClickToTravel Hub integrations',
            });
            setBookingResult(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsHotelLoading(false);
        }
    };

    const handleSearchActivities = async () => {
        setError(null);
        setIsActivityLoading(true);
        setActivityResults(null);
        try {
            const result = await hotelbedsApiService.searchActivities({
                from: activitySearch.from,
                to: activitySearch.to,
                destination: activitySearch.destinationCode,
            });
            setActivityResults(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsActivityLoading(false);
        }
    };

    const handleSearchTransfers = async () => {
        setError(null);
        setIsTransferLoading(true);
        setTransferResults(null);
        try {
            const result = await hotelbedsApiService.searchTransfers({
                language: 'ENG',
                fromType: transferSearch.fromType as any,
                fromCode: transferSearch.fromCode,
                toType: transferSearch.toType as any,
                toCode: transferSearch.toCode,
                outbound: { dateTime: transferSearch.dateTime },
                adults: transferSearch.adults,
                currency: 'EUR',
            });
            setTransferResults(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsTransferLoading(false);
        }
    };

    const handleBookTransfer = async (rateKey: string) => {
        setError(null);
        setIsTransferLoading(true);
        try {
            const result = await hotelbedsApiService.bookTransfer({
                language: 'ENG',
                holder: { name: 'Marko', surname: 'Marković', email: 'marko@clicktotravel.rs' },
                clientReference: `TRF-CTT-${Date.now()}`,
                transfers: [{
                    rateKey,
                    vehicle: { passengers: [{ name: 'Marko', surname: 'Markovic' }] },
                }],
            });
            setTransferBooking(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsTransferLoading(false);
        }
    };

    // ─── Helpers ──────────────────────────────────────────────────────
    const getBoardBadge = (code: string) => {
        const map: Record<string, { label: string; color: string }> = {
            'AI': { label: 'All Inclusive', color: '#10b981' },
            'HB': { label: 'Half Board', color: '#3b82f6' },
            'BB': { label: 'B&B', color: '#f59e0b' },
            'RO': { label: 'Room Only', color: '#8b5cf6' },
            'FB': { label: 'Full Board', color: '#ef4444' },
        };
        return map[code] ?? { label: code, color: '#64748b' };
    };

    const getTransferTypeIcon = (type: string) => {
        if (type === 'PRIVATE') return '🚗';
        if (type === 'SHUTTLE') return '🚌';
        return '🚖';
    };

    const renderStars = (catCode: string) => {
        const n = parseInt(catCode) || 4;
        return Array.from({ length: n }, (_, i) => (
            <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />
        ));
    };

    // ─── Render ───────────────────────────────────────────────────────

    return (
        <div className="hb-test-page">
            {/* ── Header ── */}
            <div className="hb-header">
                <div className="hb-header-left">
                    <div className="hb-logo">
                        <Globe size={36} />
                    </div>
                    <div>
                        <h1>Hotelbeds APItude</h1>
                        <p>Hotels • Activities • Transfers — Kompletna integracija</p>
                    </div>
                </div>
                <div className="hb-header-right">
                    <div className={`hb-status-pill ${isConfigured ? 'configured' : 'unconfigured'}`}>
                        {isConfigured ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        <span>{isConfigured ? `Konfigurisan (${hotelbedsApiService.getEnvironment()})` : 'Nije konfigurisan'}</span>
                    </div>
                    <div className="hb-env-badge">
                        <Shield size={14} />
                        <span>{credentials.environment === 'test' ? 'SANDBOX / TEST' : 'PRODUCTION'}</span>
                    </div>
                </div>
            </div>

            {/* ── Global Error ── */}
            {error && (
                <div className="hb-error-banner">
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><XCircle size={14} /></button>
                </div>
            )}

            {/* ── Tabs ── */}
            <div className="hb-tabs">
                {[
                    { id: 'config', label: 'Konfiguracija', icon: <Shield size={16} /> },
                    { id: 'hotels', label: 'Hoteli', icon: <Building2 size={16} /> },
                    { id: 'activities', label: 'Aktivnosti', icon: <Activity size={16} /> },
                    { id: 'transfers', label: 'Transferi', icon: <Car size={16} /> },
                    { id: 'bookings', label: 'Rezervacije', icon: <CreditCard size={16} /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`hb-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id as TabType)}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="hb-content">

                {/* ══ TAB: KONFIGURACIJA ══ */}
                {activeTab === 'config' && (
                    <div className="hb-section">
                        <div className="hb-section-header">
                            <Shield size={22} />
                            <h2>API Konfiguracija i Autentifikacija</h2>
                        </div>

                        <div className="hb-info-box">
                            <Info size={16} />
                            <div>
                                <strong>X-Signature autentifikacija</strong>
                                <p>Svaki zahtev zahteva API Key i X-Signature. Potpis se generiše kao SHA-256 hash od <code>apiKey + apiSecret + epochSeconds</code>. U produkciji, ovu logiku treba prebaciti na backend proxy radi sigurnosti.</p>
                            </div>
                        </div>

                        <div className="hb-config-grid">
                            <div className="hb-form-group">
                                <label>API Key <span className="required">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Vaš Hotelbeds API Key"
                                    value={credentials.apiKey}
                                    onChange={e => setCredentials(p => ({ ...p, apiKey: e.target.value }))}
                                    className="hb-input"
                                />
                            </div>
                            <div className="hb-form-group">
                                <label>API Secret <span className="required">*</span></label>
                                <input
                                    type="password"
                                    placeholder="Vaš Hotelbeds API Secret"
                                    value={credentials.apiSecret}
                                    onChange={e => setCredentials(p => ({ ...p, apiSecret: e.target.value }))}
                                    className="hb-input"
                                />
                            </div>
                            <div className="hb-form-group">
                                <label>Okruženje</label>
                                <select
                                    value={credentials.environment}
                                    onChange={e => setCredentials(p => ({ ...p, environment: e.target.value as any }))}
                                    className="hb-select"
                                >
                                    <option value="test">Test / Sandbox</option>
                                    <option value="production">Produkcija</option>
                                </select>
                            </div>
                        </div>

                        <div className="hb-config-actions">
                            <button className="hb-btn primary" onClick={handleConfigure}>
                                <Zap size={16} /> Konfiguriši
                            </button>
                            <button className="hb-btn secondary" onClick={handleConfigureDemo}>
                                <RefreshCw size={16} /> Učitaj Demo Kredencijale
                            </button>
                        </div>

                        {configStatus === 'success' && (
                            <div className="hb-success-box">
                                <CheckCircle2 size={20} />
                                <div>
                                    <strong>Uspešno konfigurisano!</strong>
                                    <p>Hotelbeds servis je aktivan. Koristite tabove iznad da testirate Hotels, Activities i Transfers API.</p>
                                </div>
                            </div>
                        )}

                        {/* Endpoint pregled */}
                        <div className="hb-endpoint-table">
                            <h3>Endpoint Pregled</h3>
                            <div className="hb-endpoint-grid">
                                {[
                                    { method: 'POST', path: '/hotel-api/1.0/hotels', desc: 'Pretraga hotela', api: 'Hotels' },
                                    { method: 'POST', path: '/hotel-api/1.0/checkrates', desc: 'Potvrda cena', api: 'Hotels' },
                                    { method: 'POST', path: '/hotel-api/1.0/bookings', desc: 'Nova rezervacija', api: 'Hotels' },
                                    { method: 'GET', path: '/hotel-api/1.0/bookings/{ref}', desc: 'Pregled rezervacije', api: 'Hotels' },
                                    { method: 'DELETE', path: '/hotel-api/1.0/bookings/{ref}', desc: 'Otkazivanje', api: 'Hotels' },
                                    { method: 'GET', path: '/hotel-content-api/1.0/hotels', desc: 'Sadržaj hotela', api: 'Content' },
                                    { method: 'GET', path: '/activity-api/3.0/activities/availability', desc: 'Dostupne aktivnosti', api: 'Activities' },
                                    { method: 'GET', path: '/transfer-api/1.0/availability', desc: 'Dostupni transferi', api: 'Transfers' },
                                    { method: 'POST', path: '/transfer-api/1.0/bookings', desc: 'Rezervacija transfera', api: 'Transfers' },
                                ].map((ep, i) => (
                                    <div key={i} className="hb-endpoint-row">
                                        <span className={`hb-method ${ep.method.toLowerCase()}`}>{ep.method}</span>
                                        <code className="hb-path">{ep.path}</code>
                                        <span className="hb-ep-desc">{ep.desc}</span>
                                        <span className={`hb-api-badge ${ep.api.toLowerCase()}`}>{ep.api}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ TAB: HOTELI ══ */}
                {activeTab === 'hotels' && (
                    <div className="hb-section">
                        <div className="hb-section-header">
                            <Building2 size={22} />
                            <h2>Hotel Booking API — Pretraga i Rezervacija</h2>
                        </div>

                        {/* Search Form */}
                        <div className="hb-search-card">
                            <h3><Search size={18} /> Pretraga Hotela</h3>
                            <div className="hb-search-grid">
                                <div className="hb-form-group">
                                    <label><MapPin size={14} /> Destinacija (kod)</label>
                                    <input
                                        className="hb-input"
                                        value={hotelSearch.destinationCode}
                                        onChange={e => setHotelSearch(p => ({ ...p, destinationCode: e.target.value }))}
                                        placeholder="npr. PMI, IBZ, BCN, DBV"
                                    />
                                </div>
                                <div className="hb-form-group" style={{ gridColumn: 'span 2' }}>
                                    <label><CalendarIcon size={14} /> Period boravka</label>
                                    <div
                                        className="hb-input"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                        onClick={() => setActiveCalendar('hotels')}
                                    >
                                        <CalendarIcon size={16} color="#10b981" />
                                        <span>{hotelSearch.checkIn} — {hotelSearch.checkOut}</span>
                                    </div>
                                </div>
                                <div className="hb-form-group">
                                    <label><Users size={14} /> Odrasli</label>
                                    <input type="number" min={1} max={9} className="hb-input" value={hotelSearch.adults}
                                        onChange={e => setHotelSearch(p => ({ ...p, adults: +e.target.value }))} />
                                </div>
                                <div className="hb-form-group">
                                    <label><Users size={14} /> Deca</label>
                                    <input type="number" min={0} max={6} className="hb-input" value={hotelSearch.children}
                                        onChange={e => setHotelSearch(p => ({ ...p, children: +e.target.value }))} />
                                </div>
                                <div className="hb-form-group">
                                    <label><Hotel size={14} /> Sobe</label>
                                    <input type="number" min={1} max={5} className="hb-input" value={hotelSearch.rooms}
                                        onChange={e => setHotelSearch(p => ({ ...p, rooms: +e.target.value }))} />
                                </div>
                            </div>
                            <button
                                className="hb-btn primary full-width"
                                onClick={handleSearchHotels}
                                disabled={isHotelLoading || !isConfigured}
                            >
                                {isHotelLoading ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
                                {isHotelLoading ? 'Pretrajem...' : 'Pretraži Hotele'}
                            </button>
                            {!isConfigured && <p className="hb-hint">⚠️ Konfiguriši servis na tab-u "Konfiguracija" pre pretrage.</p>}
                        </div>

                        {/* Hotel Results */}
                        {hotelResults && (
                            <div className="hb-results">
                                <div className="hb-results-header">
                                    <span className="hb-results-count">{hotelResults.hotels.total} hotela pronađeno</span>
                                    <span className="hb-results-dates">
                                        {hotelResults.hotels.checkIn} → {hotelResults.hotels.checkOut}
                                    </span>
                                </div>
                                {hotelResults.hotels.hotels.map(hotel => (
                                    <div key={hotel.code} className="hb-hotel-card">
                                        <div className="hb-hotel-top">
                                            <div className="hb-hotel-info">
                                                <div className="hb-hotel-stars">{renderStars(hotel.categoryCode.replace('EST', ''))}</div>
                                                <h3>{hotel.name}</h3>
                                                <p className="hb-hotel-dest">
                                                    <MapPin size={13} /> {hotel.destinationName} • {hotel.zoneName}
                                                </p>
                                                <p className="hb-hotel-coords">
                                                    <Globe size={12} /> {hotel.latitude}°N, {hotel.longitude}°E
                                                </p>
                                            </div>
                                            <div className="hb-hotel-price">
                                                <div className="hb-price-from">od</div>
                                                <div className="hb-price-main">{hotel.minRate} {hotel.currency}</div>
                                                <div className="hb-price-to">do {hotel.maxRate} {hotel.currency}</div>
                                            </div>
                                        </div>
                                        <div className="hb-hotel-rooms">
                                            {hotel.rooms.map(room => (
                                                <div key={room.id} className="hb-room-row">
                                                    <div className="hb-room-info">
                                                        <span className="hb-room-name">{room.name}</span>
                                                        <span className="hb-room-code">{room.code}</span>
                                                        <span className={`hb-room-status ${room.status.toLowerCase()}`}>{room.status}</span>
                                                    </div>
                                                    {room.rates.map((rate, ri) => {
                                                        const board = getBoardBadge(rate.boardCode);
                                                        return (
                                                            <div key={ri} className="hb-rate-row">
                                                                <span className="hb-board-badge" style={{ background: `${board.color}22`, color: board.color, borderColor: `${board.color}44` }}>
                                                                    {board.label}
                                                                </span>
                                                                <span className="hb-rate-net">Net: <strong>{rate.net} {hotel.currency}</strong></span>
                                                                {rate.sellingRate && <span className="hb-rate-sell">Prodaja: {rate.sellingRate} {hotel.currency}</span>}
                                                                <span className={`hb-pay-type ${rate.paymentType.toLowerCase()}`}>{rate.paymentType}</span>
                                                                <span className="hb-allotment">Dostupno: {rate.allotment}</span>
                                                                <button
                                                                    className="hb-btn-sm primary"
                                                                    onClick={() => handleCheckRates(rate.rateKey)}
                                                                    disabled={isHotelLoading}
                                                                >
                                                                    Check Rate
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Check Rates Result */}
                        {checkRatesResult && (
                            <div className="hb-rate-result-card">
                                <div className="hb-rate-result-header">
                                    <CheckCircle2 size={20} color="#10b981" />
                                    <h3>CheckRates — Potvrđena Cena</h3>
                                </div>
                                <div className="hb-rate-result-body">
                                    <div className="hb-rate-summary">
                                        <div>
                                            <label>Hotel</label>
                                            <span>{checkRatesResult.hotel.name}</span>
                                        </div>
                                        <div>
                                            <label>Ukupna Net Cena</label>
                                            <span className="hb-price-highlight">{checkRatesResult.hotel.totalNet} {checkRatesResult.hotel.currency}</span>
                                        </div>
                                        <div>
                                            <label>Prodajna Cena</label>
                                            <span>{checkRatesResult.hotel.totalSellingRate} {checkRatesResult.hotel.currency}</span>
                                        </div>
                                        <div>
                                            <label>Dobavljač</label>
                                            <span>{checkRatesResult.hotel.supplier?.name}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="hb-btn primary"
                                        onClick={handleBookHotel}
                                        disabled={isHotelLoading}
                                    >
                                        {isHotelLoading ? <RefreshCw size={16} className="spin" /> : <CreditCard size={16} />}
                                        Potvrdi Rezervaciju
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Booking Confirmation */}
                        {bookingResult && (
                            <div className="hb-booking-confirmed">
                                <div className="hb-booking-header">
                                    <CheckCircle2 size={32} color="#10b981" />
                                    <div>
                                        <h2>Rezervacija Potvrđena!</h2>
                                        <p>Status: <strong className={`hb-status-text ${bookingResult.booking.status.toLowerCase()}`}>{bookingResult.booking.status}</strong></p>
                                    </div>
                                </div>
                                <div className="hb-booking-details">
                                    <div className="hb-booking-ref">
                                        <label>Hotelbeds Referenca</label>
                                        <span className="hb-ref-code">{bookingResult.booking.reference}</span>
                                    </div>
                                    <div className="hb-booking-ref">
                                        <label>Client Referenca</label>
                                        <span className="hb-ref-code">{bookingResult.booking.clientReference}</span>
                                    </div>
                                    <div className="hb-booking-ref">
                                        <label>Hotel</label>
                                        <span>{bookingResult.booking.hotel.name}</span>
                                    </div>
                                    <div className="hb-booking-ref">
                                        <label>Ukupno</label>
                                        <span className="hb-price-highlight">{bookingResult.booking.totalNet} {bookingResult.booking.currency}</span>
                                    </div>
                                    <div className="hb-booking-ref">
                                        <label>Datum Kreiranja</label>
                                        <span>{bookingResult.booking.creationDate}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ TAB: AKTIVNOSTI ══ */}
                {activeTab === 'activities' && (
                    <div className="hb-section">
                        <div className="hb-section-header">
                            <Waves size={22} />
                            <h2>Activities API — Pretraga Aktivnosti</h2>
                        </div>
                        <div className="hb-search-card">
                            <h3><Search size={18} /> Pretraga Aktivnosti</h3>
                            <div className="hb-search-grid">
                                <div className="hb-form-group">
                                    <label><MapPin size={14} /> Destinacija (kod)</label>
                                    <input className="hb-input" value={activitySearch.destinationCode}
                                        onChange={e => setActivitySearch(p => ({ ...p, destinationCode: e.target.value }))}
                                        placeholder="PMI, IBZ, BCN..." />
                                </div>
                                <div className="hb-form-group" style={{ gridColumn: 'span 2' }}>
                                    <label><CalendarIcon size={14} /> Period boravka</label>
                                    <div
                                        className="hb-input"
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                        onClick={() => setActiveCalendar('activities')}
                                    >
                                        <CalendarIcon size={16} color="#10b981" />
                                        <span>{activitySearch.from} — {activitySearch.to}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="hb-btn primary full-width" onClick={handleSearchActivities}
                                disabled={isActivityLoading || !isConfigured}>
                                {isActivityLoading ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
                                {isActivityLoading ? 'Pretrajem...' : 'Pretraži Aktivnosti'}
                            </button>
                        </div>

                        {activityResults && (
                            <div className="hb-results">
                                <div className="hb-results-header">
                                    <span className="hb-results-count">{activityResults.activities.length} aktivnosti pronađeno</span>
                                </div>
                                {activityResults.activities.map(activity => (
                                    <div key={activity.code} className="hb-activity-card">
                                        <div className="hb-activity-top" onClick={() => setExpandedActivity(expandedActivity === activity.code ? null : activity.code)}>
                                            <div className="hb-activity-info">
                                                <div className="hb-activity-cats">
                                                    {activity.categories?.map(c => (
                                                        <span key={c.code} className="hb-cat-badge">{c.name}</span>
                                                    ))}
                                                </div>
                                                <h3>{activity.name}</h3>
                                                <p className="hb-activity-dest">
                                                    <MapPin size={13} /> {activity.destination?.name}
                                                    {activity.minAge && <span className="hb-age-badge">Min {activity.minAge} god.</span>}
                                                </p>
                                            </div>
                                            <div className="hb-activity-price">
                                                <div className="hb-price-from">od</div>
                                                <div className="hb-price-main">{activity.amountFrom?.toFixed(2)} {activity.currency}</div>
                                                <div className="hb-expand-btn">
                                                    {expandedActivity === activity.code ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </div>
                                            </div>
                                        </div>
                                        {expandedActivity === activity.code && (
                                            <div className="hb-activity-expanded">
                                                {activity.description && <p className="hb-activity-desc">{activity.description}</p>}
                                                {activity.modalities && activity.modalities.length > 0 && (
                                                    <div className="hb-modalities">
                                                        <h4>Varijante i Cene:</h4>
                                                        {activity.modalities.map(mod => (
                                                            <div key={mod.code} className="hb-modality-row">
                                                                <div className="hb-mod-info">
                                                                    <span className="hb-mod-name">{mod.name}</span>
                                                                    {mod.duration && (
                                                                        <span className="hb-mod-duration">
                                                                            <Clock size={12} /> {mod.duration.value} {mod.duration.metric}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="hb-mod-rates">
                                                                    {mod.rates?.map(r => (
                                                                        <div key={r.rateCode} className="hb-mod-rate">
                                                                            <span>{r.name}</span>
                                                                            <strong>{r.amount?.toFixed(2)} {r.currency}</strong>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <button className="hb-btn-sm success" onClick={() => alert(`Rezervacija aktivnosti: ${activity.code} - ${mod.code}`)}>
                                                                    <ArrowRight size={14} /> Rezerviši
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ══ TAB: TRANSFERI ══ */}
                {activeTab === 'transfers' && (
                    <div className="hb-section">
                        <div className="hb-section-header">
                            <Car size={22} />
                            <h2>Transfers API — Pretraga i Rezervacija Transfera</h2>
                        </div>
                        <div className="hb-search-card">
                            <h3><Search size={18} /> Pretraga Transfera</h3>
                            <div className="hb-search-grid">
                                <div className="hb-form-group">
                                    <label><Plane size={14} /> Polazište (kod)</label>
                                    <input className="hb-input" value={transferSearch.fromCode}
                                        onChange={e => setTransferSearch(p => ({ ...p, fromCode: e.target.value }))}
                                        placeholder="npr. PMI (aerodrom IATA)" />
                                </div>
                                <div className="hb-form-group">
                                    <label><Hotel size={14} /> Odredište (Hotel Kod)</label>
                                    <input className="hb-input" value={transferSearch.toCode}
                                        onChange={e => setTransferSearch(p => ({ ...p, toCode: e.target.value }))}
                                        placeholder="Hotel kod iz Hotelbeds" />
                                </div>
                                <div className="hb-form-group">
                                    <label><CalendarIcon size={14} /> Datum i Vreme Dolaska</label>
                                    <input type="datetime-local" className="hb-input" value={transferSearch.dateTime}
                                        onChange={e => setTransferSearch(p => ({ ...p, dateTime: e.target.value }))} />
                                </div>
                                <div className="hb-form-group">
                                    <label><Users size={14} /> Odrasli</label>
                                    <input type="number" min={1} max={20} className="hb-input" value={transferSearch.adults}
                                        onChange={e => setTransferSearch(p => ({ ...p, adults: +e.target.value }))} />
                                </div>
                            </div>
                            <button className="hb-btn primary full-width" onClick={handleSearchTransfers}
                                disabled={isTransferLoading || !isConfigured}>
                                {isTransferLoading ? <RefreshCw size={16} className="spin" /> : <Car size={16} />}
                                {isTransferLoading ? 'Pretrajem...' : 'Pretraži Transfere'}
                            </button>
                        </div>

                        {transferResults && (
                            <div className="hb-results">
                                <div className="hb-results-header">
                                    <span className="hb-results-count">{transferResults.services?.length} transfera dostupno</span>
                                    <span className="hb-results-dates">{transferSearch.fromCode} → {transferSearch.toCode}</span>
                                </div>
                                {transferResults.services?.map(service => (
                                    <div key={service.id} className="hb-transfer-card">
                                        <div className="hb-transfer-icon">
                                            <span className="hb-transfer-emoji">{getTransferTypeIcon(service.transferType)}</span>
                                        </div>
                                        <div className="hb-transfer-info">
                                            <div className="hb-transfer-type-badge">{service.transferType}</div>
                                            <h3>{service.vehicle.name}</h3>
                                            <p>{service.vehicle.description}</p>
                                            <div className="hb-transfer-meta">
                                                <span><Users size={13} /> {service.vehicle.minPax}-{service.vehicle.maxPax} putnika</span>
                                                {service.supplierDetails && (
                                                    <span><Shield size={13} /> {service.supplierDetails.name}</span>
                                                )}
                                                {service.cancellationPolicies?.[0] && (
                                                    <span className={service.cancellationPolicies[0].type === 'FREE' ? 'hb-free-cancel' : 'hb-paid-cancel'}>
                                                        {service.cancellationPolicies[0].type === 'FREE' ? '✓ Besplatno otkazivanje' : '✗ Non-refundable'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="hb-transfer-price">
                                            <div className="hb-price-main">{service.price.totalAmount?.toFixed(2) ?? service.price.amount.toFixed(2)} {service.price.currency ?? 'EUR'}</div>
                                            <div className="hb-price-net">Net: {service.price.netAmount?.toFixed(2)} {service.price.currency ?? 'EUR'}</div>
                                            <div className="hb-commission">Kom: {service.price.commissionPct}%</div>
                                            <button className="hb-btn-sm primary" onClick={() => handleBookTransfer(service.rateKey ?? '')}
                                                disabled={isTransferLoading}>
                                                {isTransferLoading ? <RefreshCw size={14} className="spin" /> : <ArrowRight size={14} />}
                                                Rezerviši
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Transfer Booking Confirmation */}
                        {transferBooking && (
                            <div className="hb-booking-confirmed">
                                <div className="hb-booking-header">
                                    <CheckCircle2 size={32} color="#10b981" />
                                    <div>
                                        <h2>Transfer Potvrđen!</h2>
                                        <p>Status: <strong className="hb-status-text confirmed">{transferBooking.booking.status}</strong></p>
                                    </div>
                                </div>
                                <div className="hb-booking-details">
                                    <div className="hb-booking-ref">
                                        <label>Referenca</label>
                                        <span className="hb-ref-code">{transferBooking.booking.reference}</span>
                                    </div>
                                    <div className="hb-booking-ref">
                                        <label>Putnik</label>
                                        <span>{transferBooking.booking.holder.name} {transferBooking.booking.holder.surname}</span>
                                    </div>
                                    <div className="hb-booking-ref">
                                        <label>Ukupno</label>
                                        <span className="hb-price-highlight">{transferBooking.booking.totalAmount?.toFixed(2)} {transferBooking.booking.currency}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ TAB: REZERVACIJE ══ */}
                {activeTab === 'bookings' && (
                    <div className="hb-section">
                        <div className="hb-section-header">
                            <CreditCard size={22} />
                            <h2>Upravljanje Rezervacijama</h2>
                        </div>
                        <div className="hb-info-box">
                            <Info size={16} />
                            <div>
                                <strong>Booking Management</strong>
                                <p>Koristite Hotel i Transfer tabove za kreiranje novih rezervacija. Ovde možete pretraživati i upravljati postojećim rezervacijama.</p>
                            </div>
                        </div>
                        <div className="hb-search-card">
                            <h3>Pregled Rezervacije po Referenci</h3>
                            <div className="hb-search-row">
                                <input className="hb-input" placeholder="Unesite Hotelbeds referencu (npr. HB-1234567890-ABCD)" />
                                <button className="hb-btn primary" onClick={() => alert('Integracija: GET /hotel-api/1.0/bookings/{reference}')}>
                                    <Search size={16} /> Pretraži
                                </button>
                            </div>
                        </div>
                        <div className="hb-endpoint-table">
                            <h3>API Pozivi za Upravljanje</h3>
                            <div className="hb-endpoint-grid">
                                {[
                                    { method: 'POST', path: '/hotel-api/1.0/bookings', desc: 'Kreira novu rezervaciju', color: '#10b981' },
                                    { method: 'GET', path: '/hotel-api/1.0/bookings/{ref}', desc: 'Pregled detalja rezervacije', color: '#3b82f6' },
                                    { method: 'PUT', path: '/hotel-api/1.0/bookings/{ref}', desc: 'Izmena rezervacije', color: '#f59e0b' },
                                    { method: 'DELETE', path: '/hotel-api/1.0/bookings/{ref}', desc: 'Otkazivanje rezervacije', color: '#ef4444' },
                                    { method: 'GET', path: '/hotel-api/1.0/bookings', desc: 'Lista svih rezervacija (filteri)', color: '#8b5cf6' },
                                ].map((ep, i) => (
                                    <div key={i} className="hb-endpoint-row">
                                        <span className={`hb-method ${ep.method.toLowerCase()}`}>{ep.method}</span>
                                        <code className="hb-path">{ep.path}</code>
                                        <span className="hb-ep-desc">{ep.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {activeCalendar && (
                <ModernCalendar
                    startDate={activeCalendar === 'hotels' ? hotelSearch.checkIn : activitySearch.from}
                    endDate={activeCalendar === 'hotels' ? hotelSearch.checkOut : activitySearch.to}
                    onChange={(s, e) => {
                        if (activeCalendar === 'hotels') {
                            setHotelSearch(p => ({ ...p, checkIn: s, checkOut: e }));
                        } else {
                            setActivitySearch(p => ({ ...p, from: s, to: e }));
                        }
                        if (e) setActiveCalendar(null);
                    }}
                    onClose={() => setActiveCalendar(null)}
                />
            )}
        </div>
    );
};

export default HotelbedsTest;
