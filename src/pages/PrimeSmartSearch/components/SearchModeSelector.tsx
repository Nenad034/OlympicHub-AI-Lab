import React from 'react';
import { Sparkles } from 'lucide-react';
import { useSearchStore } from '../stores/useSearchStore';

export const SearchModeSelector: React.FC = () => {
    const { searchMode, setSearchMode } = useSearchStore();

    return (
        <div className="v6-search-modes" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
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
    );
};
