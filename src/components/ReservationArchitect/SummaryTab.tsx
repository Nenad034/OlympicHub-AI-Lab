import React from 'react';
import {
    Briefcase, Zap, RefreshCw, MapPin, Star, Clock, ShieldAlert,
    Users, FileText, Mail, Share2, Printer, AlertTriangle,
    Building2, Plane, Compass, Ship, Truck, Globe, Package as PackageIcon,
    FileEdit, LayoutDashboard, Copy, User, Phone, ChevronRight, Smartphone, MessageCircle, MessagesSquare
} from 'lucide-react';
import type { Dossier, TripItem, ActivityLog } from '../../types/reservationArchitect';
import { formatDate } from '../../utils/dateUtils';
import { getReservation as getSolvexReservation } from '../../integrations/solvex/api/solvexBookingService';
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
        alert('Kopirano!');
    };

    const renderTripIcon = (type: string) => {
        switch (type) {
            case 'Smestaj': return <Building2 size={20} />;
            case 'Avio karte': return <Plane size={20} />;
            case 'Čarter': return <Zap size={20} />;
            case 'Transfer': return <Truck size={20} />;
            default: return <Globe size={20} />;
        }
    };

    return (
        <div className="summary-v2">
            {/* Header Actions: Print & View Toggle */}
            <div className="summary-top-actions">
                <div className="print-actions glass">
                    <span className="text-xs bold dim" style={{ paddingLeft: '8px' }}>Štampa:</span>
                    <button onClick={() => generatePremiumDocument(dossier, 'SUMMARY')} className="print-btn"><Printer size={14} /> Rezime</button>
                    <button className="print-btn" onClick={() => generatePremiumDocument(dossier, 'PROFORMA')}><FileText size={14} /> Profaktura</button>
                    <button className="print-btn" onClick={() => generatePremiumDocument(dossier, 'CONTRACT')}><FileText size={14} /> Ugovor</button>
                    <button className="print-btn" onClick={() => generatePremiumDocument(dossier, 'VOUCHER')}><FileText size={14} /> Vaučer</button>
                </div>

                <div className="view-switcher glass">
                    <button
                        className={!isSummaryNotepadView ? 'active' : ''}
                        onClick={() => setIsSummaryNotepadView(false)}
                    >
                        <LayoutDashboard size={14} /> INTERAKTIVNO
                    </button>
                    <button
                        className={isSummaryNotepadView ? 'active' : ''}
                        onClick={() => setIsSummaryNotepadView(true)}
                    >
                        <FileEdit size={14} /> NOTEPAD
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isSummaryNotepadView ? (
                    <motion.div
                        key="notepad"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="notepad-container glass"
                    >
                        <div className="notepad-header">
                            <span className="text-xs">TEKSTUALNI REZIME</span>
                            <button onClick={copyToClipboard} className="fil-btn-ghost mini">
                                <Copy size={12} /> KOPIRAJ
                            </button>
                        </div>
                        <pre className="notepad-content">{getSummaryNotepadText()}</pre>
                    </motion.div>
                ) : (
                    <motion.div
                        key="interactive"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="interactive-summary"
                    >
                        {/* STATUS TAG */}
                        <div className="big-status-tag">
                            <span className="st-lbl">STATUS</span>
                            <div className={`st-pill st-${dossier.status.toLowerCase()}`}>
                                {dossier.status}
                            </div>
                        </div>

                        {/* 1. Codes Card */}
                        <div className="fil-card codes-card">
                            <div className="code-item">
                                <label className="text-xs">SISTEMSKI REZ</label>
                                <input
                                    className="fil-input bold cyan"
                                    value={dossier.resCode || ''}
                                    onChange={(e) => setDossier({ ...dossier, resCode: e.target.value })}
                                />
                            </div>
                            <div className="code-item">
                                <label className="text-xs">KLIJENT REF</label>
                                <input
                                    className="fil-input"
                                    value={dossier.clientReference}
                                    onChange={(e) => setDossier({ ...dossier, clientReference: e.target.value })}
                                />
                            </div>
                            <div className="code-item">
                                <label className="text-xs">CIS KOD</label>
                                <div className="fil-input read-only">{dossier.cisCode}</div>
                            </div>
                        </div>

                        {/* 2. Booker Card */}
                        <div className="fil-card booker-summary">
                            <div className="avatar">
                                <User size={24} />
                            </div>
                            <div className="details">
                                <span className="text-xs">NOSILAC PUTOVANJA</span>
                                <h3>{dossier.booker.fullName}</h3>
                                <div className="meta">
                                    <span><Mail size={12} /> {dossier.booker.email}</span>
                                    <span><Phone size={12} /> {dossier.booker.phone}</span>
                                    <span><MapPin size={12} /> {dossier.booker.city}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Communication Center Access */}
                        <div className="section-title-v2">
                            <MessagesSquare size={18} className="cyan" />
                            <h3>KOMUNIKACIONI CENTAR</h3>
                        </div>
                        <div className="communication-hub-card fil-card" onClick={() => setActiveSection('communication')} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            cursor: 'pointer',
                            marginBottom: '24px'
                        }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #9333ea 0%, #6366f1 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                boxShadow: '0 8px 16px rgba(147, 51, 234, 0.3)'
                            }}>
                                <MessagesSquare size={28} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--fil-text)' }}>Centralni Hub za Komunikaciju</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--fil-text-dim)' }}>
                                    Istorija četa, Viber, WhatsApp i Email poruke na jednom mestu.
                                </p>
                            </div>
                            <button
                                className="fil-btn-primary"
                                style={{ padding: '10px 20px', fontSize: '12px' }}
                            >
                                OTVORI KOMUNIKACIJU
                            </button>
                        </div>
                        <div className="section-title-v2">
                            <Users size={18} className="cyan" />
                            <h3>PUTNICI</h3>
                        </div>
                        <div className="fil-card passengers-compact">
                            <div className="pax-list">
                                {dossier.passengers.length > 0 ? (
                                    dossier.passengers.map((p, idx) => (
                                        <div key={p.id} className="pax-item">
                                            <span className="idx">{idx + 1}.</span>
                                            <span className="name">{p.firstName} {p.lastName}</span>
                                            <span className={`pax-type-badge ${p.type.toLowerCase()}`}>{p.type}</span>
                                            {p.idNumber && <span className="doc">Dok: {p.idNumber}</span>}
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">Nema unetih putnika</div>
                                )}
                            </div>
                        </div>

                        {/* 4. Trip Items */}
                        <div className="section-title-v2">
                            <Briefcase size={18} className="cyan" />
                            <h3>PLAN PUTOVANJA</h3>
                        </div>

                        <div className="trip-grid">
                            {dossier.tripItems.map((item) => (
                                <div key={item.id} className="fil-card trip-item-v2">
                                    <div className="trip-header">
                                        <div className="type-badge">
                                            {renderTripIcon(item.type)}
                                            <span className="text-xs">{item.type}</span>
                                        </div>
                                        {item.supplier && <span className="supplier-tag">{item.supplier}</span>}
                                    </div>
                                    <div className="trip-main">
                                        <h4>{item.subject}</h4>
                                        <p className="location"><MapPin size={12} /> {item.city}, {item.country}</p>
                                    </div>
                                    <div className="trip-details-grid">
                                        <div className="detail">
                                            <label>DATUMI</label>
                                            <span>{formatDate(item.checkIn)} - {formatDate(item.checkOut)}</span>
                                        </div>
                                        <div className="detail">
                                            <label>USLUGA</label>
                                            <span>{item.mealPlan || 'Nije navedeno'}</span>
                                        </div>
                                        <div className="detail">
                                            <label>DETALJI</label>
                                            <span>{item.details || 'Standardna usluga'}</span>
                                        </div>
                                    </div>
                                    {item.cancellationPolicy && (
                                        <button className="policy-trigger" onClick={() => setPolicyToShow({ item, idx: 0 })}>
                                            <ShieldAlert size={14} /> OTKAZNE POLISE <ChevronRight size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* 5. Notes Summary */}
                        <div className="section-title-v2">
                            <FileText size={18} className="cyan" />
                            <h3>NAPOMENE</h3>
                        </div>
                        <div className="notes-summary-grid">
                            <div className="fil-card note-compact">
                                <label className="text-xs">UGOVOR</label>
                                <p>{dossier.notes.contract || 'Nema napomene za ugovor.'}</p>
                            </div>
                            <div className="fil-card note-compact">
                                <label className="text-xs">VAUČER</label>
                                <p>{dossier.notes.voucher || 'Nema napomene za vaučer.'}</p>
                            </div>
                            <div className="fil-card note-compact internal">
                                <label className="text-xs">INTERNA</label>
                                <p>{dossier.notes.internal || 'Nema interne napomene.'}</p>
                            </div>
                        </div>

                        {/* 6. Financial Summary Bottom */}
                        <div className="fil-card finance-summary-compact">
                            <div className="price-pillar">
                                <div className="item">
                                    <label>UKUPNO</label>
                                    <span className="val">{totalBrutto.toLocaleString()} {dossier.finance.currency}</span>
                                </div>
                                <div className="item">
                                    <label>UPLAĆENO</label>
                                    <span className="val success">{totalPaid.toLocaleString()} {dossier.finance.currency}</span>
                                </div>
                                <div className="item highlight">
                                    <label>SALDO</label>
                                    <span className={`val ${balance > 0 ? 'danger' : 'success'}`}>{balance.toLocaleString()} {dossier.finance.currency}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};
