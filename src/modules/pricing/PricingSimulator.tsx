import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, AlertTriangle, Info, Calculator, 
    Calendar, Users, Building2, Ticket, CheckCircle2,
    Search, ChevronDown, Utensils, X, Shield
} from 'lucide-react';
import { PricingEngine } from './pricingEngine';
import type { OccupancyRequirement } from './pricingEngine';
import { ModernCalendar } from '../../components/ModernCalendar';
import { useThemeStore } from '../../stores';

interface PricingSimulatorProps {
    initialHotel?: string;
}

const PricingSimulator: React.FC<PricingSimulatorProps> = ({ initialHotel }) => {
    const { theme } = useThemeStore();
    const isLight = theme !== 'navy' && !document.body.classList.contains('dark-mode');
    
    const [selectedHotel, setSelectedHotel] = useState(initialHotel || '');
    const [selectedPricelist, setSelectedPricelist] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
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
    const [results, setResults] = useState<any>(null);

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

    useEffect(() => {
        if (selectedPricelist) {
            simulate();
        }
    }, [selectedPricelist, selectedRoom, selectedService, checkIn, checkOut, adults, children, childAges]);

    const simulate = () => {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (nights <= 0) return;

        // VERIFIED DATA FROM IMAGE (Vespera 2024)
        const getPricePerRoom = (date: Date, roomType: string) => {
            const m = date.getMonth(); 
            const d = date.getDate();
            const year = date.getFullYear();

            // Season mapping (P1-P5)
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
                price: roomRates[roomType] ? roomRates[roomType][seasonIndex] : 0, 
                minStay 
            };
        };

        let totalGross = 0;
        let dayCounter = new Date(start);
        const calcItems: any[] = [];
        let maxMinStay = 0;

        calcItems.push({ type: 'header', label: 'OBRAČUN PO SOBI (HB)' });

        for (let i = 0; i < nights; i++) {
            const { price, minStay } = getPricePerRoom(new Date(dayCounter), selectedRoom);
            if (minStay > maxMinStay) maxMinStay = minStay;
            
            totalGross += price;
            dayCounter.setDate(dayCounter.getDate() + 1);
        }

        calcItems.push({ 
            type: 'person', 
            label: `Najam sobe (${nights} noći)`, 
            price: totalGross,
            note: "Naplata po sobi (ne po osobi)" 
        });

        // Validation logic
        let isValid = true;
        let message = "";

        if (nights < maxMinStay) {
            isValid = false;
            message = `Minimalni boravak za ovaj period je ${maxMinStay} noći. Vaš boravak je ${nights} noći.`;
        }

        // Capacity validation based on image text
        if (selectedRoom.includes('STANDARD') && !selectedRoom.includes('PLUS')) {
            if (adults > 2 || children > 1) {
                isValid = false;
                message = "Standard soba: Maksimalno 2 odrasle osobe i 1 dete do 5 god.";
            } else if (children === 1 && childAges[0] > 5) {
                isValid = false;
                message = "Dete u Standard sobi ne može biti starije od 5 godina.";
            }
        }

        if (selectedRoom.includes('STANDARD PLUS')) {
            if (adults > 2 || children > 1) {
                isValid = false;
                message = "Standard Plus soba: Maksimalno 2 odrasle osobe i 1 dete do 12 god.";
            } else if (children === 1 && childAges[0] > 12) {
                isValid = false;
                message = "Dete u Standard Plus sobi ne može biti starije od 12 godina.";
            }
        }

        const breakdown = [
            `Tip obračuna: PO SOBI PO DANU`,
            `Status: ${isValid ? 'Validno' : 'Greška u validaciji'}`,
            `Sezonski min stay: ${maxMinStay} noći`
        ];

        setResults({
            isValid,
            message,
            total: totalGross,
            net: totalGross * 0.85, // Mock net
            profit: totalGross * 0.15,
            breakdown,
            calcItems,
            nights
        });
    };

    const formatDate = (iso: string) => {
        if (!iso) return '';
        return iso.split('-').reverse().join('/');
    };

    return (
        <div className="simulator-container animate-in-up" style={{ padding: '20px 0' }}>
            <div className="glass-card" style={{ padding: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: 'var(--accent-cyan)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Calculator size={24} color="#000" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Vespera Smart Simulator (Verified)</h3>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Obračun po sobi prema uvezenom dokumentu 2024</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setSelectedPricelist('');
                            setSelectedRoom('');
                            setAdults(2);
                            setChildren(0);
                            setChildAges([]);
                            setResults(null);
                            setPricelistSearch('');
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)', color: '#fca5a5', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        <X size={16} />
                        Poništi Pretragu
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        <div className="form-group" style={{ position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>1. Pretraga Cenovnika (Vespera 2024)</label>
                            <div style={{ position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={18} />
                                <input 
                                    className="glass-input" 
                                    style={{ width: '100%', paddingLeft: '45px', paddingRight: '45px', height: '55px' }}
                                    placeholder="Ukucajte Vespera..."
                                    value={pricelistSearch}
                                    onChange={(e) => {
                                        setPricelistSearch(e.target.value);
                                        setIsPricelistListOpen(true);
                                    }}
                                    onFocus={() => setIsPricelistListOpen(true)}
                                />
                                {selectedPricelist && (
                                    <X 
                                        style={{ position: 'absolute', right: '45px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, cursor: 'pointer' }} 
                                        size={16} 
                                        onClick={() => {
                                            setSelectedPricelist('');
                                            setSelectedRoom('');
                                            setPricelistSearch('');
                                        }}
                                    />
                                )}
                                <ChevronDown style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={18} />
                            </div>

                            {isPricelistListOpen && (
                                <div style={{ 
                                    position: 'absolute', 
                                    top: '100%', 
                                    left: 0, 
                                    right: 0, 
                                    zIndex: 100, 
                                    background: '#151b2d', 
                                    border: '1px solid var(--accent-cyan)', 
                                    borderRadius: '12px', 
                                    marginTop: '5px', 
                                    maxHeight: '300px', 
                                    overflowY: 'auto',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                }}>
                                    {filteredPricelists.map(pl => (
                                        <div 
                                            key={pl.id}
                                            onClick={() => {
                                                setSelectedPricelist(pl.id);
                                                setSelectedHotel(pl.hotel);
                                                setSelectedRoom('');
                                                setPricelistSearch(`${pl.hotel} (${pl.hotelId})`);
                                                setIsPricelistListOpen(false);
                                            }}
                                            style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 229, 255, 0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ fontWeight: 700, fontSize: '14px' }}>{pl.hotel}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{pl.title}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>2. Putnici (Odrasli + Deca)</label>
                            <div style={{ display: 'flex', gap: '15px', background: 'rgba(0,0,0,0.4)', padding: '15px 25px', borderRadius: '15px', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
                                <Users size={20} color="var(--accent-cyan)" />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>ADULTS</span>
                                    <input type="number" value={adults} onChange={e => setAdults(Number(e.target.value))} style={{ width: '50px', background: 'none', border: 'none', color: '#fff', fontSize: '18px', fontWeight: 800, textAlign: 'center' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>KIDS</span>
                                    <input type="number" value={children} onChange={e => setChildren(Number(e.target.value))} style={{ width: '50px', background: 'none', border: 'none', color: '#fff', fontSize: '18px', fontWeight: 800, textAlign: 'center' }} />
                                </div>
                                {children > 0 && Array.from({length: children}).map((_, i) => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <span style={{ fontSize: '10px', color: 'var(--accent-cyan)' }}>{`AGE ${i+1}`}</span>
                                        <input type="number" value={childAges[i] || ''} onChange={e => {
                                            const newAges = [...childAges];
                                            newAges[i] = Number(e.target.value);
                                            setChildAges(newAges);
                                        }} style={{ width: '40px', background: 'rgba(0,229,255,0.1)', border: '1px solid var(--accent-cyan)', borderRadius: '5px', color: '#fff', textAlign: 'center' }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>3. Period Boravka</label>
                            <div onClick={() => setShowCalendar(true)} style={{ display: 'flex', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '15px 25px', borderRadius: '15px', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>
                                <Calendar size={20} color="var(--accent-cyan)" />
                                <div style={{ fontSize: '16px', fontWeight: 800 }}>{formatDate(checkIn)} — {formatDate(checkOut)}</div>
                            </div>
                            {showCalendar && (
                                <ModernCalendar startDate={checkIn} endDate={checkOut} onChange={(start, end) => { setCheckIn(start); setCheckOut(end); }} onClose={() => setShowCalendar(false)} />
                            )}
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>4. Tip Smeštaja (Iz cenovnika)</label>
                            <select className="glass-input" style={{ width: '100%', height: '55px' }} value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
                                <option value="">Izaberite tip sobe sa slike...</option>
                                {PRICELISTS[0].rooms.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {!results ? (
                            <div style={{ flex: 1, border: '2px dashed var(--glass-border)', borderRadius: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                <Info size={40} style={{ marginBottom: '20px' }} />
                                <div>Čeka se kalkulacija...</div>
                            </div>
                        ) : (
                            <div className="results-panel" style={{ flex: 1, background: 'rgba(15, 23, 42, 0.95)', borderRadius: '25px', border: `1px solid ${results.isValid ? 'var(--accent-cyan)' : '#ef4444'}`, padding: '30px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', color: results.isValid ? '#16a34a' : '#ef4444' }}>
                                    {results.isValid ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                                    <span style={{ fontWeight: 800, fontSize: '14px', textTransform: 'uppercase' }}>{results.isValid ? 'Validna Simulacija' : 'Greška u Pravilima'}</span>
                                </div>

                                {!results.isValid && (
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '12px', color: '#fca5a5', fontSize: '13px', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                        {results.message}
                                    </div>
                                )}

                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '15px', marginBottom: '25px' }}>
                                    {results.calcItems.map((item: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: item.type === 'header' ? '10px' : '5px' }}>
                                            <span style={{ fontSize: item.type === 'header' ? '11px' : '13px', color: item.type === 'header' ? 'var(--accent-cyan)' : '#fff', fontWeight: item.type === 'header' ? 800 : 400 }}>{item.label}</span>
                                            {item.price > 0 && <span style={{ fontWeight: 800 }}>{Math.round(item.price)}€</span>}
                                        </div>
                                    ))}
                                    <div style={{ height: '1px', background: 'var(--glass-border)', margin: '15px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: 900 }}>
                                        <span>UKUPNO:</span>
                                        <span style={{ color: 'var(--accent-cyan)' }}>{Math.round(results.total)}€</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {results.breakdown.map((b: string, i: number) => (
                                        <div key={i} style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
                                            {b}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingSimulator;
