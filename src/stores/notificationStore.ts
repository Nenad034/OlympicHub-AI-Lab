import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ModuleNotificationSettings {
    enabled: boolean;
    duration: number; // in seconds
}

export interface NotificationSettings {
    mail: ModuleNotificationSettings;
    pricing: ModuleNotificationSettings;
    system: ModuleNotificationSettings;
}

interface NotificationState {
    settings: NotificationSettings;
    updateSettings: (module: keyof NotificationSettings, updates: Partial<ModuleNotificationSettings>) => void;
}

const defaultSettings: NotificationSettings = {
    mail: { enabled: true, duration: 5 },
    pricing: { enabled: true, duration: 3 },
    system: { enabled: true, duration: 4 },
};

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            settings: defaultSettings,
            updateSettings: (module, updates) => set((state) => ({
                settings: {
                    ...state.settings,
                    [module]: { ...state.settings[module], ...updates },
                },
            })),
        }),
        {
            name: 'olympic-notifications-storage',
        }
    )
);
