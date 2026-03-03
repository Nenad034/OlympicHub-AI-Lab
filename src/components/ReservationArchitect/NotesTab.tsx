import React, { useState } from 'react';
import { FileText, Sparkles, Building2, Shield, Briefcase, Copy, Mail, Printer, Share2 } from 'lucide-react';
import type { Dossier, TripItem } from '../../types/reservationArchitect';
import { motion, AnimatePresence } from 'framer-motion';

interface NotesTabProps {
    dossier: Dossier;
    setDossier: (dossier: Dossier) => void;
    addLog: (action: string, details: string, type: 'info' | 'success' | 'warning' | 'danger') => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({ dossier, setDossier, addLog }) => {
    const [isNotepadView, setIsNotepadView] = useState(false);

    const handleNoteChange = (key: keyof Dossier['notes'], value: string) => {
        setDossier({
            ...dossier,
            notes: {
                ...dossier.notes,
                [key]: value
            }
        });
    };

    const getNotesNotepadText = () => {
        let text = `--- NAPOMENE REZERVACIJE / DOSSIER ${dossier.cisCode} ---\n\n`;
        text += `OPŠTE NAPOMENE:\n${dossier.notes.general || 'Nema napomena.'}\n\n`;
        text += `NAPOMENE ZA UGOVOR:\n${dossier.notes.contract || 'Nema napomena.'}\n\n`;
        text += `NAPOMENE ZA VAUČER:\n${dossier.notes.voucher || 'Nema napomena.'}\n\n`;
        text += `NAPOMENE DOBAVLJAČA (GLOBALNO):\n${dossier.notes.supplier || 'Nema napomena.'}\n\n`;
        text += `INTERNE NAPOMENE:\n${dossier.notes.internal || 'Nema napomena.'}\n\n`;

        const itemNotes = dossier.tripItems.filter(item => item.notes || item.supplierNotes);
        if (itemNotes.length > 0) {
            text += `--- NAPOMENE PO STAVKAMA ---\n`;
            itemNotes.forEach((item: TripItem) => {
                text += `\nSTAVKA: ${item.subject}\n`;
                if (item.notes) text += `- Opšta napomena: ${item.notes}\n`;
                if (item.supplierNotes) text += `- Za dobavljača: ${item.supplierNotes}\n`;
            });
        }
        return text;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getNotesNotepadText());
        addLog('Sistem', 'Napomene kopirane u clipboard.', 'success');
    };

    return (
        <div className="notes-tab-v2">
            <div className="tab-header-v2">
                <div className="title-group">
                    <div className="icon-box">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h2>NAPOMENE REZERVACIJE</h2>
                        <p>Upravljajte napomenama za putnike, ugovore i internu evidenciju</p>
                    </div>
                </div>
                <button
                    className={`notepad-toggle ${isNotepadView ? 'active' : ''}`}
                    onClick={() => setIsNotepadView(!isNotepadView)}
                >
                    <FileText size={16} />
                    {isNotepadView ? 'INTERAKTIVNI PRIKAZ' : 'NOTEPAD PREGLED'}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {isNotepadView ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fil-card notepad-view"
                        key="notepad"
                    >
                        <div className="notepad-header">
                            <span className="file-name">notes_{dossier.cisCode}.txt</span>
                            <div className="actions">
                                <button onClick={copyToClipboard}><Copy size={14} /> Kopiraj</button>
                                <button><Mail size={14} /> Email</button>
                                <button onClick={() => window.print()}><Printer size={14} /> Štampaj</button>
                            </div>
                        </div>
                        <div className="notepad-body">
                            <pre>{getNotesNotepadText()}</pre>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="notes-grid"
                        key="grid"
                    >
                        <div className="fil-card note-input-box">
                            <div className="box-header">
                                <Sparkles size={16} className="text-accent" />
                                <h3>Generalna Napomena</h3>
                            </div>
                            <textarea
                                value={dossier.notes.general}
                                onChange={(e) => handleNoteChange('general', e.target.value)}
                                placeholder="Napomena od putnika..."
                            />
                        </div>

                        <div className="fil-card note-input-box">
                            <div className="box-header">
                                <FileText size={16} className="text-success" />
                                <h3>Napomena za Ugovor</h3>
                            </div>
                            <textarea
                                value={dossier.notes.contract}
                                onChange={(e) => handleNoteChange('contract', e.target.value)}
                                placeholder="Tekst koji ide na ugovor..."
                            />
                        </div>

                        <div className="fil-card note-input-box">
                            <div className="box-header">
                                <Building2 size={16} className="text-cyan" />
                                <h3>Napomena za Vaučer</h3>
                            </div>
                            <textarea
                                value={dossier.notes.voucher}
                                onChange={(e) => handleNoteChange('voucher', e.target.value)}
                                placeholder="Napomena za hotel..."
                            />
                        </div>

                        <div className="fil-card note-input-box internal">
                            <div className="box-header">
                                <Shield size={16} className="text-danger" />
                                <h3>Interna Napomena</h3>
                            </div>
                            <textarea
                                value={dossier.notes.internal}
                                onChange={(e) => handleNoteChange('internal', e.target.value)}
                                placeholder="Interni dogovori, upozorenja..."
                            />
                        </div>

                        <div className="fil-card note-input-box supplier">
                            <div className="box-header">
                                <Briefcase size={16} className="text-amber" />
                                <h3>Napomena za Dobavljača</h3>
                            </div>
                            <textarea
                                value={dossier.notes.supplier}
                                onChange={(e) => handleNoteChange('supplier', e.target.value)}
                                placeholder="Unesite napomenu za dobavljača..."
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .notes-tab-v2 {
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                }
                .tab-header-v2 {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .title-group {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .icon-box {
                    width: 50px;
                    height: 50px;
                    background: var(--fil-bg-card);
                    border: 1px solid var(--fil-border);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--fil-accent);
                }
                .title-group h2 { margin: 0; font-size: 20px; font-weight: 800; }
                .title-group p { margin: 5px 0 0 0; font-size: 13px; color: var(--fil-text-dim); }

                .notepad-toggle {
                    background: var(--fil-bg-card);
                    border: 1px solid var(--fil-border);
                    padding: 10px 20px;
                    border-radius: 12px;
                    color: var(--fil-text);
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.2s;
                }
                .notepad-toggle.active {
                    background: var(--fil-accent);
                    color: var(--fil-bg);
                    border-color: var(--fil-accent);
                }

                .notes-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                }
                .note-input-box {
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .box-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .box-header h3 { font-size: 13px; font-weight: 800; margin: 0; }
                .note-input-box textarea {
                    width: 100%;
                    min-height: 120px;
                    background: var(--fil-bg);
                    border: 1px solid var(--fil-border);
                    border-radius: 12px;
                    padding: 15px;
                    color: var(--fil-text);
                    font-size: 14px;
                    line-height: 1.6;
                    resize: vertical;
                    transition: border-color 0.2s;
                }
                .note-input-box textarea:focus {
                    border-color: var(--fil-accent);
                    outline: none;
                }

                .note-input-box.internal { border-left: 4px solid #ef4444; }
                .note-input-box.supplier { border-left: 4px solid #fbbf24; grid-column: span 2; }

                .notepad-view {
                    padding: 0;
                    overflow: hidden;
                    background: #111;
                }
                .notepad-header {
                    padding: 15px 25px;
                    background: rgba(255,255,255,0.03);
                    border-bottom: 1px solid var(--fil-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .file-name { font-family: monospace; font-size: 12px; color: var(--fil-text-dim); }
                .notepad-header .actions { display: flex; gap: 10px; }
                .notepad-header button {
                    background: transparent;
                    border: 1px solid var(--fil-border);
                    color: var(--fil-text-dim);
                    padding: 5px 12px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .notepad-header button:hover { color: white; border-color: white; }
                .notepad-body {
                    padding: 30px;
                    max-height: 600px;
                    overflow-y: auto;
                }
                .notepad-body pre {
                    font-family: 'Fira Code', 'Courier New', monospace;
                    font-size: 13px;
                    line-height: 1.6;
                    color: #cbd5e1;
                    margin: 0;
                    white-space: pre-wrap;
                }

                .text-accent { color: var(--fil-accent); }
                .text-success { color: #10b981; }
                .text-danger { color: #ef4444; }
                .text-amber { color: #fbbf24; }
                .text-cyan { color: #06b6d4; }
            `}</style>
        </div>
    );
};
