import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Printer, FileText, LayoutDashboard, Settings, History, MessageSquare, ShieldCheck, Info,
    Hash, Globe, User, Phone, Mail, MapPin, TrendingUp, Wallet, ShieldAlert,
    RotateCcw, Save, Loader2, RotateCw, Smartphone, Sun, Moon,
    ChevronDown, Zap, FileJson, CreditCard, Users, Briefcase
} from 'lucide-react';

// Specialized Hook & Utils
import { useThemeStore } from '../stores';
import { useReservationDossier } from '../hooks/useReservationDossier';
import { useQueryState } from '../hooks/useQueryState';
import { useToast } from '../components/ui/Toast';
import { dossierDocumentService } from '../services/dossierDocumentService';

// Components
import { SummaryTab } from '../components/ReservationArchitect/SummaryTab';
import { PassengersTab } from '../components/ReservationArchitect/PassengersTab';
import { FinanceTab } from '../components/ReservationArchitect/FinanceTab';
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
import type {
    Language, ResStatus, PaymentRecord, TripItem
} from '../types/reservationArchitect';

import { NBS_RATES } from '../constants/reservationArchitect';

// Styles
import './ReservationArchitectV4.css';

const ReservationArchitect: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const urlParams = new URLSearchParams(location.search);
    const resId = urlParams.get('id');

    // 1. Core State via Hook
    const {
        dossier, setDossier, updateDossier,
        financialStats, addLog, addCommunication,
        undo, deepReset, isHistoryAvailable, isSaving,
        isInitialized
    } = useReservationDossier(resId);

    // 2. UI State
    const { theme: globalTheme } = useThemeStore();
    const [activeSection, setActiveSection] = useQueryState<string>('section', 'summary');

    const { success: toastSuccess, error: toastError } = useToast();
    const [isSummaryNotepadView, setIsSummaryNotepadView] = useState(false);
    const [isPartiesNotepadView, setIsPartiesNotepadView] = useState(false);
    const [showSaveClientBtn, setShowSaveClientBtn] = useState(false);
    const [policyToShow, setPolicyToShow] = useState<{ item: TripItem; idx: number } | null>(null);
    const [docSettings, setDocSettings] = useState<{ [key: string]: Language }>({
        contract: 'Srpski', voucher: 'Srpski', itinerary: 'Srpski',
        paxList: 'Srpski', proforma: 'Srpski', payment: 'Srpski'
    });

    // Modals State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentDraft, setPaymentDraft] = useState<PaymentRecord | null>(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    // 3. Handlers
    const handleClose = () => {
        navigate('/reservations');
    };

    const handleStatusChange = (newStatus: ResStatus) => {
        updateDossier({ status: newStatus });
        addLog('Promena Statusa', `Status rezervacije promenjen u ${newStatus}.`, 'info');
        toastSuccess(`Status promenjen u ${newStatus}`);
    };

    const handleLanguageChange = (docType: string, lang: Language) => {
        setDocSettings(prev => ({ ...prev, [docType]: lang }));
    };

    const handlePrint = () => {
        addLog('Štampa', 'Pokrenuta štampa stranice.', 'info');
        dossierDocumentService.print();
    };

    const handleGenerateDoc = (type: string, format: 'PDF' | 'HTML') => {
        const lang = docSettings[type] || dossier.language;
        dossierDocumentService.generate(dossier, type, format, lang);
        addLog('Dokumentacija', `Generisan ${type} na jeziku: ${lang} (${format})`, 'success');
        toastSuccess(`${type} uspešno generisan.`);
    };

    const handleSendDoc = (type: string, method: 'Email' | 'Viber') => {
        if (method === 'Email') {
            setIsEmailModalOpen(true);
        } else {
            addLog('Slanje', `Slanje dokumenta ${type} putem: ${method}`, 'info');
            alert(`Slanje dokumenta ${type} putem ${method} biće implementirano u sledećoj fazi.`);
        }
    };

    const handleSaveToClients = () => {
        addLog('CRM', 'Klijent sačuvan u bazu podataka.', 'success');
        toastSuccess('Podaci uspešno sačuvani u bazi klijenata.');
        setShowSaveClientBtn(false);
    };

    const handleRemovePayment = (id: string) => {
        const password = prompt('Unesite ADMIN ŠIFRU za brisanje uplate:');
        if (password === 'ADMIN2026') {
            const nextPayments = dossier.finance.payments.map(p =>
                p.id === id ? { ...p, status: 'deleted' as const, amount: 0, amountInRsd: 0 } : p
            );
            updateDossier({ finance: { ...dossier.finance, payments: nextPayments as any } });
            addLog('Finansije', `Uplata ID: ${id} je stornirana.`, 'danger');
            toastSuccess('Uplata uspešno stornirana.');
        } else {
            toastError('Pogrešna šifra!');
        }
    };

    const handleAddPaymentClick = () => {
        const nextNo = dossier.finance.payments.length + 1;
        const newDraft: PaymentRecord = {
            id: 'PAY-' + Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            amount: 0,
            currency: 'EUR',
            method: 'Cash',
            receiptNo: `PZ-${nextNo}/${new Date().getFullYear()}`,
            payerName: dossier.booker.fullName,
            exchangeRate: NBS_RATES.EUR,
            status: 'active'
        };
        setPaymentDraft(newDraft);
        setIsPaymentModalOpen(true);
    };

    const handleSavePayment = (p: PaymentRecord, shouldFiscalize: boolean) => {
        const nextPayments = [...dossier.finance.payments, { ...p, status: 'active' as const }];
        updateDossier({ finance: { ...dossier.finance, payments: nextPayments as any } });
        addLog('Uplata', `Evidentirana uplata: ${p.amount} ${p.currency} (${p.method})`, 'success');
        setIsPaymentModalOpen(false);
        toastSuccess(shouldFiscalize ? 'Uplata sačuvana i fiskalizovana!' : 'Uplata sačuvana.');
    };

    if (!isInitialized) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', color: 'var(--accent-cyan)' }}>
            <div style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: 900 }}>UČITAVANJE DOSIJEA...</div>
        </div>
    );

    const sections = [
        { id: 'summary', label: 'REZIME', icon: <LayoutDashboard size={18} /> },
        { id: 'passengers', label: 'PUTNICI', icon: <Users size={18} /> },
        { id: 'finance', label: 'FINANSIJE', icon: <CreditCard size={18} /> },
        { id: 'communication', label: 'CRM / KOMUNIKACIJA', icon: <MessageSquare size={18} /> },
        { id: 'documents', label: 'DOKUMENTI', icon: <FileText size={18} /> },
        { id: 'notes', label: 'BELEŠKE', icon: <Info size={18} /> },
        { id: 'legal', label: 'LEGAL / REKL.', icon: <ShieldCheck size={18} /> },
        { id: 'rep', label: 'DESTINACIJA', icon: <MapPin size={18} /> },
        { id: 'logs', label: 'AUDIT', icon: <History size={18} /> },
        { id: 'settings', label: 'PODEŠAVANJA', icon: <Settings size={18} /> }
    ];

    return (
        <div className="v4-architect-container v4-scroll-area">
            {/* Header Area following Accommodations Detail style */}
            <div className="v4-header">
                <div className="v4-header-id">
                    <h1>RESERVATION ARCHITECT <span style={{ opacity: 0.3, marginLeft: '10px' }}>DOSIJE: {dossier.cisCode}</span></h1>
                    <div className="meta">
                        <span className="v4-status-pill success"><Zap size={14} fill="currentColor" /> {dossier.resCode}</span>
                        <span className="v4-status-pill warning">{dossier.status.toUpperCase()}</span>
                        <span className="v4-text-dim">KLIJENT REF: {dossier.clientReference}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div className="v4-metric-info" style={{ textAlign: 'right' }}>
                        <label>PREOSTALO ZA NAPLATU</label>
                        <div className={`value ${financialStats.balance > 0 ? 'danger' : 'success'}`} style={{ fontSize: '24px', fontWeight: 900 }}>
                            {financialStats.balance.toLocaleString()} {dossier.finance.currency}
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Navigation Tabs mimicking Production Hub */}
            <div className="v4-nav-tabs">
                {sections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`v4-tab-btn ${activeSection === s.id ? 'active' : ''}`}
                    >
                        {s.icon} {s.label}
                    </button>
                ))}
            </div>

            {/* Content Hub - Wide View */}
            <div className="v4-content-hub">
                <AnimatePresence mode="wait">
                    <motion.main
                        key={activeSection}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{ width: '100%' }}
                    >
                        {activeSection === 'summary' && (
                            <SummaryTab
                                dossier={dossier} setDossier={setDossier}
                                totalBrutto={financialStats.totalBrutto} totalPaid={financialStats.totalPaid} balance={financialStats.balance}
                                isSummaryNotepadView={isSummaryNotepadView} setIsSummaryNotepadView={setIsSummaryNotepadView}
                                addLog={addLog} setPolicyToShow={setPolicyToShow} handlePrint={handlePrint} setActiveSection={setActiveSection}
                            />
                        )}
                        {activeSection === 'passengers' && (
                            <PassengersTab
                                dossier={dossier} setDossier={setDossier} addLog={addLog}
                                isPartiesNotepadView={isPartiesNotepadView} setIsPartiesNotepadView={setIsPartiesNotepadView}
                                isSubagent={dossier.customerType === 'B2B-Subagent'} showSaveClientBtn={showSaveClientBtn}
                                setShowSaveClientBtn={setShowSaveClientBtn} handleSaveToClients={handleSaveToClients} handlePrint={handlePrint}
                            />
                        )}
                        {activeSection === 'finance' && (
                            <FinanceTab dossier={dossier} financialStats={financialStats} onAddPayment={handleAddPaymentClick} onRemovePayment={handleRemovePayment} />
                        )}
                        {activeSection === 'notes' && <NotesTab dossier={dossier} setDossier={setDossier} addLog={addLog} />}
                        {activeSection === 'legal' && <LegalTab dossier={dossier} setDossier={setDossier} />}
                        {activeSection === 'rep' && <RepTab dossier={dossier} />}
                        {activeSection === 'communication' && <CommunicationTab dossier={dossier} addLog={addLog} addCommunication={addCommunication} onOpenEmailModal={() => setIsEmailModalOpen(true)} />}
                        {activeSection === 'documents' && <DocumentsView dossier={dossier} onGenerate={handleGenerateDoc} onPrint={handlePrint} onSend={handleSendDoc} />}
                        {activeSection === 'logs' && <LogsView dossier={dossier} />}
                        {activeSection === 'settings' && <SettingsView dossier={dossier} setDossier={setDossier} />}
                    </motion.main>
                </AnimatePresence>
            </div>

            {/* Modals */}
            {policyToShow && <DossierCancellationModal item={policyToShow.item} onClose={() => setPolicyToShow(null)} />}
            {isPaymentModalOpen && paymentDraft && (
                <PaymentEntryModal
                    isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)}
                    draft={paymentDraft} setDraft={setPaymentDraft} onSave={handleSavePayment} dossier={dossier!}
                />
            )}
            {isEmailModalOpen && dossier && (
                <ReservationEmailModal
                    isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)}
                    reservations={[{
                        cisCode: dossier.cisCode || '', customerName: dossier.booker.fullName,
                        supplier: dossier.tripItems[0]?.supplier || 'N/A', email: dossier.booker.email
                    }]}
                />
            )}
        </div>
    );
};

export default ReservationArchitect;
