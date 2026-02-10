import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Shield,
    Activity,
    RotateCcw,
    Search,
    ArrowLeft,
    Plus,
    X,
    Check,
    Globe,
    Cpu,
    Server,
    Wifi,
    Lock,
    Trash2,
    Mail,
    Smartphone,
    UserPlus,
    AlertTriangle,
    Database,
    Zap,
    ShieldAlert,
    Menu,
    Bell,
    FileText,
    BookOpen,
    Brain,
    LayoutGrid,
    List,
    ChevronRight,
    Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfig } from '../../context/ConfigContext';
import { type Language } from '../../translations';
import { saveToCloud, loadFromCloud } from '../../utils/storageUtils';
import SystemPulse from './SystemPulse';
import DeepArchive from './DeepArchive';
import NotificationCenter from './NotificationCenter';
import AIQuotaDashboard from './AIQuotaDashboard';
import DailyActivityReport from './DailyActivityReport';
import ModulesOverview from './ModulesOverview';
import MasterOrchestrator from '../ai/MasterOrchestrator';

// --- Types ---
interface UserAccount {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fixedPhone: string;
    mobilePhone: string;
    level: number;
    username?: string;
    password?: string;
}

interface Integration {
    id: string;
    name: string;
    endpoint: string;
    key: string;
    status: 'active' | 'inactive' | 'connecting';
    type: 'ai' | 'payment' | 'govt' | 'email' | 'db' | 'other';
    iconName: string;
    color: string;
    metrics?: Record<string, string>;
}

interface Props {
    onBack: () => void;
    lang: Language;
    userLevel: number;
    setUserLevel: (level: number) => void;
}

type TabType = 'overview' | 'general' | 'users' | 'permissions' | 'connections' | 'ai-quota' | 'daily-activity' | 'pulse' | 'backups' | 'archive' | 'notifications' | 'ai-training' | 'modules-overview' | 'orchestrator' | 'api-docs';

interface SettingsModuleConfig {
    id: TabType;
    name: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
    minLevel: number;
    category: 'system' | 'security' | 'ai' | 'activity';
}

const SETTING_MODULES: SettingsModuleConfig[] = [
    { id: 'modules-overview', name: 'Pregled Modula', desc: 'Audit i monitoring svih API konekcija i sistemskih funkcija.', icon: <BookOpen size={24} />, color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', minLevel: 6, category: 'system' },
    { id: 'connections', name: 'Aktivne Konekcije', desc: 'Upravljanje eksternim API servisima i integracijama.', icon: <Activity size={24} />, color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', minLevel: 1, category: 'system' },
    { id: 'orchestrator', name: 'AI Orchestrator', desc: 'Centralno upravljanje AI agentima i modelima.', icon: <Brain size={24} />, color: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', minLevel: 6, category: 'ai' },
    { id: 'ai-quota', name: 'AI Quota Tracker', desc: 'Praćenje i kontrola potrošnje AI resursa po modulima.', icon: <Zap size={24} />, color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', minLevel: 3, category: 'ai' },
    { id: 'daily-activity', name: 'Dnevni Izveštaj', desc: 'Kompletna analiza aktivnosti i statusa rezervacija.', icon: <FileText size={24} />, color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', minLevel: 3, category: 'activity' },
    { id: 'general', name: 'General Settings', desc: 'Osnovna podešavanja sistema i AI konfiguracija.', icon: <LayoutDashboard size={24} />, color: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', minLevel: 1, category: 'system' },
    { id: 'users', name: 'Korisnički Nalozi', desc: 'Upravljanje operaterima, nivoima pristupa i profilima.', icon: <Users size={24} />, color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', minLevel: 1, category: 'security' },
    { id: 'permissions', name: 'Access Permissions', desc: 'Matrica prava pristupa i specifična ovlašćenja.', icon: <Lock size={24} />, color: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', minLevel: 6, category: 'security' },
    { id: 'notifications', name: 'Notifikacije', desc: 'Podešavanja sistemskih obaveštenja i upozorenja.', icon: <Bell size={24} />, color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', minLevel: 1, category: 'system' },
    { id: 'backups', name: 'System Snapshots', desc: 'Upravljanje rezervnim kopijama i istorijom sistema.', icon: <RotateCcw size={24} />, color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', minLevel: 6, category: 'security' },
    { id: 'pulse', name: 'System Pulse', desc: 'Monitoring performansi i zdravlja hardvera u realnom vremenu.', icon: <Activity size={24} />, color: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', minLevel: 1, category: 'activity' },
    { id: 'archive', name: 'Deep Archive', desc: 'Registar svih obrisanih i istorijskih podataka.', icon: <ShieldAlert size={24} />, color: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', minLevel: 6, category: 'security' },
    { id: 'api-docs', name: 'API Documentation', desc: 'Tehnička dokumentacija za Olympic API Gateway i integracije.', icon: <FileText size={24} />, color: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', minLevel: 6, category: 'system' },
];

// --- KATANA STYLED COMPONENTS (Inline Styles) ---
const styles = {
    layout: {
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100vh',
        background: 'var(--bg-dark)',
        color: 'var(--text-primary)',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden'
    },
    main: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden',
        background: 'transparent'
    },
    header: {
        height: '70px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 30px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)'
    },
    contentArea: {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '30px',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
    },
    navItem: (active: boolean) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '12px',
        cursor: 'pointer',
        marginBottom: '4px',
        fontSize: '14px',
        fontWeight: 500,
        color: active ? '#fff' : '#94a3b8',
        background: active ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
        transition: 'all 0.2s ease',
        boxShadow: active ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none'
    }),
    card: {
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px'
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '10px',
        background: 'var(--bg-input)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
        outline: 'none',
        fontSize: '13px'
    },
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
        transition: 'all 0.2s'
    },
    statusBadge: (status: 'active' | 'inactive' | 'warning') => ({
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: status === 'active' ? 'rgba(34, 197, 94, 0.1)' : status === 'warning' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        color: status === 'active' ? '#4ade80' : status === 'warning' ? '#facc15' : '#f87171',
        border: `1px solid ${status === 'active' ? 'rgba(34, 197, 94, 0.2)' : status === 'warning' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
    })
};

export default function SettingsModule({ onBack, userLevel, setUserLevel }: Props) {
    const { config, updateConfig, createSnapshot, backups, restoreSnapshot } = useConfig();
    const location = useLocation();

    // Responsive state
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

    // Window resize handler
    const handleResize = useCallback(() => {
        const width = window.innerWidth;
        setIsMobile(width < 768);
        setIsTablet(width >= 768 && width < 1024);
    }, []);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    // Handle URL query parameter for tab
    const [activeTab, setActiveTab] = useState<TabType>(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab') as TabType;
        return tabParam || 'overview';
    });
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        const saved = localStorage.getItem('settings-view-mode');
        return (saved as 'grid' | 'list') || 'grid';
    });

    useEffect(() => {
        localStorage.setItem('settings-view-mode', viewMode);
    }, [viewMode]);

    const [searchQuery, setSearchQuery] = useState('');
    const [geminiKey, setGeminiKey] = useState(config.geminiKey);
    const [isSaving, setIsSaving] = useState(false);

    // Data States
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [archivedUsers, setArchivedUsers] = useState<UserAccount[]>([]);
    const [accessRules, setAccessRules] = useState<Record<number, string[]>>({});

    // UI States
    const [newUser, setNewUser] = useState<Partial<UserAccount>>({ level: 1 });
    const [showUserForm, setShowUserForm] = useState(false);
    const [showArchive, setShowArchive] = useState(false);
    const [selectedUserForOverride, setSelectedUserForOverride] = useState<string>('');
    const [pendingAction, setPendingAction] = useState<{ type: 'delete' | 'change', payload: any } | null>(null);
    const [showIntegrationForm, setShowIntegrationForm] = useState(false);
    const [integrationFormData, setIntegrationFormData] = useState<Partial<Integration>>({ name: '', endpoint: '', key: '' });

    // Handle tab change
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
    };

    // Default Integrations (System)
    const systemIntegrations: Integration[] = [
        { id: 'gemini', name: 'Google Gemini AI', endpoint: 'https://generativelanguage.googleapis.com', key: 'sk-proj-...', status: 'active', type: 'ai', iconName: 'Cpu', color: '#3b82f6', metrics: { Latency: '45ms', Requests: '1.2k/day' } },
        { id: 'bank', name: 'Bank Gateway', endpoint: 'https://api.bancaintesa.rs/v2', key: 'intesa-...', status: 'active', type: 'payment', iconName: 'Shield', color: '#22c55e', metrics: { Uptime: '99.9%', 'Last Sync': '2m ago' } },
        { id: 'eturista', name: 'E-Turista Srbija', endpoint: 'https://eturista.gov.rs/api', key: 'cis-govt-...', status: 'connecting', type: 'govt', iconName: 'Globe', color: '#eab308', metrics: { Status: 'Certificate Validation Pending...' } },
        { id: 'sendgrid', name: 'SendGrid Email', endpoint: 'https://api.sendgrid.com/v3', key: 'SG.2384...', status: 'active', type: 'email', iconName: 'Mail', color: '#a855f7', metrics: { Delivered: '8,432', 'Open Rate': '42%' } },
        { id: 'supabase', name: 'Supabase Cloud', endpoint: 'https://xyz.supabase.co', key: 'sb-nectar...', status: 'active', type: 'db', iconName: 'Database', color: '#14b8a6', metrics: { Region: 'eu-central', Pool: '12/100' } }
    ];

    const [integrations, setIntegrations] = useState<Integration[]>(systemIntegrations);

    useEffect(() => {
        const loadIntegrations = async () => {
            const { success, data } = await loadFromCloud('integrations');
            if (success && data && data.length > 0) {
                setIntegrations(data);
            } else {
                const saved = localStorage.getItem('olympic_hub_integrations');
                if (saved) setIntegrations(JSON.parse(saved));
            }
        };
        loadIntegrations();
    }, []);

    const handleSaveIntegration = () => {
        let newIntegrations;
        if (integrationFormData.id) {
            // Edit
            newIntegrations = integrations.map(i => i.id === integrationFormData.id ? { ...i, ...integrationFormData } as Integration : i);
        } else {
            // Create
            const newInt: Integration = {
                id: Math.random().toString(36).substr(2, 9),
                name: integrationFormData.name || 'New Integration',
                endpoint: integrationFormData.endpoint || '',
                key: integrationFormData.key || '',
                status: 'active',
                type: 'other',
                iconName: 'Server',
                color: '#64748b',
                metrics: { Status: 'Initialized' }
            };
            newIntegrations = [...integrations, newInt];
        }
        setIntegrations(newIntegrations);
        localStorage.setItem('olympic_hub_integrations', JSON.stringify(newIntegrations));
        saveToCloud('integrations', newIntegrations);
        setShowIntegrationForm(false);
    };

    const getIcon = (name: string) => {
        const icons: any = { Cpu, Shield, Globe, Mail, Database, Server, Zap, Lock, Wifi, Smartphone };
        const Icon = icons[name] || Server;
        return <Icon size={20} />;
    };

    const isMaster = userLevel === 6;

    const modulesList = [
        { id: 'dashboard', name: 'Dashboard' },
        { id: 'production-hub', name: 'Production Hub' },
        { id: 'mars-analysis', name: 'Mars Analysis' },
        { id: 'suppliers', name: 'Dobavljači' },
        { id: 'customers', name: 'Kupci' },
        { id: 'settings', name: 'Podešavanja' },
        { id: 'deep-archive', name: 'Deep Archive' },
        { id: 'fortress', name: 'The Fortress' },
        { id: 'katana', name: 'Project Katana' }
    ];

    // --- Data Loading & Sync (Same logic as before) ---
    useEffect(() => {
        const loadSettingsData = async () => {
            const { success: s1, data: d1 } = await loadFromCloud('user_accounts');
            if (s1 && d1 && d1.length > 0) setUsers(d1 as UserAccount[]);
            else {
                setUsers([{ id: '1', firstName: 'Nenad', lastName: 'Admin', email: 'nenad@example.com', fixedPhone: '', mobilePhone: '', level: 6 }]);
            }
            const { success: s2, data: d2 } = await loadFromCloud('archived_users');
            if (s2 && d2) setArchivedUsers(d2 as UserAccount[]);
            const { success: s3, data: d3 } = await loadFromCloud('access_rules');
            if (s3 && d3) {
                const rulesMap: Record<number, string[]> = {};
                d3.forEach((item: any) => rulesMap[item.id] = item.modules);
                setAccessRules(rulesMap);
            } else {
                setAccessRules({
                    1: ['dashboard', 'search'],
                    2: ['dashboard', 'search', 'customers'],
                    3: ['dashboard', 'search', 'customers', 'suppliers', 'production-hub'],
                    4: ['dashboard', 'search', 'customers', 'suppliers', 'production-hub', 'mars-analysis'],
                    5: ['dashboard', 'search', 'customers', 'suppliers', 'production-hub', 'mars-analysis', 'settings'],
                    6: ['dashboard', 'search', 'customers', 'suppliers', 'production-hub', 'mars-analysis', 'settings', 'master-access']
                });
            }
        };
        loadSettingsData();
    }, []);

    // Optimized Syncers
    useEffect(() => { if (users.length > 0) saveToCloud('user_accounts', users); }, [users]);
    useEffect(() => { if (archivedUsers.length > 0) saveToCloud('archived_users', archivedUsers); }, [archivedUsers]);
    useEffect(() => {
        const rulesArray = Object.entries(accessRules).map(([lvl, modules]) => ({ id: lvl, modules }));
        if (rulesArray.length > 0) saveToCloud('access_rules', rulesArray);
    }, [accessRules]);

    // --- Handlers ---
    const handleSave = async () => {
        setIsSaving(true);
        await updateConfig({ geminiKey });
        setTimeout(() => setIsSaving(false), 800);
    };

    const handleCreateSnapshot = async () => createSnapshot(`${new Date().toLocaleString('sr-RS')}`);

    const handleAddUser = () => {
        if (!newUser.firstName || !newUser.email) return;

        if (newUser.id) {
            // Update existing user
            setUsers(users.map(u => u.id === newUser.id ? { ...u, ...newUser as UserAccount } : u));
        } else {
            // Create New User
            const user: UserAccount = {
                id: Date.now().toString(),
                firstName: newUser.firstName || '',
                lastName: newUser.lastName || '',
                email: newUser.email || '',
                fixedPhone: newUser.fixedPhone || '',
                mobilePhone: newUser.mobilePhone || '',
                level: newUser.level || 1
            };
            setUsers([...users, user]);
        }
        setNewUser({ level: 1 });
        setShowUserForm(false);
    };

    const handleDeleteUser = (id: string) => setPendingAction({ type: 'delete', payload: id });

    const confirmDeletion = () => {
        if (!pendingAction) return;
        const id = pendingAction.payload;
        const user = users.find(u => u.id === id);
        if (user) {
            setArchivedUsers([...archivedUsers, user]);
            setUsers(users.filter(u => u.id !== id));
        }
        setPendingAction(null);
    };

    const restoreUser = (id: string) => {
        const user = archivedUsers.find(u => u.id === id);
        if (user) { setUsers([...users, user]); setArchivedUsers(archivedUsers.filter(u => u.id !== id)); }
    };

    const toggleModuleAccess = (level: number, moduleId: string) => {
        setAccessRules(prev => {
            const levelRules = prev[level] || [];
            return {
                ...prev,
                [level]: levelRules.includes(moduleId) ? levelRules.filter(id => id !== moduleId) : [...levelRules, moduleId]
            };
        });
    };

    const getOverrideState = (userId: string, type: 'module' | 'import' | 'export', id?: string) => {
        const exceptions = config.userExceptions?.[userId] || {};
        if (type === 'import') return exceptions.canImport === true ? 'allow' : exceptions.canImport === false ? 'deny' : 'auto';
        if (type === 'export') return exceptions.canExport === true ? 'allow' : exceptions.canExport === false ? 'deny' : 'auto';
        if (type === 'module' && id) return exceptions.allowedModules?.includes(id) ? 'allow' : exceptions.deniedModules?.includes(id) ? 'deny' : 'auto';
        return 'auto';
    };

    const setOverride = (userId: string, type: 'module' | 'permission', id: string, value: 'allow' | 'deny' | 'auto') => {
        const current = config.userExceptions?.[userId] || {};
        let next = { ...current };

        if (type === 'permission') {
            if (value === 'auto') { if (id === 'import') delete next.canImport; if (id === 'export') delete next.canExport; }
            else { if (id === 'import') next.canImport = (value === 'allow'); if (id === 'export') next.canExport = (value === 'allow'); }
        } else {
            next.allowedModules = (next.allowedModules || []).filter(m => m !== id);
            next.deniedModules = (next.deniedModules || []).filter(m => m !== id);
            if (value === 'allow') next.allowedModules.push(id);
            if (value === 'deny') next.deniedModules.push(id);
        }
        updateConfig({ userExceptions: { ...config.userExceptions, [userId]: next } });
    };


    // --- Render Content ---

    // 1. General Settings
    const renderGeneral = () => (
        <div className="fade-in">
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Sistemske Postavke</h3>

            <div style={styles.card}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                    <Cpu color="var(--accent)" />
                    <div>
                        <h4 style={{ margin: 0, fontSize: '16px' }}>AI Configuration (Gemini)</h4>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Ključ za pristup Google AI Modelima</p>
                    </div>
                </div>
                <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} style={styles.input} />
                <button onClick={handleSave} style={{ ...styles.button, background: 'var(--accent)', color: '#fff', marginTop: '15px' }}>
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>

            <div style={styles.card}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                    <Zap color="#eab308" />
                    <div>
                        <h4 style={{ margin: 0, fontSize: '16px' }}>Simulacija Nivoa</h4>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Privremeno preuzimanje privilegija drugog nivoa</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {[1, 2, 3, 4, 5, 6].map(lvl => (
                        <button key={lvl} onClick={() => setUserLevel(lvl)} style={{ ...styles.button, background: userLevel >= lvl ? (lvl === 6 ? 'var(--gradient-purple)' : 'var(--bg-surface)') : 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                            {lvl === 6 ? 'MASTER' : `LVL ${lvl}`}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // 2. Users Management
    const renderUsers = () => (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Korisnički Nalozi</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {isMaster && <button onClick={() => setShowArchive(!showArchive)} style={{ ...styles.button, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Archive ({archivedUsers.length})</button>}
                    <button onClick={() => setShowUserForm(!showUserForm)} style={{ ...styles.button, background: 'var(--accent)', color: '#fff' }}><UserPlus size={16} /> New User</button>
                </div>
            </div>

            <AnimatePresence>
                {showUserForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ ...styles.card, overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <input placeholder="First Name" value={newUser.firstName || ''} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} style={styles.input} />
                            <input placeholder="Last Name" value={newUser.lastName || ''} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} style={styles.input} />
                            <select value={newUser.level || 1} onChange={e => setNewUser({ ...newUser, level: Number(e.target.value) })} style={styles.input}>
                                {[1, 2, 3, 4, 5, 6].map(l => <option key={l} value={l}>{l === 6 ? 'MASTER (Level 6)' : `Level ${l}`}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <input
                                placeholder="Username (korisničko ime)"
                                value={newUser.username || ''}
                                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                style={styles.input}
                                autoComplete="username"
                            />
                            <input
                                type="password"
                                placeholder="Password (šifra)"
                                value={newUser.password || ''}
                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                style={styles.input}
                                autoComplete="new-password"
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <input placeholder="Email" value={newUser.email || ''} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={styles.input} />
                            <input placeholder="Mobile Phone" value={newUser.mobilePhone || ''} onChange={e => setNewUser({ ...newUser, mobilePhone: e.target.value })} style={styles.input} />
                            <input placeholder="Fixed Phone" value={newUser.fixedPhone || ''} onChange={e => setNewUser({ ...newUser, fixedPhone: e.target.value })} style={styles.input} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleAddUser} style={{ ...styles.button, background: '#22c55e', color: '#fff', flex: 1 }}>{newUser.id ? 'Update User' : 'Create Account'}</button>
                            {newUser.id && <button onClick={() => { setNewUser({ level: 1 }); setShowUserForm(false); }} style={{ ...styles.button, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Cancel Edit</button>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'grid', gap: '10px' }}>
                {users.filter(u => u.firstName.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                    <div
                        key={u.id}
                        onClick={() => { setNewUser(u); setShowUserForm(true); }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{u.firstName[0]}</div>
                            <div>
                                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {u.firstName} {u.lastName}
                                    {u.level === 6 && <img src="/logo.jpg" alt="Master" title="Master Account" style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'cover' }} />}
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>LVL {u.level}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</div>
                            </div>
                        </div>
                        <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                    </div>
                ))}
            </div>

            {showArchive && (
                <div style={{ marginTop: '40px' }}>
                    <h4 style={{ color: '#94a3b8', marginBottom: '15px' }}>Archive</h4>
                    {archivedUsers.map(u => (
                        <div key={u.id} style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>{u.firstName} {u.lastName}</span>
                            <button onClick={() => restoreUser(u.id)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '12px' }}>Restore</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // 3. Permissions Matrix
    const renderPermissions = () => (
        <div className="fade-in">
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Sistemske Dozvole</h3>

            <div style={{ ...styles.card, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', color: '#94a3b8', padding: '10px' }}>Module</th>
                            {[1, 2, 3, 4, 5, 6].map(l => <th key={l} style={{ color: '#94a3b8', fontSize: '12px' }}>LVL {l}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {modulesList.map(mod => (
                            <tr key={mod.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <td style={{ padding: '12px', borderRadius: '8px 0 0 8px' }}>{mod.name}</td>
                                {[1, 2, 3, 4, 5, 6].map(l => (
                                    <td key={l} style={{ textAlign: 'center', padding: '10px', borderRadius: l === 6 ? '0 8px 8px 0' : 0 }}>
                                        <button onClick={() => toggleModuleAccess(l, mod.id)}
                                            style={{
                                                width: '20px', height: '20px', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer',
                                                background: accessRules[l]?.includes(mod.id) ? 'var(--accent)' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                            {accessRules[l]?.includes(mod.id) && <Check size={12} color="#fff" />}
                                        </button>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={styles.card}>
                <h4 style={{ margin: '0 0 15px 0' }}>User Specific Overrides</h4>
                <select value={selectedUserForOverride} onChange={e => setSelectedUserForOverride(e.target.value)} style={styles.input}>
                    <option value="">Select User to Override Rules...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                </select>

                {selectedUserForOverride && (
                    <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>MODULE ACCESS</div>
                            {modulesList.map(mod => {
                                const s = getOverrideState(selectedUserForOverride, 'module', mod.id);
                                return (
                                    <div key={mod.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span>{mod.name}</span>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            {['auto', 'allow', 'deny'].map(v => (
                                                <button key={v} onClick={() => setOverride(selectedUserForOverride, 'module', mod.id, v as any)}
                                                    style={{
                                                        padding: '2px 6px', borderRadius: '4px', fontSize: '10px', border: 'none', cursor: 'pointer',
                                                        background: s === v ? (v === 'allow' ? '#22c55e' : v === 'deny' ? '#ef4444' : '#fff') : 'rgba(255,255,255,0.1)',
                                                        color: s === v ? (v === 'auto' ? '#000' : '#fff') : '#94a3b8'
                                                    }}>
                                                    {v.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // 4. API Connections (Requested Layout)
    const renderConnections = () => (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Aktivne Konekcije</h3>
                <div style={styles.statusBadge('active')}>
                    <Activity size={12} />
                    SYSTEM ONLINE
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {integrations.map(integration => (
                    <div
                        key={integration.id}
                        onClick={() => { setIntegrationFormData(integration); setShowIntegrationForm(true); }}
                        style={{ ...styles.card, cursor: 'pointer' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ padding: '10px', background: `rgba(${parseInt(integration.color.slice(1, 3), 16)}, ${parseInt(integration.color.slice(3, 5), 16)}, ${parseInt(integration.color.slice(5, 7), 16)}, 0.1)`, borderRadius: '10px', color: integration.color }}>
                                    {getIcon(integration.iconName)}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{integration.name}</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{integration.type.toUpperCase()} Protocol</div>
                                </div>
                            </div>
                            <div style={styles.statusBadge(integration.status === 'active' ? 'active' : 'warning')}>
                                {integration.status === 'active' ? 'Active' : 'Connecting'}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#64748b' }}>
                            {integration.metrics && Object.entries(integration.metrics).map(([k, v]) => (
                                <div key={k}>{k}: <span style={{ color: '#fff' }}>{v}</span></div>
                            ))}
                        </div>
                        <div style={{ height: '4px', background: 'var(--border)', marginTop: '15px', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: integration.status === 'active' ? '100%' : '30%', background: integration.color, height: '100%' }}></div>
                        </div>
                    </div>
                ))}

                {/* Add New Connection Placeholder */}
                <div onClick={() => { setIntegrationFormData({ name: '', endpoint: '', key: '' }); setShowIntegrationForm(true); }} style={{ ...styles.card, border: '1px dashed var(--border)', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: '160px' }}>
                    <div style={{ padding: '12px', background: 'var(--glass-bg)', borderRadius: '50%', marginBottom: '10px' }}>
                        <Plus color="var(--text-secondary)" />
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Add New Integration</span>
                </div>
            </div>

            <AnimatePresence>
                {showIntegrationForm && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(5px)', background: 'rgba(0,0,0,0.5)' }}>
                        <div style={{ ...styles.card, width: '400px', background: 'var(--bg-sidebar)', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0 }}>{integrationFormData.name ? 'Edit Integration' : 'New Integration'}</h3>
                                <button onClick={() => setShowIntegrationForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <input
                                    placeholder="Integration Name"
                                    style={styles.input}
                                    value={integrationFormData.name}
                                    onChange={e => setIntegrationFormData({ ...integrationFormData, name: e.target.value })}
                                />
                                <input
                                    placeholder="API Endpoint"
                                    style={styles.input}
                                    value={integrationFormData.endpoint}
                                    onChange={e => setIntegrationFormData({ ...integrationFormData, endpoint: e.target.value })}
                                />
                                <input
                                    type="password"
                                    placeholder="API Key / Token"
                                    style={styles.input}
                                    value={integrationFormData.key}
                                    onChange={e => setIntegrationFormData({ ...integrationFormData, key: e.target.value })}
                                />
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button onClick={() => setShowIntegrationForm(false)} style={{ ...styles.button, flex: 1, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Cancel</button>
                                    <button onClick={handleSaveIntegration} style={{ ...styles.button, flex: 1, background: '#3b82f6', color: '#fff' }}>
                                        {integrationFormData.name ? 'Save Changes' : 'Connect'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const [activeApiDocSection, setActiveApiDocSection] = useState<'search' | 'inventory' | 'ai' | 'booking'>('search');

    const renderApiDocs = () => {
        const sections = [
            { id: 'search', label: 'Unified Search', icon: <Search size={22} />, color: '#0ea5e9' },
            { id: 'inventory', label: 'Inventory', icon: <Database size={22} />, color: '#8b5cf6' },
            { id: 'ai', label: 'AI Analytics', icon: <Brain size={22} />, color: '#10b981' },
            { id: 'booking', label: 'Booking Engine', icon: <Zap size={22} />, color: '#f59e0b' }
        ];

        const docContent = {
            search: {
                title: 'UNIFIED SEARCH ENDPOINT',
                endpoint: 'POST /v1/search/unified',
                description: 'Federated Search kroz sve izvore. Agregira lokalnu bazu i eksterne API-je (SOAP/JSON) u unificirani model sa geo-podacima.',
                code: `// REQUEST
{
  "params": {
    "destination": "Rhodes, GR",
    "dates": { "in": "2025-07-01", "out": "2025-07-10" },
    "occupancy": [{ "pax": "AD", "count": 2 }]
  }
}

// RESPONSE (UNIFIED)
{
  "hotel_id": "OH-GR-102",
  "name": "Olympic Palace Resort",
  "location": { 
    "city": "Rhodes", 
    "geo": [36.4432, 28.2274],
    "address": "Ialyssos Avenue 12"
  },
  "provider": { "sources": ["Solvex", "Local"] },
  "cheapest_offer": {
    "price": 1450.00,
    "currency": "EUR",
    "board": "All Inclusive"
  }
}`
            },
            inventory: {
                title: 'GLOBAL INVENTORY & PRICELIST',
                endpoint: 'GET /v1/inventory/rates/:hotel_id',
                description: 'Srž Orchestratora. Apstrahuje Solvex SOAP cene and manuelne cenovnike u jedinstvenu Pricing matricu sa doplatama i popustima.',
                code: `// UNIFIED PRICELIST STRUCTURE
{
  "contract": "OH-2025-C12",
  "pricing": {
    "base": [
      {
        "period": ["2025-07-01", "2025-08-31"],
        "net": 85.00, "gross": 105.00,
        "board": "HB",
        "room": "DBL_STD"
      }
    ],
    "supplements": [
      { "type": "Tax", "code": "CITY_TAX", "amount": 4.00, "basis": "Night" },
      { "type": "Room", "code": "SEA_VIEW", "amount": 15.00, "basis": "Night" }
    ],
    "discounts": [
      { "type": "EarlyBooking", "value": "15%", "until": "2025-03-31" }
    ],
    "child_policy": [
      { "age": [0, 2], "price": 0 },
      { "age": [3, 12], "reduction": "50%" }
    ]
  }
}`
            },
            ai: {
                title: 'AI YIELD & ANALYTICS',
                endpoint: 'POST /v1/ai/analyze-yield',
                description: 'Inteligentni sloj koji poredi naš "Internal Price" sa tržišnim (Booking/Expedia) i automatski kalkuliše profitabilnost.',
                code: `// ANALYTICS PAYLOAD
{
  "our_price": 105.00,
  "competitors": [
    { "engine": "Booking", "price": 118.00 },
    { "engine": "Expedia", "price": 115.00 }
  ]
}

// AI STRATEGY
{
  "suggestion": "Adjust Gross +2.5%",
  "market_position": "Competitive",
  "projected_profit": "+18.4%",
  "rules": ["DynamicMarkup", "DemandSpike"]
}`
            },
            booking: {
                title: 'UNIFIED BOOKING ENGINE',
                endpoint: 'POST /v1/booking/execute',
                description: 'Jedinstveni proces potvrde. Automatski vrši asinhroni "Ping" ka provajderu i generiše Voucher i Rezervaciju u OH bazi.',
                code: `// EXECUTION PAYLOAD
{
  "offer_token": "TOK_B2B_992183",
  "pax": [
    { "name": "Miloš Perić", "dob": "1985-05-12", "doc": "009123" }
  ],
  "lead_contact": { "email": "milos@example.com" },
  "billing_mode": "CreditLine"
}

// STATUS
{
  "res_id": "RES-2026-X01",
  "status": "Confirmed",
  "provider_ref": "SOL-2930-X",
  "voucher": "https://api.oh.rs/vouchers/X01"
}`
            }
        };

        const current = docContent[activeApiDocSection];

        return (
            <div className="api-gateway-docs fade-in" style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                borderRadius: '30px',
                padding: isMobile ? '20px' : '40px',
                minHeight: '600px',
                position: 'relative',
                overflow: 'hidden',
                color: '#fff',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '20px' : '40px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Glow Effects */}
                <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

                {/* Docs Sidebar */}
                <div className="docs-nav" style={{
                    width: isMobile ? '100%' : '240px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    padding: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: isMobile ? 'row' : 'column',
                    justifyContent: isMobile ? 'space-around' : 'flex-start',
                    gap: '10px',
                    zIndex: 2,
                    overflowX: isMobile ? 'auto' : 'hidden',
                    flexShrink: 0
                }}>
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveApiDocSection(section.id as any)}
                            style={{
                                padding: isMobile ? '10px' : '20px 15px',
                                background: activeApiDocSection === section.id ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                border: 'none',
                                borderRadius: '15px',
                                color: activeApiDocSection === section.id ? '#fff' : '#94a3b8',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                outline: 'none',
                                flex: isMobile ? 1 : 'none',
                                minWidth: isMobile ? '80px' : 'auto'
                            }}
                        >
                            {activeApiDocSection === section.id && !isMobile && (
                                <div style={{
                                    position: 'absolute',
                                    left: '0',
                                    top: '20%',
                                    bottom: '20%',
                                    width: '3px',
                                    background: section.color,
                                    borderRadius: '0 4px 4px 0',
                                    boxShadow: `0 0 10px ${section.color}`
                                }} />
                            )}
                            <div style={{ color: activeApiDocSection === section.id ? section.color : 'inherit' }}>
                                {section.icon}
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 600, textAlign: 'center' }}>{section.label}</span>
                        </button>
                    ))}
                </div>

                {/* Docs Content */}
                <div className="docs-main" style={{ flex: 1, zIndex: 2, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h1 style={{ fontSize: isMobile ? '32px' : '48px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, lineHeight: 1 }}>
                            OLYMPIC <br />
                            <span style={{ color: 'rgba(255,255,255,0.9)' }}>API GATEWAY</span>
                        </h1>
                        <div style={{ height: '4px', width: '60px', background: '#0ea5e9', marginTop: '20px', borderRadius: '2px' }} />
                    </div>

                    <div className="glass-code-card" style={{
                        flex: 1,
                        background: 'rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        padding: isMobile ? '20px' : '30px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>{current.title}</h3>
                                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', color: '#0ea5e9', background: 'rgba(14, 165, 233, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                                    {current.endpoint}
                                </span>
                            </div>
                            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#94a3b8' }}>{current.description}</p>
                        </div>

                        <pre style={{
                            margin: 0,
                            padding: '20px',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '16px',
                            fontSize: isMobile ? '12px' : '14px',
                            fontFamily: '"JetBrains Mono", monospace',
                            lineHeight: 1.6,
                            overflowX: 'auto',
                            color: '#e2e8f0',
                            border: '1px solid rgba(255,255,255,0.03)'
                        }}>
                            {current.code.split('\n').map((line, i) => {
                                const highlightedLine = line
                                    .replace(/"([^"]+)":/g, '<span style="color: #f472b6">"$1"</span>:')
                                    .replace(/: "(.*)"/g, ': <span style="color: #34d399">"$1"</span>')
                                    .replace(/\/\/ (.*)/g, '<span style="color: #94a3b8; font-style: italic">// $1</span>');

                                return (
                                    <div key={i} dangerouslySetInnerHTML={{ __html: highlightedLine || '&nbsp;' }} />
                                );
                            })}
                        </pre>
                    </div>
                </div>
            </div>
        );
    };

    // 5. Backups
    const renderBackups = () => (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Snapshots & Backups</h3>
                <button onClick={handleCreateSnapshot} style={{ ...styles.button, background: '#3b82f6', color: '#fff' }}><Plus size={16} /> Create Snapshot</button>
            </div>

            {backups.map(b => (
                <div key={b.id} style={{ ...styles.card, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}><RotateCcw size={18} /></div>
                        <div>
                            <div style={{ fontWeight: 600 }}>{b.note}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {b.id}</div>
                        </div>
                    </div>
                    <button onClick={() => restoreSnapshot(b)} style={{ ...styles.button, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>RESTORE</button>
                </div>
            ))}
        </div>
    );

    // 6. Overview (Sub-Dashboard)
    const renderOverview = () => {
        const filteredModules = SETTING_MODULES.filter(m =>
            (m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.desc.toLowerCase().includes(searchQuery.toLowerCase())) &&
            userLevel >= m.minLevel
        );

        return (
            <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>System Control Center</h3>
                        <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '14px' }}>Upravljanje parametrima, bezbednošću i resursima sistema.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <button onClick={() => setViewMode('grid')} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: viewMode === 'grid' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: viewMode === 'grid' ? '#3b82f6' : '#94a3b8', cursor: 'pointer' }}>
                            <LayoutGrid size={18} />
                        </button>
                        <button onClick={() => setViewMode('list')} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: viewMode === 'list' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: viewMode === 'list' ? '#3b82f6' : '#94a3b8', cursor: 'pointer' }}>
                            <List size={18} />
                        </button>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr',
                    gap: '20px'
                }}>
                    {filteredModules.map((mod, idx) => (
                        <motion.div
                            key={mod.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setActiveTab(mod.id)}
                            style={{
                                ...styles.card,
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: viewMode === 'list' ? 'row' : 'column',
                                alignItems: viewMode === 'list' ? 'center' : 'flex-start',
                                gap: '20px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden',
                                border: '1px solid var(--border)',
                                background: 'var(--glass-bg)',
                                backdropFilter: 'blur(10px)'
                            }}
                            whileHover={{ y: -5, background: 'var(--bg-card-hover)', borderColor: 'var(--accent)' }}
                        >
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: mod.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                                flexShrink: 0
                            }}>
                                {mod.icon}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{mod.name}</h4>
                                    {mod.minLevel >= 6 && <span style={{ fontSize: '10px', background: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa', padding: '2px 8px', borderRadius: '100px', fontWeight: 800 }}>MASTER</span>}
                                </div>
                                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>{mod.desc}</p>
                            </div>

                            {viewMode === 'list' && <ChevronRight size={20} style={{ opacity: 0.3 }} />}

                            {/* Decorative Background Glow */}
                            <div style={{
                                position: 'absolute',
                                top: '-20%',
                                right: '-10%',
                                width: '120px',
                                height: '120px',
                                background: mod.color,
                                filter: 'blur(60px)',
                                opacity: 0.05,
                                pointerEvents: 'none'
                            }} />
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={styles.layout}>
            {/* MAIN CONTENT */}
            <div style={{ ...styles.main, flex: 1 }}>
                {/* HEADER */}
                <div style={{ ...styles.header, padding: isMobile ? '0 15px' : isTablet ? '0 20px' : '0 30px', height: isMobile ? '60px' : '70px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button
                            onClick={onBack}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '10px',
                                padding: '8px 14px',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                transition: 'all 0.2s',
                                fontWeight: 600
                            } as any}
                        >
                            <ArrowLeft size={16} /> Izlaz
                        </button>
                        {!isMobile && (
                            <>
                                {activeTab !== 'overview' && (
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: '10px',
                                            padding: '8px 14px',
                                            color: '#94a3b8',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '13px',
                                            transition: 'all 0.2s',
                                            fontWeight: 600
                                        } as any}
                                    >
                                        <LayoutDashboard size={14} /> Dashboard
                                    </button>
                                )}
                                <div style={{ fontSize: '14px', color: '#64748b' }}>
                                    System / <span style={{ color: '#fff', fontWeight: 600 }}>
                                        {SETTING_MODULES.find(m => m.id === activeTab)?.name || activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '15px', marginLeft: isMobile ? 'auto' : 0, width: isMobile ? '100%' : 'auto' }}>
                        <div style={{ position: 'relative', flex: isMobile ? 1 : 'none' }}>
                            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                placeholder="Search settings..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ ...styles.input, paddingLeft: '36px', width: isMobile ? '100%' : isTablet ? '180px' : '240px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)' }}
                            />
                        </div>
                        <button style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <AlertTriangle size={18} />
                        </button>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                            A
                        </div>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div style={{ ...styles.contentArea, padding: isMobile ? '15px' : isTablet ? '20px' : '30px' }}>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'general' && renderGeneral()}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'permissions' && renderPermissions()}
                    {activeTab === 'connections' && renderConnections()}
                    {activeTab === 'ai-quota' && <AIQuotaDashboard />}
                    {activeTab === 'daily-activity' && <DailyActivityReport />}
                    {activeTab === 'notifications' && <NotificationCenter />}
                    {activeTab === 'pulse' && <SystemPulse />}
                    {activeTab === 'backups' && renderBackups()}
                    {activeTab === 'archive' && <DeepArchive onBack={() => setActiveTab('overview')} lang={'sr'} />}
                    {activeTab === 'modules-overview' && <ModulesOverview />}
                    {activeTab === 'orchestrator' && <MasterOrchestrator onBack={() => setActiveTab('overview')} userLevel={userLevel} />}
                    {activeTab === 'api-docs' && renderApiDocs()}
                </div>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {pendingAction && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ ...styles.card, width: '400px', background: 'var(--bg-sidebar)', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginTop: 0 }}>Confirm Action</h3>
                            <p style={{ color: '#94a3b8' }}>This action is irreversible. Required authentication level: MASTER.</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button onClick={() => setPendingAction(null)} style={{ ...styles.button, flex: 1, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Cancel</button>
                                <button onClick={confirmDeletion} style={{ ...styles.button, flex: 1, background: '#ef4444', color: '#fff' }}>Confirm</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
