import React, { useState } from 'react';
import {
    Building2, Globe, MapPin, Star, Calendar, Users, Search,
    CheckCircle, XCircle, Clock, CreditCard, ArrowRight,
    RefreshCw, Info, AlertTriangle, ChevronDown, ChevronUp,
    Zap, Shield, Wifi, Eye, TrendingUp, MapIcon, Tag
} from 'lucide-react';
import expediaApiService from '../integrations/expedia/api/expediaApiService';
import type {
    ExpediaCredentials,
    PropertyAvailabilityResult,
    PropertyContentResult,
    PriceCheckResponse,
    BookingResponse,
    ItineraryRetrieveResponse,
    RegionResult,
} from '../integrations/expedia/types/expediaTypes';
import './HotelbedsTest.css'; // Reuse existing styles

type TabType = 'config' | 'shopping' | 'content' | 'booking' | 'geo';

const ExpediaTest: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('config');

    // ─── Konfiguracija ────────────────────────────────────────────────
    const [credentials, setCredentials] = useState<ExpediaCredentials>({
        apiKey: '',
        apiSecret: '',
        environment: 'test',
    });
    const [isConfigured, setIsConfigured] = useState(false);
    const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // ─── Shopping ─────────────────────────────────────────────────────
    const [shopSearch, setShopSearch] = useState({
        checkin: '2026-07-15',
        checkout: '2026-07-22',
        currency: 'EUR',
        language: 'en-US',
        country_code: 'RS',
        adults: '2',
    });
    const [shopResults, setShopResults] = useState<PropertyAvailabilityResult[] | null>(null);
    const [isShopLoading, setIsShopLoading] = useState(false);
    const [selectedToken, setSelectedToken] = useState('');
    const [priceCheckResult, setPriceCheckResult] = useState<PriceCheckResponse | null>(null);
    const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);
    const [expandedProperty, setExpandedProperty] = useState<string | null>(null);

    // ─── Content ──────────────────────────────────────────────────────
    const [contentResults, setContentResults] = useState<PropertyContentResult[] | null>(null);
    const [isContentLoading, setIsContentLoading] = useState(false);

    // ─── Booking / Itinerary ──────────────────────────────────────────
    const [itinerary, setItinerary] = useState<ItineraryRetrieveResponse | null>(null);
    const [itineraryId, setItineraryId] = useState('');
    const [isBookingLoading, setIsBookingLoading] = useState(false);

    // ─── Geo ──────────────────────────────────────────────────────────
    const [geoQuery, setGeoQuery] = useState('Belgrade');
    const [geoResults, setGeoResults] = useState<RegionResult[] | null>(null);
    const [isGeoLoading, setIsGeoLoading] = useState(false);

    // ─── Error ────────────────────────────────────────────────────────
    const [error, setError] = useState<string | null>(null);

    // ─── Handlers ─────────────────────────────────────────────────────

    const handleConfigure = () => {
        if (!credentials.apiKey || !credentials.apiSecret) {
            setConfigStatus('error');
            setError('API Key i API Secret su obavezni!');
            return;
        }
        expediaApiService.configure(credentials);
        setIsConfigured(true);
        setConfigStatus('success');
        setError(null);
    };

    const handleConfigureDemo = () => {
        const demo: ExpediaCredentials = {
            apiKey: 'DEMO_EXP_KEY_12345',
            apiSecret: 'DEMO_EXP_SECRET_67890',
            environment: 'test',
        };
        setCredentials(demo);
        expediaApiService.configure(demo);
        setIsConfigured(true);
        setConfigStatus('success');
        setError(null);
    };

    const handleSearchProperties = async () => {
        setError(null);
        setIsShopLoading(true);
        setShopResults(null);
        setPriceCheckResult(null);
        setBookingResult(null);
        try {
            const results = await expediaApiService.searchProperties({
                checkin: shopSearch.checkin,
                checkout: shopSearch.checkout,
                currency: shopSearch.currency,
                language: shopSearch.language,
                country_code: shopSearch.country_code,
                occupancy: [shopSearch.adults],
            });
            setShopResults(results);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsShopLoading(false);
        }
    };

    const handlePriceCheck = async (token: string) => {
        setError(null);
        setIsShopLoading(true);
        setSelectedToken(token);
        setPriceCheckResult(null);
        try {
            const result = await expediaApiService.checkPrice({ token });
            setPriceCheckResult(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsShopLoading(false);
        }
    };

    const handleBook = async () => {
        setError(null);
        setIsShopLoading(true);
        try {
            const result = await expediaApiService.createItinerary({
                affiliate_reference_id: `CTT-EXP-${Date.now()}`,
                email: 'marko@clicktotravel.rs',
                phone: { country_code: '381', number: '641234567' },
                rooms: [{ given_name: 'Marko', family_name: 'Marković' }],
            });
            setBookingResult(result);
            if (result.itinerary_id) setItineraryId(result.itinerary_id);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsShopLoading(false);
        }
    };

    const handleGetContent = async () => {
        setError(null);
        setIsContentLoading(true);
        setContentResults(null);
        try {
            const results = await expediaApiService.getPropertyContent({ language: 'en-US' });
            setContentResults(results);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsContentLoading(false);
        }
    };

    const handleGetItinerary = async () => {
        if (!itineraryId.trim()) return;
        setError(null);
        setIsBookingLoading(true);
        try {
            const result = await expediaApiService.getItinerary(itineraryId);
            setItinerary(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsBookingLoading(false);
        }
    };

    const handleCancelItinerary = async () => {
        if (!itineraryId.trim()) return;
        setError(null);
        setIsBookingLoading(true);
        try {
            await expediaApiService.cancelItinerary(itineraryId);
            setItinerary(prev => prev ? {
                ...prev,
                rooms: prev.rooms.map(r => ({ ...r, status: { current: 'cancelled' as const } }))
            } : null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsBookingLoading(false);
        }
    };

    const handleSearchRegions = async () => {
        setError(null);
        setIsGeoLoading(true);
        setGeoResults(null);
        try {
            const results = await expediaApiService.searchRegions({ query: geoQuery, language: 'en-US' });
            setGeoResults(results);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsGeoLoading(false);
        }
    };

    // ─── Helpers ──────────────────────────────────────────────────────

    const getStatusIcon = (status: string) => {
        if (status === 'available' || status === 'booked' || status === 'matched') return '✅';
        if (status === 'sold_out' || status === 'failed' || status === 'cancelled') return '❌';
        if (status === 'price_changed') return '⚠️';
        return '🔄';
    };

    const getStatusClass = (status: string) => {
        if (['available', 'booked', 'matched'].includes(status)) return 'confirmed';
        if (['sold_out', 'failed', 'cancelled'].includes(status)) return 'cancelled';
        return 'on-request';
    };

    // ─── Render ───────────────────────────────────────────────────────

    return (
        <div className="hb-test-page">
            {/* ── Header ── */}
            <div className="hb-header" style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #0B6FBA 60%, #0095D9 100%)' }}>
                <div className="hb-header-left">
                    <div className="hb-logo" style={{ background: '#ffffff22' }}>
                        <Globe size={36} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ color: '#fff' }}>Expedia Group — Rapid API</h1>
                        <p style={{ color: '#b3d4f0' }}>Properties • Content • Booking • Geography — Rapid v3</p>
                    </div>
                </div>
                <div className="hb-header-right">
                    <div className={`hb-status-pill ${isConfigured ? 'configured' : 'unconfigured'}`}>
                        {isConfigured ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        <span>{isConfigured ? `Konfigurisan (${expediaApiService.getEnvironment()})` : 'Nije konfigurisan'}</span>
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
                    { id: 'shopping', label: 'Shopping', icon: <Search size={16} /> },
                    { id: 'content', label: 'Content', icon: <Eye size={16} /> },
                    { id: 'booking', label: 'Booking', icon: <CreditCard size={16} /> },
                    { id: 'geo', label: 'Geography', icon: <MapIcon size={16} /> },
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
                            <h2>API Konfiguracija — EAN Signature Auth</h2>
                        </div>

                        <div className="hb-info-box">
                            <Info size={16} />
                            <div>
                                <strong>EAN Signature autentifikacija (SHA-512)</strong>
                                <p>
                                    Svaki zahtev zahteva <code>Authorization: EAN APIKey=...,Signature=SHA512(key+secret+timestamp),timestamp=...</code>.
                                    Signature se kreira SHA-512 heširanjem nadovezanog teksta apiKey + apiSecret + Unix timestamp (sekunde).
                                    U produkciji, ovu logiku treba prebaciti na <strong>backend proxy</strong> radi zaštite tajne!
                                </p>
                            </div>
                        </div>

                        <div className="hb-config-grid">
                            <div className="hb-form-group">
                                <label>API Key <span className="required">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Vaš Expedia Rapid API Key"
                                    value={credentials.apiKey}
                                    onChange={e => setCredentials(p => ({ ...p, apiKey: e.target.value }))}
                                    className="hb-input"
                                />
                            </div>
                            <div className="hb-form-group">
                                <label>API Secret <span className="required">*</span></label>
                                <input
                                    type="password"
                                    placeholder="Vaš Expedia Rapid API Secret"
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
                                    <option value="test">Test / Sandbox (test.ean.com)</option>
                                    <option value="production">Produkcija (api.ean.com)</option>
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
                                <CheckCircle size={20} />
                                <div>
                                    <strong>Uspešno konfigurisano!</strong>
                                    <p>Expedia Rapid servis je aktivan. Koristite tabove "Shopping", "Content", "Booking" i "Geography" za testiranje.</p>
                                </div>
                            </div>
                        )}

                        {/* Endpoint pregled */}
                        <div className="hb-endpoint-table">
                            <h3>Endpoint Pregled — Rapid API v3</h3>
                            <div className="hb-endpoint-grid">
                                {[
                                    { method: 'GET', path: '/properties/availability', desc: 'Pretraga dostupnih nekretnina', api: 'Shopping' },
                                    { method: 'GET', path: '/properties/content', desc: 'Statički sadržaj nekretnina', api: 'Content' },
                                    { method: 'GET', path: '/properties/catalog', desc: 'Katalog svih nekretnina', api: 'Content' },
                                    { method: 'GET', path: '{price_check_link}', desc: 'Provera i potvrda cene', api: 'Shopping' },
                                    { method: 'POST', path: '/itineraries', desc: 'Kreiranje rezervacije', api: 'Booking' },
                                    { method: 'GET', path: '/itineraries/{id}', desc: 'Dohvatanje rezervacije', api: 'Booking' },
                                    { method: 'DELETE', path: '/itineraries/{id}/rooms/{r}', desc: 'Otkazivanje sobe/rezervacije', api: 'Booking' },
                                    { method: 'GET', path: '/regions?query={text}', desc: 'Pretraga regiona/gradova', api: 'Geo' },
                                    { method: 'GET', path: '/regions/{region_id}', desc: 'Detalji regiona', api: 'Geo' },
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

                {/* ══ TAB: SHOPPING ══ */}
                {activeTab === 'shopping' && (
                    <div className="hb-section">
                        <div className="hb-section-header">
                            <Search size={22} />
                            <h2>Shopping API — Pretraga Nekretnina i Cena</h2>
                        </div>

                        {/* Search Form */}
                        <div className="hb-search-card">
                            <h3><Search size={18} /> Pretraga Dostupnosti</h3>
                            <div className="hb-search-grid">
                                <div className="hb-form-group">
                                    <label><Calendar size={14} /> Check-in</label>
                                    <input type="date" className="hb-input" value={shopSearch.checkin}
                                        onChange={e => setShopSearch(p => ({ ...p, checkin: e.target.value }))} />
                                </div>
                                <div className="hb-form-group">
                                    <label><Calendar size={14} /> Check-out</label>
                                    <input type="date" className="hb-input" value={shopSearch.checkout}
                                        onChange={e => setShopSearch(p => ({ ...p, checkout: e.target.value }))} />
                                </div>
                                <div className="hb-form-group">
                                    <label><TrendingUp size={14} /> Valuta</label>
                                    <select className="hb-select" value={shopSearch.currency}
                                        onChange={e => setShopSearch(p => ({ ...p, currency: e.target.value }))}>
                                        <option value="EUR">EUR — Euro</option>
                                        <option value="USD">USD — US Dollar</option>
                                        <option value="GBP">GBP — British Pound</option>
                                        <option value="RSD">RSD — Serbian Dinar</option>
                                    </select>
                                </div>
                                <div className="hb-form-group">
                                    <label><Users size={14} /> Odrasli</label>
                                    <input type="number" min={1} max={9} className="hb-input" value={shopSearch.adults}
                                        onChange={e => setShopSearch(p => ({ ...p, adults: e.target.value }))} />
                                </div>
                                <div className="hb-form-group">
                                    <label><Globe size={14} /> Zemlja korisnika</label>
                                    <input className="hb-input" value={shopSearch.country_code}
                                        onChange={e => setShopSearch(p => ({ ...p, country_code: e.target.value }))}
                                        placeholder="RS, DE, US..." />
                                </div>
                                <div className="hb-form-group">
                                    <label><Globe size={14} /> Jezik</label>
                                    <select className="hb-select" value={shopSearch.language}
                                        onChange={e => setShopSearch(p => ({ ...p, language: e.target.value }))}>
                                        <option value="en-US">en-US (English)</option>
                                        <option value="sr-RS">sr-RS (Srpski)</option>
                                        <option value="de-DE">de-DE (Deutsch)</option>
                                        <option value="fr-FR">fr-FR (Français)</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                className="hb-btn primary full-width"
                                onClick={handleSearchProperties}
                                disabled={isShopLoading || !isConfigured}
                            >
                                {isShopLoading ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
                                {isShopLoading ? 'Pretrajem...' : 'Pretraži Nekretnine'}
                            </button>
                            {!isConfigured && <p className="hb-hint">⚠️ Konfiguriši servis na tab-u "Konfiguracija" pre pretrage.</p>}
                        </div>

                        {/* Shopping Results */}
                        {shopResults && (
                            <div className="hb-results">
                                <div className="hb-results-header">
                                    <span className="hb-results-count">
                                        {shopResults.filter(p => p.status === 'available').length} od {shopResults.length} nekretnina dostupno
                                    </span>
                                    <span className="hb-results-dates">{shopSearch.checkin} → {shopSearch.checkout}</span>
                                </div>
                                {shopResults.map(property => (
                                    <div key={property.property_id} className="hb-hotel-card">
                                        <div className="hb-hotel-top" style={{ cursor: 'pointer' }}
                                            onClick={() => setExpandedProperty(expandedProperty === property.property_id ? null : property.property_id)}>
                                            <div className="hb-hotel-info">
                                                <div className="hb-hotel-stars">
                                                    <span className={`hb-room-status ${getStatusClass(property.status)}`}>
                                                        {getStatusIcon(property.status)} {property.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </div>
                                                <h3>{property.property_id}</h3>
                                                <p className="hb-hotel-dest">
                                                    <Building2 size={13} /> {property.rooms.length} tip(a) soba dostupno
                                                </p>
                                            </div>
                                            <div className="hb-hotel-price">
                                                {property.rooms[0]?.rates[0]?.occupancy_pricing?.['2']?.totals?.exclusive?.billable_currency ? (
                                                    <>
                                                        <div className="hb-price-from">od (exclusive)</div>
                                                        <div className="hb-price-main">
                                                            {property.rooms[0].rates[0].occupancy_pricing['2'].totals.exclusive.billable_currency.value}
                                                            {' '}{property.rooms[0].rates[0].occupancy_pricing['2'].totals.exclusive.billable_currency.currency}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="hb-price-from">–</div>
                                                )}
                                                <div className="hb-expand-btn">
                                                    {expandedProperty === property.property_id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </div>
                                            </div>
                                        </div>

                                        {expandedProperty === property.property_id && property.rooms.length > 0 && (
                                            <div className="hb-hotel-rooms">
                                                {property.rooms.map(room => (
                                                    <div key={room.id} className="hb-room-row">
                                                        <div className="hb-room-info">
                                                            <span className="hb-room-name">{room.room_name}</span>
                                                            <span className="hb-room-code">{room.id}</span>
                                                        </div>
                                                        {room.rates.map((rate, ri) => {
                                                            const pricing = rate.occupancy_pricing[shopSearch.adults];
                                                            const inclusive = pricing?.totals.inclusive.billable_currency;
                                                            const exclusive = pricing?.totals.exclusive.billable_currency;
                                                            const strikethrough = pricing?.totals.inclusive_strikethrough?.billable_currency;
                                                            const bedGroup = Object.values(rate.bed_groups)[0];
                                                            const priceCheckToken = bedGroup?.links?.price_check?.href?.split('token=')?.[1] ?? `token-${ri}`;

                                                            return (
                                                                <div key={ri} className="hb-rate-row">
                                                                    <span className="hb-board-badge" style={{ background: '#3b82f622', color: '#3b82f6', borderColor: '#3b82f644' }}>
                                                                        {bedGroup?.description ?? 'Bed group'}
                                                                    </span>
                                                                    {rate.amenities?.['2017'] && (
                                                                        <span className="hb-board-badge" style={{ background: '#10b98122', color: '#10b981', borderColor: '#10b98144' }}>
                                                                            <Wifi size={11} /> Free WiFi
                                                                        </span>
                                                                    )}
                                                                    {rate.member_deal_available && (
                                                                        <span className="hb-board-badge" style={{ background: '#f59e0b22', color: '#f59e0b', borderColor: '#f59e0b44' }}>
                                                                            <Tag size={11} /> Member Deal
                                                                        </span>
                                                                    )}
                                                                    {exclusive && (
                                                                        <span className="hb-rate-net">
                                                                            Neto: <strong>{exclusive.value} {exclusive.currency}</strong>
                                                                        </span>
                                                                    )}
                                                                    {inclusive && (
                                                                        <span className="hb-rate-sell">
                                                                            Sa taksama: {inclusive.value} {inclusive.currency}
                                                                        </span>
                                                                    )}
                                                                    {strikethrough && (
                                                                        <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.8rem' }}>
                                                                            {strikethrough.value}
                                                                        </span>
                                                                    )}
                                                                    <span className={`hb-pay-type ${rate.refundable ? 'at_web' : 'at_hotel'}`}>
                                                                        {rate.refundable ? 'Refundable' : 'Non-refundable'}
                                                                    </span>
                                                                    <span className="hb-allotment">Dostupno: {rate.available_rooms}</span>
                                                                    <button
                                                                        className="hb-btn-sm primary"
                                                                        onClick={() => handlePriceCheck(priceCheckToken)}
                                                                        disabled={isShopLoading}
                                                                    >
                                                                        Price Check
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Price Check Result */}
                        {priceCheckResult && (
                            <div className="hb-rate-result-card">
                                <div className="hb-rate-result-header">
                                    <span style={{ fontSize: '1.5rem' }}>{getStatusIcon(priceCheckResult.status)}</span>
                                    <h3>Price Check — {priceCheckResult.status.replace('_', ' ').toUpperCase()}</h3>
                                </div>
                                <div className="hb-rate-result-body">
                                    <div className="hb-rate-summary">
                                        <div>
                                            <label>Status</label>
                                            <span className={`hb-status-text ${getStatusClass(priceCheckResult.status)}`}>
                                                {priceCheckResult.status}
                                            </span>
                                        </div>
                                        {priceCheckResult.cancel_penalties && priceCheckResult.cancel_penalties.length > 0 && (
                                            <div>
                                                <label>Otkazni Uslovi</label>
                                                <span>
                                                    {priceCheckResult.cancel_penalties[0].amount === '0'
                                                        ? '✅ Besplatno otkazivanje'
                                                        : `⚠️ ${priceCheckResult.cancel_penalties[0].percent ?? priceCheckResult.cancel_penalties[0].nights_charged + ' noći'} naknada`
                                                    }
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <label>Token</label>
                                            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{selectedToken}</span>
                                        </div>
                                    </div>
                                    {priceCheckResult.status === 'matched' && (
                                        <button
                                            className="hb-btn primary"
                                            onClick={handleBook}
                                            disabled={isShopLoading}
                                        >
                                            {isShopLoading ? <RefreshCw size={16} className="spin" /> : <CreditCard size={16} />}
                                            Potvrdi Rezervaciju (POST /itineraries)
                                        </button>
                                    )}
                                    {priceCheckResult.status === 'sold_out' && (
                                        <p style={{ color: '#ef4444', marginTop: '1rem' }}>❌ Soba nije više dostupna. Izaberite drugu opciju.</p>
                                    )}
                                    {priceCheckResult.status === 'price_changed' && (
                                        <p style={{ color: '#f59e0b', marginTop: '1rem' }}>⚠️ Cena se promenila. Prikazati putniku novu cenu pre nastavka.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Booking Confirmation */}
                        {bookingResult && (
                            <div className="hb-booking-confirmed">
                                <div className="hb-booking-header">
                                    <CheckCircle size={32} color="#10b981" />
                                    <div>
                                        <h2>Itinerer Kreiran!</h2>
                                        <p>Status: <strong className={`hb-status-text ${getStatusClass(bookingResult.status)}`}>{bookingResult.status}</strong></p>
                                    </div>
                                </div>
                                <div className="hb-booking-details">
                                    <div className="hb-booking-ref">
                                        <label>Itinerary ID</label>
                                        <span className="hb-ref-code">{bookingResult.itinerary_id}</span>
                                    </div>
                                    {bookingResult.reservation_id && (
                                        <div className="hb-booking-ref">
                                            <label>Reservation ID</label>
                                            <span className="hb-ref-code">{bookingResult.reservation_id}</span>
                                        </div>
                                    )}
                                    <div className="hb-booking-ref">
                                        <label>Retrieve Link</label>
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                            {bookingResult.links?.retrieve?.href}
                                        </span>
                                    </div>
                                    <div className="hb-booking-ref">
                                        <label>Sledeći Korak</label>
                                        <span>Idite na <strong>tab "Booking"</strong> i unesite Itinerary ID da vidite detalje ili otkažete.</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ TAB: CONTENT ══ */}
                {activeTab === 'content' && (
                    <div className="hb-section">
                        <div className="hb-section-header">
                            <Eye size={22} />
                            <h2>Content API — Statički Podaci o Nekretninama</h2>
                        </div>

                        <div className="hb-info-box">
                            <Info size={16} />
                            <div>
                                <strong>Kada koristiti Content API?</strong>
                                <p>
                                    Content API vraća statičke podatke: ime hotela, adresa, slike, amenities, opisi.
                                    Ovi podaci se <strong>keširaju lokalno</strong> jer se retko menjaju.
                                    Ne pozivajte Content API pri svakoj pretrazi — samo pri prvom prikazu ili nedeljno.
                                </p>
                            </div>
                        </div>

                        <button
                            className="hb-btn primary"
                            onClick={handleGetContent}
                            disabled={isContentLoading || !isConfigured}
                        >
                            {isContentLoading ? <RefreshCw size={16} className="spin" /> : <Eye size={16} />}
                            {isContentLoading ? 'Učitavamo...' : 'Učitaj Sadržaj Nekretnina'}
                        </button>

                        {contentResults && (
                            <div className="hb-results" style={{ marginTop: '1.5rem' }}>
                                <div className="hb-results-header">
                                    <span className="hb-results-count">{contentResults.length} nekretnina</span>
                                </div>
                                {contentResults.map(property => (
                                    <div key={property.property_id} className="hb-hotel-card">
                                        <div className="hb-hotel-top">
                                            <div className="hb-hotel-info">
                                                <div className="hb-hotel-stars">
                                                    {property.ratings?.property && (
                                                        Array.from({ length: parseInt(property.ratings.property.rating) || 4 }, (_, i) => (
                                                            <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />
                                                        ))
                                                    )}
                                                    {property.category && (
                                                        <span className="hb-room-code" style={{ marginLeft: '0.5rem' }}>{property.category.name}</span>
                                                    )}
                                                </div>
                                                <h3>{property.name}</h3>
                                                <p className="hb-hotel-dest">
                                                    <MapPin size={13} />
                                                    {property.address.line_1}, {property.address.city}, {property.address.country_code}
                                                </p>
                                                {property.location?.coordinates && (
                                                    <p className="hb-hotel-coords">
                                                        <Globe size={12} />
                                                        {property.location.coordinates.latitude}°N, {property.location.coordinates.longitude}°E
                                                    </p>
                                                )}
                                                {property.descriptions?.headline && (
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                                        {property.descriptions.headline}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="hb-hotel-price">
                                                {property.ratings?.guest && (
                                                    <>
                                                        <div className="hb-price-from">Gost ocena</div>
                                                        <div className="hb-price-main" style={{ fontSize: '1.75rem' }}>
                                                            {property.ratings.guest.overall}
                                                            <span style={{ fontSize: '0.9rem' }}>/5</span>
                                                        </div>
                                                        <div className="hb-price-to">{property.ratings.guest.count} recenzija</div>
                                                        <div className="hb-price-to">{property.ratings.guest.recommendation_percent}% preporučuje</div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {property.amenities && Object.keys(property.amenities).length > 0 && (
                                            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {Object.values(property.amenities).map(amenity => (
                                                    <span key={amenity.id} className="hb-cat-badge">
                                                        {amenity.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <span>ID: <code>{property.property_id}</code></span>
                                            {property.phone && <span>📞 {property.phone}</span>}
                                            {property.checkin?.begin_time && <span><Clock size={12} /> Check-in: {property.checkin.begin_time}</span>}
                                            {property.checkout?.time && <span>Check-out: {property.checkout.time}</span>}
                                            {property.dates?.updated && <span>Ažurirano: {property.dates.updated}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ══ TAB: BOOKING ══ */}
                {activeTab === 'booking' && (
                    <div className="hb-section">
                        <div className="hb-section-header">
                            <CreditCard size={22} />
                            <h2>Booking — Upravljanje Itinererom</h2>
                        </div>

                        <div className="hb-info-box">
                            <Info size={16} />
                            <div>
                                <strong>Booking Flow u 3 koraka</strong>
                                <p>
                                    <strong>1.</strong> Shopping → izaberite sobu
                                    <ArrowRight size={12} style={{ display: 'inline' }} />
                                    <strong>2.</strong> Price Check → potvrda cene
                                    <ArrowRight size={12} style={{ display: 'inline' }} />
                                    <strong>3.</strong> POST /itineraries → kreiranje rezervacije.
                                    Koristite Itinerary ID iz prethodnog koraka da upravljate rezervacijom.
                                </p>
                            </div>
                        </div>

                        <div className="hb-search-card">
                            <h3><CreditCard size={18} /> Upravljanje Rezervacijom</h3>
                            <div className="hb-form-group" style={{ marginBottom: '1rem' }}>
                                <label>Itinerary ID</label>
                                <input
                                    className="hb-input"
                                    value={itineraryId}
                                    onChange={e => setItineraryId(e.target.value)}
                                    placeholder="npr. EXP-ITN-1234567890-ABCD"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    className="hb-btn primary"
                                    onClick={handleGetItinerary}
                                    disabled={isBookingLoading || !itineraryId.trim() || !isConfigured}
                                >
                                    {isBookingLoading ? <RefreshCw size={16} className="spin" /> : <Eye size={16} />}
                                    Prikazi Itinerer
                                </button>
                                <button
                                    className="hb-btn"
                                    style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444' }}
                                    onClick={handleCancelItinerary}
                                    disabled={isBookingLoading || !itineraryId.trim() || !isConfigured}
                                >
                                    <XCircle size={16} /> Otkaži Rezervaciju
                                </button>
                            </div>
                        </div>

                        {itinerary && (
                            <div className="hb-booking-confirmed">
                                <div className="hb-booking-header">
                                    <CheckCircle size={32} color="#10b981" />
                                    <div>
                                        <h2>Itinerer Pronađen</h2>
                                        <p>Room Status: <strong className={`hb-status-text ${getStatusClass(itinerary.rooms[0]?.status?.current ?? 'pending')}`}>{itinerary.rooms[0]?.status?.current}</strong></p>
                                    </div>
                                </div>
                                <div className="hb-booking-details">
                                    <div className="hb-booking-ref">
                                        <label>Itinerary ID</label>
                                        <span className="hb-ref-code">{itinerary.itinerary_id}</span>
                                    </div>
                                    <div className="hb-booking-ref">
                                        <label>Property ID</label>
                                        <span className="hb-ref-code">{itinerary.property_id}</span>
                                    </div>
                                    <div className="hb-booking-ref">
                                        <label>Affiliate Reference</label>
                                        <span>{itinerary.affiliate_reference_id}</span>
                                    </div>
                                    <div className="hb-booking-ref">
                                        <label>Email Putnika</label>
                                        <span>{itinerary.email}</span>
                                    </div>
                                    <div className="hb-booking-ref">
                                        <label>Datum Kreiranja</label>
                                        <span>{itinerary.creation_date_time}</span>
                                    </div>
                                    {itinerary.rooms.map((room, idx) => (
                                        <div key={idx} className="hb-booking-ref" style={{ gridColumn: '1 / -1', background: 'var(--surface-secondary)' }}>
                                            <label>Soba {idx + 1}</label>
                                            <span>
                                                {room.given_name} {room.family_name} |
                                                {room.checkin} → {room.checkout} |
                                                {room.number_of_adults} odrasl{room.number_of_adults === 1 ? 'a' : 'ih'} |
                                                Expedia Conf: <strong>{room.confirmation_id?.expedia ?? 'N/A'}</strong>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ TAB: GEO ══ */}
                {activeTab === 'geo' && (
                    <div className="hb-section">
                        <div className="hb-section-header">
                            <MapIcon size={22} />
                            <h2>Geography API — Pretraga Regiona i Lokacija</h2>
                        </div>

                        <div className="hb-search-card">
                            <h3><MapPin size={18} /> Pretraga Regiona / Gradova / Aerodroma</h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                <div className="hb-form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label><Search size={14} /> Tekst pretrage</label>
                                    <input
                                        className="hb-input"
                                        value={geoQuery}
                                        onChange={e => setGeoQuery(e.target.value)}
                                        placeholder="npr. Belgrade, Paris, JFK..."
                                        onKeyDown={e => e.key === 'Enter' && handleSearchRegions()}
                                    />
                                </div>
                                <button
                                    className="hb-btn primary"
                                    onClick={handleSearchRegions}
                                    disabled={isGeoLoading || !isConfigured}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    {isGeoLoading ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
                                    Pretraži
                                </button>
                            </div>
                        </div>

                        {geoResults !== null && (
                            <div className="hb-results" style={{ marginTop: '1.5rem' }}>
                                <div className="hb-results-header">
                                    <span className="hb-results-count">{geoResults.length} rezultat(a) za "{geoQuery}"</span>
                                </div>
                                {geoResults.length === 0 && (
                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                        Nema rezultata za "{geoQuery}". Probajte drugi termin.
                                    </p>
                                )}
                                {geoResults.map(region => (
                                    <div key={region.id} className="hb-transfer-card">
                                        <div className="hb-transfer-icon">
                                            <span className="hb-transfer-emoji">
                                                {region.type === 'airport' ? '✈️' :
                                                    region.type === 'city' ? '🏙️' :
                                                        region.type === 'country' ? '🌍' : '📍'}
                                            </span>
                                        </div>
                                        <div className="hb-transfer-info">
                                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <span className="hb-transfer-type-badge">{region.type.replace('_', ' ')}</span>
                                                <span className="hb-cat-badge">{region.country_code}</span>
                                            </div>
                                            <h3>{region.name}</h3>
                                            <p>{region.name_full}</p>
                                            <div className="hb-transfer-meta">
                                                <span>ID: <code>{region.id}</code></span>
                                                {region.center && (
                                                    <span><Globe size={13} /> {region.center.lat.toFixed(4)}°N, {region.center.lng.toFixed(4)}°E</span>
                                                )}
                                                {region.ancestors && region.ancestors.length > 0 && (
                                                    <span>
                                                        {region.ancestors.map(a => a.name).join(' › ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="hb-transfer-price" style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Region ID</div>
                                            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem' }}>{region.id}</div>
                                            <button className="hb-btn-sm secondary" style={{ marginTop: '0.5rem' }}
                                                onClick={() => alert(`Koristite ovaj ID u Shopping pretrazi:\nproperty_catalog?region_id=${region.id}`)}>
                                                <ArrowRight size={14} /> Kopiraj ID
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpediaTest;
