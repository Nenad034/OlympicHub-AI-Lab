import React, { useState } from 'react';
import {
    Wallet, CreditCard, DollarSign, History, Trash2, Plus,
    ChevronRight, Receipt, Printer, ShieldCheck, TrendingUp, AlertCircle, FileText,
    ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, Ban, Building2, Scale, BarChart3,
    ArrowRightLeft, FileCheck, Landmark, ReceiptText
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
        totalProfit: number;
        profitPercent: number;
    };
    onAddPayment: () => void;
    onRemovePayment: (id: string) => void;
    updateDossier?: (updates: Partial<Dossier>) => void;
}

export const FinanceTabV5: React.FC<FinanceTabProps> = ({
    dossier, financialStats, onAddPayment, onRemovePayment, updateDossier
}) => {
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'Cash': return <Wallet size={24} />;
            case 'Card': return <CreditCard size={24} />;
            case 'Transfer': return <Landmark size={24} />;
            case 'Check': return <ReceiptText size={24} />;
            default: return <Receipt size={24} />;
        }
    };

    const StatusPill = ({ paid, total }: { paid: number, total: number }) => {
        const perc = total > 0 ? (paid / total) * 100 : 0;
        let color = '#ef4444';
        let text = 'NEPLAĆENO';
        if (perc >= 100) { color = '#10b981'; text = 'PLAĆENO U CELOSTI'; }
        else if (perc > 0) { color = '#f59e0b'; text = `DELIMIČNO (${perc.toFixed(0)}%)`; }

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '30px', background: `${color}15`, border: `1px solid ${color}30`, color: color, fontSize: '11px', fontWeight: 950 }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }}></div>
                {text}
            </div>
        );
    };

    // Calculate Purchase Totals
    const totalPurchaseCost = dossier.finance.purchaseItems?.reduce((acc, pi) => acc + (pi.costAmount || 0), 0) || 0;
    const paidToSuppliers = dossier.finance.purchaseItems?.filter(p => p.paymentStatus === 'paid').reduce((acc, pi) => acc + (pi.costAmount || 0), 0) || 0;

    return (
        <div className="v5-finance">

            {/* Page Header V6 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '22px', background: 'var(--petroleum)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,229,255,0.1)' }}>
                        <BarChart3 size={32} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 950, letterSpacing: '-1.5px' }}>FINANSIJSKI TOK (PAYABLES & RECEIVABLES)</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Dossier ID: {dossier.id} • {dossier.finance.payments.length} transakcija</div>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                            <StatusPill paid={financialStats.totalPaid} total={financialStats.totalBrutto} />
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button className="v5-btn v5-btn-secondary" style={{ height: '56px' }}>
                        <Printer size={20} /> STAMPAJ FIN. DOSIJE
                    </button>
                    <button className="v5-btn v5-btn-primary" onClick={onAddPayment} style={{ height: '56px', padding: '0 32px' }}>
                        <Plus size={20} /> EVIDENTIRAJ UPLATU KLIJENTA
                    </button>
                </div>
            </div>

            {/* B2B Subagent Control V6 */}
            {dossier.customerType === 'B2B-Subagent' && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="v5-card" style={{ padding: '24px', marginBottom: '32px', borderLeft: '6px solid var(--accent-cyan)', background: 'linear-gradient(90deg, rgba(0, 229, 255, 0.05) 0%, transparent 100%)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <ShieldCheck size={18} style={{ color: 'var(--accent-cyan)' }} />
                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, color: 'var(--accent-cyan)', letterSpacing: '2px', textTransform: 'uppercase' }}>B2B Subagentski Model</h3>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '600px', fontWeight: 600 }}>
                                Kontrola provizije i obračuna za subagente. Promena modela automatski menja valutu i način izdavanja profaktura.
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '14px' }}>
                            <button
                                className={`v5-btn ${dossier.finance.subagentCommissionModel === 'UPFRONT' ? 'v5-btn-primary' : ''}`}
                                onClick={() => updateDossier && updateDossier({ finance: { ...dossier.finance, subagentCommissionModel: 'UPFRONT' } })}
                                style={{ padding: '0 20px', height: '40px', fontSize: '10px', boxShadow: 'none' }}
                            >
                                PROVIZIJA ODMAH
                            </button>
                            <button
                                className={`v5-btn ${dossier.finance.subagentCommissionModel === 'END_OF_MONTH' ? 'v5-btn-primary' : ''}`}
                                onClick={() => updateDossier && updateDossier({ finance: { ...dossier.finance, subagentCommissionModel: 'END_OF_MONTH' } })}
                                style={{ padding: '0 20px', height: '40px', fontSize: '10px', boxShadow: 'none' }}
                            >
                                KRAJ MESECA (E.O.M)
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Premium Metrics Grid V6 */}
            <div className="v5-metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                {[
                    { label: 'PLANIRANA PRODAJA (RECEIVABLES)', val: financialStats.totalBrutto, icon: ArrowDownLeft, color: 'var(--text-primary)' },
                    { label: 'UKUPNA NABAVKA (PAYABLES)', val: financialStats.totalNet, icon: ArrowUpRight, color: '#ffb300' },
                    { label: 'OČEKIVANA MARŽA / PROFIT', val: financialStats.totalProfit, icon: TrendingUp, color: financialStats.profitPercent > 10 ? '#10b981' : '#f59e0b', suffix: ` (${financialStats.profitPercent.toFixed(1)}%)` },
                    { label: 'SALDO UPLATA (CASH)', val: financialStats.totalPaid, icon: Wallet, color: '#10b981', sub: `Saldo: ${financialStats.balance.toLocaleString()} ${dossier.finance.currency}` }
                ].map((m, i) => (
                    <motion.div key={i} whileHover={{ y: -5 }} className="v5-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div className="v5-metric-label" style={{ opacity: 0.7 }}>{m.label}</div>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                                <m.icon size={16} />
                            </div>
                        </div>
                        <div className="v5-metric-value" style={{ color: m.color, fontSize: '28px' }}>
                            {m.val.toLocaleString()} <span style={{ fontSize: '14px', opacity: 0.5 }}>{dossier.finance.currency}</span>
                            {m.suffix && <span style={{ fontSize: '12px', marginLeft: '8px' }}>{m.suffix}</span>}
                        </div>
                        {m.sub && <div style={{ marginTop: '12px', fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>{m.sub}</div>}
                    </motion.div>
                ))}
            </div>

            {/* Split Finance View V6 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                
                {/* SALES / RECEIVABLES - Domain 8 */}
                <div className="v5-card" style={{ padding: '0' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <ArrowDownLeft size={20} style={{ color: '#10b981' }} />
                            <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 950, letterSpacing: '1.5px', textTransform: 'uppercase' }}>PRODAJA / POTRAŽIVANJA</h3>
                        </div>
                        <button 
                            className="v5-btn v5-btn-secondary" 
                            style={{ height: '32px', padding: '0 12px', fontSize: '10px', color: '#10b981' }}
                            onClick={() => {
                                if (updateDossier) {
                                    const newSales = dossier.tripItems.map(item => ({
                                        id: `SI-${Math.random().toString(36).substr(2, 9)}`,
                                        description: `${item.subject} (${item.type})`,
                                        salesAmount: item.bruttoPrice,
                                        currency: item.currency
                                    }));
                                    updateDossier({ finance: { ...dossier.finance, salesItems: newSales } });
                                }
                            }}
                        >
                            <RefreshCw size={14} /> OSVEŽI
                        </button>
                    </div>
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(!dossier.finance.salesItems || dossier.finance.salesItems.length === 0) ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3, fontSize: '12px', fontWeight: 700 }}>NEMA EVIDENTIRANIH PRODAJA</div>
                        ) : dossier.finance.salesItems.map(si => (
                            <div key={si.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700 }}>{si.description}</div>
                                <div style={{ fontSize: '13px', fontWeight: 900, color: '#10b981' }}>{si.salesAmount.toLocaleString()} {si.currency}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PURCHASES / PAYABLES - Domain 8 */}
                <div className="v5-card" style={{ padding: '0' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 179, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <ArrowUpRight size={20} style={{ color: '#ffb300' }} />
                            <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 950, letterSpacing: '1.5px', textTransform: 'uppercase' }}>NABAVKA / OBAVEZE</h3>
                        </div>
                        <button className="v5-btn v5-btn-secondary" style={{ height: '32px', padding: '0 12px', fontSize: '10px', color: '#ffb300' }} onClick={() => setIsPurchaseModalOpen(true)}>
                            <Plus size={14} /> DODAJ RAČUN
                        </button>
                    </div>
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(!dossier.finance.purchaseItems || dossier.finance.purchaseItems.length === 0) ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3, fontSize: '12px', fontWeight: 700 }}>NEMA EVIDENTIRANIH OBAVEZA</div>
                        ) : dossier.finance.purchaseItems.map(pi => (
                            <div key={pi.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: 800 }}>{pi.supplierName}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>DUE: {formatDate(pi.dueDate)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffb300' }}>{pi.costAmount.toLocaleString()} {pi.currency}</div>
                                    <div style={{ fontSize: '9px', fontWeight: 900, color: pi.paymentStatus === 'paid' ? '#10b981' : '#ef4444' }}>
                                        {pi.paymentStatus === 'paid' ? 'PLAĆENO DOBAVLJAČU' : 'DUG DOBAVLJAČU'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DOCUMENTS / FISCALIZATION - Domain 8 */}
                <div className="v5-card" style={{ padding: '0' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 229, 255, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Scale size={20} style={{ color: 'var(--accent-cyan)' }} />
                            <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 950, letterSpacing: '1.5px', textTransform: 'uppercase' }}>DOKUMENTI / KIR / FISKAL</h3>
                        </div>
                        <button className="v5-btn v5-btn-secondary" style={{ height: '32px', padding: '0 12px', fontSize: '10px', color: 'var(--accent-cyan)' }} onClick={() => setIsInvoiceModalOpen(true)}>
                            <Plus size={14} /> NOVI RAČUN
                        </button>
                    </div>
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(!dossier.finance.finalInvoices || dossier.finance.finalInvoices.length === 0) ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3, fontSize: '12px', fontWeight: 700 }}>NEMA IZDATIH RAČUNA</div>
                        ) : dossier.finance.finalInvoices.map(fi => (
                            <div key={fi.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: 800 }}>RAČUN: {fi.invoiceNumber}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>{formatDate(fi.issueDate)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 900 }}>{fi.totalAmount.toLocaleString()} RSD</div>
                                    {fi.isFiscalized && <div style={{ fontSize: '9px', color: '#10b981', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                        <FileCheck size={10} /> FISKALIZOVAN
                                    </div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Transaction History V6 Row */}
            <div style={{ marginTop: '56px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--petroleum)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <History size={20} style={{ color: 'var(--accent-cyan)' }} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 950, letterSpacing: '1px', textTransform: 'uppercase' }}>Hronologija Transakcija Klijenta</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {dossier.finance.payments.length === 0 ? (
                        <div className="v5-card" style={{ textAlign: 'center', padding: '100px', background: 'transparent', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)' }}>
                            <Landmark size={48} style={{ opacity: 0.1, margin: '0 auto 24px auto' }} />
                            <div style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '14px', letterSpacing: '1px' }}>TRENUTNO NEMA ZABELEŽENIH UPLATA ZA OVAJ DOSIJE</div>
                        </div>
                    ) : dossier.finance.payments.map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="v5-card"
                            style={{
                                padding: '24px 40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                opacity: p.status === 'deleted' ? 0.3 : 1,
                                borderLeft: `6px solid ${p.status === 'deleted' ? '#ef4444' : 'var(--accent-cyan)'}`
                            }}
                        >
                            <div style={{ display: 'flex', gap: '48px', alignItems: 'center', flex: 1 }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(0, 229, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)', border: '1px solid var(--glass-border)' }}>
                                    {getPaymentIcon(p.method)}
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 950, color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '1px' }}>
                                        {formatDate(p.date)} — {p.method.toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: 950 }}>{p.payerName || 'NEIMENOVANI PLATILAC'}</div>
                                </div>
                                <div style={{ width: '1px', height: '40px', background: 'var(--glass-border)' }}></div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 950, color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '1px' }}>BROJ FISKALNOG RAČUNA / REF</div>
                                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono, monospace' }}>{p.receiptNo || '---'}</div>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '48px' }}>
                                <div>
                                    <div style={{ fontSize: '28px', fontWeight: 950, color: p.status === 'deleted' ? '#ef4444' : 'var(--text-primary)', letterSpacing: '-1px' }}>
                                        {p.amount.toLocaleString()} <span style={{ fontSize: '16px', opacity: 0.5 }}>{p.currency}</span>
                                    </div>
                                    {p.currency !== 'RSD' && p.amountInRsd && (
                                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                                            ≈ {p.amountInRsd.toLocaleString()} RSD
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="v5-btn v5-btn-secondary" style={{ width: '48px', height: '48px', padding: 0, justifyContent: 'center', borderRadius: '14px' }} onClick={() => window.print()}>
                                        <Printer size={20} />
                                    </motion.button>
                                    {p.status !== 'deleted' && (
                                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="v5-btn" style={{ width: '48px', height: '48px', padding: 0, justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.2)' }} onClick={() => onRemovePayment(p.id)}>
                                            <Trash2 size={20} />
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Smart Manifest - Modali V6 */}
            <AnimatePresence>
                {isPurchaseModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="v5-card" style={{ width: '480px', padding: '40px', textAlign: 'center', border: '1px solid rgba(255,179,0,0.3)' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,179,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px auto', color: '#ffb300' }}>
                                <Building2 size={40} />
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: 950, marginBottom: '12px', color: '#ffb300', letterSpacing: '-1px' }}>ULAZNI RAČUN DOBAVLJAČA</h2>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '40px', fontWeight: 600, lineHeight: 1.6 }}>Sistem će generisati automatsko zaduženje (Payable) ka dobavljaču. Ovo utiče na real-time profitabilnost i saldo nabavke.</p>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button className="v5-btn v5-btn-secondary" style={{ flex: 1 }} onClick={() => setIsPurchaseModalOpen(false)}>ODUSTANI</button>
                                <button className="v5-btn v5-btn-primary" style={{ flex: 2, background: 'rgba(255,179,0,0.15)', color: '#ffb300', border: '1px solid rgba(255,179,0,0.4)' }} onClick={() => {
                                    if (updateDossier) {
                                        updateDossier({
                                            finance: {
                                                ...dossier.finance,
                                                purchaseItems: [...(dossier.finance.purchaseItems || []), {
                                                    id: `PI-${Date.now()}`, supplierId: 'EXT-SUP-01', supplierName: 'Travel Global Services Ltd.',
                                                    description: 'Zakup smeštajnih kapaciteta i transfera', costAmount: financialStats.totalNet > 0 ? financialStats.totalNet : 850, currency: dossier.finance.currency,
                                                    dueDate: new Date(Date.now() + 86400000 * 14).toISOString(), paymentStatus: 'pending'
                                                }]
                                            }
                                        });
                                    }
                                    setIsPurchaseModalOpen(false);
                                }}>GENERIŠI PAYABLE</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isInvoiceModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="v5-card" style={{ width: '480px', padding: '40px', textAlign: 'center', border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px auto', color: 'var(--accent-cyan)' }}>
                                <Scale size={40} />
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: 950, marginBottom: '12px', color: 'var(--accent-cyan)', letterSpacing: '-1px' }}>FISKALNI MODEL / SEF / KIR</h2>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '40px', fontWeight: 600, lineHeight: 1.6 }}>Formiranje konačnog računa (KIR) sa automatskom fiskalizacijom i proverom digitalnog pečata.</p>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button className="v5-btn v5-btn-secondary" style={{ flex: 1 }} onClick={() => setIsInvoiceModalOpen(false)}>ODUSTANI</button>
                                <button className="v5-btn v5-btn-primary" style={{ flex: 2 }} onClick={() => {
                                    if (updateDossier) {
                                        updateDossier({
                                            finance: {
                                                ...dossier.finance,
                                                finalInvoices: [...(dossier.finance.finalInvoices || []), {
                                                    id: `FI-${Date.now()}`, invoiceNumber: `2026/FIN-${Math.floor(Math.random() * 9000) + 1000}`,
                                                    issueDate: new Date().toISOString(), totalAmount: financialStats.totalBrutto,
                                                    vatAmount: financialStats.totalBrutto * 0.1, isFiscalized: true,
                                                    fiscalReceiptNumber: `PFR-SEC-${Math.floor(Math.random() * 999999)}`
                                                }]
                                            }
                                        });
                                    }
                                    setIsInvoiceModalOpen(false);
                                }}>POTVRDI I FISKALIZUJ</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
