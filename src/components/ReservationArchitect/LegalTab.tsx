import React, { useState } from 'react';
import { Scale, Shield, ShieldCheck, ShieldAlert, FileText, Info, Clock, CheckCircle2, History, Terminal, ExternalLink } from 'lucide-react';
import type { Dossier } from '../../types/reservationArchitect';
import { motion, AnimatePresence } from 'framer-motion';

interface LegalTabProps {
    dossier: Dossier;
    setDossier: (dossier: Dossier) => void;
}

export const LegalTab: React.FC<LegalTabProps> = ({ dossier, setDossier }) => {
    const [isNotepadView, setIsNotepadView] = useState(false);

    const handleInsuranceChange = (key: keyof Dossier['insurance'], value: any) => {
        setDossier({
            ...dossier,
            insurance: {
                ...dossier.insurance,
                [key]: value
            }
        });
    };

    return (
        <div className="v4-legal-tab" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Scale size={22} className="cyan-text" />
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, letterSpacing: '1px' }}>PRAVA, GARANCIJE I OSIGURANJA</h3>
                </div>

                <div className="v4-nav-tabs" style={{ marginBottom: 0 }}>
                    <button className={`v4-tab-btn ${!isNotepadView ? 'active' : ''}`} onClick={() => setIsNotepadView(false)}>
                        <Terminal size={18} /> INTERAKTIVNO
                    </button>
                    <button className={`v4-tab-btn ${isNotepadView ? 'active' : ''}`} onClick={() => setIsNotepadView(true)}>
                        <FileText size={18} /> RAW PREGLED
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>

                {/* Insurance Status Card */}
                <div className="v4-table-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                        <ShieldCheck size={18} style={{ color: '#10b981' }} />
                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)' }}>STATUS OSIGURANJA</h4>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div className="v4-text-main" style={{ fontSize: '14px' }}>OSIGURANJE OD OTKAZA</div>
                                <div className="v4-text-dim" style={{ fontSize: '11px' }}>Polisa u slučaju odustajanja od puta</div>
                            </div>
                            <button
                                className={`v4-status-pill ${dossier.insurance.cancellationOffered ? 'success' : 'danger'}`}
                                onClick={() => handleInsuranceChange('cancellationOffered', !dossier.insurance.cancellationOffered)}
                                style={{ width: '120px', height: '32px', cursor: 'pointer', border: 'none' }}
                            >
                                {dossier.insurance.cancellationOffered ? 'PONUĐENO' : 'ODBIJENO'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div className="v4-text-main" style={{ fontSize: '14px' }}>ZDRAVSTVENO OSIGURANJE</div>
                                <div className="v4-text-dim" style={{ fontSize: '11px' }}>Međunarodno putno zdravstveno</div>
                            </div>
                            <button
                                className={`v4-status-pill ${dossier.insurance.healthOffered ? 'success' : 'danger'}`}
                                onClick={() => handleInsuranceChange('healthOffered', !dossier.insurance.healthOffered)}
                                style={{ width: '120px', height: '32px', cursor: 'pointer', border: 'none' }}
                            >
                                {dossier.insurance.healthOffered ? 'PONUĐENO' : 'ODBIJENO'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* E-Confirmation Card */}
                <div className="v4-table-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                        <CheckCircle2 size={18} style={{ color: '#fbbf24' }} />
                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)' }}>ELEKTRONSKA POTVRDA SAGLASNOSTI</h4>
                    </div>
                    {dossier.insurance.confirmationText ? (
                        <div style={{ padding: '16px', background: 'rgba(0, 229, 255, 0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)', borderLeft: '4px solid var(--accent-cyan)' }}>
                            <div style={{ fontSize: '14px', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '12px' }}>"{dossier.insurance.confirmationText}"</div>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                                <span><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {dossier.insurance.confirmationTimestamp}</span>
                                <span>IP: 185.12.33.102</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '32px 0', opacity: 0.2 }}>
                            <ShieldAlert size={32} />
                            <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '8px' }}>NEMA POTVRDE</div>
                        </div>
                    )}
                </div>

                {/* Guarantee Policy Card */}
                <div className="v4-table-card" style={{ padding: '24px', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                        <FileText size={18} className="cyan-text" />
                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)' }}>DETALJI GARANCIJE PUTOVANJA</h4>
                    </div>
                    <div className="v4-metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        <div className="v4-input-group">
                            <label className="v4-label">BROJ POLISE</label>
                            <input className="v4-input" value={dossier.insurance.guaranteePolicy} onChange={(e) => handleInsuranceChange('guaranteePolicy', e.target.value)} />
                        </div>
                        <div className="v4-input-group">
                            <label className="v4-label">KONTAKT OSIGURAVAČA</label>
                            <input className="v4-input" value={dossier.insurance.insurerContact} onChange={(e) => handleInsuranceChange('insurerContact', e.target.value)} />
                        </div>
                        <div className="v4-input-group">
                            <label className="v4-label">EMAIL OSIGURAVAČA</label>
                            <input className="v4-input" value={dossier.insurance.insurerEmail} onChange={(e) => handleInsuranceChange('insurerEmail', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* General Terms & Conditions Link */}
                <div className="v4-table-card" style={{ padding: '24px', gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-cyan)' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ padding: '10px', background: 'rgba(0, 229, 255, 0.1)', borderRadius: '8px' }}>
                            <Scale size={20} className="cyan-text" />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '0.5px' }}>OPŠTI USLOVI PUTOVANJA TURISTIČKE AGENCIJE</h4>
                            <div className="v4-text-dim" style={{ fontSize: '11px', marginTop: '6px', lineHeight: 1.4 }}>Zvanični dokument o opštim uslovima koji se primenjuju na ovaj turistički aranžman. Obavezno za uručenje putniku.</div>
                        </div>
                    </div>
                    <a
                        href="/opsti-uslovi.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="v4-action-btn primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '10px 20px' }}
                    >
                        <ExternalLink size={16} />
                        OTVORI DOKUMENT
                    </a>
                </div>
            </div>
        </div>
    );
};
