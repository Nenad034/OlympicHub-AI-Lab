import React from 'react';
import { useSearchStore } from '../../stores/useSearchStore';
import { 
    Building2, Plane, ShoppingBag, Navigation, Map, Anchor, Compass, Zap, Car 
} from 'lucide-react';

const TABS = [
    { id: 'hotel',        label: 'Smeštaj',     icon: <Building2 /> },
    { id: 'flight',       label: 'Letovi',       icon: <Plane /> },
    { id: 'package',      label: 'Paketi',       icon: <ShoppingBag /> },
    { id: 'car',          label: 'Rent-a-Car',   icon: <Car /> },
    { id: 'things-to-do', label: 'Izleti',       icon: <Map /> },
    { id: 'cruise',       label: 'Krstarenja',   icon: <Anchor /> },
    { id: 'charter',      label: 'Čarteri',      icon: <Zap /> },
    { id: 'tour',         label: 'Putovanja',    icon: <Compass /> },
    { id: 'transfer',     label: 'Transferi',    icon: <Navigation /> },
];

export const SearchTabs: React.FC = () => {
    const { activeTab, setActiveTab } = useSearchStore();

    return (
        <div className="v6-tabs-bar" role="tablist" aria-label="Moduli Pretrage">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`v6-panel-${tab.id}`}
                    id={`v6-tab-${tab.id}`}
                    className={`v6-tab-btn-vertical ${activeTab === tab.id ? 'v6-tab-active' : ''}`}
                    onClick={() => setActiveTab(tab.id as any)}
                >
                    <div className="v6-tab-icon-lucide-wrapper">
                        {React.cloneElement(tab.icon as React.ReactElement<any>, { 
                            size: 32,
                            strokeWidth: activeTab === tab.id ? 2.5 : 1.5 
                        })}
                    </div>
                    <span className="v6-tab-label-text">{tab.label}</span>
                </button>
            ))}
        </div>
    );
};
