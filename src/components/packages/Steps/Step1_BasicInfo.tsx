import React, { useState, useEffect } from 'react';
import { ClickToTravelLogo } from '../../icons/ClickToTravelLogo';
import { createPortal } from 'react-dom';
import {
    MapPin, Calendar, Star,
    Search, Plus, X, Minus, ChevronDown, UtensilsCrossed, Users2, ArrowDownWideNarrow,
    Globe, DollarSign, Plane
} from 'lucide-react';
import { ModernCalendar } from '../../../components/ModernCalendar';
import { formatDate } from '../../../utils/dateUtils';

const AIRPORT_OPTIONS = [
    { code: 'BEG', city: 'Beograd', name: 'Nikola Tesla' },
    { code: 'INI', city: 'Niš', name: 'Konstantin Veliki' },
    { code: 'ZAG', city: 'Zagreb', name: 'Franjo Tuđman' },
    { code: 'SJJ', city: 'Sarajevo', name: 'Butmir' },
    { code: 'TGD', city: 'Podgorica', name: 'Golubovci' },
    { code: 'TIV', city: 'Tivat', name: 'Tivat' },
    { code: 'SKP', city: 'Skopje', name: 'International' },
    { code: 'BUD', city: 'Budimpešta', name: 'Ferenc Liszt' },
    { code: 'VIE', city: 'Beč', name: 'Schwechat' },
    { code: 'MUC', city: 'Minhen', name: 'Franz Josef Strauss' },
    { code: 'FRA', city: 'Frankfurt', name: 'Main' },
    { code: 'IST', city: 'Istanbul', name: 'Istanbul' },
];
import '../../../pages/SmartSearchRedesign.css';
import '../../../pages/SmartSearchFerrariFix.css';
import type {
    BasicInfoData,
    DestinationInput
} from '../../../types/packageSearch.types';

interface Step1Props {
    basicInfo: BasicInfoData | null;
    onUpdate: (data: BasicInfoData) => void;
    onNext: () => void;
}

const CATEGORY_OPTIONS = ["Sve kategorije", "5 Zvezdica", "4 Zvezdice", "3 Zvezdice"];
const SERVICE_OPTIONS = ["Sve usluge", "Najam (RO)", "Noćenje/Doručak (BB)", "Polupansion (HB)", "Pun pansion (FB)", "All Inclusive (AI)"];

const NATIONALITY_OPTIONS = [
    { code: 'RS', name: 'Srbija' },
    { code: 'BA', name: 'Bosna i Hercegovina' },
    { code: 'ME', name: 'Crna Gora' },
    { code: 'MK', name: 'Severna Makedonija' },
    { code: 'HR', name: 'Hrvatska' },
    { code: 'BG', name: 'Bugarska' },
    { code: 'RO', name: 'Rumunija' },
    { code: 'HU', name: 'Mađarska' },
    { code: 'GR', name: 'Grčka' },
    { code: 'AL', name: 'Albanija' },
    { code: 'TR', name: 'Turska' },
    { code: 'DE', name: 'Nemačka' },
    { code: 'AT', name: 'Austrija' },
    { code: 'CH', name: 'Švajcarska' },
    { code: 'RU', name: 'Rusija' },
    { code: 'US', name: 'SAD' },
    { code: 'GB', name: 'Velika Britanija' },
    { code: 'IT', name: 'Italija' },
    { code: 'FR', name: 'Francuska' },
    { code: 'ES', name: 'Španija' },
];

interface RoomAllocation {
    adults: number;
    children: number;
    childrenAges: number[];
}

const Step1_BasicInfo: React.FC<Step1Props> = ({ basicInfo, onUpdate, onNext }) => {
    const [activeRoomTab, setActiveRoomTab] = useState(0);
    const [roomAllocations, setRoomAllocations] = useState<RoomAllocation[]>(() => {
        // Try to initialize from basicInfo
        if (basicInfo?.travelers) {
            // If it's a single room, wrap it. In a real app we'd handle arrays.
            return [
                {
                    adults: basicInfo.travelers.adults || 2,
                    children: basicInfo.travelers.children || 0,
                    childrenAges: basicInfo.travelers.childrenAges || []
                },
                { adults: 0, children: 0, childrenAges: [] },
                { adults: 0, children: 0, childrenAges: [] },
                { adults: 0, children: 0, childrenAges: [] },
                { adults: 0, children: 0, childrenAges: [] }
            ];
        }
        return [
            { adults: 2, children: 0, childrenAges: [] },
            { adults: 0, children: 0, childrenAges: [] },
            { adults: 0, children: 0, childrenAges: [] },
            { adults: 0, children: 0, childrenAges: [] },
            { adults: 0, children: 0, childrenAges: [] }
        ];
    });

    const [destinations, setDestinations] = useState<DestinationInput[]>(
        basicInfo?.destinations.map(d => ({
            ...d,
            travelers: d.travelers || { adults: 2, children: 0, childrenAges: [] },
            category: Array.isArray(d.category) ? d.category : [CATEGORY_OPTIONS[0]],
            service: Array.isArray(d.service) ? d.service : [SERVICE_OPTIONS[0]],
            flexibleDays: d.flexibleDays || 0
        })) || [
            {
                id: '1',
                city: '',
                country: '',
                countryCode: '',
                airportCode: '',
                checkIn: '',
                checkOut: '',
                nights: 0,
                travelers: { adults: 2, children: 0, childrenAges: [] },
                category: [CATEGORY_OPTIONS[0]],
                service: [SERVICE_OPTIONS[0]],
                flexibleDays: 0
            }
        ]
    );

    const [budgetFrom, setBudgetFrom] = useState(basicInfo?.budgetFrom?.toString() || '');
    const [budgetTo, setBudgetTo] = useState(basicInfo?.budgetTo?.toString() || '');
    const [nationality, setNationality] = useState(basicInfo?.nationality || 'RS');
    const [showNationalityPicker, setShowNationalityPicker] = useState<number | null>(null);
    const [budgetType, setBudgetType] = useState<'total' | 'person'>(basicInfo?.budgetType || 'person');

    const [originCity, setOriginCity] = useState(basicInfo?.originCity || 'Beograd (BEG)');
    const [originCode, setOriginCode] = useState(basicInfo?.originCode || 'BEG'); // Initially 'BEG'
    const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);

    const [activeDropdown, setActiveDropdown] = useState<{ idx: number, field: 'category' | 'service' } | null>(null);
    const [activeCalendar, setActiveCalendar] = useState<{ index: number } | null>(null);

    useEffect(() => {
        // For simplicity in this Wizard, we take the FIRST NON-EMPTY ROOM as the primary travelers 
        // OR we'd need to update the whole system to support multi-room.
        // For now, let's keep the data structure compatible but update the UI.
        const primaryRoom = roomAllocations[0];

        onUpdate({
            destinations: destinations.map(d => ({ ...d, travelers: primaryRoom })),
            travelers: primaryRoom,
            originCity: originCity.replace(/\s\([^)]+\)/, ''), // Remove code from city name for storage
            originCode: originCode,
            budget: budgetTo ? Number(budgetTo) : basicInfo?.budget,
            budgetFrom: budgetFrom ? Number(budgetFrom) : undefined,
            budgetTo: budgetTo ? Number(budgetTo) : undefined,
            budgetType: budgetType,
            nationality: nationality,
            currency: basicInfo?.currency || 'EUR',
            startDate: destinations[0]?.checkIn || '',
            endDate: destinations[destinations.length - 1]?.checkOut || '',
            totalDays: destinations.reduce((sum, d) => sum + (d.nights || 0), 0)
        });
    }, [destinations, roomAllocations, budgetFrom, budgetTo, budgetType, nationality, originCode, originCity]);

    const addDestination = () => {
        if (destinations.length >= 3) return;
        const lastDest = destinations[destinations.length - 1];
        setDestinations([...destinations, {
            ...lastDest,
            id: String(Date.now()),
            city: '',
            checkIn: lastDest?.checkOut || '',
            checkOut: '',
            nights: 0,
            category: [CATEGORY_OPTIONS[0]],
            service: [SERVICE_OPTIONS[0]],
            flexibleDays: 0
        }]);
    };

    const removeDestination = (idx: number) => {
        if (destinations.length <= 1) return;
        setDestinations(destinations.filter((_, i) => i !== idx));
    };


    const updateDestination = (idx: number, field: keyof DestinationInput, value: any) => {
        const updated = [...destinations];
        updated[idx] = { ...updated[idx], [field]: value };
        setDestinations(updated);
    };

    const toggleDestinationFilter = (idx: number, type: 'category' | 'service', value: string) => {
        const updated = [...destinations];
        const current = updated[idx][type] || [];
        const defaultOption = type === 'category' ? CATEGORY_OPTIONS[0] : SERVICE_OPTIONS[0];

        let newValues;
        if (value === defaultOption) newValues = [defaultOption];
        else {
            const withoutDefault = current.filter(v => v !== defaultOption);
            newValues = current.includes(value) ? withoutDefault.filter(v => v !== value) : [...withoutDefault, value];
            if (newValues.length === 0) newValues = [defaultOption];
        }

        updated[idx] = { ...updated[idx], [type]: newValues };
        setDestinations(updated);
    };

    const handleDateChange = (idx: number, start: string, end: string) => {
        const updated = [...destinations];
        updated[idx].checkIn = start;
        updated[idx].checkOut = end;
        if (start && end) {
            const s = new Date(start);
            const e = new Date(end);
            updated[idx].nights = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
        }
        setDestinations(updated);
        setActiveCalendar(null);
    };

    const getFilterLabel = (selected: string[] | undefined, allLabel: string) => {
        if (!selected || selected.length === 0 || (selected.length === 1 && selected[0] === allLabel)) return allLabel;
        if (selected.length === 1) return selected[0];
        return `${selected.length} odabrano`;
    };

    return (
        <div className="package-builder-step-container" style={{ width: '100%', maxWidth: 'none' }}>
            {/* 0. ORIGIN SELECTION */}
            <div className="search-card-frame animate-fade-in-up" style={{ marginBottom: '2rem', padding: '1.5rem 2.5rem', width: '100%', maxWidth: 'none', background: 'rgba(15, 23, 42, 0.4)' }}>
                <div className="field-label" style={{ marginBottom: '8px' }}><Plane size={14} style={{ transform: 'rotate(-45deg)' }} /> POLAZIŠTE (ODAKLE KREĆETE NA PUTOVANJE?)</div>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Unesite grad polaska (npr. Beograd)"
                        value={originCity}
                        onFocus={() => setShowOriginSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
                        onChange={(e) => {
                            setOriginCity(e.target.value);
                            setShowOriginSuggestions(true);
                            // Basic auto-detect just in case they don't click suggestion
                            const val = e.target.value.toUpperCase();
                            const match = AIRPORT_OPTIONS.find(a => a.city.toUpperCase().startsWith(val) || a.code.startsWith(val));
                            if (match) setOriginCode(match.code);
                            else setOriginCode('');
                        }}
                        className="smart-input-inline"
                        style={{
                            background: 'var(--ss-bg-inner)',
                            border: '1px solid var(--ss-border)',
                            paddingLeft: '3.5rem',
                            height: '42px', // Reduced height as requested
                            color: 'var(--ss-text-primary)'
                        }}
                    />
                    <MapPin size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ss-text-muted)' }} />

                    {/* AIRPORT SUGGESTIONS DROPDOWN */}
                    {showOriginSuggestions && (
                        <div className="start-suggestions-dropdown animate-fade-in-up" style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'var(--ss-bg-card)',
                            border: '1px solid var(--ss-border)',
                            borderRadius: '12px',
                            zIndex: 1000,
                            marginTop: '4px',
                            maxHeight: '250px',
                            overflowY: 'auto',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                        }}>
                            {AIRPORT_OPTIONS.filter(a =>
                                a.city.toLowerCase().includes(originCity.toLowerCase()) ||
                                a.code.toLowerCase().includes(originCity.toLowerCase()) ||
                                a.name.toLowerCase().includes(originCity.toLowerCase())
                            ).map((airport) => (
                                <div
                                    key={airport.code}
                                    onClick={() => {
                                        setOriginCity(`${airport.city} (${airport.code})`);
                                        setOriginCode(airport.code);
                                        setShowOriginSuggestions(false);
                                    }}
                                    style={{
                                        padding: '10px 15px',
                                        borderBottom: '1px solid var(--ss-border)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        color: 'var(--ss-text-primary)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{airport.city}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{airport.name}</div>
                                    </div>
                                    <div style={{
                                        fontWeight: 900,
                                        background: 'rgba(255,255,255,0.1)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem'
                                    }}>{airport.code}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {destinations.map((dest, idx) => (
                <div key={dest.id} className="search-card-frame" style={{
                    marginBottom: '2rem',
                    width: '100%',
                    maxWidth: 'none',
                    zIndex: activeDropdown?.idx === idx ? 100 : (destinations.length - idx),
                    position: 'relative'
                }}>

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {idx + 1}. Destinacija
                        </h3>
                        {destinations.length > 1 && (
                            <button onClick={() => removeDestination(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {/* ROW 1: DESTINATION */}
                    <div className="destination-row" style={{ marginBottom: '20px' }}>
                        <div className="field-label"><MapPin size={14} /> Destinacija ili Smeštaj</div>
                        <div className="destination-input-wrapper">
                            <input
                                type="text"
                                placeholder="Gde putujete? (npr. Bansko, Hotel Perun...)"
                                value={dest.city}
                                onChange={(e) => updateDestination(idx, 'city', e.target.value)}
                                className="smart-input-inline"
                            />
                        </div>
                    </div>

                    {/* ROW 2: PARAMETERS GRID */}
                    <div className="params-grid">
                        {/* Check In */}
                        <div className="col-checkin param-item">
                            <div className="field-label"><Calendar size={14} /> Check-in</div>
                            <div className="input-box" onClick={() => setActiveCalendar({ index: idx })} style={{ cursor: 'pointer' }}>
                                {dest.checkIn ? formatDate(dest.checkIn) : <span style={{ color: 'var(--text-secondary)' }}>mm/dd/yyyy</span>}
                            </div>
                        </div>

                        {/* Check Out */}
                        <div className="col-checkout param-item">
                            <div className="field-label"><Calendar size={14} /> Check-out</div>
                            <div className="input-box" onClick={() => setActiveCalendar({ index: idx })} style={{ cursor: 'pointer' }}>
                                {dest.checkOut ? formatDate(dest.checkOut) : <span style={{ color: 'var(--text-secondary)' }}>mm/dd/yyyy</span>}
                            </div>
                        </div>

                        {/* Nights */}
                        <div className="param-item">
                            <div className="field-label"><Star size={14} /> Noći</div>
                            <div className="input-box" style={{ justifyContent: 'center', background: 'rgba(16, 185, 129, 0.1)', borderColor: '#10B981' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10B981' }}>{dest.nights || 0}</span>
                            </div>
                        </div>

                        {/* Category Selector */}
                        <div className="col-stars param-item" style={{ position: 'relative' }}>
                            <div className="field-label"><Star size={14} /> Kategorija</div>
                            <div className="input-box" onClick={() => setActiveDropdown(activeDropdown?.idx === idx && activeDropdown.field === 'category' ? null : { idx, field: 'category' })} style={{ cursor: 'pointer' }}>
                                <span style={{ fontSize: '0.85rem' }}>
                                    {getFilterLabel(dest.category, CATEGORY_OPTIONS[0])}
                                </span>
                                <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                            </div>
                            {activeDropdown?.idx === idx && activeDropdown.field === 'category' && (
                                <div className="vertical-filters-popover animate-fade-in-up">
                                    <div className="vertical-filter-group">
                                        {CATEGORY_OPTIONS.map(opt => (
                                            <button key={opt} className={`v-filter-btn ${dest.category?.includes(opt) ? 'active' : ''}`} onClick={() => toggleDestinationFilter(idx, 'category', opt)}>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ borderTop: '1px solid var(--border-color)', padding: '10px', marginTop: '10px' }}>
                                        <button className="v-filter-btn active" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActiveDropdown(null)}>Zatvori</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Meal Selector */}
                        <div className="col-meals param-item" style={{ position: 'relative' }}>
                            <div className="field-label"><UtensilsCrossed size={14} /> Usluga</div>
                            <div className="input-box" onClick={() => setActiveDropdown(activeDropdown?.idx === idx && activeDropdown.field === 'service' ? null : { idx, field: 'service' })} style={{ cursor: 'pointer' }}>
                                <span style={{ fontSize: '0.85rem' }}>
                                    {getFilterLabel(dest.service, SERVICE_OPTIONS[0])}
                                </span>
                                <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                            </div>
                            {activeDropdown?.idx === idx && activeDropdown.field === 'service' && (
                                <div className="vertical-filters-popover animate-fade-in-up">
                                    <div className="vertical-filter-group">
                                        {SERVICE_OPTIONS.map(opt => (
                                            <button key={opt} className={`v-filter-btn ${dest.service?.includes(opt) ? 'active' : ''}`} onClick={() => toggleDestinationFilter(idx, 'service', opt)}>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ borderTop: '1px solid var(--border-color)', padding: '10px', marginTop: '10px' }}>
                                        <button className="v-filter-btn active" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActiveDropdown(null)}>Zatvori</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ROW 3: ROOMS & PAX REDESIGN */}
                    <div className="rooms-config-row" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                            {roomAllocations.map((room, rIdx) => (
                                <button
                                    key={rIdx}
                                    className={`room-tab-btn ${activeRoomTab === rIdx ? 'active' : ''} ${room.adults > 0 ? 'is-searching' : 'inactive'}`}
                                    onClick={() => {
                                        if (activeRoomTab === rIdx && rIdx !== 0) {
                                            const newAlloc = [...roomAllocations];
                                            newAlloc[rIdx] = { adults: 0, children: 0, childrenAges: [] };
                                            setRoomAllocations(newAlloc);
                                        } else {
                                            setActiveRoomTab(rIdx);
                                        }
                                    }}
                                >
                                    <div className={`status-dot ${room.adults > 0 ? 'enabled' : ''}`}></div>
                                    Soba {rIdx + 1}
                                    {room.adults > 0 && <span className="tab-pax-hint">{room.adults}+{room.children}</span>}
                                </button>
                            ))}
                        </div>

                        <div className="passenger-row-redesign-v2 animate-fade-in" key={activeRoomTab}>
                            {/* Adults */}
                            <div className="flight-counter-group-v2">
                                <span className="counter-label">Odrasli</span>
                                <div className="counter-controls-v2">
                                    <button
                                        onClick={() => {
                                            const newAlloc = [...roomAllocations];
                                            newAlloc[activeRoomTab].adults = Math.max(1, newAlloc[activeRoomTab].adults - 1);
                                            setRoomAllocations(newAlloc);
                                        }}
                                    >−</button>
                                    <span className="flight-counter-val" style={{ color: 'white' }}>{roomAllocations[activeRoomTab].adults}</span>
                                    <button
                                        onClick={() => {
                                            const newAlloc = [...roomAllocations];
                                            newAlloc[activeRoomTab].adults = Math.min(10, newAlloc[activeRoomTab].adults + 1);
                                            setRoomAllocations(newAlloc);
                                        }}
                                    >+</button>
                                </div>
                            </div>

                            {/* Children */}
                            <div className="flight-counter-group-v2">
                                <span className="counter-label">Deca</span>
                                <div className="counter-controls-v2">
                                    <button
                                        onClick={() => {
                                            const newAlloc = [...roomAllocations];
                                            if (newAlloc[activeRoomTab].children > 0) {
                                                newAlloc[activeRoomTab].children -= 1;
                                                newAlloc[activeRoomTab].childrenAges.pop();
                                                setRoomAllocations(newAlloc);
                                            }
                                        }}
                                    >−</button>
                                    <span className="flight-counter-val" style={{ color: 'white' }}>{roomAllocations[activeRoomTab].children}</span>
                                    <button
                                        onClick={() => {
                                            if (roomAllocations[activeRoomTab].children < 4) {
                                                const newAlloc = [...roomAllocations];
                                                newAlloc[activeRoomTab].children += 1;
                                                newAlloc[activeRoomTab].childrenAges.push(0);
                                                setRoomAllocations(newAlloc);
                                            }
                                        }}
                                    >+</button>
                                </div>
                            </div>

                            {/* Children Ages In Line */}
                            {roomAllocations[activeRoomTab].children > 0 && (
                                <div className="children-ages-row-v2">
                                    {roomAllocations[activeRoomTab].childrenAges.map((age, cIdx) => (
                                        <div key={cIdx} className="age-input-v2">
                                            <input
                                                type="number"
                                                min="0" max="17"
                                                value={age || ''}
                                                placeholder={`Dete ${cIdx + 1}`}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    const newAlloc = [...roomAllocations];
                                                    newAlloc[activeRoomTab].childrenAges[cIdx] = val === '' ? ('' as any) : Math.min(17, Math.max(0, parseInt(val)));
                                                    setRoomAllocations(newAlloc);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Flexibility */}
                            <div className="flight-counter-group-v2" style={{ marginLeft: 'auto' }}>
                                <span className="counter-label" style={{ marginRight: '10px' }}>FLEXIBILNOST</span>
                                <div className="flex-toggle-group" style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '10px' }}>
                                    {[0, 1, 3, 5].map(day => (
                                        <button
                                            key={day}
                                            onClick={() => updateDestination(idx, 'flexibleDays', day)}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                border: 'none',
                                                cursor: 'pointer',
                                                background: (dest.flexibleDays || 0) === day ? '#0E4B5E' : 'transparent',
                                                color: (dest.flexibleDays || 0) === day ? 'white' : 'var(--text-secondary)'
                                            }}
                                        >
                                            {day === 0 ? 'Tačno' : `±${day}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ROW 4: NATIONALITY & BUDGET */}
                    <div style={{ display: 'flex', gap: '20px' }}>
                        {/* Nationality */}
                        <div style={{ flex: 1 }}>
                            <div className="field-label"><Globe size={14} /> Nacionalnost</div>
                            <div className="input-box" onClick={() => setShowNationalityPicker(showNationalityPicker === idx ? null : idx)} style={{ cursor: 'pointer' }}>
                                <span style={{ fontSize: '0.85rem' }}>
                                    {NATIONALITY_OPTIONS.find(n => n.code === nationality)?.name || 'Srbija'}
                                </span>
                                <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                            </div>
                            {showNationalityPicker === idx && (
                                <div className="vertical-filters-popover animate-fade-in-up" style={{ zIndex: 110 }}>
                                    <div className="vertical-filter-group" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                        {NATIONALITY_OPTIONS.map(n => (
                                            <button key={n.code} className={`v-filter-btn ${nationality === n.code ? 'active' : ''}`} onClick={() => { setNationality(n.code); setShowNationalityPicker(null); }}>
                                                {n.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Budget */}
                        <div style={{ flex: 1.5 }}>
                            <div className="field-label" style={{ justifyContent: 'space-between' }}>
                                <span><DollarSign size={14} /> Budžet (opciono)</span>
                                <div className="budget-type-toggle" style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '2px' }}>
                                    <button
                                        onClick={() => setBudgetType('person')}
                                        style={{
                                            background: budgetType === 'person' ? '#10B981' : 'transparent',
                                            color: budgetType === 'person' ? 'white' : '#94a3b8',
                                            border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px',
                                            fontWeight: 700, cursor: 'pointer'
                                        }}
                                    >Po osobi</button>
                                    <button
                                        onClick={() => setBudgetType('total')}
                                        style={{
                                            background: budgetType === 'total' ? '#10B981' : 'transparent',
                                            color: budgetType === 'total' ? 'white' : '#94a3b8',
                                            border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px',
                                            fontWeight: 700, cursor: 'pointer'
                                        }}
                                    >Ukupno</button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={budgetFrom}
                                        onChange={(e) => setBudgetFrom(e.target.value)}
                                        className="budget-input"
                                        style={{
                                            width: '100%',
                                            padding: '0 1rem',
                                            height: '42px',
                                            borderRadius: '12px',
                                            background: 'var(--ss-bg-inner, rgba(255,255,255,0.05))',
                                            border: '1px solid var(--ss-border, rgba(255,255,255,0.1))',
                                            color: 'var(--ss-text-primary, #fff)'
                                        }}
                                    />
                                </div>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={budgetTo}
                                        onChange={(e) => setBudgetTo(e.target.value)}
                                        className="budget-input"
                                        style={{
                                            width: '100%',
                                            padding: '0 1rem',
                                            height: '42px',
                                            borderRadius: '12px',
                                            background: 'var(--ss-bg-inner, rgba(255,255,255,0.05))',
                                            border: '1px solid var(--ss-border, rgba(255,255,255,0.1))',
                                            color: 'var(--ss-text-primary, #fff)'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}


            {/* Add Destination Button */}
            {destinations.length < 3 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                    <button onClick={addDestination} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'var(--ss-accent-glow)', border: '1px solid var(--ss-accent)', borderRadius: '12px', color: 'var(--ss-accent)', fontWeight: 'bold', cursor: 'pointer' }}>
                        <Plus size={16} />
                        Dodaj destinaciju
                    </button>
                </div>
            )}

            {/* Search Button */}
            <button onClick={onNext} style={{ width: '100%', padding: '1.25rem', background: 'var(--ss-gradient)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', fontStyle: 'italic', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClickToTravelLogo height={36} showText={false} />
            </button>

            {activeCalendar !== null && createPortal(
                <ModernCalendar
                    startDate={destinations[activeCalendar.index]?.checkIn || ''}
                    endDate={destinations[activeCalendar.index]?.checkOut || ''}
                    onChange={(start, end) => handleDateChange(activeCalendar.index, start, end)}
                    onClose={() => setActiveCalendar(null)}
                />,
                document.getElementById('portal-root') || document.body
            )}
        </div>
    );
};

export default Step1_BasicInfo;
