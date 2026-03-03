import React from 'react';
import {
    CreditCard, Banknote, Receipt, ArrowRightLeft,
    Plus, Trash2, ShieldCheck, Euro, Coins, Printer,
    FileText, Download, TrendingUp, AlertCircle, Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dossier, PaymentRecord } from '../../types/reservationArchitect';
import { formatDate } from '../../utils/dateUtils';

interface FinanceTabProps {
    dossier: Dossier;
    financialStats: {
        totalBrutto: number;
        totalPaid: number;
        balance: number;
    };
    onAddPayment: () => void;
    onRemovePayment: (id: string) => void;
}

export const FinanceTab: React.FC<FinanceTabProps> = ({
    dossier,
    financialStats,
    onAddPayment,
    onRemovePayment
}) => {
    return (
        <div className="v4-finance-tab" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Top Metrics Grid */}
            <div className="v4-metrics-grid">
                <div className="v4-metric-card">
                    <div className="v4-metric-info">
                        <label>UKUPNA VREDNOST</label>
                        <div className="value">{financialStats.totalBrutto.toLocaleString()} {dossier.finance.currency}</div>
                        <div className="v4-text-dim" style={{ marginTop: '4px' }}>Bazirano na trip-item specifikaciji</div>
                    </div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="v4-metric-card">
                    <div className="v4-metric-info">
                        <label>UKUPNO UPLAĆENO</label>
                        <div className="value success">{financialStats.totalPaid.toLocaleString()} {dossier.finance.currency}</div>
                        <div className="v4-text-dim" style={{ marginTop: '4px' }}>{dossier.finance.payments.length} Proknjiženih transakcija</div>
                    </div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={24} />
                    </div>
                </div>

                <div className="v4-metric-card">
                    <div className="v4-metric-info">
                        <label>PREOSTALO ZA NAPLATU</label>
                        <div className={`value ${financialStats.balance > 0 ? 'danger' : 'success'}`}>{financialStats.balance.toLocaleString()} {dossier.finance.currency}</div>
                        <div className="v4-text-dim" style={{ marginTop: '4px' }}>Rok za uplatu: 25.04.2026</div>
                    </div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: financialStats.balance > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: financialStats.balance > 0 ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertCircle size={24} />
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="v4-table-card">
                <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Receipt size={20} className="cyan-text" />
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, letterSpacing: '1px' }}>EVIDENCIJA UPLATA</h3>
                    </div>
                    <button className="v4-tab-btn active" onClick={onAddPayment}>
                        <Plus size={16} /> NOVA UPLATA
                    </button>
                </div>

                <table className="v4-table">
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Uplatilac</th>
                            <th>Metod</th>
                            <th style={{ textAlign: 'right' }}>Iznos ({dossier.finance.currency})</th>
                            <th style={{ textAlign: 'right' }}>U RSD (NBS)</th>
                            <th style={{ textAlign: 'center' }}>Status</th>
                            <th style={{ textAlign: 'right' }}>Akcije</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {dossier.finance.payments.map((p) => (
                                <motion.tr
                                    key={p.id}
                                    className={`v4-row-hover ${p.status === 'deleted' ? 'storno-row' : ''}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: p.status === 'deleted' ? 0.35 : 1 }}
                                    style={{ background: p.status === 'deleted' ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}
                                >
                                    <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{formatDate(p.date)}</td>
                                    <td><div className="v4-text-main" style={{ fontSize: '14px' }}>{p.payerName}</div></td>
                                    <td>
                                        <div className="v4-status-pill" style={{ background: 'rgba(255,255,255,0.05)', height: '28px', padding: '0 10px', fontSize: '11px' }}>
                                            {p.method}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="v4-price" style={{ color: p.status === 'deleted' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{p.amount.toLocaleString()}</div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="v4-text-dim" style={{ fontSize: '12px' }}>{(p.amountInRsd || 0).toLocaleString()} RSD</div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className={`v4-status-pill ${p.status === 'deleted' ? 'danger' : 'success'}`} style={{ transform: 'scale(0.85)' }}>
                                            {p.status === 'deleted' ? 'STORNO' : 'ACTIVE'}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button className="v4-tab-btn" style={{ width: '36px', height: '36px', padding: 0, justifyContent: 'center', background: 'var(--bg-secondary)' }} title="Štampaj priznanicu">
                                                <Printer size={16} />
                                            </button>
                                            <button
                                                className="v4-tab-btn"
                                                style={{ width: '36px', height: '36px', padding: 0, justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                                onClick={() => onRemovePayment(p.id)}
                                                title="Storniraj"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                        {dossier.finance.payments.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ height: '160px', textAlign: 'center' }}>
                                    <div style={{ opacity: 0.3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <Coins size={48} />
                                        <span style={{ fontWeight: 800 }}>NEMA EVIDENTIRANIH UPLATA</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
