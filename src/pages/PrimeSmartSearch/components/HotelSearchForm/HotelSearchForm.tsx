import React, { useState } from 'react';
import { useSearchStore } from '../../stores/useSearchStore';
import { OccupancyWizard } from '../OccupancyWizard/OccupancyWizard';
import { MultiSelectDropdown } from '../../../../components/MultiSelectDropdown';
import { ExpediaCalendar } from '../../../../components/ExpediaCalendar';
import { BudgetTypeToggle } from '../../../../components/BudgetTypeToggle';
import type { Destination, SearchAlert } from '../../types';
import { Calendar, Globe, DollarSign, UtensilsCrossed, Users, Plus, Trash2, ChevronDown, MapPin, Sparkles, Search, Building2, Flag } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// KONSTANTE (Nacionalnost i Usluge)
// ─────────────────────────────────────────────────────────────
const NATIONALITY_OPTIONS = [
    { value: 'RS', label: 'Srbija' },
    { value: 'BA', label: 'Bosna i Hercegovina' },
    { value: 'ME', label: 'Crna Gora' },
    { value: 'MK', label: 'Severna Makedonija' },
    { value: 'HR', label: 'Hrvatska' },
    { value: 'BG', label: 'Bugarska' },
    { value: 'RO', label: 'Rumunija' },
    { value: 'HU', label: 'Mađarska' },
    { value: 'GR', label: 'Grčka' },
    { value: 'AL', label: 'Albanija' },
    { value: 'TR', label: 'Turska' },
    { value: 'DE', label: 'Nemačka' },
    { value: 'AT', label: 'Austrija' },
    { value: 'CH', label: 'Švajcarska' },
    { value: 'RU', label: 'Rusija' },
    { value: 'US', label: 'SAD' },
    { value: 'GB', label: 'Velika Britanija' },
    { value: 'IT', label: 'Italija' },
    { value: 'FR', label: 'Francuska' },
    { value: 'ES', label: 'Španija' },
];

const MEAL_PLAN_OPTIONS = [
    { value: 'all', label: 'Sve Usluge' },
    { value: 'RO', label: 'Samo smeštaj' },
    { value: 'BB', label: 'Doručak' },
    { value: 'HB', label: 'Polupansion' },
    { value: 'FB', label: 'Pun pansion' },
    { value: 'AI', label: 'All Inclusive' },
    { value: 'UAI', label: 'Ultra All Inclusive' }
];

// ─────────────────────────────────────────────────────────────
// VALIDACIJA PRETRAGE
// ─────────────────────────────────────────────────────────────
const validateSearch = (
    destinations: Destination[],
    checkIn: string,
    checkOut: string
): SearchAlert[] => {
    const alerts: SearchAlert[] = [];

    if (destinations.length === 0) {
        alerts.push({
            id: 'no-destination',
            severity: 'warning',
            message: 'Molimo unesite destinaciju pretrage.',
        });
    }

    if (!checkIn || !checkOut) {
        alerts.push({
            id: 'no-dates',
            severity: 'warning',
            message: 'Molimo odaberite datum dolaska i odlaska.',
        });
    }

    if (checkIn && checkOut) {
        const nights = Math.round(
            (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (nights < 1) {
            alerts.push({
                id: 'invalid-dates',
                severity: 'warning',
                message: 'Datum odlaska mora biti posle datuma dolaska.',
            });
        }
        if (nights < 3) {
            alerts.push({
                id: 'min-stay',
                severity: 'info',
                message: `ℹ️ Napomena: Za neke hotele važi minimalan boravak od 3 noćenja. Prikazaćemo samo dostupne opcije za ${nights} noć(i).`,
            });
        }
    }

    return alerts;
};

// ─────────────────────────────────────────────────────────────
// MOCK: Simulacija pretrage (zameniće Orchestrator u Fazi 4)
// ─────────────────────────────────────────────────────────────
const mockSearch = async (): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, 1800));
};

// ─────────────────────────────────────────────────────────────
// HOTEL SEARCH FORM
// ─────────────────────────────────────────────────────────────
export const HotelSearchForm: React.FC = () => {
    const {
        destinations,
        checkIn,
        checkOut,
        flexDays,
        roomAllocations,
        nationality,
        filters,
        setCheckIn,
        setCheckOut,
        setFlexDays,
        addDestination,
        removeDestination,
        setNationality,
        updateFilter,
        addRoom,
        removeRoom,
        updateRoomAllocation,
        setIsSearching,
        setResults,
        setSearchPerformed,
        addAlert,
        dismissAlert,
    } = useSearchStore();

    const [destInput, setDestInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showNationalityPicker, setShowNationalityPicker] = useState(false);
    const [searchMode, setSearchMode] = useState<'classic' | 'semantic'>('classic');
    const [showAutocomplete, setShowAutocomplete] = useState(false);

    // Mock podaci za autocomplete (Faza 4 će ovo puniti iz API-ja)
    const autocompleteResults = [
        { id: '1', name: 'Grčka', type: 'country', sub: 'Država' },
        { id: '2', name: 'Atina', type: 'city', sub: 'Grčka' },
        { id: '3', name: 'Hotel Grande Bretagne', type: 'hotel', sub: 'Atina, Grčka' },
    ].filter(item => item.name.toLowerCase().includes(destInput.toLowerCase()));

    // ── Destinacija logika ───────────────────────────────────
    const handleSelectOption = (item: any) => {
        const fullName = item.type === 'country' ? item.name : 
                         item.type === 'city' ? `${item.name} (${item.sub})` :
                         `${item.name} (${item.sub})`;
        
        addDestination({
            id: `dest-${Date.now()}`,
            name: fullName,
            type: item.type,
            country: item.type === 'country' ? item.name : '',
        });
        setDestInput('');
        setShowAutocomplete(false);
    };
    const handleDestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === ',') && destInput.trim()) {
            e.preventDefault();
            addDestination({
                id: `dest-${Date.now()}`,
                name: destInput.trim(),
                type: 'city',
                country: '',
            });
            setDestInput('');
        }
    };

    // ── Submit ───────────────────────────────────────────────
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        // Dimiss prethodnih upozorenja
        ['no-destination', 'no-dates', 'invalid-dates', 'min-stay'].forEach(dismissAlert);

        // Validacija
        const validationAlerts = validateSearch(destinations, checkIn, checkOut);
        if (validationAlerts.some(a => a.severity === 'warning')) {
            validationAlerts.forEach(addAlert);
            return;
        }
        validationAlerts.forEach(addAlert); // Informacije koje propuste validaciju

        // Pokreni pretragu
        setIsSubmitting(true);
        setIsSearching(true);

        try {
            await mockSearch();
            // Faza 4: Orchestrator će popuniti ove rezultate
            setResults([]); // Prazno dok nema pravog Orchestratora
        } finally {
            setIsSubmitting(false);
            setIsSearching(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <form onSubmit={handleSearch} className="v6-search-form-advanced" noValidate>
            
            {/* 1. SELECTION MODES (Classic / Semantic) */}
            <div className="v6-search-modes">
                <button 
                    type="button"
                    className={`v6-mode-tab ${searchMode === 'classic' ? 'v6-active' : ''}`}
                    onClick={() => setSearchMode('classic')}
                >
                    Klasična pretraga
                </button>
                <button 
                    type="button"
                    className={`v6-mode-tab ${searchMode === 'semantic' ? 'v6-active' : ''}`}
                    onClick={() => setSearchMode('semantic')}
                >
                    <div className="v6-ai-icon-frame">
                        <Sparkles size={14} />
                    </div>
                    Semantička pretraga
                </button>
            </div>

            {/* 2. HERO SEARCH (Full Width) */}
            <div className="v6-search-primary-row">
                <div className="v6-hero-input-wrapper">
                    <div className="v6-hero-icon-faint">
                        <Search size={28} color="var(--v6-accent)" />
                    </div>
                    
                    {/* Tags for destination if any */}
                    <div className="v6-search-tags-overlay" style={{
                        position: 'absolute', left: '60px', top: '50%', transform: 'translateY(-50%)',
                        display: 'flex', gap: '8px', pointerEvents: 'none', zIndex: 5
                    }}>
                        {destinations.map(d => (
                            <span key={d.id} style={{
                                padding: '6px 14px', background: 'var(--v6-accent)', color: 'white',
                                borderRadius: '12px', fontSize: '14px', fontWeight: 700, pointerEvents: 'auto',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                                {d.name}
                                <button type="button" onClick={() => removeDestination(d.id)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                            </span>
                        ))}
                    </div>

                    <input 
                        className="v6-hero-input"
                        type="text"
                        placeholder={destinations.length > 0 ? "" : "Unesite državu, destinaciju ili hotel..."}
                        value={destInput}
                        onChange={(e) => {
                            setDestInput(e.target.value);
                            setShowAutocomplete(e.target.value.length > 1);
                        }}
                        onFocus={() => destInput.length > 1 && setShowAutocomplete(true)}
                        style={{ paddingLeft: destinations.length > 0 ? `${(destinations.length * 140) + 60}px` : '60px' }}
                    />

                    {/* Autocomplete Panel */}
                    {showAutocomplete && destInput && (
                        <div className="v6-autocomplete-panel">
                            {autocompleteResults.map(item => (
                                <div key={item.id} className="v6-autocomplete-item" onClick={() => handleSelectOption(item)}>
                                    <div className="v6-item-type-icon">
                                        {item.type === 'country' && <Flag size={18} />}
                                        {item.type === 'city' && <MapPin size={18} />}
                                        {item.type === 'hotel' && <Building2 size={18} />}
                                    </div>
                                    <div>
                                        <div className="v6-item-main-text">{item.name}</div>
                                        <div className="v6-item-sub-text">{item.sub}</div>
                                    </div>
                                </div>
                            ))}
                            {autocompleteResults.length === 0 && (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--v6-text-muted)' }}>
                                    Nema rezultata za "{destInput}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. CONTROLS ROW (Bottom) */}
            <div className="v6-search-controls-row">
                
                {/* DATES - Equal Width */}
                <div className="v6-field-icon-wrapper v6-ctrl-box" onClick={() => setShowCalendar(true)}>
                    <div className="v6-field-icon-faint"><Calendar size={20} /></div>
                    <div className="v6-field-input" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {checkIn ? (
                            <>
                                <span>{new Date(checkIn).toLocaleDateString('sr-RS')}</span>
                                <span style={{ opacity: 0.3 }}>-</span>
                                <span>{new Date(checkOut).toLocaleDateString('sr-RS')}</span>
                            </>
                        ) : null}
                    </div>
                </div>

                {/* OCCUPANCY - Equal Width */}
                <div className="v6-field-icon-wrapper v6-ctrl-box">
                    <div className="v6-field-icon-faint"><Users size={20} /></div>
                    <div style={{ width: '100%' }}>
                        <OccupancyWizard />
                    </div>
                </div>

                {/* MEAL PLANS */}
                <div className="v6-field-icon-wrapper v6-ctrl-box">
                    <div className="v6-field-icon-faint"><UtensilsCrossed size={18} /></div>
                    <div style={{ width: '100%' }}>
                        <MultiSelectDropdown 
                            options={MEAL_PLAN_OPTIONS}
                            selected={filters.mealPlans || ['all']}
                            onChange={(val) => updateFilter('mealPlans', val)}
                            placeholder="Sve usluge"
                            displayType="codes"
                        />
                    </div>
                </div>

                {/* BUDGET */}
                <div className="v6-field-icon-wrapper v6-budget-container">
                    <div className="v6-field-icon-faint"><DollarSign size={20} /></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--v6-navy)' }}>Ukupni budžet do</span>
                        <input 
                            placeholder="" 
                            className="v6-field-input-clean" 
                            type="number"
                            value={filters.budgetTo}
                            onChange={e => updateFilter('budgetTo', e.target.value)}
                            style={{ 
                                flex: 1, 
                                background: 'transparent', 
                                border: 'none', 
                                outline: 'none', 
                                padding: 0, 
                                fontWeight: 800, 
                                fontSize: '15px', 
                                color: 'var(--v6-text-primary)',
                                boxShadow: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* NATIONALITY */}
                <div className="v6-field-icon-wrapper" onClick={() => setShowNationalityPicker(!showNationalityPicker)}>
                    <div className="v6-field-icon-faint"><Globe size={20} /></div>
                    <div className="v6-field-input" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{nationality === 'RS' ? '' : NATIONALITY_OPTIONS.find(n => n.value === nationality)?.label}</span>
                        <ChevronDown size={14} style={{ opacity: 0.4 }} />
                        
                        {showNationalityPicker && (
                            <div style={{ 
                                position: 'absolute', bottom: '105%', left: 0, right: 0, zIndex: 1100, 
                                background: 'var(--v6-bg-card)', border: '1px solid var(--v6-border)', 
                                borderRadius: '12px', padding: '8px', boxShadow: 'var(--v6-shadow-lg)', maxHeight: '300px', overflowY: 'auto'
                            }}>
                                {NATIONALITY_OPTIONS.map(n => (
                                    <div 
                                        key={n.value} 
                                        onClick={(e) => { e.stopPropagation(); setNationality(n.value); setShowNationalityPicker(false); }}
                                        className="v6-autocomplete-item"
                                        style={{ padding: '8px 12px', fontSize: '14px' }}
                                    >
                                        {n.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* SEARCH BUTTON */}
                <button type="submit" className="v6-search-btn-advanced" disabled={isSubmitting}>
                    {isSubmitting ? '...' : (
                        <>
                            <Search size={20} />
                            Traži
                        </>
                    )}
                </button>
            </div>

            {/* EXPEDIA CALENDAR MODAL */}
            {showCalendar && (
                <ExpediaCalendar
                    startDate={checkIn}
                    endDate={checkOut}
                    initialFlexibleDays={flexDays}
                    onChange={(start, end, flex) => {
                        setCheckIn(start);
                        setCheckOut(end);
                        if (flex !== undefined) setFlexDays(flex);
                    }}
                    onClose={() => setShowCalendar(false)}
                />
            )}
        </form>
    );
};

export default HotelSearchForm;
