import React, { useState } from 'react';
import {
    Search, Star, Zap, HelpCircle, XCircle, LayoutGrid, List as ListIcon,
    AlignLeft, Sparkles, RefreshCw, Filter, ChevronDown, X, ShieldCheck
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
    searchResults
}) => {
    const [expanded, setExpanded] = useState(false);

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

    const hasActiveFilters =
        hotelNameFilter.length > 0 ||
        selectedStars.length > 0 ||
        selectedAvailability.length > 0 ||
        (selectedMealPlans.length > 0 && !selectedMealPlans.includes('all'));

    return (
        <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            background: 'linear-gradient(135deg, rgba(26, 43, 60, 0.97) 0%, rgba(15, 23, 42, 0.97) 100%)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            borderBottom: '1px solid rgba(142, 36, 172, 0.2)',
            borderRadius: '0 0 20px 20px',
            margin: '0 -2rem 1.5rem -2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            overflow: 'hidden',
        }}>
            {/* ── MAIN TOOLBAR ROW ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center', // Centering content
                gap: '40px', // More space between sections
                padding: '10px 24px',
                flexWrap: 'nowrap',
            }}>

                {/* Reset Button */}
                <button
                    onClick={onResetSearch}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 28px', // Increased width
                        background: 'rgba(142,36,172,0.15)',
                        border: '1px solid rgba(142,36,172,0.4)',
                        borderRadius: '24px',
                        color: '#ce93d8',
                        fontSize: '0.8rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        boxShadow: '0 0 15px rgba(142,36,172,0.1)'
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(142,36,172,0.3)';
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(142,36,172,0.15)';
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                    }}
                >
                    <RefreshCw size={14} /> NOVA PRETRAGA
                </button>

                {/* Search Input */}
                <div style={{ position: 'relative', flex: '0 0 260px' }}>
                    <Search size={14} style={{
                        position: 'absolute', left: '12px', top: '50%',
                        transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)',
                        pointerEvents: 'none'
                    }} />
                    <input
                        type="text"
                        placeholder="Pretraži hotele..."
                        value={hotelNameFilter}
                        onChange={(e) => setHotelNameFilter(e.target.value)}
                        style={{
                            width: '100%',
                            paddingLeft: '38px',
                            paddingRight: hotelNameFilter ? '32px' : '12px',
                            height: '38px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '20px',
                            color: 'white',
                            fontSize: '0.82rem',
                            outline: 'none',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box',
                        }}
                        onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(142,36,172,0.5)'; (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.08)'; }}
                        onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.05)'; }}
                    />
                    {hotelNameFilter && (
                        <button onClick={() => setHotelNameFilter('')} style={{
                            position: 'absolute', right: '10px', top: '50%',
                            transform: 'translateY(-50%)', background: 'none',
                            border: 'none', color: 'rgba(255,255,255,0.4)',
                            cursor: 'pointer', padding: '0', lineHeight: 1
                        }}>
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* ── STARS ── */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                    {STAR_OPTIONS.map(opt => {
                        const active = selectedStars.includes(opt.value);
                        return (
                            <button
                                key={opt.value}
                                onClick={() => toggleStarFilter(opt.value)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '3px',
                                    padding: '6px 11px',
                                    background: active ? 'rgba(142,36,172,0.3)' : 'rgba(255,255,255,0.04)',
                                    border: active ? '1px solid rgba(142,36,172,0.6)' : '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '16px',
                                    color: active ? '#ce93d8' : 'rgba(255,255,255,0.5)',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {opt.value !== '0' ? (
                                    <><Star size={9} fill={active ? '#ce93d8' : 'transparent'} /> {opt.label}</>
                                ) : opt.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── AVAILABILITY ── */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {[
                        { value: 'available', label: 'DOSTUPNO', icon: <Zap size={10} />, color: '#4cd964' },
                        { value: 'on_request', label: 'NA UPIT', icon: <HelpCircle size={10} />, color: '#f59e0b' },
                        { value: 'unavailable', label: 'STOP SALE', icon: <XCircle size={10} />, color: '#ef4444' },
                    ].map(item => {
                        const active = selectedAvailability.includes(item.value);
                        return (
                            <button
                                key={item.value}
                                onClick={() => toggleAvailabilityFilter(item.value)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '6px 12px',
                                    background: active ? `${item.color}22` : 'rgba(255,255,255,0.04)',
                                    border: active ? `1px solid ${item.color}66` : '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '16px',
                                    color: active ? item.color : 'rgba(255,255,255,0.5)',
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    letterSpacing: '0.4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                            </button>
                        );
                    })}
                </div>

                {/* ── REFUNDABLE FILTER ── */}
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <button
                        onClick={() => setOnlyRefundable(!onlyRefundable)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '6px 14px',
                            background: onlyRefundable ? 'rgba(76, 217, 100, 0.2)' : 'rgba(255,255,255,0.04)',
                            border: onlyRefundable ? '1px solid rgba(76, 217, 100, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '16px',
                            color: onlyRefundable ? '#4cd964' : 'rgba(255,255,255,0.5)',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <ShieldCheck size={14} /> REFUNDABILNO
                    </button>
                </div>

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Meal Plan toggle */}
                <button
                    onClick={() => setExpanded(v => !v)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px',
                        background: hasActiveFilters && (!selectedMealPlans.includes('all') && selectedMealPlans.length > 0)
                            ? 'rgba(142,36,172,0.2)' : 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                    }}
                >
                    <Filter size={13} />
                    USLUGE
                    <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>

                {/* ── VIEW MODE ── */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '3px',
                    gap: '2px',
                    flexShrink: 0,
                }}>
                    {[
                        { mode: 'notepad' as const, icon: <AlignLeft size={15} />, label: 'Lista' },
                        { mode: 'grid' as const, icon: <LayoutGrid size={15} />, label: 'Mreža' },
                        { mode: 'list' as const, icon: <ListIcon size={15} />, label: 'Red' },
                    ].map(item => (
                        <button
                            key={item.mode}
                            onClick={() => setViewMode(item.mode)}
                            title={item.label}
                            style={{
                                width: '34px', height: '30px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: viewMode === item.mode
                                    ? 'linear-gradient(135deg, #8E24AC, #6A1B9A)'
                                    : 'transparent',
                                border: 'none',
                                borderRadius: '16px',
                                color: viewMode === item.mode ? 'white' : 'rgba(255,255,255,0.4)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: viewMode === item.mode ? '0 2px 10px rgba(142,36,172,0.4)' : 'none',
                            }}
                        >
                            {item.icon}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── MEAL PLANS ROW (collapsible) ── */}
            <div style={{
                maxHeight: expanded ? '60px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center', // Centering 2nd row
                    gap: '10px',
                    padding: '0 24px 12px 24px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: '10px',
                    flexWrap: 'nowrap',
                    overflowX: 'auto',
                }}>
                    <Sparkles size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '8px' }} />
                    {dynamicMealPlans.map(mp => {
                        const active = selectedMealPlans.includes(mp.value) ||
                            (mp.value === 'all' && selectedMealPlans.length === 0);
                        return (
                            <button
                                key={mp.value}
                                onClick={() => toggleMealPlanFilter(mp.value)}
                                style={{
                                    padding: '5px 14px',
                                    background: active ? 'rgba(142,36,172,0.25)' : 'rgba(255,255,255,0.04)',
                                    border: active ? '1px solid rgba(142,36,172,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '16px',
                                    color: active ? '#ce93d8' : 'rgba(255,255,255,0.5)',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                }}
                            >
                                {mp.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
