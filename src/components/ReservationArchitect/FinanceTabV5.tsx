import React, { useState } from 'react';
import {
    Wallet, CreditCard, DollarSign, History, Trash2, Plus,
    ChevronRight, Receipt, Printer, ShieldCheck, TrendingUp, AlertCircle, FileText,
    ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, Ban, Building2, Scale
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

    // Calc ROI
    const totalPurchaseCost = dossier.finance.purchaseItems?.reduce((acc, pi) => acc + pi.costAmount, 0) || 0;
    const totalSalesValue = dossier.finance.salesItems?.reduce((acc, si) => acc + si.salesAmount, 0) || financialStats.totalBrutto; // Fallback to totalBrutto
    const profit = totalSalesValue - totalPurchaseCost;
    const roiPercentage = totalSalesValue > 0 ? (profit / totalSalesValue) * 100 : 0;

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

            {/* SMART MANIFEST: Subagent Commission Model Selector */}
            {dossier.customerType === 'B2B-Subagent' && (
                <div className="v5-card" style={{ padding: '24px', marginBottom: '24px', borderLeft: '4px solid var(--accent-cyan)', background: 'linear-gradient(90deg, rgba(0, 229, 255, 0.05) 0%, transparent 100%)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: 'var(--accent-cyan)', letterSpacing: '1px' }}>B2B SUBAGENTSKI MODEL NAPLATE</h3>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '600px' }}>
                                Izaberite način na koji ovaj subagent reguliše proviziju za trenutni dosije.
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className={`v5-btn ${dossier.finance.subagentCommissionModel === 'UPFRONT' ? 'v5-btn-primary' : 'v5-btn-secondary'}`}
                                onClick={() => updateDossier && updateDossier({ finance: { ...dossier.finance, subagentCommissionModel: 'UPFRONT' } })}
                                style={{ padding: '0 24px', height: '40px', fontSize: '11px', fontWeight: 900 }}
                            >
                                PROVIZIJA ODMAH (UPFRONT)
                            </button>
                            <button
                                className={`v5-btn ${dossier.finance.subagentCommissionModel === 'END_OF_MONTH' ? 'v5-btn-primary' : 'v5-btn-secondary'}`}
                                onClick={() => updateDossier && updateDossier({ finance: { ...dossier.finance, subagentCommissionModel: 'END_OF_MONTH' } })}
                                style={{ padding: '0 24px', height: '40px', fontSize: '11px', fontWeight: 900 }}
                            >
                                KRAJ MESECA (E.O.M)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Financial Dashboard Metrics */}
            <div className="v5-metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                {[
                    { label: 'PLANIRANI PROMET', val: totalSalesValue, icon: ShieldCheck, color: 'var(--text-primary)' },
                    { label: 'NABAVNA CENA (COST)', val: totalPurchaseCost, icon: Building2, color: '#ffb300' },
                    { label: 'ROI / PROFIT MARGINA', val: `${roiPercentage.toFixed(1)}%`, icon: TrendingUp, color: roiPercentage > 15 ? '#10b981' : roiPercentage > 0 ? '#f59e0b' : '#ef4444', suffix: ` (${profit.toLocaleString()} ${dossier.finance.currency})` },
                    { label: 'REALIZOVANE UPLATE', val: financialStats.totalPaid, icon: ArrowDownLeft, color: '#10b981' }
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

            <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {/* PRODAJA / SALES ITEMS */}
                <div className="v5-card" style={{ padding: '24px', background: 'rgba(16,185,129,0.02)', border: '1px solid rgba(16,185,129,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <TrendingUp size={20} style={{ color: '#10b981' }} />
                            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-primary)' }}>PRODAJA / SALES</h3>
                        </div>
                        <button
                            className="v5-btn v5-btn-secondary"
                            style={{ height: '32px', padding: '0 12px', fontSize: '10px', color: '#10b981', borderColor: 'rgba(16,185,129,0.2)' }}
                            onClick={() => {
                                if (updateDossier) {
                                    // Smart autofill from trip items
                                    const newSales = dossier.tripItems.map(item => ({
                                        id: `SI-${Math.random().toString(36).substr(2, 9)}`,
                                        description: item.subject,
                                        salesAmount: item.bruttoPrice,
                                        currency: item.currency
                                    }));
                                    updateDossier({ finance: { ...dossier.finance, salesItems: [...(dossier.finance.salesItems || []), ...newSales] } });
                                }
                            }}
                        >
                            <Plus size={14} /> AUTO-FILL
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {!dossier.finance.salesItems || dossier.finance.salesItems.length === 0 ? (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'center', padding: '20px' }}>Kliknite Auto-fill za preuzimanje iz plana puta.</div>
                        ) : (
                            dossier.finance.salesItems.map(si => (
                                <div key={si.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{si.description}</div>
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981' }}>{si.salesAmount.toLocaleString()} {si.currency}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* DOBAVLJAČI / PURCHASE ITEMS */}
                <div className="v5-card" style={{ padding: '24px', background: 'rgba(255,179,0,0.02)', border: '1px solid rgba(255,179,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Building2 size={20} style={{ color: '#ffb300' }} />
                            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-primary)' }}>NABAVKA / COST</h3>
                        </div>
                        <button
                            className="v5-btn v5-btn-secondary"
                            style={{ height: '32px', padding: '0 12px', fontSize: '10px', color: '#ffb300', borderColor: 'rgba(255,179,0,0.2)' }}
                            onClick={() => setIsPurchaseModalOpen(true)}
                        >
                            <Plus size={14} /> DODAJ
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {!dossier.finance.purchaseItems || dossier.finance.purchaseItems.length === 0 ? (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'center', padding: '20px' }}>Trenutno nema ulaznih faktura.</div>
                        ) : (
                            dossier.finance.purchaseItems.map(pi => (
                                <div key={pi.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 700 }}>{pi.supplierName}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Val: {formatDate(pi.dueDate)}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 900, color: '#ffb300' }}>{pi.costAmount.toLocaleString()} {pi.currency}</div>
                                        <div style={{ fontSize: '9px', fontWeight: 900, color: pi.paymentStatus === 'paid' ? '#10b981' : '#ef4444' }}>
                                            {pi.paymentStatus === 'paid' ? 'PLAĆENO' : 'DUG'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* KONAČNI RAČUNI / FINAL INVOICES */}
                <div className="v5-card" style={{ padding: '24px', background: 'rgba(0, 229, 255, 0.02)', border: '1px solid rgba(0, 229, 255, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Scale size={20} style={{ color: 'var(--accent-cyan)' }} />
                            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-primary)' }}>DOKUMENTI / KIR</h3>
                        </div>
                        <button
                            className="v5-btn v5-btn-secondary"
                            style={{ height: '32px', padding: '0 12px', fontSize: '10px', color: 'var(--accent-cyan)', borderColor: 'rgba(0, 229, 255, 0.2)' }}
                            onClick={() => setIsInvoiceModalOpen(true)}
                        >
                            <Plus size={14} /> NOVI
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {!dossier.finance.finalInvoices || dossier.finance.finalInvoices.length === 0 ? (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'center', padding: '20px' }}>Nema izdatih računa.</div>
                        ) : (
                            dossier.finance.finalInvoices.map(fi => (
                                <div key={fi.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 700 }}>RN: {fi.invoiceNumber}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{formatDate(fi.issueDate)}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 900 }}>{fi.totalAmount.toLocaleString()} RSD</div>
                                        {fi.isFiscalized && <div style={{ fontSize: '9px', color: '#10b981', fontWeight: 900 }}>FISKALIZOVAN</div>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
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

            {/* Smart Manifest - Modali za Finansijske Operacije */}
            <AnimatePresence>
                {isPurchaseModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="v5-card" style={{ width: '400px', padding: '32px', textAlign: 'center', border: '1px solid rgba(255,179,0,0.3)' }}>
                            <Building2 size={40} style={{ margin: '0 auto 20px auto', color: '#ffb300' }} />
                            <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '8px', color: '#ffb300' }}>ULAZNI RAČUN DOBAVLJAČA</h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '32px' }}>Sistem će generisati test zaduženje ka eksternom dobavljaču za ovaj rezervacioni ciklus.</p>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="v5-btn v5-btn-secondary" style={{ flex: 1 }} onClick={() => setIsPurchaseModalOpen(false)}>ODUSTANI</button>
                                <button className="v5-btn v5-btn-primary" style={{ flex: 2, background: 'rgba(255,179,0,0.1)', color: '#ffb300', border: '1px solid rgba(255,179,0,0.3)' }} onClick={() => {
                                    if (updateDossier) {
                                        updateDossier({
                                            finance: {
                                                ...dossier.finance,
                                                purchaseItems: [...(dossier.finance.purchaseItems || []), {
                                                    id: `PI-${Date.now()}`, supplierId: 'S-1', supplierName: 'Test Hotel Group A.D.',
                                                    description: 'Usluga Smeštaja', costAmount: 1250, currency: 'EUR',
                                                    dueDate: '2026-05-15', paymentStatus: 'pending'
                                                }]
                                            }
                                        });
                                    }
                                    setIsPurchaseModalOpen(false);
                                }}>GENERIŠI ZADUŽENJE</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isInvoiceModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="v5-card" style={{ width: '400px', padding: '32px', textAlign: 'center', border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                            <Scale size={40} style={{ margin: '0 auto 20px auto', color: 'var(--accent-cyan)' }} />
                            <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '8px', color: 'var(--accent-cyan)' }}>FISKALNI MODEL / KIR</h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '32px' }}>Generisanje zvaničnog konačnog računa po članu 35 sa integracijom za SEF/ESIR.</p>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="v5-btn v5-btn-secondary" style={{ flex: 1 }} onClick={() => setIsInvoiceModalOpen(false)}>ODUSTANI</button>
                                <button className="v5-btn v5-btn-primary" style={{ flex: 2 }} onClick={() => {
                                    if (updateDossier) {
                                        updateDossier({
                                            finance: {
                                                ...dossier.finance,
                                                finalInvoices: [...(dossier.finance.finalInvoices || []), {
                                                    id: `FI-${Date.now()}`, invoiceNumber: `2026/RN-${Math.floor(Math.random() * 1000)}`,
                                                    issueDate: new Date().toISOString(), totalAmount: financialStats.totalBrutto,
                                                    vatAmount: financialStats.totalBrutto * 0.1, isFiscalized: true,
                                                    fiscalReceiptNumber: `PFR-${Math.floor(Math.random() * 99999)}`
                                                }]
                                            }
                                        });
                                    }
                                    setIsInvoiceModalOpen(false);
                                }}>FISKALIZUJ I ZATVORI</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
