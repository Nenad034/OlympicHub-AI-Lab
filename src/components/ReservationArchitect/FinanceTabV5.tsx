import React from 'react';
import {
    Wallet, CreditCard, DollarSign, History, Trash2, Plus,
    ChevronRight, Receipt, Printer, ShieldCheck, TrendingUp, AlertCircle, FileText,
    ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, Ban
} from 'lucide-react';
import type { Dossier, PaymentRecord } from '../../types/reservationArchitect';
import { formatDate } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface FinanceTabProps {
    dossier: Dossier;
    financialStats: {
        totalBrutto: number;
        totalNet: number;
        totalPaid: number;
        balance: number;
    };
    onAddPayment: () => void;
    onRemovePayment: (id: string) => void;
}

export const FinanceTabV5: React.FC<FinanceTabProps> = ({
    dossier, financialStats, onAddPayment, onRemovePayment
}) => {

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'Cash': return <Wallet size={24} />;
            case 'Card': return <CreditCard size={24} />;
            case 'Transfer': return <TrendingUp size={24} />;
            default: return <Receipt size={24} />;
        }
    };

    const StatusPill = ({ paid, total }: { paid: number, total: number }) => {
        const perc = (paid / total) * 100;
        let color = '#ef4444';
        let text = 'NEPLAĆENO';
        if (perc >= 100) { color = '#10b981'; text = 'PLAĆENO U CELOSTI'; }
        else if (perc > 0) { color = '#f59e0b'; text = `DELIMIČNO (${perc.toFixed(0)}%)`; }

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '30px', background: `${color}15`, border: `1px solid ${color}30`, color: color, fontSize: '11px', fontWeight: 950 }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }}></div>
                {text}
            </div>
        );
    };

    return (
        <div className="v5-finance">

            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '22px', background: 'var(--petroleum)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                        <Wallet size={32} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 950, letterSpacing: '-1px' }}>FINANSIJSKI TOK</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Upravljanje transakcijama • {dossier.finance.payments.length} zapisa</div>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                            <StatusPill paid={financialStats.totalPaid} total={financialStats.totalBrutto} />
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button className="v5-btn v5-btn-secondary" style={{ height: '56px' }}>
                        <FileText size={20} /> PROFAKTURA
                    </button>
                    <button className="v5-btn v5-btn-primary" onClick={onAddPayment} style={{ height: '56px', padding: '0 32px' }}>
                        <Plus size={20} /> EVIDENTIRAJ UPLATU
                    </button>
                </div>
            </div>

            {/* Financial Dashboard Metrics */}
            <div className="v5-metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                {[
                    { label: 'UKUPNA BRUTO VREDNOST', val: financialStats.totalBrutto, icon: ShieldCheck, color: 'var(--text-primary)' },
                    { label: 'REALIZOVANE UPLATE', val: financialStats.totalPaid, icon: ArrowDownLeft, color: '#10b981' },
                    { label: 'PREOSTALO ZA NAPLATU', val: financialStats.balance, icon: AlertCircle, color: financialStats.balance > 0 ? '#ef4444' : '#10b981' },
                    { label: 'PLANIRANE RATE', val: dossier.finance.installments.length, suffix: ' RATE', icon: Clock, color: 'var(--accent-cyan)' }
                ].map((m, i) => (
                    <div key={i} className="v5-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div className="v5-metric-label">{m.label}</div>
                            <m.icon size={18} style={{ color: m.color, opacity: 0.6 }} />
                        </div>
                        <div className="v5-metric-value" style={{ color: m.color, fontSize: '28px' }}>
                            {typeof m.val === 'number' ? m.val.toLocaleString() : m.val}
                            {typeof m.val === 'number' && ` ${dossier.finance.currency}`}
                            {m.suffix}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <History size={20} style={{ color: 'var(--accent-cyan)' }} />
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Hronologija transakcija</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <AnimatePresence>
                        {dossier.finance.payments.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="v5-card" style={{ textAlign: 'center', padding: '80px', background: 'transparent', borderStyle: 'dashed' }}>
                                <Ban size={48} style={{ opacity: 0.1, margin: '0 auto 20px auto' }} />
                                <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>NEMA EVIDENTIRANIH TRANSAKCIJA ZA OVAJ DOSIJE</div>
                            </motion.div>
                        ) : (
                            dossier.finance.payments.map((p, i) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="v5-card"
                                    style={{
                                        padding: '20px 32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        opacity: p.status === 'deleted' ? 0.3 : 1,
                                        borderLeft: `4px solid ${p.status === 'deleted' ? '#ef4444' : 'var(--accent-cyan)'}`
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flex: 1 }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--petroleum-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                                            {getPaymentIcon(p.method)}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: 950, color: 'var(--text-secondary)', marginBottom: '4px' }}>{formatDate(p.date)} — {p.method.toUpperCase()}</div>
                                            <div style={{ fontSize: '16px', fontWeight: 900 }}>{p.payerName}</div>
                                        </div>
                                        <div style={{ width: '1px', height: '30px', background: 'var(--glass-border)' }}></div>
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: 950, color: 'var(--text-secondary)', marginBottom: '4px' }}>REFERENCA / FISKALNI</div>
                                            <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace' }}>{p.receiptNo}</div>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '40px' }}>
                                        <div>
                                            <div style={{ fontSize: '24px', fontWeight: 900, color: p.status === 'deleted' ? '#ef4444' : 'var(--text-primary)' }}>
                                                {p.amount.toLocaleString()} {p.currency}
                                            </div>
                                            {p.currency !== 'RSD' && (
                                                <div style={{ fontSize: '11px', fontWeight: 700, opacity: 0.5 }}>({p.amountInRsd?.toLocaleString()} RSD)</div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button className="v5-btn v5-btn-secondary" style={{ width: '44px', height: '44px', padding: 0, justifyContent: 'center' }} onClick={() => window.print()}>
                                                <Printer size={18} />
                                            </button>
                                            {p.status !== 'deleted' && (
                                                <button className="v5-btn" style={{ width: '44px', height: '44px', padding: 0, justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} onClick={() => onRemovePayment(p.id)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
