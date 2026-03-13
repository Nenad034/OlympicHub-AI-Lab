import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, AlertTriangle, Info, Calculator, 
    Calendar, Users, Building2, CheckCircle2,
    Search, ChevronDown, X, Loader2, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ModernCalendar } from '../../components/ModernCalendar';
import { useThemeStore } from '../../stores';
import PriceInspector from './PriceInspector';

interface PricingSimulatorProps {
    initialHotel?: string;
}

const PricingSimulator: React.FC<PricingSimulatorProps> = ({ initialHotel }) => {
    const { theme } = useThemeStore();
    
    const [selectedHotel, setSelectedHotel] = useState(initialHotel || '');
    const [selectedPricelist, setSelectedPricelist] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('ALL');
    const [selectedService, setSelectedService] = useState('HB');
    
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
    const [showCalendar, setShowCalendar] = useState(false);

    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [childAges, setChildAges] = useState<number[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [showCombinations, setShowCombinations] = useState(false);
    const [selectedInspectionItem, setSelectedInspectionItem] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'INVALID'>('ALL');

    const PRICELISTS = [
        { 
            id: 'pl-vespera-24', 
            hotelId: 'HR-LOS-305', 
            hotel: 'Hotel Vespera', 
            title: 'NETTO PRICES 2024 - OFFICIAL', 
            rooms: [
                'STANDARD PARK STRANA',
                'STANDARD MORSKA STRANA',
                'STANDARD PLUS PARK STRANA',
                'STANDARD PLUS MORSKA STRANA',
                'OBITELJSKA SOBA PARK STRANA',
                'OBITELJSKA SOBA MORSKA STRANA'
            ], 
            services: ['HB'] 
        }
    ];

    const [pricelistSearch, setPricelistSearch] = useState('');
    const [isPricelistListOpen, setIsPricelistListOpen] = useState(false);

    const filteredPricelists = PRICELISTS.filter(pl => 
        pl.hotel.toLowerCase().includes(pricelistSearch.toLowerCase()) || 
        pl.hotelId.toLowerCase().includes(pricelistSearch.toLowerCase()) ||
        pl.title.toLowerCase().includes(pricelistSearch.toLowerCase())
    );

    const calculateForRoom = (roomType: string, occAdults: number, occChildren: number, occAges: number[]) => {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (nights <= 0) return null;

        const getPricePerRoom = (date: Date, rt: string) => {
            const m = date.getMonth(); 
            const d = date.getDate();

            const isP1 = (m === 2 && d >= 28) || (m === 3 && d <= 25) || (m === 8 && d >= 23) || (m === 9 && d <= 5);
            const isP2 = (m === 3 && d >= 26) || (m === 4 && d <= 7) || (m === 8 && d >= 8 && d <= 22);
            const isP3 = (m === 4 && d >= 8) || (m === 5 && d <= 14);
            const isP4 = (m === 5 && d >= 15 && d <= 30) || (m === 7 && d >= 26) || (m === 8 && d <= 7);
            const isP5 = (m === 6) || (m === 7 && d <= 25);

            const seasonIndex = isP5 ? 4 : (isP4 ? 3 : (isP3 ? 2 : (isP2 ? 1 : 0)));
            const minStay = [2, 2, 2, 3, 5][seasonIndex];

            const roomRates: Record<string, number[]> = {
                'STANDARD PARK STRANA': [134, 146, 159, 185, 228],
                'STANDARD MORSKA STRANA': [146, 157, 171, 200, 244],
                'STANDARD PLUS PARK STRANA': [174, 191, 208, 241, 297],
                'STANDARD PLUS MORSKA STRANA': [191, 205, 222, 261, 318],
                'OBITELJSKA SOBA PARK STRANA': [229, 249, 264, 334, 411],
                'OBITELJSKA SOBA MORSKA STRANA': [246, 270, 285, 356, 434]
            };

            return { 
                price: roomRates[rt] ? roomRates[rt][seasonIndex] : 0, 
                minStay 
            };
        };

        let totalGross = 0;
        let dayCounter = new Date(start);
        let maxMinStay = 0;

        for (let i = 0; i < nights; i++) {
            const { price, minStay } = getPricePerRoom(new Date(dayCounter), roomType);
            if (minStay > maxMinStay) maxMinStay = minStay;
            totalGross += price;
            dayCounter.setDate(dayCounter.getDate() + 1);
        }

        let isValid = true;
        let message = "OK";

        if (nights < maxMinStay) {
            isValid = false;
            message = `Min stay: ${maxMinStay}`;
        }

        if (roomType.includes('STANDARD') && !roomType.includes('PLUS')) {
            if (occAdults > 2 || occChildren > 1) {
                isValid = false;
                message = "Max 2+1 (Kid <5y)";
            } else if (occChildren === 1 && occAges[0] > 5) {
                isValid = false;
                message = "Kid age > 5y";
            }
        }

        return {
            roomType,
            isValid,
            message,
            total: totalGross,
            net: totalGross * 0.85,
            profit: totalGross * 0.15,
            nights,
            checkIn,
            checkOut,
            adults: occAdults,
            children: occChildren,
            childAges: occAges,
            service: selectedService,
            hotelName: selectedHotel || 'Hotel Vespera'
        };
    };

    const handleSimulate = () => {
        setIsCalculating(true);
        setTimeout(() => {
            const roomsToCalc = selectedRoom === 'ALL' ? PRICELISTS[0].rooms : [selectedRoom];
            const newResults = roomsToCalc.map(r => calculateForRoom(r, adults, children, childAges)).filter(Boolean);
            setResults(newResults);
            setIsCalculating(false);
            setShowCombinations(false);
        }, 300);
    };

    const handleCombinations = () => {
        setIsCalculating(true);
        setTimeout(() => {
            const roomsToCalc = selectedRoom === 'ALL' ? PRICELISTS[0].rooms : [selectedRoom];
            const combinationsResults: any[] = [];
            
            const occs = [
                { a: 1, c: 0, ages: [] },
                { a: 2, c: 0, ages: [] },
                { a: 2, c: 1, ages: [4] },
                { a: 2, c: 1, ages: [10] },
                { a: 3, c: 0, ages: [] }
            ];

            roomsToCalc.forEach(r => {
                occs.forEach(o => {
                    const res = calculateForRoom(r, o.a, o.c, o.ages);
                    if (res) combinationsResults.push(res);
                });
            });

            setResults(combinationsResults);
            setIsCalculating(false);
            setShowCombinations(true);
        }, 500);
    };

    return (
        <div className="simulator-v2-container" style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ 
                background: 'var(--bg-card)', 
                borderRadius: '20px', 
                border: '1px solid var(--glass-border)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1.5, minWidth: '300px', position: 'relative' }}>
                        <label style={labelStyle}>Cenovnik / Hotel</label>
                        <div style={{ position: 'relative' }}>
                            <Search style={iconInInputStyle} size={18} />
                            <input 
                                className="glass-input" 
                                style={{ ...inputStyle, paddingLeft: '45px' }}
                                placeholder="Pretraži cenovnike..." 
                                value={pricelistSearch}
                                onChange={e => { setPricelistSearch(e.target.value); setIsPricelistListOpen(true); }}
                                onFocus={() => setIsPricelistListOpen(true)}
                            />
                            {isPricelistListOpen && (
                                <div className="dropdown-panel" style={dropdownStyle}>
                                    {filteredPricelists.map(pl => (
                                        <div key={pl.id} className="dropdown-item" style={dropdownItemStyle} onClick={() => {
                                            setSelectedPricelist(pl.id);
                                            setSelectedHotel(pl.hotel);
                                            setPricelistSearch(pl.hotel);
                                            setIsPricelistListOpen(false);
                                        }}>
                                            <Building2 size={14} style={{ marginRight: '10px', opacity: 0.6 }} />
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{pl.hotel}</div>
                                                <div style={{ fontSize: '11px', opacity: 0.5 }}>{pl.title}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ flex: 1, minWidth: '220px' }}>
                        <label style={labelStyle}>Period Boravka</label>
                        <div onClick={() => setShowCalendar(true)} style={selectorBoxStyle}>
                            <Calendar size={18} color="var(--accent-cyan)" />
                            <span style={{ fontWeight: 700 }}>{formatDate(checkIn)} — {formatDate(checkOut)}</span>
                        </div>
                    </div>

                    <div style={{ flex: 1, minWidth: '220px' }}>
                        <label style={labelStyle}>Tip Smeštaja</label>
                        <select className="glass-input" style={{ ...inputStyle, height: '52px' }} value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
                            <option value="ALL">Sve Sobe (ALL)</option>
                            {PRICELISTS[0].rooms.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    <div style={{ flex: 0.6, minWidth: '140px' }}>
                        <label style={labelStyle}>Vrsta Usluge</label>
                        <select className="glass-input" style={{ ...inputStyle, height: '52px' }} value={selectedService} onChange={e => setSelectedService(e.target.value)}>
                            {PRICELISTS[0].services.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div style={{ flex: 0.8, minWidth: '180px' }}>
                        <label style={labelStyle}>Status Filtera</label>
                        <select className="glass-input" style={{ ...inputStyle, height: '52px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                            <option value="ALL">Svi rezultati</option>
                            <option value="VALID">Samo dozvoljeni</option>
                            <option value="INVALID">Samo nedozvoljeni</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1.5, minWidth: '300px' }}>
                        <label style={labelStyle}>Putnici</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)', marginRight: '5px' }}>
                                <Users size={20} />
                            </div>
                            <div style={occInputGroup}>
                                <span style={occLabel}>ADL</span>
                                <input 
                                    type="number" 
                                    value={adults || ''} 
                                    onChange={e => setAdults(e.target.value === '' ? 0 : parseInt(e.target.value, 10))} 
                                    onFocus={e => e.target.select()}
                                    style={occInput} 
                                />
                            </div>
                            <div style={occInputGroup}>
                                <span style={occLabel}>CHD</span>
                                <input 
                                    type="number" 
                                    value={children || ''} 
                                    onChange={e => setChildren(e.target.value === '' ? 0 : parseInt(e.target.value, 10))} 
                                    onFocus={e => e.target.select()}
                                    style={occInput} 
                                />
                            </div>
                            {Array.from({length: children}).map((_, i) => (
                                <div key={i} style={{ ...occInputGroup, background: 'rgba(0, 229, 255, 0.05)', borderColor: 'rgba(0, 229, 255, 0.2)' }}>
                                    <span style={occLabel}>AGE {i+1}</span>
                                    <input 
                                        type="number" 
                                        value={childAges[i] || ''} 
                                        onChange={e => {
                                            const n = [...childAges];
                                            n[i] = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                            setChildAges(n);
                                        }} 
                                        onFocus={e => e.target.select()}
                                        style={occInput} 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleSimulate} style={primaryButtonStyle}>
                            {isCalculating ? <Loader2 className="spin" size={18} /> : <Calculator size={18} />}
                            SIMULIRAJ
                        </button>
                        <button onClick={handleCombinations} style={secondaryButtonStyle}>
                            <Zap size={18} />
                            KOMBINACIJE
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '400px' }}>
                {results.length === 0 && !isCalculating && (
                    <div style={emptyStateStyle}>
                        <Info size={40} style={{ opacity: 0.3 }} />
                        <p>Pokrenite simulaciju za prikaz rezultata</p>
                    </div>
                )}
                
                {results
                    .filter(res => {
                        if (statusFilter === 'VALID') return res.isValid;
                        if (statusFilter === 'INVALID') return !res.isValid;
                        return true;
                    })
                    .map((res, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={`${res.roomType}-${i}`}
                        onClick={() => setSelectedInspectionItem(res)}
                        style={{
                            ...stripStyle,
                            borderLeft: `4px solid ${res.isValid ? 'var(--accent-cyan)' : '#ef4444'}`,
                            background: selectedInspectionItem === res ? 'rgba(0, 229, 255, 0.08)' : 'var(--bg-card)',
                            opacity: res.isValid ? 1 : 0.8
                        }}
                    >
                        <div style={{ flex: 2, minWidth: '200px' }}>
                            <div style={{ fontWeight: 800, fontSize: '13px' }}>{res.roomType}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Building2 size={10} /> {res.hotelName}
                            </div>
                        </div>

                        <div style={{ flex: 1.5, display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={stripMetric}>
                                <span style={stripMetricLabel}>PERIOD</span>
                                <span style={stripMetricValue}>{res.nights}n</span>
                            </div>
                            <div style={stripMetric}>
                                <span style={stripMetricLabel}>PUTNICI</span>
                                <span style={stripMetricValue}>
                                    {res.adults}AD {res.children > 0 ? `+ ${res.children}CH` : ''}
                                    {res.children > 0 && (
                                        <span style={{ fontSize: '11px', opacity: 0.6, marginLeft: '5px' }}>
                                            ({res.childAges.slice(0, res.children).join(', ')})
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>

                        <div style={{ flex: 2, display: 'flex', justifyContent: 'flex-end', gap: '30px', alignItems: 'center' }}>
                            {res.isValid ? (
                                <>
                                    <div style={stripMetric}>
                                        <span style={stripMetricLabel}>NETO</span>
                                        <span style={{ ...stripMetricValue, color: 'var(--text-secondary)' }}>{res.net.toFixed(2)}€</span>
                                    </div>
                                    <div style={stripMetric}>
                                        <span style={stripMetricLabel}>PROFIT</span>
                                        <span style={{ ...stripMetricValue, color: 'var(--accent-gold)' }}>+{res.profit.toFixed(2)}€</span>
                                    </div>
                                    <div style={{ ...stripMetric, textAlign: 'right', minWidth: '100px' }}>
                                        <span style={{ ...stripMetricLabel, color: 'var(--accent-cyan)' }}>UKUPNO</span>
                                        <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent-cyan)' }}>{res.total.toFixed(2)}€</span>
                                    </div>
                                </>
                            ) : (
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px 15px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertTriangle size={16} />
                                    CENA NIJE DOSTUPNA: {res.message}
                                </div>
                            )}
                        </div>

                        <div style={{ width: '80px', textAlign: 'right' }}>
                            {res.isValid && (
                                <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end', fontSize: '11px', fontWeight: 800 }}>
                                    <CheckCircle2 size={14} /> OK
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {showCalendar && (
                <ModernCalendar 
                    startDate={checkIn} 
                    endDate={checkOut} 
                    onChange={(s, e) => { setCheckIn(s); setCheckOut(e); }} 
                    onClose={() => setShowCalendar(false)} 
                />
            )}

            {selectedInspectionItem && (
                <PriceInspector 
                    item={selectedInspectionItem} 
                    onClose={() => setSelectedInspectionItem(null)} 
                />
            )}
        </div>
    );
};

const labelStyle = { 
    display: 'block', 
    marginBottom: '8px', 
    fontSize: '11px', 
    fontWeight: 800, 
    color: 'var(--text-secondary)', 
    textTransform: 'uppercase' as const 
};

const inputStyle = { 
    width: '100%', 
    height: '52px', 
    fontSize: '14px', 
    fontWeight: 600, 
    background: 'rgba(128, 128, 128, 0.08)', 
    border: '1px solid var(--glass-border)', 
    borderRadius: '12px', 
    color: 'var(--text-primary)', 
    padding: '0 16px', 
    outline: 'none' 
};

const iconInInputStyle = { 
    position: 'absolute' as const, 
    left: '16px', 
    top: '50%', 
    transform: 'translateY(-50%)', 
    opacity: 0.4 
};

const selectorBoxStyle = { 
    height: '52px', 
    background: 'rgba(128, 128, 128, 0.08)', 
    border: '1px solid var(--glass-border)', 
    borderRadius: '12px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    padding: '0 20px',
    cursor: 'pointer',
    color: 'var(--text-primary)'
};

const dropdownStyle = { 
    position: 'absolute' as const, 
    top: '100%', 
    left: 0, 
    right: 0, 
    zIndex: 1000, 
    background: 'var(--bg-card)', 
    backdropFilter: 'blur(30px)',
    border: '1px solid var(--accent-cyan)', 
    borderRadius: '12px', 
    marginTop: '6px', 
    maxHeight: '300px', 
    overflowY: 'auto' as const, 
    boxShadow: '0 20px 40px rgba(0,0,0,0.6)' 
};

const dropdownItemStyle = { 
    padding: '12px 20px', 
    cursor: 'pointer', 
    borderBottom: '1px solid var(--glass-border)', 
    display: 'flex', 
    alignItems: 'center',
    color: 'var(--text-primary)'
};

const occInputGroup = { 
    display: 'flex', 
    flexDirection: 'column' as const, 
    alignItems: 'center', 
    gap: '6px',
    padding: '10px 15px',
    minWidth: '80px',
    background: 'rgba(128, 128, 128, 0.05)',
    borderRadius: '12px',
    border: '1px solid var(--glass-border)'
};

const occLabel = { 
    fontSize: '10px', 
    fontWeight: 800, 
    color: 'var(--text-secondary)', 
    textTransform: 'uppercase' as const,
    letterSpacing: '1px'
};

const occInput = { 
    width: '100%', 
    background: 'none', 
    border: 'none', 
    color: 'var(--text-primary)', 
    fontSize: '18px', 
    fontWeight: 900, 
    textAlign: 'center' as const, 
    outline: 'none',
    padding: '0'
};

const primaryButtonStyle = { 
    background: 'var(--accent-cyan)', 
    color: '#000', 
    border: 'none', 
    borderRadius: '12px', 
    padding: '0 32px', 
    height: '52px', 
    fontWeight: 900, 
    fontSize: '14px',
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px', 
    boxShadow: '0 10px 25px rgba(0,229,255,0.25)',
    textTransform: 'uppercase' as const,
    transition: 'all 0.2s'
};

const secondaryButtonStyle = { 
    background: 'rgba(128, 128, 128, 0.1)', 
    color: 'var(--text-primary)', 
    border: '1px solid var(--glass-border)', 
    borderRadius: '12px', 
    padding: '0 24px', 
    height: '52px', 
    fontWeight: 700, 
    fontSize: '14px',
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px',
    textTransform: 'uppercase' as const,
    transition: 'all 0.2s'
};

const stripStyle = { 
    padding: '16px 24px', 
    borderRadius: '16px', 
    border: '1px solid var(--glass-border)', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '20px', 
    transition: 'all 0.2s', 
    cursor: 'pointer',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    marginBottom: '8px'
};

const stripMetric = { 
    display: 'flex', 
    flexDirection: 'column' as const, 
    gap: '2px' 
};

const stripMetricLabel = { 
    fontSize: '9px', 
    fontWeight: 800, 
    color: 'var(--text-secondary)', 
    textTransform: 'uppercase' as const 
};

const stripMetricValue = { 
    fontSize: '14px', 
    fontWeight: 700,
    color: 'var(--text-primary)'
};

const emptyStateStyle = { 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column' as const, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '15px', 
    border: '2px dashed var(--glass-border)', 
    borderRadius: '25px', 
    opacity: 0.5, 
    color: 'var(--text-secondary)',
    marginTop: '40px'
};

const formatDate = (iso: string) => iso.split('-').reverse().join('/');

export default PricingSimulator;
