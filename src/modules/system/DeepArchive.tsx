import { useState, useEffect } from 'react';
import {
    ShieldAlert,
    Search,
    Download,
    Database,
    User as UserIcon,
    History,
    RefreshCcw,
    Trash2,
    Layout,
    FileJson,
    LogOut
} from 'lucide-react';
import { GeometricBrain } from '../../components/icons/GeometricBrain';
import { motion, AnimatePresence } from 'framer-motion';
import { restoreItem } from '../../utils/storageUtils';

interface ArchiveItem {
    id: string;
    type: 'DELETE' | 'UPDATE';
    entityType: 'User' | 'Reservation' | 'Payment' | 'Hotel' | 'Supplier' | 'Customer';
    entityId: string;
    oldData: any;
    newData?: any;
    changedBy: string;
    userEmail: string;
    timestamp: string; // YYYY-MM-DD HH:mm:ss
    summary: string;
}

interface Props {
    onBack: () => void;
    lang: 'sr' | 'en';
}

export default function DeepArchive({ onBack }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'DELETE' | 'UPDATE'>('ALL');
    const [items, setItems] = useState<ArchiveItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);

    // Initial dummy data for the Deep Archive
    // Load real archive data
    useEffect(() => {
        const loadArchive = async () => {
            // 1. Try Local Storage first
            try {
                const localData = localStorage.getItem('olympic_deep_archive');
                if (localData) {
                    setItems(JSON.parse(localData));
                }
            } catch (e) {
                console.error("Archive Load Error:", e);
            }

            // 2. TODO: Implement Cloud Sync loading here
        };
        loadArchive();
    }, []);

    const filteredItems = items.filter(item => {
        const matchesSearch = item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.changedBy.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filter === 'ALL' || item.type === filter;
        return matchesSearch && matchesType;
    });

    const isOlderThanYear = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        return date < oneYearAgo;
    };

    const filters = [
        { id: 'ALL', title: 'Sve Promene', icon: <Layout size={18} /> },
        { id: 'DELETE', title: 'Obrisano', icon: <Trash2 size={18} /> },
        { id: 'UPDATE', title: 'Izmenjeno', icon: <RefreshCcw size={18} /> }
    ];

    return (
        <div className="wizard-overlay">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="wizard-container"
            >
                {/* SIDEBAR NAVIGATION */}
                <div className="wizard-sidebar">
                    <div className="wizard-sidebar-header">
                        <div style={{ background: 'var(--gradient-blue)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldAlert size={18} color="#fff" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: '800' }}>ARCHIVE</h2>
                            <div style={{ fontSize: '9px', color: 'var(--accent)', fontWeight: 800 }}>Master Audit Log</div>
                        </div>
                    </div>

                    <div className="wizard-steps-list">
                        {filters.map((f) => (
                            <div
                                key={f.id}
                                className={`step-item-row ${filter === f.id ? 'active' : ''}`}
                                onClick={() => setFilter(f.id as any)}
                            >
                                <div className="step-icon-small">
                                    {f.icon}
                                </div>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</span>
                                <span style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 6px', borderRadius: '100px', background: 'var(--border)', color: 'var(--text-secondary)' }}>
                                    {items.filter(i => f.id === 'ALL' || i.type === f.id).length}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="wizard-sidebar-footer" style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '15px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }}></div>
                                Zero Trust Active
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                                <span>• RBAC Verifikacija: OK</span>
                                <span>• Audit Trail: Immutable</span>
                                <span>• Encryption: AES-256</span>
                            </div>
                        </div>

                        <button
                            onClick={onBack}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                padding: '14px 20px',
                                borderRadius: '12px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 600,
                                width: '100%',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--accent)';
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.borderColor = 'var(--accent)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                            }}
                        >
                            <LogOut size={16} style={{ transform: 'rotate(180deg)' }} />
                            Nazad u Podešavanja
                        </button>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="wizard-main-area">
                    {/* TOPBAR */}
                    <div className="wizard-topbar">
                        <div className="topbar-title">
                            <h3>{filters.find(f => f.id === filter)?.title}</h3>
                            <span className="topbar-subtitle">
                                {filteredItems.length} zapisa • Poslednji unos: {items[0]?.timestamp.split(' ')[0]}
                            </span>
                        </div>
                        <div className="topbar-actions">
                            <div className="topbar-search">
                                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={16} />
                                <input
                                    type="text"
                                    placeholder="Pretraži arhivu..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '100px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }}
                                />
                            </div>
                            <button
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'var(--accent)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '100px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <Download size={16} /><span className="btn-text">Export</span>
                            </button>
                            <button
                                onClick={onBack}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    padding: '8px 16px',
                                    borderRadius: '100px',
                                    cursor: 'pointer',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <LogOut size={16} /><span className="btn-text">Exit</span>
                            </button>
                        </div>
                    </div>

                    {/* SCROLLABLE CONTENT */}
                    <div className="wizard-content-wrapper" style={{ padding: '0' }}>
                        <div className="archive-grid">
                            {/* Left Panel: Table */}
                            <div className="archive-table-panel">
                                {items.some(i => isOlderThanYear(i.timestamp)) && (
                                    <div style={{ background: 'rgba(52, 152, 219, 0.1)', border: '1px solid var(--accent)', padding: '15px 20px', borderRadius: '16px', display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                                        <GeometricBrain size={24} color="#FFD700" />
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontSize: '14px', fontWeight: '700' }}>AI Savetnik za Retenciju Podataka</h4>
                                            <p style={{ fontSize: '12px', opacity: 0.8 }}>Pronašao sam podatke starije od godinu dana. Preporučujem eksport na lokalni disk.</p>
                                        </div>
                                    </div>
                                )}

                                <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                        <thead style={{ background: 'var(--bg-sidebar)' }}>
                                            <tr>
                                                <th style={{ textAlign: 'left', padding: '15px 20px', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Entitet</th>
                                                <th style={{ textAlign: 'left', padding: '15px 20px', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Akcija / Opis</th>
                                                <th style={{ textAlign: 'right', padding: '15px 20px', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Vreme</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredItems.map(item => (
                                                <tr
                                                    key={item.id}
                                                    onClick={() => setSelectedItem(item)}
                                                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selectedItem?.id === item.id ? 'var(--accent-glow)' : 'transparent', transition: '0.2s' }}
                                                >
                                                    <td style={{ padding: '15px 20px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{ background: item.type === 'DELETE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 152, 219, 0.1)', color: item.type === 'DELETE' ? '#ef4444' : 'var(--accent)', padding: '6px', borderRadius: '8px' }}>
                                                                {item.type === 'DELETE' ? <Trash2 size={16} /> : <RefreshCcw size={16} />}
                                                            </div>
                                                            <span style={{ fontWeight: 600 }}>{item.entityType}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '15px 20px' }}>
                                                        <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{item.summary}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <UserIcon size={10} /> {item.changedBy}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '15px 20px', textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                                                        {item.timestamp.split(' ')[0]}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Right Panel: Inspector */}
                            <div className="archive-detail-panel">
                                <AnimatePresence mode="wait">
                                    {selectedItem ? (
                                        <motion.div
                                            key={selectedItem.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Detaljni Pregled</h3>
                                                <div style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)' }}>ID: {selectedItem.id}</div>
                                            </div>

                                            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TRANSAKCIJA</div>
                                                <div style={{ fontWeight: 700, fontSize: '16px', lineHeight: '1.4', marginBottom: '15px' }}>{selectedItem.summary}</div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>IZVRŠIO</div>
                                                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{selectedItem.changedBy}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>VREME</div>
                                                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{selectedItem.timestamp}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}><History size={14} /> Izvorno Stanje (JSON)</div>
                                                <div style={{ padding: '15px', background: 'var(--bg-card)', borderRadius: '16px', fontSize: '11px', color: '#f59e0b', overflowX: 'auto', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
                                                    {JSON.stringify(selectedItem.oldData, null, 2)}
                                                </div>
                                            </div>

                                            {selectedItem.type === 'UPDATE' && selectedItem.newData && (
                                                <div>
                                                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)' }}><RefreshCcw size={14} /> Novo Stanje</div>
                                                    <div style={{ padding: '15px', background: 'var(--bg-card)', borderRadius: '16px', fontSize: '11px', color: 'var(--accent)', overflowX: 'auto', border: '1px solid var(--accent)', fontFamily: 'monospace' }}>
                                                        {JSON.stringify(selectedItem.newData, null, 2)}
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                                <button style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                    <FileJson size={14} /> Copy JSON
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm("Da li ste sigurni da želite da vratite ovaj podatak?")) {
                                                            restoreItem(selectedItem).then(() => alert("Podatak uspešno vraćen! Proverite odgovarajući modul."));
                                                        }
                                                    }}
                                                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--gradient-blue)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                >
                                                    <RefreshCcw size={14} /> Restore
                                                </button>
                                            </div>

                                        </motion.div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', height: '100%' }}>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid var(--border)' }}>
                                                <Database size={24} style={{ opacity: 0.5 }} />
                                            </div>
                                            <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Detalji Stavke</h3>
                                            <p style={{ fontSize: '13px', opacity: 0.7, maxWidth: '200px' }}>Kliknite na bilo koju stavku u tabeli da biste videli kompletan audit log i JSON podatke.</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <style>{`
                .wizard-overlay {
                    position: fixed;
                    inset: 0;
                    background: var(--bg-dark);
                    z-index: 2000;
                    display: flex;
                }

                .wizard-container {
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    background: var(--bg-dark);
                    overflow: hidden;
                }

                .wizard-sidebar {
                    width: 280px;
                    background: var(--bg-card);
                    border-right: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                }

                .wizard-sidebar-header {
                    padding: 24px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .wizard-steps-list {
                    overflow-y: auto;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    flex-shrink: 0;
                }

                .step-item-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: var(--text-secondary);
                    font-weight: 500;
                    user-select: none;
                }

                .step-item-row:hover {
                    background: var(--glass-bg);
                }

                .step-item-row.active {
                    background: var(--accent-glow);
                    color: var(--accent);
                    font-weight: 600;
                    border-right: 3px solid var(--accent);
                }

                .step-icon-small {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    background: rgba(0,0,0,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    flex-shrink: 0;
                }

                .step-item-row.active .step-icon-small {
                    background: var(--accent);
                    color: #fff;
                }

                .wizard-main-area {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: var(--bg-dark);
                    min-width: 0;
                }

                .wizard-topbar {
                    height: 80px;
                    padding: 0 30px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--bg-card);
                    flex-shrink: 0;
                    gap: 15px;
                }

                .topbar-title h3 {
                    margin: 0;
                    font-size: 22px;
                    font-weight: 700;
                }

                .topbar-subtitle {
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                .wizard-content-wrapper {
                    flex: 1;
                    overflow: hidden;
                }

                .archive-grid {
                    display: grid;
                    grid-template-columns: 1fr 400px;
                    height: 100%;
                }

                .archive-table-panel {
                    overflow-y: auto;
                    padding: 30px;
                    border-right: 1px solid var(--border);
                }

                .archive-detail-panel {
                    background: var(--bg-main);
                    border-left: 1px solid var(--border);
                    padding: 30px;
                    overflow-y: auto;
                }

                .topbar-actions {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                }

                .topbar-search {
                    position: relative;
                    width: 300px;
                }

                /* Tablet Responsive */
                @media (max-width: 1024px) {
                    .wizard-sidebar {
                        width: 220px;
                    }

                    .wizard-topbar {
                        padding: 0 20px;
                        height: 70px;
                    }

                    .topbar-title h3 {
                        font-size: 18px;
                    }

                    .topbar-search {
                        width: 200px;
                    }

                    .archive-grid {
                        grid-template-columns: 1fr 300px;
                    }

                    .archive-table-panel,
                    .archive-detail-panel {
                        padding: 20px;
                    }
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .wizard-container {
                        flex-direction: column;
                    }

                    .wizard-sidebar {
                        width: 100%;
                        height: auto;
                        max-height: 200px;
                        border-right: none;
                        border-bottom: 1px solid var(--border);
                    }

                    .wizard-sidebar-header {
                        padding: 16px;
                    }

                    .wizard-sidebar-header h2 {
                        font-size: 16px !important;
                    }

                    .wizard-steps-list {
                        flex-direction: row;
                        overflow-x: auto;
                        overflow-y: hidden;
                        padding: 12px;
                        gap: 8px;
                    }

                    .step-item-row {
                        padding: 10px 14px;
                        white-space: nowrap;
                        flex-shrink: 0;
                        border-right: none !important;
                    }

                    .step-item-row.active {
                        border-bottom: 3px solid var(--accent);
                        border-right: none;
                    }

                    .wizard-sidebar-footer {
                        display: none;
                    }

                    .wizard-topbar {
                        height: auto;
                        min-height: 60px;
                        padding: 15px;
                        flex-wrap: wrap;
                    }

                    .topbar-title {
                        flex: 1;
                        min-width: 100%;
                        margin-bottom: 10px;
                    }

                    .topbar-title h3 {
                        font-size: 16px;
                    }

                    .topbar-actions {
                        width: 100%;
                        justify-content: space-between;
                    }

                    .topbar-search {
                        flex: 1;
                        width: auto;
                        min-width: 120px;
                    }

                    .archive-grid {
                        grid-template-columns: 1fr;
                        grid-template-rows: 1fr auto;
                    }

                    .archive-table-panel {
                        padding: 15px;
                        border-right: none;
                        border-bottom: 1px solid var(--border);
                    }

                    .archive-detail-panel {
                        padding: 15px;
                        max-height: 300px;
                        border-left: none;
                    }
                }

                /* Small Mobile */
                @media (max-width: 480px) {
                    .wizard-sidebar-header {
                        padding: 12px;
                    }

                    .step-item-row span:not(.step-icon-small) {
                        font-size: 12px;
                    }

                    .wizard-topbar {
                        padding: 10px;
                    }

                    .topbar-title h3 {
                        font-size: 14px;
                    }

                    .archive-table-panel,
                    .archive-detail-panel {
                        padding: 10px;
                    }
                }
            `}</style>
        </div>
    );
}
