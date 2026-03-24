import React, { useState } from 'react';
import { useSearchStore, calcPaxSummary } from '../../stores/useSearchStore';
import { OccupancyWizard } from '../OccupancyWizard/OccupancyWizard';
import { MultiSelectDropdown } from '../../../../components/MultiSelectDropdown';
import { ExpediaCalendar } from '../../../../components/ExpediaCalendar';
import { Calendar, Globe, UtensilsCrossed, Users, Search, Building2, Flag, MapPin, ChevronDown } from 'lucide-react';
import { SearchModeSelector } from '../SearchModeSelector';
import { AIAssistantField } from '../AIAssistantField';
import { performSmartSearch } from '../../../../services/smartSearchService';
import { normalizeMealPlan } from '../../../SmartSearch/helpers';
import { parseSearchIntent } from '../../../../services/ai/nlpParserService';
import { hybridSearchEngine } from '../../../../services/ai/HybridSearchService';
import type { Destination, SearchAlert, HotelSearchResult, AvailabilityStatus } from '../../types';

// ─────────────────────────────────────────────────────────────
// KONSTANTE
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
        alerts.push({ id: 'no-destination', severity: 'warning', message: 'Molimo unesite destinaciju pretrage.' });
    }
    if (!checkIn || !checkOut) {
        alerts.push({ id: 'no-dates', severity: 'warning', message: 'Molimo odaberite datum dolaska i odlaska.' });
    }
    if (checkIn && checkOut) {
        const d1 = new Date(checkIn);
        const d2 = new Date(checkOut);
        if (d2 <= d1) {
            alerts.push({ id: 'invalid-dates', severity: 'warning', message: 'Datum odlaska mora biti posle datuma dolaska.' });
        }
    }
    return alerts;
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
        setIsSearching,
        setResults,
        setSearchPerformed,
        addAlert,
        dismissAlert,
        searchMode,
        semanticQuery,
        setPendingClarification,
        setDateRangeResults,
        pendingClarification,
        dateRangeResults,
    } = useSearchStore();

    const [destInput, setDestInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showNationalityPicker, setShowNationalityPicker] = useState(false);
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [nationalitySearch, setNationalitySearch] = useState('');

    const autocompleteResults = [
        { id: 'solvex-9', name: 'Bansko', type: 'city' as const, sub: 'Bugarska (Solvex)', provider: 'Solvex' },
        { id: 'solvex-33', name: 'Zlatni Pjasci', type: 'city' as const, sub: 'Bugarska (Solvex)', provider: 'Solvex' },
        { id: 'solvex-68', name: 'Sunčev Breg', type: 'city' as const, sub: 'Bugarska (Solvex)', provider: 'Solvex' },
        { id: 'solvex-1', name: 'Nesebar', type: 'city' as const, sub: 'Bugarska (Solvex)', provider: 'Solvex' },
        { id: 'solvex-6', name: 'Borovets', type: 'city' as const, sub: 'Bugarska (Solvex)', provider: 'Solvex' },
        { id: 'solvex-10', name: 'Pamporovo', type: 'city' as const, sub: 'Bugarska (Solvex)', provider: 'Solvex' },
    ].filter(item => item.name.toLowerCase().includes(destInput.toLowerCase()));

    const filteredNationalities = NATIONALITY_OPTIONS.filter(n =>
        n.label.toLowerCase().includes(nationalitySearch.toLowerCase())
    );

    const handleSelectOption = (item: any) => {
        addDestination({
            id: item.id || `dest-${Date.now()}`,
            name: item.name,
            type: item.type,
            country: '',
            provider: item.provider,
        });
        setDestInput('');
        setShowAutocomplete(false);
    };

    const processResults = async (apiResults: any[]) => {
        const paxSummary = calcPaxSummary(roomAllocations, checkIn, checkOut);
        const currentFilters = useSearchStore.getState().filters;
        const selectedMealPlans = currentFilters.mealPlans || ['all'];
        const isAllMealPlans = selectedMealPlans.includes('all');

        const mappedResults = apiResults.map((r: any) => {
            if (!r) return null;
            
            // Availability mapping
            const status: AvailabilityStatus = 
                r.availability === 'available' ? 'instant' : 
                (r.availability === 'on-request' || r.availability === 'on_request' ? 'on-request' : 'sold-out');

            // Location
            let city = '';
            let country = '';
            if (typeof r.location === 'string') {
                const parts = r.location.split(',').map((s: string) => s.trim());
                city = parts[0] || '';
                country = parts[1] || '';
            } else if (r.location && typeof r.location === 'object') {
                city = r.location.city || '';
                country = r.location.country || '';
            }

            // Pricing & Meals Logic
            let overallLowestPrice = Infinity;
            let overallLowestMealPlan = 'Smeštaj';
            const filteredAllocationResults: Record<number, any[]> = {};

            if (r.allocationResults) {
                let totalLowestForHotel = 0;
                let hasMatchingRoomsForAllSlots = true;

                Object.entries(r.allocationResults).forEach(([slotIdx, rooms]) => {
                    const sIdx = parseInt(slotIdx);
                    const matchingRooms = (rooms as any[]).filter((rm: any) => {
                        if (isAllMealPlans) return true;
                        const norm = rm.mealPlan ? normalizeMealPlan(rm.mealPlan) : 'RO';
                        return selectedMealPlans.includes(norm);
                    });

                    if (matchingRooms.length === 0) {
                        hasMatchingRoomsForAllSlots = false;
                        return;
                    }

                    const minPriceInSlot = Math.min(...matchingRooms.map((rm: any) => rm.price));
                    totalLowestForHotel += minPriceInSlot;
                    filteredAllocationResults[sIdx] = matchingRooms;
                    
                    if (sIdx === 0) {
                        const cheapestRoom = matchingRooms.find((rm: any) => rm.price === minPriceInSlot);
                        overallLowestMealPlan = cheapestRoom?.mealPlan || 'Smeštaj';
                    }
                });

                if (hasMatchingRoomsForAllSlots) {
                    overallLowestPrice = totalLowestForHotel;
                } else {
                    return null; 
                }
            } else if (r.provider === 'AI-Internal' || r.provider === 'AI Preporuka') {
                overallLowestPrice = r.price || 0;
                overallLowestMealPlan = r.mealPlan || 'Preporuka';
            } else {
                return null;
            }

            return {
                id: r.id || `res-${Math.random()}`,
                name: r.name,
                location: { city, country },
                stars: r.stars || 4,
                lowestTotalPrice: overallLowestPrice === Infinity ? 0 : overallLowestPrice,
                currency: r.currency || 'EUR',
                status: status,
                lowestMealPlanLabel: overallLowestMealPlan,
                images: r.images && r.images.length > 0 ? r.images : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800"],
                description: r.description || '',
                isPrime: r.provider === 'Solvex' || r.isPrime,
                priority: r.provider === 'Solvex' ? 100 : (r.aiScore || 50),
                primaryProvider: {
                    id: (r.provider?.toLowerCase() || 'solvex') as any,
                    hotelKey: r.id || '',
                    price: overallLowestPrice === Infinity ? 0 : overallLowestPrice,
                    currency: r.currency || 'EUR'
                },
                paxSummary,
                aiInsight: r.aiInsight,
                aiScore: r.aiScore,
                originalData: r,
                roomOptions: [], 
                allocationResults: Object.keys(filteredAllocationResults).length > 0 ? filteredAllocationResults : r.allocationResults,
            } as HotelSearchResult;
        }).filter(Boolean) as HotelSearchResult[];

        setResults(mappedResults);
        if (mappedResults.length === 0) {
            addAlert({ id: 'no-results-found', severity: 'info', message: 'Nema dostupnih hotela za tražene parametre.' });
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        ['no-destination', 'no-dates', 'invalid-dates', 'min-stay', 'no-results-found'].forEach(dismissAlert);

        setIsSubmitting(true);
        setIsSearching(true);
        setSearchPerformed(true);

        try {
            if (searchMode === 'semantic' && semanticQuery) {
                // Parallel: Vector pre-fetch + AI intent parsing
                const vectorPromise = hybridSearchEngine.getVectorMatches(semanticQuery);
                const intentPromise = parseSearchIntent(semanticQuery);
                
                const parsedIntent = await intentPromise;
                
                // 1. Check for interactive Clarification (Pax Split)
                if (parsedIntent.needsClarification === 'pax_split') {
                    setPendingClarification({
                        type: 'pax_split',
                        question: "Milica: Vidim da vas je petoro! Želite li jednu veliku smeštajnu jedinicu (ako je dostupna) ili dve odvojene sobe?",
                        options: [
                            { label: 'JEDNA jedinica (npr. Family Suite)', value: 'single' },
                            { label: 'DVE odvojene sobe', value: 'split' }
                        ]
                    });
                    setIsSubmitting(false);
                    return; // Pause execution
                }

                // Reset range results
                setDateRangeResults([]);

                // 2. Handle Date Range (Multi-date probing)
                const isRangeSearch = !!(parsedIntent.dateRange && parsedIntent.durationNights);
                
                // Update store with AI intent
                if (parsedIntent.destinations.length > 0 && destinations.length === 0) {
                    parsedIntent.destinations.forEach((d, i) => addDestination({ id: `ai-d-${i}`, name: d, type: 'city', country: '' }));
                }
                
                if (parsedIntent.checkIn && parsedIntent.checkOut) {
                    setCheckIn(parsedIntent.checkIn);
                    setCheckOut(parsedIntent.checkOut);
                }

                if (parsedIntent.stars && parsedIntent.stars.length > 0) updateFilter('stars', parsedIntent.stars);
                if (parsedIntent.board && parsedIntent.board.length > 0) updateFilter('mealPlans', parsedIntent.board);

                // Re-fetch current state
                const state = useSearchStore.getState();
                const vectorMatches = await vectorPromise;

                const baseParams = {
                    searchType: 'hotel' as const,
                    destinations: state.destinations,
                    roomConfig: state.roomAllocations,
                    nationality: state.nationality,
                    enabledProviders: { solvex: true }
                };

                if (isRangeSearch && parsedIntent.dateRange && parsedIntent.durationNights) {
                    const { start, end } = parsedIntent.dateRange;
                    const duration = parsedIntent.durationNights;
                    
                    // Limit range to +- 7 days from midpoint if the range is too wide
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    let probeDates: string[] = [];
                    if (diffDays > 14) {
                        // If user gave a month or more, we center it and pick 7 dates
                        const midTime = startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2;
                        for (let i = -3; i <= 3; i++) {
                            probeDates.push(new Date(midTime + i * 86400000 * 2).toISOString().split('T')[0]);
                        }
                    } else {
                        // Small range, probe every 2nd day or similar
                        for (let i = 0; i <= diffDays; i += 2) {
                            probeDates.push(new Date(startDate.getTime() + i * 86400000).toISOString().split('T')[0]);
                        }
                    }

                    const rangeResults: any[] = [];
                    for (const dIn of probeDates) {
                        const dOut = new Date(new Date(dIn).getTime() + duration * 86400000).toISOString().split('T')[0];
                        const apiResults = await hybridSearchEngine.executeFusedSearch(vectorMatches, { ...baseParams, checkIn: dIn, checkOut: dOut }, semanticQuery);
                        const minPrice = apiResults.length > 0 ? Math.min(...apiResults.map(r => r.price || r.lowestTotalPrice || Infinity).filter(p => p > 0)) : 0;
                        
                        rangeResults.push({
                            checkIn: dIn,
                            checkOut: dOut,
                            price: minPrice === Infinity ? 0 : minPrice,
                            currency: 'EUR',
                            isRecommended: dIn === state.checkIn
                        });

                        if (dIn === state.checkIn) {
                            await processResults(apiResults);
                        }
                    }
                    setDateRangeResults(rangeResults);
                } else {
                    const apiResults = await hybridSearchEngine.executeFusedSearch(vectorMatches, { ...baseParams, checkIn: state.checkIn, checkOut: state.checkOut }, semanticQuery);
                    
                    // SMART FALLBACK: If no results, try Prev (-2 nights) and Next
                    if (apiResults.length === 0) {
                        console.log("🔍 [FALLBACK] No results found. Probing alternatives...");
                        const duration = Math.round((new Date(state.checkOut).getTime() - new Date(state.checkIn).getTime()) / 86400000);
                        
                        // Probe Prev: -2 days, duration - 2 nights (as requested)
                        const dInPrev = new Date(new Date(state.checkIn).getTime() - 2 * 86400000).toISOString().split('T')[0];
                        const dOutPrev = new Date(new Date(dInPrev).getTime() + Math.max(1, duration - 2) * 86400000).toISOString().split('T')[0];
                        
                        // Probe Next: +2 days, same duration
                        const dInNext = new Date(new Date(state.checkIn).getTime() + 2 * 86400000).toISOString().split('T')[0];
                        const dOutNext = new Date(new Date(dInNext).getTime() + duration * 86400000).toISOString().split('T')[0];

                        const probes = [
                            { dIn: dInPrev, dOut: dOutPrev, label: 'Prethodni period (-2 noći)' },
                            { dIn: dInNext, dOut: dOutNext, label: 'Sledeći period' }
                        ];

                        const rangeResults: any[] = [];
                        for (const p of probes) {
                            const pResults = await hybridSearchEngine.executeFusedSearch(vectorMatches, { ...baseParams, checkIn: p.dIn, checkOut: p.dOut }, semanticQuery);
                            const minPrice = pResults.length > 0 ? Math.min(...pResults.map(r => r.price || r.lowestTotalPrice || Infinity).filter(p => p > 0)) : 0;
                            if (minPrice > 0 && minPrice !== Infinity) {
                                rangeResults.push({
                                    checkIn: p.dIn,
                                    checkOut: p.dOut,
                                    price: minPrice,
                                    currency: 'EUR',
                                    isRecommended: false
                                });
                            }
                        }
                        
                        if (rangeResults.length > 0) {
                            setDateRangeResults(rangeResults);
                            addAlert({ 
                                id: 'fallback-offer', 
                                severity: 'info', 
                                message: 'Nismo pronašli slobodne sobe za tvoj tačan datum, ali Milica ti nudi alternativne termine ispod.' 
                            });
                        }
                    }

                    await processResults(apiResults);
                }

            } else {
                const state = useSearchStore.getState();
                const validationAlerts = validateSearch(state.destinations, state.checkIn, state.checkOut);
                if (validationAlerts.some(a => a.severity === 'warning')) {
                    validationAlerts.forEach(addAlert);
                    setIsSubmitting(false);
                    setIsSearching(false);
                    return;
                }

                const searchParams = {
                    searchType: 'hotel' as const,
                    destinations: state.destinations,
                    checkIn: state.checkIn,
                    checkOut: state.checkOut,
                    roomConfig: state.roomAllocations,
                    nationality: state.nationality,
                    enabledProviders: { solvex: true },
                    stars: state.filters.stars.includes('all') ? [] : state.filters.stars,
                    board: state.filters.mealPlans.includes('all') ? [] : state.filters.mealPlans
                };

                const apiResults = await performSmartSearch(searchParams as any);
                await processResults(apiResults);
            }
        } catch (err: any) {
            console.error('[HotelSearchForm] Search failed:', err);
            
            if (err.isRateLimit || err.status === 429) {
                addAlert({ 
                    id: 'rate-limit-err', 
                    severity: 'warning', 
                    message: 'Milica se malo umorila od prevelikog broja pitanja. Molimo Vas sačekajte 60 sekundi pre sledećeg upita.' 
                });
            } else {
                addAlert({ id: 'search-err', severity: 'error', message: 'Došlo je do greške u pretrazi.' });
            }
        } finally {
            setIsSubmitting(false);
            setIsSearching(false);
        }
    };

    return (
        <form onSubmit={handleSearch} className="v6-search-form-advanced" noValidate>
            <SearchModeSelector />
            
            {searchMode === 'semantic' && (
                <AIAssistantField onSearch={() => handleSearch()} isSubmitting={isSubmitting} />
            )}

            {searchMode !== 'semantic' && (
                <div className="v6-search-primary-row">
                    <div className="v6-hero-input-wrapper">
                        <div className="v6-hero-icon-faint"><Search size={28} /></div>
                        
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
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && destInput.trim()) {
                                    e.preventDefault();
                                    handleSelectOption({ name: destInput.trim(), type: 'city' });
                                }
                            }}
                            style={{ paddingLeft: destinations.length > 0 ? `${(destinations.length * 150) + 60}px` : '60px' }}
                        />

                        {showAutocomplete && (
                            <div className="v6-autocomplete-panel">
                                {autocompleteResults.map(item => (
                                    <div key={item.id} className="v6-autocomplete-item" onClick={() => handleSelectOption(item)}>
                                        <div className="v6-item-type-icon">
                                            {item.type === 'city' ? <MapPin size={18} /> : <Building2 size={18} />}
                                        </div>
                                        <div>
                                            <div className="v6-item-main-text">{item.name}</div>
                                            <div className="v6-item-sub-text">{item.sub}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {searchMode !== 'semantic' && (
                <div className="v6-search-controls-row">
                    {/* Datum */}
                    <div className="v6-field-icon-wrapper v6-ctrl-box" onClick={() => setShowCalendar(true)}>
                        <div className="v6-field-icon-faint"><Calendar size={20} /></div>
                        <div className="v6-field-input" style={{ cursor: 'pointer' }}>
                            {checkIn ? `${new Date(checkIn).toLocaleDateString('sr-RS')} - ${checkOut ? new Date(checkOut).toLocaleDateString('sr-RS') : ''}` : 'Odaberite datume'}
                        </div>
                    </div>

                    {/* Putnici */}
                    <div className="v6-field-icon-wrapper v6-ctrl-box">
                        <div className="v6-field-icon-faint"><Users size={20} /></div>
                        <div style={{ width: '100%' }}><OccupancyWizard /></div>
                    </div>

                    {/* Usluga */}
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

                    {/* Nacionalnost */}
                    <div className="v6-field-icon-wrapper v6-budget-container" style={{ position: 'relative' }}>
                        <div className="v6-field-icon-faint"><Globe size={20} /></div>
                        <div className="v6-field-input" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                            <input 
                                type="text"
                                placeholder="Zemlja / Passport"
                                value={showNationalityPicker ? nationalitySearch : (NATIONALITY_OPTIONS.find(n => n.value === nationality)?.label || 'Srbija')}
                                onChange={(e) => setNationalitySearch(e.target.value)}
                                onFocus={() => { setShowNationalityPicker(true); setNationalitySearch(''); }}
                                className="v6-field-input-clean"
                                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontWeight: 600 }}
                            />
                            <ChevronDown size={14} style={{ opacity: 0.4 }} onClick={() => setShowNationalityPicker(!showNationalityPicker)} />
                            
                            {showNationalityPicker && (
                                <div className="v6-autocomplete-panel" style={{ top: '105%', maxHeight: '250px', overflowY: 'auto' }}>
                                    {filteredNationalities.map(n => (
                                        <div key={n.value} onClick={() => { setNationality(n.value); setShowNationalityPicker(false); }} className="v6-autocomplete-item">
                                            {n.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="v6-search-btn-advanced btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? '...' : <><Search size={20} stroke="white" /> Traži</>}
                    </button>
                </div>
            )}

            {searchMode === 'hybrid' && (
                <div style={{ marginTop: '24px' }}>
                    <AIAssistantField onSearch={() => handleSearch()} isSubmitting={isSubmitting} />
                </div>
            )}


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
