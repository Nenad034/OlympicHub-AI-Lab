import React from 'react';
import { createPortal } from 'react-dom';
import { X, Banknote, CreditCard, ArrowRightLeft, FileText } from 'lucide-react';
import type { PaymentRecord, Dossier } from '../../../types/reservationArchitect';

interface PaymentEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    draft: PaymentRecord;
    setDraft: (draft: PaymentRecord) => void;
    onSave: (draft: PaymentRecord, fiscalize: boolean) => void;
    dossier: Dossier;
}

export const PaymentEntryModal: React.FC<PaymentEntryModalProps> = ({
    onClose, draft, setDraft, onSave
}) => {
    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="payment-modal-v2 glass" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="title-group">
                        <label className="text-xs">NOVA UPLATA</label>
                        <h2>{draft.receiptNo}</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="payment-form">
                    <div className="input-row">
                        <div className="input-group">
                            <label>IZNOS ZA UPLATU</label>
                            <input
                                type="number"
                                autoFocus
                                value={draft.amount || ''}
                                onChange={e => setDraft({ ...draft, amount: parseFloat(e.target.value) })}
                                className="main-amount"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="input-group">
                            <label>VALUTA</label>
                            <select
                                className="fil-input"
                                value={draft.currency}
                                onChange={e => setDraft({ ...draft, currency: e.target.value as any })}
                            >
                                <option value="EUR">EUR</option>
                                <option value="RSD">RSD</option>
                                <option value="USD">USD</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>
                    </div>

                    <div className="method-section">
                        <label className="text-xs">NAČIN UPLATE</label>
                        <div className="method-grid">
                            {[
                                { id: 'Cash', label: 'GOTOVINA', icon: <Banknote size={20} /> },
                                { id: 'Card', label: 'KARTICA', icon: <CreditCard size={20} /> },
                                { id: 'Transfer', label: 'PRENOS', icon: <ArrowRightLeft size={20} /> },
                                { id: 'Check', label: 'ČEKOVI', icon: <FileText size={20} /> }
                            ].map(m => (
                                <button
                                    key={m.id}
                                    className={`method-btn ${draft.method === m.id ? 'active' : ''}`}
                                    onClick={() => setDraft({ ...draft, method: m.id as any })}
                                >
                                    {m.icon}
                                    <span>{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label>IME I PREZIME UPLATIOCA (AKO NIJE NOSILAC)</label>
                        <input
                            className="fil-input"
                            value={draft.payerName || ''}
                            placeholder="Ime i prezime..."
                            onChange={e => setDraft({ ...draft, payerName: e.target.value })}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="fil-btn-ghost" onClick={onClose}>ODUSTANI</button>
                    <button className="fil-btn-primary" onClick={() => onSave(draft, true)}>
                        POTVRDI I FISKALIZUJ
                    </button>
                </div>
            </div>
            <style>{`
                .payment-modal-v2 {
                    width: 550px;
                    max-width: 95vw;
                    padding: 40px;
                    border-radius: 32px;
                    background: var(--fil-card);
                    border: 1px solid var(--fil-border);
                    box-shadow: 0 40px 100px rgba(0,0,0,0.6);
                    animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .title-group h2 { margin: 4px 0 0 0; font-size: 20px; color: var(--fil-accent); letter-spacing: 1px; font-weight: 900; }
                .payment-form { display: flex; flex-direction: column; gap: 25px; margin: 30px 0; }
                .input-row { display: grid; grid-template-columns: 1fr 120px; gap: 20px; }
                .input-group label { display: block; margin-bottom: 10px; font-size: 10px; font-weight: 800; color: var(--fil-text-dim); letter-spacing: 0.5px; }
                .main-amount {
                    width: 100%;
                    padding: 20px;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid var(--fil-border);
                    border-radius: 18px;
                    font-size: 36px !important;
                    font-weight: 900;
                    color: var(--fil-accent) !important;
                    outline: none;
                    text-align: center;
                    transition: all 0.2s;
                }
                .main-amount:focus { border-color: var(--fil-accent); box-shadow: 0 0 20px var(--fil-accent-glow); }
                .method-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
                .method-btn {
                    padding: 15px 10px;
                    border-radius: 18px;
                    border: 1px solid var(--fil-border);
                    background: rgba(255,255,255,0.02);
                    color: var(--fil-text-dim);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .method-btn span { font-size: 10px; font-weight: 800; }
                .method-btn:hover { background: rgba(255,255,255,0.05); border-color: var(--fil-text-dim); }
                .method-btn.active {
                    background: var(--fil-accent);
                    color: var(--fil-bg);
                    border-color: var(--fil-accent);
                    box-shadow: 0 0 20px var(--fil-accent-glow);
                }
                .modal-footer {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 15px;
                    margin-top: 10px;
                }
                .modal-header { display: flex; justify-content: space-between; align-items: flex-start; }
            `}</style>
        </div>,
        document.body
    );
};
