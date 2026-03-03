import React, { useState } from 'react';
import {
    CreditCard, Banknote, Receipt, ArrowRightLeft,
    Plus, Trash2, ShieldCheck, Euro, Coins, Printer,
    FileText, Download, TrendingUp, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dossier, PaymentRecord, Installment } from '../../types/reservationArchitect';
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
        <div className="finance-view-v2">
            {/* Top Metrics Grid */}
            <div className="metrics-grid">
                <div className="metric-card glass cyan-border">
                    <div className="icon-bg cyan-glow"><TrendingUp size={24} /></div>
                    <div className="info">
                        <span className="label">UKUPNA VREDNOST</span>
                        <span className="value">{financialStats.totalBrutto.toLocaleString()} <small>{dossier.finance.currency}</small></span>
                    </div>
                </div>
                <div className="metric-card glass green-border">
                    <div className="icon-bg success-glow"><ShieldCheck size={24} /></div>
                    <div className="info">
                        <span className="label">UPLAĆENO</span>
                        <span className="value success">{financialStats.totalPaid.toLocaleString()} <small>{dossier.finance.currency}</small></span>
                    </div>
                </div>
                <div className="metric-card glass red-border">
                    <div className="icon-bg danger-glow"><AlertCircle size={24} /></div>
                    <div className="info">
                        <span className="label">PREOSTALO DUGA</span>
                        <span className="value danger">{financialStats.balance.toLocaleString()} <small>{dossier.finance.currency}</small></span>
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="payments-section glass">
                <div className="section-header">
                    <div className="title">
                        <Receipt size={20} className="cyan" />
                        <h3>EVIDENCIJA UPLATA</h3>
                    </div>
                    <button className="add-btn" onClick={onAddPayment}>
                        <Plus size={16} /> NOVA UPLATA
                    </button>
                </div>

                <div className="table-wrapper">
                    <table className="fil-table">
                        <thead>
                            <tr>
                                <th>DATUM</th>
                                <th>UPLATILAC</th>
                                <th>METOD</th>
                                <th>VALUTA</th>
                                <th>IZNOS</th>
                                <th>RSD EKVIVALENT</th>
                                <th style={{ textAlign: 'right' }}>AKCIJE</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {dossier.finance.payments.map((p) => (
                                    <motion.tr
                                        key={p.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={p.status === 'deleted' ? 'row-deleted' : ''}
                                    >
                                        <td>{formatDate(p.date)}</td>
                                        <td>{p.payerName}</td>
                                        <td>{p.method}</td>
                                        <td><strong>{p.currency}</strong></td>
                                        <td className="value">{p.amount.toLocaleString()}</td>
                                        <td className="value-rsd">{(p.amountInRsd || 0).toLocaleString()} RSD</td>
                                        <td className="actions">
                                            <button className="icon-btn" title="Štampaj priznanicu"><Printer size={14} /></button>
                                            <button
                                                className="icon-btn delete"
                                                title="Storniraj uplatu"
                                                onClick={() => onRemovePayment(p.id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {dossier.finance.payments.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="empty-state">Nema evidentiranih uplata.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .finance-view-v2 {
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                }
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }
                .metric-card {
                    padding: 24px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    border: 1px solid var(--fil-border);
                }
                .cyan-border { border-left: 4px solid var(--fil-accent); }
                .green-border { border-left: 4px solid var(--fil-success); }
                .red-border { border-left: 4px solid var(--fil-danger); }

                .icon-bg {
                    width: 50px;
                    height: 50px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                .info {
                    display: flex;
                    flex-direction: column;
                }
                .info .label {
                    font-size: 11px;
                    font-weight: 800;
                    color: var(--fil-text-dim);
                    letter-spacing: 1px;
                }
                .info .value {
                    font-size: 24px;
                    font-weight: 900;
                }
                .info .value.success { color: var(--fil-success); }
                .info .value.danger { color: var(--fil-danger); }

                .payments-section {
                    padding: 24px;
                    border-radius: 24px;
                }
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }
                .section-header .title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .section-header h3 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 900;
                    letter-spacing: 2px;
                }
                .add-btn {
                    padding: 10px 20px;
                    background: var(--fil-accent);
                    color: var(--fil-bg);
                    border: none;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 0 15px var(--fil-accent-glow);
                }

                .fil-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .fil-table th {
                    text-align: left;
                    padding: 15px;
                    font-size: 11px;
                    font-weight: 800;
                    color: var(--fil-text-dim);
                    border-bottom: 1px solid var(--fil-border);
                }
                .fil-table td {
                    padding: 15px;
                    font-size: 13px;
                    border-bottom: 1px solid var(--fil-border);
                }
                .fil-table td.value { font-weight: 800; }
                .fil-table td.value-rsd { color: var(--fil-text-dim); font-size: 12px; }
                .row-deleted { opacity: 0.3; text-decoration: line-through; }
                .empty-state {
                    text-align: center;
                    padding: 40px !important;
                    color: var(--fil-text-dim);
                    font-style: italic;
                }

                .icon-btn {
                    padding: 8px;
                    background: transparent;
                    border: 1px solid var(--fil-border);
                    color: var(--fil-text-dim);
                    border-radius: 8px;
                    cursor: pointer;
                    margin-left: 5px;
                }
                .icon-btn:hover { color: var(--fil-text); background: rgba(255,255,255,0.05); }
                .icon-btn.delete:hover { border-color: var(--fil-danger); color: var(--fil-danger); }
            `}</style>
        </div>
    );
};
