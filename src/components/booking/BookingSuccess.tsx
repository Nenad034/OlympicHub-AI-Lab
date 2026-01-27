import React, { useState } from 'react';
import { CheckCircle, ExternalLink, List, LayoutGrid, X, Mail, Download } from 'lucide-react';
import './BookingSuccess.css';

interface BookingSuccessProps {
    bookingId: string;
    cisCode?: string;
    refCode?: string;
    status: 'confirmed' | 'pending' | 'on-request';
    provider: string;
    onClose: () => void;
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({
    bookingId,
    cisCode,
    refCode,
    status,
    provider,
    onClose
}) => {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    const getStatusInfo = () => {
        switch (status) {
            case 'confirmed':
                return {
                    icon: <CheckCircle size={64} />,
                    color: '#10b981',
                    title: 'Rezervacija Potvrđena!',
                    message: 'Vaša rezervacija je uspešno kreirana i potvrđena kod dobavljača.'
                };
            case 'pending':
                return {
                    icon: <CheckCircle size={64} />,
                    color: '#f59e0b',
                    title: 'Rezervacija U Obradi',
                    message: 'Vaša rezervacija je primljena i trenutno se obrađuje.'
                };
            case 'on-request':
                return {
                    icon: <CheckCircle size={64} />,
                    color: '#3b82f6',
                    title: 'Rezervacija Na Zahtev',
                    message: 'Vaša rezervacija je poslata i čeka potvrdu hotela.'
                };
            default:
                return {
                    icon: <CheckCircle size={64} />,
                    color: '#10b981',
                    title: 'Rezervacija Uspešna!',
                    message: 'Rezervacija je uspešno procesuirana.'
                };
        }
    };

    const statusInfo = getStatusInfo();

    const getProviderB2BUrl = () => {
        switch (provider.toLowerCase()) {
            case 'solvex':
                return `https://b2b.solvex.bg/`;
            case 'tct':
                return `https://b2b.tct.rs/`;
            case 'opengreece':
                return `https://b2b.opengreece.com/`;
            default:
                return '#';
        }
    };

    const handleOptionToggle = (option: string) => {
        if (selectedOptions.includes(option)) {
            setSelectedOptions(selectedOptions.filter(o => o !== option));
        } else {
            setSelectedOptions([...selectedOptions, option]);
        }
    };

    const handleExecuteActions = () => {
        if (selectedOptions.length === 0) {
            alert('Molimo odaberite bar jednu opciju.');
            return;
        }

        if (selectedOptions.includes('provider')) {
            window.open(getProviderB2BUrl(), '_blank');
        }

        if (selectedOptions.includes('list')) {
            window.open('/reservations', '_blank');
        }

        onClose();
    };

    const handleSelectBoth = () => {
        setSelectedOptions(['provider', 'list']);
    };

    return (
        <div className="booking-success-overlay">
            <div className="booking-success-modal">
                <button className="success-close-button" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="success-icon" style={{ color: statusInfo.color }}>
                    {statusInfo.icon}
                </div>

                <h2 className="success-title">{statusInfo.title}</h2>
                <p className="success-message">{statusInfo.message}</p>

                <div className="booking-codes-grid">
                    <div className="code-item">
                        <span className="code-label">Provider ID:</span>
                        <span className="code-value">{bookingId}</span>
                    </div>
                    {cisCode && (
                        <div className="code-item">
                            <span className="code-label">Interni CIS:</span>
                            <span className="code-value">{cisCode}</span>
                        </div>
                    )}
                    {refCode && (
                        <div className="code-item">
                            <span className="code-label">Referenca:</span>
                            <span className="code-value">{refCode}</span>
                        </div>
                    )}
                </div>

                <div className="agent-choices-section">
                    <h3>Šta želite sledeće da uradite?</h3>
                    <div className="choices-grid">
                        <label className={`choice-card ${selectedOptions.includes('provider') ? 'active' : ''}`}>
                            <input
                                type="checkbox"
                                checked={selectedOptions.includes('provider')}
                                onChange={() => handleOptionToggle('provider')}
                                hidden
                            />
                            <div className="choice-icon"><ExternalLink size={24} /></div>
                            <div className="choice-text">
                                <strong>Pogledaj u {provider}</strong>
                                <span>Otvori B2B portal dobavljača</span>
                            </div>
                        </label>

                        <label className={`choice-card ${selectedOptions.includes('list') ? 'active' : ''}`}>
                            <input
                                type="checkbox"
                                checked={selectedOptions.includes('list')}
                                onChange={() => handleOptionToggle('list')}
                                hidden
                            />
                            <div className="choice-icon"><List size={24} /></div>
                            <div className="choice-text">
                                <strong>Lista rezervacija</strong>
                                <span>Pogledaj u glavnoj listi</span>
                            </div>
                        </label>
                    </div>

                    <div className="bulk-actions">
                        <button className="btn-select-all" onClick={handleSelectBoth}>
                            <LayoutGrid size={16} /> Odaberi obe opcije
                        </button>
                    </div>
                </div>

                <div className="success-footer-actions">
                    <button className="btn-cancel-success" onClick={onClose}>
                        Zatvori
                    </button>
                    <button
                        className="btn-confirm-actions"
                        onClick={handleExecuteActions}
                        disabled={selectedOptions.length === 0}
                    >
                        Izvrši odabrano
                    </button>
                </div>
            </div>
        </div>
    );
};
