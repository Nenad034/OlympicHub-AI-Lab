import React, { useState, useEffect } from 'react';
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
        updateRoomAllocation,
        addRoom,
    } = useSearchStore();

    const [destInput, setDestInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const searchInProgress = React.useRef(false);
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

    const processResults = async (apiResults: any[], finished = true) => {
        const paxSummary = calcPaxSummary(roomAllocations, checkIn, checkOut);
        const currentFilters = useSearchStore.getState().filters;
        const selectedMealPlans = currentFilters.mealPlans || ['all'];
        const isAllMealPlans = selectedMealPlans.includes('all');

        const mappedResults = apiResults.map((r: any) => {
            if (!r) return null;
            
            const status: AvailabilityStatus = 
                r.availability === 'available' ? 'instant' : 
                (r.availability === 'on-request' || r.availability === 'on_request' ? 'on-request' : 'sold-out');

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

                    const validRooms = matchingRooms.filter((rm: any) => rm.price > 0);
                    if (validRooms.length === 0) {
                        hasMatchingRoomsForAllSlots = false;
                        return;
                    }

                    const minPriceInSlot = Math.min(...validRooms.map((rm: any) => rm.price));
                    totalLowestForHotel += minPriceInSlot;
                    filteredAllocationResults[sIdx] = matchingRooms;
                    
                    if (sIdx === 0) {
                        const cheapestRoom = matchingRooms.find((rm: any) => rm.price === minPriceInSlot);
                        overallLowestMealPlan = cheapestRoom?.mealPlan || 'Smeštaj';
                    }
                });

                if (hasMatchingRoomsForAllSlots && totalLowestForHotel > 0) overallLowestPrice = totalLowestForHotel;
                else return null; 
            } else if (r.provider === 'AI-Internal' || r.provider === 'AI Preporuka') {
                overallLowestPrice = r.price || 0;
                if (overallLowestPrice <= 0) return null;
                overallLowestMealPlan = r.mealPlan || 'Preporuka';
            } else return null;

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

        setResults(mappedResults, finished);
        if (finished && mappedResults.length === 0) {
            addAlert({ id: 'no-results-found', severity: 'info', message: 'Nema dostupnih hotela za tražene parametre.' });
        }
    };    const [loadingMessage, setLoadingMessage] = useState("Milica traži najbolju ponudu za vas...");

    useEffect(() => {
        if (isSubmitting && searchMode === 'semantic') {
            const messages = [
                "Milica traži idealne destinacije...",
                "Milica traži najbolje termine...",
                "Milica traži ekskluzivne Solvex popuste...",
                "Milica traži smeštaj sa vašim željama...",
                "Milica traži najbolje sobe za vas...",
                "Skoro gotovo, pakujem rezultate!"
            ];
            let idx = 0;
            const timer = setInterval(() => {
                idx = (idx + 1) % messages.length;
                setLoadingMessage(messages[idx]);
            }, 2000); 
            return () => clearInterval(timer);
        }
    }, [isSubmitting, searchMode]);

    const handleOptionSelect = (value: any) => {
        if (pendingClarification?.type === 'pax_split') {
            if (value === 'split') {
                updateRoomAllocation(0, { adults: 3, children: 0, childrenAges: [] });
                addRoom();
            }
            setPendingClarification(null);
            setTimeout(() => handleSearch(), 100);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        // Safety guard: prevent double submission (Immediate ref check)
        if (searchInProgress.current) return;
        searchInProgress.current = true;
        
        // Clear previous alerts
        ['no-destination', 'no-dates', 'invalid-dates', 'min-stay', 'no-results-found', 'search-err', 'rate-limit-err'].forEach(dismissAlert);

        setIsSubmitting(true);
        setIsSearching(true);
        setSearchPerformed(true);

        try {
            if (searchMode === 'semantic' && semanticQuery) {
                console.log('🧠 [SEMANTIC SEARCH] Query:', semanticQuery);
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
                const store = useSearchStore.getState();
                if (parsedIntent.destinations.length > 0) {
                    console.log(`📍 AI identified destinations: ${parsedIntent.destinations.join(', ')}`);
                    // Clear existing and use AI detected ones for semantic search consistency
                    store.clearDestinations();
                    parsedIntent.destinations.forEach((d, i) => store.addDestination({ 
                        id: `ai-d-${i}`, 
                        name: d, 
                        type: 'city', 
                        country: '' 
                    }));
                } else if (store.destinations.length === 0) {
                    console.log('📡 [HotelSearchForm] No destinations specified. Defaulting to Bugarska.');
                    // Default to Bulgaria if nothing found and it's a valid search attempt
                    store.addDestination({ 
                        id: 'def-bg', 
                        name: 'Bugarska', 
                        type: 'city', 
                        country: 'Bulgaria' 
                    });
                }
                
                if (parsedIntent.checkIn && parsedIntent.checkOut) {
                    setCheckIn(parsedIntent.checkIn);
                    setCheckOut(parsedIntent.checkOut);
                }

                if (parsedIntent.stars && parsedIntent.stars.length > 0) updateFilter('stars', parsedIntent.stars);
                if (parsedIntent.board && parsedIntent.board.length > 0) updateFilter('mealPlans', parsedIntent.board);

                // AI determined the best search mode for results, but we keep 'semantic' visible during the transition
                // if (parsedIntent.searchMode) setSearchMode(parsedIntent.searchMode);

                const state = useSearchStore.getState();
                const vectorMatches = await vectorPromise;

                // DATE VALIDATION: Ensure we have dates before proceeding
                if (!state.checkIn || isNaN(new Date(state.checkIn).getTime())) {
                    console.log('📅 [HotelSearchForm] Dates missing or invalid. Defaulting to next week...');
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 14); // 2 weeks out
                    const nextWeekEnd = new Date(nextWeek);
                    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
                    
                    setCheckIn(nextWeek.toISOString().split('T')[0]);
                    setCheckOut(nextWeekEnd.toISOString().split('T')[0]);
                }

                const baseParams = {
                    searchType: 'hotel' as const,
                    destinations: state.destinations,
                    roomConfig: state.roomAllocations,
                    nationality: state.nationality,
                    enabledProviders: state.enabledProviders || undefined,
                    onPartialResults: (partial: any[]) => {
                        processResults(partial);
                    }
                };

                console.log('📡 [HotelSearchForm] Running Smart Search:', {
                    destinations: baseParams.destinations.map(d => d.name),
                    dates: `${state.checkIn} to ${state.checkOut}`,
                    rooms: baseParams.roomConfig.length
                });

                if (isRangeSearch && parsedIntent.dateRange?.start && parsedIntent.dateRange?.end && parsedIntent.durationNights) {
                    const { start, end } = parsedIntent.dateRange;
                    const duration = parsedIntent.durationNights;
                    
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    let probeDates: string[] = [];
                    if (diffDays > 14) {
                        const midTime = startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2;
                        // Reduced to 3 probes for Speed
                        for (let i = -1; i <= 1; i++) {
                            probeDates.push(new Date(midTime + i * 86400000 * 3).toISOString().split('T')[0]);
                        }
                    } else {
                        // Max 4 probes in parallel
                        const step = Math.max(1, Math.floor(diffDays / 3));
                        for (let i = 0; i <= diffDays; i += step) {
                            if (probeDates.length < 4) {
                                probeDates.push(new Date(startDate.getTime() + i * 86400000).toISOString().split('T')[0]);
                            }
                        }
                    }

                    // BATCHED EXECUTION to avoid overloading Solvex
                    const rangeResults: any[] = [];
                    const batchSize = 2; // Process 2 at a time
                    
                    // 1. Separate the primary probe (user's selected dates) from Others
                    const primaryProbe = probeDates.find(d => d === state.checkIn);
                    const otherProbes = probeDates.filter(d => d !== state.checkIn);
                    
                    // 2. Execute Primary FIRST for immediate feedback
                    if (primaryProbe) {
                        console.log('⚡ [HotelSearchForm] Running primary probe first...');
                        const dOut = new Date(new Date(primaryProbe).getTime() + duration * 86400000).toISOString().split('T')[0];
                        try {
                            const apiResults = await hybridSearchEngine.executeFusedSearch(vectorMatches, { ...baseParams, checkIn: primaryProbe, checkOut: dOut }, semanticQuery);
                            const resForMapping = apiResults.map((r: any) => r.price || r.lowestTotalPrice || Infinity).filter((p: number) => p > 0);
                            const minPrice = apiResults.length > 0 && resForMapping.length > 0
                                ? Math.min(...resForMapping) 
                                : 0;
                            
                            rangeResults.push({
                                checkIn: primaryProbe,
                                checkOut: dOut,
                                price: minPrice === Infinity ? 0 : minPrice,
                                currency: 'EUR',
                                isRecommended: true
                            });
                            
                            await processResults(apiResults);
                        } catch (e) {
                            console.error('Primary probe failed:', e);
                        }
                    }
                    
                    // 3. Execute others in batches
                    for (let i = 0; i < otherProbes.length; i += batchSize) {
                        const batch = otherProbes.slice(i, i + batchSize);
                        console.log(`📡 [HotelSearchForm] Running probe batch ${Math.floor(i/batchSize) + 1}...`);
                        
                        await Promise.all(batch.map(async (dIn) => {
                            const dOut = new Date(new Date(dIn).getTime() + duration * 86400000).toISOString().split('T')[0];
                            try {
                                const apiResults = await hybridSearchEngine.executeFusedSearch(vectorMatches, { ...baseParams, checkIn: dIn, checkOut: dOut }, semanticQuery);
                                const resForMapping = apiResults.map((r: any) => r.price || r.lowestTotalPrice || Infinity).filter((p: number) => p > 0);
                                const minPrice = apiResults.length > 0 && resForMapping.length > 0
                                    ? Math.min(...resForMapping) 
                                    : 0;
                                
                                rangeResults.push({
                                    checkIn: dIn,
                                    checkOut: dOut,
                                    price: minPrice === Infinity ? 0 : minPrice,
                                    currency: 'EUR',
                                    isRecommended: false
                                });
                            } catch (e) {
                                console.warn(`Discovery probe failed for ${dIn}:`, e);
                            }
                        }));
                    }
                    
                    setDateRangeResults(rangeResults.sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()));
                } else {
                    let apiResults: any[] = [];
                    let searchError = false;

                    try {
                        apiResults = await hybridSearchEngine.executeFusedSearch(vectorMatches, { ...baseParams, checkIn: state.checkIn, checkOut: state.checkOut }, semanticQuery);
                    } catch (e) {
                        console.error("Primary search failed:", e);
                        searchError = true;
                    }
                    
                    // SMART FALLBACK (Only if search succeeded but returned 0 results)
                    if (apiResults.length === 0 && !searchError) {
                        console.log("🔍 [FALLBACK] No results found. Probing alternatives...");
                        const duration = Math.round((new Date(state.checkOut).getTime() - new Date(state.checkIn).getTime()) / 86400000);
                        
                        const dInPrev = new Date(new Date(state.checkIn).getTime() - 2 * 86400000).toISOString().split('T')[0];
                        const dOutPrev = new Date(new Date(dInPrev).getTime() + Math.max(1, duration - 2) * 86400000).toISOString().split('T')[0];
                        
                        const dInNext = new Date(new Date(state.checkIn).getTime() + 2 * 86400000).toISOString().split('T')[0];
                        const dOutNext = new Date(new Date(dInNext).getTime() + duration * 86400000).toISOString().split('T')[0];

                        const probes = [
                            { dIn: dInPrev, dOut: dOutPrev },
                            { dIn: dInNext, dOut: dOutNext }
                        ];

                        const rangeResults: any[] = [];
                        const probeResults = await Promise.all(probes.map(p => 
                            hybridSearchEngine.executeFusedSearch(vectorMatches, { ...baseParams, checkIn: p.dIn, checkOut: p.dOut }, semanticQuery)
                        ));

                        probeResults.forEach((pResults, idx) => {
                            const p = probes[idx];
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
                        });
                        
                        if (rangeResults.length > 0) {
                            setDateRangeResults(rangeResults);
                            addAlert({ 
                                id: 'fallback-offer', 
                                severity: 'info', 
                                message: 'Milica ti nudi alternativne termine ispod pošto nema soba za tvoj tačan datum.' 
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
                    enabledProviders: state.enabledProviders || undefined,
                    stars: state.filters.stars.includes('all') ? [] : state.filters.stars,
                    board: state.filters.mealPlans.includes('all') ? [] : state.filters.mealPlans,
                    onPartialResults: (partial: any[]) => {
                        processResults(partial);
                    }
                };

                console.log('📡 [HotelSearchForm] Running Smart Search:', searchParams);
                const apiResults = await performSmartSearch(searchParams as any);
                await processResults(apiResults);
            }
        } catch (err: any) {
            console.error('❌ [HotelSearchForm] Search failed:', err);
            
            if (err.message?.includes('Timeout') || err.message?.includes('sporije')) {
                 addAlert({ 
                    id: 'search-err', 
                    severity: 'warning', 
                    message: 'Sistem trenutno sporije odgovara. Pokušavamo ponovo ili smanjite period pretrage.' 
                });
            } else if (err.isRateLimit || err.status === 429) {
                addAlert({ 
                    id: 'rate-limit-err', 
                    severity: 'warning', 
                    message: 'Milica se malo umorila. Molimo sačekajte 60s.' 
                });
            } else {
                addAlert({ 
                    id: 'search-err', 
                    severity: 'error', 
                    message: `Greška u pretrazi: ${err.message || 'Nepoznata greška'}` 
                });
            }
        } finally {
            setIsSubmitting(false);
            setIsSearching(false);
            searchInProgress.current = false;
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
            {/* ─────────────── MILICA AI OVERLAYS ─────────────── */}

            {/* 1. CLARIFICATION OVERLAY */}
            {!isSubmitting && pendingClarification && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(5, 10, 20, 0.96)',
                    backdropFilter: 'blur(30px)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', animation: 'v6FadeIn 0.4s ease-out', padding: '24px'
                }}>
                    <div style={{
                        background: 'var(--v6-bg-section)', border: '2px solid var(--v6-accent)',
                        borderRadius: '40px', padding: '48px', maxWidth: '540px', width: '100%',
                        textAlign: 'center', boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{
                            width: '140px', height: '140px', borderRadius: '35px', margin: '0 auto 32px',
                            overflow: 'hidden', border: '4px solid var(--v6-accent)',
                            boxShadow: '0 15px 40px rgba(99, 179, 237, 0.5)'
                        }}>
                            <img src="/images/milica-avatar.png" alt="Milica" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <h3 style={{ fontSize: '32px', color: 'white', marginBottom: '8px', fontWeight: 900, letterSpacing: '-0.02em' }}>Milica</h3>
                        <p style={{ color: 'var(--v6-text-muted)', marginBottom: '32px', fontSize: '18px', fontWeight: 500 }}>Vaša AI asistentkinja</p>
                        
                        <div style={{
                            padding: '32px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.08)', marginBottom: '32px'
                        }}>
                            <p style={{ fontSize: '20px', color: 'white', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>{pendingClarification.question}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {pendingClarification.options.map((opt, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleOptionSelect(opt.value)}
                                    style={{
                                        padding: '20px', borderRadius: '20px', background: 'var(--v6-accent)',
                                        color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer',
                                        fontSize: '18px', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                                        e.currentTarget.style.filter = 'brightness(1.1)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                        e.currentTarget.style.filter = 'none';
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                            <button 
                                onClick={() => setPendingClarification(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--v6-text-muted)', cursor: 'pointer', marginTop: '12px', fontSize: '15px' }}
                            >
                                Odustani
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. LOADING OVERLAY */}
            {isSubmitting && searchMode === 'semantic' && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(8, 15, 30, 0.92)',
                    backdropFilter: 'blur(25px)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', animation: 'v6FadeIn 0.3s ease-out'
                }}>
                    <style>
                        {`
                        @keyframes v6PulseAvatar {
                            0% { box-shadow: 0 0 0 0 rgba(235, 94, 40, 0.5); transform: scale(1); }
                            50% { box-shadow: 0 0 0 45px rgba(235, 94, 40, 0); transform: scale(1.03); }
                            100% { box-shadow: 0 0 0 0 rgba(235, 94, 40, 0); transform: scale(1); }
                        }
                        @keyframes v6FadeIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes v6FadeText {
                            0% { opacity: 0; transform: translateY(12px); }
                            15% { opacity: 1; transform: translateY(0); }
                            85% { opacity: 1; transform: translateY(0); }
                            100% { opacity: 0; transform: translateY(-12px); }
                        }
                        @keyframes v6LoadingSlide {
                            0% { left: -60%; }
                            100% { left: 110%; }
                        }
                        `}
                    </style>
                    
                    <div style={{
                        width: '260px', height: '260px', borderRadius: '30px', overflow: 'hidden',
                        border: '6px solid var(--v6-accent)', boxShadow: '0 25px 70px rgba(0,0,0,0.7)',
                        position: 'relative', animation: 'v6PulseAvatar 2.5s infinite ease-in-out',
                        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    }}>
                        <img src="/images/milica-avatar.png" alt="Milica AI" style={{ width: '100%', height: '100%', objectFit: 'cover', scale: '1.05' }} />
                    </div>
                    
                    <div style={{
                        marginTop: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px'
                    }}>
                        <div style={{ 
                            width: '50px', height: '5px', background: 'rgba(255, 255, 255, 0.1)', 
                            borderRadius: '3px', overflow: 'hidden', position: 'relative' 
                        }}>
                            <div style={{ 
                                position: 'absolute', top: 0, left: 0, height: '100%', width: '40%', 
                                background: 'var(--v6-accent)', borderRadius: '3px',
                                animation: 'v6LoadingSlide 1.2s infinite ease-in-out' 
                            }} />
                        </div>
                        
                        <span key={loadingMessage} style={{ 
                            fontSize: '24px', fontWeight: 600, color: 'white', letterSpacing: '-0.01em',
                            animation: 'v6FadeText 2s forwards' 
                        }}>
                            {loadingMessage}
                        </span>
                    </div>
                </div>
            )}
        </form>
    );
};

export default HotelSearchForm;
