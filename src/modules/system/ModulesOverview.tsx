import React, { useState, useMemo } from 'react';
import {
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    Box,
    Globe,
    FileText,
    Zap,
    Shield,
    Mail,
    ChevronRight,
    Target,
    Activity,
    Layout,
    Power,
    BarChart3,
    Users,
    Truck,
    Brain,
    Package,
    Database,
    LineChart,
    Lightbulb,
    UserCheck,
    Lock,
    Globe2,
    Repeat,
    Settings,
    ShieldCheck,
    Bell,
    Archive,
    Trash2,
    RotateCcw,
    Cpu,
    Smartphone,
    UserPlus,
    Building2,
    Sparkles,
    Sword,
    Castle,
    Plug,
    Link as LinkIcon,
    Database as DbIcon,
    AlertTriangle,
    FlaskConical,
    Network,
    Terminal
} from 'lucide-react';

interface ModuleFunction {
    id: string;
    name: string;
    description: string;
    status: 'operativan' | 'nije operativan' | 'u toku' | 'ideja' | 'mock';
    percentage: number;
    remaining: string;
    isMock?: boolean;
}

interface ModuleInfo {
    id: string;
    name: string;
    icon: React.ElementType;
    purpose: string;
    functions: ModuleFunction[];
}

const MODULES_DATA: ModuleInfo[] = [
    {
        id: 'api-agent-core',
        name: 'API GATEWAY',
        icon: Network,
        purpose: 'Inteligentni sloj koji pretvara sve eksterne API-je u jedan unificirani GraphQL/Rest interfejs sa SQL filtriranjem.',
        functions: [
            { id: 'agent-1', name: 'Schema Introspection', description: 'Automatsko čitanje strukture eksternih API-ja.', status: 'u toku', percentage: 60, remaining: 'Mapiranje svih provajdera (Amadeus, Solvex) u Agoda Core.' },
            { id: 'agent-2', name: 'Declarative Result Mapping', description: 'Prebacivanje različitih JSON formata u jedan standard.', status: 'operativan', percentage: 100, remaining: 'Sve funkcionalnosti su aktivne.' },
            { id: 'agent-3', name: 'SQL Post-Processing', description: 'Mogućnost filtriranja i sortiranja podataka koji API nativno ne podržava.', status: 'u toku', percentage: 40, remaining: 'Implementacija DuckDB sloja za brzu analizu rezultata.' },
            { id: 'agent-4', name: 'Natural Language Querying', description: 'Pretraga API-ja upitima na običnom jeziku preko LLM-a.', status: 'ideja', percentage: 15, remaining: 'Povezivanje sa Master Orchestrator-om za automatske upite.' }
        ]
    },
    {
        id: 'smart-search',
        name: 'Smart Search (Global Hub)',
        icon: Sparkles,
        purpose: 'Centralni prodajni agregator za pretragu i preporuku smeštaja sa AI asistencijom.',
        functions: [
            { id: '1-1', name: 'Hotel Search Core', description: 'Pretraga hotela preko ORS, Solvex i TCT.', status: 'operativan', percentage: 100, remaining: 'Sve funkcionalnosti su aktivne.' },
            { id: '1-2', name: 'Flight Search', description: 'Pretraga letova. Koristi fallback na Mock ako nema live rezultata.', status: 'u toku', percentage: 90, remaining: 'Integracija sa realnim Amadeus i Kyte API-jem.', isMock: true },
            { id: '1-3', name: 'Dynamic Package Search', description: 'Automatsko pakovanje hotela i leta. Trenutno na Mock podacima.', status: 'mock', percentage: 30, remaining: 'Povezivanje realne pretrage hotela i leta u jedan tok.', isMock: true }
        ]
    },
    {
        id: 'api-connectivity',
        name: 'API Connectivity Audit',
        icon: Plug,
        purpose: 'Status realnih konekcija sa eksternim dobavljačima i identifikacija MOCK podataka.',
        functions: [
            { id: 'api-1', name: 'ORS REST API', description: 'Direktna konekcija za hotele i pakete.', status: 'operativan', percentage: 100, remaining: 'Konekcija je LIVE i testirana.' },
            { id: 'api-2', name: 'Solvex (Master-Interlook)', description: 'SOAP Bridge Konekcija za Bugarsku i Grčku.', status: 'operativan', percentage: 95, remaining: 'LIVE. Napomena: Slike hotela su trenutno MOCK (hardcoded).', isMock: true },
            { id: 'api-3', name: 'TCT API', description: 'Konekcija za TCT bazu podataka.', status: 'mock', percentage: 10, remaining: 'FORCE MOCK mod aktiviran dok se ne završi B2B konfiguracija.', isMock: true },
            { id: 'api-4', name: 'OpenGreece API', description: 'Direktna veza sa grčkim dobavljačima.', status: 'operativan', percentage: 100, remaining: 'Konekcija je LIVE.' },
            { id: 'api-5', name: 'Amadeus / Kyte', description: 'API protokoli za letove.', status: 'ideja', percentage: 40, remaining: 'Inicijalni adapteri spremni, čeka se API Key produkcija.' }
        ]
    },
    {
        id: 'res-architect',
        name: 'Reservation Architect',
        icon: FileText,
        purpose: 'Sistem za upravljanje dosijeima, procesuiranje rezervacija i generisanje putne dokumentacije.',
        functions: [
            { id: '2-1', name: 'Dossier Core Engine', description: 'Inicijalizacija i praćenje životnog ciklusa rezrvacije.', status: 'operativan', percentage: 100, remaining: 'Sve funkcionalnosti su aktivne.' },
            { id: '2-2', name: 'Smart Incrementer', description: 'Inteligentno generisanje sekvencijalnih brojeva dosijea.', status: 'operativan', percentage: 100, remaining: 'Sve funkcionalnosti su aktivne.' },
            { id: '2-3', name: 'Travel Document Gen', description: 'Automatsko PDF/HTML generisanje vaučera i ugovora.', status: 'operativan', percentage: 100, remaining: 'Sve funkcionalnosti su aktivne.' }
        ]
    },
    {
        id: 'mars-analysis',
        name: 'Mars ERP Analitika',
        icon: LineChart,
        purpose: 'Finansijski mozak sistema za analizu profitabilnosti i tržišnih kretanja.',
        functions: [
            { id: '4-1', name: 'Live Market Analytics', description: 'Trenutni pregled najtraženijih stavki.', status: 'operativan', percentage: 100, remaining: 'Sve funkcionalnosti su aktivne.' },
            { id: '4-2', name: 'Sales Prediction AI', description: 'Predviđanje prodaje na osnovu istorijskih podataka.', status: 'operativan', percentage: 100, remaining: 'Sve funkcionalnosti su aktivne.' }
        ]
    },
    {
        id: 'security-fortress',
        name: 'The Fortress Security',
        icon: Shield,
        purpose: 'Nadzorni centar za monitoring, bezbednost i duboku arhivu podataka.',
        functions: [
            { id: '10-1', name: 'Sentinel Logging', description: 'Real-time sistemski logovi.', status: 'operativan', percentage: 100, remaining: 'Sve funkcionalnosti su aktivne.' },
            { id: '10-3', name: 'Deep Archive', description: 'Registar svih obrisanih stavki.', status: 'operativan', percentage: 100, remaining: 'Sve funkcionalnosti su aktivne.' }
        ]
    },
    {
        id: 'system-settings',
        name: 'Sistemska Podešavanja (Core)',
        icon: Settings,
        purpose: 'Centralna konfiguracija sistema i monitoring resursa.',
        functions: [
            { id: '11-1', name: 'Active Connections', description: 'Upravljanje svim API endpointima.', status: 'operativan', percentage: 100, remaining: 'Sve funkcionalnosti su aktivne.' },
            { id: '11-2', name: 'AI Quota Dashboard', description: 'Kontrola potrošnje AI resursa.', status: 'operativan', percentage: 100, remaining: 'Sve funkcionalnosti su aktivne.' }
        ]
    }
];

const ModulesOverview: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [activeModules, setActiveModules] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        MODULES_DATA.forEach(m => initial[m.id] = true);
        return initial;
    });

    const toggleModule = (id: string) => {
        setActiveModules(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const filteredModules = useMemo(() => {
        return MODULES_DATA.map(module => {
            const matchesModule = module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                module.purpose.toLowerCase().includes(searchQuery.toLowerCase());

            let matchedFunctions = module.functions.filter(fn =>
                fn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fn.description.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (statusFilter !== 'all') {
                if (statusFilter === 'mock') {
                    matchedFunctions = matchedFunctions.filter(fn => fn.isMock);
                } else {
                    matchedFunctions = matchedFunctions.filter(fn => fn.status === statusFilter);
                }
            }

            if ((matchesModule || matchedFunctions.length > 0) && (statusFilter === 'all' || matchedFunctions.length > 0)) {
                return { ...module, functions: matchedFunctions.length > 0 ? matchedFunctions : module.functions };
            }
            return null;
        }).filter(m => m !== null) as ModuleInfo[];
    }, [searchQuery, statusFilter]);

    const getModuleOverallStatus = (functions: ModuleFunction[]) => {
        const allOperativan = functions.every(f => f.status === 'operativan' || f.percentage === 100);
        return allOperativan ? 'operativan' : 'u toku';
    };

    const getStatusStyles = (status: string, isMock?: boolean) => {
        if (isMock) {
            return {
                bg: 'rgba(249, 115, 22, 0.1)',
                color: '#fb923c',
                border: 'rgba(249, 115, 22, 0.2)',
                icon: <FlaskConical size={14} />
            };
        }
        switch (status) {
            case 'operativan':
                return { bg: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.2)', icon: <CheckCircle2 size={14} /> };
            case 'nije operativan':
                return { bg: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'rgba(239, 68, 68, 0.2)', icon: <AlertCircle size={14} /> };
            case 'mock':
                return { bg: 'rgba(249, 115, 22, 0.1)', color: '#fb923c', border: 'rgba(249, 115, 22, 0.2)', icon: <FlaskConical size={14} /> };
            case 'ideja':
                return { bg: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.2)', icon: <Lightbulb size={14} /> };
            default:
                return { bg: 'rgba(234, 179, 8, 0.1)', color: '#facc15', border: 'rgba(234, 179, 8, 0.2)', icon: <Clock size={14} /> };
        }
    };

    const stats = [
        { label: 'SVI', value: 'all', icon: <ChevronRight size={14} /> },
        { label: 'LIVE / OPERATIVAN', value: 'operativan', color: '#4ade80' },
        { label: 'U TOKU', value: 'u toku', color: '#facc15' },
        { label: 'MOCK PODACI', value: 'mock', color: '#fb923c' },
        { label: 'IDEJA', value: 'ideja', color: '#c084fc' }
    ];

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out', paddingBottom: '100px' }}>
            {/* Header Area */}
            <div style={{
                background: 'rgba(30, 41, 59, 0.6)',
                padding: '30px',
                borderRadius: '32px',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(30px)',
                marginBottom: '40px',
                position: 'sticky',
                top: '0',
                zIndex: 10,
                boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: '28px', fontWeight: 900, margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>Data Source & API Audit</h2>
                        <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '14px' }}>Monitoring realnih konekcija i integracija Vajckin API Agenta.</p>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input
                            type="text"
                            placeholder="Traži API ili proces..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: '14px 16px 14px 48px',
                                width: '400px',
                                background: '#020617',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '18px',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.3s'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {stats.map(s => (
                        <button
                            key={s.value}
                            onClick={() => setStatusFilter(s.value)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 18px',
                                borderRadius: '14px',
                                background: statusFilter === s.value ? (s.color ? `${s.color}22` : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${statusFilter === s.value ? (s.color || '#fff') : 'rgba(255,255,255,0.05)'}`,
                                color: statusFilter === s.value ? (s.color || '#fff') : '#64748b',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textTransform: 'uppercase'
                            }}
                        >
                            {statusFilter === s.value ? <CheckCircle2 size={14} /> : (s.icon || <Activity size={14} />)}
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                {filteredModules.map(module => {
                    const moduleStatus = getModuleOverallStatus(module.functions);
                    const modStyles = getStatusStyles(moduleStatus);
                    const isActive = activeModules[module.id];

                    return (
                        <div key={module.id} style={{
                            background: isActive ? 'rgba(30, 41, 59, 0.4)' : 'rgba(239, 68, 68, 0.05)',
                            borderRadius: '28px',
                            border: `1px solid ${isActive ? 'rgba(255,255,255,0.08)' : 'rgba(239, 68, 68, 0.2)'}`,
                            padding: '32px',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: isActive ? '0 20px 40px rgba(0,0,0,0.3)' : '0 10px 20px rgba(239, 68, 68, 0.1)',
                            opacity: isActive ? 1 : 0.8
                        }}>
                            <div style={{ display: 'flex', gap: '28px', marginBottom: '32px' }}>
                                <div style={{
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '22px',
                                    background: isActive ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#334155',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    boxShadow: isActive ? '0 10px 20px rgba(37, 99, 235, 0.4)' : 'none'
                                }}>
                                    <module.icon size={36} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <h3 style={{ fontSize: '24px', fontWeight: 900, margin: 0, color: isActive ? '#fff' : '#ef4444' }}>{module.name}</h3>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                background: modStyles.bg,
                                                color: modStyles.color,
                                                border: `1px solid ${modStyles.border}`,
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                textTransform: 'uppercase'
                                            }}>
                                                {modStyles.icon} {moduleStatus}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => toggleModule(module.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 20px',
                                                borderRadius: '14px',
                                                background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                border: `1px solid ${isActive ? '#22c55e' : '#ef4444'}`,
                                                color: isActive ? '#4ade80' : '#f87171',
                                                fontSize: '13px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            <Power size={16} />
                                            {isActive ? 'AKTIVAN' : 'DEAKTIVIRAN'}
                                        </button>
                                    </div>
                                    <p style={{ color: '#94a3b8', fontSize: '15px', marginTop: '10px', lineHeight: 1.6, maxWidth: '900px' }}>
                                        {module.purpose}
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(2, 6, 23, 0.5)',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.07)',
                                filter: isActive ? 'none' : 'grayscale(1) opacity(0.5)',
                                pointerEvents: isActive ? 'auto' : 'none'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '18px 24px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Funkcija / API</th>
                                            <th style={{ textAlign: 'left', padding: '18px 24px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                                            <th style={{ textAlign: 'left', padding: '18px 24px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Progres Integracije</th>
                                            <th style={{ textAlign: 'left', padding: '18px 24px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Preostali Rad / Napomena</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {module.functions.map((fn) => {
                                            const fnStyles = getStatusStyles(fn.status, fn.isMock);
                                            return (
                                                <tr key={fn.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                                                    <td style={{ padding: '24px' }}>
                                                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {fn.isMock && <FlaskConical size={14} style={{ color: '#fb923c' }} />}
                                                            {fn.name}
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>{fn.description}</div>
                                                    </td>
                                                    <td style={{ padding: '24px' }}>
                                                        <div style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '6px 12px',
                                                            borderRadius: '8px',
                                                            background: fnStyles.bg,
                                                            color: fnStyles.color,
                                                            fontSize: '11px',
                                                            fontWeight: 800,
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {fnStyles.icon} {fn.status === 'mock' ? 'MOCK PODACI' : fn.status}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                            <div style={{ flex: 1, minWidth: '100px', height: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
                                                                <div style={{
                                                                    width: `${fn.percentage}%`,
                                                                    height: '100%',
                                                                    background: fn.isMock ? 'linear-gradient(90deg, #f97316, #fb923c)' : (fn.percentage === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #3b82f6, #60a5fa)'),
                                                                    transition: 'width 1.2s cubic-bezier(0.165, 0.84, 0.44, 1)'
                                                                }}></div>
                                                            </div>
                                                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', width: '40px' }}>{fn.percentage}%</span>
                                                        </div>
                                                        {fn.isMock && <div style={{ fontSize: '10px', color: '#fb923c', marginTop: '4px', fontWeight: 600 }}>ZAHTEVA ZAMENU REALNIM API-JEM</div>}
                                                    </td>
                                                    <td style={{ padding: '24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#94a3b8', fontSize: '14px', lineHeight: 1.5 }}>
                                                            {fn.status === 'ideja' ? (
                                                                <Lightbulb size={16} style={{ color: '#c084fc', marginTop: '2px', flexShrink: 0 }} />
                                                            ) : (
                                                                fn.isMock ? (
                                                                    <AlertTriangle size={16} style={{ color: '#fb923c', marginTop: '2px', flexShrink: 0 }} />
                                                                ) : (
                                                                    fn.percentage === 100 ?
                                                                        <Target size={16} style={{ color: '#22c55e', marginTop: '2px', flexShrink: 0 }} /> :
                                                                        <Activity size={16} style={{ color: '#3b82f6', marginTop: '2px', flexShrink: 0 }} />
                                                                )
                                                            )}
                                                            {fn.remaining}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                tr:hover {
                    background: rgba(255,255,255,0.03) !important;
                }
            `}</style>
        </div>
    );
};

export default ModulesOverview;
