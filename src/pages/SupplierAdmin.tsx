import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Search, Filter, Download, Plus, MoreHorizontal,
    Briefcase, Building, Layers, Shield, Settings, CheckCircle,
    XCircle, AlertCircle, TrendingUp, Calendar, MapPin,
    DollarSign, Percent, ArrowRight, Eye, Edit, Trash2, Key,
    Activity, Clock, FileText, Globe, Euro, Command, Truck, X, Wifi, Check
} from 'lucide-react';
import { useAuthStore } from '../stores';
import './SubagentAdmin.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

import supplierService, {
    type UnifiedSupplier as Supplier,
    type PricingRule,
    SUPPLIER_CATEGORIES,
    type SupplierCategoryKey,
    AVAILABLE_API_PROVIDERS
} from '../services/SupplierService';
import { GoogleAddressAutocomplete } from '../components/GoogleAddressAutocomplete';
import LeafletMap from '../components/LeafletMap';
import CitySearch from '../components/CitySearch';
import CountrySearch from '../components/CountrySearch';
import { getCountryCode } from '../data/countries';

// Remove Local PricingRule interface - now imported from Service


const SupplierAdmin: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine initial tab from query param
    const getInitialTab = () => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'matrix' || tab === 'exceptions') return tab;
        return 'suppliers';
    };

    const [activeTab, setActiveTab] = useState<'suppliers' | 'matrix' | 'exceptions'>(getInitialTab());

    // Sync state if URL changes
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'matrix' || tab === 'exceptions' || tab === 'suppliers') {
            if (tab !== activeTab) setActiveTab(tab as any);
        }
    }, [location.search]);

    const handleTabChange = (tab: 'suppliers' | 'matrix' | 'exceptions') => {
        setActiveTab(tab);
        navigate(`/suppliers?tab=${tab}`, { replace: true });
    };
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [rules, setRules] = useState<PricingRule[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('Svi');
    const [typeFilter, setTypeFilter] = useState<'All' | 'API' | 'Offline'>('All');

    // Load Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [supplierData, rulesData] = await Promise.all([
                    supplierService.getAllSuppliers(),
                    supplierService.getPricingRules()
                ]);
                setSuppliers(supplierData);
                setRules(rulesData);
            } catch (e) {
                console.error('Failed to load data', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCheckConnection = async (supplier: Supplier) => {
        if (!supplier.apiConnection) return;

        // Optimistic update
        setSuppliers(prev => prev.map(s => s.id === supplier.id ? { ...s, apiStatus: 'Unknown' } as Supplier : s)); // Loading state

        const isConnected = await supplierService.checkConnection(supplier.id, supplier.name);

        setSuppliers(prev => prev.map(s => s.id === supplier.id ? {
            ...s,
            apiStatus: (isConnected ? 'Connected' : 'Disconnected') as any
        } as Supplier : s));

        alert(isConnected ? `Uspesno povezivanje sa ${supplier.name}!` : `Neuspesno povezivanje sa ${supplier.name}. Proverite kredencijale.`);
    };

    // Modal State
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [activeSupplierStep, setActiveSupplierStep] = useState<'categorization' | 'basic' | 'api' | 'contact' | 'policy' | 'notes'>('categorization');
    const [showFullMap, setShowFullMap] = useState(false);
    const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);

    // Supplier Form State
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
        name: '',
        type: 'Offline',
        status: 'Active',
        country: 'Srbija',
        category: undefined,
        subcategory: undefined,
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        contacts: [{ name: '', email: '', phone: '', role: 'Rezervacije' }],
        address: '',
        city: '',
        lat: undefined,
        lng: undefined,
        pib: '',
        regNumber: '',
        notes: '',
        apiConnection: '',
        apiConnections: [],
        defaultPolicy: { commission: 0, commissionAmount: 0, margin: 0, marginAmount: 0 },
        financials: { totalVolume: 0, averageCommission: 0, averageMargin: 0 }
    });

    // --- AUTO-GEOCODE: whenever country + city + address are all filled ---
    useEffect(() => {
        const { country, city, address } = supplierForm;
        if (!country || !city || !address) return;

        const debounce = setTimeout(async () => {
            try {
                const query = `${address}, ${city}, ${country}`;
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
                const res = await fetch(url, { headers: { 'Accept-Language': 'sr,en' } });
                const data = await res.json();
                if (data && data.length > 0) {
                    const { lat, lon } = data[0];
                    setSupplierForm(prev => ({
                        ...prev,
                        lat: parseFloat(lat),
                        lng: parseFloat(lon)
                    }));
                }
            } catch (e) {
                console.warn('Auto-geocode failed:', e);
            }
        }, 800);

        return () => clearTimeout(debounce);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supplierForm.country, supplierForm.city, supplierForm.address]);

    // Form State for Rule
    const [ruleForm, setRuleForm] = useState<Partial<PricingRule>>({
        targetType: 'Destination',
        targetName: '',
        incomingCommission: 0,
        incomingExtra: 0,
        markupMargin: 0,
        markupExtra: 0,
        status: 'Active',
        priority: 10
    });

    // Filtering
    const filteredSuppliers = suppliers.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.pib && s.pib.includes(searchQuery));

        const matchesCategory = categoryFilter === 'Svi' || s.category === categoryFilter;
        const matchesType = typeFilter === 'All' || s.type === typeFilter;

        return matchesSearch && matchesCategory && matchesType;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return '#10b981';
            case 'Suspended': return '#ef4444';
            case 'Pending': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const handleOpenRuleModal = (rule?: PricingRule) => {
        if (rule) {
            setEditingRule(rule);
            setRuleForm(rule);
        } else {
            setEditingRule(null);
            setRuleForm({
                targetType: 'Destination',
                targetName: '',
                incomingCommission: 0,
                incomingExtra: 0,
                markupMargin: 0,
                markupExtra: 0,
                status: 'Active',
                priority: 10
            });
        }
        setShowRuleModal(true);
    };

    const handleSaveRule = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const ruleToSave: PricingRule = editingRule
            ? { ...ruleForm, id: editingRule.id } as PricingRule
            : { ...ruleForm, id: `rule-${Date.now()}` } as PricingRule;

        const success = await supplierService.savePricingRule(ruleToSave);

        if (success) {
            // Update local state
            if (editingRule) {
                setRules(rules.map(r => r.id === editingRule.id ? ruleToSave : r));
            } else {
                setRules([...rules, ruleToSave]);
            }
            setShowRuleModal(false);
        } else {
            alert('Greška pri čuvanju pravila.');
        }
        setLoading(false);
    };

    // --- CONTACT HELPERS ---
    const updateSupplierContact = (index: number, field: string, value: string) => {
        const currentContacts = supplierForm.contacts || [{ name: '', email: '', phone: '', role: 'Rezervacije' }];
        const updated = [...currentContacts];
        updated[index] = { ...updated[index], [field]: value };
        setSupplierForm({ ...supplierForm, contacts: updated });
    };

    const addSupplierContact = () => {
        const currentContacts = supplierForm.contacts || [];
        if (currentContacts.length < 5) {
            setSupplierForm({
                ...supplierForm,
                contacts: [...currentContacts, { name: '', email: '', phone: '', role: '' }]
            });
        }
    };

    const removeSupplierContact = (index: number) => {
        const currentContacts = supplierForm.contacts || [];
        if (currentContacts.length > 1) {
            setSupplierForm({
                ...supplierForm,
                contacts: currentContacts.filter((_, i) => i !== index)
            });
        }
    };

    const handleAddressChange = (address: string, place?: any) => {
        if (!place) {
            setSupplierForm({ ...supplierForm, address });
            return;
        }

        const components = (place as any).address_components || [];
        let city = '';
        let country = '';

        components.forEach((c: any) => {
            if (c.types.includes('locality')) city = c.long_name;
            if (c.types.includes('country')) country = c.long_name;
        });

        setSupplierForm({
            ...supplierForm,
            address: (place as any).formatted_address || address,
            city: city || supplierForm.city,
            country: country || supplierForm.country,
            lat: (place as any).geometry?.location?.lat(),
            lng: (place as any).geometry?.location?.lng()
        });
    };

    const handleDeleteRule = async (id: string) => {
        if (window.confirm('Da li ste sigurni da želite da obrišete ovo pravilo?')) {
            setLoading(true);
            const success = await supplierService.deletePricingRule(id);
            if (success) {
                setRules(rules.filter(r => r.id !== id));
            } else {
                alert('Greška pri brisanju pravila.');
            }
            setLoading(false);
        }
    };

    // --- SUPPLIER HANDLERS ---
    const handleOpenSupplierModal = (supplier?: Supplier) => {
        setActiveSupplierStep('categorization'); // Reset to first step
        if (supplier) {
            setEditingSupplier(supplier);
            const initialForm = JSON.parse(JSON.stringify(supplier));
            // Ensure apiConnections is at least an array
            if (!initialForm.apiConnections) {
                initialForm.apiConnections = initialForm.apiConnection ? [initialForm.apiConnection] : [];
            }
            setSupplierForm(initialForm);
        } else {
            setEditingSupplier(null);
            setSupplierForm({
                name: '',
                type: 'Offline',
                status: 'Active',
                country: 'Srbija',
                category: undefined,
                subcategory: undefined,
                contactPerson: '',
                contactEmail: '',
                contactPhone: '',
                contacts: [{ name: '', email: '', phone: '', role: 'Rezervacije' }],
                address: '',
                city: '',
                lat: undefined,
                lng: undefined,
                pib: '',
                regNumber: '',
                notes: '',
                apiConnection: '',
                apiConnections: [],
                defaultPolicy: { commission: 0, commissionAmount: 0, margin: 0, marginAmount: 0 },
                financials: { totalVolume: 0, averageCommission: 0, averageMargin: 0 }
            });
        }
        setShowSupplierModal(true);
    };

    const handleSaveSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const supplierToSave: Supplier = editingSupplier
            ? { ...editingSupplier, ...supplierForm } as Supplier
            : {
                ...supplierForm,
                id: `sup-${Date.now()}`,
                apiStatus: 'Unknown',
                financials: { totalVolume: 0, averageCommission: 0, averageMargin: 0 }
            } as Supplier;

        const success = await supplierService.saveSupplier(supplierToSave);

        if (success) {
            if (editingSupplier) {
                setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? supplierToSave : s));
            } else {
                setSuppliers([...suppliers, supplierToSave]);
            }
            setShowSupplierModal(false);
        } else {
            alert('Greška pri čuvanju dobavljača.');
        }
        setLoading(false);
    };

    return (
        <div className="subagent-admin-container fade-in">
            <div className="admin-header">
                <div className="header-left">
                    <div className="admin-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        <Truck size={28} color="white" />
                    </div>
                    <div>
                        <h1>Supplier & Pricing Admin</h1>
                        <p>Upravljanje cenovnom politikom: <strong>Cena Dobavljača {'->'} Neto {'->'} Prodajna</strong></p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => navigate('/')}>Nazad</button>
                    {activeTab === 'suppliers' && (
                        <button className="btn-primary" onClick={() => handleOpenSupplierModal()}><Plus size={18} /> Novi Dobavljač</button>
                    )}
                    {(activeTab === 'matrix' || activeTab === 'exceptions') && (
                        <button className="btn-primary" onClick={() => handleOpenRuleModal()}><Plus size={18} /> Novo Pravilo</button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="admin-tabs-bar">
                <button className={`tab-item ${activeTab === 'suppliers' ? 'active' : ''}`} onClick={() => handleTabChange('suppliers')}>
                    <Briefcase size={18} /> Lista Dobavljača
                </button>
                <button className={`tab-item ${activeTab === 'matrix' ? 'active' : ''}`} onClick={() => handleTabChange('matrix')}>
                    <Layers size={18} /> Global Matrix
                </button>
                <button className={`tab-item ${activeTab === 'exceptions' ? 'active' : ''}`} onClick={() => handleTabChange('exceptions')}>
                    <Shield size={18} /> Specijalni Izuzeci (Exceptions)
                </button>
            </div>

            <div className="admin-tab-content">
                {activeTab === 'suppliers' && (
                    <div className="suppliers-view fade-in">
                        {/* Stats Row */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                                    <Truck size={24} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">Ukupno Dobavljača</span>
                                    <span className="stat-value">{suppliers.length}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                    <Euro size={24} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">Prosečna Marža</span>
                                    <span className="stat-value">8.4%</span>
                                </div>
                            </div>
                        </div>

                        <div className="filters-bar" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div className="search-box" style={{ flex: 1 }}>
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Traži dobavljača po nazivu, državi ili PIB-u..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="filter-buttons">
                                    <button
                                        className={`filter-btn ${typeFilter === 'All' ? 'active' : ''}`}
                                        onClick={() => setTypeFilter('All')}
                                    >Svi</button>
                                    <button
                                        className={`filter-btn ${typeFilter === 'API' ? 'active' : ''}`}
                                        onClick={() => setTypeFilter('API')}
                                    >API</button>
                                    <button
                                        className={`filter-btn ${typeFilter === 'Offline' ? 'active' : ''}`}
                                        onClick={() => setTypeFilter('Offline')}
                                    >Offline</button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                    className={`filter-btn ${categoryFilter === 'Svi' ? 'active' : ''}`}
                                    onClick={() => setCategoryFilter('Svi')}
                                    style={{ fontSize: '11px', padding: '6px 12px' }}
                                >Sve kategorije</button>
                                {Object.keys(SUPPLIER_CATEGORIES).map(cat => (
                                    <button
                                        key={cat}
                                        className={`filter-btn ${categoryFilter === cat ? 'active' : ''}`}
                                        onClick={() => setCategoryFilter(cat)}
                                        style={{ fontSize: '11px', padding: '6px 12px' }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="table-container">
                            <table className="subagents-table">
                                <thead>
                                    <tr>
                                        <th>Dobavljač</th>
                                        <th>Kategorija troška</th>
                                        <th>Tip</th>
                                        <th>Država</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'center' }}>Ulazna Provizija</th>
                                        <th style={{ textAlign: 'center' }}>Izlazna Marža</th>
                                        <th>Akcije</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSuppliers.map(s => (
                                        <tr key={s.id}>
                                            <td>
                                                <div className="subagent-info">
                                                    <div className="subagent-avatar">{s.name.charAt(0)}</div>
                                                    <div>
                                                        <div className="subagent-name">{s.name}</div>
                                                        <div className="subagent-company">{s.contactPerson || s.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {s.category ? (
                                                    <div>
                                                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-color, #f59e0b)' }}>{s.category}</div>
                                                        {s.subcategory && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.subcategory}</div>}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>—</span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {s.apiConnections && s.apiConnections.length > 0 ? (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                            {s.apiConnections.map(api => (
                                                                <span key={api} className="cat-tag" style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)' }}>{api}</span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="cat-tag">{s.apiConnection || 'Ručno'}</span>
                                                    )}
                                                    {s.apiStatus && (
                                                        <div style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                                                            <span style={{
                                                                width: '6px', height: '6px', borderRadius: '50%',
                                                                backgroundColor: s.apiStatus === 'Connected' ? '#10b981' : (s.apiStatus === 'Disconnected' ? '#ef4444' : '#6b7280')
                                                            }}></span>
                                                            {s.apiStatus === 'Connected' ? 'Povezano' : (s.apiStatus === 'Disconnected' ? 'Prekid' : 'Nepoznato')}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{s.country}</td>
                                            <td><span className="status-badge" style={{ background: getStatusColor(s.status) }}>{s.status}</span></td>
                                            <td className="amount" style={{ textAlign: 'center' }}>
                                                {s.defaultPolicy.commission > 0 && <span>{s.defaultPolicy.commission}%</span>}
                                                {s.defaultPolicy.commissionAmount > 0 && <span> + {s.defaultPolicy.commissionAmount}€</span>}
                                            </td>
                                            <td className="amount commission" style={{ textAlign: 'center' }}>
                                                {s.defaultPolicy.margin > 0 && <span>{s.defaultPolicy.margin}%</span>}
                                                {s.defaultPolicy.marginAmount > 0 && <span> + {s.defaultPolicy.marginAmount}€</span>}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {(s.type === 'API' || s.apiConnection) && (
                                                        <button className="action-btn" title="Proveri API Konekciju" onClick={() => handleCheckConnection(s)}>
                                                            <Wifi size={16} color={s.apiStatus === 'Connected' ? '#10b981' : undefined} />
                                                        </button>
                                                    )}
                                                    <button className="action-btn edit" title="Izmeni" onClick={() => handleOpenSupplierModal(s)}><Edit size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'matrix' && (
                    <div className="matrix-container fade-in">
                        <div className="pricing-logic-explainer" style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: 'white', marginBottom: '5px' }}>DOBAVLJAČ (BRUTO)</div>
                                    <div style={{ fontSize: '1.2rem' }}>100€</div>
                                </div>
                                <ArrowRight />
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#fbbf24', marginBottom: '5px' }}>- PROVIZIJA (ULAZ)</div>
                                    <div style={{ color: '#ef4444' }}>10% + 0€</div>
                                </div>
                                <ArrowRight />
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: 'white', marginBottom: '5px' }}>NETO TROŠAK</div>
                                    <div style={{ fontSize: '1.2rem' }}>90€</div>
                                </div>
                                <ArrowRight />
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#10b981', marginBottom: '5px' }}>+ MARŽA (IZLAZ)</div>
                                    <div style={{ color: '#10b981' }}>5% + 0€</div>
                                </div>
                                <ArrowRight />
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: 'white', marginBottom: '5px' }}>PRODAJNA CENA</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>94.50€</div>
                                </div>
                            </div>
                        </div>

                        <div className="table-container">
                            <table className="subagents-table matrix-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40%' }}>Nivo Pravila</th>
                                        <th style={{ width: '25%' }}>Provizija (Ulaz) % / €</th>
                                        <th style={{ width: '25%' }}>Marža (Izlaz) % / €</th>
                                        <th style={{ width: '10%' }}>Akcija</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="matrix-section-row"><td colSpan={4}>OSNOVNI DEFAULT (UKOLIKO NIJE DRUGAČIJE DEFINISANO)</td></tr>
                                    {rules.filter(r => r.targetType === 'Global').map(r => (
                                        <tr key={r.id}>
                                            <td className="product-cell">
                                                <div className="product-name">{r.description}</div>
                                                <div className="product-type">GLOBAL RULE</div>
                                            </td>
                                            <td>{r.incomingCommission}% + {r.incomingExtra}€</td>
                                            <td style={{ color: '#10b981' }}>{r.markupMargin}% + {r.markupExtra}€</td>
                                            <td><button className="action-btn edit" onClick={() => handleOpenRuleModal(r)}><Edit size={14} /></button></td>
                                        </tr>
                                    ))}

                                    <tr className="matrix-section-row"><td colSpan={4}>PRAVILA PO DOBAVLJAČIMA (API LEVEL)</td></tr>
                                    {suppliers.map(s => (
                                        <tr key={s.id}>
                                            <td className="product-cell">
                                                <div className="product-name">{s.name}</div>
                                                <div className="product-type">{s.apiConnection || 'Offline Contract'}</div>
                                            </td>
                                            <td>{s.defaultPolicy.commission}% + {s.defaultPolicy.commissionAmount}€</td>
                                            <td style={{ color: '#10b981' }}>{s.defaultPolicy.margin}% + {s.defaultPolicy.marginAmount}€</td>
                                            <td><button className="action-btn edit" onClick={() => navigate(`/suppliers/${s.id}`)}><Edit size={14} /></button></td>
                                        </tr>
                                    ))}

                                    <tr className="matrix-section-row"><td colSpan={4}>SPECIJALNI IZUZECI (DESTINACIJE I HOTELI)</td></tr>
                                    {rules.filter(r => r.targetType !== 'Global').map(r => {
                                        const supName = r.supplierId ? suppliers.find(s => s.id === r.supplierId)?.name : 'Svi Dobavljači';
                                        return (
                                            <tr key={r.id}>
                                                <td className="product-cell">
                                                    <div className="product-name">{r.targetName}</div>
                                                    <div className="product-type">{r.targetType} • {supName}</div>
                                                </td>
                                                <td>{r.incomingCommission}% + {r.incomingExtra}€</td>
                                                <td style={{ color: '#10b981' }}>{r.markupMargin}% + {r.markupExtra}€</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button className="action-btn edit" onClick={() => handleOpenRuleModal(r)}><Edit size={14} /></button>
                                                        <button className="action-btn delete" onClick={() => handleDeleteRule(r.id)}><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'exceptions' && (
                    <div className="rules-container fade-in">
                        <div className="matrix-header">
                            <div>
                                <h2>Specijalni Izuzeci</h2>
                                <p>Lista svih aktivnih overajd pravila</p>
                            </div>
                            <button className="btn-primary" onClick={() => handleOpenRuleModal()}><Plus size={18} /> Novo Pravilo</button>
                        </div>

                        <div className="rules-grid">
                            {rules.filter(r => r.targetType !== 'Global').map(rule => {
                                const sup = suppliers.find(s => s.id === rule.supplierId);
                                return (
                                    <div key={rule.id} className="rule-card">
                                        <div className="rule-badge" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                            <span>{rule.targetType}</span>
                                            {sup && <span style={{ opacity: 0.7, fontSize: '0.8em' }}>{sup.name}</span>}
                                        </div>
                                        <div className="rule-header">
                                            <h3>{rule.targetName}</h3>
                                            <div className="rule-dates"><Calendar size={14} /> {rule.startDate || 'Uvek'} — {rule.endDate || 'Uvek'}</div>
                                        </div>
                                        <div className="rule-body">
                                            <div className="rule-meta">{rule.description}</div>
                                            <div className="rule-pricing-summary" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                <div className="summary-item">
                                                    <span className="label">Provizija:</span>
                                                    <strong className="value">{rule.incomingCommission}% + {rule.incomingExtra}€</strong>
                                                </div>
                                                <div className="summary-item">
                                                    <span className="label">Marža:</span>
                                                    <strong className="value" style={{ color: '#10b981' }}>{rule.markupMargin}%  + {rule.markupExtra}€</strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rule-footer">
                                            <button className="action-btn edit" onClick={() => handleOpenRuleModal(rule)}><Edit size={14} /></button>
                                            <button className="action-btn delete" onClick={() => handleDeleteRule(rule.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* SUPPLIER MODAL - REDESIGNED HORIZONTAL LAYOUT */}
            <AnimatePresence>
                {showSupplierModal && (
                    <div className="modal-overlay" onClick={() => setShowSupplierModal(false)} style={{ perspective: '1000px', background: 'transparent', backdropFilter: 'none' }}>
                        <motion.div
                            drag
                            dragMomentum={false}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="modal-content glass-panel"
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: 'min(1500px, 98vw)',
                                maxWidth: '1500px',
                                height: 'auto',
                                minHeight: '600px',
                                maxHeight: '95vh',
                                display: 'flex',
                                flexDirection: 'row',
                                overflow: 'visible',
                                borderRadius: '24px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)'
                            }}
                        >
                            <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'row' }}>
                                {/* LEFT SIDEBAR NAVIGATION */}
                                <div style={{
                                    width: '250px',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRight: '1px solid rgba(255,255,255,0.08)',
                                    padding: '24px 16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px'
                                }}>
                                    <div style={{ marginBottom: '24px', padding: '0 8px' }}>
                                        <div style={{
                                            width: '40px', height: '40px',
                                            background: 'linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)',
                                            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                                            marginBottom: '12px'
                                        }}>
                                            <Briefcase size={20} />
                                        </div>
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.2 }}>{editingSupplier ? 'Uredi' : 'Novi'} Dobavljač</h2>
                                    </div>

                                    {[
                                        { id: 'categorization', icon: Layers, label: 'Kategorizacija', desc: 'Tip troška i domena' },
                                        { id: 'basic', icon: Briefcase, label: 'Osnovni podaci', desc: 'PIB, adresa, status' },
                                        { id: 'api', icon: Wifi, label: 'API Integracije', desc: 'Povezivanje sa vendorima' },
                                        { id: 'contact', icon: Users, label: 'Kontakt podaci', desc: 'Osoba, tel, email' },
                                        { id: 'policy', icon: Settings, label: 'Cene & Polisa', desc: 'Inicijalne marže' },
                                        { id: 'notes', icon: FileText, label: 'Napomene', desc: 'Interne beleške' }
                                    ].map((step) => {
                                        const isActive = activeSupplierStep === step.id;
                                        const isCompleted = step.id === 'categorization' ? !!supplierForm.category :
                                            step.id === 'basic' ? !!supplierForm.name : true;

                                        return (
                                            <button
                                                key={step.id}
                                                type="button"
                                                onClick={() => setActiveSupplierStep(step.id as any)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '12px 16px',
                                                    borderRadius: '12px',
                                                    border: '1px solid',
                                                    borderColor: isActive ? 'var(--accent)' : 'transparent',
                                                    background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                    textAlign: 'left',
                                                    transition: 'all 0.2s',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <div style={{
                                                    width: '32px', height: '32px',
                                                    borderRadius: '8px',
                                                    background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: isActive ? 'white' : 'var(--text-secondary)'
                                                }}>
                                                    <step.icon size={16} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: isActive ? 800 : 600, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                        {step.label}
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.6 }}>{step.desc}</div>
                                                </div>
                                                {isCompleted && (step.id === 'categorization' || step.id === 'basic') && (
                                                    <Check size={14} color="#10b981" />
                                                )}
                                            </button>
                                        );
                                    })}

                                    <div style={{ marginTop: 'auto', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px dashed var(--accent)' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '4px' }}>Savet</div>
                                        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                            Obavezna polja su označena sa (*). Svaka sekcija se automatski čuva prilikom prelaska na sledeću.
                                        </p>
                                    </div>
                                </div>

                                {/* RIGHT CONTENT AREA */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <div className="modal-body" style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeSupplierStep}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {activeSupplierStep === 'categorization' && (
                                                    <div className="detail-section">
                                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Klasifikacija dobavljača</h3>
                                                        <div className="input-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                                            <div className="input-field">
                                                                <label style={{ fontWeight: 800 }}>Glavna kategorija *</label>
                                                                <select
                                                                    className="admin-select"
                                                                    style={{ height: '40px', fontSize: '14px' }}
                                                                    value={supplierForm.category || ''}
                                                                    onChange={e => setSupplierForm({
                                                                        ...supplierForm,
                                                                        category: e.target.value as any,
                                                                        subcategory: ''
                                                                    })}
                                                                >
                                                                    <option value="">— Izaberite kategoriju —</option>
                                                                    {Object.keys(SUPPLIER_CATEGORIES).map(cat => (
                                                                        <option key={cat} value={cat}>{cat}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="input-field">
                                                                <label style={{ fontWeight: 800 }}>Podkategorija {supplierForm.category ? `(${supplierForm.category})` : ''}</label>
                                                                <select
                                                                    className="admin-select"
                                                                    style={{ height: '40px', fontSize: '14px', opacity: !supplierForm.category ? 0.5 : 1 }}
                                                                    value={supplierForm.subcategory || ''}
                                                                    onChange={e => setSupplierForm({ ...supplierForm, subcategory: e.target.value })}
                                                                    disabled={!supplierForm.category}
                                                                >
                                                                    <option value="">— Izaberite podkategoriju —</option>
                                                                    {supplierForm.category && SUPPLIER_CATEGORIES[supplierForm.category]?.map((sub) => (
                                                                        <option key={sub} value={sub}>{sub}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div style={{ marginTop: '32px', display: 'flex', gap: '20px' }}>
                                                            <div style={{ flex: 1, padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }}></div>
                                                                    <span style={{ fontWeight: 800, fontSize: '13px' }}>Operativni troškovi</span>
                                                                </div>
                                                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Troškovi hladnog pogona (Zakup, plate, komunalije) koji nastaju bez obzira na prodaju.</p>
                                                            </div>
                                                            <div style={{ flex: 1, padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                                                    <span style={{ fontWeight: 800, fontSize: '13px' }}>Direktni troškovi</span>
                                                                </div>
                                                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Varijabilni troškovi (Smeštaj, transport, prevoz) koji nastaju tek po prodaji usluge.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {activeSupplierStep === 'basic' && (
                                                    <div className="detail-section">
                                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Osnovni identifikacioni podaci</h3>
                                                        <div style={{ display: 'flex', gap: '24px' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <div className="input-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                                                    <div className="input-field" style={{ gridColumn: 'span 2', marginBottom: '8px' }}>
                                                                        <label style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', color: 'var(--accent)' }}>Pretraži lokaciju</label>
                                                                        <GoogleAddressAutocomplete
                                                                            value={supplierForm.address || ''}
                                                                            onChange={handleAddressChange}
                                                                            placeholder="Unesite naziv ili adresu dobavljača..."
                                                                            className="admin-input"
                                                                        />
                                                                    </div>
                                                                    <div className="input-field">
                                                                        <label style={{ fontWeight: 800 }}>Puni naziv dobavljača *</label>
                                                                        <input type="text" required style={{ height: '40px' }} value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} placeholder="npr. Turistička Organizacija Grčke" />
                                                                    </div>
                                                                    <div className="input-field">
                                                                        <label style={{ fontWeight: 800 }}>Status</label>
                                                                        <select className="admin-select" style={{ height: '40px' }} value={supplierForm.status} onChange={e => setSupplierForm({ ...supplierForm, status: e.target.value as any })}>
                                                                            <option value="Active">Aktivan</option>
                                                                            <option value="Suspended">Suspendovan</option>
                                                                            <option value="Pending">U pripremi / Proveri</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="input-field">
                                                                        <label style={{ fontWeight: 800 }}>Država *</label>
                                                                        <CountrySearch
                                                                            value={supplierForm.country || ''}
                                                                            onChange={(name, code) => {
                                                                                setSelectedCountryCode(code);
                                                                                setSupplierForm({ ...supplierForm, country: name, city: '' });
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="input-field">
                                                                        <label style={{ fontWeight: 800 }}>Grad *</label>
                                                                        <CitySearch
                                                                            value={supplierForm.city || ''}
                                                                            countryCode={selectedCountryCode}
                                                                            onChange={city => setSupplierForm({ ...supplierForm, city })}
                                                                            className=""
                                                                            placeholder="Unesite ili pretražite grad..."
                                                                        />
                                                                    </div>
                                                                    <div className="input-field" style={{ gridColumn: 'span 2' }}>
                                                                        <label style={{ fontWeight: 800 }}>Tačna adresa (ulica i broj)</label>
                                                                        <input
                                                                            type="text"
                                                                            style={{ height: '40px' }}
                                                                            value={supplierForm.address || ''}
                                                                            onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
                                                                            placeholder="npr. Makedonska 30"
                                                                        />
                                                                    </div>
                                                                    <div className="input-field">
                                                                        <label style={{ fontWeight: 800 }}>PIB</label>
                                                                        <input type="text" style={{ height: '40px' }} value={supplierForm.pib || ''} onChange={e => setSupplierForm({ ...supplierForm, pib: e.target.value })} placeholder="102938475" />
                                                                    </div>
                                                                    <div className="input-field">
                                                                        <label style={{ fontWeight: 800 }}>Matični broj</label>
                                                                        <input type="text" style={{ height: '40px' }} value={supplierForm.regNumber || ''} onChange={e => setSupplierForm({ ...supplierForm, regNumber: e.target.value })} placeholder="08765432" />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* MINI MAP PREVIEW */}
                                                            <div style={{ width: '300px', flexShrink: 0 }}>
                                                                <label style={{ fontWeight: 800, marginBottom: '8px', display: 'block' }}>Lokacija na mapi</label>
                                                                <div
                                                                    onClick={() => supplierForm.lat && setShowFullMap(true)}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '240px',
                                                                        background: 'rgba(255,255,255,0.05)',
                                                                        borderRadius: '20px',
                                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                                        overflow: 'hidden',
                                                                        position: 'relative',
                                                                        cursor: supplierForm.lat ? 'pointer' : 'default',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                >
                                                                    {supplierForm.lat && supplierForm.lng ? (
                                                                        <>
                                                                            <LeafletMap
                                                                                lat={supplierForm.lat}
                                                                                lng={supplierForm.lng}
                                                                                zoom={15}
                                                                                height="100%"
                                                                                borderRadius="20px"
                                                                            />
                                                                            <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', color: 'white', backdropFilter: 'blur(4px)', zIndex: 1000 }}>
                                                                                Klikni za uvećanje
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                                                                            <MapPin size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                                                            <p style={{ fontSize: '12px' }}>Pretražite adresu iznad za prikaz mape</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                                        <Activity size={14} color="var(--accent)" />
                                                                        <span style={{ fontSize: '11px', fontWeight: 800 }}>Koordinate</span>
                                                                    </div>
                                                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                                                        Lat: {supplierForm.lat?.toFixed(6) || 'N/A'}<br />
                                                                        Lng: {supplierForm.lng?.toFixed(6) || 'N/A'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {activeSupplierStep === 'api' && (
                                                    <div className="detail-section">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                                            <div>
                                                                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>API Marketplace Integracije</h3>
                                                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Označi sve API provajdere koji servisiraju ovog dobavljača</p>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <span style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', borderRadius: '100px', fontSize: '11px', fontWeight: 800 }}>
                                                                    {supplierForm.apiConnections?.length || 0} Izabrano
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                                            gap: '12px',
                                                            padding: '24px',
                                                            background: 'rgba(255,255,255,0.02)',
                                                            borderRadius: '20px',
                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                            maxHeight: '400px',
                                                            overflowY: 'auto'
                                                        }}>
                                                            {AVAILABLE_API_PROVIDERS.map(api => {
                                                                const isChecked = supplierForm.apiConnections?.includes(api);
                                                                return (
                                                                    <label key={api} style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '10px',
                                                                        padding: '12px 16px',
                                                                        borderRadius: '12px',
                                                                        background: isChecked ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                                                                        border: '1px solid',
                                                                        borderColor: isChecked ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.2s',
                                                                        boxShadow: isChecked ? '0 4px 12px var(--accent-glow)' : 'none'
                                                                    }}>
                                                                        <div style={{
                                                                            width: '24px', height: '24px',
                                                                            borderRadius: '6px',
                                                                            border: '2px solid',
                                                                            borderColor: isChecked ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            background: isChecked ? 'var(--accent)' : 'transparent'
                                                                        }}>
                                                                            {isChecked && <Check size={14} color="white" />}
                                                                        </div>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isChecked}
                                                                            style={{ display: 'none' }}
                                                                            onChange={e => {
                                                                                const current = supplierForm.apiConnections || [];
                                                                                const next = e.target.checked
                                                                                    ? [...current, api]
                                                                                    : current.filter(a => a !== api);
                                                                                setSupplierForm({ ...supplierForm, apiConnections: next });
                                                                            }}
                                                                        />
                                                                        <span style={{ fontSize: '13px', fontWeight: isChecked ? 800 : 500 }}>{api}</span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {activeSupplierStep === 'contact' && (
                                                    <div className="detail-section">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                            <div>
                                                                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Kontakt osobe</h3>
                                                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Moguće je uneti do 5 različitih kontakata (npr. Prodaja, Finansije, Booking)</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="btn-secondary"
                                                                style={{ padding: '8px 16px', fontSize: '12px' }}
                                                                onClick={addSupplierContact}
                                                                disabled={(supplierForm.contacts?.length || 0) >= 5}
                                                            >
                                                                <Plus size={14} style={{ marginRight: '6px' }} /> Dodaj još jednu osobu
                                                            </button>
                                                        </div>

                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                                                            {(supplierForm.contacts || [{ name: '', email: '', phone: '', role: 'Rezervacije' }]).map((contact, idx) => (
                                                                <div key={idx} style={{
                                                                    padding: '20px',
                                                                    background: 'rgba(255,255,255,0.03)',
                                                                    borderRadius: '16px',
                                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                                    position: 'relative'
                                                                }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <span style={{
                                                                                width: '24px', height: '24px',
                                                                                borderRadius: '50%', background: 'var(--accent)',
                                                                                color: 'white', display: 'flex',
                                                                                alignItems: 'center', justifyContent: 'center',
                                                                                fontSize: '11px', fontWeight: 800
                                                                            }}>{idx + 1}</span>
                                                                            <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>{contact.role || 'Kontakt osoba'}</span>
                                                                        </div>
                                                                        {idx > 0 && (
                                                                            <button
                                                                                type="button"
                                                                                className="modal-close"
                                                                                style={{ width: '28px', height: '28px', fontSize: '16px' }}
                                                                                onClick={() => removeSupplierContact(idx)}
                                                                            >
                                                                                <X size={14} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="input-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                                                        <div className="input-field">
                                                                            <label style={{ fontWeight: 800 }}>Puno ime</label>
                                                                            <input type="text" style={{ height: '40px' }} value={contact.name} onChange={e => updateSupplierContact(idx, 'name', e.target.value)} placeholder="npr. Marko Marković" />
                                                                        </div>
                                                                        <div className="input-field">
                                                                            <label style={{ fontWeight: 800 }}>Telefon</label>
                                                                            <input type="tel" style={{ height: '40px' }} value={contact.phone} onChange={e => updateSupplierContact(idx, 'phone', e.target.value)} placeholder="+381 ..." />
                                                                        </div>
                                                                        <div className="input-field">
                                                                            <label style={{ fontWeight: 800 }}>E-mail</label>
                                                                            <input type="email" style={{ height: '40px' }} value={contact.email} onChange={e => updateSupplierContact(idx, 'email', e.target.value)} placeholder="me@supplier.com" />
                                                                        </div>
                                                                        <div className="input-field">
                                                                            <label style={{ fontWeight: 800 }}>Sektor / Role</label>
                                                                            <input type="text" style={{ height: '40px' }} value={contact.role} onChange={e => updateSupplierContact(idx, 'role', e.target.value)} placeholder="npr. Prodaja" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="input-field" style={{ marginTop: '24px' }}>
                                                            <label style={{ fontWeight: 800 }}>Web sajt / B2B Portal</label>
                                                            <input type="url" style={{ height: '40px' }} placeholder="https://portal.supplier.com" />
                                                        </div>
                                                    </div>
                                                )}

                                                {activeSupplierStep === 'policy' && (
                                                    <div className="detail-section">
                                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Globalna politika cena</h3>
                                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '32px' }}>Ove vrednosti se primenjuju automatski ako sistem ne pronađe specifičnije pravilo.</p>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                                            <div style={{ padding: '24px', background: 'rgba(251, 191, 36, 0.05)', borderRadius: '20px', border: '1px solid rgba(251, 191, 36, 0.1)' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                                                    <div style={{ padding: '8px', background: '#fbbf24', borderRadius: '8px', color: '#000' }}><Percent size={18} /></div>
                                                                    <h4 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase' }}>Ulazna Provizija</h4>
                                                                </div>
                                                                <div className="input-grid" style={{ gridTemplateColumns: '1fr', gap: '12px' }}>
                                                                    <div className="input-field">
                                                                        <label>Procenat popusta (%)</label>
                                                                        <input type="number" step="0.1" style={{ height: '36px' }} value={supplierForm.defaultPolicy?.commission} onChange={e => setSupplierForm({ ...supplierForm, defaultPolicy: { ...supplierForm.defaultPolicy!, commission: parseFloat(e.target.value) || 0 } })} />
                                                                    </div>
                                                                    <div className="input-field">
                                                                        <label>Fiksni iznos po pax/sob (€)</label>
                                                                        <input type="number" step="1" style={{ height: '36px' }} value={supplierForm.defaultPolicy?.commissionAmount} onChange={e => setSupplierForm({ ...supplierForm, defaultPolicy: { ...supplierForm.defaultPolicy!, commissionAmount: parseFloat(e.target.value) || 0 } })} />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                                                    <div style={{ padding: '8px', background: '#10b981', borderRadius: '8px', color: '#fff' }}><TrendingUp size={18} /></div>
                                                                    <h4 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase' }}>Izlazna Marža</h4>
                                                                </div>
                                                                <div className="input-grid" style={{ gridTemplateColumns: '1fr', gap: '12px' }}>
                                                                    <div className="input-field">
                                                                        <label>Naš Markup (%)</label>
                                                                        <input type="number" step="0.1" style={{ height: '36px' }} value={supplierForm.defaultPolicy?.margin} onChange={e => setSupplierForm({ ...supplierForm, defaultPolicy: { ...supplierForm.defaultPolicy!, margin: parseFloat(e.target.value) || 0 } })} />
                                                                    </div>
                                                                    <div className="input-field">
                                                                        <label>Fiksna taksa / fee (€)</label>
                                                                        <input type="number" step="1" style={{ height: '36px' }} value={supplierForm.defaultPolicy?.marginAmount} onChange={e => setSupplierForm({ ...supplierForm, defaultPolicy: { ...supplierForm.defaultPolicy!, marginAmount: parseFloat(e.target.value) || 0 } })} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {activeSupplierStep === 'notes' && (
                                                    <div className="detail-section">
                                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '24px' }}>Interne beleške i Ugovor</h3>
                                                        <textarea
                                                            value={supplierForm.notes || ''}
                                                            onChange={e => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                                                            placeholder="Ovde unesite sve bitne detalje: broj ugovora, specifične periode otplate, uslove storniranja ili bilo šta što agent treba da zna o ovom dobavljaču..."
                                                            style={{
                                                                width: '100%',
                                                                minHeight: '300px',
                                                                background: 'rgba(255,255,255,0.03)',
                                                                border: '2px solid rgba(255,255,255,0.08)',
                                                                borderRadius: '16px',
                                                                padding: '24px',
                                                                color: 'var(--text-primary)',
                                                                fontSize: '15px',
                                                                lineHeight: '1.6',
                                                                resize: 'none',
                                                                fontFamily: 'inherit',
                                                                outline: 'none'
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>

                                    <div className="modal-footer" style={{ flexShrink: 0, padding: '16px 32px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button
                                                type="button"
                                                className="btn-secondary"
                                                onClick={() => {
                                                    const steps = ['categorization', 'basic', 'api', 'contact', 'policy', 'notes'];
                                                    const idx = steps.indexOf(activeSupplierStep);
                                                    if (idx > 0) setActiveSupplierStep(steps[idx - 1] as any);
                                                }}
                                                disabled={activeSupplierStep === 'categorization'}
                                                style={{ opacity: activeSupplierStep === 'categorization' ? 0.3 : 1 }}
                                            >
                                                Nazad
                                            </button>
                                            <button
                                                type="button"
                                                style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}
                                                onClick={() => {
                                                    const steps = ['categorization', 'basic', 'api', 'contact', 'policy', 'notes'];
                                                    const idx = steps.indexOf(activeSupplierStep);
                                                    if (idx < steps.length - 1) setActiveSupplierStep(steps[idx + 1] as any);
                                                }}
                                                disabled={activeSupplierStep === 'notes'}
                                                className={activeSupplierStep === 'notes' ? '' : 'btn-hover-effect'}
                                            >
                                                Dalje <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button type="button" className="btn-secondary" style={{ background: 'transparent' }} onClick={() => setShowSupplierModal(false)}>Zatvori bez snimanja</button>
                                            <button type="submit" className="btn-primary" style={{ padding: '12px 32px', boxShadow: '0 8px 20px var(--accent-glow)' }}>
                                                {editingSupplier ? 'Sačuvaj izmene' : 'Završi i Dodaj Dobavljača'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form >
                        </motion.div >
                    </div >
                )}
            </AnimatePresence >

            {/* ADD/EDIT RULE MODAL */}
            <AnimatePresence>
                {
                    showRuleModal && (
                        <div className="modal-overlay" onClick={() => setShowRuleModal(false)} style={{ perspective: '1000px' }}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="modal-content glass-panel"
                                onClick={e => e.stopPropagation()}
                                style={{
                                    width: '600px',
                                    maxHeight: '90vh',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <div className="modal-header">
                                    <h2>{editingRule ? 'Izmena Pravila' : 'Novo Pravilo'}</h2>
                                    <button className="modal-close" onClick={() => setShowRuleModal(false)}><X size={20} /></button>
                                </div>

                                <form onSubmit={handleSaveRule} className="modal-body" style={{ padding: '30px', overflowY: 'auto' }}>
                                    {/* 1. SCOPE */}
                                    <div className="detail-section">
                                        <h3><MapPin size={16} /> Opseg Pravila</h3>
                                        <div className="input-grid">
                                            <div className="input-field">
                                                <label>Tip Targeta</label>
                                                <select
                                                    className="admin-select"
                                                    value={ruleForm.targetType}
                                                    onChange={e => setRuleForm({ ...ruleForm, targetType: e.target.value as any })}
                                                >
                                                    <option value="Destination">Destinacija (Država/Grad)</option>
                                                    <option value="Hotel">Specifičan Hotel</option>
                                                    <option value="Global">Global Override</option>
                                                </select>
                                            </div>
                                            <div className="input-field">
                                                <label>Dobavljač (Opciono)</label>
                                                <select
                                                    className="admin-select"
                                                    value={ruleForm.supplierId || ''}
                                                    onChange={e => setRuleForm({ ...ruleForm, supplierId: e.target.value || undefined })}
                                                >
                                                    <option value="">Svi Dobljači (Universal)</option>
                                                    {suppliers.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="input-field" style={{ gridColumn: 'span 2' }}>
                                                <label>Naziv Targeta (npr. Grčka ili Hilton)</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={ruleForm.targetName}
                                                    onChange={e => setRuleForm({ ...ruleForm, targetName: e.target.value })}
                                                    placeholder="Unesite naziv destinacije ili hotela..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. PRICING LOGIC */}
                                    <div className="detail-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px' }}>
                                        <h3><DollarSign size={16} /> Logika Cena</h3>

                                        <div style={{ marginBottom: '20px' }}>
                                            <h4 style={{ fontSize: '12px', color: '#fbbf24', textTransform: 'uppercase', marginBottom: '10px' }}>Ulazna Provizija (Cost Reduction)</h4>
                                            <div className="input-grid">
                                                <div className="input-field">
                                                    <label>Procenat (%)</label>
                                                    <input type="number" step="0.1" value={ruleForm.incomingCommission} onChange={e => setRuleForm({ ...ruleForm, incomingCommission: parseFloat(e.target.value) })} />
                                                </div>
                                                <div className="input-field">
                                                    <label>Fiksni Iznos (€)</label>
                                                    <input type="number" step="1" value={ruleForm.incomingExtra} onChange={e => setRuleForm({ ...ruleForm, incomingExtra: parseFloat(e.target.value) })} />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 style={{ fontSize: '12px', color: '#10b981', textTransform: 'uppercase', marginBottom: '10px' }}>Izlazna Marža (Markup)</h4>
                                            <div className="input-grid">
                                                <div className="input-field">
                                                    <label>Procenat (%)</label>
                                                    <input type="number" step="0.1" value={ruleForm.markupMargin} onChange={e => setRuleForm({ ...ruleForm, markupMargin: parseFloat(e.target.value) })} />
                                                </div>
                                                <div className="input-field">
                                                    <label>Fiksni Iznos (€)</label>
                                                    <input type="number" step="1" value={ruleForm.markupExtra} onChange={e => setRuleForm({ ...ruleForm, markupExtra: parseFloat(e.target.value) })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. DATES & META */}
                                    <div className="detail-section">
                                        <h3><Calendar size={16} /> Period Važenja & Opis</h3>
                                        <div className="input-grid">
                                            <div className="input-field">
                                                <label>Od (Opciono)</label>
                                                <input type="date" value={ruleForm.startDate || ''} onChange={e => setRuleForm({ ...ruleForm, startDate: e.target.value })} />
                                            </div>
                                            <div className="input-field">
                                                <label>Do (Opciono)</label>
                                                <input type="date" value={ruleForm.endDate || ''} onChange={e => setRuleForm({ ...ruleForm, endDate: e.target.value })} />
                                            </div>
                                            <div className="input-field" style={{ gridColumn: 'span 2' }}>
                                                <label>Opis Pravila</label>
                                                <input type="text" value={ruleForm.description} onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })} placeholder="Interne beleške..." />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button type="button" className="btn-secondary" onClick={() => setShowRuleModal(false)}>Otkaži</button>
                                        <button type="submit" className="btn-primary">Sačuvaj Pravilo</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence>

            {/* MAP LIGHTBOX */}
            <AnimatePresence>
                {showFullMap && (
                    <div
                        className="modal-overlay"
                        style={{ zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
                        onClick={() => setShowFullMap(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '90vw',
                                height: '80vh',
                                background: 'var(--bg-card)',
                                borderRadius: '30px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                overflow: 'hidden',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div style={{ padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Lokacija: {supplierForm.name}</h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{supplierForm.address}</p>
                                </div>
                                <button
                                    onClick={() => setShowFullMap(false)}
                                    style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div style={{ flex: 1, position: 'relative' }}>
                                {supplierForm.lat && supplierForm.lng && (
                                    <LeafletMap
                                        lat={supplierForm.lat}
                                        lng={supplierForm.lng}
                                        zoom={16}
                                        height="100%"
                                    />
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupplierAdmin;
