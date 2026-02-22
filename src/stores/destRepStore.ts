import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveToCloud, loadFromCloud } from '../utils/storageUtils';

export interface Message {
    id: string;
    dossierId?: string; // If undefined, it's a general chat
    sender: string;
    senderEmail: string;
    text: string;
    timestamp: string;
    role: 'agent' | 'rep';
}

export interface RepAssignment {
    email: string;
    destinations: string[];
    hotels: string[];
}

interface DestRepState {
    assignments: RepAssignment[];
    messages: Message[];
    isLoading: boolean;

    // Actions
    loadData: () => Promise<void>;
    addAssignment: (assignment: RepAssignment) => Promise<void>;
    removeAssignment: (email: string) => Promise<void>;
    addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
    getDossierMessages: (dossierId: string) => Message[];
    getGeneralMessages: () => Message[];
}

export const useDestRepStore = create<DestRepState>()(
    persist(
        (set, get) => ({
            assignments: [
                {
                    email: 'milos.rep@olympic.rs',
                    destinations: ['Hurgada', 'Budva', 'Zlatibor'],
                    hotels: ['Jaz Aquamarine Resort', 'Hotel Splendid Conference & Spa', 'Test Hotel With Warnings']
                }
            ],
            messages: [],
            isLoading: false,

            loadData: async () => {
                set({ isLoading: true });
                const [msgData, assignData] = await Promise.all([
                    loadFromCloud('dossier_messages'),
                    loadFromCloud('rep_assignments')
                ]);

                if (msgData.success && msgData.data) {
                    set({ messages: msgData.data as Message[] });
                }
                if (assignData.success && assignData.data) {
                    set({ assignments: assignData.data as RepAssignment[] });
                }
                set({ isLoading: false });
            },

            addAssignment: async (assignment) => {
                const updated = [...get().assignments.filter(a => a.email !== assignment.email), assignment];
                set({ assignments: updated });
                await saveToCloud('rep_assignments', updated);
            },
            removeAssignment: async (email) => {
                const updated = get().assignments.filter(a => a.email !== email);
                set({ assignments: updated });
                await saveToCloud('rep_assignments', updated);
            },

            addMessage: async (msg) => {
                const newMessage: Message = {
                    ...msg,
                    id: `msg_${Date.now()}`,
                    timestamp: new Date().toISOString()
                };

                const updated = [...get().messages, newMessage];
                set({ messages: updated });
                await saveToCloud('dossier_messages', [newMessage]); // Using upsert/insert
            },

            getDossierMessages: (dossierId) => {
                return get().messages.filter(m => m.dossierId === dossierId);
            },

            getGeneralMessages: () => {
                return get().messages.filter(m => !m.dossierId);
            }
        }),
        {
            name: 'olympic-dest-rep-storage',
        }
    )
);
