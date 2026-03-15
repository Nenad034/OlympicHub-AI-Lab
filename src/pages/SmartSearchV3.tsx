import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useThemeStore, useAuthStore } from '../stores';
import {
  Hotel, Plane, Package, PlaneTakeoff, Compass, Bus, Ticket, Tent,
  Search, Clock, Database, MapPin, Calendar, Users, UtensilsCrossed,
  DollarSign, Flag, Star, Map, LayoutGrid, List as ListIcon,
  X, Check, ChevronRight, Sliders, ArrowLeftRight, ChevronDown,
  ChevronUp, Info, Luggage, Loader2, AlertCircle, Eye, Sparkles,
  Globe, Plane as PlaneIcon, Map as MapIcon, Compass as CompassIcon, ShieldCheck
} from 'lucide-react';
import { performSmartSearch, type SmartSearchResult } from '../services/smartSearchService';
import flightSearchManager from '../services/flight/flightSearchManager';
import type { UnifiedFlightOffer, FlightSearchParams } from '../types/flight.types';
import { searchPrefetchService } from '../services/searchPrefetchService';
import solvexDictionaryService from '../integrations/solvex/api/solvexDictionaryService';
import { ModernCalendar } from '../components/ModernCalendar';
import { BookingModal } from '../components/booking/BookingModal';
import PackageSearch, { WIZARD_STEPS } from './PackageSearch';
import { FlightPriceTracker } from '../components/flights/FlightPriceTracker';
import type { Destination, RoomAllocation } from './SmartSearch/types';
import { MOCK_DESTINATIONS, MEAL_PLAN_OPTIONS, NATIONALITY_OPTIONS } from './SmartSearch/types';
import { calcNightsFromDates } from './SmartSearch/helpers';
import './SmartSearchV3.css';


// ─── Types ────────────────────────────────────────────────────
type SearchModeV3 = 'classic' | 'semantic';
type TabIdV3 = 'hotel' | 'flight' | 'package' | 'charter' | 'tour' | 'transfer' | 'excursion' | 'event';
type TripType = 'round' | 'oneway' | 'multi';
type ViewMode = 'list' | 'grid' | 'map';
type SortBy = 'smart' | 'price_asc' | 'price_desc' | 'rating' | 'commission';

const TABS: { id: TabIdV3; label: string; icon: React.ElementType }[] = [
  { id: 'hotel', label: 'Smeštaj', icon: Hotel },
  { id: 'flight', label: 'Letovi', icon: Plane },
  { id: 'package', label: 'Paketi', icon: Package },
  { id: 'charter', label: 'Čarteri', icon: PlaneTakeoff },
  { id: 'tour', label: 'Putovanja', icon: Compass },
  { id: 'transfer', label: 'Transferi', icon: Bus },
  { id: 'excursion', label: 'Izleti', icon: Ticket },
  { id: 'event', label: 'Događanja', icon: Tent },
];

const MOCK_ROOMS = [
  { id: 'r1', name: 'Standard Double Room, Sea View', mealPlan: 'All Inclusive', mealCode: 'AI', cancelType: 'free', cancelLabel: 'Besplatno do 10. Jun', price: 890, total: 1780 },
  { id: 'r2', name: 'Superior Double Room', mealPlan: 'All Inclusive', mealCode: 'AI', cancelType: 'penalty', cancelLabel: 'Penali pri otkazivanju', price: 950, total: 1900 },
  { id: 'r3', name: 'Deluxe Suite', mealPlan: 'All Inclusive Premium', mealCode: 'AI', cancelType: 'free', cancelLabel: 'Besplatno do 14. Jun', price: 1200, total: 2400 },
  { id: 'r4', name: 'Junior Suite, Garden View', mealPlan: 'Half Board', mealCode: 'HB', cancelType: 'nonrefund', cancelLabel: 'Bez povrata', price: 780, total: 1560 },
];


// ─── Main Component ────────────────────────────────────────────
export const SmartSearchV3: React.FC = () => {
  const { theme } = useThemeStore();
  const { userLevel } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isB2B = userLevel >= 5;

  // ── Tab & Mode ────────────────────────────────────────────
  const [searchMode, setSearchMode] = useState<SearchModeV3>('classic');
  const [activeTab, setActiveTab] = useState<TabIdV3>((searchParams.get('tab') as TabIdV3) || 'hotel');

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
  const [originPackage, setOriginPackage] = useState('BEG');
  const [hotelOnlyPart, setHotelOnlyPart] = useState(false);
  const [addCar, setAddCar] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState('');
  const [hotelCheckOut, setHotelCheckOut] = useState('');
  const [depDate, setDepDate] = useState('');
  const [retDate, setRetDate] = useState('');
  const [paxAdults, setPaxAdults] = useState(2);
  const [paxChildren, setPaxChildren] = useState(0);
  const [flightClass, setFlightClass] = useState('Economy');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [flexDays, setFlexDays] = useState(0);
  const [maxStops, setMaxStops] = useState<number | null>(null);
  const [showTracker, setShowTracker] = useState(true);

  const [withBaggage, setWithBaggage] = useState(false);
  const [expandedFlight, setExpandedFlight] = useState<string | null>(null);
  // ── Results & UI State ────────────────────────────────────
  const [results, setResults] = useState<SmartSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPhase, setSearchPhase] = useState<'idle' | 'results'>('idle');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('smart');
  const [activeMealFilters, setActiveMealFilters] = useState<string[]>([]);
  const [activeStarFilters, setActiveStarFilters] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalPackagePrice, setTotalPackagePrice] = useState(0);
  const [cancelFilter, setCancelFilter] = useState<string | null>(null);
  const [hotelNameFilter, setHotelNameFilter] = useState('');
  const [distanceFilter, setDistanceFilter] = useState(2000);
  const [wellnessFilter, setWellnessFilter] = useState(false);

  // ── Modal State ────────────────────────────────────────────
  const [flightResults, setFlightResults] = useState<UnifiedFlightOffer[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<SmartSearchResult | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const handleFlightSearch = async () => {
    console.log('🚀 Initiating flight search V3...');
    setLoading(true);
    setSearchPhase('results');
    setError(null);
    setFlightResults([]);

    const params: FlightSearchParams = {
      origin: originInput || 'BEG',
      destination: destFlightInput || 'TIV',
      departureDate: depDate || new Date().toISOString().split('T')[0],
      returnDate: tripType === 'round' ? retDate : undefined,
      adults: paxAdults,
      children: paxChildren,
      childrenAges: [],
      cabinClass: (flightClass.split(' ')[0].toLowerCase() as any) || 'economy',
      currency: 'EUR'
    };

    try {
      const resp = await flightSearchManager.searchFlights(params);
      console.log('✅ Search results received:', resp.offers?.length || 0);
      
      if (resp.success && resp.offers && resp.offers.length > 0) {
        setFlightResults(resp.offers);
      } else {
        setError('Nismo pronašli letove za tražene parametre. Probajte BEG → TIV.');
      }
    } catch (err: any) {
      console.error('❌ Flight search error:', err);
      setError(err.message || 'Greška pri pretrazi letova.');
    } finally {
      setLoading(false);
    }
  };

  // Sync tab with URL
  useEffect(() => {
    const t = searchParams.get('tab') as TabIdV3;
    if (t && t !== activeTab) setActiveTab(t);
  }, [searchParams]);

  // Destination suggestions
  useEffect(() => {
    if (destInput.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    const filtered = MOCK_DESTINATIONS.filter(d =>
      d.name.toLowerCase().includes(destInput.toLowerCase()) &&
      !selectedDestinations.find(s => s.id === d.id)
    ).slice(0, 8);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [destInput, selectedDestinations]);

  // Sync nights with dates
  useEffect(() => {
    if (checkIn && checkOut) setNights(calcNightsFromDates(checkIn, checkOut));
  }, [checkIn, checkOut]);

  const handleTabChange = (tab: TabIdV3) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setSearchPhase('idle');
    setResults([]);
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

  const startSearch = async () => {
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

  // Filtered & sorted results
  const filteredResults = results.filter(r => {
    if (activeMealFilters.length && !activeMealFilters.some(m => r.mealPlan?.toUpperCase().startsWith(m))) return false;
    if (activeStarFilters.length && !activeStarFilters.includes(r.stars || 0)) return false;
    if (hotelNameFilter && !r.name.toLowerCase().includes(hotelNameFilter.toLowerCase())) return false;
    if (budgetFrom && r.price < Number(budgetFrom)) return false;
    if (budgetTo && r.price > Number(budgetTo)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'rating') return (b.stars || 0) - (a.stars || 0);
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

  const updateAge = (rIdx: number, aIdx: number, val: number) => {
    setRooms(prev => prev.map((r, i) => {
      if (i !== rIdx) return r;
      const ages = [...r.childrenAges];
      ages[aIdx] = val;
      return { ...r, childrenAges: ages };
    }));
  };

  // ── Render Search Strip ────────────────────────────────────
  const renderHotelStrip = () => (
    <div className="ssv3-strip">
      {/* Destination */}
      <div className="ssv3-field dest-field">
        <div style={{ position: 'relative', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <MapPin size={22} className="ssv3-field-icon" style={{ color: 'var(--ssv3-purple)' }}/>
            <div className="ssv3-dest-chips">
              {selectedDestinations.map(d => (
                <div key={d.id} className="ssv3-chip">
                  {d.name} <button className="ssv3-chip-x" onClick={() => removeDestination(d.id)}><X size={10}/></button>
                </div>
              ))}
              {selectedDestinations.length === 0 && <span className="ssv3-field-placeholder">Gde putujete?</span>}
            </div>
          </div>
          <input
            type="text"
            className="ssv3-dest-input"
            value={destInput}
            onChange={e => setDestInput(e.target.value)}
            onFocus={() => destInput.length >= 2 && setShowSuggestions(true)}
            placeholder="Unesite destinaciju ili hotel..."
            style={{ width: '100%', fontSize: '13px' }}
          />
        </div>
        {showSuggestions && (
          <div className="ssv3-autocomplete">
            {suggestions.map(s => (
              <div key={s.id} className="ssv3-autocomplete-item" onMouseDown={() => addDestination(s)}>
                <MapPin size={14} className="ssv3-autocomplete-icon"/>
                <div>
                  <div className="ssv3-autocomplete-item-name">{s.name}</div>
                  <div className="ssv3-autocomplete-item-sub">{s.country} · {s.type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="ssv3-field date-field" onClick={() => setShowCalendar(!showCalendar)}>
        <Calendar size={22} className="ssv3-field-icon" style={{ color: 'var(--ssv3-green)' }}/>
        <div className="ssv3-field-content">
          <span className="ssv3-field-value">
            {checkIn ? new Date(checkIn).toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' }) : 'Od'} — {checkOut ? new Date(checkOut).toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' }) : 'Do'}
          </span>
          <span className="ssv3-field-sub">{nights || 7} Noći</span>
        </div>
      </div>

      {/* Pax */}
      <div className="ssv3-field pax-field" onClick={() => setShowPax(!showPax)} style={{ position: 'relative' }}>
        <Users size={22} className="ssv3-field-icon" style={{ color: 'var(--ssv3-sky)' }}/>
        <div className="ssv3-field-content">
          <span className="ssv3-field-value">
            {totalAdults} Adl{totalChildren > 0 ? `, ${totalChildren} Chd` : ''}
          </span>
          <span className="ssv3-field-sub">{rooms.length} Soba</span>
        </div>
        {showPax && (
          <div className="ssv3-popover pax-popover" onClick={e => e.stopPropagation()}>
            <div className="ssv3-pax-header">Raspored po sobama</div>
            <div className="ssv3-pax-rooms">
              {rooms.map((room, rIdx) => (
                <div key={rIdx} className="ssv3-pax-room">
                  <div className="ssv3-room-head">
                    <span>Soba {rIdx + 1}</span>
                    {rooms.length > 1 && (
                      <button className="ssv3-room-del" onClick={() => setRooms(prev => prev.filter((_, i) => i !== rIdx))}>
                        Ukloni
                      </button>
                    )}
                  </div>
                  <div className="ssv3-pax-row">
                    <div className="ssv3-pax-label">Odrasli</div>
                    <div className="ssv3-pax-ctrl">
                      <button onClick={() => updateRoom(rIdx, 'adults', room.adults - 1)}>-</button>
                      <span>{room.adults}</span>
                      <button onClick={() => updateRoom(rIdx, 'adults', room.adults + 1)}>+</button>
                    </div>
                  </div>
                  <div className="ssv3-pax-row">
                    <div className="ssv3-pax-label">Deca</div>
                    <div className="ssv3-pax-ctrl">
                      <button onClick={() => updateRoom(rIdx, 'children', room.children - 1)}>-</button>
                      <span>{room.children}</span>
                      <button onClick={() => updateRoom(rIdx, 'children', room.children + 1)}>+</button>
                    </div>
                  </div>
                  {room.children > 0 && (
                    <div className="ssv3-ages">
                      {room.childrenAges.map((age, aIdx) => (
                        <select key={aIdx} value={age} onChange={(e) => updateAge(rIdx, aIdx, +e.target.value)}>
                          {Array.from({length: 18}).map((_, i) => <option key={i} value={i}>{i} god.</option>)}
                        </select>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {rooms.length < 5 && (
              <button className="ssv3-add-room-btn" onClick={() => setRooms([...rooms, { adults: 2, children: 0, childrenAges: [] }])}>
                + Dodaj još jednu sobu
              </button>
            )}
            <button className="ssv3-pax-apply" onClick={() => setShowPax(false)}>Primeni</button>
          </div>
        )}
      </div>

      {/* Meal Plan */}
      <div className="ssv3-field meal-field" onClick={() => setShowMealPlan(!showMealPlan)} style={{ position: 'relative' }}>
        <UtensilsCrossed size={22} className="ssv3-field-icon" style={{ color: 'var(--ssv3-amber)' }}/>
        <div className="ssv3-field-content">
          <span className="ssv3-field-value">
            {MEAL_PLAN_OPTIONS.find(m => m.value === mealPlan)?.label || 'Sve Usluge'}
          </span>
          <span className="ssv3-field-sub">Ishrana <ChevronDown size={12}/></span>
        </div>
        {showMealPlan && (
          <div className="ssv3-popover meal-popover">
            {MEAL_PLAN_OPTIONS.map(m => (
              <div key={m.value} className={`ssv3-pop-item ${mealPlan === m.value ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setMealPlan(m.value); setShowMealPlan(false); }}>
                {m.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nationality */}
      <div className="ssv3-field nat-field" onClick={() => setShowNationality(!showNationality)} style={{ position: 'relative' }}>
        <Flag size={20} className="ssv3-field-icon" style={{ color: 'var(--ssv3-purple-glow)' }}/>
        <div className="ssv3-field-content">
          <span className="ssv3-field-value">
            {NATIONALITY_OPTIONS.find(n => n.code === nationality)?.name || 'Srbija'}
          </span>
          <span className="ssv3-field-sub">Državljanstvo <ChevronDown size={12}/></span>
        </div>
        {showNationality && (
          <div className="ssv3-popover nat-popover">
            <div className="ssv3-pop-grid">
              {NATIONALITY_OPTIONS.map(n => (
                <div key={n.code} className={`ssv3-pop-item ${nationality === n.code ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setNationality(n.code); setShowNationality(false); }}>
                  {n.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button className="ssv3-search-btn" onClick={startSearch} disabled={loading || !selectedDestinations.length || !checkIn}>
        {loading ? <Loader2 size={20} className="ssv3-spin"/> : <Search size={20}/>}
        TRAŽI PONUDE
      </button>
    </div>
  );

  const renderFlightStrip = () => (
    <div className="ssv3-strip-flights">
      {/* Trip type pills */}
      <div className="ssv3-trip-pills">
        {([
          { id: 'round', label: '⇄ Povratna karta' },
          { id: 'oneway', label: '→ U jednom pravcu' },
          { id: 'multi', label: '🌐 Više destinacija' },
        ] as { id: TripType; label: string }[]).map(t => (
          <button key={t.id} className={`ssv3-trip-pill ${tripType === t.id ? 'active' : ''}`} onClick={() => setTripType(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {/* Main row */}
      <div className="ssv3-strip-row">
        {/* Origin */}
        <div className="ssv3-airport-field">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <PlaneTakeoff size={20} style={{ color: 'var(--ssv3-purple)' }}/>
             <span className="ssv3-airport-code">{originInput || 'BEG'}</span>
          </div>
          <input className="ssv3-airport-input" value={originInput} onChange={e => setOriginInput(e.target.value)} placeholder="Polazno mesto..."/>
        </div>
        
        {/* Swap */}
        <button className="ssv3-swap-btn" onClick={() => { const t = originInput; setOriginInput(destFlightInput); setDestFlightInput(t); }}>
          <ArrowLeftRight size={16}/>
        </button>
        
        {/* Destination */}
        <div className="ssv3-airport-field">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <MapPin size={20} style={{ color: 'var(--ssv3-purple)' }}/>
             <span className="ssv3-airport-code">{destFlightInput || 'TIV'}</span>
          </div>
          <input className="ssv3-airport-input" value={destFlightInput} onChange={e => setDestFlightInput(e.target.value)} placeholder="Odredište..."/>
        </div>

        {/* Dates */}
        <div className="ssv3-field date-field" onClick={() => setShowCalendar(!showCalendar)}>
          <Calendar size={22} className="ssv3-field-icon" style={{ color: 'var(--ssv3-green)' }}/>
          <div className="ssv3-field-content">
            <span className="ssv3-field-value">{depDate ? new Date(depDate).toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' }) : 'Odaberi'}</span>
            <span className="ssv3-field-sub">Polazak</span>
          </div>
        </div>
        {tripType === 'round' && (
          <div className="ssv3-field date-field" onClick={() => setShowCalendar(true)}>
            <Calendar size={22} className="ssv3-field-icon" style={{ color: 'var(--ssv3-green)' }}/>
            <div className="ssv3-field-content">
              <span className="ssv3-field-value">{retDate ? new Date(retDate).toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' }) : 'Povratak'}</span>
              <span className="ssv3-field-sub">Povratak</span>
            </div>
          </div>
        )}

        {/* Pax + class */}
        <div className="ssv3-field pax-field" onClick={() => setShowPax(!showPax)}>
          <Users size={22} className="ssv3-field-icon" style={{ color: 'var(--ssv3-sky)' }}/>
          <div className="ssv3-field-content">
            <span className="ssv3-field-value">{paxAdults} Adl, {paxChildren} Chd</span>
            <span className="ssv3-field-sub">{flightClass}</span>
          </div>
        </div>

        <button className="ssv3-search-btn" onClick={handleFlightSearch} disabled={loading}>
          {loading ? <Loader2 size={20} className="spin"/> : <Search size={20}/>} 
          TRAŽI LETOVE
        </button>
      </div>
    </div>
  );

  // ── Mock flight results ─────────────────────────────────────
  const MOCK_FLIGHTS = [
    {
      id: 'f1', airline: 'Air Serbia', code: 'JU 311', logo: '✈️',
      depTime: '09:30', depApt: 'BEG', arrTime: '10:45', arrApt: 'TIV', duration: '1h 15m', stops: 0,
      retDep: '22:00', retArr: '23:10', baggage: '23kg', price: 218, total: 436,
      details: { aircraft: 'ATR 72-600', terminal: 'T1', onTimeRate: '91%', co2: '48kg', baggageInfo: '1x23kg uključen', handBaggage: '8kg' }
    },
    {
      id: 'f2', airline: 'Turkish Airlines', code: 'TK 1234', logo: '✈️',
      depTime: '07:00', depApt: 'BEG', arrTime: '14:30', arrApt: 'TIV', duration: '2h 45m (+1 presed.)', stops: 1, stopApt: 'IST',
      retDep: '16:00', retArr: '22:45', baggage: '23kg', price: 156, total: 312,
      details: { aircraft: 'Boeing 737', terminal: 'T2', onTimeRate: '82%', co2: '92kg', baggageInfo: '1x23kg uključen', handBaggage: '8kg' }
    },
    {
      id: 'f3', airline: 'Wizz Air', code: 'W6 5678', logo: '✈️',
      depTime: '18:30', depApt: 'BEG', arrTime: '19:45', arrApt: 'TIV', duration: '1h 15m', stops: 0,
      retDep: '20:30', retArr: '21:45', baggage: 'Nije uklj.', price: 89, total: 178, bestPrice: true,
      details: { aircraft: 'Airbus A320', terminal: 'T1', onTimeRate: '78%', co2: '42kg', baggageInfo: 'Ručni prtljag 10kg. Kofer se plaća dodatno.', handBaggage: '10kg' }
    },
  ];

  // ── Render Results ──────────────────────────────────────────
  const renderHotelResults = () => {
    const displayResults = results.length > 0 ? filteredResults : [];

    return (
      <div className="ssv3-content">
        {/* Sidebar */}
        <div className="ssv3-sidebar">
          {searchPhase === 'results' && (
            <div className="ssv3-sidebar-section">
              <div className="ssv3-recap-line">
                <MapPin size={12} className="ssv3-field-icon"/>
                {selectedDestinations.map(d => d.name).join(', ') || '–'}
              </div>
              <div className="ssv3-recap-sub">{checkIn} – {checkOut} ({nights}N) · {totalAdults} odrasl.</div>
              <div className="ssv3-recap-actions">
                <button className="ssv3-recap-link" onClick={() => setSearchPhase('idle')}>✏️ Izmeni</button>
                <button className="ssv3-recap-link" onClick={() => { setResults([]); setSearchPhase('idle'); }}>+ Nova</button>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="ssv3-sidebar-section">
              <div className="ssv3-sidebar-title">FILTERI</div>
              <div className="ssv3-filter-group">
                <div className="ssv3-filter-label">Vrsta usluge</div>
                <div className="ssv3-filter-pills">
                  {['AI', 'HB', 'FB', 'BB', 'RO'].map(p => (
                    <button key={p} className={`ssv3-fpill ${activeMealFilters.includes(p) ? 'active' : ''}`}
                      onClick={() => setActiveMealFilters(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ssv3-filter-group" style={{ marginTop: 12 }}>
                <div className="ssv3-filter-label">Zvezdice</div>
                <div className="ssv3-filter-pills">
                  {[5, 4, 3, 2].map(s => (
                    <button key={s} className={`ssv3-fpill ${activeStarFilters.includes(s) ? 'active-outline' : ''}`}
                      onClick={() => setActiveStarFilters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}>
                      {'★'.repeat(s)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ssv3-filter-group" style={{ marginTop: 12 }}>
                <div className="ssv3-filter-label">Otkazivanje</div>
                <div className="ssv3-filter-pills">
                  {[
                    { val: 'free', label: '✅ Besplatno' },
                    { val: 'penalty', label: '⚠️ Penali' },
                    { val: 'nonrefund', label: '❌ 100%' },
                  ].map(o => (
                    <button key={o.val} className={`ssv3-fpill ${cancelFilter === o.val ? 'active' : ''}`}
                      onClick={() => setCancelFilter(cancelFilter === o.val ? null : o.val)}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ssv3-filter-group" style={{ marginTop: 16 }}>
                <div className="ssv3-dynamic-label"><Sparkles size={12}/> Na osnovu rezultata:</div>
                <div className="ssv3-slider-group" style={{ marginTop: 8 }}>
                  <div className="ssv3-slider-label">
                    <span>Udaljenost od mora</span>
                    <span className="ssv3-slider-val">Max: {distanceFilter}m</span>
                  </div>
                  <input type="range" className="ssv3-slider" min={0} max={2000} value={distanceFilter} onChange={e => setDistanceFilter(+e.target.value)}/>
                </div>
                <div className="ssv3-toggle-row">
                  <span className="ssv3-toggle-lbl">Wellness & Spa</span>
                  <label className="ssv3-toggle">
                    <input type="checkbox" checked={wellnessFilter} onChange={e => setWellnessFilter(e.target.checked)}/>
                    <span className="ssv3-toggle-slider"/>
                  </label>
                </div>
              </div>
              <div className="ssv3-filter-group" style={{ marginTop: 16 }}>
                <input type="text" className="ssv3-filter-input" placeholder="Naziv hotela..."
                  value={hotelNameFilter} onChange={e => setHotelNameFilter(e.target.value)}/>
              </div>
              {(activeMealFilters.length || activeStarFilters.length || cancelFilter || hotelNameFilter) ? (
                <button className="ssv3-reset-link" style={{ marginTop: 12 }} onClick={() => {
                  setActiveMealFilters([]); setActiveStarFilters([]); setCancelFilter(null); setHotelNameFilter('');
                }}>
                  <X size={12}/> Resetuj filtere
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="ssv3-results">
          {searchPhase === 'results' && (
            <div className="ssv3-results-header">
              <div className="ssv3-count">
                {loading ? 'Pretraga u toku...' : `${displayResults.length} hotela`}
                {!loading && results.length !== displayResults.length && (
                  <span className="ssv3-count-filtered">· prikazano {displayResults.length} od {results.length}</span>
                )}
              </div>
              <div className="ssv3-sort-row">
                <span style={{ fontSize: 10, color: 'var(--ssv3-text-sec)', marginRight: 4 }}>Sortiraj:</span>
                {([
                  { id: 'smart', label: 'BEST VALUE ★' },
                  { id: 'price_asc', label: 'CENA ↑' },
                  { id: 'price_desc', label: 'CENA ↓' },
                  { id: 'rating', label: 'OCENA ↓' },
                  ...(isB2B ? [{ id: 'commission', label: 'PROVIZIJA ↓' }] : [])
                ] as { id: SortBy; label: string }[]).map(s => (
                  <button key={s.id} className={`ssv3-sort-pill ${sortBy === s.id ? 'active' : ''}`} onClick={() => setSortBy(s.id)}>
                    {s.label}
                  </button>
                ))}
                <div className="ssv3-view-btns">
                  <button className={`ssv3-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><ListIcon size={14}/></button>
                  <button className={`ssv3-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={14}/></button>
                  <button className={`ssv3-view-btn ${viewMode === 'map' ? 'active' : ''}`} onClick={() => setViewMode('map')}><Map size={14}/></button>
                </div>
              </div>
            </div>
          )}

          <div className="ssv3-results-scroll ssv3-grid">
            {loading && (
              <div className="ssv3-loading">
                <div className="ssv3-spinner"/>
                <div className="ssv3-loading-text">Pretraga hotela u toku...</div>
              </div>
            )}
            {!loading && error && (
              <div className="ssv3-empty">
                <AlertCircle size={48} className="ssv3-empty-icon" color="var(--ssv3-red)"/>
                <div className="ssv3-empty-title">Greška u pretrazi</div>
                <div className="ssv3-empty-sub">{error}</div>
              </div>
            )}
            {!loading && !error && searchPhase === 'idle' && renderHeroEmpty()}
            {!loading && !error && searchPhase === 'results' && displayResults.length === 0 && (
              <div className="ssv3-empty">
                <Hotel size={48} className="ssv3-empty-icon"/>
                <div className="ssv3-empty-title">Nema pronađenih hotela</div>
                <div className="ssv3-empty-sub">Pokušajte drugačiju destinaciju ili promenite filtere.</div>
              </div>
            )}
            {!loading && displayResults.map(hotel => renderHotelCard(hotel))}
          </div>
        </div>
      </div>
    );
  };

  const renderHotelCard = (hotel: SmartSearchResult) => {
    const img = hotel.images?.[0];
    const commission = hotel.price * 0.15;
    return (
      <div className="ssv3-hotel-card" key={hotel.id}>
        {img
          ? <img src={img} className="ssv3-hotel-img" alt={hotel.name} onError={e => (e.currentTarget.style.display = 'none')}/>
          : <div className="ssv3-hotel-img-placeholder"><Hotel size={32}/></div>
        }
        <div className="ssv3-hotel-body">
          <div className="ssv3-hotel-top">
            <div>
              <div className="ssv3-hotel-name">{hotel.name}</div>
              <div className="ssv3-hotel-loc"><MapPin size={10}/> {hotel.location}</div>
            </div>
            <div className="ssv3-stars">
              {Array.from({ length: hotel.stars || 0 }).map((_, i) => (
                <Star key={i} size={11} fill="var(--ssv3-gold)" color="var(--ssv3-gold)"/>
              ))}
            </div>
          </div>
          <div className="ssv3-tags" style={{ marginTop: 6 }}>
            {hotel.mealPlan && <span className="ssv3-tag meal-plan">{hotel.mealPlan}</span>}
            <span className="ssv3-tag free-cancel">✅ Proverite dostupnost</span>
            <span className="ssv3-tag provider">{hotel.provider}</span>
          </div>
          <div style={{ flex: 1 }}/>
          <div className="ssv3-hotel-price-row">
            <div className="ssv3-price-block">
              <div className="ssv3-price-main">od {hotel.price.toFixed(0)} {hotel.currency || 'EUR'} <span style={{ fontSize: 11, fontWeight: 600 }}>/ os.</span></div>
              <div className="ssv3-price-total">Ukupno: {(hotel.price * totalAdults).toFixed(0)} {hotel.currency || 'EUR'}</div>
              {isB2B && (
                <div className="ssv3-commission" style={{ marginTop: 3 }}>
                  💰 Vaša provizija: {commission.toFixed(0)} EUR (15%)
                </div>
              )}
            </div>
            <div className="ssv3-hotel-actions">
              <button className="ssv3-btn-primary" onClick={() => setSelectedHotel(hotel)}>
                Izaberi sobu <ChevronRight size={14}/>
              </button>
              <button className="ssv3-btn-ghost" title="Lokacija"><Map size={14}/></button>
            </div>
          </div>
        </div>
      </div>
    );
  };


  const renderHeroEmpty = () => (
    <div className="ssv3-hero-empty" style={{ background: theme === 'light' ? 'radial-gradient(circle at 50% 50%, rgba(142, 36, 172, 0.05), #F8FAFC)' : undefined }}>
      <div className="ssv3-hero-container">
        <div className="ssv3-hero-badge">
          <Sparkles size={14}/>
          AI-POWERED SEARCH ENGINE
        </div>
        <h1 className="ssv3-hero-title">Pronađite Vaše Savršeno Putovanje</h1>
        <p className="ssv3-hero-subtitle">
          Najbrži način da pronađete hotele, letove i pakete koristeći našu naprednu semantičku pretragu. Unesite parametre iznad i počnite istraživanje.
        </p>
        
        <div className="ssv3-hero-visuals">
          <div className="ssv3-hero-icon-box" style={{ animationDelay: '0.1s' }}>
            <div className="ssv3-hero-icon-outer"><PlaneIcon size={32} /></div>
            <span>Letovi</span>
          </div>
          <div className="ssv3-hero-icon-box" style={{ animationDelay: '0.3s' }}>
            <div className="ssv3-hero-icon-outer"><Hotel size={32} /></div>
            <span>Hoteli</span>
          </div>
          <div className="ssv3-hero-icon-box" style={{ animationDelay: '0.5s' }}>
            <div className="ssv3-hero-icon-outer"><CompassIcon size={32} /></div>
            <span>Putovanja</span>
          </div>
          <div className="ssv3-hero-icon-box" style={{ animationDelay: '0.7s' }}>
            <div className="ssv3-hero-icon-outer"><ShieldCheck size={32} /></div>
            <span>Sigurnost</span>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className={`ssv3-root ${theme === 'light' ? 'light-mode' : ''}`}>
      {/* 1. CONTROLS BAR */}
      <div className="ssv3-controls-bar">
        <div className="ssv3-mode-pills">
          <button className={`ssv3-mode-pill ${searchMode === 'classic' ? 'active' : ''}`} onClick={() => setSearchMode('classic')}>
            <Search size={14}/> Klasična
          </button>
          <button className={`ssv3-mode-pill ${searchMode === 'semantic' ? 'active' : ''}`} onClick={() => setSearchMode('semantic')}>
            <Sparkles size={14}/> AI Semantic
          </button>
        </div>
        <div className="ssv3-controls-right">
          <button className="ssv3-icon-btn" title="Istorija"><Clock size={14}/></button>
          <button className="ssv3-icon-btn" title="API konektori"><Database size={14}/></button>
        </div>
      </div>

      {/* 2. TABS */}
      <div className="ssv3-tabs">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={`ssv3-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => handleTabChange(tab.id)}>
              <Icon size={20}/>
              <span style={{ fontSize: '13px' }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. SEARCH STRIP */}
      <div className="ssv3-strip-wrap">
        {activeTab === 'hotel' && renderHotelStrip()}
        {activeTab === 'flight' && renderFlightStrip()}
        {activeTab === 'package' && (
          <>
            <div className="ssv3-strip">
               {/* Origin */}
                <div className="ssv3-field dest-field" style={{ flex: 1 }}>
                  <PlaneTakeoff size={22} className="ssv3-field-icon"/>
                  <div className="ssv3-field-content">
                     <input className="ssv3-dest-input" value={originPackage} onChange={e => setOriginPackage(e.target.value)} placeholder="Odakle putujete?" style={{ fontSize: '13px', borderBottom: '1px solid var(--ssv3-border)' }} />
                     <span className="ssv3-field-sub">Polazište</span>
                  </div>
                </div>

               <div className="ssv3-divider"/>

               {/* Destination */}
               <div className="ssv3-field dest-field">
                 <MapPin size={22} className="ssv3-field-icon"/>
                 <div className="ssv3-field-content">
                    <input className="ssv3-dest-input" value={destFlightInput} onChange={e => setDestFlightInput(e.target.value)} placeholder="Gde želite da idete?" />
                    <span className="ssv3-field-sub">Odredište</span>
                 </div>
               </div>

               <div className="ssv3-divider"/>

               {/* Dates */}
               <div className="ssv3-field date-field" onClick={() => setShowCalendar(true)}>
                  <Calendar size={22} className="ssv3-field-icon" style={{ color: 'var(--ssv3-green)' }}/>
                  <div className="ssv3-field-content">
                    <span className="ssv3-field-value" style={{ fontSize: '13px' }}>{depDate ? new Date(depDate).toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' }) : 'Odaberi'}</span>
                    <span className="ssv3-field-sub">Termin boravka</span>
                  </div>
               </div>

               <div className="ssv3-divider"/>

               {/* Pax */}
               <div className="ssv3-field pax-field" onClick={() => setShowPax(true)}>
                  <Users size={22} className="ssv3-field-icon" style={{ color: 'var(--ssv3-sky)' }}/>
                  <div className="ssv3-field-content">
                     <span className="ssv3-field-value" style={{ fontSize: '13px' }}>{paxAdults} Adl, {paxChildren} Chd</span>
                     <span className="ssv3-field-sub">{rooms.length} Soba</span>
                  </div>
               </div>

               <button className="ssv3-search-btn" onClick={() => { setSearchPhase('results'); setCurrentStep(2); }}>
                 <Sparkles size={20}/> KREIRAJ PAKET
               </button>
            </div>
            <div className="ssv3-strip-subrow">
              <label className="ssv3-checkbox-label">
                <input type="checkbox" checked={addCar} onChange={e => setAddCar(e.target.checked)} />
                <span>Dodaj prevoz (Rent-a-car)</span>
              </label>
              <label className="ssv3-checkbox-label">
                <input type="checkbox" checked={hotelOnlyPart} onChange={e => setHotelOnlyPart(e.target.checked)} />
                <span>Smeštaj mi je potreban samo za deo boravka</span>
              </label>
              {hotelOnlyPart && (
                <div className="ssv3-nested-dates">
                  <div className="ssv3-nest-field" onClick={() => setShowCalendar(true)}>
                    <span className="nest-lbl">Hotel od:</span>
                    <span className="nest-val">{hotelCheckIn || 'Odaberi'}</span>
                  </div>
                  <div className="ssv3-nest-field" onClick={() => setShowCalendar(true)}>
                    <span className="nest-lbl">Hotel do:</span>
                    <span className="nest-val">{hotelCheckOut || 'Odaberi'}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {['hotel', 'flight'].includes(activeTab) && (
          <>
            <button className="ssv3-advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
              <Sliders size={12}/> Napredna pretraga {showAdvanced ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
            </button>

            {showAdvanced && (
              <div className="ssv3-advanced-panel">
                {activeTab === 'hotel' ? (
                  <>
                    <div className="ssv3-adv-group">
                      <div className="ssv3-adv-label">Fleksibilnost datuma</div>
                      <div className="ssv3-adv-pills">
                        {[0, 1, 2, 3].map(d => (
                          <button key={d} className={`ssv3-adv-pill ${flexDays === d ? 'active' : ''}`} onClick={() => setFlexDays(d)}>
                            {d === 0 ? 'Tačno' : `±${d} dan${d > 1 ? 'a' : ''}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="ssv3-adv-group">
                      <div className="ssv3-adv-label">Kategorija (Minimum)</div>
                      <div className="ssv3-adv-pills">
                        {[5, 4, 3, 2].map(s => (
                          <button key={s} className={`ssv3-adv-pill ${activeStarFilters.includes(s) ? 'active' : ''}`} 
                            onClick={() => setActiveStarFilters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}>
                            {s} ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="ssv3-adv-group">
                      <div className="ssv3-adv-label">Budžet (EUR)</div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input type="number" className="ssv3-adv-input" placeholder="Od" value={budgetFrom} onChange={e => setBudgetFrom(e.target.value)} />
                        <input type="number" className="ssv3-adv-input" placeholder="Do" value={budgetTo} onChange={e => setBudgetTo(e.target.value)} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="ssv3-adv-group">
                      <div className="ssv3-adv-label">Fleksibilnost datuma</div>
                      <div className="ssv3-adv-pills">
                        {[0, 1, 2, 3].map(d => (
                          <button key={d} className={`ssv3-adv-pill ${flexDays === d ? 'active' : ''}`} onClick={() => setFlexDays(d)}>
                            {d === 0 ? 'Tačno' : `±${d} dan${d > 1 ? 'a' : ''}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="ssv3-adv-group">
                      <div className="ssv3-adv-label">Presedanja</div>
                      <div className="ssv3-adv-pills">
                        {[
                          { val: 0, label: '⚡ Direktno' },
                          { val: 1, label: 'Max 1' },
                          { val: 2, label: 'Max 2' },
                        ].map(o => (
                          <button key={o.val} className={`ssv3-adv-pill ${maxStops === o.val ? 'active' : ''}`} onClick={() => setMaxStops(o.val)}>
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="ssv3-adv-group">
                      <div className="ssv3-adv-label">Klasa putovanja</div>
                      <div className="ssv3-adv-pills">
                        {['Economy', 'Premium Economy', 'Business', 'First'].map(c => (
                          <button key={c} className={`ssv3-adv-pill ${flightClass === c ? 'active' : ''}`} onClick={() => setFlightClass(c)}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="ssv3-adv-group">
                      <div className="ssv3-adv-label">Prtljag</div>
                      <div className="ssv3-adv-pills">
                        <button className={`ssv3-adv-pill ${!withBaggage ? 'active' : ''}`} onClick={() => setWithBaggage(false)}>✈️ Samo ručni</button>
                        <button className={`ssv3-adv-pill ${withBaggage ? 'active' : ''}`} onClick={() => setWithBaggage(true)}>🧳 + Kofer</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 4. CONTENT */}
      {activeTab === 'hotel' && renderHotelResults()}
      {activeTab === 'flight' && (
        <div className="ssv3-content" style={{ flexDirection: 'row' }}>
          {/* Sidebar: Flight Selection */}
          <div className="ssv3-sidebar">
            <div className="ssv3-sidebar-section">
              <div className="ssv3-sidebar-title">ODABRANI LET</div>
              <div className="ssv3-recap-line">
                <Plane size={12} className="ssv3-field-icon"/>
                {originInput || 'BEG'} → {destFlightInput || 'TIV'}
              </div>
              <div className="ssv3-recap-sub">
                {depDate ? new Date(depDate).toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' }) : 'Termin nije odabran'}
                {tripType === 'round' && retDate && ` — ${new Date(retDate).toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' })}`}
              </div>
              <div className="ssv3-recap-sub">{paxAdults} Adl, {paxChildren} Chd · {flightClass}</div>
              <div className="ssv3-recap-actions">
                <button className="ssv3-recap-link" onClick={() => setSearchPhase('idle')}>✏️ Izmeni pretragu</button>
              </div>
            </div>

            {flightResults.length > 0 && (
              <div className="ssv3-sidebar-section">
                <div className="ssv3-sidebar-title">FILTERI LETA</div>
                <div className="ssv3-filter-group">
                  <div className="ssv3-filter-label">Aviokompanije</div>
                  {/* Mock filter list */}
                  <div className="ssv3-filter-pills">
                    {['JU', 'TK', 'OS', 'W6'].map(a => (
                      <button key={a} className="ssv3-fpill">{a}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Flight results area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {searchPhase === 'results' && !loading && (
              <div className="ssv3-results-header">
                <div className="ssv3-count">
                  {flightResults.length} letova pronađeno
                  <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ssv3-text-sec)' }}> · {originInput || 'BEG'} → {destFlightInput || 'TIV'}</span>
                </div>
                <div className="ssv3-sort-row">
                  <button className="ssv3-sort-pill active">CENA ↑</button>
                  <button className="ssv3-sort-pill">TRAJANJE ↑</button>
                  <button className="ssv3-sort-pill">POLAZAK ↑</button>
                  <button
                    className={`ssv3-sort-pill ${showTracker ? 'active' : ''}`}
                    onClick={() => setShowTracker(v => !v)}
                    style={{ marginLeft: 8 }}
                  >
                    🔔 Praćenje cena
                  </button>
                </div>
              </div>
            )}
            <div className="ssv3-results-scroll">
              {searchPhase === 'idle' && renderHeroEmpty()}
              {loading && (
                <div className="ssv3-loading" style={{ marginTop: 100 }}>
                  <div className="ssv3-spinner"/>
                  <div className="ssv3-loading-text">Pretražujemo letove (Amadeus & Global)...</div>
                </div>
              )}
              {searchPhase === 'results' && !loading && flightResults.length === 0 && !error && (
                <div className="ssv3-empty">
                   <AlertCircle size={48} className="ssv3-empty-icon"/>
                   <div className="ssv3-empty-title">Nema ponuda</div>
                   <div className="ssv3-empty-sub">Pokušajte sa drugim datumima.</div>
                </div>
              )}
              {searchPhase === 'results' && !loading && flightResults.map(f => {
                const outS = f.slices[0];
                const retS = f.slices[1];
                const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
                const formatDuration = (mins: number) => `${Math.floor(mins/60)}h ${mins%60}m`;
                
                return (
                  <div key={f.id} className="ssv3-flight-card" style={{ marginBottom: 12 }}>
                    <div className="ssv3-flight-main">
                      <div className="ssv3-flight-airline">
                        <span style={{ fontSize: 24 }}>✈️</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="ssv3-flight-airline-name">{outS.segments[0].carrierName}</span>
                          <span style={{ fontSize: 10, color: 'var(--ssv3-text-sec)' }}>{outS.segments[0].carrierCode} {outS.segments[0].flightNumber}</span>
                        </div>
                      </div>
                      <div className="ssv3-flight-route">
                        <div className="ssv3-flight-point">
                          <span className="ssv3-flight-time">{formatTime(outS.departure)}</span>
                          <span className="ssv3-flight-apt">{outS.origin.iataCode}</span>
                        </div>
                        <div className="ssv3-flight-line">
                          <div className="ssv3-flight-line-bar"><div className="ssv3-line-dot"/><div className="ssv3-line-bar"/><div className="ssv3-line-dot"/></div>
                          <span className="ssv3-flight-dur">{formatDuration(outS.duration)}</span>
                          <span className={`ssv3-flight-stops ${outS.stops > 0 ? 'has-stops' : ''}`}>{outS.stops === 0 ? 'Direktan' : `${outS.stops} presedanje`}</span>
                        </div>
                        <div className="ssv3-flight-point">
                          <span className="ssv3-flight-time">{formatTime(outS.arrival)}</span>
                          <span className="ssv3-flight-apt">{outS.destination.iataCode}</span>
                        </div>
                      </div>
                      
                      {retS && (
                        <>
                          <div className="ssv3-divider" style={{ margin: '0 12px' }}/>
                          <div className="ssv3-flight-route">
                            <div className="ssv3-flight-point">
                              <span className="ssv3-flight-time">{formatTime(retS.departure)}</span>
                              <span className="ssv3-flight-apt">{retS.origin.iataCode}</span>
                            </div>
                            <div className="ssv3-flight-line">
                               <div className="ssv3-flight-line-bar"><div className="ssv3-line-dot"/><div className="ssv3-line-bar"/><div className="ssv3-line-dot"/></div>
                               <span className="ssv3-flight-dur">{formatDuration(retS.duration)}</span>
                            </div>
                            <div className="ssv3-flight-point">
                              <span className="ssv3-flight-time">{formatTime(retS.arrival)}</span>
                              <span className="ssv3-flight-apt">{retS.destination.iataCode}</span>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="ssv3-flight-price-final" style={{ marginLeft: 'auto', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontSize: 13, color: 'var(--ssv3-text-sec)', fontWeight: 800 }}>UKUPNA CENA</div>
                        <div className="ssv3-flight-price" style={{ fontSize: 22, color: 'var(--ssv3-purple)', fontWeight: 900 }}>{f.price.total} {f.price.currency}</div>
                        <button className="ssv3-btn-primary" style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13 }}>ODABERI</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FLIGHT PRICE TRACKER PANEL */}
          {showTracker && (
            <FlightPriceTracker
              prefill={{
                origin: originInput || 'BEG',
                destination: destFlightInput || 'TIV',
                departureDate: depDate || '2025-06-15',
                returnDate: tripType === 'round' ? retDate : undefined,
                currentPrice: flightResults[0]?.price.total,
              }}
            />
          )}
        </div>
      )}
      {activeTab === 'package' && (
        <div className="ssv3-content" style={{ flexDirection: 'row' }}>
          {searchPhase === 'idle' ? (
            renderHeroEmpty()
          ) : (
            <>
              {/* Sidebar: Package Rezime */}
              <aside className="ssv3-sidebar">
                <div className="ssv3-sidebar-header">
                  <span className="ssv3-sidebar-title">REZIME PAKETA</span>
                  <button className="ssv3-filter-reset" onClick={() => { setSearchPhase('idle'); setCurrentStep(1); }}>Reset</button>
                </div>
                <div className="ssv3-sidebar-scroll">
                  {/* Selection Summary */}
                  <div className="ssv3-sidebar-section">
                    <div className="ssv3-sidebar-title">ODABRANI PARAMETRI</div>
                    <div className="ssv3-recap-line">
                      <Package size={12} className="ssv3-field-icon"/>
                      {originPackage} → {destFlightInput || '...'}
                    </div>
                    <div className="ssv3-recap-sub">
                      {depDate ? new Date(depDate).toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' }) : 'Termin nije odabran'}
                    </div>
                    <div className="ssv3-recap-sub">{paxAdults} Adl, {paxChildren} Chd</div>
                  </div>

                  <div className="ssv3-filter-group">
                    <div className="ssv3-filter-label">Progres Kreiranja</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {WIZARD_STEPS.map(s => (
                        <div key={s.id} style={{ 
                          fontSize: 13, padding: '10px 14px', borderRadius: 10, 
                          background: currentStep === s.id ? 'var(--ssv3-purple-soft)' : 'transparent',
                          color: currentStep === s.id ? 'var(--ssv3-purple)' : 'var(--ssv3-text-sec)',
                          border: currentStep === s.id ? '1px solid var(--ssv3-purple-glow)' : '1px solid transparent',
                          display: 'flex', alignItems: 'center', gap: 10,
                          fontWeight: currentStep === s.id ? 700 : 500
                        }}>
                          <div style={{ 
                            width: 20, height: 20, borderRadius: '50%', 
                            border: '2px solid currentColor', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontSize: 10, fontWeight: 900
                          }}>
                            {currentStep > s.id ? <Check size={12}/> : s.id}
                          </div>
                          {s.title}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="ssv3-filter-group">
                    <div className="ssv3-filter-label">Budžet i Zarada</div>
                    <div style={{ padding: '20px', background: 'var(--ssv3-panel-light)', borderRadius: 16, border: '1px solid var(--ssv3-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: 11, color: 'var(--ssv3-text-sec)', marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>UKUPNA VREDNOST</div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--ssv3-green)' }}>€ {totalPackagePrice.toFixed(2)}</div>
                      {isB2B && (
                        <div style={{ 
                          fontSize: 12, color: 'var(--ssv3-purple)', marginTop: 12, 
                          padding: '8px 12px', background: 'var(--ssv3-purple-soft)', 
                          borderRadius: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 
                        }}>
                          💰 Provizija: € {(totalPackagePrice * 0.1).toFixed(0)} (10%)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ssv3-filter-group">
                    <div className="ssv3-filter-label">Sadržaj Paketa</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className={`ssv3-item-summary ${currentStep > 2 ? 'active' : ''}`} style={{ padding: '12px', borderRadius: 12, background: 'var(--ssv3-card)', border: '1px solid var(--ssv3-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Plane size={18} color={currentStep > 2 ? 'var(--ssv3-green)' : 'var(--ssv3-text-muted)'} /> 
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ fontSize: 13, fontWeight: 700 }}>Avio Karte</span>
                           <span style={{ fontSize: 11, color: 'var(--ssv3-text-sec)' }}>{currentStep > 2 ? 'Odabrane ✅' : 'U procesu odabira...'}</span>
                        </div>
                      </div>
                      <div className={`ssv3-item-summary ${currentStep > 3 ? 'active' : ''}`} style={{ padding: '12px', borderRadius: 12, background: 'var(--ssv3-card)', border: '1px solid var(--ssv3-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Hotel size={18} color={currentStep > 3 ? 'var(--ssv3-green)' : 'var(--ssv3-text-muted)'} /> 
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ fontSize: 13, fontWeight: 700 }}>Smeštaj</span>
                           <span style={{ fontSize: 11, color: 'var(--ssv3-text-sec)' }}>{currentStep > 3 ? 'Odabran ✅' : 'Čeka na odabir...'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className="ssv3-search-btn" 
                    style={{ width: '100%', marginTop: 20, marginLeft: 0, height: 56, borderRadius: 16 }}
                    disabled={currentStep < 6}
                    onClick={() => navigate('/reservation-architect')}
                  >
                    PROSLEDI REZERVACIJU <ChevronRight size={18}/>
                  </button>
                </div>
              </aside>

              {/* Results Area / Wizard Area */}
              <div className="ssv3-results-scroll" style={{ background: 'var(--ssv3-bg)', flex: 1 }}>
                <PackageSearch 
                  hideHeader={true} 
                  hideFooter={true}
                  onPriceUpdate={(p: number) => setTotalPackagePrice(p)} 
                  onStepUpdate={(s: number) => setCurrentStep(s)} 
                  compactMode={true}
                />
              </div>
            </>
          )}
        </div>
      )}
      {!['hotel', 'flight', 'package'].includes(activeTab) && (
        <div className="ssv3-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="ssv3-empty">
            <Info size={48} className="ssv3-empty-icon"/>
            <div className="ssv3-empty-title">Modul u pripremi</div>
            <div className="ssv3-empty-sub">Ovaj tab će biti dostupan uskoro.</div>
          </div>
        </div>
      )}

      {/* 5. HOTEL ROOM SELECTION MODAL */}
      {selectedHotel && (
        <div className="ssv3-modal-overlay" onClick={() => setSelectedHotel(null)}>
          <div className="ssv3-modal" onClick={e => e.stopPropagation()}>
            <div className="ssv3-modal-header">
              <div className="ssv3-modal-hotel-info">
                <div className="ssv3-modal-hotel-name">{selectedHotel.name}</div>
                <div className="ssv3-modal-hotel-sub">
                  <MapPin size={12}/> {selectedHotel.location}
                  <span style={{ margin: '0 6px' }}>|</span>
                  {checkIn} – {checkOut} ({nights} noći)
                  <span style={{ margin: '0 6px' }}>|</span>
                  {totalAdults} Odrasla
                </div>
              </div>
              <button className="ssv3-modal-close" onClick={() => setSelectedHotel(null)}><X size={16}/></button>
            </div>

            <div className="ssv3-modal-room-tabs">
              {rooms.map((_, i) => (
                <button key={i} className={`ssv3-modal-room-tab ${i === 0 ? 'active' : ''}`}>Soba {i + 1}</button>
              ))}
            </div>

            <div className="ssv3-modal-body">
              <div className="ssv3-room-group-label">Dostupne sobe</div>
              {MOCK_ROOMS.map(room => (
                <div key={room.id} className={`ssv3-room-row ${selectedRoomId === room.id ? 'selected' : ''}`} onClick={() => setSelectedRoomId(room.id)}>
                  <div className="ssv3-room-name">{room.name}</div>
                  <div className="ssv3-room-tags" style={{ flex: 1 }}>
                    <span className="ssv3-tag meal-plan">{room.mealCode}</span>
                    <span className={`ssv3-tag ${room.cancelType === 'nonrefund' ? 'non-refund' : room.cancelType === 'penalty' ? 'on-request' : 'free-cancel'}`}>
                      {room.cancelLabel}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 12 }}>
                    <div className="ssv3-room-price">{room.price} EUR <span style={{ fontSize: 10 }}>/ os.</span></div>
                    <div className="ssv3-room-total">Ukupno: {room.total} EUR</div>
                    {isB2B && <div className="ssv3-commission" style={{ marginTop: 2 }}>💰 {(room.price * 0.15).toFixed(0)} EUR provizija</div>}
                  </div>
                  <div style={{ marginLeft: 10 }}>
                    {selectedRoomId === room.id
                      ? <Check size={18} color="var(--ssv3-green)"/>
                      : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--ssv3-border)' }}/>
                    }
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid var(--ssv3-border)' }}>
                <button className="ssv3-btn-ghost" style={{ padding: '0 16px', height: 44, width: 'auto', borderRadius: 12 }} onClick={() => setSelectedHotel(null)}>
                  Otkaži
                </button>
                <button className="ssv3-btn-primary" style={{ height: 44, padding: '0 32px', fontSize: 13, borderRadius: 12 }} disabled={!selectedRoomId}
                  onClick={() => navigate('/reservation-architect')}>
                  Nastavi na rezervaciju →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. SHARED CALENDAR POPUP */}
      {showCalendar && (
        <ModernCalendar 
          startDate={activeTab === 'flight' ? depDate : checkIn}
          endDate={activeTab === 'flight' ? (tripType === 'round' ? retDate : null) : checkOut}
          singleMode={activeTab === 'flight' && tripType === 'oneway'}
          onChange={(start, end) => {
            if (activeTab === 'flight') {
              setDepDate(start);
              if (tripType === 'round') setRetDate(end);
            } else {
              setCheckIn(start);
              setCheckOut(end);
            }
          }}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
};

export default SmartSearchV3;
