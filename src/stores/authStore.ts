import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPermissions {
    canImport: boolean;
    canExport: boolean;
    allowedModules?: string[];
    deniedModules?: string[];
}

interface AuthState {
    userLevel: number;
    userName: string;
    userEmail?: string;
    permissions: UserPermissions;
    login: (name: string, pass: string) => boolean;
    logout: () => void;
    setUserLevel: (level: number) => void;
    setUserName: (name: string) => void;
    getPermissions: () => UserPermissions;
}

const defaultPermissions: Record<number, UserPermissions> = {
    0: { canImport: false, canExport: false }, // Guest / Logged out
    1: { canImport: false, canExport: false },
    2: { canImport: false, canExport: true },
    3: { canImport: true, canExport: true },
    4: { canImport: true, canExport: true },
    5: { canImport: true, canExport: true },
    6: { canImport: true, canExport: true }, // Master Admin
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            userLevel: 0,
            userName: '',
            permissions: defaultPermissions[0],

            login: (name: string, pass: string) => {
                if (name.toLowerCase() === 'nenad' && pass === 'nenad') {
                    set({
                        userLevel: 6,
                        userName: 'Nenad',
                        userEmail: 'nenad@olympic.rs',
                        permissions: defaultPermissions[6]
                    });
                    return true;
                }
                return false;
            },

            logout: () => {
                set({
                    userLevel: 0,
                    userName: '',
                    userEmail: undefined,
                    permissions: defaultPermissions[0]
                });
            },

            setUserLevel: (level: number) => {
                set({
                    userLevel: level,
                    permissions: defaultPermissions[level] || defaultPermissions[0]
                });
            },

            setUserName: (name: string) => {
                set({ userName: name });
            },

            getPermissions: () => {
                const level = get().userLevel;
                return defaultPermissions[level] || defaultPermissions[0];
            },
        }),
        {
            name: 'olympic-auth-storage',
        }
    )
);
