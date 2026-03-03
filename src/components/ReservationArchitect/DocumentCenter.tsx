import {
    FileText, Send, Mail, MessageSquare,
    Printer, Download, Sparkles, Globe,
    ChevronRight, BookOpen, Receipt, FileCheck, Share2
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Dossier } from '../../types/reservationArchitect';
import type { Language } from '../../utils/translations';

interface DocumentCenterProps {
    dossier: Dossier;
    docSettings: { [key: string]: Language };
    onLanguageChange: (docType: string, lang: Language) => void;
    onGenerate: (type: string, format: 'PDF' | 'HTML') => void;
    onSend: (type: string, method: 'Email' | 'Viber') => void;
}

export const DocumentCenter: React.FC<DocumentCenterProps> = ({
    dossier,
    docSettings,
    onLanguageChange,
    onGenerate,
    onSend
}) => {
    const documentTypes = [
        { id: 'contract', label: 'Ugovor o Putovanju', icon: <FileText size={18} /> },
        { id: 'voucher', label: 'Vaučer / Smeštaj', icon: <BookOpen size={18} /> },
        { id: 'proforma', label: 'Račun / Profaktura', icon: <Receipt size={18} /> },
        { id: 'itinerary', label: 'Plan Puta / Itinerer', icon: <FileCheck size={18} /> }
    ];

    const languages: Language[] = ['Srpski', 'Engleski'];

    return (
        <div className="v3-doc-center v3-glass-panel v3-animate-in">
            <div className="v3-card-header">
                <div className="v3-icon-box cyan"><Sparkles size={20} /></div>
                <h3>DOCUMENT CENTER</h3>
            </div>

            <div className="v3-doc-list">
                {documentTypes.map((doc) => (
                    <motion.div
                        key={doc.id}
                        className="v3-doc-card"
                        whileHover={{ y: -2 }}
                    >
                        <div className="v3-doc-main">
                            <div className="doc-icon">{doc.icon}</div>
                            <div className="doc-info">
                                <span className="label">{doc.label}</span>
                                <div className="lang-selector">
                                    {languages.map(lang => (
                                        <button
                                            key={lang}
                                            onClick={() => onLanguageChange(doc.id, lang)}
                                            className={`lang-pill ${docSettings[doc.id] === lang ? 'active' : ''}`}
                                        >
                                            {lang === 'Srpski' ? 'SR' : 'EN'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="v3-doc-actions">
                            <button className="v3-doc-btn pdf" onClick={() => onGenerate(doc.id, 'PDF')}>
                                <Download size={14} /> PDF
                            </button>
                            <button className="v3-doc-btn viber" onClick={() => onSend(doc.id, 'Viber')}>
                                <MessageSquare size={14} />
                            </button>
                            <button className="v3-doc-btn mail" onClick={() => onSend(doc.id, 'Email')}>
                                <Send size={14} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="v3-ai-trigger">
                <div className="ai-content">
                    <div className="ai-icon gold">
                        <Sparkles size={22} />
                    </div>
                    <div className="ai-text">
                        <span className="v3-label">PREMIUM AI</span>
                        <h4>ASSISTANT</h4>
                    </div>
                </div>
                <ChevronRight size={18} className="v3-text-dim" />
            </div>

            <style>{`
                .v3-doc-center { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
                .v3-doc-list { display: flex; flex-direction: column; gap: 12px; }
                
                .v3-doc-card { 
                    background: rgba(0,0,0,0.2); border: 1px solid var(--v3-border); 
                    border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 16px;
                }
                .v3-doc-main { display: flex; align-items: center; gap: 12px; }
                .doc-icon { 
                    width: 36px; height: 36px; border-radius: 8px; background: var(--v3-accent-dim); 
                    color: var(--v3-accent); display: flex; align-items: center; justify-content: center;
                }
                .doc-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
                .doc-info .label { font-size: 13px; font-weight: 700; color: #fff; }
                
                .lang-selector { display: flex; gap: 4px; }
                .lang-pill { 
                    padding: 2px 6px; font-size: 9px; font-weight: 900; background: transparent; 
                    border: 1px solid var(--v3-border); color: var(--v3-text-dim); border-radius: 4px;
                    cursor: pointer; transition: 0.2s;
                }
                .lang-pill.active { background: var(--v3-accent); color: #000; border-color: var(--v3-accent); }

                .v3-doc-actions { display: grid; grid-template-columns: 1fr 40px 40px; gap: 6px; }
                .v3-doc-btn {
                    height: 36px; border: 1px solid var(--v3-border); border-radius: 8px;
                    background: rgba(255,255,255,0.03); color: var(--v3-text);
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    font-size: 11px; font-weight: 800; cursor: pointer; transition: 0.2s;
                }
                .v3-doc-btn:hover { background: rgba(255,255,255,0.08); border-color: var(--v3-accent-glow); color: var(--v3-accent); }
                .v3-doc-btn.pdf:hover { background: var(--v3-accent-dim); }

                .v3-ai-trigger {
                    margin-top: 10px; padding: 16px 20px; border-radius: 20px;
                    background: linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(251, 191, 36, 0.1) 100%);
                    border: 1px solid rgba(251, 191, 36, 0.2);
                    display: flex; align-items: center; justify-content: space-between;
                    cursor: pointer; transition: 0.3s;
                }
                .v3-ai-trigger:hover { transform: translateY(-2px); border-color: var(--v3-gold); box-shadow: 0 10px 25px rgba(251, 191, 36, 0.1); }
                .ai-content { display: flex; align-items: center; gap: 14px; }
                .ai-icon { 
                    width: 44px; height: 44px; border-radius: 12px; background: rgba(251, 191, 36, 0.1);
                    display: flex; align-items: center; justify-content: center; color: var(--v3-gold);
                }
                .ai-text h4 { font-size: 14px; font-weight: 950; letter-spacing: 2px; margin: 0; color: var(--v3-gold); }
            `}</style>
        </div>
    );
};
