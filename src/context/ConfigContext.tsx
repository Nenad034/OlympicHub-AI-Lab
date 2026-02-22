import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface UserPermissions {
    canImport?: boolean;
    canExport?: boolean;
    allowedModules?: string[];
    deniedModules?: string[];
}

interface AppConfig {
    geminiKey: string;
    defaultModel: string;
    userLevels: Record<string, number>;
    levelPermissions: Record<number, { canImport: boolean; canExport: boolean }>;
    userExceptions: Record<string, UserPermissions>;
}

interface Backup {
    id: string;
    created_at: string;
    config: AppConfig;
    note: string;
}

interface ConfigContextType {
    config: AppConfig;
    updateConfig: (newConfig: Partial<AppConfig>) => Promise<void>;
    createSnapshot: (note: string) => Promise<void>;
    backups: Backup[];
    restoreSnapshot: (backup: Backup) => Promise<void>;
    isLoading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AppConfig>({
        geminiKey: import.meta.env.VITE_GEMINI_API_KEY || "", // Prefer env var
        defaultModel: "gemini-1.5-flash",
        userLevels: { "current": 5 },
        levelPermissions: {
            1: { canImport: false, canExport: false },
            2: { canImport: false, canExport: true },
            3: { canImport: true, canExport: true },
            4: { canImport: true, canExport: true },
            5: { canImport: true, canExport: true }
        },
        userExceptions: {}
    });
    const [backups, setBackups] = useState<Backup[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load latest config on boot
    useEffect(() => {
        const loadConfig = async () => {
            // First try LocalStorage for instant load
            const saved = localStorage.getItem('olympic_config');
            if (saved) setConfig(JSON.parse(saved));

            try {
                // Set a safety timeout - if Supabase takes too long, just proceed
                const timeoutPromise = new Promise(resolve => setTimeout(resolve, 3000));

                const { data } = await Promise.race([
                    supabase.from('app_config').select('*').limit(1).single(),
                    timeoutPromise.then(() => ({ data: null }))
                ]) as any;

                if (data) {
                    setConfig(data.content);
                    localStorage.setItem('olympic_config', JSON.stringify(data.content));
                }

                // Load backups in background without blocking
                supabase.from('app_backups').select('*').order('created_at', { ascending: false })
                    .then(({ data: bData }) => {
                        if (bData) setBackups(bData);
                    });

            } catch (e) {
                console.error("Failed to load config from Supabase, using LocalStorage/defaults.");
            } finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, []);

    const updateConfig = async (newConfig: Partial<AppConfig>) => {
        const updated = { ...config, ...newConfig };
        setConfig(updated);
        localStorage.setItem('olympic_config', JSON.stringify(updated));

        // Persist to Supabase
        await supabase.from('app_config').upsert({ id: 'main', content: updated });
    };

    const createSnapshot = async (note: string) => {
        const newBackup = {
            config: config,
            note: note,
            created_at: new Date().toISOString()
        };
        const { data } = await supabase.from('app_backups').insert([newBackup]).select();
        if (data) setBackups([data[0], ...backups]);
    };

    const restoreSnapshot = async (backup: Backup) => {
        setConfig(backup.config);
        await supabase.from('app_config').upsert({ id: 'main', content: backup.config });
    };

    return (
        <ConfigContext.Provider value={{ config, updateConfig, createSnapshot, backups, restoreSnapshot, isLoading }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) throw new Error('useConfig must be used within ConfigProvider');
    return context;
};
