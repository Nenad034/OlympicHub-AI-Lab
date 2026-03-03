import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Printer, FileText, LayoutDashboard, Settings, History, MessageSquare, ShieldCheck, Info,
    Hash, User, Phone, Mail, MapPin, TrendingUp, Wallet, ShieldAlert,
    RotateCcw, Save, Loader2, RotateCw, Smartphone, Sun, Moon,
    ChevronDown, Zap, FileJson, CreditCard, Users, Briefcase,
    Trash2, Plus, Edit3, Globe, UserCircle, Layout, Bell, CheckCircle2,
    AlertCircle, Clock, Search, Compass, Shield, Calendar
} from 'lucide-react';

// Specialized Hook & Utils
import { useThemeStore } from '../stores';
import { useReservationDossier } from '../hooks/useReservationDossier';
import { useQueryState } from '../hooks/useQueryState';
import { useToast } from '../components/ui/Toast';
import { dossierDocumentService } from '../services/dossierDocumentService';

// Components - V5 Versions
import { SummaryTabV5 } from '../components/ReservationArchitect/SummaryTabV5';
import { PassengersTabV5 } from '../components/ReservationArchitect/PassengersTabV5';
import { FinanceTabV5 } from '../components/ReservationArchitect/FinanceTabV5';

// Other V4 Components as Fallback
import { LogsView } from '../components/ReservationArchitect/LogsView';
import { SettingsView } from '../components/ReservationArchitect/SettingsView';
import { DocumentsView } from '../components/ReservationArchitect/DocumentsView';
import { NotesTab } from '../components/ReservationArchitect/NotesTab';
import { LegalTab } from '../components/ReservationArchitect/LegalTab';
import { RepTab } from '../components/ReservationArchitect/RepTab';
import { CommunicationTab } from '../components/ReservationArchitect/CommunicationTab';
import { PaymentEntryModal } from '../components/ReservationArchitect/modals/PaymentEntryModal';
import { DossierCancellationModal } from '../components/ReservationArchitect/modals/DossierCancellationModal';
import ReservationEmailModal from '../components/ReservationEmailModal';

// Types
import type { ResStatus, Language, PaymentRecord } from '../types/reservationArchitect';

// Styles
import './ReservationArchitectV5.css';

const ReservationArchitectV5: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const urlParams = new URLSearchParams(location.search);
    const resId = urlParams.get('id');
    const containerRef = useRef<HTMLDivElement>(null);

    // Theme logic
    const { theme: globalTheme } = useThemeStore();

    // Core Data Hook
    const {
        dossier, setDossier, updateDossier,
        financialStats, addLog, addCommunication,
        isSaving, isInitialized
    } = useReservationDossier(resId);

    const [activeSection, setActiveSection] = useQueryState<string>('section', 'summary');
    const { success: toastSuccess, error: toastError } = useToast();

    // Mouse Tracking for Card Effects
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const cards = containerRef.current.getElementsByClassName('v5-card');
            for (const card of cards as any) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Modals State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [policyToShow, setPolicyToShow] = useState<{ item: any; idx: number } | null>(null);

    // Handlers
    const handleAddPaymentClick = () => setIsPaymentModalOpen(true);
    const handleRemovePayment = (id: string) => addLog('Finansije', `Brisanje uplate ${id}`, 'danger');
    const handleGenerateDoc = (type: string, format: string) => dossierDocumentService.generate(dossier, type, format as any, dossier.language);
    const handlePrint = () => window.print();
    const handleSendDoc = (type: string, method: string) => alert("Sending doc...");

    // Sections Definition
    const sections = [
        { id: 'summary', label: 'PREGLED DOSIJEA', icon: <LayoutDashboard size={20} /> },
        { id: 'passengers', label: 'MANIFEST PUTNIKA', icon: <Users size={20} /> },
        { id: 'finance', label: 'FINANSIJSKI TOK', icon: <CreditCard size={20} /> },
        { id: 'documents', label: 'DOKUMENTACIJA', icon: <FileText size={20} /> },
        { id: 'communication', label: 'KOMUNIKACIJA', icon: <MessageSquare size={20} /> },
        { id: 'notes', label: 'INTERNE BELEŠKE', icon: <Info size={20} /> },
        { id: 'rep', label: 'DESTINACIJA', icon: <MapPin size={20} /> },
        { id: 'audit', label: 'LOG RADNJI', icon: <History size={18} /> },
        { id: 'settings', label: 'PODEŠAVANJA', icon: <Settings size={18} /> }
    ];

    if (!isInitialized) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#00e5ff' }}>
            <div style={{ letterSpacing: '8px', fontWeight: 900, animation: 'pulse 2s infinite' }}>RESERVATION ARCHITECT V5...</div>
            <style>{`@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }`}</style>
        </div>
    );

    return (
        <div className="v5-architect" ref={containerRef}>

            {/* Sidebar with Premium Navigation */}
            <aside className="v5-sidebar">
                <div style={{ padding: '0 32px', marginBottom: '48px' }}>
                    <div style={{
                        padding: '24px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
                        border: '1px solid var(--glass-border)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ fontSize: '10px', fontWeight: 950, color: 'var(--accent-cyan)', marginBottom: '8px', letterSpacing: '2px' }}>DOSIJE IDENT</div>
                        <div style={{ fontSize: '22px', fontWeight: 950, color: 'white', letterSpacing: '-0.5px' }}>{dossier.cisCode}</div>
                        <div style={{ marginTop: '12px', height: '4px', width: '40px', background: 'var(--accent-cyan)', borderRadius: '2px' }}></div>
                    </div>
                </div>

                <nav style={{ flex: 1 }}>
                    {sections.map(s => (
                        <div
                            key={s.id}
                            className={`v5-nav-item ${activeSection === s.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(s.id)}
                        >
                            <div className="v5-nav-icon">{s.icon}</div>
                            <span>{s.label}</span>
                            {activeSection === s.id && (
                                <motion.div layoutId="nav-active" style={{ position: 'absolute', right: '0', width: '4px', height: '30px', background: 'var(--accent-cyan)', borderRadius: '4px 0 0 4px', boxShadow: '0 0 15px var(--accent-cyan)' }} />
                            )}
                        </div>
                    ))}
                </nav>

                <div style={{ padding: '32px' }}>
                    <button
                        onClick={() => navigate('/reservations')}
                        className="v5-btn v5-btn-secondary" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                    >
                        <X size={18} /> ZATVORI DOSIJE
                    </button>
                </div>
            </aside>

            {/* Main Workspace */}
            <main className="v5-main v5-scroll-area">

                {/* Secondary Header (Meta Info) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className={`v5-status-badge ${dossier.status.toLowerCase()}`}>
                            <Zap size={14} fill="currentColor" /> {dossier.status.toUpperCase()}
                        </div>
                        <div className="v5-status-badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
                            <Hash size={12} /> {dossier.resCode || 'NEMA ŠIFRE'}
                        </div>
                        <div className="v5-status-badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
                            <Shield size={12} /> {dossier.clientReference}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="v5-btn v5-btn-secondary" onClick={handlePrint} style={{ width: '48px', padding: 0, justifyContent: 'center' }}>
                            <Printer size={20} />
                        </button>
                        <button className="v5-btn v5-btn-primary" onClick={() => toastSuccess("Sve izmene su sinhronizovane")}>
                            <Save size={20} />
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                        {activeSection === 'summary' && (
                            <SummaryTabV5
                                dossier={dossier} setDossier={setDossier}
                                totalBrutto={financialStats.totalBrutto} totalPaid={financialStats.totalPaid} balance={financialStats.balance}
                                addLog={addLog} setPolicyToShow={setPolicyToShow} handlePrint={handlePrint} setActiveSection={setActiveSection}
                            />
                        )}
                        {activeSection === 'passengers' && (
                            <PassengersTabV5 dossier={dossier} setDossier={setDossier} addLog={addLog} />
                        )}
                        {activeSection === 'finance' && (
                            <FinanceTabV5 dossier={dossier} financialStats={financialStats} onAddPayment={handleAddPaymentClick} onRemovePayment={handleRemovePayment} />
                        )}
                        {activeSection === 'notes' && <NotesTab dossier={dossier} setDossier={setDossier} addLog={addLog} />}
                        {activeSection === 'legal' && <LegalTab dossier={dossier} setDossier={setDossier} />}
                        {activeSection === 'rep' && <RepTab dossier={dossier} />}
                        {activeSection === 'communication' && <CommunicationTab dossier={dossier} addLog={addLog} addCommunication={addCommunication} onOpenEmailModal={() => setIsEmailModalOpen(true)} />}
                        {activeSection === 'documents' && <DocumentsView dossier={dossier} onGenerate={handleGenerateDoc} onPrint={handlePrint} onSend={handleSendDoc} />}
                        {activeSection === 'audit' && <LogsView dossier={dossier} />}
                        {activeSection === 'settings' && <SettingsView dossier={dossier} setDossier={setDossier} />}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Modals & Overlays */}
            {policyToShow && <DossierCancellationModal item={policyToShow.item} onClose={() => setPolicyToShow(null)} />}
            {isPaymentModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="v5-card" style={{ width: '500px', padding: '48px', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-cyan)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px auto' }}>
                            <CreditCard size={40} />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: 950, marginBottom: '16px' }}>EVIDENTIRANJE UPLATE</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.6 }}>Sistem za finansijsko knjiženje je u fazi sinhronizacije sa vizuelnim standardom Petroleum V5.</p>
                        <button onClick={() => setIsPaymentModalOpen(false)} className="v5-btn v5-btn-primary" style={{ width: '100%', height: '56px' }}>RAZUMEM, ZATVORI</button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ReservationArchitectV5;
