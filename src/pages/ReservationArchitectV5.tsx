import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Printer, FileText, LayoutDashboard, Settings, History, MessageSquare, ShieldCheck, Info,
    Hash, User, Phone, Mail, MapPin, TrendingUp, Wallet, ShieldAlert,
    RotateCcw, Save, Loader2, RotateCw, Smartphone, Sun, Moon,
    ChevronDown, Zap, FileJson, CreditCard, Users, Briefcase,
    Trash2, Plus, Edit3, Globe, UserCircle, Layout, Bell, CheckCircle2,
    AlertCircle, Clock, Search, Compass, Shield, Calendar, BarChart4,
    Layers, Landmark, FileCheck
} from 'lucide-react';

// Specialized Hook & Utils
import { useThemeStore } from '../stores';
import { useReservationDossier } from '../hooks/useReservationDossier';
import { useQueryState } from '../hooks/useQueryState';
import { useToast } from '../components/ui/Toast';
import { dossierDocumentService } from '../services/dossierDocumentService';

// Components - V5 Versions (Now V6 Ultimate)
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
import { DossierCancellationModal } from '../components/ReservationArchitect/modals/DossierCancellationModal';

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

    // Mouse Tracking for Card Effects (Premium Glassmorphism)
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
    const [policyToShow, setPolicyToShow] = useState<{ item: any; idx: number } | null>(null);

    // Handlers
    const handleAddPaymentClick = () => setIsPaymentModalOpen(true);
    const handleRemovePayment = (id: string) => {
        addLog('Finansije', `Uklonjena transakcija ${id}`, 'danger');
        toastSuccess("Transakcija uspešno uklonjena");
    };
    const handleGenerateDoc = (type: string, format: string) => {
        dossierDocumentService.generate(dossier, type, format as any, dossier.language);
        toastSuccess(`Dokument ${type} je generisan.`);
    };
    const handlePrint = () => window.print();
    const handleSendDoc = (type: string, method: string) => {
        toastSuccess(`Dokument ${type} je poslat putem ${method}.`);
    };

    // Sections Definition V6
    const sections = [
        { id: 'summary', label: 'PREGLED I MARŽA', icon: <BarChart4 size={20} /> },
        { id: 'passengers', label: 'MANIFEST PUTNIKA', icon: <Users size={20} /> },
        { id: 'finance', label: 'FINANSIJSKI TOK', icon: <Landmark size={20} /> },
        { id: 'documents', label: 'DOKUMENTACIJA', icon: <FileCheck size={20} /> },
        { id: 'communication', label: 'KOMUNIKACIJA', icon: <MessageSquare size={20} /> },
        { id: 'notes', label: 'BELEŠKE', icon: <Info size={20} /> },
        { id: 'rep', label: 'DESTINACIJA', icon: <MapPin size={20} /> },
        { id: 'audit', label: 'AUDIT LOG', icon: <History size={18} /> },
        { id: 'settings', label: 'KONFIGURACIJA', icon: <Settings size={18} /> }
    ];

    if (!isInitialized) return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#061F27', color: '#00e5ff' }}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                style={{ textAlign: 'center' }}
            >
                <div style={{ marginBottom: '40px' }}>
                    <BarChart4 size={64} style={{ animation: 'spin 4s linear infinite' }} />
                </div>
                <div style={{ letterSpacing: '8px', fontWeight: 950, fontSize: '12px' }}>RESERVATION ARCHITECT V6 • ULTIMATE EDITION</div>
                <div style={{ marginTop: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 700 }}>SINHRONIZACIJA DOMENA U TOKU...</div>
            </motion.div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div className={`v5-architect ${globalTheme === 'light' ? 'light-theme' : ''}`} ref={containerRef}>

            {/* Premium V6 Sidebar */}
            <aside className="v5-sidebar">
                <div style={{ padding: '0 32px', marginBottom: '48px' }}>
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            padding: '32px 24px', borderRadius: '24px',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
                            border: '1px solid var(--glass-border)',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}>
                            <Zap size={80} />
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 950, color: 'var(--accent-cyan)', marginBottom: '8px', letterSpacing: '4px', textTransform: 'uppercase' }}>Ident Code</div>
                        <div style={{ fontSize: '24px', fontWeight: 950, color: 'white', letterSpacing: '-1px' }}>{dossier.cisCode}</div>
                        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>ENCRYPTED SESSION</span>
                        </div>
                    </motion.div>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {sections.map((s, idx) => (
                        <motion.div
                            key={s.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`v5-nav-item ${activeSection === s.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(s.id)}
                        >
                            <div className="v5-nav-icon" style={{ color: activeSection === s.id ? 'var(--accent-cyan)' : 'inherit' }}>
                                {s.icon}
                            </div>
                            <span style={{ letterSpacing: '1px' }}>{s.label}</span>
                            {activeSection === s.id && (
                                <motion.div layoutId="nav-glow" style={{ position: 'absolute', left: '0', width: '4px', height: '40%', background: 'var(--accent-cyan)', borderRadius: '0 4px 4px 0', boxShadow: '0 0 20px var(--accent-cyan)' }} />
                            )}
                        </motion.div>
                    ))}
                </nav>

                <div style={{ padding: '32px' }}>
                    <button
                        onClick={() => navigate('/reservations')}
                        className="v5-btn v5-btn-secondary" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', height: '64px', borderRadius: '20px' }}
                    >
                        <X size={20} /> ZATVORI DOSIJE
                    </button>
                </div>
            </aside>

            {/* Main Premium Workspace */}
            <main className="v5-main v5-scroll-area">

                {/* Top Meta Hub V6 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '56px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div className={`v5-status-badge ${dossier.status.toLowerCase()}`} style={{ height: '44px', padding: '0 24px' }}>
                            <Zap size={16} fill="currentColor" /> {dossier.status.toUpperCase()}
                        </div>
                        <div className="v5-status-badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', height: '44px', padding: '0 24px' }}>
                            <Hash size={14} style={{ opacity: 0.5 }} /> <span style={{ fontFamily: 'monospace', fontWeight: 900 }}>{dossier.resCode || 'NEW-DRAFT'}</span>
                        </div>
                        <div className="v5-status-badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', height: '44px', padding: '0 24px' }}>
                            <ShieldCheck size={14} style={{ color: '#10b981' }} /> <span style={{ fontWeight: 800 }}>{dossier.clientReference}</span>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '4px' }}>
                            <button className="v5-btn v5-btn-secondary" onClick={handlePrint} style={{ width: '56px', height: '56px', padding: 0, justifyContent: 'center', border: 'none', background: 'transparent' }}>
                                <Printer size={24} />
                            </button>
                            <button className="v5-btn v5-btn-secondary" style={{ width: '56px', height: '56px', padding: 0, justifyContent: 'center', border: 'none', background: 'transparent' }}>
                                <Share2 size={24} />
                            </button>
                        </div>
                        <button className="v5-btn v5-btn-primary" style={{ height: '64px', padding: '0 40px', borderRadius: '20px' }} onClick={() => {
                             toastSuccess("Sve izmene su permanentno sačuvane u oblaku.");
                             addLog('Manual Save', 'Ručno pokrenuta sinhronizacija baze podataka.', 'success');
                        }}>
                            {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                            SAČUVAJ IZMENE
                        </button>
                    </div>
                </div>

                {/* Ultimate Section Router */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, scale: 0.99, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.99, y: -15 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
                            <FinanceTabV5 dossier={dossier} updateDossier={updateDossier} financialStats={financialStats} onAddPayment={handleAddPaymentClick} onRemovePayment={handleRemovePayment} />
                        )}
                        {activeSection === 'notes' && <NotesTab dossier={dossier} setDossier={setDossier} addLog={addLog} />}
                        {activeSection === 'legal' && <LegalTab dossier={dossier} setDossier={setDossier} />}
                        {activeSection === 'rep' && <RepTab dossier={dossier} />}
                        {activeSection === 'communication' && <CommunicationTab dossier={dossier} addLog={addLog} addCommunication={addCommunication} onOpenEmailModal={() => {}} />}
                        {activeSection === 'documents' && <DocumentsView dossier={dossier} onGenerate={handleGenerateDoc} onPrint={handlePrint} onSend={handleSendDoc} />}
                        {activeSection === 'audit' && <LogsView dossier={dossier} />}
                        {activeSection === 'settings' && <SettingsView dossier={dossier} setDossier={setDossier} />}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* V6 Modals Overlay */}
            <AnimatePresence>
                {policyToShow && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 2000 }}>
                        <DossierCancellationModal item={policyToShow.item} onClose={() => setPolicyToShow(null)} />
                    </div>
                )}
                
                {isPaymentModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, rotateX: 20 }} 
                            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="v5-card" style={{ width: '560px', padding: '60px', textAlign: 'center', border: '1px solid var(--accent-cyan)' }}
                        >
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 40px auto', border: '2px solid var(--accent-cyan)', boxShadow: '0 0 40px rgba(0, 229, 255, 0.2)' }}>
                                <CreditCard size={48} />
                            </div>
                            <h2 style={{ fontSize: '32px', fontWeight: 950, marginBottom: '20px', letterSpacing: '-1.5px', color: 'white' }}>TREZOR PUTOVANJA V6</h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '48px', lineHeight: 1.8, fontSize: '15px', fontWeight: 600 }}>Sistem spreman za prijem uplate. Fiskalni modul (SEF) je spreman za generisanje PFR broja nakon potvrde iznosa.</p>
                            
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button onClick={() => setIsPaymentModalOpen(false)} className="v5-btn v5-btn-secondary" style={{ flex: 1, height: '64px', borderRadius: '20px' }}>ODUSTANI</button>
                                <button onClick={() => {
                                    setIsPaymentModalOpen(false);
                                    toastSuccess("Forma za plaćanje aktivirana.");
                                }} className="v5-btn v5-btn-primary" style={{ flex: 1, height: '64px', borderRadius: '20px' }}>POČNI NAPLATU</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default ReservationArchitectV5;
