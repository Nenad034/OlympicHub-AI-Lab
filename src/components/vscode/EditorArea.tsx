import React from 'react';
import { X, SplitSquareHorizontal, MoreHorizontal } from 'lucide-react';
import { ClickToTravelLogo } from '../icons/ClickToTravelLogo';
import { useVSCodeStore, type Tab } from '../../stores/vscodeStore';
import { Outlet, useNavigate } from 'react-router-dom';

export const EditorArea: React.FC = () => {
    const { tabs, activeTabId, setActiveTab, closeTab } = useVSCodeStore();
    const navigate = useNavigate();

    const handleTabClick = (tab: Tab) => {
        setActiveTab(tab.id);
        // Navigate to the tab's path
        if (tab.path) {
            navigate(tab.path);
        }
    };

    const handleTabClose = (e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        const closedTabIndex = tabs.findIndex(t => t.id === tabId);
        closeTab(tabId);

        // If we closed the active tab, navigate to the next available tab
        if (activeTabId === tabId) {
            const remainingTabs = tabs.filter(t => t.id !== tabId);
            if (remainingTabs.length > 0) {
                const nextTab = remainingTabs[Math.min(closedTabIndex, remainingTabs.length - 1)];
                if (nextTab.path) {
                    navigate(nextTab.path);
                }
            } else {
                navigate('/');
            }
        }
    };

    // If no tabs, show welcome screen
    if (tabs.length === 0) {
        return (
            <div className="vscode-editor-area">
                <div className="editor-welcome">
                    <div className="welcome-content">
                        <ClickToTravelLogo height={96} className="welcome-logo" showText={true} />
                        <h1>Olympic Hub</h1>
                        <p className="welcome-subtitle">Enterprise Resource Planning za turizam</p>

                        <div className="welcome-actions">
                            <div className="welcome-section">
                                <h3>Start</h3>
                                <ul>
                                    <li><a href="#" onClick={() => window.location.href = '/production'}>Nova Produkcija</a></li>
                                    <li><a href="#" onClick={() => window.location.href = '/production/hotels/new'}>Novi Hotel</a></li>
                                    <li><a href="#" onClick={() => window.location.href = '/suppliers'}>Dodaj Dobavljača</a></li>
                                </ul>
                            </div>
                            <div className="welcome-section">
                                <h3>Recent</h3>
                                <ul>
                                    <li><a href="#" onClick={() => window.location.href = '/mars-analysis'}>Mars ERP Analitika</a></li>
                                    <li><a href="#" onClick={() => window.location.href = '/pricing-intelligence'}>Generator Cenovnika</a></li>
                                    <li><a href="#" onClick={() => window.location.href = '/katana'}>Katana (To-Do)</a></li>
                                </ul>
                            </div>
                            <div className="welcome-section">
                                <h3>Help</h3>
                                <ul>
                                    <li><a href="#">Dokumentacija</a></li>
                                    <li><a href="#">Podrška</a></li>
                                    <li><a href="#">Keyboard Shortcuts</a></li>
                                </ul>
                            </div>
                        </div>

                        <div className="welcome-tip">
                            <strong>Tip:</strong> Koristite <kbd>Ctrl</kbd> + <kbd>P</kbd> za brzu navigaciju
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="vscode-editor-area">
            {/* Tab Bar */}
            <div className="editor-tabs">
                <div className="tabs-container">
                    {tabs.map((tab: Tab) => (
                        <div
                            key={tab.id}
                            className={`editor-tab ${activeTabId === tab.id ? 'active' : ''}`}
                            onClick={() => handleTabClick(tab)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-title">{tab.title}</span>
                            {tab.isDirty && <span className="tab-dirty">●</span>}
                            <button
                                className="tab-close"
                                onClick={(e) => handleTabClose(e, tab.id)}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="tabs-actions">
                    <button title="Split Editor"><SplitSquareHorizontal size={16} /></button>
                    <button title="More Actions"><MoreHorizontal size={16} /></button>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="editor-breadcrumb">
                <span className="breadcrumb-item">Olympic Hub</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-item active">
                    {tabs.find((t: Tab) => t.id === activeTabId)?.title || 'Dashboard'}
                </span>
            </div>

            {/* Editor Content - Renders from Router */}
            <div className="editor-content">
                <Outlet />
            </div>
        </div>
    );
};

export default EditorArea;
