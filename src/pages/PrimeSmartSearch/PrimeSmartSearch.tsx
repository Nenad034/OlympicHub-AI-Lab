import React from 'react';
import { SearchTabs } from './components/SearchTabs/SearchTabs';
import { SearchModeSwitcher } from './components/SearchModes/SearchModeSwitcher';
import { useSearchStore } from './stores/useSearchStore';
import { useThemeStore } from '../../stores';

// Styles
import './styles/PrimeSmartSearch.css';

export const PrimeSmartSearch: React.FC = () => {
    const { activeTab, searchMode } = useSearchStore();
    const { theme } = useThemeStore();

    return (
        <div className={`prime-search-hub ${theme === 'dark' ? 'dark-mode' : 'light-mode'}`}>
            <div className="search-header-container">
                <div className="search-tabs-wrapper animate-fade-in-up">
                    <SearchTabs />
                </div>
            </div>

            <div className="search-main-area blur-backdrop">
                <div className="search-mode-container animate-fade-in">
                    <SearchModeSwitcher />
                </div>

                <div className="search-form-viewport">
                    {/* Placeholder for actual forms based on activeTab/searchMode */}
                    <div className="form-placeholder">
                        <h2>{activeTab.toUpperCase()} SEARCH - {searchMode.toUpperCase()} MODE</h2>
                        <p>Modularni sistem pretrage V6 je u pripremi...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrimeSmartSearch;
