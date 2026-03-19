import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useThemeStore, useAuthStore } from '../stores';
import {
  Hotel, Plane, Package, PlaneTakeoff, Compass, Bus, Ticket, Tent, Car, Anchor, Zap,
  Search, Clock, Database, MapPin, Calendar, Users, UtensilsCrossed,
  DollarSign, Flag, Star, Map, LayoutGrid, List as ListIcon,
  X, Check, ChevronRight, Sliders, ArrowLeftRight, ChevronDown,
  ChevronUp, Info, Luggage, Loader2, AlertCircle, Eye, Sparkles,
  Globe, Building2, Navigation, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { performSmartSearch, type SmartSearchResult } from '../services/smartSearchService';
import flightSearchManager from '../services/flight/flightSearchManager';
import type { UnifiedFlightOffer, FlightSearchParams } from '../types/flight.types';
import { searchPrefetchService } from '../services/searchPrefetchService';
import solvexDictionaryService from '../integrations/solvex/api/solvexDictionaryService';
import { ModernCalendar } from '../components/ModernCalendar';
import { BookingModal } from '../components/booking/BookingModal';
import PackageSearch, { WIZARD_STEPS } from './PackageSearch';
import type { Destination, RoomAllocation } from './SmartSearch/types';
import { MOCK_DESTINATIONS, MEAL_PLAN_OPTIONS, NATIONALITY_OPTIONS } from './SmartSearch/types';
import { calcNightsFromDates } from './SmartSearch/helpers';
import './SmartSearchV4.css';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type SearchModeV4 = 'classic' | 'semantic' | 'ai';
type TabIdV4 = 'hotel' | 'flight' | 'package' | 'charter' | 'tour' | 'transfer' | 'excursion' | 'event' | 'cruise' | 'car';
type TripType = 'round' | 'oneway' | 'multi';
type ViewMode = 'list' | 'grid' | 'map';
type SortBy = 'smart' | 'price_asc' | 'price_desc' | 'rating' | 'commission';

interface SearchSelection {
  id: string;
  type: string;
  name: string;
  price: number;
  icon: React.ReactNode;
  aiSummary?: string;
}

// ─────────────────────────────────────────────────────────────
// TAB CONFIGURATION - Complete NeoTravel Tabs
// ─────────────────────────────────────────────────────────────

const TABS_V4: { id: TabIdV4; label: string; icon: React.ElementType; emoji?: string; fields?: string[] }[] = [
  { id: 'hotel', label: 'Smeštaj', icon: Building2, emoji: '🏨', fields: ['city-hotel', 'dates', 'rooms'] },
  { id: 'flight', label: 'Letovi', icon: Plane, emoji: '✈️', fields: ['from', 'to', 'dates', 'passengers'] },
  { id: 'package', label: 'Paketi', icon: Package, emoji: '📦', fields: ['from', 'to', 'dates', 'rooms'] },
  { id: 'transfer', label: 'Transferi', icon: Navigation, emoji: '🚗', fields: ['from-to', 'dates', 'time'] },
  { id: 'excursion', label: 'Izleti', icon: Map, emoji: '🗺️', fields: ['destination', 'dates'] },
  { id: 'cruise', label: 'Krstarenja', icon: Anchor, emoji: '⚓', fields: ['destination', 'dates', 'cruise-line'] },
  { id: 'tour', label: 'Putovanja', icon: Compass, emoji: '🧭', fields: ['destination', 'dates'] },
  { id: 'charter', label: 'Čarteri', icon: Zap, emoji: '⚡', fields: ['from', 'to', 'dates'] },
  { id: 'car', label: 'Auto iznajmljivanje', icon: Car, emoji: '🏎️', fields: ['pickup', 'dates'] },
  { id: 'event', label: 'Događanja', icon: Tent, emoji: '🎪', fields: ['destination', 'dates'] },
];

// ─────────────────────────────────────────────────────────────
// MOCK DATA - From NeoTravel Module
// ─────────────────────────────────────────────────────────────

const MOCK_SEARCH_RESULTS: SearchSelection[] = [
  {
    id: 'h-1',
    type: 'Accommodation',
    name: 'Rixos Premium Magawish',
    price: 145,
    icon: <Building2 color="#800020" size={24} />,
    aiSummary: 'Idealno za porodice. All Inclusive sa privatnom plažom.'
  },
  {
    id: 'h-2',
    type: 'Accommodation',
    name: 'Steigenberger ALDAU Beach',
    price: 125,
    icon: <Building2 color="#800020" size={24} />,
    aiSummary: 'Vrhunski spa centar i vodeni sportovi.'
  },
  {
    id: 'h-3',
    type: 'Accommodation',
    name: 'Baron Palace Sahl Hasheesh',
    price: 180,
    icon: <Building2 color="#800020" size={24} />,
    aiSummary: 'Ultimativni luksuz. Samo za VIP goste.'
  },
  {
    id: 'f-1',
    type: 'Flight',
    name: 'Air Cairo SM381 - Direktan let',
    price: 320,
    icon: <Plane color="#800020" size={24} />,
    aiSummary: 'Najbrži direktan let BEG → HRG (5h 15m). 7KG kabinski prtljag.'
  },
  {
    id: 'f-2',
    type: 'Flight',
    name: 'Turkish Airlines TK1082',
    price: 410,
    icon: <Plane color="#800020" size={24} />,
    aiSummary: 'Vrhunski komfor sa 1 stanicom u Istanbulu. 30KG prtljag.'
  },
  {
    id: 'a-1',
    type: 'Activity',
    name: 'Giftun Island Speedboat',
    price: 65,
    icon: <Map color="#800020" size={24} />,
    aiSummary: 'Must see! Snorkeling sa ručkom uključen. Popularan izbor.'
  },
  {
    id: 't-1',
    type: 'Transfer',
    name: 'Airport Transfer - Speedboat Port',
    price: 35,
    icon: <Navigation color="#800020" size={24} />,
    aiSummary: 'Brz i siguran transfer. Direktno do destinacije.'
  },
  {
    id: 'c-1',
    type: 'Cruise',
    name: 'Red Sea Discovery Cruise',
    price: 250,
    icon: <Anchor color="#800020" size={24} />,
    aiSummary: 'Četiri dana na Red Sea-u. All meals included.'
  }
];

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export const SmartSearchV4: React.FC = () => {
  const { theme } = useThemeStore();
  const { userLevel } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isB2B = userLevel >= 5;

  // ── Tab & Mode State ──────────────────────────────────────
  const [searchMode, setSearchMode] = useState<SearchModeV4>('classic');
  const [activeTab, setActiveTab] = useState<TabIdV4>((searchParams.get('tab') as TabIdV4) || 'hotel');
  const [packageStep, setPackageStep] = useState(0);

  // ── Hotel Search State ────────────────────────────────────
  const [selectedDestinations, setSelectedDestinations] = useState<Destination[]>([]);
  const [destInput, setDestInput] = useState('');
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [nights, setNights] = useState(7);
  const [rooms, setRooms] = useState<RoomAllocation[]>([{ adults: 2, children: 0, childrenAges: [] }]);
  const [mealPlan, setMealPlan] = useState('all');
  const [nationality, setNationality] = useState('RS');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPax, setShowPax] = useState(false);
  const [showMealPlan, setShowMealPlan] = useState(false);
  const [showNationality, setShowNationality] = useState(false);
  const [budgetFrom, setBudgetFrom] = useState<string>('');
  const [budgetTo, setBudgetTo] = useState<string>('');
  const [semanticQuery, setSemanticQuery] = useState('');

  // ── Flight Search State ────────────────────────────────────
  const [tripType, setTripType] = useState<TripType>('round');
  const [originInput, setOriginInput] = useState('BEG');
  const [destFlightInput, setDestFlightInput] = useState('');
  const [depDate, setDepDate] = useState('');
  const [retDate, setRetDate] = useState('');
  const [paxAdults, setPaxAdults] = useState(2);
  const [paxChildren, setPaxChildren] = useState(0);
  const [flightClass, setFlightClass] = useState('Economy');
  const [flexDays, setFlexDays] = useState(0);

  // ── Results & UI State ────────────────────────────────────
  const [results, setResults] = useState<SmartSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPhase, setSearchPhase] = useState<'idle' | 'results'>('idle');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('smart');
  const [selectedHotel, setSelectedHotel] = useState<SmartSearchResult | null>(null);
  const [selectedSearch, setSelectedSearch] = useState<SearchSelection | null>(null);

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => {
    const t = searchParams.get('tab') as TabIdV4;
    if (t && t !== activeTab) setActiveTab(t);
  }, [searchParams]);

  useEffect(() => {
    if (destInput.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const filtered = MOCK_DESTINATIONS.filter(d =>
      d.name.toLowerCase().includes(destInput.toLowerCase()) &&
      !selectedDestinations.find(s => s.id === d.id)
    ).slice(0, 8);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [destInput, selectedDestinations]);

  useEffect(() => {
    if (checkIn && checkOut) setNights(calcNightsFromDates(checkIn, checkOut));
  }, [checkIn, checkOut]);

  // ── Event Handlers ────────────────────────────────────────

  const handleTabChange = (tab: TabIdV4) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setSearchPhase('idle');
    setResults([]);
    setPackageStep(0);
  };

  const addDestination = (dest: Destination) => {
    if (selectedDestinations.length >= 3) return;
    setSelectedDestinations(prev => [...prev, dest]);
    setDestInput('');
    setShowSuggestions(false);
  };

  const removeDestination = (id: string | number) => {
    setSelectedDestinations(prev => prev.filter(d => d.id !== id));
  };

  const startHotelSearch = async () => {
    if (!selectedDestinations.length || !checkIn || !checkOut) return;
    setLoading(true);
    setError(null);
    setSearchPhase('results');
    try {
      const res = await performSmartSearch({
        searchType: 'hotel',
        destinations: selectedDestinations.map(d => ({ id: String(d.id), name: d.name, type: d.type, country: d.country })),
        checkIn,
        checkOut,
        roomConfig: rooms,
        mealPlan: mealPlan !== 'all' ? mealPlan : undefined,
        nationality,
        flexibility: flexDays,
      });
      setResults(res);
    } catch (e: any) {
      setError(e?.message || 'Greška u pretrazi');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: SearchSelection) => {
    setSelectedSearch(service);
    setPackageStep(prev => Math.min(prev + 1, 4));
  };

  // ── Field Rendering - NeoTravel Style ──────────────────

  const renderFieldsForTab = () => {
    const currentTab = TABS_V4.find(t => t.id === activeTab);
    if (!currentTab?.fields) return null;

    return currentTab.fields.map((field, idx) => {
      const commonStyle = { height: '64px', border: 'none', background: 'transparent', outline: 'none' } as React.CSSProperties;
      const iconStyle = { position: 'absolute' as const, left: '16px', opacity: 0.6 };

      switch (field) {
        case 'city-hotel':
          return (
            <div key={idx} className="search-input-field">
              <label>Grad ili Hotel</label>
              <MapPin size={18} style={iconStyle} />
              <input type="text" placeholder="Hurghada, Egypt" style={commonStyle} />
            </div>
          );
        case 'from':
          return (
            <div key={idx} className="search-input-field">
              <label>Odakle</label>
              <MapPin size={18} style={iconStyle} />
              <input type="text" defaultValue="Beograd (BEG)" style={commonStyle} />
            </div>
          );
        case 'to':
          return (
            <div key={idx} className="search-input-field">
              <label>Gde</label>
              <MapPin size={18} style={iconStyle} />
              <input type="text" placeholder="Antalya, Turkey" style={commonStyle} />
            </div>
          );
        case 'dates':
          return (
            <div key={idx} className="search-input-field">
              <label>Datumi</label>
              <Calendar size={18} style={iconStyle} />
              <input type="text" readOnly value="18 Mar - 25 Mar" style={commonStyle} />
            </div>
          );
        case 'rooms':
          return (
            <div key={idx} className="search-input-field">
              <label>Sobe & Gosti</label>
              <Users size={18} style={iconStyle} />
              <input type="text" readOnly value="1 Soba, 2 Odrasla" style={commonStyle} />
            </div>
          );
        case 'passengers':
          return (
            <div key={idx} className="search-input-field">
              <label>Putnici</label>
              <Users size={18} style={iconStyle} />
              <input type="text" readOnly value="2 Odrasla" style={commonStyle} />
            </div>
          );
        case 'cruise-line':
          return (
            <div key={idx} className="search-input-field">
              <label>Krstarenja</label>
              <Anchor size={18} style={iconStyle} />
              <input type="text" placeholder="Royal Caribbean..." style={commonStyle} />
            </div>
          );
        case 'time':
          return (
            <div key={idx} className="search-input-field">
              <label>Vreme</label>
              <Clock size={18} style={iconStyle} />
              <input type="text" readOnly value="08:00 - 18:00" style={commonStyle} />
            </div>
          );
        case 'from-to':
          return (
            <div key={idx} className="search-input-field">
              <label>Od-Do</label>
              <MapPin size={18} style={iconStyle} />
              <input type="text" placeholder="Airport - Hotel" style={commonStyle} />
            </div>
          );
        case 'destination':
          return (
            <div key={idx} className="search-input-field">
              <label>Destinacija</label>
              <Compass size={18} style={iconStyle} />
              <input type="text" placeholder="Hurghada" style={commonStyle} />
            </div>
          );
        case 'pickup':
          return (
            <div key={idx} className="search-input-field">
              <label>Preuzimanje</label>
              <Car size={18} style={iconStyle} />
              <input type="text" placeholder="Airport" style={commonStyle} />
            </div>
          );
        default:
          return (
            <div key={idx} className="search-input-field">
              <label>{field}</label>
              <MapPin size={18} style={iconStyle} />
              <input type="text" placeholder="..." style={commonStyle} />
            </div>
          );
      }
    });
  };

  const filteredResults = results.filter(r => {
    if (budgetFrom && r.price < Number(budgetFrom)) return false;
    if (budgetTo && r.price > Number(budgetTo)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    return 0;
  });

  const totalAdults = rooms.reduce((s, r) => s + r.adults, 0);
  const totalChildren = rooms.reduce((s, r) => s + r.children, 0);

  const updateRoom = (idx: number, key: 'adults' | 'children', val: number) => {
    if (val < 0 || (key === 'adults' && val === 0)) return;
    setRooms(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      if (key === 'children') {
        const ages = [...r.childrenAges];
        if (val > r.children) ages.push(7);
        else ages.pop();
        return { ...r, children: val, childrenAges: ages };
      }
      return { ...r, [key]: val };
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER METHODS
  // ─────────────────────────────────────────────────────────────

  const renderTabBar = () => (
    <div className="search-type-tab">
      {TABS_V4.map(tab => (
        <div
          key={tab.id}
          className={`type-tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => handleTabChange(tab.id)}
        >
          <div style={{ marginBottom: '4px' }}>
            <tab.icon size={22} />
          </div>
          <span>{tab.label}</span>
        </div>
      ))}
    </div>
  );

  const renderHotelSearch = () => (
    <motion.div
      key="hotel-search"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="ssv4-search-panel"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(3, 1fr) 180px`,
          gap: '12px',
          alignItems: 'center'
        }}
      >
        {renderFieldsForTab()}
        <button className="btn-primary">
          PRETRAŽI
        </button>
      </div>
    </motion.div>
  );

  const renderNeoTravelSearch = () => (
    <motion.div
      key="neotravel-search"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="ssv4-search-panel"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${TABS_V4.find(t => t.id === activeTab)?.fields?.length || 3}, 1fr) 180px`,
          gap: '12px',
          alignItems: 'center'
        }}
      >
        {renderFieldsForTab()}
        <button className="btn-primary">
          PRETRAŽI
        </button>
      </div>
    </motion.div>
  );

  const renderFlightSearch = () => (
    <motion.div
      key="flight-search"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="ssv4-search-panel"
    >
      <div className="ssv4-trip-pills">
        {[
          { id: 'round', label: '⇄ Povratna karta' },
          { id: 'oneway', label: '→ U jednom pravcu' },
          { id: 'multi', label: '🌐 Više destinacija' },
        ].map(t => (
          <button
            key={t.id}
            className={`ssv4-trip-pill ${tripType === t.id ? 'active' : ''}`}
            onClick={() => setTripType(t.id as TripType)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="ssv4-search-grid-flights">
        <div className="ssv4-field">
          <label className="ssv4-field-label">Odakle?</label>
          <div className="ssv4-field-inner">
            <Plane size={20} className="ssv4-field-icon" />
            <input
              type="text"
              className="ssv4-input-inline"
              value={originInput}
              onChange={e => setOriginInput(e.target.value)}
              placeholder="BEG"
            />
          </div>
        </div>

        <button className="ssv4-swap-btn">
          <ArrowLeftRight size={16} />
        </button>

        <div className="ssv4-field">
          <label className="ssv4-field-label">Gde?</label>
          <div className="ssv4-field-inner">
            <MapPin size={20} className="ssv4-field-icon" />
            <input
              type="text"
              className="ssv4-input-inline"
              value={destFlightInput}
              onChange={e => setDestFlightInput(e.target.value)}
              placeholder="HRG"
            />
          </div>
        </div>

        <div className="ssv4-field">
          <label className="ssv4-field-label">Odlazak</label>
          <div className="ssv4-field-inner">
            <Calendar size={20} className="ssv4-field-icon" />
            <input type="date" className="ssv4-input-inline" value={depDate} onChange={e => setDepDate(e.target.value)} />
          </div>
        </div>

        {tripType === 'round' && (
          <div className="ssv4-field">
            <label className="ssv4-field-label">Povratak</label>
            <div className="ssv4-field-inner">
              <Calendar size={20} className="ssv4-field-icon" />
              <input type="date" className="ssv4-input-inline" value={retDate} onChange={e => setRetDate(e.target.value)} />
            </div>
          </div>
        )}

        <motion.button className="ssv4-search-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Search size={20} /> LETOVI
        </motion.button>
      </div>
    </motion.div>
  );

  const renderSearchResults = () => (
    <motion.div className="ssv4-results-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mini-stepper">
        {['Izbor 1', 'Izbor 2', 'Izbor 3', 'Završeno'].map((label, idx) => (
          <div key={label} className={`mini-step ${packageStep >= idx ? 'active' : ''}`} />
        ))}
      </div>

      <AnimatePresence mode="popLayout">
        {packageStep < 4 ? (
          <div className="ssv4-results-list">
            {filteredResults.length > 0 ? (
              filteredResults.map(res => (
                <motion.div
                  key={res.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ssv4-glass-card"
                  onClick={() => handleServiceSelect({ id: res.id, type: 'Accommodation', name: res.name, price: res.price, icon: <Building2 /> })}
                >
                  <div className="ssv4-card-content">
                    <div className="ssv4-card-icon">
                      {res.type === 'hotel' ? <Building2 size={28} /> : <Plane size={28} />}
                    </div>
                    <div className="ssv4-card-info">
                      <h4 style={{ margin: 0 }}>{res.name}</h4>
                      <div className="ai-summary">{res.mealPlan || 'Odličan izbor'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                      <div className="ssv4-card-price">€{res.price}</div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="ssv4-no-results">Nema dostupnih rezultata</div>
            )}
          </div>
        ) : (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', padding: '60px 0' }}>
            <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '900' }}>Rezervacija je spremna!</h2>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // ─────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="ssv4-wrapper">
      <div className="ssv4-container">
        {/* Header */}
        <motion.div className="ssv4-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1>SmartSearch V4</h1>
          <p>Elegantna pretraga sa AI asistentom</p>
        </motion.div>

        {/* Tab Bar */}
        {renderTabBar()}

        {/* Search Section */}
        {searchPhase === 'idle' && (
          <div className="ssv4-search-section">
            {activeTab === 'hotel' && renderHotelSearch()}
            {activeTab === 'flight' && renderFlightSearch()}
            {activeTab !== 'hotel' && activeTab !== 'flight' && renderNeoTravelSearch()}
          </div>
        )}

        {/* Results Section */}
        {searchPhase === 'results' && renderSearchResults()}

        {/* Error Display */}
        {error && (
          <motion.div className="ssv4-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AlertCircle size={20} />
            {error}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SmartSearchV4;
