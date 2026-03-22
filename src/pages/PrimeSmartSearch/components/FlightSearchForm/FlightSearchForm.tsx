import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchStore } from '../../stores/useSearchStore';
import { SearchModeSelector } from '../SearchModeSelector';
import { AIAssistantField } from '../AIAssistantField';
import { FlightPaxWizard } from './FlightPaxWizard';
import { ExpediaCalendar } from '../../../../components/ExpediaCalendar';
import AirportAutocomplete from '../../../../components/flight/AirportAutocomplete';
import { Plane, Calendar, MapPin, ArrowLeftRight, ChevronDown, SlidersHorizontal, Clock, Search, Route, Send, Briefcase, Building2, Check, Plus, Trash2 } from 'lucide-react';

const CABIN_CLASSES = [
    { value: 'economy', label: 'Ekonomska' },
    { value: 'premium', label: 'Premium' },
    { value: 'business', label: 'Biznis' },
    { value: 'first', label: 'Prva' },
];

const AIRLINES = [
    { id: 'all', name: 'Sve kompanije' },
    { id: 'ju', name: 'Air Serbia' },
    { id: 'lh', name: 'Lufthansa' },
    { id: 'tk', name: 'Turkish Airlines' },
    { id: 'ek', name: 'Emirates' },
    { id: 'qr', name: 'Qatar Airways' },
    { id: 'fr', name: 'Ryanair' },
    { id: 'w6', name: 'Wizz Air' },
    { id: 'af', name: 'Air France' },
    { id: 'os', name: 'Austrian' },
];

interface FlightLeg {
    id: number;
    origin: { code: string; city: string };
    destination: { code: string; city: string };
    date: string;
    pax: { adults: number; children: number; infants: number; childAges: number[] };
    cabinClass: string;
}

export const FlightSearchForm: React.FC = () => {
    const { searchMode, setIsSearching, setSearchPerformed, addAlert } = useSearchStore();

    // Core States
    const [tripType, setTripType] = useState<'roundtrip' | 'oneway' | 'multicity'>('roundtrip');
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    // Single Leg States (POV/JED)
    const [origin, setOrigin] = useState({ code: 'BEG', city: 'Beograd' });
    const [destination, setDestination] = useState({ code: '', city: '' });
    const [departDate, setDepartDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [flexibleDays, setFlexibleDays] = useState(0);
    const [showCalendar, setShowCalendar] = useState(false);
    const [cabinClass, setCabinClass] = useState('economy');
    const [pax, setPax] = useState({ adults: 1, children: 0, infants: 0, childAges: [] as number[] });

    // Multi-city Legs
    const [legs, setLegs] = useState<FlightLeg[]>([
        { id: 1, origin: { code: 'BEG', city: 'Beograd' }, destination: { code: '', city: '' }, date: '', cabinClass: 'economy', pax: { adults: 1, children: 0, infants: 0, childAges: [] } },
        { id: 2, origin: { code: '', city: '' }, destination: { code: '', city: '' }, date: '', cabinClass: 'economy', pax: { adults: 1, children: 0, infants: 0, childAges: [] } }
    ]);
    const [activeCalendarLeg, setActiveCalendarLeg] = useState<number | null>(null);

    // Filter states
    const [maxStops, setMaxStops] = useState('any');
    const [outboundTime, setOutboundTime] = useState('any');
    const [airline, setAirline] = useState('all');

    // UI Refs for Class selection
    const [showClassDropdown, setShowClassDropdown] = useState(false);
    const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
    const [activeClassLegId, setActiveClassLegId] = useState<number | null>(null);

    const handleSearch = () => {
        setIsSearching(true);
        setTimeout(() => {
            setIsSearching(false);
            setSearchPerformed(true);
        }, 1200);
    };

    const addLeg = () => {
        if (legs.length >= 6) return;
        const last = legs[legs.length - 1];
        setLegs([...legs, { 
            id: Date.now(), origin: { ...last.destination }, destination: { code: '', city: '' }, date: '', pax: { ...last.pax }, cabinClass: last.cabinClass
        }]);
    };

    const removeLeg = (id: number) => {
        if (legs.length <= 2) return;
        setLegs(legs.filter(l => l.id !== id));
    };

    const updateLeg = (id: number, field: keyof FlightLeg, value: any) => {
        setLegs(legs.map(l => l.id === id ? { ...l, [field]: value } : l));
        if (field === 'destination') {
            const idx = legs.findIndex(l => l.id === id);
            if (idx >= 0 && idx < legs.length - 1) {
                const newLegs = [...legs];
                newLegs[idx] = { ...newLegs[idx], destination: value };
                newLegs[idx+1] = { ...newLegs[idx+1], origin: value };
                setLegs(newLegs);
            }
        }
    };

    const openClassDropdown = (e: React.MouseEvent, legId: number | null) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPanelPos({ top: rect.bottom + 8, left: rect.left });
        setActiveClassLegId(legId);
        setShowClassDropdown(true);
    };

    useEffect(() => {
        const h = () => setShowClassDropdown(false);
        window.addEventListener('mousedown', h);
        return () => window.removeEventListener('mousedown', h);
    }, []);

    const selectedClassLabelSingle = CABIN_CLASSES.find(c => c.value === cabinClass)?.label || 'Ekonomska';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="v6-flight-form-container">
            {/* TOP BAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ 
                    display: 'flex', gap: '6px', background: 'var(--v6-bg-section)', padding: '4px', borderRadius: '15px', 
                    border: '2px solid #1e293b', height: '48px', minWidth: '220px', boxSizing: 'border-box' 
                }}>
                    <button onClick={() => setTripType('roundtrip')} className={`v6-trip-btn ${tripType === 'roundtrip' ? 'active' : ''}`}><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Plane size={16} className="plane-e" /><Plane size={16} className="plane-w" /></div></button>
                    <button onClick={() => setTripType('oneway')} className={`v6-trip-btn ${tripType === 'oneway' ? 'active' : ''}`}><Plane size={18} className="plane-e" /></button>
                    <button onClick={() => setTripType('multicity')} className={`v6-trip-btn ${tripType === 'multicity' ? 'active' : ''}`}><Route size={18} /></button>
                </div>
                <SearchModeSelector />
            </div>

            {(searchMode === 'semantic' || searchMode === 'hybrid') && <AIAssistantField />}

            {searchMode !== 'semantic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    
                    {/* POV / JED VIEW */}
                    {tripType !== 'multicity' && (
                        <div className="v6-search-controls-row" style={{ alignItems: 'center', flexWrap: 'nowrap', gap: '8px' }}>
                            <AirportAutocomplete value={origin.code} onChange={(code, city) => setOrigin({ code, city })} placeholder="Polazak" />
                            <button onClick={() => { const tmp = origin; setOrigin(destination); setDestination(tmp); }} className="v6-swap-circle"><ArrowLeftRight size={18} stroke="#1e293b" /></button>
                            <AirportAutocomplete value={destination.code} onChange={(code, city) => setDestination({ code, city })} placeholder="Odredište" icon={<Search size={18} />} />
                            <div className="v6-ctrl-box" style={{ flex: 1.5 }}>
                                <div className="v6-input-v6-styled" onClick={() => setShowCalendar(true)} style={{ cursor: 'pointer' }}>
                                    <Calendar size={18} className="v6-inner-icon" /><span className="v6-val-text">{departDate ? (tripType === 'roundtrip' ? `${departDate} - ${returnDate || '...'}` : departDate) : 'Izaberite datume'}</span>
                                    {showCalendar && (
                                        <ExpediaCalendar startDate={departDate} endDate={returnDate} initialFlexibleDays={flexibleDays}
                                            onChange={(start, end, flex) => { setDepartDate(start); setReturnDate(end); setFlexibleDays(flex || 0); if (tripType === 'oneway' || (start && end)) setShowCalendar(false); }}
                                            onClose={() => setShowCalendar(false)} 
                                        />
                                    )}
                                </div>
                            </div>
                            <div style={{ flex: 1 }}><FlightPaxWizard adults={pax.adults} children={pax.children} infants={pax.infants} childAges={pax.childAges} onChange={setPax} /></div>
                            <div style={{ flex: 1 }}>
                                <div onClick={(e) => openClassDropdown(e, null)} className="v6-occupancy-trigger" style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '0 12px 0 44px' }}>
                                    <Plane size={16} style={{ position: 'absolute', left: '14px', strokeWidth: 2.5 }} /><span style={{ flex: 1, marginLeft: '8px', fontWeight: 600, fontSize: '15px' }}>{selectedClassLabelSingle}</span><span style={{ opacity: 0.5, marginLeft: '4px' }}>▾</span>
                                </div>
                            </div>
                            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className={`v6-filter-btn ${showAdvanced ? 'active' : ''}`}><SlidersHorizontal size={20} /></button>
                            <button onClick={handleSearch} className="v6-btn-primary flight-hero-btn"><span style={{ whiteSpace: 'nowrap' }}>Pretraži letove</span><Send size={18} /></button>
                        </div>
                    )}

                    {/* MULTI-CITY VIEW */}
                    {tripType === 'multicity' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {legs.map((leg, idx) => (
                                <div key={leg.id} className="v6-search-controls-row" style={{ alignItems: 'center', flexWrap: 'nowrap', gap: '8px', padding: '16px', background: 'var(--v6-bg-section)', borderRadius: '20px', border: '2px solid #1e293b' }}>
                                    <div style={{ width: '32px', height: '32px', background: '#1e293b', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', flexShrink: 0 }}>{idx + 1}</div>
                                    <div style={{ flex: 1.2 }}><AirportAutocomplete value={leg.origin.code} onChange={(code, city) => updateLeg(leg.id, 'origin', { code, city })} placeholder="Polazak" /></div>
                                    <div style={{ flex: 1.2 }}><AirportAutocomplete value={leg.destination.code} onChange={(code, city) => updateLeg(leg.id, 'destination', { code, city })} placeholder="Odredište" icon={<Search size={18} />} /></div>
                                    <div className="v6-ctrl-box" style={{ flex: 1 }}>
                                        <div className="v6-input-v6-styled" onClick={() => setActiveCalendarLeg(leg.id)} style={{ cursor: 'pointer', background: 'white' }}>
                                            <Calendar size={18} className="v6-inner-icon" /><span className="v6-val-text">{leg.date || 'Datum'}</span>
                                            {activeCalendarLeg === leg.id && (
                                                <ExpediaCalendar startDate={leg.date} initialFlexibleDays={0}
                                                    onChange={(start) => { updateLeg(leg.id, 'date', start); setActiveCalendarLeg(null); }}
                                                    onClose={() => setActiveCalendarLeg(null)} 
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1.1 }}><FlightPaxWizard adults={leg.pax.adults} children={leg.pax.children} infants={leg.pax.infants} childAges={leg.pax.childAges} onChange={(newPax) => updateLeg(leg.id, 'pax', newPax)} /></div>
                                    <div style={{ flex: 0.8 }}>
                                        <div onClick={(e) => openClassDropdown(e, leg.id)} className="v6-occupancy-trigger" style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '0 12px 0 38px', background: 'white' }}>
                                            <Plane size={14} style={{ position: 'absolute', left: '12px', strokeWidth: 2.5 }} /><span style={{ flex: 1, marginLeft: '6px', fontWeight: 600, fontSize: '13px' }}>{CABIN_CLASSES.find(c => c.value === leg.cabinClass)?.label || 'Ekonomska'}</span><span style={{ opacity: 0.5 }}>▾</span>
                                        </div>
                                    </div>
                                    <button onClick={() => removeLeg(leg.id)} disabled={legs.length <= 2} style={{ width: '40px', height: '52px', background: 'transparent', border: '2px solid #ef4444', borderRadius: '12px', color: '#ef4444', cursor: legs.length <= 2 ? 'not-allowed' : 'pointer', opacity: legs.length <= 2 ? 0.2 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={18} /></button>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                <button onClick={addLeg} className="v6-mode-tab" style={{ background: '#f8fafc', border: '2px dashed #1e293b', color: '#1e293b', padding: '12px 24px', borderRadius: '12px', height: '52px' }}>
                                    <Plus size={18} style={{ marginRight: '8px' }} /> Dodaj novi let
                                </button>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className={`v6-filter-btn ${showAdvanced ? 'active' : ''}`}><SlidersHorizontal size={20} /></button>
                                    <button onClick={handleSearch} className="v6-btn-primary flight-hero-btn" style={{ minWidth: '240px' }}><span style={{ whiteSpace: 'nowrap' }}>Pretraži sve letove</span><Send size={18} /></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SHARED CLASS POPUP */}
                    {showClassDropdown && createPortal(
                        <div className="v6-portal-wrapper" onMouseDown={e => e.stopPropagation()}>
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, background: 'transparent' }} onClick={() => setShowClassDropdown(false)}>
                                <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: panelPos.top, left: panelPos.left, background: 'white', border: '2px solid #1e293b', borderRadius: '16px', width: '220px', padding: '8px', boxShadow: 'var(--v6-shadow-lg)', animation: 'v6-pop-in 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)' }}>
                                    {CABIN_CLASSES.map(cls => (
                                        <div key={cls.value} onClick={() => { if (activeClassLegId === null) setCabinClass(cls.value); else updateLeg(activeClassLegId, 'cabinClass', cls.value); setShowClassDropdown(false); }} className="v6-class-option" style={{ padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: (activeClassLegId === null ? cabinClass === cls.value : legs.find(l=>l.id===activeClassLegId)?.cabinClass === cls.value) ? '#f1f5f9' : 'transparent' }}>
                                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{cls.label}</span>
                                            {(activeClassLegId === null ? cabinClass === cls.value : legs.find(l=>l.id===activeClassLegId)?.cabinClass === cls.value) && <Check size={14} color="#1e293b" strokeWidth={3} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>, document.body
                    )}

                    {/* REDESIGNED ADVANCED FILTERS PANEL */}
                    {showAdvanced && (
                        <div className="v6-advanced-panel-flat-v2">
                            <div className="v6-filters-grid-v2">
                                <div className="v6-filter-group-v2">
                                    <label>Maksimalno presedanja</label>
                                    <div className="v6-pill-group-v2">
                                        {['any', '0', '1', '2'].map(opt => (
                                            <button key={opt} onClick={() => setMaxStops(opt)} className={maxStops === opt ? 'active' : ''}>
                                                {opt === 'any' ? 'Sve' : opt === '0' ? 'Direktni' : opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="v6-filter-group-v2">
                                    <label>Vreme polaska</label>
                                    <div className="v6-pill-group-v2">
                                        {[
                                            { id: 'any', label: 'Bilo kada', icon: <Clock size={16} /> },
                                            { id: 'morning', label: 'Prepodne', icon: <Clock size={16} /> },
                                            { id: 'afternoon', label: 'Popodne', icon: <Clock size={16} /> },
                                            { id: 'evening', label: 'Uveče', icon: <Clock size={16} /> }
                                        ].map(t => (
                                            <button key={t.id} onClick={() => setOutboundTime(t.id)} className={outboundTime === t.id ? 'active' : ''}>
                                                {t.icon} <span>{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="v6-filter-group-v2">
                                    <label>Vreme dolaska</label>
                                    <div className="v6-pill-group-v2">
                                        {[
                                            { id: 'any', label: 'Bilo kada', icon: <Clock size={16} /> },
                                            { id: 'morning', label: 'Prepodne', icon: <Clock size={16} /> },
                                            { id: 'afternoon', label: 'Popodne', icon: <Clock size={16} /> },
                                            { id: 'evening', label: 'Uveče', icon: <Clock size={16} /> }
                                        ].map(t => (
                                            <button key={t.id} className="">
                                                {t.icon} <span>{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="v6-filter-group-v2">
                                    <label>Željena avio kompanija</label>
                                    <div className="v6-airline-select-v6">
                                        <Building2 size={16} className="v6-icon-navy" />
                                        <select value={airline} onChange={(e) => setAirline(e.target.value)}>
                                            {AIRLINES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="v6-icon-navy-chevron" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="v6-filters-switches-v2">
                                <label className="v6-switch-label-v2">
                                    <input type="checkbox" /> Samo fleksibilne tarife
                                </label>
                                <label className="v6-switch-label-v2">
                                    <input type="checkbox" /> Uključi pretragu prtljaga
                                </label>
                                <label className="v6-switch-label-v2 v6-pill-tag">
                                    <input type="checkbox" /> <Briefcase size={14} /> <span>Samo ručni prtljag</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            <style jsx>{`
                .v6-flight-form-container { padding: 8px 0; }
                .v6-trip-btn { flex: 1; display: flex; align-items: center; justify-content: center; border: none; background: transparent; cursor: pointer; border-radius: 12px; }
                .v6-trip-btn.active { background: #1e293b; }
                .v6-trip-btn svg { stroke: #1e293b !important; stroke-width: 2.5; }
                .v6-trip-btn.active svg { stroke: white !important; }
                .plane-e { transform: rotate(45deg); }
                .plane-w { transform: rotate(225deg); }
                @keyframes v6-pop-in { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                
                /* ADVANCED FILTERS V2 */
                .v6-advanced-panel-flat-v2 { 
                    background: var(--v6-bg-section, #f8fafc); 
                    border: 2px solid #1e293b; 
                    border-radius: 20px; 
                    padding: 24px; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 24px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                }
                .v6-filters-grid-v2 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 32px; }
                .v6-filter-group-v2 label { 
                    display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; 
                    color: #1e293b; opacity: 0.6; margin-bottom: 12px; letter-spacing: 0.5px;
                }
                .v6-pill-group-v2 { display: flex; gap: 8px; flex-wrap: nowrap; }
                .v6-pill-group-v2 button { 
                    padding: 10px 16px; border: 1.5px solid #1e293b; background: white; 
                    border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer;
                    display: flex; align-items: center; gap: 6px; color: #1e293b;
                    transition: all 0.2s; white-space: nowrap;
                }
                .v6-pill-group-v2 button.active { background: #1e293b; color: white !important; }
                .v6-pill-group-v2 button.active svg { stroke: white !important; }

                .v6-airline-select-v6 {
                    height: 48px; border: 1.8px solid #1e293b; border-radius: 12px; background: white;
                    display: flex; align-items: center; padding: 0 12px; position: relative;
                }
                .v6-airline-select-v6 select {
                    flex: 1; border: none; background: transparent; outline: none; padding-left: 36px;
                    font-weight: 700; font-size: 14px; color: #1e293b; appearance: none; cursor: pointer;
                }
                .v6-icon-navy { position: absolute; left: 14px; stroke: #1e293b; stroke-width: 2.5; }
                .v6-icon-navy-chevron { position: absolute; right: 12px; opacity: 0.5; }

                .v6-filters-switches-v2 { 
                    display: flex; align-items: center; gap: 24px; 
                    padding-top: 16px; border-top: 1px solid rgba(30,41,59,0.1); 
                }
                .v6-switch-label-v2 { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 14px; color: #1e293b; cursor: pointer; }
                .v6-switch-label-v2 input { width: 18px; height: 18px; accent-color: #1e293b; cursor: pointer; }
                .v6-pill-tag { background: rgba(30, 41, 59, 0.05); padding: 8px 16px; border-radius: 100px; }

                /* REZULTATI / KLASE */
                .v6-class-option:hover { background: #f1f5f9 !important; }
                .v6-input-v6-styled { height: 52px; border: 2px solid #1e293b; border-radius: 12px; background: var(--v6-bg-card); display: flex; align-items: center; padding: 0 12px; position: relative; }
                .v6-inner-icon { margin-right: 10px; stroke: #1e293b !important; stroke-width: 2.5; flex-shrink: 0; }
                .v6-val-text { font-size: 14px; font-weight: 700; color: var(--v6-text-primary); white-space: nowrap; overflow: hidden; }
                .v6-swap-circle { width: 44px; height: 44px; border: 2px solid #1e293b; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); z-index: 10; }
                .v6-filter-btn { width: 52px; height: 52px; border: 2px solid #1e293b; border-radius: 12px; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .v6-filter-btn.active { background: #1e293b; color: white; }
                .v6-filter-btn.active svg { stroke: white !important; }
                .flight-hero-btn { height: 52px; border-radius: 12px; padding: 0 24px; font-weight: 800; font-size: 14px; gap: 12px; }
                .v6-occupancy-trigger { height: 52px !important; border: 2px solid #1e293b !important; border-radius: 12px !important; background: var(--v6-bg-section) !important; transition: all 0.2s ease; cursor: pointer; color: var(--v6-text-primary); }
                .v6-occupancy-trigger:hover { background: #f1f5f9 !important; }
            `}</style>
        </div>
    );
};

export default FlightSearchForm;
