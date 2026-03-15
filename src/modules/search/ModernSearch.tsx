import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../stores';
import { ModernCalendar } from './components/ModernCalendar';
import { PassengerInput } from './components/PassengerInput';
import { ResultCard } from './components/ResultCard';
import { SmartSearchInput } from './components/SmartSearchInput';
import { ModernAIChat } from './components/ModernAIChat';
import { useSearchOrchestrator } from './hooks/useSearchOrchestrator';
import { 
  X, Plane, Car, MapPin, Hotel, Check, Info, Sparkles, UserPlus, Minus, Ticket
} from 'lucide-react';
import './styles/ModernSearch.css';

const ModernSearch: React.FC = () => {
  const { state, setState, startSearch } = useSearchOrchestrator();
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [isDeepDive, setIsDeepDive] = useState(false);
  const [showPax, setShowPax] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Selection state for Section 9 logic
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);

  const nights = state.dates.nights || 7;

  // Body scroll lock
  useEffect(() => {
    if (isDeepDive) document.body.classList.add('is-deep-dive-lock');
    else document.body.classList.remove('is-deep-dive-lock');
    return () => document.body.classList.remove('is-deep-dive-lock');
  }, [isDeepDive]);

  const handleSelectHotel = (hotel: any) => {
    setSelectedHotel(hotel);
    setIsDeepDive(true);
  };

  return (
    <div className={`ms-container ${isDeepDive ? 'is-deep-dive-active' : ''}`}>
      
      {/* 1. LANDING PAGE - NATIVE INTEGRATION */}
      <div className="ms-landing-hero" style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '32px', marginBottom: '40px' }}>
           {['Smeštaj', 'Letovi', 'Paketi'].map((t, i) => (
             <button key={t} className={`ms-tab-link ${i === 0 ? 'active' : ''}`} style={{ background: 'none', border: 'none', padding: '8px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', borderBottom: i === 0 ? '3px solid var(--ms-brand-purple)' : 'none', color: i === 0 ? 'var(--ms-brand-purple)' : '#64748b' }}>
               {t}
             </button>
           ))}
        </div>

        <SmartSearchInput 
           onSearch={startSearch}
           destination={state.destination?.name || ''}
           onDestinationChange={(val) => setState({...state, destination: { ...state.destination, name: val } as any})}
           dates={state.dates.from ? `${state.dates.from} - ${state.dates.to}` : '11. Jul - 18. Jul'}
           guests={`${state.pax.reduce((acc, r) => acc + r.adults + r.children, 0)} Putnika`}
           onPaxClick={() => setShowPax(true)}
           onDateClick={() => setShowCalendar(true)}
        />
        
        {showCalendar && <ModernCalendar onClose={() => setShowCalendar(false)} onSelectDates={(f, t, n) => setState({...state, dates: { from: f, to: t, nights: n }})} />}
        {showPax && <PassengerInput rooms={state.pax} onUpdate={(p) => setState({...state, pax: p})} onClose={() => setShowPax(false)} />}
      </div>

      {/* 2. RESULTS GRID */}
      <div className="ms-grid-area" style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
           {[
             { id: '1', name: 'Hotel Splendid Conference', location: 'Budva, CG', stars: 5, price: 185, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', provider: 'Direct', rating: 4.7, category: 'Resort' },
             { id: '2', name: 'One&Only Portonovi', location: 'Herceg Novi, CG', stars: 5, price: 1200, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', provider: 'Direct', rating: 5.0, category: 'Ultra Luxury' },
             { id: '3', name: 'Regent Porto Montenegro', location: 'Tivat, CG', stars: 5, price: 420, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80', provider: 'Direct', rating: 4.8, category: 'Luxury' }
           ].map(h => (
             <ResultCard key={h.id} hotel={h as any} onSelect={handleSelectHotel} isSelected={selectedHotel?.id === h.id} />
           ))}
        </div>
      </div>

      {/* 3. TWIN-WING COMMAND CENTER (Section 9: NATIVE) */}
      <AnimatePresence>
        {isDeepDive && selectedHotel && (
          <motion.div 
            initial={{ x: 1000, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: 1000, opacity: 0 }}
            className="ms-twin-wings"
          >
            {/* WING A: KONFIGURATOR (530px) */}
            <div className="ms-wing ms-wing-config">
              <div className="ms-wing-header">
                <button onClick={() => setIsDeepDive(false)} style={{ position: 'absolute', right: '24px', top: '24px', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', zIndex: 10 }}><X size={16}/></button>
                <h2>Konfigurator</h2>
                <p>Personalizacija toka rezervacije</p>
              </div>
              <div className="ms-wing-content">
                <div className="ms-selection-label"><Sparkles size={14} color="var(--ms-brand-purple)"/> AI Selekcija Smeštaja</div>
                
                {/* Native AI Flow Integration */}
                <ModernAIChat 
                  forceOpen={true} 
                  hotelName={selectedHotel.name}
                  initialOptions={[
                    { id: 'r1', name: 'Standard Double Room', description: 'Udobna soba sa pogledom na park.', boards: [
                      { label: 'Noćenje sa doručkom', type: 'ND', price: 350 },
                      { label: 'Polupansion', type: 'HB', price: 395 },
                      { label: 'All Inclusive', type: 'AI', price: 470 }
                    ]},
                    { id: 'r2', name: 'Deluxe Sea View', description: 'Direktan pogled na more i privatni balkon.', boards: [
                      { label: 'Noćenje sa doručkom', type: 'ND', price: 500 },
                      { label: 'Polupansion', type: 'HB', price: 545 },
                      { label: 'All Inclusive', type: 'AI', price: 620 }
                    ]}
                  ]}
                />

                <div className="ms-selection-label" style={{ marginTop: '40px' }}><Plane size={14} color="var(--ms-brand-purple)"/> Avio prevoz</div>
                <div 
                  className={`ms-op-card ${selectedFlightId === 'f1' ? 'selected' : ''}`}
                  onClick={() => setSelectedFlightId(selectedFlightId === 'f1' ? null : 'f1')}
                >
                   <div className="ms-op-info">
                     <div className="ms-op-title">Air Serbia (Povratni let)</div>
                     <div className="ms-op-sub">BEG ✈ TIV · 18:20 - 19:15</div>
                   </div>
                   <div className="ms-op-price">€115</div>
                </div>

                <div className="ms-selection-label" style={{ marginTop: '32px' }}><Car size={14} color="var(--ms-brand-purple)"/> Transfer</div>
                <div 
                  className={`ms-op-card ${selectedTransferId === 't1' ? 'selected' : ''}`}
                  onClick={() => setSelectedTransferId(selectedTransferId === 't1' ? null : 't1')}
                >
                   <div className="ms-op-info">
                     <div className="ms-op-title">Privatni Sedan Transfer</div>
                     <div className="ms-op-sub">Od aerodroma do hotela · Mercedes C</div>
                   </div>
                   <div className="ms-op-price">+€25</div>
                </div>

                <div className="ms-selection-label" style={{ marginTop: '32px' }}><Ticket size={14} color="var(--ms-brand-purple)"/> Izleti i Ulaznice</div>
                <div className="ms-op-card">
                   <div className="ms-op-info">
                     <div className="ms-op-title">Krstarenje Bokom</div>
                     <div className="ms-op-sub">Celo-dnevni izlet brodom</div>
                   </div>
                   <div className="ms-op-price">€45</div>
                </div>
              </div>
            </div>

            {/* WING B: DOSIJE (430px) */}
            <div className="ms-wing ms-wing-dossier">
              <div className="ms-wing-header">
                 <div style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px', marginBottom: '4px' }}>DOKUMENTACIJA</div>
                 <h2>Digitalni Dosije</h2>
                 <p>Pregled vaše selekcije</p>
              </div>
              <div className="ms-wing-content">
                
                <div className="ms-dossier-card" style={{ background: '#f8fafc', border: 'none' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                     <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--ms-brand-purple)' }}>SOBA 1 (2 AD)</span>
                     <Check size={14} color="var(--ms-brand-purple)"/>
                   </div>
                   <div style={{ fontSize: '14px', fontWeight: 800 }}>Standard Double Room</div>
                   <div style={{ fontSize: '11px', color: '#64748b' }}>Noćenje sa doručkom (ND)</div>
                </div>

                <div className="ms-dossier-card">
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                     <span style={{ fontSize: '11px', fontWeight: 900, opacity: 0.5 }}>SOBA 2 (2 AD)</span>
                     <Minus size={14} color="#cbd5e1"/>
                   </div>
                   <div style={{ fontSize: '14px', fontWeight: 800, opacity: 0.5 }}>Nije odabrano</div>
                   <button className="ms-fill-data-btn" style={{ marginTop: '20px' }}><UserPlus size={14}/> Popuni podatke</button>
                </div>

                {/* Fixed Total Area */}
                <div className="ms-total-section">
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>UKUPNO ZA UPLATU</div>
                        <div style={{ fontSize: '36px', fontWeight: 950, letterSpacing: '-1px' }}>€{185 + (selectedFlightId ? 115 : 0) + (selectedTransferId ? 25 : 0)}</div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '10px', fontWeight: 700, color: '#22c55e' }}>Taxes included</div>
                   </div>
                   <button style={{ width: '100%', height: '64px', borderRadius: '18px', background: 'var(--ms-brand-purple)', color: 'white', border: 'none', fontWeight: 950, fontSize: '14px', cursor: 'pointer', boxShadow: '0 20px 40px rgba(142, 36, 172, 0.3)' }}>
                      POTVRDI REZERVACIJU
                   </button>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernSearch;
