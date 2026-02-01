import React, { useState } from 'react';
import {
    Search, MapPin, Calendar, Users, Sparkles,
    Loader2, CheckCircle2, Hotel, DollarSign,
    Info, Users2, Moon, Zap, ShieldCheck, MoveRight, MoveLeft,
    Globe, Database, ArrowRight, Star,
    LayoutGrid, List as ListIcon, Map as MapIcon,
    Building2, CalendarDays, X, Power, Clock,
    ArrowDownWideNarrow, ArrowUpNarrowWide
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getHotelProviderManager } from '../services/providers/HotelProviderManager';
// Stores
import { useThemeStore, useAuthStore } from '../stores';
import { useIntelligenceStore } from '../stores/intelligenceStore';
import { softZoneService } from '../services/softZoneService';
import { translations } from '../translations';
import { formatDate } from '../utils/dateUtils';
import { ModernCalendar } from '../components/ModernCalendar';
import { BookingModal } from '../components/booking/BookingModal';
import { BookingSuccess } from '../components/booking/BookingSuccess';
import '../modules/pricing/TotalTripSearch.css';
import './GlobalHubSearch.css';
import './B2BPriceDisplay.css';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
export interface RoomDetails {
    id: string;
    name: string;
    description?: string;
    price: number;
    availability: 'available' | 'on_request' | 'stop_sale';
    capacity: string;
}

export interface CombinedResult {
    id: string;
    source: 'TCT' | 'OpenGreece' | 'Solvex' | 'ORS' | 'Solvex AI';
    name: string;
    location: string;
    price: number;
    currency: string;
    image: string;
    stars: number;
    mealPlan: string;
    availability: 'available' | 'on_request' | 'stop_sale' | 'unknown';
    rooms: RoomDetails[];
    originalData: any;
    softZoneScore?: number;
    aiScore?: number;
    otherOffers?: Array<{
        source: string;
        price: number;
        currency: string;
        mealPlan: string;
        id: string;
    }>;
}

const MEAL_PLAN_OPTIONS = [
    { value: 'all', label: 'Sve Usluge' },
    { value: 'RO', label: 'Najam (RO)' },
    { value: 'BB', label: 'Noćenje sa doručkom (BB)' },
    { value: 'HB', label: 'Polupansion (HB)' },
    { value: 'FB', label: 'Pun pansion (FB)' },
    { value: 'AI', label: 'All Inclusive (AI)' },
    { value: 'UAI', label: 'Ultra All Inclusive (UAI)' },
];

const CATEGORY_OPTIONS = [
    { value: 'all', label: 'Sve Kategorije' },
    { value: '2', label: '2*' },
    { value: '3', label: '3*' },
    { value: '4', label: '4*' },
    { value: '5', label: '5*' },
];

const SOURCE_OPTIONS = [
    { value: 'all', label: 'Svi Dobavljači' },
    { value: 'TCT', label: 'TCT' },
    { value: 'OpenGreece', label: 'Open Greece' },
    { value: 'Solvex', label: 'Solvex' },
    { value: 'ORS', label: 'ORS' },
];

const normalizeMealPlan = (plan: string): string => {
    if (!plan) return 'RO';
    let p = plan.toUpperCase().trim();

    // 1. Check strict codes first
    if (p === 'UAI') return 'UAI';
    if (p === 'AI' || p === 'ALL') return 'AI';
    if (p === 'FB' || p === 'PA') return 'FB';
    if (p === 'HB' || p === 'PP' || p === 'НВ' || p === 'ПП') return 'HB'; // Added Cyrillic support
    if (p === 'BB' || p === 'ND') return 'BB';
    if (p === 'RO' || p === 'RR' || p === 'OB' || p === 'SC' || p === 'NA' || p === 'NM') return 'RO';

    // 2. Check keywords (Serbian & English)
    if (p.includes('ULTRA')) return 'UAI';
    if (p.includes('ALL INCL') || p.includes('SVE UKLJ')) return 'AI';

    if ((p.includes('FULL') || p.includes('PUN') || p.includes('PANSION')) && !p.includes('POLU') && !p.includes('HALF')) return 'FB';

    if (p.includes('HALF') || p.includes('POLU') || p.includes('HB') || p.includes('DORUCAK I VECERA') || p.includes('DORUČAK I VEČERA')) return 'HB';

    if (p.includes('BED') || p.includes('BREAKFAST') || p.includes('DORUCAK') || p.includes('DORUČAK') || p.includes('NOCENJE') || p.includes('NOĆENJE') || p.includes('BB')) return 'BB';

    if (p.includes('ROOM') || p.includes('NAJAM') || p.includes('ONLY') || p.includes('BEZ USLUGE')) return 'RO';

    return 'RO'; // Default fallback
};

/**
 * Get full meal plan display name in Serbian
 */
const getMealPlanDisplayName = (code: string): string => {
    const normalized = normalizeMealPlan(code);

    const mealPlanNames: Record<string, string> = {
        'RO': 'Samo Smeštaj',
        'BB': 'Noćenje sa Doručkom',
        'HB': 'Polupansion',
        'FB': 'Pun Pansion',
        'AI': 'All Inclusive',
        'UAI': 'Ultra All Inclusive',
        'NM': 'Bez Obroka',
        'SC': 'Samo Smeštaj',
        'ND': 'Noćenje sa Doručkom',
        'PP': 'Polupansion',
        'PA': 'Pun Pansion'
    };

    return mealPlanNames[normalized] || mealPlanNames[code.toUpperCase()] || code;
};

const GlobalHubSearch: React.FC = () => {
    const navigate = useNavigate();
    const { lang } = useThemeStore();
    const { weatherContext, activeTriggers } = useIntelligenceStore();
    const t = translations[lang];

    const [locationInput, setLocationInput] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [nights, setNights] = useState(7);
    const [rooms, setRooms] = useState(1);
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [childrenAges, setChildrenAges] = useState<number[]>([]);

    const [results, setResults] = useState<CombinedResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // API Provider Toggles
    const [enabledProviders, setEnabledProviders] = useState({
        tct: true,
        opengreece: true,
        solvex: true,
        solvexai: false,
        ors: true
    });

    // Flexible Dates
    const [flexibleDays, setFlexibleDays] = useState(0);

    // Filter states
    const [selectedSources, setSelectedSources] = useState<string[]>(['all']);
    const [selectedMealPlans, setSelectedMealPlans] = useState<string[]>(['all']);
    const [selectedStars, setSelectedStars] = useState<string[]>(['all']);
    const [hotelNameFilter, setHotelNameFilter] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
    const [sortBy, setSortBy] = useState<'smart' | 'price_low' | 'price_high'>('smart');
    const [activeSearches, setActiveSearches] = useState(0);

    // Autocomplete state
    const [suggestions, setSuggestions] = useState<Array<{ id: number | string, name: string, type: 'city' | 'hotel', source: 'TCT' | 'Solvex' | 'OpenGreece' | 'ORS', stars?: number, location?: string }>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedDestination, setSelectedDestination] = useState<{ id: number | string, source: 'TCT' | 'Solvex' | 'OpenGreece' | 'ORS', type: 'city' | 'hotel' } | null>(null);
    const [selectedArrivalDate, setSelectedArrivalDate] = useState<string | null>(null);
    const [expandedHotel, setExpandedHotel] = useState<CombinedResult | null>(null);

    // Advanced autocomplete state
    const [selectedIndex, setSelectedIndex] = useState(-1); // For keyboard navigation
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false); // Loading state
    const [recentSearches, setRecentSearches] = useState<Array<{ id: number | string, name: string, type: 'city' | 'hotel', source: 'TCT' | 'Solvex' | 'OpenGreece' | 'ORS', stars?: number, location?: string }>>([]);

    // B2B Segment States
    const { userLevel } = useAuthStore();
    const isSubagent = userLevel < 6; // Simulation: any non-admin is treated as subagent for UI 
    const [b2bMargin, setB2bMargin] = useState({ value: 10, type: 'percentage' as 'percentage' | 'fixed' });
    const [showStaffOnline, setShowStaffOnline] = useState(false);

    // Booking modal state
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<any>(null);

    // Sidebar providers
    const generateFlexDates = (baseDate: string, range: number) => {
        if (!baseDate) return [];
        const dates = [];
        const base = new Date(baseDate);
        for (let i = -range; i <= range; i++) {
            const d = new Date(base);
            d.setDate(d.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    };

    // Booking handlers
    const handleReserveClick = (room: any) => {
        console.log('[GlobalSearch] Opening passenger form for room:', room.name);
        setSelectedRoomForBooking(room);
        setIsBookingModalOpen(true);
    };

    const getPriceWithMargin = (price: number) => {
        if (!isSubagent) return price;
        if (b2bMargin.type === 'percentage') {
            return Math.ceil(price * (1 + b2bMargin.value / 100));
        } else {
            return price + b2bMargin.value;
        }
    };

    React.useEffect(() => {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const checkInDate = tomorrow.toISOString().split('T')[0];
        setCheckIn(checkInDate);

        const checkOutDate = new Date(tomorrow);
        checkOutDate.setDate(checkOutDate.getDate() + nights);
        setCheckOut(checkOutDate.toISOString().split('T')[0]);

        // Load recent searches from localStorage
        const stored = localStorage.getItem('globalHubRecentSearches');
        if (stored) {
            try {
                setRecentSearches(JSON.parse(stored));
            } catch (e) {
                console.warn('Failed to parse recent searches:', e);
            }
        }
    }, []);

    const [activeCalendar, setActiveCalendar] = useState<'in' | 'out' | null>(null);
    const [apiConnectionsEnabled, setApiConnectionsEnabled] = useState(true);

    // Advanced autocomplete with debounce and loading state
    const handleLocationInputChange = (value: string) => {
        setLocationInput(value);
        setSelectedIndex(-1); // Reset keyboard selection

        if (value.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            setIsLoadingSuggestions(false);
            return;
        }

        setIsLoadingSuggestions(true);

        // Debounce: wait 300ms after user stops typing
        const timer = setTimeout(async () => {
            const searchTerm = value.toLowerCase();
            const allSuggestions: Array<{ id: string | number, name: string, type: 'city' | 'hotel', source: 'Solvex' | 'TCT' | 'OpenGreece' | 'ORS', stars?: number, location?: string }> = [];

            // Static popular destinations (for instant results)
            const popularDestinations = [
                // Solvex Cities
                { id: 9, name: 'Bansko', type: 'city' as const, source: 'Solvex' as const, location: 'Bulgaria' },
                { id: 6, name: 'Borovets', type: 'city' as const, source: 'Solvex' as const, location: 'Bulgaria' },
                { id: 10, name: 'Pamporovo', type: 'city' as const, source: 'Solvex' as const, location: 'Bulgaria' },
                { id: 33, name: 'Golden Sands', type: 'city' as const, source: 'Solvex' as const, location: 'Bulgaria' },
                { id: 68, name: 'Sunny Beach', type: 'city' as const, source: 'Solvex' as const, location: 'Bulgaria' },
                { id: 1, name: 'Nesebar', type: 'city' as const, source: 'Solvex' as const, location: 'Bulgaria' },

                // TCT / Global Cities
                { id: 'HRG', name: 'Hurghada', type: 'city' as const, source: 'TCT' as const, location: 'Egypt' },
                { id: 'SSH', name: 'Sharm El Sheikh', type: 'city' as const, source: 'TCT' as const, location: 'Egypt' },
                { id: 'ANT', name: 'Antalya', type: 'city' as const, source: 'TCT' as const, location: 'Turkey' },
                { id: 'DXB', name: 'Dubai', type: 'city' as const, source: 'TCT' as const, location: 'UAE' },

                // Greece / OpenGreece
                { id: 'ATH', name: 'Atina', type: 'city' as const, source: 'OpenGreece' as const, location: 'Grčka' },
                { id: 'CFU', name: 'Krf (Corfu)', type: 'city' as const, source: 'OpenGreece' as const, location: 'Grčka' },
                { id: 'RHO', name: 'Rodos (Rhodes)', type: 'city' as const, source: 'OpenGreece' as const, location: 'Grčka' },
                { id: 'HER', name: 'Heraklion (Crete)', type: 'city' as const, source: 'OpenGreece' as const, location: 'Grčka' },
            ];

            // Add matching popular destinations first
            const popularMatches = popularDestinations.filter(d =>
                d.name.toLowerCase().includes(searchTerm)
            );
            allSuggestions.push(...popularMatches);

            // Dynamically search Solvex hotels if enabled
            if (enabledProviders.solvex) {
                try {
                    // Search across all major Solvex cities
                    const solvexCities = [33, 68, 9, 6, 10, 1]; // Golden Sands, Sunny Beach, Bansko, Borovets, Pamporovo, Nesebar

                    for (const cityId of solvexCities) {
                        const hotelsResponse = await import('../services/solvex/solvexDictionaryService').then(m => m.getHotels(cityId));

                        if (hotelsResponse.success && hotelsResponse.data) {
                            const matchingHotels = hotelsResponse.data
                                .filter((h: any) => h.name.toLowerCase().includes(searchTerm))
                                .slice(0, 5) // Limit to 5 hotels per city
                                .map((h: any) => ({
                                    id: h.id,
                                    name: h.name,
                                    type: 'hotel' as const,
                                    source: 'Solvex' as const,
                                    stars: h.stars,
                                    location: cityId === 33 ? 'Golden Sands' : cityId === 68 ? 'Sunny Beach' : cityId === 9 ? 'Bansko' : 'Bulgaria'
                                }));

                            allSuggestions.push(...matchingHotels);
                        }
                    }
                } catch (error) {
                    console.warn('[Autocomplete] Solvex hotel search failed:', error);
                }
            }

            // Remove duplicates by name
            const uniqueSuggestions = allSuggestions.filter((item, index, self) =>
                index === self.findIndex((t) => t.name.toLowerCase() === item.name.toLowerCase())
            );

            // Sort: cities first, then hotels, alphabetically within each group
            uniqueSuggestions.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'city' ? -1 : 1;
                return a.name.localeCompare(b.name);
            });

            setSuggestions(uniqueSuggestions.slice(0, 15)); // Limit to 15 total suggestions
            setShowSuggestions(uniqueSuggestions.length > 0);
            setIsLoadingSuggestions(false);
        }, 300);

        // Cleanup timeout on unmount or new input
        return () => clearTimeout(timer);
    };

    const handleSelectSuggestion = (suggestion: any) => {
        const fullDisplay = suggestion.type === 'hotel'
            ? `${suggestion.name}, ${suggestion.stars}* - ${suggestion.location}`
            : `${suggestion.name}${suggestion.location ? ` (${suggestion.location})` : ''}`;

        setLocationInput(fullDisplay);
        setSelectedDestination({ id: suggestion.id, source: suggestion.source, type: suggestion.type });
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);

        // Save to recent searches
        const updated = [suggestion, ...recentSearches.filter((r: any) => r.id !== suggestion.id)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('globalHubRecentSearches', JSON.stringify(updated));
    };

    const handleSearch = async () => {
        if (!locationInput) {
            setError(lang === 'sr' ? 'Unesite destinaciju' : 'Enter destination');
            return;
        }

        setIsLoading(true);
        setSearchPerformed(true);
        setExpandedHotel(null); // Reset detail view on new search to avoid stale data
        if (!selectedArrivalDate) {
            setSelectedArrivalDate(checkIn);
        }
        setError(null);
        setResults([]);

        // Record interaction for Vajckin Behavioral Reflex
        softZoneService.recordInteraction(locationInput, {
            checkIn: formatDate(checkIn),
            checkOut: formatDate(checkOut)
        });

        // Initialize active searches count
        const providersToCall = Object.values(enabledProviders).filter(Boolean).length;
        setActiveSearches(providersToCall);

        const processResults = (newResults: CombinedResult[]) => {
            setResults(prev => {
                const combined = [...prev, ...newResults];

                // Smart Merging: Group by simplified name + meal plan
                const grouped = new Map<string, CombinedResult>();

                combined.forEach(hotel => {
                    // Normalize: remove (Golden Sands), remove stars 2*, remove non-word chars, lowercase
                    const normalizedName = hotel.name.toLowerCase()
                        .split('(')[0] // Remove everything after (
                        .replace(/[0-9]\*/g, '') // Remove stars like 2*
                        .replace(/[^\w\s]/gi, '') // Remove punctuation
                        .trim()
                        .replace(/\s+/g, ' ');

                    const key = `${normalizedName}-${hotel.mealPlan.toUpperCase()}`;

                    if (!grouped.has(key)) {
                        grouped.set(key, { ...hotel, otherOffers: [] });
                    } else {
                        const existing = grouped.get(key)!;

                        // Collect all unique rooms for this hotel-meal combination
                        if (!existing.rooms) existing.rooms = [];
                        hotel.rooms.forEach(newRoom => {
                            if (!existing.rooms.some(r => r.name === newRoom.name)) {
                                existing.rooms.push(newRoom);
                            }
                        });

                        if (existing.id === hotel.id) return;

                        if (hotel.price < existing.price) {
                            const oldPrimary = { source: existing.source, price: existing.price, currency: existing.currency, mealPlan: existing.mealPlan, id: existing.id };
                            const updated = { ...hotel, otherOffers: [oldPrimary, ...(existing.otherOffers || [])] };
                            grouped.set(key, updated);
                        } else {
                            existing.otherOffers = existing.otherOffers || [];
                            const alreadyListed = existing.otherOffers.some(o => o.id === hotel.id);
                            if (!alreadyListed) {
                                existing.otherOffers.push({ source: hotel.source, price: hotel.price, currency: hotel.currency, mealPlan: hotel.mealPlan, id: hotel.id });
                            }
                        }
                    }
                });

                let mergedArray = Array.from(grouped.values());

                // FIX: If a specific hotel was selected from suggestions, filter out unrelated ones
                if (selectedDestination?.type === 'hotel') {
                    const targetName = locationInput.split(',')[0].toLowerCase()
                        .split('(')[0].replace(/[0-9]\*/g, '').replace('hotel', '').trim();

                    mergedArray = mergedArray.filter(h => {
                        const hotelNorm = h.name.toLowerCase().split('(')[0].replace(/[0-9]\*/g, '').replace('hotel', '').trim();
                        return hotelNorm.includes(targetName) || targetName.includes(hotelNorm);
                    });
                }

                if (mergedArray.length > 0) setIsLoading(false);

                // Smart Ranking scoring logic applied to everything in results
                const activeHeatTrigger = activeTriggers.find(t => t.id === 'heat_wave_reflex');
                const activeStabilityTrigger = activeTriggers.find(t => t.id === 'stability_reflex');
                const activeEconomyTrigger = activeTriggers.find(t => t.id === 'economy_reflex');

                return mergedArray.map(hotel => {
                    let score = 0;
                    if (activeHeatTrigger) {
                        const coolKeywords = ['bansko', 'borovets', 'bulgaria', 'mountain', 'alps', 'zlatibor', 'kopaonik'];
                        const loc = hotel.location.toLowerCase();
                        const name = hotel.name.toLowerCase();
                        if (coolKeywords.some(kw => loc.includes(kw) || name.includes(kw))) score += 50;
                    }
                    if (activeStabilityTrigger && hotel.source === 'OpenGreece') score += 20;
                    if (activeEconomyTrigger && hotel.price < 500) score += 30;

                    return { ...hotel, softZoneScore: score };
                });
            });
            setActiveSearches(prev => {
                const newVal = Math.max(0, prev - 1);
                // If all finished, stop loading
                if (newVal === 0) setIsLoading(false);
                return newVal;
            });
        };

        const handleOneSearch = async (provider: string, promise: Promise<any>) => {
            try {
                const response = await promise;
                let parsed: CombinedResult[] = [];

                // If response is already an array, it means it was pre-processed by the provider manager
                if (Array.isArray(response)) {
                    parsed = response;
                }
                // Legacy support for direct API calls (if any remain)
                else if (provider === 'tct' && response.success && response.data) {
                    const hotelsData = response.data.groups || response.data.hotels || [];
                    const roomsLookup = response.data.rooms || {};
                    parsed = hotelsData.map((h: any) => ({
                        id: `tct-${h.id || h.hid}`,
                        source: 'TCT',
                        name: h.name || h.hotel_name,
                        location: h.location || h.hotel_city || 'Multiple',
                        price: h.price,
                        currency: h.currency || h.cur || 'EUR',
                        image: h.image || h.hotel_image || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800",
                        stars: h.stars || h.hotel_stars || 4,
                        mealPlan: (h.rooms && Object.values(h.rooms).length > 0 ? roomsLookup[Object.values(h.rooms)[0] as string]?.meal : h.board) || 'N/A',
                        availability: h.available === false ? 'stop_sale' : (h.on_request ? 'on_request' : 'available'),
                        rooms: [],
                        originalData: h
                    }));
                }
                else if (provider === 'opengreece' && response.success && response.data?.hotelResults) {
                    parsed = response.data.hotelResults.map((h: any) => ({
                        id: `og-${h.hotelCode}`,
                        source: 'OpenGreece',
                        name: h.hotelName,
                        location: h.address?.cityName || 'Greece',
                        price: h.lowestPrice?.totalAmount || 0,
                        currency: h.lowestPrice?.currency || 'EUR',
                        image: h.mainImage || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800",
                        stars: h.starRating || 4,
                        mealPlan: h.rooms?.[0]?.rates?.[0]?.mealPlan?.name || 'Room Only',
                        availability: h.available ? 'available' : 'on_request',
                        rooms: h.rooms,
                        originalData: h
                    }));
                }
                else if (provider === 'solvex' && response.success && response.data) {
                    // This block is only for legacy direct calls
                    const hotelMap = new Map<string, CombinedResult>();
                    response.data.forEach((s: any) => {
                        const hId = String(s.hotel.id);
                        const pCode = (s.pansion?.code || 'RO').trim().toUpperCase();
                        const key = `${hId}-${pCode}`;

                        if (!hotelMap.has(key)) {
                            hotelMap.set(key, {
                                id: `solvex-${hId}-${pCode}`,
                                source: 'Solvex',
                                name: s.hotel.name.trim(),
                                location: s.hotel.city?.name || 'Bulgaria',
                                price: s.totalCost || 0,
                                currency: 'EUR',
                                image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800",
                                stars: s.hotel.starRating || 3,
                                mealPlan: pCode,
                                availability: (s.quotaType === 0 || s.quotaType === 1) ? 'available' : 'on_request',
                                rooms: [],
                                originalData: s
                            });
                        }

                        const entry = hotelMap.get(key)!;
                        const roomTypeName = s.room?.roomType?.name || '';
                        const roomCategoryName = s.room?.roomCategory?.name || '';
                        const roomAccommodationName = s.room?.roomAccommodation?.name || '';

                        const roomNameParts = [roomTypeName, roomCategoryName, roomAccommodationName].filter(p => p && p.trim());
                        const fullRoomName = roomNameParts.length > 0 ? roomNameParts.join(' - ') : 'Standard Room';

                        entry.rooms.push({
                            id: s.room?.roomType?.id || `${key}-${entry.rooms.length}`,
                            name: fullRoomName,
                            description: `${roomAccommodationName || 'Standard accommodation'}`,
                            price: s.totalCost || 0,
                            availability: (s.quotaType === 0 || s.quotaType === 1) ? 'available' : 'on_request',
                            capacity: `${adults}+${children}`
                        });

                        if (s.totalCost < entry.price) {
                            entry.price = s.totalCost;
                        }
                    });
                    parsed = Array.from(hotelMap.values());
                }

                processResults(parsed);
            } catch (err) {
                console.error(`[Search] Error for ${provider}:`, err);
                // Correctly handle loading state if error happens
                setActiveSearches(prev => {
                    const newVal = Math.max(0, prev - 1);
                    if (newVal === 0) setIsLoading(false);
                    return newVal;
                });
            }
        };

        // Fire off calls using the unified HotelProviderManager
        const manager = getHotelProviderManager();
        const searchParams = {
            destination: locationInput,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            adults,
            children,
            childrenAges,
            rooms,
            providerId: selectedDestination?.id,
            providerType: selectedDestination?.type,
            targetProvider: selectedDestination?.source
        };

        const activeProviderNames = Object.entries(enabledProviders)
            .filter(([_, enabled]) => enabled)
            .map(([name]) => {
                if (name === 'opengreece') return 'OpenGreece';
                if (name === 'tct') return 'TCT';
                if (name === 'solvex') return 'Solvex';
                if (name === 'solvexai') return 'Solvex AI';
                return 'ORS';
            });

        activeProviderNames.forEach(providerName => {
            const searchPromise = manager.searchByProvider(providerName, searchParams)
                .then(genericResults => {
                    // Transform generic results to UI-specific CombinedResult format
                    return genericResults.map(h => ({
                        id: h.id,
                        source: h.providerName as any,
                        name: h.hotelName,
                        location: h.location,
                        price: h.price,
                        currency: h.currency,
                        image: h.image || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800",
                        stars: h.stars,
                        mealPlan: h.mealPlan,
                        availability: h.availability === 'available' ? 'available' : h.availability === 'on_request' ? 'on_request' : 'stop_sale',
                        rooms: h.rooms.map(r => ({
                            id: r.id,
                            name: r.name,
                            description: r.description,
                            price: r.price,
                            availability: r.availability === 'available' ? 'available' : r.availability === 'on_request' ? 'on_request' : 'stop_sale',
                            capacity: String(r.capacity || '')
                        })),
                        aiScore: (h as any).aiScore,
                        originalData: h.originalData
                    }));
                });

            handleOneSearch(providerName.toLowerCase(), searchPromise);
        });
    };

    const handleCheckInChange = (date: string) => {
        setCheckIn(date);
        if (date && nights > 0) {
            const outDate = new Date(date);
            outDate.setDate(outDate.getDate() + nights);
            setCheckOut(outDate.toISOString().split('T')[0]);
        }
    };

    const handleNightsChange = (newNights: number) => {
        if (checkIn && newNights > 0) {
            const outDate = new Date(checkIn);
            outDate.setDate(outDate.getDate() + newNights);
            setCheckOut(outDate.toISOString().split('T')[0]);
        }
    };

    const syncNightsFromDates = (start: string, end: string) => {
        if (!start || !end) return;
        const s = new Date(start);
        const e = new Date(end);
        const diff = e.getTime() - s.getTime();
        const n = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        setNights(n);
    };

    const filteredResults = React.useMemo(() => {
        const query = hotelNameFilter.trim().toLowerCase();
        let filtered = results.filter((r, index) => {
            const normalized = normalizeMealPlan(r.mealPlan);
            const sourceMatch = selectedSources.includes('all') || selectedSources.length === 0 || selectedSources.includes(r.source);
            const mealMatch = selectedMealPlans.includes('all') || selectedMealPlans.length === 0 || selectedMealPlans.includes(normalized);

            // Don't default to 4 stars if missing - use actual value or 0
            const hotelStars = Math.floor(r.stars || 0).toString();
            const starMatch = selectedStars.includes('all') || selectedStars.length === 0 || selectedStars.includes(hotelStars);
            const nameMatch = !query || r.name.toLowerCase().includes(query);

            return sourceMatch && mealMatch && starMatch && nameMatch;
        });

        // Apply Sorting
        if (sortBy === 'price_low') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price_high') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'smart') {
            // Default Smart Ranking (Sort by score first, then price)
            filtered.sort((a, b) => {
                if ((b.softZoneScore || 0) !== (a.softZoneScore || 0)) {
                    return (b.softZoneScore || 0) - (a.softZoneScore || 0);
                }
                return a.price - b.price;
            });
        }

        return filtered;
    }, [results, selectedSources, selectedMealPlans, selectedStars, hotelNameFilter, sortBy]);

    const sortBtnStyle = (isActive: boolean): React.CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '8px',
        border: '1px solid',
        borderColor: isActive ? '#3b82f6' : 'rgba(255,255,255,0.1)',
        background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        color: isActive ? '#3b82f6' : 'rgba(255,255,255,0.6)',
        fontSize: '11px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none'
    });

    return (
        <div className={`total-trip-container global-hub-search ${isSubagent ? 'b2b-active-mode' : ''}`}>
            <header className="total-trip-header">
                <div className="header-content">
                    <h1><Globe className="icon-main" /> Global Search Hub</h1>
                    <p>Pretražite istovremeno TCT i Open Greece baze za najbolje ponude</p>
                </div>
                <div className="header-badge ai-premium unified">
                    <Database size={16} />
                    <span>Cross-Provider Analytics</span>
                </div>
                {isSubagent && (
                    <div className="b2b-status-badge">
                        <ShieldCheck size={14} />
                        <span>B2B PARTNER MODE</span>
                    </div>
                )}
            </header>


            {/* API Provider Toggles - Hidden for Subagents */}
            {!isSubagent && (
                <div className="provider-toggles-section">
                    <div className="provider-toggles-header">
                        <div className="header-left">
                            <Database size={18} />
                            <span>API Provajderi</span>
                        </div>
                        <div className="master-api-toggle-wrapper">
                            <span className="toggle-label-v4">
                                Konekcije: {apiConnectionsEnabled ? 'AKTIVNE' : 'ISKLJUČENE'}
                            </span>
                            <button
                                className={`master-power-btn ${apiConnectionsEnabled ? 'on' : 'off'}`}
                                onClick={() => setApiConnectionsEnabled(!apiConnectionsEnabled)}
                                title={apiConnectionsEnabled ? "Isključi sve konekcije" : "Uključi sve konekcije"}
                            >
                                <Power size={20} />
                            </button>
                        </div>
                    </div>
                    <div className={`provider-toggles ${!apiConnectionsEnabled ? 'disabled-section' : ''}`}>
                        <button
                            className={`provider-toggle ${enabledProviders.opengreece ? 'active' : ''}`}
                            onClick={() => apiConnectionsEnabled && setEnabledProviders(prev => ({ ...prev, opengreece: !prev.opengreece }))}
                            disabled={!apiConnectionsEnabled}
                        >
                            <Globe size={20} />
                            <span>OpenGreece</span>
                            {enabledProviders.opengreece && <CheckCircle2 size={16} className="check-icon" />}
                        </button>

                        <button
                            className={`provider-toggle ${enabledProviders.tct ? 'active' : ''}`}
                            onClick={() => apiConnectionsEnabled && setEnabledProviders(prev => ({ ...prev, tct: !prev.tct }))}
                            disabled={!apiConnectionsEnabled}
                        >
                            <Database size={20} />
                            <span>TCT</span>
                            {enabledProviders.tct && <CheckCircle2 size={16} className="check-icon" />}
                        </button>

                        <button
                            className={`provider-toggle ${enabledProviders.solvex ? 'active' : ''}`}
                            onClick={() => apiConnectionsEnabled && setEnabledProviders(prev => ({ ...prev, solvex: !prev.solvex }))}
                            disabled={!apiConnectionsEnabled}
                            title="Solvex Bulgaria"
                        >
                            <Building2 size={20} />
                            <span>Solvex</span>
                            {enabledProviders.solvex && <CheckCircle2 size={16} className="check-icon" />}
                        </button>

                        <button
                            className={`provider-toggle ai-lab ${enabledProviders.solvexai ? 'active' : ''}`}
                            onClick={() => apiConnectionsEnabled && setEnabledProviders(prev => ({ ...prev, solvexai: !prev.solvexai }))}
                            disabled={!apiConnectionsEnabled}
                            title="Solvex AI Lab (Agoda Engine)"
                        >
                            <Sparkles size={20} className="ai-icon" />
                            <span>Solvex AI</span>
                            {enabledProviders.solvexai && <CheckCircle2 size={16} className="check-icon" />}
                        </button>

                        <button
                            className={`provider-toggle ${enabledProviders.ors ? 'active' : ''}`}
                            onClick={() => apiConnectionsEnabled && setEnabledProviders(prev => ({ ...prev, ors: !prev.ors }))}
                            disabled={!apiConnectionsEnabled}
                            title="ORS Multi-Operator"
                        >
                            <Globe size={20} />
                            <span>ORS</span>
                            {enabledProviders.ors && <CheckCircle2 size={16} className="check-icon" />}
                        </button>
                    </div>
                </div>
            )}

            <div className="trip-builder-console">
                <div className="search-form-complex unified">
                    <div className="form-row main">
                        <div className="input-group-premium main-search wide">
                            <label className="smart-label">
                                <MapPin size={14} className="sparkle-accent" />
                                Destinacija ili Hotel
                            </label>
                            <input
                                type="text"
                                placeholder="Npr: Hurghada, Greece, Rodos..."
                                value={locationInput}
                                onChange={e => handleLocationInputChange(e.target.value)}
                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                className="smart-query-input"
                                autoComplete="off"
                            />
                            {showSuggestions && (
                                <div className="autocomplete-dropdown">
                                    {suggestions.map((s, idx) => (
                                        <div
                                            key={idx}
                                            className={`suggestion-item-v4 ${s.type}`}
                                            onClick={() => handleSelectSuggestion(s)}
                                        >
                                            <div className="suggestion-icon-v4">
                                                {s.type === 'city' ? <MapPin size={16} /> : <Hotel size={16} />}
                                            </div>
                                            <div className="suggestion-info">
                                                <span className="suggestion-name">
                                                    {s.name}{s.stars ? `, ${s.stars}*` : ''}
                                                </span>
                                                <span className="suggestion-meta">
                                                    {s.type === 'city' ? 'Destinacija' : `Hotel • ${s.location}`}
                                                </span>
                                            </div>
                                            <div className={`source-tag-v4 ${s.source.toLowerCase()}`}>
                                                {s.source}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="input-group-premium modern-date-wrapper" onClick={() => setActiveCalendar('in')}>
                            <label><MoveRight size={14} /> {t.checkIn}</label>
                            <div className="custom-date-display">
                                <Calendar size={16} />
                                <span>{formatDate(checkIn) || 'Odaberite datum'}</span>
                            </div>
                        </div>

                        <div className="input-group-premium nights-tiny">
                            <label><Moon size={14} /> {t.nights}</label>
                            <input
                                type="number"
                                min="1"
                                value={nights === 0 ? '' : nights}
                                onChange={e => {
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                    setNights(val);
                                    if (val > 0) handleNightsChange(val);
                                }}
                                style={{ textAlign: 'center' }}
                            />
                        </div>

                        <div className="input-group-premium modern-date-wrapper" onClick={() => setActiveCalendar('out')}>
                            <label><MoveLeft size={14} /> {t.checkOut}</label>
                            <div className="custom-date-display">
                                <Calendar size={16} />
                                <span>{formatDate(checkOut) || 'Odaberite datum'}</span>
                            </div>
                        </div>

                        {/* Flexible Dates Selection */}
                        <div className="input-group-premium flex-group-v4">
                            <label><CalendarDays size={14} /> Fleksibilnost</label>
                            <div className="flex-pill-selection">
                                {[0, 1, 3, 5].map(days => (
                                    <button
                                        key={days}
                                        className={`flex-pill ${flexibleDays === days ? 'active' : ''}`}
                                        onClick={() => setFlexibleDays(days)}
                                    >
                                        {days === 0 ? 'Tačno' : `± ${days}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-row passengers-action-line-v4">
                        <div className="input-group-premium rooms-input">
                            <label><Hotel size={14} /> {t.rooms}</label>
                            <input
                                type="number"
                                min="1"
                                value={rooms === 0 ? '' : rooms}
                                onChange={e => setRooms(e.target.value === '' ? 0 : parseInt(e.target.value))}
                                style={{ textAlign: 'center' }}
                            />
                        </div>
                        <div className="input-group-premium adults-input">
                            <label><Users size={14} /> {t.adults}</label>
                            <input
                                type="number"
                                min="1"
                                value={adults === 0 ? '' : adults}
                                onChange={e => setAdults(e.target.value === '' ? 0 : parseInt(e.target.value))}
                                style={{ textAlign: 'center' }}
                            />
                        </div>
                        <div className="input-group-premium children-input">
                            <label><Users2 size={14} /> {t.children}</label>
                            <input
                                type="number"
                                min="0"
                                max="4"
                                value={children}
                                onChange={e => {
                                    const raw = e.target.value;
                                    const count = raw === '' ? 0 : Math.min(4, Math.max(0, parseInt(raw) || 0));
                                    setChildren(count);
                                    // ... existing logic
                                    setChildrenAges(prev => {
                                        const newAges = [...prev];
                                        if (count > prev.length) {
                                            // Add default ages (e.g. 7 years old)
                                            for (let i = prev.length; i < count; i++) {
                                                newAges.push(7);
                                            }
                                        } else {
                                            // Trim array
                                            newAges.length = count;
                                        }
                                        return newAges;
                                    });
                                }}
                            />
                        </div>

                        {children > 0 && (
                            <div className="children-ages-inline-v4">
                                {childrenAges.map((age, idx) => (
                                    <div key={idx} className="age-input-premium">
                                        <label>Dete {idx + 1}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="17"
                                            value={age}
                                            onChange={e => {
                                                const raw = e.target.value;
                                                const newAges = [...childrenAges];
                                                newAges[idx] = raw === '' ? 0 : Math.min(17, Math.max(0, parseInt(raw) || 0));
                                                setChildrenAges(newAges);
                                            }}
                                            style={{ textAlign: 'center' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <button className="search-launch-btn-v4 unified" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="spin" /> : <Search size={22} />}
                            <span>Pretraži Sve</span>
                        </button>
                    </div>

                    {isSubagent && (
                        <div className="b2b-margin-control-row animate-fade-in">
                            <div className="margin-input-group">
                                <label><DollarSign size={14} /> Vaša Marža</label>
                                <div className="margin-toggle-inputs">
                                    <input
                                        type="number"
                                        value={b2bMargin.value}
                                        onChange={(e) => setB2bMargin({ ...b2bMargin, value: parseFloat(e.target.value) || 0 })}
                                    />
                                    <select
                                        value={b2bMargin.type}
                                        onChange={(e) => setB2bMargin({ ...b2bMargin, type: e.target.value as 'percentage' | 'fixed' })}
                                    >
                                        <option value="percentage">%</option>
                                        <option value="fixed">EUR</option>
                                    </select>
                                </div>
                            </div>
                            <div className="commission-preview">
                                <Info size={14} />
                                <span>Predviđena osnovna provizija: <strong>8% - 12%</strong></span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Soft Zone Reflex Banners - MOVED BELOW FOR STABILITY */}
            {activeTriggers.length > 0 && (
                <div className="soft-zone-banners-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    {activeTriggers.map(trigger => (
                        <div key={trigger.id} className={`soft-zone-reflex-banner animate-fade-in reflex-${trigger.id}`}>
                            <div className="reflex-icon">
                                <Zap size={20} fill={trigger.id === 'price_guard_reflex' ? '#10b981' : '#3b82f6'} color={trigger.id === 'price_guard_reflex' ? '#10b981' : '#3b82f6'} />
                            </div>
                            <div className="reflex-content">
                                <div className="reflex-label"><strong>{trigger.label}:</strong> {trigger.action}</div>
                                {trigger.description && <div className="reflex-reason">{trigger.description}</div>}
                            </div>
                            {trigger.id === 'price_guard_reflex' ? (
                                <div className="reflex-timer">{lang === 'sr' ? 'ISTIČE ZA' : 'EXPIRES IN'} 47:59:59</div>
                            ) : (
                                <button className="reflex-details-btn" onClick={() => navigate('/soft-zone')}>
                                    {lang === 'sr' ? 'Više detalja' : 'More details'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Active Calendar Modal */}
            {activeCalendar === 'in' && (
                <ModernCalendar
                    startDate={checkIn}
                    endDate={checkOut}
                    onChange={(s, e) => {
                        setCheckIn(s);
                        if (e) {
                            setCheckOut(e);
                            syncNightsFromDates(s, e);
                        }
                        setActiveCalendar(null);
                    }}
                    onClose={() => setActiveCalendar(null)}
                />
            )}
            {activeCalendar === 'out' && (
                <ModernCalendar
                    startDate={checkIn}
                    endDate={checkOut}
                    onChange={(s, e) => {
                        setCheckIn(s);
                        if (e) {
                            setCheckOut(e);
                            syncNightsFromDates(s, e);
                        }
                        setActiveCalendar(null);
                    }}
                    onClose={() => setActiveCalendar(null)}
                />
            )}

            {/* Flexible Dates Ribbon */}
            {searchPerformed && flexibleDays > 0 && (
                <div className="flexible-dates-ribbon-container">
                    <div className="ribbon-header-v4">
                        <div className="header-left-v4">
                            <CalendarDays size={20} className="glow-icon" />
                            <div className="header-text-v4">
                                <span className="title-v4">Fleksibilni datumi (±{flexibleDays} dana)</span>
                                <span className="sub-v4">Kliknite na datum za prikaz cena za taj polazak</span>
                            </div>
                        </div>
                    </div>
                    <div className="flexible-dates-strip">
                        {generateFlexDates(selectedArrivalDate || checkIn, flexibleDays).map((dateStr) => {
                            const dateObj = new Date(dateStr);
                            const isActive = dateStr === checkIn;
                            const dayName = dateObj.toLocaleDateString('sr-RS', { weekday: 'short' });
                            const dayNum = dateObj.getDate();
                            const monthName = dateObj.toLocaleDateString('sr-RS', { month: 'short' });

                            return (
                                <div
                                    key={dateStr}
                                    className={`flex-date-tile-premium ${isActive ? 'active' : ''}`}
                                    onClick={() => {
                                        if (!isActive) {
                                            handleCheckInChange(dateStr);
                                            handleSearch();
                                        }
                                    }}
                                >
                                    <div className="tile-top">
                                        <span className="flex-day-name">{dayName}</span>
                                    </div>
                                    <div className="tile-main">
                                        <span className="flex-day-num">{dayNum}</span>
                                        <span className="flex-month">{monthName}</span>
                                    </div>
                                    <div className="tile-footer">
                                        {isActive ? (
                                            <span className="status-active"><Zap size={10} /> AKTIVNO</span>
                                        ) : (
                                            <span className="status-check">PROVERI CENE</span>
                                        )}
                                    </div>
                                    {isActive && <div className="active-glow" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="content-workflow">
                {error && (
                    <div className="error-banner animate-fade-in">
                        <Info size={20} />
                        <span style={{ flex: 1 }}>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.6 }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {(searchPerformed && (results.length > 0 || isLoading)) && (
                    <div className="filters-toolbar-v4" style={{
                        padding: '12px',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        marginBottom: '16px',
                        borderRadius: '12px',
                        flexWrap: 'wrap'
                    }}>
                        <div className="name-filter-wrapper" style={{ position: 'relative', flex: '1.5', minWidth: '200px' }}>
                            <Search size={14} className="filter-search-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                className="name-filter-input"
                                placeholder="Traži po nazivu..."
                                value={hotelNameFilter}
                                onChange={(e) => setHotelNameFilter(e.target.value)}
                            />
                        </div>

                        <div style={{ flex: '1', minWidth: '150px' }}>
                            <MultiSelectDropdown
                                options={CATEGORY_OPTIONS}
                                selected={selectedStars}
                                onChange={setSelectedStars}
                                placeholder="Kategorija"
                            />
                        </div>

                        <div style={{ flex: '1', minWidth: '150px' }}>
                            <MultiSelectDropdown
                                options={SOURCE_OPTIONS}
                                selected={selectedSources}
                                onChange={setSelectedSources}
                                placeholder="Svi Dobavljači"
                            />
                        </div>

                        <div style={{ flex: '1.2', minWidth: '180px' }}>
                            <MultiSelectDropdown
                                options={MEAL_PLAN_OPTIONS}
                                selected={selectedMealPlans}
                                onChange={setSelectedMealPlans}
                                placeholder="Filtriraj Uslugu"
                            />
                        </div>

                        <div className="view-mode-switcher" style={{ display: 'flex', gap: '4px', marginLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '12px' }}>
                            <button
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Mreža"
                                style={{ height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title="Lista"
                                style={{ height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                            >
                                <ListIcon size={18} />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
                                onClick={() => setViewMode('map')}
                                title="Mapa"
                                style={{ height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                            >
                                <MapIcon size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {searchPerformed && (results.length > 0 || !isLoading) && (
                    <div className="results-summary-bar-v4" style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        fontSize: '11px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', gap: '30px' }}>
                            <span>UKUPNO REZULTATA: <strong>{results.length}</strong></span>
                            <span>FILTRIRANO: <strong style={{ color: '#10b981' }}>{filteredResults.length}</strong></span>
                            {hotelNameFilter && <span>PRETRAGA: <strong style={{ color: '#3b82f6' }}>"{hotelNameFilter}"</strong></span>}
                            {!selectedStars.includes('all') && <span>KATEGORIJA: <strong style={{ color: '#f59e0b' }}>{selectedStars.join(', ')}*</strong></span>}
                        </div>

                        <div className="sort-controls-v4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginRight: '8px' }}>Sortiraj po:</span>

                            <button
                                className={`sort-btn-tiny ${sortBy === 'smart' ? 'active' : ''}`}
                                onClick={() => setSortBy('smart')}
                                style={sortBtnStyle(sortBy === 'smart')}
                            >
                                <Zap size={12} /> Pametno
                            </button>

                            <button
                                className={`sort-btn-tiny ${sortBy === 'price_low' ? 'active' : ''}`}
                                onClick={() => setSortBy('price_low')}
                                style={sortBtnStyle(sortBy === 'price_low')}
                            >
                                <ArrowDownWideNarrow size={12} /> Najniža cena
                            </button>

                            <button
                                className={`sort-btn-tiny ${sortBy === 'price_high' ? 'active' : ''}`}
                                onClick={() => setSortBy('price_high')}
                                style={sortBtnStyle(sortBy === 'price_high')}
                            >
                                <ArrowUpNarrowWide size={12} /> Najviša cena
                            </button>
                        </div>
                    </div>
                )}

                {enabledProviders.solvexai && searchPerformed && results.length > 0 && (
                    <div className="ai-lab-insights-banner animate-slide-down">
                        <div className="insight-glow"></div>
                        <Sparkles className="insight-icon" size={24} />
                        <div className="insight-text">
                            <h4>AI Lab: Agoda Intelligence Engine Aktivan</h4>
                            <p>Analizirali smo {results.length} ponuda i primenili "Value-for-Money" scoring algoritam. Top 3 rezultata su označena kao <strong>Smart Choice</strong>.</p>
                        </div>
                        <div className="insight-badge">Agoda Agent Pattern v1.0</div>
                    </div>
                )}

                {!searchPerformed && (
                    <div className="zen-placeholder">
                        <div className="unified-icon-display">
                            <Globe size={40} className="floating-icon globe" />
                            <Database size={40} className="floating-icon db" />
                            <Sparkles size={80} className="main-sparkle" />
                        </div>
                        <h2>Global Hub: Jedan klik, svi dobavljači</h2>
                        <p>Dobićete najbolje cene direktno iz više izvora istovremeno.</p>
                    </div>
                )}

                {isLoading && results.length === 0 && (
                    <div className="loading-orchestrator">
                        <div className="unified-loader-pulse"></div>
                        <p>Pokrećem unificiranu pretragu...</p>
                    </div>
                )}

                {activeSearches > 0 && results.length > 0 && (
                    <div className="streaming-indicator animate-fade-in" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 20px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '30px',
                        width: 'fit-content',
                        margin: '0 auto 20px auto',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        fontSize: '12px',
                        color: '#60a5fa'
                    }}>
                        <Loader2 size={16} className="spin" />
                        <span>Dodatni dobavljači još uvek šalju podatke ({activeSearches} preostalo)...</span>
                    </div>
                )}

                {searchPerformed && results.length === 0 && !isLoading && activeSearches === 0 && (
                    <div className="smart-fallback-zone">
                        <div className="fallback-header">
                            <Sparkles className="spark-icon" />
                            <h3>Specijalno za Vas pronašli smo alternative</h3>
                            <p>Nažalost, objekat <strong>{locationInput}</strong> trenutno nema dostupnih kapaciteta za izabrani termin, ali ovi hoteli u istoj regiji su odlično ocenjeni:</p>
                        </div>

                        <div className="fallback-grid">
                            {[
                                { name: 'Admiral, 5*', loc: 'Golden Sands', price: 420, src: 'Solvex', score: 92, img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=600' },
                                { name: 'Melia Grand Hermitage, 5*', loc: 'Golden Sands', price: 512, src: 'TCT', score: 96, img: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80&w=600' },
                                { name: 'Sunrise Blue Magic, 4*', loc: 'Obzor', price: 345, src: 'Solvex', score: 88, img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=600' }
                            ].map((h, i) => (
                                <div key={i} className="fallback-mini-card" style={{ backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.95)), url(${h.img})` }}>
                                    <div className="mini-score"><Sparkles size={10} /> Smart Choice {h.score}%</div>
                                    <div className="mini-content">
                                        <h4>{h.name}</h4>
                                        <div className="mini-loc"><MapPin size={12} /> {h.loc}</div>
                                        <div className="mini-price">Cena od <strong>{h.price} EUR</strong></div>
                                        <button className="mini-select-btn">Pogledaj ponudu</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="fallback-action">
                            <p>Želite li da proširimo pretragu na susedne regije ili promenimo termine za +/- 3 dana?</p>
                            <div className="fallback-chips">
                                <button className="f-chip">Promeni na +/- 3 dana</button>
                                <button className="f-chip">Susedna regija (Albena)</button>
                                <button className="f-chip">Susedna regija (St. Constantine)</button>
                            </div>
                        </div>
                    </div>
                )}

                {searchPerformed && results.length > 0 && (
                    <div className={`results-container ${viewMode}-view`}>
                        {viewMode === 'map' ? (
                            <div className="map-view-placeholder">
                                <div className="map-sidebar">
                                    {filteredResults.map(hotel => (
                                        <div key={hotel.id} className="map-side-card"
                                            onClick={() => {
                                                if (hotel.source === 'TCT') navigate('/tct');
                                                else if (hotel.source === 'Solvex') navigate(`/solvex-hotel/${hotel.id}`);
                                                else navigate(`/opengreece-hotel/${hotel.originalData.hotelCode}`);
                                            }}
                                        >
                                            <img src={hotel.image} alt="" />
                                            <div className="side-info">
                                                <h4>{hotel.name}</h4>
                                                <p>{hotel.price} {hotel.currency}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="map-canvas-mock">
                                    <div className="mock-map-bg">
                                        <MapPin size={40} className="map-center-icon" />
                                        <p>Interaktivna mapa regije: {locationInput}</p>

                                        {filteredResults.slice(0, 5).map((h, i) => (
                                            <div key={h.id} className="map-marker-mock" style={{
                                                top: `${30 + (i * 12)}%`,
                                                left: `${40 + (i * 8)}%`
                                            }}>
                                                <div className="marker-label">{h.price}€</div>
                                                <MapPin size={24} fill="#4f46e5" color="white" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={`results-mosaic ${viewMode === 'list' ? 'list-layout' : 'grid-layout'}`}>
                                {filteredResults.map(hotel => (
                                    <div key={hotel.id} className={`hotel-result-card-premium unified ${hotel.source.toLowerCase().replace(/\s+/g, '-')} ${viewMode === 'list' ? 'horizontal' : ''}`}>
                                        <a href={`/hotel-view/${hotel.id}`} target="_blank" rel="noopener noreferrer" className="hotel-card-image">
                                            <img src={hotel.image} alt={hotel.name} />
                                            {!isSubagent && (
                                                <div className="source-badge">
                                                    {hotel.source === 'TCT' ? 'TCT' : hotel.source}
                                                </div>
                                            )}
                                            {hotel.source === 'Solvex AI' && (
                                                <div className="intelligence-boost-badge ai-lab animate-pulse">
                                                    <Sparkles size={10} /> {hotel.aiScore ? `AI Optimized (${hotel.aiScore}%)` : 'AI Engine Optimized'}
                                                </div>
                                            )}
                                            {hotel.source !== 'Solvex AI' && hotel.softZoneScore && hotel.softZoneScore > 0 && (
                                                <div className="intelligence-boost-badge animate-pulse">
                                                    <Zap size={10} /> {activeTriggers[0]?.label || 'Smart Choice'}
                                                </div>
                                            )}
                                            <div className="image-overlay">
                                                <div className="hotel-stars-badge">
                                                    {Array(hotel.stars).fill(0).map((_, i) => (
                                                        <Star key={i} size={10} fill="currentColor" />
                                                    ))}
                                                </div>
                                            </div>
                                        </a>
                                        <div className="hotel-card-content">
                                            <div className="hotel-info-text">
                                                <div className="hotel-title-row">
                                                    <a href={`/hotel-view/${hotel.id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                                                        <h3 style={{ margin: 0 }}>{hotel.name}</h3>
                                                    </a>
                                                    <div className="hotel-location-tag">
                                                        <MapPin size={14} />
                                                        <span>{hotel.location}</span>
                                                    </div>
                                                    <div className="hotel-date-badge">
                                                        <CalendarDays size={14} />
                                                        <span>{formatDate(checkIn)} - {formatDate(checkOut)} ({nights + 1} dana / {nights} noćenja)</span>
                                                    </div>
                                                </div>

                                                <div className="hotel-features-badging">
                                                    <span className="feature-badge service">
                                                        <Zap size={12} /> {getMealPlanDisplayName(hotel.mealPlan)}
                                                    </span>
                                                </div>

                                                {viewMode === 'list' && (
                                                    <p className="hotel-description-short">
                                                        {hotel.originalData.hotel_description || 'Luksuzan smeštaj sa bogatim sadržajima, smešten na idealnoj lokaciji za savršen letnji odmor i relaksaciju.'}
                                                    </p>
                                                )}

                                                <div className={`availability-floating-badge ${hotel.availability}`}>
                                                    {hotel.availability === 'available' && <><CheckCircle2 size={12} /> Dostupno</>}
                                                    {hotel.availability === 'on_request' && <><Clock size={12} /> Na Upit</>}
                                                    {hotel.availability === 'stop_sale' && <><X size={12} /> Rasprodato</>}
                                                    {hotel.availability === 'unknown' && <><Info size={12} /> Proveri Status</>}
                                                </div>
                                            </div>

                                            <div className="price-action-section">
                                                <div className="lowest-price-tag">
                                                    {isSubagent ? (
                                                        <div className="b2b-price-stack">
                                                            <div className="net-price-badge">NET: {hotel.price} {hotel.currency}</div>
                                                            <div className="preview-price-main">
                                                                <span className="from-label">PREVIEW CENA:</span>
                                                                <span className="price-val">{getPriceWithMargin(hotel.price)} {hotel.currency}</span>
                                                            </div>
                                                            <div className="commission-hint">Zarada: {getPriceWithMargin(hotel.price) - hotel.price} {hotel.currency}</div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="from-label">Najbolja cena od</span>
                                                            <span className="price-val">{hotel.price} {hotel.currency}</span>
                                                        </>
                                                    )}
                                                    {activeTriggers.some(t => t.id === 'economy_reflex') && (
                                                        <div className="installment-label animate-fade-in">
                                                            ili 12 rata po <strong>{Math.round((isSubagent ? getPriceWithMargin(hotel.price) : hotel.price) / 12)} {hotel.currency}</strong>
                                                        </div>
                                                    )}
                                                </div>

                                                {hotel.otherOffers && hotel.otherOffers.length > 0 && (
                                                    <div className="provider-comparison-list">
                                                        <div className="comp-title"><ShieldCheck size={10} /> Uporedni prikaz:</div>
                                                        <div className="comp-chips">
                                                            <div className="comp-chip active">
                                                                <span className="chip-src">{hotel.source}</span>
                                                                <span className="chip-prc">{hotel.price}€</span>
                                                            </div>
                                                            {hotel.otherOffers.map((off, i) => (
                                                                <div key={i} className="comp-chip">
                                                                    <span className="chip-src">{off.source}</span>
                                                                    <span className="chip-prc">{off.price}€</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    className="view-more-btn"
                                                    onClick={() => setExpandedHotel(hotel)}
                                                >
                                                    Detalji ponude <ArrowRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {expandedHotel && (
                    <div className="modern-calendar-overlay" onClick={() => setExpandedHotel(null)}>
                        <div className="modern-calendar-popup wide animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95vw' }}>
                            <div className="hotel-rooms-modal-header">
                                <div className="modal-title-zone">
                                    <h2>{expandedHotel.name}</h2>
                                    <div className="modal-meta">
                                        <MapPin size={14} /> {expandedHotel.location} • <strong style={{ fontWeight: 700, color: '#3b82f6' }}>{getMealPlanDisplayName(expandedHotel.mealPlan)}</strong>
                                    </div>
                                </div>
                                <button className="close-modal-btn" onClick={() => setExpandedHotel(null)}><X size={20} /></button>
                            </div>

                            <div className="rooms-comparison-table">
                                <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', padding: '12px 16px' }}>
                                    <div className="h-room">Tip smeštaja i usluga</div>
                                    <div className="h-cap">Kapacitet</div>
                                    <div className="h-price">Cena</div>
                                    <div className="h-action">Akcija</div>
                                </div>
                                <div className="table-body">
                                    {expandedHotel.rooms && expandedHotel.rooms.length > 0 ? (
                                        expandedHotel.rooms.map((room, i) => (
                                            <div key={i} className="room-row-v4" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', padding: '12px 16px', alignItems: 'center' }}>
                                                <div className="r-name" style={{ overflow: 'visible', whiteSpace: 'normal' }}>
                                                    <strong style={{ fontSize: '14px', lineHeight: '1.4' }}>{room.name}</strong>
                                                    {room.description && <p style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 0 0' }}>{room.description}</p>}
                                                </div>
                                                <div className="r-cap"><Users2 size={14} /> {room.capacity}</div>
                                                <div className="r-price" style={{ fontWeight: 'bold', fontSize: '15px' }}>{room.price} {expandedHotel.currency}</div>
                                                <div className="r-action">
                                                    <button
                                                        className="select-room-btn"
                                                        onClick={() => handleReserveClick(room)}
                                                    >
                                                        Rezerviši
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="room-row-v4" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', padding: '12px 16px', alignItems: 'center' }}>
                                            <div className="r-name">Standardna soba (osnovna ponuda)</div>
                                            <div className="r-cap"><Users2 size={14} /> {adults}+{children}</div>
                                            <div className="r-price">{expandedHotel.price} {expandedHotel.currency}</div>
                                            <div className="r-action">
                                                <button
                                                    className="select-room-btn"
                                                    onClick={() => handleReserveClick({
                                                        name: 'Standardna soba (osnovna ponuda)',
                                                        capacity: `${adults}+${children}`,
                                                        price: expandedHotel.price
                                                    })}
                                                >
                                                    Rezerviši
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer-v4">
                                {!isSubagent && (
                                    <div className="provider-tag">
                                        Izvor podataka: <strong>{expandedHotel.source}</strong>
                                    </div>
                                )}
                                <p>Cene su informativnog karaktera i podložne su promeni do potvrde rezervacije.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Active Calendar Modal */}
            {activeCalendar === 'in' && (
                <ModernCalendar
                    startDate={checkIn}
                    endDate={checkOut}
                    onChange={(s, e) => {
                        setCheckIn(s);
                        if (e) {
                            setCheckOut(e);
                            syncNightsFromDates(s, e);
                        }
                        setActiveCalendar(null);
                    }}
                    onClose={() => setActiveCalendar(null)}
                />
            )}
            {activeCalendar === 'out' && (
                <ModernCalendar
                    startDate={checkIn}
                    endDate={checkOut}
                    onChange={(s, e) => {
                        setCheckIn(s);
                        if (e) {
                            setCheckOut(e);
                            syncNightsFromDates(s, e);
                        }
                        setActiveCalendar(null);
                    }}
                    onClose={() => setActiveCalendar(null)}
                />
            )}

            {/* Booking Modal (Passenger Form) */}
            {isBookingModalOpen && expandedHotel && selectedRoomForBooking && (
                <BookingModal
                    isOpen={isBookingModalOpen}
                    onClose={() => {
                        setIsBookingModalOpen(false);
                        setSelectedRoomForBooking(null);
                    }}
                    provider={expandedHotel.source.toLowerCase() as 'solvex' | 'tct' | 'opengreece'}
                    bookingData={{
                        hotelName: expandedHotel.name,
                        location: expandedHotel.location,
                        checkIn: checkIn,
                        checkOut: checkOut,
                        nights: nights,
                        roomType: selectedRoomForBooking.name || 'Standardna soba',
                        mealPlan: getMealPlanDisplayName(expandedHotel.mealPlan || ''),
                        adults: adults,
                        children: children,
                        totalPrice: selectedRoomForBooking.price || expandedHotel.price,
                        currency: expandedHotel.currency,
                        stars: expandedHotel.stars,
                        providerData: expandedHotel.originalData || {}
                    }}
                    onSuccess={() => { }} // Success is handled by navigation inside modal
                    onError={(error: string) => console.error('Booking failed:', error)}
                />
            )}
        </div>
    );
};

export default GlobalHubSearch;
