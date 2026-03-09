import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign, TrendingUp, TrendingDown, FileText, Download, Upload,
    Search, Filter, Calendar, Users, Building2, Globe, ArrowRightLeft,
    CheckCircle2, AlertTriangle, MessageSquare, X, ChevronDown, RefreshCw,
    LayoutDashboard, Table as TableIcon, CreditCard, Scale, HelpCircle, Bot, Send, BrainCircuit, Wallet, PieChart,
    Eye, EyeOff, Edit, Slash, Plus
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useThemeStore } from '../stores';
import DateRangeInput from '../components/DateRangeInput';
import './FinancialIntelligenceHub.css';
import SupplierFinance from './SupplierFinance';
import supplierService, { type UnifiedSupplier as Supplier } from '../services/SupplierService';

// --- TYPES & INTERFACES ---
interface Transaction {
    id: string;
    cisCode: string;
    reservationDate: string;
    stayFrom: string;
    stayTo: string;
    client: string;
    type: 'B2C-Individual' | 'B2C-Legal' | 'B2B-Subagent';
    supplier: string;
    destination: string;
    country: string;
    agent: string;
    office: string;
    currency: 'RSD' | 'EUR' | 'USD' | 'GBP';
    bruttoRsd: number;
    netbRsd: number; // Purchase price
    marginRsd: number;
    vatRsd: number; // Article 35 VAT
    status: 'Paid' | 'Partial' | 'Debt' | 'Storniran' | 'Overdue';
    method: 'Cash' | 'Card' | 'Transfer' | 'Check';
    bankMatched: boolean;
    paidAmountRsd: number;
    dueDate: string;
    isStorned?: boolean;
    stornoDate?: string;
}

interface NBS_Rate {
    code: string;
    rate: number;
}

// --- MOCK DATA GENERATOR ---
const generateMockData = (): Transaction[] => {
    const suppliers = ['Solvex', 'Travelport', 'Travelgate', 'Global Booking', 'MTS Globe'];
    const destinations = ['Grčka (Tasos)', 'Bugarska (Bansko)', 'Turska (Antalija)', 'Egipat (Hurgada)', 'Italija (Rim)'];
    const countries = ['Grčka', 'Bugarska', 'Turska', 'Egipat', 'Italija'];
    const agents = ['Nenad', 'Ana', 'Marko', 'Jelena'];
    const offices = ['Beograd', 'Novi Sad', 'Niš'];
    const statuses: Transaction['status'][] = ['Paid', 'Partial', 'Debt'];
    const types: Transaction['type'][] = ['B2C-Individual', 'B2C-Legal', 'B2B-Subagent'];

    return Array.from({ length: 45 }).map((_, i) => {
        const brutto = Math.floor(Math.random() * 500000) + 20000;
        const net = brutto * (0.8 + Math.random() * 0.15); // 5-20% margin
        const margin = brutto - net;
        const vat = margin > 0 ? margin * 20 / 120 : 0; // Preračunata stopa Član 35

        const destIdx = Math.floor(Math.random() * destinations.length);
        const paidAmount = i % 5 === 0 ? 0 : (i % 3 === 0 ? Math.floor(brutto * 0.4) : brutto);

        let currentStatus: Transaction['status'] = 'Paid';
        if (paidAmount === 0) currentStatus = 'Debt';
        else if (paidAmount < brutto) currentStatus = 'Partial';

        if (i % 8 === 0 && currentStatus !== 'Paid') currentStatus = 'Overdue';

        return {
            id: `TR-${1000 + i}`,
            cisCode: `CIS-2026${Math.floor(Math.random() * 9000) + 1000}`,
            reservationDate: `2026-0${Math.floor(Math.random() * 2) + 2}-${Math.floor(Math.random() * 20) + 1}`,
            stayFrom: `2026-0${Math.floor(Math.random() * 3) + 5}-${Math.floor(Math.random() * 28) + 1}`,
            stayTo: `2026-08-15`,
            client: `Klijent ${i + 1}`,
            type: types[Math.floor(Math.random() * types.length)],
            supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
            destination: destinations[destIdx],
            country: countries[destIdx],
            agent: agents[Math.floor(Math.random() * agents.length)],
            office: offices[Math.floor(Math.random() * offices.length)],
            currency: 'RSD',
            bruttoRsd: brutto,
            netbRsd: net,
            marginRsd: margin,
            vatRsd: vat,
            status: currentStatus,
            method: 'Transfer',
            bankMatched: Math.random() > 0.3,
            paidAmountRsd: paidAmount,
            dueDate: '2026-03-31'
        };
    });
};

const FinancialIntelligenceHub: React.FC = () => {
    // --- THEME ---
    const { theme } = useThemeStore();
    const location = useLocation();

    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'dashboard' | 'kir' | 'kur' | 'tax' | 'cashier' | 'bank' | 'settings' | 'payments'>(
        (new URLSearchParams(window.location.search).get('tab') as any) || 'kir'
    );

    useEffect(() => {
        const tab = new URLSearchParams(location.search).get('tab');
        if (tab && ['dashboard', 'kir', 'kur', 'tax', 'cashier', 'bank', 'settings', 'payments'].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [location.search]);
    const [data, setData] = useState<Transaction[]>(() => generateMockData());
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [activeOffice, setActiveOffice] = useState('Beograd');
    const [showQuickStats, setShowQuickStats] = useState(false);
    const [aiMessages, setAiMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
        { role: 'ai', text: 'Zdravo! Ja sam vaš FIL AI finansijski asistent. Spreman sam za analizu KIR-a, KUR-a ili Knjige Člana 35. Šta želite da proverimo?' }
    ]);
    const [aiInput, setAiInput] = useState('');
    const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);

    useEffect(() => {
        const loadSuppliers = async () => {
            const suppliers = await supplierService.getAllSuppliers();
            setAllSuppliers(suppliers);
        };
        loadSuppliers();
    }, []);

    // MODALS
    const [stornoModal, setStornoModal] = useState<{ isOpen: boolean, transactionId: string | null }>({ isOpen: false, transactionId: null });
    const [stornoPassword, setStornoPassword] = useState('');
    const [previewDoc, setPreviewDoc] = useState<Transaction | null>(null);
    const [showAddManualModal, setShowAddManualModal] = useState(false);
    const [newManualOb, setNewManualOb] = useState<Partial<Transaction>>({
        cisCode: '',
        client: '',
        supplier: '',
        bruttoRsd: 0,
        currency: 'RSD',
        status: 'Debt'
    });

    // FILTERS (Mandatory per Request)
    const [filters, setFilters] = useState({
        resFrom: '2026-02-01',
        resTo: '2026-03-31',
        stayFrom: '2026-05-01',
        stayTo: '2026-09-30',
        supplier: '',
        type: '',
        agent: '',
        status: '',
        office: '',
        search: ''
    });

    // --- ACTIONS ---
    const handleStornoClick = (id: string) => {
        setStornoModal({ isOpen: true, transactionId: id });
    };

    const confirmStorno = () => {
        if (stornoPassword === 'admin123') {
            setData(prev => prev.map(t =>
                t.id === stornoModal.transactionId
                    ? { ...t, status: 'Storniran', isStorned: true, stornoDate: new Date().toISOString() }
                    : t
            ));
            alert('Dokument uspešno storniran. Zapis je sačuvan u sistemu kao storno dokument.');
            setStornoModal({ isOpen: false, transactionId: null });
            setStornoPassword('');
        } else {
            alert('Pogrešna lozinka za storniranje!');
        }
    };

    const [rates] = useState<NBS_Rate[]>([
        { code: 'EUR', rate: 117.02 },
        { code: 'USD', rate: 108.45 },
        { code: 'GBP', rate: 138.22 }
    ]);

    // --- DERIVED DATA & CALCULATIONS ---
    const filteredData = useMemo(() => {
        return data.filter(t => {
            const matchSearch = t.client.toLowerCase().includes(filters.search.toLowerCase()) ||
                t.cisCode.toLowerCase().includes(filters.search.toLowerCase());
            const matchSupplier = !filters.supplier || t.supplier === filters.supplier;
            const matchAgent = !filters.agent || t.agent === filters.agent;
            const matchStatus = !filters.status || t.status === filters.status;
            const matchType = !filters.type || t.type === filters.type;

            return matchSearch && matchSupplier && matchAgent && matchStatus && matchType;
        });
    }, [data, filters]);

    const totals = useMemo(() => {
        return filteredData.reduce((acc, t) => ({
            brutto: acc.brutto + t.bruttoRsd,
            net: acc.net + t.netbRsd,
            margin: acc.margin + t.marginRsd,
            vat: acc.vat + t.vatRsd
        }), { brutto: 0, net: 0, margin: 0, vat: 0 });
    }, [filteredData]);

    // --- EXPORT FUNCTIONS ---
    const exportToJson = () => {
        const blob = new Blob([JSON.stringify(filteredData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FIL_Export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Financial Report");
        XLSX.writeFile(wb, `FIL_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPdf = () => {
        const doc = new jsPDF('landscape');
        doc.text("Financial Intelligence & Ledger (FIL) Hub - Report", 14, 15);

        const tableData = filteredData.map(t => [
            t.cisCode, t.client, t.supplier, t.destination,
            t.bruttoRsd.toLocaleString(), t.marginRsd.toLocaleString(), t.status
        ]);

        autoTable(doc, {
            startY: 20,
            head: [['CIS', 'Klijent', 'Dobavljač', 'Destinacija', 'Brutto (RSD)', 'Marža (RSD)', 'Status']],
            body: tableData,
        });

        doc.save(`FIL_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportToXml = () => {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<FinancialReport>\n';
        filteredData.forEach(t => {
            xml += `  <Transaction id="${t.id}">\n    <CIS>${t.cisCode}</CIS>\n    <Brutto>${t.bruttoRsd}</Brutto>\n    <Margin>${t.marginRsd}</Margin>\n  </Transaction>\n`;
        });
        xml += '</FinancialReport>';

        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FIL_Export_${new Date().toISOString().split('T')[0]}.xml`;
        a.click();
    };

    // --- AI LOGIC ---
    const handleAiSend = () => {
        if (!aiInput.trim()) return;

        const userMsg = aiInput;
        setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setAiInput('');

        // Simulate AI thinking and response
        setTimeout(() => {
            let response = "Hmm, zanimljivo pitanje. Da pogledam podatke...";

            const query = userMsg.toLowerCase();
            if (query.includes('marž') || query.includes('profit')) {
                const avgMargin = (totals.margin / totals.brutto * 100).toFixed(1);
                response = `Vaša prosečna marža na filtriranim podacima je ${avgMargin}%. Ukupna bruto marža iznosi ${totals.margin.toLocaleString()} RSD. Najprofitabilnija destinacija trenutno je Grčka (Tasos).`;
            } else if (query.includes('isplat') || query.includes('dug')) {
                const debtCount = filteredData.filter(t => t.status === 'Debt').length;
                response = `U trenutnom filteru imate ${debtCount} neizmirenih transakcija. Preporučujem da se fokusirate na naplatu od subagenata koji čine 40% ovog duga.`;
            } else if (query.includes('sazmi') || query.includes('izvestaj')) {
                response = `Evo brzog sažetka: Bruto promet iznosi ${totals.brutto.toLocaleString()} RSD. Imate ${filteredData.length} rezervacija u ovom periodu. Likvidnost je stabilna, ali obratite pažnju na isplate dobavljačima sledeće nedelje (oko 2.4 miliona RSD).`;
            } else {
                response = "Jasno. Da li želite da uradim export ovih podataka u Excel ili da proverim statuse fiskalizacije na SEF-u?";
            }

            setAiMessages(prev => [...prev, { role: 'ai', text: response }]);
        }, 1000);
    };

    // --- RENDER HELPERS ---
    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="fil-dashboard-grid animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <div className="stat-card glass ai-advisor-card" style={{ gridColumn: 'span 2', minHeight: '200px' }}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                                <BrainCircuit className="cyan" size={32} />
                                <h3 className="bold" style={{ fontSize: '18px' }}>AI Rezime Stanja</h3>
                            </div>
                            <p className="fil-text-dim" style={{ lineHeight: '1.6' }}>
                                Trenutna bruto marža na svim tržištima je iznad očekivanog proseka za 2.4%.
                                <strong> Subagent 'Travel Balkan'</strong> ima dug od 1.2M RSD, dok je stepen naplate od individualnih putnika na visokih 94%.
                                Poreska obaveza za PPDV (Član 35) za ovaj kvartal je projektovana na <span className="gold">{totals.vat.toLocaleString()} RSD</span>.
                            </p>
                            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                <div className="status-badge status-paid">Sistem Likvidan</div>
                                <div className="status-badge status-pending">SEF Veza Aktivna</div>
                                <div className="status-badge status-paid">ESIR Spreman</div>
                            </div>
                        </div>

                        <div className="stat-card glass">
                            <h4 className="bold" style={{ marginBottom: '15px' }}>Struktura Prodaje</h4>
                            <div style={{ height: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <PieChart size={48} className="cyan opacity-50" />
                            </div>
                            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                    <span>Individualni (B2C)</span>
                                    <span className="bold">62%</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                    <span>Subagenti (B2B)</span>
                                    <span className="bold">38%</span>
                                </div>
                            </div>
                        </div>

                        <div className="stat-card glass" style={{ gridColumn: 'span 3' }}>
                            <h4 className="bold" style={{ marginBottom: '15px' }}>Projected Cash Flow (30 dana)</h4>
                            <div style={{ height: '150px', display: 'flex', alignItems: 'flex-end', gap: '10px', padding: '10px' }}>
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <div key={i} style={{ flex: 1, background: i === 7 ? 'var(--fil-accent)' : 'rgba(0, 229, 255, 0.1)', height: `${30 + Math.random() * 70}%`, borderRadius: '4px' }}></div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '10px', color: 'var(--fil-text-dim)' }}>
                                <span>01. MART</span>
                                <span>15. MART</span>
                                <span>31. MART</span>
                            </div>
                        </div>
                    </div>
                );

            case 'kir': // Knjiga Izlaznih Računa (KIR)
                return (
                    <div className="fil-ledger-container animate-fade-in">
                        <div className="fil-table-header glass" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="bold cyan">KIR - Knjiga Izlaznih Računa (Fiskalizacija & SEF)</h3>
                            <div className="status-badge status-paid">Automatska Sinhronizacija Aktivna</div>
                        </div>
                        <div className="fil-table-wrapper">
                            <table className="fil-table">
                                <thead>
                                    <tr>
                                        <th>Dosije / Cis</th>
                                        <th>Račun / PFR Numero</th>
                                        <th>Datum Izdavanja</th>
                                        <th>Klijent (PIB/JMBG)</th>
                                        <th>Osnovica (RSD)</th>
                                        <th>PDV Marža (RSD)</th>
                                        <th>Ukupno (RSD)</th>
                                        <th>Sef Status</th>
                                        <th>ESIR Status</th>
                                        <th style={{ textAlign: 'right' }}>Akcije</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map(t => (
                                        <tr key={t.id} className={t.isStorned ? 'row-storned' : ''}>
                                            <td className="bold">{t.cisCode}</td>
                                            <td className="cyan">{t.id.replace('TR-', 'FAC-')}</td>
                                            <td className="fil-text-dim">{t.reservationDate}</td>
                                            <td>
                                                <div className="bold">{t.client}</div>
                                                <div style={{ fontSize: '10px' }}>{t.type === 'B2C-Legal' ? '102938475' : '0102985123456'}</div>
                                            </td>
                                            <td>{(t.bruttoRsd - t.marginRsd + (t.marginRsd - t.vatRsd)).toLocaleString()}</td>
                                            <td className="gold">{t.vatRsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                            <td className="bold">{t.bruttoRsd.toLocaleString()}</td>
                                            <td>
                                                <span
                                                    className={`status-badge status-${t.isStorned ? 'storniran' : t.status.toLowerCase()}`}
                                                    style={{ fontSize: '9px' }}
                                                    title={t.isStorned ? 'Stornirano: ' + t.stornoDate : `Plaćeno: ${t.paidAmountRsd.toLocaleString()} RSD`}
                                                >
                                                    {t.isStorned ? 'STORNIRANO' : (
                                                        t.status === 'Paid' ? 'LIKVIDIRANO' : (
                                                            t.status === 'Partial' ? 'DELIMIČNO' : (
                                                                t.status === 'Overdue' ? 'KASNI' : 'DUG'
                                                            )
                                                        )
                                                    )}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="status-badge status-paid" style={{ fontSize: '9px' }}>{t.isStorned ? 'STORNO PFR' : 'PFR OK'}</span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                                    <button className="btn-action-small" title="Otvori" onClick={() => setPreviewDoc(t)}><Eye size={14} /></button>
                                                    {!t.isStorned && (
                                                        <>
                                                            <button className="btn-action-small" title="Uredi"><Edit size={14} /></button>
                                                            <button className="btn-action-small storno" title="Storniraj" onClick={() => handleStornoClick(t.id)}><Slash size={14} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'kur': // Knjiga Ulaznih Računa (KUR)
                return (
                    <div className="fil-ledger-container animate-fade-in">
                        <div className="fil-table-header glass" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <h3 className="bold gold">KUR - Knjiga Ulaznih Računa (Obaveze ka dobavljačima)</h3>
                                <div className="status-badge status-pending">Potrebno uparivanje: 4 fakture</div>
                            </div>
                            <button
                                className="btn-export"
                                onClick={() => setShowAddManualModal(true)}
                                style={{ background: 'var(--fil-accent)', color: '#020b0e', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}
                            >
                                <Plus size={18} /> NOVA OBAVEZA
                            </button>
                        </div>
                        <div className="fil-table-wrapper">
                            <table className="fil-table">
                                <thead>
                                    <tr>
                                        <th>Broj Fakture</th>
                                        <th>Dobavljač</th>
                                        <th>Dosije (Povezano)</th>
                                        <th>Iznos (Valuta)</th>
                                        <th>Kurs NBS</th>
                                        <th>Iznos (RSD)</th>
                                        <th>Datum Dospeća</th>
                                        <th>Status Isplate</th>
                                        <th style={{ textAlign: 'right' }}>Akcije</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map(t => (
                                        <tr key={t.id} className={t.isStorned ? 'row-storned' : ''}>
                                            <td className="bold">FAK-{Math.floor(Math.random() * 9000) + 1000}</td>
                                            <td className="bold">{t.supplier}</td>
                                            <td className="cyan">{t.cisCode}</td>
                                            <td>{(t.netbRsd / 117).toFixed(2)} EUR</td>
                                            <td className="fil-text-dim">117.02</td>
                                            <td className="bold">{t.netbRsd.toLocaleString()}</td>
                                            <td>2026-05-15</td>
                                            <td>
                                                <span className={`status-badge status-${t.isStorned ? 'storniran' : t.status.toLowerCase()}`}>
                                                    {t.isStorned ? 'STORNIRANO' : (t.status === 'Paid' ? 'LIQUIDIRANO' : 'ČEKA RED')}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                                    <button className="btn-action-small" title="Otvori" onClick={() => setPreviewDoc(t)}><Eye size={14} /></button>
                                                    {!t.isStorned && (
                                                        <>
                                                            <button className="btn-action-small" title="Uredi"><Edit size={14} /></button>
                                                            <button className="btn-action-small storno" title="Storniraj" onClick={() => handleStornoClick(t.id)}><Slash size={14} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'tax': // Knjiga Člana 35
                return (
                    <div className="fil-ledger-container animate-fade-in">
                        <div className="fil-table-header glass" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="bold" style={{ color: '#ff4d4d' }}>Evidencija po Članu 35 (Službena Knjiga)</h3>
                            <button className="btn-export" onClick={exportToPdf}>Generiši Službeni PDF</button>
                        </div>
                        <div className="fil-table-wrapper">
                            <table className="fil-table">
                                <thead>
                                    <tr>
                                        <th>Redni br.</th>
                                        <th>Cis Kod / Dosije</th>
                                        <th>Zatvoren Dana</th>
                                        <th>Ukupna Prodaja (A)</th>
                                        <th>Ukupna Nabavka (B)</th>
                                        <th>Bruto Marža (A-B)</th>
                                        <th>Osnovica (C)</th>
                                        <th>PDV 20% (D)</th>
                                        <th style={{ textAlign: 'right' }}>Akcije</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.filter(t => t.status === 'Paid' || t.isStorned).map((t, i) => (
                                        <tr key={t.id} className={t.isStorned ? 'row-storned' : ''}>
                                            <td className="fil-text-dim">{i + 1}</td>
                                            <td className="bold">{t.cisCode}</td>
                                            <td>{t.reservationDate}</td>
                                            <td className="bold">{t.bruttoRsd.toLocaleString()}</td>
                                            <td>{t.netbRsd.toLocaleString()}</td>
                                            <td className="gold bold">{t.marginRsd.toLocaleString()}</td>
                                            <td>{(t.marginRsd - t.vatRsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                            <td className="bold" style={{ color: 'var(--fil-danger)' }}>{t.vatRsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                                    <button className="btn-action-small" title="Otvori" onClick={() => setPreviewDoc(t)}><Eye size={14} /></button>
                                                    {!t.isStorned && (
                                                        <>
                                                            <button className="btn-action-small" title="Uredi"><Edit size={14} /></button>
                                                            <button className="btn-action-small storno" title="Storniraj" onClick={() => handleStornoClick(t.id)}><Slash size={14} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: 'rgba(0,0,0,0.3)', fontWeight: 800 }}>
                                        <td colSpan={3}>UKUPNO ZA PERIOD</td>
                                        <td>{totals.brutto.toLocaleString()}</td>
                                        <td>{totals.net.toLocaleString()}</td>
                                        <td className="gold">{totals.margin.toLocaleString()}</td>
                                        <td>{(totals.margin - totals.vat).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td style={{ color: 'var(--fil-danger)' }}>{totals.vat.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                );

            case 'cashier': // Blagajnički Dnevnik
                return (
                    <div className="animate-fade-in">
                        <div className="fil-stats-row" style={{ marginBottom: '20px' }}>
                            <div className="stat-card glass">
                                <span className="stat-label">Početno Stanje (Glavna)</span>
                                <span className="stat-value">450,000 RSD</span>
                            </div>
                            <div className="stat-card glass">
                                <span className="stat-label">Promet Danas (Gotovina)</span>
                                <span className="stat-value cyan">85,400 RSD</span>
                            </div>
                            <div className="stat-card glass">
                                <span className="stat-label">Izdato (Isplatno)</span>
                                <span className="stat-value" style={{ color: '#ff4d4d' }}>-12,000 RSD</span>
                            </div>
                            <div className="stat-card glass">
                                <span className="stat-label">Trenutna Blagajna</span>
                                <span className="stat-value gold">523,400 RSD</span>
                            </div>
                        </div>

                        <div className="fil-ledger-container">
                            <div className="fil-table-header glass" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <Building2 size={18} className="cyan" />
                                    <h3 className="bold">Blagajnički Dnevnik - {activeOffice}</h3>
                                </div>
                                <select className="fil-select" value={activeOffice} onChange={e => setActiveOffice(e.target.value)}>
                                    <option>Beograd</option>
                                    <option>Novi Sad</option>
                                    <option>Niš</option>
                                </select>
                            </div>
                            <div className="fil-table-wrapper">
                                <table className="fil-table">
                                    <thead>
                                        <tr>
                                            <th>Vreme</th>
                                            <th>Opis / Dosije</th>
                                            <th>Vrsta</th>
                                            <th>Uplata (+)</th>
                                            <th>Isplata (-)</th>
                                            <th>Ostatak</th>
                                            <th>Operater</th>
                                            <th style={{ textAlign: 'right' }}>Akcije</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData.slice(0, 10).map((t, i) => (
                                            <tr key={i} className={t.isStorned ? 'row-storned' : ''}>
                                                <td className="fil-text-dim">09:4{i}</td>
                                                <td>{i % 2 === 0 ? `Uplata rezervacije ${t.cisCode}` : 'Isplata dnevnice (Nenad)'}</td>
                                                <td className="bold">{i % 2 === 0 ? 'PRIMA' : 'IZDAJE'}</td>
                                                <td className="cyan">{i % 2 === 0 ? t.bruttoRsd.toLocaleString() : '-'}</td>
                                                <td style={{ color: '#ff4d4d' }}>{i % 2 !== 0 ? '5,000' : '-'}</td>
                                                <td className="bold">{(500000 + (i * 1000)).toLocaleString()}</td>
                                                <td>Nenad</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                                        <button className="btn-action-small" title="Otvori" onClick={() => setPreviewDoc(t)}><Eye size={14} /></button>
                                                        {!t.isStorned && (
                                                            <>
                                                                <button className="btn-action-small" title="Uredi"><Edit size={14} /></button>
                                                                <button className="btn-action-small storno" title="Storniraj" onClick={() => handleStornoClick(t.id)}><Slash size={14} /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div >
                );
            case 'bank':
                return (
                    <div className="stat-card glass animate-fade-in" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
                        <div style={{ background: 'rgba(0,229,255,0.1)', padding: '30px', borderRadius: '50%', marginBottom: '10px' }}>
                            <RefreshCw size={64} className="cyan animate-spin-slow" />
                        </div>
                        <h3 className="bold" style={{ fontSize: '22px' }}>Spreman za uvoz bankovnog izvoda</h3>
                        <p className="fil-text-dim" style={{ maxWidth: '400px' }}>Prevucite .TXT ili .XML fajl ovde. Sistem će automatski prepoznati uplate po modelu 97 i upariti ih sa Vašim Dosijeima.</p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button className="btn-export" style={{ padding: '12px 30px' }}>Odaberi Fajl</button>
                            <button className="btn-export" style={{ background: 'rgba(255,255,255,0.05)' }}>Prethodni Uvozi</button>
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="fil-ledger-container animate-fade-in">
                        <div className="stat-card glass" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                                <RefreshCw className="cyan" size={28} />
                                <h3 className="bold">SEF API Management (e-Fakture)</h3>
                            </div>

                            <div className="filter-group" style={{ marginBottom: '20px' }}>
                                <label>Okruženje (Environment)</label>
                                <select className="fil-select" style={{ width: '100%' }}>
                                    <option>Srbija - Demo (Preporučeno za testiranje)</option>
                                    <option>Srbija - Produkcija</option>
                                </select>
                            </div>

                            <div className="filter-group" style={{ marginBottom: '20px' }}>
                                <label>API Ključ (Settings {">"} API menadžment)</label>
                                <input
                                    type="password"
                                    className="fil-input"
                                    placeholder="Unesite vaš API ključ dobijen sa eFaktura portala"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ background: 'rgba(255,179,0,0.05)', border: '1px solid rgba(255,179,0,0.2)', padding: '15px', borderRadius: '12px', marginBottom: '25px' }}>
                                <p style={{ fontSize: '13px', color: 'var(--fil-gold)', margin: 0, lineHeight: '1.5' }}>
                                    <AlertTriangle size={14} style={{ marginRight: '5px' }} />
                                    <strong>Savet:</strong> API ključ se generiše na portalu eFaktura pod opcijom <strong>Podešavanja {">"} API menadžment</strong>.
                                    Nikada ne delite ovaj ključ sa neovlašćenim licima.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn-export" style={{ flex: 1, padding: '12px' }}>Sačuvaj Podešavanja</button>
                                <button className="btn-export" style={{ background: 'rgba(0,229,255,0.1)', flex: 1, padding: '12px' }}>Testiraj Koneciju</button>
                            </div>

                            <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid var(--fil-border)' }} />

                            <h4 className="bold" style={{ marginBottom: '15px' }}>Tehnička Dokumentacija</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <a href="https://demo.efaktura.mfin.gov.rs/swagger-ui/index.html" target="_blank" className="fil-text-dim" style={{ fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Globe size={14} /> Swagger UI - Demo okruženje
                                </a>
                                <a href="#" className="fil-text-dim" style={{ fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={14} /> Interno tehničko uputstvo (UBL 2.1)
                                </a>
                            </div>
                        </div>
                    </div>
                );
            case 'payments':
                return <SupplierFinance />;
            default:
                return <div>Nepoznata sekcija</div>;
        }
    };

    return (
        <div className={`fil-hub-container ${theme}-theme`}>
            {/* HEADER WITH NBS TICKER */}
            <header className="fil-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ background: 'var(--fil-accent)', color: '#020b0e', padding: '8px', borderRadius: '10px' }}>
                        <Scale size={24} />
                    </div>
                    <div>
                        <h1 className="bold" style={{ fontSize: '20px', margin: 0 }}>Financial Intelligence & Ledger</h1>
                        <div className="fil-text-dim" style={{ fontSize: '12px' }}>Usklađeno sa zakonima RS • Član 35 • SEF / ESIR Ready</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button
                        className={`btn-export ${showQuickStats ? 'active' : ''}`}
                        onClick={() => setShowQuickStats(!showQuickStats)}
                        style={{
                            borderColor: 'var(--fil-accent)',
                            padding: '10px 20px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {showQuickStats ? <EyeOff size={18} /> : <TrendingUp size={18} />}
                        {showQuickStats ? 'Sakrij brzu analitiku' : 'Prikaži brzu analitiku'}
                    </button>
                    <div className="fil-header-info">
                        <span className="gold bold">{new Date().toLocaleDateString('sr-RS')}</span>
                    </div>
                </div>
            </header>

            <div className="fil-main-wrapper">
                {/* TOP STATS ROW - HIDDEN BY DEFAULT */}
                {showQuickStats && (
                    <div className="fil-stats-row animate-fade-in" style={{ marginBottom: '30px' }}>
                        <div className="stat-card">
                            <span className="stat-label">Ukupan Bruto Promet</span>
                            <span className="stat-value">{totals.brutto.toLocaleString()} <span style={{ fontSize: '14px' }}>RSD</span></span>
                            <div className="stat-delta delta-up">
                                <TrendingUp size={14} /> +12.5% u odnosu na prošli mesec
                            </div>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Ukupna Neto Marža</span>
                            <span className="stat-value gold">{totals.margin.toLocaleString()} <span style={{ fontSize: '14px' }}>RSD</span></span>
                            <div className="stat-delta delta-up">
                                <TrendingUp size={14} /> +4.2% yield optimizacija
                            </div>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Poreska Obaveza (PDV Čl.35)</span>
                            <span className="stat-value" style={{ color: '#ff4d4d' }}>{totals.vat.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span style={{ fontSize: '14px' }}>RSD</span></span>
                            <div className="stat-delta">
                                <Scale size={14} /> Automatski obračunato
                            </div>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Status Naplate</span>
                            <span className="stat-value cyan">{(totals.brutto * 0.88).toLocaleString()} <span style={{ fontSize: '14px' }}>RSD</span></span>
                            <div className="stat-delta" style={{ color: 'var(--fil-text-dim)' }}>
                                88% realizovanih uplate
                            </div>
                        </div>
                    </div>
                )}

                <div className="fil-filters-panel">
                    <div className="filter-group">
                        <label>PRETRAGA</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--fil-text-dim)' }} />
                            <input
                                type="text"
                                className="fil-input"
                                placeholder="Klijent, CIS kod..."
                                style={{ paddingLeft: '38px', width: '100%' }}
                                value={filters.search}
                                onChange={e => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="filter-group" style={{ minWidth: '220px' }}>
                        <label>REZERVACIJE OD...DO</label>
                        <DateRangeInput
                            label="Rezervacije"
                            startValue={filters.resFrom}
                            endValue={filters.resTo}
                            onChange={(start, end) => setFilters({ ...filters, resFrom: start, resTo: end })}
                        />
                    </div>
                    <div className="filter-group" style={{ minWidth: '220px' }}>
                        <label>BORAVAK OD...DO</label>
                        <DateRangeInput
                            label="Boravak"
                            startValue={filters.stayFrom}
                            endValue={filters.stayTo}
                            onChange={(start, end) => setFilters({ ...filters, stayFrom: start, stayTo: end })}
                        />
                    </div>
                    <div className="filter-group">
                        <label>DOBAVLJAČ</label>
                        <select className="fil-select" style={{ width: '100%' }} value={filters.supplier} onChange={e => setFilters({ ...filters, supplier: e.target.value })}>
                            <option value="">Svi dobavljači</option>
                            {Array.from(new Set(allSuppliers.map(s => s.category || 'Ostalo'))).map(cat => (
                                <optgroup key={cat} label={cat} style={{ background: '#0f172a' }}>
                                    {allSuppliers
                                        .filter(s => (s.category || 'Ostalo') === cat)
                                        .map(s => (
                                            <option key={s.id} value={s.name}>
                                                {s.name}
                                            </option>
                                        ))
                                    }
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {/* Second Row of Filters */}
                    <div className="filter-group">
                        <label>TIP PRODAJE</label>
                        <select className="fil-select" style={{ width: '100%' }} value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
                            <option value="">Svi tipovi</option>
                            <option value="B2C-Individual">Individualni (B2C)</option>
                            <option value="B2B-Subagent">Subagenti (B2B)</option>
                            <option value="B2C-Legal">Pravna lica (B2C)</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>STATUS NAPLATE</label>
                        <select className="fil-select" style={{ width: '100%' }} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                            <option value="">Svi statusi</option>
                            <option value="Paid">Likvidirano</option>
                            <option value="Partial">Delimično</option>
                            <option value="Debt">Dug</option>
                            <option value="Overdue">Kasni</option>
                            <option value="Storniran">Stornirano</option>
                        </select>
                    </div>
                    {/* Empty slots for grid alignment */}
                    <div className="filter-group"></div>
                    <div className="filter-group"></div>
                </div>

                {/* TABS & ACTIONS */}
                <div className="fil-tabs-wrapper" style={{ marginBottom: '30px' }}>
                    <div className="fil-tabs">
                        <button
                            className={`btn-export ${activeTab === 'dashboard' ? 'cyan' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            <LayoutDashboard size={18} /> Dashboard
                        </button>
                        <button
                            className={`btn-export ${activeTab === 'kir' ? 'cyan' : ''}`}
                            onClick={() => setActiveTab('kir')}
                        >
                            <FileText size={18} /> KIR (Izlaz)
                        </button>
                        <button
                            className={`btn-export ${activeTab === 'kur' ? 'cyan' : ''}`}
                            onClick={() => setActiveTab('kur')}
                        >
                            <Building2 size={18} /> KUR (Ulaz)
                        </button>
                        <button
                            className={`btn-export ${activeTab === 'tax' ? 'cyan' : ''}`}
                            onClick={() => setActiveTab('tax')}
                        >
                            <Scale size={18} /> Član 35 (Knjiga)
                        </button>
                        <button
                            className={`btn-export ${activeTab === 'payments' ? 'cyan' : ''}`}
                            onClick={() => setActiveTab('payments')}
                        >
                            <CreditCard size={18} /> Plaćanja
                        </button>
                        <button
                            className={`btn-export ${activeTab === 'cashier' ? 'cyan' : ''}`}
                            onClick={() => setActiveTab('cashier')}
                        >
                            <Wallet size={18} /> Blagajna
                        </button>
                        <button
                            className={`btn-export ${activeTab === 'bank' ? 'cyan' : ''}`}
                            onClick={() => setActiveTab('bank')}
                        >
                            <RefreshCw size={18} /> Banka
                        </button>
                        <button
                            className={`btn-export ${activeTab === 'settings' ? 'cyan' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <RefreshCw size={18} /> API Config
                        </button>
                    </div>
                </div>

                <div className="fil-actions" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="fil-text-dim bold" style={{ fontSize: '11px', letterSpacing: '1px' }}>EKSPORT:</div>
                        <button className="btn-export" style={{ fontSize: '10px', padding: '8px 15px', minWidth: '80px' }} onClick={() => alert('Minimax Export spreman')}>MINIMAX</button>
                        <button className="btn-export" style={{ fontSize: '10px', padding: '8px 15px', minWidth: '80px' }} onClick={() => alert('Pantheon Export spreman')}>PANTHEON</button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-export" onClick={exportToExcel} title="Excel">
                            <Download size={14} /> XLSX
                        </button>
                        <button className="btn-export" onClick={exportToPdf} title="PDF">
                            <FileText size={14} /> PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {renderTabContent()}
            </div>

            {/* AI AGENT FLOATING BUTTON & CHAT */}
            <AnimatePresence>
                {isAiOpen ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 50 }}
                        className="fil-ai-bubble"
                    >
                        <div className="ai-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <BrainCircuit size={20} />
                                <span>FIL AI - Finansijski Savetnik</span>
                            </div>
                            <button onClick={() => setIsAiOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="ai-messages">
                            {aiMessages.map((m, idx) => (
                                <div key={idx} className={`message ${m.role}`}>
                                    {m.text}
                                </div>
                            ))}
                        </div>

                        <div className="ai-input-box">
                            <input
                                type="text"
                                placeholder="Pitaj me o maržama, dugovanjima ili sažetku..."
                                className="fil-input"
                                style={{ flex: 1 }}
                                value={aiInput}
                                onChange={e => setAiInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleAiSend()}
                            />
                            <button
                                onClick={handleAiSend}
                                style={{ background: 'var(--fil-accent)', border: 'none', borderRadius: '10px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <Send size={18} color="#020b0e" />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.1 }}
                        className="fil-ai-trigger"
                        onClick={() => setIsAiOpen(true)}
                        style={{
                            position: 'fixed',
                            bottom: '30px',
                            right: '30px',
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #00e5ff, #008291)',
                            border: 'none',
                            boxShadow: '0 0 20px var(--fil-accent-glow)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 1000
                        }}
                    >
                        <Bot size={30} color="#020b0e" />
                        <span style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#ff4d4d',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            fontSize: '10px',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800
                        }}>1</span>
                    </motion.button>
                )}

                {/* STORNO SECURITY MODAL */}
                {stornoModal.isOpen && (
                    <div className="fil-modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="fil-modal-content storno-security"
                        >
                            <div className="modal-header-storno">
                                <AlertTriangle color="var(--fil-danger)" size={24} />
                                <h3>SIGURNOSNA POTVRDA STORNIRANJA</h3>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--fil-text-dim)', margin: '15px 0' }}>
                                Pokušavate da stornirate dokument <strong>{stornoModal.transactionId}</strong>.
                                Ova akcija je trajna i biće zabeležena u revizorskom logu.
                            </p>
                            <div className="filter-group">
                                <label>LOZINKA OVLAŠĆENOG LICA</label>
                                <input
                                    type="password"
                                    className="fil-input"
                                    placeholder="Unesite administrativnu lozinku"
                                    value={stornoPassword}
                                    onChange={e => setStornoPassword(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button className="btn-export storno" style={{ flex: 1, background: 'var(--fil-danger)', color: 'white' }} onClick={confirmStorno}>
                                    POTVRDI STORNO
                                </button>
                                <button className="btn-export" style={{ flex: 1 }} onClick={() => setStornoModal({ isOpen: false, transactionId: null })}>
                                    ODUSTANI
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                <AnimatePresence>
                    {showAddManualModal && (
                        <div
                            className="fil-modal-overlay"
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.92)',
                                backdropFilter: 'blur(15px)',
                                zIndex: 10000,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '20px'
                            }}
                            onClick={() => setShowAddManualModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                                className="fil-modal-content glass"
                                style={{
                                    width: '100%',
                                    maxWidth: '520px',
                                    padding: '40px',
                                    borderRadius: '32px',
                                    border: '1px solid rgba(0, 229, 255, 0.3)',
                                    backgroundColor: '#050c14',
                                    boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 0 100px rgba(0, 229, 255, 0.1)',
                                    position: 'relative'
                                }}
                                onClick={e => e.stopPropagation()}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                    <div>
                                        <h2 className="bold cyan" style={{ margin: 0, fontSize: '24px' }}>Nova Obaveza</h2>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Ručni unos u Knjigu Ulaznih Računa</p>
                                    </div>
                                    <button
                                        onClick={() => setShowAddManualModal(false)}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: 'none',
                                            color: 'white',
                                            cursor: 'pointer',
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="fil-form-grid" style={{ display: 'grid', gap: '20px' }}>
                                    <div className="filter-group">
                                        <label style={{ color: 'var(--fil-accent)', fontWeight: '800', fontSize: '11px', marginBottom: '8px' }}>DOBAVLJAČ</label>
                                        <select
                                            className="fil-input"
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255,255,255,0.03)',
                                                height: '45px',
                                                color: 'white',
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}
                                            value={newManualOb.supplier}
                                            onChange={e => setNewManualOb({ ...newManualOb, supplier: e.target.value })}
                                            autoFocus
                                        >
                                            <option value="">— Izaberite dobavljača —</option>
                                            {/* Group by category for better organization */}
                                            {Array.from(new Set(allSuppliers.map(s => s.category || 'Ostalo'))).map(cat => (
                                                <optgroup key={cat} label={cat} style={{ background: '#050c14' }}>
                                                    {allSuppliers
                                                        .filter(s => (s.category || 'Ostalo') === cat)
                                                        .map(s => (
                                                            <option key={s.id} value={s.name}>
                                                                {s.name} {s.subcategory ? `(${s.subcategory})` : ''}
                                                            </option>
                                                        ))
                                                    }
                                                </optgroup>
                                            ))}
                                            <option value="OSTALI TROŠKOVI">OSTALI TROŠKOVI (Nije na listi)</option>
                                        </select>
                                    </div>
                                    <div className="filter-group">
                                        <label style={{ color: 'var(--fil-accent)', fontWeight: '800', fontSize: '11px', marginBottom: '8px' }}>BROJ RAČUNA / FAKTURE</label>
                                        <input
                                            type="text" className="fil-input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', height: '45px' }}
                                            placeholder="FAK-2026-XXXX"
                                            value={newManualOb.id}
                                            onChange={e => setNewManualOb({ ...newManualOb, id: e.target.value })}
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <label style={{ color: 'var(--fil-accent)', fontWeight: '800', fontSize: '11px', marginBottom: '8px' }}>IZNOS (RSD)</label>
                                        <input
                                            type="number" className="fil-input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', height: '45px' }}
                                            value={newManualOb.bruttoRsd}
                                            onChange={e => setNewManualOb({ ...newManualOb, bruttoRsd: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <label style={{ color: 'var(--fil-accent)', fontWeight: '800', fontSize: '11px', marginBottom: '8px' }}>DOSIJE / CIS KOD (Opciono)</label>
                                        <input
                                            type="text" className="fil-input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', height: '45px' }}
                                            placeholder="Npr. CIS-2026-88"
                                            value={newManualOb.cisCode}
                                            onChange={e => setNewManualOb({ ...newManualOb, cisCode: e.target.value })}
                                        />
                                    </div>

                                    <div style={{
                                        background: 'rgba(255,179,0,0.08)',
                                        padding: '15px',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,179,0,0.15)',
                                        color: '#ffb300',
                                        fontSize: '12px',
                                        display: 'flex',
                                        gap: '12px'
                                    }}>
                                        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                                        <span>Ručni unos se koristi isključivo za troškove koji nisu direktno povučeni kroz automatske integracije.</span>
                                    </div>

                                    <button
                                        className="btn-export"
                                        style={{
                                            background: 'var(--fil-accent)',
                                            color: '#020b0e',
                                            padding: '18px',
                                            fontWeight: '900',
                                            marginTop: '10px',
                                            fontSize: '15px',
                                            borderRadius: '16px',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                            if (!newManualOb.supplier || !newManualOb.id) {
                                                alert('Molimo unesite dobavljača i broj računa.');
                                                return;
                                            }
                                            const transaction: Transaction = {
                                                id: newManualOb.id || `TR-${Date.now()}`,
                                                cisCode: newManualOb.cisCode || 'OPŠTI-TROŠAK',
                                                reservationDate: new Date().toISOString().split('T')[0],
                                                stayFrom: '', stayTo: '',
                                                client: newManualOb.supplier || 'Dobavljač',
                                                type: 'B2C-Legal',
                                                supplier: newManualOb.supplier || 'Opšte',
                                                destination: 'Business Operations',
                                                country: 'SRB', agent: 'Sistem', office: 'Beograd',
                                                currency: 'RSD',
                                                bruttoRsd: newManualOb.bruttoRsd || 0,
                                                netbRsd: newManualOb.bruttoRsd || 0,
                                                marginRsd: 0, vatRsd: 0,
                                                status: 'Debt', method: 'Transfer', bankMatched: false,
                                                paidAmountRsd: 0, dueDate: ''
                                            };
                                            setData([transaction, ...data]);
                                            setShowAddManualModal(false);
                                            setNewManualOb({ cisCode: '', client: '', supplier: '', bruttoRsd: 0, currency: 'RSD', status: 'Debt' });
                                            alert('Nova obaveza je uspešno evidentirana u KUR-u.');
                                        }}
                                    >
                                        EVIDENTIRAJ RAČUN
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* DOCUMENT PREVIEW MODAL */}
                {
                    previewDoc && (
                        <div className="fil-modal-overlay">
                            <motion.div
                                initial={{ opacity: 0, y: 100 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="fil-document-preview"
                            >
                                <div className="doc-preview-controls">
                                    <div className="bold">PFR PREGLED DOKUMENTA: {previewDoc.id}</div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="btn-action-small" onClick={() => window.print()}><Download size={16} /></button>
                                        <button className="btn-action-small storno" onClick={() => setPreviewDoc(null)}><X size={16} /></button>
                                    </div>
                                </div>

                                <div className="official-document-paper">
                                    {/* Header */}
                                    <div className="doc-header">
                                        <div className="agency-info">
                                            <div className="bold" style={{ fontSize: '18px' }}>Prime Click To Travel d.o.o.</div>
                                            <div style={{ fontSize: '12px' }}>Knez Mihailova 12, 11000 Beograd</div>
                                            <div style={{ fontSize: '12px' }}>PIB: 102938475 | MB: 08293847</div>
                                            <div style={{ fontSize: '12px' }}>JBKJS: 92837 | Žiro: 160-394857-22</div>
                                        </div>
                                        <div className="doc-meta">
                                            <div className="bold cyan" style={{ fontSize: '20px' }}>FAKTURA br. {previewDoc.id.replace('TR-', '2026-F-')}</div>
                                            <div style={{ fontSize: '12px' }}>Vreme prometa: {previewDoc.reservationDate}</div>
                                            <div style={{ fontSize: '12px' }}>Mesto izdavanja: Beograd</div>
                                        </div>
                                    </div>

                                    <hr style={{ border: 'none', borderBottom: '1px solid #eee', margin: '20px 0' }} />

                                    {/* Parties */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                                        <div className="bill-to">
                                            <div className="fil-text-dim" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Kupac / Primalac:</div>
                                            <div className="bold" style={{ fontSize: '16px' }}>{previewDoc.client}</div>
                                            <div style={{ fontSize: '12px' }}>{previewDoc.destination}</div>
                                            <div style={{ fontSize: '12px' }}>PIB: {previewDoc.type === 'B2C-Legal' ? '102938475' : 'Kupac fizičko lice'}</div>
                                        </div>
                                        <div className="doc-status-pfr">
                                            <div style={{ border: '2px solid #3fb950', padding: '10px', borderRadius: '8px', color: '#3fb950', textAlign: 'center' }}>
                                                <div className="bold">PROMET - PRODAJA</div>
                                                <div style={{ fontSize: '10px' }}>PFR Vreme: 2026-03-02 14:22:10</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <table className="doc-items-table">
                                        <thead>
                                            <tr>
                                                <th>Opis usluge</th>
                                                <th style={{ textAlign: 'right' }}>Jed. cena</th>
                                                <th style={{ textAlign: 'center' }}>Kol.</th>
                                                <th style={{ textAlign: 'center' }}>PDV %</th>
                                                <th style={{ textAlign: 'right' }}>Ukupno</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <strong>Turističko putovanje: {previewDoc.destination}</strong><br />
                                                    <span style={{ fontSize: '11px' }}>Period: {previewDoc.stayFrom} - {previewDoc.stayTo}</span><br />
                                                    <span style={{ fontSize: '11px' }}>Oslobođeno PDV-a po Članu 35 Zakona o PDV-u</span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>{previewDoc.bruttoRsd.toLocaleString()}</td>
                                                <td style={{ textAlign: 'center' }}>1.00</td>
                                                <td style={{ textAlign: 'center' }}>0.00%</td>
                                                <td style={{ textAlign: 'right' }}>{previewDoc.bruttoRsd.toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    {/* Totals Section */}
                                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <div style={{ width: '300px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                                                <span>Osnovica:</span>
                                                <span className="bold">{(previewDoc.bruttoRsd - previewDoc.vatRsd).toLocaleString()} RSD</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                                                <span>PDV (Čl. 35):</span>
                                                <span className="bold">{previewDoc.vatRsd.toLocaleString()} RSD</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderTop: '2px solid #000', marginTop: '10px', fontSize: '18px' }}>
                                                <span className="bold">UKUPNO ZA UPLATU:</span>
                                                <span className="bold cyan">{previewDoc.bruttoRsd.toLocaleString()} RSD</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer / QR */}
                                    <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div style={{ fontSize: '10px', color: '#666' }}>
                                            Dokument je validan bez pečata i potpisa.<br />
                                            Obračun PDV-a na maržu turističke agencije urađen je u skladu sa Članom 35 Zakona o PDV-u.<br />
                                            PFR BROJ: 928374-12345-2026<br />
                                            PFR BROJAČ: 102/10
                                        </div>
                                        <div className="mock-qr-code" style={{ width: '80px', height: '80px', background: '#000', color: '#fff', padding: '5px', fontSize: '8px', textAlign: 'center' }}>
                                            [ QR CODE ]<br />PFR VERIFIED
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
            </AnimatePresence>
        </div>
    );
};

export default FinancialIntelligenceHub;
