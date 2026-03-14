import React, { useState, useEffect, useRef } from 'react';
import { 
  Hotel, 
  Plane, 
  Package, 
  Truck, 
  Compass, 
  Mountain,
  MapPin, 
  Calendar, 
  Users, 
  Search, 
  RefreshCw,
  Plus,
  X,
  ChevronDown,
  Navigation,
  Globe,
  Settings,
  History,
  Star,
  Zap,
  LayoutGrid,
  Map as MapIcon,
  AlignLeft,
  Filter,
  ArrowLeftRight,
  Database,
  Menu,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { performSmartSearch, type SmartSearchResult } from '../services/smartSearchService';
import { searchPrefetchService } from '../services/searchPrefetchService';
import { useAuthStore, useThemeStore } from '../stores';
import { HotelCard } from './SmartSearch/components/HotelCard';
import './SmartSearchV2.css';

interface Destination {
    id: string;
    name: string;
    type: 'destination' | 'hotel' | 'country';
    country?: string;
}

const SmartSearchV2: React.FC = () => {
    const { userLevel, impersonatedSubagent } = useAuthStore();
    const isSubagent = userLevel < 6 || !!impersonatedSubagent;
    const { theme } = useThemeStore();
    const isActuallyDark = theme === 'navy' || (theme as string) === 'dark';
    const isLightMode = theme === 'light' || (theme as string) === 'standard' || (theme as string) === 'white';

    // UI States
    const [activeTab, setActiveTab] = useState<'hotel' | 'flight' | 'package' | 'charter' | 'trip' | 'transfer' | 'excursion' | 'ski'>('hotel');
    const [searchPhase, setSearchPhase] = useState<'idle' | 'searching' | 'results'>('idle');
    const [viewMode, setViewMode] = useState<'grid' | 'notepad' | 'strip' | 'map'>('grid');

    // Search Fields
    const [destinationInput, setDestinationInput] = useState('');
    const [selectedDestinations, setSelectedDestinations] = useState<Destination[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<Destination[]>([]);
    
    // Dates & Nights Logic
    const [checkIn, setCheckIn] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
    });
    const [checkOut, setCheckOut] = useState('');
    const [nights, setNights] = useState(1);

    // Advanced Filters State
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Travelers
    const [showPaxPicker, setShowPaxPicker] = useState(false);
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [childrenAges, setChildrenAges] = useState<number[]>([]);

    // Filter States
    const [selectedStars, setSelectedStars] = useState<string[]>([]);
    const [selectedMealPlans, setSelectedMealPlans] = useState<string[]>([]);
    const [budgetFrom, setBudgetFrom] = useState('');
    const [budgetTo, setBudgetTo] = useState('');
    const [flexibility, setFlexibility] = useState(0);
    const [nationality, setNationality] = useState('RS');

    // Results Store
    const [searchResults, setSearchResults] = useState<SmartSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Search Mode & API Selection
    const [searchMode, setSearchMode] = useState<'classic' | 'semantic'>('classic');
    const [showApiSelector, setShowApiSelector] = useState(false);
    const [activeApis, setActiveApis] = useState<string[]>(['Solvex', 'Amadeus']);

    // Date Popovers
    const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
    const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Mock/Dictionary Search
    const mockSuggestions: Destination[] = [
        { id: 'BG', name: 'Bulgaria', type: 'country' },
        { id: 'GR', name: 'Greece', type: 'country' },
        { id: 'TR', name: 'Turkey', type: 'country' },
        { id: 'RS-9', name: 'Bansko', type: 'destination', country: 'Bulgaria' },
        { id: 'RS-33', name: 'Golden Sands', type: 'destination', country: 'Bulgaria' },
        { id: 'RS-68', name: 'Sunny Beach', type: 'destination', country: 'Bulgaria' },
        { id: 'H1', name: 'Hotel Melia Grand Hermitage', type: 'hotel', country: 'Bulgaria' },
        { id: 'H2', name: 'Hotel Barcelo Royal Beach', type: 'hotel', country: 'Bulgaria' },
    ];

    // --- LOGIC: Date Coordination ---
    useEffect(() => {
        if (!checkIn) return;
        const start = new Date(checkIn);
        const end = new Date(start);
        end.setDate(start.getDate() + nights);
        const newOut = end.toISOString().split('T')[0];
        if (newOut !== checkOut) {
            setCheckOut(newOut);
        }
    }, [checkIn, nights]);

    const handleManualCheckOutChange = (newDate: string) => {
        setCheckOut(newDate);
        if (checkIn && newDate) {
            const start = new Date(checkIn);
            const end = new Date(newDate);
            const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            if (diff > 0) setNights(diff);
        }
    };

    // --- LOGIC: Suggestions ---
    useEffect(() => {
        if (destinationInput.length >= 2) {
            const matches = mockSuggestions.filter(s => 
                s.name.toLowerCase().includes(destinationInput.toLowerCase()) ||
                s.country?.toLowerCase().includes(destinationInput.toLowerCase())
            );
            setSuggestions(matches);
            setShowSuggestions(true);

            // SMART PREFETCH: If we have a clear match (e.g. city), start background caching
            if (matches.length > 0 && matches[0].type === 'destination') {
                searchPrefetchService.schedule({
                    searchType: 'hotel',
                    destinations: [matches[0]] as any,
                    checkIn,
                    checkOut,
                    allocations: [{ adults, children, childrenAges }],
                    mealPlan: selectedMealPlans.length > 0 ? selectedMealPlans.join(',') : '',
                    nationality: nationality
                });
            }
        } else {
            setShowSuggestions(false);
        }
    }, [destinationInput]);

    const addTarget = (target: Destination) => {
        if (!selectedDestinations.find(d => d.id === target.id)) {
            setSelectedDestinations([...selectedDestinations, target]);
        }
        setDestinationInput('');
        setShowSuggestions(false);
    };

    // --- LOGIC: Search Execution ---
    const startSearch = async () => {
        if (selectedDestinations.length === 0) return;
        setIsSearching(true);
        setSearchPhase('searching');
        try {
            const results = await performSmartSearch({
                searchType: activeTab as any,
                destinations: selectedDestinations as any,
                checkIn,
                checkOut,
                roomConfig: [{ adults, children, childrenAges }],
                mealPlan: selectedMealPlans.length > 0 ? selectedMealPlans.join(',') : undefined,
                stars: selectedStars.length === 0 ? undefined : selectedStars,
                flexibility: flexibility,
                nationality: nationality
            });
            setSearchResults(results);
            setSearchPhase('results');
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setIsSearching(false);
        }
    };

    // --- COMPONENTS: Helper Renders ---
    const tabs = [
        { id: 'hotel', label: 'Smeštaj', icon: Hotel },
        { id: 'flight', label: 'Letovi', icon: Plane },
        { id: 'package', label: 'Wizard', icon: Package },
        { id: 'charter', label: 'Čarteri', icon: Navigation },
        { id: 'trip', label: 'Putovanja', icon: Compass },
        { id: 'transfer', label: 'Transferi', icon: Truck },
        { id: 'ski', label: 'Ski', icon: Mountain },
    ];

    return (
        <div className={`ss-v2-container ${isLightMode ? 'light-mode' : ''}`}>
            
            {/* 1. TOP HEADER ACTIONS (Top Right) */}
            <div className="ss-v2-top-actions">
                <div className="ss-v2-top-right-actions">
                    <div className="search-mode-toggle-v2">
                        <button 
                            className={searchMode === 'classic' ? 'active' : ''} 
                            onClick={() => setSearchMode('classic')}
                        >
                            Klasična
                        </button>
                        <button 
                            className={searchMode === 'semantic' ? 'active' : ''} 
                            onClick={() => setSearchMode('semantic')}
                        >
                            Semantic
                        </button>
                    </div>

                    <div className="api-selector-trigger-v2" onClick={() => setShowApiSelector(!showApiSelector)}>
                        <Database size={16} />
                        <span className="api-count">{activeApis.length}</span>
                        <ChevronDown size={14} />

                        <AnimatePresence>
                            {showApiSelector && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="api-popup-v2"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="api-popup-header-v2">API KONEKCIJE</div>
                                    <div className="api-list-v2">
                                        {['Solvex', 'Amadeus', 'Sabre', 'Hotelston', 'WebBeds'].map(api => (
                                            <div 
                                                key={api} 
                                                className={`api-item-v2 ${activeApis.includes(api) ? 'active' : ''}`}
                                                onClick={() => {
                                                    if (activeApis.includes(api)) {
                                                        setActiveApis(activeApis.filter(a => a !== api));
                                                    } else {
                                                        setActiveApis([...activeApis, api]);
                                                    }
                                                }}
                                            >
                                                <div className="api-dot"></div>
                                                {api}
                                            </div>
                                        ))}
                                    </div>
                                    <button className="api-apply-btn-v2" onClick={() => setShowApiSelector(false)}>
                                        PRIMENI
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* 2. CENTER TABS (Original Position) */}
            <div className="ss-v2-top-nav">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        className={`nav-item-v2 ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id as any)}
                    >
                        <tab.icon size={22} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* 2. MAIN SEARCH AREA */}
            <AnimatePresence mode="wait">
                {searchPhase !== 'results' && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50, height: 0 }}
                        className="ss-v2-search-area"
                    >

                        <div className="global-search-bar">
                            {/* DESTINATION */}
                            <div className="search-section section-destination">
                                <label>GDE PUTUJETE?</label>
                                <div className="destination-input-wrapper-v2">
                                    {selectedDestinations.map(d => (
                                        <div key={d.id} className="dest-tag-v2">
                                            <span>{d.name}</span>
                                            <X size={12} className="tag-remove" onClick={() => setSelectedDestinations(selectedDestinations.filter(x => x.id !== d.id))} />
                                        </div>
                                    ))}
                                    <input 
                                        type="text" 
                                        placeholder={selectedDestinations.length === 0 ? "Država, mesto ili hotel..." : ""}
                                        value={destinationInput}
                                        onChange={(e) => setDestinationInput(e.target.value)}
                                        onFocus={() => destinationInput.length >= 2 && setShowSuggestions(true)}
                                    />
                                </div>

                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="ac-dropdown-v2">
                                        <div className="ac-header">PREPORUKE</div>
                                        {suggestions.map(s => (
                                            <div key={s.id} className="ac-item-v2" onClick={() => addTarget(s)}>
                                                <div className="ac-icon">
                                                    {s.type === 'country' ? <Globe size={16} /> : s.type === 'hotel' ? <Hotel size={16} /> : <MapPin size={16} />}
                                                </div>
                                                <div className="ac-label">
                                                    <span className="ac-name">{s.name}</span>
                                                    <span className="ac-sub">{s.country || (s.type === 'country' ? 'Država' : 'Mesto')}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* DATES & NIGHTS */}
                            <div className="search-section section-dates">
                                <div className="date-field" onClick={() => setShowCheckInCalendar(!showCheckInCalendar)}>
                                    <label>OD</label>
                                    <div className="custom-date-display">{formatDate(checkIn)}</div>
                                    <AnimatePresence>
                                        {showCheckInCalendar && (
                                            <CalendarPicker 
                                                selectedDate={checkIn} 
                                                onSelect={(d: string) => { setCheckIn(d); setShowCheckInCalendar(false); }} 
                                                onClose={() => setShowCheckInCalendar(false)}
                                                isLightMode={isLightMode}
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="nights-counter">
                                    <label>NOĆI</label>
                                    <input 
                                        type="number" 
                                        value={nights} 
                                        onChange={(e) => setNights(parseInt(e.target.value) || 0)} 
                                    />
                                </div>
                                <div className="date-field" onClick={() => setShowCheckOutCalendar(!showCheckOutCalendar)}>
                                    <label>DO</label>
                                    <div className="custom-date-display">{formatDate(checkOut)}</div>
                                    <AnimatePresence>
                                        {showCheckOutCalendar && (
                                            <CalendarPicker 
                                                selectedDate={checkOut} 
                                                onSelect={(d: string) => { handleManualCheckOutChange(d); setShowCheckOutCalendar(false); }} 
                                                onClose={() => setShowCheckOutCalendar(false)}
                                                minDate={checkIn}
                                                isLightMode={isLightMode}
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* PAX */}
                            <div className="search-section section-pax" onClick={() => setShowPaxPicker(!showPaxPicker)}>
                                <label>PUTNICI</label>
                                <div className="pax-display-v2">
                                    <Users size={16} />
                                    <span>{adults} Adr, {children} Dec</span>
                                    <ChevronDown size={14} />
                                </div>
                                
                                {showPaxPicker && (
                                    <div className="pax-popup-v2" onClick={e => e.stopPropagation()}>
                                        <div className="pax-picker-row">
                                            <div className="pax-info">
                                                <span className="pax-main">Odrasli</span>
                                                <span className="pax-sub">13+ god</span>
                                            </div>
                                            <div className="pax-controls">
                                                <button onClick={() => setAdults(Math.max(1, adults - 1))}>-</button>
                                                <span>{adults}</span>
                                                <button onClick={() => setAdults(adults + 1)}>+</button>
                                            </div>
                                        </div>
                                        <div className="pax-picker-row">
                                            <div className="pax-info">
                                                <span className="pax-main">Deca</span>
                                                <span className="pax-sub">0-12 god</span>
                                            </div>
                                            <div className="pax-controls">
                                                <button onClick={() => { if(children > 0) {setChildren(children-1); setChildrenAges(childrenAges.slice(0, -1));} }}>-</button>
                                                <span>{children}</span>
                                                <button onClick={() => { if(children < 4) {setChildren(children+1); setChildrenAges([...childrenAges, 7]);} }}>+</button>
                                            </div>
                                        </div>
                                        {children > 0 && (
                                            <div className="children-ages-v2-grid">
                                                {childrenAges.map((age, idx) => (
                                                    <div key={idx} className="age-input-v2">
                                                        <label>Dete {idx+1}</label>
                                                        <input 
                                                            type="number" 
                                                            value={age} 
                                                            onChange={(e) => {
                                                                const n = [...childrenAges];
                                                                n[idx] = parseInt(e.target.value);
                                                                setChildrenAges(n);
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <button className="pax-apply-btn" onClick={() => setShowPaxPicker(false)}>PRIMENI</button>
                                    </div>
                                )}
                            </div>

                            {/* NATIONALITY */}
                            <div className="search-section section-nationality">
                                <label>NACIONALNOST</label>
                                <select value={nationality} onChange={(e) => setNationality(e.target.value)}>
                                    <option value="RS">Srbija</option>
                                    <option value="BA">Bosna</option>
                                    <option value="HR">Hrvatska</option>
                                    <option value="ME">Crna Gora</option>
                                    <option value="MK">S. Makedonija</option>
                                </select>
                            </div>

                            {/* TRIGGER */}
                            <button className="search-bar-trigger-v2" onClick={startSearch}>
                                <Search size={20} />
                                <span>POKRENI</span>
                            </button>
                        </div>

                        {/* ADDITIONAL FILTERS (SUB-BAR) - ONLY ADVANCED NOW */}
                        <div className="sub-filter-bar">
                            <div 
                                className={`filter-chip-v2 ${showAdvancedFilters ? 'active' : ''}`}
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            >
                                <Settings size={16} /> Napredni Filteri
                            </div>
                        </div>

                        {/* ADVANCED FILTERS PANEL */}
                        <AnimatePresence>
                            {showAdvancedFilters && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    className="advanced-filters-panel-v2"
                                >
                                    <div className="filters-grid-v2">
                                        <div className="filter-group-v2">
                                            <label>KATEGORIJA (STAR)</label>
                                            <div className="star-selector-v2">
                                                {[5,4,3,2,1].map(s => (
                                                    <button 
                                                        key={s}
                                                        className={selectedStars.includes(String(s)) ? 'active' : ''}
                                                        onClick={() => {
                                                            if (selectedStars.includes(String(s))) {
                                                                setSelectedStars(selectedStars.filter(x => x !== String(s)));
                                                            } else {
                                                                setSelectedStars([...selectedStars, String(s)]);
                                                            }
                                                        }}
                                                    >
                                                        {s} <Star size={12} fill={selectedStars.includes(String(s)) ? "currentColor" : "none"} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="filter-group-v2">
                                            <label>MEAL PLAN (VIŠESTRUKI ODABIR)</label>
                                            <div className="meal-tag-selector-v2">
                                                {[
                                                    {id: 'RO', label: 'RO'},
                                                    {id: 'BB', label: 'BB'},
                                                    {id: 'HB', label: 'HB'},
                                                    {id: 'FB', label: 'FB'},
                                                    {id: 'AI', label: 'AI'},
                                                    {id: 'UAI', label: 'UAI'}
                                                ].map(mp => (
                                                    <button 
                                                        key={mp.id}
                                                        className={selectedMealPlans.includes(mp.id) ? 'active' : ''}
                                                        onClick={() => {
                                                            if (selectedMealPlans.includes(mp.id)) {
                                                                setSelectedMealPlans(selectedMealPlans.filter(x => x !== mp.id));
                                                            } else {
                                                                setSelectedMealPlans([...selectedMealPlans, mp.id]);
                                                            }
                                                        }}
                                                    >
                                                        {mp.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="filter-group-v2">
                                            <div style={{ display: 'flex', gap: '20px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label>FLEKSIBILNOST (DANA)</label>
                                                    <div className="flexi-input-v2">
                                                        <span>±</span>
                                                        <input 
                                                            type="number" 
                                                            value={flexibility} 
                                                            onChange={(e) => setFlexibility(parseInt(e.target.value) || 0)} 
                                                            min="0"
                                                            max="7"
                                                        />
                                                        <label style={{ margin: 0, opacity: 0.5, textTransform: 'none' }}>dana</label>
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label>BUDŽET (MAX EUR)</label>
                                                    <input 
                                                        type="number" 
                                                        placeholder="npr. 2000" 
                                                        value={budgetTo} 
                                                        onChange={(e) => setBudgetTo(e.target.value)} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. CONTENT AREA */}
            <div className="ss-v2-main-content">
                {/* RECAP SIDEBAR (Only in results phase) */}
                <AnimatePresence>
                    {searchPhase === 'results' && (
                        <motion.aside 
                            initial={{ x: -250, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="recap-sidebar"
                        >
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '10px' }}>Pregled pretrage</h2>
                            
                            <div className="recap-card">
                                <div className="recap-title">ODABRANE DESTINACIJE</div>
                                {selectedDestinations.map(d => (
                                    <div key={d.id} className="recap-item">
                                        <MapPin size={14} className="recap-item-icon" />
                                        <span className="recap-item-text">{d.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="recap-card">
                                <div className="recap-title">PERIOD BORAVKA</div>
                                <div className="recap-item">
                                    <Calendar size={14} className="recap-item-icon" />
                                    <span className="recap-item-text">{checkIn} do {checkOut} ({nights} noći)</span>
                                </div>
                            </div>

                            <div className="recap-card">
                                <div className="recap-title">STRUKTURA PUTNIKA</div>
                                <div className="recap-item">
                                    <Users size={14} className="recap-item-icon" />
                                    <span className="recap-item-text">{adults} Odraslih, {children} Dece</span>
                                </div>
                            </div>

                            <div className="sidebar-actions">
                                <button className="btn-sidebar btn-edit-v2" onClick={() => setSearchPhase('idle')}>
                                    <RefreshCw size={14} /> IZMENI PRETRAGU
                                </button>
                                <button className="btn-sidebar btn-new-v2" onClick={() => { setSearchPhase('idle'); setSelectedDestinations([]); }}>
                                    <Plus size={14} /> NOVA PRETRAGA
                                </button>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* RESULTS VIEWPORT */}
                <main className="results-viewport-v2">
                    {isSearching ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                            <RefreshCw className="animate-spin" size={60} color="var(--navy-accent)" />
                            <h3 style={{ fontSize: '20px', fontWeight: 900 }}>DOHVATAM NAJBOLJE PONUDE...</h3>
                        </div>
                    ) : searchPhase === 'results' ? (
                        <div className="animate-fade-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid var(--navy-border)', paddingBottom: '15px' }}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <h2 style={{ fontSize: '24px', fontWeight: 900 }}>Rezultati pretrage <span style={{ color: 'var(--navy-accent)', marginLeft: '10px' }}>({searchResults.length})</span></h2>
                                    <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px' }}>
                                        <button onClick={() => setViewMode('grid')} style={{ padding: '8px', borderRadius: '8px', background: viewMode === 'grid' ? 'var(--navy-accent)' : 'transparent', color: viewMode === 'grid' ? '#000' : '#fff', border: 'none', cursor: 'pointer' }} title="Grid view"><LayoutGrid size={18} /></button>
                                        <button onClick={() => setViewMode('notepad')} style={{ padding: '8px', borderRadius: '8px', background: viewMode === 'notepad' ? 'var(--navy-accent)' : 'transparent', color: viewMode === 'notepad' ? '#000' : '#fff', border: 'none', cursor: 'pointer' }} title="Notepad view"><AlignLeft size={18} /></button>
                                        <button onClick={() => setViewMode('strip')} style={{ padding: '8px', borderRadius: '8px', background: viewMode === 'strip' ? 'var(--navy-accent)' : 'transparent', color: viewMode === 'strip' ? '#000' : '#fff', border: 'none', cursor: 'pointer' }} title="Strip view"><Menu size={18} /></button>
                                        <button onClick={() => setViewMode('map')} style={{ padding: '8px', borderRadius: '8px', background: viewMode === 'map' ? 'var(--navy-accent)' : 'transparent', color: viewMode === 'map' ? '#000' : '#fff', border: 'none', cursor: 'pointer' }} title="Map view"><MapIcon size={18} /></button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button style={{ background: 'none', border: '1px solid var(--navy-accent)', color: 'var(--navy-accent)', borderRadius: '12px', padding: '10px 20px', fontWeight: 800, cursor: 'pointer' }}>SORTIRAJ: NAJBOLJE</button>
                                </div>
                            </div>
                            
                            <div style={viewMode === 'notepad' ? { display: 'flex', flexDirection: 'column', gap: '20px' } : { display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr', gap: '25px' }}>
                                {viewMode === 'map' ? (
                                    <div style={{ height: '600px', background: 'var(--navy-medium)', border: '1px solid var(--navy-accent)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
                                        <MapIcon size={80} color="var(--navy-accent)" />
                                        <h3 style={{ fontWeight: 900 }}>GEO EXPLORER AKTIVAN</h3>
                                        <p style={{ color: 'var(--navy-text-dim)' }}>Interaktivna mapa sa cenama i brzim pregledom.</p>
                                    </div>
                                ) : (
                                    searchResults.map((hotel, idx) => (
                                        <HotelCard 
                                            key={hotel.id || idx} 
                                            hotel={hotel} 
                                            isSubagent={isSubagent}
                                            onOpenDetails={() => {}}
                                            viewMode={viewMode === 'strip' ? 'list' : viewMode as 'grid' | 'notepad'}
                                            checkIn={checkIn}
                                            checkOut={checkOut}
                                            nights={nights}
                                            roomAllocations={[{ adults, children, childrenAges }]}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="search-init-v2">
                        </div>
                    )}
                </main>
            </div>

            {/* FLOATING ACTION PILLS */}
            <div style={{ position: 'fixed', bottom: '30px', right: '30px', display: 'flex', gap: '15px', zIndex: 1000 }}>
                <button style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--navy-medium)', border: '1px solid var(--navy-accent)', color: 'var(--navy-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                   <Database size={20} />
                </button>
                <button style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--navy-medium)', border: '1px solid var(--navy-accent)', color: 'var(--navy-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                   <History size={20} />
                </button>
            </div>
        </div>
    );
};

// --- INTERNAL COMPONENT: CalendarPicker ---
const CalendarPicker = ({ selectedDate, onSelect, onClose, minDate }: any) => {
    const [viewDate, setViewDate] = useState(new Date(selectedDate || new Date()));
    const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const firstDay = (y: number, m: number) => new Date(y, m, 1).getDay();

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthName = viewDate.toLocaleString('sr-RS', { month: 'long' });

    const days = [];
    const totalDays = daysInMonth(year, month);
    const startOffset = (firstDay(year, month) + 6) % 7; // Adjust for Monday start

    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);

    const isSelected = (day: number) => {
        if (!day) return false;
        const d = new Date(year, month, day);
        return d.toISOString().split('T')[0] === selectedDate;
    };

    const isPast = (day: number) => {
        if (!day) return true;
        const d = new Date(year, month, day);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (minDate) {
            const min = new Date(minDate);
            min.setHours(0,0,0,0);
            return d < min;
        }
        return d < today;
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="calendar-popover-v2"
            onClick={e => e.stopPropagation()}
        >
            <div className="cal-header-v2">
                <button onClick={() => setViewDate(new Date(year, month - 1, 1))}>
                    <ChevronLeft size={16} />
                </button>
                <span>{monthName} {year}</span>
                <button onClick={() => setViewDate(new Date(year, month + 1, 1))}>
                    <ChevronRight size={16} />
                </button>
            </div>
            <div className="cal-days-grid-v2">
                {['P', 'U', 'S', 'Č', 'P', 'S', 'N'].map(d => (
                    <div key={d} className="cal-weekday-v2">{d}</div>
                ))}
                {days.map((day, idx) => (
                    <div 
                        key={idx} 
                        className={`cal-day-v2 ${!day ? 'empty' : ''} ${isSelected(day!) ? 'active' : ''} ${day && isPast(day) ? 'past' : ''}`}
                        onClick={() => {
                            if (day && !isPast(day)) {
                                const d = new Date(year, month, day);
                                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                                onSelect(d.toISOString().split('T')[0]);
                            }
                        }}
                    >
                        {day}
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default SmartSearchV2;
