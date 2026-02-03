import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Copy, X } from 'lucide-react';
import './BookingSuccessModal.css';

interface BookingSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenDossier?: () => void;
    bookingCode: string;
    internalId: string;
    provider: string;
    hotelName: string;
}

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
    isOpen,
    onClose,
    onOpenDossier,
    bookingCode,
    internalId,
    provider,
    hotelName
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="booking-success-overlay">
            <div className="booking-success-modal">
                <div className="success-header">
                    <div className="success-icon-wrapper">
                        <CheckCircle2 size={48} color="#10B981" />
                    </div>
                </div>

                <div className="success-content">
                    <h2>Rezervacija Uspešna!</h2>
                    <p className="hotel-name">{hotelName}</p>
                    <p className="success-message">
                        Vaša rezervacija je uspešno potvrđena u <strong>{provider}</strong> sistemu.
                    </p>

                    <div className="booking-info-card">
                        <div className="info-row">
                            <span className="label">BROJ REZERVACIJE</span>
                            <div className="value-group">
                                <span className="code">{bookingCode || internalId}</span>
                                <button
                                    className="copy-btn"
                                    onClick={() => navigator.clipboard.writeText(bookingCode || internalId)}
                                    title="Kopiraj broj"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>
                        {bookingCode !== internalId && (
                            <div className="info-row secondary">
                                <span className="label">INTERNI ID</span>
                                <span className="value">{internalId}</span>
                            </div>
                        )}
                    </div>

                    <p className="next-steps">
                        Potvrda rezervacije je poslata na vašu email adresu.
                    </p>
                </div>

                <div className="success-actions">
                    <div className="success-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {onOpenDossier && (
                            <button className="primary-btn dossier-btn" onClick={onOpenDossier}>
                                Kreiraj Dosije / Ugovor
                            </button>
                        )}
                        <button className="secondary-btn" onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                            U redu, zatvori
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
