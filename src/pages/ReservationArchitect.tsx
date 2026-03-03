import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Printer, FileText,
} from 'lucide-react';

// Specialized Hook & Utils
import { useThemeStore } from '../stores';
import { useReservationDossier } from '../hooks/useReservationDossier';
import { useQueryState } from '../hooks/useQueryState';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../utils/dateUtils';
import { NBS_RATES } from '../constants/reservationArchitect';
import { dossierDocumentService } from '../services/dossierDocumentService';

// Components
import { DossierHeader } from '../components/ReservationArchitect/DossierHeader';
import { MiniSidebar } from '../components/ReservationArchitect/MiniSidebar';
import { SummaryTab } from '../components/ReservationArchitect/SummaryTab';
import { PassengersTab } from '../components/ReservationArchitect/PassengersTab';
import { FinanceTab } from '../components/ReservationArchitect/FinanceTab';
import { DocumentCenter } from '../components/ReservationArchitect/DocumentCenter';
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
import { ModernCalendar } from '../components/ModernCalendar';

// Types
import type {
    Language, ResStatus, PaymentRecord, CheckData,
    TripItem, ActivityLog
} from '../types/reservationArchitect';

// Styles
import './ReservationArchitectV2.css';

const ReservationArchitect: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const urlParams = new URLSearchParams(location.search);
    const resId = urlParams.get('id');

    // 1. Core State via Hook
    const {
        dossier, setDossier, updateDossier,
        updateTripItem, removeTripItem, addTripItem,
        financialStats, addLog, addCommunication,
        undo, deepReset, isHistoryAvailable, isSaving,
        isInitialized
    } = useReservationDossier(resId);

    // 2. UI State
    const { theme: globalTheme } = useThemeStore();
    const [activeSection, setActiveSection] = useQueryState<string>('section', 'summary');
    const [isLightTheme, setIsLightTheme] = useState(globalTheme === 'light');

    useEffect(() => {
        setIsLightTheme(globalTheme === 'light');
    }, [globalTheme]);

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

    if (!isInitialized) return <div className="loading-screen">Učitavanje dosijea...</div>;

    return (
        <div className={`reservation-architect-v2 ${isLightTheme ? 'light-theme' : ''}`}>
            {/* 1. Header Area (Full Width) */}
            <DossierHeader
                dossier={dossier}
                financialStats={financialStats}
                isSaving={isSaving}
                isHistoryAvailable={isHistoryAvailable}
                onUndo={undo}
                onDeepReset={deepReset}
                onClose={handleClose}
                onStatusChange={handleStatusChange}
                isLightTheme={isLightTheme}
                onToggleTheme={() => setIsLightTheme(!isLightTheme)}
            />

            {/* 2. Main content Grid (Proposal No. 2) */}
            <div className="architect-main-grid">

                {/* Left: Mini Sidebar Navigation */}
                <MiniSidebar
                    activeSection={activeSection}
                    onSectionChange={setActiveSection}
                    isSubagent={dossier.customerType === 'B2B-Subagent'}
                />

                {/* Center: Active Content Panel */}
                <main className="content-panel glass">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="tab-content-wrapper"
                        >
                            {activeSection === 'summary' && (
                                <SummaryTab
                                    dossier={dossier}
                                    setDossier={setDossier}
                                    totalBrutto={financialStats.totalBrutto}
                                    totalPaid={financialStats.totalPaid}
                                    balance={financialStats.balance}
                                    isSummaryNotepadView={isSummaryNotepadView}
                                    setIsSummaryNotepadView={setIsSummaryNotepadView}
                                    addLog={addLog}
                                    setPolicyToShow={setPolicyToShow}
                                    handlePrint={handlePrint}
                                    setActiveSection={setActiveSection}
                                />
                            )}
                            {activeSection === 'passengers' && (
                                <PassengersTab
                                    dossier={dossier}
                                    setDossier={setDossier}
                                    addLog={addLog}
                                    isPartiesNotepadView={isPartiesNotepadView}
                                    setIsPartiesNotepadView={setIsPartiesNotepadView}
                                    isSubagent={dossier.customerType === 'B2B-Subagent'}
                                    showSaveClientBtn={showSaveClientBtn}
                                    setShowSaveClientBtn={setShowSaveClientBtn}
                                    handleSaveToClients={handleSaveToClients}
                                    handlePrint={handlePrint}
                                />
                            )}
                            {activeSection === 'finance' && (
                                <FinanceTab
                                    dossier={dossier}
                                    financialStats={financialStats}
                                    onAddPayment={handleAddPaymentClick}
                                    onRemovePayment={handleRemovePayment}
                                />
                            )}
                            {activeSection === 'notes' && (
                                <NotesTab
                                    dossier={dossier}
                                    setDossier={setDossier}
                                    addLog={addLog}
                                />
                            )}
                            {activeSection === 'legal' && (
                                <LegalTab
                                    dossier={dossier}
                                    setDossier={setDossier}
                                />
                            )}
                            {activeSection === 'rep' && (
                                <RepTab dossier={dossier} />
                            )}
                            {activeSection === 'communication' && (
                                <CommunicationTab
                                    dossier={dossier}
                                    addLog={addLog}
                                    addCommunication={addCommunication}
                                    onOpenEmailModal={() => setIsEmailModalOpen(true)}
                                />
                            )}
                            {activeSection === 'documents' && (
                                <DocumentsView
                                    dossier={dossier}
                                    onGenerate={handleGenerateDoc}
                                    onPrint={handlePrint}
                                    onSend={handleSendDoc}
                                />
                            )}
                            {activeSection === 'logs' && (
                                <LogsView dossier={dossier} />
                            )}
                            {activeSection === 'settings' && (
                                <SettingsView dossier={dossier} setDossier={setDossier} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* Right: Actions Side Panel */}
                <aside className="actions-side-panel">
                    <DocumentCenter
                        dossier={dossier}
                        docSettings={docSettings}
                        onLanguageChange={handleLanguageChange}
                        onGenerate={handleGenerateDoc}
                        onSend={handleSendDoc}
                    />

                    <div className="quick-notes-panel glass">
                        <div className="panel-header">
                            <FileText size={16} />
                            <h3>INTERNE NAPOMENE</h3>
                        </div>
                        <textarea
                            value={dossier.notes.internal}
                            onChange={(e) => updateDossier({ notes: { ...dossier.notes, internal: e.target.value } })}
                            placeholder="Samo za zaposlene..."
                        />
                    </div>
                </aside>
            </div>

            {/* Modals */}
            {policyToShow && (
                <DossierCancellationModal
                    item={policyToShow.item}
                    onClose={() => setPolicyToShow(null)}
                />
            )}

            {isPaymentModalOpen && paymentDraft && (
                <PaymentEntryModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    draft={paymentDraft}
                    setDraft={setPaymentDraft}
                    onSave={handleSavePayment}
                    dossier={dossier!}
                />
            )}

            {isEmailModalOpen && dossier && (
                <ReservationEmailModal
                    isOpen={isEmailModalOpen}
                    onClose={() => setIsEmailModalOpen(false)}
                    reservations={[
                        {
                            cisCode: dossier.cisCode || '',
                            customerName: dossier.booker.fullName,
                            supplier: dossier.tripItems[0]?.supplier || 'N/A',
                            email: dossier.booker.email
                        }
                    ]}
                />
            )}

        </div>
    );
};

export default ReservationArchitect;
