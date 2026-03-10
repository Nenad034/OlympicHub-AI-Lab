import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PinnedNote {
    id: string;
    x: number;
    y: number;
}

interface NotesState {
    pinnedNoteIds: PinnedNote[];
    pinNote: (id: string, x?: number, y?: number) => void;
    unpinNote: (id: string) => void;
    updatePosition: (id: string, x: number, y: number) => void;
}

export const useNotesStore = create<NotesState>()(
    persist(
        (set) => ({
            pinnedNoteIds: [],
            pinNote: (id, x, y) => set((state) => {
                if (state.pinnedNoteIds.some(n => n.id === id)) return state;
                // Default position: top-right corner, offset by existing pinned notes count
                const offset = state.pinnedNoteIds.length * 20;
                const defaultX = x ?? Math.max(0, (typeof window !== 'undefined' ? window.innerWidth : 1400) - 320 - offset);
                const defaultY = y ?? (60 + offset);
                return { pinnedNoteIds: [...state.pinnedNoteIds, { id, x: defaultX, y: defaultY }] };
            }),
            unpinNote: (id) => set((state) => ({
                pinnedNoteIds: state.pinnedNoteIds.filter(n => n.id !== id)
            })),
            updatePosition: (id, x, y) => set((state) => ({
                pinnedNoteIds: state.pinnedNoteIds.map(n => n.id === id ? { ...n, x, y } : n)
            })),
        }),
        {
            name: 'prime-pinned-notes',
        }
    )
);
