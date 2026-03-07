import React, { useState, useEffect } from 'react';
import { getCountries, searchDestinations } from '../../../integrations/solvex/api/solvexDictionaryService';
import { ChevronRight, ArrowLeft, Calendar as CalendarIcon, Users as UsersIcon, Search, ArrowLeftCircle, ArrowRightCircle, RefreshCcw, Globe, MapPin, Star } from 'lucide-react';
import './ImmersiveSearch.css';
import { ModernCalendar } from '../../ModernCalendar';
import { BudgetTypeToggle } from '../../BudgetTypeToggle';
import { ClickToTravelLogo } from '../../icons/ClickToTravelLogo';

// Define the steps
type Step = 'country' | 'destination' | 'dates' | 'travelers' | 'experiences' | 'confirm';

// Define the updated data structure for partial updates
export interface ImmersiveSearchData {
    destinations: any[];
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    childrenAges: number[];
    roomAllocations: any[]; // Using any[] here to match existing structure, but should ideally be typed
    categories?: string[];
    services?: string[];
    nationality?: string;
    budget?: { from?: number; to?: number; type?: 'person' | 'total' | 'room' };
}

interface ImmersiveSearchProps {
    onSearch: (data: ImmersiveSearchData) => void;
    onPartialUpdate?: (data: ImmersiveSearchData) => void;
    initialStep?: Step;
    initialCountry?: { id: number, name: string } | null;
    initialDestinations?: any[];
}

const CONTINENTS = [
    { id: 'EU', name: 'Evropa' },
    { id: 'AF', name: 'Afrika' },
    { id: 'AS', name: 'Azija' },
    { id: 'AM', name: 'Amerika' },
    { id: 'OC', name: 'Okeanija' },
];

const COUNTRY_TO_CONTINENT: Record<string, string> = {
    'Bugarska': 'EU', 'Bulgaria': 'EU',
    'Grčka': 'EU', 'Greece': 'EU',
    'Turska': 'AS', 'Turkey': 'AS', // Mostly AS for tourism
    'Egipat': 'AF', 'Egypt': 'AF',
    'Crna Gora': 'EU', 'Montenegro': 'EU',
    'Italija': 'EU', 'Italy': 'EU',
    'Tunis': 'AF', 'Tunisia': 'AF',
    'Španija': 'EU', 'Spain': 'EU',
    'Hrvatska': 'EU', 'Croatia': 'EU',
    'Albanija': 'EU', 'Albania': 'EU',
    'Dubai': 'AS', 'UAE': 'AS',
    'Kipar': 'EU', 'Cyprus': 'EU',
    'Maroko': 'AF', 'Morocco': 'AF',
    'Portugal': 'EU', 'Portugalija': 'EU',
    'Francuska': 'EU', 'France': 'EU',
    'Nemačka': 'EU', 'Germany': 'EU',
    'Austrija': 'EU', 'Austria': 'EU',
    'Srbija': 'EU', 'Serbia': 'EU',
    'Kuba': 'AM', 'Cuba': 'AM',
    'Tajland': 'AS', 'Thailand': 'AS',
    'Maldivi': 'AS', 'Maldives': 'AS',
    'Sejšeli': 'AF', 'Seychelles': 'AF',
    'Mauricijus': 'AF', 'Mauritius': 'AF',
    'Zanzibar': 'AF', 'Tanzania': 'AF',
    'Meksiko': 'AM', 'Mexico': 'AM',
    'Dominikanska Republika': 'AM', 'Dominican Republic': 'AM',
    'SAD': 'AM', 'USA': 'AM',
    'Kanada': 'AM', 'Canada': 'AM',
    'Brazil': 'AM', 'Brazilija': 'AM',
    'Malta': 'EU',
    'Holandija': 'EU', 'Netherlands': 'EU',
    'Belgija': 'EU', 'Belgium': 'EU',
    'Švajcarska': 'EU', 'Switzerland': 'EU',
    'Izrael': 'AS', 'Israel': 'AS',
    'Jordan': 'AS',
    'Indija': 'AS', 'India': 'AS',
    'Kina': 'AS', 'China': 'AS',
    'Japan': 'AS',
    'Australija': 'OC', 'Australia': 'OC',
    'Novi Zeland': 'OC', 'New Zealand': 'OC',
};

export const ImmersiveSearchV2: React.FC<ImmersiveSearchProps> = ({ onSearch, onPartialUpdate, initialStep, initialCountry, initialDestinations }) => {
    const [step, setStep] = useState<Step>(initialStep || 'country');
    const [selectedCountry, setSelectedCountry] = useState<{ id: number, name: string } | null>(initialCountry || null);
    const [allCountries, setAllCountries] = useState<any[]>([]);
    const [countrySearchQuery, setCountrySearchQuery] = useState('');
    const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
    const [availableDestinations, setAvailableDestinations] = useState<any[]>([]);
    const [selectedDestinations, setSelectedDestinations] = useState<any[]>(initialDestinations || []);
    const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);
    const [showAllDestinations, setShowAllDestinations] = useState(false);
    const [destinationSearchTerm, setDestinationSearchTerm] = useState('');
    const [isSearchingDestinations, setIsSearchingDestinations] = useState(false);
    const [liveSearchResults, setLiveSearchResults] = useState<any[]>([]);
    const [isSearchingLive, setIsSearchingLive] = useState(false);
    const [activeRegion, setActiveRegion] = useState<any | null>(null);

    // Date & pax state
    const [checkIn, setCheckIn] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    });
    const [checkOut, setCheckOut] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 8);
        return d.toISOString().split('T')[0];
    });
    const [nights, setNights] = useState<number>(7);
    const [rooms, setRooms] = useState(1);
    const [roomAllocations, setRoomAllocations] = useState<{ adults: number, children: number, childrenAges: number[] }[]>([
        { adults: 2, children: 0, childrenAges: [] }
    ]);

    const COUNTRY_TRANSLATIONS: Record<string, string[]> = {
        'Bugarska': ['Bulgaria'],
        'Bulgaria': ['Bugarska', 'Bolgaria'],
        'Grčka': ['Greece'],
        'Greece': ['Grčka'],
        'Turska': ['Turkey'],
        'Turkey': ['Turska'],
        'Egipat': ['Egypt'],
        'Egypt': ['Egipat'],
        'Crna Gora': ['Montenegro'],
        'Montenegro': ['Crna Gora'],
    };

    // Fetch all countries
    useEffect(() => {
        const fetchAll = async () => {
            const res = await getCountries();
            if (res.success && res.data) {
                setAllCountries(res.data);
            }
        };
        fetchAll();
    }, []);

    // Live search for all destinations (Step 1 search bar) - "Direct Connection to Database"
    useEffect(() => {
        if (countrySearchQuery.length >= 2) { // Lowered from 3 to 2 for better "predictive" feel
            const delayDebounceFn = setTimeout(async () => {
                setIsSearchingLive(true);
                try {
                    const results = await searchDestinations(countrySearchQuery, 12);
                    setLiveSearchResults(results);
                } catch (error) {
                    console.error('Live search error:', error);
                } finally {
                    setIsSearchingLive(false);
                }
            }, 400);

            return () => clearTimeout(delayDebounceFn);
        } else {
            setLiveSearchResults([]);
        }
    }, [countrySearchQuery]);

    // Sync nights and dates
    useEffect(() => {
        if (checkIn && checkOut) {
            const start = new Date(checkIn);
            const end = new Date(checkOut);
            const diffTime = end.getTime() - start.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays !== nights && diffDays > 0) {
                setNights(diffDays);
            }
        }
    }, [checkIn, checkOut]);

    const handleNightsChange = (delta: number) => {
        const newNights = Math.max(1, nights + delta);
        setNights(newNights);

        if (checkIn) {
            const start = new Date(checkIn);
            const end = new Date(start);
            end.setDate(start.getDate() + newNights);
            setCheckOut(end.toISOString().split('T')[0]);
        }
    };

    // Validate/Update room allocations when rooms count changes
    useEffect(() => {
        if (roomAllocations.length < rooms) {
            // Add rooms
            const newRooms = [...roomAllocations];
            for (let i = roomAllocations.length; i < rooms; i++) {
                newRooms.push({ adults: 2, children: 0, childrenAges: [] });
            }
            setRoomAllocations(newRooms);
        } else if (roomAllocations.length > rooms) {
            // Remove rooms
            setRoomAllocations(roomAllocations.slice(0, rooms));
        }
    }, [rooms]);

    // Helper to update specific room
    const updateRoom = (index: number, field: 'adults' | 'children', delta: number) => {
        const newAllocations = [...roomAllocations];
        const room = newAllocations[index];

        if (field === 'adults') {
            room.adults = Math.max(1, room.adults + delta);
        } else {
            room.children = Math.max(0, room.children + delta);
            // Adjust ages array size
            if (room.childrenAges.length < room.children) {
                while (room.childrenAges.length < room.children) room.childrenAges.push(5);
            } else if (room.childrenAges.length > room.children) {
                room.childrenAges = room.childrenAges.slice(0, room.children);
            }
        }
        setRoomAllocations(newAllocations);
    };

    // Helper for child age
    const updateChildAge = (roomIndex: number, childIndex: number, newAge: number) => {
        const newAllocations = [...roomAllocations];
        newAllocations[roomIndex].childrenAges[childIndex] = newAge;
        setRoomAllocations(newAllocations);
    };

    // New fields
    // New fields
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // Mandatory multiple
    const [selectedServices, setSelectedServices] = useState<string[]>([]);   // Optional multiple
    const [nationality, setNationality] = useState('RS'); // Mandatory
    const [budgetFrom, setBudgetFrom] = useState('');     // Optional
    const [budgetTo, setBudgetTo] = useState('');         // Optional
    const [budgetType, setBudgetType] = useState<'person' | 'total' | 'room'>('person');

    const [activeCalendar, setActiveCalendar] = useState<'in' | 'out' | null>(null);

    // Load destinations when country is selected
    useEffect(() => {
        if (selectedCountry) {
            const fetchCities = async () => {
                try {
                    setIsLoadingDestinations(true);
                    const results = await searchDestinations(selectedCountry.name, 100);
                    const cities = results.filter((r: any) => r.type === 'city' || r.type === 'hotel');

                    if (cities.length === 0) {
                        if (selectedCountry.name === 'Bugarska' || selectedCountry.name === 'Bulgaria') setAvailableDestinations([
                            { id: 33, name: 'Zlatni Pjasci', type: 'city' },
                            { id: 68, name: 'Sunčev Breg', type: 'city' },
                            { id: 1, name: 'Nesebar', type: 'city' },
                            { id: 9, name: 'Bansko', type: 'city' },
                            { id: 6, name: 'Borovec', type: 'city' },
                            { id: 10, name: 'Pamporovo', type: 'city' }
                        ]);
                        else if (selectedCountry.name === 'Grčka') setAvailableDestinations([
                            {
                                id: 101,
                                name: 'Halkidiki',
                                type: 'destination',
                                children: [
                                    { id: 1011, name: 'Kasandra', type: 'destination' },
                                    { id: 1012, name: 'Sitonija', type: 'destination' },
                                    { id: 1013, name: 'Atos', type: 'destination' }
                                ]
                            },
                            { id: 102, name: 'Tasos', type: 'destination' },
                            { id: 103, name: 'Olimpska Regija', type: 'destination' },
                            { id: 104, name: 'Krf', type: 'destination' },
                            { id: 105, name: 'Rodos', type: 'destination' }
                        ]);
                        else if (selectedCountry.name === 'Turska') setAvailableDestinations([
                            { id: 201, name: 'Antalija', type: 'destination' },
                            { id: 202, name: 'Kemer', type: 'destination' },
                            { id: 203, name: 'Belek', type: 'destination' },
                            { id: 204, name: 'Side', type: 'destination' },
                            { id: 205, name: 'Alanja', type: 'destination' }
                        ]);
                        else if (selectedCountry.name === 'Egipat') setAvailableDestinations([
                            { id: 301, name: 'Hurgada', type: 'destination' },
                            { id: 302, name: 'Šarm el Šeik', type: 'destination' }
                        ]);
                        else {
                            setAvailableDestinations(results);
                        }
                    } else {
                        setAvailableDestinations(cities);
                    }

                    setAvailableDestinations(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
                } catch (error) {
                    console.error('Failed to fetch cities:', error);
                    if (selectedCountry.name === 'Bugarska' || selectedCountry.name === 'Bulgaria') {
                        setAvailableDestinations([
                            { id: 33, name: 'Zlatni Pjasci', type: 'city' },
                            { id: 68, name: 'Sunčev Breg', type: 'city' },
                            { id: 1, name: 'Nesebar', type: 'city' }
                        ]);
                    }
                } finally {
                    setIsLoadingDestinations(false);
                }
            };
            fetchCities();
        }
    }, [selectedCountry]);

    const filteredDestinations = availableDestinations.filter(d =>
        d.name.toLowerCase().includes(destinationSearchTerm.toLowerCase())
    );

    const displayedDestinations = isSearchingDestinations
        ? filteredDestinations
        : (showAllDestinations ? availableDestinations : availableDestinations.slice(0, 10));

    const checkSummerDateRules = (dest: any) => {
        if (dest.isSummer) {
            const currentCheckIn = new Date(checkIn);
            // User requested June 1st onwards for summer destinations.
            // Using 2026 as it's the target year for testing.
            const juneFirst = new Date('2026-06-01');
            if (isNaN(currentCheckIn.getTime()) || currentCheckIn < juneFirst) {
                setCheckIn('2026-06-01');
                const out = new Date('2026-06-01');
                out.setDate(out.getDate() + (nights || 7));
                setCheckOut(out.toISOString().split('T')[0]);
            }
        }
    };

    const handleCountrySelect = (country: { id: number, name: string }) => {
        if (selectedCountry?.id === country.id) {
            setSelectedCountry(null); // Toggle off
        } else {
            setSelectedCountry(country);
            setStep('destination');
            setCountrySearchQuery(''); // Clear search when proceeding
        }
    };

    const handleLiveResultSelect = (result: any) => {
        if (result.type === 'country') {
            handleCountrySelect({ id: result.id, name: result.name });
            // If Bulgaria is selected, we might want to suggest June 1st directly
            if (result.name.toLowerCase().includes('bugarska') || result.name.toLowerCase().includes('bulgaria')) {
                const juneFirst = new Date('2026-06-01');
                if (new Date(checkIn) < juneFirst) {
                    setCheckIn('2026-06-01');
                    const out = new Date('2026-06-01');
                    out.setDate(out.getDate() + (nights || 7));
                    setCheckOut(out.toISOString().split('T')[0]);
                }
            }
        } else if (result.type === 'city' || result.type === 'destination') {
            // Pick country from result if available, or fallback
            const cName = result.country_name || 'Bulgaria';
            setSelectedCountry({ id: 0, name: cName }); // dummy ID for now, effective search uses name/type
            setSelectedDestinations([{
                id: result.id,
                name: result.name,
                type: result.type,
                region_id: result.region_id
            }]);
            checkSummerDateRules(result);
            setStep('dates');
            setCountrySearchQuery('');
        } else if (result.type === 'hotel') {
            const cName = result.country_name || 'Bulgaria';
            setSelectedCountry({ id: 0, name: cName });
            setSelectedDestinations([{
                id: result.id,
                name: result.name,
                type: 'hotel',
                provider: result.provider || 'Solvex'
            }]);
            checkSummerDateRules(result);
            setStep('dates');
            setCountrySearchQuery('');
        }
    };

    const handleDestinationToggle = (dest: any, isSelectionOnly: boolean = false) => {
        // Handle Drill-down
        if (!isSelectionOnly && dest.children && dest.children.length > 0) {
            setActiveRegion(dest);
            return;
        }

        const isSelected = selectedDestinations.find(d => d.id === dest.id);
        if (isSelected) {
            setSelectedDestinations(prev => prev.filter(d => d.id !== dest.id));
        } else {
            if (selectedDestinations.length < 3) {
                setSelectedDestinations(prev => [...prev, dest]);
                checkSummerDateRules(dest);
            }
        }
    };

    const handleDateSelect = (dateStr: string) => {
        if (activeCalendar === 'in') {
            setCheckIn(dateStr);
            if (nights) {
                const start = new Date(dateStr);
                const end = new Date(start);
                end.setDate(start.getDate() + nights);
                setCheckOut(end.toISOString().split('T')[0]);
            }
            setActiveCalendar('out');
        } else {
            setCheckOut(dateStr);
            setActiveCalendar(null);
        }
    };

    // Effect for partial updates (Background Search Trigger)
    useEffect(() => {
        if (onPartialUpdate) {
            const data: ImmersiveSearchData = {
                destinations: selectedDestinations.length > 0 ? selectedDestinations : (selectedCountry ? [{ id: selectedCountry.id, name: selectedCountry.name, type: 'country' }] : []),
                checkIn: checkIn || '',
                checkOut: checkOut || '',
                adults: roomAllocations.reduce((sum, r) => sum + r.adults, 0),
                children: roomAllocations.reduce((sum, r) => sum + r.children, 0),
                childrenAges: roomAllocations.flatMap(r => r.childrenAges),
                roomAllocations,
                categories: selectedCategories,
                services: selectedServices,
                nationality,
                budget: {
                    from: budgetFrom ? Number(budgetFrom) : undefined,
                    to: budgetTo ? Number(budgetTo) : undefined,
                    type: budgetType
                }
            };
            onPartialUpdate(data);
        }
    }, [selectedDestinations, selectedCountry, checkIn, checkOut, roomAllocations, selectedCategories, selectedServices, nationality, budgetFrom, budgetTo, budgetType, onPartialUpdate]);

    const handleFinalSearch = () => {
        // Construct search data
        const searchData = {
            destinations: selectedDestinations.length > 0 ? selectedDestinations : [
                // Fallback to country ID mapping if no specific city selected
                { id: selectedCountry?.id, name: selectedCountry?.name, type: 'country' }
            ],
            checkIn: checkIn || new Date().toISOString().split('T')[0], // Fallback today
            checkOut: checkOut || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            rooms,
            // Sum up total travelers for compatibility, but also pass room details if needed
            adults: roomAllocations.reduce((sum, r) => sum + r.adults, 0),
            children: roomAllocations.reduce((sum, r) => sum + r.children, 0),
            childrenAges: roomAllocations.flatMap(r => r.childrenAges),
            roomAllocations, // Pass full structure

            // New structure
            categories: selectedCategories,
            services: selectedServices,
            nationality,
            budget: {
                from: budgetFrom ? Number(budgetFrom) : undefined,
                to: budgetTo ? Number(budgetTo) : undefined,
                type: budgetType
            }
        };

        // Basic validation for mandatory fields
        const isHotelSelected = selectedDestinations.some(d => d.type === 'hotel');
        if (selectedCategories.length === 0 && !isHotelSelected) {
            alert('Molimo izaberite bar jednu kategoriju (Zvezdice).');
            return;
        }
        if (!nationality) {
            alert('Molimo unesite nacionalnost.');
            return;
        }

        onSearch(searchData);
    };

    // Toggles
    const toggleCategory = (cat: string) => {
        if (selectedCategories.includes(cat)) {
            setSelectedCategories(prev => prev.filter(c => c !== cat));
        } else {
            setSelectedCategories(prev => [...prev, cat]);
        }
    };

    const toggleService = (srv: string) => {
        if (selectedServices.includes(srv)) {
            setSelectedServices(prev => prev.filter(s => s !== srv));
        } else {
            setSelectedServices(prev => [...prev, srv]);
        }
    };

    const handleReset = () => {
        setStep('country');
        setSelectedCountry(null);
        setSelectedDestinations([]);
        setActiveRegion(null);
        setCheckIn('');
        setCheckOut('');
        setNights(7);
        setRooms(1);
        setRoomAllocations([{ adults: 2, children: 0, childrenAges: [] }]);
    };

    return (
        <div className="immersive-wrapper">
            {step !== 'country' && (
                <button className="immersive-reset-link" onClick={handleReset}>
                    <RefreshCcw size={14} /> Vrati na početak
                </button>
            )}
            {/* STEP 1: COUNTRY */}
            {step === 'country' && (
                <div className="immersive-step-container step-1-top-aligned">
                    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto 2rem auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="immersive-title" style={{ marginBottom: '1rem', fontSize: '1.8rem' }}>
                            Gde želite da putujete?
                        </div>
                        {/* Continent Filters - Moved Above Search */}
                        <div className="continent-filters animate-fade-in" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.5rem' }}>
                            {CONTINENTS.map(cont => (
                                <div
                                    key={cont.id}
                                    className={`immersive-filter-tag ${selectedContinent === cont.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedContinent(selectedContinent === cont.id ? null : cont.id)}
                                    style={{ padding: '8px 20px', fontSize: '1rem', borderRadius: '50px' }}
                                >
                                    {cont.name}
                                </div>
                            ))}
                        </div>

                        {/* Search Field */}
                        <div className="immersive-search-wrapper" style={{ position: 'relative' }}>
                            <Search size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, color: 'white' }} />
                            <input
                                type="text"
                                className="immersive-input search-main"
                                placeholder="Pretražite države, gradove ili hotele..."
                                style={{
                                    width: '100%',
                                    padding: '1.2rem 1.2rem 1.2rem 55px',
                                    borderRadius: '20px',
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    fontSize: '1.3rem',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                }}
                                value={countrySearchQuery}
                                onChange={(e) => setCountrySearchQuery(e.target.value)}
                                autoFocus
                            />
                            {isSearchingLive && (
                                <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)' }}>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white opacity-50"></div>
                                </div>
                            )}

                            {/* LIVE SEARCH RESULTS - INSIDE RELATIVE WRAPPER */}
                            {liveSearchResults.length > 0 && (
                                <div className="live-results-overlay animate-fade-in">
                                    {liveSearchResults.map((res: any) => (
                                        <div
                                            key={`${res.type}-${res.id}-${res.name}`}
                                            className="live-result-item"
                                            onClick={() => handleLiveResultSelect(res)}
                                        >
                                            <div className="live-result-icon">
                                                {res.type === 'country' && <Globe size={18} color="#8E24AC" />}
                                                {res.type === 'city' && <MapPin size={18} color="#10b981" />}
                                                {res.type === 'hotel' && <Star size={18} color="#f59e0b" />}
                                            </div>
                                            <div className="live-result-item-content">
                                                <div className="live-result-item-name">{res.name}</div>
                                                <div className="live-result-item-sub">
                                                    {res.type === 'country' ? 'Država' :
                                                        res.type === 'hotel' ? `${res.city_name || ''}, ${res.country_name || ''}` :
                                                            (res.country_name || 'Destinacija')}
                                                </div>
                                            </div>
                                            <ChevronRight size={14} opacity={0.3} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Instant Visual Feedback when searching */}
                        {countrySearchQuery.length > 0 && liveSearchResults.length === 0 && !isSearchingLive && (
                            <div className="animate-fade-in" style={{ fontSize: '0.9rem', opacity: 0.5, textAlign: 'center' }}>
                                Tražim najbolje opcije za vas...
                            </div>
                        )}
                    </div>

                    <div className="immersive-tags-grid">
                        {allCountries
                            .filter(c => {
                                const q = countrySearchQuery.toLowerCase();
                                const name = c.name.toLowerCase();
                                const translations = COUNTRY_TRANSLATIONS[c.name] || [];
                                const matchesSearch = name.includes(q) || translations.some(t => t.toLowerCase().includes(q));

                                const continent = COUNTRY_TO_CONTINENT[c.name] || (c.name.toLowerCase().includes('bugarska') ? 'EU' : null);
                                const matchesContinent = !selectedContinent || continent === selectedContinent;
                                return matchesSearch && matchesContinent;
                            })
                            .sort((a, b) => {
                                // Keep favorites at top
                                const favs = ['Bugarska', 'Grčka', 'Turska', 'Egipat', 'Crna Gora', 'Italija', 'Tunis', 'Španija'];
                                const aIdx = favs.indexOf(a.name);
                                const bIdx = favs.indexOf(b.name);
                                if (aIdx !== -1 && bIdx === -1) return -1;
                                if (aIdx === -1 && bIdx !== -1) return 1;
                                if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                                return a.name.localeCompare(b.name);
                            })
                            // If search/filter is active, show more, otherwise show a manageable set
                            .slice(0, (countrySearchQuery || selectedContinent) ? 50 : 12)
                            .map(country => (
                                <div
                                    key={country.id}
                                    className={`immersive-tag country ${selectedCountry?.id === country.id ? 'selected' : ''}`}
                                    onClick={() => handleCountrySelect(country)}
                                >
                                    {country.name === 'Bulgaria' ? 'Bugarska' : country.name}
                                </div>
                            ))}

                        {!countrySearchQuery && !selectedContinent && (
                            <div
                                className="immersive-tag search-trigger"
                                onClick={() => {
                                    // Focus search? No easy ref here, but we can clear filters
                                }}
                                style={{ borderStyle: 'dashed', opacity: 0.5 }}
                            >
                                Mnoge druge države su dostupne putem pretrage iznad...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* STEP 2: DESTINATIONS */}
            {step === 'destination' && (
                <div className="immersive-step-container">

                    {isLoadingDestinations ? (
                        <div style={{ color: 'white', opacity: 0.7 }}>Učitavam destinacije...</div>
                    ) : (
                        <div className="immersive-tags-grid">
                            {isSearchingDestinations && (
                                <div style={{ width: '100%', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Upišite naziv destinacije..."
                                        className="immersive-input"
                                        style={{ maxWidth: '300px', textAlign: 'center' }}
                                        value={destinationSearchTerm}
                                        onChange={(e) => setDestinationSearchTerm(e.target.value)}
                                    />
                                </div>
                            )}

                            {activeRegion && (
                                <div
                                    className={`immersive-tag ${selectedDestinations.find(d => d.id === activeRegion.id) ? 'selected' : ''}`}
                                    onClick={() => handleDestinationToggle(activeRegion, true)}
                                    style={{ borderStyle: 'solid', borderColor: '#8E24AC' }}
                                >
                                    Ceo {activeRegion.name}
                                </div>
                            )}

                            {(activeRegion ? activeRegion.children : filteredDestinations).slice(0, isSearchingDestinations ? 50 : (showAllDestinations ? 50 : 15)).map((dest: any) => (
                                <div
                                    key={dest.id}
                                    className={`immersive-tag ${selectedDestinations.find(d => d.id === dest.id) ? 'selected' : ''}`}
                                    onClick={() => handleDestinationToggle(dest)}
                                >
                                    {dest.name}
                                </div>
                            ))}

                            {!isSearchingDestinations && !activeRegion && availableDestinations.length > 15 && (
                                <div
                                    className="immersive-tag search-trigger"
                                    onClick={() => setIsSearchingDestinations(true)}
                                    style={{ borderStyle: 'dashed', opacity: 0.8 }}
                                >
                                    <Search size={16} style={{ marginRight: 6 }} /> Pretraži ostalo...
                                </div>
                            )}
                        </div>
                    )}

                    <div className="immersive-step-footer">
                        <button className="immersive-back-btn icon-only" onClick={() => {
                            if (activeRegion) {
                                setActiveRegion(null);
                            } else {
                                setStep('country');
                                setSelectedCountry(null);
                                setSelectedDestinations([]);
                            }
                        }}>
                            <ArrowLeftCircle size={36} />
                        </button>
                        {(selectedDestinations.length > 0 || activeRegion) && (
                            <button className="immersive-next-btn icon-only" onClick={() => setStep('dates')}>
                                <ArrowRightCircle size={36} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* STEP 3: DATES */}
            {step === 'dates' && (
                <div className="immersive-step-container" style={{ position: 'relative' }}>

                    <div className="immersive-inputs-grid-expanded" style={{ maxWidth: '750px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="immersive-section-row" style={{ gridTemplateColumns: '1fr 0.6fr 1fr' }}>
                                <div className="immersive-input-group">
                                    <label className="immersive-label"><CalendarIcon size={16} style={{ marginRight: 8, display: 'inline' }} /> Datum Polaska</label>
                                    <div className="immersive-date-display" onClick={() => setActiveCalendar('in')}>
                                        {checkIn ? new Date(checkIn).toLocaleDateString('sr-RS') : 'Izaberite datum'}
                                    </div>
                                </div>

                                <div className="immersive-input-group" style={{ alignItems: 'center', justifyContent: 'center' }}>
                                    <label className="immersive-label">Noćenja</label>
                                    <div className="immersive-counter">
                                        <button onClick={() => handleNightsChange(-1)}>-</button>
                                        <span style={{ fontSize: '1.5rem', minWidth: '40px', textAlign: 'center' }}>{nights}</span>
                                        <button onClick={() => handleNightsChange(1)}>+</button>
                                    </div>
                                </div>

                                <div className="immersive-input-group">
                                    <label className="immersive-label"><CalendarIcon size={16} style={{ marginRight: 8, display: 'inline' }} /> Datum Povratka</label>
                                    <div className="immersive-date-display" onClick={() => setActiveCalendar('out')}>
                                        {checkOut ? new Date(checkOut).toLocaleDateString('sr-RS') : 'Izaberite datum'}
                                    </div>
                                </div>
                            </div>

                            {checkIn && checkOut && (
                                <div style={{ textAlign: 'center', color: '#8E24AC', fontSize: '1.1rem', background: 'rgba(142, 36, 172, 0.1)', padding: '0.8rem', borderRadius: '15px' }}>
                                    Boravak od <strong>{new Date(checkIn).toLocaleDateString('sr-RS')}</strong> do <strong>{new Date(checkOut).toLocaleDateString('sr-RS')}</strong> ({nights} {nights === 1 ? 'noćenje' : 'noćenja'})
                                </div>
                            )}
                        </div>
                    </div>

                    {activeCalendar && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 100,
                            background: 'var(--bg-card)',
                            padding: '1rem',
                            borderRadius: '20px',
                            boxShadow: 'var(--shadow-lg)',
                            border: 'var(--border-thin)'
                        }}>
                            <ModernCalendar
                                startDate={checkIn || null}
                                endDate={checkOut || null}
                                onChange={(start, end) => {
                                    if (start) setCheckIn(start);
                                    if (end) setCheckOut(end);
                                    if (start && end) setActiveCalendar(null);
                                }}
                                onClose={() => setActiveCalendar(null)}
                            />
                        </div>
                    )}

                    <div className="immersive-step-footer">
                        <button className="immersive-back-btn icon-only" onClick={() => setStep('destination')}>
                            <ArrowLeftCircle size={36} />
                        </button>
                        {checkIn && checkOut && (
                            <button className="immersive-next-btn icon-only" onClick={() => setStep('travelers')}>
                                <ArrowRightCircle size={36} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* STEP 4: TRAVELERS */}
            {step === 'travelers' && (
                <div className="immersive-step-container">

                    <div className="immersive-inputs-grid-expanded">
                        <div className="immersive-section-row" style={rooms > 1 ? { gridTemplateColumns: '1fr' } : {}}>
                            <div style={{ display: 'flex', gap: '1.5rem', width: '100%', flexDirection: rooms > 1 ? 'column' : 'row' }}>
                                <div className="immersive-input-group" style={{ height: 'auto', alignSelf: 'flex-start', minWidth: '200px' }}>
                                    <label className="immersive-label">Broj Soba</label>
                                    <div className="immersive-counter">
                                        <button onClick={() => setRooms(Math.max(1, rooms - 1))}>-</button>
                                        <span>{rooms}</span>
                                        <button onClick={() => setRooms(rooms + 1)}>+</button>
                                    </div>
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {roomAllocations.map((room, index) => (
                                        <div key={index} className="immersive-input-group" style={{ height: 'auto' }}>
                                            <label className="immersive-label">
                                                <UsersIcon size={16} style={{ marginRight: 8, display: 'inline' }} />
                                                Putnici - Soba {index + 1}
                                            </label>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                                    <div className="immersive-counter">
                                                        <span className="counter-label">Odrasli:</span>
                                                        <button onClick={() => updateRoom(index, 'adults', -1)}>-</button>
                                                        <span>{room.adults}</span>
                                                        <button onClick={() => updateRoom(index, 'adults', 1)}>+</button>
                                                    </div>
                                                    <div className="immersive-counter">
                                                        <span className="counter-label">Deca:</span>
                                                        <button onClick={() => updateRoom(index, 'children', -1)}>-</button>
                                                        <span>{room.children}</span>
                                                        <button onClick={() => updateRoom(index, 'children', 1)}>+</button>
                                                    </div>
                                                </div>

                                                {room.children > 0 && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                                                        <span className="counter-label" style={{ fontSize: '0.8rem' }}>Uzrast dece:</span>
                                                        {room.childrenAges.map((age, cIndex) => (
                                                            <input
                                                                key={cIndex}
                                                                type="number"
                                                                className="immersive-input"
                                                                style={{ width: '40px', padding: '0', textAlign: 'center', fontSize: '1rem' }}
                                                                value={age}
                                                                min={0}
                                                                max={17}
                                                                onChange={(e) => updateChildAge(index, cIndex, parseInt(e.target.value) || 0)}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="immersive-step-footer">
                        <button className="immersive-back-btn icon-only" onClick={() => setStep('dates')}>
                            <ArrowLeftCircle size={36} />
                        </button>
                        <button className="immersive-next-btn icon-only" onClick={() => setStep('experiences')}>
                            <ArrowRightCircle size={36} />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 5: EXPERIENCES */}
            {step === 'experiences' && (
                <div className="immersive-step-container">

                    <div className="immersive-inputs-grid-expanded">
                        <div className="immersive-input-group">
                            <label className="immersive-label">
                                Kategorija (Zvezdice)
                                {selectedDestinations.some(d => d.type === 'hotel') ? (
                                    <span className="opt"> (Opciono)</span>
                                ) : (
                                    <span className="req"> *</span>
                                )}
                            </label>
                            <div className="immersive-tags-row">
                                {['2', '3', '4', '5'].map(star => (
                                    <div
                                        key={star}
                                        className={`immersive-filter-tag ${selectedCategories.includes(star) ? 'selected' : ''}`}
                                        onClick={() => toggleCategory(star)}
                                    >
                                        {star} ★
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="immersive-input-group">
                            <label className="immersive-label">Usluga <span className="opt">(Opciono)</span></label>
                            <div className="immersive-tags-row">
                                {[
                                    { code: 'RO', label: 'Najam' },
                                    { code: 'BB', label: 'Noćenje sa doručkom' },
                                    { code: 'HB', label: 'Polupansion' },
                                    { code: 'FB', label: 'Pun Pansion' },
                                    { code: 'AI', label: 'All Inclusive' },
                                    { code: 'UAI', label: 'Ultra AI' }
                                ].map(srv => (
                                    <div
                                        key={srv.code}
                                        className={`immersive-filter-tag ${selectedServices.includes(srv.code) ? 'selected' : ''}`}
                                        onClick={() => toggleService(srv.code)}
                                    >
                                        {srv.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="immersive-section-row">
                            <div className="immersive-input-group">
                                <label className="immersive-label">Nacionalnost <span className="req">*</span></label>
                                <select
                                    className="immersive-select"
                                    value={nationality}
                                    onChange={(e) => setNationality(e.target.value)}
                                >
                                    <option value="RS">Srbija</option>
                                    <option value="BA">Bosna i Hercegovina</option>
                                    <option value="ME">Crna Gora</option>
                                    <option value="HR">Hrvatska</option>
                                    <option value="MK">Makedonija</option>
                                    <option value="EU">EU Pasoš</option>
                                    <option value="Other">Ostalo</option>
                                </select>
                            </div>
                            <div className="immersive-input-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label className="immersive-label">Budžet (EUR) <span className="opt">(Opciono)</span></label>
                                    <BudgetTypeToggle type={budgetType} onChange={setBudgetType} />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        className="immersive-input"
                                        placeholder="Od"
                                        value={budgetFrom}
                                        onChange={(e) => setBudgetFrom(e.target.value)}
                                    />
                                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>-</span>
                                    <input
                                        type="number"
                                        className="immersive-input"
                                        placeholder="Do"
                                        value={budgetTo}
                                        onChange={(e) => setBudgetTo(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="immersive-step-footer">
                        <button className="immersive-back-btn icon-only" onClick={() => setStep('travelers')}>
                            <ArrowLeftCircle size={36} />
                        </button>
                        <button className="immersive-next-btn icon-only" onClick={() => setStep('confirm')}>
                            <ArrowRightCircle size={36} />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 6: CONFIRM */}
            {step === 'confirm' && (
                <div className="immersive-step-container">

                    <div className="immersive-inputs-grid" style={{ gridTemplateColumns: '1fr' }}>
                        <div className="immersive-input-group" style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
                                Vaša pretraga za {selectedDestinations.length > 0 ? selectedDestinations.map(d => d.name).join(', ') : selectedCountry?.name} je spremna.
                            </p>
                        </div>
                    </div>

                    <div className="immersive-step-footer">
                        <button className="immersive-back-btn icon-only" onClick={() => setStep('experiences')}>
                            <ArrowLeftCircle size={36} />
                        </button>
                        <button className="immersive-next-btn luxury-btn" onClick={handleFinalSearch} style={{ minWidth: '200px', height: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <ClickToTravelLogo height={58} iconOnly={true} iconScale={2.2} forceOutline={true} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
