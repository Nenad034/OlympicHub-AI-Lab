import React, { useState, useEffect } from 'react';
import { ClickToTravelLogo } from '../../icons/ClickToTravelLogo';
import { BudgetTypeToggle } from '../../BudgetTypeToggle';
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
    const [budgetType, setBudgetType] = useState<'person' | 'total'>('person');
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
            budgetType: budgetType,
            nationality: nationality,
            currency: basicInfo?.currency || 'EUR',
            startDate: destinations[0]?.checkIn || '',
            endDate: destinations[destinations.length - 1]?.checkOut || '',
            totalDays: destinations.reduce((sum, d) => sum + (d.nights || 0), 0)
        });
    }, [destinations, roomAllocations, budgetFrom, budgetTo, budgetType, nationality]);

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
                            <div className="input-box nights-box-ss">
                                <span className="nights-count-val">{dest.nights || 0}</span>
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
                                    <span className="flight-counter-val">{roomAllocations[activeRoomTab].adults}</span>
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
                                    <span className="flight-counter-val">{roomAllocations[activeRoomTab].children}</span>
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
                                <div className="flex-toggle-group">
                                    {[0, 1, 3, 5].map(day => (
                                        <button
                                            key={day}
                                            onClick={() => updateDestination(idx, 'flexibleDays', day)}
                                            className={`flex-day-btn ${(dest.flexibleDays || 0) === day ? 'active' : ''}`}
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
                            <div className="field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <DollarSign size={14} /> Budžet (opciono)
                                </div>
                                <BudgetTypeToggle type={budgetType} onChange={setBudgetType} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="number"
                                    placeholder="Min Cena"
                                    value={budgetFrom}
                                    onChange={(e) => setBudgetFrom(e.target.value)}
                                    className="budget-input"
                                    style={{ flex: 1 }}
                                />
                                <input
                                    type="number"
                                    placeholder="Max Cena"
                                    value={budgetTo}
                                    onChange={(e) => setBudgetTo(e.target.value)}
                                    className="budget-input"
                                    style={{ flex: 1 }}
                                />
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
            <button onClick={onNext} style={{ width: '100%', height: '80px', background: 'var(--ss-gradient)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', fontStyle: 'italic', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClickToTravelLogo height={60} iconOnly={true} iconScale={2.2} />
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
