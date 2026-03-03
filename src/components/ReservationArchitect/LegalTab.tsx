import React, { useState } from 'react';
import { Scale, Shield, ShieldCheck, ShieldAlert, FileText, Info, Clock, CheckCircle2 } from 'lucide-react';
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

    const getLegalNotepadText = () => {
        let text = `--- PRAVA I OBAVEZE / DOSSIER ${dossier.cisCode} ---\n\n`;
        text += `GARANCIJA PUTOVANJA:\n${dossier.insurance.guaranteePolicy}\n`;
        text += `KONTAKT OSIGURAVAČA: ${dossier.insurance.insurerContact}\n`;
        text += `EMAIL OSIGURAVAČA: ${dossier.insurance.insurerEmail}\n\n`;
        text += `PONUĐENO OSIGURANJE OD OTKAZA: ${dossier.insurance.cancellationOffered ? 'DA' : 'NE'}\n`;
        text += `INFORMACIJE O ZDRAVSTVENOM OSIGURANJU: ${dossier.insurance.healthOffered ? 'DA' : 'NE'}\n\n`;
        if (dossier.insurance.confirmationText) {
            text += `ELEKTRONSKA POTVRDA PUTNIKA:\n`;
            text += `"${dossier.insurance.confirmationText}"\n`;
            text += `VREME POTVRDE: ${dossier.insurance.confirmationTimestamp}\n`;
        }
        return text;
    };

    return (
        <div className="legal-tab-v2">
            <div className="tab-header-v2">
                <div className="title-group">
                    <div className="icon-box">
                        <Scale size={20} />
                    </div>
                    <div>
                        <h2>PRAVA I GARANCIJE</h2>
                        <p>Garancije putovanja, polise osiguranja i potvrde saglasnosti</p>
                    </div>
                </div>
                <button
                    className={`notepad-toggle ${isNotepadView ? 'active' : ''}`}
                    onClick={() => setIsNotepadView(!isNotepadView)}
                >
                    <FileText size={16} />
                    {isNotepadView ? 'IZMENA PODATAKA' : 'PREGLED ZA ŠTAMPU'}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {isNotepadView ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="fil-card notepad-view"
                        key="notepad"
                    >
                        <div className="notepad-body">
                            <pre>{getLegalNotepadText()}</pre>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="legal-content-grid"
                        key="content"
                    >
                        <div className="left-column">
                            <div className="fil-card insurance-status">
                                <div className="section-head">
                                    <ShieldCheck size={18} className="text-success" />
                                    <h3>Status Osiguranja</h3>
                                </div>
                                <div className="toggle-list">
                                    <div className="toggle-item">
                                        <div className="info">
                                            <label>Osiguranje od otkaza</label>
                                            <p>Ponuditi putniku polisu od otkaza putovanja</p>
                                        </div>
                                        <button
                                            className={`toggle-btn ${dossier.insurance.cancellationOffered ? 'active' : ''}`}
                                            onClick={() => handleInsuranceChange('cancellationOffered', !dossier.insurance.cancellationOffered)}
                                        >
                                            {dossier.insurance.cancellationOffered ? 'PONUĐENO' : 'NIJE PONUĐENO'}
                                        </button>
                                    </div>
                                    <div className="toggle-item">
                                        <div className="info">
                                            <label>Zdravstveno osiguranje</label>
                                            <p>Međunarodno putno zdravstveno osiguranje</p>
                                        </div>
                                        <button
                                            className={`toggle-btn ${dossier.insurance.healthOffered ? 'active' : ''}`}
                                            onClick={() => handleInsuranceChange('healthOffered', !dossier.insurance.healthOffered)}
                                        >
                                            {dossier.insurance.healthOffered ? 'PONUĐENO' : 'NIJE PONUĐENO'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="fil-card confirmation-box">
                                <div className="section-head">
                                    <CheckCircle2 size={18} className="text-accent" />
                                    <h3>Elektronska Potvrda</h3>
                                </div>
                                {dossier.insurance.confirmationText ? (
                                    <div className="confirmation-data">
                                        <div className="quote">"{dossier.insurance.confirmationText}"</div>
                                        <div className="meta">
                                            <span><Clock size={12} /> {dossier.insurance.confirmationTimestamp}</span>
                                            <span>IP: 192.168.1.1</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <ShieldAlert size={32} />
                                        <p>Nije zabeležena elektronska potvrda saglasnosti.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="right-column">
                            <div className="fil-card policy-details">
                                <div className="section-head">
                                    <FileText size={18} />
                                    <h3>Garancija Putovanja</h3>
                                </div>
                                <div className="input-group">
                                    <label>Polisa Broj</label>
                                    <input
                                        type="text"
                                        value={dossier.insurance.guaranteePolicy}
                                        onChange={(e) => handleInsuranceChange('guaranteePolicy', e.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Kontakt Osiguravača</label>
                                    <input
                                        type="text"
                                        value={dossier.insurance.insurerContact}
                                        onChange={(e) => handleInsuranceChange('insurerContact', e.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Email Osiguravača</label>
                                    <input
                                        type="text"
                                        value={dossier.insurance.insurerEmail}
                                        onChange={(e) => handleInsuranceChange('insurerEmail', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .legal-tab-v2 { display: flex; flex-direction: column; gap: 25px; }
                .legal-content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
                
                .section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
                .section-head h3 { font-size: 14px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 1px; }

                .insurance-status { padding: 25px; }
                .toggle-list { display: flex; flex-direction: column; gap: 20px; }
                .toggle-item { display: flex; justify-content: space-between; align-items: center; }
                .toggle-item .info label { display: block; font-size: 14px; font-weight: 700; margin-bottom: 4px; }
                .toggle-item .info p { font-size: 11px; color: var(--fil-text-dim); margin: 0; }
                
                .toggle-btn {
                    padding: 8px 16px;
                    border-radius: 8px;
                    border: 1px solid var(--fil-border);
                    background: transparent;
                    color: var(--fil-text-dim);
                    font-size: 10px;
                    font-weight: 900;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .toggle-btn.active { background: var(--fil-accent); color: var(--fil-bg); border-color: var(--fil-accent); }

                .confirmation-box { padding: 25px; margin-top: 25px; }
                .confirmation-data {
                    background: rgba(255,255,255,0.03);
                    padding: 20px;
                    border-radius: 12px;
                    border-left: 3px solid var(--fil-accent);
                }
                .confirmation-data .quote { font-style: italic; font-size: 14px; line-height: 1.6; margin-bottom: 15px; }
                .confirmation-data .meta { display: flex; gap: 20px; font-size: 11px; color: var(--fil-text-dim); font-weight: 700; }

                .policy-details { padding: 25px; display: flex; flex-direction: column; gap: 20px; }
                .input-group label { display: block; font-size: 11px; font-weight: 800; color: var(--fil-text-dim); margin-bottom: 8px; }
                .input-group input {
                    width: 100%;
                    background: var(--fil-bg);
                    border: 1px solid var(--fil-border);
                    border-radius: 10px;
                    padding: 12px 15px;
                    color: var(--fil-text);
                    font-size: 14px;
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                    padding: 40px;
                    color: var(--fil-text-dim);
                    text-align: center;
                    background: rgba(239, 68, 68, 0.02);
                    border-radius: 12px;
                    border: 1px dashed var(--fil-border);
                }
                .empty-state p { font-size: 12px; margin: 0; }
            `}</style>
        </div>
    );
};
