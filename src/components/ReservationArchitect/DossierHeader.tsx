import {
    Hash, Globe, User, Phone, Mail, MapPin,
    TrendingUp, Wallet, ArrowRightLeft,
    X, ShieldCheck, Zap, RotateCcw, Save, Loader2, RotateCw, Smartphone, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dossier, ResStatus } from '../../types/reservationArchitect';

interface DossierHeaderProps {
    dossier: Dossier;
    financialStats: {
        totalBrutto: number;
        totalPaid: number;
        balance: number;
    };
    isSaving?: boolean;
    isHistoryAvailable?: boolean;
    onUndo?: () => void;
    onDeepReset?: () => void;
    onClose: () => void;
    onStatusChange: (status: ResStatus) => void;
    isLightTheme: boolean;
    onToggleTheme: () => void;
}

export const DossierHeader: React.FC<DossierHeaderProps> = ({
    dossier,
    financialStats,
    isSaving = false,
    isHistoryAvailable = false,
    onUndo,
    onDeepReset,
    onClose,
    onStatusChange,
    isLightTheme,
    onToggleTheme
}) => {
    const statuses: ResStatus[] = ['Request', 'Processing', 'Offer', 'Reservation', 'Active', 'Canceled', 'Zatvoreno'];

    return (
        <header className="dossier-header-v2">
            <div className="header-glass-wrapper">
                {/* Top Section: Title & Codes */}
                <div className="header-top-row">
                    <div className="dossier-id-section">
                        <div className="cis-pill">
                            <Hash size={14} className="cyan" />
                            <span>CIS: <strong>{dossier.cisCode}</strong></span>
                        </div>
                        <div className="ref-pill">
                            <Globe size={14} className="cyan" />
                            <span>REF: <strong>{dossier.clientReference}</strong></span>
                        </div>
                        {dossier.resCode && (
                            <div className="res-pill glow-active">
                                <Zap size={14} className="gold" />
                                <span>REZ: <strong>{dossier.resCode}</strong></span>
                            </div>
                        )}

                        {/* Mobile App Status */}
                        <div className="app-status-pill">
                            <Smartphone size={14} className="orange" />
                            <span>App: <strong className="dim">Inactive</strong></span>
                        </div>

                        {/* Auto-save Indicator */}
                        <div className={`save-status-pill ${isSaving ? 'saving' : ''}`}>
                            {isSaving ? (
                                <><Loader2 size={12} className="animate-spin" /> <span>Sinhronizacija...</span></>
                            ) : (
                                <><Save size={12} /> <span>Sačuvano</span></>
                            )}
                        </div>
                    </div>

                    <div className="dossier-title-center">
                        <motion.h1
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bold"
                        >
                            DOSIJE REZERVACIJE
                        </motion.h1>
                        <div className="booker-name-header">
                            <User size={14} className="cyan" />
                            <span>Nosilac: <strong>{dossier.booker.fullName}</strong></span>
                        </div>
                    </div>

                    <div className="header-actions">
                        <AnimatePresence>
                            {isHistoryAvailable && onUndo && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="undo-btn"
                                    onClick={onUndo}
                                    title="Poništi poslednju izmenu (Undo)"
                                >
                                    <RotateCcw size={18} />
                                </motion.button>
                            )}
                        </AnimatePresence>

                        <button
                            className="theme-toggle-btn"
                            onClick={onToggleTheme}
                            title={isLightTheme ? "Prebaci na Dark Mode" : "Prebaci na Light Mode"}
                        >
                            {isLightTheme ? <Moon size={18} /> : <Sun size={18} />}
                        </button>

                        <button
                            className="reset-btn"
                            onClick={() => {
                                if (confirm('Da li ste sigurni da želite da vratite dosije na početno stanje? Sve današnje izmene će biti izgubljene.')) {
                                    onDeepReset?.();
                                }
                            }}
                            title="Vrati na originalno stanje"
                        >
                            <RotateCw size={18} />
                        </button>

                        <button className="close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Bottom Section: Status & Financials */}
                <div className="header-main-row">
                    {/* Status Tabs */}
                    <div className="status-timeline">
                        {statuses.map((status) => (
                            <button
                                key={status}
                                onClick={() => onStatusChange(status)}
                                className={`status-tab ${dossier.status === status ? 'active' : ''} status-${status.toLowerCase()}`}
                            >
                                {status.toUpperCase()}
                                {dossier.status === status && (
                                    <motion.div
                                        layoutId="status-glow"
                                        className="tab-glow"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Financial Quick Cards */}
                    <div className="financial-ticker">
                        <div className="mini-stat-card glass">
                            <div className="stat-info">
                                <span className="label">UKUPNO ZA NAPLATU</span>
                                <span className="value">{financialStats.totalBrutto.toLocaleString()} <small>{dossier.finance.currency}</small></span>
                            </div>
                            <div className="stat-icon-box cyan-glow">
                                <Wallet size={18} />
                            </div>
                        </div>

                        <div className="mini-stat-card glass">
                            <div className="stat-info">
                                <span className="label">DOSAD UPLAĆENO</span>
                                <span className="value success">{financialStats.totalPaid.toLocaleString()} <small>{dossier.finance.currency}</small></span>
                            </div>
                            <div className="stat-icon-box success-glow">
                                <TrendingUp size={18} />
                            </div>
                        </div>

                        <div className="mini-stat-card glass">
                            <div className="stat-info">
                                <span className="label">SALDO (DUG)</span>
                                <span className="value danger">{financialStats.balance.toLocaleString()} <small>{dossier.finance.currency}</small></span>
                            </div>
                            <div className="stat-icon-box danger-glow">
                                <ArrowRightLeft size={18} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .dossier-header-v2 {
                    width: 100%;
                    padding: 0;
                    margin-bottom: 30px;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }
                .header-glass-wrapper {
                    background: var(--fil-card);
                    backdrop-filter: blur(15px);
                    border-bottom: 1px solid var(--fil-border);
                    padding: 15px 30px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .header-top-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .dossier-id-section {
                    display: flex;
                    gap: 12px;
                }
                .cis-pill, .ref-pill, .res-pill {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--fil-border);
                    border-radius: 8px;
                    font-size: 11px;
                    color: var(--fil-text-dim);
                }
                .save-status-pill {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: rgba(16, 185, 129, 0.05);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    border-radius: 8px;
                    font-size: 10px;
                    font-weight: 800;
                    color: #10b981;
                    transition: all 0.3s;
                }
                .save-status-pill.saving {
                    background: rgba(0, 229, 255, 0.05);
                    border-color: rgba(0, 229, 255, 0.2);
                    color: var(--fil-accent);
                }
                .res-pill.glow-active {
                    background: rgba(255, 179, 0, 0.05);
                    border-color: rgba(255, 179, 0, 0.2);
                    color: var(--fil-gold);
                }
                .dossier-title-center h1 {
                    font-size: 16px;
                    letter-spacing: 3px;
                    color: var(--fil-text);
                    margin: 0;
                    text-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
                }
                .header-main-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 40px;
                }
                .status-timeline {
                    display: flex;
                    background: rgba(0,0,0,0.2);
                    padding: 4px;
                    border-radius: 12px;
                    gap: 4px;
                }
                .status-tab {
                    padding: 8px 16px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    color: var(--fil-text-dim);
                    font-size: 10px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }
                .status-tab:hover {
                    color: var(--fil-text);
                    background: rgba(255,255,255,0.05);
                }
                .status-tab.active {
                    color: white;
                }
                .status-tab.active.status-request { background: #3b82f6; }
                .status-tab.active.status-processing { background: #8b5cf6; }
                .status-tab.active.status-offer { background: #06b6d4; }
                .status-tab.active.status-reservation { background: #f59e0b; }
                .status-tab.active.status-active { background: #10b981; }
                .status-tab.active.status-canceled { background: #ef4444; }
                .status-tab.active.status-zatvoreno { background: #64748b; }

                .tab-glow {
                    position: absolute;
                    inset: 0;
                    border-radius: 8px;
                    box-shadow: 0 0 15px rgba(255,255,255,0.2);
                    pointer-events: none;
                }

                .financial-ticker {
                    display: flex;
                    gap: 15px;
                }
                .mini-stat-card {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 10px 20px;
                    border-radius: 16px;
                    min-width: 220px;
                }
                .stat-info {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                }
                .stat-info .label {
                    font-size: 9px;
                    color: var(--fil-text-dim);
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
                .stat-info .value {
                    font-size: 18px;
                    font-weight: 900;
                }
                .stat-info .value.success { color: var(--fil-success); }
                .stat-info .value.danger { color: var(--fil-danger); }
                .stat-icon-box {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--fil-bg);
                }
                .cyan-glow { background: var(--fil-accent); box-shadow: 0 0 15px var(--fil-accent-glow); }
                .success-glow { background: var(--fil-success); box-shadow: 0 0 15px rgba(63, 185, 80, 0.4); }
                .danger-glow { background: var(--fil-danger); box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }

                .header-actions {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                .undo-btn, .reset-btn, .close-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--fil-border);
                    color: var(--fil-text-dim);
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .undo-btn:hover { color: var(--fil-accent); border-color: var(--fil-accent); background: rgba(0, 229, 255, 0.05); }
                .reset-btn:hover { color: var(--fil-gold); border-color: var(--fil-gold); background: rgba(255, 179, 0, 0.05); }
                .close-btn:hover {
                    background: var(--fil-danger);
                    color: white;
                    border-color: var(--fil-danger);
                }
            `}</style>
        </header>
    );
};
