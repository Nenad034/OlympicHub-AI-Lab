import React from 'react';
import { useSearchStore, calcPaxSummary } from '../../stores/useSearchStore';
import { SearchModeSelector } from '../SearchModeSelector';
import { AIAssistantField } from '../AIAssistantField';
import { MOCK_HOTEL_RESULTS, MOCK_ROOM_OPTIONS } from '../../data/mockResults';
import { MOCK_FLIGHT_RESULTS } from '../../data/mockFlights';
import { MOCK_TRANSFERS, MOCK_ACTIVITIES } from '../../data/mockPackageData';
import { FlightCard } from '../FlightCard/FlightCard';
import { OccupancyWizard } from '../OccupancyWizard/OccupancyWizard';
import { Search, MapPin, Calendar, Users, Send, Plane, Hotel, Bus, Ticket, CheckCircle2, RotateCcw, Clock, ShieldCheck, Map, Activity, Utensils, Music, Heart, SlidersHorizontal } from 'lucide-react';
import { ExpediaCalendar } from '../../../../components/ExpediaCalendar';
import type { FlightSearchResult, HotelSearchResult, TransferOption, ActivityOption, FlightLeg } from '../../types';
import { PackageLiveStack } from '../PackageLiveStack';
import { FlightPaxWizard } from '../FlightSearchForm/FlightPaxWizard';
import { MOCK_TOUR_RESULTS } from '../../data/mockTours';
import { TourCard } from '../TourCard/TourCard';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const formatPrice = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

// ─────────────────────────────────────────────────────────────
// STEPPER (Progress Bar)
// ─────────────────────────────────────────────────────────────
const STEPS = [
    { num: 1, label: 'Pretraga',    icon: <Search size={18} /> },
    { num: 2, label: 'Let',         icon: <Plane size={18} />,    type: 'flight' },
    { num: 3, label: 'Hotel',       icon: <Hotel size={18} />,    type: 'hotel' },
    { num: 4, label: 'Transfer',    icon: <Bus size={18} />,      type: 'transfer' },
    { num: 5, label: 'Ekstra',      icon: <Ticket size={18} />,   type: 'extra' },
    { num: 6, label: 'Pregled',     icon: <CheckCircle2 size={18} />, type: 'summary' },
];

const STEP_COLORS: Record<string, { bg: string, text: string, primary: string }> = {
    'pretraga': { bg: 'var(--v6-bg-section)', text: 'var(--v6-text-muted)', primary: 'var(--v6-navy)' },
    'flight':   { bg: 'var(--v6-color-flight-bg)',   text: 'var(--v6-color-flight)',   primary: 'var(--v6-color-flight)' },
    'hotel':    { bg: 'var(--v6-color-hotel-bg)',    text: 'var(--v6-color-hotel)',    primary: 'var(--v6-color-hotel)' },
    'transfer': { bg: 'var(--v6-color-transfer-bg)', text: 'var(--v6-color-transfer)', primary: 'var(--v6-color-transfer)' },
    'extra':    { bg: 'var(--v6-color-extra-bg)',    text: 'var(--v6-color-extra)',    primary: 'var(--v6-color-extra)' },
    'summary':  { bg: 'var(--v6-color-summary-bg)',  text: 'var(--v6-color-summary)',  primary: 'var(--v6-color-summary)' }
};

const Stepper: React.FC<{ currentStep: number; onStepClick: (n: number) => void; maxReached: number }> = ({ currentStep, onStepClick, maxReached }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 24px',
        background: 'var(--v6-bg-card)',
        borderBottom: 'none', /* Uklonjen border kako bi se modul podigao */
        gap: '0',
        overflowX: 'auto',
    }}
        role="navigation"
        aria-label="Koraci paketa"
    >
        {STEPS.map((step, idx) => {
            const isActive    = step.num === currentStep;
            const isDone      = step.num < currentStep;
            const isReachable = step.num <= maxReached;
            const colors      = STEP_COLORS[step.type || 'pretraga'];

            return (
                <React.Fragment key={step.num}>
                    {/* Korak */}
                    <button
                        onClick={() => isReachable && onStepClick(step.num)}
                        disabled={!isReachable}
                        aria-current={isActive ? 'step' : undefined}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            minWidth: '72px',
                            padding: '6px 8px',
                            border: 'none',
                            background: 'transparent',
                            cursor: isReachable ? 'pointer' : 'default',
                            fontFamily: 'var(--v6-font)',
                        }}
                    >
                        <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isDone ? '16px' : '18px',
                            fontWeight: 700,
                            background: isActive
                                ? colors.primary
                                : isDone
                                    ? colors.bg
                                    : 'var(--v6-bg-section)',
                            border: `2px solid ${isActive ? colors.primary : isDone ? colors.primary : 'var(--v6-border)'}`,
                            color: isActive ? '#ffffff' : isDone ? colors.text : 'var(--v6-text-muted)',
                            transition: 'all 0.2s',
                        }}>
                            {isDone ? <CheckCircle2 size={18} /> : step.icon}
                        </div>
                        <span style={{
                            fontSize: '10px',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? colors.primary : isDone ? colors.text : 'var(--v6-text-muted)',
                            whiteSpace: 'nowrap',
                        }}>
                            {step.label}
                        </span>
                    </button>

                    {/* Linija između */}
                    {idx < STEPS.length - 1 && (
                        <div style={{
                            flex: 1,
                            height: '2px',
                            background: step.num < currentStep ? colors.primary : 'var(--v6-border)',
                            minWidth: '20px',
                            transition: 'background 0.3s',
                            marginBottom: '20px',
                        }} />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);


// ─────────────────────────────────────────────────────────────
// KORAK 1: Pretraga (Redizajnirano V6)
// ─────────────────────────────────────────────────────────────
const Step1Search: React.FC<{ onNext: () => void }> = ({ onNext }) => {
    const { 
        destinations, checkIn, checkOut, roomAllocations, 
        addDestination, removeDestination, setCheckIn, setCheckOut, searchMode,
        resetPackageWizard
    } = useSearchStore();
    
    // Multi-Stop State
    const [isMultiStop, setIsMultiStop] = React.useState(false);
    const [segments, setSegments] = React.useState<any[]>([
        { 
            id: '1', 
            origin: 'Beograd (BEG)', 
            destination: '', 
            date: '', 
            occupancy: [{ adults: 2, children: 0, childrenAges: [] }] 
        }
    ]);
    
    // NEW: Origin state
    const [origin, setOrigin] = React.useState('Beograd (BEG)');
    const [tagInput, setTagInput] = React.useState('');
    const [showCalendar, setShowCalendar] = React.useState(false);
    const today = new Date().toISOString().split('T')[0];

    const addSegment = () => {
        const lastSeg = segments[segments.length - 1];
        const lastDest = lastSeg.destination;
        const lastDate = lastSeg.date;
        
        // Predloži sutrašnji datum u odnosu na prethodni segment
        let suggestedDate = '';
        if (lastDate) {
            const dateObj = new Date(lastDate);
            dateObj.setDate(dateObj.getDate() + 1);
            suggestedDate = dateObj.toISOString().split('T')[0];
        }

        setSegments([
            ...segments, 
            { 
                id: Date.now().toString(), 
                origin: lastDest || '', 
                destination: '', 
                date: suggestedDate,
                occupancy: [...lastSeg.occupancy] // Kopiraj broj osoba iz prethodnog segmenta
            }
        ]);
    };

    const removeSegment = (id: string) => {
        if (segments.length > 1) setSegments(segments.filter(s => s.id !== id));
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            addDestination({
                id: Date.now().toString(),
                name: tagInput.trim(),
                type: 'city',
                country: '',
            });
            setTagInput('');
        }
    };

    const canContinue = isMultiStop 
        ? segments.every(s => s.origin && s.destination && s.date)
        : (destinations.length > 0 || tagInput.trim().length > 1) && !!origin && !!checkIn && !!checkOut;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Reset Button (Nova Pretraga) */}
                    <button
                        onClick={resetPackageWizard}
                        style={{
                            padding: '10px 18px',
                            background: 'var(--v6-bg-card)',
                            border: '1.8px solid #1A234E',
                            borderRadius: '12px',
                            color: 'var(--v6-text-primary)',
                            fontSize: '13px',
                            fontFamily: 'var(--v6-font)',
                            fontWeight: 900,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            boxShadow: 'var(--v6-shadow-sm)'
                        }}
                    >
                        NOVA PRETRAGA
                    </button>

                    {/* Multi-Stop Toggle */}
                    <button 
                        onClick={() => setIsMultiStop(!isMultiStop)}
                        style={{
                            padding: '10px 18px',
                            background: isMultiStop ? 'var(--v6-accent)' : 'var(--v6-bg-card)',
                            border: isMultiStop ? '1.8px solid var(--v6-accent)' : '1.8px solid #1A234E',
                            borderRadius: '12px',
                            color: isMultiStop ? 'var(--v6-accent-text)' : 'var(--v6-text-primary)',
                            fontSize: '13px',
                            fontFamily: 'var(--v6-font)',
                            fontWeight: 900,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            boxShadow: 'var(--v6-shadow-sm)'
                        }}
                    >
                        {isMultiStop ? 'Multi-Stop Aktivan' : 'Aktiviraj Multi-Stop'}
                    </button>
                </div>

            {((searchMode as any) === 'semantic' || (searchMode as any) === 'hybrid') && <AIAssistantField />}

            {(searchMode as any) !== 'semantic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 900, color: 'var(--v6-text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Search size={20} color="var(--v6-accent)" /> 
                        {isMultiStop ? 'Planiranje Vašeg Multi-Stop Putovanja' : 'Definišite parametre paketa'}
                    </h3>

                    {isMultiStop ? (
                        /* MULTI-STOP VIEW */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {segments.map((seg, idx) => (
                                <div key={seg.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'var(--v6-bg-section)', border: '1.8px solid #1A234E', borderRadius: '16px' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 900, width: '28px', height: '28px', borderRadius: '50%', background: 'var(--v6-accent)', color: 'var(--v6-accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
                                        <div className="field-container" style={{ flex: 1, height: '48px', padding: '0 12px' }}>
                                            <input 
                                                value={seg.origin}
                                                onChange={e => {
                                                    const news = [...segments];
                                                    news[idx].origin = e.target.value;
                                                    setSegments(news);
                                                }}
                                                placeholder="Odakle?" 
                                                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}
                                            />
                                            <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>→</span>
                                            <input 
                                                value={seg.destination}
                                                onChange={e => {
                                                    const news = [...segments];
                                                    news[idx].destination = e.target.value;
                                                    setSegments(news);
                                                }}
                                                placeholder="Kuda?" 
                                                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}
                                            />
                                        </div>
                                        {idx > 0 && <button onClick={() => removeSegment(seg.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px' }}>🗑️</button>}
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px', borderTop: '1px solid var(--v6-border)', paddingTop: '12px' }}>
                                        {/* Segment Date */}
                                        <div style={{ flex: 1, position: 'relative' }}>
                                           <div 
                                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--v6-bg-section)', borderRadius: '10px', cursor: 'pointer', border: '1.5px solid var(--v6-border)' }}
                                              onClick={() => {
                                                 const news = [...segments];
                                                 (news[idx] as any).showCal = !(news[idx] as any).showCal;
                                                 setSegments(news);
                                              }}
                                           >
                                              <Calendar size={14} color="var(--v6-accent)" />
                                              <span style={{ fontSize: '13px', fontWeight: 700 }}>
                                                 {seg.date ? new Date(seg.date).toLocaleDateString('sr-RS') : 'Izaberi datum'}
                                              </span>
                                           </div>
                                           {(seg as any).showCal && (
                                              <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: '4px' }}>
                                                 <ExpediaCalendar 
                                                     startDate={seg.date}
                                                     endDate={seg.date}
                                                     onChange={(start) => {
                                                         const news = [...segments];
                                                         news[idx].date = start;
                                                         (news[idx] as any).showCal = false;
                                                         
                                                         // Automatski predloži datum za sledeći segment ako postoji
                                                         if (idx < segments.length - 1 && !news[idx + 1].date) {
                                                            const nextDate = new Date(start);
                                                            nextDate.setDate(nextDate.getDate() + 1);
                                                            news[idx+1].date = nextDate.toISOString().split('T')[0];
                                                         }
                                                         
                                                         setSegments(news);
                                                     }}
                                                     onClose={() => {
                                                        const news = [...segments];
                                                        (news[idx] as any).showCal = false;
                                                        setSegments(news);
                                                     }}
                                                 />
                                              </div>
                                           )}
                                        </div>

                                        {/* Segment Occupancy - Using FlightPaxWizard for consistency */}
                                        <div style={{ flex: 1.2 }}>
                                           <FlightPaxWizard 
                                              adults={seg.occupancy[0].adults}
                                              children={seg.occupancy[0].children}
                                              infants={(seg as any).infants || 0}
                                              childAges={seg.occupancy[0].childrenAges}
                                              onChange={(data) => {
                                                 const news = [...segments];
                                                 news[idx].occupancy[0].adults = data.adults;
                                                 news[idx].occupancy[0].children = data.children;
                                                 news[idx].occupancy[0].childrenAges = data.childAges;
                                                 (news[idx] as any).infants = data.infants;
                                                 setSegments(news);
                                              }}
                                           />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addSegment} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'transparent', border: '2px dashed var(--v6-border)', borderRadius: '14px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', color: 'var(--v6-text-muted)', transition: 'all 0.2s' }}>
                               <span>+</span> Dodaj sledeću stanicu
                            </button>
                        </div>
                    ) : (
                        /* CLASSIC VIEW: Origin & Destination */
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {/* Origin */}
                            <div className="field-container" style={{ flex: 1, padding: '0 16px', border: '1.8px solid #1A234E !important', borderRadius: '12px', background: '#FFFFFF' }}>
                                <Send size={20} style={{ color: 'var(--brand-accent)', marginRight: '12px', transform: 'rotate(-45deg)' }} />
                                <input 
                                    type="text"
                                    value={origin}
                                    onChange={e => setOrigin(e.target.value)}
                                    placeholder="Polazak iz..."
                                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '16px', fontWeight: 800 }}
                                />
                            </div>

                            {/* Destination */}
                            <div className="field-container" style={{ flex: 2, padding: '0 16px', position: 'relative', border: '1.8px solid #1A234E !important', borderRadius: '12px', background: '#FFFFFF' }}>
                                <MapPin size={22} style={{ color: 'var(--brand-accent)', marginRight: '12px' }} />
                                <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '6px', overflowX: 'auto', flex: 1 }}>
                                    {destinations.map(d => (
                                        <span key={d.id} style={{ 
                                            padding: '6px 14px', background: 'var(--brand-accent)', color: '#fff', 
                                            borderRadius: '12px', fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap',
                                            display: 'flex', alignItems: 'center', gap: '6px'
                                        }}>
                                            {d.name}
                                            <button onClick={() => removeDestination(d.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', padding: 0 }}>✕</button>
                                        </span>
                                    ))}
                                    {destinations.length < 3 && (
                                        <input
                                            type="text"
                                            value={tagInput}
                                            onChange={e => setTagInput(e.target.value)}
                                            onKeyDown={handleAddTag}
                                            placeholder={destinations.length === 0 ? "Kuda idete?" : ""}
                                            style={{ 
                                                flex: 1, minWidth: '100px', border: 'none', outline: 'none', background: 'transparent', 
                                                color: 'var(--text-main)', fontSize: '16px', fontWeight: 700
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* V6 CONTROLS ROW: Dates & Pax (Hidden in Multi-Stop as they are segment-specific) */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap' }}>
                        {!isMultiStop && (
                            <>
                                {/* Dates Control Box */}
                                <div className="field-container" style={{ flex: 1.5, padding: '0 14px', gap: '10px', border: '1.8px solid #1A234E !important', borderRadius: '12px', background: '#FFFFFF' }} onClick={() => setShowCalendar(true)}>
                                    <Calendar size={18} style={{ color: 'var(--brand-accent)' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                                        {checkIn ? (
                                            <>
                                                <span>{new Date(checkIn).toLocaleDateString('sr-RS')}</span>
                                                <span style={{ opacity: 0.3 }}>-</span>
                                                <span>{checkOut ? new Date(checkOut).toLocaleDateString('sr-RS') : '...'}</span>
                                            </>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Izaberite datume</span>
                                        )}
                                    </div>
                                    
                                    {showCalendar && (
                                        <div className="popover" style={{ zIndex: 1000, position: 'absolute', top: 'calc(100% + 8px)', left: 0 }}>
                                            <ExpediaCalendar 
                                                startDate={checkIn}
                                                endDate={checkOut}
                                                onChange={(start, end) => {
                                                    setCheckIn(start);
                                                    setCheckOut(end);
                                                }}
                                                onClose={() => setShowCalendar(false)}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Occupancy Control Box */}
                                <div style={{ flex: 1 }}>
                                    <OccupancyWizard />
                                </div>
                            </>
                        )}

                        <button
                            onClick={() => {
                                if (canContinue || (searchMode as any) === 'semantic') {
                                    onNext();
                                }
                            }}
                            disabled={!canContinue && (searchMode as any) !== 'semantic'}
                            style={{
                                flex: 1,
                                height: '56px',
                                background: (canContinue || (searchMode as any) === 'semantic') ? 'var(--v6-navy)' : 'var(--v6-border)',
                                color: (canContinue || (searchMode as any) === 'semantic') ? '#ffffff' : 'var(--v6-text-muted)',
                                border: 'none',
                                borderRadius: '14px',
                                fontSize: '15px',
                                fontWeight: 900,
                                cursor: (canContinue || (searchMode as any) === 'semantic') ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                transition: 'all 0.2s',
                                boxShadow: (canContinue || (searchMode as any) === 'semantic') ? '0 8px 20px rgba(30,41,59,0.2)' : 'none'
                            }}
                        >
                            <span>Pretraži</span>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// KORAK 2: Let
// ─────────────────────────────────────────────────────────────
const Step2Flights: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
    const { 
        packageWizardSelections, 
        setPackageWizardOutboundFlight, 
        setPackageWizardReturnFlight,
        roomAllocations,
        checkIn,
        checkOut,
        destinations
    } = useSearchStore();

    const pax = calcPaxSummary(roomAllocations, checkIn, checkOut);
    const paxTotal = pax.totalAdults + pax.totalChildren;

    // Use internal state to track if we are picking outbound or return
    // If outbound is not selected, phase = 'outbound'
    // If outbound is selected, phase = 'return'
    const phase = !packageWizardSelections.outboundFlight ? 'outbound' : 'return';

    // Filter results for the current phase
    // In a real app we'd fetch specific segments. For mock, we map MOCK_FLIGHT_RESULTS into outbound/inbound lists.
    const outboundOptions = MOCK_FLIGHT_RESULTS.map(f => f.outbound);
    const returnOptions = MOCK_FLIGHT_RESULTS.filter(f => !!f.inbound).map(f => f.inbound!);

    const currentOptions = phase === 'outbound' ? outboundOptions : returnOptions;
    const selectedLeg = phase === 'outbound' ? packageWizardSelections.outboundFlight : packageWizardSelections.returnFlight;

    const handleSelect = (leg: FlightLeg) => {
        if (phase === 'outbound') {
            setPackageWizardOutboundFlight(leg);
        } else {
            setPackageWizardReturnFlight(leg);
        }
    };

    const handleReset = () => {
        setPackageWizardOutboundFlight(undefined);
        setPackageWizardReturnFlight(undefined);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>
                    {phase === 'outbound' ? '✈️ Korak 2a: Izaberite let u odlasku' : '✈️ Korak 2b: Izaberite povratni let'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--v6-text-muted)' }}>
                    Prikazani su dostupni letovi za izabrane termine. Cene su po osobi.
                  </p>
                </div>
                {packageWizardSelections.outboundFlight && (
                    <button 
                        onClick={handleReset}
                        style={{ padding: '6px 12px', background: 'var(--v6-bg-section)', border: '1.5px solid var(--v6-border)', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <RotateCcw size={12} /> Resetuj izbor letova
                    </button>
                )}
            </div>

            {/* Segment Progress Trace */}
            <div style={{ display: 'flex', gap: '8px', padding: '12px', background: 'var(--v6-bg-section)', borderRadius: '14px', border: '1.5px solid var(--v6-border)' }}>
                <div style={{ 
                    flex: 1, padding: '8px', borderRadius: '10px', 
                    background: phase === 'outbound' ? 'var(--v6-navy)' : 'var(--v6-bg-card)',
                    color: phase === 'outbound' ? '#fff' : 'var(--v6-text-muted)',
                    border: '1px solid ' + (phase === 'outbound' ? 'var(--v6-navy)' : 'var(--v6-border)'),
                    textAlign: 'center', fontSize: '11px', fontWeight: 800
                }}>
                    1. ODLAZAK {packageWizardSelections.outboundFlight && '✓'}
                </div>
                <div style={{ 
                    flex: 1, padding: '8px', borderRadius: '10px', 
                    background: phase === 'return' ? 'var(--v6-navy)' : 'var(--v6-bg-card)',
                    color: phase === 'return' ? '#fff' : 'var(--v6-text-muted)',
                    border: '1px solid ' + (phase === 'return' ? 'var(--v6-navy)' : 'var(--v6-border)'),
                    textAlign: 'center', fontSize: '11px', fontWeight: 800
                }}>
                    2. POVRATAK {packageWizardSelections.returnFlight && '✓'}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentOptions.map((leg, idx) => {
                    const isSelected = selectedLeg?.id === leg.id;
                    const flightForCard: any = {
                        id: leg.id,
                        airline: 'Air Serbia', // Simplification for mock
                        airlineLogo: '🇷🇸',
                        totalPrice: leg.price,
                        currency: leg.currency,
                        outbound: leg,
                        isPrime: true
                    };
                    
                    return (
                        <div key={leg.id} style={{
                            outline: isSelected ? `2.5px solid var(--v6-color-instant)` : '2.5px solid transparent',
                            borderRadius: 'var(--v6-radius-lg)',
                            transition: 'outline 0.2s',
                        }}>
                            <FlightCard
                                flight={flightForCard}
                                index={idx}
                                paxTotal={paxTotal}
                                onBook={() => handleSelect(leg)}
                                customActionLabel={phase === 'outbound' ? 'Izaberi polazak' : 'Izaberi povratak'}
                            />
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button 
                    onClick={() => {
                        if (phase === 'return') {
                            setPackageWizardOutboundFlight(undefined);
                        } else {
                            onBack();
                        }
                    }} 
                    style={{ padding: '11px 20px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'transparent', color: 'var(--v6-text-secondary)', fontSize: 'var(--v6-fs-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}
                >
                    ← Nazad
                </button>
                <button 
                    onClick={onNext} 
                    disabled={!packageWizardSelections.outboundFlight || !packageWizardSelections.returnFlight}
                    style={{ 
                        padding: '11px 24px', 
                        background: (packageWizardSelections.outboundFlight && packageWizardSelections.returnFlight) ? 'var(--v6-accent)' : 'var(--v6-border)', 
                        color: (packageWizardSelections.outboundFlight && packageWizardSelections.returnFlight) ? 'var(--v6-accent-text)' : 'var(--v6-text-muted)', 
                        border: 'none', borderRadius: 'var(--v6-radius-md)', fontSize: 'var(--v6-fs-sm)', fontWeight: 700, 
                        cursor: (packageWizardSelections.outboundFlight && packageWizardSelections.returnFlight) ? 'pointer' : 'not-allowed', 
                        fontFamily: 'var(--v6-font)' 
                    }}
                >
                    Izaberi hotel →
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// KORAK 3: Hotel + Soba
// ─────────────────────────────────────────────────────────────
const Step3Hotels: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
    const { 
        packageWizardSelections, 
        setPackageWizardHotel, 
        results, 
        filters 
    } = useSearchStore();
    const [expandedHotel, setExpandedHotel] = React.useState<string | null>(null);

    // Filter results for Step 3
    const hotelSource = results.length > 0 ? results : MOCK_HOTEL_RESULTS;
    const filteredHotels = React.useMemo(() => {
        return hotelSource.filter(hotel => {
            // Name filter
            if (filters.hotelName && !hotel.name.toLowerCase().includes(filters.hotelName.toLowerCase())) {
                return false;
            }
            // Star filter
            if (filters.stars && !filters.stars.includes('all')) {
                if (!filters.stars.includes(hotel.stars.toString())) return false;
            }
            // Availability
            if (filters.availability && filters.availability.length > 0) {
                if (!filters.availability.includes(hotel.status)) return false;
            }
            return true;
        });
    }, [hotelSource, filters]);

    const selected = packageWizardSelections;
    const canContinue = !!(selected.hotelId && selected.roomId && selected.mealPlanCode);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--v6-fs-lg)', fontWeight: 800, color: 'var(--v6-text-primary)' }}>
                🏨 Izaberi hotel i sobu
            </h3>

            {/* Filter Summary */}
            <div style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--v6-text-muted)', fontWeight: 700 }}>
                {filteredHotels.length} hotela odgovara vašim filterima
            </div>

            {filteredHotels.map(hotel => {
                const isHotelSelected = selected.hotelId === hotel.id;
                const isExpanded = expandedHotel === hotel.id;

                return (
                    <div key={hotel.id} style={{
                        border: `1.5px solid ${isHotelSelected ? 'var(--v6-color-instant)' : 'var(--v6-border)'}`,
                        borderRadius: 'var(--v6-radius-lg)',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s',
                    }}>
                        {/* Hotel row (kompaktno) */}
                        <div
                            onClick={() => setExpandedHotel(isExpanded ? null : hotel.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer', background: isHotelSelected ? 'var(--v6-color-instant-bg)' : 'var(--v6-bg-card)' }}
                        >
                            {hotel.isPrime && <span style={{ padding: '2px 8px', background: 'linear-gradient(135deg,#b45309,#f59e0b)', color: '#fff', borderRadius: '999px', fontSize: '10px', fontWeight: 800 }}>🏆 PRIME</span>}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 'var(--v6-fs-sm)', color: 'var(--v6-text-primary)' }}>{hotel.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)' }}>{'★'.repeat(hotel.stars)} · {hotel.location.city} · od {formatPrice(hotel.lowestTotalPrice)}</div>
                            </div>
                            {isHotelSelected && <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v6-color-instant-text)' }}>✓ Izabrano</span>}
                            <span style={{ color: 'var(--v6-text-muted)', fontSize: '14px' }}>{isExpanded ? '▲' : '▼'}</span>
                        </div>

                        {/* Sobe (expand) */}
                        {isExpanded && (
                            <div style={{ borderTop: '1px solid var(--v6-border)', background: 'var(--v6-bg-main)' }}>
                                {MOCK_ROOM_OPTIONS.map(room => (
                                    <div key={room.id} style={{ borderBottom: '1px solid var(--v6-border)' }}>
                                        <div style={{ padding: '10px 16px 4px', fontSize: '13px', fontWeight: 700, color: 'var(--v6-text-primary)' }}>{room.name}</div>
                                        {room.mealPlans.map(meal => {
                                            const isRowSelected = selected.hotelId === hotel.id && selected.roomId === room.id && selected.mealPlanCode === meal.code;
                                            return (
                                                <div key={meal.code} onClick={() => setPackageWizardHotel(hotel.id, room.id, meal.code)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px 8px 24px', cursor: 'pointer', background: isRowSelected ? 'var(--v6-color-instant-bg)' : 'transparent', transition: 'background 0.15s' }}>
                                                    <span style={{ flex: 1, fontSize: '13px', color: 'var(--v6-text-secondary)' }}>{meal.label}</span>
                                                    <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: meal.status === 'instant' ? 'var(--v6-color-instant-bg)' : 'var(--v6-color-on-request-bg)', color: meal.status === 'instant' ? 'var(--v6-color-instant-text)' : 'var(--v6-color-on-request-text)' }}>{meal.status === 'instant' ? '⚡ Odmah' : '❓ Na upit'}</span>
                                                    <span style={{ fontSize: 'var(--v6-fs-md)', fontWeight: 800, color: 'var(--v6-text-primary)', minWidth: '80px', textAlign: 'right' }}>{formatPrice(meal.totalPrice)}</span>
                                                    {isRowSelected ? <span style={{ color: 'var(--v6-color-instant-text)', fontWeight: 700, fontSize: '13px' }}>✓</span>
                                                        : <span style={{ color: 'var(--v6-text-muted)', fontSize: '13px' }}>→</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button onClick={() => useSearchStore.getState().resetPackageWizard()} style={{ padding: '11px 20px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'transparent', color: 'var(--v6-text-muted)', fontSize: 'var(--v6-fs-xs)', fontWeight: 600, cursor: 'pointer' }}>🔄 Poništi</button>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={onBack} style={{ padding: '11px 20px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'transparent', color: 'var(--v6-text-secondary)', fontSize: 'var(--v6-fs-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>← Nazad</button>
                    <button onClick={onNext} disabled={!canContinue}
                        style={{ padding: '11px 24px', background: canContinue ? 'var(--v6-accent)' : 'var(--v6-border)', color: canContinue ? 'var(--v6-accent-text)' : 'var(--v6-text-muted)', border: 'none', borderRadius: 'var(--v6-radius-md)', fontSize: 'var(--v6-fs-sm)', fontWeight: 700, cursor: canContinue ? 'pointer' : 'not-allowed', fontFamily: 'var(--v6-font)' }}>
                        Izaberi transfer →
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// KORAK 4: Transfer
// ─────────────────────────────────────────────────────────────
const Step4Transfer: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
    const { packageWizardSelections, setPackageWizardTransfer } = useSearchStore();

    const typeIcons: Record<TransferOption['type'], React.ReactNode> = {
        shared: <Bus size={18} />,
        private: <Bus size={18} />, // Generic bus for now, Lucide has 'Car' or 'Van' but we keep it simple
        luxury: <Bus size={18} />, 
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--v6-fs-lg)', fontWeight: 800, color: 'var(--v6-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bus size={22} color="var(--v6-accent)" /> Izaberi povratni transfer (opciono)
            </h3>
            
            {/* Filteri za transfere */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 12px', background: 'var(--v6-bg-section)', borderRadius: '14px', border: '1.5px solid var(--v6-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <SlidersHorizontal size={14} color="var(--v6-accent)" />
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--v6-text-primary)' }}>Tip vozila:</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={{ padding: '5px 10px', background: 'var(--v6-navy)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>Svi</button>
                    <button style={{ padding: '5px 10px', background: '#fff', border: '1px solid var(--v6-border)', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>Šatl Bus</button>
                    <button style={{ padding: '5px 10px', background: '#fff', border: '1px solid var(--v6-border)', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>Privatni auto</button>
                    <button style={{ padding: '5px 10px', background: '#fff', border: '1px solid var(--v6-border)', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>Luksuzna limuzina</button>
                </div>
            </div>

            <p style={{ margin: 0, fontSize: 'var(--v6-fs-xs)', color: 'var(--v6-text-muted)' }}>
                Uključuje prevoz: Aerodrom ↔ Hotel u oba pravca (Dolazak i Odlazak).
            </p>

            {MOCK_TRANSFERS.map(tr => {
                const isSelected = packageWizardSelections.transferId === tr.id;
                return (
                    <div key={tr.id} onClick={() => setPackageWizardTransfer(isSelected ? undefined : tr.id)}
                        style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '14px 16px', border: `1.5px solid ${isSelected ? 'var(--v6-color-instant)' : 'var(--v6-border)'}`, borderRadius: 'var(--v6-radius-lg)', background: isSelected ? 'var(--v6-color-instant-bg)' : 'var(--v6-bg-card)', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                                <span style={{ fontSize: 'var(--v6-fs-sm)', fontWeight: 700, color: 'var(--v6-text-primary)' }}>{tr.vehicle}</span>
                                {tr.isPrime && <span style={{ padding: '2px 8px', background: 'linear-gradient(135deg,#b45309,#f59e0b)', color: '#fff', borderRadius: '999px', fontSize: '10px', fontWeight: 800 }}>🏆 PRIME</span>}
                                <span style={{ fontSize: '11px', color: 'var(--v6-text-muted)' }}>max {tr.maxPassengers} putnika · {tr.durationMinutes} min · {tr.distanceKm} km</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {tr.includes.map(inc => (
                                    <span key={inc} style={{ fontSize: '11px', padding: '2px 8px', background: 'var(--v6-bg-section)', border: '1px solid var(--v6-border)', borderRadius: '4px', color: 'var(--v6-text-muted)' }}>✓ {inc}</span>
                                ))}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 'var(--v6-fs-xl)', fontWeight: 900, color: 'var(--v6-text-primary)' }}>{formatPrice(tr.totalPrice)}</div>
                            <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)' }}>za grupu (A+P)</div>
                        </div>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--v6-color-instant)' : 'var(--v6-border)'}`, background: isSelected ? 'var(--v6-color-instant)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', flexShrink: 0 }}>
                            {isSelected && '✓'}
                        </div>
                    </div>
                );
            })}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button onClick={onBack} style={{ padding: '11px 20px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'transparent', color: 'var(--v6-text-secondary)', fontSize: 'var(--v6-fs-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>← Nazad</button>
                <button onClick={onNext}
                    style={{ padding: '11px 24px', background: 'var(--v6-accent)', color: 'var(--v6-accent-text)', border: 'none', borderRadius: 'var(--v6-radius-md)', fontSize: 'var(--v6-fs-sm)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>
                    {packageWizardSelections.transferId ? 'Izaberi ekstra →' : 'Preskoči (bez transfera) →'}
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// KORAK 5: Aktivnosti & Osiguranje
// ─────────────────────────────────────────────────────────────
const Step5Extras: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
    const { packageWizardSelections, togglePackageWizardExtra } = useSearchStore();

    const categories = [
        { key: 'tour',      label: 'Izleti', icon: <Map size={16} /> },
        { key: 'sport',     label: 'Sport & Avantura', icon: <Activity size={16} /> },
        { key: 'culture',   label: 'Kultura', icon: <Music size={16} /> },
        { key: 'food',      label: 'Gastronomija', icon: <Utensils size={16} /> },
        { key: 'wellness',  label: 'Wellness', icon: <Heart size={16} /> },
        { key: 'insurance', label: 'Osiguranje', icon: <ShieldCheck size={16} /> },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 'var(--v6-fs-lg)', fontWeight: 800, color: 'var(--v6-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Ticket size={22} color="var(--v6-accent)" /> Dodaj aktivnosti i osiguranje
                </h3>
                <p style={{ margin: 0, fontSize: 'var(--v6-fs-xs)', color: 'var(--v6-text-muted)' }}>
                    Izaberite šta sve želite da dodate u paket. Sve je opciono.
                </p>
            </div>

            {categories.map(cat => {
                const items = MOCK_ACTIVITIES.filter(a => a.category === cat.key);
                if (items.length === 0) return null;
                return (
                    <div key={cat.key}>
                        <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--v6-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {cat.icon} {cat.label}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {items.map(act => {
                                const isSelected = packageWizardSelections.extraIds.includes(act.id);
                                return (
                                    <div key={act.id} onClick={() => togglePackageWizardExtra(act.id)}
                                        style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 14px', border: `1.5px solid ${isSelected ? 'var(--v6-color-instant)' : 'var(--v6-border)'}`, borderRadius: 'var(--v6-radius-md)', background: isSelected ? 'var(--v6-color-instant-bg)' : 'var(--v6-bg-card)', cursor: 'pointer', transition: 'all 0.15s' }}>
                                        <span style={{ flexShrink: 0, color: isSelected ? 'var(--v6-color-instant)' : 'var(--v6-text-muted)' }}>{cat.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 'var(--v6-fs-sm)', fontWeight: 700, color: 'var(--v6-text-primary)' }}>{act.title}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{act.description}</div>
                                            {act.durationHours > 0 && <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', marginTop: '4px' }}>⏱ {act.durationHours}h {act.departureTime ? `· Polazak ${act.departureTime}` : ''}</div>}
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                                                {act.includes.slice(0, 3).map(inc => <span key={inc} style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--v6-bg-section)', border: '1px solid var(--v6-border)', borderRadius: '4px', color: 'var(--v6-text-muted)' }}>✓ {inc}</span>)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: 'var(--v6-fs-lg)', fontWeight: 900, color: 'var(--v6-text-primary)' }}>{formatPrice(act.totalPrice)}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', whiteSpace: 'nowrap' }}>za grupu</div>
                                        </div>
                                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--v6-color-instant)' : 'var(--v6-border)'}`, background: isSelected ? 'var(--v6-color-instant)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', flexShrink: 0 }}>
                                            {isSelected && '✓'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={onBack} style={{ padding: '11px 20px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'transparent', color: 'var(--v6-text-secondary)', fontSize: 'var(--v6-fs-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>← Nazad</button>
                <button onClick={onNext}
                    style={{ padding: '11px 24px', background: 'var(--v6-accent)', color: 'var(--v6-accent-text)', border: 'none', borderRadius: 'var(--v6-radius-md)', fontSize: 'var(--v6-fs-sm)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>
                    {packageWizardSelections.extraIds.length > 0 ? `Pregled paketa (${packageWizardSelections.extraIds.length} extras) →` : 'Preskoči → Pregled'}
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// KORAK 6: Pregled Paketa
// ─────────────────────────────────────────────────────────────
const Step6Summary: React.FC<{ onBack: () => void; onBook: (total: number) => void }> = ({ onBack, onBook }) => {
    const { packageWizardSelections, roomAllocations, checkIn, checkOut } = useSearchStore();
    const pax = calcPaxSummary(roomAllocations, checkIn, checkOut);

    const selectedFlight = packageWizardSelections.flight;
    const selectedHotel = MOCK_HOTEL_RESULTS.find(h => h.id === packageWizardSelections.hotelId);
    const selectedRoom = MOCK_ROOM_OPTIONS.find(r => r.id === packageWizardSelections.roomId);
    const selectedMeal = selectedRoom?.mealPlans.find(m => m.code === packageWizardSelections.mealPlanCode);
    const selectedTransfer = MOCK_TRANSFERS.find(t => t.id === packageWizardSelections.transferId);
    const selectedExtras = MOCK_ACTIVITIES.filter(a => packageWizardSelections.extraIds.includes(a.id));

    const items: { icon: React.ReactNode; label: string; detail: string; price: number }[] = [];
    if (selectedFlight) items.push({ icon: <Plane size={20} />, label: `Let: ${selectedFlight.airline}`, detail: `${selectedFlight.outbound.segments[0].origin} → ${selectedFlight.outbound.segments[selectedFlight.outbound.segments.length - 1].destination}${selectedFlight.inbound ? ' (povratni)' : ''}`, price: selectedFlight.totalPrice });
    if (selectedHotel && selectedRoom && selectedMeal) items.push({ icon: <Hotel size={20} />, label: selectedHotel.name, detail: `${selectedRoom.name} · ${selectedMeal.label} · ${pax.nights} noćenja`, price: selectedMeal.totalPrice });
    if (selectedTransfer) items.push({ icon: <Bus size={20} />, label: selectedTransfer.vehicle, detail: `${selectedTransfer.from} ↔ Hotel`, price: selectedTransfer.totalPrice });
    selectedExtras.forEach(e => items.push({ icon: <Ticket size={20} />, label: e.title, detail: e.description.slice(0, 60) + '...', price: e.totalPrice }));

    const grandTotal = items.reduce((s, i) => s + i.price, 0);

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--v6-fs-lg)', fontWeight: 800, color: 'var(--v6-text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={24} color="var(--v6-color-instant)" /> Pregled vašeg paketa
            </h3>

            {/* PAX sažetak */}
            <div style={{ padding: '12px 16px', background: 'var(--v6-bg-section)', borderRadius: 'var(--v6-radius-md)', border: '1px solid var(--v6-border)', fontSize: '13px', color: 'var(--v6-text-secondary)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> <strong style={{ color: 'var(--v6-text-primary)' }}>{formatDate(checkIn)} — {formatDate(checkOut)}</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> <strong style={{ color: 'var(--v6-text-primary)' }}>{pax.nights} noćenja</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> <strong style={{ color: 'var(--v6-text-primary)' }}>{pax.totalAdults} odr.{pax.totalChildren > 0 ? ` + ${pax.totalChildren} dece` : ''}</strong></span>
            </div>

            {/* Stavke */}
            <div style={{ border: '1px solid var(--v6-border)', borderRadius: 'var(--v6-radius-lg)', overflow: 'hidden' }}>
                {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '14px 16px', borderBottom: i < items.length - 1 ? '1px solid var(--v6-border)' : 'none', background: 'var(--v6-bg-card)' }}>
                        <span style={{ color: 'var(--v6-text-muted)', flexShrink: 0 }}>{item.icon}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 'var(--v6-fs-sm)', fontWeight: 700, color: 'var(--v6-text-primary)' }}>{item.label}</div>
                            <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', marginTop: '2px' }}>{item.detail}</div>
                        </div>
                        <div style={{ fontSize: 'var(--v6-fs-lg)', fontWeight: 800, color: 'var(--v6-text-primary)', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatPrice(item.price)}</div>
                    </div>
                ))}

                {/* Grand Total */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--v6-bg-section)', borderTop: '2px solid var(--v6-border)' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v6-text-muted)' }}>UKUPNO ZA VAŠ PAKET</div>
                        <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', marginTop: '2px' }}>
                            {pax.totalAdults} odr.{pax.totalChildren > 0 ? ` + ${pax.totalChildren} dece` : ''} · {pax.nights} noćenja · {items.length} stavki
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--v6-color-instant-text)', lineHeight: 1 }}>{formatPrice(grandTotal)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', marginTop: '3px' }}>≈ {formatPrice(Math.round(grandTotal / Math.max(pax.totalAdults, 1)))}/os</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={onBack} style={{ padding: '11px 20px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'transparent', color: 'var(--v6-text-secondary)', fontSize: 'var(--v6-fs-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>← Izmeni</button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => onBook(grandTotal)}
                        style={{ padding: '13px 28px', background: 'var(--v6-color-instant)', color: '#ffffff', border: 'none', borderRadius: 'var(--v6-radius-md)', fontSize: 'var(--v6-fs-md)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>
                        🏁 Rezerviši paket — {formatPrice(grandTotal)}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// MAIN: PackageWizard
// ─────────────────────────────────────────────────────────────
interface PackageWizardProps {
    onComplete: (total: number) => void;
}

export const PackageWizard: React.FC<PackageWizardProps> = ({ onComplete }) => {
    const { packageWizardStep, packageWizardSelections, setPackageWizardStep, roomAllocations, checkIn, checkOut } = useSearchStore();

    const pax = calcPaxSummary(roomAllocations, checkIn, checkOut);
    const paxTotal = pax.totalAdults + pax.totalChildren;

    // Maksimalni dosegnuti korak (za Stepper navigaciju)
    const maxReached = packageWizardStep;

    // Podaci za Price Build-Up
    const selectedFlight = packageWizardSelections.flight;
    const selectedHotel  = MOCK_HOTEL_RESULTS.find(h => h.id === packageWizardSelections.hotelId);
    const selectedRoom   = MOCK_ROOM_OPTIONS.find(r => r.id === packageWizardSelections.roomId);
    const selectedMeal   = selectedRoom?.mealPlans.find(m => m.code === packageWizardSelections.mealPlanCode);
    const selectedTransfer = MOCK_TRANSFERS.find(t => t.id === packageWizardSelections.transferId);
    const selectedExtras = MOCK_ACTIVITIES.filter(a => packageWizardSelections.extraIds.includes(a.id));

    const renderStep = () => {
        switch (packageWizardStep) {
            case 1: return <Step1Search onNext={() => setPackageWizardStep(2)} />;
            case 2: return <Step2Flights onNext={() => setPackageWizardStep(3)} onBack={() => setPackageWizardStep(1)} />;
            case 3: return <Step3Hotels  onNext={() => setPackageWizardStep(4)} onBack={() => setPackageWizardStep(2)} />;
            case 4: return <Step4Transfer onNext={() => setPackageWizardStep(5)} onBack={() => setPackageWizardStep(3)} />;
            case 5: return <Step5Extras  onNext={() => setPackageWizardStep(6)} onBack={() => setPackageWizardStep(4)} />;
            case 6: return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: 'var(--v6-bg-section)', padding: '24px', borderRadius: 'var(--v6-radius-xl)', border: '1.5px solid var(--v6-border)', textAlign: 'center' }}>
                        <span style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}>🎉</span>
                        <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--v6-text-primary)', margin: '0 0 8px' }}>Vaš paket je spreman!</h2>
                        <p style={{ color: 'var(--v6-text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px' }}>
                            Pregledajte sve segmente u desnom panelu. Možete ih izmeniti, sačuvati ponudu za kasnije ili odmah rezervisati.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button 
                                onClick={() => {
                                    useSearchStore.getState().saveOffer({
                                        id: `pkg-${Date.now()}`,
                                        type: 'package',
                                        label: `Komplet Aranžman (${pax.nights} noći)`,
                                        description: `Hotel, Let, Transfer i Extras`,
                                        totalPrice: 1250, // This would be calculated from real selection
                                        currency: 'EUR',
                                        timestamp: Date.now(),
                                        data: { packageWizardSelections, roomAllocations, checkIn, checkOut },
                                        hasPriceDropAlert: false
                                    });
                                    alert('Paket je sačuvan u Vaš folder!');
                                }}
                                style={{
                                    padding: '12px 20px',
                                    background: 'var(--v6-bg-card)',
                                    border: '1.5px solid var(--v6-border)',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                💾 Sačuvaj Paket
                            </button>
                            <button 
                                onClick={() => alert('Opcije za deljenje: Viber, WhatsApp, Telegram, Email...')}
                                style={{
                                    padding: '12px 20px',
                                    background: 'var(--v6-bg-card)',
                                    border: '1.5px solid var(--v6-border)',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                🔗 Podeli Ponudu
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <button onClick={() => setPackageWizardStep(5)} style={{ padding: '11px 20px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'transparent', color: 'var(--v6-text-secondary)', fontSize: 'var(--v6-fs-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>← Nazad</button>
                        <button 
                            onClick={() => onComplete(1250)}
                            style={{ padding: '13px 32px', background: 'var(--v6-color-instant)', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 20px rgba(5,150,105,0.2)' }}>
                            🏁 Rezerviši Sve Odmah
                        </button>
                    </div>
                </div>
            );
            default: return null;
        }
    };

    return (
        /* The main grid layout that unifies form, results, and sidebar */
        <div className="v6-package-main-layout">
            {/* ═ ROW 1: Stepper (Full Width 95%) ═ */}
            <div style={{ gridColumn: '1 / span 2', marginBottom: '8px' }}>
                <Stepper currentStep={packageWizardStep} onStepClick={setPackageWizardStep} maxReached={maxReached} />
            </div>

            {/* ═ ROW 2: Search Form (Only Step 1 - Full Width 95%) ═ */}
            {packageWizardStep === 1 && (
                <div 
                    className="v6-fade-in"
                    style={{
                        gridColumn: '1 / span 2',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '24px',
                        padding: '32px',
                        boxShadow: 'var(--shadow-md)',
                        marginBottom: '32px'
                    }}
                >
                    {renderStep()}
                </div>
            )}

            {/* ═ ROW 3: Selection Content (Steps 2+ - Left Column 75%) ═ */}
            {(packageWizardStep > 1 || packageWizardStep === 1) && (
                <div 
                    className="v6-fade-in" 
                    key={packageWizardStep}
                    style={{
                        gridColumn: '1',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '32px'
                    }}
                >
                    {/* If Step 2+, show current selection process */}
                    {packageWizardStep > 1 && (
                        <div style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '24px',
                            padding: '32px',
                            boxShadow: 'var(--shadow-md)'
                        }}>
                             {renderStep()}
                        </div>
                    )}

                    {/* If Step 1, show Trendy Paketi (Results Sector) */}
                    {packageWizardStep === 1 && (
                        <div style={{ padding: '0 0' }}>
                            <div className="v6-results-list-wrapper">
                                {MOCK_TOUR_RESULTS.slice(0, 3).map((tour, idx) => (
                                    <TourCard key={tour.id} tour={tour} index={idx} viewMode="list" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═ SIDEBAR: Persistent Floating Stack (Right Column 25%) ═ */}
            {/* It will automatically find its place in the grid, starting from the first available Row 2 Col 2 or Row 3 Col 2 */}
            <aside 
                 className="v6-package-sidebar-sticky"
                 style={{ 
                    position: 'sticky', 
                    top: '120px',
                    gridColumn: '2',
                    /* If we are in Step 1, grid will push this to next available row on the right */
                 }}
            >
                <PackageLiveStack />
            </aside>
        </div>
    );
};

export default PackageWizard;
