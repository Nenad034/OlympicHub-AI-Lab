import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { TripItem } from '../../../types/reservationArchitect';

interface DossierCancellationModalProps {
    item: TripItem;
    onClose: () => void;
}

export const DossierCancellationModal: React.FC<DossierCancellationModalProps> = ({ item, onClose }) => {
    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Otkazni Uslovi: {item.subject}</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-body">
                    {item.cancellationPolicy ? (
                        <div className="policy-box">
                            <pre>{typeof item.cancellationPolicy === 'string' ? item.cancellationPolicy : JSON.stringify(item.cancellationPolicy, null, 2)}</pre>
                        </div>
                    ) : (
                        <p className="no-policy">Nema unetih uslova u sistemu.</p>
                    )}
                </div>
            </div>
            <style>{`
                .modal-content {
                    width: 600px;
                    max-width: 90vw;
                    border-radius: 28px;
                    padding: 35px;
                    background: var(--fil-card);
                    border: 1px solid var(--fil-border);
                    box-shadow: 0 40px 100px rgba(0,0,0,0.6);
                    animation: modalFadeInBack 0.3s ease-out;
                }
                @keyframes modalFadeInBack {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                }
                .modal-header h3 { margin: 0; font-size: 14px; letter-spacing: 1px; color: var(--fil-accent); font-weight: 900; }
                .close-btn { background: transparent; border: none; color: var(--fil-text-dim); cursor: pointer; transition: 0.2s; }
                .close-btn:hover { color: var(--fil-danger); transform: rotate(90deg); }
                .policy-box {
                    background: rgba(0,0,0,0.3);
                    padding: 25px;
                    border-radius: 16px;
                    max-height: 450px;
                    overflow-y: auto;
                    border: 1px solid var(--fil-border);
                }
                .policy-box pre { font-family: 'Fira Code', monospace; font-size: 13px; color: var(--fil-text-dim); margin: 0; white-space: pre-wrap; line-height: 1.6; }
                .no-policy { text-align: center; color: var(--fil-text-dim); padding: 50px 0; font-weight: 700; }
            `}</style>
        </div>,
        document.body
    );
};
