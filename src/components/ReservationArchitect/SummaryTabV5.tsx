import React from 'react';
import {
    Briefcase, Zap, RefreshCw, MapPin, Star, Clock, ShieldAlert,
    Users, FileText, Mail, Share2, Printer, AlertTriangle,
    Building2, Plane, Compass, Ship, Truck, Globe, Package as PackageIcon, Hash,
    FileEdit, LayoutDashboard, Copy, User, Phone, ChevronRight, Smartphone, MessageCircle, MessagesSquare,
    ExternalLink, Download, ArrowUpRight, CheckCircle2, AlertCircle, Bell, ShieldCheck
} from 'lucide-react';
import type { Dossier, TripItem, ActivityLog } from '../../types/reservationArchitect';
import { formatDate } from '../../utils/dateUtils';
import { motion } from 'framer-motion';

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

    const InputField = ({ label, value, onChange, icon: Icon, readOnly = false }: any) => (
        <div className="v5-input-group">
            <label className="v5-label">{label}</label>
            <div style={{ position: 'relative' }}>
                <input className="v5-input" value={value} onChange={onChange} readOnly={readOnly} style={{ paddingLeft: '56px', border: readOnly ? '1px dashed var(--glass-border)' : '' }} />
                {Icon && <Icon size={20} style={{ position: 'absolute', left: '20px', top: '20px', opacity: 0.4, color: 'var(--accent-cyan)' }} />}
            </div>
        </div>
    );

    return (
        <div className="v5-summary" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

            {/* Page Header (Synchronized with other tabs) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '22px', background: 'var(--petroleum)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                        <LayoutDashboard size={32} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 950, letterSpacing: '-1px' }}>PREGLED REZERVACIJE</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Cis Code: {dossier.cisCode} • {dossier.status.toUpperCase()}</div>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                            <div className="v5-status-badge active" style={{ fontSize: '9px', padding: '3px 12px' }}>AKTIVAN DOSIJE</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="v5-metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                <div className="v5-card">
                    <div className="v5-metric-label">UKUPNA VREDNOST</div>
                    <div className="v5-metric-value">{totalBrutto.toLocaleString()} {dossier.finance.currency}</div>
                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                        <div style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--petroleum-glow)', fontSize: '9px', fontWeight: 950, color: 'var(--accent-cyan)' }}>GUARANTEED RATE</div>
                    </div>
                </div>
                <div className="v5-card">
                    <div className="v5-metric-label">UPLAĆENI IZNOS</div>
                    <div className="v5-metric-value" style={{ color: '#10b981' }}>{totalPaid.toLocaleString()} {dossier.finance.currency}</div>
                    <div style={{ marginTop: '16px', width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (totalPaid / totalBrutto) * 100)}%`, height: '100%', background: '#10b981', borderRadius: '3px', boxShadow: '0 0 10px #10b98140' }}></div>
                    </div>
                </div>
                <div className="v5-card">
                    <div className="v5-metric-label">PUTNICI (PAX)</div>
                    <div className="v5-metric-value">{dossier.passengers.length} KONTAKTA</div>
                    <div style={{ marginTop: '16px', display: 'flex', gap: '6px' }}>
                        {dossier.passengers.map((p, i) => (
                            <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-cyan)', border: '2px solid rgba(255,255,255,0.1)' }}></div>
                        ))}
                    </div>
                </div>
                <div className="v5-card">
                    <div className="v5-metric-label">DANI DO POLASKA</div>
                    <div className="v5-metric-value" style={{ color: daysToDeparture < 7 ? '#ef4444' : 'var(--text-primary)' }}>
                        {daysToDeparture > 0 ? `${daysToDeparture} DANA` : 'DANAS'}
                    </div>
                    <div style={{ marginTop: '16px', fontSize: '9px', fontWeight: 950, color: daysToDeparture < 7 ? '#ef4444' : 'var(--text-secondary)' }}>
                        {daysToDeparture < 7 ? 'CRITICAL DEADLINE' : 'ON SCHEDULE'}
                    </div>
                </div>
            </div>

            {/* Content Grids */}
            <div className="v5-grid-2">

                {/* Booker Card */}
                <div className="v5-card" style={{ padding: '0' }}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)' }}>
                        <User size={20} style={{ color: 'var(--accent-cyan)' }} />
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, letterSpacing: '1px' }}>UGOVARAČ ARANŽMANA</h3>
                    </div>
                    <div style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <InputField label="NOSILAC / UGOVARAČ" value={dossier.booker.fullName} onChange={(e: any) => setDossier(prev => ({ ...prev, booker: { ...prev.booker, fullName: e.target.value } }))} icon={User} />
                            <div className="v5-grid-2">
                                <InputField label="EMAIL ADRESA" value={dossier.booker.email} onChange={(e: any) => setDossier(prev => ({ ...prev, booker: { ...prev.booker, email: e.target.value } }))} icon={Mail} />
                                <InputField label="KONTAKT TELEFON" value={dossier.booker.phone} onChange={(e: any) => setDossier(prev => ({ ...prev, booker: { ...prev.booker, phone: e.target.value } }))} icon={Phone} />
                            </div>
                            <InputField label="ADRESA STANOVANJA" value={`${dossier.booker.address}, ${dossier.booker.city}`} readOnly={true} icon={MapPin} />
                        </div>
                    </div>
                </div>

                {/* Workflow Status Card */}
                <div className="v5-card" style={{ padding: '0' }}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)' }}>
                        <Bell size={20} style={{ color: '#fbbf24' }} />
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, letterSpacing: '1px' }}>SISTEMSKI MONITORING</h3>
                    </div>
                    <div style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { label: 'NAJAVA HOTELU', status: dossier.hotelNotified, sub: 'Potvrda prijema kod dobavljača' },
                                { label: 'PROFAKTURA KLIJENTU', status: dossier.proformaSent, sub: 'Slanje finansijskog zaduženja' },
                                { label: 'UGOVOR O PUTOVANJU', status: dossier.invoiceCreated, sub: 'Finalizacija dokumentacije' },
                                { label: 'GARANCIJSKI LIST', status: true, sub: 'Polisa osiguranja aktivna' }
                            ].map((todo, i) => (
                                <div key={i} style={{ padding: '16px 24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 800 }}>{todo.label}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>{todo.sub}</div>
                                    </div>
                                    <div className={`v5-status-badge ${todo.status ? 'active' : 'canceled'}`} style={{ minWidth: '100px', justifyContent: 'center', fontSize: '9px' }}>
                                        {todo.status ? 'ZAVRŠENO' : 'PILING'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Itinerary Table - Premium Row Design */}
                <div className="v5-card v5-full-width" style={{ padding: '0' }}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Compass size={20} style={{ color: 'var(--accent-cyan)' }} />
                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, letterSpacing: '1px' }}>HVALA / PLAN PUTOVANJA</h3>
                        </div>
                        <button className="v5-btn v5-btn-secondary" onClick={() => setActiveSection('finance')} style={{ height: '40px', fontSize: '11px' }}>
                            FINANSIJSKI DETALJI <ChevronRight size={14} />
                        </button>
                    </div>

                    <div style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {dossier.tripItems.map((item, i) => (
                                <div key={i} className="v5-card" style={{ padding: '24px 32px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flex: 1 }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--petroleum-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {renderTripIcon(item.type)}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '18px', fontWeight: 900 }}>{item.subject}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '4px' }}>{item.type.toUpperCase()} • {item.details}</div>
                                        </div>
                                        <div style={{ width: '1px', height: '30px', background: 'var(--glass-border)' }}></div>
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: 950, color: 'var(--text-secondary)', marginBottom: '4px' }}>PERIOD BORAVKA</div>
                                            <div style={{ fontSize: '14px', fontWeight: 700 }}>{formatDate(item.checkIn)} — {formatDate(item.checkOut)}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 950, color: 'var(--text-secondary)', marginBottom: '4px' }}>BRUTO VREDNOST</div>
                                        <div style={{ fontSize: '24px', fontWeight: 950, color: 'var(--accent-cyan)' }}>{item.bruttoPrice.toLocaleString()} {item.currency}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
