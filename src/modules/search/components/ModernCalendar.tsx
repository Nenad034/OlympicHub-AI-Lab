import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModernCalendarProps {
  onClose: () => void;
  onSelectDates: (from: string, to: string, nights: number) => void;
}

export const ModernCalendar: React.FC<ModernCalendarProps> = ({ onClose, onSelectDates }) => {
  const [activeTab, setActiveTab] = useState<'dates' | 'flexible'>('dates');
  const [stayType, setStayType] = useState<'weekend' | 'week' | 'month'>('week');
  const [startDate, setStartDate] = useState<number | null>(15); // Default to some dates for demo
  const [endDate, setEndDate] = useState<number | null>(22);
  const [startMonth, setStartMonth] = useState(0); // 0 = March, 1 = April
  const [activeFlex, setActiveFlex] = useState('Exact dates');

  const months = [
    { name: 'Mart', year: '2026', days: 31, offset: 0 },
    { name: 'April', year: '2026', days: 30, offset: 3 },
    { name: 'Maj', year: '2026', days: 31, offset: 5 },
    { name: 'Jun', year: '2026', days: 30, offset: 1 },
    { name: 'Jul', year: '2026', days: 31, offset: 3 },
    { name: 'Avgust', year: '2026', days: 31, offset: 6 }
  ];

  const handleDateClick = (day: number, monthIdx: number) => {
    const absoluteDay = monthIdx * 100 + day; // Simple way to track day across months for this mock
    
    if (!startDate || (startDate && endDate)) {
      setStartDate(absoluteDay);
      setEndDate(null);
    } else if (absoluteDay < startDate) {
      setStartDate(absoluteDay);
    } else {
      setEndDate(absoluteDay);
    }
  };

  const handleApply = () => {
    if (startDate && endDate) {
      const sM = Math.floor(startDate / 100);
      const sD = startDate % 100;
      const eM = Math.floor(endDate / 100);
      const eD = endDate % 100;

      // Calculate nights using real Date objects
      const d1 = new Date(2026, sM + 2, sD); // Mart is 2 in JS Date (0-indexed)
      const d2 = new Date(2026, eM + 2, eD);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const flexSuffix = activeFlex !== 'Exact dates' ? ` (${activeFlex})` : '';
      onSelectDates(`${sD}. ${months[sM].name}`, `${eD}. ${months[eM].name}${flexSuffix}`, nights);
    } else if (startDate) {
      const sM = Math.floor(startDate / 100);
      const sD = startDate % 100;
      onSelectDates(`${sD}. ${months[sM].name}`, `-`, 1);
    }
    onClose();
  };

  return (
    <div className="ms-popover ms-calendar-popover" style={{
      position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
      marginTop: '15px', background: 'var(--ms-panel)', borderRadius: '32px',
      padding: '30px', boxShadow: 'var(--ms-shadow)', width: '850px', zIndex: 1100,
      border: '1px solid var(--ms-border)', backdropFilter: 'blur(20px)'
    }}>
      
      {/* Tabs Switcher */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
        <div style={{ background: 'var(--ms-glass)', padding: '4px', borderRadius: '100px', display: 'flex' }}>
          <button 
            onClick={() => setActiveTab('dates')}
            style={{ 
              padding: '10px 30px', borderRadius: '100px', border: 'none', 
              background: activeTab === 'dates' ? 'var(--ms-panel)' : 'transparent',
              color: 'var(--ms-text)', fontWeight: 700, cursor: 'pointer',
              boxShadow: activeTab === 'dates' ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
              transition: '0.3s'
            }}
          >
            Datumi
          </button>
          <button 
            onClick={() => setActiveTab('flexible')}
            style={{ 
              padding: '10px 30px', borderRadius: '100px', border: 'none', 
              background: activeTab === 'flexible' ? 'var(--ms-panel)' : 'transparent',
              color: 'var(--ms-text)', fontWeight: 700, cursor: 'pointer',
              boxShadow: activeTab === 'flexible' ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
              transition: '0.3s'
            }}
          >
            Fleksibilno
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dates' ? (
          <motion.div 
            key="dates"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          >
            <div style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>
               {/* Current Month */}
               <div style={{ width: '320px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                     <button onClick={() => setStartMonth(Math.max(0, startMonth - 1))} style={{ background: 'none', border: 'none', color: 'var(--ms-text)', cursor: 'pointer' }}>
                        <ChevronLeft size={20} />
                     </button>
                     <span style={{ fontWeight: 800 }}>{months[startMonth].name} {months[startMonth].year}</span>
                     <div style={{ width: 20 }}></div>
                  </div>
                  <CalendarGrid 
                    daysCount={months[startMonth].days} 
                    offset={months[startMonth].offset}
                    monthIdx={startMonth}
                    startDate={startDate}
                    endDate={endDate}
                    onDateClick={handleDateClick}
                  />
               </div>

               {/* Next Month */}
               <div style={{ width: '320px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                     <div style={{ width: 20 }}></div>
                     <span style={{ fontWeight: 800 }}>{months[startMonth+1]?.name} {months[startMonth+1]?.year}</span>
                     <button onClick={() => setStartMonth(Math.min(months.length - 2, startMonth + 1))} style={{ background: 'none', border: 'none', color: 'var(--ms-text)', cursor: 'pointer' }}>
                        <ChevronRight size={20} />
                     </button>
                  </div>
                  <CalendarGrid 
                    daysCount={months[startMonth+1]?.days || 30} 
                    offset={months[startMonth+1]?.offset || 0}
                    monthIdx={startMonth + 1}
                    startDate={startDate}
                    endDate={endDate}
                    onDateClick={handleDateClick}
                  />
               </div>
            </div>

            {/* Flex Options at the bottom */}
            <div style={{ 
              display: 'flex', gap: '8px', marginTop: '30px', 
              borderTop: '1px solid var(--ms-border)', paddingTop: '20px', 
              flexWrap: 'wrap', justifyContent: 'center' 
            }}>
               {['Exact dates', '± 1 day', '± 2 days', '± 3 days', '± 7 days', '± 14 days'].map(opt => (
                 <button 
                  key={opt} 
                  onClick={() => setActiveFlex(opt)}
                  style={{
                    padding: '8px 16px', borderRadius: '100px', 
                    border: activeFlex === opt ? '1.5px solid black' : '1px solid var(--ms-border)',
                    background: 'none', color: 'var(--ms-text)', fontSize: '12px', 
                    fontWeight: 600, cursor: 'pointer', transition: '0.2s'
                 }}>
                   {opt}
                 </button>
               ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="flex"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            style={{ textAlign: 'center' }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Ostanite {stayType === 'weekend' ? 'vikend' : stayType === 'week' ? 'nedelju dana' : 'mesec dana'}</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
               {['weekend', 'week', 'month'].map(t => (
                 <button 
                  key={t}
                  onClick={() => setStayType(t as any)}
                  style={{
                    padding: '12px 24px', borderRadius: '100px', 
                    border: stayType === t ? '2px solid var(--ms-brand-purple)' : '1px solid var(--ms-border)',
                    background: stayType === t ? 'var(--ms-glass)' : 'none', color: 'var(--ms-text)', fontWeight: 700, cursor: 'pointer',
                    textTransform: 'capitalize', transition: '0.3s'
                  }}
                 >
                   {t === 'weekend' ? 'Vikend' : t === 'week' ? 'Nedelja' : 'Mesec'}
                 </button>
               ))}
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Idite bilo kada</h3>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px', paddingLeft: '20px' }}>
               {months.map(m => (
                 <div key={m.name} style={{
                    minWidth: '120px', height: '140px', border: '1px solid var(--ms-border)', borderRadius: '16px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    cursor: 'pointer', transition: 'all 0.2s', background: 'var(--ms-glass)'
                 }} className="month-card-hover">
                    <CalIcon size={24} color="var(--ms-brand-purple)" />
                    <div style={{ fontSize: '13px', fontWeight: 800 }}>{m.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ms-text-sec)' }}>{m.year}</div>
                 </div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ms-text-sec)' }}>
        <X size={20} />
      </button>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px', gap: '10px', borderTop: '1px solid var(--ms-border)', paddingTop: '20px' }}>
         <button 
          className="ms-btn-primary" 
          onClick={handleApply} 
          style={{ padding: '12px 40px', borderRadius: '100px' }}
         >
           Primeni
         </button>
      </div>
    </div>
  );
};

const CalendarGrid = ({ daysCount, offset, monthIdx, startDate, endDate, onDateClick }: any) => {
  const days = ['N', 'P', 'U', 'S', 'Č', 'P', 'S'];
  const grid = Array.from({ length: daysCount }, (_, i) => i + 1);

  const isSelected = (d: number) => {
    const val = monthIdx * 100 + d;
    return val === startDate || val === endDate;
  };

  const isInRange = (d: number) => {
    const val = monthIdx * 100 + d;
    if (!startDate || !endDate) return false;
    return val > startDate && val < endDate;
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '10px' }}>
        {days.map(d => <span key={d} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ms-text-sec)' }}>{d}</span>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0px' }}>
        {Array.from({ length: offset }).map((_, i) => <div key={i} />)}
        {grid.map(d => {
          const selected = isSelected(d);
          const range = isInRange(d);
          return (
            <div 
              key={d} 
              onClick={() => onDateClick(d, monthIdx)}
              style={{
                height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                position: 'relative',
                background: range ? 'rgba(142, 36, 172, 0.1)' : 'transparent',
                color: selected ? 'white' : 'var(--ms-text)',
                borderRadius: selected ? '50%' : '0',
                transition: '0.2s'
              }}
            >
              {selected && (
                <motion.div 
                  layoutId="selectedDay"
                  style={{ position: 'absolute', inset: '4px', background: 'black', borderRadius: '50%', zIndex: -1 }}
                />
              )}
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
};
