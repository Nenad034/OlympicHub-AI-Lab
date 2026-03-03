import {
    Hash, Globe, User, Phone, Mail, MapPin,
    TrendingUp, Wallet, ArrowRightLeft,
    X, ShieldCheck, Zap, RotateCcw, Save, Loader2, RotateCw, Smartphone, Sun, Moon,
    ChevronDown, ShieldAlert
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
        <header className="v3-dossier-header v3-animate-in">
            <div className="v3-header-container v3-glass-panel">
                {/* --- TOP ROW: DOSSIER IDENTITY & ACTIONS --- */}
                <div className="v3-header-top">
                    <div className="v3-id-badges">
                        <div className="v3-id-pill">
                            <Hash size={12} className="cyan" />
                            <span className="label">CIS:</span>
                            <span className="value">{dossier.cisCode}</span>
                        </div>
                        <div className="v3-id-pill">
                            <Globe size={12} className="cyan" />
                            <span className="label">REF:</span>
                            <span className="value">{dossier.clientReference}</span>
                        </div>
                        {dossier.resCode && (
                            <div className="v3-id-pill active-glow">
                                <Zap size={12} className="gold" />
                                <span className="label">REZ:</span>
                                <span className="value bold">{dossier.resCode}</span>
                            </div>
                        )}
                        <div className={`v3-save-indicator ${isSaving ? 'saving' : ''}`}>
                            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            <span>{isSaving ? 'Sinhronizacija' : 'Arhivirano'}</span>
                        </div>
                    </div>

                    <div className="v3-header-center">
                        <h1>RESERVATION ARCHITECT<sup>V3</sup></h1>
                        <div className="v3-operator-mini">
                            <div className="v3-mini-avatar">SA</div>
                            <span>Agent: <strong>Stefan Arsić</strong></span>
                        </div>
                    </div>

                    <div className="v3-header-actions">
                        <div className="v3-action-group">
                            <button className="v3-circle-btn theme" onClick={onToggleTheme}>
                                {isLightTheme ? <Moon size={18} /> : <Sun size={18} />}
                            </button>
                            <button className="v3-circle-btn" onClick={onDeepReset}>
                                <RotateCw size={18} />
                            </button>
                            {isHistoryAvailable && (
                                <button className="v3-circle-btn undo" onClick={onUndo}>
                                    <RotateCcw size={18} />
                                </button>
                            )}
                        </div>
                        <button className="v3-close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* --- BOTTOM ROW: STATUS & STATS --- */}
                <div className="v3-header-bottom">
                    <div className="v3-status-container">
                        <div className="v3-status-track">
                            {statuses.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => onStatusChange(status)}
                                    className={`v3-tab ${dossier.status === status ? 'active' : ''} v3-st-${status.toLowerCase()}`}
                                >
                                    {status}
                                    {dossier.status === status && (
                                        <motion.div layoutId="v3-st-glow" className="v3-tab-glow" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="v3-stats-ticker">
                        <div className="v3-mini-stat">
                            <div className="v3-stat-content">
                                <label>POTRAŽIVANJE</label>
                                <div className="v3-stat-val">
                                    {financialStats.totalBrutto.toLocaleString()} <small>{dossier.finance.currency}</small>
                                </div>
                            </div>
                            <div className="v3-stat-icon cyan"><Wallet size={16} /></div>
                        </div>

                        <div className="v3-mini-stat">
                            <div className="v3-stat-content">
                                <label>UPLAĆENO</label>
                                <div className="v3-stat-val success">
                                    {financialStats.totalPaid.toLocaleString()} <small>{dossier.finance.currency}</small>
                                </div>
                            </div>
                            <div className="v3-stat-icon success"><TrendingUp size={16} /></div>
                        </div>

                        <div className="v3-mini-stat highlight">
                            <div className="v3-stat-content">
                                <label>SALDO ZA NAPLATU</label>
                                <div className={`v3-stat-val ${financialStats.balance > 0 ? 'danger' : 'success'}`}>
                                    {financialStats.balance.toLocaleString()} <small>{dossier.finance.currency}</small>
                                </div>
                            </div>
                            <div className="v3-stat-icon danger"><ShieldAlert size={16} /></div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .v3-dossier-header {
                    margin-bottom: 32px;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    padding-bottom: 10px;
                }
                .v3-header-container {
                    padding: 20px 32px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .v3-header-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .v3-id-badges {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                .v3-id-pill {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--v3-border);
                    border-radius: 10px;
                    font-size: 11px;
                }
                .v3-id-pill .label { color: var(--v3-text-dim); font-weight: 700; }
                .v3-id-pill .value { color: var(--v3-text); font-weight: 800; }
                .v3-id-pill.active-glow {
                    background: rgba(251, 191, 36, 0.05);
                    border-color: rgba(251, 191, 36, 0.2);
                    color: var(--v3-gold);
                }
                .v3-save-indicator {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 10px;
                    font-weight: 800;
                    color: var(--v3-success);
                    margin-left: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .v3-save-indicator.saving { color: var(--v3-accent); }
                
                .v3-header-center {
                    text-align: center;
                }
                .v3-header-center h1 {
                    font-size: 15px;
                    font-weight: 900;
                    letter-spacing: 5px;
                    margin: 0 0 6px 0;
                    color: var(--v3-text);
                    text-transform: uppercase;
                }
                .v3-header-center h1 sup {
                    font-size: 9px;
                    color: var(--v3-accent);
                    margin-left: 2px;
                    letter-spacing: 0;
                }
                .v3-operator-mini {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 11px;
                    color: var(--v3-text-dim);
                }
                .v3-mini-avatar {
                    width: 20px;
                    height: 20px;
                    border-radius: 6px;
                    background: var(--v3-accent);
                    color: #000;
                    font-size: 9px;
                    font-weight: 950;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .v3-header-actions {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }
                .v3-action-group {
                    display: flex;
                    gap: 8px;
                    background: rgba(0,0,0,0.2);
                    padding: 4px;
                    border-radius: 12px;
                    border: 1px solid var(--v3-border);
                }
                .v3-circle-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    color: var(--v3-text-dim);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .v3-circle-btn:hover { background: rgba(255,255,255,0.05); color: var(--v3-text); }
                .v3-close-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .v3-close-btn:hover { background: #ef4444; color: #fff; }

                .v3-header-bottom {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 40px;
                }
                .v3-status-track {
                    display: flex;
                    gap: 4px;
                    background: rgba(0,0,0,0.2);
                    padding: 4px;
                    border-radius: 14px;
                }
                .v3-tab {
                    padding: 8px 16px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--v3-text-dim);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    position: relative;
                    transition: 0.2s;
                }
                .v3-tab:hover { color: var(--v3-text); }
                .v3-tab.active { color: #fff; }
                .v3-st-request.active { background: #3b82f6; box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3); }
                .v3-st-processing.active { background: #8b5cf6; box-shadow: 0 5px 15px rgba(139, 92, 246, 0.3); }
                .v3-st-offer.active { background: #0891b2; box-shadow: 0 5px 15px rgba(8, 145, 178, 0.3); }
                .v3-st-reservation.active { background: #d97706; box-shadow: 0 5px 15px rgba(217, 119, 6, 0.3); }
                .v3-st-active.active { background: #059669; box-shadow: 0 5px 15px rgba(5, 150, 105, 0.3); }
                .v3-st-canceled.active { background: #dc2626; box-shadow: 0 5px 15px rgba(220, 38, 38, 0.3); }
                .v3-st-zatvoreno.active { background: #475569; box-shadow: 0 5px 15px rgba(71, 85, 105, 0.3); }

                .v3-stats-ticker {
                    display: flex;
                    gap: 14px;
                }
                .v3-mini-stat {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    background: rgba(0,0,0,0.1);
                    padding: 10px 18px;
                    border-radius: 16px;
                    border: 1px solid var(--v3-border);
                    min-width: 180px;
                }
                .v3-mini-stat.highlight {
                    background: var(--v3-accent-dim);
                    border-color: var(--v3-accent-glow);
                }
                .v3-mini-stat label {
                    font-size: 8px;
                    font-weight: 800;
                    color: var(--v3-text-dim);
                    letter-spacing: 0.5px;
                    margin-bottom: 2px;
                    display: block;
                }
                .v3-stat-val {
                    font-size: 16px;
                    font-weight: 900;
                }
                .v3-stat-val.success { color: var(--v3-success); }
                .v3-stat-val.danger { color: var(--v3-danger); }
                .v3-stat-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.03);
                }
                .v3-stat-icon.cyan { color: var(--v3-accent); background: var(--v3-accent-glow); }
                .v3-stat-icon.success { color: var(--v3-success); background: rgba(16, 185, 129, 0.1); }
                .v3-stat-icon.danger { color: var(--v3-danger); background: rgba(239, 68, 68, 0.1); }
            `}</style>
        </header>
    );
};
