import React, { useState, useEffect } from 'react';
import { sentinelEvents } from '../utils/sentinelEvents';
import { getSolvexCities, getSolvexHotels } from '../services/solvex/solvexDataService';
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
    Calendar,
    BarChart3,
    Zap,
    ExternalLink,
    PieChart,
    MousePointer2,
    Activity,
    SearchX,
    Bell,
    AlertTriangle,
    Mail,
    ArrowUpRight,
    MessageCircle,
    Send,
    MessageSquare,
    Phone,
    Bot,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import './SubagentAdmin.css';

interface ContactPerson {
    id: string;
    name: string;
    email: string;
    phone: string;
}

interface B2BUser {
    id: string;
    name: string;
    username: string;
    password: string;
    role: 'Admin' | 'User';
    lastLogin?: string;
    isActive: boolean;
}

interface Subagent {
    id: string;
    companyName: string;
    licenseNumber: string;
    address: string;
    city: string;
    country: string;
    phoneFixed: string;
    phoneMobile: string;
    email: string;
    language: 'Srpski' | 'Engleski';
    contactPersons: ContactPerson[];
    status: 'Active' | 'Suspended' | 'Pending';
    allowedAPIs: string[];
    allowedSuppliers: string[];
    category: 'Premium' | 'Superior' | 'Classic';
    b2bUsers: B2BUser[];
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

interface PricingRule {
    id: string;
    product: string;
    target: string; // Hotel, City, or Global
    startDate?: string;
    endDate?: string;
    packageName?: string;
    categories: string[];
    settings: {
        mode: 'Margin' | 'Commission';
        valueType: 'Percent' | 'Amount';
        value: number;
        extraAmount?: number;
    };
}

// Mock data
const MOCK_SUBAGENTS: Subagent[] = [
    {
        id: 'sub-001',
        companyName: 'Travel Pro DOO',
        licenseNumber: 'OTP 123/2020',
        address: 'Bulevar Kralja Aleksandra 123',
        city: 'Beograd',
        country: 'Srbija',
        phoneFixed: '+381 11 123 456',
        phoneMobile: '+381 64 123 4567',
        email: 'office@travelpro.rs',
        language: 'Srpski',
        contactPersons: [
            { id: '1', name: 'Marko Petrović', email: 'marko@travelpro.rs', phone: '+381 11 123 4567' }
        ],
        status: 'Active',
        category: 'Premium',
        allowedAPIs: ['tct', 'opengreece', 'kiwi'],
        allowedSuppliers: ['manual-hotels', 'manual-flights'],
        b2bUsers: [
            { id: 'u1', name: 'Marko Petrović', username: 'marko@travelpro.rs', password: 'Password123!', role: 'Admin', isActive: true, lastLogin: '2026-02-01' },
            { id: 'u3', name: 'Jelena Simić', username: 'jelena@travelpro.rs', password: 'TPro2026!#', role: 'User', isActive: true, lastLogin: '2026-02-02' }
        ],
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
        companyName: 'Globe Trotters',
        licenseNumber: 'OTP 456/2021',
        address: 'Futoška 45',
        city: 'Novi Sad',
        country: 'Srbija',
        phoneFixed: '+381 21 456 789',
        phoneMobile: '+381 63 987 6543',
        email: 'info@globetrotters.rs',
        language: 'Engleski',
        contactPersons: [
            { id: '1', name: 'Ana Jovanović', email: 'ana@globetrotters.rs', phone: '+381 21 987 6543' }
        ],
        status: 'Active',
        category: 'Superior',
        allowedAPIs: ['tct', 'amadeus'],
        allowedSuppliers: ['manual-hotels'],
        b2bUsers: [
            { id: 'u2', name: 'Ana Jovanović', username: 'ana@globetrotters.rs', password: 'AnaPass2026', role: 'Admin', isActive: true },
            { id: 'u4', name: 'Nikola Kostić', username: 'nikola@globetrotters.rs', password: 'GlobPass99!', role: 'User', isActive: true }
        ],
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
    }
];

const COUNTRIES = ['Srbija', 'Crna Gora', 'Bosna i Hercegovina', 'Hrvatska', 'Severna Makedonija', 'Slovenija'];
const CATEGORIES_LIST = ['Premium', 'Superior', 'Classic'] as const;

const MOCK_RULES: PricingRule[] = [
    {
        id: 'rule-001',
        product: 'Smeštaj',
        target: 'Slovenska Plaza, Budva',
        startDate: '2026-07-01',
        endDate: '2026-09-01',
        packageName: 'Porodicni odmor',
        categories: ['Premium'],
        settings: {
            mode: 'Commission',
            valueType: 'Percent',
            value: 13,
            extraAmount: 5
        }
    }
];

const MOCK_MATRIX: { [key: string]: { [key: string]: PricingRule['settings'] } } = {
    'Smeštaj': {
        'Classic': { mode: 'Commission', valueType: 'Percent', value: 8, extraAmount: 0 },
        'Superior': { mode: 'Commission', valueType: 'Percent', value: 10, extraAmount: 0 },
        'Premium': { mode: 'Commission', valueType: 'Percent', value: 12, extraAmount: 0 },
    },
    'Dinamički Paketi': {
        'Classic': { mode: 'Commission', valueType: 'Percent', value: 5, extraAmount: 0 },
        'Superior': { mode: 'Commission', valueType: 'Percent', value: 7, extraAmount: 0 },
        'Premium': { mode: 'Commission', valueType: 'Percent', value: 10, extraAmount: 0 },
    },
    'Aranžmani': {
        'Classic': { mode: 'Commission', valueType: 'Percent', value: 10, extraAmount: 0 },
        'Superior': { mode: 'Commission', valueType: 'Percent', value: 12, extraAmount: 0 },
        'Premium': { mode: 'Commission', valueType: 'Percent', value: 15, extraAmount: 0 },
    },
    'Putovanja': {
        'Classic': { mode: 'Margin', valueType: 'Percent', value: 10, extraAmount: 5 },
        'Superior': { mode: 'Margin', valueType: 'Percent', value: 12, extraAmount: 5 },
        'Premium': { mode: 'Margin', valueType: 'Percent', value: 15, extraAmount: 5 },
    },
    'Ulaznice': {
        'Classic': { mode: 'Margin', valueType: 'Amount', value: 2, extraAmount: 0 },
        'Superior': { mode: 'Margin', valueType: 'Amount', value: 3, extraAmount: 0 },
        'Premium': { mode: 'Margin', valueType: 'Amount', value: 5, extraAmount: 0 },
    },
    'Grčka (Destinacija)': {
        'Classic': { mode: 'Margin', valueType: 'Percent', value: 5, extraAmount: 2 },
        'Superior': { mode: 'Margin', valueType: 'Percent', value: 7, extraAmount: 2 },
        'Premium': { mode: 'Margin', valueType: 'Percent', value: 10, extraAmount: 2 },
    },
    'Solvex': {
        'Classic': { mode: 'Margin', valueType: 'Percent', value: 5, extraAmount: 0 },
        'Superior': { mode: 'Margin', valueType: 'Percent', value: 7, extraAmount: 0 },
        'Premium': { mode: 'Margin', valueType: 'Percent', value: 10, extraAmount: 0 },
    },
    'Letovi': {
        'Classic': { mode: 'Margin', valueType: 'Amount', value: 10, extraAmount: 0 },
        'Superior': { mode: 'Margin', valueType: 'Amount', value: 8, extraAmount: 0 },
        'Premium': { mode: 'Margin', valueType: 'Amount', value: 5, extraAmount: 0 },
    }
};

const SubagentAdmin: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'subagents' | 'matrix' | 'rules' | 'analytics'>('subagents');
    const [subagents, setSubagents] = useState<Subagent[]>(MOCK_SUBAGENTS);
    const [rules, setRules] = useState<PricingRule[]>(MOCK_RULES);
    const [matrix, setMatrix] = useState(MOCK_MATRIX);
    const [searchQuery, setSearchQuery] = useState('');

    // Notification Settings State for Quick Connect
    const [notifSettings, setNotifSettings] = useState([
        { id: 1, type: 'Hotel Stop Sale', receiver: 'Marko (Prodaja)', channels: ['email', 'telegram'], active: true },
        { id: 2, type: 'Charter Raspoloživost', receiver: 'Ivan (Saobraćaj)', channels: ['telegram', 'viber'], active: true },
        { id: 3, type: 'Zero Results (B2B)', receiver: 'Ana (Menadžment)', channels: ['email', 'viber'], active: false },
    ]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Suspended' | 'Pending'>('all');
    const [selectedSubagent, setSelectedSubagent] = useState<Subagent | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Subagent | null>(null);
    const [showDateFilterModal, setShowDateFilterModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [dateFilters, setDateFilters] = useState({
        reservationFrom: '',
        reservationTo: '',
        stayFrom: '',
        stayTo: ''
    });

    // B2B Access Management State
    const [showB2BModal, setShowB2BModal] = useState(false);
    const [b2bEditAgent, setB2BEditAgent] = useState<Subagent | null>(null);

    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let retVal = "";
        for (let i = 0; i < 12; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return retVal;
    };

    const handleManageAccess = (subagent: Subagent) => {
        setB2BEditAgent({ ...subagent });
        setShowB2BModal(true);
    };

    const handleSaveAccess = () => {
        if (b2bEditAgent) {
            setSubagents(subagents.map(s => s.id === b2bEditAgent.id ? b2bEditAgent : s));
            setShowB2BModal(false);
            setB2BEditAgent(null);
            alert('Kredencijali su uspešno sačuvani i sinhronizovani.');
        }
    };

    const handleAddB2BUser = () => {
        if (b2bEditAgent && b2bEditAgent.b2bUsers.length < 5) {
            const newUser: B2BUser = {
                id: `u-${Date.now()}`,
                name: '',
                username: '',
                password: generatePassword(),
                role: 'User',
                isActive: true
            };
            setB2BEditAgent({
                ...b2bEditAgent,
                b2bUsers: [...b2bEditAgent.b2bUsers, newUser]
            });
        } else {
            alert('Maksimalan broj korisnika (5) je dostignut.');
        }
    };

    // Special Rules State
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [editRule, setEditRule] = useState<PricingRule | null>(null);
    const [rulesSearch, setRulesSearch] = useState('');

    // Matrix Helpers
    const [matrixSearch, setMatrixSearch] = useState('');
    const [showDestSearch, setShowDestSearch] = useState(false);
    const [destInput, setDestInput] = useState('');
    const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    // Initial logic for Solvex data fetching
    useEffect(() => {
        if (destInput.length > 2 || (editRule?.target && editRule.target.length > 2)) {
            const query = destInput || editRule?.target || '';
            const timer = setTimeout(async () => {
                setIsLoadingSuggestions(true);
                try {
                    const [cities, hotels] = await Promise.all([
                        getSolvexCities(),
                        getSolvexHotels()
                    ]);

                    const cityList = cities.map(c => `${c.name} (Solvex Region)`);
                    const hotelList = hotels.map(h => `${h.name}, ${h.cityName} (Solvex Hotel)`);

                    const combined = [...cityList, ...hotelList]
                        .filter(item => item.toLowerCase().includes(query.toLowerCase()))
                        .slice(0, 15); // Limit result size

                    setDynamicSuggestions(combined);
                } catch (err) {
                    console.error('Failed to fetch Solvex data:', err);
                } finally {
                    setIsLoadingSuggestions(false);
                }
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setDynamicSuggestions([]);
        }
    }, [destInput, editRule?.target]);

    const handleUpdateMatrix = (name: string, cat: string, field: string, value: any) => {
        setMatrix(prev => ({
            ...prev,
            [name]: {
                ...prev[name],
                [cat]: {
                    ...prev[name][cat],
                    [field]: value
                }
            }
        }));
    };

    const handleAddMatrixRow = (name: string) => {
        if (name) {
            setMatrix(prev => ({
                ...prev,
                [`${name} (Destinacija)`]: {
                    'Classic': { mode: 'Commission', valueType: 'Percent', value: 0, extraAmount: 0 },
                    'Superior': { mode: 'Commission', valueType: 'Percent', value: 0, extraAmount: 0 },
                    'Premium': { mode: 'Commission', valueType: 'Percent', value: 0, extraAmount: 0 },
                }
            }));
            setShowDestSearch(false);
            setDestInput('');
        }
    };

    const handleAddRule = () => {
        const newRule: PricingRule = {
            id: `rule-${Date.now()}`,
            product: 'Smeštaj',
            target: '',
            startDate: '',
            endDate: '',
            packageName: '',
            categories: ['Premium'],
            settings: {
                mode: 'Commission',
                valueType: 'Percent',
                value: 0,
                extraAmount: 0
            }
        };
        setEditRule(newRule);
        setShowRuleModal(true);
    };

    const handleEditRule = (rule: PricingRule) => {
        setEditRule({ ...rule });
        setShowRuleModal(true);
    };

    const handleSaveRule = () => {
        if (editRule) {
            const exists = rules.find(r => r.id === editRule.id);
            if (exists) {
                setRules(rules.map(r => r.id === editRule.id ? editRule : r));
            } else {
                setRules([...rules, editRule]);
            }
            setShowRuleModal(false);
            setEditRule(null);
        }
    };

    const filteredSubagents = subagents.filter(sub => {
        const matchesSearch = sub.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.contactPersons.some(cp => cp.name.toLowerCase().includes(searchQuery.toLowerCase()) || cp.email.toLowerCase().includes(searchQuery.toLowerCase()));
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

    const handleAddNew = () => {
        const newSubagent: Subagent = {
            id: `sub-${Date.now()}`,
            companyName: '',
            licenseNumber: '',
            address: '',
            city: '',
            country: 'Srbija',
            phoneFixed: '',
            phoneMobile: '',
            email: '',
            language: 'Srpski',
            contactPersons: [{ id: '1', name: '', email: '', phone: '' }],
            status: 'Pending',
            category: 'Classic',
            b2bUsers: [],
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
            createdAt: new Date().toISOString().split('T')[0],
            lastActivity: new Date().toISOString().split('T')[0]
        };
        setEditData(newSubagent);
        setSelectedSubagent(newSubagent);
        setIsEditing(true);
        setIsCreating(true);
        setShowModal(true);
    };

    const handleSave = () => {
        if (editData) {
            if (isCreating) {
                setSubagents([...subagents, editData]);
                alert('Novi subagent uspešno kreiran!');
            } else {
                setSubagents(subagents.map(s => s.id === editData.id ? editData : s));
                alert('Promene uspešno sačuvane!');
            }
            setSelectedSubagent(editData);
            setIsEditing(false);
            setIsCreating(false);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Da li ste sigurni da želite da obrišete ovog subagenta?')) {
            setSubagents(subagents.filter(s => s.id !== id));
        }
    };

    const handleViewReservations = (subagent: Subagent) => {
        setSelectedSubagent(subagent);
        setShowDateFilterModal(true);
    };

    const handleApplyDateFilter = () => {
        setShowDateFilterModal(false);
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
                    {activeTab === 'subagents' && (
                        <button className="btn-primary" onClick={handleAddNew}>
                            <Plus size={18} />
                            Novi Subagent
                        </button>
                    )}
                    {activeTab === 'rules' && (
                        <button className="btn-primary" onClick={handleAddRule}>
                            <Plus size={18} />
                            Novo Pravilo
                        </button>
                    )}
                    <button className="btn-secondary" onClick={() => navigate('/')}>
                        Nazad
                    </button>
                </div>
            </div>

            {/* Admin Tabs */}
            <div className="admin-tabs-bar">
                <button
                    className={`tab-item ${activeTab === 'subagents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('subagents')}
                >
                    <Users size={18} />
                    Lista Subagenata
                </button>
                <button
                    className={`tab-item ${activeTab === 'matrix' ? 'active' : ''}`}
                    onClick={() => setActiveTab('matrix')}
                >
                    <Settings size={18} />
                    Cenovna Matrica Kategorija
                </button>
                <button
                    className={`tab-item ${activeTab === 'rules' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rules')}
                >
                    <Shield size={18} />
                    Specijalni Izuzeci
                </button>
                <button
                    className={`tab-item ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    <BarChart3 size={18} />
                    Olympic Analytics <span className="beta-badge">BETA</span>
                </button>
            </div>

            <div className="admin-tab-content">
                {activeTab === 'subagents' && (
                    <>
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
                                {(['all', 'Active', 'Pending', 'Suspended'] as const).map(f => (
                                    <button
                                        key={f}
                                        className={`filter-btn ${statusFilter === f ? 'active' : ''}`}
                                        onClick={() => setStatusFilter(f)}
                                    >
                                        {f === 'all' ? 'Svi' : f === 'Active' ? 'Aktivni' : f === 'Pending' ? 'Na Čekanju' : 'Suspendovani'}
                                    </button>
                                ))}
                            </div>
                            <button className="btn-export">
                                <Download size={16} /> Export
                            </button>
                        </div>

                        {/* Subagents Table */}
                        <div className="table-container">
                            <table className="subagents-table">
                                <thead>
                                    <tr>
                                        <th>Subagent</th>
                                        <th>Kontakt (Glavni)</th>
                                        <th>Status</th>
                                        <th>API Pristup</th>
                                        <th>Promet</th>
                                        <th>Provizija</th>
                                        <th>Akcije</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubagents.map(subagent => (
                                        <tr key={subagent.id}>
                                            <td>
                                                <div className="subagent-info">
                                                    <div className="subagent-avatar">{subagent.companyName.charAt(0)}</div>
                                                    <div>
                                                        <div className="subagent-name">{subagent.companyName}</div>
                                                        <div className="subagent-company">{subagent.licenseNumber}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="contact-info">
                                                    <div>{subagent.contactPersons[0]?.name}</div>
                                                    <div className="phone">{subagent.contactPersons[0]?.email}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="status-badge" style={{ background: getStatusColor(subagent.status) }}>
                                                    {subagent.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="api-count">
                                                    <Key size={14} /> {subagent.allowedAPIs.length} APIs
                                                </div>
                                            </td>
                                            <td className="amount">{subagent.financials.totalRevenue.toLocaleString()} €</td>
                                            <td className="amount commission">{subagent.financials.totalCommission.toLocaleString()} €</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="action-btn external" onClick={() => window.open(`/b2b-dashboard?subagentId=${subagent.id}`, '_blank')} title="Pristupi B2B strani (Impersonate)"><ExternalLink size={16} /></button>
                                                    <button className="action-btn reservations" onClick={() => handleViewReservations(subagent)} title="Rezervacije"><FileText size={16} /></button>
                                                    <button className="action-btn b2b" onClick={() => handleManageAccess(subagent)} title="B2B Pristup"><Shield size={16} /></button>
                                                    <button className="action-btn view" onClick={() => handleViewDetails(subagent)} title="Pregled"><Eye size={16} /></button>
                                                    <button className="action-btn edit" onClick={() => handleEdit(subagent)} title="Izmeni"><Edit size={16} /></button>
                                                    <button className="action-btn delete" onClick={() => handleDelete(subagent.id)} title="Obriši"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'matrix' && (
                    <div className="matrix-container fade-in">
                        <div className="matrix-header">
                            <div className="header-flex">
                                <div>
                                    <h2>Globalna Matrica Cenovne Politike</h2>
                                    <p>Definišite podrazumevane marže i provizije po kategorijama, API-jima i destinacijama.</p>
                                </div>
                                <div className="matrix-search-and-add">
                                    <div className="dest-add-container">
                                        <div className="smart-add-box">
                                            <Plus size={16} className="add-icon" />
                                            <input
                                                type="text"
                                                placeholder="Dodaj destinaciju ili hotel..."
                                                value={destInput}
                                                onChange={(e) => {
                                                    setDestInput(e.target.value);
                                                    setShowDestSearch(true);
                                                }}
                                                onFocus={() => setShowDestSearch(true)}
                                            />
                                            {showDestSearch && destInput.length > 0 && (
                                                <div className="dest-autocomplete wide">
                                                    <div className="dest-suggestions">
                                                        {isLoadingSuggestions && <div className="suggestion-item loading">Pretražujem Solvex bazu...</div>}
                                                        {dynamicSuggestions.map(d => (
                                                            <div key={d} className="suggestion-item" onClick={() => {
                                                                handleAddMatrixRow(d);
                                                                setDestInput('');
                                                                setShowDestSearch(false);
                                                            }}>
                                                                {d}
                                                            </div>
                                                        ))}
                                                        {destInput && !isLoadingSuggestions && dynamicSuggestions.length === 0 && (
                                                            <div className="suggestion-item add-new" onClick={() => {
                                                                handleAddMatrixRow(destInput);
                                                                setDestInput('');
                                                                setShowDestSearch(false);
                                                            }}>
                                                                <Plus size={14} /> Dodaj "{destInput}" kao novo pravilo
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="search-box small">
                                        <Search size={14} />
                                        <input
                                            type="text"
                                            placeholder="Traži u matrici..."
                                            value={matrixSearch}
                                            onChange={(e) => setMatrixSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="table-container">
                            <table className="subagents-table matrix-table">
                                <thead>
                                    <tr>
                                        <th>Proizvod / API / Destinacija</th>
                                        <th>Classic</th>
                                        <th>Superior</th>
                                        <th>Premium</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Section Rendering Logic */}
                                    {[
                                        { id: 'general', title: 'Generalna Politika (Tipovi Proizvoda)', filter: (n: string) => ['Smeštaj', 'Dinamički Paketi', 'Aranžmani', 'Putovanja', 'Ulaznice', 'Letovi', 'Transferi', 'Izleti'].includes(n) },
                                        { id: 'api', title: 'API Konekcije (Provajderi)', filter: (n: string) => ['Solvex', 'Amadeus', 'TCT', 'Sirenna', 'Sabre'].includes(n) || n.includes('API') },
                                        { id: 'destinations', title: 'Destinacije i Regije', filter: (n: string) => n.includes('(Destinacija)') || n.includes('(Region)') },
                                        { id: 'hotels', title: 'Specifični Hoteli i Objekti', filter: (n: string) => n.includes('(Hotel)') }
                                    ].map(section => {
                                        const sectionItems = Object.entries(matrix).filter(([name]) =>
                                            section.filter(name) && name.toLowerCase().includes(matrixSearch.toLowerCase())
                                        );

                                        if (sectionItems.length === 0) return null;

                                        return (
                                            <React.Fragment key={section.id}>
                                                <tr className="matrix-section-row">
                                                    <td colSpan={4}>{section.title}</td>
                                                </tr>
                                                {sectionItems.map(([name, settings]) => (
                                                    <tr key={name}>
                                                        <td className="product-cell">
                                                            <div className="product-name">{name}</div>
                                                            <div className="product-type">
                                                                {name.includes('API') || ['Solvex', 'Amadeus', 'TCT'].includes(name) ? 'API Konekcija' :
                                                                    name.includes('Destinacija') ? 'Region / Država' :
                                                                        name.includes('Hotel') ? 'Objekat' : 'Globalni Tip'}
                                                            </div>
                                                        </td>
                                                        {(['Classic', 'Superior', 'Premium'] as const).map(cat => {
                                                            const s = settings[cat];
                                                            return (
                                                                <td key={cat}>
                                                                    <div className="pricing-cell-matrix">
                                                                        <div className="pricing-toggles">
                                                                            <button
                                                                                className={`toggle-small ${s.mode === 'Margin' ? 'active' : ''}`}
                                                                                onClick={() => handleUpdateMatrix(name, cat, 'mode', 'Margin')}
                                                                                title="Marža (Neto +)"
                                                                            >
                                                                                Marža
                                                                            </button>
                                                                            <button
                                                                                className={`toggle-small ${s.mode === 'Commission' ? 'active' : ''}`}
                                                                                onClick={() => handleUpdateMatrix(name, cat, 'mode', 'Commission')}
                                                                                title="Provizija (Bruto -)"
                                                                            >
                                                                                Provizija
                                                                            </button>
                                                                        </div>
                                                                        <div className="pricing-composite-row">
                                                                            <div className="comp-input">
                                                                                <input
                                                                                    type="number"
                                                                                    value={s.value}
                                                                                    onChange={(e) => handleUpdateMatrix(name, cat, 'value', Number(e.target.value))}
                                                                                />
                                                                                <span className="unit-label">%</span>
                                                                            </div>
                                                                            <div className="comp-plus">+</div>
                                                                            <div className="comp-input">
                                                                                <input
                                                                                    type="number"
                                                                                    value={s.extraAmount || 0}
                                                                                    onChange={(e) => handleUpdateMatrix(name, cat, 'extraAmount', Number(e.target.value))}
                                                                                />
                                                                                <span className="unit-label">€</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'rules' && (
                    <div className="rules-container fade-in">
                        <div className="matrix-header">
                            <div className="header-flex">
                                <div>
                                    <h2>Specijalni Izuzeci i Akcije</h2>
                                    <p>Fino podešavanje zarade za konkretne objekte, termine ili pakete.</p>
                                </div>
                                <div className="search-box small">
                                    <Search size={14} />
                                    <input
                                        type="text"
                                        placeholder="Traži izuzetak..."
                                        value={rulesSearch}
                                        onChange={(e) => setRulesSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="rules-grid">
                            {rules
                                .filter(r => r.target.toLowerCase().includes(rulesSearch.toLowerCase()))
                                .map(rule => (
                                    <div key={rule.id} className="rule-card">
                                        <div className="rule-badge">{rule.product}</div>
                                        <div className="rule-header">
                                            <h3>{rule.target}</h3>
                                            <div className="rule-dates"><Calendar size={14} /> {rule.startDate} — {rule.endDate}</div>
                                        </div>
                                        <div className="rule-body">
                                            {rule.packageName && <div className="rule-meta"><strong>Paket:</strong> {rule.packageName}</div>}
                                            <div className="rule-meta">
                                                <strong>Kategorije:</strong> {rule.categories.map(c => <span key={c} className="cat-tag">{c}</span>)}
                                            </div>
                                            <div className="rule-pricing-summary">
                                                <div className="summary-item">
                                                    <span className="label">{rule.settings.mode === 'Margin' ? 'Marža' : 'Provizija'}:</span>
                                                    <strong className="value">
                                                        {rule.settings.value}{rule.settings.valueType === 'Percent' ? '%' : '€'}
                                                        {rule.settings.extraAmount && ` + ${rule.settings.extraAmount}€`}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rule-footer">
                                            <button
                                                className="action-btn edit"
                                                onClick={() => handleEditRule(rule)}
                                                title="Uredi pravilo"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => setRules(rules.filter(r => r.id !== rule.id))}
                                                title="Obriši pravilo"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="analytics-container fade-in">
                        <div className="analytics-grid-header">
                            <div className="analytics-card main">
                                <div className="card-header">
                                    <h3><Activity size={20} /> Real-time Aktivnost Pretrage</h3>
                                    <div className="live-indicator"><div className="dot"></div> LIVE</div>
                                </div>
                                <div className="search-logs-list">
                                    {[
                                        { id: 'log-1', entity: 'Travel Pro DOO', type: 'Subagent', target: 'Antalya, Turkey', query: 'Hotel 5*, All Inclusive', results: 142, timestamp: 'Pre 2 min', status: 'Success' },
                                        { id: 'log-2', entity: 'Marko Marković', type: 'Zaposleni', target: 'Hurgada, Egypt', query: 'Dana Beach Resort', results: 1, timestamp: 'Pre 14 min', status: 'Success' },
                                        { id: 'log-3', entity: 'SuperTravel', type: 'Subagent', target: 'Zlatibor, Srbija', query: 'Apartmani sa bazenom', results: 0, timestamp: 'Pre 45 min', status: 'No Results' },
                                        { id: 'log-4', entity: 'Travel Pro DOO', type: 'Subagent', target: 'Dubai, UAE', query: 'Burj Al Arab', results: 1, timestamp: 'Pre 1h', status: 'Success' },
                                        { id: 'log-5', entity: 'Ivan Jović', type: 'Zaposleni', target: 'Kopaonik', query: 'Gorski Hotel', results: 4, timestamp: 'Pre 2h', status: 'Success' }
                                    ].map(log => (
                                        <div key={log.id} className={`log-row ${log.status === 'No Results' ? 'warning' : ''}`}>
                                            <div className="log-time">{log.timestamp}</div>
                                            <div className="log-entity">
                                                <span className={`entity-type ${log.type === 'Subagent' ? 'blue' : 'purple'}`}>{log.type}</span>
                                                <strong>{log.entity}</strong>
                                            </div>
                                            <div className="log-search-details">
                                                <div className="log-target"><Search size={12} /> {log.target}</div>
                                                <div className="log-query">"{log.query}"</div>
                                            </div>
                                            <div className={`log-results ${log.results === 0 ? 'zero' : ''}`}>
                                                {log.results === 0 ? <SearchX size={14} /> : <span>{log.results} rez.</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="analytics-side-panels">
                                <div className="analytics-card mini">
                                    <div className="card-header">
                                        <h4><Zap size={16} /> Top Destinacije (7 dana)</h4>
                                    </div>
                                    <div className="top-list">
                                        <div className="list-item"><span>1. Antalya, Turkey</span> <span className="val">42%</span></div>
                                        <div className="list-item"><span>2. Hurghada, Egypt</span> <span className="val">28%</span></div>
                                        <div className="list-item"><span>3. Dubai, UAE</span> <span className="val">15%</span></div>
                                        <div className="list-item"><span>4. Kopaonik, Srbija</span> <span className="val">10%</span></div>
                                    </div>
                                </div>

                                <div className="analytics-card mini">
                                    <div className="card-header">
                                        <h4><PieChart size={16} /> Search-to-Booking</h4>
                                    </div>
                                    <div className="conversion-stat">
                                        <div className="conversion-value">8.4%</div>
                                        <div className="conversion-label">Prosečna konverzija</div>
                                    </div>
                                </div>

                                <div className="analytics-card mini quick-connect">
                                    <div className="card-header">
                                        <h4><Settings size={14} /> Quick Connect</h4>
                                    </div>
                                    <div className="notif-manager">
                                        {notifSettings.map(setting => (
                                            <div key={setting.id} className={`notif-entry ${setting.active ? 'active' : 'inactive'}`}>
                                                <div className="notif-type-info">
                                                    <strong>{setting.type}</strong>
                                                    <span>{setting.receiver}</span>
                                                </div>
                                                <div className="notif-channels-icons">
                                                    {setting.channels.includes('email') && <Mail size={10} className="active" />}
                                                    {setting.channels.includes('telegram') && <Send size={10} className="active color-tg" />}
                                                    {setting.channels.includes('viber') && <MessageCircle size={10} className="active color-vb" />}
                                                </div>
                                                <div className="notif-toggle">
                                                    <button
                                                        className={`toggle-btn ${setting.active ? 'on' : 'off'}`}
                                                        onClick={() => setNotifSettings(prev => prev.map(s => s.id === setting.id ? { ...s, active: !s.active } : s))}
                                                    >
                                                        {setting.active ? 'ON' : 'OFF'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="analytics-bottom-row">
                            <div className="analytics-card">
                                <h4>Trendovi po Danima</h4>
                                <div className="mock-chart-placeholder">
                                    <div className="chart-bar-container">
                                        {[65, 45, 80, 95, 110, 70, 50].map((h, i) => (
                                            <div key={i} className="chart-bar" style={{ height: `${h}px` }}>
                                                <span className="bar-label">{['P', 'U', 'S', 'Č', 'P', 'S', 'N'][i]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="analytics-card">
                                <h4><AlertTriangle size={18} color="#f59e0b" /> Demand Alerts (Stop Sale Monitoring)</h4>
                                <div className="alerts-list">
                                    {[
                                        { id: 'a1', target: 'Hotel Royal Seginus, Antalya', count: 24, reason: 'Stop Sale (No room types)', severity: 'high', notified: 'Menadžment, Prodaja' },
                                        { id: 'a2', target: 'Let Beograd - Hurghada (15. Jul)', count: 18, reason: 'Niska raspoloživost (<3)', severity: 'medium', notified: 'Sektor saobraćaja' },
                                        { id: 'a3', target: 'Pet Friendly Grčka (Opšti upit)', count: 12, reason: 'Nedostatak adekvatnog filtera', severity: 'low', notified: 'Razvojni tim' }
                                    ].map(alert => (
                                        <div key={alert.id} className={`demand-alert-card ${alert.severity}`}>
                                            <div className="alert-main">
                                                <div className="alert-count">
                                                    <span>{alert.count}</span>
                                                    <p>upita danas</p>
                                                </div>
                                                <div className="alert-info">
                                                    <strong>{alert.target}</strong>
                                                    <span className="alert-reason">{alert.reason}</span>
                                                </div>
                                            </div>
                                            <div className="alert-status">
                                                <div className="notified-badge">
                                                    <span title="Email"><Mail size={12} className="active" /></span>
                                                    <span title="Telegram"><Send size={12} className="v-tg active" /></span>
                                                    <span title="Viber"><MessageCircle size={12} className="v-vb active" /></span>
                                                    <span title="SMS"><Phone size={12} className="v-sms" /></span>
                                                    <span style={{ marginLeft: '6px' }}>Poslato: {alert.notified}</span>
                                                </div>
                                                {alert.id === 'a1' && (
                                                    <div className="auto-reply-badge">
                                                        <Bot size={12} /> Auto-Reply: 3 Alternative Poslate (Viber & Email)
                                                    </div>
                                                )}
                                                <div className="alert-actions-group">
                                                    <button className="btn-resolve mini">Chat <MessageSquare size={12} /></button>
                                                    <button className="btn-resolve">Reši <ArrowUpRight size={14} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="analytics-card">
                                <h4><Bot size={18} color="#a855f7" /> Smart Auto-Response (AI Engine)</h4>
                                <div className="auto-reply-rules">
                                    <div className="reply-rule-item active">
                                        <div className="rule-info">
                                            <div className="rule-icon"><Sparkles size={16} /></div>
                                            <div className="rule-text">
                                                <strong>Stop Sale Alternative</strong>
                                                <p>Kada nema mesta &rarr; Pošalji 3 hotela u istom rangu</p>
                                            </div>
                                        </div>
                                        <div className="rule-channels">
                                            <span className="ch-tag"><MessageCircle size={10} /> Viber</span>
                                            <span className="ch-tag"><Mail size={10} /> Email</span>
                                        </div>
                                        <div className="rule-stats">92 poruke isporučene danas</div>
                                    </div>
                                    <button className="btn-secondary outline full-width"><Plus size={14} /> Nova AI Pravila</button>
                                </div>
                            </div>

                            <div className="analytics-card">
                                <h4>Najčešći "Zero Results" (Propuštene prilike)</h4>
                                <div className="zero-list">
                                    <div className="zero-item"><span>"Pet Friendly Hotel Grčka"</span> <span className="count">12 pts</span></div>
                                    <div className="zero-item"><span>"Hotel sa 6 zvezdica Kopaonik"</span> <span className="count">8 pts</span></div>
                                    <div className="zero-item"><span>"Direktan let za Bali"</span> <span className="count">5 pts</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals and other UI elements (same as before) */}
            {showDateFilterModal && selectedSubagent && (
                <div className="modal-overlay" onClick={() => setShowDateFilterModal(false)}>
                    {/* ... Date filter content ... */}
                    <div className="modal-content date-filter-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Filter Rezervacija - {selectedSubagent.companyName}</h2>
                            <button className="modal-close" onClick={() => setShowDateFilterModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* Simplified date fields just to fix compilation, you can expand later */}
                            <div className="date-input-group">
                                <label>Od datuma:</label>
                                <input type="date" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowDateFilterModal(false)}>Zatvori</button>
                            <button className="btn-primary" onClick={handleApplyDateFilter}>Primeni</button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && selectedSubagent && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{isCreating ? 'Novi Subagent' : selectedSubagent.companyName}</h2>
                            <button className="modal-close" onClick={() => { setShowModal(false); setIsCreating(false); setIsEditing(false); }}>×</button>
                        </div>
                        <div className="modal-body">
                            {isEditing ? (
                                <div className="edit-form">
                                    <div className="detail-section">
                                        <h3>Osnovni Podaci Kompanije</h3>
                                        <div className="input-grid">
                                            <div className="input-field">
                                                <label>Naziv Kompanije</label>
                                                <input type="text" value={editData?.companyName} onChange={e => setEditData(prev => prev ? { ...prev, companyName: e.target.value } : null)} />
                                            </div>
                                            <div className="input-field">
                                                <label>Broj Licence</label>
                                                <input type="text" value={editData?.licenseNumber} onChange={e => setEditData(prev => prev ? { ...prev, licenseNumber: e.target.value } : null)} />
                                            </div>
                                            <div className="input-field">
                                                <label>Adresa</label>
                                                <input type="text" value={editData?.address} onChange={e => setEditData(prev => prev ? { ...prev, address: e.target.value } : null)} />
                                            </div>
                                            <div className="input-field">
                                                <label>Mesto</label>
                                                <input type="text" value={editData?.city} onChange={e => setEditData(prev => prev ? { ...prev, city: e.target.value } : null)} />
                                            </div>
                                            <div className="input-field">
                                                <label>Država</label>
                                                <select value={editData?.country} onChange={e => setEditData(prev => prev ? { ...prev, country: e.target.value } : null)} className="admin-select">
                                                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="input-field">
                                                <label>Kategorija</label>
                                                <select value={editData?.category} onChange={e => setEditData(prev => prev ? { ...prev, category: e.target.value as any } : null)} className="admin-select">
                                                    {CATEGORIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="input-field">
                                                <label>Status</label>
                                                <select value={editData?.status} onChange={e => setEditData(prev => prev ? { ...prev, status: e.target.value as any } : null)} className="admin-select">
                                                    <option value="Active">Active</option>
                                                    <option value="Pending">Pending</option>
                                                    <option value="Suspended">Suspended</option>
                                                </select>
                                            </div>
                                            <div className="input-field">
                                                <label>Fiksni Telefon</label>
                                                <input type="text" value={editData?.phoneFixed} onChange={e => setEditData(prev => prev ? { ...prev, phoneFixed: e.target.value } : null)} />
                                            </div>
                                            <div className="input-field">
                                                <label>Mobilni Telefon</label>
                                                <input type="text" value={editData?.phoneMobile} onChange={e => setEditData(prev => prev ? { ...prev, phoneMobile: e.target.value } : null)} />
                                            </div>
                                            <div className="input-field">
                                                <label>Email Adresa</label>
                                                <input type="email" value={editData?.email} onChange={e => setEditData(prev => prev ? { ...prev, email: e.target.value } : null)} />
                                            </div>
                                            <div className="input-field">
                                                <label>Jezik Komunikacije</label>
                                                <select value={editData?.language} onChange={e => setEditData(prev => prev ? { ...prev, language: e.target.value as any } : null)} className="admin-select">
                                                    <option value="Srpski">Srpski</option>
                                                    <option value="Engleski">Engleski</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Multiple contacts */}
                                    <div className="detail-section">
                                        <div className="section-header-add">
                                            <h3>Kontakt Osobe</h3>
                                            <button className="btn-add-contact" onClick={() => setEditData(p => p ? { ...p, contactPersons: [...p.contactPersons, { id: Date.now().toString(), name: '', email: '', phone: '' }] } : null)}>
                                                <Plus size={14} /> Dodaj
                                            </button>
                                        </div>
                                        <div className="contacts-edit-list">
                                            {editData?.contactPersons.map((cp, idx) => (
                                                <div key={cp.id} className="contact-person-card">
                                                    <div className="input-grid">
                                                        <div className="input-field">
                                                            <label>Ime</label>
                                                            <input type="text" value={cp.name} onChange={e => { const n = [...editData!.contactPersons]; n[idx].name = e.target.value; setEditData({ ...editData!, contactPersons: n }); }} />
                                                        </div>
                                                        <div className="input-field">
                                                            <label>Email</label>
                                                            <input type="email" value={cp.email} onChange={e => { const n = [...editData!.contactPersons]; n[idx].email = e.target.value; setEditData({ ...editData!, contactPersons: n }); }} />
                                                        </div>
                                                        <div className="input-field">
                                                            <label>Telefon</label>
                                                            <input type="text" value={cp.phone} onChange={e => { const n = [...editData!.contactPersons]; n[idx].phone = e.target.value; setEditData({ ...editData!, contactPersons: n }); }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="detail-view">
                                    <p>Pregled podataka subagenta...</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Odustani</button>
                            {isEditing && <button className="btn-primary" onClick={handleSave}>Sačuvaj</button>}
                        </div>
                    </div>
                </div>
            )}

            {/* Special Pricing Rule Modal */}
            {showRuleModal && editRule && (
                <div className="modal-overlay" onClick={() => setShowRuleModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editRule.target ? 'Izmena Pravila' : 'Novo Specijalno Pravilo'}</h2>
                            <button className="modal-close" onClick={() => setShowRuleModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="edit-form">
                                <div className="detail-section">
                                    <h3>Targetiranje (Gde se primenjuje?)</h3>
                                    <div className="input-grid">
                                        <div className="input-field">
                                            <label>Tip Proizvoda</label>
                                            <select
                                                className="admin-select"
                                                value={editRule.product}
                                                onChange={e => setEditRule({ ...editRule, product: e.target.value })}
                                            >
                                                <option value="Smeštaj">Smeštaj</option>
                                                <option value="Dinamički Paketi">Dinamički Paketi</option>
                                                <option value="Aranžmani">Aranžmani</option>
                                                <option value="Putovanja">Putovanja</option>
                                                <option value="Ulaznice">Ulaznice</option>
                                                <option value="Letovi">Letovi</option>
                                                <option value="Transferi">Transferi</option>
                                                <option value="Izleti">Izleti</option>
                                            </select>
                                        </div>
                                        <div className="input-field" style={{ position: 'relative' }}>
                                            <label>Objekat / Destinacija / API</label>
                                            <input
                                                type="text"
                                                placeholder="npr. Slovenska Plaza, Budva"
                                                value={editRule.target}
                                                onChange={e => setEditRule({ ...editRule, target: e.target.value })}
                                            />
                                            {editRule.target && editRule.target.length > 2 && (
                                                <div className="dest-autocomplete modal-inline">
                                                    <div className="dest-suggestions">
                                                        {isLoadingSuggestions && <div className="suggestion-item loading">Učitavam iz Solvex-a...</div>}
                                                        {dynamicSuggestions.map(d => (
                                                            <div key={d} className="suggestion-item" onClick={() => setEditRule({ ...editRule, target: d })}>
                                                                {d}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="input-field">
                                            <label>Datum Od (Period važenja)</label>
                                            <input
                                                type="date"
                                                value={editRule.startDate}
                                                onChange={e => setEditRule({ ...editRule, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="input-field">
                                            <label>Datum Do</label>
                                            <input
                                                type="date"
                                                value={editRule.endDate}
                                                onChange={e => setEditRule({ ...editRule, endDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="input-field">
                                            <label>Paket Filter (Opciono)</label>
                                            <input
                                                type="text"
                                                placeholder="npr. Porodicni odmor"
                                                value={editRule.packageName || ''}
                                                onChange={e => setEditRule({ ...editRule, packageName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h3>Kategorije Subagenata</h3>
                                    <div className="supplier-toggles">
                                        {CATEGORIES_LIST.map(cat => (
                                            <label key={cat} className="toggle-label">
                                                <input
                                                    type="checkbox"
                                                    checked={editRule.categories.includes(cat)}
                                                    onChange={() => {
                                                        const next = editRule.categories.includes(cat)
                                                            ? editRule.categories.filter(c => c !== cat)
                                                            : [...editRule.categories, cat];
                                                        setEditRule({ ...editRule, categories: next });
                                                    }}
                                                />
                                                {cat}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h3>Definicija Zarade</h3>
                                    <div className="pricing-setup-card">
                                        <div className="mode-selector">
                                            <button
                                                className={`mode-btn ${editRule.settings.mode === 'Margin' ? 'active' : ''}`}
                                                onClick={() => setEditRule({ ...editRule, settings: { ...editRule.settings, mode: 'Margin' } })}
                                            >
                                                Marža (Neto +)
                                            </button>
                                            <button
                                                className={`mode-btn ${editRule.settings.mode === 'Commission' ? 'active' : ''}`}
                                                onClick={() => setEditRule({ ...editRule, settings: { ...editRule.settings, mode: 'Commission' } })}
                                            >
                                                Provizija (Bruto -)
                                            </button>
                                        </div>

                                        <div className="pricing-grid-composite">
                                            <div className="input-field">
                                                <label>Procenat (%)</label>
                                                <div className="composite-input">
                                                    <input
                                                        type="number"
                                                        value={editRule.settings.value}
                                                        onChange={e => setEditRule({ ...editRule, settings: { ...editRule.settings, value: Number(e.target.value) } })}
                                                    />
                                                    <span className="unit">%</span>
                                                </div>
                                            </div>
                                            <div className="plus-sign">+</div>
                                            <div className="input-field">
                                                <label>Fiksni Iznos</label>
                                                <div className="composite-input">
                                                    <input
                                                        type="number"
                                                        value={editRule.settings.extraAmount || 0}
                                                        onChange={e => setEditRule({ ...editRule, settings: { ...editRule.settings, extraAmount: Number(e.target.value) } })}
                                                    />
                                                    <span className="unit">€</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowRuleModal(false)}>Odustani</button>
                            <button className="btn-primary" onClick={handleSaveRule}>Sačuvaj Pravilo</button>
                        </div>
                    </div>
                </div>
            )}

            {/* B2B Access Management Modal */}
            {showB2BModal && b2bEditAgent && (
                <div className="modal-overlay" onClick={() => setShowB2BModal(false)}>
                    <div className="modal-content b2b-access-modal" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>B2B Pristup: {b2bEditAgent.companyName}</h2>
                                <p>Upravljanje korisničkim nalozima za subagenta (Max 5 korisnika)</p>
                            </div>
                            <button className="modal-close" onClick={() => setShowB2BModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="b2b-users-grid">
                                {b2bEditAgent.b2bUsers.map((user, idx) => (
                                    <div key={user.id} className="b2b-user-card">
                                        <div className="user-card-header">
                                            <div className="user-idx">Korisnik #{idx + 1}</div>
                                            <button
                                                className="btn-remove-user"
                                                onClick={() => {
                                                    const next = b2bEditAgent.b2bUsers.filter(u => u.id !== user.id);
                                                    setB2BEditAgent({ ...b2bEditAgent, b2bUsers: next });
                                                }}
                                            >
                                                Ukloni
                                            </button>
                                        </div>
                                        <div className="input-grid compact">
                                            <div className="input-field">
                                                <label>Ime i Prezime</label>
                                                <input
                                                    type="text"
                                                    value={user.name}
                                                    placeholder="npr. Marko Marković"
                                                    onChange={e => {
                                                        const next = [...b2bEditAgent.b2bUsers];
                                                        next[idx].name = e.target.value;
                                                        setB2BEditAgent({ ...b2bEditAgent, b2bUsers: next });
                                                    }}
                                                />
                                            </div>
                                            <div className="input-field">
                                                <label>Korisničko Ime (E-mail)</label>
                                                <input
                                                    type="email"
                                                    value={user.username}
                                                    placeholder="mejl@firma.rs"
                                                    onChange={e => {
                                                        const next = [...b2bEditAgent.b2bUsers];
                                                        next[idx].username = e.target.value;
                                                        setB2BEditAgent({ ...b2bEditAgent, b2bUsers: next });
                                                    }}
                                                />
                                            </div>
                                            <div className="input-field password-field">
                                                <label>Lozinka</label>
                                                <div className="password-input-wrapper">
                                                    <input
                                                        type="text"
                                                        value={user.password}
                                                        onChange={e => {
                                                            const next = [...b2bEditAgent.b2bUsers];
                                                            next[idx].password = e.target.value;
                                                            setB2BEditAgent({ ...b2bEditAgent, b2bUsers: next });
                                                        }}
                                                    />
                                                    <button
                                                        className="btn-gen-pass"
                                                        title="Generiši novu lozinku"
                                                        onClick={() => {
                                                            const next = [...b2bEditAgent.b2bUsers];
                                                            next[idx].password = generatePassword();
                                                            setB2BEditAgent({ ...b2bEditAgent, b2bUsers: next });
                                                        }}
                                                    >
                                                        <Key size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="input-field">
                                                <label>Rola</label>
                                                <select
                                                    className="admin-select"
                                                    value={user.role}
                                                    onChange={e => {
                                                        const next = [...b2bEditAgent.b2bUsers];
                                                        next[idx].role = e.target.value as any;
                                                        setB2BEditAgent({ ...b2bEditAgent, b2bUsers: next });
                                                    }}
                                                >
                                                    <option value="Admin">Admin</option>
                                                    <option value="User">Standardni Korisnik</option>
                                                </select>
                                            </div>
                                        </div>
                                        {user.lastLogin && (
                                            <div className="user-last-login">
                                                Poslednja prijava: {user.lastLogin}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {b2bEditAgent.b2bUsers.length < 5 && (
                                    <button className="add-user-placeholder" onClick={handleAddB2BUser}>
                                        <Plus size={24} />
                                        <span>Dodaj novog korisnika</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowB2BModal(false)}>Odustani</button>
                            <button className="btn-primary" onClick={handleSaveAccess}>Sačuvaj Promene</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubagentAdmin;
