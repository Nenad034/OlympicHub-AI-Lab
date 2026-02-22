import type React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ActivityType =
    | 'explorer'
    | 'search'
    | 'source-control'
    | 'debug'
    | 'extensions'
    | 'production'
    | 'suppliers'
    | 'customers'
    | 'hotels'
    | 'analytics'
    | 'settings'
    | 'notifications'
    | 'mail'
    | 'orchestrator';

export interface Tab {
    id: string;
    title: string;
    icon?: React.ReactNode;
    component?: React.ReactNode;
    path?: string;
    isDirty?: boolean;
}

interface VSCodeState {
    // Activity Bar
    activeActivity: ActivityType;
    setActiveActivity: (activity: ActivityType) => void;

    // Sidebar
    isSidebarVisible: boolean;
    sidebarWidth: number;
    toggleSidebar: () => void;
    setSidebarWidth: (width: number) => void;

    // Tabs
    tabs: Tab[];
    activeTabId: string | null;
    addTab: (tab: Tab) => void;
    closeTab: (tabId: string) => void;
    setActiveTab: (tabId: string) => void;
    updateTab: (tabId: string, updates: Partial<Tab>) => void;

    // Panel (bottom)
    isPanelVisible: boolean;
    panelHeight: number;
    togglePanel: () => void;
    setPanelHeight: (height: number) => void;

    // Command Palette
    isCommandPaletteOpen: boolean;
    toggleCommandPalette: () => void;

    // Mobile
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    setMobileMenuOpen: (isOpen: boolean) => void;
}

export const useVSCodeStore = create<VSCodeState>()(
    persist(
        (set, get) => ({
            // Activity Bar
            activeActivity: 'explorer',
            setActiveActivity: (activity) => set({ activeActivity: activity }),

            // Sidebar
            isSidebarVisible: true,
            sidebarWidth: 260,
            toggleSidebar: () => set((state) => ({ isSidebarVisible: !state.isSidebarVisible })),
            setSidebarWidth: (width) => set({ sidebarWidth: width }),

            // Tabs
            tabs: [],
            activeTabId: null,
            addTab: (tab) => {
                const { tabs } = get();
                const existingTab = tabs.find(t => t.id === tab.id);
                if (!existingTab) {
                    set({ tabs: [...tabs, tab], activeTabId: tab.id });
                } else {
                    set({ activeTabId: tab.id });
                }
            },
            closeTab: (tabId) => {
                const { tabs, activeTabId } = get();
                const newTabs = tabs.filter(t => t.id !== tabId);
                let newActiveTab = activeTabId;

                if (activeTabId === tabId) {
                    const index = tabs.findIndex(t => t.id === tabId);
                    if (newTabs.length > 0) {
                        newActiveTab = newTabs[Math.min(index, newTabs.length - 1)].id;
                    } else {
                        newActiveTab = null;
                    }
                }

                set({ tabs: newTabs, activeTabId: newActiveTab });
            },
            setActiveTab: (tabId) => set({ activeTabId: tabId }),
            updateTab: (tabId, updates) => {
                const { tabs } = get();
                set({
                    tabs: tabs.map(t => t.id === tabId ? { ...t, ...updates } : t)
                });
            },

            // Panel
            isPanelVisible: true,
            panelHeight: 200,
            togglePanel: () => set((state) => ({ isPanelVisible: !state.isPanelVisible })),
            setPanelHeight: (height) => set({ panelHeight: height }),

            // Command Palette
            isCommandPaletteOpen: false,
            toggleCommandPalette: () => set((state) => ({
                isCommandPaletteOpen: !state.isCommandPaletteOpen
            })),

            // Mobile
            isMobileMenuOpen: false,
            toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
            setMobileMenuOpen: (isOpen: boolean) => set({ isMobileMenuOpen: isOpen }),
        }),
        {
            name: 'olympic-vscode-storage',
            partialize: (state) => ({
                activeActivity: state.activeActivity,
                isSidebarVisible: state.isSidebarVisible,
                sidebarWidth: state.sidebarWidth,
                isPanelVisible: state.isPanelVisible,
                panelHeight: state.panelHeight,
                tabs: state.tabs.map(t => ({ id: t.id, title: t.title, path: t.path, isDirty: t.isDirty })),
                activeTabId: state.activeTabId,
            }),
        }
    )
);
