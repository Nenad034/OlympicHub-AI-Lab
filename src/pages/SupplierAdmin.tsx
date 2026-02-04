import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Search, Filter, Download, Plus, MoreHorizontal,
    Briefcase, Building, Layers, Shield, Settings, CheckCircle,
    XCircle, AlertCircle, TrendingUp, Calendar, MapPin,
    DollarSign, Percent, ArrowRight, Eye, Edit, Trash2, Key,
    Activity, Clock, FileText, Globe, Euro, Command, Truck
} from 'lucide-react';
import { useAuthStore } from '../stores';
import './SubagentAdmin.css';

// Types adapted for Supplier Context
interface Supplier {
    id: string;
    name: string;
    type: 'API' | 'Offline' | 'Hybrid';
    status: 'Active' | 'Suspended' | 'Pending';
    country: string;
    apiConnection?: string; // e.g., 'Solvex', 'Amadeus'
    financials: {
        totalVolume: number;
        averageCommission: number;
        averageMargin: number;
    };
    defaultPolicy: {
        commission: number; // Incoming %
        margin: number;     // Markup %
    };
}

interface PricingRule {
    id: string;
    targetType: 'API' | 'Destination' | 'Hotel' | 'Global';
    targetName: string; // e.g., 'Solvex', 'Greece', 'Hilton'
    startDate?: string;
    endDate?: string;
    description: string;
    incomingCommission: number; // % we get
    markupMargin: number;       // % we add
    markupExtra: number;        // Fixed amount we add
    status: 'Active' | 'Inactive';
}

// Mock Data
const MOCK_SUPPLIERS: Supplier[] = [
    {
        id: 'sup-001', name: 'Solvex', type: 'API', status: 'Active', country: 'Bulgaria',
        apiConnection: 'Solvex API v2', financials: { totalVolume: 1250000, averageCommission: 12, averageMargin: 8 },
        defaultPolicy: { commission: 10, margin: 5 }
    },
    {
        id: 'sup-002', name: 'Hotelbeds', type: 'API', status: 'Active', country: 'Spain',
        apiConnection: 'HB Connect', financials: { totalVolume: 3500000, averageCommission: 15, averageMargin: 6 },
        defaultPolicy: { commission: 12, margin: 5 }
    },
    {
        id: 'sup-003', name: 'Go2Holiday', type: 'Offline', status: 'Active', country: 'Serbia',
        financials: { totalVolume: 45000, averageCommission: 8, averageMargin: 12 },
        defaultPolicy: { commission: 8, margin: 10 }
    },
    {
        id: 'sup-004', name: 'RateHawk', type: 'API', status: 'Pending', country: 'USA',
        apiConnection: 'RH XML', financials: { totalVolume: 0, averageCommission: 0, averageMargin: 0 },
        defaultPolicy: { commission: 10, margin: 5 }
    }
];

const MOCK_RULES: PricingRule[] = [
    { id: 'rule-1', targetType: 'Global', targetName: 'Svi Aranžmani', description: 'Globalna politika za sve', incomingCommission: 10, markupMargin: 5, markupExtra: 0, status: 'Active' },
    { id: 'rule-2', targetType: 'Destination', targetName: 'Grčka', description: 'Letnja sezona Grčka (pojačana marža)', incomingCommission: 10, markupMargin: 7, markupExtra: 5, status: 'Active', startDate: '2026-06-01', endDate: '2026-09-01' },
    { id: 'rule-3', targetType: 'Hotel', targetName: 'Hilton Belgrade', description: 'Kao preferirani partner', incomingCommission: 15, markupMargin: 3, markupExtra: 0, status: 'Active' },
];

const SupplierAdmin: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'suppliers' | 'matrix' | 'exceptions'>('suppliers');
    const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
    const [rules, setRules] = useState<PricingRule[]>(MOCK_RULES);
    const [searchQuery, setSearchQuery] = useState('');

    // Matrix State
    const [matrixSearch, setMatrixSearch] = useState('');

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

    return (
        <div className="subagent-admin-container fade-in">
            <div className="admin-header">
                <div className="header-left">
                    <div className="admin-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        <Truck size={28} color="white" />
                    </div>
                    <div>
                        <h1>Supplier & Pricing Admin</h1>
                        <p>Upravljanje cenovnom politikom dobavljača (Marža & Provizija)</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => navigate('/')}>Nazad</button>
                    {activeTab === 'suppliers' && (
                        <button className="btn-primary"><Plus size={18} /> Novi Dobavljač</button>
                    )}
                    {(activeTab === 'matrix' || activeTab === 'exceptions') && (
                        <button className="btn-primary"><Plus size={18} /> Novo Pravilo</button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="admin-tabs-bar">
                <button className={`tab-item ${activeTab === 'suppliers' ? 'active' : ''}`} onClick={() => setActiveTab('suppliers')}>
                    <Briefcase size={18} /> Lista Dobavljača
                </button>
                <button className={`tab-item ${activeTab === 'matrix' ? 'active' : ''}`} onClick={() => setActiveTab('matrix')}>
                    <Layers size={18} /> Globalna Matrica Marži (NET {'->'} GROSS)
                </button>
                <button className={`tab-item ${activeTab === 'exceptions' ? 'active' : ''}`} onClick={() => setActiveTab('exceptions')}>
                    <Shield size={18} /> Specijalni Izuzeci & Akcije
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
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                                    <Activity size={24} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">API Konekcije</span>
                                    <span className="stat-value">{suppliers.filter(s => s.type === 'API').length}</span>
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
                                        <th>Tip Konekcije</th>
                                        <th>Država</th>
                                        <th>Status</th>
                                        <th>Podrazumevana Provizija (Ulaz)</th>
                                        <th>Podrazumevana Marža (Izlaz)</th>
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
                                            <td><span className="cat-tag">{s.apiConnection || 'Manual'}</span></td>
                                            <td>{s.country}</td>
                                            <td><span className="status-badge" style={{ background: getStatusColor(s.status) }}>{s.status}</span></td>
                                            <td className="amount">{s.defaultPolicy.commission}%</td>
                                            <td className="amount commission">{s.defaultPolicy.margin}%</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="action-btn edit" title="Izmeni"><Edit size={16} /></button>
                                                    <button className="action-btn delete" title="Obriši"><Trash2 size={16} /></button>
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
                        <div className="matrix-header">
                            <div className="header-flex">
                                <div>
                                    <h2>Globalna Matrica Cenovne Politike</h2>
                                    <p>Definišite logiku: <strong>Bruto (Dobavljač) {'->'} Neto (Trošak) {'->'} Prodajna Cena</strong></p>
                                </div>
                                <div className="search-box small">
                                    <Search size={14} />
                                    <input type="text" placeholder="Traži..." value={matrixSearch} onChange={(e) => setMatrixSearch(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Visual Explainer */}
                        <div className="pricing-logic-explainer" style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: 'white', marginBottom: '5px' }}>DOBAVLJAČ (BRUTO)</div>
                                    <div style={{ fontSize: '1.2rem' }}>100€</div>
                                </div>
                                <ArrowRight />
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#fbbf24', marginBottom: '5px' }}>- PROVIZIJA (ULAZ)</div>
                                    <div style={{ color: '#ef4444' }}>npr. 10% (-10€)</div>
                                </div>
                                <ArrowRight />
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: 'white', marginBottom: '5px' }}>NETO TROŠAK</div>
                                    <div style={{ fontSize: '1.2rem' }}>90€</div>
                                </div>
                                <ArrowRight />
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#10b981', marginBottom: '5px' }}>+ MARŽA (IZLAZ)</div>
                                    <div style={{ color: '#10b981' }}>npr. 5% (+4.5€)</div>
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
                                        <th style={{ width: '40%' }}>Opseg (Dobavljač / Destinacija)</th>
                                        <th style={{ width: '30%' }}>Ulazna Provizija (Od Dobavljača)</th>
                                        <th style={{ width: '30%' }}>Izlazna Marža (Naš Markup)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="matrix-section-row"><td colSpan={3}>GLOBALNO PODEŠAVANJE</td></tr>
                                    <tr>
                                        <td className="product-cell"><div className="product-name">Svi Dobavljači (Default)</div></td>
                                        <td>
                                            <div className="pricing-composite-row">
                                                <div className="comp-input"><input type="number" defaultValue={0} /><span className="unit-label">%</span></div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="pricing-composite-row">
                                                <div className="comp-input"><input type="number" defaultValue={5} /><span className="unit-label">%</span></div>
                                            </div>
                                        </td>
                                    </tr>

                                    <tr className="matrix-section-row"><td colSpan={3}>PO DOBAVLJAČIMA (API)</td></tr>
                                    {suppliers.filter(s => s.type === 'API').map(s => (
                                        <tr key={s.id}>
                                            <td className="product-cell">
                                                <div className="product-name">{s.name}</div>
                                                <div className="product-type">{s.apiConnection}</div>
                                            </td>
                                            <td>
                                                <div className="pricing-composite-row">
                                                    <div className="comp-input"><input type="number" defaultValue={s.defaultPolicy.commission} /><span className="unit-label">%</span></div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="pricing-composite-row">
                                                    <div className="comp-input"><input type="number" defaultValue={s.defaultPolicy.margin} /><span className="unit-label">%</span></div>
                                                    <div className="comp-plus">+</div>
                                                    <div className="comp-input"><input type="number" defaultValue={0} /><span className="unit-label">€</span></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    <tr className="matrix-section-row"><td colSpan={3}>PO DESTINACIJAMA (MOŽE BITI SPECIFIČNO ZA DOBAVLJAČA)</td></tr>
                                    {/* Mock Destinations */}
                                    <tr>
                                        <td className="product-cell">
                                            <div className="product-name">Grčka</div>
                                            <div className="product-type">Svi Dobavljači</div>
                                        </td>
                                        <td>
                                            <div style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>Nasleđeno od dobavljača</div>
                                        </td>
                                        <td>
                                            <div className="pricing-composite-row">
                                                <div className="comp-input"><input type="number" defaultValue={7} /><span className="unit-label">%</span></div>
                                            </div>
                                        </td>
                                    </tr>
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
                                <p>Override pravila za specifične hotele, sobe ili periode.</p>
                            </div>
                        </div>

                        <div className="rules-grid">
                            {rules.map(rule => (
                                <div key={rule.id} className="rule-card">
                                    <div className="rule-badge">{rule.targetType}</div>
                                    <div className="rule-header">
                                        <h3>{rule.targetName}</h3>
                                        <div className="rule-dates"><Calendar size={14} /> {rule.startDate || 'Uvek'} — {rule.endDate || 'Uvek'}</div>
                                    </div>
                                    <div className="rule-body">
                                        <div className="rule-meta">{rule.description}</div>
                                        <div className="rule-pricing-summary" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div className="summary-item">
                                                <span className="label">Provizija:</span>
                                                <strong className="value">{rule.incomingCommission}%</strong>
                                            </div>
                                            <div className="summary-item">
                                                <span className="label">Marža:</span>
                                                <strong className="value" style={{ color: '#10b981' }}>{rule.markupMargin}% {rule.markupExtra > 0 ? `+ ${rule.markupExtra}€` : ''}</strong>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rule-footer">
                                        <button className="action-btn edit"><Edit size={14} /></button>
                                        <button className="action-btn delete"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplierAdmin;
