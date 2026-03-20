import React, { useState, useEffect, useMemo } from 'react';
import { 
    LayoutDashboard, BookOpen, DownloadCloud, BookCheck, CreditCard, 
    Wallet, ArrowRightLeft, FileText, Search, TrendingUp, EyeOff, 
    RefreshCw, Scale, Bot, X, Send, Download, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './FinancialIntelligenceHub.css';

// --- ENHANCED MULTI-LEDGER MOCK DATA ---
const generateAllLedgerData = () => {
    const suppliers = ['Booking.com', 'Sabre GDS', 'WizzAir', 'Lufthansa', 'Local DMC'];
    const clients = ['Marković Travel', 'Jovanović Petar', 'Global Corp d.o.o', 'Turist Grupa'];

    return {
        dashboard: Array.from({ length: 8 }, (_, i) => ({
            id: `TR-${1000 + i}`, cisCode: `CIS-${12300 + i}`, client: clients[i % 4],
            destination: 'Miks', supplier: suppliers[i % 5], bruttoRsd: 45000 + i * 1000,
            marginRsd: 5000, status: 'Paid', type: 'Dashboard'
        })),
        kir: Array.from({ length: 15 }, (_, i) => ({
            id: `KIR-2026-${200 + i}`, cisCode: `CIS-OUT-${100 + i}`, client: clients[i % 4],
            destination: 'Prodaja Arbanžmana', supplier: 'Interno', bruttoRsd: 120000 + i * 500,
            marginRsd: 15000, status: 'Paid', type: 'B2C'
        })),
        kur: Array.from({ length: 15 }, (_, i) => ({
            id: `KUR-2026-${500 + i}`, cisCode: `INV-${300 + i}`, client: suppliers[i % 5],
            destination: 'Trošak Smeštaja/Prevoza', supplier: suppliers[i % 5], bruttoRsd: 95000 + i * 200,
            marginRsd: 0, status: 'Debt', type: 'Expense'
        })),
        tax: Array.from({ length: 12 }, (_, i) => ({
            id: `TAX-35-${800 + i}`, cisCode: `CALC-${i + 1}`, client: clients[i % 4],
            destination: 'Paket Aranžman', supplier: suppliers[i % 5], bruttoRsd: 150000,
            marginRsd: 22000, vatRsd: 4400, status: 'Verified', type: 'Article 35'
        })),
        bank: Array.from({ length: 10 }, (_, i) => ({
            id: `BNK-IZV-${10 + i}`, cisCode: `IZVOD-NBS`, client: 'NBS / Raiffeisen',
            destination: 'Uplata Klijenta', supplier: 'Banka', bruttoRsd: 88000,
            marginRsd: 0, status: 'Matched', type: 'Bank'
        }))
    };
};

const FinancialIntelligenceHub: React.FC = () => {
    const [theme] = useState('dark');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showQuickStats, setShowQuickStats] = useState(true);
    const [showAiAdvisor, setShowAiAdvisor] = useState(false);
    const [allData] = useState(generateAllLedgerData());
    const [aiInput, setAiInput] = useState('');
    const [aiMessages, setAiMessages] = useState<{role: 'ai' | 'user', text: string}[]>([]);
    const [stornoModal, setStornoModal] = useState({ isOpen: false, transactionId: null as string | null });

    // Global totals from dashboard or KIR for top stats
    const totals = useMemo(() => {
        return allData.kir.reduce((acc, curr) => ({
            brutto: acc.brutto + curr.bruttoRsd,
            margin: acc.margin + curr.marginRsd,
            vat: acc.vat + (curr.marginRsd * 0.20)
        }), { brutto: 0, margin: 0, vat: 0 });
    }, [allData]);

    const handleAiSend = () => {
        if (!aiInput.trim()) return;
        setAiMessages([...aiMessages, { role: 'user', text: aiInput }]);
        setTimeout(() => {
            setAiMessages(prev => [...prev, { 
                role: 'ai', 
                text: "Analizirao sam Vaše podatke. Trenutna prosečna marža je 12.4%, što je iznad kvartalnog proseka. Savetujem proveru dugovanja dobavljaču Sabrer GDS." 
            }]);
        }, 1000);
        setAiInput('');
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="fil-dashboard-grid animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        <div className="stat-card gold-border">
                            <span className="stat-label gold">PROSEČNA MARŽA</span>
                            <span className="stat-value">12.4%</span>
                        </div>
                        <div className="stat-card cyan-border">
                            <span className="stat-label cyan">OPTIMIZACIJA POREZA (ČL.35)</span>
                            <span className="stat-value">✓ AKTIVNA</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">OTVORENA DUGOVANJA</span>
                            <span className="stat-value danger">{Math.floor(totals.brutto * 0.12).toLocaleString()} RSD</span>
                        </div>
                        <div className="fil-table-container" style={{ gridColumn: 'span 3' }}>
                            <div className="fil-table-header" style={{ padding: '15px', color: 'var(--fil-accent)', fontWeight: 'bold', fontSize: '13px' }}>POSLEDNJE TRANSAKCIJE</div>
                            {renderGenericTable('KONTROLNI PREGLED')}
                        </div>
                    </div>
                );
            case 'kir':
                return <div className="animate-fade-in">{renderGenericTable('KNJIGA IZLAZNIH RAČUNA (KIR)')}</div>;
            case 'kur':
                return <div className="animate-fade-in">{renderGenericTable('KNJIGA ULAZNIH RAČUNA (KUR)')}</div>;
            case 'tax':
                return (
                    <div className="animate-fade-in">
                        <div className="stat-card" style={{ marginBottom: '15px', background: 'rgba(255, 179, 0, 0.05)', border: '1px solid var(--fil-gold)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 className="gold" style={{ margin: 0 }}>OBRAČUN PDV-A PO MARŽI (ČLAN 35)</h4>
                                    <p style={{ fontSize: '11px', margin: '5px 0 0 0' }}>Sistem automatski izdvaja putovanja i obračunava porez na razliku u ceni.</p>
                                </div>
                                <Scale className="gold" size={24} />
                            </div>
                        </div>
                        {renderGenericTable('PORESKA EVIDENCIJA - ČLAN 35')}
                    </div>
                );
            case 'bank':
                return <div className="animate-fade-in">{renderGenericTable('BANKA I LIKVIDACIJA IZVODA')}</div>;
            default:
                return <div className="animate-fade-in">{renderGenericTable(`${activeTab.toUpperCase()} PREGLED`)}</div>;
        }
    };

    const getActiveDataset = () => {
        if (activeTab === 'kir') return allData.kir;
        if (activeTab === 'kur') return allData.kur;
        if (activeTab === 'tax') return allData.tax;
        if (activeTab === 'bank') return allData.bank;
        return allData.dashboard;
    };

    const renderGenericTable = (title?: string) => {
        const currentData = getActiveDataset();
        
        return (
            <div className="fil-table-container">
                {title && <div style={{ padding: '10px 15px', fontSize: '12px', fontWeight: 800, background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--fil-accent)' }}>{title}</div>}
                <table className="fil-table">
                    <thead>
                        <tr>
                            <th>IDENTIFIKATOR</th>
                            <th>KONTROLOR / KLIJENT</th>
                            <th>DESTINACIJA</th>
                            <th>DOBAVLJAČ</th>
                            <th>IZNOS (RSD)</th>
                            <th>{activeTab === 'tax' ? 'NABAVNA' : 'PRODAJNA'}</th>
                            <th>{activeTab === 'tax' ? 'MARŽA' : 'PFR'}</th>
                            <th>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.map((item: any) => (
                            <tr key={item.id}>
                                <td className="bold cyan">{item.id}</td>
                                <td>
                                    <div className="bold">{item.client}</div>
                                    <div className="fil-text-dim" style={{ fontSize: '10px' }}>{item.cisCode}</div>
                                </td>
                                <td>{item.destination}</td>
                                <td>{item.supplier}</td>
                                <td className="bold">{item.bruttoRsd.toLocaleString()}</td>
                                <td>{(activeTab === 'tax' ? (item.bruttoRsd - item.marginRsd) : item.marginRsd).toLocaleString()}</td>
                                <td className={activeTab === 'tax' ? 'gold' : ''}>{activeTab === 'tax' ? item.marginRsd.toLocaleString() : 'VALID'}</td>
                                <td>
                                    <span className={`status-badge ${item.status.toLowerCase()}`}>
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className={`fil-hub-container ${theme}-theme`}>
            {/* CLEAN CONTROL CENTER HEADER */}
            <header className="fil-header glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ background: 'var(--fil-accent)', color: '#020b0e', padding: '6px', borderRadius: '8px' }}>
                        <Scale size={20} />
                    </div>
                    <div>
                        <h1 className="bold" style={{ fontSize: '18px', margin: 0 }}>Financial Intelligence & Ledger</h1>
                        <div className="fil-text-dim" style={{ fontSize: '11px' }}>Usklađeno sa zakonima RS • Član 35 • SEF / ESIR Ready</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button 
                        className={`btn-export ${showAiAdvisor ? 'active cyan' : ''}`}
                        onClick={() => setShowAiAdvisor(!showAiAdvisor)}
                        style={{ padding: '6px 12px', fontSize: '11px', background: 'rgba(0, 229, 255, 0.05)', border: '1px solid var(--fil-accent)' }}
                    >
                        <Bot size={14} /> AI SAVETNIK
                    </button>
                    <button 
                        className={`btn-export ${showQuickStats ? 'active' : ''}`}
                        onClick={() => setShowQuickStats(!showQuickStats)}
                        style={{ padding: '6px 12px', fontSize: '11px', background: 'var(--fil-accent-glow)', color: 'var(--fil-accent)', border: '1px solid var(--fil-accent)' }}
                    >
                        {showQuickStats ? <EyeOff size={14} /> : <TrendingUp size={14} />}
                        {showQuickStats ? 'SAKRIJ ANALITIKU' : 'PRIKAŽI ANALITIKU'}
                    </button>
                    <button 
                        className={`btn-export ${activeTab === 'settings' ? 'cyan' : ''}`}
                        onClick={() => setActiveTab('settings')}
                        style={{ padding: '6px 12px', fontSize: '11px', background: 'rgba(255,255,255,0.03)' }}
                    >
                        <RefreshCw size={14} /> API CONFIG
                    </button>
                    <div className="fil-header-info" style={{ marginLeft: '10px' }}>
                        <span className="gold bold" style={{ fontSize: '13px' }}>{new Date().toLocaleDateString('sr-RS')}</span>
                    </div>
                </div>
            </header>

            <div className="fil-main-wrapper" style={{ gap: '10px' }}>
                {/* UNIFIED COMMAND CENTER - FULL WIDTH SEARCH + VIBRANT STAT BADGES */}
                <div className="fil-filters-panel" style={{ 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '20px',
                    padding: '10px 20px',
                    background: 'rgba(13, 25, 38, 0.6)', /* Slightly darker for contrast */
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {/* 1. DOMINANT ULTRA-WIDE SEARCH (Matched to Box) */}
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flex: 1 }}>
                        <div style={{ position: 'relative', flexGrow: 1, maxWidth: '900px' }}> {/* MAX WIDTH EXPANDED */}
                            <Search size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7, color: 'var(--fil-accent)' }} />
                            <input 
                                type="text" 
                                className="fil-input" 
                                placeholder="Brza pretraga po klijentu, CIS broju, destinaciji ili dobavljaču (npr. 'Marković Booking pariz paid')..." 
                                style={{ 
                                    paddingLeft: '50px', 
                                    height: '46px', 
                                    background: 'rgba(255,255,255,0.04)', 
                                    fontSize: '15px', 
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    width: '100%',
                                    borderRadius: '12px'
                                }} 
                            />
                        </div>
                        <select className="fil-input" style={{ width: '160px', height: '46px', background: 'rgba(255,255,255,0.06)', fontWeight: 700, borderRadius: '12px', fontSize: '13px' }}>
                            <option>Svi statusi</option>
                            <option>Plaćeno</option>
                            <option>U dugu</option>
                            <option>Storno</option>
                        </select>
                    </div>

                    {/* 2. HIGH-CONTRAST STAT BADGES (Solid Colors) */}
                    <AnimatePresence>
                        {showQuickStats && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ display: 'flex', gap: '12px' }}
                            >
                                <div style={{ background: '#00e5ff', padding: '6px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(0, 229, 255, 0.3)' }}>
                                    <span style={{ fontSize: '11px', color: '#000', fontWeight: 900 }}>BRUTO:</span>
                                    <span className="bold" style={{ fontSize: '16px', color: '#000' }}>{totals.brutto.toLocaleString()}</span>
                                </div>
                                <div style={{ background: '#ffb300', padding: '6px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(255, 179, 0, 0.3)' }}>
                                    <span style={{ fontSize: '11px', color: '#000', fontWeight: 900 }}>PROFIT:</span>
                                    <span className="bold" style={{ fontSize: '16px', color: '#000' }}>{totals.margin.toLocaleString()}</span>
                                </div>
                                <div style={{ background: '#ff4d4d', padding: '6px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(255, 77, 77, 0.3)' }}>
                                    <span style={{ fontSize: '11px', color: '#fff', fontWeight: 900 }}>POREZ (35):</span>
                                    <span className="bold" style={{ fontSize: '16px', color: '#fff' }}>{totals.vat.toLocaleString()}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* FULL WIDTH NAVIGATION - TABS */}
                <div className="fil-tabs" style={{ width: '100%', marginBottom: '0' }}>
                    <button className={`tab-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <LayoutDashboard size={18} /> Dashboard
                    </button>
                    <button className={`tab-item ${activeTab === 'kir' ? 'active' : ''}`} onClick={() => setActiveTab('kir')}>
                        <BookOpen size={18} /> KIR (Izlaz)
                    </button>
                    <button className={`tab-item ${activeTab === 'kur' ? 'active' : ''}`} onClick={() => setActiveTab('kur')}>
                        <DownloadCloud size={18} /> KUR (Ulaz)
                    </button>
                    <button className={`tab-item ${activeTab === 'tax' ? 'active' : ''}`} onClick={() => setActiveTab('tax')}>
                        <BookCheck size={18} /> Član 35 (Knjiga)
                    </button>
                    <button className={`tab-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
                        <CreditCard size={18} /> Plaćanja
                    </button>
                    <button className={`tab-item ${activeTab === 'cashier' ? 'active' : ''}`} onClick={() => setActiveTab('cashier')}>
                        <Wallet size={18} /> Blagajna
                    </button>
                    <button className={`tab-item ${activeTab === 'bank' ? 'active' : ''}`} onClick={() => setActiveTab('bank')}>
                        <ArrowRightLeft size={18} /> Banka & Likvidacija
                    </button>
                    <button className={`tab-item ${activeTab === 'bordero' ? 'active' : ''}`} onClick={() => setActiveTab('bordero')}>
                        <FileText size={18} /> Bordero Provizija
                    </button>
                </div>

                <div className="fil-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', padding: '10px 20px' }}>
                    <button className="btn-export">Export u XLSX</button>
                    <button className="btn-export">Export u PDF</button>
                    <button className="btn-export" style={{ background: 'var(--fil-accent)', color: '#020b0e' }}>Export za MINIMAX</button>
                    <button className="btn-export">Export za PANTHEON</button>
                </div>

                {/* COMPACT ACTIONS */}
                <div className="fil-actions" style={{ width: '100%', padding: '10px 20px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <span className="fil-text-dim bold" style={{ fontSize: '10px' }}>EKSPORT:</span>
                        <button className="btn-export" style={{ fontSize: '10px' }}>MINIMAX</button>
                        <button className="btn-export" style={{ fontSize: '10px' }}>PANTHEON</button>
                        <button className="btn-export"><Download size={14} /> XLSX</button>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div style={{ flex: 1, overflowY: 'auto', minHeight: '400px' }}>
                    {renderTabContent()}
                </div>
            </div>

            {/* AI SAVETNIK - FORCED LIGHT MODE FOR VISIBILITY */}
            <AnimatePresence>
                {showAiAdvisor && (
                    <motion.div 
                        drag
                        dragMomentum={false}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{ 
                            position: 'fixed', 
                            top: '250px', 
                            right: '50px', 
                            zIndex: 9999, 
                            width: '420px', 
                            height: '580px',
                            /* FORCED LIGHT MODE STYLING */
                            background: '#ffffff', 
                            color: '#0f172a',
                            border: '2px solid #2563eb',
                            display: 'flex', 
                            flexDirection: 'column', 
                            borderRadius: '24px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                            overflow: 'hidden',
                            resize: 'both',
                            minWidth: '380px',
                            minHeight: '400px'
                        }}
                    >
                        {/* DRAG HANDLE - HEADER (VIBRANT BLUE) */}
                        <div style={{ 
                            padding: '16px 20px', 
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                            color: '#ffffff', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            cursor: 'grab'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Bot size={22} />
                                <span className="bold" style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>AI Financial Assistant</span>
                            </div>
                            <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowAiAdvisor(false)} />
                        </div>

                        {/* MESSAGES AREA - FORCED LIGHT COLORS */}
                        <div style={{ 
                            flex: 1, 
                            padding: '24px', 
                            overflowY: 'auto', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '16px', 
                            background: '#f8fafc' 
                        }}>
                            {aiMessages.length === 0 && (
                                <div style={{ textAlign: 'center', opacity: 0.7, marginTop: '25%' }}>
                                    <Bot size={48} style={{ marginBottom: '16px', display: 'block', margin: '0 auto', color: '#2563eb' }} />
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>Analitičar je spreman.</p>
                                    <p style={{ fontSize: '12px', color: '#64748b' }}>Postavite pitanje o Vašim finansijama.</p>
                                </div>
                            )}
                            {aiMessages.map((m, idx) => (
                                <div key={idx} style={{ 
                                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', 
                                    background: m.role === 'user' ? '#dbeafe' : '#ffffff', 
                                    color: '#1e293b',
                                    padding: '14px 18px', 
                                    borderRadius: '18px', 
                                    maxWidth: '85%', 
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    border: m.role === 'user' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }}>
                                    {m.text}
                                </div>
                            ))}
                        </div>

                        {/* INPUT BOX - ABSOLUTE BLACK TEXT */}
                        <div style={{ 
                            padding: '20px', 
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex', 
                            gap: '12px',
                            background: '#ffffff'
                        }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    type="text"
                                    placeholder="Pitajte asistenta..."
                                    className="fil-input"
                                    style={{ 
                                        width: '100%',
                                        height: '46px',
                                        background: '#f1f5f9', 
                                        border: '1px solid #cbd5e1',
                                        color: '#000000', 
                                        paddingLeft: '15px',
                                        paddingRight: '15px',
                                        fontSize: '14px',
                                        borderRadius: '12px',
                                        fontWeight: '600'
                                    }}
                                    value={aiInput}
                                    onChange={e => setAiInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleAiSend()}
                                />
                            </div>
                            <button 
                                onClick={handleAiSend} 
                                className="btn-export" 
                                style={{ 
                                    width: '46px', 
                                    height: '46px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    background: '#2563eb',
                                    color: '#ffffff',
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)'
                                }}>
                                <Send size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FinancialIntelligenceHub;
