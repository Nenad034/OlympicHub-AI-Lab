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
    Code
} from 'lucide-react';
import './PricingModule.styles.css';
import { PricingCodeView } from './PricingCodeView';
import { HOTEL_SERVICES } from '../../data/services/hotelServices';
import { ROOM_PREFIXES, ROOM_VIEWS, ROOM_TYPES } from '../../data/rooms/roomTypes';
import {
    createPricelist,
    getPricelists,
    getPricelistWithDetails,
    type Pricelist,
    type PricePeriod,
    type PriceRule
} from './pricelistService';

const PricingIntelligence: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'setup' | 'grid' | 'rules' | 'mapping'>('setup');
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Detektovao sam tvoj JSON format! Vidim da imaš "API unit showcase". Da li želiš da mapiramo ove jedinice u tvoju bazu smeštaja?' }
    ]);
    const [input, setInput] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Product Configuration State (Hoisted for persistence)
    const [productState, setProductState] = useState({
        service: '',
        prefix: '',
        type: '',
        view: '',
        name: ''
    });

    // Price Periods State (Base Rates)
    const [pricePeriods, setPricePeriods] = useState([
        {
            id: '1',
            dateFrom: '2026-04-01',
            dateTo: '2026-05-01',
            basis: 'PER_PERSON_DAY',
            netPrice: 39.00,
            provisionPercent: 21.00,
            releaseDays: 0,
            minStay: 3,
            maxStay: null as number | null,
            minAdults: 2,
            maxAdults: 3,
            minChildren: 0,
            maxChildren: 2,
            arrivalDays: [1, 2, 3, 4, 5, 6, 7]
        },
        {
            id: '2',
            dateFrom: '2026-06-20',
            dateTo: '2026-06-30',
            basis: 'PER_ROOM_DAY',
            netPrice: 120.00,
            provisionPercent: 15.00,
            releaseDays: 7,
            minStay: 5,
            maxStay: null as number | null,
            minAdults: 2,
            maxAdults: 2,
            minChildren: 0,
            maxChildren: 1,
            arrivalDays: [5, 6] // Samo petak i subota
        }
    ]);

    // Supplements/Discounts State
    const [supplements, setSupplements] = useState([
        {
            id: '1',
            type: 'SUPPLEMENT',
            title: 'Supplement for person on basic bed',
            netPrice: 12.50,
            provisionPercent: 20,
            childAgeFrom: null as number | null,
            childAgeTo: null as number | null,
            minAdults: 2,
            minChildren: 2
        },
        {
            id: '2',
            type: 'DISCOUNT',
            title: 'Early Booking -10%',
            percentValue: 10,
            daysBeforeArrival: 30,
            childAgeFrom: null as number | null,
            childAgeTo: null as number | null,
            minAdults: null as number | null,
            minChildren: null as number | null
        }
    ]);

    // Pricelist Management State
    const [pricelistId, setPricelistId] = useState<string | null>(null);
    const [pricelistTitle, setPricelistTitle] = useState('Novi Cenovnik');
    const [savedPricelists, setSavedPricelists] = useState<Pricelist[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Load saved pricelists on mount
    useEffect(() => {
        loadSavedPricelists();
    }, []);

    const loadSavedPricelists = async () => {
        const { data, error } = await getPricelists();
        if (!error && data) {
            setSavedPricelists(data);
        }
    };

    // Save current pricelist to Supabase
    const handleSavePricelist = async (activate: boolean = false) => {
        if (validationIssues.length > 0 && activate) {
            alert('Ispravite greÅ¡ke pre aktiviranja cenovnika.');
            return;
        }

        setIsSaving(true);
        setSaveSuccess(false);

        // Transform local state to API format
        const pricelistData: Pricelist = {
            title: pricelistTitle,
            product: productState,
            status: activate ? 'active' : 'draft'
        };

        const periodsData: PricePeriod[] = pricePeriods.map(p => ({
            date_from: p.dateFrom,
            date_to: p.dateTo,
            basis: p.basis as 'PER_PERSON_DAY' | 'PER_ROOM_DAY' | 'PER_UNIT_STAY',
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
            rule_type: s.type as 'SUPPLEMENT' | 'DISCOUNT',
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
            console.error('Error saving pricelist:', error);
            alert('GreÅ¡ka pri Äuvanju: ' + (error.message || 'Nepoznata greÅ¡ka'));
        } else if (data) {
            setPricelistId(data.id || null);
            setSaveSuccess(true);
            loadSavedPricelists(); // Refresh list

            // Auto-hide success indicator
            setTimeout(() => setSaveSuccess(false), 3000);

            if (activate) {
                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: `âœ… Cenovnik "${pricelistTitle}" je aktiviran i saÄuvan u bazi!`
                }]);
            }
        }
    };

    // Load a pricelist from Supabase
    const handleLoadPricelist = async (id: string) => {
        setIsLoading(true);
        setShowLoadModal(false);

        const { pricelist, periods, rules, error } = await getPricelistWithDetails(id);

        if (error || !pricelist) {
            alert('GreÅ¡ka pri uÄitavanju cenovnika.');
            setIsLoading(false);
            return;
        }

        // Update state with loaded data
        setPricelistId(pricelist.id || null);
        setPricelistTitle(pricelist.title);
        setProductState(pricelist.product || { service: '', prefix: '', type: '', view: '', name: '' });

        // Transform periods
        setPricePeriods(periods.map((p, idx) => ({
            id: p.id || String(idx + 1),
            dateFrom: p.date_from,
            dateTo: p.date_to,
            basis: p.basis,
            netPrice: p.net_price,
            provisionPercent: p.provision_percent,
            releaseDays: p.release_days,
            minStay: p.min_stay,
            maxStay: p.max_stay ?? null,
            minAdults: p.min_adults,
            maxAdults: p.max_adults,
            minChildren: p.min_children,
            maxChildren: p.max_children,
            arrivalDays: p.arrival_days
        })));

        // Transform rules
        setSupplements(rules.map((r, idx) => ({
            id: r.id || String(idx + 1),
            type: r.rule_type,
            title: r.title,
            netPrice: r.net_price || 0,
            provisionPercent: r.provision_percent || 20,
            percentValue: r.percent_value || 0,
            daysBeforeArrival: r.days_before_arrival || 0,
            childAgeFrom: r.child_age_from ?? null,
            childAgeTo: r.child_age_to ?? null,
            minAdults: r.min_adults ?? null,
            minChildren: r.min_children ?? null
        })) as any);

        setIsLoading(false);
        setActiveTab('setup');

        setMessages(prev => [...prev, {
            role: 'ai',
            content: `ðŸ“‚ UÄitan cenovnik: "${pricelist.title}"`
        }]);
    };

    // Export Configuration to JSON
    const exportToJSON = () => {
        const config = {
            pricelist: {
                id: pricelistId || 'draft',
                title: pricelistTitle,
                product: productState,
                baseRates: pricePeriods.map(p => ({
                    ...p,
                    grossPrice: (p.netPrice * (1 + p.provisionPercent / 100)).toFixed(2)
                })),
                supplements: supplements
            },
            exportedAt: new Date().toISOString(),
            format: 'MARS_COMPATIBLE'
        };

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pricelist_${productState.name || 'export'}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Validation Check
    const getValidationStatus = () => {
        const issues: string[] = [];
        if (!productState.type) issues.push('Nije izabran tip sobe');
        if (!productState.service) issues.push('Nije izabrana usluga');
        if (pricePeriods.length === 0) issues.push('Nema definisanih cenovnih perioda');
        pricePeriods.forEach((p, i) => {
            if (!p.dateFrom || !p.dateTo) issues.push(`Period ${i + 1}: Nedostaju datumi`);
            if (p.netPrice <= 0) issues.push(`Period ${i + 1}: Neto cena mora biti > 0`);
        });
        return issues;
    };

    const validationIssues = getValidationStatus();

    const handleSendMessage = () => {
        if (!input.trim()) return;
        setMessages([...messages, { role: 'user', content: input }]);
        setInput('');
    };

    return (
        <div className={`pricing-module ${isDarkMode ? 'navy-theme' : ''}`}>
            {/* VS Code Editor Style - Full Screen Code View */}
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

            {/* Load Modal */}
            {showLoadModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setShowLoadModal(false)}>
                    <div
                        style={{
                            background: 'var(--editor-bg)',
                            borderRadius: '8px',
                            padding: '24px',
                            width: '600px',
                            maxHeight: '70vh',
                            overflow: 'auto',
                            border: '1px solid var(--editor-border)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--editor-text)' }}>
                            <FolderOpen size={20} /> Učitaj Cenovnik
                        </h3>

                        {savedPricelists.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--editor-comment)' }}>
                                Nema sačuvanih cenovnika.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {savedPricelists.map(pl => (
                                    <div
                                        key={pl.id}
                                        onClick={() => handleLoadPricelist(pl.id!)}
                                        style={{
                                            padding: '16px',
                                            background: 'var(--editor-line-hover)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            border: '1px solid var(--pricing-border)',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--pricing-accent)')}
                                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--pricing-border)')}
                                    >
                                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{pl.title}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--pricing-text-dim)', display: 'flex', gap: '12px' }}>
                                            <span>ðŸ“¦ {pl.product?.name || 'Bez proizvoda'}</span>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: pl.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                color: pl.status === 'active' ? '#10b981' : '#f59e0b'
                                            }}>
                                                {pl.status === 'active' ? 'Aktivan' : 'Nacrt'}
                                            </span>
                                            <span>ðŸ“… {pl.updated_at ? new Date(pl.updated_at).toLocaleDateString('sr-RS') : '-'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            className="btn-secondary"
                            style={{ marginTop: '16px', width: '100%' }}
                            onClick={() => setShowLoadModal(false)}
                        >
                            Zatvori
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingIntelligence;
