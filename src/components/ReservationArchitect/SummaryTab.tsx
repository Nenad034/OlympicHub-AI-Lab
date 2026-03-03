import React from 'react';
import {
    Briefcase, Zap, RefreshCw, MapPin, Star, Clock, ShieldAlert,
    Users, FileText, Mail, Share2, Printer, AlertTriangle,
    Building2, Plane, Compass, Ship, Truck, Globe, Package as PackageIcon, Hash,
    FileEdit, LayoutDashboard, Copy, User, Phone, ChevronRight, Smartphone, MessageCircle, MessagesSquare,
    ExternalLink, Download, ArrowUpRight
} from 'lucide-react';
import type { Dossier, TripItem, ActivityLog } from '../../types/reservationArchitect';
import { formatDate } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePremiumDocument } from '../../utils/dossierExport';

interface SummaryTabProps {
    dossier: Dossier;
    setDossier: React.Dispatch<React.SetStateAction<Dossier>>;
    totalBrutto: number;
    totalPaid: number;
    balance: number;
    isSummaryNotepadView: boolean;
    setIsSummaryNotepadView: (val: boolean) => void;
    addLog: (action: string, details: string, type?: ActivityLog['type']) => void;
    setPolicyToShow: (data: { item: TripItem; idx: number } | null) => void;
    handlePrint: () => void;
    setActiveSection: (section: string) => void;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
    dossier, setDossier, totalBrutto, totalPaid, balance,
    isSummaryNotepadView, setIsSummaryNotepadView,
    addLog, setPolicyToShow, handlePrint, setActiveSection
}) => {

    const getSummaryNotepadText = () => {
        let text = `Rezervacija broj : ${dossier.resCode || '---'}\n`;
        text += `Status: ${dossier.status}\n`;
        text += `Ref broj dobavljača: ${dossier.clientReference}\n`;
        text += `Cis oznaka: ${dossier.cisCode}\n`;
        text += `\nUGOVARAČ:\n${dossier.booker.fullName}\n${dossier.booker.email} | ${dossier.booker.phone}\n${dossier.booker.address}, ${dossier.booker.city}\n`;
        text += `\nPUTNICI (${dossier.passengers.length}):\n`;
        dossier.passengers.forEach((p, i) => {
            text += `${i + 1}. ${p.firstName} ${p.lastName} (${p.type}) ${p.idNumber ? `- ${p.idNumber}` : ''}\n`;
        });
        text += `\nPLAN PUTOVANJA:\n`;
        dossier.tripItems.forEach((item, i) => {
            text += `${i + 1}. ${item.type.toUpperCase()}: ${item.subject}\n`;
            text += `> Termin: ${formatDate(item.checkIn)} - ${formatDate(item.checkOut)}\n`;
            text += `> Lokacija: ${item.city}, ${item.country}\n`;
            text += `> Detalji: ${item.details} ${item.mealPlan ? `(${item.mealPlan})` : ''}\n`;
        });
        text += `\nUKUPNO: ${totalBrutto.toFixed(2)} ${dossier.finance.currency}`;
        return text;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getSummaryNotepadText());
        addLog('Sistem', 'Rezime kopiran.', 'success');
    };

    const renderTripIcon = (type: string) => {
        switch (type) {
            case 'Smestaj': return <Building2 size={24} className="cyan-text" />;
            case 'Avio karte': return <Plane size={24} className="cyan-text" />;
            case 'Čarter': return <Zap size={24} className="gold-text" />;
            case 'Transfer': return <Truck size={24} className="cyan-text" />;
            default: return <Globe size={24} className="cyan-text" />;
        }
    };

    return (
        <div className="v4-summary-tab" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Control Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => generatePremiumDocument(dossier, 'SUMMARY')} className="v4-tab-btn" style={{ background: 'var(--bg-card)' }}><Printer size={16} /> REZIME</button>
                    <button onClick={() => generatePremiumDocument(dossier, 'PROFORMA')} className="v4-tab-btn" style={{ background: 'var(--bg-card)' }}><FileText size={16} /> PROFAKTURA</button>
                    <button onClick={() => generatePremiumDocument(dossier, 'CONTRACT')} className="v4-tab-btn" style={{ background: 'var(--bg-card)' }}><Download size={16} /> UGOVOR</button>
                </div>

                <div className="v4-nav-tabs" style={{ marginBottom: 0 }}>
                    <button className={`v4-tab-btn ${!isSummaryNotepadView ? 'active' : ''}`} onClick={() => setIsSummaryNotepadView(false)}>
                        <LayoutDashboard size={18} /> INTERAKTIVNO
                    </button>
                    <button className={`v4-tab-btn ${isSummaryNotepadView ? 'active' : ''}`} onClick={() => setIsSummaryNotepadView(true)}>
                        <FileEdit size={18} /> NOTEPAD
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isSummaryNotepadView ? (
                    <motion.div
                        key="notepad"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="v4-table-card"
                        style={{ padding: '32px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <span className="v4-label">TEXTUAL SUMMARY</span>
                            <button onClick={copyToClipboard} className="v4-tab-btn" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-cyan)' }}><Copy size={14} /> KOPIRAJ SADRŽAJ</button>
                        </div>
                        <pre style={{
                            fontFamily: 'monospace', fontSize: '14px', whiteSpace: 'pre-wrap',
                            background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)'
                        }}>{getSummaryNotepadText()}</pre>
                    </motion.div>
                ) : (
                    <motion.div
                        key="interactive"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
                    >
                        {/* Metrics Grid */}
                        <div className="v4-metrics-grid">
                            <div className="v4-metric-card">
                                <div className="v4-metric-info">
                                    <label>UGOVARAČ PUTOVANJA</label>
                                    <div className="value" style={{ fontSize: '20px' }}>{dossier.booker.fullName}</div>
                                    <div className="v4-text-dim" style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                        <Mail size={12} /> {dossier.booker.email} | <Phone size={12} /> {dossier.booker.phone}
                                    </div>
                                </div>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center' }}>
                                    <User size={24} />
                                </div>
                            </div>

                            <div className="v4-metric-card">
                                <div className="v4-metric-info">
                                    <label>SISTEMSKA IDENTIFIKACIJA</label>
                                    <div className="value" style={{ fontSize: '14px', fontFamily: 'monospace' }}>CIS: {dossier.cisCode}</div>
                                    <div className="value" style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--accent-gold)' }}>REZ: {dossier.resCode || '---'}</div>
                                </div>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(251, 191, 36, 0.1)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Hash size={24} />
                                </div>
                            </div>

                            <div className="v4-metric-card">
                                <div className="v4-metric-info">
                                    <label>BRZA STATISTIKA</label>
                                    <div className="value" style={{ fontSize: '18px' }}>{dossier.passengers.length} Putnika / {dossier.tripItems.length} Stavki</div>
                                    <div className="v4-text-dim" style={{ marginTop: '4px' }}>10 Dana / 9 Noćenja</div>
                                </div>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Star size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Communication Promo Section */}
                        <div
                            className="v4-table-card"
                            style={{
                                padding: '24px 32px', cursor: 'pointer',
                                background: 'linear-gradient(90deg, var(--bg-card) 0%, rgba(0, 229, 255, 0.05) 100%)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                            onClick={() => setActiveSection('communication')}
                        >
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'var(--accent-cyan)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MessagesSquare size={32} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Communication Hub</h4>
                                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Kliknite za pristup centrali za poruke (Mail, Viber, SMS).</p>
                                </div>
                            </div>
                            <button className="v4-tab-btn active"><ArrowUpRight size={18} /> OTVORI</button>
                        </div>

                        {/* Plan Putovanja Table */}
                        <div className="v4-table-card">
                            <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <Compass size={20} className="cyan-text" />
                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, letterSpacing: '1px' }}>PLAN PUTOVANJA (ITEMS)</h3>
                            </div>
                            <table className="v4-table">
                                <thead>
                                    <tr>
                                        <th>Usluga</th>
                                        <th>Dobavljač</th>
                                        <th>Termin</th>
                                        <th>Lokacija</th>
                                        <th style={{ textAlign: 'right' }}>Cena (Bruto)</th>
                                        <th style={{ textAlign: 'right' }}>Akcije</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dossier.tripItems.map((item, idx) => (
                                        <tr key={item.id} className="v4-row-hover">
                                            <td>
                                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                    {renderTripIcon(item.type)}
                                                    <div>
                                                        <div className="v4-text-main">{item.subject}</div>
                                                        <div className="v4-text-dim" style={{ fontSize: '11px' }}>{item.type.toUpperCase()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="v4-status-pill" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                    {item.supplier}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="v4-text-main" style={{ fontSize: '14px' }}>{formatDate(item.checkIn)} - {formatDate(item.checkOut)}</div>
                                            </td>
                                            <td>
                                                <div className="v4-text-main" style={{ fontSize: '14px' }}>{item.city}, {item.country}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="v4-price">{item.bruttoPrice.toLocaleString()} {dossier.finance.currency}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setPolicyToShow({ item, idx }); }}
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', height: '36px', padding: '0 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                                                >
                                                    POLISA OTKAZA
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
