import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveToCloud, loadFromCloud } from '../utils/storageUtils';

export interface KatanaTask {
    id: string;
    text: string;
    completed: boolean;
    important: boolean;
    category: 'daily' | 'planned' | 'general';
    createdAt: string;
    note?: string;
    tags?: string[];
    attachments?: string[];
    reminderAt?: string;
}

interface KatanaState {
    tasks: KatanaTask[];
    isLoading: boolean;

    // Actions
    loadTasks: () => Promise<void>;
    addTask: (text: string, important?: boolean, category?: 'daily' | 'planned' | 'general', note?: string) => Promise<string>;
    updateTask: (id: string, updates: Partial<KatanaTask>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
}

export const useKatanaStore = create<KatanaState>()(
    persist(
        (set, get) => ({
            tasks: [],
            isLoading: false,

            loadTasks: async () => {
                set({ isLoading: true });
                const { success, data } = await loadFromCloud('katana_tasks');
                if (success && data) {
                    set({ tasks: data as KatanaTask[], isLoading: false });
                } else {
                    set({ isLoading: false });
                }
            },

            addTask: async (text: string, important = false, category: 'daily' | 'planned' | 'general' = 'general', note?: string) => {
                const newTask: KatanaTask = {
                    id: Date.now().toString(),
                    text,
                    completed: false,
                    important,
                    category,
                    note,
                    createdAt: new Date().toISOString()
                };

                const updatedTasks = [newTask, ...get().tasks];
                set({ tasks: updatedTasks });

                await saveToCloud('katana_tasks', updatedTasks);
                return newTask.id;
            },

            updateTask: async (id: string, updates: Partial<KatanaTask>) => {
                const updatedTasks = get().tasks.map(t => t.id === id ? { ...t, ...updates } : t);
                set({ tasks: updatedTasks });
                await saveToCloud('katana_tasks', updatedTasks);
            },

            deleteTask: async (id: string) => {
                const updatedTasks = get().tasks.filter(t => t.id !== id);
                set({ tasks: updatedTasks });
                await saveToCloud('katana_tasks', updatedTasks);
            },

            toggleTask: async (id: string) => {
                const updatedTasks = get().tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
                set({ tasks: updatedTasks });
                await saveToCloud('katana_tasks', updatedTasks);
            }
        }),
        {
            name: 'olympic-katana-storage',
        }
    )
);
