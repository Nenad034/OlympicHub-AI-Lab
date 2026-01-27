import React, { useCallback, useEffect } from 'react';
import { ActivityBar } from './ActivityBar';
import { VSCodeSidebar } from './VSCodeSidebar';
import { EditorArea } from './EditorArea';
import { StatusBar } from './StatusBar';
import { Panel } from './Panel';
import { CommandPalette } from './CommandPalette';
import { useVSCodeStore } from '../../stores/vscodeStore';
import { useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import './VSCodeLayout.css';

export interface Tab {
    id: string;
    title: string;
    icon?: React.ReactNode;
    component: React.ReactNode;
    path?: string;
    isDirty?: boolean;
}

// Route to tab mapping
const routeToTabMap: Record<string, { title: string; icon?: React.ReactNode }> = {
    '/': { title: 'Dashboard' },
    '/production': { title: 'Production Hub' },
    '/production/hotels': { title: 'Hotels List' },
    '/production/hotels/new': { title: 'New Hotel' },
    '/production/transport': { title: 'Transport' },
    '/suppliers': { title: 'Suppliers' },
    '/customers': { title: 'Customers' },
    '/mars-analysis': { title: 'Mars Analysis' },
    '/pricing-intelligence': { title: 'Pricing Intelligence' },
    '/katana': { title: 'Katana (To-Do)' },
    '/fortress': { title: 'Fortress Security' },
    '/deep-archive': { title: 'Deep Archive' },
    '/settings': { title: 'Settings' },
    '/mail': { title: 'Olympic Mail', icon: <Mail size={16} /> },
};

export const VSCodeLayout: React.FC = () => {
    const {
        isSidebarVisible,
        isPanelVisible,
        panelHeight,
        sidebarWidth,
        setPanelHeight,
        setSidebarWidth,
        addTab,
        tabs,
        isMobileMenuOpen,
        setMobileMenuOpen
    } = useVSCodeStore();
    const location = useLocation();

    // Sync tabs with current route
    useEffect(() => {
        const currentPath = location.pathname;
        const tabInfo = routeToTabMap[currentPath];

        if (tabInfo) {
            const tabId = currentPath === '/' ? 'dashboard' : currentPath.replace(/\//g, '-').slice(1);
            const existingTab = tabs.find(t => t.id === tabId);

            if (!existingTab) {
                addTab({
                    id: tabId,
                    title: tabInfo.title,
                    icon: tabInfo.icon,
                    path: currentPath,
                });
            } else {
                // Tab exists, just make it active
                const { setActiveTab } = useVSCodeStore.getState();
                setActiveTab(tabId);
            }
        }
    }, [location.pathname, addTab, tabs]);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname, setMobileMenuOpen]);

    // Resizable sidebar
    const handleSidebarResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = sidebarWidth;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(170, Math.min(600, startWidth + moveEvent.clientX - startX));
            setSidebarWidth(newWidth);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [sidebarWidth, setSidebarWidth]);

    // Resizable panel
    const handlePanelResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = panelHeight;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const newHeight = Math.max(100, Math.min(500, startHeight - (moveEvent.clientY - startY)));
            setPanelHeight(newHeight);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [panelHeight, setPanelHeight]);

    return (
        <div className={`vscode-layout ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
            {/* Command Palette */}
            <CommandPalette />

            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="mobile-backdrop"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Activity Bar - leftmost icon strip */}
            <ActivityBar />

            {/* Sidebar - file explorer, search, etc. */}
            <div className={`vscode-sidebar-wrapper ${isSidebarVisible ? 'visible' : ''} ${isMobileMenuOpen ? 'mobile-visible' : ''}`}>
                <VSCodeSidebar width={sidebarWidth} />
                <div
                    className="vscode-resize-handle vertical"
                    onMouseDown={handleSidebarResize}
                />
            </div>

            {/* Main Editor Area */}
            <div className="vscode-main-area">
                <EditorArea />

                {/* Bottom Panel - Terminal, Output, Problems */}
                {isPanelVisible && (
                    <>
                        <div
                            className="vscode-resize-handle horizontal"
                            onMouseDown={handlePanelResize}
                        />
                        <Panel height={panelHeight} />
                    </>
                )}
            </div>

            {/* Status Bar */}
            <StatusBar />
        </div>
    );
};

export default VSCodeLayout;
