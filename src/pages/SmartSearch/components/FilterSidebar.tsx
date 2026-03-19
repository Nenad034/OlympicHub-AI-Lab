import React, { useState } from 'react';
import {
    Search, Star, Zap, HelpCircle, XCircle, LayoutGrid, List as ListIcon,
    AlignLeft, Sparkles, RefreshCw, Filter, ChevronDown, X, ShieldCheck, Clock
} from 'lucide-react';

interface FilterSidebarProps {
    onResetSearch: () => void;
    hotelNameFilter: string;
    setHotelNameFilter: (v: string) => void;
    selectedStars: string[];
    toggleStarFilter: (star: string) => void;
    selectedAvailability: string[];
    toggleAvailabilityFilter: (status: string) => void;
    viewMode: 'grid' | 'list' | 'notepad';
    setViewMode: (mode: 'grid' | 'list' | 'notepad') => void;
    selectedMealPlans: string[];
    toggleMealPlanFilter: (mp: string) => void;
    onlyRefundable: boolean;
    setOnlyRefundable: (v: boolean) => void;
    searchResults?: any[];
    // NEW FOR FLIGHTS
    activeTab?: string;
    selectedAirlines?: string[];
    toggleAirlineFilter?: (a: string) => void;
    maxStops?: number | null;
    setMaxStops?: (v: number | null) => void;
    timeFilters?: {
        outboundDepartureFrom: string;
        outboundDepartureTo: string;
        inboundDepartureFrom: string;
        inboundDepartureTo: string;
    };
    setTimeFilters?: (v: any) => void;
}

const generateShortCode = (code: string, label: string): string => {
    if (code && code.length <= 4 && code.toUpperCase() === code) return code;
    if (!label) return code || '??';

    // Attempt to make abbreviation from label
    const words = label.split(/[\s\-]+/);
    if (words.length > 1) {
        return words.map(w => w[0].toUpperCase()).filter(c => /[A-Z]/.test(c)).join('');
    }
    return label.substring(0, 3).toUpperCase();
};

const getBaseLabel = (input: string): string => {
    if (!input) return '';
    const upperInput = input.toUpperCase().trim();

    // Mapping from various API strings to Serbian labels
    const mapping: Record<string, string> = {
        'RO': 'Najam',
        'ROOM ONLY': 'Najam',
        'NAJAM': 'Najam',

        'BB': 'Noćenje sa doručkom',
        'BED & BREAKFAST': 'Noćenje sa doručkom',
        'BED AND BREAKFAST': 'Noćenje sa doručkom',
        'ND': 'Noćenje sa doručkom',

        'HB': 'Polupansion',
        'HALF BOARD': 'Polupansion',
        'PP': 'Polupansion',

        'FB': 'Pun pansion',
        'FULL BOARD': 'Pun pansion',
        'PUN PANSION': 'Pun pansion',

        'AI': 'All Inclusive',
        'ALL INCLUSIVE': 'All Inclusive',

        'UAI': 'Ultra All Inclusive',
        'ULTRA ALL INCLUSIVE': 'Ultra All Inclusive',
        'ULTRA ALL': 'Ultra All Inclusive',

        'PAI': 'Premium All Inclusive',
        'PREMIUM AI': 'Premium All Inclusive',
        'PREMIUM ALL INCLUSIVE': 'Premium All Inclusive'
    };

    // If it's a known mapping, return it
    if (mapping[upperInput]) return mapping[upperInput];

    // Check if the input contains any of the keys
    for (const key in mapping) {
        if (upperInput.includes(key)) return mapping[key];
    }

    return input; // Fallback to original
};

const getShortCode = (code: string, label: string): string => {
    const upperCode = code.toUpperCase().trim();
    const knownCodes: Record<string, string> = {
        'NOĆENJE SA DORUČKOM': 'ND',
        'POLUPANSION': 'PP',
        'PUN PANSION': 'PUN',
        'NAJAM': 'NAJ',
        'ALL INCLUSIVE': 'AI',
        'ULTRA ALL INCLUSIVE': 'UAI',
        'PREMIUM ALL INCLUSIVE': 'PAI'
    };

    if (knownCodes[label.toUpperCase()]) return knownCodes[label.toUpperCase()];

    // Default logic if not known
    if (upperCode.length <= 3) return upperCode;
    return generateShortCode(code, label);
};

const STAR_OPTIONS = [
    { value: '5', label: '5★' },
    { value: '4', label: '4★' },
    { value: '3', label: '3★' },
    { value: '2', label: '2★' },
    { value: '0', label: 'Bez' },
];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
    onResetSearch,
    hotelNameFilter,
    setHotelNameFilter,
    selectedStars,
    toggleStarFilter,
    selectedAvailability,
    toggleAvailabilityFilter,
    viewMode,
    setViewMode,
    selectedMealPlans,
    toggleMealPlanFilter,
    onlyRefundable,
    setOnlyRefundable,
    searchResults,
    // NEW FOR FLIGHTS
    activeTab = 'Stays',
    selectedAirlines = [],
    toggleAirlineFilter,
    maxStops,
    setMaxStops,
    timeFilters,
    setTimeFilters
}) => {
    const [expanded, setExpanded] = useState(false);

    const isFlightOnly = activeTab === 'Flights' || activeTab === 'letovi';
    const isPackage = activeTab === 'Packages' || activeTab === 'dinamika';
    const showFlightFilters = isFlightOnly || isPackage;

    const uniqueAirlines = React.useMemo(() => {
        if (!searchResults || !showFlightFilters) return [];
        const airlines = new Set<string>();
        searchResults.forEach(r => {
            if (r.type === 'flight' || r.type === 'package') {
                if (r.data?.slices) {
                    r.data.slices.forEach((s: any) => {
                        s.segments.forEach((seg: any) => {
                            if (seg.carrierName) airlines.add(seg.carrierName);
                        });
                    });
                } else if (r.data?.outbound?.segments) {
                    // Alternative data structure
                    r.data.outbound.segments.forEach((s: any) => {
                        if (s.airline_name) airlines.add(s.airline_name);
                    });
                }
            }
        });
        return Array.from(airlines).sort();
    }, [searchResults, showFlightFilters]);

    const dynamicMealPlans = React.useMemo(() => {
        return [
            { value: 'all', label: 'Sve' },
            { value: 'RO', label: 'Samo smeštaj' },
            { value: 'BB', label: 'Doručak' },
            { value: 'HB', label: 'Polupansion' },
            { value: 'FB', label: 'Pun pansion' },
            { value: 'AI', label: 'All Inclusive' },
            { value: 'AIP', label: 'Premium AI' },
            { value: 'UAI', label: 'Ultra AI' },
        ];
    }, []);

    return (
        <div style={{
            position: 'sticky',
            top: '20px',
            zIndex: 100,
            background: 'var(--ssv4-card-bg)',
            backdropFilter: 'blur(30px)',
            border: '1px solid var(--ssv4-card-border)',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: 'var(--ssv4-shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            width: '100%',
            color: 'var(--ssv4-text-main)',
        }}>
            {/* Header & Reset */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Filteri</h3>
                <button
                    onClick={onResetSearch}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '12px',
                        color: '#ef4444',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    <RefreshCw size={12} /> Resetuj
                </button>
            </div>

            {/* Name Search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                    {showFlightFilters ? 'Pretraga ruta' : 'Ime hotela'}
                </label>
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        type="text"
                        placeholder="Upišite ovde..."
                        value={hotelNameFilter}
                        onChange={e => setHotelNameFilter(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 10px 10px 34px',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px', color: 'white', fontSize: '0.8rem', fontWeight: 700, outline: 'none'
                        }}
                    />
                </div>
            </div>

            {/* CONDITIONAL FILTERS */}
            {!showFlightFilters ? (
                <>
                    {/* Stars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Kategorija</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {STAR_OPTIONS.map(opt => {
                                const active = selectedStars.includes(opt.value);
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => toggleStarFilter(opt.value)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px',
                                            background: active ? 'rgba(142,36,172,0.2)' : 'rgba(255,255,255,0.03)',
                                            border: active ? '1px solid var(--ssv4-primary)' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px', color: active ? '#ce93d8' : 'rgba(255,255,255,0.6)',
                                            fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                                        }}
                                    >
                                        {opt.value !== '0' && <Star size={10} fill={active ? '#ce93d8' : 'transparent'} />} {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Meal Plans */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Usluga</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {dynamicMealPlans.map(mp => {
                                const active = selectedMealPlans.includes(mp.value) || (mp.value === 'all' && selectedMealPlans.length === 0);
                                return (
                                    <button
                                        key={mp.value}
                                        onClick={() => toggleMealPlanFilter(mp.value)}
                                        style={{
                                            padding: '6px 12px',
                                            background: active ? 'rgba(76, 217, 100, 0.15)' : 'rgba(255,255,255,0.03)',
                                            border: active ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px', color: active ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
                                            fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                                        }}
                                    >
                                        {mp.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Availability */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Dostupnost</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {[
                                { value: 'available', label: 'DOSTUPNO ODMAH', icon: <Zap size={12} />, color: '#4cd964' },
                                { value: 'on_request', label: 'NA UPIT', icon: <HelpCircle size={12} />, color: '#f59e0b' },
                                { value: 'unavailable', label: 'STOP SALE', icon: <XCircle size={12} />, color: '#ef4444' },
                            ].map(item => {
                                const active = selectedAvailability.includes(item.value);
                                return (
                                    <button
                                        key={item.value}
                                        onClick={() => toggleAvailabilityFilter(item.value)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px',
                                            padding: '8px 12px', width: '100%',
                                            background: active ? `${item.color}15` : 'rgba(255,255,255,0.03)',
                                            border: active ? `1px solid ${item.color}55` : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px', color: active ? item.color : 'rgba(255,255,255,0.6)',
                                            fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                                        }}
                                    >
                                        {item.icon} {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Max Stops */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Presedanja</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {[
                                { value: 0, label: 'Direktan' },
                                { value: 1, label: 'Max 1' },
                                { value: 2, label: 'Max 2' }
                            ].map(opt => {
                                const active = maxStops === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => setMaxStops && setMaxStops(opt.value)}
                                        style={{
                                            flex: 1, padding: '8px',
                                            background: active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                                            border: active ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px', color: active ? '#60a5fa' : 'rgba(255,255,255,0.6)',
                                            fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Airlines */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Avio Kompanije</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {uniqueAirlines.length > 0 ? (
                                uniqueAirlines.map(airline => {
                                    const active = selectedAirlines.includes(airline);
                                    return (
                                        <button
                                            key={airline}
                                            onClick={() => toggleAirlineFilter && toggleAirlineFilter(airline)}
                                            style={{
                                                padding: '6px 12px',
                                                background: active ? 'rgba(142,36,172,0.2)' : 'rgba(255,255,255,0.03)',
                                                border: active ? '1px solid var(--ssv4-primary)' : '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px', color: active ? '#ce93d8' : 'rgba(255,255,255,0.6)',
                                                fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer'
                                            }}
                                        >
                                            {airline}
                                        </button>
                                    );
                                })
                            ) : (
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Učitavanje...</span>
                            )}
                        </div>
                    </div>

                    {/* Flight Times */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Vreme Polaska</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {[
                                { label: 'Jutro (00-12h)', from: '00:00', to: '12:00' },
                                { label: 'Popodne (12-18h)', from: '12:00', to: '18:00' },
                                { label: 'Veče (18-24h)', from: '18:00', to: '24:00' }
                            ].map((t, idx) => {
                                const active = timeFilters?.outboundDepartureFrom === t.from && timeFilters?.outboundDepartureTo === t.to;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setTimeFilters && setTimeFilters({ ...timeFilters, outboundDepartureFrom: t.from, outboundDepartureTo: t.to })}
                                        style={{
                                            padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px',
                                            background: active ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255,255,255,0.03)',
                                            border: active ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px', color: active ? '#fde047' : 'rgba(255,255,255,0.6)',
                                            fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left'
                                        }}
                                    >
                                        <Clock size={12} /> {t.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Extra Options (Refundable) */}
            <div style={{ marginTop: '10px' }}>
                <button
                    onClick={() => setOnlyRefundable(!onlyRefundable)}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        padding: '10px', width: '100%',
                        background: onlyRefundable ? 'rgba(76, 217, 100, 0.15)' : 'rgba(255,255,255,0.03)',
                        border: onlyRefundable ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', color: onlyRefundable ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
                        fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                    }}
                >
                    <ShieldCheck size={14} /> Samo Refundabilno
                </button>
            </div>
        </div>
    );
};
