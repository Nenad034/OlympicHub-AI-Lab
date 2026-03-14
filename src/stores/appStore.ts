import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppStatus {
    gitPushed: boolean;
    vercelLive: boolean;
}

interface AppState {
    appStatus: AppStatus;
    isChatOpen: boolean;
    isMilicaChatOpen: boolean;
    chatContext: {
        type: 'general' | 'contact';
        contactId?: string;
        contactEmail?: string;
        contactName?: string;
        contactLanguage?: string;
        requestedPersona?: 'specialist' | 'general' | 'group' | 'contact' | 'analyst';
        initialMessage?: string;
    };
    searchQuery: string;
    showMapExplorer: boolean;
    isAgOpen: boolean;

    setAppStatus: (status: AppStatus) => void;
    setChatOpen: (open: boolean) => void;
    setAgOpen: (open: boolean) => void;
    setMilicaChatOpen: (open: boolean) => void;
    setChatContext: (context: AppState['chatContext']) => void;
    toggleChat: () => void;
    setSearchQuery: (query: string) => void;
    setShowMapExplorer: (show: boolean) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            appStatus: { gitPushed: true, vercelLive: true },
            isChatOpen: false,
            isMilicaChatOpen: false,
            chatContext: { type: 'general' },
            searchQuery: '',
            showMapExplorer: false,
            isAgOpen: false,

            setAppStatus: (status: AppStatus) => set({ appStatus: status }),

            setChatOpen: (open: boolean) => set({ isChatOpen: open }),
            setAgOpen: (open: boolean) => set({ isAgOpen: open }),
            setMilicaChatOpen: (open: boolean) => set({ isMilicaChatOpen: open }),
            setChatContext: (context) => set({ chatContext: context }),
            toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

            setSearchQuery: (query: string) => set({ searchQuery: query }),
            setShowMapExplorer: (show: boolean) => set({ showMapExplorer: show }),
        }),
        {
            name: 'olympic-app-storage',
            partialize: (state) => ({
                // Only persist chat state, not search
                isChatOpen: state.isChatOpen,
                isMilicaChatOpen: state.isMilicaChatOpen,
                isAgOpen: state.isAgOpen
            }),
        }
    )
);
