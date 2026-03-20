import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Banknote, CreditCard, Landmark, Ticket, Plus, Trash2, Calendar, User, Check } from 'lucide-react';
import type { PaymentRecord, Dossier } from '../../../types/reservationArchitect';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    draft: PaymentRecord;
    setDraft: (draft: PaymentRecord) => void;
    onSave: (draft: PaymentRecord, fiscalize: boolean) => void;
    dossier: Dossier;
}

interface CheckDetail {
    id: string;
    number: string;
    bank: string;
    realizationDate: string;
    amount: number | string;
}

export const PaymentEntryModal: React.FC<PaymentEntryModalProps> = ({
    isOpen, onClose, draft, setDraft, onSave, dossier
}) => {
    const [checkDetails, setCheckDetails] = useState<CheckDetail[]>([]);
    const navy = '#1e293b';
    const silverBorder = 'rgba(30, 41, 59, 0.1)';
    const currencies = ['EUR', 'RSD', 'USD', 'CHF', 'GBP'];

    // Sync draft amount if checks are used
    useEffect(() => {
        if (draft.method === 'Check') {
            const total = checkDetails.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
            setDraft({ ...draft, amount: total });
        }
    }, [checkDetails, draft.method]);

    const handleFastDate = (val: string) => {
        const clean = val.replace(/\D/g, '');
        if (clean.length === 8) {
            const day = clean.slice(0, 2);
            const month = clean.slice(2, 4);
            const year = clean.slice(4, 8);
            setDraft({...draft, date: `${year}-${month}-${day}`});
        }
    };

    const addCheckRow = () => {
        setCheckDetails([...checkDetails, { id: `ch-${Date.now()}`, number: '', bank: '', realizationDate: '', amount: '' }]);
    };

    const updateCheckRow = (id: string, field: keyof CheckDetail, value: any) => {
        setCheckDetails(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    if (!isOpen) return null;

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000000 }}>
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                style={{ 
                    width: '100%', 
                    maxWidth: draft.method === 'Check' ? '1100px' : '520px', 
                    background: 'white', 
                    borderRadius: '32px', 
                    boxShadow: '0 50px 100px rgba(0,0,0,0.5)', 
                    overflow: 'hidden',
                    transition: 'max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                {/* Header */}
                <div style={{ padding: '24px 40px', background: navy, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 950 }}>NOVA UPLATA</h3>
                        <div style={{ fontSize: '11px', opacity: 0.5 }}>DOSS: {dossier.cisCode} • REF: {draft.receiptNo}</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '12px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                </div>

                <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {/* Method Selector */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        {[
                            { id: 'Cash', icon: <Banknote size={20}/>, label: 'GOTOVINA' }, 
                            { id: 'Card', icon: <CreditCard size={20}/>, label: 'KARTICA' }, 
                            { id: 'Transfer', icon: <Landmark size={20}/>, label: 'PRENOS' }, 
                            { id: 'Check', icon: <Ticket size={20}/>, label: 'ČEK' }
                        ].map(m => (
                            <button 
                                key={m.id} 
                                onClick={() => setDraft({...draft, method: m.id as any})} 
                                style={{ 
                                    height: '84px', borderRadius: '24px', border: `2.5px solid ${draft.method === m.id ? navy : silverBorder}`, 
                                    background: draft.method === m.id ? 'rgba(30, 41, 59, 0.04)' : 'white', 
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' 
                                }}
                            >
                                <div style={{ color: draft.method === m.id ? navy : '#64748b' }}>{m.icon}</div>
                                <div style={{ fontSize: '10px', fontWeight: 950, color: draft.method === m.id ? navy : '#64748b' }}>{m.label}</div>
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: draft.method === 'Check' ? '380px 1fr' : '1fr', gap: '50px' }}>
                        {/* Main Form Area */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ background: '#f8fafc', padding: '30px', borderRadius: '28px', border: `1px solid ${silverBorder}`, textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', marginBottom: '16px' }}>IZNOS ZA UPLATU</div>
                                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                    <input 
                                        autoFocus 
                                        placeholder="0.00" 
                                        type="number" 
                                        style={{ width: '100%', textAlign: 'center', height: '80px', fontSize: '52px', fontWeight: 950, border: 'none', background: 'transparent', color: navy, outline: 'none' }} 
                                        value={draft.amount || ''} 
                                        readOnly={draft.method === 'Check'} 
                                        onFocus={(e) => e.target.select()} 
                                        onChange={e => setDraft({...draft, amount: e.target.value === '' ? 0 : parseFloat(e.target.value)})} 
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
                                    {currencies.map(c => (
                                        <button key={c} onClick={() => setDraft({...draft, currency: c as any})} style={{ padding: '6px 14px', borderRadius: '10px', background: draft.currency === c ? navy : 'rgba(255,255,255,0.6)', color: draft.currency === c ? 'white' : '#64748b', border: `1.5px solid ${draft.currency === c ? navy : silverBorder}`, fontSize: '10px', fontWeight: 950, cursor: 'pointer' }}>{c}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="v4-field-group">
                                <label style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', marginBottom: '10px', display: 'block' }}>PLATILAC</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                    <input className="v4-input" style={{ width: '100%', height: '52px', paddingLeft: '50px', borderRadius: '16px', border: `1px solid ${silverBorder}`, outline: 'none' }} value={draft.payerName || ''} onChange={e => setDraft({...draft, payerName: e.target.value})} />
                                </div>
                            </div>

                            <div className="v4-field-group">
                                <label style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', marginBottom: '10px', display: 'block' }}>DATUM (UNESI: 01052026)</label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ position: 'relative', flex: 1.5 }}>
                                        <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                        <input placeholder="brzi unos" className="v4-input" style={{ width: '100%', height: '52px', paddingLeft: '50px', borderRadius: '16px', border: `1px solid ${silverBorder}`, outline: 'none' }} onChange={e => handleFastDate(e.target.value)} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input type="date" className="v4-input" style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '16px', border: `1px solid ${silverBorder}`, outline: 'none', fontSize: '12px' }} value={draft.date || ''} onChange={e => setDraft({...draft, date: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Check Spec (Only if Check) */}
                        {draft.method === 'Check' && (
                            <div style={{ borderLeft: `1px solid ${silverBorder}`, paddingLeft: '50px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div><h4 style={{ margin: 0, fontSize: '15px', fontWeight: 950 }}>SPECIFIKACIJA ČEKOVA</h4><div style={{ fontSize: '11px', opacity: 0.5 }}>EVIDENCIJA ČEKOVA</div></div>
                                    <button onClick={addCheckRow} style={{ height: '40px', padding: '0 20px', borderRadius: '14px', background: navy, color: 'white', border: 'none', fontSize: '11px', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}><Plus size={18}/> DODAJ ČEK</button>
                                </div>
                                <div style={{ maxHeight: '380px', overflowY: 'auto', border: `1px solid ${silverBorder}`, borderRadius: '24px', background: '#f8f9fb', padding: '4px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                        <thead><tr><th style={{ padding: '0 16px', fontSize: '10px', fontWeight: 950, color: '#64748b', textAlign: 'left' }}>BR. ČEKA</th><th style={{ padding: '0 16px', fontSize: '10px', fontWeight: 950, color: '#64748b', textAlign: 'left' }}>BANKA</th><th style={{ padding: '0 16px', fontSize: '10px', fontWeight: 950, color: '#64748b', textAlign: 'left' }}>DATUM</th><th style={{ padding: '0 16px', fontSize: '10px', fontWeight: 950, color: '#64748b', textAlign: 'right' }}>IZNOS</th><th width="40"></th></tr></thead>
                                        <tbody>
                                            {checkDetails.map(check => (
                                                <tr key={check.id} style={{ background: 'white' }}>
                                                    <td style={{ padding: '12px 16px', borderRadius: '16px 0 0 16px', borderBottom: `1px solid ${silverBorder}` }}><input placeholder="Spec..." style={{ border: 'none', background: 'transparent', fontWeight: 800, width: '100%', outline: 'none' }} value={check.number} onChange={e => updateCheckRow(check.id, 'number', e.target.value)} /></td>
                                                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${silverBorder}` }}><input placeholder="Banka" style={{ border: 'none', background: 'transparent', fontWeight: 800, width: '100%', outline: 'none' }} value={check.bank} onChange={e => updateCheckRow(check.id, 'bank', e.target.value)} /></td>
                                                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${silverBorder}` }}><input type="date" style={{ border: 'none', background: 'transparent', fontWeight: 800, width: '100%', outline: 'none', fontSize: '11px' }} value={check.realizationDate} onChange={e => updateCheckRow(check.id, 'realizationDate', e.target.value)} /></td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'right', borderRadius: '0 16px 16px 0', borderBottom: `1px solid ${silverBorder}` }}><input type="number" onFocus={(e) => e.target.select()} style={{ border: 'none', background: 'transparent', fontWeight: 950, width: '80px', textAlign: 'right', color: '#10b981', outline: 'none' }} value={check.amount} onChange={e => updateCheckRow(check.id, 'amount', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                                                    <td><button onClick={() => setCheckDetails(checkDetails.filter(c => c.id !== check.id))} style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer' }}><Trash2 size={16}/></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '30px 40px', background: '#f8fafc', borderTop: `1px solid ${silverBorder}`, display: 'flex', gap: '20px' }}>
                    <button onClick={onClose} style={{ flex: 1, height: '60px', borderRadius: '20px', background: 'white', border: `1.5px solid ${silverBorder}`, color: navy, fontSize: '13px', fontWeight: 950, cursor: 'pointer' }}>ODUSTANI</button>
                    <button onClick={() => onSave(draft, false)} style={{ flex: 2, height: '60px', borderRadius: '20px', background: '#10b981', color: 'white', border: 'none', fontSize: '14px', fontWeight: 950, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}><Check size={24} strokeWidth={3} /> POTVRDI I PROKNJIŽI</button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};
