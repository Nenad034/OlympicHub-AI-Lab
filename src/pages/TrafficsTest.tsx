import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, RefreshCw, Globe, Server, Database, Sparkles, AlertCircle,
    CheckCircle2, Info, Layout, Package, Hotel, Plane, ChevronRight,
    ArrowRight, MapPin, Star, Calendar as CalendarIcon, ExternalLink,
    Building2, Euro, Calendar, Users, Filter, Link2,
    Image, Wifi, Dumbbell, Waves, Utensils, Copy, Eye, Bus
} from 'lucide-react';
import { ModernCalendar } from '../components/ModernCalendar';
import { trafficsApiService } from '../integrations/traffics/api/trafficsApiService';
import type { TrafficsHotelListItem, TrafficsHotelContent } from '../integrations/traffics/types/trafficsTypes';
import { useThemeStore } from '../stores';
import './HotelbedsTest.css';

// ─── Config Defaults ──────────────────────────────────────────────────────────

const DEFAULT_LICENCE = '1234567890123456';
const DEFAULT_IBE_URL = 'https://demo.traffics.de/ibe';

// ─── Inicijalizujemo servis ────────────────────────────────────────────────────

trafficsApiService.configure({
    credentials: {
        licenceNumber: DEFAULT_LICENCE,
        environment: 'sandbox',
    },
    ibeBaseUrl: DEFAULT_IBE_URL,
    defaultLanguage: 'en',
    defaultCurrency: 'EUR',
});

// ─── Komponenta ──────────────────────────────────────────────────────────────

const TrafficsTest: React.FC = () => {
    const { theme } = useThemeStore();
    const isLight = theme === 'light';
    // ─── State ──────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<'search' | 'package' | 'top' | 'content' | 'deeplink'>('search');
    const [isLoading, setIsLoading] = useState(false);
    const [hotels, setHotels] = useState<TrafficsHotelListItem[]>([]);
    const [totalResults, setTotalResults] = useState(0);
    const [selectedHotel, setSelectedHotel] = useState<TrafficsHotelContent | null>(null);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [copiedLink, setCopiedLink] = useState('');

    // ─── Search Form ─────────────────────────────────────────
    const [productType, setProductType] = useState<'pauschal' | 'hotelonly'>('hotelonly');
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [childrenAges, setChildrenAges] = useState<number[]>([]);
    const [nights, setNights] = useState(7);

    // Datumi — podrazumevano: sutra + 7 noći
    const [checkIn, setCheckIn] = useState<string>(() => {
        const d = new Date(); d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    });
    const [checkOut, setCheckOut] = useState<string>(() => {
        const d = new Date(); d.setDate(d.getDate() + 8);
        return d.toISOString().split('T')[0];
    });

    const syncNights = (fromStr: string, toStr: string) => {
        const f = new Date(fromStr), t = new Date(toStr);
        if (!isNaN(f.getTime()) && !isNaN(t.getTime())) {
            setNights(Math.max(1, Math.round((t.getTime() - f.getTime()) / 86400000)));
        }
    };

    const [minCategory, setMinCategory] = useState(0);
    const [mealPlan, setMealPlan] = useState('');
    const [nationality, setNationality] = useState('RS');
    const [sortBy, setSortBy] = useState<'price' | 'category' | 'quality'>('price');
    const [activeCalendar, setActiveCalendar] = useState<'hotel' | 'package' | null>(null);
    const [maxPrice, setMaxPrice] = useState<number | ''>('');
    const [budgetFrom, setBudgetFrom] = useState<number | ''>('');
    const [destination, setDestination] = useState('');
    const [licenceKey, setLicenceKey] = useState(DEFAULT_LICENCE);
    const [departureAirport, setDepartureAirport] = useState('BEG');

    // ─── Deeplink Form ───────────────────────────────────────
    const [deeplinkType, setDeeplinkType] = useState<'pauschalreise' | 'hotel'>('hotel');
    const [deeplinkView, setDeeplinkView] = useState<'regionen' | 'hotels'>('regionen');
    const [deeplinkRegion, setDeeplinkRegion] = useState('133');
    const [deeplinkDest, setDeeplinkDest] = useState('Mallorca');
    const [generatedLink, setGeneratedLink] = useState('');

    // ─── Search ──────────────────────────────────────────────

    const doSearch = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await trafficsApiService.searchHotels({
                productType,
                adults,
                children: childrenAges.length > 0 ? childrenAges.join(',') : undefined,
                fromDate: checkIn.replace(/-/g, ''),
                toDate: checkOut.replace(/-/g, ''),
                duration: nights,
                category: minCategory > 0 ? minCategory : undefined,
                maxPrice: maxPrice !== '' ? maxPrice : undefined,
                sortBy,
                pageSize: 20,
            });
            setHotels(res.hotelList);
            setTotalResults(res.totalResultCount);
        } catch (e) {
            console.error('[TrafficsTest] Greška pri pretrazi:', e);
        } finally {
            setIsLoading(false);
        }
    }, [productType, adults, childrenAges, checkIn, checkOut, nights, minCategory, maxPrice, sortBy]);

    const doPackageSearch = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await trafficsApiService.searchHotels({
                productType: 'pauschal',
                adults,
                children: childrenAges.length > 0 ? childrenAges.join(',') : undefined,
                fromDate: checkIn.replace(/-/g, ''),
                toDate: checkOut.replace(/-/g, ''),
                duration: nights,
                category: minCategory > 0 ? minCategory : undefined,
                maxPrice: maxPrice !== '' ? maxPrice : undefined,
                sortBy,
                departureAirportList: departureAirport,
                pageSize: 20,
            });
            setHotels(res.hotelList);
            setTotalResults(res.totalResultCount);
        } catch (e) {
            console.error('[TrafficsTest] Greška paket pretraga:', e);
        } finally {
            setIsLoading(false);
        }
    }, [adults, childrenAges, checkIn, checkOut, nights, minCategory, maxPrice, sortBy, departureAirport]);

    const doTopHotels = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await trafficsApiService.getTopHotels({
                regionId: '133',
                productType,
                adults,
                duration: nights,
            });
            setHotels(res.hotelList);
            setTotalResults(res.totalResultCount);
        } catch (e) {
            console.error('[TrafficsTest] Greška top hotela:', e);
        } finally {
            setIsLoading(false);
        }
    }, [productType, adults, nights]);

    const loadContent = async (giataId: string) => {
        setIsLoadingContent(true);
        try {
            const content = await trafficsApiService.getHotelContent(giataId);
            setSelectedHotel(content);
        } catch (e) {
            console.error('[TrafficsTest] Greška content:', e);
        } finally {
            setIsLoadingContent(false);
        }
    };

    const generateDeeplink = () => {
        const url = trafficsApiService.generateDeeplink({
            travelType: deeplinkType,
            view: deeplinkView,
            ibeBaseUrl: DEFAULT_IBE_URL,
            regionList: deeplinkRegion,
            destinationName: deeplinkDest,
            adults,
            minCategory: minCategory > 0 ? minCategory : undefined,
            sortBy,
        });
        setGeneratedLink(url);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopiedLink(generatedLink);
        setTimeout(() => setCopiedLink(''), 2000);
    };

    // Initial load
    useEffect(() => {
        doSearch();
    }, []);

    // ─── Render helpers ──────────────────────────────────────

    const renderStars = (n: number) =>
        Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={13} fill={i < n ? '#f59e0b' : 'none'} color={i < n ? '#f59e0b' : '#94a3b8'} />
        ));

    const renderFacilityIcon = (cat: string) => {
        switch (cat) {
            case 'pool': return <Waves size={14} />;
            case 'food': case 'restaurant': return <Utensils size={14} />;
            case 'fitness': return <Dumbbell size={14} />;
            case 'connectivity': return <Wifi size={14} />;
            default: return <CheckCircle2 size={14} />;
        }
    };

    // ─── JSX ─────────────────────────────────────────────────

    return (
        <div className="hb-test-page">
            {/* Header */}
            <div className="hb-header" style={{ background: 'linear-gradient(135deg, #0a2342 0%, #1e5a9c 100%)' }}>
                <div className="hb-header-left">
                    <div className="hb-logo" style={{ background: '#fff' }}>
                        <Globe size={36} color="#1e5a9c" />
                    </div>
                    <div>
                        <h1 style={{ color: '#fff' }}>Traffics IBE Feeds API v3</h1>
                        <p style={{ color: '#93c5fd' }}>
                            Hotel search, top lists, static content &amp; IBE deep links
                        </p>
                    </div>
                </div>
                <div className="hb-header-right">
                    <div className="hb-status-pill configured">
                        <CheckCircle2 size={14} />
                        <span>Sandbox Active</span>
                    </div>
                    <div className="hb-status-pill" style={{ background: 'rgba(255,255,255,0.1)', color: '#93c5fd' }}>
                        <Globe size={14} />
                        <span>docs.traffics.de/feeds/v3</span>
                    </div>
                </div>
            </div>

            <div className="hb-content">
                {/* Licence bar */}
                <div className="hb-section" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        Broj licence:
                    </label>
                    <input
                        className="hb-input"
                        style={{
                            width: 200, fontFamily: 'monospace', fontSize: '0.85rem',
                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                            color: isLight ? '#0f172a' : '#f1f5f9'
                        }}
                        value={licenceKey}
                        maxLength={16}
                        onChange={e => setLicenceKey(e.target.value.replace(/\D/g, ''))}
                        placeholder="16-cifren broj licence"
                    />
                    <span className="hb-api-badge" style={{ background: '#dbeafe', color: '#1e40af' }}>
                        Auth: Query param ?licence=
                    </span>
                    <a
                        href="https://docs.traffics.de/feeds/v3"
                        target="_blank"
                        rel="noreferrer"
                        className="hb-btn"
                        style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <ExternalLink size={13} /> Swagger Docs
                    </a>
                    <a
                        href="https://ibe-dokumentation.traffics.de"
                        target="_blank"
                        rel="noreferrer"
                        className="hb-btn"
                        style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <ExternalLink size={13} /> IBE Docs
                    </a>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {/* Tab: Hotel Only */}
                    <button
                        className={`hb-btn ${activeTab === 'search' ? 'primary' : ''}`}
                        onClick={() => { setActiveTab('search'); setProductType('hotelonly'); doSearch(); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Search size={15} /> 🏨 Hotel Only
                    </button>

                    {/* Tab: Paket — posebno i istaknuto */}
                    <button
                        className={`hb-btn ${activeTab === 'package' ? 'primary' : ''}`}
                        onClick={() => { setActiveTab('package'); setProductType('pauschal'); doPackageSearch(); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            ...(activeTab !== 'package' ? {
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(59,130,246,0.15))',
                                border: '1px solid rgba(99,102,241,0.4)',
                                color: '#818cf8',
                                fontWeight: 600,
                            } : {})
                        }}
                    >
                        <Plane size={15} /> ✈️ Paket Aranžman
                    </button>

                    <button
                        className={`hb-btn ${activeTab === 'top' ? 'primary' : ''}`}
                        onClick={() => { setActiveTab('top'); doTopHotels(); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Star size={15} /> ⭐ Top Hotels
                    </button>
                    <button
                        className={`hb-btn ${activeTab === 'content' ? 'primary' : ''}`}
                        onClick={() => setActiveTab('content')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Image size={15} /> 🏨 Hotel Content
                    </button>
                    <button
                        className={`hb-btn ${activeTab === 'deeplink' ? 'primary' : ''}`}
                        onClick={() => setActiveTab('deeplink')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Link2 size={15} /> 🔗 IBE Deep Links
                    </button>
                </div>

                {/* ─── SEARCH TAB (Hotel Only) ─── */}
                {(activeTab === 'search' || activeTab === 'top') && (
                    <>
                        {/* Search filters */}
                        <div className="hb-section" style={{ marginBottom: '20px' }}>
                            <h2 style={{ marginBottom: '16px' }}>
                                {activeTab === 'search' ? 'Pretraga Hotela (GET /hotels)' : 'Top Hoteli po Regionu (GET /hotels/top)'}
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>📍 Destinacija / Hotel</label>
                                    <input
                                        className="hb-input"
                                        placeholder="npr. Mallorca, Palma..."
                                        value={destination}
                                        onChange={e => setDestination(e.target.value)}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    />
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>🗓️ Check-in</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="hb-input"
                                            readOnly
                                            value={checkIn}
                                            onClick={() => setActiveCalendar('hotel')}
                                            style={{
                                                background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                                color: isLight ? '#0f172a' : '#f1f5f9'
                                            }}
                                        />
                                        <CalendarIcon size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    </div>
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>🗓️ Check-out</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="hb-input"
                                            readOnly
                                            value={checkOut}
                                            onClick={() => setActiveCalendar('hotel')}
                                            style={{
                                                background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                                color: isLight ? '#0f172a' : '#f1f5f9'
                                            }}
                                        />
                                        <CalendarIcon size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    </div>
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>🌙 Noći</label>
                                    <select className="hb-select" value={nights} onChange={e => setNights(+e.target.value)}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    >
                                        {[1, 2, 3, 5, 7, 10, 14, 21].map(n => <option key={n} value={n} style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>{n}</option>)}
                                    </select>
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>👥 Odrasli</label>
                                    <select className="hb-select" value={adults} onChange={e => setAdults(+e.target.value)}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    >
                                        {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n} style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>{n}</option>)}
                                    </select>
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>👶 Deca</label>
                                    <select className="hb-select" value={children} onChange={e => {
                                        const count = +e.target.value;
                                        setChildren(count);
                                        const newAges = [...childrenAges];
                                        if (count > newAges.length) {
                                            for (let i = newAges.length; i < count; i++) newAges.push(7);
                                        } else {
                                            newAges.length = count;
                                        }
                                        setChildrenAges(newAges);
                                    }}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    >
                                        {[0, 1, 2, 3, 4].map(n => <option key={n} value={n} style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>{n}</option>)}
                                    </select>
                                </div>
                                {childrenAges.map((age, idx) => (
                                    <div key={idx} className="hb-form-group" style={{ marginBottom: 0 }}>
                                        <label>Uzrast deteta {idx + 1}</label>
                                        <select
                                            className="hb-select"
                                            value={age}
                                            onChange={e => {
                                                const newAges = [...childrenAges];
                                                newAges[idx] = +e.target.value;
                                                setChildrenAges(newAges);
                                            }}
                                            style={{
                                                background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                                color: isLight ? '#0f172a' : '#f1f5f9'
                                            }}
                                        >
                                            {Array.from({ length: 18 }).map((_, i) => <option key={i} value={i} style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>{i}</option>)}
                                        </select>
                                    </div>
                                ))}
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>🍴 Usluga</label>
                                    <select className="hb-select" value={mealPlan} onChange={e => setMealPlan(e.target.value)}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    >
                                        <option value="" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Sve usluge</option>
                                        <option value="RO" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Samo smeštaj (RO)</option>
                                        <option value="BB" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Doručak (BB)</option>
                                        <option value="HB" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Polupansion (HB)</option>
                                        <option value="FB" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Pun pansion (FB)</option>
                                        <option value="AI" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>All Inclusive (AI)</option>
                                        <option value="UAI" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Ultra All Inclusive (UAI)</option>
                                    </select>
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>🇷🇸 Nacionalnost</label>
                                    <select className="hb-select" value={nationality} onChange={e => setNationality(e.target.value)}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    >
                                        <option value="RS" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Srbija</option>
                                        <option value="DE" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Nemačka</option>
                                        <option value="AT" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Austrija</option>
                                        <option value="CH" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Švajcarska</option>
                                    </select>
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>⭐ Min. kategorija</label>
                                    <select className="hb-select" value={minCategory} onChange={e => setMinCategory(+e.target.value)}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    >
                                        <option value={0} style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Sve</option>
                                        {[3, 4, 5].map(n => <option key={n} value={n} style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>{n}★</option>)}
                                    </select>
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>💰 Budžet od (€)</label>
                                    <input
                                        className="hb-input"
                                        type="number"
                                        placeholder="Min"
                                        value={budgetFrom}
                                        onChange={e => setBudgetFrom(e.target.value ? +e.target.value : '')}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    />
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>💰 Budžet do (€)</label>
                                    <input
                                        className="hb-input"
                                        type="number"
                                        placeholder="Max"
                                        value={maxPrice}
                                        onChange={e => setMaxPrice(e.target.value ? +e.target.value : '')}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    />
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>⇅ Sortiranje</label>
                                    <select className="hb-select" value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    >
                                        <option value="price" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Cena ↑</option>
                                        <option value="category" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Kategorija ↓</option>
                                        <option value="quality" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Kvalitet</option>
                                    </select>
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>Tip proizvoda</label>
                                    <select className="hb-select" value={productType} onChange={e => setProductType(e.target.value as any)}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    >
                                        <option value="hotelonly" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Hotel Only</option>
                                        <option value="pauschal" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Package (Flight+Hotel)</option>
                                    </select>
                                </div>
                                <button
                                    className="hb-btn primary"
                                    onClick={activeTab === 'search' ? doSearch : doTopHotels}
                                    disabled={isLoading}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px', gridColumn: 'span 1' }}
                                >
                                    {isLoading ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
                                    {isLoading ? 'Učitava...' : 'Pretraži'}
                                </button>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="hb-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2>Rezultati</h2>
                                {totalResults > 0 && (
                                    <span className="hb-api-badge" style={{ background: '#dcfce7', color: '#166534' }}>
                                        {totalResults} hotela pronađeno
                                    </span>
                                )}
                            </div>

                            {isLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                    <RefreshCw size={32} className="spin" style={{ marginBottom: 12 }} />
                                    <p>Pretražujem Traffics Feeds API...</p>
                                    <p style={{ fontSize: '0.8rem', marginTop: 4, fontStyle: 'italic', opacity: 0.7 }}>
                                        GET /hotels?productType={productType}&fromDate={checkIn.replace(/-/g, '')}&toDate={checkOut.replace(/-/g, '')}
                                        &adults={adults}{children > 0 ? `&children=${childrenAges.join(',')}` : ''}
                                        {destination ? `&destination=${destination}` : ''}
                                        {mealPlan ? `&boardType=${mealPlan}` : ''}
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                                    {hotels.map(hotel => (
                                        <div key={hotel.code} className="hb-hotel-card" style={{ padding: 0, overflow: 'hidden' }}>
                                            {/* Image placeholder */}
                                            <div style={{
                                                height: '140px',
                                                background: 'linear-gradient(135deg, #0a2342 0%, #1e5a9c 80%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                <Globe size={48} color="rgba(255,255,255,0.15)" />
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 12,
                                                    left: 12,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '2px'
                                                }}>
                                                    {renderStars(hotel.category)}
                                                </div>
                                                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                                                    <span className="hb-api-badge" style={{
                                                        background: hotel.bookable ? '#dcfce7' : '#fee2e2',
                                                        color: hotel.bookable ? '#166534' : '#991b1b'
                                                    }}>
                                                        {hotel.bookable ? 'Dostupno' : 'Nije dostupno'}
                                                    </span>
                                                </div>
                                                {hotel.giata && (
                                                    <div style={{ position: 'absolute', bottom: 8, left: 12 }}>
                                                        <span className="hb-api-badge" style={{ background: 'rgba(0,0,0,0.5)', color: '#93c5fd', fontSize: '0.75rem' }}>
                                                            GIATA: {hotel.giata.id}
                                                        </span>
                                                    </div>
                                                )}
                                                <div style={{ position: 'absolute', bottom: 8, right: 12 }}>
                                                    <span className="hb-api-badge" style={{ background: 'rgba(0,0,0,0.5)', color: '#e2e8f0', fontSize: '0.75rem' }}>
                                                        {hotel.code}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div style={{ padding: '16px' }}>
                                                <h3 style={{ marginBottom: '4px', fontSize: '1.05rem' }}>{hotel.name}</h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
                                                    <MapPin size={13} />
                                                    {hotel.location?.city}, {hotel.location?.country}
                                                    {hotel.region && (
                                                        <span className="hb-api-badge" style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '0.72rem' }}>
                                                            {hotel.region.name}
                                                        </span>
                                                    )}
                                                </div>
                                                {hotel.description && (
                                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                                                        {hotel.description}
                                                    </p>
                                                )}

                                                {/* Price & dates */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                                                    <div>
                                                        {hotel.bestPricePerPerson && (
                                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                                                <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#3b82f6' }}>
                                                                    {hotel.bestPricePerPerson.toFixed(0)}€
                                                                </span>
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/osobi</span>
                                                            </div>
                                                        )}
                                                        {hotel.totalPrice && (
                                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                                Ukupno: <strong>{hotel.totalPrice.toFixed(0)}€</strong>
                                                            </div>
                                                        )}
                                                        {hotel.boardType && (
                                                            <span className="hb-api-badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', marginTop: '4px', display: 'inline-block' }}>
                                                                {hotel.boardType.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {hotel.nights && <div><Calendar size={11} style={{ display: 'inline' }} /> {hotel.nights} noći</div>}
                                                        {hotel.airportList?.[0] && (
                                                            <div style={{ marginTop: '2px' }}>✈ {hotel.airportList[0].code}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* ─── PAKET INFO: let + transfer ─── */}
                                                {hotel.bestPriceFlight && hotel.offerType === 'pauschal' && (
                                                    <div style={{
                                                        marginBottom: '12px',
                                                        padding: '10px 12px',
                                                        background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.08))',
                                                        borderRadius: '10px',
                                                        border: '1px solid rgba(99,102,241,0.2)',
                                                        fontSize: '0.82rem',
                                                    }}>
                                                        {/* Let info */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                            <Plane size={14} color="#818cf8" />
                                                            <strong style={{ color: '#818cf8' }}>✈ Let uključen</strong>
                                                            <span className="hb-api-badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: '0.72rem' }}>
                                                                +{hotel.flightSurchargePerPerson}€/osobi
                                                            </span>
                                                        </div>
                                                        {hotel.bestPriceFlight.segments.map((seg, si) => (
                                                            <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '3px' }}>
                                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: '28px' }}>{seg.airlineCode}</span>
                                                                <span>{seg.departureAirport}</span>
                                                                <span>→</span>
                                                                <span>{seg.arrivalAirport}</span>
                                                                <span style={{ marginLeft: 'auto' }}>{Math.floor((seg.durationMinutes ?? 0) / 60)}h{(seg.durationMinutes ?? 0) % 60}m</span>
                                                                {seg.isDirect && (
                                                                    <span className="hb-api-badge" style={{ background: '#dcfce7', color: '#166534', fontSize: '0.68rem', padding: '1px 5px' }}>Direktno</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {/* Transfer info */}
                                                        {hotel.transferList && hotel.transferList.length > 0 && (
                                                            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <Bus size={13} color="#94a3b8" />
                                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                                                                    Transfer: {hotel.transferList[0].name} — +{hotel.transferList[0].pricePerPerson}€/osobi
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Buttons */}
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {hotel.giata && (
                                                        <button
                                                            className="hb-btn"
                                                            style={{ flex: 1, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                                            onClick={() => {
                                                                setActiveTab('content');
                                                                loadContent(hotel.giata!.id);
                                                            }}
                                                        >
                                                            <Eye size={14} /> Sadržaj
                                                        </button>
                                                    )}
                                                    <button
                                                        className="hb-btn primary"
                                                        style={{ flex: 1, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                                        onClick={() => {
                                                            const url = trafficsApiService.generateDeeplink({
                                                                travelType: 'hotel',
                                                                view: 'hotels',
                                                                ibeBaseUrl: DEFAULT_IBE_URL,
                                                                regionList: hotel.region?.id,
                                                                destinationName: hotel.location?.city,
                                                                adults,
                                                            });
                                                            window.open(url, '_blank');
                                                        }}
                                                    >
                                                        <ExternalLink size={14} /> IBE Link
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ─── PACKAGE TAB — Paket Aranžman (avion + hotel + transfer) ─── */}
                {activeTab === 'package' && (
                    <>
                        {/* Paket info baner */}
                        <div style={{
                            marginBottom: '20px',
                            padding: '16px 20px',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.12) 100%)',
                            borderRadius: '14px',
                            border: '1px solid rgba(99,102,241,0.3)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '14px',
                        }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                                background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Plane size={22} color="#fff" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#818cf8', marginBottom: '4px' }}>
                                    ✈️ Paket Aranžman — productType=pauschal
                                </div>
                                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                                    Traffics Feeds API vraća <strong>kompletne pakete</strong>: let (odlazak + povratak) + hotel + opcioni transfer.
                                    Svaka ponuda sadrži <code style={{ background: 'rgba(0,0,0,0.15)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.78rem' }}>bestPriceFlight</code> sa segmentima leta
                                    i <code style={{ background: 'rgba(0,0,0,0.15)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.78rem' }}>transferList</code> sa opcijama transfera.
                                    Letovi polaze iz izabranog aerodroma (IATA kod).
                                </div>
                                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {['✈️ Let uključen', '🏨 Hotel', '🚌 Transfer opcioni', '🏷️ All Inclusive dostupno'].map(item => (
                                        <span key={item} className="hb-api-badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: '0.78rem' }}>
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Paket filteri */}
                        <div className="hb-section" style={{ marginBottom: '20px' }}>
                            <h2 style={{ marginBottom: '16px' }}>Pretraga Paketa (GET /hotels?productType=pauschal)</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>✈️ Aerodrom polaska</label>
                                    <select className="hb-select" value={departureAirport} onChange={e => setDepartureAirport(e.target.value)}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    >
                                        <option value="BEG" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>BEG — Beograd</option>
                                        <option value="NIS" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>NIS — Niš</option>
                                        <option value="BUD" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>BUD — Budimpešta</option>
                                        <option value="VIE" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>VIE — Beč</option>
                                        <option value="MUC" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>MUC — Minhen</option>
                                        <option value="FRA" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>FRA — Frankfurt</option>
                                        <option value="ZAG" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>ZAG — Zagreb</option>
                                        <option value="SKP" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>SKP — Skoplje</option>
                                    </select>
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>📍 Destinacija</label>
                                    <input
                                        className="hb-input"
                                        placeholder="npr. Mallorca, Antalya..."
                                        value={destination}
                                        onChange={e => setDestination(e.target.value)}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    />
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>🗓️ Check-in</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="hb-input"
                                            readOnly
                                            value={checkIn}
                                            onClick={() => setActiveCalendar('package')}
                                            style={{
                                                background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                                color: isLight ? '#0f172a' : '#f1f5f9'
                                            }}
                                        />
                                        <CalendarIcon size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    </div>
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>🗓️ Check-out</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="hb-input"
                                            readOnly
                                            value={checkOut}
                                            onClick={() => setActiveCalendar('package')}
                                            style={{
                                                background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                                color: isLight ? '#0f172a' : '#f1f5f9'
                                            }}
                                        />
                                        <CalendarIcon size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    </div>
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>🌙 Noći</label>
                                    <select className="hb-select" value={nights} onChange={e => setNights(+e.target.value)}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    >
                                        {[3, 5, 7, 10, 14, 21].map(n => <option key={n} value={n} style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>{n}</option>)}
                                    </select>
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>👥 Odrasli</label>
                                    <select className="hb-select" value={adults} onChange={e => setAdults(+e.target.value)}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    >
                                        {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n} style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>{n}</option>)}
                                    </select>
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>👶 Deca</label>
                                    <select className="hb-select" value={children} onChange={e => {
                                        const count = +e.target.value;
                                        setChildren(count);
                                        const newAges = [...childrenAges];
                                        if (count > newAges.length) {
                                            for (let i = newAges.length; i < count; i++) newAges.push(7);
                                        } else {
                                            newAges.length = count;
                                        }
                                        setChildrenAges(newAges);
                                    }}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    >
                                        {[0, 1, 2, 3, 4].map(n => <option key={n} value={n} style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>{n}</option>)}
                                    </select>
                                </div>
                                {childrenAges.map((age, idx) => (
                                    <div key={idx} className="hb-form-group" style={{ marginBottom: 0 }}>
                                        <label>Uzrast deteta {idx + 1}</label>
                                        <select
                                            className="hb-select"
                                            value={age}
                                            onChange={e => {
                                                const newAges = [...childrenAges];
                                                newAges[idx] = +e.target.value;
                                                setChildrenAges(newAges);
                                            }}
                                            style={{
                                                background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                                color: isLight ? '#0f172a' : '#f1f5f9'
                                            }}
                                        >
                                            {Array.from({ length: 18 }).map((_, i) => <option key={i} value={i} style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>{i}</option>)}
                                        </select>
                                    </div>
                                ))}
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>🍴 Usluga</label>
                                    <select className="hb-select" value={mealPlan} onChange={e => setMealPlan(e.target.value)}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    >
                                        <option value="" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Sve usluge</option>
                                        <option value="RO" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Samo smeštaj (RO)</option>
                                        <option value="BB" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Doručak (BB)</option>
                                        <option value="HB" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Polupansion (HB)</option>
                                        <option value="FB" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Pun pansion (FB)</option>
                                        <option value="AI" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>All Inclusive (AI)</option>
                                        <option value="UAI" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Ultra All Inclusive (UAI)</option>
                                    </select>
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>Min. zvezdice</label>
                                    <select className="hb-select" value={minCategory} onChange={e => setMinCategory(+e.target.value)}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    >
                                        <option value={0} style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Sve</option>
                                        {[3, 4, 5].map(n => <option key={n} value={n} style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>{n}★</option>)}
                                    </select>
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>💰 Max cena (€/os.)</label>
                                    <input
                                        className="hb-input"
                                        type="number"
                                        placeholder="Npr. 1200"
                                        value={maxPrice}
                                        onChange={e => setMaxPrice(e.target.value ? +e.target.value : '')}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    />
                                </div>
                                <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                    <label>⇅ Sortiranje</label>
                                    <select className="hb-select" value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                                        style={{
                                            background: isLight ? '#fff' : 'rgba(0,0,0,0.2)',
                                            color: isLight ? '#0f172a' : '#f1f5f9'
                                        }}
                                    >
                                        <option value="price" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Cena ↑</option>
                                        <option value="category" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>Kategorija ↓</option>
                                    </select>
                                </div>
                                <button
                                    className="hb-btn primary"
                                    onClick={doPackageSearch}
                                    disabled={isLoading}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px', gridColumn: 'span 1' }}
                                >
                                    {isLoading ? <RefreshCw size={16} className="spin" /> : <Plane size={16} />}
                                    {isLoading ? 'Pretražujem...' : 'Pretraži Pakete'}
                                </button>
                            </div>
                        </div>

                        {/* Paket rezultati */}
                        <div className="hb-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2>Paket Ponude</h2>
                                {totalResults > 0 && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span className="hb-api-badge" style={{ background: '#dcfce7', color: '#166534' }}>
                                            {totalResults} paketa pronađeno
                                        </span>
                                        <span className="hb-api-badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                                            Polazak: {departureAirport}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {isLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                    <RefreshCw size={32} className="spin" style={{ marginBottom: 12 }} />
                                    <p>Pretražujem pakete iz <strong>{departureAirport}</strong>...</p>
                                    <p style={{ fontSize: '0.8rem', marginTop: 4, fontStyle: 'italic', opacity: 0.7 }}>
                                        GET /hotels?productType=pauschal&departureAirportList={departureAirport}&fromDate={checkIn.replace(/-/g, '')}&toDate={checkOut.replace(/-/g, '')}
                                        &adults={adults}{children > 0 ? `&children=${childrenAges.join(',')}` : ''}
                                    </p>
                                </div>
                            ) : hotels.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                    <Plane size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                                    <p>Kliknite "Pretraži Pakete" da biste videli dostupne pakete</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: '16px' }}>
                                    {hotels.map(hotel => (
                                        <div key={hotel.code} style={{
                                            background: 'var(--card)',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(99,102,241,0.2)',
                                            overflow: 'hidden',
                                            boxShadow: '0 4px 20px rgba(99,102,241,0.08)',
                                        }}>
                                            {/* Card header — gradijent */}
                                            <div style={{
                                                height: '120px',
                                                background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 60%, #1e2d6b 100%)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                position: 'relative', overflow: 'hidden',
                                            }}>
                                                <Plane size={40} color="rgba(255,255,255,0.08)" />
                                                <div style={{ position: 'absolute', top: 10, left: 12, display: 'flex', gap: '2px' }}>
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} size={13} fill={i < hotel.category ? '#f59e0b' : 'none'} color={i < hotel.category ? '#f59e0b' : '#94a3b8'} />
                                                    ))}
                                                </div>
                                                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                    <span className="hb-api-badge" style={{ background: 'rgba(99,102,241,0.7)', color: '#fff', fontSize: '0.72rem' }}>
                                                        ✈️ PAKET
                                                    </span>
                                                    {hotel.tourOperator && (
                                                        <span style={{
                                                            background: hotel.tourOperator.brandColor ?? '#333',
                                                            color: '#fff',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 700,
                                                            padding: '2px 8px',
                                                            borderRadius: '6px',
                                                            letterSpacing: '0.3px',
                                                            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                                                        }}>
                                                            {hotel.tourOperator.name}
                                                        </span>
                                                    )}
                                                </div>
                                                {hotel.boardType && (
                                                    <div style={{ position: 'absolute', bottom: 10, left: 12 }}>
                                                        <span className="hb-api-badge" style={{ background: 'rgba(16,185,129,0.8)', color: '#fff', fontSize: '0.72rem' }}>
                                                            {hotel.boardType.name}
                                                        </span>
                                                    </div>
                                                )}
                                                <div style={{ position: 'absolute', bottom: 10, right: 12 }}>
                                                    <span style={{ fontSize: '0.75rem', color: '#93c5fd' }}>
                                                        {hotel.region?.name || hotel.location?.country}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ padding: '16px' }}>
                                                {/* Hotel name + location */}
                                                <h3 style={{ marginBottom: '4px', fontSize: '1rem', fontWeight: 700 }}>{hotel.name}</h3>
                                                {/* Tour operator */}
                                                {hotel.tourOperator && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                        <div style={{
                                                            width: 10, height: 10, borderRadius: '50%',
                                                            background: hotel.tourOperator.brandColor ?? '#6366f1',
                                                            flexShrink: 0,
                                                        }} />
                                                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                            {hotel.tourOperator.name}
                                                        </span>
                                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
                                                            [{hotel.tourOperator.code}]
                                                        </span>
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '12px' }}>
                                                    <MapPin size={12} />
                                                    {hotel.location?.city}, {hotel.location?.country}
                                                </div>

                                                {/* Let box */}
                                                {hotel.bestPriceFlight && (
                                                    <div style={{
                                                        marginBottom: '12px',
                                                        padding: '12px',
                                                        background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(59,130,246,0.08))',
                                                        borderRadius: '10px',
                                                        border: '1px solid rgba(99,102,241,0.25)',
                                                    }}>
                                                        <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            ✈️ Let uključen
                                                        </div>
                                                        {hotel.bestPriceFlight.segments.map((seg, si) => (
                                                            <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: si < hotel.bestPriceFlight!.segments.length - 1 ? '6px' : 0 }}>
                                                                <span style={{
                                                                    background: 'rgba(99,102,241,0.2)', color: '#818cf8',
                                                                    padding: '2px 7px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700,
                                                                }}>{seg.airlineCode}</span>
                                                                <span style={{ fontWeight: 600 }}>{seg.departureAirport}</span>
                                                                <Plane size={13} color="#818cf8" />
                                                                <span style={{ fontWeight: 600 }}>{seg.arrivalAirport}</span>
                                                                <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                                                                    {Math.floor((seg.durationMinutes ?? 0) / 60)}h {(seg.durationMinutes ?? 0) % 60}m
                                                                </span>
                                                                {seg.isDirect && (
                                                                    <span className="hb-api-badge" style={{ background: '#dcfce7', color: '#166534', fontSize: '0.7rem', padding: '1px 6px' }}>
                                                                        Direktno
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Transfer box */}
                                                {hotel.transferList && hotel.transferList.length > 0 && (
                                                    <div style={{
                                                        marginBottom: '12px',
                                                        padding: '10px 12px',
                                                        background: 'rgba(148,163,184,0.08)',
                                                        borderRadius: '10px',
                                                        border: '1px solid rgba(148,163,184,0.15)',
                                                        display: 'flex', alignItems: 'flex-start', gap: '8px',
                                                    }}>
                                                        <Bus size={15} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
                                                        <div style={{ fontSize: '0.8rem' }}>
                                                            <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2px' }}>Transfer dostupan</div>
                                                            {hotel.transferList.map((tr, ti) => (
                                                                <div key={ti} style={{ color: 'var(--text-secondary)', fontSize: '0.76rem', marginTop: '2px' }}>
                                                                    {tr.name} — <strong>+{tr.pricePerPerson}€/os.</strong>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Cena */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                                            Paket cena (let + hotel)
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                                            <span style={{ fontSize: '1.7rem', fontWeight: 800, color: '#6366f1' }}>
                                                                {hotel.bestPricePerPerson?.toFixed(0)}€
                                                            </span>
                                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>/osobi</span>
                                                        </div>
                                                        {hotel.flightSurchargePerPerson && (
                                                            <div style={{ fontSize: '0.75rem', color: '#818cf8' }}>
                                                                od čega let: +{hotel.flightSurchargePerPerson}€/os.
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        <div><Calendar size={11} style={{ display: 'inline' }} /> {hotel.nights} noći</div>
                                                        <div style={{ marginTop: '2px' }}>
                                                            Ukupno: <strong style={{ color: 'var(--text-primary)' }}>{hotel.packageTotalPrice?.toFixed(0)}€</strong>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* IBE dugme */}
                                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="hb-btn primary"
                                                        style={{ flex: 1, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}
                                                        onClick={() => {
                                                            const url = trafficsApiService.generateDeeplink({
                                                                travelType: 'pauschalreise',
                                                                view: 'hotels',
                                                                ibeBaseUrl: DEFAULT_IBE_URL,
                                                                regionList: hotel.region?.id,
                                                                destinationName: hotel.location?.city,
                                                                adults,
                                                                searchDate: `010626,080626,${hotel.nights}`,
                                                                departureAirport,
                                                            });
                                                            window.open(url, '_blank');
                                                        }}
                                                    >
                                                        <ExternalLink size={14} /> Otvori u IBE
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ─── CONTENT TAB ─── */}
                {activeTab === 'content' && (
                    <div className="hb-section">
                        <h2 style={{ marginBottom: '16px' }}>Hotel Statički Sadržaj (GET /hotels/{'{giataId}'})</h2>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <input
                                className="hb-input"
                                placeholder="GIATA ID (npr. 12344)"
                                defaultValue="12344"
                                id="giata-input"
                                style={{ width: 200 }}
                            />
                            <button
                                className="hb-btn primary"
                                onClick={() => {
                                    const id = (document.getElementById('giata-input') as HTMLInputElement).value;
                                    if (id) loadContent(id);
                                }}
                                disabled={isLoadingContent}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                {isLoadingContent ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
                                Učitaj Sadržaj
                            </button>
                        </div>

                        {isLoadingContent && (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                <RefreshCw size={32} className="spin" style={{ marginBottom: 12 }} />
                                <p>Dohvatam statički sadržaj hotela...</p>
                            </div>
                        )}

                        {selectedHotel && !isLoadingContent && (
                            <div>
                                {/* Hotel header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{selectedHotel.name}</h3>
                                        <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                                            {renderStars(selectedHotel.category)}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            <MapPin size={14} />
                                            {selectedHotel.location?.address}, {selectedHotel.location?.city}, {selectedHotel.location?.country}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className="hb-api-badge" style={{ background: '#dbeafe', color: '#1e40af', display: 'block', marginBottom: '4px' }}>
                                            GIATA: {selectedHotel.giataId}
                                        </span>
                                        {selectedHotel.chainName && (
                                            <span className="hb-api-badge" style={{ background: '#ede9fe', color: '#6d28d9' }}>
                                                {selectedHotel.chainName}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Images grid */}
                                {selectedHotel.images && selectedHotel.images.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '20px' }}>
                                        {selectedHotel.images.map((img, i) => (
                                            <div key={i} style={{
                                                height: i === 0 ? '180px' : '85px',
                                                gridColumn: i === 0 ? 'span 2' : 'span 1',
                                                background: 'linear-gradient(135deg, #0a2342, #1e5a9c)',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                <Globe size={24} color="rgba(255,255,255,0.2)" />
                                                <span style={{
                                                    position: 'absolute',
                                                    bottom: '6px',
                                                    left: '8px',
                                                    fontSize: '0.7rem',
                                                    background: 'rgba(0,0,0,0.6)',
                                                    color: '#e2e8f0',
                                                    borderRadius: '4px',
                                                    padding: '2px 6px'
                                                }}>{img.category || img.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Description */}
                                {selectedHotel.descriptionLong && (
                                    <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <h4 style={{ marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Opis</h4>
                                        <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>{selectedHotel.descriptionLong}</p>
                                    </div>
                                )}

                                {/* Facilities */}
                                {selectedHotel.facilities && selectedHotel.facilities.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            Sadržaj ({selectedHotel.facilities.length} amenities)
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {selectedHotel.facilities.map(f => (
                                                <span key={f.id} className="hb-api-badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', padding: '4px 10px' }}>
                                                    {renderFacilityIcon(f.category || '')} {f.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Rooms & Meta */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {selectedHotel.rooms && selectedHotel.rooms.length > 0 && (
                                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                            <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                Sobe ({selectedHotel.rooms.length})
                                            </h4>
                                            {selectedHotel.rooms.map(room => (
                                                <div key={room.code} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{room.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{room.description}</div>
                                                    {room.maxOccupancy && (
                                                        <div style={{ fontSize: '0.75rem', color: '#93c5fd', marginTop: '2px' }}>
                                                            <Users size={11} style={{ display: 'inline' }} /> Max {room.maxOccupancy} osoba
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            Informacije
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Check-in:</span>
                                                <strong>{selectedHotel.checkIn}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Check-out:</span>
                                                <strong>{selectedHotel.checkOut}</strong>
                                            </div>
                                            {selectedHotel.coordinates && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--text-secondary)' }}>Koordinate:</span>
                                                    <strong style={{ fontSize: '0.78rem' }}>{selectedHotel.coordinates.lat}, {selectedHotel.coordinates.lng}</strong>
                                                </div>
                                            )}
                                            {selectedHotel.phone && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--text-secondary)' }}>Telefon:</span>
                                                    <strong>{selectedHotel.phone}</strong>
                                                </div>
                                            )}
                                            {selectedHotel.chainName && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--text-secondary)' }}>Lanac:</span>
                                                    <strong>{selectedHotel.chainName}</strong>
                                                </div>
                                            )}
                                            {selectedHotel.websiteUrl && (
                                                <a href={selectedHotel.websiteUrl} target="_blank" rel="noreferrer"
                                                    className="hb-btn" style={{ marginTop: '4px', textAlign: 'center', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                                                    <ExternalLink size={12} /> Zvanični web
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!selectedHotel && !isLoadingContent && (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                <Building2 size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                                <p>Unesite GIATA ID i kliknite "Učitaj Sadržaj"</p>
                                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Primer: 12344, 12567, 15890</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── DEEP LINKS TAB ─── */}
                {activeTab === 'deeplink' && (
                    <div className="hb-section">
                        <h2 style={{ marginBottom: '16px' }}>IBE Deep Link Generator</h2>
                        <div style={{ padding: '12px', background: 'rgba(59,130,246,0.08)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '20px', fontSize: '0.85rem' }}>
                            <Info size={14} style={{ display: 'inline', marginRight: '6px', color: '#60a5fa' }} />
                            Evolution IBE 3.0 je SPA i radi sa GET parametrima. Deep linkovi omogućavaju direktno otvaranje pretrage sa predefinisanim filterima.
                            <br />
                            Dokumentacija: <a href="https://ibe-dokumentation.traffics.de" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>ibe-dokumentation.traffics.de</a>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', alignItems: 'flex-end' }}>
                            <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                <label>Tip putovanja</label>
                                <select className="hb-select" value={deeplinkType} onChange={e => setDeeplinkType(e.target.value as any)}>
                                    <option value="hotel">Hotel</option>
                                    <option value="pauschalreise">Pauschal</option>
                                    <option value="flug">Flug</option>
                                    <option value="oneway">Oneway</option>
                                </select>
                            </div>
                            <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                <label>View</label>
                                <select className="hb-select" value={deeplinkView} onChange={e => setDeeplinkView(e.target.value as any)}>
                                    <option value="regionen">Regioni</option>
                                    <option value="hotels">Hoteli</option>
                                </select>
                            </div>
                            <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                <label>Region ID</label>
                                <input className="hb-input" value={deeplinkRegion} onChange={e => setDeeplinkRegion(e.target.value)} style={{ width: 90 }} placeholder="133" />
                            </div>
                            <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                <label>Destinacija</label>
                                <input className="hb-input" value={deeplinkDest} onChange={e => setDeeplinkDest(e.target.value)} style={{ width: 130 }} placeholder="Mallorca" />
                            </div>
                            <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                <label>Odrasli</label>
                                <select className="hb-select" value={adults} onChange={e => setAdults(+e.target.value)}>
                                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                <label>Min. ★</label>
                                <select className="hb-select" value={minCategory} onChange={e => setMinCategory(+e.target.value)}>
                                    <option value={0}>Sve</option>
                                    {[3, 4, 5].map(n => <option key={n} value={n}>{n}★</option>)}
                                </select>
                            </div>
                            <button className="hb-btn primary" onClick={generateDeeplink} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}>
                                <Link2 size={15} /> Generiši Link
                            </button>
                        </div>

                        {/* Primeri */}
                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Primeri iz dokumentacije:</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    {
                                        label: 'Pauschal — Lista regiona',
                                        url: '/pauschalreise/regionen?minCategory=3&sortBy=quality&searchDate=010626,080626,7&adults=2'
                                    },
                                    {
                                        label: 'Hotel only — Lista hotela (Mallorca)',
                                        url: '/hotel/hotels?regionList=133&destinationName=Mallorca&minCategory=3&searchDate=010626,080626,7&adults=2&sortBy=price'
                                    },
                                    {
                                        label: 'Flug — Lista regiona',
                                        url: '/flug/regionen?minCategory=3&sortBy=quality&searchDate=010626,080626,7&adults=2'
                                    },
                                ].map((ex, i) => (
                                    <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px', color: '#93c5fd' }}>{ex.label}</div>
                                        <code style={{ fontSize: '0.78rem', color: '#e2e8f0', wordBreak: 'break-all' }}>{ex.url}</code>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Generated link */}
                        {generatedLink && (
                            <div style={{ padding: '16px', background: 'rgba(16,185,129,0.08)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)' }}>
                                <h4 style={{ marginBottom: '10px', color: '#10b981' }}>
                                    <CheckCircle2 size={15} style={{ display: 'inline', marginRight: '6px' }} />
                                    Generisan Deep Link
                                </h4>
                                <code style={{ display: 'block', fontSize: '0.82rem', wordBreak: 'break-all', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', color: '#e2e8f0', marginBottom: '12px' }}>
                                    {generatedLink}
                                </code>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="hb-btn" onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                                        {copiedLink === generatedLink ? <CheckCircle2 size={14} color="#10b981" /> : <Copy size={14} />}
                                        {copiedLink === generatedLink ? 'Kopirano!' : 'Kopiraj'}
                                    </button>
                                    <a href={generatedLink} target="_blank" rel="noreferrer" className="hb-btn primary"
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', textDecoration: 'none' }}>
                                        <ExternalLink size={14} /> Otvori IBE
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {activeCalendar && (
                <ModernCalendar
                    startDate={checkIn}
                    endDate={checkOut}
                    onChange={(s, e) => {
                        if (s) setCheckIn(s);
                        if (e) {
                            setCheckOut(e);
                            syncNights(s, e);
                            setActiveCalendar(null);
                        }
                    }}
                    onClose={() => setActiveCalendar(null)}
                />
            )}
        </div>
    );
};

export default TrafficsTest;
