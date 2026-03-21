import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, LayoutGrid, Building2, Plane, Sparkles, MapPin, Star, Filter, Loader2, Package as PackageIcon, Info, Map as MapIcon, Compass, ShoppingBag, Navigation, Anchor, Zap, Car, CalendarDays, Users, Layout as LayoutIcon, CheckCircle2, ShoppingCart, ArrowRight, Trash2, ArrowLeftRight,
  SlidersHorizontal, ChevronUp, ChevronDown, Calendar, Clock, List as ListIcon, TrendingUp, History as HistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTS ---
import { HorizontalNav, SystemFooter } from '../components/layout';
import { ExpediaCalendar } from '../components/ExpediaCalendar';
import { BudgetTypeToggle } from '../components/BudgetTypeToggle';
import './SmartSearchV4.css'; // Re-using variables
import './SmartSearchV5.css';

// --- V1 RESTORED COMPONENTS ---
import { MilicaChat } from './SmartSearch/components/MilicaChat';
import { SearchHistorySidebar } from './SmartSearch/components/SearchHistorySidebar';

// --- SERVICES & STORES ---
import smartSearchService from '../services/smartSearchService';
import flightSearchManager from '../services/flight/flightSearchManager';
import { useThemeStore, useAppStore } from '../stores';

import solvexDictionaryService from '../integrations/solvex/api/solvexDictionaryService';
import { FilterSidebar } from './SmartSearch/components/FilterSidebar';
import { HotelCard } from './SmartSearch/components/HotelCard'; 
import { currencyManager } from '../utils/currencyManager';
import { getMockFlightResults, getMockPackageResults } from '../services/mockAmadeusService';
import uosService from '../services/uosService';

// --- TYPES ---
interface SearchResult {
  id: string;
  type: string;
  name: string;
  price: number;
  location: string;
  provider: string;
  data: any;
  stars?: number;
  mealPlan?: string;
  availability?: string;
  icon?: React.ReactNode;
}

interface Destination {
  id: string | number;
  name: string;
  type: 'destination' | 'hotel' | 'country' | 'city';
}

interface CartItem {
  id: string;
  type: string;
  name: string;
  price: number;
  data: any;
}

const TABS = [
  { id: 'Stays', label: 'Hoteli', icon: <Building2 size={24} />, fields: ['city-hotel', 'dates', 'rooms'] },
  { id: 'Flights', label: 'Letovi', icon: <Plane size={24} />, fields: ['flight-fields'] },
  { id: 'Packages', label: 'Paketi', icon: <ShoppingBag size={24} />, fields: ['from', 'to', 'dates', 'rooms'] },
  { id: 'Transfers', label: 'Transfer', icon: <Navigation size={22} />, fields: ['from-to', 'dates', 'time'] },
  { id: 'Putovanja', label: 'Aranžmani', icon: <Compass size={24} />, fields: ['destination', 'dates'] },
  { id: 'Charteri', label: 'Čarter', icon: <Zap size={24} />, fields: ['from', 'to', 'dates'] },
  { id: 'Cars', label: 'Rent-a-Car', icon: <Car size={24} />, fields: ['pickup', 'dates'] },
  { id: 'Ski', label: 'Ski', icon: <LayoutGrid size={24} />, fields: ['destination', 'dates'] }
];

const SmartSearchV5: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { isMilicaChatOpen, setMilicaChatOpen } = useAppStore();

  // --- NEO-SEARCH CORE STATE ---
  const [activeTab, setActiveTab] = useState('Stays');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // NeoSearch Selection State
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [pickup, setPickup] = useState('');
  
  // Expedia Date & Rooms Logic
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPax, setShowPax] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string | null>(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [datesLabel, setDatesLabel] = useState('Izaberite datume');
  const [dateFlexibility, setDateFlexibility] = useState<number>(0);
  
  // V1 Restored Sidebars
  const [showMilica, setShowMilica] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [budgetType, setBudgetType] = useState<'total' | 'person' | 'room'>('total');
  const [budgetFrom, setBudgetFrom] = useState('');
  const [budgetTo, setBudgetTo] = useState('');

  // ── INSURANCE STATE ──
  const [includeInsurance, setIncludeInsurance] = useState(false);
  const [insurancePrice, setInsurancePrice] = useState(0);
  const [isCalculatingInsurance, setIsCalculatingInsurance] = useState(false);
  
  // ── SEARCH STATE (V1 LOGIC) ──
  const [selectedDestinations, setSelectedDestinations] = useState<Destination[]>([]);
  const [destinationInput, setDestinationInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ── FILTER STATE (V1 LOGIC) ──
  const [hotelNameFilter, setHotelNameFilter] = useState('');
  const [selectedStars, setSelectedStars] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>(['available', 'on_request']);
  const [selectedMealPlans, setSelectedMealPlans] = useState<string[]>(['all']);
  const [onlyRefundable, setOnlyRefundable] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'notepad'>('list');
  const [sortBy, setSortBy] = useState<'price' | 'stars' | 'name'>('price');

  // ── FLIGHT FILTER STATE ──
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [maxStops, setMaxStops] = useState<number | null>(null);
  const [timeFilters, setTimeFilters] = useState({
    outboundDepartureFrom: '00:00',
    outboundDepartureTo: '24:00',
    inboundDepartureFrom: '00:00',
    inboundDepartureTo: '24:00'
  });

  // Multi-room state aligned with V1
  const [roomsData, setRoomsData] = useState<any[]>([
    { adults: 2, children: [] }
  ]);
  const [tripType, setTripType] = useState<'round-trip' | 'one-way' | 'multi-city'>('round-trip');
  const [cabinClass, setCabinClass] = useState<string>('economy');
  const [multiCityLegs, setMultiCityLegs] = useState<any[]>([
    { from: 'BEG', to: 'CDG', date: '2025-03-25' },
    { from: 'CDG', to: 'LHR', date: '2025-03-28' }
  ]);
  
  // Advanced Flight Search State
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [flexibleDates, setFlexibleDates] = useState<number>(0);
  const [outboundDepartureFrom, setOutboundDepartureFrom] = useState('');
  const [outboundDepartureTo, setOutboundDepartureTo] = useState('');
  const [outboundArrivalFrom, setOutboundArrivalFrom] = useState('');
  const [outboundArrivalTo, setOutboundArrivalTo] = useState('');
  
  // State for expanded flight offers (Details view)
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);

  // ── DESTINATION AUTOCOMPLETE ──
  const handleDestinationChange = async (val: string) => {
    setDestinationInput(val);
    if (val.length >= 2) {
      setIsLoadingSuggestions(true);
      setShowSuggestions(true);
      const matches = await solvexDictionaryService.searchDestinations(val);
      setSuggestions(matches);
      setIsLoadingSuggestions(false);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectDestination = (dest: any) => {
    setSelectedDestinations([{ id: dest.id, name: dest.name, type: dest.type }]);
    setDestinationInput(dest.name);
    setShowSuggestions(false);
  };

  const addToHistory = (queryResultsCount: number) => {
    const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        query: {
            destinations: selectedDestinations,
            checkIn: startDate || '',
            checkOut: endDate || '',
            roomAllocations: roomsData.map(r => ({ adults: r.adults, children: r.children.length, childrenAges: r.children })),
            mealPlan: selectedMealPlans[0] || 'all',
            nationality: 'RS',
            budgetType: budgetType,
            tab: activeTab.toLowerCase() as any,
            searchMode: 'classic' as const
        },
        resultsSummary: { count: queryResultsCount }
    };
    setSearchHistory(prev => [newItem, ...prev].slice(0, 10));
  };

  // ── HELPERS ──
  const calculateInsurancePrice = async () => {
    setIsCalculatingInsurance(true);
    // Mocking a calculation based on days and pax
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 86400000);
    const days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    const paxCount = roomsData.reduce((acc, r) => acc + r.adults + (r.children?.length || 0), 0);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const price = Math.max(7, days) * paxCount * 1.5; // €1.5 per day per person
    setInsurancePrice(Math.round(price));
    setIsCalculatingInsurance(false);
  };


  const addToCart = (item: SearchResult) => {
    const cartItem: CartItem = {
      id: item.id,
      type: item.type,
      name: item.name,
      price: item.price,
      data: item.data
    };
    setCart(prev => [...prev, cartItem]);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    if (itemId === 'insurance-pax') setIncludeInsurance(false);
  };

  const toggleInsuranceInCart = () => {
    if (includeInsurance) {
      removeFromCart('insurance-pax');
    } else {
      const insuranceItem: CartItem = {
        id: 'insurance-pax',
        type: 'insurance',
        name: 'Putno Osiguranje (UOS)',
        price: insurancePrice,
        data: { pricePerPax: insurancePrice / 2 } // Mocking individual price
      };
      setCart(prev => [...prev, insuranceItem]);
      setIncludeInsurance(true);
    }
  };

  const totalPrice = cart.reduce((acc, sum) => acc + sum.price, 0);

  useEffect(() => {
    if (startDate && (activeTab === 'Stays' || activeTab === 'Packages')) {
        calculateInsurancePrice();
    }
  }, [startDate, endDate, roomsData, activeTab]);

  const handleSearch = async () => {
    if (selectedDestinations.length === 0 && (activeTab === 'Stays')) {
      if (!destinationInput) return;
    }

    setIsSearching(true);
    setResults([]);
    
    const checkIn = startDate || new Date().toISOString().split('T')[0];
    const checkOut = endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    try {
      if (activeTab === 'Flights') {
        const mockResults = await getMockFlightResults({ from: fromCity, to: toCity, class: cabinClass, adults: roomsData[0]?.adults, children: roomsData[0]?.children.length });
        setResults(mockResults as any);
      } else if (activeTab === 'Packages') {
        const mockResults = await getMockPackageResults({ dest: destinationInput });
        setResults(mockResults as any);
      } else {
        const activeDestinations = selectedDestinations.length > 0 
          ? selectedDestinations.map(d => ({ 
              id: String(d.id).replace('solvex-c-', ''), 
              name: d.name, 
              type: d.type 
            }))
          : [{ id: 'manual', name: destinationInput || 'Bugarska', type: 'city' as const }];

        const searchParams: any = {
          searchType: 'hotel' as const,
          destinations: activeDestinations,
          checkIn,
          checkOut,
          roomConfig: roomsData.map(r => ({ adults: r.adults, children: r.children.length, childrenAges: r.children })),
          nationality: 'RS',
          currency: 'EUR'
        };

        const apiResults = await smartSearchService.performSmartSearch(searchParams);
        
        let transformed: SearchResult[] = apiResults.map((r: any) => ({
          id: r.id || Math.random().toString(36).substr(2, 9),
          type: 'hotel',
          name: r.name,
          price: r.price || 0,
          location: r.location || destinationInput,
          provider: r.provider || 'Solvex',
          stars: r.stars,
          mealPlan: r.mealPlan,
          availability: r.availability,
          data: r
        }));

        // If no results, use mock hotels for demo
        if (transformed.length === 0) {
          transformed = [
            {
              id: 'h-mock-1',
              type: 'hotel',
              name: 'Hotel Splendid Conference & Spa',
              price: 450,
              location: 'Bečići, Crna Gora',
              provider: 'Solvex',
              stars: 5,
              mealPlan: 'Bed & Breakfast',
              availability: 'available',
              data: {}
            },
            {
              id: 'h-mock-2',
              type: 'hotel',
              name: 'Iberostar Slavija',
              price: 320,
              location: 'Budva, Crna Gora',
              provider: 'Solvex',
              stars: 5,
              mealPlan: 'Bed & Breakfast',
              availability: 'available',
              data: {}
            },
            {
              id: 'h-mock-3',
              type: 'hotel',
              name: 'Hotel Regent Porto Montenegro',
              price: 890,
              location: 'Tivat, Crna Gora',
              provider: 'Filos',
              stars: 5,
              mealPlan: 'Room Only',
              availability: 'on_request',
              data: {}
            },
            {
              id: 'h-mock-4',
              type: 'hotel',
              name: 'Avala Resort & Villas',
              price: 280,
              location: 'Budva, Crna Gora',
              provider: 'Solvex',
              stars: 4,
              mealPlan: 'Half Board',
              availability: 'available',
              data: {}
            },
            {
              id: 'h-mock-5',
              type: 'hotel',
              name: 'Hotel Falkensteiner Montenegro',
              price: 410,
              location: 'Bečići, Crna Gora',
              provider: 'MtsGlobe',
              stars: 4,
              mealPlan: 'All Inclusive',
              availability: 'available',
              data: {}
            }
          ];
        }
        setResults(transformed);
        addToHistory(transformed.length);
      }
    } catch (err) {
      console.error("V5 Search Error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFinalBook = () => {
    const dossierId = 'D-' + Math.random().toString(36).substr(2, 6);
    navigate(`/reservation-architect?id=${dossierId}`);
  };

  const renderFields = () => {
    const activeTabData = TABS.find(t => t.id === activeTab);
    if (!activeTabData) return null;

    const fields = activeTabData.fields.map(field => {
      switch(field) {
        case 'city-hotel':
        case 'destination':
          return (
            <div className="v5-field" key={field} style={{ position: 'relative' }}>
              <label>Gde putujete?</label>
              <MapPin className="v5-icon" size={18} />
              <input
                type="text"
                placeholder="Beograd, Hurgada..."
                value={destinationInput}
                onChange={(e) => handleDestinationChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="v5-popover neosearch-suggestions" style={{
                  position: 'absolute', top: '100%', left: 0, width: '100%',
                  background: 'var(--ssv4-bg-card)', border: '1px solid var(--ssv4-border)',
                  borderRadius: '12px', zIndex: 1000, color: 'var(--ssv4-text-main)', marginTop: '5px',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)',
                  maxHeight: '450px', overflowY: 'auto'
                }}>
                  {/* Grouped Suggestions Logic */}
                  {['city', 'hotel', 'country', 'destination'].map(groupType => {
                    const groupItems = suggestions.filter(s => s.type === groupType);
                    if (groupItems.length === 0) return null;
                    
                    const groupLabel = groupType === 'city' ? 'GRADOVI' : 
                                     groupType === 'hotel' ? 'HOTELI' : 
                                     groupType === 'country' ? 'DRŽAVE' : 'DESTINACIJE';
                    
                    return (
                      <div key={groupType} className="suggestion-group">
                        <div style={{ padding: '10px 15px 5px', fontSize: '10px', fontWeight: 900, color: 'var(--ssv4-primary)', opacity: 0.8, letterSpacing: '1px' }}>
                          {groupLabel}
                        </div>
                        {groupItems.map((s, idx) => (
                          <div 
                            key={`${groupType}-${idx}`} 
                            onClick={() => selectDestination(s)}
                            className="suggestion-item"
                            style={{
                              padding: '12px 15px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px'
                            }}
                          >
                             <div style={{ color: 'var(--ssv4-text-sec)', opacity: 0.5 }}>
                                {groupType === 'hotel' ? <Building2 size={16} /> : <MapPin size={16} />}
                             </div>
                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--ssv4-text-sec)' }}>{s.country_name}</span>
                             </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        case 'flight-fields':
          if (tripType === 'multi-city') {
            return (
              <div key="multi-city" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', gridColumn: '1 / -1' }}>
                {multiCityLegs.map((leg, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', opacity: 0.5 }}>Od</label>
                      <input type="text" value={leg.from} onChange={e => { const n = [...multiCityLegs]; n[idx].from = e.target.value; setMultiCityLegs(n); }} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: 700 }} />
                    </div>
                    <ArrowRight size={14} style={{ opacity: 0.3 }} />
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', opacity: 0.5 }}>Do</label>
                      <input type="text" value={leg.to} onChange={e => { const n = [...multiCityLegs]; n[idx].to = e.target.value; setMultiCityLegs(n); }} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: 700 }} />
                    </div>
                    <div style={{ width: '100px' }}>
                      <label style={{ fontSize: '10px', opacity: 0.5 }}>Datum</label>
                      <input type="text" value={new Date(leg.date).toLocaleDateString('sr-RS', { day: 'numeric', month: 'short' })} readOnly style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }} />
                    </div>
                    {multiCityLegs.length > 2 && (
                      <button onClick={() => setMultiCityLegs(multiCityLegs.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', color: '#ff5252', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    )}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {multiCityLegs.length < 5 && (
                    <button onClick={() => setMultiCityLegs([...multiCityLegs, { from: '', to: '', date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] }])} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>+ Dodaj let</button>
                  )}
                  <div key="pax-trigger" className="v5-field" style={{ cursor: 'pointer', flex: 1 }} onClick={() => { setShowPax(!showPax); setShowCalendar(false); }}>
                    <label>Putnici & Klasa</label>
                    <Users className="v5-icon" size={18} />
                    <input type="text" readOnly value={`${roomsData.reduce((acc, r) => acc + r.adults + r.children.length, 0)} Putnika, ${cabinClass}`} style={{ cursor: 'pointer' }} />
                  </div>
                </div>
              </div>
            );
          }
          return (
            <>
              <div className="v5-field" key="from" style={{ position: 'relative' }}>
                <label>Polazak</label>
                <Navigation className="v5-icon" size={18} />
                <input type="text" placeholder="BEG, Beograd..." value={fromCity} onChange={e => setFromCity(e.target.value)} />
                <button 
                  onClick={() => { const tmp = fromCity; setFromCity(toCity); setToCity(tmp); }}
                  style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'var(--ssv4-bg-card)', border: '1px solid var(--ssv4-border)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ssv4-primary)', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                >
                  <ArrowRight size={14} />
                </button>
              </div>
              <div className="v5-field" key="to">
                <label>Odredište</label>
                <MapIcon className="v5-icon" size={18} />
                <input type="text" placeholder="CDG, Pariz..." value={toCity} onChange={e => setToCity(e.target.value)} />
              </div>
              <div className="v5-field" key="dates" style={{ cursor: 'pointer' }} onClick={() => setShowCalendar(true)}>
                <label>Termini</label>
                <CalendarDays className="v5-icon" size={18} />
                <input type="text" readOnly value={startDate ? `${startDate} - ${endDate || ''}` : 'Izaberite datume'} style={{ cursor: 'pointer' }} />
                {showCalendar && (
                  <ExpediaCalendar 
                    startDate={startDate}
                    endDate={endDate}
                    initialFlexibleDays={flexibleDates}
                    onClose={() => setShowCalendar(false)}
                    onChange={(start, end, flex) => {
                      setStartDate(start);
                      setEndDate(end);
                      if (flex !== undefined) setFlexibleDates(flex);
                      setDatesLabel(`${start} - ${end}`);
                    }}
                  />
                )}
              </div>
              <div className="v5-field" key="pax" style={{ cursor: 'pointer' }} onClick={() => { setShowPax(!showPax); setShowCalendar(false); }}>
                <label>Putnici & Klasa</label>
                <Users className="v5-icon" size={18} />
                <input type="text" readOnly value={`${roomsData.reduce((acc, r) => acc + r.adults + r.children.length, 0)} Putnika, ${cabinClass}`} style={{ cursor: 'pointer' }} />
                {showPax && (
                  <div className="v5-popover neosearch-pax" onClick={e => e.stopPropagation()}>
                    {roomsData.map((room, rIdx) => (
                      <div key={room.id || rIdx} className="neo-room-section">
                        <div className="neo-room-head">
                          <h5>Soba {rIdx + 1}</h5>
                          {rIdx > 0 && <button onClick={() => setRoomsData(roomsData.filter((_, idx) => idx !== rIdx))}>Ukloni</button>}
                        </div>
                        <div className="pax-row">
                          <span>Odrasli</span>
                          <div className="pax-ctrl">
                            <button onClick={() => { const n = [...roomsData]; n[rIdx].adults = Math.max(1, n[rIdx].adults - 1); setRoomsData(n); }}>-</button>
                            <span>{room.adults}</span>
                            <button onClick={() => { const n = [...roomsData]; n[rIdx].adults++; setRoomsData(n); }}>+</button>
                          </div>
                        </div>
                        <div className="pax-row">
                          <span>Deca</span>
                          <div className="pax-ctrl">
                            <button onClick={() => { const n = [...roomsData]; n[rIdx].children.pop(); setRoomsData(n); }}>-</button>
                            <span>{room.children.length}</span>
                            <button onClick={() => { const n = [...roomsData]; n[rIdx].children.push(0); setRoomsData(n); }}>+</button>
                          </div>
                        </div>
                        {room.children.length > 0 && (
                          <div className="neo-age-grid">
                            {room.children.map((age: number, cIdx: number) => (
                              <div key={cIdx} className="age-item">
                                <label>Godište d{cIdx + 1}</label>
                                <select value={age} onChange={(e) => { const n = [...roomsData]; n[rIdx].children[cIdx] = parseInt(e.target.value); setRoomsData(n); }}>
                                  {Array.from({ length: 18 }).map((_, a) => <option key={a} value={a}>{a}</option>)}
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <label style={{ fontSize: '10px', opacity: 0.5, fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Klasa</label>
                        <select 
                            value={cabinClass} 
                            onChange={(e) => setCabinClass(e.target.value)}
                            style={{ width: '100%', height: '44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', padding: '0 16px', outline: 'none' }}
                        >
                            <option value="economy">Ekonomska</option>
                            <option value="premium_economy">Premium Ekonomska</option>
                            <option value="business">Biznis</option>
                            <option value="first">Prva klasa</option>
                        </select>
                    </div>
                    <button className="v5-book-btn" style={{ height: '44px', marginTop: '16px' }} onClick={() => setShowPax(false)}>GOTOVO</button>
                  </div>
                )}
              </div>
            </>
          );
        case 'pickup':
          return (
            <div className="v5-field" key="pickup">
              <label>Lokacija preuzimanja</label>
              <Car className="v5-icon" size={18} />
              <input type="text" placeholder="Aerodrom, Centar..." value={pickup} onChange={e => setPickup(e.target.value)} />
            </div>
          );
        case 'cruise-line':
          return (
            <div className="v5-field" key="cruise">
              <label>Cruise Line</label>
              <Anchor className="v5-icon" size={18} />
              <input type="text" placeholder="Royal Caribbean..." />
            </div>
          );
      }
    });

    return fields;
  };

  const handleTabChange = (tabId: string) => {
    // ── SYNC LOGIC ──
    const prevTab = activeTab;
    
    // Sync Destination -> ToCity for Flights
    if (tabId === 'Flights' && (prevTab === 'Stays' || prevTab === 'Packages' || prevTab === 'Putovanja')) {
        if (destinationInput && !toCity) setToCity(destinationInput.substring(0, 3).toUpperCase());
    }
    
    // Sync ToCity / FromCity -> Destination for Stays
    if (tabId === 'Stays' && prevTab === 'Flights') {
        if (toCity && !destinationInput) setDestinationInput(toCity);
    }

    // Sync Packages (Needs both From and To)
    if (tabId === 'Packages') {
        if (toCity && !destinationInput) setDestinationInput(toCity);
    }
    
    setActiveTab(tabId);
  };

  return (
    <div className={`ssv5-wrapper ${theme === 'navy' ? 'navy-theme' : 'light-theme'}`}>
      <div className="ssv5-layout">
        <div className="ssv5-hub">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '10px' }}>
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--ssv4-primary)', margin: 0, letterSpacing: '-1px' }}
            >
              SMART SEARCH <span style={{ opacity: 0.2 }}>V5</span>
            </motion.h1>
          </div>

          <div className="ssv5-tabs">
            {TABS.map(tab => (
              <button 
                key={tab.id}
                className={`ssv5-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="ssv5-panel" style={{ flexDirection: 'column' }}>
            {activeTab === 'Flights' && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button onClick={() => setTripType('round-trip')} style={{ padding: '8px 16px', borderRadius: '100px', background: tripType === 'round-trip' ? 'rgba(142,36,172,0.2)' : 'transparent', border: tripType === 'round-trip' ? '1px solid var(--ssv4-primary)' : '1px solid transparent', color: tripType === 'round-trip' ? '#ce93d8' : 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>POVRATNA KARTA</button>
                    <button onClick={() => setTripType('one-way')} style={{ padding: '8px 16px', borderRadius: '100px', background: tripType === 'one-way' ? 'rgba(142,36,172,0.2)' : 'transparent', border: tripType === 'one-way' ? '1px solid var(--ssv4-primary)' : '1px solid transparent', color: tripType === 'one-way' ? '#ce93d8' : 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>U JEDNOM PRAVCU</button>
                    <button onClick={() => setTripType('multi-city')} style={{ padding: '8px 16px', borderRadius: '100px', background: tripType === 'multi-city' ? 'rgba(142,36,172,0.2)' : 'transparent', border: tripType === 'multi-city' ? '1px solid var(--ssv4-primary)' : '1px solid transparent', color: tripType === 'multi-city' ? '#ce93d8' : 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>VIŠE DESTINACIJA</button>
                </div>
            )}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div className="ssv5-fields-grid" style={{ flex: 1 }}>
                  {renderFields()}
                </div>

                <button 
                  className="v5-search-btn" 
                  onClick={handleSearch} 
                  disabled={isSearching}
                  style={{ alignSelf: 'center', height: '100%' }}
                >
                  {isSearching ? <Loader2 className="spin" size={24} /> : 'PRETRAŽI'}
                </button>
            </div>
            
            {/* Napredna pretraga (Advanced Options) for Flights */}
            {activeTab === 'Flights' && (
                <div style={{ width: '100%', marginTop: '16px' }}>
                    <div className="advanced-options-toggle" style={{ textAlign: 'left', marginBottom: '8px' }}>
                        <button
                            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}
                        >
                            <SlidersHorizontal size={16} />
                            {showAdvancedOptions ? 'Zatvori Naprednu pretragu' : 'Napredna pretraga'}
                            {showAdvancedOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>

                    {showAdvancedOptions && (
                        <div className="advanced-options-panel" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="advanced-options-grid" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                {/* Flexible Dates */}
                                <div className="advanced-option-group" style={{ flex: 1, minWidth: '200px' }}>
                                    <label className="advanced-option-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                                        <Calendar size={14} /> Fleksibilni Datumi
                                    </label>
                                    <div className="flexible-dates-options" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                                        {[0, 1, 2, 3].map(days => (
                                            <button
                                                key={days}
                                                onClick={() => setFlexibleDates(days)}
                                                style={{ flex: 1, padding: '10px 0', border: 'none', background: flexibleDates === days ? 'var(--accent)' : 'transparent', color: flexibleDates === days ? '#000' : 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                                            >
                                                {days === 0 ? 'Tačan datum' : `± ${days} dan${days > 1 ? 'a' : ''}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Max Stops */}
                                <div className="advanced-option-group" style={{ flex: 1, minWidth: '200px' }}>
                                    <label className="advanced-option-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                                        <Plane size={14} /> Maksimalan broj presedanja
                                    </label>
                                    <div className="stops-options" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                                        {[{ v: 0, l: 'Direktan' }, { v: 1, l: 'Max 1' }, { v: 2, l: 'Max 2' }].map(opt => (
                                            <button
                                                key={opt.v}
                                                onClick={() => setMaxStops(opt.v)}
                                                style={{ flex: 1, padding: '10px 0', border: 'none', background: maxStops === opt.v ? 'var(--ssv4-primary)' : 'transparent', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                                            >
                                                {opt.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                            
                            {/* Time Filters */}
                            <div className="time-filters-section" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                                        <Clock size={14} /> Vreme polaska od - do:
                                    </label>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <input type="time" value={outboundDepartureFrom} onChange={e => setOutboundDepartureFrom(e.target.value)} style={{ flex: 1, height: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', padding: '0 16px', outline: 'none' }} />
                                        <span>-</span>
                                        <input type="time" value={outboundDepartureTo} onChange={e => setOutboundDepartureTo(e.target.value)} style={{ flex: 1, height: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', padding: '0 16px', outline: 'none' }} />
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                                        <Clock size={14} /> Vreme sletanja od - do:
                                    </label>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <input type="time" value={outboundArrivalFrom} onChange={e => setOutboundArrivalFrom(e.target.value)} style={{ flex: 1, height: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', padding: '0 16px', outline: 'none' }} />
                                        <span>-</span>
                                        <input type="time" value={outboundArrivalTo} onChange={e => setOutboundArrivalTo(e.target.value)} style={{ flex: 1, height: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', padding: '0 16px', outline: 'none' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
          </div>

          <div className="results-container" style={{ padding: '0 2rem' }}>
            {/* Flight Date Carousel (V1 Style) */}
            {activeTab === 'Flights' && !isSearching && results.length > 0 && (
                <div className="flight-date-carousel" style={{ marginBottom: '32px', display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' }}>
                    {[25, 26, 27, 28, 29, 30, 31, 1, 2, 3].map((day, i) => {
                        const today = new Date();
                        const year = 2026; // Matching project current date year
                        const month = day >= 25 ? '03' : '04';
                        const dayPadded = day.toString().padStart(2, '0');
                        const dateStr = `${year}-${month}-${dayPadded}`;
                        const isSelected = startDate === dateStr;
                        
                        return (
                            <div 
                                key={i} 
                                style={{ 
                                    minWidth: '120px', 
                                    padding: '16px', 
                                    background: isSelected ? 'rgba(142,36,172,0.2)' : 'rgba(255,255,255,0.03)', 
                                    border: isSelected ? '1px solid var(--ssv4-primary)' : '1px solid rgba(255,255,255,0.05)', 
                                    borderRadius: '16px', 
                                    textAlign: 'center', 
                                    cursor: 'pointer', 
                                    transition: 'all 0.2s',
                                    transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                                }}
                                onClick={() => {
                                    setStartDate(dateStr);
                                    if (day >= 25) {
                                        setEndDate(`${year}-03-${(day + 7 > 31) ? '31' : (day + 7).toString().padStart(2, '0')}`);
                                    } else {
                                        setEndDate(`${year}-04-${(day + 7).toString().padStart(2, '0')}`);
                                    }
                                }}
                            >
                                <div style={{ fontSize: '11px', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase' }}>{day >= 25 ? 'Mart' : 'April'}</div>
                                <div style={{ fontSize: '20px', fontWeight: 900, margin: '4px 0' }}>{day}.</div>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: isSelected ? 'var(--ssv4-primary)' : '#4caf50' }}>
                                    {isSelected ? '€342' : `€${300 + Math.floor(Math.random() * 100)}`}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isSearching ? (
              <div className="v5-results-layout" style={{ marginTop: '40px' }}>
                <div className="v5-results-sidebar">
                   <div className="v5-skeleton" style={{ height: '500px', width: '100%', borderRadius: '24px' }}></div>
                </div>
                <div className="v5-results-content">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="v5-skeleton" style={{ height: '350px', borderRadius: '24px' }}></div>
                    ))}
                  </div>
                </div>
              </div>
            ) : results.length > 0 ? (
              <>
                {/* Results Header Summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', background: 'var(--ssv4-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Zap size={18} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Pronađeno {results.length} ponuda</h3>
                    </div>

                    {/* Upsell Insurance Banner */}
                    {(activeTab === 'Stays' || activeTab === 'Packages') && !includeInsurance && (
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="insurance-upsell-banner"
                            style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', padding: '8px 20px', borderRadius: '100px', cursor: 'pointer' }}
                            onClick={toggleInsuranceInCart}
                        >
                            <div style={{ background: '#4caf50', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
                                <CheckCircle2 size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 900, color: '#4caf50' }}>DODAJTE PUTNO OSIGURANJE</div>
                                <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: 700 }}>Za samo €{insurancePrice} po osobi (Triglav / UOS)</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px 8px', fontSize: '10px', fontWeight: 900 }}>DODAJ</div>
                        </motion.div>
                    )}
                </div>

                <div className="v5-results-layout">
                <div className="v5-results-sidebar">
                  <FilterSidebar 
                    searchResults={results}
                hotelNameFilter={hotelNameFilter}
                setHotelNameFilter={setHotelNameFilter}
                selectedStars={selectedStars}
                toggleStarFilter={(s) => setSelectedStars(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                selectedAvailability={selectedAvailability}
                toggleAvailabilityFilter={(a) => setSelectedAvailability(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])}
                selectedMealPlans={selectedMealPlans}
                toggleMealPlanFilter={(m) => setSelectedMealPlans(prev => m === 'all' ? ['all'] : (prev.includes(m) ? prev.filter(x => x !== m) : [...prev.filter(x => x !== 'all'), m]))}
                onlyRefundable={onlyRefundable}
                setOnlyRefundable={setOnlyRefundable}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onResetSearch={() => {
                  setResults([]);
                  setSelectedAirlines([]);
                  setMaxStops(null);
                  setTimeFilters({
                    outboundDepartureFrom: '00:00',
                    outboundDepartureTo: '24:00',
                    inboundDepartureFrom: '00:00',
                    inboundDepartureTo: '24:00'
                  });
                }}
                // NEW FLIGHT PROPS
                activeTab={activeTab}
                selectedAirlines={selectedAirlines}
                toggleAirlineFilter={(a) => setSelectedAirlines(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])}
                maxStops={maxStops}
                setMaxStops={setMaxStops}
                timeFilters={timeFilters}
                  />
                </div>

                <div className="v5-results-content">
                  {/* RESULTS HEADER (RESTORED FROM V1) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'var(--ssv4-card-bg)', padding: '16px 24px', borderRadius: '24px', border: '1px solid var(--ssv4-card-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <BudgetTypeToggle type={budgetType} onTypeChange={setBudgetType} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.5 }}>BUDŽET:</span>
                            <input 
                                type="text"
                                placeholder="Min"
                                value={budgetFrom}
                                onChange={e => setBudgetFrom(e.target.value)}
                                style={{ width: '70px', height: '36px', background: 'var(--ssv4-input-bg)', border: '1px solid var(--ssv4-card-border)', borderRadius: '8px', color: 'white', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}
                            />
                            <span style={{ opacity: 0.3 }}>-</span>
                            <input 
                                type="text"
                                placeholder="Max"
                                value={budgetTo}
                                onChange={e => setBudgetTo(e.target.value)}
                                style={{ width: '70px', height: '36px', background: 'var(--ssv4-input-bg)', border: '1px solid var(--ssv4-card-border)', borderRadius: '8px', color: 'white', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '20px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.5 }}>SORTIRAJ:</span>
                            <select 
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as any)}
                                style={{ background: 'var(--ssv4-input-bg)', border: '1px solid var(--ssv4-card-border)', borderRadius: '8px', color: 'white', padding: '4px 12px', fontSize: '12px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                            >
                                <option value="price">Najjeftinije</option>
                                <option value="stars">Najbolje ocenjeno</option>
                                <option value="name">Naziv (A-Z)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                            onClick={() => setMilicaChatOpen(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.2)', borderRadius: '14px', color: 'var(--ssv4-primary)', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}
                        >
                            <Sparkles size={16} /> PITAJ MILICU
                        </button>
                    </div>
                  </div>
                  
                  {/* GRID/LIST TOGGLE TOP RIGHT */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', border: 'none', background: viewMode === 'list' ? 'rgba(142,36,172,0.2)' : 'transparent', color: viewMode === 'list' ? 'var(--ssv4-primary)' : 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 800, cursor: 'pointer', outline: 'none', transition: 'all 0.2s' }}
                        >
                            <ListIcon size={16} /> Lista
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', border: 'none', background: viewMode === 'grid' ? 'rgba(142,36,172,0.2)' : 'transparent', color: viewMode === 'grid' ? 'var(--ssv4-primary)' : 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 800, cursor: 'pointer', outline: 'none', transition: 'all 0.2s' }}
                        >
                            <LayoutGrid size={16} /> Mreža
                        </button>
                      </div>
                  </div>

                  <div className={`results-grid ${viewMode}`}>
                    {results
                      .sort((a, b) => {
                          if (sortBy === 'price') return a.price - b.price;
                          if (sortBy === 'stars') return (b.stars || 0) - (a.stars || 0);
                          if (sortBy === 'name') return a.name.localeCompare(b.name);
                          return 0;
                      })
                      .filter(r => {
                        // Common name filter
                        const matchesName = r.name.toLowerCase().includes(hotelNameFilter.toLowerCase());

                        if (r.type === 'hotel') {
                            const matchesStars = selectedStars.length === 0 || selectedStars.includes(String(r.stars));
                            const matchesAvailability = selectedAvailability.length === 0 || selectedAvailability.includes(r.availability || 'available');
                            const matchesMeal = selectedMealPlans.includes('all') || selectedMealPlans.length === 0 || 
                                              selectedMealPlans.some(mp => (r.mealPlan || '').toUpperCase().includes(mp.toUpperCase()));
                            return matchesName && matchesStars && matchesAvailability && matchesMeal;
                        } 
                        
                        if (r.type === 'flight' || r.type === 'package') {
                            // Flight Filters
                            let matchesAirlines = true;
                            if (selectedAirlines.length > 0) {
                                if (r.data?.slices) {
                                    matchesAirlines = r.data.slices.some((s: any) => s.segments.some((seg: any) => selectedAirlines.includes(seg.carrierName)));
                                } else if (r.data?.outbound?.segments) {
                                    matchesAirlines = r.data.outbound.segments.some((s: any) => selectedAirlines.includes(s.airline_name));
                                }
                            }

                            let matchesStops = true;
                            if (maxStops !== null) {
                                if (r.data?.slices) {
                                    matchesStops = r.data.slices.every((s: any) => s.stops <= maxStops);
                                } else if (r.data?.outbound?.stops !== undefined) {
                                    matchesStops = r.data.outbound.stops <= maxStops;
                                }
                            }

                            // Time filter check
                            let matchesTime = true;
                            if (timeFilters.outboundDepartureFrom !== '00:00' || timeFilters.outboundDepartureTo !== '24:00') {
                                const depTimeStr = r.data?.slices?.[0]?.departure || r.data?.outbound?.departure_time;
                                if (depTimeStr) {
                                    const depTime = depTimeStr.includes('T') ? depTimeStr.split('T')[1].substring(0, 5) : depTimeStr.substring(0, 5);
                                    matchesTime = depTime >= timeFilters.outboundDepartureFrom && depTime <= timeFilters.outboundDepartureTo;
                                }
                            }

                            return matchesName && matchesAirlines && matchesStops && matchesTime;
                        }

                        return matchesName;
                      })
                      .map((res) => (
                        <div key={res.id} style={{ display: 'contents' }}>
                            {viewMode === 'list' && res.type === 'hotel' ? (
                              <HotelCard 
                                  hotel={res.data}
                                  isSubagent={false}
                                  onOpenDetails={() => {}}
                                  onReserve={() => addToCart(res)}
                                  viewMode={viewMode}
                                  roomAllocations={roomsData}
                                  nights={7}
                                  checkIn={startDate || ''}
                                  checkOut={endDate || ''}
                              />
                            ) : (
                              <motion.div 
                                className={`ssv4-glass-card ${viewMode === 'list' ? 'list-layout' : ''}`}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                whileHover={{ scale: 1.01 }}
                                style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}
                              >
                                {res.provider === 'Amadeus' && (
                                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 12px', background: 'var(--ssv4-primary)', color: 'white', fontSize: '10px', fontWeight: 900, borderBottomLeftRadius: '12px', zIndex: 1 }}>GDS LIVE</div>
                                )}
                                
                                <div className="ssv4-card-content" style={{ display: 'flex', flexDirection: viewMode === 'list' ? 'row' : 'column', alignItems: viewMode === 'list' ? 'center' : 'stretch', gap: '20px', width: '100%', padding: '24px' }}>
                                  
                                  {/* Flight Icon/Logo Section */}
                                  <div className="ssv4-card-icon" style={{ flexShrink: 0, width: '60px', height: '60px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ssv4-primary)' }}>
                                    {res.type === 'package' ? <PackageIcon size={28} /> : <Plane size={28} />}
                                  </div>

                                  <div className="ssv4-card-info" style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <h4 style={{ margin: '0', fontSize: '18px', fontWeight: 900, letterSpacing: '-1px' }}>{res.name}</h4>
                                            
                                            {/* Price Prediction for Flights/Packages */}
                                            {(Number(res.id.substring(0,2)) % 2 === 0 || res.price % 5 === 0) && (
                                                <div className="price-trend-badge" style={{ 
                                                    background: 'rgba(76, 175, 80, 0.15)', 
                                                    color: '#4caf50', 
                                                    padding: '2px 10px', 
                                                    borderRadius: '100px', 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: 900, 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '6px',
                                                    border: '1px solid rgba(76, 175, 80, 0.2)',
                                                    width: 'fit-content'
                                                }}>
                                                    <TrendingUp size={10} /> DOBRA CENA ZA OVE DATUME
                                                </div>
                                            )}
                                            
                                            <div style={{ fontSize: '11px', opacity: 0.5, fontWeight: 700, marginTop: '2px', textTransform: 'uppercase' }}>PROVAJDER: {res.provider}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>€{res.price}</div>
                                            <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: 700 }}>UKUPNA CENA</div>
                                        </div>
                                    </div>

                                    {/* Visual Route (Compact) */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '16px', fontWeight: 900 }}>{res.data?.slices?.[0]?.segments?.[0]?.departure?.split('T')[1]?.substring(0,5) || '10:00'}</div>
                                            <div style={{ fontSize: '11px', opacity: 0.5, fontWeight: 800 }}>{res.data?.slices?.[0]?.origin?.iataCode || 'BEG'}</div>
                                        </div>
                                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Plane size={14} style={{ color: 'var(--ssv4-primary)', position: 'absolute', transform: 'rotate(90deg)' }} />
                                            {res.data?.slices?.[0]?.stops > 0 && (
                                                <div style={{ position: 'absolute', top: '-14px', fontSize: '9px', fontWeight: 800, color: '#ff9800' }}>{res.data.slices[0].stops} PRESEDANJE</div>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '16px', fontWeight: 900 }}>{res.data?.slices?.[0]?.segments?.[res.data.slices[0].segments.length-1]?.arrival?.split('T')[1]?.substring(0,5) || '14:20'}</div>
                                            <div style={{ fontSize: '11px', opacity: 0.5, fontWeight: 800 }}>{res.data?.slices?.[0]?.destination?.iataCode || 'CDG'}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => addToCart(res)}
                                            style={{ flex: 1, padding: '14px', background: 'var(--ssv4-primary)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '13px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 20px rgba(142,36,172,0.3)' }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            IZABERI PONUDU
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setExpandedOfferId(expandedOfferId === res.id ? null : res.id); }}
                                            style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
                                        >
                                            {expandedOfferId === res.id ? <ChevronUp size={20} /> : 'DETALJI'}
                                        </button>
                                    </div>
                                  </div>
                                </div>
                                
                                <AnimatePresence>
                                    {expandedOfferId === res.id && res.data?.slices && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: 'hidden', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                                        >
                                            <div style={{ padding: '24px' }}>
                                                {res.data.slices.map((slice: any, sIdx: number) => (
                                                    <div key={sIdx} style={{ marginBottom: sIdx < res.data.slices.length - 1 ? '32px' : '0' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                                            <div style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '11px', fontWeight: 900, color: 'var(--ssv4-primary)' }}>
                                                                {sIdx === 0 ? 'ODLAZAK' : 'POVRATAK'}
                                                            </div>
                                                            <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)' }} />
                                                            <div style={{ fontSize: '11px', opacity: 0.5, fontWeight: 700 }}>UKUPNO: {slice.duration?.replace('PT', '').toLowerCase() || '2h 15m'}</div>
                                                        </div>

                                                        {slice.segments?.map((seg: any, segIdx: number) => (
                                                            <React.Fragment key={segIdx}>
                                                                <div style={{ display: 'flex', gap: '20px', position: 'relative' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                        <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                            <img src={`https://images.kiwi.com/airlines/64/${seg.carrierCode || 'JU'}.png`} alt={seg.carrierName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                                                        </div>
                                                                        {segIdx < slice.segments.length - 1 && (
                                                                            <div style={{ flex: 1, width: '2px', background: 'dashed rgba(255,255,255,0.1)', margin: '4px 0' }} />
                                                                        )}
                                                                    </div>
                                                                    
                                                                    <div style={{ flex: 1, paddingBottom: segIdx < slice.segments.length - 1 ? '24px' : '0' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                            <div style={{ fontSize: '14px', fontWeight: 800 }}>{seg.carrierName} <span style={{ opacity: 0.5 }}>{seg.flightNumber}</span></div>
                                                                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ssv4-primary)' }}>{res.data.cabinClass || 'Economy'}</div>
                                                                        </div>
                                                                        
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                                                                            <div>
                                                                                <div style={{ fontSize: '18px', fontWeight: 900 }}>{seg.departure?.split('T')[1]?.substring(0,5)}</div>
                                                                                <div style={{ fontSize: '12px', opacity: 0.4 }}>{seg.origin?.iataCode || seg.origin}</div>
                                                                            </div>
                                                                            <ArrowRight size={16} style={{ opacity: 0.2 }} />
                                                                            <div>
                                                                                <div style={{ fontSize: '18px', fontWeight: 900 }}>{seg.arrival?.split('T')[1]?.substring(0,5)}</div>
                                                                                <div style={{ fontSize: '12px', opacity: 0.4 }}>{seg.destination?.iataCode || seg.destination}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                {seg.layover && (
                                                                    <div style={{ margin: '12px 0 12px 60px', padding: '10px 16px', background: 'rgba(255,152,0,0.05)', border: '1px solid rgba(255,152,0,0.1)', borderRadius: '10px', fontSize: '11px', color: '#ff9800', fontWeight: 800 }}>
                                                                        POVEZIVANJE: {seg.layover} u {seg.destination?.iataCode}
                                                                    </div>
                                                                )}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                ))}
                                                
                                                {/* Meta Info: Baggage, TTL */}
                                                <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                                                    <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                                                        <div style={{ fontSize: '10px', opacity: 0.4, fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Dozvoljeni prtljag</div>
                                                        <div style={{ fontSize: '13px', fontWeight: 800 }}>1x 23kg Check-in, 1x 8kg Cabin</div>
                                                    </div>
                                                    <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                                                        <div style={{ fontSize: '10px', opacity: 0.4, fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Važenje ponude (TTL)</div>
                                                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#4caf50' }}>Garantovano sledećih 15 min</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                              </motion.div>
                            )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </>
            ) : (
                <div className="empty-results">
                  <Compass size={48} style={{ opacity: 0.2 }} />
                  <p>Nemamo rezultate pretrage za ovaj upit. Pokušajte da izmenite datume ili destinaciju.</p>
                </div>
            )}
          </div>
        </div>

        <div className="ssv5-sidebar">
          <div className="v5-cart-header">
            <ShoppingCart size={22} color="var(--ssv4-primary)" />
            <h2>MOJA REZERVACIJA</h2>
          </div>

          <div className="v5-cart-items">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.4 }}>
                <ShoppingBag size={32} style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '13px' }}>Vaš izbor je prazan.<br/>Dodajte let ili hotel za početak.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="v5-item-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {item.type === 'hotel' ? <Building2 size={16} color="var(--ssv4-primary)" /> : 
                       item.type === 'insurance' ? <CheckCircle2 size={16} color="#4caf50" /> :
                       <Plane size={16} color="var(--ssv4-primary)" />}
                      <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>
                        {item.type === 'hotel' ? 'SMEŠTAJ' : 
                         item.type === 'insurance' ? 'OSIGURANJE' : 
                         'LET'}
                      </span>
                    </div>
                    <Trash2 
                      size={14} 
                      color="#ef4444" 
                      style={{ cursor: 'pointer', opacity: 0.7 }} 
                      onClick={() => removeFromCart(item.id)}
                    />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '4px' }}>{item.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', opacity: 0.5 }}>{item.type === 'insurance' ? 'FIKSNA CENA' : 'OSNOVNA CENA'}</span>
                    <span style={{ fontWeight: 900, color: item.type === 'insurance' ? '#4caf50' : 'var(--ssv4-primary)' }}>€{item.price}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="v5-cart-footer">
            <div className="v5-total-box">
              <label>UKUPAN IZNOS</label>
              <div className="price">€{totalPrice}</div>
            </div>
            
            <button 
              className="v5-book-btn" 
              disabled={cart.length === 0}
              onClick={handleFinalBook}
            >
              KREIRAJ REZERVACIJU <ArrowRight size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
            </button>
          </div>
        </div>
      </div> {/* Close ssv5-layout */}

      {/* SIDEBARS & OVERLAYS */}
      {isMilicaChatOpen && <MilicaChat />}
      {showHistory && (
        <SearchHistorySidebar 
            searchHistory={searchHistory} 
            onClose={() => setShowHistory(false)} 
            onLoad={(h: any) => {
                const q = h.query;
                setActiveTab(q.tab.charAt(0).toUpperCase() + q.tab.slice(1));
                setDestinationInput(q.destinations?.[0]?.name || '');
                setStartDate(q.checkIn);
                setEndDate(q.checkOut);
                setRoomsData(q.roomAllocations.map((r: any) => ({ adults: r.adults, children: r.childrenAges })));
                setShowHistory(false);
            }}
            onRefresh={() => {}}
            onRemove={(id) => setSearchHistory(prev => prev.filter(x => x.id !== id))}
            onClearAll={() => setSearchHistory([])}
        />
      )}
      
      {/* FLOAT ACTION FOR HISTORY */}
      <button 
          onClick={() => setShowHistory(true)}
          style={{ position: 'fixed', left: '20px', bottom: '20px', width: '50px', height: '50px', borderRadius: '50%', background: 'var(--ssv4-card-bg)', border: '1px solid var(--ssv4-card-border)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1000, boxShadow: 'var(--ssv4-shadow)' }}
      >
          <HistoryIcon size={24} />
      </button>
    </div>
  );
};

export default SmartSearchV5;
