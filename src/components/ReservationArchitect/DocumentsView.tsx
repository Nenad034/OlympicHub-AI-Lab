import React from 'react';
import { FileText, Download, Send, Printer, FileSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Dossier } from '../../types/reservationArchitect';

interface DocumentsViewProps {
    dossier: Dossier;
    onGenerate: (type: string, format: 'PDF' | 'HTML') => void;
    onPrint: () => void;
    onSend: (type: string, method: 'Email' | 'Viber') => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ dossier, onGenerate, onPrint, onSend }) => {
    const docs = [
        { id: 'contract', label: 'Ugovor o Putovanju', desc: 'Glavni dokument o ugovorenim uslugama' },
        { id: 'voucher', label: 'Vaučer / Smeštaj', desc: 'Potvrda o plaćenom smeštaju i uslugama' },
        { id: 'itinerary', label: 'Plan Puta / Itinerer', desc: 'Detaljan raspored letova i transfera' },
        { id: 'proforma', label: 'Račun / Profaktura', desc: 'Dokument za uplatu preko računa' },
        { id: 'paxList', label: 'Lista Putnika', desc: 'Interni spisak učesnika za dobavljače' }
    ];

    return (
        <div className="documents-view-v2">
            <div className="section-header-v2">
                <div className="title">
                    <FileSearch size={20} className="cyan" />
                    <h3>ARHIVA DOKUMENATA</h3>
                </div>
            </div>

            <div className="docs-grid">
                {docs.map((doc, index) => {
                    const status = dossier.documentTracker[doc.id] || { generated: false, sentEmail: false, sentViber: false, sentPrint: false };

                    return (
                        <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="doc-box glass"
                        >
                            <div className="doc-meta">
                                <div className="doc-icon-circle">
                                    <FileText size={20} />
                                </div>
                                <div className="text">
                                    <h4>{doc.label}</h4>
                                    <p>{doc.desc}</p>
                                </div>
                            </div>

                            <div className="status-timeline">
                                <div className={`status-step ${status.generated ? 'done' : ''}`}>
                                    <div className="dot"></div>
                                    <span>Generisan</span>
                                </div>
                                <div className={`status-step ${status.sentEmail ? 'done' : ''}`}>
                                    <div className="dot"></div>
                                    <span>Email</span>
                                </div>
                                <div className={`status-step ${status.sentViber ? 'done' : ''}`}>
                                    <div className="dot"></div>
                                    <span>Viber</span>
                                </div>
                            </div>

                            <div className="quick-actions">
                                <button
                                    className="mini-btn"
                                    title="Preuzmi PDF"
                                    onClick={() => onGenerate(doc.id, 'PDF')}
                                >
                                    <Download size={14} />
                                </button>
                                <button
                                    className="mini-btn"
                                    title="Štampaj"
                                    onClick={onPrint}
                                >
                                    <Printer size={14} />
                                </button>
                                <button
                                    className="mini-btn highlight"
                                    title="Pošalji Email"
                                    onClick={() => onSend(doc.id, 'Email')}
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <style>{`
                .documents-view-v2 {
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                }
                .section-header-v2 h3 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    color: var(--fil-text);
                }
                .docs-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                }
                .doc-box {
                    padding: 20px;
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.02);
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    border: 1px solid var(--fil-border);
                }
                .doc-meta {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                }
                .doc-icon-circle {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background: rgba(0, 229, 255, 0.1);
                    color: var(--fil-accent);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .doc-meta h4 {
                    margin: 0;
                    font-size: 13px;
                    font-weight: 800;
                    color: var(--fil-text);
                }
                .doc-meta p {
                    margin: 2px 0 0 0;
                    font-size: 11px;
                    color: var(--fil-text-dim);
                }
                .status-timeline {
                    display: flex;
                    gap: 20px;
                    padding: 12px 15px;
                    background: rgba(0,0,0,0.2);
                    border-radius: 14px;
                }
                .status-step {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 10px;
                    font-weight: 700;
                    color: var(--fil-text-dim);
                }
                .status-step .dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--fil-border);
                }
                .status-step.done { color: var(--fil-success); }
                .status-step.done .dot { background: var(--fil-success); box-shadow: 0 0 5px var(--fil-success); }

                .quick-actions {
                    display: flex;
                    gap: 10px;
                }
                .mini-btn {
                    flex: 1;
                    padding: 10px;
                    background: transparent;
                    border: 1px solid var(--fil-border);
                    color: var(--fil-text-dim);
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .mini-btn:hover { 
                    color: var(--fil-text); 
                    background: rgba(255,255,255,0.05);
                    border-color: var(--fil-text-dim);
                }
                .mini-btn.highlight:hover {
                    color: var(--fil-bg);
                    background: var(--fil-accent);
                    border-color: var(--fil-accent);
                }
            `}</style>
        </div>
    );
};
