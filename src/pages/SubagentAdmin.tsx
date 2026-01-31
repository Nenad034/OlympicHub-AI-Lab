import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Euro,
    TrendingUp,
    Download,
    Settings,
    Shield,
    Key,
    DollarSign,
    FileText,
    Calendar
} from 'lucide-react';
import './SubagentAdmin.css';

interface Subagent {
    id: string;
    name: string;
    companyName: string;
    email: string;
    phone: string;
    status: 'Active' | 'Suspended' | 'Pending';
    allowedAPIs: string[];
    allowedSuppliers: string[];
    commissionRates: {
        accommodation: number;
        flights: number;
        transfers: number;
        services: number;
        tours: number;
    };
    financials: {
        totalRevenue: number;
        totalCommission: number;
        balance: number;
        outstanding: number;
    };
    createdAt: string;
    lastActivity: string;
}

// Mock data
const MOCK_SUBAGENTS: Subagent[] = [
    {
        id: 'sub-001',
        name: 'Marko Petrović',
        companyName: 'Travel Pro DOO',
        email: 'marko@travelpro.rs',
        phone: '+381 11 123 4567',
        status: 'Active',
        allowedAPIs: ['tct', 'opengreece', 'kiwi'],
        allowedSuppliers: ['manual-hotels', 'manual-flights'],
        commissionRates: {
            accommodation: 10,
            flights: 5,
            transfers: 15,
            services: 20,
            tours: 12
        },
        financials: {
            totalRevenue: 125000,
            totalCommission: 12500,
            balance: 8500,
            outstanding: 4000
        },
        createdAt: '2025-01-15',
        lastActivity: '2026-01-09'
    },
    {
        id: 'sub-002',
        name: 'Ana Jovanović',
        companyName: 'Globe Trotters',
        email: 'ana@globetrotters.rs',
        phone: '+381 21 987 6543',
        status: 'Active',
        allowedAPIs: ['tct', 'amadeus'],
        allowedSuppliers: ['manual-hotels'],
        commissionRates: {
            accommodation: 8,
            flights: 4,
            transfers: 12,
            services: 18,
            tours: 10
        },
        financials: {
            totalRevenue: 89000,
            totalCommission: 7120,
            balance: 5200,
            outstanding: 1920
        },
        createdAt: '2025-03-22',
        lastActivity: '2026-01-10'
    },
    {
        id: 'sub-003',
        name: 'Nikola Đorđević',
        companyName: 'Adventure Tours',
        email: 'nikola@adventure.rs',
        phone: '+381 18 555 1234',
        status: 'Pending',
        allowedAPIs: [],
        allowedSuppliers: [],
        commissionRates: {
            accommodation: 0,
            flights: 0,
            transfers: 0,
            services: 0,
            tours: 0
        },
        financials: {
            totalRevenue: 0,
            totalCommission: 0,
            balance: 0,
            outstanding: 0
        },
        createdAt: '2026-01-08',
        lastActivity: '2026-01-08'
    }
];

const SubagentAdmin: React.FC = () => {
    const navigate = useNavigate();
    const [subagents, setSubagents] = useState<Subagent[]>(MOCK_SUBAGENTS);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Suspended' | 'Pending'>('all');
    const [selectedSubagent, setSelectedSubagent] = useState<Subagent | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Subagent | null>(null);
    const [showDateFilterModal, setShowDateFilterModal] = useState(false);
    const [dateFilters, setDateFilters] = useState({
        reservationFrom: '',
        reservationTo: '',
        stayFrom: '',
        stayTo: ''
    });

    const filteredSubagents = subagents.filter(sub => {
        const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return '#10b981';
            case 'Suspended': return '#ef4444';
            case 'Pending': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const getTotalStats = () => {
        return {
            total: subagents.length,
            active: subagents.filter(s => s.status === 'Active').length,
            pending: subagents.filter(s => s.status === 'Pending').length,
            suspended: subagents.filter(s => s.status === 'Suspended').length,
            totalRevenue: subagents.reduce((sum, s) => sum + s.financials.totalRevenue, 0),
            totalCommission: subagents.reduce((sum, s) => sum + s.financials.totalCommission, 0)
        };
    };

    const stats = getTotalStats();

    const handleViewDetails = (subagent: Subagent) => {
        setSelectedSubagent(subagent);
        setShowModal(true);
    };

    const handleEdit = (subagent: Subagent) => {
        setSelectedSubagent(subagent);
        setEditData({ ...subagent });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSave = () => {
        if (editData) {
            setSubagents(subagents.map(s => s.id === editData.id ? editData : s));
            setSelectedSubagent(editData);
            setIsEditing(false);
            alert('Promene uspešno sačuvane!');
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Da li ste sigurni da želite da obrišete ovog subagenta?')) {
            setSubagents(subagents.filter(s => s.id !== id));
        }
    };

    const handleStatusChange = (id: string, newStatus: 'Active' | 'Suspended' | 'Pending') => {
        setSubagents(subagents.map(s => s.id === id ? { ...s, status: newStatus } : s));
    };

    const handleViewReservations = (subagent: Subagent) => {
        setSelectedSubagent(subagent);
        setShowDateFilterModal(true);
    };

    const handleApplyDateFilter = () => {
        setShowDateFilterModal(false);
        // Navigate to reservations with filters
        const params = new URLSearchParams();
        params.set('subagent', selectedSubagent?.id || '');
        if (dateFilters.reservationFrom) params.set('resFrom', dateFilters.reservationFrom);
        if (dateFilters.reservationTo) params.set('resTo', dateFilters.reservationTo);
        if (dateFilters.stayFrom) params.set('stayFrom', dateFilters.stayFrom);
        if (dateFilters.stayTo) params.set('stayTo', dateFilters.stayTo);
        navigate(`/reservations?${params.toString()}`);
    };

    const handleSkipFilter = () => {
        setShowDateFilterModal(false);
        navigate(`/reservations?subagent=${selectedSubagent?.id}`);
    };

    return (
        <div className="subagent-admin-container fade-in">
            {/* Header */}
            <div className="admin-header">
                <div className="header-left">
                    <div className="admin-icon">
                        <Users size={28} />
                    </div>
                    <div>
                        <h1>Subagent Admin Panel</h1>
                        <p>Upravljanje subagentima, dozvolama i provizijama</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => alert('Kreiranje novog subagenta...')}>
                        <Plus size={18} />
                        Novi Subagent
                    </button>
                    <button className="btn-secondary" onClick={() => navigate('/')}>
                        Nazad
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Ukupno Subagenata</span>
                        <span className="stat-value">{stats.total}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Aktivni</span>
                        <span className="stat-value">{stats.active}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Na Čekanju</span>
                        <span className="stat-value">{stats.pending}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                        <Euro size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Ukupan Promet</span>
                        <span className="stat-value">{stats.totalRevenue.toLocaleString()} €</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Ukupna Provizija</span>
                        <span className="stat-value">{stats.totalCommission.toLocaleString()} €</span>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Pretraži subagente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('all')}
                    >
                        Svi
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'Active' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('Active')}
                    >
                        Aktivni
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'Pending' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('Pending')}
                    >
                        Na Čekanju
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'Suspended' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('Suspended')}
                    >
                        Suspendovani
                    </button>
                </div>

                <button className="btn-export">
                    <Download size={16} />
                    Export
                </button>
            </div>

            {/* Subagents Table */}
            <div className="table-container">
                <table className="subagents-table">
                    <thead>
                        <tr>
                            <th>Subagent</th>
                            <th>Kontakt</th>
                            <th>Status</th>
                            <th>API Pristup</th>
                            <th>Promet</th>
                            <th>Provizija</th>
                            <th>Stanje</th>
                            <th>Akcije</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSubagents.map(subagent => (
                            <tr key={subagent.id}>
                                <td>
                                    <div className="subagent-info">
                                        <div className="subagent-avatar">
                                            {subagent.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="subagent-name">{subagent.name}</div>
                                            <div className="subagent-company">{subagent.companyName}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="contact-info">
                                        <div>{subagent.email}</div>
                                        <div className="phone">{subagent.phone}</div>
                                    </div>
                                </td>
                                <td>
                                    <span
                                        className="status-badge"
                                        style={{ background: getStatusColor(subagent.status) }}
                                    >
                                        {subagent.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="api-count">
                                        <Key size={14} />
                                        {subagent.allowedAPIs.length} API{subagent.allowedAPIs.length !== 1 ? 's' : ''}
                                    </div>
                                </td>
                                <td className="amount">{subagent.financials.totalRevenue.toLocaleString()} €</td>
                                <td className="amount commission">{subagent.financials.totalCommission.toLocaleString()} €</td>
                                <td className="amount balance">{subagent.financials.balance.toLocaleString()} €</td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="action-btn reservations"
                                            onClick={() => handleViewReservations(subagent)}
                                            title="Rezervacije"
                                        >
                                            <FileText size={16} />
                                        </button>
                                        <button
                                            className="action-btn view"
                                            onClick={() => handleViewDetails(subagent)}
                                            title="Pregled"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            className="action-btn edit"
                                            onClick={() => handleEdit(subagent)}
                                            title="Izmeni"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="action-btn delete"
                                            onClick={() => handleDelete(subagent.id)}
                                            title="Obriši"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredSubagents.length === 0 && (
                    <div className="empty-state">
                        <Users size={64} />
                        <h3>Nema rezultata</h3>
                        <p>Pokušajte sa drugačijim filterima ili kreirajte novog subagenta</p>
                    </div>
                )}
            </div>

            {/* Date Filter Modal */}
            {showDateFilterModal && selectedSubagent && (
                <div className="modal-overlay" onClick={() => setShowDateFilterModal(false)}>
                    <div className="modal-content date-filter-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Filter Rezervacija - {selectedSubagent.name}</h2>
                            <button className="modal-close" onClick={() => setShowDateFilterModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            <p className="filter-description">
                                Opciono možete filtrirati rezervacije po datumima. Ako ne želite filtriranje, kliknite "Nastavi".
                            </p>

                            <div className="date-filter-section">
                                <h3><Calendar size={18} /> Datum Rezervacije</h3>
                                <div className="date-inputs">
                                    <div className="date-input-group">
                                        <label>Od:</label>
                                        <input
                                            type="date"
                                            value={dateFilters.reservationFrom}
                                            onChange={(e) => setDateFilters({ ...dateFilters, reservationFrom: e.target.value })}
                                        />
                                    </div>
                                    <div className="date-input-group">
                                        <label>Do:</label>
                                        <input
                                            type="date"
                                            value={dateFilters.reservationTo}
                                            onChange={(e) => setDateFilters({ ...dateFilters, reservationTo: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="date-filter-section">
                                <h3><Calendar size={18} /> Datum Boravka</h3>
                                <div className="date-inputs">
                                    <div className="date-input-group">
                                        <label>Od:</label>
                                        <input
                                            type="date"
                                            value={dateFilters.stayFrom}
                                            onChange={(e) => setDateFilters({ ...dateFilters, stayFrom: e.target.value })}
                                        />
                                    </div>
                                    <div className="date-input-group">
                                        <label>Do:</label>
                                        <input
                                            type="date"
                                            value={dateFilters.stayTo}
                                            onChange={(e) => setDateFilters({ ...dateFilters, stayTo: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={handleSkipFilter}>
                                Nastavi (Bez Filtera)
                            </button>
                            <button className="btn-primary" onClick={handleApplyDateFilter}>
                                <Filter size={16} />
                                Primeni Filter
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showModal && selectedSubagent && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedSubagent.name}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            {isEditing ? (
                                <div className="edit-form">
                                    <div className="detail-section">
                                        <h3>Osnovni Podaci</h3>
                                        <div className="input-grid">
                                            <div className="input-field">
                                                <label>Ime i Prezime</label>
                                                <input
                                                    type="text"
                                                    value={editData?.name}
                                                    onChange={(e) => setEditData(prev => prev ? { ...prev, name: e.target.value } : null)}
                                                />
                                            </div>
                                            <div className="input-field">
                                                <label>Kompanija</label>
                                                <input
                                                    type="text"
                                                    value={editData?.companyName}
                                                    onChange={(e) => setEditData(prev => prev ? { ...prev, companyName: e.target.value } : null)}
                                                />
                                            </div>
                                            <div className="input-field">
                                                <label>Email</label>
                                                <input
                                                    type="email"
                                                    value={editData?.email}
                                                    onChange={(e) => setEditData(prev => prev ? { ...prev, email: e.target.value } : null)}
                                                />
                                            </div>
                                            <div className="input-field">
                                                <label>Telefon</label>
                                                <input
                                                    type="text"
                                                    value={editData?.phone}
                                                    onChange={(e) => setEditData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h3>Dozvole i Marže (%)</h3>
                                        <div className="margin-settings-grid">
                                            <div className="margin-input">
                                                <label>Smeštaj</label>
                                                <input
                                                    type="number"
                                                    value={editData?.commissionRates.accommodation}
                                                    onChange={(e) => setEditData(prev => prev ? { ...prev, commissionRates: { ...prev.commissionRates, accommodation: Number(e.target.value) } } : null)}
                                                />
                                            </div>
                                            <div className="margin-input">
                                                <label>Letovi</label>
                                                <input
                                                    type="number"
                                                    value={editData?.commissionRates.flights}
                                                    onChange={(e) => setEditData(prev => prev ? { ...prev, commissionRates: { ...prev.commissionRates, flights: Number(e.target.value) } } : null)}
                                                />
                                            </div>
                                            <div className="margin-input">
                                                <label>Transferi</label>
                                                <input
                                                    type="number"
                                                    value={editData?.commissionRates.transfers}
                                                    onChange={(e) => setEditData(prev => prev ? { ...prev, commissionRates: { ...prev.commissionRates, transfers: Number(e.target.value) } } : null)}
                                                />
                                            </div>
                                            <div className="margin-input">
                                                <label>Usluge</label>
                                                <input
                                                    type="number"
                                                    value={editData?.commissionRates.services}
                                                    onChange={(e) => setEditData(prev => prev ? { ...prev, commissionRates: { ...prev.commissionRates, services: Number(e.target.value) } } : null)}
                                                />
                                            </div>
                                            <div className="margin-input">
                                                <label>Putovanja</label>
                                                <input
                                                    type="number"
                                                    value={editData?.commissionRates.tours}
                                                    onChange={(e) => setEditData(prev => prev ? { ...prev, commissionRates: { ...prev.commissionRates, tours: Number(e.target.value) } } : null)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h3>Pristup Dobavljačima</h3>
                                        <div className="supplier-toggles">
                                            {['Solvex', 'TCT', 'Open Greece', 'Amadeus', 'Kiwi'].map(sup => (
                                                <label key={sup} className="toggle-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={editData?.allowedSuppliers.includes(sup.toLowerCase())}
                                                        onChange={(e) => {
                                                            const val = sup.toLowerCase();
                                                            const current = editData?.allowedSuppliers || [];
                                                            const next = e.target.checked ? [...current, val] : current.filter(c => c !== val);
                                                            setEditData(prev => prev ? { ...prev, allowedSuppliers: next } : null);
                                                        }}
                                                    />
                                                    <span>{sup}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Existing Detail View Content */}
                                    <div className="detail-section">
                                        <h3>Osnovni Podaci</h3>
                                        {/* ... rest of existing code ... */}
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="detail-label">Kompanija:</span>
                                                <span className="detail-value">{selectedSubagent.companyName}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Email:</span>
                                                <span className="detail-value">{selectedSubagent.email}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Telefon:</span>
                                                <span className="detail-value">{selectedSubagent.phone}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Status:</span>
                                                <span
                                                    className="status-badge"
                                                    style={{ background: getStatusColor(selectedSubagent.status) }}
                                                >
                                                    {selectedSubagent.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* API Access */}
                                    <div className="detail-section">
                                        <h3><Shield size={18} /> API Pristup</h3>
                                        <div className="api-chips">
                                            {selectedSubagent.allowedAPIs.length > 0 ? (
                                                selectedSubagent.allowedAPIs.map(api => (
                                                    <span key={api} className="api-chip">{api}</span>
                                                ))
                                            ) : (
                                                <p className="no-data">Nema dodeljenih API-ja</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Commission Rates */}
                                    <div className="detail-section">
                                        <h3><DollarSign size={18} /> Provizije</h3>
                                        <div className="commission-grid">
                                            <div className="commission-item">
                                                <span>Smeštaj:</span>
                                                <strong>{selectedSubagent.commissionRates.accommodation}%</strong>
                                            </div>
                                            <div className="commission-item">
                                                <span>Letovi:</span>
                                                <strong>{selectedSubagent.commissionRates.flights}%</strong>
                                            </div>
                                            <div className="commission-item">
                                                <span>Transferi:</span>
                                                <strong>{selectedSubagent.commissionRates.transfers}%</strong>
                                            </div>
                                            <div className="commission-item">
                                                <span>Usluge:</span>
                                                <strong>{selectedSubagent.commissionRates.services}%</strong>
                                            </div>
                                            <div className="commission-item">
                                                <span>Putovanja:</span>
                                                <strong>{selectedSubagent.commissionRates.tours}%</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financials */}
                                    <div className="detail-section">
                                        <h3><Euro size={18} /> Finansije</h3>
                                        <div className="financial-grid">
                                            <div className="financial-item">
                                                <span>Ukupan Promet:</span>
                                                <strong className="revenue">{selectedSubagent.financials.totalRevenue.toLocaleString()} €</strong>
                                            </div>
                                            <div className="financial-item">
                                                <span>Ukupna Provizija:</span>
                                                <strong className="commission">{selectedSubagent.financials.totalCommission.toLocaleString()} €</strong>
                                            </div>
                                            <div className="financial-item">
                                                <span>Trenutno Stanje:</span>
                                                <strong className="balance">{selectedSubagent.financials.balance.toLocaleString()} €</strong>
                                            </div>
                                            <div className="financial-item">
                                                <span>Dugovanje:</span>
                                                <strong className="outstanding">{selectedSubagent.financials.outstanding.toLocaleString()} €</strong>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            {isEditing ? (
                                <>
                                    <button className="btn-secondary" onClick={() => setIsEditing(false)}>
                                        Odustani
                                    </button>
                                    <button className="btn-primary" onClick={handleSave}>
                                        <CheckCircle size={16} />
                                        Sačuvaj Promene
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className="btn-secondary" onClick={() => setShowModal(false)}>
                                        Zatvori
                                    </button>
                                    <button className="btn-primary" onClick={() => handleEdit(selectedSubagent)}>
                                        <Edit size={16} />
                                        Izmeni
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubagentAdmin;
