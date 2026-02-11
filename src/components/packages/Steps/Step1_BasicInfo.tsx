import React, { useState, useEffect } from 'react';
import { ClickToTravelLogo } from '../../icons/ClickToTravelLogo';
import { createPortal } from 'react-dom';
import {
    MapPin, Calendar, Users, Star,
    Search, Plus, X, Minus, ChevronDown, UtensilsCrossed, Users2, ArrowDownWideNarrow,
    Globe, DollarSign
} from 'lucide-react';
import { ModernCalendar } from '../../../components/ModernCalendar';
import { formatDate } from '../../../utils/dateUtils';
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
            budget: budgetTo ? Number(budgetTo) : basicInfo?.budget,
            budgetFrom: budgetFrom ? Number(budgetFrom) : undefined,
            budgetTo: budgetTo ? Number(budgetTo) : undefined,
            nationality: nationality,
            currency: basicInfo?.currency || 'EUR',
            startDate: destinations[0]?.checkIn || '',
            endDate: destinations[destinations.length - 1]?.checkOut || '',
            totalDays: destinations.reduce((sum, d) => sum + (d.nights || 0), 0)
        });
    }, [destinations, roomAllocations, budgetFrom, budgetTo, nationality]);

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
                        <div className="destination-input-wrapper" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 15px' }}>
                            <input
                                type="text"
                                placeholder="Gde putujete? (npr. Bansko, Hotel Perun...)"
                                value={dest.city}
                                onChange={(e) => updateDestination(idx, 'city', e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    width: '100%',
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: '500'
                                }}
                            />
                        </div>
                    </div>

                    {/* ROW 2: PARAMETERS GRID */}
                    <div className="params-grid" style={{ gridTemplateColumns: 'repeat(9, 1fr)' }}>
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
                            <div className="input-box" style={{ justifyContent: 'center', background: 'var(--ss-accent-glow)' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--ss-accent)' }}>{dest.nights || 0}</span>
                            </div>
                        </div>

                        {/* Room Selection Tabs & Pax Configuration (Integrated from Smart Search) */}
                        <div className="col-rooms-tabs" style={{ gridColumn: 'span 3', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                                {roomAllocations.map((room, rIdx) => (
                                    <button
                                        key={rIdx}
                                        className={`room-tab-btn ${activeRoomTab === rIdx ? 'active' : ''} ${room.adults > 0 ? 'is-searching' : 'inactive'}`}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer',
                                            background: activeRoomTab === rIdx ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                            color: activeRoomTab === rIdx ? 'white' : 'var(--text-secondary)',
                                            border: 'none',
                                            minWidth: '80px'
                                        }}
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
                                        <div style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: room.adults > 0 ? '#10b981' : 'transparent',
                                            boxShadow: room.adults > 0 ? '0 0 10px #10b981' : 'none'
                                        }}></div>
                                        Soba {rIdx + 1}
                                        {room.adults > 0 && <span style={{ opacity: 0.7, fontSize: '9px', marginLeft: 'auto' }}>{room.adults}+{room.children}</span>}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }} key={activeRoomTab}>
                                {/* Adults */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div className="field-label-mini" style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}><Users size={12} style={{ marginBottom: '-2px' }} /> ODRASLI</div>
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                        <button
                                            style={{ padding: '8px 12px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}
                                            onClick={() => {
                                                const newAlloc = [...roomAllocations];
                                                newAlloc[activeRoomTab].adults = Math.max(1, newAlloc[activeRoomTab].adults - 1);
                                                setRoomAllocations(newAlloc);
                                            }}
                                        >−</button>
                                        <span style={{ padding: '0 15px', minWidth: '40px', textAlign: 'center', fontWeight: 700 }}>{roomAllocations[activeRoomTab].adults}</span>
                                        <button
                                            style={{ padding: '8px 12px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}
                                            onClick={() => {
                                                const newAlloc = [...roomAllocations];
                                                newAlloc[activeRoomTab].adults = Math.min(10, newAlloc[activeRoomTab].adults + 1);
                                                setRoomAllocations(newAlloc);
                                            }}
                                        >+</button>
                                    </div>
                                </div>

                                {/* Children */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div className="field-label-mini" style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}><Users2 size={12} style={{ marginBottom: '-2px' }} /> DECA</div>
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                        <button
                                            style={{ padding: '8px 12px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}
                                            onClick={() => {
                                                const newAlloc = [...roomAllocations];
                                                if (newAlloc[activeRoomTab].children > 0) {
                                                    newAlloc[activeRoomTab].children -= 1;
                                                    newAlloc[activeRoomTab].childrenAges.pop();
                                                    setRoomAllocations(newAlloc);
                                                }
                                            }}
                                        >−</button>
                                        <span style={{ padding: '0 15px', minWidth: '40px', textAlign: 'center', fontWeight: 700 }}>{roomAllocations[activeRoomTab].children}</span>
                                        <button
                                            style={{ padding: '8px 12px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}
                                            onClick={() => {
                                                if (roomAllocations[activeRoomTab].children < 4) {
                                                    const newAlloc = [...roomAllocations];
                                                    newAlloc[activeRoomTab].children += 1;
                                                    newAlloc[activeRoomTab].childrenAges.push(7);
                                                    setRoomAllocations(newAlloc);
                                                }
                                            }}
                                        >+</button>
                                    </div>
                                </div>

                                {/* Children Ages */}
                                {roomAllocations[activeRoomTab].children > 0 && (
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {roomAllocations[activeRoomTab].childrenAges.map((age, cIdx) => (
                                            <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontSize: '8px', fontWeight: 800, color: 'var(--text-secondary)' }}>DETE {cIdx + 1}</span>
                                                <input
                                                    type="number"
                                                    min="0" max="17"
                                                    value={age}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        const newAlloc = [...roomAllocations];
                                                        newAlloc[activeRoomTab].childrenAges[cIdx] = Math.min(17, Math.max(0, val));
                                                        setRoomAllocations(newAlloc);
                                                    }}
                                                    style={{ width: '45px', padding: '6px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', fontSize: '11px', textAlign: 'center', outline: 'none' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Flexibility (Integrated from Smart Search) */}
                        <div className="col-flex param-item">
                            <div className="field-label" style={{ fontStyle: 'italic', color: 'white' }}><ArrowDownWideNarrow size={14} /> FLEKSIBILNOST</div>
                            <div style={{
                                width: '100%',
                                display: 'flex',
                                background: 'rgba(15, 23, 42, 0.4)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '10px',
                                padding: '4px',
                                gap: '4px'
                            }}>
                                {[0, 1, 3, 5].map(day => (
                                    <button
                                        key={day}
                                        onClick={() => updateDestination(idx, 'flexibleDays', day)}
                                        style={{
                                            flex: 1,
                                            padding: '8px 4px',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            background: (dest.flexibleDays || 0) === day ? 'var(--accent)' : 'transparent',
                                            color: (dest.flexibleDays || 0) === day ? 'white' : 'var(--text-secondary)',
                                            boxShadow: (dest.flexibleDays || 0) === day ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                                        }}
                                    >
                                        {day === 0 ? 'Tačno' : `±${day}`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Selector */}
                        <div className="col-stars param-item" style={{ position: 'relative' }}>
                            <div className="field-label"><Star size={14} /> Odaberi Kategoriju</div>
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
                                    <div style={{ borderTop: '1px solid var(--border)', padding: '10px', marginTop: '10px' }}>
                                        <button className="v-filter-btn active" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActiveDropdown(null)}>Zatvori</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Meal Selector */}
                        <div className="col-meals param-item" style={{ position: 'relative' }}>
                            <div className="field-label"><UtensilsCrossed size={14} /> Odaberi Uslugu</div>
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
                                    <div style={{ borderTop: '1px solid var(--border)', padding: '10px', marginTop: '10px' }}>
                                        <button className="v-filter-btn active" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActiveDropdown(null)}>Zatvori</button>
                                    </div>
                                </div>
                            )}

                            {/* Nationality & Budget Group - POSITIONED BELOW MEAL SELECTOR */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                                {/* Nationality Selector */}
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <div className="field-label" style={{ marginBottom: '8px' }}><Globe size={14} /> NACIONALNOST</div>
                                    <div className="input-box" onClick={() => setShowNationalityPicker(showNationalityPicker === idx ? null : idx)} style={{ cursor: 'pointer' }}>
                                        <span style={{ fontSize: '0.85rem' }}>
                                            {NATIONALITY_OPTIONS.find(n => n.code === nationality)?.name || 'Odaberi državu'}
                                        </span>
                                        <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                    </div>
                                    {showNationalityPicker === idx && (
                                        <div className="vertical-filters-popover animate-fade-in-up" style={{ top: '100%', left: 0, minWidth: '220px' }}>
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

                                {/* Budget Filter */}
                                <div style={{ width: '100%' }}>
                                    <div className="field-label" style={{ marginBottom: '8px' }}><DollarSign size={14} /> BUDŽET</div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="number"
                                            placeholder="Od"
                                            value={budgetFrom}
                                            onChange={(e) => setBudgetFrom(e.target.value)}
                                            className="budget-input"
                                            style={{
                                                flex: 1,
                                                borderRadius: '12px',
                                                padding: '12px',
                                                fontSize: '0.85rem',
                                                outline: 'none',
                                                width: '100%'
                                            }}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Do"
                                            value={budgetTo}
                                            onChange={(e) => setBudgetTo(e.target.value)}
                                            className="budget-input"
                                            style={{
                                                flex: 1,
                                                borderRadius: '12px',
                                                padding: '12px',
                                                fontSize: '0.85rem',
                                                outline: 'none',
                                                width: '100%'
                                            }}
                                        />
                                    </div>
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
                <ClickToTravelLogo height={36} showText={true} />
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
