import React from 'react';
import { Zap, Sparkles, Globe, Search, PlayCircle } from 'lucide-react';
import { useSearchStore } from '../../stores/useSearchStore';
import { SearchModeType } from '../../types';

interface SearchMode {
    id: SearchModeType;
    label: string;
    icon: any;
    color: string;
}

const MODES: SearchMode[] = [
    { id: 'classic', label: 'Classic', icon: Search, color: 'var(--accent)' },
    { id: 'narrative', label: 'Milica AI', icon: PlayCircle, color: '#8E24AC' },
    { id: 'immersive', label: 'Immersive', icon: Zap, color: '#FF5722' },
    { id: 'immersive-map', label: 'Map Explorer', icon: Globe, color: '#0ea5e9' },
    { id: 'semantic', label: 'Semantic AI', icon: Sparkles, color: '#00e5ff' },
];

export const SearchModeSwitcher: React.FC = () => {
    const { searchMode, setSearchMode } = useSearchStore();

    return (
        <div className="search-mode-switcher-v6">
            {MODES.map((mode) => (
                <button
                    key={mode.id}
                    className={`mode-btn ${searchMode === mode.id ? 'active' : ''}`}
                    onClick={() => setSearchMode(mode.id)}
                    style={{
                        '--mode-color': mode.color
                    } as React.CSSProperties}
                >
                    <mode.icon size={16} />
                    <span>{mode.label}</span>
                </button>
            ))}
        </div>
    );
};
