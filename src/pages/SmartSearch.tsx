import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ClickToTravelLogo } from '../components/icons/ClickToTravelLogo';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores';
import {
    Sparkles, Hotel, Plane, Package, Bus, Compass, LayoutTemplate,
    MapPin, Calendar, CalendarDays, Users, UtensilsCrossed, Star,
    Search, TrendingUp, TrendingDown, Zap, X, Loader2, ChevronDown,
    LayoutGrid, List as ListIcon, ArrowDownWideNarrow,
    CheckCircle2, CheckCircle, XCircle, RefreshCw, Clock, ArrowRight, Info, Calendar as CalendarIcon, ShieldCheck, AlertTriangle, HelpCircle,
    Plus, Globe, AlignLeft, Mountain, DollarSign, Coffee, Building2, Filter, Trash2,
    Database, Power, Ship, Eye, EyeOff
} from 'lucide-react';
import { useThemeStore } from '../stores';
import { performSmartSearch, type SmartSearchResult } from '../services/smartSearchService';
import { searchPrefetchService } from '../services/searchPrefetchService';
import { getMonthlyReservationCount, getBulkMonthlyReservationCounts } from '../services/reservationService';
import solvexDictionaryService from '../integrations/solvex/api/solvexDictionaryService';
import { ModernCalendar } from '../components/ModernCalendar';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { BookingModal } from '../components/booking/BookingModal';
import { BookingSuccessModal } from '../components/booking/BookingSuccessModal';
import { formatDate } from '../utils/dateUtils';
import PackageSearch from './PackageSearch';
import FlightSearch from './FlightSearch';
import { BudgetTypeToggle } from '../components/BudgetTypeToggle';
import { getProxiedImageUrl } from '../utils/imageProxy';
import './SmartSearch.css';
import './SmartSearchFix2.css';
import './SmartSearchRedesign.css';
import './SmartSearchFerrariFix.css';
import './ModalFixDefinitive.css';
import './SmartSearchStylesFix.css';
import './SmartSearchGridFix.css';
import './SmartSearchLightMode.css';
import '../archive/pages/GlobalHubSearch.css';
import './SmartSearchHistory.css';
import { SearchHistorySidebar } from './SmartSearch/components/SearchHistorySidebar';
import { FilterSidebar } from './SmartSearch/components/FilterSidebar';
import { HotelCard } from './SmartSearch/components/HotelCard';
import { HotelDetailsModal } from './SmartSearch/components/HotelDetailsModal';
import { CancellationModal } from './SmartSearch/components/CancellationModal';
import { NarrativeSearch } from '../components/packages/Steps/NarrativeSearch';
import { ImmersiveSearch, type ImmersiveSearchData } from '../components/packages/Steps/ImmersiveSearch';
import type { BasicInfoData } from '../types/packageSearch.types';
import type { HotelRoom } from '../types/hotel';

/**
 * Constants for filtering
 */
const CATEGORY_OPTIONS = [
    { value: 'all', label: 'Sve Kategorije' },
    { value: '5', label: '5 Zvezdica' },
    { value: '4', label: '4 Zvezdice' },
    { value: '3', label: '3 Zvezdice' },
    { value: '2', label: '2 Zvezdice' }
];

const MEAL_PLAN_OPTIONS = [
    { value: 'all', label: 'Sve Usluge' },
    { value: 'RO', label: 'Samo smeštaj' },
    { value: 'BB', label: 'Doručak' },
    { value: 'HB', label: 'Polupansion' },
    { value: 'FB', label: 'Pun pansion' },
    { value: 'AI', label: 'All Inclusive+' },
];

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

/**
 * Normalize meal plan code to standard types
 */
// Local helpers removed, using central ones from ./SmartSearch/helpers.ts

/**
 * Get full meal plan display name in Serbian
 */
const formatPrice = (price: number) => {
    return price.toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// Local helpers removed, using central ones from ./SmartSearch/helpers.ts
import { normalizeMealPlan, getMealPlanDisplayName } from './SmartSearch/helpers';

const renderAvailabilityStatus = (status: string | undefined) => {
    if (!status) return null;
    const s = status.toLowerCase();

    let Icon = RefreshCw;
    let label = 'NA UPIT';
    let className = 'status-on-request';

    if (s === 'available' || s === 'slobodno' || s === 'instant') {
        Icon = Zap;
        label = 'ODMAH DOSTUPNO';
        className = 'status-available';
    } else if (s === 'unavailable' || s === 'rasprodato' || s === 'stop_sale') {
        Icon = XCircle;
        label = 'RASPRODATO';
        className = 'status-sold-out';
    }

    return (
        <div className={`availability-status-v6 ${className}`}>
            <Icon size={10} />
            <span>{label}</span>
        </div>
    );
};

export const getRoomCancelStatus = (room: HotelRoom | any) => {
    if (room?.tariff?.id === 1993) return 'non-refundable';

    // Solvex often populates cancellationPolicyRequestParams with keys needed to fetch actual policy.
    // We only treat it as a potential penalty if it has actual deadline data.
    const params = room.cancellationPolicyRequestParams;
    if (params && (params.CancellationDate || params.DaysBeforeCheckIn)) {
        const cancelDate = params.CancellationDate;
        if (cancelDate && new Date(cancelDate) > new Date()) return 'free';
        if (params.DaysBeforeCheckIn) return 'free';
        return 'penalty';
    }

    // Default to free for standard tariffs without explicit penalty information
    return 'free';
};

const renderCancellationBadge = (room: HotelRoom | any, onBadgeClick: (r: any) => void) => {
    const status = getRoomCancelStatus(room);

    let icon = <Info size={12} className="cancellation-icon" />;
    let text = "Uslovi (Timeline)";
    let className = "cancellation-info";
    let title = "Kliknite za detaljan timeline otkazivanja";

    if (status === 'non-refundable') {
        icon = <AlertTriangle size={12} className="cancellation-icon" />;
        text = "Nepovratno (Timeline)";
        className = "cancellation-non-refundable";
        title = "Ova soba je nepovratna. Kliknite za detalje.";
    } else if (status === 'free') {
        icon = <ShieldCheck size={12} className="cancellation-icon" />;
        text = "Besplatan otkaz (Timeline)";
        className = "cancellation-params free";
        title = "Besplatno otkazivanje moguće. Kliknite za datume.";
    } else if (status === 'penalty') {
        icon = <AlertTriangle size={12} className="cancellation-icon" />;
        text = "Penali (Timeline)";
        className = "cancellation-params penalty";
        title = "Otkazivanje uz penale. Kliknite za iznose.";
    }

    return (
        <div
            className={`cancellation-badge-v2 ${className}`}
            onClick={(e) => { e.stopPropagation(); onBadgeClick(room); }}
            title={title}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                border: '1px solid rgba(255,255,255,0.1)'
            }}
        >
            {icon}
            <span>{text}</span>
        </div>
    );
};

const isStatusOnRequest = (status: string | undefined) => {
    if (!status) return true;
    const s = status.toLowerCase();
    if (s === 'available' || s === 'slobodno' || s === 'instant') return false;
    if (s === 'unavailable' || s === 'rasprodato' || s === 'stop_sale') return false;
    return true; /* anything else is on request */
};

const renderMealPlanBadge = (mp: string, isLedger: boolean = false) => {
    const name = getMealPlanDisplayName(mp);
    const code = normalizeMealPlan(mp);
    let Icon = UtensilsCrossed;
    if (code === 'BB') Icon = Coffee;
    if (code === 'HB') Icon = UtensilsCrossed;
    if (code === 'AI' || code === 'UAI') Icon = Sparkles;
    if (code === 'RO') Icon = Building2;

    return (
        <div className={isLedger ? "meal-plan-ledger-display" : "meal-plan-badge-v2"}>
            <Icon size={isLedger ? 14 : 12} />
            <span>{name}</span>
        </div>
    );
};

/**
 * Strips redundant destination info from room names
 */
const cleanRoomName = (name: string): string => {
    if (!name) return '';
    return name
        .replace(/\s*\(\s*Dest:[^)]*\)/gi, '') // Remove (Dest: ...)
        .replace(/\s*Dest:[^)]*/gi, '')       // Remove Dest: ... without parens
        .replace(/\s*\(\s*(Golden Sands|Sunny Beach|Nessebar|Albena|Bansko|Borovets|Pamporovo|Burgas|Varna|Sofia|Sozopol|Primorsko|St\.Vlas|Obzor)\s*\)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
};

interface Destination {
    id: string;
    name: string;
    type: 'destination' | 'hotel' | 'country';
    country?: string;
    stars?: number;
    provider?: string;
}

interface RoomAllocation {
    adults: number;
    children: number;
    childrenAges: number[];
}

interface SearchHistoryItem {
    id: string;
    timestamp: number;
    query: {
        destinations: Destination[];
        checkIn: string;
        checkOut: string;
        roomAllocations: RoomAllocation[];
        mealPlan: string;
        nationality: string;
        budgetType: 'total' | 'person' | 'room';
        tab: 'hotel' | 'flight' | 'package' | 'transfer' | 'tour' | 'ski';
        searchMode: 'classic' | 'narrative' | 'immersive';
        budgetFrom?: string;
        budgetTo?: string;
        flexibleDays?: number;
    };
    resultsSummary?: {
        count: number;
        minPrice?: number;
    };
}




const CancellationFilterIcons = ({ value, onChange, isActuallyDark }: { value: string, onChange: (v: string) => void, isActuallyDark?: boolean }) => {
    return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
                onClick={() => onChange(value === 'free' ? 'all' : 'free')}
                className={`filter-icon-btn ${value === 'free' ? 'active green' : ''}`}
                style={{
                    background: value === 'free' ? 'rgba(76, 217, 100, 0.2)' : 'rgba(255,255,255,0.05)',
                    border: value === 'free' ? '1px solid #4cd964' : '1px solid rgba(255,255,255,0.1)',
                    color: value === 'free' ? '#4cd964' : (isActuallyDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                    padding: '8px 12px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700
                }}
                title="Besplatno otkazivanje"
            >
                <ShieldCheck size={16} /> <span>BEZ TROŠKOVA</span>
            </button>
            <button
                onClick={() => onChange(value === 'penalty' ? 'all' : 'penalty')}
                className={`filter-icon-btn ${value === 'penalty' ? 'active yellow' : ''}`}
                style={{
                    background: value === 'penalty' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                    border: value === 'penalty' ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                    color: value === 'penalty' ? '#f59e0b' : (isActuallyDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                    padding: '8px 12px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700
                }}
                title="Delimični troškovi (Penali)"
            >
                <AlertTriangle size={16} /> <span>PENALI</span>
            </button>
            <button
                onClick={() => onChange(value === 'non-refundable' ? 'all' : 'non-refundable')}
                className={`filter-icon-btn ${value === 'non-refundable' ? 'active red' : ''}`}
                style={{
                    background: value === 'non-refundable' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                    border: value === 'non-refundable' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                    color: value === 'non-refundable' ? '#ef4444' : (isActuallyDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                    padding: '8px 12px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700
                }}
                title="100% troškovi (Nepovratno)"
            >
                <XCircle size={16} /> <span>100% TROŠAK</span>
            </button>
        </div>
    );
};

const SmartSearch: React.FC = () => {
    const { userLevel, impersonatedSubagent } = useAuthStore();
    const isSubagent = userLevel < 6 || !!impersonatedSubagent;
    const { theme } = useThemeStore();
    const isActuallyDark = theme === 'navy';
    const isLightMode = !isActuallyDark;
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    // MODE SWITCH
    const [searchMode, setSearchMode] = useState<'classic' | 'narrative' | 'immersive'>(() => {
        const isMobileApp = document.body.classList.contains('mobile-view');
        if (isMobileApp) return 'immersive';
        const saved = localStorage.getItem('preferredSearchMode');
        return (saved as any) || 'classic';
    });

    useEffect(() => {
        const isMobileApp = document.body.classList.contains('mobile-view');
        if (isMobileApp && searchMode !== 'immersive') {
            setSearchMode('immersive');
        }
    }, [searchMode]);

    // MULTI-ROOM SELECTION STATE
    const [selectedRoomsMap, setSelectedRoomsMap] = useState<Record<number, any>>({});
    const [selectionPendingHotelId, setSelectionPendingHotelId] = useState<string | undefined>(undefined);

    // Reset search performed when mode changes so the wizard is visible
    useEffect(() => {
        setSearchPerformed(false);
        localStorage.setItem('preferredSearchMode', searchMode);
    }, [searchMode]);

    const activeTab = (searchParams.get('tab') as 'hotel' | 'flight' | 'package' | 'transfer' | 'tour' | 'ski') || 'hotel';

    const setActiveTab = (newTab: 'hotel' | 'flight' | 'package' | 'transfer' | 'tour' | 'ski') => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('tab', newTab);
            return newParams;
        }, { replace: true });
    };

    const [selectedDestinations, setSelectedDestinations] = useState<Destination[]>([]);
    const [destinationInput, setDestinationInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<Destination[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    // Recent searches state kept but not used for display anymore
    const [recentSearches, setRecentSearches] = useState<Destination[]>([]);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
    const [showHistorySidebar, setShowHistorySidebar] = useState(false);

    const [checkIn, setCheckIn] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    });
    const [checkOut, setCheckOut] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 8);
        return d.toISOString().split('T')[0];
    });
    const [nights, setNights] = useState(7);
    const [activeCalendar, setActiveCalendar] = useState<'in' | 'out' | null>(null);
    const [flexibleDays, setFlexibleDays] = useState(0);

    // Multi-room state
    const [activeRoomTab, setActiveRoomTab] = useState(0);
    const [roomAllocations, setRoomAllocations] = useState<RoomAllocation[]>([
        { adults: 2, children: 0, childrenAges: [] },
        { adults: 0, children: 0, childrenAges: [] },
        { adults: 0, children: 0, childrenAges: [] },
        { adults: 0, children: 0, childrenAges: [] },
        { adults: 0, children: 0, childrenAges: [] }
    ]);
    const [showRoomPicker, setShowRoomPicker] = useState(false);
    const [showStarPicker, setShowStarPicker] = useState(false);
    const [showMealPicker, setShowMealPicker] = useState(false);
    const [showNationalityPicker, setShowNationalityPicker] = useState(false);

    const [mealPlan, setMealPlan] = useState('');
    const [nationality, setNationality] = useState('RS');
    const [budgetType, setBudgetType] = useState<'total' | 'person' | 'room'>('person');
    const [showModes, setShowModes] = useState(true);

    // API Providers State
    const [apiConnectionsEnabled, setApiConnectionsEnabled] = useState(true);
    const [enabledProviders, setEnabledProviders] = useState({
        opengreece: true,
        tct: true,
        solvex: true,
        solvexai: true,
        ors: true,
        filos: true,
        mtsglobe: true
    });
    const [showProviderPanel, setShowProviderPanel] = useState(() => {
        const saved = localStorage.getItem('showProviderPanel');
        return saved !== 'false';
    });

    useEffect(() => {
        localStorage.setItem('showProviderPanel', showProviderPanel.toString());
    }, [showProviderPanel]);

    // NARRATIVE TO SMART SEARCH ADAPTER
    const handleNarrativeUpdate = (data: BasicInfoData) => {
        let mappedDestinations = selectedDestinations;
        let mappedCheckIn = checkIn;
        let mappedCheckOut = checkOut;
        let mappedAllocations = roomAllocations;

        // 1. Map Destinations
        if (data.destinations && data.destinations.length > 0) {
            const newMappedDestinations = data.destinations.map(dest => {
                let finalId = dest.id;
                let finalType = (dest as any).type || 'destination';
                let finalCountry = (dest as any).country_name || dest.country || 'Bugarska';

                const isRealProviderId = finalId && !String(finalId).startsWith('narrative');

                if (!isRealProviderId) {
                    const existingDest = mockDestinations.find(d => d.name.toLowerCase() === dest.city.toLowerCase());
                    if (existingDest) {
                        finalId = existingDest.id;
                        finalType = existingDest.type;
                        finalCountry = existingDest.country;
                    } else {
                        finalId = `narrative-${dest.city}`;
                    }
                }

                return {
                    id: finalId,
                    name: dest.city,
                    type: finalType as 'destination' | 'hotel' | 'country',
                    country: finalCountry
                };
            });

            mappedDestinations = newMappedDestinations;

            // Only update state if effectively changed
            const currentIds = selectedDestinations.map(d => d.id).sort().join(',');
            const newIds = mappedDestinations.map(d => d.id).sort().join(',');
            if (currentIds !== newIds) {
                setSelectedDestinations(mappedDestinations);
            }
        }

        // 2. Map Dates
        if (data.startDate !== checkIn) {
            mappedCheckIn = data.startDate;
            setCheckIn(mappedCheckIn);
        }
        if (data.endDate !== checkOut) {
            mappedCheckOut = data.endDate;
            setCheckOut(mappedCheckOut);
        }
        if (data.totalDays !== nights) setNights(data.totalDays || 0);

        // 3. Map Travelers
        if (data.roomAllocations && data.roomAllocations.length > 0) {
            mappedAllocations = data.roomAllocations.map(r => ({
                adults: r.adults,
                children: r.children,
                childrenAges: r.childrenAges || []
            }));
            if (JSON.stringify(roomAllocations) !== JSON.stringify(mappedAllocations)) {
                setRoomAllocations(mappedAllocations);
            }
        } else if (data.travelers) {
            const travelers = data.travelers;
            const newAllocations = [{
                adults: travelers.adults,
                children: travelers.children,
                childrenAges: travelers.childrenAges || []
            }];
            mappedAllocations = newAllocations;
            const current = roomAllocations[0];
            if (roomAllocations.length !== 1 || current.adults !== travelers.adults || current.children !== travelers.children || JSON.stringify(current.childrenAges) !== JSON.stringify(travelers.childrenAges)) {
                setRoomAllocations(mappedAllocations);
            }
        }

        // 4. Map Advanced Filters
        if (data.nationality && data.nationality !== nationality) {
            setNationality(data.nationality);
        }

        if (data.destinations[0]?.service && data.destinations[0].service.length > 0) {
            const service = data.destinations[0].service[0];
            if (service !== mealPlan && service !== 'all') {
                setMealPlan(service);
            }
        }

        if (data.budgetType && data.budgetType !== budgetType) {
            setBudgetType(data.budgetType);
        }

        return {
            destinations: mappedDestinations,
            checkIn: mappedCheckIn,
            checkOut: mappedCheckOut,
            allocations: mappedAllocations,
            mealPlan: data.destinations[0]?.service?.[0] || mealPlan,
            nationality: data.nationality || nationality
        };
    };

    // Prepare Initial Data for Narrative Search
    const getInitialNarrativeData = (): BasicInfoData => {
        return {
            destinations: [{
                id: '1',
                city: selectedDestinations[0]?.name || '',
                checkIn: checkIn,
                checkOut: checkOut,
                nights: nights,
                travelers: roomAllocations[0],
                category: [],
                service: [],
                flexibleDays: 0,
                country: '',
                countryCode: '',
                airportCode: ''
            }],
            travelers: roomAllocations[0],
            budgetFrom: budgetFrom ? Number(budgetFrom) : undefined,
            budgetTo: budgetTo ? Number(budgetTo) : undefined,
            budgetType: budgetType,
            nationality: nationality,
            currency: 'EUR',
            startDate: checkIn,
            endDate: checkOut,
            totalDays: nights
        };
    };

    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SmartSearchResult[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [selectedArrivalDate, setSelectedArrivalDate] = useState<string | null>(null);

    // Smart Suggestions state
    const [smartSuggestions, setSmartSuggestions] = useState<{
        type: 'flexible_dates' | 'similar_hotels',
        data: SmartSearchResult[],
        message: string
    } | null>(null);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
    const [availabilityTimeline, setAvailabilityTimeline] = useState<Record<string, { available: boolean, price?: number, isCheapest?: boolean }>>({});


    // Filter & UI States
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'notepad'>('grid');
    // TODO(SmartSearch): Vratiti default sort na 'smart' kada se ponovo omogući pametna pretraga
    const [sortBy, setSortBy] = useState<'smart' | 'price_low' | 'price_high'>('price_low');
    const [hotelNameFilter, setHotelNameFilter] = useState('');
    const [selectedStars, setSelectedStars] = useState<string[]>([]);
    const [selectedMealPlans, setSelectedMealPlans] = useState<string[]>([]);
    const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);

    const [expandedHotel, setExpandedHotel] = useState<SmartSearchResult | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedTimelineRoom, setSelectedTimelineRoom] = useState<any>(null);
    const [notepadMealFilters, setNotepadMealFilters] = useState<Record<string, string>>({});
    const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<any>(null);
    const [bookingSuccessData, setBookingSuccessData] = useState<{ id: string, code: string, provider: string } | null>(null);
    const [bookingAlertError, setBookingAlertError] = useState<string | null>(null);
    const [roomFilters, setRoomFilters] = useState<Record<string | number, string>>({});
    const [prefetchedResults, setPrefetchedResults] = useState<SmartSearchResult[]>([]);
    const [prefetchKey, setPrefetchKey] = useState<string>('');
    const [isPrefetching, setIsPrefetching] = useState(false);
    const [budgetFrom, setBudgetFrom] = useState<string>('');
    const [budgetTo, setBudgetTo] = useState<string>('');
    const [selectedCancelPolicy, setSelectedCancelPolicy] = useState<string>('all');
    const [visibleCount, setVisibleCount] = useState<number>(20);

    const tabId = useRef(Math.random().toString(36).substring(2, 11));

    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    // Mock data
    const mockDestinations: Destination[] = [
        { id: 'd1', name: 'Crna Gora', type: 'destination', country: 'Montenegro' },
        { id: 'd2', name: 'Budva', type: 'destination', country: 'Montenegro' },
        { id: 'd3', name: 'Kotor', type: 'destination', country: 'Montenegro' },
        { id: 'd4', name: 'Grčka', type: 'destination', country: 'Greece' },
        { id: 'd5', name: 'Krf (Corfu)', type: 'destination', country: 'Greece' },
        { id: 'd6', name: 'Rodos', type: 'destination', country: 'Greece' },
        { id: 'd7', name: 'Krit', type: 'destination', country: 'Greece' },
        { id: 'd8', name: 'Egipat', type: 'destination', country: 'Egypt' },
        { id: 'd9', name: 'Hurghada', type: 'destination', country: 'Egypt' },
        { id: 'd10', name: 'Sharm El Sheikh', type: 'destination', country: 'Egypt' },
        { id: 'd11', name: 'Turska', type: 'destination', country: 'Turkey' },
        { id: 'd12', name: 'Antalya', type: 'destination', country: 'Turkey' },
        { id: 'd13', name: 'Dubai', type: 'destination', country: 'UAE' },
        { id: 'd14', name: 'Bulgaria', type: 'destination', country: 'Bulgaria' },
        { id: 'solvex-c-33', name: 'Golden Sands', type: 'destination', country: 'Bulgaria' },
        { id: 'solvex-c-68', name: 'Sunny Beach', type: 'destination', country: 'Bulgaria' },
        { id: 'solvex-c-9', name: 'Bansko', type: 'destination', country: 'Bulgaria' },
        { id: 'h1', name: 'Hotel Splendid', type: 'hotel', country: 'Montenegro', stars: 5, provider: 'Solvex' },
        { id: 'h2', name: 'Hotel Budva Riviera', type: 'hotel', country: 'Montenegro', stars: 4, provider: 'Solvex' }
    ];

    const tabs = [
        { id: 'hotel' as const, label: 'Smeštaj', icon: Hotel },
        { id: 'flight' as const, label: 'Letovi', icon: Plane },
        { id: 'package' as const, label: 'DYNAMIC WIZARD', icon: Package },
        { id: 'transfer' as const, label: 'Transferi', icon: Bus },
        { id: 'tour' as const, label: 'Putovanja', icon: Compass },
        { id: 'ski' as const, label: 'SKI', icon: Mountain },
    ];

    // Helper to sync nights when dates change
    const syncNightsFromDates = (start: string, end: string) => {
        if (!start || !end) return;
        const s = new Date(start);
        const e = new Date(end);
        if (isNaN(s.getTime()) || isNaN(e.getTime())) return;
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setNights(diffDays);
    };

    useEffect(() => {
        const stored = localStorage.getItem('smartSearchRecent');
        if (stored) {
            try {
                setRecentSearches(JSON.parse(stored));
            } catch (e) {
                console.warn('Failed to parse recent searches:', e);
            }
        }

        const storedHistory = localStorage.getItem('smartSearchHistoryItems');
        if (storedHistory) {
            try {
                setSearchHistory(JSON.parse(storedHistory));
            } catch (e) {
                console.warn('Failed to parse search history:', e);
            }
        }

        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const checkInDate = tomorrow.toISOString().split('T')[0];
        setCheckIn(checkInDate);

        const checkOutDate = new Date(tomorrow);
        checkOutDate.setDate(checkOutDate.getDate() + 7);
        setCheckOut(checkOutDate.toISOString().split('T')[0]);
        setNights(7);

        // Ported from GlobalHubSearch
        if (!selectedArrivalDate) {
            setSelectedArrivalDate(checkInDate);
        }

        // TAB HEARTBEAT LOGIC (Reliable cross-tab counting)
        const HEARTBEAT_INTERVAL = 2000;
        const TAB_PREFIX = 'search_tab_';

        const updateHeartbeat = () => {
            localStorage.setItem(`${TAB_PREFIX}${tabId.current}`, Date.now().toString());
        };

        const cleanupOldTabs = () => {
            const now = Date.now();
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(TAB_PREFIX)) {
                    const timestamp = parseInt(localStorage.getItem(key) || '0');
                    if (now - timestamp > 5000) {
                        localStorage.removeItem(key);
                    }
                }
            }
        };

        updateHeartbeat();
        const heartbeatTimer = setInterval(updateHeartbeat, HEARTBEAT_INTERVAL);
        const cleanupTimer = setInterval(cleanupOldTabs, 10000);

        // Click outside handler
        const handleClickOutside = (event: MouseEvent) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            clearInterval(heartbeatTimer);
            clearInterval(cleanupTimer);
            localStorage.removeItem(`${TAB_PREFIX}${tabId.current}`);
        };
    }, []);

    const handleNewSearchTab = () => {
        const TAB_PREFIX = 'search_tab_';
        const now = Date.now();
        let activeCount = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(TAB_PREFIX)) {
                const timestamp = parseInt(localStorage.getItem(key) || '0');
                if (now - timestamp < 6000) { // Check tabs active in the last 6 seconds
                    activeCount++;
                }
            }
        }

        if (activeCount >= 5) {
            alert("⚠️ LIMIT DOSTIGNUT: Imate otvorenih 5 pretraga. Molimo zatvorite neki tab pre nego što pokrenete novu pretragu radi boljih performansi.");
            return;
        }
        window.open(window.location.href, '_blank');
    };

    useEffect(() => {
        const fetchSuggestions = async () => {
            // ONLY search if input length >= 2. NO RECENT SEARCHES ON EMPTY INPUT.
            if (destinationInput.length >= 2) {
                setIsLoadingSuggestions(true);
                setSelectedIndex(-1);
                const searchTerm = destinationInput.toLowerCase();

                const localMatches = mockDestinations.filter(dest =>
                    dest.name.toLowerCase().includes(searchTerm) &&
                    !selectedDestinations.find(selected => selected.id === dest.id)
                );

                setSuggestions(localMatches.slice(0, 10));
                setShowSuggestions(true);

                try {
                    const citiesToSearch = [33, 68, 9];
                    const dynamicResults: Destination[] = [];

                    for (const cityId of citiesToSearch) {
                        const hotelsRes = await solvexDictionaryService.getHotels(cityId);
                        if (hotelsRes.success && hotelsRes.data) {
                            const matching = (hotelsRes.data as any[])
                                .filter(h => h.name.toLowerCase().includes(searchTerm))
                                .map(h => ({
                                    id: `solvex-h-${h.id}`,
                                    name: h.name,
                                    type: 'hotel' as const,
                                    country: 'Bulgaria',
                                    provider: 'Solvex',
                                    stars: h.stars
                                }));
                            dynamicResults.push(...matching);
                        }
                    }

                    if (dynamicResults.length > 0) {
                        setSuggestions(prev => {
                            const combined = [...prev, ...dynamicResults];
                            return combined.filter((item, index, self) =>
                                index === self.findIndex((t) => t.id === item.id)
                            ).slice(0, 15);
                        });
                        setShowSuggestions(true);
                    }
                } catch (err) {
                    console.warn('[SmartSearch] Solvex API failed:', err);
                } finally {
                    setIsLoadingSuggestions(false);
                }
            } else {
                // If input is short or empty, HIDE EVERYTHING.
                setSuggestions([]);
                setShowSuggestions(false);
                setIsLoadingSuggestions(false);
                setSelectedIndex(-1);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [destinationInput, selectedDestinations]); // recentSearches REMOVED from dependency array

    // Subscribe to prefetch service ONCE on mount
    useEffect(() => {
        const unsubscribe = searchPrefetchService.subscribe('smart-search', {
            onComplete: (results, key) => {
                setPrefetchedResults(results);
                setPrefetchKey(key);
            },
            onStart: () => setIsPrefetching(true),
            onEnd: () => setIsPrefetching(false),
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (searchPerformed) {
            searchPrefetchService.notifyResultsUpdated(searchResults);
        }
    }, [searchResults, searchPerformed]);

    // Reset pagination when filters or results change
    useEffect(() => {
        setVisibleCount(20);
    }, [searchResults, hotelNameFilter, selectedStars, selectedAvailability, selectedMealPlans, sortBy]);

    // Handle clicks outside dropdowns
    useEffect(() => {
        if (selectedDestinations.length > 0 && checkIn && checkOut && searchMode !== 'immersive') {
            searchPrefetchService.schedule({
                destinations: selectedDestinations,
                checkIn,
                checkOut,
                allocations: roomAllocations,
                mealPlan,
                nationality,
                searchType: activeTab,
                enabledProviders
            });
        }
    }, [selectedDestinations, checkIn, checkOut, roomAllocations, searchMode, activeTab, mealPlan, nationality]);

    const handleImmersiveUpdate = useCallback((data: ImmersiveSearchData) => {
        // Schedule pre-fetch when immersive wizard has enough data
        if (data.destinations.length > 0 && data.checkIn && data.checkOut) {
            searchPrefetchService.schedule({
                destinations: data.destinations as any,
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                allocations: data.roomAllocations,
                mealPlan: (data.services && data.services.length > 0) ? data.services[0] : mealPlan,
                nationality: data.nationality || nationality,
                searchType: activeTab,
                enabledProviders
            });
        }
    }, [activeTab, mealPlan, nationality]);

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

    const handleAddDestination = (destination: Destination) => {
        if (selectedDestinations.length < 3) {
            setSelectedDestinations([...selectedDestinations, destination]);
            setDestinationInput('');
            setSuggestions([]);
            setShowSuggestions(false);
            setSelectedIndex(-1);

            const updated = [destination, ...recentSearches.filter(r => r.id !== destination.id)].slice(0, 5);
            setRecentSearches(updated);
            localStorage.setItem('smartSearchRecent', JSON.stringify(updated));
            inputRef.current?.focus();
        }
    };

    const handleSearch = async (overrideParams?: {
        checkIn?: string,
        checkOut?: string,
        destinations?: Destination[],
        allocations?: RoomAllocation[],
        mealPlan?: string,
        nationality?: string,
        budgetFrom?: string,
        budgetTo?: string,
        budgetType?: 'total' | 'person' | 'room',
        searchType?: string,
        searchMode?: 'classic' | 'narrative' | 'immersive'
    }) => {
        const activeSearchType = overrideParams?.searchType || activeTab;
        const activeSearchMode = overrideParams?.searchMode || searchMode;
        const activeCheckIn = overrideParams?.checkIn || checkIn;
        const activeCheckOut = overrideParams?.checkOut || checkOut;
        const activeDestinations = overrideParams?.destinations || selectedDestinations;
        const activeAllocations = (overrideParams?.allocations || roomAllocations).filter(r => r.adults > 0);
        const activeMealPlan = overrideParams?.mealPlan !== undefined ? overrideParams.mealPlan : mealPlan;
        const activeNationality = overrideParams?.nationality || nationality;
        const activeBudgetType = overrideParams?.budgetType || budgetType;
        const activeBudgetFrom = overrideParams?.budgetFrom !== undefined ? overrideParams.budgetFrom : budgetFrom;
        const activeBudgetTo = overrideParams?.budgetTo !== undefined ? overrideParams.budgetTo : budgetTo;

        if (activeDestinations.length === 0) {
            setSearchError('Molimo odaberite najmanje jednu destinaciju');
            return;
        }

        if (!activeCheckIn || !activeCheckOut) {
            setSearchError('Molimo unesite datume');
            return;
        }

        // SYNC STATE WITH ACTIVE PARAMS
        if (overrideParams) {
            if (overrideParams.checkIn) setCheckIn(overrideParams.checkIn);
            if (overrideParams.checkOut) setCheckOut(overrideParams.checkOut);
            if (overrideParams.destinations) setSelectedDestinations(overrideParams.destinations);
            if (overrideParams.allocations) {
                // Ensure roomAllocations state has the same objects as searched, 
                // but padding to 5 slots if necessary to keep UI stable
                const newAlloc = [...overrideParams.allocations];
                while (newAlloc.length < 5) {
                    newAlloc.push({ adults: 0, children: 0, childrenAges: [] });
                }
                setRoomAllocations(newAlloc);
            }
            if (overrideParams.mealPlan !== undefined) setMealPlan(overrideParams.mealPlan);
            if (overrideParams.nationality) setNationality(overrideParams.nationality);
            if (overrideParams.budgetType) setBudgetType(overrideParams.budgetType);
            if (overrideParams.budgetFrom !== undefined) setBudgetFrom(overrideParams.budgetFrom);
            if (overrideParams.budgetTo !== undefined) setBudgetTo(overrideParams.budgetTo);
        }

        // CHECK PREFETCH CACHE - use singleton service key
        const currentKey = searchPrefetchService.buildKey({
            destinations: activeDestinations,
            checkIn: activeCheckIn,
            checkOut: activeCheckOut,
            allocations: activeAllocations,
            mealPlan: activeMealPlan,
            nationality: activeNationality,
            searchType: activeSearchType
        });

        let resultsToDisplay: SmartSearchResult[] = [];

        if (prefetchedResults.length > 0 && prefetchKey === currentKey) {
            console.log('[SmartSearch] ✅ Using prefetched results! Instant display.');
            resultsToDisplay = prefetchedResults;
            setSearchResults(resultsToDisplay);
            setSearchPerformed(true);
            setIsSearching(false);
            // Don't return yet! We want to save to history.
        } else {
            setIsSearching(true);
            setSearchError(null);

            // CHECK IF PREFETCH IS IN FLIGHT
            const inFlight = searchPrefetchService.getInFlight(currentKey);
            if (inFlight) {
                console.log('[SmartSearch] ⏳ Prefetch in flight for this key. Waiting...');
                try {
                    const results = await inFlight;
                    console.log('[SmartSearch] ✅ Prefetch finished while waiting. Displaying.');
                    resultsToDisplay = results;
                    setSearchResults(resultsToDisplay);
                    setSearchPerformed(true);
                    setIsSearching(false);
                    // Continue to history save
                } catch (err) {
                    console.error('[SmartSearch] In-flight prefetch failed:', err);
                    setSearchError(err instanceof Error ? err.message : 'Greška pri pretrazi');
                    setIsSearching(false);
                    return;
                }
            } else {
                setSearchResults([]);
                setSearchPerformed(false);
                setSmartSuggestions(null);
                setSelectedArrivalDate(activeCheckIn);

                try {
                    if (activeAllocations.length === 0) {
                        setSearchError('Molimo definišite bar jednu sobu sa odraslim putnicima.');
                        setIsSearching(false);
                        return;
                    }

                    const results = await performSmartSearch({
                        searchType: activeSearchType as any,
                        destinations: activeDestinations.map(d => ({
                            id: String(d.id).replace('solvex-c-', ''),
                            name: d.name,
                            type: d.type
                        })),
                        checkIn: activeCheckIn,
                        checkOut: activeCheckOut,
                        rooms: activeAllocations,
                        mealPlan: activeMealPlan,
                        currency: 'EUR',
                        nationality: activeNationality || 'RS',
                        enabledProviders
                    });

                    // ENHANCE WITH CRM SALES DATA (bulk processing to prevent DB overload)
                    let counts: Record<string, number> = {};
                    try {
                        const hotelNames = results.map(h => h.name);
                        counts = await getBulkMonthlyReservationCounts(hotelNames);
                    } catch (e) {
                        console.error('[SmartSearch] Bulk CRM data error:', e);
                    }

                    const resultsWithSales = results.map(h => ({
                        ...h,
                        salesCount: counts[h.name] || 0
                    }));

                    resultsToDisplay = resultsWithSales;
                    setSearchResults(resultsToDisplay);
                    setSearchPerformed(true);

                    // Access potential errors from performers (using the hack we added in service)
                    if (resultsToDisplay.length === 0 && (results as any)._lastError) {
                        setSearchError((results as any)._lastError);
                    }

                    if (resultsToDisplay.length === 0 && !overrideParams) {
                        // SOLVEX AI ASSISTANT DISABLED - PURE API MODE
                        setSearchError('Nažalost, nema slobodnih mesta za izabrane parametre. Pokušajte sa drugim datumima ili destinacijom.');
                    }
                } catch (error) {
                    console.error('[SmartSearch] Search error:', error);
                    setSearchError(error instanceof Error ? error.message : 'Greška pri pretrazi');
                    setIsSearching(false);
                    return; // Can't save history if it completely failed
                } finally {
                    setIsSearching(false);
                }
            }
        }

        // SAVE TO HISTORY (Reached for both cache hits and fresh searches)
        const historyItem: SearchHistoryItem = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            query: {
                destinations: activeDestinations,
                checkIn: activeCheckIn,
                checkOut: activeCheckOut,
                roomAllocations: activeAllocations,
                mealPlan: activeMealPlan,
                nationality: activeNationality,
                budgetType: activeBudgetType,
                tab: activeSearchType as any,
                searchMode: activeSearchMode,
                budgetFrom: activeBudgetFrom,
                budgetTo: activeBudgetTo,
                flexibleDays
            },
            resultsSummary: {
                count: resultsToDisplay.length,
                minPrice: resultsToDisplay.length > 0 ? Math.min(...resultsToDisplay.map(getFinalDisplayPrice)) : undefined
            }
        };

        setSearchHistory(prev => {
            const filtered = prev.filter(h =>
                JSON.stringify(h.query.destinations) !== JSON.stringify(historyItem.query.destinations) ||
                h.query.checkIn !== historyItem.query.checkIn ||
                h.query.checkOut !== historyItem.query.checkOut ||
                JSON.stringify(h.query.roomAllocations) !== JSON.stringify(historyItem.query.roomAllocations)
            );
            const updated = [historyItem, ...filtered].slice(0, 10);
            localStorage.setItem('smartSearchHistoryItems', JSON.stringify(updated));
            return updated;
        });
    };


    const handleLoadHistoryItem = (item: SearchHistoryItem) => {
        const { query } = item;
        setSelectedDestinations(query.destinations);
        setCheckIn(query.checkIn);
        setCheckOut(query.checkOut);
        setRoomAllocations(query.roomAllocations);
        setMealPlan(query.mealPlan);
        setNationality(query.nationality);
        setBudgetType(query.budgetType);
        setActiveTab(query.tab);
        setSearchMode(query.searchMode);
        setBudgetFrom(query.budgetFrom || '');
        setBudgetTo(query.budgetTo || '');
        setFlexibleDays(query.flexibleDays || 0);

        setShowHistorySidebar(false);

        // Optional: Trigger search immediately
        handleSearch({
            checkIn: query.checkIn,
            checkOut: query.checkOut,
            destinations: query.destinations,
            allocations: query.roomAllocations,
            mealPlan: query.mealPlan,
            nationality: query.nationality,
            budgetFrom: query.budgetFrom,
            budgetTo: query.budgetTo,
            budgetType: query.budgetType,
            searchType: query.tab,
            searchMode: query.searchMode
        });
    };

    const handleRefreshHistoryItem = async (item: SearchHistoryItem) => {
        const { query } = item;
        try {
            const results = await performSmartSearch({
                searchType: query.tab,
                destinations: query.destinations.map(d => ({
                    id: String(d.id).replace('solvex-c-', ''),
                    name: d.name,
                    type: d.type
                })),
                checkIn: query.checkIn,
                checkOut: query.checkOut,
                rooms: query.roomAllocations.filter(r => r.adults > 0),
                mealPlan: query.mealPlan,
                currency: 'EUR',
                nationality: query.nationality || 'RS',
            });

            let counts: Record<string, number> = {};
            try {
                const hotelNames = results.map(h => h.name);
                counts = await getBulkMonthlyReservationCounts(hotelNames);
            } catch (e) {
                console.error('[SmartSearch] Bulk CRM history error:', e);
            }

            const resultsWithSales = results.map(h => ({
                ...h,
                salesCount: counts[h.name] || 0
            }));

            setSearchHistory(prev => {
                const updated = prev.map(h => {
                    if (h.id === item.id) {
                        return {
                            ...h,
                            resultsSummary: {
                                count: resultsWithSales.length,
                                minPrice: resultsWithSales.length > 0 ? Math.min(...resultsWithSales.map(getFinalDisplayPrice)) : undefined
                            }
                        };
                    }
                    return h;
                });
                localStorage.setItem('smartSearchHistoryItems', JSON.stringify(updated));
                return updated;
            });
        } catch (error) {
            console.error('[SmartSearch] Refresh history error:', error);
        }
    };

    const removeFromHistory = (id: string) => {
        setSearchHistory(prev => {
            const updated = prev.filter(h => h.id !== id);
            localStorage.setItem('smartSearchHistoryItems', JSON.stringify(updated));
            return updated;
        });
    };

    const clearSearchHistory = () => {
        if (window.confirm('Da li ste sigurni da želite da obrišete kompletnu istoriju pretrage?')) {
            setSearchHistory([]);
            localStorage.removeItem('smartSearchHistoryItems');
        }
    };

    const getPriceWithMargin = (price: number) => Number((price * 1.15).toFixed(2));

    const getFinalDisplayPrice = (hotel: SmartSearchResult) => {
        let total = 0;
        if (hotel.allocationResults && Object.keys(hotel.allocationResults).length > 0) {
            Object.values(hotel.allocationResults).forEach((rooms: any) => {
                if (!rooms || rooms.length === 0) return;
                const minPrice = Math.min(...rooms.map((r: any) => r.price));
                total += isSubagent ? getPriceWithMargin(minPrice) : Number(minPrice);
            });
        } else {
            total = isSubagent ? getPriceWithMargin(hotel.price) : Number(hotel.price);
        }
        return total;
    };

    const filteredResults = searchResults.filter(hotel => {
        // console.log('[SmartSearch] Checking hotel provider:', hotel.provider);
        // TEMPORARY: Allow all for debugging, but keep original logic commented
        // if (hotel.provider.toLowerCase() !== 'solvex') return false;

        if (hotelNameFilter) {
            const searchTerm = hotelNameFilter.toLowerCase();
            const matchesName = hotel.name.toLowerCase().includes(searchTerm);
            const matchesLocation = (hotel.location || '').toLowerCase().includes(searchTerm);

            // Check original data for more specific destination info if available
            const matchesOriginal = (
                (hotel.originalData?.hotel?.city?.name || '').toLowerCase().includes(searchTerm) ||
                (hotel.originalData?.hotel?.country?.name || '').toLowerCase().includes(searchTerm) ||
                (hotel.originalData?.location?.city || '').toLowerCase().includes(searchTerm)
            );

            if (!matchesName && !matchesLocation && !matchesOriginal) return false;
        }

        if (selectedStars.length > 0 && !selectedStars.includes('all')) {
            if (!selectedStars.includes(String(hotel.stars || 0))) {
                return false;
            }
        }

        if (selectedMealPlans.length > 0 && !selectedMealPlans.includes('all')) {
            const hotelPlans = hotel.mealPlans?.length ? hotel.mealPlans : [hotel.mealPlan || ''];
            const normalizedHotelPlans = hotelPlans.map(mp => normalizeMealPlan(mp));
            const hasMatch = normalizedHotelPlans.some(n => {
                // If user selected "AI", match all types of All Inclusive
                if (selectedMealPlans.includes('AI') && (n === 'AI' || n === 'AIP' || n === 'UAI')) return true;
                return selectedMealPlans.includes(n);
            });
            if (!hasMatch) {
                return false;
            }
        }

        if (selectedAvailability.length > 0 && !selectedAvailability.includes('all')) {
            const status = (hotel.availability || '').toLowerCase();
            const availableMatches = (status === 'available' || status === 'dostupno' || status === 'available_now');
            const requestMatches = (status === 'on-request' || status === 'na upit' || status === 'on_request');

            let isMatched = false;
            if (selectedAvailability.includes('available') && availableMatches) isMatched = true;
            if (selectedAvailability.includes('on_request') && requestMatches) isMatched = true;

            if (!isMatched) return false;
        }

        const totalPrice = getFinalDisplayPrice(hotel);
        const totalPax = (roomAllocations.filter(r => r.adults > 0).reduce((sum, r) => sum + r.adults + r.children, 0)) || 1;
        const price = budgetType === 'person' ? (totalPrice / totalPax) : totalPrice;

        // Robust filtering
        if (budgetFrom) {
            const minBudget = Number(budgetFrom);
            if (!isNaN(minBudget) && price < minBudget) return false;
        }
        if (budgetTo) {
            const maxBudget = Number(budgetTo);
            if (!isNaN(maxBudget) && price > maxBudget) return false;
        }

        return true;
    }).sort((a, b) => {
        if (sortBy === 'price_low') return getFinalDisplayPrice(a) - getFinalDisplayPrice(b);
        if (sortBy === 'price_high') return getFinalDisplayPrice(b) - getFinalDisplayPrice(a);
        if (sortBy === 'smart') {
            // Smart sort: Best Sellers first, then Stars descending, then price ascending
            const salesA = a.salesCount || 0;
            const salesB = b.salesCount || 0;
            if (salesB >= 10 && salesA < 10) return 1;
            if (salesA >= 10 && salesB < 10) return -1;

            if ((b.stars || 0) !== (a.stars || 0)) return (b.stars || 0) - (a.stars || 0);
            return getFinalDisplayPrice(a) - getFinalDisplayPrice(b);
        }
        return 0;
    });

    const handleReserveClick = (room: any, rIdx: number, hotelOverride?: SmartSearchResult) => {
        const hotel = hotelOverride || expandedHotel;
        if (!hotel) return;

        const totalNeeded = roomAllocations.filter(r => r.adults > 0).length;

        // Reset if changing hotel
        if (selectionPendingHotelId !== hotel.id) {
            setSelectionPendingHotelId(hotel.id);
            const newMap = { [rIdx]: room };
            setSelectedRoomsMap(newMap);

            if (totalNeeded === 1) {
                setSelectedRoomForBooking({ ...room, allocationIndex: rIdx, allSelectedRooms: [room] });
                setExpandedHotel(hotel);
                setIsBookingModalOpen(true);
            }
            return;
        }

        const newMap = { ...selectedRoomsMap, [rIdx]: room };
        setSelectedRoomsMap(newMap);

        if (Object.keys(newMap).length >= totalNeeded) {
            // All rooms selected!
            setSelectedRoomForBooking({ ...room, allocationIndex: rIdx, allSelectedRooms: Object.values(newMap) });
            setExpandedHotel(hotel);
            setIsBookingModalOpen(true);
        }
    };



    const toggleStarFilter = (star: string) => {
        if (star === 'all') {
            setSelectedStars(['all']);
        } else {
            setSelectedStars(prev => {
                const withoutAll = prev.filter(s => s !== 'all');
                if (withoutAll.includes(star)) {
                    const next = withoutAll.filter(s => s !== star);
                    return next.length === 0 ? ['all'] : next;
                } else {
                    return [...withoutAll, star];
                }
            });
        }
    };

    const toggleMealPlanFilter = (plan: string) => {
        if (plan === 'all') {
            setSelectedMealPlans(['all']);
        } else {
            setSelectedMealPlans(prev => {
                const withoutAll = prev.filter(p => p !== 'all');
                if (withoutAll.includes(plan)) {
                    const next = withoutAll.filter(p => p !== plan);
                    return next.length === 0 ? [] : next;
                } else {
                    return [...withoutAll, plan];
                }
            });
        }
    };

    const toggleAvailabilityFilter = (status: string) => {
        setSelectedAvailability(prev => {
            if (prev.includes(status)) {
                return prev.filter(s => s !== status);
            } else {
                return [...prev, status];
            }
        });
    };

    const handleQuickFilter = (type: string) => {
        if (type === 'last-minute') {
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);
            setCheckIn(today.toISOString().split('T')[0]);
            setCheckOut(nextWeek.toISOString().split('T')[0]);
            setNights(7);
        }
    };

    const formatRoomConfigLabel = (alloc: any, idx: number) => {
        const getAdultsText = (n: number) => {
            if (n === 1) return 'jedna odrasla osoba';
            if (n >= 2 && n <= 4) {
                const names = ['nula', 'jedna', 'dve', 'tri', 'četiri'];
                return `${names[n]} odrasle osobe`;
            }
            return `${n} odraslih osoba`;
        };

        let label = `Ponuda za sobu ${idx + 1} - ${getAdultsText(alloc.adults)}`;

        if (alloc.children > 0) {
            const childrenText = alloc.childrenAges.map((age: number) => ` + dete ${age} godina`).join('');
            label += childrenText;
        }

        return label;
    };

    const renderStars = (count: number) => {
        const goldOld = 'var(--accent)'; // Old gold color
        return (
            <div className="star-rating-filter">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star
                        key={i}
                        size={12}
                        fill={i <= count ? goldOld : 'transparent'}
                        color={goldOld}
                        style={{ marginRight: '1px' }}
                    />
                ))}
            </div>
        );
    };

    const renderStarsMini = (count: number) => {
        const brandPurple = '#8E24AC';
        if (count === 0) return <span style={{ fontSize: '10px' }}>Bez kategorije</span>;
        return (
            <div className="star-row-mini">
                {[...Array(count)].map((_, i) => (
                    <Star key={i} size={10} fill={brandPurple} color={brandPurple} />
                ))}
            </div>
        );
    };

    return (
        <div className="smart-search-container-v2">
            {/* Booking Modal & Success Modal are now handled in the portal at the bottom for reliable stacking */}
            {/* Moved to portal */}

            {/* Booking Error Alert */}
            {bookingAlertError && (
                <div className="booking-status-alert error-alert">
                    <div className="alert-icon"><XCircle size={32} /></div>
                    <div className="alert-content">
                        <h4>Greška pri rezervaciji</h4>
                        <p>{bookingAlertError}</p>
                    </div>
                    <button className="close-alert" onClick={() => setBookingAlertError(null)}><X size={20} /></button>
                </div>
            )}

            {/* API Connection Section - REPLACES GLOBAL SEARCH HUB FUNCTIONALITY */}
            {(userLevel === 6 && !document.body.classList.contains('mobile-view')) && (
                <div className="provider-toggles-section" style={{ position: 'relative', margin: '20px auto 0 auto', maxWidth: '1550px', width: '100%', padding: '12px 20px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '70px' }}>

                    {/* LEFT: Power Button */}
                    <div style={{ display: 'flex', alignItems: 'center', width: '50px' }}>
                        {showProviderPanel && (
                            <button
                                className={`master-power-btn ${apiConnectionsEnabled ? 'on' : 'off'}`}
                                onClick={() => {
                                    const newState = !apiConnectionsEnabled;
                                    setApiConnectionsEnabled(newState);
                                    setEnabledProviders({
                                        opengreece: newState,
                                        tct: newState,
                                        solvex: newState,
                                        solvexai: newState,
                                        ors: newState,
                                        filos: newState,
                                        mtsglobe: newState
                                    });
                                }}
                                style={{
                                    background: apiConnectionsEnabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    border: 'none', borderRadius: '12px', padding: '10px', cursor: 'pointer', color: 'white',
                                    boxShadow: apiConnectionsEnabled ? '0 4px 15px rgba(16, 185, 129, 0.4)' : '0 4px 15px rgba(239, 68, 68, 0.4)',
                                    transition: 'all 0.3s ease',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px'
                                }}
                                title={apiConnectionsEnabled ? "Isključi sve konekcije" : "Uključi sve konekcije"}
                            >
                                <Power size={20} />
                            </button>
                        )}
                    </div>

                    {/* CENTER: Provider Tags */}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        {showProviderPanel && (
                            <div className="provider-toggles animate-fade-in" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', opacity: apiConnectionsEnabled ? 1 : 0.4, pointerEvents: apiConnectionsEnabled ? 'auto' : 'none', transition: 'opacity 0.3s ease' }}>
                                {[
                                    { id: 'opengreece', name: 'Open Greece', icon: Globe },
                                    { id: 'tct', name: 'TCT', icon: Building2 },
                                    { id: 'solvex', name: 'Solvex', icon: Database },
                                    { id: 'solvexai', name: 'Solvex AI', icon: Sparkles },
                                    { id: 'ors', name: 'ORS', icon: Zap },
                                    { id: 'filos', name: 'Filos', icon: Ship },
                                    { id: 'mtsglobe', name: 'MTS Globe', icon: Globe }
                                ].map((prov) => {
                                    const active = (enabledProviders as any)[prov.id];
                                    return (
                                        <button
                                            key={prov.id}
                                            className={`provider-toggle ${active ? 'active' : ''}`}
                                            onClick={() => {
                                                const newEnabledProviders = { ...enabledProviders, [prov.id]: !active };
                                                setEnabledProviders(newEnabledProviders);
                                                const hasAnActiveProvider = Object.values(newEnabledProviders).some(v => v);
                                                setApiConnectionsEnabled(hasAnActiveProvider);
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '14px',
                                                background: active ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                                                border: `2px solid ${active ? '#3b82f6' : 'rgba(255,255,255,0.05)'}`,
                                                color: active ? '#3b82f6' : 'var(--text-secondary)',
                                                fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                        >
                                            <prov.icon size={16} />
                                            {prov.name}
                                            {active && <CheckCircle2 size={16} style={{ marginLeft: '4px' }} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Eye Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '50px' }}>
                        <button
                            onClick={() => setShowProviderPanel(!showProviderPanel)}
                            style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '12px',
                                padding: '10px',
                                cursor: 'pointer',
                                color: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease',
                                width: '40px', height: '40px'
                            }}
                            title={showProviderPanel ? "Sakrij provajdere" : "Prikaži provajdere"}
                        >
                            {showProviderPanel ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
            )}

            {/* SEARCH MODE SWITCHER - ALWAYS VISIBLE ABOVE TABS */}
            {!document.body.classList.contains('mobile-view') && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', position: 'relative', zIndex: 1000, marginTop: '20px' }}>
                    <div className="mode-toggle-group" style={{
                        display: 'flex',
                        background: 'var(--bg-card)',
                        padding: '8px',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: 'var(--shadow-lg)',
                        width: '100%',
                        maxWidth: '1550px',
                        gap: '12px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                    }}>
                        <button
                            className={`mode-switch-btn ${searchMode === 'classic' ? 'active' : ''}`}
                            onClick={() => { setSearchMode('classic'); setSearchPerformed(false); }}
                            style={{
                                padding: '12px 24px', borderRadius: '10px', border: 'none', fontSize: '15px', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.3s',
                                background: searchMode === 'classic' ? 'var(--accent)' : 'rgba(15, 23, 42, 0.5)',
                                color: searchMode === 'classic' ? '#fff' : '#94a3b8',
                                flex: 1
                            }}
                        >
                            <LayoutTemplate size={16} /> Klasična Pretraga
                        </button>
                        <button
                            className={`mode-switch-btn ${searchMode === 'narrative' ? 'active' : ''}`}
                            onClick={() => { setSearchMode('narrative'); setSearchPerformed(false); }}
                            style={{
                                padding: '12px 24px', borderRadius: '10px', border: 'none', fontSize: '15px', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.3s',
                                background: searchMode === 'narrative' ? '#8E24AC' : 'rgba(15, 23, 42, 0.5)',
                                color: searchMode === 'narrative' ? '#fff' : '#94a3b8',
                                flex: 1
                            }}
                        >
                            <Sparkles size={16} /> Futuristička (AI)
                        </button>
                        <button
                            className={`mode-switch-btn ${searchMode === 'immersive' ? 'active' : ''}`}
                            onClick={() => { setSearchMode('immersive'); setSearchPerformed(false); }}
                            style={{
                                padding: '12px 24px', borderRadius: '10px', border: 'none', fontSize: '15px', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.3s',
                                background: searchMode === 'immersive' ? 'var(--accent)' : 'rgba(15, 23, 42, 0.5)',
                                color: searchMode === 'immersive' ? '#fff' : '#94a3b8',
                                flex: 1
                            }}
                        >
                            <Zap size={16} /> Immersive (Smart)
                        </button>
                    </div>
                </div>
            )}

            {/* TAB NAVIGATION */}
            <div className="tabs-nav-container">
                {
                    tabs.map(tab => (
                        <a
                            key={tab.id}
                            href={`/smart-search?tab=${tab.id}`}
                            className={`nav-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                setActiveTab(tab.id);
                            }}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </a>
                    ))
                }
            </div>

            {/* CONDITIONAL RENDER: SMESHTAJ vs LETOVI vs PAKETI */}
            {activeTab === 'package' ? (
                <div className="package-builder-inline animate-fade-in" style={{ marginTop: '2rem' }}>
                    <PackageSearch
                        initialDestinations={selectedDestinations}
                        initialCheckIn={checkIn}
                        initialCheckOut={checkOut}
                        initialTravelers={roomAllocations}
                    />
                </div>
            ) : activeTab === 'flight' ? (
                <div className="flight-search-inline animate-fade-in" style={{ marginTop: '2rem' }}>
                    <FlightSearch isInline={true} />
                </div>
            ) : activeTab === 'ski' ? (
                <div className="ski-search-placeholder animate-fade-in" style={{ marginTop: '2rem', textAlign: 'center', padding: '100px 40px', background: 'var(--bg-card)', borderRadius: '30px', border: 'var(--border-thin)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Mountain size={64} style={{ marginBottom: '20px', opacity: 0.5 }} />
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>SKI SEARCH - COMING SOON</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Uskoro: Najbolje ski ponude, ski pass i oprema na jednom mestu.</p>
                </div>
            ) : (
                <>


                    <main className={`search-main-content ${searchPerformed ? 'results-active' : ''}`} style={{ width: '100%' }}>

                        {/* SEARCH PERFORMED? SHOW RESULTS */}
                        {searchPerformed ? (
                            <div className="search-results-viewport animate-fade-in">
                                <FilterSidebar
                                    onResetSearch={() => {
                                        setSearchPerformed(false);
                                        setSearchResults([]);
                                        setSearchError(null);
                                        setSmartSuggestions(null);
                                    }}
                                    hotelNameFilter={hotelNameFilter}
                                    setHotelNameFilter={setHotelNameFilter}
                                    selectedStars={selectedStars}
                                    toggleStarFilter={toggleStarFilter}
                                    selectedAvailability={selectedAvailability}
                                    toggleAvailabilityFilter={toggleAvailabilityFilter}
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                    selectedMealPlans={selectedMealPlans}
                                    toggleMealPlanFilter={toggleMealPlanFilter}
                                    searchResults={searchResults}
                                />

                                {/* Results Summary Bar */}
                                <div className="results-summary-bar-v4 premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="summary-info">
                                        <span>Pronađeno</span>
                                        <strong>{filteredResults.length}</strong>
                                        <span style={{ marginLeft: '8px' }}>hotela</span>
                                    </div>
                                    <div className="results-sort" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: '0.5px', marginRight: '4px' }}>SORTIRAJ:</span>
                                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '3px' }}>
                                            <button
                                                onClick={() => setSortBy('price_low')}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '6px 12px', borderRadius: '14px', border: 'none',
                                                    background: sortBy === 'price_low' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                                                    color: sortBy === 'price_low' ? 'white' : 'rgba(255,255,255,0.6)',
                                                    fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                                    boxShadow: sortBy === 'price_low' ? '0 2px 10px rgba(59,130,246,0.3)' : 'none'
                                                }}
                                                title="Najjeftinije prvo"
                                            >
                                                <TrendingDown size={14} /> CENA
                                            </button>
                                            <button
                                                onClick={() => setSortBy('price_high')}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '6px 12px', borderRadius: '14px', border: 'none',
                                                    background: sortBy === 'price_high' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'transparent',
                                                    color: sortBy === 'price_high' ? 'white' : 'rgba(255,255,255,0.6)',
                                                    fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                                    boxShadow: sortBy === 'price_high' ? '0 2px 10px rgba(239,68,68,0.3)' : 'none'
                                                }}
                                                title="Najskuplje prvo"
                                            >
                                                <TrendingUp size={14} /> CENA
                                            </button>
                                            <button
                                                onClick={() => setSortBy('smart')}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '6px 12px', borderRadius: '14px', border: 'none',
                                                    background: sortBy === 'smart' ? 'linear-gradient(135deg, #8E24AC, #6A1B9A)' : 'transparent',
                                                    color: sortBy === 'smart' ? 'white' : 'rgba(255,255,255,0.6)',
                                                    fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                                    boxShadow: sortBy === 'smart' ? '0 2px 10px rgba(142,36,172,0.3)' : 'none'
                                                }}
                                                title="Pametno preporučeno"
                                            >
                                                <Sparkles size={14} /> SMART
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className={`results-mosaic ${viewMode === 'grid' ? 'grid-layout' : viewMode === 'list' ? 'list-layout' : 'notepad-layout'}`}
                                    style={viewMode === 'notepad' ? { display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0' } : { padding: '10px 0 40px 0' }}
                                >
                                    {filteredResults.length > 0 ? (
                                        filteredResults.map((hotel, idx) => (
                                            <HotelCard
                                                key={`${hotel.id}-${idx}`}
                                                hotel={hotel}
                                                isSubagent={isSubagent}
                                                onOpenDetails={setExpandedHotel}
                                                onReserve={(room, rIdx) => handleReserveClick(room, rIdx, hotel)}
                                                viewMode={viewMode}
                                                checkIn={checkIn}
                                                checkOut={checkOut}
                                                nights={nights}
                                                roomAllocations={roomAllocations}
                                                roomFilters={roomFilters}
                                                setRoomFilters={setRoomFilters}
                                                selectedCancelPolicy={selectedCancelPolicy}
                                                setSelectedTimelineRoom={setSelectedTimelineRoom}
                                                selectedRoomsMap={selectedRoomsMap}
                                                selectionPendingHotelId={selectionPendingHotelId}
                                            />
                                        ))
                                    ) : (
                                        <div className="no-results-state" style={{ textAlign: 'center', padding: '100px 40px', background: 'var(--bg-card)', borderRadius: '30px', gridColumn: '1/-1' }}>
                                            <Compass size={48} style={{ marginBottom: '20px', opacity: 0.5 }} />
                                            <h3>Nema rezultata koji odgovaraju filterima.</h3>
                                            <p style={{ color: 'var(--text-secondary)' }}>Pokušajte da ublažite kriterijume ili potražite drugu destinaciju.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="search-init-zone animate-fade-in">
                                {/* NARRATIVE SEARCH UI */}
                                {searchMode === 'narrative' && (
                                    <div className="narrative-mode-container" style={{ padding: '0 2rem 2rem 2rem' }}>
                                        <NarrativeSearch
                                            basicInfo={getInitialNarrativeData()}
                                            onUpdate={(data: any) => handleNarrativeUpdate(data)}
                                            onNext={(data: any) => {
                                                const updates = handleNarrativeUpdate(data);
                                                handleSearch({
                                                    checkIn: updates.checkIn,
                                                    checkOut: updates.checkOut,
                                                    destinations: updates.destinations,
                                                    allocations: updates.allocations
                                                });
                                            }}
                                        />
                                        {isSearching && (
                                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                                                <Loader2 className="spin-slow" size={40} color="#8E24AC" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* IMMERSIVE SEARCH UI - Simplified for now, or use ImmersiveSearch if ready */}
                                {searchMode === 'immersive' && (
                                    <div className="immersive-mode-container">
                                        <ImmersiveSearch
                                            onSearch={(data: ImmersiveSearchData) => {
                                                // Map ImmersiveSearchData to handleSearch params
                                                handleSearch({
                                                    destinations: data.destinations.map((d: any) => ({
                                                        id: d.id,
                                                        name: d.name,
                                                        type: d.type as any,
                                                        country: d.country || ''
                                                    })),
                                                    checkIn: data.checkIn,
                                                    checkOut: data.checkOut,
                                                    allocations: data.roomAllocations
                                                });
                                            }}
                                        />
                                    </div>
                                )}

                                {/* CLASSIC SEARCH UI */}
                                {searchMode === 'classic' && (
                                    <div className="search-card-frame animate-fade-in">
                                        {/* ROW 1: DESTINATION */}
                                        <div className="destination-row">
                                            <div className="field-label"><MapPin size={14} /> Destinacija ili Smeštaj (do 3)</div>
                                            <div className="destination-input-wrapper" ref={autocompleteRef}>
                                                <div className="multi-destination-input premium">
                                                    {selectedDestinations.map(dest => (
                                                        <div key={dest.id} className="destination-chip">
                                                            {dest.type === 'hotel' ? <Hotel size={14} /> : <MapPin size={14} />}
                                                            <span>{dest.name}</span>
                                                            <button className="chip-remove" onClick={() => setSelectedDestinations(selectedDestinations.filter(d => d.id !== dest.id))}><X size={14} /></button>
                                                        </div>
                                                    ))}
                                                    {selectedDestinations.length < 3 && (
                                                        <input
                                                            ref={inputRef}
                                                            type="text"
                                                            placeholder={selectedDestinations.length === 0 ? "npr. Golden Sands, Hotel Park..." : "Dodaj još..."}
                                                            value={destinationInput}
                                                            onChange={(e) => setDestinationInput(e.target.value)}
                                                            className="smart-input-inline"
                                                            onFocus={() => { if (destinationInput.length >= 2) setShowSuggestions(true); }}
                                                        />
                                                    )}
                                                </div>
                                                {showSuggestions && suggestions.length > 0 && (
                                                    <div className="autocomplete-dropdown premium" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 2000 }}>
                                                        {suggestions.map(s => (
                                                            <div key={s.id} className="suggestion-item" onClick={() => handleAddDestination(s)}>
                                                                {s.type === 'hotel' ? <Hotel size={16} className="suggestion-icon hotel" /> : <MapPin size={16} className="suggestion-icon destination" />}
                                                                <div className="suggestion-content">
                                                                    <span className="suggestion-name">{s.name}</span>
                                                                    <span className="suggestion-meta">
                                                                        {s.type === 'hotel' ? (s.stars ? `${s.stars}★ ${s.provider}` : s.provider) : s.country}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* ROW 2: PARAMETERS GRID */}
                                        <div className="params-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                                            <div className="col-checkin param-item">
                                                <div className="field-label"><CalendarIcon size={14} /> Check-in</div>
                                                <div className="input-box" onClick={() => setActiveCalendar('in')} style={{ cursor: 'pointer' }}>
                                                    {checkIn ? formatDate(checkIn) : <span style={{ color: '#64748b' }}>mm/dd/yyyy</span>}
                                                </div>
                                            </div>

                                            <div className="col-checkout param-item">
                                                <div className="field-label"><CalendarIcon size={14} /> Check-out</div>
                                                <div className="input-box" onClick={() => setActiveCalendar('out')} style={{ cursor: 'pointer' }}>
                                                    {checkOut ? formatDate(checkOut) : <span style={{ color: '#64748b' }}>mm/dd/yyyy</span>}
                                                </div>
                                            </div>

                                            <div className="col-flex param-item">
                                                <div className="field-label"><ArrowDownWideNarrow size={14} /> Fleksibilnost</div>
                                                <div className="flex-toggle-group">
                                                    {[0, 1, 3, 5].map(day => (
                                                        <button
                                                            key={day}
                                                            className={`flex-btn ${flexibleDays === day ? 'active' : ''}`}
                                                            onClick={() => setFlexibleDays(day)}
                                                        >
                                                            {day === 0 ? 'Tačno' : `±${day}`}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="col-stars param-item" style={{ position: 'relative' }}>
                                                <div className="field-label"><Star size={14} /> Odaberi Kategoriju</div>
                                                <div className="input-box" onClick={() => setShowStarPicker(!showStarPicker)} style={{ cursor: 'pointer' }}>
                                                    <span style={{ fontSize: '0.85rem' }}>
                                                        {selectedStars.includes('all') ? 'Sve kategorije' : `${selectedStars.length} odabrano`}
                                                    </span>
                                                    <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                                </div>
                                                {showStarPicker && (
                                                    <div className="vertical-filters-popover animate-fade-in-up" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--bg-card)', border: 'var(--border-thin)', borderRadius: '15px', padding: '15px', marginTop: '10px', boxShadow: 'var(--shadow-lg)' }}>
                                                        <div className="vertical-filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <button className={`v-filter-btn ${selectedStars.includes('all') ? 'active' : ''}`} onClick={() => { toggleStarFilter('all'); setShowStarPicker(false); }} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: selectedStars.includes('all') ? 'var(--accent)' : 'transparent', color: selectedStars.includes('all') ? 'white' : 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer' }}>Sve</button>
                                                            {[5, 4, 3, 2, 0].map(s => (
                                                                <button key={s} className={`v-filter-btn ${selectedStars.includes(s.toString()) ? 'active' : ''}`} onClick={() => toggleStarFilter(s.toString())} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: selectedStars.includes(s.toString()) ? 'var(--accent)' : 'transparent', color: selectedStars.includes(s.toString()) ? 'white' : 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer' }}>
                                                                    {renderStarsMini(s)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '10px', marginTop: '10px' }}>
                                                            <button className="v-filter-btn active" style={{ width: '100%', justifyContent: 'center', background: 'var(--accent)', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 700 }} onClick={() => setShowStarPicker(false)}>Zatvori</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="col-meals param-item" style={{ position: 'relative' }}>
                                                <div className="field-label"><UtensilsCrossed size={14} /> Odaberi Uslugu</div>
                                                <div className="input-box" onClick={() => setShowMealPicker(!showMealPicker)} style={{ cursor: 'pointer' }}>
                                                    <span style={{ fontSize: '0.85rem' }}>
                                                        {selectedMealPlans.includes('all') ? 'Sve usluge' : `${selectedMealPlans.length} odabrano`}
                                                    </span>
                                                    <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                                </div>
                                                {showMealPicker && (
                                                    <div className="vertical-filters-popover animate-fade-in-up" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--bg-card)', border: 'var(--border-thin)', borderRadius: '15px', padding: '15px', marginTop: '10px', boxShadow: 'var(--shadow-lg)' }}>
                                                        <div className="vertical-filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <button className={`v-filter-btn ${selectedMealPlans.includes('all') ? 'active' : ''}`} onClick={() => { toggleMealPlanFilter('all'); setShowMealPicker(false); }} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: selectedMealPlans.includes('all') ? 'var(--accent)' : 'transparent', color: selectedMealPlans.includes('all') ? 'white' : 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer' }}>Sve usluge</button>
                                                            {[
                                                                { id: 'RO', label: 'Na - Najam' },
                                                                { id: 'BB', label: 'ND - Doručak' },
                                                                { id: 'HB', label: 'HB - Polupansion' },
                                                                { id: 'FB', label: 'FB - Pun pansion' },
                                                                { id: 'AI', label: 'All - All Inclusive' },
                                                                { id: 'UAI', label: 'UAll - Ultra Inclusive' }
                                                            ].map(mp => (
                                                                <button key={mp.id} className={`v-filter-btn ${selectedMealPlans.includes(mp.id) ? 'active' : ''}`} onClick={() => toggleMealPlanFilter(mp.id)} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: selectedMealPlans.includes(mp.id) ? 'var(--accent)' : 'transparent', color: selectedMealPlans.includes(mp.id) ? 'white' : 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer' }}>
                                                                    {mp.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '10px', marginTop: '10px' }}>
                                                            <button className="v-filter-btn active" style={{ width: '100%', justifyContent: 'center', background: 'var(--accent)', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 700 }} onClick={() => setShowMealPicker(false)}>Zatvori</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="col-nationality" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                {/* Nationality Selector */}
                                                <div className="param-item" style={{ position: 'relative' }}>
                                                    <div className="field-label"><Globe size={14} /> NACIONALNOST</div>
                                                    <div className="input-box" onClick={() => setShowNationalityPicker(!showNationalityPicker)} style={{ cursor: 'pointer' }}>
                                                        <span style={{ fontSize: '0.85rem' }}>
                                                            {NATIONALITY_OPTIONS.find(n => n.code === nationality)?.name || 'Odaberi državu'}
                                                        </span>
                                                        <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                                    </div>
                                                    {showNationalityPicker && (
                                                        <div className="vertical-filters-popover animate-fade-in-up" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--bg-card)', border: 'var(--border-thin)', borderRadius: '15px', padding: '10px', marginTop: '10px', boxShadow: 'var(--shadow-lg)' }}>
                                                            <div className="vertical-filter-group" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                                {NATIONALITY_OPTIONS.map(n => (
                                                                    <button
                                                                        key={n.code}
                                                                        className={`v-filter-btn ${nationality === n.code ? 'active' : ''}`}
                                                                        onClick={() => {
                                                                            setNationality(n.code);
                                                                            setShowNationalityPicker(false);
                                                                        }}
                                                                        style={{ padding: '8px', borderRadius: '8px', border: 'none', background: nationality === n.code ? 'var(--accent)' : 'transparent', color: nationality === n.code ? 'white' : 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer' }}
                                                                    >
                                                                        {n.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Budget Filter */}
                                                <div className="param-item">
                                                    <div className="field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <DollarSign size={14} /> BUDŽET
                                                        </div>
                                                        <BudgetTypeToggle
                                                            type={budgetType}
                                                            onChange={setBudgetType}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                                        <input
                                                            type="number"
                                                            placeholder="Od"
                                                            value={budgetFrom}
                                                            onChange={(e) => setBudgetFrom(e.target.value)}
                                                            className="budget-input"
                                                            style={{ width: '50%', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Do"
                                                            value={budgetTo}
                                                            onChange={(e) => setBudgetTo(e.target.value)}
                                                            className="budget-input"
                                                            style={{ width: '50%', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Room Configuration */}
                                            <div className="col-rooms-tabs">
                                                <div className="room-tabs-header" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                                                    {roomAllocations.map((room, idx) => (
                                                        <button
                                                            key={idx}
                                                            className={`room-tab-btn ${activeRoomTab === idx ? 'active' : ''} ${room.adults > 0 ? 'is-searching' : 'inactive'}`}
                                                            onClick={() => {
                                                                if (activeRoomTab === idx && idx !== 0) {
                                                                    const newAlloc = [...roomAllocations];
                                                                    newAlloc[idx] = { adults: 0, children: 0, childrenAges: [] };
                                                                    setRoomAllocations(newAlloc);
                                                                } else {
                                                                    setActiveRoomTab(idx);
                                                                }
                                                            }}
                                                        >
                                                            Soba {idx + 1}
                                                            {room.adults > 0 && <span className="tab-pax-hint" style={{ fontSize: '10px', marginLeft: '5px', opacity: 0.7 }}>{room.adults}+{room.children}</span>}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="active-room-config full-width animate-fade-in" key={activeRoomTab} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px' }}>
                                                    <div className="passenger-row-redesign-v2" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                                                        {/* Adults */}
                                                        <div className="flight-counter-group-v2">
                                                            <span className="counter-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Odrasli</span>
                                                            <div className="counter-controls-v2" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                                <button onClick={() => {
                                                                    const newAlloc = [...roomAllocations];
                                                                    newAlloc[activeRoomTab].adults = Math.max(1, newAlloc[activeRoomTab].adults - 1);
                                                                    setRoomAllocations(newAlloc);
                                                                }} style={{ width: '30px', height: '30px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>−</button>
                                                                <span className="flight-counter-val" style={{ fontSize: '1.2rem', fontWeight: 800 }}>{roomAllocations[activeRoomTab].adults}</span>
                                                                <button onClick={() => {
                                                                    const newAlloc = [...roomAllocations];
                                                                    newAlloc[activeRoomTab].adults = Math.min(10, newAlloc[activeRoomTab].adults + 1);
                                                                    setRoomAllocations(newAlloc);
                                                                }} style={{ width: '30px', height: '30px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>+</button>
                                                            </div>
                                                        </div>

                                                        {/* Children */}
                                                        <div className="flight-counter-group-v2">
                                                            <span className="counter-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Deca</span>
                                                            <div className="counter-controls-v2" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                                <button onClick={() => {
                                                                    const newAlloc = [...roomAllocations];
                                                                    if (newAlloc[activeRoomTab].children > 0) {
                                                                        newAlloc[activeRoomTab].children -= 1;
                                                                        newAlloc[activeRoomTab].childrenAges.pop();
                                                                        setRoomAllocations(newAlloc);
                                                                    }
                                                                }} style={{ width: '30px', height: '30px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>−</button>
                                                                <span className="flight-counter-val" style={{ fontSize: '1.2rem', fontWeight: 800 }}>{roomAllocations[activeRoomTab].children}</span>
                                                                <button onClick={() => {
                                                                    if (roomAllocations[activeRoomTab].children < 4) {
                                                                        const newAlloc = [...roomAllocations];
                                                                        newAlloc[activeRoomTab].children += 1;
                                                                        newAlloc[activeRoomTab].childrenAges.push(0);
                                                                        setRoomAllocations(newAlloc);
                                                                    }
                                                                }} style={{ width: '30px', height: '30px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>+</button>
                                                            </div>
                                                        </div>

                                                        {/* Children Ages In Line */}
                                                        {roomAllocations[activeRoomTab].children > 0 && (
                                                            <div className="children-ages-row-v2" style={{ display: 'flex', gap: '10px' }}>
                                                                {roomAllocations[activeRoomTab].childrenAges.map((age, idx) => (
                                                                    <div key={idx} className="age-input-v2">
                                                                        <input
                                                                            type="number"
                                                                            min="0" max="17"
                                                                            value={age || ''}
                                                                            placeholder={`Dete ${idx + 1}`}
                                                                            onChange={e => {
                                                                                const val = e.target.value;
                                                                                const newAlloc = [...roomAllocations];
                                                                                newAlloc[activeRoomTab].childrenAges[idx] = val === '' ? ('' as any) : Math.min(17, Math.max(0, parseInt(val)));
                                                                                setRoomAllocations(newAlloc);
                                                                            }}
                                                                            style={{ width: '70px', padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textAlign: 'center' }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SEARCH BUTTONS ROW */}
                                        <div className="action-row-container" style={{ display: 'flex', gap: '20px', alignItems: 'center', width: '100%', marginTop: '30px' }}>
                                            <button className="btn-search-main" onClick={() => handleSearch()} disabled={isSearching} style={{ flex: '2', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderRadius: '40px', background: 'var(--accent)', border: 'none', color: 'white', cursor: 'pointer' }}>
                                                <div style={{ opacity: isSearching ? 0.2 : 1, transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <Search size={28} />
                                                    <span style={{ fontSize: '1.4rem', fontWeight: 900 }}>PRONAĐI NAJBOLJE PONUDE</span>
                                                </div>
                                                {isSearching && (
                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Loader2 className="spin" size={32} color="#fff" />
                                                    </div>
                                                )}
                                            </button>
                                            <button className="btn-new-search-tag" onClick={handleNewSearchTab} style={{ height: '80px', padding: '0 30px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
                                                <Plus size={20} />
                                                <span>NOVA PRETRAGA</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </>
            )}

            {/* MODALS RENDERED IN PORTALS */}
            {
                expandedHotel && !isBookingModalOpen && (
                    <HotelDetailsModal
                        hotel={expandedHotel}
                        checkIn={checkIn}
                        checkOut={checkOut}
                        nights={nights}
                        roomAllocations={roomAllocations}
                        isActuallyDark={isActuallyDark}
                        isSubagent={isSubagent}
                        roomFilters={roomFilters}
                        setRoomFilters={setRoomFilters}
                        selectedCancelPolicy={selectedCancelPolicy}
                        setSelectedCancelPolicy={setSelectedCancelPolicy}
                        setSelectedTimelineRoom={setSelectedTimelineRoom}
                        onClose={() => setExpandedHotel(null)}
                        onReserve={(room, rIdx) => handleReserveClick(room, rIdx, expandedHotel)}
                        selectedRoomsMap={selectedRoomsMap}
                        selectionPendingHotelId={selectionPendingHotelId}
                    />
                )
            }

            {/* Booking Management Portal */}
            {
                createPortal(
                    <div className="booking-portal-host" style={{ position: 'relative', zIndex: 99999999 }}>
                        {isBookingModalOpen && expandedHotel && selectedRoomForBooking && (
                            <BookingModal
                                isOpen={isBookingModalOpen}
                                onClose={() => {
                                    setIsBookingModalOpen(false);
                                    if (viewMode === 'notepad') setExpandedHotel(null);
                                }}
                                provider={expandedHotel.provider.toLowerCase() as any}
                                bookingData={{
                                    hotelName: expandedHotel.name,
                                    location: expandedHotel.location,
                                    checkIn,
                                    checkOut,
                                    nights,
                                    roomType: selectedRoomForBooking.name,
                                    mealPlan: getMealPlanDisplayName(expandedHotel.mealPlan),
                                    adults: roomAllocations.reduce((sum, r) => sum + r.adults, 0),
                                    children: roomAllocations.reduce((sum, r) => sum + r.children, 0),
                                    totalPrice: (isSubagent ? getPriceWithMargin(selectedRoomForBooking.price) : Number(selectedRoomForBooking.price)),
                                    currency: 'EUR',
                                    stars: expandedHotel.stars,
                                    providerData: expandedHotel.originalData,
                                    serviceName: expandedHotel.name,
                                    serviceType: 'hotel',
                                    allSelectedRooms: selectedRoomForBooking.allSelectedRooms,
                                    roomAllocations: roomAllocations.filter(r => r.adults > 0)
                                }}
                                onSuccess={(code, cis, id, prov) => {
                                    setIsBookingModalOpen(false);
                                    setBookingSuccessData({ id: id || '', code: code || '', provider: prov || '' });
                                }}
                                onError={err => {
                                    setBookingAlertError(err);
                                    setTimeout(() => setBookingAlertError(null), 8000);
                                }}
                            />
                        )}

                        <BookingSuccessModal
                            isOpen={!!bookingSuccessData}
                            onClose={() => setBookingSuccessData(null)}
                            onOpenDossier={() => {
                                setBookingSuccessData(null);
                                window.open('/reservation-architect?loadFrom=pending_booking', '_blank');
                            }}
                            bookingCode={bookingSuccessData?.code || ''}
                            internalId={bookingSuccessData?.id || ''}
                            provider={bookingSuccessData?.provider || 'Solvex'}
                            hotelName={expandedHotel?.name || 'Hotel'}
                        />
                    </div>,
                    document.getElementById('portal-root') || document.body
                )
            }

            {/* Cancellation Timeline Modal */}
            {
                selectedTimelineRoom && (
                    <CancellationModal
                        room={selectedTimelineRoom}
                        hotel={expandedHotel}
                        onClose={() => setSelectedTimelineRoom(null)}
                    />
                )
            }
            {/* Search History Sidebar */}
            {showHistorySidebar && (
                <SearchHistorySidebar
                    searchHistory={searchHistory}
                    onClose={() => setShowHistorySidebar(false)}
                    onLoad={handleLoadHistoryItem}
                    onRefresh={handleRefreshHistoryItem}
                    onRemove={removeFromHistory}
                    onClearAll={clearSearchHistory}
                />
            )}

            {/* Floating History Toggle */}
            {createPortal(
                <button
                    className="history-toggle-float"
                    onClick={() => setShowHistorySidebar(true)}
                    style={{ zIndex: 999999 }}
                >
                    <Clock size={28} />
                    {searchHistory.length > 0 && <span className="badge">{searchHistory.length}</span>}
                </button>,
                document.getElementById('portal-root') || document.body
            )}
        </div>
    );
};

// --- STYLES ---
const CUSTOM_UI_STYLES = `
    .filter-icon-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        cursor: pointer;
    }
    .filter-icon-btn:hover {
        transform: translateY(-2px);
        filter: brightness(1.2);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .filter-icon-btn.active.green {
        background: rgba(76, 217, 100, 0.25) !important;
        border-color: #4cd964 !important;
        box-shadow: 0 0 15px rgba(76, 217, 100, 0.3);
    }
    .filter-icon-btn.active.yellow {
        background: rgba(245, 158, 11, 0.25) !important;
        border-color: #f59e0b !important;
        box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);
    }
    .filter-icon-btn.active.red {
        background: rgba(239, 68, 68, 0.25) !important;
        border-color: #ef4444 !important;
        box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
    }
    .hover-scale:hover {
        transform: scale(1.1);
    }
    .view-btn-v4 {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        padding: 10px 14px;
        cursor: pointer;
        border-radius: 20px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .view-btn-v4.active {
        background: var(--accent);
        color: white;
        box-shadow: 0 4px 12px rgba(142, 36, 172, 0.3);
    }
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.id = 'smart-search-custom-styles';
    style.textContent = CUSTOM_UI_STYLES;
    document.head.appendChild(style);
}

export default SmartSearch;
