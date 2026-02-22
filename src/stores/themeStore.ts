import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'navy';
export type Language = 'sr' | 'en';
export type NavMode = 'sidebar' | 'horizontal';
export type LayoutMode = 'classic' | 'modern';

interface ThemeState {
    theme: Theme;
    isPrism: boolean;
    lang: Language;
    navMode: NavMode;
    layoutMode: LayoutMode;
    isSidebarCollapsed: boolean;

    setTheme: (theme: Theme) => void;
    cycleTheme: () => void;
    togglePrism: () => void;
    setLang: (lang: Language) => void;
    setNavMode: (mode: NavMode) => void;
    setLayoutMode: (mode: LayoutMode) => void;
    toggleLayoutMode: () => void;
    toggleNavMode: () => void;
    toggleSidebar: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'navy',
            isPrism: false,
            lang: 'sr',
            navMode: 'sidebar',
            layoutMode: 'classic',
            isSidebarCollapsed: false,

            setTheme: (theme: Theme) => set({ theme }),

            cycleTheme: () => {
                const current = get().theme;
                const next = current === 'light' ? 'navy' : 'light';
                set({ theme: next });
            },

            togglePrism: () => set((state) => ({ isPrism: !state.isPrism })),

            setLang: (lang: Language) => set({ lang }),

            setNavMode: (mode: NavMode) => set({ navMode: mode }),

            setLayoutMode: (mode: LayoutMode) => set({ layoutMode: mode }),

            toggleLayoutMode: () => set((state) => ({
                layoutMode: state.layoutMode === 'classic' ? 'modern' : 'classic'
            })),

            toggleNavMode: () => set((state) => ({
                navMode: state.navMode === 'sidebar' ? 'horizontal' : 'sidebar'
            })),

            toggleSidebar: () => set((state) => ({
                isSidebarCollapsed: !state.isSidebarCollapsed
            })),
        }),
        {
            name: 'olympic-theme-storage',
        }
    )
);
