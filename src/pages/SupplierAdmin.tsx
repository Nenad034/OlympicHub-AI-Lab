import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Search, Filter, Download, Plus, MoreHorizontal,
    Briefcase, Building, Layers, Shield, Settings, CheckCircle,
    XCircle, AlertCircle, TrendingUp, Calendar, MapPin,
    DollarSign, Percent, ArrowRight, Eye, Edit, Trash2, Key,
    Activity, Clock, FileText, Globe, Euro, Command, Truck, X, Wifi
} from 'lucide-react';
import { useAuthStore } from '../stores';
import './SubagentAdmin.css';
import { AnimatePresence, motion } from 'framer-motion';

import supplierService, { type UnifiedSupplier as Supplier } from '../services/SupplierService';

// Re-exporting or using the interface from service to ensure consistency
// We alias it to 'Supplier' to minimize refactoring in this file
// interface Supplier { ... } -> Removed in favor of service import

interface PricingRule {
    id: string;
    supplierId?: string; // If specific to a supplier
    targetType: 'Global' | 'Destination' | 'Hotel';
    targetName: string; // e.g., 'Grčka', 'Hilton'
    startDate?: string;
    endDate?: string;
    description: string;

    // Incoming (Cost Reduction)
    incomingCommission: number; // %
    incomingExtra: number;      // Fixed Amount €

    // Outgoing (Price Increase)
    markupMargin: number;       // %
    markupExtra: number;        // Fixed Amount €

    status: 'Active' | 'Inactive';
    priority: number; // Higher number = higher priority override
}

// Mock Data
const MOCK_RULES: PricingRule[] = [
    { id: 'rule-1', targetType: 'Global', targetName: 'Svi Aranžmani', description: 'Globalna politika za sve', incomingCommission: 0, incomingExtra: 0, markupMargin: 5, markupExtra: 0, status: 'Active', priority: 0 },
    { id: 'rule-2', supplierId: 'sup-001', targetType: 'Destination', targetName: 'Grčka', description: 'Letnja sezona Grčka (Solvex)', incomingCommission: 10, incomingExtra: 0, markupMargin: 7, markupExtra: 5, status: 'Active', startDate: '2026-06-01', endDate: '2026-09-01', priority: 10 },
    { id: 'rule-3', supplierId: 'sup-002', targetType: 'Hotel', targetName: 'Hilton Belgrade', description: 'Kao preferirani partner', incomingCommission: 15, incomingExtra: 2, markupMargin: 3, markupExtra: 0, status: 'Active', priority: 20 },
];

const SupplierAdmin: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'suppliers' | 'matrix' | 'exceptions'>('suppliers');
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [rules, setRules] = useState<PricingRule[]>(MOCK_RULES);
    const [searchQuery, setSearchQuery] = useState('');

    // Load Suppliers
    useEffect(() => {
        const fetchSuppliers = async () => {
            setLoading(true);
            const data = await supplierService.getAllSuppliers();
            setSuppliers(data);
            setLoading(false);
        };
        fetchSuppliers();
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

    // Supplier Form State
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
        name: '',
        type: 'API',
        status: 'Active',
        country: '',
        apiConnection: '',
        defaultPolicy: { commission: 0, commissionAmount: 0, margin: 0, marginAmount: 0 },
        financials: { totalVolume: 0, averageCommission: 0, averageMargin: 0 }
    });

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
    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.country.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    const handleSaveRule = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRule) {
            setRules(rules.map(r => r.id === editingRule.id ? { ...ruleForm, id: r.id } as PricingRule : r));
        } else {
            const newRule = {
                ...ruleForm,
                id: `rule-${Date.now()}`
            } as PricingRule;
            setRules([...rules, newRule]);
        }
        setShowRuleModal(false);
    };

    const handleDeleteRule = (id: string) => {
        if (window.confirm('Da li ste sigurni?')) {
            setRules(rules.filter(r => r.id !== id));
        }
    };

    // --- SUPPLIER HANDLERS ---
    const handleOpenSupplierModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            // Deep copy to avoid mutating state directly during edits before save
            setSupplierForm(JSON.parse(JSON.stringify(supplier)));
        } else {
            setEditingSupplier(null);
            setSupplierForm({
                name: '',
                type: 'API',
                status: 'Active',
                country: '',
                apiConnection: '',
                defaultPolicy: { commission: 0, commissionAmount: 0, margin: 0, marginAmount: 0 },
                financials: { totalVolume: 0, averageCommission: 0, averageMargin: 0 }
            });
        }
        setShowSupplierModal(true);
    };

    const handleSaveSupplier = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSupplier) {
            setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...s, ...supplierForm } as Supplier : s));
        } else {
            const newSupplier = {
                ...supplierForm,
                id: `sup-${Date.now()}`
            } as Supplier;
            setSuppliers([...suppliers, newSupplier]);
        }
        setShowSupplierModal(false);
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
                <button className={`tab-item ${activeTab === 'suppliers' ? 'active' : ''}`} onClick={() => setActiveTab('suppliers')}>
                    <Briefcase size={18} /> Lista Dobavljača
                </button>
                <button className={`tab-item ${activeTab === 'matrix' ? 'active' : ''}`} onClick={() => setActiveTab('matrix')}>
                    <Layers size={18} /> Global Matrix
                </button>
                <button className={`tab-item ${activeTab === 'exceptions' ? 'active' : ''}`} onClick={() => setActiveTab('exceptions')}>
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

                        {/* List */}
                        <div className="filters-bar">
                            <div className="search-box">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Traži dobavljača..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="filter-buttons">
                                <button className="filter-btn active">Svi</button>
                                <button className="filter-btn">API</button>
                                <button className="filter-btn">Offline</button>
                            </div>
                        </div>

                        <div className="table-container">
                            <table className="subagents-table">
                                <thead>
                                    <tr>
                                        <th>Dobavljač</th>
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
                                                        <div className="subagent-company">{s.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="cat-tag">{s.apiConnection || 'Manual'}</span>
                                                {s.apiStatus && (
                                                    <div style={{ fontSize: '10px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                                                        <span style={{
                                                            width: '6px', height: '6px', borderRadius: '50%',
                                                            backgroundColor: s.apiStatus === 'Connected' ? '#10b981' : (s.apiStatus === 'Disconnected' ? '#ef4444' : '#6b7280')
                                                        }}></span>
                                                        {s.apiStatus === 'Connected' ? 'Povezano' : (s.apiStatus === 'Disconnected' ? 'Prekid' : 'Nepoznato')}
                                                    </div>
                                                )}
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

            {/* SUPPLIER MODAL */}
            <AnimatePresence>
                {showSupplierModal && (
                    <div className="modal-overlay" onClick={() => setShowSupplierModal(false)} style={{ perspective: '1000px' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="modal-content glass-panel"
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '700px',
                                maxHeight: '90vh',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div className="modal-header">
                                <h2>{editingSupplier ? 'Izmena Dobavljača' : 'Novi Dobavljač'}</h2>
                                <button className="modal-close" onClick={() => setShowSupplierModal(false)}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSaveSupplier} className="modal-body" style={{ padding: '30px', overflowY: 'auto' }}>
                                {/* 1. BASIC INFO */}
                                <div className="detail-section">
                                    <h3><Briefcase size={16} /> Osnovni Podaci</h3>
                                    <div className="input-grid">
                                        <div className="input-field">
                                            <label>Naziv Dobavljača</label>
                                            <input type="text" required value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} placeholder="npr. Solvex" />
                                        </div>
                                        <div className="input-field">
                                            <label>Status</label>
                                            <select className="admin-select" value={supplierForm.status} onChange={e => setSupplierForm({ ...supplierForm, status: e.target.value as any })}>
                                                <option value="Active">Aktivan</option>
                                                <option value="Suspended">Suspendovan</option>
                                                <option value="Pending">U pripremi</option>
                                            </select>
                                        </div>
                                        <div className="input-field">
                                            <label>Tip Konekcije</label>
                                            <select className="admin-select" value={supplierForm.type} onChange={e => setSupplierForm({ ...supplierForm, type: e.target.value as any })}>
                                                <option value="API">API Integracija</option>
                                                <option value="Offline">Offline / Email</option>
                                                <option value="Hybrid">Hibridno</option>
                                            </select>
                                        </div>
                                        <div className="input-field">
                                            <label>API Naziv / Kod (Opciono)</label>
                                            <input type="text" value={supplierForm.apiConnection || ''} onChange={e => setSupplierForm({ ...supplierForm, apiConnection: e.target.value })} placeholder="npr. Solvex V2" />
                                        </div>
                                        <div className="input-field">
                                            <label>Država</label>
                                            <input type="text" value={supplierForm.country} onChange={e => setSupplierForm({ ...supplierForm, country: e.target.value })} placeholder="npr. Grčka" />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. DEFAULT POLICY */}
                                <div className="detail-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
                                    <h3><Settings size={16} /> Podrazumevana Politika (Global Default)</h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Ova pravila će se primenjivati na SVE aranžmane ovog dobavljača, osim ako nije definisan izuzetak.</p>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ fontSize: '12px', color: '#fbbf24', textTransform: 'uppercase', marginBottom: '10px' }}>Ulazna Provizija (Od njih ka nama)</h4>
                                        <div className="input-grid">
                                            <div className="input-field">
                                                <label>Procenat (%)</label>
                                                <input type="number" step="0.1" value={supplierForm.defaultPolicy?.commission} onChange={e => setSupplierForm({ ...supplierForm, defaultPolicy: { ...supplierForm.defaultPolicy!, commission: parseFloat(e.target.value) } })} />
                                            </div>
                                            <div className="input-field">
                                                <label>Fiksni Iznos (€)</label>
                                                <input type="number" step="1" value={supplierForm.defaultPolicy?.commissionAmount} onChange={e => setSupplierForm({ ...supplierForm, defaultPolicy: { ...supplierForm.defaultPolicy!, commissionAmount: parseFloat(e.target.value) } })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 style={{ fontSize: '12px', color: '#10b981', textTransform: 'uppercase', marginBottom: '10px' }}>Izlazna Marža (Naš Markup)</h4>
                                        <div className="input-grid">
                                            <div className="input-field">
                                                <label>Procenat (%)</label>
                                                <input type="number" step="0.1" value={supplierForm.defaultPolicy?.margin} onChange={e => setSupplierForm({ ...supplierForm, defaultPolicy: { ...supplierForm.defaultPolicy!, margin: parseFloat(e.target.value) } })} />
                                            </div>
                                            <div className="input-field">
                                                <label>Fiksni Iznos (€)</label>
                                                <input type="number" step="1" value={supplierForm.defaultPolicy?.marginAmount} onChange={e => setSupplierForm({ ...supplierForm, defaultPolicy: { ...supplierForm.defaultPolicy!, marginAmount: parseFloat(e.target.value) } })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn-secondary" onClick={() => setShowSupplierModal(false)}>Otkaži</button>
                                    <button type="submit" className="btn-primary">Sačuvaj Dobavljača</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ADD/EDIT RULE MODAL */}
            <AnimatePresence>
                {showRuleModal && (
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
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupplierAdmin;
