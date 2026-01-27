import { useState, useEffect, useRef } from 'react';
import {
    Castle,
    Activity,
    Lock,
    ShieldCheck,
    Terminal,
    Send,
    ArrowLeft,
    RefreshCcw,
    Database,
    Globe,
    Cpu,
    Handshake,
    History,
    LayoutDashboard,
    AlertTriangle,
    Shield,
    Eye,
    Ban,
    CheckCircle,
    XCircle,
    Zap,
    TrendingUp,
    Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeometricBrain } from '../../components/icons/GeometricBrain';
import { saveToCloud, loadFromCloud } from '../../utils/storageUtils';
import { useSecurity } from '../../hooks/useSecurity';
import { useFortressStore } from '../../stores/fortressStore';
import { securityDefense } from '../../services/securityDefenseService';

interface SecurityMetric {
    label: string;
    value: string | number;
    status: 'good' | 'warning' | 'critical';
    icon: React.ReactNode;
}

interface SecurityLog {
    id: string;
    timestamp: string;
    event: string;
    type: 'auth' | 'system' | 'api' | 'threat';
    severity: 'low' | 'medium' | 'high';
}

interface Props {
    onBack: () => void;
}

export default function Fortress({ onBack }: Props) {
    const { isAnomalyDetected, ipStatus, trackAction } = useSecurity();
    const {
        attackLogs,
        metrics: fortressMetrics,
        alerts,
        isMonitoring,
        addAlert,
        clearAlerts,
        startMonitoring,
        stopMonitoring
    } = useFortressStore();

    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [messages, setMessages] = useState<{ role: 'master' | 'ai', text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [view, setView] = useState<'monitor' | 'archive' | 'attacks' | 'recommendations'>('monitor');
    const [archiveSearch, setArchiveSearch] = useState('');
    const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<number[]>([]);
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const hashtags = ['#api', '#PII', '#GDPR', '#security', '#audit', '#stability', '#encryption'];

    // Load data from Cloud
    useEffect(() => {
        const loadFortressData = async () => {
            const { data: d1 } = await loadFromCloud('fortress_logs');
            if (d1 && d1.length > 0) setLogs(d1 as SecurityLog[]);
            else {
                setLogs([
                    { id: '1', timestamp: new Date().toLocaleTimeString(), event: 'Konekcija sa Bankovnim Gateway-om stabilna.', type: 'api', severity: 'low' },
                    { id: '2', timestamp: new Date().toLocaleTimeString(), event: 'Pokušaj pristupa Arhivi sa nivoa 2 blokiran.', type: 'auth', severity: 'medium' },
                    { id: '3', timestamp: new Date().toLocaleTimeString(), event: 'AI Integrity Monitor: Svi sistemi u balansu.', type: 'threat', severity: 'low' },
                    { id: '4', timestamp: new Date().toLocaleTimeString(), event: `IP Verifikacija uspešna (${ipStatus.ip})`, type: 'system', severity: 'low' },
                    { id: '5', timestamp: new Date().toLocaleTimeString(), event: 'Synchronizacija sa 14 B2B partnera uspešna.', type: 'api', severity: 'low' },
                ]);
            }

            const { data: d2 } = await loadFromCloud('sentinel_messages');
            if (d2 && d2.length > 0) setMessages(d2 as any[]);
            else {
                setMessages([
                    { role: 'ai', text: 'Sentinel Online. Acting as Senior #security Architect & #audit Expert. Dashboard calibrated for Travel Tech protocols.' },
                    { role: 'master', text: 'Analiziraj #api #security i #PII zaštitu.' },
                    { role: 'ai', text: 'Audit initialized. Identifying #PII fields... Implementing AES-256 for Names/Passports.' },
                    { role: 'master', text: 'Koji je #GDPR protokol za arhiviranje?' },
                    { role: 'ai', text: 'Confirmed. #GDPR Policy: 90-DAY DEEP ARCHIVE with Level 6 #encryption active.' }
                ]);
            }
        };
        loadFortressData();
    }, [ipStatus.ip]);

    // Load security recommendations
    useEffect(() => {
        const recs = securityDefense.getSecurityRecommendations();
        setRecommendations(recs);
    }, [attackLogs]);

    // Sync to Cloud
    useEffect(() => {
        if (logs.length > 0) saveToCloud('fortress_logs', logs);
    }, [logs]);

    useEffect(() => {
        if (messages.length > 0) saveToCloud('sentinel_messages', messages.map((m, i) => ({ ...m, id: `msg_${i}` })));
    }, [messages]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!chatInput.trim()) return;
        setMessages(prev => [...prev, { role: 'master', text: chatInput }]);
        trackAction(`sentinel_query: ${chatInput}`);
        setChatInput('');
        setIsThinking(true);

        // Context-aware simulation
        setTimeout(() => {
            const input = chatInput.toLowerCase();
            let response = "";

            if (input.includes('bris') || input.includes('delete') || input.includes('pii')) {
                response = "PROTOCOL UPDATE: Funkcija brisanja #PII podataka je ONEMOGUĆENA. Podaci se čuvaju u Deep Vault-u (#encryption Level 6).";
            } else if (input.includes('status') || input.includes('sistem')) {
                response = "Sistemski izveštaj: Svi #api kanali stabilni. Deep Archive monitoring online.";
            } else if (input.includes('export') || input.includes('anomal')) {
                response = isAnomalyDetected
                    ? "ALERT: Detektovana anomalija u izvozu podataka! Bulk Export protokol aktiviran. Pristup je PRIVREMENO ZAKLJUČAN."
                    : "Anomaly Monitor: Bulk Export aktivnost u granicama normale. Nema detektovanih pretnji.";
            } else {
                const responses = [
                    "Security Status: Idempotency-Key logika aktivna. #security",
                    "Audit Report: #PII podaci maskirani u logovima. #audit",
                    "Stability Check: #stability nominalna. #api",
                    "GDPR Integrity: Deep Vault #encryption aktivna. #GDPR"
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }

            setMessages(prev => [...prev, { role: 'ai', text: response }]);
            setIsThinking(false);
        }, 1500);
    };

    const metrics: SecurityMetric[] = [
        { label: 'Attacks Blocked', value: fortressMetrics.totalAttacksBlocked, status: 'good', icon: <Shield size={20} /> },
        { label: 'Last 24h', value: fortressMetrics.attacksLast24h, status: fortressMetrics.attacksLast24h > 50 ? 'warning' : 'good', icon: <TrendingUp size={20} /> },
        { label: 'Critical Threats', value: fortressMetrics.criticalThreats, status: fortressMetrics.criticalThreats > 0 ? 'critical' : 'good', icon: <AlertTriangle size={20} /> },
        { label: 'System Health', value: fortressMetrics.systemHealth.toUpperCase(), status: fortressMetrics.systemHealth === 'excellent' || fortressMetrics.systemHealth === 'good' ? 'good' : fortressMetrics.systemHealth === 'warning' ? 'warning' : 'critical', icon: <Activity size={20} /> },
        { label: 'AI Anomaly Monitor', value: isAnomalyDetected ? 'DETECTED' : 'NORMAL', status: isAnomalyDetected ? 'critical' : 'good', icon: <Cpu size={20} /> },
        { label: 'IP Whitelist', value: ipStatus.isWhitelisted ? 'VERIFIED' : 'OUTSIDER', status: ipStatus.isWhitelisted ? 'good' : 'warning', icon: <Globe size={20} /> },
        { label: 'API Guardian', value: 'ENCRYPTED', status: 'good', icon: <Lock size={20} /> },
        { label: 'GDPR Compliance', value: '100%', status: 'good', icon: <ShieldCheck size={20} /> }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                height: '100%',
                display: 'grid',
                gridTemplateColumns: '1fr 400px',
                gap: '25px',
                maxWidth: '1500px',
                padding: '24px',
                margin: '0 auto'
            }}
        >
            {/* Left Side: Monitoring Dashboard OR Archive History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: 'var(--gradient-purple)', padding: '12px', borderRadius: '16px' }}>
                            <Castle size={28} color="#fff" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: '800' }}>{view === 'monitor' ? 'FORTRESS' : 'SENTINEL ARCHIVE'}</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{view === 'monitor' ? 'Bezbednosni Command Center' : 'Istorija bezbednosnih sesija'}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {view === 'archive' && (
                            <button onClick={() => setView('monitor')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                <LayoutDashboard size={16} /> Dashboard
                            </button>
                        )}
                        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                            <ArrowLeft size={16} /> Nazad
                        </button>
                    </div>
                </div>

                {view === 'monitor' ? (
                    <>
                        {/* Live Metrics Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                            {metrics.map((m, i) => (
                                <div key={i} style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: m.status === 'good' ? '#22c55e' : m.status === 'warning' ? '#f59e0b' : '#ef4444' }}></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', color: 'var(--text-secondary)' }}>
                                        {m.icon} <span style={{ fontSize: '12px', fontWeight: 600 }}>{m.label}</span>
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: '800' }}>{m.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Main Visualizer: System Core Status */}
                        <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: '32px', border: '1px solid var(--border)', padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}><Activity size={20} className="text-accent" /> Monitoring Vitalnih Sistema</h3>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ padding: '6px 12px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '20px', color: '#22c55e', fontSize: '10px', fontWeight: 700 }}>AI WATCHDOG: AKTIVAN</div>
                                    <div style={{ padding: '6px 12px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '20px', color: '#22c55e', fontSize: '10px', fontWeight: 700 }}>FIREWALL: ON</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', flex: '0 0 auto' }}>
                                <div className="system-orb" style={{ background: 'var(--bg-main)', borderRadius: '24px', border: '1px solid var(--border)', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                                    <Database size={40} color="var(--accent)" />
                                    <div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Centralna Baza</h4>
                                        <p style={{ fontSize: '11px', color: '#22c55e' }}>ENKRIPTOVANO</p>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: '#22c55e', borderRadius: '10px' }}></div>
                                </div>
                                <div className="system-orb" style={{ background: 'var(--bg-main)', borderRadius: '24px', border: '1px solid var(--border)', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                                    <Globe size={40} color="var(--accent)" />
                                    <div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Bankovni Gateway</h4>
                                        <p style={{ fontSize: '11px', color: '#22c55e' }}>SECURE</p>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: '#22c55e', borderRadius: '10px' }}></div>
                                </div>
                                <div className="system-orb" style={{ background: 'var(--bg-main)', borderRadius: '24px', border: '1px solid var(--border)', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                                    <Cpu size={40} color="var(--accent)" />
                                    <div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 700 }}>CIS / e-Turista</h4>
                                        <p style={{ fontSize: '11px', color: '#f59e0b' }}>WAITING AUTH</p>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: '#f59e0b', borderRadius: '10px' }}></div>
                                </div>
                                <div className="system-orb" style={{ background: 'var(--bg-main)', borderRadius: '24px', border: '1px solid var(--border)', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                                    <Handshake size={40} color="var(--accent)" />
                                    <div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 700 }}>B2B & Partneri</h4>
                                        <p style={{ fontSize: '11px', color: '#22c55e' }}>ENCRYPTED SYNC</p>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: '#22c55e', borderRadius: '10px' }}></div>
                                </div>
                            </div>

                            {/* Threat Logs */}
                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: 'var(--text-secondary)' }}>
                                    <Terminal size={18} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>LIVE SECURITY LOGS</span>
                                </div>
                                <div style={{ background: 'var(--bg-main)', borderRadius: '16px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                                    {logs.map(log => (
                                        <div key={log.id} style={{ display: 'flex', gap: '15px', fontSize: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>[{log.timestamp}]</span>
                                            <span style={{ fontWeight: 700, color: log.severity === 'medium' ? '#f59e0b' : 'inherit' }}>{log.type.toUpperCase()}:</span>
                                            <span style={{ opacity: 0.8 }}>{log.event}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* ARCHIVE VIEW - ENHANCED */
                    <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: '32px', border: '1px solid var(--border)', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <History size={20} className="text-accent" />
                                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Sentinel Audit Arhiva</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => { setArchiveSearch(''); setActiveHashtag(null); }}
                                    style={{ fontSize: '11px', background: 'transparent', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                >
                                    Prikaži sve poruke
                                </button>
                            </div>
                        </div>

                        {/* Search & Hashtags */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={archiveSearch}
                                    onChange={(e) => setArchiveSearch(e.target.value)}
                                    placeholder="Pretraga po ključnim rečima (npr. 'kripto', 'inspekcija')..."
                                    style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px 15px', borderRadius: '14px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {hashtags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setActiveHashtag(tag === activeHashtag ? null : tag)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '10px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            transition: '0.2s',
                                            background: activeHashtag === tag ? 'var(--accent)' : 'rgba(0, 92, 197, 0.1)',
                                            color: activeHashtag === tag ? '#fff' : 'var(--accent)',
                                            border: 'none'
                                        }}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
                            {messages
                                .map((m, idx) => ({ ...m, originalIndex: idx }))
                                .filter(m => {
                                    if (m.role !== 'ai') return false;
                                    const prevMessage = messages[m.originalIndex - 1];
                                    const combinedText = (prevMessage?.text || '') + ' ' + m.text;

                                    const matchesSearch = archiveSearch
                                        ? combinedText.toLowerCase().includes(archiveSearch.toLowerCase())
                                        : true;

                                    const matchesHashtag = activeHashtag
                                        ? combinedText.includes(activeHashtag)
                                        : true;

                                    return matchesSearch && matchesHashtag;
                                })
                                .reverse() /* LATEST FIRST */
                                .map((m) => (
                                    <motion.div
                                        key={m.originalIndex}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{ padding: '20px', background: 'var(--bg-main)', borderRadius: '24px', border: '1px solid var(--border)', position: 'relative' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                            <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>Sentinel Odgovor</div>
                                            <button
                                                onClick={() => {
                                                    setExpandedIds(prev => prev.includes(m.originalIndex) ? prev.filter(id => id !== m.originalIndex) : [...prev, m.originalIndex]);
                                                }}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                {expandedIds.includes(m.originalIndex) ? 'Sakrij pitanje' : 'Prikaži pitanje Mastera'}
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {expandedIds.includes(m.originalIndex) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    style={{ overflow: 'hidden', padding: '10px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', marginBottom: '15px', borderLeft: '3px solid var(--accent)', fontSize: '12px', color: 'var(--text-secondary)' }}
                                                >
                                                    {messages[m.originalIndex - 1]?.text || 'Sistemski inicijalizovano'}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6' }}>{m.text}</div>
                                    </motion.div>
                                ))}
                            {messages.filter(m => m.role === 'ai').length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Nema arhiviranih odgovora koji odgovaraju kriterijumima.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Side: Sentinel AI Chat (Persistent and Scrollable) */}
            <div style={{ height: 'calc(100vh - 150px)', background: 'var(--bg-card)', borderRadius: '32px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <div style={{ background: 'var(--gradient-purple)', padding: '20px', color: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <GeometricBrain size={48} color="#FFD700" />
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Sentinel AI</h3>
                                <p style={{ fontSize: '10px', opacity: 0.8 }}>{isThinking ? 'Analizira protokol...' : 'Spreman za audit'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setView(view === 'monitor' ? 'archive' : 'monitor')}
                            title="Arhiva Razgovora"
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            <History size={16} /> <span style={{ fontSize: '10px', fontWeight: 700 }}>ARHIVA</span>
                        </button>
                    </div>
                </div>

                <div
                    style={{
                        flex: 1,
                        padding: '20px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'var(--accent) transparent'
                    }}
                >
                    <AnimatePresence>
                        {messages.map((m, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: m.role === 'master' ? 20 : -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{
                                    alignSelf: m.role === 'master' ? 'flex-end' : 'flex-start',
                                    background: m.role === 'master' ? 'var(--accent)' : 'var(--bg-sidebar)',
                                    color: m.role === 'master' ? '#fff' : 'var(--text-primary)',
                                    padding: '12px 16px',
                                    borderRadius: '18px',
                                    border: '1px solid var(--border)',
                                    maxWidth: '90%',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    position: 'relative',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                }}
                            >
                                {m.text}
                            </motion.div>
                        ))}
                        {isThinking && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <RefreshCcw size={14} className="spin" /> Sentinel vrši bezbednosni audit...
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={chatEndRef} />
                </div>

                <div style={{ padding: '20px', background: 'var(--bg-sidebar)', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Komanda za Sentinela..."
                            style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                        />
                        <button onClick={handleSend} style={{ background: 'var(--gradient-purple)', border: 'none', borderRadius: '12px', padding: '12px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .spin { animation: spin 2s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .system-orb:hover { border-color: var(--accent) !important; transform: translateY(-5px); transition: 0.3s; }
            `}</style>
        </motion.div>
    );
}
