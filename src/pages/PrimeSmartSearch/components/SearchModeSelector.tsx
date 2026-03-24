import React from 'react';
import { Sparkles } from 'lucide-react';
import { useSearchStore } from '../stores/useSearchStore';

interface SearchModeSelectorProps {
    className?: string;
    style?: React.CSSProperties;
}

export const SearchModeSelector: React.FC<SearchModeSelectorProps> = ({ className, style }) => {
    const { searchMode, setSearchMode, resetFilters } = useSearchStore();

    return (
        <div className={`v6-search-modes ${className || ''}`} style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px', 
            ...style
        }}>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                    type="button"
                    className={`v6-mode-tab ${searchMode === 'classic' ? 'v6-active' : ''}`}
                    onClick={() => setSearchMode('classic')}
                >
                    Klasična pretraga
                </button>
                <button 
                    type="button"
                    className={`v6-mode-tab ${searchMode === 'hybrid' ? 'v6-active' : ''}`}
                    onClick={() => setSearchMode('hybrid')}
                >
                    <div className="v6-ai-icon-frame" style={{ background: 'var(--v6-color-prime)' }}>
                        <Sparkles size={14} />
                    </div>
                    Hibridni mod
                </button>
                <button 
                    type="button"
                    className={`v6-mode-tab ${searchMode === 'semantic' ? 'v6-active' : ''}`}
                    onClick={() => setSearchMode('semantic')}
                >
                    <div className="v6-ai-icon-frame">
                        <Sparkles size={14} />
                    </div>
                    AI Asistent
                </button>
            </div>

            <button 
                type="button" 
                onClick={resetFilters}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--v6-text-muted)',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.color = 'var(--v6-accent)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.color = 'var(--v6-text-muted)';
                    e.currentTarget.style.background = 'none';
                }}
            >
                ↺ RESETUJ SVE
            </button>
        </div>
    );
};
