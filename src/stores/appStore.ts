import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppStatus {
    gitPushed: boolean;
    vercelLive: boolean;
}

interface AppState {
    appStatus: AppStatus;
    isChatOpen: boolean;
    searchQuery: string;

    setAppStatus: (status: AppStatus) => void;
    setChatOpen: (open: boolean) => void;
    toggleChat: () => void;
    setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            appStatus: { gitPushed: true, vercelLive: true },
            isChatOpen: false,
            searchQuery: '',

            setAppStatus: (status: AppStatus) => set({ appStatus: status }),

            setChatOpen: (open: boolean) => set({ isChatOpen: open }),

            toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

            setSearchQuery: (query: string) => set({ searchQuery: query }),
        }),
        {
            name: 'olympic-app-storage',
            partialize: (state) => ({
                // Only persist chat state, not search
                isChatOpen: state.isChatOpen
            }),
        }
    )
);
