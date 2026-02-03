import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    MapPin, Calendar, Users, Star,
    Search, Plus, X, Minus, ChevronDown, UtensilsCrossed
} from 'lucide-react';
import { ModernCalendar } from '../../../components/ModernCalendar';
import { formatDate } from '../../../utils/dateUtils';
import '../../../pages/SmartSearchRedesign.css';
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

const Step1_BasicInfo: React.FC<Step1Props> = ({ basicInfo, onUpdate, onNext }) => {
    const [destinations, setDestinations] = useState<DestinationInput[]>(
        basicInfo?.destinations.map(d => ({
            ...d,
            travelers: d.travelers || { adults: 2, children: 0, childrenAges: [] },
            category: Array.isArray(d.category) ? d.category : [CATEGORY_OPTIONS[0]],
            service: Array.isArray(d.service) ? d.service : [SERVICE_OPTIONS[0]]
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
                service: [SERVICE_OPTIONS[0]]
            }
        ]
    );

    const [activeDropdown, setActiveDropdown] = useState<{ idx: number, field: 'category' | 'service' } | null>(null);
    const [activeCalendar, setActiveCalendar] = useState<{ index: number } | null>(null);

    useEffect(() => {
        onUpdate({
            destinations,
            travelers: destinations[0]?.travelers || { adults: 2, children: 0, childrenAges: [] },
            budget: basicInfo?.budget,
            currency: basicInfo?.currency || 'EUR',
            startDate: destinations[0]?.checkIn || '',
            endDate: destinations[destinations.length - 1]?.checkOut || '',
            totalDays: destinations.reduce((sum, d) => sum + (d.nights || 0), 0)
        });
    }, [destinations]);

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
            service: [SERVICE_OPTIONS[0]]
        }]);
    };

    const removeDestination = (idx: number) => {
        if (destinations.length <= 1) return;
        setDestinations(destinations.filter((_, i) => i !== idx));
    };

    const updateTravelersPerDest = (idx: number, field: 'adults' | 'children', val: number) => {
        const updated = [...destinations];
        const dest = updated[idx];
        const currentCount = dest.travelers;
        const newVal = Math.max(field === 'adults' ? 1 : 0, val);

        const newTravelers = { ...currentCount, [field]: newVal };
        if (field === 'children') {
            const currentAges = Array.isArray(currentCount.childrenAges) ? currentCount.childrenAges : [];
            newTravelers.childrenAges = newVal > currentCount.children
                ? [...currentAges, ...Array(newVal - currentCount.children).fill(7)]
                : currentAges.slice(0, newVal);
        }
        updated[idx] = { ...dest, travelers: newTravelers };
        setDestinations(updated);
    };

    const updateChildAgePerDest = (destIdx: number, childIdx: number, age: number) => {
        const updated = [...destinations];
        const dest = updated[destIdx];
        const ages = dest.travelers.childrenAges ? [...dest.travelers.childrenAges] : [];
        ages[childIdx] = age;
        updated[destIdx] = { ...dest, travelers: { ...dest.travelers, childrenAges: ages } };
        setDestinations(updated);
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
                    <div className="destination-row">
                        <div className="field-label"><MapPin size={14} /> Destinacija ili Smeštaj</div>
                        <div className="destination-input-wrapper">
                            <input
                                type="text"
                                placeholder="Gde putujete?"
                                value={dest.city}
                                onChange={(e) => updateDestination(idx, 'city', e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    width: '100%',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                    </div>

                    {/* ROW 2: PARAMETERS GRID */}
                    <div className="params-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
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

                        {/* Adults */}
                        <div className="param-item">
                            <div className="field-label"><Users size={14} /> Odrasli</div>
                            <div className="input-box" style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                                <button onClick={() => updateTravelersPerDest(idx, 'adults', dest.travelers.adults - 1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>−</button>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{dest.travelers.adults}</span>
                                <button onClick={() => updateTravelersPerDest(idx, 'adults', dest.travelers.adults + 1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>+</button>
                            </div>
                        </div>

                        {/* Children */}
                        <div className="param-item" style={{ position: 'relative' }}>
                            <div className="field-label"><Users size={14} /> Deca</div>
                            <div className="input-box" style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                                <button onClick={() => updateTravelersPerDest(idx, 'children', dest.travelers.children - 1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>−</button>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{dest.travelers.children}</span>
                                <button onClick={() => updateTravelersPerDest(idx, 'children', dest.travelers.children + 1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>+</button>
                            </div>

                            {/* Child Ages - directly below */}
                            {dest.travelers.children > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    zIndex: 50,
                                    background: 'var(--ss-bg-inner)',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    marginTop: '8px',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.4rem',
                                    border: '1px solid var(--border)',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
                                }}>
                                    {dest.travelers.childrenAges?.map((age, cIdx) => (
                                        <div key={cIdx} style={{ background: 'var(--bg-card)', borderRadius: '6px', padding: '4px 8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '60px', flex: '1' }}>
                                            <label style={{ fontSize: '8px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Dete {cIdx + 1}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="17"
                                                value={age}
                                                onChange={(e) => updateChildAgePerDest(idx, cIdx, parseInt(e.target.value) || 0)}
                                                style={{
                                                    background: 'transparent',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    border: 'none',
                                                    outline: 'none',
                                                    width: '100%',
                                                    padding: '0'
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
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
            <button onClick={onNext} style={{ width: '100%', padding: '1rem', background: 'var(--ss-gradient)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Search size={20} /> POKRENI PRETRAGU PAKETA
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
