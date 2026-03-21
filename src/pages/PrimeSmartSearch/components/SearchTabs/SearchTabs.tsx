import React from 'react';
import { Hotel, Plane, Package, Bus, Compass, Mountain } from 'lucide-react';
import { useSearchStore } from '../../stores/useSearchStore';
import { SearchTab, SearchTabType } from '../../types';

const TABS: SearchTab[] = [
    { id: 'hotel', label: 'Smeštaj', icon: Hotel },
    { id: 'flight', label: 'Letovi', icon: Plane },
    { id: 'package', label: 'Paketi (Wizard)', icon: Package },
    { id: 'transfer', label: 'Transferi', icon: Bus },
    { id: 'tour', label: 'Putovanja', icon: Compass },
    { id: 'ski', label: 'Ski', icon: Mountain },
];

export const SearchTabs: React.FC = () => {
    const { activeTab, setActiveTab } = useSearchStore();

    return (
        <div className="search-tabs-container">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    className={`search-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                >
                    <tab.icon size={18} />
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
    );
};
