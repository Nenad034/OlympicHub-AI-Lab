import React, { useState } from 'react';
import { 
    LayoutDashboard, Users, CreditCard, History, 
    ArrowRight, MapPin, Calendar, Star, Building2,
    CheckCircle2, AlertCircle, Clock, Hash, Receipt, 
    Wallet, TrendingUp, Printer, FileText, ChevronRight,
    Plane, Bus, Ship, Utensils, Info, Landmark, EyeOff, Eye,
    Lock, Unlock, ShieldAlert, Key, Zap
} from 'lucide-react';
import type { Dossier, TripItem, ActivityLog, CustomerType, BookingSource } from '../../types/reservationArchitect';
import { formatDate } from '../../utils/dateUtils';
import { getEffectiveMealPlan } from '../../utils/mealPlanUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { contactService, type Contact } from '../../services/contactService';
import { Search, Globe, Phone as PhoneIcon, Mail as MailIcon, Smartphone, Laptop, Layout, Repeat, User, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useEffect } from 'react';

interface SummaryTabProps {
    dossier: Dossier;
    setDossier: (d: Dossier) => void;
    totalBrutto: number;
    totalPaid: number;
    balance: number;
    isSummaryNotepadView: boolean;
    setIsSummaryNotepadView: (v: boolean) => void;
    addLog: (title: string, message: string, type: ActivityLog['type']) => void;
    setPolicyToShow: (policy: { item: TripItem; idx: number } | null) => void;
    handlePrint: () => void;
    setActiveSection: (s: string) => void;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ 
    dossier, setDossier, totalBrutto, totalPaid, balance, 
    isSummaryNotepadView, setIsSummaryNotepadView,
    addLog, setPolicyToShow, handlePrint, setActiveSection
}) => {
    const [showProfit, setShowProfit] = useState(false);
    const [isSeifOpen, setIsSeifOpen] = useState(false);
    const [seifPass, setSeifPass] = useState('');

    const daysToDeparture = Math.ceil((new Date(dossier.tripItems[0]?.checkIn || Date.now()).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    // Profit Calculation
    const totalNetto = dossier.tripItems.reduce((acc, item) => acc + (item.netPrice || 0), 0);
    const profitAmount = totalBrutto - totalNetto;
    const profitPercent = totalBrutto > 0 ? (profitAmount / totalBrutto) * 100 : 0;

    const checkSeif = () => {
        if (seifPass.toLowerCase() === 'profit') {
            setShowProfit(true);
            setIsSeifOpen(false);
            setSeifPass('');
            addLog('Sistem', 'Secret Profit View aktiviran', 'info');
        } else {
            setSeifPass('');
        }
    };

    const renderTripIcon = (type: string) => {
        switch (type) {
            case 'Avio karte': return <Plane size={24} />;
            case 'Bus': return <Bus size={24} />;
            case 'Krstarenje': return <Ship size={24} />;
            default: return <Building2 size={24} />;
        }
    };

    const { userLevel, impersonatedSubagent } = useAuthStore();
    const isSubagentPortal = userLevel === 3 || !!impersonatedSubagent;

    // AUTO-DETECT SUBAGENT ON PORTAL
    useEffect(() => {
        if (isSubagentPortal && dossier.customerType !== 'B2B-Subagent') {
            const subId = impersonatedSubagent?.id || 'sub-001'; // Fallback or detect from auth
            
            // Logic to auto-fill partner data
            const loadPartnerData = async () => {
                const results = await contactService.getAll();
                const partner = results.find((c: Contact) => c.id === subId || c.type === 'Subagent');
                if (partner) {
                    selectClient(partner);
                    setDossier({ ...dossier, customerType: 'B2B-Subagent', subagentId: subId });
                }
            };
            loadPartnerData();
        }
    }, [isSubagentPortal]);

    const [isSearchingClient, setIsSearchingClient] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Contact[]>([]);

    const handleSearchClient = async (term: string) => {
        setClientSearchTerm(term);
        if (term.length > 2) {
            setIsSearchingClient(true);
            const all = await contactService.getAll();
            const filtered = all.filter((c: Contact) => 
                (c.fullName || '').toLowerCase().includes(term.toLowerCase()) || 
                (c.firmName || '').toLowerCase().includes(term.toLowerCase()) ||
                (c.pib || '').includes(term)
            );
            setSearchResults(filtered);
            setIsSearchingClient(false);
        } else {
            setSearchResults([]);
        }
    };

    const selectClient = (c: Contact) => {
        const isExempt = c.country && c.country.toLowerCase() !== 'srbija';
        setDossier({
            ...dossier,
            customerType: c.type === 'Subagent' ? 'B2B-Subagent' : (c.type === 'Legal' ? 'B2B-Corporate' : 'B2C-Direct'),
            isTaxExempt: isExempt || false,
            booker: {
                ...dossier.booker,
                fullName: c.fullName || `${c.firstName} ${c.lastName}`,
                address: c.address || '',
                city: c.city || '',
                country: c.country || 'Srbija',
                companyPib: c.pib || '',
                companyName: c.firmName || '',
                idNumber: c.mb || c.passportNo || '',
                phone: c.phone || '',
                email: c.email || ''
            }
        });
        setSearchResults([]);
        setClientSearchTerm('');
        addLog('Sistem', `Povučeni podaci klijenta: ${c.fullName || c.firmName}`, 'success');
    };

    const getCommissionInfo = () => {
        if (dossier.customerType !== 'B2B-Subagent') return { rate: 15, rule: 'B2C (Standardna marža 15%)' };
        
        // Priority 1: Special Rule (Mock check for 'Slovenska Plaza' as example)
        if (dossier.tripItems.some((i: TripItem) => i.subject.includes('Slovenska Plaza'))) {
            return { rate: 13, rule: 'Specijalni Izuzetak: Slovenska Plaza Akcija' };
        }

        // Priority 2: Pricing Matrix
        const subagentCategory = 'Premium'; 
        const categoryRate = 12; 
        return { rate: categoryRate, rule: `Cenovna Matrica (${subagentCategory})` };
    };

    const commInfo = getCommissionInfo();

    const navy = '#1e293b';
    const silverBorder = 'rgba(30, 41, 59, 0.1)';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: navy }}>
            
            {/* SMART CLIENT MATRIX - NOVA SEKCIJA ZA VRSTU KUPCA I KANAL PRODAJE */}
            <div className="v4-table-card" style={{ background: 'white', padding: '24px', border: `1px solid ${silverBorder}`, borderTop: `4px solid ${navy}`, borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                    
                    {/* LEFT: TIP KUPCA & KANAL */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 950, opacity: 0.5, letterSpacing: '1px' }}>1. VRSTA KUPCA & IZVOR REZERVACIJE</div>
                        
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {[
                                { id: 'B2C-Direct', label: 'B2C Direktan', icon: <User size={14} />, color: '#00bcd4' },
                                { id: 'B2C-Web', label: 'B2C Web/Sajt', icon: <Laptop size={14} />, color: '#10b981' },
                                { id: 'B2B-Subagent', label: 'B2B Subagent', icon: <Repeat size={14} />, color: '#fbbf24' },
                                { id: 'B2B-Corporate', label: 'B2B Korporativni', icon: <Building2 size={14} />, color: '#a855f7' }
                            ].map(type => {
                                const isLocked = isSubagentPortal && type.id !== 'B2B-Subagent';
                                return (
                                    <button
                                        key={type.id}
                                        disabled={isLocked}
                                        onClick={() => setDossier({ ...dossier, customerType: type.id as CustomerType })}
                                        style={{ 
                                            padding: '10px 16px', borderRadius: '12px', border: dossier.customerType === type.id ? `2px solid ${type.color}` : `1px solid ${silverBorder}`,
                                            background: dossier.customerType === type.id ? `${type.color}10` : 'white', color: dossier.customerType === type.id ? type.color : navy,
                                            fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', cursor: isLocked ? 'not-allowed' : 'pointer', 
                                            transition: 'all 0.2s', opacity: isLocked ? 0.3 : 1
                                        }}
                                    >
                                        {isLocked ? <Lock size={12} /> : type.icon} {type.label}
                                    </button>
                                );
                            })}
                        </div>

                        {dossier.customerType.startsWith('B2C') && (
                            <div style={{ display: 'flex', gap: '8px', animation: 'slideIn 0.3s ease' }}>
                                {[
                                    { id: 'Phone', label: 'Telefon', icon: <PhoneIcon size={12} /> },
                                    { id: 'Email', label: 'Email', icon: <MailIcon size={12} /> },
                                    { id: 'WhatsApp/Viber', label: 'Viber', icon: <Smartphone size={12} /> },
                                    { id: 'Website', label: 'Sajt', icon: <Globe size={12} /> },
                                    { id: 'External Portal', label: 'Portal', icon: <Layout size={12} /> }
                                ].map(source => (
                                    <button
                                        key={source.id}
                                        onClick={() => setDossier({ ...dossier, bookingSource: source.id as BookingSource })}
                                        style={{ 
                                            padding: '6px 12px', borderRadius: '8px', border: dossier.bookingSource === source.id ? `1.5px solid ${navy}` : `1px solid ${silverBorder}`,
                                            background: dossier.bookingSource === source.id ? navy : 'white', color: dossier.bookingSource === source.id ? 'white' : navy,
                                            fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                                        }}
                                    >
                                        {source.icon} {source.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: SMART CLIENT SEARCH & TAX STATUS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '10px', fontWeight: 950, opacity: 0.5, letterSpacing: '1px' }}>2. PRETRAGA BAZE KUPACA</div>
                            {dossier.isTaxExempt && (
                                <div style={{ fontSize: '9px', fontWeight: 900, color: '#10b981', background: '#10b98115', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Globe size={12} /> OSLOBOĐENO POREZA (INO)
                                </div>
                            )}
                        </div>
                        
                        <div style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                    <input 
                                        type="text" placeholder="Pretraži klijente / firme / subagente po PIB-u ili nazivu..." 
                                        value={clientSearchTerm}
                                        onChange={(e) => handleSearchClient(e.target.value)}
                                        style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: `1px solid ${silverBorder}`, background: '#f8fafc', fontSize: '13px', fontWeight: 700, outline: 'none' }}
                                    />
                                </div>
                                <button style={{ padding: '0 16px', borderRadius: '12px', background: navy, color: 'white', border: 'none', fontWeight: 800, fontSize: '11px', cursor: 'pointer' }}>NOVI KLIJENT</button>
                            </div>

                            {/* SEARCH OVERLAY */}
                            <AnimatePresence>
                                {searchResults.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '16px', marginTop: '8px', border: `1px solid ${silverBorder}`, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', zIndex: 100, overflow: 'hidden' }}>
                                        {searchResults.map((c, i) => (
                                            <div 
                                                key={i} onClick={() => selectClient(c)}
                                                style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: i === searchResults.length - 1 ? 'none' : `1px solid ${silverBorder}`, transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                            >
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: 800 }}>{c.type === 'Legal' || c.type === 'Subagent' ? c.firmName : c.fullName}</div>
                                                    <div style={{ fontSize: '10px', opacity: 0.5 }}>{c.type} • {c.pib ? `PIB: ${c.pib}` : c.email} • {c.city}, {c.country}</div>
                                                </div>
                                                <div style={{ color: '#00bcd4' }}><ChevronRight size={18} /></div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
            
            <AnimatePresence mode="wait">
                {!isSummaryNotepadView ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
                    >
                        {/* TOP ROW: Quick Stats - LIGHT STYLE */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                            
                            {/* PROFIT & NETTO CARD (SAFE PROTECTED) */}
                            <div className="v4-table-card" style={{ position: 'relative', padding: '24px', display: 'flex', gap: '20px', alignItems: 'center', background: showProfit ? 'rgba(168, 85, 247, 0.02)' : 'white', border: showProfit ? '2px solid rgba(168, 85, 247, 0.3)' : `1px solid ${silverBorder}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: showProfit ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'rgba(30,41,59,0.05)', color: showProfit ? 'white' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {showProfit ? <Zap size={24} /> : <Lock size={24} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    {!showProfit ? (
                                        <>
                                            <div style={{ fontSize: '9px', fontWeight: 950, opacity: 0.4, letterSpacing: '1px' }}>ADMINISTRATIVNI PODACI</div>
                                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#cbd5e1', marginTop: '4px' }}>SEF ZAKLJUČAN</div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ fontSize: '9px', fontWeight: 950, color: dossier.customerType === 'B2B-Subagent' ? '#fbbf24' : '#a855f7', letterSpacing: '1px' }}>
                                                    {dossier.customerType === 'B2B-Subagent' ? 'PROVIZIJA SUBAGENTA' : 'PROFIT MARGINA'}
                                                </div>
                                                {dossier.customerType === 'B2B-Subagent' && (
                                                    <div title={commInfo.rule} style={{ color: '#fbbf24', cursor: 'help' }}>
                                                        <HelpCircle size={10} />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '20px', fontWeight: 950, color: '#1e293b' }}>
                                                {dossier.customerType === 'B2B-Subagent' ? commInfo.rate : profitPercent.toFixed(1)}% 
                                                <div style={{ fontSize: '11px', color: dossier.customerType === 'B2B-Subagent' ? '#fbbf24' : '#a855f7', fontWeight: 800 }}>
                                                    {dossier.customerType === 'B2B-Subagent' ? ((totalBrutto * commInfo.rate) / 100).toLocaleString() : profitAmount.toLocaleString()} {dossier.finance.currency}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* SEIF INTERACTION */}
                                {!showProfit ? (
                                    <button 
                                        onClick={() => setIsSeifOpen(!isSeifOpen)}
                                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: isSeifOpen ? navy : '#f8fafc', color: isSeifOpen ? 'white' : navy, border: `1px solid ${silverBorder}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Key size={18} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setShowProfit(false)}
                                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f8fafc', color: '#ef4444', border: `1px solid ${silverBorder}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <EyeOff size={18} />
                                    </button>
                                )}

                                {isSeifOpen && !showProfit && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ position: 'absolute', right: '8px', bottom: '8px', top: '8px', background: 'white', borderRadius: '14px', padding: '6px', border: `2px solid ${navy}`, display: 'flex', gap: '6px', zIndex: 10 }}>
                                        <input 
                                            autoFocus type="password" placeholder="Šifra..." value={seifPass}
                                            onChange={(e) => setSeifPass(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && checkSeif()}
                                            style={{ width: '80px', border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '0 12px', fontSize: '12px', outline: 'none', fontWeight: 900 }}
                                        />
                                        <button onClick={checkSeif} style={{ width: '32px', background: navy, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><ChevronRight size={18} /></button>
                                    </motion.div>
                                )}
                            </div>

                            <div className="v4-table-card" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center', background: 'white', border: `1px solid ${silverBorder}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 950, opacity: 0.5, letterSpacing: '1px' }}>UPLAĆENO OD KLIJENTA</div>
                                    <div style={{ fontSize: '18px', fontWeight: 950 }}>{((totalPaid / totalBrutto) * 100).toFixed(1)}%</div>
                                </div>
                            </div>
                            
                            <div className="v4-table-card" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center', background: 'white', border: `1px solid ${silverBorder}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 950, opacity: 0.5, letterSpacing: '1px' }}>DUGOVANJE / SALDO</div>
                                    <div style={{ fontSize: '18px', fontWeight: 950 }}>{balance.toLocaleString()} <span style={{ fontSize: '12px' }}>{dossier.finance.currency}</span></div>
                                </div>
                            </div>

                            {/* SISTEMSKA IDENTIFIKACIJA */}
                            <div className="v4-table-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: `1px solid ${silverBorder}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderLeft: '4px solid #fbbf24' }}>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 950, opacity: 0.4 }}>CIS KOD / REZERVACIJA</div>
                                    <div style={{ fontSize: '18px', fontWeight: 950 }}>{dossier.cisCode} <span style={{ opacity: 0.3 }}>/</span> {dossier.resCode || '---'}</div>
                                </div>
                                <div style={{ fontSize: '9px', fontWeight: 950, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '6px 12px', borderRadius: '8px' }}>
                                    {daysToDeparture} DANA DO POLASKA
                                </div>
                            </div>
                        </div>

                        {/* THREE COLUMN GRID */}
                        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr 380px', gap: '32px' }}>
                            
                            {/* LEFT: PASSENGER MANIFEST */}
                            <div className="v4-table-card" style={{ padding: '0', background: 'white', border: `1px solid ${silverBorder}`, borderLeft: '4px solid #a855f7' }}>
                                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${silverBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Users size={18} style={{ color: '#a855f7' }} />
                                        <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: navy }}>Manifest Putnika</h3>
                                    </div>
                                    <span style={{ fontSize: '10px', fontWeight: 900, background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '3px 8px', borderRadius: '6px' }}>{dossier.passengers.length} PAX</span>
                                </div>
                                
                                <div className="v4-scroll-area" style={{ height: '400px', padding: '16px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {dossier.passengers.map((p, index) => (
                                                <tr key={p.id} style={{ borderBottom: index === dossier.passengers.length - 1 ? 'none' : `1px solid ${silverBorder}` }}>
                                                    <td style={{ padding: '14px 0' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: 800 }}>{p.firstName} {p.lastName}</div>
                                                        <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: 700 }}>{p.type.toUpperCase()} • {p.birthDate}</div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        {p.isLeadPassenger && <span style={{ fontSize: '8px', fontWeight: 900, background: navy, color: 'white', padding: '2px 6px', borderRadius: '4px' }}>LEAD</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* CENTER: TRIP ITEMS */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '2px', color: navy, opacity: 0.6 }}>SPECIFIKACIJA USLUGA</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {dossier.tripItems.map((item, i) => (
                                        <div key={i} style={{ padding: '24px', background: 'white', border: `1px solid ${silverBorder}`, borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0,188,212,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: navy }}>
                                                        {renderTripIcon(item.type)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '16px', fontWeight: 950, color: navy }}>{item.subject}</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{item.type.toUpperCase()} • {item.city}, {item.country}</div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '18px', fontWeight: 950, color: '#00bcd4' }}>{item.bruttoPrice.toLocaleString()} {item.currency}</div>
                                                    {showProfit && <div style={{ fontSize: '11px', color: '#a855f7', fontWeight: 900, marginTop: '4px' }}>Net: {item.netPrice?.toLocaleString()} {item.currency}</div>}
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px', background: 'rgba(30, 41, 59, 0.02)', borderRadius: '12px', border: `1px solid ${silverBorder}` }}>
                                                <div>
                                                    <div style={{ fontSize: '8px', fontWeight: 950, opacity: 0.5, marginBottom: '4px' }}>TIP SMEŠTAJA / SOBE</div>
                                                    <div style={{ fontSize: '12px', fontWeight: 800 }}>{item.details || 'Standard Room'}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '8px', fontWeight: 950, opacity: 0.5, marginBottom: '4px' }}>TIP USLUGE (MEAL)</div>
                                                    <div style={{ fontSize: '12px', fontWeight: 800 }}>{getEffectiveMealPlan(item.mealPlan)}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '8px', fontWeight: 950, opacity: 0.5, marginBottom: '4px' }}>DOBAVLJAČ (SUPPLIER)</div>
                                                    <div style={{ fontSize: '12px', fontWeight: 800 }}>{item.supplier || 'Direct'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT: FINANSIJSKI REZIME - PROJEKTOVAN ZA PROFIT */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="v4-table-card" style={{ padding: '0', background: 'white', border: `1px solid ${silverBorder}`, borderLeft: '4px solid #00bcd4', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                                    <div style={{ padding: '20px 24px', borderBottom: `1px solid ${silverBorder}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Landmark size={18} style={{ color: '#00bcd4' }} />
                                        <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: navy }}>Finansijski Presek</h3>
                                    </div>
                                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '9px', fontWeight: 950, opacity: 0.4 }}>UKUPNO ZADUŽENJE (BRUTO)</div>
                                                <div style={{ fontSize: '18px', fontWeight: 950, color: navy }}>{totalBrutto.toLocaleString()} {dossier.finance.currency}</div>
                                            </div>
                                            <Receipt size={24} style={{ opacity: 0.1 }} />
                                        </div>

                                        {/* CRITICAL PROFIT FIELDS */}
                                        {showProfit && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(168, 85, 247, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontSize: '9px', fontWeight: 950, color: '#a855f7' }}>NETO ZADUŽENJE (UKUPNO)</div>
                                                        <div style={{ fontSize: '16px', fontWeight: 950, color: navy }}>{totalNetto.toLocaleString()} {dossier.finance.currency}</div>
                                                    </div>
                                                    <ShieldAlert size={18} style={{ opacity: 0.3, color: '#a855f7' }} />
                                                </div>
                                                <div style={{ height: '1px', background: 'rgba(168, 85, 247, 0.1)' }}></div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontSize: '9px', fontWeight: 950, color: '#a855f7' }}>OSTVARENI PROFIT (MARŽA)</div>
                                                        <div style={{ fontSize: '16px', fontWeight: 950, color: '#10b981' }}>+ {profitAmount.toLocaleString()} {dossier.finance.currency} <span style={{ fontSize: '12px', opacity: 0.6 }}>({profitPercent.toFixed(1)}%)</span></div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '9px', fontWeight: 950, color: '#10b981' }}>UKUPNO UPLAĆENO</div>
                                                <div style={{ fontSize: '18px', fontWeight: 950, color: '#10b981' }}>{totalPaid.toLocaleString()} {dossier.finance.currency}</div>
                                            </div>
                                            <Wallet size={24} style={{ opacity: 0.1, color: '#10b981' }} />
                                        </div>

                                        <div style={{ height: '1px', background: silverBorder }}></div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '10px', fontWeight: 950, color: '#ef4444' }}>PREOSTALO ZA NAPLATU</div>
                                                <div style={{ fontSize: '24px', fontWeight: 950, color: '#ef4444' }}>{balance.toLocaleString()} {dossier.finance.currency}</div>
                                            </div>
                                            <div style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '10px', fontWeight: 950 }}>DEBT</div>
                                        </div>
                                    </div>
                                </div>

                                {/* QUICK ACTIONS */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <button onClick={handlePrint} style={{ height: '48px', borderRadius: '12px', border: `1px solid ${silverBorder}`, background: 'white', color: navy, fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <Printer size={16} /> ŠTAMPAJ
                                    </button>
                                    <button onClick={() => setActiveSection('documents')} style={{ height: '48px', borderRadius: '12px', border: `1px solid ${silverBorder}`, background: 'white', color: navy, fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <FileText size={16} /> DOKUMENTI
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="v4-notepad-view">
                        <textarea className="v4-notepad-textarea" style={{ height: '800px', background: '#f8fafc', color: navy, border: `1px solid ${silverBorder}` }} value={dossier.notes.general} readOnly />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
