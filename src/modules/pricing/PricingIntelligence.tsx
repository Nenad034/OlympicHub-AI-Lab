import React, { useState, useEffect } from 'react';
import {
    Bot,
    Send,
    Settings,
    FileSpreadsheet,
    Zap,
    Save,
    Calendar,
    Table as TableIcon,
    Clock,
    Database,
    Sun,
    Moon,
    Trash2,
    Plus,
    Download,
    AlertCircle,
    FolderOpen,
    Loader2,
    CheckCircle2,
    Play,
    Code,
    Edit3
} from 'lucide-react';
import './PricingModule.styles.css';
import { PricingCodeView } from './PricingCodeView';
import { HOTEL_SERVICES } from '../../data/services/hotelServices';
import { ROOM_PREFIXES, ROOM_VIEWS, ROOM_TYPES } from '../../data/rooms/roomTypes';
import { mapSolvexToInternal, MOCK_SOLVEX_DATA } from './solvexImporter';
import {
    createPricelist,
    getPricelists,
    getPricelistWithDetails,
    type Pricelist,
    type PricePeriod,
    type PriceRule
} from './pricelistService';
import ManualPricelistCreator from './ManualPricelistCreator';
import PricelistItemsList from './PricelistItemsList';

const styles = {
    button: {
        padding: '10px 20px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        fontFamily: "'Inter', sans-serif"
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '10px',
        background: 'var(--bg-input)',
        border: '1.5px solid var(--border)',
        color: 'var(--text-primary)',
        outline: 'none',
        fontSize: '14px',
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box' as const
    },
    select: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '10px',
        background: 'var(--bg-input)',
        border: '1.5px solid var(--border)',
        color: 'var(--text-primary)',
        outline: 'none',
        fontSize: '14px',
        fontFamily: "'Inter', sans-serif",
        cursor: 'pointer',
        appearance: 'none' as const,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '16px',
        backgroundColor: 'var(--bg-input)'
    }
};

const PricingIntelligence: React.FC = () => {
    const [viewMode, setViewMode] = useState<'code' | 'standard'>('standard');
    const [activeTab, setActiveTab] = useState<'manual' | 'product' | 'periods' | 'rules' | 'ai'>('manual');
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Detektovao sam tvoj JSON format! Vidim da imaš "API unit showcase". Da li želiš da mapiramo ove jedinice u tvoju bazu smeštaja?' }
    ]);
    const [input, setInput] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Global Pricelist Items state
    const [addedItems, setAddedItems] = useState<any[]>([
        {
            id: 'MOCK-001',
            roomType: 'Double Room Standard (2+1)',
            dateFrom: '2026-06-01',
            dateTo: '2026-06-30',
            netPrice: 68.00,
            brutoPrice: 85.00,
            occupancy: { adults: 2, children: 1 },
            status: 'active',
            pricelistTitle: 'Leto 2026 - Grčka'
        },
        {
            id: 'MOCK-002',
            roomType: 'Family Apartment (2+2)',
            dateFrom: '2026-07-01',
            dateTo: '2026-07-31',
            netPrice: 116.00,
            brutoPrice: 145.00,
            occupancy: { adults: 2, children: 2 },
            status: 'active',
            pricelistTitle: 'Sezona 2026 - Bugarska'
        },
        {
            id: 'MOCK-003',
            roomType: 'Junior Suite (2+0)',
            dateFrom: '2026-08-01',
            dateTo: '2026-08-31',
            netPrice: 88.00,
            brutoPrice: 110.00,
            occupancy: { adults: 2, children: 0 },
            status: 'warning',
            pricelistTitle: 'Premium Ponuda - Turska'
        }
    ]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Product Configuration State
    const [productState, setProductState] = useState({
        service: '',
        prefix: '',
        type: '',
        view: '',
        name: ''
    });

    // Price Periods State
    const [pricePeriods, setPricePeriods] = useState<any[]>([
        {
            id: '1',
            dateFrom: '2026-04-01',
            dateTo: '2026-05-01',
            basis: 'PER_PERSON_DAY',
            netPrice: 39.00,
            provisionPercent: 21.00,
            releaseDays: 0,
            minStay: 3,
            maxStay: null,
            minAdults: 2,
            maxAdults: 3,
            minChildren: 0,
            maxChildren: 2,
            arrivalDays: [1, 2, 3, 4, 5, 6, 7]
        }
    ]);

    // Supplements/Discounts State
    const [supplements, setSupplements] = useState<any[]>([
        {
            id: '1',
            rule_type: 'SUPPLEMENT',
            title: 'Supplement for person on basic bed',
            netPrice: 12.50,
            provisionPercent: 20,
            minAdults: 2,
            minChildren: 2
        }
    ]);

    const [pricelistId, setPricelistId] = useState<string | null>(null);
    const [pricelistTitle, setPricelistTitle] = useState('Novi Cenovnik');
    const [savedPricelists, setSavedPricelists] = useState<Pricelist[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Load saved pricelists and existing items
    useEffect(() => {
        loadSavedPricelists();
        fetchPricelistItems();
    }, []);

    const loadSavedPricelists = async () => {
        const { data, error } = await getPricelists();
        if (!error && data) {
            setSavedPricelists(data);
        }
    };

    const fetchPricelistItems = async () => {
        setIsLoadingData(true);
        try {
            const { pricingService } = await import('../../services/pricing/pricingService');
            const data = await pricingService.getPricelists();

            const mappedItems: any[] = [];
            data.forEach((pl: any) => {
                pl.price_periods?.forEach((pp: any) => {
                    mappedItems.push({
                        id: pp.id,
                        pricelist_id: pl.id,
                        roomType: pp.room_type_name,
                        dateFrom: pp.date_from,
                        dateTo: pp.date_to,
                        netPrice: pp.net_price,
                        brutoPrice: pp.gross_price,
                        occupancy: { adults: 2, children: 1 },
                        status: pl.status,
                        pricelistTitle: pl.title
                    });
                });
            });
            setAddedItems(mappedItems);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleAddNewItem = (item: any) => {
        setAddedItems(prev => [item, ...prev]);
    };

    const handleSavePricelist = async (activate: boolean = false) => {
        if (validationIssues.length > 0 && activate) {
            alert('Ispravite greške pre aktiviranja cenovnika.');
            return;
        }

        setIsSaving(true);
        setSaveSuccess(false);

        const pricelistData: Pricelist = {
            title: pricelistTitle,
            product: productState,
            status: activate ? 'active' : 'draft'
        };

        const periodsData: PricePeriod[] = pricePeriods.map(p => ({
            date_from: p.dateFrom,
            date_to: p.dateTo,
            basis: p.basis,
            net_price: p.netPrice,
            provision_percent: p.provisionPercent,
            min_stay: p.minStay,
            max_stay: p.maxStay,
            release_days: p.releaseDays,
            min_adults: p.minAdults,
            max_adults: p.maxAdults,
            min_children: p.minChildren,
            max_children: p.maxChildren,
            arrival_days: p.arrivalDays
        }));

        const rulesData: PriceRule[] = supplements.map((s: any) => ({
            rule_type: s.rule_type,
            title: s.title,
            net_price: s.netPrice,
            provision_percent: s.provisionPercent,
            percent_value: s.percentValue,
            days_before_arrival: s.daysBeforeArrival,
            child_age_from: s.childAgeFrom,
            child_age_to: s.childAgeTo,
            min_adults: s.minAdults,
            min_children: s.minChildren
        }));

        const { data, error } = await createPricelist(pricelistData, periodsData, rulesData);

        setIsSaving(false);
        if (error) {
            console.error('Error saving:', error);
            alert('Greška pri čuvanju');
        } else if (data) {
            setPricelistId(data.id || null);
            setSaveSuccess(true);
            loadSavedPricelists();
            fetchPricelistItems();
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    const handleLoadPricelist = async (id: string) => {
        setIsLoadingData(true);
        setShowLoadModal(false);
        const { pricelist, periods, rules, error } = await getPricelistWithDetails(id);
        if (!error && pricelist) {
            setPricelistId(pricelist.id || null);
            setPricelistTitle(pricelist.title);
            setProductState(pricelist.product || { service: '', prefix: '', type: '', view: '', name: '' });
            setPricePeriods(periods.map(p => ({
                id: p.id,
                dateFrom: p.date_from,
                dateTo: p.date_to,
                basis: p.basis,
                netPrice: p.net_price,
                provisionPercent: p.provision_percent,
                releaseDays: p.release_days,
                minStay: p.min_stay,
                maxStay: p.max_stay,
                minAdults: p.min_adults,
                maxAdults: p.max_adults,
                minChildren: p.min_children,
                maxChildren: p.max_children,
                arrivalDays: p.arrival_days
            })));
            setSupplements(rules.map(r => ({ ...r, netPrice: r.net_price, percentValue: r.percent_value })));
        }
        setIsLoadingData(false);
    };

    const exportToJSON = () => {
        const config = { pricelist: { title: pricelistTitle, product: productState, periods: pricePeriods, rules: supplements } };
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `pricelist.json`; a.click(); URL.revokeObjectURL(url);
    };

    const getValidationStatus = () => {
        const issues: string[] = [];
        if (!productState.type) issues.push('Nije izabran tip sobe');
        if (!productState.service) issues.push('Nije izabrana usluga');
        if (pricePeriods.length === 0) issues.push('Nema perioda');
        return issues;
    };

    const validationIssues = getValidationStatus();

    const handleSendMessage = () => {
        if (!input.trim()) return;
        setMessages([...messages, { role: 'user', content: input }]);
        setInput('');
    };

    const handleImportSolvex = () => {
        const data = mapSolvexToInternal(MOCK_SOLVEX_DATA);
        if (data) {
            setProductState(data.productState as any);
            setPricePeriods(data.periods);
            setSupplements(data.rules);
            setActiveTab('periods');
        }
    };

    const handleMarsExport = () => {
        const marsData = { header: { hotelCode: 'BP_2930' }, rows: pricePeriods.map(p => ({ S_DATE_FROM: p.dateFrom, N_NETO: p.netPrice })) };
        setMessages(prev => [...prev, { role: 'ai', content: `MARS Export: ${JSON.stringify(marsData, null, 2)}` }]);
    };

    const renderStandardUI = () => {
        return (
            <div style={{
                padding: activeTab === 'manual' ? '24px 0' : '24px',
                background: 'var(--bg-dark)',
                minHeight: '100vh',
                maxHeight: '100vh',
                color: 'var(--text-primary)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                boxSizing: 'border-box',
                width: '100%'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0, background: 'var(--gradient-blue)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Pricing Intelligence
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '14px' }}>Generator i menadžer cenovnika sa AI podrškom.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <button onClick={() => setViewMode('standard')} style={{ ...styles.button, background: viewMode === 'standard' ? 'var(--accent)' : 'transparent', color: viewMode === 'standard' ? '#fff' : 'var(--text-secondary)' }}>
                                <TableIcon size={16} /> UI Mode
                            </button>
                            <button onClick={() => setViewMode('code')} style={{ ...styles.button, background: viewMode === 'code' ? 'var(--accent)' : 'transparent', color: viewMode === 'code' ? '#fff' : 'var(--text-secondary)' }}>
                                <Code size={16} /> Dev Mode
                            </button>
                        </div>
                        <button onClick={() => handleSavePricelist(true)} style={{ ...styles.button, background: 'var(--gradient-green)', color: '#fff', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
                            <Play size={18} /> Aktiviraj Cenovnik
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', borderBottom: '1px solid var(--border)' }}>
                        {['manual', 'product', 'periods', 'rules', 'ai'].map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab as any)} style={{ padding: '12px 24px', border: 'none', background: 'transparent', color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '15px', fontWeight: 700, cursor: 'pointer', borderBottom: activeTab === tab ? '3px solid var(--accent)' : '3px solid transparent', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {tab === 'manual' && '✏️ Ručno Kreiranje'}
                                {tab === 'product' && '📦 Konfiguracija'}
                                {tab === 'periods' && '📅 Periodi'}
                                {tab === 'rules' && '⚡ Pravila'}
                                {tab === 'ai' && '🤖 AI'}
                            </button>
                        ))}
                    </div>

                    <div className="fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        {activeTab === 'product' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                                <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '18px' }}>Osnovne Postavke</h3>
                                    <div style={{ display: 'grid', gap: '20px' }}>
                                        <input value={pricelistTitle} onChange={e => setPricelistTitle(e.target.value)} style={styles.input} placeholder="Naziv cenovnika" />
                                        <select value={productState.type} onChange={e => setProductState({ ...productState, type: e.target.value })} style={styles.select}>
                                            <option value="" style={{ background: 'var(--bg-input)' }}>Izaberite tip sobe...</option>
                                            {ROOM_TYPES.map(r => <option key={r.id} value={r.id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{r.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'manual' && <ManualPricelistCreator onAddItem={handleAddNewItem} addedItems={addedItems} />}
                        {activeTab === 'periods' && (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden', padding: '24px' }}>
                                <h3>Cenovni Periodi</h3>
                                {/* Simple table placeholder for brevitiy, full logic is in state */}
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}><th>OD</th><th>DO</th><th>NETO</th></tr></thead>
                                    <tbody>{pricePeriods.map(p => <tr key={p.id}><td>{p.dateFrom}</td><td>{p.dateTo}</td><td>{p.netPrice} EUR</td></tr>)}</tbody>
                                </table>
                            </div>
                        )}
                        {activeTab === 'ai' && (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '300px 1fr', minHeight: '500px' }}>
                                <div style={{ padding: '24px', borderRight: '1px solid var(--border)' }}>
                                    <button onClick={handleImportSolvex} style={{ ...styles.button, width: '100%', background: 'var(--accent)', color: '#fff', marginBottom: '12px' }}>Import Solvex</button>
                                    <button onClick={handleMarsExport} style={{ ...styles.button, width: '100%', background: '#10b981', color: '#fff' }}>Export MARS</button>
                                </div>
                                <div style={{ padding: '24px' }}>
                                    <div style={{ height: '300px', overflowY: 'auto', marginBottom: '20px' }}>{messages.map((m, i) => <div key={i} style={{ marginBottom: '12px', padding: '12px', borderRadius: '12px', background: m.role === 'ai' ? 'var(--bg-input)' : 'var(--accent)', color: m.role === 'ai' ? 'inherit' : '#fff' }}>{m.content}</div>)}</div>
                                    <div style={{ display: 'flex', gap: '12px' }}><input value={input} onChange={e => setInput(e.target.value)} style={styles.input} /><button onClick={handleSendMessage} style={styles.button}><Send size={18} /></button></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '40px', paddingBottom: '100px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ width: '4px', height: '24px', background: 'var(--accent)', borderRadius: '2px' }} />
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Pregled Svih Stavki</h3>
                        </div>
                        <PricelistItemsList items={addedItems} isLoading={isLoadingData} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`pricing-module ${isDarkMode ? 'navy-theme' : ''}`} style={{ background: 'var(--bg-dark)' }}>
            {viewMode === 'code' ? (
                <PricingCodeView
                    pricelistTitle={pricelistTitle}
                    pricelistId={pricelistId}
                    productState={productState as any}
                    pricePeriods={pricePeriods as any}
                    supplements={supplements as any}
                    validationIssues={validationIssues}
                    saveSuccess={saveSuccess}
                    isSaving={isSaving}
                    isDarkMode={isDarkMode}
                    onTitleChange={setPricelistTitle}
                    onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
                    onLoadPricelist={() => setShowLoadModal(true)}
                    onExportJSON={exportToJSON}
                    onSaveDraft={() => handleSavePricelist(false)}
                    onActivate={() => handleSavePricelist(true)}
                    onProductChange={setProductState as any}
                    onPeriodsChange={setPricePeriods as any}
                    onSupplementsChange={setSupplements as any}
                />
            ) : renderStandardUI()}

            {showLoadModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '20px', width: '500px' }}>
                        <h3>Učitaj Cenovnik</h3>
                        {savedPricelists.map(pl => <div key={pl.id} onClick={() => handleLoadPricelist(pl.id!)} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px' }}>{pl.title}</div>)}
                        <button onClick={() => setShowLoadModal(false)} style={{ ...styles.button, width: '100%', marginTop: '20px' }}>Zatvori</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingIntelligence;
