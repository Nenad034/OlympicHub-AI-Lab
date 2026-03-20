import React from 'react';
import {
    Briefcase, Zap, RefreshCw, MapPin, Star, Clock, ShieldAlert,
    Users, FileText, Mail, Share2, Printer, AlertTriangle,
    Building2, Plane, Compass, Ship, Truck, Globe, Package as PackageIcon, Hash,
    FileEdit, LayoutDashboard, Copy, User, Phone, ChevronRight, Smartphone, MessageCircle, MessagesSquare,
    ExternalLink, Download, ArrowUpRight, CheckCircle2, AlertCircle, Bell, ShieldCheck, TrendingUp, Scale,
    Calendar, ClipboardCheck, Landmark, Receipt, Wallet, ArrowRight, UserCheck
} from 'lucide-react';
import type { Dossier, TripItem, ActivityLog } from '../../types/reservationArchitect';
import { formatDate } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface SummaryTabProps {
    dossier: Dossier;
    setDossier: React.Dispatch<React.SetStateAction<Dossier>>;
    totalBrutto: number;
    totalPaid: number;
    balance: number;
    addLog: (action: string, details: string, type?: ActivityLog['type']) => void;
    setPolicyToShow: (data: { item: TripItem; idx: number } | null) => void;
    handlePrint: () => void;
    setActiveSection: (section: string) => void;
}

export const SummaryTabV5: React.FC<SummaryTabProps> = ({
    dossier, setDossier, totalBrutto, totalPaid, balance,
    addLog, setPolicyToShow, handlePrint, setActiveSection
}) => {

    const renderTripIcon = (type: string) => {
        switch (type) {
            case 'Smestaj': return <Building2 size={24} style={{ color: 'var(--accent-cyan)' }} />;
            case 'Avio karte': return <Plane size={24} style={{ color: 'var(--accent-cyan)' }} />;
            case 'Čarter': return <Zap size={24} style={{ color: '#fbbf24' }} />;
            case 'Transfer': return <Truck size={24} style={{ color: 'var(--accent-cyan)' }} />;
            default: return <Globe size={24} style={{ color: 'var(--accent-cyan)' }} />;
        }
    };

    const daysToDeparture = dossier.tripItems.length > 0
        ? Math.ceil((new Date(dossier.tripItems[0].checkIn).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const totalNet = dossier.tripItems.reduce((sum, item) => sum + (item.netPrice || 0), 0);
    const margin = totalBrutto - totalNet;
    const marginPercent = totalBrutto > 0 ? (margin / totalBrutto) * 100 : 0;

    return (
        <div className="v6-summary-ultimate" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* TOP ROW: CRM & SYSTEM INFO */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                
                {/* UGOVARAČ (CRM) */}
                <div className="v5-card" style={{ padding: '0', borderLeft: '4px solid var(--accent-cyan)', background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.03) 0%, transparent 100%)' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <UserCheck size={18} style={{ color: 'var(--accent-cyan)' }} />
                        <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 950, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Ugovarač Aranžmana</h3>
                    </div>
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                                <User size={32} style={{ color: 'var(--accent-cyan)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '20px', fontWeight: 950, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>{dossier.booker.fullName}</div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {dossier.booker.email}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {dossier.booker.phone}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SISTEMSKA IDENTIFIKACIJA */}
                <div className="v5-card" style={{ padding: '0', borderLeft: '4px solid #fbbf24', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.03) 0%, transparent 100%)' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Hash size={18} style={{ color: '#fbbf24' }} />
                        <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 950, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Sistemska Identifikacija</h3>
                    </div>
                    <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 950, color: 'var(--text-secondary)', letterSpacing: '1px' }}>CIS KOD / REZERVACIJA</div>
                            <div style={{ fontSize: '20px', fontWeight: 950, marginTop: '4px', color: 'var(--text-primary)' }}>{dossier.cisCode} <span style={{ color: '#fbbf24', opacity: 0.5 }}>/</span> {dossier.resCode || '---'}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 950, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '8px 16px', borderRadius: '12px' }}>
                            <Clock size={14} /> {daysToDeparture} DANA DO POLASKA
                        </div>
                    </div>
                </div>
            </div>

            {/* THREE COLUMN GRID: PASSENGERS / ITEMS / FINANCE */}
            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr 400px', gap: '32px' }}>
                
                {/* LEFT: PASSENGER MANIFEST (No-scrollbar style) */}
                <div className="v5-card" style={{ padding: '0', borderLeft: '4px solid #a855f7', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, transparent 100%)' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Users size={20} style={{ color: '#a855f7' }} />
                            <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 950, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Manifest Putnika</h3>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 950, background: 'rgba(168, 85, 247, 0.14)', color: '#a855f7', padding: '4px 10px', borderRadius: '8px' }}>{dossier.passengers.length} PAX</span>
                    </div>
                    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="v5-no-scrollbar">
                        <style>{`.v5-no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                        {dossier.passengers.map((p, idx) => (
                            <div key={p.id} style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 950, color: '#a855f7', opacity: 0.5, width: '20px' }}>{String(idx + 1).padStart(2, '0')}</div>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)' }}>{p.firstName} {p.lastName}</div>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '2px', textTransform: 'uppercase' }}>{p.type} {p.idNumber ? `• ${p.idNumber}` : ''}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CENTER: PLAN PUTOVANJA (STAVKE) */}
                <div className="v5-card" style={{ padding: '0' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Compass size={20} style={{ color: 'var(--accent-cyan)' }} />
                        <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 950, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Plan Putovanja (Stavke)</h3>
                    </div>
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {dossier.tripItems.map((item, i) => (
                            <div key={i} style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(0,229,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', color: 'var(--accent-cyan)' }}>
                                            {renderTripIcon(item.type)}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '18px', fontWeight: 950, color: 'var(--text-primary)' }}>{item.subject}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, marginTop: '2px' }}>{item.type.toUpperCase()} • {item.city}, {item.country}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '20px', fontWeight: 950, color: 'var(--accent-cyan)' }}>{item.bruttoPrice.toLocaleString()} {item.currency}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, marginTop: '2px' }}>{formatDate(item.checkIn)} — {formatDate(item.checkOut)}</div>
                                    </div>
                                </div>
                                
                                {/* EXTENDED SPECIFICATION */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: 950, color: 'var(--accent-cyan)', letterSpacing: '1px', marginBottom: '6px' }}>TIP SMEŠTAJA / SOBE</div>
                                        <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)' }}>{item.details || 'Standard Room'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: 950, color: 'var(--accent-cyan)', letterSpacing: '1px', marginBottom: '6px' }}>TIP USLUGE (MEAL)</div>
                                        <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)' }}>{item.mealPlan || 'No Meals / Only Bed'}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 950, color: 'var(--accent-cyan)', letterSpacing: '1px', marginBottom: '6px' }}>DOBAVLJAČ PREKO</div>
                                        <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)' }}>{item.supplier || 'Direct'}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: FINANSIJSKI REZIME */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="v5-card" style={{ padding: '0', background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, transparent 100%)', border: '1px solid rgba(0, 229, 255, 0.3)', boxShadow: '0 0 40px rgba(0,229,255,0.1)' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Landmark size={20} style={{ color: 'var(--accent-cyan)' }} />
                            <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 950, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Finansijski Obračun</h3>
                        </div>
                        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 950, color: 'var(--text-secondary)', letterSpacing: '1px' }}>UKUPNO ZADUŽENJE (STAVKE)</div>
                                    <div style={{ fontSize: '20px', fontWeight: 950, marginTop: '4px', color: 'var(--text-primary)' }}>{totalBrutto.toLocaleString()} {dossier.finance.currency}</div>
                                </div>
                                <Receipt size={24} style={{ opacity: 0.1, color: 'var(--text-primary)' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 950, color: '#10b981', letterSpacing: '1px' }}>EVIDENTIRANE UPLATE (CASH)</div>
                                    <div style={{ fontSize: '20px', fontWeight: 950, color: '#10b981', marginTop: '4px' }}>{totalPaid.toLocaleString()} {dossier.finance.currency}</div>
                                </div>
                                <Wallet size={24} style={{ opacity: 0.1, color: '#10b981' }} />
                            </div>

                            <div style={{ height: '1px', background: 'var(--glass-border)', margin: '8px 0' }}></div>

                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ fontSize: '10px', fontWeight: 950, color: balance > 0 ? '#ef4444' : '#10b981', letterSpacing: '2px', marginBottom: '8px' }}>PREOSTALI DUG ZA NAPLATU</div>
                                <div style={{ fontSize: '36px', fontWeight: 950, color: balance > 0 ? '#ef4444' : '#10b981', letterSpacing: '-1.5px' }}>
                                    {balance.toLocaleString()} <span style={{ fontSize: '16px', opacity: 0.5 }}>{dossier.finance.currency}</span>
                                </div>
                            </div>

                            <button className="v5-btn v5-btn-primary" onClick={() => setActiveSection('finance')} style={{ width: '100%', height: '60px', borderRadius: '18px', fontSize: '13px', fontWeight: 950, gap: '12px', background: 'var(--accent-cyan)', color: 'black', border: 'none' }}>
                                UPRAVLJAJ UPLATAMA <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* PROFIT MARGIN HELPER */}
                    <div className="v5-card" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '10px', fontWeight: 950, opacity: 0.4, letterSpacing: '1px', color: 'var(--text-secondary)' }}>PROFITNA MARŽA</div>
                                <div style={{ fontSize: '16px', fontWeight: 950, color: '#10b981', marginTop: '4px' }}>+{margin.toLocaleString()} {dossier.finance.currency} ({marginPercent.toFixed(1)}%)</div>
                            </div>
                            <TrendingUp size={20} style={{ color: '#10b981', opacity: 0.5 }} />
                        </div>
                    </div>
                </div>

            </div>

            {/* QUICK ACTIONS BAR (Dole) */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button className="v5-btn v5-btn-secondary" style={{ height: '52px', padding: '0 24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', fontSize: '11px', fontWeight: 900 }}>
                    <FileText size={16} /> PROFAKTURA KLIJENTU
                </button>
                <button className="v5-btn v5-btn-secondary" style={{ height: '52px', padding: '0 24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', fontSize: '11px', fontWeight: 900 }}>
                    <ShieldCheck size={16} /> UGOVOR O PUTOVANJU
                </button>
                <button className="v5-btn v5-btn-secondary" onClick={handlePrint} style={{ height: '52px', padding: '0 24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', fontSize: '11px', fontWeight: 900 }}>
                    <Printer size={16} /> ŠTAMPAJ REZIME
                </button>
            </div>
        </div>
    );
};
