import React, { useState } from 'react';
import { useSearchStore, calcPaxSummary } from '../../stores/useSearchStore';
import { OccupancyWizard } from '../OccupancyWizard/OccupancyWizard';
import { MultiSelectDropdown } from '../../../../components/MultiSelectDropdown';
import { ExpediaCalendar } from '../../../../components/ExpediaCalendar';
import { BudgetTypeToggle } from '../../../../components/BudgetTypeToggle';
import type { Destination, SearchAlert } from '../../types';
import { Calendar, Globe, DollarSign, UtensilsCrossed, Users, Plus, Trash2, ChevronDown, MapPin, Sparkles, Search, Building2, Flag } from 'lucide-react';
import { SearchModeSelector } from '../SearchModeSelector';
import { AIAssistantField } from '../AIAssistantField';
import { performSmartSearch } from '../../../../services/smartSearchService';
import type { HotelSearchResult, AvailabilityStatus, ProviderId } from '../../types';

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

// Orchestrator (smartSearchService) handles the actual API calls.

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
        searchMode,
        setSearchMode,
        semanticQuery,
        setSemanticQuery,
    } = useSearchStore();

    const [destInput, setDestInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showNationalityPicker, setShowNationalityPicker] = useState(false);
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [nationalitySearch, setNationalitySearch] = useState('');

    const autocompleteResults = [
        { id: 'solvex-9', name: 'Bansko', type: 'city', sub: 'Bugarska (Solvex)', provider: 'Solvex' },
        { id: 'solvex-33', name: 'Zlatni Pjasci', type: 'city', sub: 'Bugarska (Solvex)', provider: 'Solvex' },
        { id: 'solvex-68', name: 'Sunčev Breg', type: 'city', sub: 'Bugarska (Solvex)', provider: 'Solvex' },
        { id: 'solvex-1', name: 'Nesebar', type: 'city', sub: 'Bugarska (Solvex)', provider: 'Solvex' },
        { id: 'solvex-6', name: 'Borovets', type: 'city', sub: 'Bugarska (Solvex)', provider: 'Solvex' },
        { id: 'solvex-10', name: 'Pamporovo', type: 'city', sub: 'Bugarska (Solvex)', provider: 'Solvex' },
        { id: '2', name: 'Atina', type: 'city', sub: 'Grčka' },
        { id: '3', name: 'Sani Beach', type: 'hotel', sub: 'Halkidiki, Grčka' },
    ].filter(item => item.name.toLowerCase().includes(destInput.toLowerCase()));

    // Filtrirane nacionalnosti za search
    const filteredNationalities = NATIONALITY_OPTIONS.filter(n =>
        n.label.toLowerCase().includes(nationalitySearch.toLowerCase())
    );

    // ── Destinacija logika ───────────────────────────────────
    const handleSelectOption = (item: any) => {
        const fullName = item.type === 'country' ? item.name : 
                         item.type === 'city' ? `${item.name} (${item.sub})` :
                         `${item.name} (${item.sub})`;
        
        const newDestination = {
            id: `dest-${Date.now()}`,
            name: fullName,
            type: item.type,
            country: item.type === 'country' ? item.name : '',
            provider: item.provider, // Ensure provider is passed if available
        };

        addDestination(newDestination);
        setDestInput('');
        setShowAutocomplete(false);

        // --- PREFETCH LOGIC ---
        // Ako već imamo datume, iniciramo "tihu" pretragu u pozadini
        // Rezultati će se keširati u smartSearchService
        if (checkIn && checkOut) {
            console.log('[HotelSearchForm] Prefetching for:', newDestination.name);
            performSmartSearch({
                searchType: 'hotel',
                destinations: [{
                    id: newDestination.id,
                    name: newDestination.name,
                    type: newDestination.type as any,
                    provider: newDestination.provider
                }],
                checkIn,
                checkOut,
                roomConfig: roomAllocations,
                nationality: nationality,
                enabledProviders: { solvex: true }
            }).catch(err => console.warn('[Prefetch] Background prefetch failed (silent)', err));
        }
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
        setSearchPerformed(true);

        try {
            console.log('[HotelSearchForm] Starting live search for:', destinations.map(d => d.name));
            
            const apiResults = await performSmartSearch({
                searchType: 'hotel',
                destinations: destinations.map(d => ({
                    id: d.id,
                    name: d.name,
                    type: d.type as any,
                    provider: d.provider
                })),
                checkIn,
                checkOut,
                roomConfig: roomAllocations,
                nationality: nationality,
                enabledProviders: { solvex: true }
            });

            const paxSummary = calcPaxSummary(roomAllocations, checkIn, checkOut);

            // Mapiraj API rezultate u V6 format
            const mappedResults: HotelSearchResult[] = apiResults.map(r => {
                const status: AvailabilityStatus = 
                    r.availability === 'available' ? 'instant' : 
                    (r.availability === 'on-request' || r.availability === 'on_request' ? 'on-request' : 'sold-out');

                const [city, country] = (r.location || '').split(',').map((s: string) => s.trim());

                // Regrupisanje soba: Service format (Room-Meal) -> V6 format (Room -> MealPlans)
                const roomOptionsMap = new Map<string, any>();
                
                if (r.rooms && Array.isArray(r.rooms)) {
                    r.rooms.forEach((srvRoom: any) => {
                        const roomName = srvRoom.name;
                        if (!roomOptionsMap.has(roomName)) {
                            roomOptionsMap.set(roomName, {
                                id: srvRoom.id,
                                name: roomName,
                                description: srvRoom.description || '',
                                maxAdults: srvRoom.capacity || 2,
                                maxChildren: 2,
                                maxOccupancy: (srvRoom.capacity || 2) + 2,
                                mealPlans: []
                            });
                        }
                        
                        const v6Room = roomOptionsMap.get(roomName);
                        v6Room.mealPlans.push({
                            code: srvRoom.mealPlan || 'RO',
                            label: srvRoom.mealPlan || 'Smeštaj',
                            totalPrice: srvRoom.price,
                            pricePerPersonPerNight: srvRoom.price / (paxSummary.nights * paxSummary.totalAdults || 1),
                            status: srvRoom.availability === 'available' ? 'instant' : 'on-request',
                            isRefundable: true, // Solvex standardno dozvoljava otkaz določenog datuma
                            cancellationDeadline: srvRoom.cancellationPolicyRequestParams?.DateFrom
                        });
                    });
                }

                return {
                    id: r.id,
                    name: r.name,
                    stars: r.stars || 0,
                    images: r.images && r.images.length > 0 ? r.images : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800"],
                    location: {
                        city: city || r.location || '',
                        country: country || '',
                    },
                    isPrime: r.provider === 'Solvex',
                    priority: r.provider === 'Solvex' ? 80 : 50,
                    lowestTotalPrice: r.price,
                    lowestMealPlanLabel: r.mealPlan || (r.mealPlans && r.mealPlans[0]) || 'Smeštaj',
                    currency: r.currency || 'EUR',
                    status: status,
                    roomOptions: Array.from(roomOptionsMap.values()),
                    primaryProvider: {
                        id: (r.provider.toLowerCase() as ProviderId),
                        hotelKey: r.id,
                        price: r.price,
                        currency: r.currency || 'EUR'
                    }
                };
            });

            setResults(mappedResults);
            
            if (mappedResults.length === 0) {
                addAlert({
                    id: 'no-results-found',
                    severity: 'info',
                    message: 'Nema dostupnih hotela za tražene parametre kod Solvex-a.'
                });
            }
        } catch (error) {
            console.error('[HotelSearchForm] API Search failed:', error);
            addAlert({
                id: 'search-api-error',
                severity: 'error',
                message: 'Došlo je do greške pri komunikaciji sa Solvex API-jem. Molimo pokušajte ponovo.'
            });
        } finally {
            setIsSubmitting(false);
            setIsSearching(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <form onSubmit={handleSearch} className="v6-search-form-advanced" noValidate>
            
            {/* 1. SELECTION MODES */}
            <SearchModeSelector />

            {/* 2. AI ASSISTANT FIELD */}
            {(searchMode === 'semantic' || searchMode === 'hybrid') && <AIAssistantField />}

            {/* 3. HERO SEARCH (Standard Destinacija - Hidden in pure Semantic) */}
            {searchMode !== 'semantic' && (
                <div className="v6-search-primary-row">
                    <div className="v6-hero-input-wrapper">
                        {/* ... rest of the destination logic remains same ... */}
                    <div className="v6-hero-icon-faint">
                        <Search className="icon-luxury" size={28} />
                    </div>
                    
                    {/* Tags for destination if any */}
                    <div className="v6-search-tags-overlay" style={{
                        position: 'absolute', left: '60px', top: '50%', transform: 'translateY(-50%)',
                        display: 'flex', gap: '8px', pointerEvents: 'none', zIndex: 5
                    }}>
                        {destinations.map(d => (
                            <span key={d.id} style={{
                                padding: '6px 14px', background: 'var(--v6-accent)', color: 'var(--v6-accent-text)',
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
            )}

            {/* 4. CONTROLS ROW (Bottom - Hidden in pure Semantic) */}
            {searchMode !== 'semantic' && (
                <div className="v6-search-controls-row">
                
                {/* DATES - Equal Width */}
                <div className="v6-field-icon-wrapper v6-ctrl-box" onClick={() => setShowCalendar(true)}>
                    <div className="v6-field-icon-faint"><Calendar className="icon-luxury" size={20} /></div>
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
                    <div className="v6-field-icon-faint"><Users className="icon-luxury" size={20} /></div>
                    <div style={{ width: '100%' }}>
                        <OccupancyWizard />
                    </div>
                </div>

                {/* MEAL PLANS */}
                <div className="v6-field-icon-wrapper v6-ctrl-box">
                    <div className="v6-field-icon-faint"><UtensilsCrossed className="icon-luxury" size={18} /></div>
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
                    <div className="v6-field-icon-faint"><DollarSign className="icon-luxury" size={20} /></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--v6-text-muted)' }}>Ukupni budžet do</span>
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
                <div className="v6-field-icon-wrapper v6-ctrl-box" style={{ position: 'relative' }}>
                    <div className="v6-field-icon-faint"><Globe className="icon-luxury" size={20} /></div>
                    <div className="v6-field-input" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', paddingRight: '12px' }}>
                        <input 
                            type="text"
                            placeholder="Zemlja / Passport"
                            value={showNationalityPicker ? nationalitySearch : (nationality === 'RS' ? 'Srbija' : NATIONALITY_OPTIONS.find(n => n.value === nationality)?.label)}
                            onChange={(e) => {
                                setNationalitySearch(e.target.value);
                                if (!showNationalityPicker) setShowNationalityPicker(true);
                            }}
                            onFocus={() => {
                                setShowNationalityPicker(true);
                                setNationalitySearch('');
                            }}
                            className="v6-field-input-clean"
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontWeight: 600 }}
                        />
                        <ChevronDown 
                            size={14} 
                            style={{ opacity: 0.4, cursor: 'pointer' }} 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowNationalityPicker(!showNationalityPicker);
                            }}
                        />
                        
                        {showNationalityPicker && (
                            <div style={{ 
                                position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 1100, 
                                background: 'var(--v6-bg-card)', border: '1px solid var(--v6-border)', 
                                borderRadius: '12px', padding: '8px', boxShadow: 'var(--v6-shadow-lg)', maxHeight: '250px', overflowY: 'auto'
                            }}>
                                {filteredNationalities.map(n => (
                                    <div 
                                        key={n.value} 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setNationality(n.value); 
                                            setShowNationalityPicker(false);
                                            setNationalitySearch('');
                                        }}
                                        className="v6-autocomplete-item"
                                        style={{ padding: '8px 12px', fontSize: '14px' }}
                                    >
                                        {n.label}
                                    </div>
                                ))}
                                {filteredNationalities.length === 0 && (
                                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--v6-text-muted)', fontSize: '12px' }}>
                                        Nema rezultata
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* SEARCH BUTTON */}
                <button type="submit" className="v6-search-btn-advanced btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? '...' : (
                        <>
                            <Search className="icon-luxury" size={20} stroke="white" />
                            Traži
                        </>
                    )}
                </button>
                </div>
            )}

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
