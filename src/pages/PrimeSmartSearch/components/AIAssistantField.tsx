import React from 'react';
import { Sparkles } from 'lucide-react';
import { useSearchStore } from '../stores/useSearchStore';

export const AIAssistantField: React.FC = () => {
    const { semanticQuery, setSemanticQuery } = useSearchStore();

    return (
        <div className="v6-semantic-search-row v6-fade-in" style={{ marginBottom: '16px' }}>
            <div className="v6-semantic-input-container" style={{ position: 'relative' }}>
                <div className="v6-ai-glow-orb" />
                <textarea
                    className="v6-semantic-textarea"
                    placeholder="Opišite vaše idealno putovanje... (npr. Tražim miran hotel u Grčkoj blizu plaže, idealno za malu decu, budžet do 3000€)"
                    value={semanticQuery}
                    onChange={(e) => setSemanticQuery(e.target.value)}
                    style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '20px 24px',
                        borderRadius: 'var(--v6-radius-lg)',
                        background: 'var(--v6-bg-section)',
                        border: '2px solid var(--v6-accent)',
                        color: 'var(--v6-text-primary)',
                        fontSize: 'var(--v6-fs-md)',
                        fontFamily: 'var(--v6-font)',
                        outline: 'none',
                        resize: 'none',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 8px 32px rgba(99, 179, 237, 0.1)',
                    }}
                />
                <div style={{ position: 'absolute', right: '20px', bottom: '15px', display: 'flex', gap: '8px', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '12px', color: 'var(--v6-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        <Sparkles size={12} style={{ marginRight: '4px' }} />
                        Smart Extraction Active
                    </span>
                </div>
            </div>
        </div>
    );
};
