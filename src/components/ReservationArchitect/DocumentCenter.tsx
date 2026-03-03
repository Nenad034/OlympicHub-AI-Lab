import {
    FileText, Send, Mail, MessageSquare,
    Printer, Download, Sparkles, Globe,
    ChevronRight, BookOpen, Receipt, FileCheck
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
        <div className="document-center-v2 glass">
            <div className="center-header">
                <Sparkles size={20} className="cyan" />
                <h3>DOCUMENT CENTER</h3>
            </div>

            <div className="document-list">
                {documentTypes.map((doc) => (
                    <motion.div
                        key={doc.id}
                        className="doc-action-card"
                        whileHover={{ x: 5 }}
                    >
                        <div className="doc-info">
                            <div className="doc-icon">{doc.icon}</div>
                            <div className="doc-label-group">
                                <span className="label">{doc.label}</span>
                                <div className="lang-picker">
                                    {languages.map(lang => (
                                        <button
                                            key={lang}
                                            onClick={() => onLanguageChange(doc.id, lang)}
                                            className={`lang-btn ${docSettings[doc.id] === lang ? 'active' : ''}`}
                                        >
                                            {lang === 'Srpski' ? 'SR' : 'EN'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="doc-actions-row">
                            <button className="action-btn pdf" onClick={() => onGenerate(doc.id, 'PDF')}>
                                <Download size={14} /> PDF
                            </button>
                            <button className="action-btn viber" onClick={() => onSend(doc.id, 'Viber')}>
                                <MessageSquare size={14} /> VIBER
                            </button>
                            <button className="action-btn mail" onClick={() => onSend(doc.id, 'Email')}>
                                <Send size={14} /> MAIL
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="ai-assistant-trigger glass">
                <div className="ai-info">
                    <Sparkles size={24} className="gold glow-text" />
                    <div className="text">
                        <span className="title">AI ASSISTANT</span>
                        <span className="desc">Proveri dostupnost ili generiši ponudu</span>
                    </div>
                </div>
                <ChevronRight size={20} className="gold" />
            </div>

            <style>{`
                .document-center-v2 {
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    border-radius: 24px;
                }
                .center-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 5px;
                }
                .center-header h3 {
                    font-size: 14px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    color: var(--fil-text);
                    margin: 0;
                }
                .document-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .doc-action-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--fil-border);
                    border-radius: 16px;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .doc-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .doc-icon {
                    width: 36px;
                    height: 36px;
                    background: rgba(0, 229, 255, 0.1);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--fil-accent);
                }
                .doc-label-group {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .doc-label-group .label {
                    font-size: 13px;
                    font-weight: 700;
                    color: var(--fil-text);
                }
                .lang-picker {
                    display: flex;
                    gap: 4px;
                }
                .lang-btn {
                    padding: 2px 6px;
                    font-size: 9px;
                    font-weight: 800;
                    background: transparent;
                    border: 1px solid var(--fil-border);
                    color: var(--fil-text-dim);
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .lang-btn.active {
                    background: var(--fil-accent);
                    border-color: var(--fil-accent);
                    color: var(--fil-bg);
                }
                .doc-actions-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                }
                .action-btn {
                    padding: 6px;
                    font-size: 10px;
                    font-weight: 800;
                    border: 1px solid var(--fil-border);
                    background: rgba(255,255,255,0.02);
                    color: var(--fil-text);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .action-btn:hover {
                    background: rgba(255,255,255,0.08);
                }
                .action-btn.pdf:hover { color: var(--fil-accent); border-color: var(--fil-accent); }
                .action-btn.viber:hover { color: #7d529f; border-color: #7d529f; }
                .action-btn.mail:hover { color: #f59e0b; border-color: #f59e0b; }

                .ai-assistant-trigger {
                    background: linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(255, 179, 0, 0.05));
                    border: 1px solid rgba(255, 179, 0, 0.2);
                    padding: 20px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .ai-assistant-trigger:hover {
                    transform: translateY(-2px);
                    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 179, 0, 0.1));
                    border-color: rgba(255, 179, 0, 0.4);
                }
                .ai-info {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .ai-info .text {
                    display: flex;
                    flex-direction: column;
                }
                .ai-info .title {
                    font-size: 13px;
                    font-weight: 900;
                    color: var(--fil-gold);
                    letter-spacing: 1px;
                }
                .ai-info .desc {
                    font-size: 10px;
                    color: var(--fil-text-dim);
                }
                .glow-text {
                    filter: drop-shadow(0 0 5px var(--fil-gold));
                }
            `}</style>
        </div>
    );
};
