import React from 'react';
import { 
    CreditCard, DollarSign, Plus, Trash2, Calendar, 
    User, Zap, Banknote, Landmark, Wallet, Ticket
} from 'lucide-react';
import type { Dossier, Payment } from '../../types/reservationArchitect';

interface FinanceTabProps {
    dossier: Dossier;
    financialStats: { totalBrutto: number; totalPaid: number; balance: number };
    onAddPayment: (p: Partial<Payment>, shouldFiscalize?: boolean) => void;
    onRemovePayment: (id: string) => void;
}

export const FinanceTab: React.FC<FinanceTabProps> = ({ dossier, onAddPayment, onRemovePayment }) => {
    const navy = '#1e293b';
    const silverBorder = 'rgba(30, 41, 59, 0.1)';

    const totalPaid = dossier.finance?.payments?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
    const balance = (dossier.finance?.totalBrutto || 0) - totalPaid;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: navy }}>
            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                <div className="v4-table-card" style={{ padding: '24px', borderLeft: '6px solid #1e293b', background: 'white', borderRadius: '20px', border: `1px solid ${silverBorder}`, borderLeftWidth: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 950, color: '#64748b' }}>TOTAL BRUTTO</div>
                    <div style={{ fontSize: '28px', fontWeight: 950 }}>{(dossier.finance?.totalBrutto || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} <span style={{ fontSize: '14px', opacity: 0.5 }}>EUR</span></div>
                </div>
                <div className="v4-table-card" style={{ padding: '24px', borderLeft: '6px solid #10b981', background: 'white', borderRadius: '20px', border: `1px solid ${silverBorder}`, borderLeftWidth: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 950, color: '#64748b' }}>UKUPNO UPLAĆENO</div>
                    <div style={{ fontSize: '28px', fontWeight: 950, color: '#10b981' }}>{totalPaid.toLocaleString('de-DE', { minimumFractionDigits: 2 })} <span style={{ fontSize: '14px', opacity: 0.5 }}>EUR</span></div>
                </div>
                <div className="v4-table-card" style={{ padding: '24px', borderLeft: '6px solid #ef4444', background: 'white', borderRadius: '20px', border: `1px solid ${silverBorder}`, borderLeftWidth: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 950, color: '#64748b' }}>SALDO (DUG)</div>
                    <div style={{ fontSize: '28px', fontWeight: 950, color: '#ef4444' }}>{balance.toLocaleString('de-DE', { minimumFractionDigits: 2 })} <span style={{ fontSize: '14px', opacity: 0.5 }}>EUR</span></div>
                </div>
            </div>

            {/* Main Payments List */}
            <div className="v4-table-card" style={{ background: 'white', border: `1px solid ${silverBorder}`, borderRadius: '24px', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: `1px solid ${silverBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><DollarSign size={20} /><h3 style={{ margin: 0, fontSize: '16px', fontWeight: 950 }}>TRANSAKCIJE I UPLATE</h3></div>
                    <button 
                        onClick={() => onAddPayment({ amount: 0, currency: 'EUR', method: 'Cash' as any })} 
                        style={{ height: '40px', padding: '0 20px', borderRadius: '12px', background: navy, color: 'white', border: 'none', fontWeight: 950, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={18} /> DODAJ UPLATU
                    </button>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                        <tr>
                            <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 950, color: '#64748b', textAlign: 'left' }}>PLATILAC</th>
                            <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 950, color: '#64748b', textAlign: 'left' }}>METOD</th>
                            <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 950, color: '#64748b', textAlign: 'left' }}>DATUM</th>
                            <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 950, color: '#64748b', textAlign: 'right' }}>IZNOS</th>
                            <th width="80" style={{ padding: '16px 24px', textAlign: 'right' }}>AKCIJE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dossier.finance?.payments?.length ? dossier.finance.payments.map((p, i) => (
                            <tr key={p.id || i} style={{ borderBottom: i === dossier.finance.payments.length - 1 ? 'none' : `1px solid ${silverBorder}` }}>
                                <td style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800 }}>{p.payerName}</td>
                                <td style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 900 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {p.method === 'Cash' ? <Wallet size={14} /> : p.method === 'Card' ? <CreditCard size={14} /> : p.method === 'Check' ? <Ticket size={14} /> : <Landmark size={14} />}
                                        {p.method.toUpperCase()}
                                    </div>
                                </td>
                                <td style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800 }}>{p.date}</td>
                                <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 950, color: '#10b981', textAlign: 'right' }}>+ {p.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} {p.currency}</td>
                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                    <button onClick={() => onRemovePayment(p.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} style={{ padding: '100px', textAlign: 'center', opacity: 0.3 }}><Zap size={40} style={{ margin: '0 auto 16px' }} /><div style={{ fontSize: '12px', fontWeight: 800 }}>NEMA EVIDENTIRANIH UPLATA</div></td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
