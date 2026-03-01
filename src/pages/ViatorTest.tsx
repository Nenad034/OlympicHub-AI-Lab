import React, { useState, useCallback } from 'react';
import {
    Globe, Search, Star, Clock, MapPin, Users, Calendar,
    CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp,
    ArrowRight, Info, Shield, Ticket, Heart, AlertTriangle,
    Zap, CreditCard, BookOpen, Tag, Navigation, MessageSquare
} from 'lucide-react';
import viatorApiService from '../integrations/viator/api/viatorApiService';
import type {
    ViatorCredentials,
    ViatorSearchResponse,
    ViatorAvailabilityCheckResponse,
    ViatorBookingHoldResponse,
    ViatorBookingResponse,
    ViatorProduct,
    ViatorCancellationReason,
} from '../integrations/viator/types/viatorTypes';
import './ViatorTest.css';

type TabType = 'config' | 'search' | 'product' | 'availability' | 'booking' | 'cancel';

const ViatorTest: React.FC = () => {
    // ─── Konfiguracija ────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<TabType>('config');
    const [credentials, setCredentials] = useState<ViatorCredentials>({
        apiKey: '',
        environment: 'sandbox',
        partnerType: 'merchant',
    });
    const [isConfigured, setIsConfigured] = useState(false);
    const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // ─── Search ───────────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState('Rome');
    const [searchDestination, setSearchDestination] = useState('732');
    const [searchTag, setSearchTag] = useState('');
    const [searchMode, setSearchMode] = useState<'freetext' | 'filtered'>('freetext');
    const [searchResults, setSearchResults] = useState<ViatorSearchResponse | null>(null);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [selectedProductCode, setSelectedProductCode] = useState('');

    // ─── Product Detail ───────────────────────────────────────────────
    const [productDetail, setProductDetail] = useState<ViatorProduct | null>(null);
    const [isProductLoading, setIsProductLoading] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    // ─── Availability ─────────────────────────────────────────────────
    const [availCheck, setAvailCheck] = useState({
        productCode: 'VTR-ROME-001',
        travelDate: '2026-07-20',
        startTime: '09:00',
        adults: 2,
        children: 1,
        currency: 'EUR',
    });
    const [availResult, setAvailResult] = useState<ViatorAvailabilityCheckResponse | null>(null);
    const [isAvailLoading, setIsAvailLoading] = useState(false);

    // ─── Booking ──────────────────────────────────────────────────────
    const [holdResult, setHoldResult] = useState<ViatorBookingHoldResponse | null>(null);
    const [bookingResult, setBookingResult] = useState<ViatorBookingResponse | null>(null);
    const [bookerInfo, setBookerInfo] = useState({ firstName: 'Marko', lastName: 'Marković', email: 'marko@clicktotravel.rs' });
    const [isBookingLoading, setIsBookingLoading] = useState(false);

    // ─── Cancel ───────────────────────────────────────────────────────
    const [cancelReasons, setCancelReasons] = useState<ViatorCancellationReason[]>([]);
    const [selectedReason, setSelectedReason] = useState('');
    const [cancelRef, setCancelRef] = useState('');
    const [cancelResult, setCancelResult] = useState<any>(null);
    const [isCancelLoading, setIsCancelLoading] = useState(false);

    // ─── Global Error ─────────────────────────────────────────────────
    const [error, setError] = useState<string | null>(null);

    // ─── Handlers ─────────────────────────────────────────────────────

    const handleConfigure = () => {
        if (!credentials.apiKey) {
            setConfigStatus('error');
            setError('API Key je obavezan!');
            return;
        }
        viatorApiService.configure(credentials);
        setIsConfigured(true);
        setConfigStatus('success');
        setError(null);
    };

    const handleConfigureDemo = () => {
        const demo: ViatorCredentials = {
            apiKey: 'VIATOR-DEMO-API-KEY-12345',
            environment: 'sandbox',
            partnerType: 'merchant',
        };
        setCredentials(demo);
        viatorApiService.configure(demo);
        setIsConfigured(true);
        setConfigStatus('success');
        setError(null);
    };

    const handleSearch = async () => {
        setError(null);
        setIsSearchLoading(true);
        setSearchResults(null);
        try {
            let result: ViatorSearchResponse;
            if (searchMode === 'freetext') {
                result = await viatorApiService.freetextSearch({
                    searchTerm,
                    searchTypes: [{ searchType: 'PRODUCTS' }, { searchType: 'DESTINATIONS' }],
                    currency: 'EUR',
                });
            } else {
                result = await viatorApiService.searchProducts({
                    filtering: {
                        destination: searchDestination || undefined,
                        tags: searchTag ? [parseInt(searchTag)] : undefined,
                    },
                    sorting: { sort: 'TOP_RATED' },
                    pagination: { start: 1, count: 20 },
                    currency: 'EUR',
                });
            }
            setSearchResults(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSearchLoading(false);
        }
    };

    const handleGetProduct = async (productCode?: string) => {
        const code = productCode ?? selectedProductCode;
        if (!code) return;
        setError(null);
        setIsProductLoading(true);
        setActiveTab('product');
        try {
            const result = await viatorApiService.getProduct(code);
            setProductDetail(result);
            setAvailCheck(p => ({ ...p, productCode: result.productCode }));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsProductLoading(false);
        }
    };

    const handleCheckAvail = async () => {
        setError(null);
        setIsAvailLoading(true);
        setAvailResult(null);
        try {
            const paxMix = [
                ...(availCheck.adults > 0 ? [{ ageBand: 'ADULT' as const, numberOfTravelers: availCheck.adults }] : []),
                ...(availCheck.children > 0 ? [{ ageBand: 'CHILD' as const, numberOfTravelers: availCheck.children }] : []),
            ];
            const result = await viatorApiService.checkAvailability({
                productCode: availCheck.productCode,
                currency: availCheck.currency,
                travelDate: availCheck.travelDate,
                startTime: availCheck.startTime || undefined,
                paxMix,
            });
            setAvailResult(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsAvailLoading(false);
        }
    };

    const handleHold = async () => {
        if (!availResult) return;
        setError(null);
        setIsBookingLoading(true);
        try {
            const result = await viatorApiService.holdBooking({
                productCode: availResult.productCode,
                travelDate: availResult.travelDate,
                startTime: availResult.startTime,
                paxMix: availResult.paxMix,
                currency: availResult.currency,
            });
            setHoldResult(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsBookingLoading(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!availResult) return;
        setError(null);
        setIsBookingLoading(true);
        try {
            const result = await viatorApiService.confirmBooking({
                productCode: availResult.productCode,
                travelDate: availResult.travelDate,
                startTime: availResult.startTime,
                paxMix: availResult.paxMix,
                currency: availResult.currency,
                bookerInfo,
                partnerBookingRef: `CTT-VTR-${Date.now()}`,
                cartRef: holdResult?.cartRef,
            });
            setBookingResult(result);
            if (result.bookings[0]?.bookingRef) {
                setCancelRef(result.bookings[0].bookingRef);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsBookingLoading(false);
        }
    };

    const handleLoadReasons = useCallback(async () => {
        if (cancelReasons.length > 0) return;
        try {
            const reasons = await viatorApiService.getCancellationReasons();
            setCancelReasons(reasons);
        } catch { }
    }, [cancelReasons.length]);

    const handleCancel = async () => {
        if (!cancelRef || !selectedReason) return;
        setError(null);
        setIsCancelLoading(true);
        setCancelResult(null);
        try {
            const result = await viatorApiService.cancelBooking({ bookingRef: cancelRef, reasonCode: selectedReason });
            setCancelResult(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsCancelLoading(false);
        }
    };

    // ─── Helpers ──────────────────────────────────────────────────────
    const formatDuration = (d?: ViatorProduct['duration']) => {
        if (!d) return '—';
        if (d.fixedDurationInMinutes) {
            const h = Math.floor(d.fixedDurationInMinutes / 60);
            const m = d.fixedDurationInMinutes % 60;
            return h > 0 ? `${h}h ${m > 0 ? m + 'min' : ''}` : `${m}min`;
        }
        if (d.variableDurationFromMinutes && d.variableDurationToMinutes) {
            return `${Math.floor(d.variableDurationFromMinutes / 60)}h–${Math.floor(d.variableDurationToMinutes / 60)}h`;
        }
        return d.unstructuredDuration ?? '—';
    };

    const renderStars = (rating: number) => (
        <span className="vtr-stars">
            {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={12} fill={i < Math.round(rating) ? '#f59e0b' : 'none'} color="#f59e0b" />
            ))}
            <span>{rating.toFixed(1)}</span>
        </span>
    );

    // ─── Render ───────────────────────────────────────────────────────

    return (
        <div className="vtr-page">
            {/* ── Header ── */}
            <div className="vtr-header">
                <div className="vtr-header-left">
                    <div className="vtr-logo">
                        <Ticket size={34} />
                    </div>
                    <div>
                        <h1>Viator Partner API</h1>
                        <p>Tours & Experiences — 300,000+ produkata globalno</p>
                    </div>
                </div>
                <div className="vtr-header-right">
                    <div className={`vtr-status-pill ${isConfigured ? 'configured' : 'unconfigured'}`}>
                        {isConfigured ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {isConfigured ? `${viatorApiService.getPartnerType().toUpperCase()} · ${viatorApiService.getEnvironment()}` : 'Nije konfigurisan'}
                    </div>
                    <div className="vtr-viator-badge">
                        <Globe size={13} />
                        <span>by Tripadvisor Group</span>
                    </div>
                </div>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="vtr-error-banner">
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><XCircle size={14} /></button>
                </div>
            )}

            {/* ── Tabs ── */}
            <div className="vtr-tabs">
                {[
                    { id: 'config', label: 'Konfiguracija', icon: <Shield size={15} /> },
                    { id: 'search', label: 'Pretraga', icon: <Search size={15} /> },
                    { id: 'product', label: 'Produkt', icon: <BookOpen size={15} /> },
                    { id: 'availability', label: 'Dostupnost', icon: <Calendar size={15} /> },
                    { id: 'booking', label: 'Rezervacija', icon: <CreditCard size={15} /> },
                    { id: 'cancel', label: 'Otkazivanje', icon: <XCircle size={15} /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`vtr-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(tab.id as TabType);
                            if (tab.id === 'cancel') handleLoadReasons();
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className="vtr-content">

                {/* ══ TAB: KONFIGURACIJA ══ */}
                {activeTab === 'config' && (
                    <div className="vtr-section">
                        <div className="vtr-section-header">
                            <Shield size={22} />
                            <h2>API Konfiguracija</h2>
                        </div>

                        <div className="vtr-info-box blue">
                            <Info size={16} />
                            <div>
                                <strong>Viator Partner API v2 — API Key autentifikacija</strong>
                                <p>Svaki zahtev zahteva <code>exp-api-key</code> header. Za pristup API ključu, kontaktirajte Viator Business Development tim. Sandbox okruženje je dostupno za razvoj i testiranje.</p>
                            </div>
                        </div>

                        <div className="vtr-config-grid">
                            <div className="vtr-form-group">
                                <label>API Key <span className="req">*</span></label>
                                <input className="vtr-input" type="text" placeholder="Vaš Viator API Key"
                                    value={credentials.apiKey}
                                    onChange={e => setCredentials(p => ({ ...p, apiKey: e.target.value }))} />
                            </div>
                            <div className="vtr-form-group">
                                <label>Tip Partnera</label>
                                <select className="vtr-select" value={credentials.partnerType}
                                    onChange={e => setCredentials(p => ({ ...p, partnerType: e.target.value as any }))}>
                                    <option value="affiliate">Affiliate (komisija, Viator booking)</option>
                                    <option value="merchant">Merchant (pun pristup, direktan booking)</option>
                                </select>
                            </div>
                            <div className="vtr-form-group">
                                <label>Okruženje</label>
                                <select className="vtr-select" value={credentials.environment}
                                    onChange={e => setCredentials(p => ({ ...p, environment: e.target.value as any }))}>
                                    <option value="sandbox">Sandbox / Test</option>
                                    <option value="production">Produkcija</option>
                                </select>
                            </div>
                        </div>

                        <div className="vtr-config-actions">
                            <button className="vtr-btn primary" onClick={handleConfigure}>
                                <Zap size={16} /> Konfiguriši
                            </button>
                            <button className="vtr-btn secondary" onClick={handleConfigureDemo}>
                                <RefreshCw size={16} /> Demo Kredencijali
                            </button>
                        </div>

                        {configStatus === 'success' && (
                            <div className="vtr-success-box">
                                <CheckCircle size={20} />
                                <div>
                                    <strong>Uspešno konfigurisano!</strong>
                                    <p>Viator servis je aktivan ({credentials.partnerType} mode). Koristite tabove iznad za testiranje.</p>
                                </div>
                            </div>
                        )}

                        {/* Partner Types Comparison */}
                        <div className="vtr-partner-compare">
                            <h3>Upoređivanje tipova partnerstava</h3>
                            <div className="vtr-compare-grid">
                                <div className="vtr-compare-card affiliate">
                                    <h4>🔗 Affiliate Partner</h4>
                                    <ul>
                                        <li><CheckCircle size={13} color="#10b981" /> Pristup svim sadržajima (Products, Images, Reviews)</li>
                                        <li><CheckCircle size={13} color="#10b981" /> Pretraga i prikazivanje produkata</li>
                                        <li><XCircle size={13} color="#ef4444" /> Booking — klijent se preusmerava na viator.com</li>
                                        <li><XCircle size={13} color="#ef4444" /> Nema direktnog upravljanja rezervacijama</li>
                                        <li>💰 Komisija na svaku prodaju</li>
                                    </ul>
                                </div>
                                <div className="vtr-compare-card merchant">
                                    <h4>💳 Merchant Partner</h4>
                                    <ul>
                                        <li><CheckCircle size={13} color="#10b981" /> Pun pristup svim API endpointima</li>
                                        <li><CheckCircle size={13} color="#10b981" /> Direktni booking (/bookings/hold + /bookings/book)</li>
                                        <li><CheckCircle size={13} color="#10b981" /> Upravljanje otkazivanjem</li>
                                        <li><CheckCircle size={13} color="#10b981" /> Voucher management</li>
                                        <li>💰 Merchant of record — direktna naplata</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Endpoint Table */}
                        <div className="vtr-endpoint-table">
                            <h3>API Endpoint Pregled</h3>
                            <div className="vtr-endpoint-list">
                                {[
                                    { m: 'GET', path: '/destinations', desc: 'Lista destinacija', access: 'all' },
                                    { m: 'GET', path: '/tags', desc: 'Lista tagova/kategorija', access: 'all' },
                                    { m: 'POST', path: '/search/freetext', desc: 'Slobodna pretraga produkata + destinacija', access: 'all' },
                                    { m: 'POST', path: '/products/search', desc: 'Pretraga sa filterima', access: 'all' },
                                    { m: 'GET', path: '/products/{product-code}', desc: 'Detalji jednog produkta', access: 'all' },
                                    { m: 'POST', path: '/products/bulk', desc: 'Detalji više produkata odjednom', access: 'all' },
                                    { m: 'POST', path: '/products/modified-since', desc: 'Delta update kataloga (ingestion)', access: 'all' },
                                    { m: 'POST', path: '/products/recommendations', desc: 'Preporuke sličnih produkata', access: 'all' },
                                    { m: 'GET', path: '/availability/schedules/{code}', desc: 'Raspored dostupnosti za produkt', access: 'all' },
                                    { m: 'POST', path: '/availability/check', desc: 'Check availability + pricing za datum/pax', access: 'all' },
                                    { m: 'POST', path: '/bookings/hold', desc: 'Hold availability + pricing (15 min)', access: 'merchant' },
                                    { m: 'POST', path: '/bookings/book', desc: 'Potvrda rezervacije', access: 'merchant' },
                                    { m: 'GET', path: '/bookings/status', desc: 'Status rezervacije', access: 'merchant' },
                                    { m: 'DELETE', path: '/bookings/{ref}', desc: 'Otkazivanje rezervacije', access: 'merchant' },
                                    { m: 'GET', path: '/cancellations/reasons', desc: 'Razlozi za otkazivanje', access: 'merchant' },
                                ].map((ep, i) => (
                                    <div key={i} className="vtr-endpoint-row">
                                        <span className={`vtr-method ${ep.m.toLowerCase()}`}>{ep.m}</span>
                                        <code className="vtr-path">{ep.path}</code>
                                        <span className="vtr-ep-desc">{ep.desc}</span>
                                        <span className={`vtr-access-badge ${ep.access}`}>{ep.access === 'all' ? 'All' : 'Merchant'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ TAB: PRETRAGA ══ */}
                {activeTab === 'search' && (
                    <div className="vtr-section">
                        <div className="vtr-section-header">
                            <Search size={22} />
                            <h2>Pretraga Tours & Experiences</h2>
                        </div>

                        <div className="vtr-search-card">
                            {/* Search Mode Toggle */}
                            <div className="vtr-mode-toggle">
                                <button className={`vtr-mode-btn ${searchMode === 'freetext' ? 'active' : ''}`}
                                    onClick={() => setSearchMode('freetext')}>
                                    <Search size={14} /> Freetext pretraga
                                </button>
                                <button className={`vtr-mode-btn ${searchMode === 'filtered' ? 'active' : ''}`}
                                    onClick={() => setSearchMode('filtered')}>
                                    <Tag size={14} /> Filtrovana pretraga
                                </button>
                            </div>

                            {searchMode === 'freetext' ? (
                                <div className="vtr-form-group">
                                    <label><Search size={14} /> Pretraga (tur, destinacija, aktivnost)</label>
                                    <input className="vtr-input large" value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder="npr. Rome walking tour, Colosseum, Barcelona..."
                                        onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                                </div>
                            ) : (
                                <div className="vtr-search-grid">
                                    <div className="vtr-form-group">
                                        <label><MapPin size={14} /> Destination ID</label>
                                        <input className="vtr-input" value={searchDestination}
                                            onChange={e => setSearchDestination(e.target.value)}
                                            placeholder="npr. 732 (Rome), 662 (Barcelona)" />
                                    </div>
                                    <div className="vtr-form-group">
                                        <label><Tag size={14} /> Tag ID (opcionalno)</label>
                                        <input className="vtr-input" value={searchTag}
                                            onChange={e => setSearchTag(e.target.value)}
                                            placeholder="npr. 7 (Skip-the-Line)" />
                                    </div>
                                </div>
                            )}

                            <button className="vtr-btn primary fw" onClick={handleSearch}
                                disabled={isSearchLoading || !isConfigured}>
                                {isSearchLoading ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
                                {isSearchLoading ? 'Pretražujem...' : 'Pretraži Viator Katalog'}
                            </button>
                            {!isConfigured && <p className="vtr-hint">⚠️ Konfiguriši servis na tab-u "Konfiguracija" pre pretrage.</p>}
                        </div>

                        {/* Destination Results */}
                        {searchResults?.destinations && searchResults.destinations.results.length > 0 && (
                            <div className="vtr-result-group">
                                <div className="vtr-result-group-header">
                                    <Navigation size={16} /> Destinacije ({searchResults.destinations.totalCount})
                                </div>
                                <div className="vtr-dest-list">
                                    {searchResults.destinations.results.map(d => (
                                        <div key={d.destinationId} className="vtr-dest-chip"
                                            onClick={() => { setSearchDestination(String(d.destinationId)); setSearchMode('filtered'); }}>
                                            <MapPin size={13} /> {d.destinationName}
                                            <span className="vtr-dest-type">{d.destinationType}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Product Results */}
                        {searchResults?.products && (
                            <div className="vtr-result-group">
                                <div className="vtr-result-group-header">
                                    <Ticket size={16} /> Produkti ({searchResults.products.totalCount})
                                </div>
                                <div className="vtr-product-grid">
                                    {searchResults.products.results.map(product => (
                                        <div key={product.productCode} className="vtr-product-card">
                                            <div className="vtr-product-image-placeholder">
                                                <Ticket size={40} color="rgba(99,102,241,0.4)" />
                                            </div>
                                            <div className="vtr-product-body">
                                                <div className="vtr-product-tags">
                                                    {product.tags.slice(0, 2).map(t => (
                                                        <span key={t} className="vtr-tag-badge">#{t}</span>
                                                    ))}
                                                </div>
                                                <h3>{product.title}</h3>
                                                <p>{product.description.substring(0, 120)}...</p>
                                                <div className="vtr-product-meta">
                                                    {renderStars(product.reviews.combinedAverageRating)}
                                                    <span className="vtr-review-count">({product.reviews.totalReviews.toLocaleString()})</span>
                                                    <span className="vtr-sep" />
                                                    <Clock size={12} />
                                                    <span>{formatDuration(product.duration as any)}</span>
                                                </div>
                                                <div className="vtr-product-footer">
                                                    <div className="vtr-from-price">
                                                        od <strong>{product.pricing.fromPrice.toFixed(2)} {product.pricing.currencyCode}</strong>
                                                    </div>
                                                    <button className="vtr-btn-sm primary"
                                                        onClick={() => handleGetProduct(product.productCode)}>
                                                        <ArrowRight size={14} /> Detalji
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ TAB: PRODUKT DETALJI ══ */}
                {activeTab === 'product' && (
                    <div className="vtr-section">
                        <div className="vtr-section-header">
                            <BookOpen size={22} />
                            <h2>Detalji Produkta</h2>
                        </div>

                        <div className="vtr-search-card">
                            <div className="vtr-search-row">
                                <div className="vtr-form-group" style={{ flex: 1 }}>
                                    <label>Product Code</label>
                                    <input className="vtr-input" value={selectedProductCode || 'VTR-ROME-001'}
                                        onChange={e => setSelectedProductCode(e.target.value)}
                                        placeholder="npr. VTR-ROME-001" />
                                </div>
                                <button className="vtr-btn primary"
                                    onClick={() => handleGetProduct(selectedProductCode || 'VTR-ROME-001')}
                                    disabled={isProductLoading || !isConfigured}>
                                    {isProductLoading ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
                                    Učitaj
                                </button>
                            </div>
                        </div>

                        {isProductLoading && <div className="vtr-loading-box"><RefreshCw size={24} className="spin" /><span>Učitavanje produkta...</span></div>}

                        {productDetail && (
                            <div className="vtr-product-detail">
                                <div className="vtr-detail-hero">
                                    <div className="vtr-detail-hero-img"><Ticket size={60} color="rgba(99,102,241,0.3)" /></div>
                                    <div className="vtr-detail-hero-info">
                                        <div className="vtr-detail-code">{productDetail.productCode}</div>
                                        <h2>{productDetail.title}</h2>
                                        <div className="vtr-detail-meta">
                                            {renderStars(productDetail.reviews.combinedAverageRating)}
                                            <span>{productDetail.reviews.totalReviews.toLocaleString()} recenzija</span>
                                            <span className="vtr-sep" />
                                            <Clock size={13} /> {formatDuration(productDetail.duration)}
                                            <span className="vtr-sep" />
                                            {productDetail.bookingConfirmationSettings?.confirmationType === 'INSTANT' && (
                                                <span className="vtr-instant-badge"><Zap size={12} /> Instant Potvrda</span>
                                            )}
                                        </div>
                                        <div className="vtr-detail-price">
                                            od <strong>{productDetail.pricing.fromPrice.toFixed(2)} {productDetail.pricing.currencyCode}</strong>
                                        </div>
                                        {productDetail.flags?.includes('SKIP_THE_LINE') && (
                                            <span className="vtr-skip-badge"><Zap size={12} /> Skip-the-Line</span>
                                        )}
                                    </div>
                                </div>

                                <p className="vtr-detail-desc">{productDetail.description}</p>

                                {/* Age Bands */}
                                <div className="vtr-detail-section">
                                    <div className="vtr-detail-section-title"
                                        onClick={() => setExpandedSection(expandedSection === 'agebands' ? null : 'agebands')}>
                                        <Users size={16} /> Age Bands & Cenovnik
                                        {expandedSection === 'agebands' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                    {expandedSection === 'agebands' && (
                                        <div className="vtr-detail-section-body">
                                            <div className="vtr-age-bands">
                                                {productDetail.pricingInfo.ageBands.map(b => (
                                                    <div key={b.ageBand} className="vtr-age-band-row">
                                                        <span className="vtr-age-band-chip">{b.ageBand}</span>
                                                        <span>{b.startAge}–{b.endAge} god.</span>
                                                        <span>Min: {b.minTravelersPerBooking} / Max: {b.maxTravelersPerBooking}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Inclusions */}
                                {productDetail.inclusions && (
                                    <div className="vtr-detail-section">
                                        <div className="vtr-detail-section-title"
                                            onClick={() => setExpandedSection(expandedSection === 'incl' ? null : 'incl')}>
                                            <CheckCircle size={16} color="#10b981" /> Uključeno
                                            {expandedSection === 'incl' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                        {expandedSection === 'incl' && (
                                            <div className="vtr-detail-section-body">
                                                {productDetail.inclusions.map((inc, i) => (
                                                    <div key={i} className="vtr-incl-row">
                                                        <CheckCircle size={14} color="#10b981" />
                                                        <span>{inc.typeDescription}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Questions */}
                                {productDetail.bookingQuestions && (
                                    <div className="vtr-detail-section">
                                        <div className="vtr-detail-section-title"
                                            onClick={() => setExpandedSection(expandedSection === 'questions' ? null : 'questions')}>
                                            <MessageSquare size={16} /> Booking Pitanja ({productDetail.bookingQuestions.length})
                                            {expandedSection === 'questions' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                        {expandedSection === 'questions' && (
                                            <div className="vtr-detail-section-body">
                                                {productDetail.bookingQuestions.map(q => (
                                                    <div key={q.id} className="vtr-question-row">
                                                        <span className={`vtr-req-badge ${q.required ? 'required' : 'optional'}`}>{q.required ? 'Obavezno' : 'Opciono'}</span>
                                                        <span>{q.question}</span>
                                                        <span className="vtr-q-type">{q.inputType}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button className="vtr-btn primary"
                                    onClick={() => { setActiveTab('availability'); setAvailCheck(p => ({ ...p, productCode: productDetail.productCode })); }}>
                                    <Calendar size={16} /> Proveri Dostupnost →
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ TAB: DOSTUPNOST ══ */}
                {activeTab === 'availability' && (
                    <div className="vtr-section">
                        <div className="vtr-section-header">
                            <Calendar size={22} />
                            <h2>Availability Check — Dostupnost & Cena</h2>
                        </div>

                        <div className="vtr-search-card">
                            <div className="vtr-search-grid">
                                <div className="vtr-form-group">
                                    <label><Ticket size={14} /> Product Code</label>
                                    <input className="vtr-input" value={availCheck.productCode}
                                        onChange={e => setAvailCheck(p => ({ ...p, productCode: e.target.value }))} />
                                </div>
                                <div className="vtr-form-group">
                                    <label><Calendar size={14} /> Datum Putovanja</label>
                                    <input type="date" className="vtr-input" value={availCheck.travelDate}
                                        onChange={e => setAvailCheck(p => ({ ...p, travelDate: e.target.value }))} />
                                </div>
                                <div className="vtr-form-group">
                                    <label><Clock size={14} /> Vreme Polaska</label>
                                    <input type="time" className="vtr-input" value={availCheck.startTime}
                                        onChange={e => setAvailCheck(p => ({ ...p, startTime: e.target.value }))} />
                                </div>
                                <div className="vtr-form-group">
                                    <label><Users size={14} /> Odrasli (ADULT)</label>
                                    <input type="number" min={1} max={20} className="vtr-input" value={availCheck.adults}
                                        onChange={e => setAvailCheck(p => ({ ...p, adults: +e.target.value }))} />
                                </div>
                                <div className="vtr-form-group">
                                    <label><Users size={14} /> Deca (CHILD)</label>
                                    <input type="number" min={0} max={10} className="vtr-input" value={availCheck.children}
                                        onChange={e => setAvailCheck(p => ({ ...p, children: +e.target.value }))} />
                                </div>
                                <div className="vtr-form-group">
                                    <label>Valuta</label>
                                    <select className="vtr-select" value={availCheck.currency}
                                        onChange={e => setAvailCheck(p => ({ ...p, currency: e.target.value }))}>
                                        {['EUR', 'USD', 'GBP', 'AUD', 'CAD'].map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button className="vtr-btn primary fw" onClick={handleCheckAvail}
                                disabled={isAvailLoading || !isConfigured}>
                                {isAvailLoading ? <RefreshCw size={16} className="spin" /> : <Calendar size={16} />}
                                {isAvailLoading ? 'Proveravam...' : 'Proveri Dostupnost & Cenu'}
                            </button>
                        </div>

                        {availResult && (
                            <div className="vtr-avail-result">
                                <div className="vtr-avail-header">
                                    <CheckCircle size={22} color="#10b981" />
                                    <div>
                                        <h3>Dostupno!</h3>
                                        <p>{availResult.productCode} · {availResult.travelDate} {availResult.startTime && `@ ${availResult.startTime}`}</p>
                                    </div>
                                </div>

                                <div className="vtr-avail-price-grid">
                                    <div className="vtr-price-block">
                                        <label>Preporučena Retail Cena</label>
                                        <span className="vtr-big-price">{availResult.totalPrice.recommendedRetailPrice.toFixed(2)} {availResult.totalPrice.currencyCode}</span>
                                    </div>
                                    <div className="vtr-price-block net">
                                        <label>Partner Net Cena</label>
                                        <span className="vtr-big-price">{availResult.totalPrice.partnerNetPrice.toFixed(2)} {availResult.totalPrice.currencyCode}</span>
                                    </div>
                                    <div className="vtr-price-block fee">
                                        <label>Booking Fee</label>
                                        <span>{availResult.totalPrice.bookingFee.toFixed(2)} {availResult.totalPrice.currencyCode}</span>
                                    </div>
                                </div>

                                <div className="vtr-line-items">
                                    {availResult.lineItems.map((li, i) => (
                                        <div key={i} className="vtr-line-item">
                                            <span className="vtr-age-band-chip">{li.ageBand}</span>
                                            <span>× {li.numberOfTravelers}</span>
                                            <span className="vtr-sep" />
                                            <span>Retail: <strong>{li.subtotalPrice.recommendedRetailPrice.toFixed(2)}</strong></span>
                                            <span>Net: <strong>{li.subtotalPrice.partnerNetPrice.toFixed(2)}</strong></span>
                                        </div>
                                    ))}
                                </div>

                                <div className="vtr-avail-actions">
                                    <button className="vtr-btn secondary" onClick={handleHold} disabled={isBookingLoading}>
                                        {isBookingLoading ? <RefreshCw size={16} className="spin" /> : <Heart size={16} />}
                                        Hold (Rezerviši Mesto)
                                    </button>
                                    <button className="vtr-btn primary" onClick={() => setActiveTab('booking')}
                                        disabled={!availResult}>
                                        <CreditCard size={16} /> Nastavi na Rezervaciju →
                                    </button>
                                </div>

                                {holdResult && (
                                    <div className="vtr-hold-box">
                                        <Shield size={16} color="#f59e0b" />
                                        <div>
                                            <strong>Hold aktivan!</strong>
                                            <p>Cart Ref: <code>{holdResult.cartRef}</code> · Ističe: {new Date(holdResult.expires).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ══ TAB: REZERVACIJA ══ */}
                {activeTab === 'booking' && (
                    <div className="vtr-section">
                        <div className="vtr-section-header">
                            <CreditCard size={22} />
                            <h2>Booking — Kreiranje Rezervacije</h2>
                        </div>

                        {!availResult && (
                            <div className="vtr-info-box amber">
                                <AlertTriangle size={16} />
                                <div>
                                    <strong>Nije proverena dostupnost</strong>
                                    <p>Idite na tab "Dostupnost" i proverite dostupnost proizvoda pre rezervacije.</p>
                                </div>
                            </div>
                        )}

                        {availResult && (
                            <>
                                <div className="vtr-booking-summary">
                                    <h3><Ticket size={16} /> Rezervacija za:</h3>
                                    <div className="vtr-booking-summary-grid">
                                        <div><label>Produkt</label><span>{availResult.productCode}</span></div>
                                        <div><label>Datum</label><span>{availResult.travelDate}</span></div>
                                        <div><label>Vreme</label><span>{availResult.startTime ?? 'Fleksibilno'}</span></div>
                                        <div><label>Ukupno (Net)</label><span className="green">{availResult.totalPrice.partnerNetPrice.toFixed(2)} {availResult.totalPrice.currencyCode}</span></div>
                                    </div>
                                </div>

                                <div className="vtr-search-card">
                                    <h3><Users size={16} /> Podaci o Putnicima</h3>
                                    <div className="vtr-search-grid">
                                        <div className="vtr-form-group">
                                            <label>Ime</label>
                                            <input className="vtr-input" value={bookerInfo.firstName}
                                                onChange={e => setBookerInfo(p => ({ ...p, firstName: e.target.value }))} />
                                        </div>
                                        <div className="vtr-form-group">
                                            <label>Prezime</label>
                                            <input className="vtr-input" value={bookerInfo.lastName}
                                                onChange={e => setBookerInfo(p => ({ ...p, lastName: e.target.value }))} />
                                        </div>
                                        <div className="vtr-form-group">
                                            <label>Email</label>
                                            <input className="vtr-input" type="email" value={bookerInfo.email}
                                                onChange={e => setBookerInfo(p => ({ ...p, email: e.target.value }))} />
                                        </div>
                                    </div>
                                    <button className="vtr-btn primary fw" onClick={handleConfirmBooking} disabled={isBookingLoading}>
                                        {isBookingLoading ? <RefreshCw size={16} className="spin" /> : <CreditCard size={16} />}
                                        {isBookingLoading ? 'Kreiram rezervaciju...' : 'Potvrdi Rezervaciju (Bookings/Book)'}
                                    </button>
                                </div>
                            </>
                        )}

                        {bookingResult?.bookings?.[0] && (
                            <div className="vtr-confirmed">
                                <div className="vtr-confirmed-header">
                                    <CheckCircle size={36} color="#10b981" />
                                    <div>
                                        <h2>Rezervacija Potvrđena!</h2>
                                        <p>Status: <strong className="green">{bookingResult.bookings[0].bookingStatus}</strong>
                                            {' '}&nbsp;·&nbsp;{' '}
                                            {bookingResult.bookings[0].confirmationType === 'INSTANT' && <span className="vtr-instant-badge"><Zap size={12} /> Instant</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="vtr-confirmed-grid">
                                    <div><label>Viator Ref</label><span className="vtr-ref">{bookingResult.bookings[0].bookingRef}</span></div>
                                    <div><label>Partner Ref</label><span>{bookingResult.bookings[0].partnerBookingRef}</span></div>
                                    <div><label>Datum</label><span>{bookingResult.bookings[0].travelDate}</span></div>
                                    <div><label>Net Cena</label><span className="green">{bookingResult.bookings[0].totalPrice.partnerNetPrice.toFixed(2)} {bookingResult.bookings[0].totalPrice.currencyCode}</span></div>
                                </div>
                                {bookingResult.bookings[0].voucherInfo && (
                                    <div className="vtr-voucher-box">
                                        <Ticket size={16} color="#6366f1" />
                                        <div>
                                            <strong>Voucher Barcode:</strong> <code>{bookingResult.bookings[0].voucherInfo.barcode}</code>
                                            {bookingResult.bookings[0].voucherInfo.entries?.map(e => (
                                                <div key={e.description}><span>{e.description}:</span> <strong>{e.value}</strong></div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ══ TAB: OTKAZIVANJE ══ */}
                {activeTab === 'cancel' && (
                    <div className="vtr-section">
                        <div className="vtr-section-header">
                            <XCircle size={22} />
                            <h2>Otkazivanje Rezervacije</h2>
                        </div>
                        <div className="vtr-search-card">
                            <div className="vtr-search-grid">
                                <div className="vtr-form-group">
                                    <label>Booking Reference</label>
                                    <input className="vtr-input" value={cancelRef}
                                        onChange={e => setCancelRef(e.target.value)}
                                        placeholder="npr. VTR-1234567890-ABCD" />
                                </div>
                                <div className="vtr-form-group">
                                    <label>Razlog Otkazivanja</label>
                                    <select className="vtr-select" value={selectedReason}
                                        onChange={e => setSelectedReason(e.target.value)}>
                                        <option value="">— Izaberite razlog —</option>
                                        {cancelReasons.map(r => (
                                            <option key={r.cancellationReasonCode} value={r.cancellationReasonCode}>
                                                {r.cancellationReasonText}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button className="vtr-btn danger fw" onClick={handleCancel}
                                disabled={isCancelLoading || !cancelRef || !selectedReason || !isConfigured}>
                                {isCancelLoading ? <RefreshCw size={16} className="spin" /> : <XCircle size={16} />}
                                {isCancelLoading ? 'Otkazujem...' : 'Otkaži Rezervaciju'}
                            </button>
                        </div>

                        {cancelResult && (
                            <div className="vtr-confirmed cancelled">
                                <div className="vtr-confirmed-header">
                                    <XCircle size={32} color="#ef4444" />
                                    <div>
                                        <h2>Rezervacija Otkazana</h2>
                                        <p>Status: <strong className="red">{cancelResult.status}</strong></p>
                                    </div>
                                </div>
                                {cancelResult.refundDetails && (
                                    <div className="vtr-confirmed-grid">
                                        <div><label>Refund Iznos</label><span className="green">{cancelResult.refundDetails.refundAmount.toFixed(2)} {cancelResult.refundDetails.currencyCode}</span></div>
                                        <div><label>Procenat Refunda</label><span>{cancelResult.refundDetails.refundPercentage}%</span></div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViatorTest;
