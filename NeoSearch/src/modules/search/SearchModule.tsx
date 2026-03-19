import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Plane, ShoppingBag, Navigation, Map, Anchor, Compass, Zap, Car, 
  MapPin, CalendarDays, Users, Bus, Clock, CheckCircle2, ChevronLeft, ChevronRight,
  Layout, Star, Zap as AIZap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './SearchModule.css';

// --- Mock Data & Interface ---
export interface Selection { id: string; type: string; name: string; price: number; icon: React.ReactNode; aiSummary?: string; }

export const SEARCH_RESULTS = [
  { id: 'h-1', type: 'Accommodation', name: 'Rixos Premium Magawish', location: 'Hurghada, Egypt', price: 145, rating: 5, tags: ['UAI', 'Luxury'], aiSummary: 'Idealno za porodice.', prediction: 'Only 3 left', icon: <Building2 className="text-bordo" size={24} /> },
  { id: 'h-2', type: 'Accommodation', name: 'Steigenberger ALDAU Beach', location: 'Hurghada, Egypt', price: 125, rating: 5, tags: ['AI', 'Beachfront'], aiSummary: 'Vrhunski spa centar.', prediction: 'High demand', icon: <Building2 className="text-bordo" size={24} /> },
  { id: 'h-4', type: 'Accommodation', name: 'Baron Palace Sahl Hasheesh', location: 'Sahl Hasheesh, Egypt', price: 180, rating: 5, tags: ['UAI', 'Palace'], aiSummary: 'Ultimativni luksuz.', prediction: 'Member Deal', icon: <Building2 className="text-bordo" size={24} /> },
  { id: 'f-1', type: 'Flight', name: 'Air Cairo SM381', location: 'BEG -> HRG', price: 320, rating: 4.5, tags: ['Direct', '7KG Cabin'], aiSummary: 'Najbrži let direktno do Hurgade.', prediction: 'Good price', icon: <Plane className="text-bordo" size={24} /> },
  { id: 'f-2', type: 'Flight', name: 'Turkish Airlines TK1082', location: 'BEG -> IST -> HRG', price: 410, rating: 5, tags: ['1 Stop', '30KG Luggage'], aiSummary: 'Vrhunski komfor.', prediction: 'Premium', icon: <Plane className="text-bordo" size={24} /> },
  { id: 'a-1', type: 'Activity', name: 'Giftun Island Speedboat', location: 'Hurghada Port', price: 65, rating: 5, tags: ['Snorkeling', 'Lunch'], aiSummary: 'Must see!', prediction: 'Popular', icon: <Map className="text-bordo" size={24} /> }
];

interface SearchModuleProps {
  onServiceSelect?: (service: any) => void;
  onSearch?: () => void;
  results?: any[];
}

export const SearchModule: React.FC<SearchModuleProps> = ({ onServiceSelect, onSearch, results = SEARCH_RESULTS }) => {
  const today = new Date();
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('Stays');
  const [packageStep, setPackageStep] = useState(0); 
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRoomsPopover, setShowRoomsPopover] = useState(false);
  const [roomsData, setRoomsData] = useState([{ id: 1, adults: 2, children: [] as number[] }]);
  const [startDate, setStartDate] = useState<number | null>(25);
  const [endDate, setEndDate] = useState<number | null>(27);
  const [dates, setDates] = useState('25 Mar - 27 Mar');
  const [dateFlexibility, setDateFlexibility] = useState('Exact dates');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [viewMonth, setViewMonth] = useState(2); // March
  const [viewYear, setViewYear] = useState(2026);

  const getMonthData = (month: number, year: number) => {
    const name = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month));
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    return { name, daysInMonth, startDay };
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else { setViewMonth(viewMonth + 1); }
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else { setViewMonth(viewMonth - 1); }
  };

  const tabs = [
    { id: 'Stays', label: 'Smeštaj', icon: <Building2 size={22} />, fields: ['city-hotel', 'dates', 'rooms'] },
    { id: 'Flights', label: 'Letovi', icon: <Plane size={22} />, fields: ['from', 'to', 'dates', 'passengers'] },
    { id: 'Packages', label: 'Dinamika', icon: <ShoppingBag size={22} />, fields: ['from', 'to', 'dates', 'rooms'] },
    { id: 'Transfers', label: 'Transferi', icon: <Navigation size={22} />, fields: ['from-to', 'dates', 'time'] },
    { id: 'Things', label: 'Izleti', icon: <Map size={22} />, fields: ['destination', 'dates'] },
    { id: 'Cruises', label: 'Krstarenja', icon: <Anchor size={22} />, fields: ['destination', 'dates', 'cruise-line'] },
    { id: 'Putovanja', label: 'Putovanja', icon: <Compass size={22} />, fields: ['destination', 'dates'] },
    { id: 'Charteri', label: 'Čarteri', icon: <Zap size={22} />, fields: ['from', 'to', 'dates'] },
    { id: 'Cars', label: 'Cars', icon: <Car size={22} />, fields: ['pickup', 'dates'] }
  ];

  const currentTab = tabs.find(t => t.id === searchFilter) || tabs[0];
  
  const handleServiceSelect = (service: any) => {
    setPackageStep((prev: number) => Math.min(prev + 1, 4));
    if (onServiceSelect) onServiceSelect(service);
  };

  const renderFields = () => {
    return currentTab.fields.map((field, idx) => {
      if (field === 'city-hotel') return <div key={idx} className="search-input-field"><label>City or Hotel</label><MapPin size={18} style={{ position: 'absolute', left: '16px', opacity: 0.6 }} /><input type="text" placeholder="Hurgada, Egypt" style={{ height: '64px', border: 'none', background: 'transparent' }} /></div>;
      if (field === 'from') return <div key={idx} className="search-input-field"><label>Leaving from</label><MapPin size={18} style={{ position: 'absolute', left: '16px', opacity: 0.6 }} /><input type="text" defaultValue="Belgrade (BEG)" style={{ height: '64px', border: 'none', background: 'transparent' }} /></div>;
      if (field === 'to') return <div key={idx} className="search-input-field"><label>Going to</label><MapPin size={18} style={{ position: 'absolute', left: '16px', opacity: 0.6 }} /><input type="text" placeholder="Antalya, Turkey" style={{ height: '64px', border: 'none', background: 'transparent' }} /></div>;
      if (field === 'destination') return <div key={idx} className="search-input-field"><label>Destination</label><MapPin size={18} style={{ position: 'absolute', left: '16px', opacity: 0.6 }} /><input type="text" placeholder="Tuscany, Italy" style={{ height: '64px', border: 'none', background: 'transparent' }} /></div>;
      if (field === 'dates') return (
        <div key={idx} style={{ position: 'relative' }}>
          <div className="search-input-field" onClick={() => { setShowCalendar(!showCalendar); setShowRoomsPopover(false); }} style={{ cursor: 'pointer' }}>
            <label>Dates</label>
            <CalendarDays size={18} style={{ position: 'absolute', left: '16px', opacity: 0.6 }} />
            <input type="text" readOnly value={dates || 'Izaberite termine'} style={{ height: '64px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }} />
          </div>
          {showCalendar && (
            <div className="search-popover" style={{ width: '740px', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <button className="glass-card" onClick={prevMonth} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around', padding: '0 40px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800' }}>{getMonthData(viewMonth, viewYear).name} {viewYear}</div>
                  <div style={{ fontSize: '18px', fontWeight: '800' }}>{getMonthData((viewMonth + 1) % 12, viewMonth === 11 ? viewYear + 1 : viewYear).name} {viewMonth === 11 ? viewYear + 1 : viewYear}</div>
                </div>
                <button className="glass-card" onClick={nextMonth} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', cursor: 'pointer' }}><ChevronRight size={20} /></button>
              </div>
              <div className="dual-month-container" style={{ padding: 0, gap: '60px' }}>
                <div className="month-section" style={{ flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} style={{ fontSize: '13px', fontWeight: '600', opacity: 0.6, padding: '12px 0' }}>{d}</div>)}
                    {Array.from({ length: getMonthData(viewMonth, viewYear).startDay }).map((_, i) => <div key={`off-${i}`} />)}
                    {Array.from({ length: getMonthData(viewMonth, viewYear).daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                      const isStart = startDate === day && viewMonth === 2;
                      const isEnd = endDate === day && viewMonth === 2;
                      const isInRange = startDate && endDate && day > startDate && day < endDate && viewMonth === 2;
                      return (
                        <div key={i} onClick={() => {
                          const mName = getMonthData(viewMonth, viewYear).name.substring(0, 3);
                          if (!startDate || (startDate && endDate)) { setStartDate(day); setEndDate(null); setDates(`${day} ${mName}`); }
                          else if (day > startDate) { setEndDate(day); setDates(`${startDate} ${mName} - ${day} ${mName}`); }
                          else { setStartDate(day); setEndDate(null); setDates(`${day} ${mName}`); }
                        }} className={`calendar-day ${isStart || isEnd || (isToday && !startDate) ? 'start-end' : ''} ${isInRange ? 'in-range' : ''}`} style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: (isStart || isEnd || isToday) ? '800' : '500', color: (isStart || isEnd || isToday) ? 'white' : 'inherit', position: 'relative', cursor: 'pointer' }}>
                          {(isToday && !isStart && !isEnd) && <div style={{ position: 'absolute', width: '38px', height: '38px', borderRadius: '12px', border: '2px solid var(--bordo)', zIndex: 0 }} />}
                          <span style={{ zIndex: 1 }}>{day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {['Exact dates', '± 1 day', '± 2 days', '± 3 days', '± 7 days'].map(pill => (
                   <button key={pill} onClick={() => setDateFlexibility(pill)} className={`calendar-pill ${dateFlexibility === pill ? 'active' : ''}`} style={{ padding: '10px 20px', fontSize: '13px', fontWeight: '700' }}>{pill}</button>
                ))}
                <button className="btn-primary" onClick={() => setShowCalendar(false)} style={{ marginLeft: 'auto', padding: '12px 40px' }}>Primeni</button>
              </div>
            </div>
          )}
        </div>
      );
      if (field === 'rooms') return (
        <div key={idx} style={{ position: 'relative' }}>
          <div className="search-input-field" onClick={() => { setShowRoomsPopover(!showRoomsPopover); setShowCalendar(false); }} style={{ cursor: 'pointer' }}>
            <label>Rooms & Travellers</label>
            <Users size={18} style={{ position: 'absolute', left: '16px', opacity: 0.6 }} />
            <input type="text" readOnly value={`${roomsData.length} Room, ${roomsData.reduce((acc: number, r: any) => acc + r.adults + r.children.length, 0)} Putnika`} style={{ height: '64px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }} />
          </div>
          {showRoomsPopover && (
            <div className="search-popover" style={{ width: '420px', left: '0' }}>
              <div className="popover-scroll-area">
                {roomsData.map((room, rIdx) => (
                  <div key={room.id} className="room-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                       <h4 className="room-title" style={{ margin: 0 }}>Soba {rIdx + 1}</h4>
                       {rIdx > 0 && <span onClick={() => setRoomsData(roomsData.filter(r => r.id !== room.id))} style={{ fontSize: '12px', fontWeight: '700', color: 'var(--bordo)', cursor: 'pointer' }}>Ukloni</span>}
                    </div>
                    <div className="room-row">
                       <div><div style={{ fontSize: '14px', fontWeight: '700' }}>Odrasli</div><div style={{ fontSize: '11px', opacity: 0.5 }}>Uzrast 18+</div></div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><button className="counter-btn" onClick={() => { const newRooms = [...roomsData]; newRooms[rIdx].adults = Math.max(1, newRooms[rIdx].adults - 1); setRoomsData(newRooms); }} disabled={room.adults <= 1}>-</button><span style={{ minWidth: '20px', textAlign: 'center', fontWeight: '800' }}>{room.adults}</span><button className="counter-btn" onClick={() => { const newRooms = [...roomsData]; newRooms[rIdx].adults++; setRoomsData(newRooms); }}>+</button></div>
                    </div>
                    <div className="room-row">
                       <div><div style={{ fontSize: '14px', fontWeight: '700' }}>Deca</div><div style={{ fontSize: '11px', opacity: 0.5 }}>Uzrast 0 - 17</div></div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><button className="counter-btn" onClick={() => { const newRooms = [...roomsData]; newRooms[rIdx].children.pop(); setRoomsData(newRooms); }} disabled={room.children.length === 0}>-</button><span style={{ minWidth: '20px', textAlign: 'center', fontWeight: '800' }}>{room.children.length}</span><button className="counter-btn" onClick={() => { const newRooms = [...roomsData]; newRooms[rIdx].children.push(0); setRoomsData(newRooms); }}>+</button></div>
                    </div>
                    {room.children.length > 0 && <div className="age-select-container">{room.children.map((age, cIdx) => (
                      <div key={cIdx}><div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px', opacity: 0.6 }}>Godište deteta {cIdx + 1}</div><select className="age-select" value={age} onChange={(e) => { const newRooms = [...roomsData]; newRooms[rIdx].children[cIdx] = parseInt(e.target.value); setRoomsData(newRooms); }}><option value="0">Ispod 1 god.</option>{Array.from({ length: 17 }).map((_, a) => <option key={a} value={a+1}>{a+1} god.</option>)}</select></div>
                    ))}</div>}
                  </div>
                ))}
                {roomsData.length < 3 && <button className="room-action-link" style={{ border: 'none', background: 'none' }} onClick={() => setRoomsData([...roomsData, { id: Date.now(), adults: 2, children: [] }])}>Dodaj još jednu sobu</button>}
              </div>
              <div className="popover-footer"><div style={{ opacity: 0 }}>Spacer</div><button className="btn-primary" onClick={() => setShowRoomsPopover(false)} style={{ padding: '12px 40px' }}>GOTOVO</button></div>
            </div>
          )}
        </div>
      );
      if (field === 'passengers') return (
        <div key={idx} className="search-input-field" onClick={() => { setShowRoomsPopover(true); setShowCalendar(false); }} style={{ cursor: 'pointer' }}>
          <label>Travellers</label>
          <Users size={18} style={{ position: 'absolute', left: '16px', opacity: 0.6 }} />
          <input type="text" readOnly value={`${roomsData.reduce((acc: number, r: any) => acc + r.adults + r.children.length, 0)} Putnika`} style={{ height: '64px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }} />
        </div>
      );
      if (field === 'from-to') return <div key={idx} className="search-input-field"><label>From - To</label><Bus size={18} style={{ position: 'absolute', left: '16px', opacity: 0.6 }} /><input type="text" placeholder="Airport -> Hotel" style={{ height: '64px', border: 'none', background: 'transparent' }} /></div>;
      if (field === 'pickup') return <div key={idx} className="search-input-field"><label>Pick-up Location</label><MapPin size={18} style={{ position: 'absolute', left: '16px', opacity: 0.6 }} /><input type="text" placeholder="Milan Airport" style={{ height: '64px', border: 'none', background: 'transparent' }} /></div>;
      if (field === 'cruise-line') return <div key={idx} className="search-input-field"><label>Cruise Line</label><Anchor size={18} style={{ position: 'absolute', left: '16px', opacity: 0.6 }} /><input type="text" placeholder="MSC Cruises" style={{ height: '64px', border: 'none', background: 'transparent' }} /></div>;
      if (field === 'time') return <div key={idx} className="search-input-field"><label>Time</label><Clock size={18} style={{ position: 'absolute', left: '16px', opacity: 0.6 }} /><input type="text" placeholder="12:00" style={{ height: '64px', border: 'none', background: 'transparent' }} /></div>;
      return null;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="search-type-tab" style={{ justifyContent: 'center', border: 'none', paddingBottom: '0' }}>
         {tabs.map(tab => (
           <div key={tab.id} className={`type-tab-item ${searchFilter === tab.id ? 'active' : ''}`} onClick={() => setSearchFilter(tab.id)}>
              <div style={{ marginBottom: '4px' }}>{tab.icon}</div>
              <span>{tab.label}</span>
           </div>
         ))}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${currentTab.fields.length}, 1fr) 180px`, 
          gap: '8px', 
          alignItems: 'center', 
          background: 'rgba(255,255,255,0.8)', 
          padding: '8px', 
          borderRadius: '16px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          flex: 1
        }}>
           {renderFields()}
           <button 
             className="btn-primary" 
             style={{ height: '64px', borderRadius: '12px', fontSize: '14px' }}
             onClick={() => onSearch && onSearch()}
           >
             PRETRAGA
           </button>
        </div>
        
        {/* View Mode Toggle */}
        <div style={{ marginLeft: '24px', display: 'flex', background: 'rgba(255,255,255,0.5)', padding: '6px', borderRadius: '14px', gap: '4px' }}>
           <button 
             onClick={() => setViewMode('list')}
             style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', background: viewMode === 'list' ? 'white' : 'transparent', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
             <Layout size={18} color={viewMode === 'list' ? 'var(--bordo)' : '#ccc'} />
           </button>
           <button 
             onClick={() => setViewMode('grid')}
             style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', background: viewMode === 'grid' ? 'white' : 'transparent', cursor: 'pointer', boxShadow: viewMode === 'grid' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
             <ShoppingBag size={18} color={viewMode === 'grid' ? 'var(--bordo)' : '#ccc'} />
           </button>
        </div>
      </div>

      {/* Results Area */}
      <div style={{ marginTop: '8px' }}>
         <div style={{ 
           display: 'grid', 
           gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr', 
           gap: '24px' 
         }}>
            {packageStep < 4 ? (
               results.filter(r => {
                  if (searchFilter === 'Stays') return r.type === 'Accommodation';
                  if (searchFilter === 'Flights') return r.type === 'Flight';
                  if (searchFilter === 'Transfers') return r.type === 'Transfer';
                  if (searchFilter === 'Things') return r.type === 'Activity';
                  return true;
               }).map(res => (
                  <motion.div 
                    key={res.id} 
                    layout 
                    className="glass-card service-selection-card" 
                    style={{ 
                      padding: '0', 
                      overflow: 'hidden', 
                      display: 'flex', 
                      flexDirection: viewMode === 'grid' ? 'column' : 'row',
                      minHeight: viewMode === 'grid' ? '420px' : '150px' 
                    }}
                    onClick={() => {
                       if (res.type === 'Accommodation') {
                          navigate(`/hotel/${res.id}`);
                       }
                    }}
                  >
                     {/* Image Section */}
                     <div style={{ 
                       width: viewMode === 'grid' ? '100%' : '240px', 
                       height: viewMode === 'grid' ? '220px' : 'auto',
                       position: 'relative', 
                       overflow: 'hidden', 
                       background: '#eee' 
                     }}>
                        {res.main_image_url ? (
                          <img src={res.main_image_url} alt={res.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>{res.icon}</div>
                        )}
                        <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', color: 'var(--bordo)' }}>
                           {res.stars ? `${res.stars}★` : res.type}
                        </div>
                     </div>

                     {/* Content Section */}
                     <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                           <div>
                              <h4 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 4px 0' }}>{res.name}</h4>
                              <div style={{ fontSize: '11px', color: 'var(--header-sub)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                 <MapPin size={10} /> {res.location || 'Montenegro'}
                              </div>
                           </div>
                           <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)' }}>€{res.price}</div>
                              <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: '700' }}>OD</div>
                           </div>
                        </div>
                        
                        <p style={{ fontSize: '12px', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '12px 0', opacity: 0.8, lineHeight: '1.6' }}>
                           {res.intro_description || res.description || res.aiSummary}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                           <div style={{ display: 'flex', gap: '6px' }}>
                              {(res.amenity_ids || []).slice(0, 3).map((a: string, i: number) => (
                                <span key={i} style={{ fontSize: '9px', background: 'rgba(128,0,32,0.04)', padding: '4px 8px', borderRadius: '6px', fontWeight: '800', textTransform: 'uppercase' }}>{a}</span>
                              ))}
                           </div>
                           <button 
                             className="btn-primary" 
                             onClick={(e) => { e.stopPropagation(); handleServiceSelect(res); }} 
                             style={{ padding: '12px 24px', fontSize: '11px' }}>
                             REZERVIŠI
                           </button>
                        </div>
                     </div>
                  </motion.div>
               ))
            ) : (
               <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 16px' }} />
                  <h2 style={{ fontSize: '24px' }}>Rezervacija je spremna!</h2>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};
