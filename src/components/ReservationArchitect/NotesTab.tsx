import React, { useState } from 'react';
import { FileText, Sparkles, Building2, Shield, Briefcase, Copy, Mail, Printer, Share2, StickyNote, Terminal } from 'lucide-react';
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

    return (
        <div className="v4-notes-tab" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <StickyNote size={22} className="cyan-text" />
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, letterSpacing: '1px' }}>NAPOMENE I BELEŠKE</h3>
                </div>

                <div className="v4-nav-tabs" style={{ marginBottom: 0 }}>
                    <button className={`v4-tab-btn ${!isNotepadView ? 'active' : ''}`} onClick={() => setIsNotepadView(false)}>
                        <Terminal size={18} /> INTERAKTIVNO
                    </button>
                    <button className={`v4-tab-btn ${isNotepadView ? 'active' : ''}`} onClick={() => setIsNotepadView(true)}>
                        <Sparkles size={18} /> RAW PREGLED
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                <div className="v4-table-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                        <Sparkles size={18} className="cyan-text" />
                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)' }}>OPŠTA NAPOMENA</h4>
                    </div>
                    <textarea
                        className="v4-input"
                        style={{ width: '100%', minHeight: '120px', resize: 'none' }}
                        value={dossier.notes.general}
                        onChange={(e) => handleNoteChange('general', e.target.value)}
                        placeholder="Unesite opšte napomene..."
                    />
                </div>

                <div className="v4-table-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                        <FileText size={18} style={{ color: '#10b981' }} />
                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)' }}>NAPOMENA ZA UGOVOR</h4>
                    </div>
                    <textarea
                        className="v4-input"
                        style={{ width: '100%', minHeight: '120px', resize: 'none' }}
                        value={dossier.notes.contract}
                        onChange={(e) => handleNoteChange('contract', e.target.value)}
                        placeholder="Tekst koji se štampa na ugovoru..."
                    />
                </div>

                <div className="v4-table-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                        <Building2 size={18} style={{ color: '#3b82f6' }} />
                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)' }}>NAPOMENA ZA VAUČER</h4>
                    </div>
                    <textarea
                        className="v4-input"
                        style={{ width: '100%', minHeight: '120px', resize: 'none' }}
                        value={dossier.notes.voucher}
                        onChange={(e) => handleNoteChange('voucher', e.target.value)}
                        placeholder="Napomene za dobavljača i vaučer..."
                    />
                </div>

                <div className="v4-table-card" style={{ padding: '24px', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                        <Shield size={18} style={{ color: '#ef4444' }} />
                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)' }}>INTERNA BELEŠKA</h4>
                    </div>
                    <textarea
                        className="v4-input"
                        style={{ width: '100%', minHeight: '120px', resize: 'none' }}
                        value={dossier.notes.internal}
                        onChange={(e) => handleNoteChange('internal', e.target.value)}
                        placeholder="Samo za interne potrebe operatera..."
                    />
                </div>

                <div className="v4-table-card" style={{ padding: '24px', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                        <Briefcase size={18} style={{ color: '#fbbf24' }} />
                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)' }}>NAPOMENA ZA DOBAVLJAČA (GLOBAL)</h4>
                    </div>
                    <textarea
                        className="v4-input"
                        style={{ width: '100%', minHeight: '160px', resize: 'none' }}
                        value={dossier.notes.supplier}
                        onChange={(e) => handleNoteChange('supplier', e.target.value)}
                        placeholder="Globalne napomene za sve dobavljače u dosijeu..."
                    />
                </div>
            </div>
        </div>
    );
};
